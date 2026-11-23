import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  accent?: 'emerald' | 'amber' | 'sky';
  items?: string[];
  emptyText?: string;
  children?: ReactNode;
}

const accentStyles = {
  emerald: {
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    bullet: 'bg-emerald-400',
  },
  amber: {
    border: 'border-amber-500/20 hover:border-amber-500/40',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bullet: 'bg-amber-400',
  },
  sky: {
    border: 'border-sky-500/20 hover:border-sky-500/40',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    bullet: 'bg-sky-400',
  },
};

const Card = ({
  title,
  subtitle,
  icon,
  accent = 'emerald',
  items,
  emptyText = 'Waiting for LLM analysis from EC2...',
  children,
}: CardProps) => {
  const theme = accentStyles[accent];

  return (
    <div
      className={`w-full rounded-2xl bg-slate-900/80 border ${theme.border} p-6 shadow-xl transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {icon && (
            <span className={`px-2.5 py-1.5 rounded-xl border text-lg ${theme.badge}`}>
              {icon}
            </span>
          )}
        </div>

        {items ? (
          items.length > 0 ? (
            <ul className="space-y-2.5 mt-3">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-200"
                >
                  <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${theme.bullet}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-slate-950/50 border border-dashed border-slate-800 p-4 text-sm text-slate-500 text-center">
              {emptyText}
            </div>
          )
        ) : (
          <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
        )}
      </div>
    </div>
  );
};

export default Card;