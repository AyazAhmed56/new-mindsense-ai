import { Brain, Target, Coffee } from "lucide-react";
import type { CognitiveState } from "../types";

interface CognitiveStateIndicatorProps {
  state: CognitiveState;
  confidence?: number;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@500;700;900&family=Instrument+Sans:wght@400;500;600&display=swap');

.csi {
  --g5:  #16a34a; --g6: #22c55e; --g7: #4ade80; --g9: #bbf7d0; --g10: #dcfce7; --g11: #f0fdf4;
  --y2:  #d97706; --y3: #fde68a; --y4: #fffbeb;
  --r2:  #dc2626; --r3: #fca5a5; --r4: #fef2f2;
  font-family: 'Instrument Sans', sans-serif;
  display: inline-block;
}

.csi-card {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; align-items: center;
  gap: .5rem; padding: 1.25rem 1.15rem 1.05rem;
  border-radius: 22px; min-width: 100px;
  border: 1.5px solid transparent;
  transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s;
  animation: csiFadeUp .45s cubic-bezier(.22,1,.36,1) both;
  cursor: default;
}
.csi-card:hover { transform: translateY(-5px) scale(1.04); }

/* State skins */
.csi-card.focus   { background: linear-gradient(150deg,#fff 0%,var(--g11) 100%); border-color:var(--g9); box-shadow:0 4px 20px rgba(22,163,74,.14); }
.csi-card.confused{ background: linear-gradient(150deg,#fff 0%,var(--y4)  100%); border-color:var(--y3); box-shadow:0 4px 20px rgba(217,119,6,.12); }
.csi-card.fatigue { background: linear-gradient(150deg,#fff 0%,var(--r4)  100%); border-color:var(--r3); box-shadow:0 4px 20px rgba(220,38,38,.12); }
.csi-card.focus:hover   { box-shadow:0 14px 40px rgba(22,163,74,.24); }
.csi-card.confused:hover{ box-shadow:0 14px 40px rgba(217,119,6,.2); }
.csi-card.fatigue:hover { box-shadow:0 14px 40px rgba(220,38,38,.2); }

/* Top accent */
.csi-card::before {
  content:''; position:absolute; top:0; left:15%; right:15%; height:3px; border-radius:0 0 6px 6px;
}
.csi-card.focus::before   { background: linear-gradient(90deg,var(--g5),var(--g7)); }
.csi-card.confused::before{ background: linear-gradient(90deg,var(--y2),#fbbf24); }
.csi-card.fatigue::before { background: linear-gradient(90deg,var(--r2),#f87171); }

/* Glow blob */
.csi-blob {
  position:absolute; bottom:-24px; right:-24px; width:80px; height:80px;
  border-radius:50%; opacity:.18; filter:blur(22px); pointer-events:none;
}
.focus   .csi-blob { background:var(--g5); }
.confused .csi-blob{ background:var(--y2); }
.fatigue .csi-blob { background:var(--r2); }

/* Dot */
.csi-dot-wrap { position:relative; width:14px; height:14px; display:flex; align-items:center; justify-content:center; }
.csi-dot { width:8px; height:8px; border-radius:50%; position:relative; z-index:1; flex-shrink:0; }
.csi-ring { position:absolute; inset:-3px; border-radius:50%; animation:csiring 2s ease-in-out infinite; opacity:0; }
.focus   .csi-dot{ background:var(--g5); }  .focus   .csi-ring{ border:1.5px solid var(--g5); }
.confused .csi-dot{ background:var(--y2); } .confused .csi-ring{ border:1.5px solid var(--y2); }
.fatigue .csi-dot{ background:var(--r2); }  .fatigue .csi-ring{ border:1.5px solid var(--r2); }

/* Icon tile */
.csi-icon {
  width:48px; height:48px; border-radius:16px;
  display:flex; align-items:center; justify-content:center;
  transition: transform .25s cubic-bezier(.22,1,.36,1);
}
.csi-card:hover .csi-icon { transform:scale(1.1) rotate(-5deg); }
.focus    .csi-icon { background:var(--g10); border:1px solid var(--g9); }
.confused .csi-icon { background:var(--y4);  border:1px solid var(--y3); }
.fatigue  .csi-icon { background:var(--r4);  border:1px solid var(--r3); }
.csi-icon svg { width:21px; height:21px; }
.focus    .csi-icon svg { color:#15803d; }
.confused .csi-icon svg { color:#92400e; }
.fatigue  .csi-icon svg { color:#7f1d1d; }

/* Label */
.csi-label {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:.68rem; font-weight:700; letter-spacing:.13em; text-transform:uppercase;
}
.focus    .csi-label { color:#166534; }
.confused .csi-label { color:#92400e; }
.fatigue  .csi-label { color:#7f1d1d; }

/* Confidence */
.csi-conf {
  display:inline-flex; align-items:center; gap:3px;
  padding:2px 9px; border-radius:99px;
  font-size:.6rem; font-weight:600; letter-spacing:.03em; margin-top:1px;
}
.focus    .csi-conf { background:var(--g10); color:#15803d; border:1px solid var(--g9); }
.confused .csi-conf { background:var(--y4);  color:#d97706; border:1px solid var(--y3); }
.fatigue  .csi-conf { background:var(--r4);  color:#dc2626; border:1px solid var(--r3); }

@keyframes csiFadeUp { from{opacity:0;transform:scale(.87) translateY(10px)} to{opacity:1;transform:none} }
@keyframes csiring   { from{opacity:.7;transform:scale(1)} to{opacity:0;transform:scale(2.5)} }
`;

const stateConfig = {
  focus: { icon: Target, label: "Focused" },
  confused: { icon: Brain, label: "Confused" },
  fatigue: { icon: Coffee, label: "Fatigued" },
};

export function CognitiveStateIndicator({
  state,
  confidence,
}: CognitiveStateIndicatorProps) {
  const { icon: Icon, label } = stateConfig[state];
  return (
    <>
      <style>{CSS}</style>
      <div className="csi">
        <div className={`csi-card ${state}`}>
          <div className="csi-blob" />
          <div className="csi-dot-wrap">
            <div className="csi-ring" />
            <div className="csi-dot" />
          </div>
          <div className="csi-icon">
            <Icon />
          </div>
          <span className="csi-label">{label}</span>
          {confidence !== undefined && (
            <span className="csi-conf">
              {Math.round(confidence * 100)}% conf
            </span>
          )}
        </div>
      </div>
    </>
  );
}
