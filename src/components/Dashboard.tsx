import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Clock,
  Target,
  Brain,
  Coffee,
  TrendingUp,
  Award,
  Zap,
  Activity,
  Sparkles,
} from "lucide-react";
import type { SessionData, CognitiveState } from "../types";

interface DashboardProps {
  behaviorTracker: {
    typingMetrics: { wpm: number; errorRate: number; pauseTime: number };
    sessionData: SessionData;
    getCognitiveState: () => CognitiveState;
  };
}

const STATE_COLORS = {
  focus: "#16a34a",
  confused: "#d97706",
  fatigue: "#dc2626",
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;600;700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap');

.dsh {
  --g1:#052e16; --g2:#14532d; --g3:#166534; --g4:#15803d; --g5:#16a34a;
  --g6:#22c55e; --g7:#4ade80; --g8:#86efac; --g9:#bbf7d0; --g10:#dcfce7;
  --g11:#f0fdf4; --g12:#f7fef9;
  --border:#d1fae5; --border2:#6ee7b7;
  --ink:#052e16; --ink2:#166534; --ink3:#4d8c6a;
  font-family:'Instrument Sans',sans-serif;
  background:var(--g12);
  min-height:100vh; color:var(--ink);
  padding:2.25rem 2.5rem 3rem;
  background-image:
    radial-gradient(ellipse 55% 40% at 92% 3%,  rgba(74,222,128,.18) 0%, transparent 65%),
    radial-gradient(ellipse 38% 32% at 3% 95%,   rgba(22,163,74,.12)  0%, transparent 60%),
    radial-gradient(ellipse 28% 22% at 50% 55%,  rgba(187,247,208,.2) 0%, transparent 55%);
}
@media(max-width:640px){ .dsh{padding:1.25rem 1rem;} }

.dsh *{box-sizing:border-box;}
.dsh::-webkit-scrollbar{width:5px;}
.dsh::-webkit-scrollbar-track{background:var(--g10);}
.dsh::-webkit-scrollbar-thumb{background:var(--g5);border-radius:3px;}

/* ── Header ── */
.dsh-header {
  display:flex; align-items:flex-end; justify-content:space-between;
  margin-bottom:2.75rem;
  animation:dshUp .55s cubic-bezier(.22,1,.36,1) both;
  flex-wrap:wrap; gap:1rem;
}
.dsh-header-l { display:flex; align-items:flex-end; gap:1rem; }
.dsh-stripe {
  width:6px; height:56px; border-radius:3px;
  background:linear-gradient(180deg,var(--g6),var(--g2)); flex-shrink:0;
}
.dsh-title {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:clamp(1.85rem,3.5vw,2.6rem); font-weight:900; letter-spacing:-.04em; line-height:1;
  background:linear-gradient(135deg,var(--g1) 20%,var(--g5) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.dsh-sub {
  font-size:.62rem; letter-spacing:.2em; text-transform:uppercase;
  color:var(--ink3); margin-top:6px; font-weight:600;
}
.dsh-live {
  display:flex; align-items:center; gap:7px;
  background:#fff; border:1.5px solid var(--border2);
  border-radius:99px; padding:6px 16px 6px 10px;
  font-size:.68rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  color:var(--g3); box-shadow:0 3px 14px rgba(22,163,74,.15);
}
.dsh-live-dot {
  width:7px; height:7px; border-radius:50%; background:var(--g5);
  animation:dshPulse 1.6s ease-in-out infinite;
}

/* Section label */
.dsh-section-label {
  font-size:.58rem; letter-spacing:.22em; text-transform:uppercase;
  color:var(--ink3); font-weight:700; margin-bottom:.9rem; padding-left:.15rem;
}

/* ── Stat cards ── */
.dsh-stats {
  display:grid; grid-template-columns:repeat(auto-fit,minmax(192px,1fr));
  gap:1.1rem; margin-bottom:1.75rem;
}
.dsh-stat {
  background:#fff; border:1.5px solid var(--border);
  border-radius:22px; padding:1.45rem 1.5rem;
  position:relative; overflow:hidden;
  transition:transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, border-color .25s;
  animation:dshUp .5s cubic-bezier(.22,1,.36,1) both;
  box-shadow:0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(21,128,61,.06);
  cursor:default;
}
.dsh-stat::before {
  content:''; position:absolute; top:0; left:12%; right:12%; height:3px;
  background:linear-gradient(90deg,var(--g4),var(--g7));
  border-radius:0 0 5px 5px; opacity:0; transition:opacity .25s;
}
.dsh-stat:hover { transform:translateY(-5px); border-color:var(--border2); box-shadow:0 12px 36px rgba(22,163,74,.18); }
.dsh-stat:hover::before { opacity:1; }

.dsh-stat.feat {
  background:linear-gradient(145deg,var(--g1) 0%,var(--g3) 50%,var(--g5) 100%);
  border-color:transparent; box-shadow:0 8px 34px rgba(22,163,74,.4);
}
.dsh-stat.feat::before{display:none;}
.dsh-stat.feat:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(22,163,74,.55);}

/* Stat icon */
.dsh-si {
  width:42px; height:42px; border-radius:13px;
  background:var(--g11); color:var(--g4);
  display:flex; align-items:center; justify-content:center;
  margin-bottom:1.1rem; border:1px solid var(--g9);
}
.dsh-si svg{width:18px;height:18px;}
.dsh-stat.feat .dsh-si{background:rgba(255,255,255,.18);color:#fff;border-color:rgba(255,255,255,.22);}

.dsh-sl {
  font-size:.6rem; letter-spacing:.17em; text-transform:uppercase;
  color:var(--ink3); margin-bottom:5px; font-weight:600;
}
.dsh-stat.feat .dsh-sl{color:rgba(255,255,255,.65);}

.dsh-sv {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:clamp(1.85rem,3.2vw,2.5rem); font-weight:900; letter-spacing:-.03em; line-height:1;
  color:var(--ink);
}
.dsh-stat.feat .dsh-sv{color:#fff;}

/* Stat glow blob */
.dsh-stat-blob {
  position:absolute; bottom:-20px; right:-20px;
  width:70px; height:70px; border-radius:50%;
  background:var(--g7); opacity:.12; filter:blur(20px); pointer-events:none;
}
.dsh-stat.feat .dsh-stat-blob{background:#fff;opacity:.08;}

/* ── Panels ── */
.dsh-grid {
  display:grid; grid-template-columns:repeat(auto-fit,minmax(340px,1fr));
  gap:1.25rem; margin-bottom:1.75rem;
}
.dsh-panel {
  background:#fff; border:1.5px solid var(--border);
  border-radius:22px; padding:1.65rem;
  animation:dshUp .55s cubic-bezier(.22,1,.36,1) both;
  box-shadow:0 1px 3px rgba(0,0,0,.04), 0 4px 16px rgba(21,128,61,.06);
}
.dsh-panel-title {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:.88rem; font-weight:800; letter-spacing:-.01em;
  color:var(--ink); display:flex; align-items:center; gap:8px;
  margin-bottom:1.25rem;
}
.dsh-panel-title svg{width:16px;height:16px;color:var(--g5);}
.dsh-chart-bg {
  background:var(--g11); border-radius:16px;
  padding:.8rem .5rem .6rem; border:1px solid var(--g10);
}

/* ── Status rows ── */
.dsh-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:.75rem 1rem; border-radius:13px;
  background:var(--g11); border:1.5px solid var(--border);
  margin-bottom:.55rem;
  transition:background .18s, border-color .18s, transform .18s;
}
.dsh-row:hover{background:var(--g10);border-color:var(--border2);transform:translateX(4px);}
.dsh-row-l{display:flex;align-items:center;gap:8px;color:var(--ink2);font-size:.8rem;font-weight:500;}
.dsh-row-l svg{width:14px;height:14px;}
.dsh-row-v{font-weight:700;font-size:.82rem;}

/* ── Suggestion chips ── */
.dsh-sug {
  display:flex; align-items:flex-start; gap:9px;
  padding:.75rem .95rem; border-radius:13px;
  font-size:.78rem; font-weight:500; margin-bottom:.48rem;
  border:1.5px solid transparent; animation:dshSlide .38s ease both;
}
.dsh-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:5px;}
.dsh-sug.urgent  {background:#fef2f2;border-color:#fecaca;color:#991b1b;}  .urgent  .dsh-dot{background:#ef4444;}
.dsh-sug.warning {background:#fffbeb;border-color:#fde68a;color:#92400e;}  .warning .dsh-dot{background:#f59e0b;}
.dsh-sug.info    {background:#eff6ff;border-color:#bfdbfe;color:#1e40af;}  .info    .dsh-dot{background:#3b82f6;}
.dsh-sug.success {background:var(--g11);border-color:var(--g9);color:var(--g2);} .success .dsh-dot{background:var(--g5);}

/* Productivity ring */
.dsh-ring-wrap {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:.5rem 0 1rem;
}
.dsh-ring-svg { transform:rotate(-90deg); }
.dsh-ring-bg { fill:none; stroke:var(--g10); stroke-width:12; }
.dsh-ring-fg { fill:none; stroke-width:12; stroke-linecap:round; transition:stroke-dashoffset .8s cubic-bezier(.22,1,.36,1); }
.dsh-ring-label {
  font-family:'Cabinet Grotesk',sans-serif;
  font-size:2rem; font-weight:900; fill:var(--ink); dominant-baseline:middle; text-anchor:middle;
}
.dsh-ring-sublabel { font-size:.6rem; fill:var(--ink3); dominant-baseline:middle; text-anchor:middle; }

@keyframes dshUp    { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
@keyframes dshSlide { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:none} }
@keyframes dshPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.7)} }

.dsh-stats .dsh-stat:nth-child(1){animation-delay:.05s}
.dsh-stats .dsh-stat:nth-child(2){animation-delay:.11s}
.dsh-stats .dsh-stat:nth-child(3){animation-delay:.17s}
.dsh-stats .dsh-stat:nth-child(4){animation-delay:.23s}
.dsh-grid .dsh-panel:nth-child(1){animation-delay:.29s}
.dsh-grid .dsh-panel:nth-child(2){animation-delay:.35s}
.dsh-grid-b .dsh-panel:nth-child(1){animation-delay:.41s}
.dsh-grid-b .dsh-panel:nth-child(2){animation-delay:.47s}

@media(max-width:640px){.dsh-grid,.dsh-grid-b{grid-template-columns:1fr}}
`;

const ttStyle = {
  background: "#ffffff",
  border: "1.5px solid #bbf7d0",
  borderRadius: "12px",
  fontFamily: "Instrument Sans,sans-serif",
  fontSize: ".73rem",
  color: "#052e16",
  boxShadow: "0 4px 16px rgba(21,128,61,.12)",
};

// Sub-components
function StatCard({
  icon,
  label,
  value,
  feat = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  feat?: boolean;
}) {
  return (
    <div className={`dsh-stat${feat ? " feat" : ""}`}>
      <div className="dsh-stat-blob" />
      <div className="dsh-si">{icon}</div>
      <div className="dsh-sl">{label}</div>
      <div className="dsh-sv">{value}</div>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="dsh-row">
      <div className="dsh-row-l">
        {icon}
        <span>{label}</span>
      </div>
      <span className="dsh-row-v" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function Suggestion({
  text,
  type,
}: {
  text: string;
  type: "urgent" | "warning" | "info" | "success";
}) {
  return (
    <div className={`dsh-sug ${type}`}>
      <span className="dsh-dot" />
      {text}
    </div>
  );
}

function ProductivityRing({ score }: { score: number }) {
  const r = 52,
    circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score > 70 ? "#16a34a" : score > 40 ? "#d97706" : "#dc2626";
  return (
    <div className="dsh-ring-wrap">
      <svg width="130" height="130" className="dsh-ring-svg">
        <circle cx="65" cy="65" r={r} className="dsh-ring-bg" />
        <circle
          cx="65"
          cy="65"
          r={r}
          className="dsh-ring-fg"
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
        <text
          x="65"
          y="62"
          className="dsh-ring-label"
          style={{ transform: "rotate(90deg)", transformOrigin: "65px 65px" }}
        >
          {score}
        </text>
        <text
          x="65"
          y="76"
          className="dsh-ring-sublabel"
          style={{ transform: "rotate(90deg)", transformOrigin: "65px 65px" }}
        >
          SCORE
        </text>
      </svg>
    </div>
  );
}

export function Dashboard({ behaviorTracker }: DashboardProps) {
  const { typingMetrics, sessionData, getCognitiveState } = behaviorTracker;
  const currentState = getCognitiveState();
  const [_, setStateHistory] = useState<
    { time: string; state: CognitiveState }[]
  >([]);
  const [wpmHistory, setWpmHistory] = useState<{ time: string; wpm: number }[]>(
    [],
  );

  useEffect(() => {
    const iv = setInterval(() => {
      const t = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      setStateHistory((p) =>
        [...p, { time: t, state: currentState }].slice(-20),
      );
      setWpmHistory((p) =>
        [...p, { time: t, wpm: typingMetrics.wpm }].slice(-20),
      );
    }, 5000);
    return () => clearInterval(iv);
  }, [currentState, typingMetrics.wpm]);

  const sessionDuration = Math.floor(
    (Date.now() - sessionData.startTime) / 60000,
  );
  const focusPct =
    sessionData.focusTime > 0
      ? Math.round(
          (sessionData.focusTime /
            (sessionData.focusTime +
              sessionData.fatigueCount +
              sessionData.confusionCount)) *
            100,
        )
      : 0;
  const prodScore = Math.round(
    focusPct * 0.7 + Math.min(typingMetrics.wpm / 40, 1) * 30,
  );

  const dist = [
    {
      name: "Focused",
      value: sessionData.focusTime,
      color: STATE_COLORS.focus,
    },
    {
      name: "Confused",
      value: sessionData.confusionCount,
      color: STATE_COLORS.confused,
    },
    {
      name: "Fatigued",
      value: sessionData.fatigueCount,
      color: STATE_COLORS.fatigue,
    },
  ].filter((i) => i.value > 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="dsh">
        {/* Header */}
        <div className="dsh-header">
          <div className="dsh-header-l">
            <div className="dsh-stripe" />
            <div>
              <div className="dsh-title">Productivity Dashboard</div>
              <div className="dsh-sub">Real-time cognitive analytics</div>
            </div>
          </div>
          <div className="dsh-live">
            <span className="dsh-live-dot" /> Live
          </div>
        </div>

        {/* Stat cards */}
        <div className="dsh-section-label">Overview</div>
        <div className="dsh-stats">
          <StatCard
            icon={<Clock />}
            label="Session Time"
            value={`${sessionDuration}m`}
          />
          <StatCard
            icon={<Target />}
            label="Focus Time"
            value={`${focusPct}%`}
          />
          <StatCard
            icon={<TrendingUp />}
            label="Current WPM"
            value={Math.round(typingMetrics.wpm).toString()}
          />
          <StatCard
            icon={<Award />}
            label="Productivity Score"
            value={prodScore.toString()}
            feat
          />
        </div>

        {/* Analytics */}
        <div className="dsh-section-label">Analytics</div>
        <div className="dsh-grid">
          {/* WPM trend */}
          <div className="dsh-panel">
            <div className="dsh-panel-title">
              <Activity />
              Typing Speed Trend
            </div>
            <div className="dsh-chart-bg" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wpmHistory}>
                  <defs>
                    <linearGradient id="wpmGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#15803d" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(21,128,61,.1)"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#4d8c6a"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#4d8c6a"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={ttStyle} />
                  <Line
                    type="monotone"
                    dataKey="wpm"
                    stroke="url(#wpmGrad)"
                    strokeWidth={2.5}
                    dot={{ fill: "#16a34a", strokeWidth: 0, r: 3 }}
                    activeDot={{
                      r: 6,
                      fill: "#16a34a",
                      stroke: "#bbf7d0",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cognitive distribution */}
          <div className="dsh-panel">
            <div className="dsh-panel-title">
              <Brain />
              Cognitive State Distribution
            </div>
            <div className="dsh-chart-bg" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dist}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dist.map((e, i) => (
                      <Cell
                        key={i}
                        fill={e.color}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: "11px",
                      fontFamily: "Instrument Sans,sans-serif",
                      color: "#166534",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status & Suggestions */}
        <div className="dsh-section-label">Status & Insights</div>
        <div className="dsh-grid dsh-grid-b">
          {/* Status */}
          <div className="dsh-panel">
            <div className="dsh-panel-title">
              <Zap />
              Current Status
            </div>
            <StatusRow
              icon={<Target />}
              label="Cognitive State"
              value={
                currentState.charAt(0).toUpperCase() + currentState.slice(1)
              }
              color={STATE_COLORS[currentState]}
            />
            <StatusRow
              icon={<Coffee />}
              label="Avg Pause Time"
              value={`${(typingMetrics.pauseTime / 1000).toFixed(1)}s`}
              color="#6b7280"
            />
            <StatusRow
              icon={<Brain />}
              label="Error Rate"
              value={`${(typingMetrics.errorRate * 100).toFixed(1)}%`}
              color={typingMetrics.errorRate > 0.1 ? "#dc2626" : "#16a34a"}
            />
            <div style={{ marginTop: "1.25rem" }}>
              <ProductivityRing score={prodScore} />
            </div>
          </div>

          {/* Suggestions */}
          <div className="dsh-panel">
            <div className="dsh-panel-title">
              <Sparkles />
              Smart Suggestions
            </div>
            {currentState === "fatigue" && (
              <>
                <Suggestion
                  text="Take a 5-minute break to recharge"
                  type="urgent"
                />
                <Suggestion
                  text="Switch to a lighter, simpler task"
                  type="warning"
                />
                <Suggestion
                  text="Stay hydrated — grab some water"
                  type="info"
                />
              </>
            )}
            {currentState === "confused" && (
              <>
                <Suggestion
                  text="Review documentation or examples"
                  type="info"
                />
                <Suggestion
                  text="Break the problem into smaller parts"
                  type="info"
                />
                <Suggestion
                  text="Consider asking a colleague for help"
                  type="warning"
                />
              </>
            )}
            {currentState === "focus" && (
              <>
                <Suggestion
                  text="Great focus! Keep up the momentum"
                  type="success"
                />
                <Suggestion
                  text="You're in the zone — perfect for complex tasks"
                  type="info"
                />
                <Suggestion
                  text="Remember to take breaks every 90 minutes"
                  type="success"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
