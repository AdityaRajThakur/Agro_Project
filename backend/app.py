from flask import Flask, request, jsonify
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import threading
import time
from flask_cors import CORS

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

class CropFertilizerRow(BaseModel):
    crop: str = Field(description="Recommended Rabi crop name (e.g., Wheat, Chickpea, Mustard)")
    suitability: str = Field(description="Exactly one of: High, Moderate, or Conditional")
    fertilizer_plan: str = Field(description="Specific fertilizers (e.g., Urea + SSP + MOP + Zinc)")
    dosage_kg_ha: str = Field(description="Exact dosage per hectare (e.g., Urea 110, SSP 250, MOP 40 kg/ha)")
    application_stage: str = Field(description="Timing split (e.g., Basal at sowing + 1st irrigation top-dress)")
    notes: str = Field(description="Short 1-sentence justification tied to the measured soil/climate data")

class AgroRecommendationReport(BaseModel):
    soil_status: str = Field(
        description="Brief fertility summary classifying N, P, K, and pH (e.g., Low N, Medium P, Low K, Neutral pH)"
    )
    recommendations: list[CropFertilizerRow] = Field(
        description="Table of 4 to 5 best-suited crops and fertilizer schedules ranked by suitability"
    )
    llm_advice: str = Field(
        description="Concise 2-3 sentence field advisory covering irrigation needs, excess moisture/heat stress, and soil prep"
    )

AGRO_PROMPT = """You are a senior precision-agriculture agronomist with 15+ years of experience advising farmers on black cotton soil (Vertisols) in India.

Analyze the live field sensor readings and laboratory soil parameters below:
- Soil Type: Black Soil (Vertisol)
- Current Season: Rabi
- Ambient Temperature: {temp} °C
- Air Humidity: {humidity} %
- Soil Moisture: {moisture} %
- Soil pH: {ph}
- Available Nitrogen (N): {N} kg/ha
- Available Phosphorus (P): {P} kg/ha
- Available Potassium (K): {K} kg/ha

Instructions:
1. Classify the soil nutrient status (Low / Medium / High) for N, P, K, and pH.
2. Recommend 4 to 5 practical Rabi crops ranked from highest to lowest suitability given the current temperature, humidity, and soil moisture.
3. For each crop, calculate a realistic fertilizer combination (using practical field fertilizers such as Urea, DAP, SSP, MOP, and micronutrients like Zinc/Boron if warranted) with exact dosages in kg/ha adjusted for the measured N, P, K levels—do not give generic textbook doses without adjusting for existing soil nutrients.
4. Specify clear basal vs. top-dressing application stages.
5. In the field advisory, flag any immediate risks (such as high soil moisture delaying sowing, fungal risk from high humidity, or heat stress) and give actionable next steps.
"""

latest_data = {
    "last_updated": None,
    "Soil_Moisture": 88,
    "Humidity": 81,
    "Temperature": 25,
    "N": 190.74,
    "P": 18.00,
    "K": 120.36,
    "Ph": 7.11,
    "soil_status": "Awaiting initial soil evaluation...",
    "recommendations": [],
    "llm": "Waiting for first sensor reading..."
}

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2).with_structured_output(AgroRecommendationReport)

llm_cool_down_seconds = 30
last_llm_call_time = 0
lock = threading.Lock()

@app.route('/')
def sensor_project():
    return "Agro-Bot API is running"

def llm_analysis(moisture, humidity, temp, n, p, k, ph):
    global latest_data
    try:
        report = llm.invoke(
            AGRO_PROMPT.format(
                moisture=moisture,
                humidity=humidity,
                temp=temp,
                ph=ph,
                N=n,
                P=p,
                K=k
            )
        )
        latest_data["soil_status"] = report.soil_status
        latest_data["recommendations"] = [row.model_dump() for row in report.recommendations]
        latest_data["llm"] = report.llm_advice
        print("Updated structured LLM report:", latest_data["soil_status"])
    except Exception as e:
        print("LLM Error:", e)
        latest_data["llm"] = f"LLM analysis failed: {e}"

@app.route('/insights', methods=["GET"])
def get_insights():
    return jsonify({
        "temp": latest_data["Temperature"],
        "hum": latest_data["Humidity"],
        "soil": latest_data["Soil_Moisture"],
        "N": latest_data["N"],
        "P": latest_data["P"],
        "K": latest_data["K"],
        "Ph": latest_data["Ph"],
        "soil_status": latest_data["soil_status"],
        "recommendations": latest_data["recommendations"],
        "llm_advice": latest_data["llm"],
        "last_updated": latest_data["last_updated"]
    })

@app.route('/data', methods=["POST"])
def sensor_data():
    global last_llm_call_time
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": 400, "data": "no parameter received"}), 400
    
    latest_data["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
    latest_data["Soil_Moisture"] = data.get("moisture", data.get("soil", latest_data["Soil_Moisture"]))
    latest_data["Humidity"] = data.get("humidity", data.get("hum", latest_data["Humidity"]))
    latest_data["Temperature"] = data.get("temp", latest_data["Temperature"])
    latest_data["N"] = data.get("N", latest_data["N"])
    latest_data["P"] = data.get("P", latest_data["P"])
    latest_data["K"] = data.get("K", latest_data["K"])
    latest_data["Ph"] = data.get("Ph", latest_data["Ph"])

    curr_time = time.time()
    with lock:
        if curr_time - last_llm_call_time >= llm_cool_down_seconds:
            last_llm_call_time = curr_time
            threading.Thread(
                target=llm_analysis,
                args=(
                    latest_data["Soil_Moisture"],
                    latest_data["Humidity"],
                    latest_data["Temperature"],
                    latest_data["N"],
                    latest_data["P"],
                    latest_data["K"],
                    latest_data["Ph"]
                ),
                daemon=True
            ).start()

    return jsonify({"status": 200, "data": "Data received successfully"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)