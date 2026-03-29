import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Clock, Target, Brain, Coffee, TrendingUp, Award, Zap, Activity } from 'lucide-react';
import type { SessionData, CognitiveState } from '../types';

interface DashboardProps {
  behaviorTracker: {
    typingMetrics: { wpm: number; errorRate: number; pauseTime: number };
    sessionData: SessionData;
    getCognitiveState: () => CognitiveState;
  };
}

const STATE_COLORS = { focus: '#16a34a', confused: '#d97706', fatigue: '#dc2626' };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Familjen+Grotesk:wght@500;600;700&display=swap');

.d-root {
  --cg1: #14532d;
  --cg2: #166534;
  --cg3: #15803d;
  --cg4: #16a34a;
  --cg5: #22c55e;
  --cg6: #4ade80;
  --cg7: #bbf7d0;
  --cg8: #dcfce7;
  --cg9: #f0fdf4;
  --cga: #f7fef9;
  --ct:  #052e16;
  --ctm: #166534;
  --cts: #4d8c6a;
  --cb:  #ffffff;
  --cbr: #d1fae5;
  --cbr2:#6ee7b7;
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: var(--cga);
  min-height: 100vh;
  padding: 2.25rem 2.5rem 3rem;
  color: var(--ct);
  background-image:
    radial-gradient(ellipse 55% 40% at 90% 2%,  rgba(74,222,128,.15) 0%, transparent 65%),
    radial-gradient(ellipse 38% 32% at 2%  95%,  rgba(22,163,74,.10) 0%, transparent 60%);
}
.d-root * { box-sizing: border-box; }
.d-root::-webkit-scrollbar { width: 5px; }
.d-root::-webkit-scrollbar-track { background: var(--cg8); }
.d-root::-webkit-scrollbar-thumb { background: var(--cg4); border-radius: 3px; }

/* ── Header ── */
.d-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 2.75rem;
  animation: dUp .55s cubic-bezier(.22,1,.36,1) both;
}
.d-hl { display: flex; align-items: flex-end; gap: .9rem; }
.d-bar {
  width: 5px; height: 52px;
  background: linear-gradient(180deg, var(--cg5), var(--cg2));
  border-radius: 3px; flex-shrink: 0;
}
.d-title {
  font-family: 'Familjen Grotesk', sans-serif;
  font-size: clamp(1.9rem, 3.8vw, 2.7rem);
  font-weight: 700; letter-spacing: -.03em; line-height: 1.05;
  background: linear-gradient(135deg, var(--cg1) 20%, var(--cg4) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.d-sub {
  font-size: .62rem; letter-spacing: .2em; text-transform: uppercase;
  color: var(--cts); margin-top: 5px; font-weight: 600;
}
.d-live {
  display: flex; align-items: center; gap: 7px;
  background: var(--cg9); border: 1.5px solid var(--cbr2);
  border-radius: 99px; padding: 5px 14px 5px 10px;
  font-size: .68rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  color: var(--cg3); box-shadow: 0 2px 10px rgba(22,163,74,.14);
}
.d-live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: var(--cg4);
  animation: dPulse 1.6s ease-in-out infinite;
}

/* ── Section labels ── */
.d-slabel {
  font-size: .6rem; letter-spacing: .2em; text-transform: uppercase;
  color: var(--cts); font-weight: 700; margin-bottom: .8rem; padding-left: .1rem;
}

/* ── Stat cards ── */
.d-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(192px, 1fr));
  gap: 1.1rem; margin-bottom: 1.75rem;
}
.d-stat {
  background: var(--cb); border: 1.5px solid var(--cbr);
  border-radius: 20px; padding: 1.4rem 1.5rem;
  position: relative; overflow: hidden;
  transition: transform .22s, box-shadow .22s, border-color .22s;
  animation: dUp .5s cubic-bezier(.22,1,.36,1) both;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 14px rgba(21,128,61,.05);
}
.d-stat::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, var(--cg4), var(--cg6));
  border-radius: 20px 20px 0 0; opacity: 0; transition: opacity .22s;
}
.d-stat:hover { transform: translateY(-4px); border-color: var(--cbr2); box-shadow: 0 10px 32px rgba(22,163,74,.16); }
.d-stat:hover::before { opacity: 1; }

.d-stat.feat {
  background: linear-gradient(140deg, var(--cg1) 0%, var(--cg3) 55%, var(--cg5) 100%);
  border-color: transparent;
  box-shadow: 0 6px 32px rgba(22,163,74,.38);
}
.d-stat.feat::before { display: none; }
.d-stat.feat:hover { transform: translateY(-5px); box-shadow: 0 14px 44px rgba(22,163,74,.5); }

