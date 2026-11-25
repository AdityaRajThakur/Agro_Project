from flask import Flask  , request, jsonify
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import threading
import os , time 
from flask_cors import CORS

load_dotenv() 
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

latest_data ={
    "last_updated" : None, 
    "Soil_Moisture" : 88  , 
    "Humidity" :81 , 
    "Temperature" : 25 , 
    "N" : 190.74 , 
    "P" : 18.00 , 
    "K" : 120.36 , 
    "Ph" : 7.11 , 
    "llm" : "" 
} 
prompt = """you have 10+ of experience in  agricultural, fertilizers and crops recommandations.
I have measured my agricultural land parameters such as soil moisture, npk , ph, humidity and temperature. My soil type is black and current season is rabi.
Based on the below data which crop and fertilizers should be recommended. Output in table format crop , fertilizer(kg/hec).
Soil moisture : {moisture} %.
Humidity: {humidity} % 
Temperature: {temp} C
Ph: {ph}
N: {N}kg/hec.
P:{P}kg/hec.
K:{K}kg/hec."""

llm  = ChatOpenAI(model ="gpt-4o-mini") ;

llm_cool_down_seconds = 30 
last_llm_call_time = 0 
lock = threading.Lock() ; 

@app.route('/') 
def Sensor_project():
    return "invalid url" ; 



def llm_analysis(moisture , humidity , temp , n , p , k , ph):
    global latest_data
    try:
        ans = llm.invoke(prompt.format(moisture = moisture , humidity = humidity , temp = temp , ph = ph , N = n , P = p , K = k ))
        print(ans.content) ; 
        latest_data['llm'] = ans.content
    except Exception as e : 
        print(e) 
"""sumary_line
interface InsightsResponse {
  temp: number;
  hum: number;
  soil: number;
  crops?: string[];
  fertilizers?: string[];
  llm_advice: string;
  last_updated: string | null;
}
"""
@app.route('/insights' , methods=["GET"])
def get_insights():

    print(latest_data)
    latest_data1={} 
    latest_data1['temp'] = latest_data['Temperature'] 
    latest_data1['hum'] = latest_data['Humidity']
    latest_data1['soil'] = latest_data['Soil_Moisture']
    latest_data1['crops'] = []
    latest_data1['fertilizers'] = []
    latest_data1['N'] = latest_data['N']
    latest_data1['P'] = latest_data['P']
    latest_data1['K'] = latest_data['K']
    latest_data1['Ph'] = latest_data['Ph']
    latest_data1['llm_advice'] = latest_data['llm']
    latest_data1['last_updated'] = latest_data['last_updated']
    return jsonify(latest_data1) 
@app.route('/data' , methods=["POST"])
def sensort_data():
    global last_llm_call_time
    data = request.get_json(silent=True) ; 
    #print(data) 
    if not data:
        res = {
            "status":200,
            "data":"no parameter received"
        }
        return jsonify(res) 
   # print(data) 

    latest_data["last_updated"] = time.strftime("%Y-%m-%d %H:%M:%S")
    latest_data['Soil_Moisture'] = data.get("moisture") 
    latest_data['Humidity'] = data.get("humidity") 
    latest_data['Temperature'] = data.get("temp") ; 
    latest_data['N'] = data.get("N" , 190.74) ; 
    latest_data['P'] = data.get("P",18.00) ; 
    latest_data['K'] = data.get("K",120.36) ; 
    latest_data['Ph'] =data.get("Ph",7.11) ; 
    print(latest_data)
    curr_time = time.time() 
    with lock:
        if curr_time - last_llm_call_time>= llm_cool_down_seconds:
            last_llm_call_time = curr_time 
            #print(data) 
            threading.Thread(
                target= llm_analysis, 
                args =(latest_data['Soil_Moisture'] , latest_data['Humidity'] , latest_data['Temperature'] , latest_data['N'] , latest_data['P'] ,latest_data['K'] ,latest_data['Ph']),
                daemon=True 
            ).start() 
    res ={
        "status":200,
        "data" :"Data received successfully"
    }
    return jsonify(res) 



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)




#command 
# to run flask app 
# flask --app app run 
# sudo ../env/bin/flask --app app run --host=0.0.0.0 --port=80
# chmod +777 key && ssh -i <key.pem> ubuntu@<publicip>