.d-si {
  width: 40px; height: 40px; border-radius: 11px;
  background: var(--cg9); color: var(--cg4);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 1.1rem; border: 1px solid var(--cg7);
}
.d-si svg { width: 18px; height: 18px; }
.d-stat.feat .d-si { background: rgba(255,255,255,.18); color: #fff; border-color: rgba(255,255,255,.22); }

.d-sl { font-size: .62rem; letter-spacing: .16em; text-transform: uppercase; color: var(--cts); margin-bottom: 4px; font-weight: 600; }
.d-stat.feat .d-sl { color: rgba(255,255,255,.65); }

.d-sv {
  font-family: 'Familjen Grotesk', sans-serif;
  font-size: clamp(1.85rem, 3.5vw, 2.55rem);
  font-weight: 700; letter-spacing: -.02em; line-height: 1; color: var(--ct);
}
.d-stat.feat .d-sv { color: #fff; }

/* ── Panels ── */
.d-g2 {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.25rem; margin-bottom: 1.75rem;
}
.d-panel {
  background: var(--cb); border: 1.5px solid var(--cbr);
  border-radius: 20px; padding: 1.6rem;
  animation: dUp .55s cubic-bezier(.22,1,.36,1) both;
  box-shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 14px rgba(21,128,61,.04);
}
.d-pt {
  font-family: 'Familjen Grotesk', sans-serif;
  font-size: .9rem; font-weight: 700; letter-spacing: -.01em;
  color: var(--ct); display: flex; align-items: center; gap: 8px;
  margin-bottom: 1.2rem;
}
.d-pt svg { width: 16px; height: 16px; color: var(--cg4); }
.d-chart-bg {
  background: var(--cg9); border-radius: 14px;
  padding: .75rem .4rem .5rem; border: 1px solid var(--cg8);
}

/* ── Status rows ── */
.d-sr {
  display: flex; align-items: center; justify-content: space-between;
  padding: .72rem .95rem; border-radius: 12px;
  background: var(--cg9); border: 1.5px solid var(--cg8);
  margin-bottom: .5rem;
  transition: background .18s, border-color .18s, transform .18s;
}
.d-sr:hover { background: var(--cg8); border-color: var(--cbr2); transform: translateX(3px); }
.d-srl { display: flex; align-items: center; gap: 8px; color: var(--ctm); font-size: .8rem; font-weight: 500; }
.d-srl svg { width: 14px; height: 14px; }
.d-srv { font-weight: 700; font-size: .82rem; }

/* ── Suggestions ── */
.d-sug {
  display: flex; align-items: flex-start; gap: 9px;
  padding: .72rem .9rem; border-radius: 12px;
  font-size: .78rem; font-weight: 500; margin-bottom: .45rem;
  border: 1.5px solid transparent; animation: dSlide .35s ease both;
}
.d-sdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.d-sug.urgent  { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.d-sug.urgent  .d-sdot { background: #ef4444; }
.d-sug.warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.d-sug.warning .d-sdot { background: #f59e0b; }
.d-sug.info    { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
.d-sug.info    .d-sdot { background: #3b82f6; }
.d-sug.success { background: var(--cg9); border-color: var(--cg7); color: var(--cg2); }
.d-sug.success .d-sdot { background: var(--cg4); }

@keyframes dUp    { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
@keyframes dSlide { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
@keyframes dPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.7)} }

.d-stats .d-stat:nth-child(1){animation-delay:.05s}
.d-stats .d-stat:nth-child(2){animation-delay:.11s}
.d-stats .d-stat:nth-child(3){animation-delay:.17s}
.d-stats .d-stat:nth-child(4){animation-delay:.23s}
.d-g2 .d-panel:nth-child(1){animation-delay:.29s}
.d-g2 .d-panel:nth-child(2){animation-delay:.35s}
.d-bot .d-panel:nth-child(1){animation-delay:.41s}
.d-bot .d-panel:nth-child(2){animation-delay:.47s}

@media(max-width:640px){
  .d-root{padding:1.25rem 1rem}
  .d-g2,.d-bot{grid-template-columns:1fr}
  .d-header{flex-wrap:wrap;gap:.75rem}
}
`;

const ttStyle = {
  background: '#ffffff', border: '1.5px solid #bbf7d0', borderRadius: '10px',
  fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '.73rem', color: '#052e16',
  boxShadow: '0 4px 14px rgba(21,128,61,.1)',
};

export function Dashboard({ behaviorTracker }: DashboardProps) {
  const { typingMetrics, sessionData, getCognitiveState } = behaviorTracker;
  const currentState = getCognitiveState();
  const [_, setStateHistory] = useState<{ time: string; state: CognitiveState }[]>([]);
  const [wpmHistory, setWpmHistory] = useState<{ time: string; wpm: number }[]>([]);

  useEffect(() => {
    const iv = setInterval(() => {
      const t = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      setStateHistory(p => [...p, { time: t, state: currentState }].slice(-20));
      setWpmHistory(p => [...p, { time: t, wpm: typingMetrics.wpm }].slice(-20));
    }, 5000);
    return () => clearInterval(iv);
  }, [currentState, typingMetrics.wpm]);

  const sessionDuration = Math.floor((Date.now() - sessionData.startTime) / 60000);
  const focusPct = sessionData.focusTime > 0
    ? Math.round((sessionData.focusTime / (sessionData.focusTime + sessionData.fatigueCount + sessionData.confusionCount)) * 100) : 0;
  const prodScore = Math.round((focusPct * 0.7) + (Math.min(typingMetrics.wpm / 40, 1) * 30));

  const dist = [
    { name: 'Focused',  value: sessionData.focusTime,      color: STATE_COLORS.focus },
    { name: 'Confused', value: sessionData.confusionCount, color: STATE_COLORS.confused },
    { name: 'Fatigued', value: sessionData.fatigueCount,   color: STATE_COLORS.fatigue },
  ].filter(i => i.value > 0);

  return (
    <>
      <style>{CSS}</style>
      <div className="d-root">

        <div className="d-header">
          <div className="d-hl">
            <div className="d-bar" />
            <div>
              <div className="d-title">Productivity Dashboard</div>
              <div className="d-sub">Real-time cognitive analytics</div>
            </div>
          </div>
          <div className="d-live"><span className="d-live-dot" />Live</div>
        </div>

        <div className="d-slabel">Overview</div>
        <div className="d-stats">
          <SC icon={<Clock />}      label="Session Time"       value={`${sessionDuration} min`} />
          <SC icon={<Target />}     label="Focus Time"         value={`${focusPct}%`} />
          <SC icon={<TrendingUp />} label="Current WPM"        value={Math.round(typingMetrics.wpm).toString()} />
          <SC icon={<Award />}      label="Productivity Score" value={prodScore.toString()} feat />
        </div>

        <div className="d-slabel">Analytics</div>
        <div className="d-g2">
          <div className="d-panel">
            <div className="d-pt"><Activity />Typing Speed Trend</div>
            <div className="d-chart-bg" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={wpmHistory}>
                  <defs>
                    <linearGradient id="wg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#15803d" />
                      <stop offset="100%" stopColor="#4ade80" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,128,61,.12)" />
                  <XAxis dataKey="time" stroke="#4d8c6a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4d8c6a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={ttStyle} />
                  <Line type="monotone" dataKey="wpm" stroke="url(#wg)" strokeWidth={2.5}
                    dot={{ fill: '#16a34a', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#16a34a', stroke: '#bbf7d0', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="d-panel">
            <div className="d-pt"><Brain />Cognitive State Distribution</div>
            <div className="d-chart-bg" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dist} cx="50%" cy="50%"
                    innerRadius={52} outerRadius={76} paddingAngle={4} dataKey="value">
                    {dist.map((e, i) => <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'Plus Jakarta Sans,sans-serif', color: '#166534' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="d-slabel">Status & Insights</div>
        <div className="d-g2 d-bot">
          <div className="d-panel">
            <div className="d-pt"><Zap />Current Status</div>
            <SR icon={<Target />} label="Cognitive State"
              value={currentState.charAt(0).toUpperCase() + currentState.slice(1)}
              color={STATE_COLORS[currentState]} />
            <SR icon={<Coffee />} label="Avg Pause Time"
              value={`${(typingMetrics.pauseTime / 1000).toFixed(1)}s`} color="#6b7280" />
            <SR icon={<Brain />} label="Error Rate"
              value={`${(typingMetrics.errorRate * 100).toFixed(1)}%`}
              color={typingMetrics.errorRate > 0.1 ? '#dc2626' : '#16a34a'} />
          </div>

          <div className="d-panel">
            <div className="d-pt"><Award />Smart Suggestions</div>
            {currentState === 'fatigue' && (<>
              <Sg text="Take a 5-minute break to recharge" type="urgent" />
              <Sg text="Switch to a lighter, simpler task" type="warning" />
              <Sg text="Stay hydrated — grab some water" type="info" />
            </>)}
            {currentState === 'confused' && (<>
              <Sg text="Review documentation or examples" type="info" />
              <Sg text="Break the problem into smaller parts" type="info" />
              <Sg text="Consider asking a colleague for help" type="warning" />
            </>)}
            {currentState === 'focus' && (<>
              <Sg text="Great focus! Keep up the momentum" type="success" />
              <Sg text="You're in the zone — perfect for complex tasks" type="info" />
              <Sg text="Remember to take breaks every 90 minutes" type="success" />
            </>)}
          </div>
        </div>

      </div>
    </>
  );
}

function SC({ icon, label, value, feat = false }: { icon: React.ReactNode; label: string; value: string; feat?: boolean }) {
  return (
    <div className={`d-stat${feat ? ' feat' : ''}`}>
      <div className="d-si">{icon}</div>
      <div className="d-sl">{label}</div>
      <div className="d-sv">{value}</div>
    </div>
  );
}

function SR({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="d-sr">
      <div className="d-srl">{icon}<span>{label}</span></div>
      <span className="d-srv" style={{ color }}>{value}</span>
    </div>
  );
}

function Sg({ text, type }: { text: string; type: 'urgent' | 'warning' | 'info' | 'success' }) {
  return (
    <div className={`d-sug ${type}`}>
      <span className="d-sdot" />{text}
    </div>
  );
}