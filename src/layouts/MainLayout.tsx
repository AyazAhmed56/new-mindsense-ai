import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Brain,
  Zap,
  BarChart3,
  Settings,
  LogOut,
  User,
  Bell,
  Mic,
  MicOff,
  Coffee,
  Target,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Activity,
  Sun,
  Eye,
  Volume2,
} from "lucide-react";
import ChatAssistant from "../components/ChatAssistant";
import { Dashboard } from "../components/Dashboard";
import { CognitiveStateIndicator } from "../components/CognitiveStateIndicator";
import { WebcamDetector } from "../components/WebcamDetector";
import { VoiceFeedback } from "../components/VoiceFeedback";
import { NotificationSystem } from "../components/NotificationSystem";
import { FocusModeBlocker } from "../components/FocusModeBlocker";
import { BehaviorTracker } from "../hooks/useBehaviorTracker";
import type { CognitiveState, BaselineMetrics } from "../types";

/* ── Context ── */
type AppContextType = {
  cognitiveState: CognitiveState;
  baseline: BaselineMetrics | null;
  setBaseline: (b: BaselineMetrics) => void;
  isCalibrated: boolean;
  setIsCalibrated: (v: boolean) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
  eyeDetection: boolean;
  setEyeDetection: (v: boolean) => void;
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (v: boolean) => void;
  stateConfidence: number;
  recentStates: CognitiveState[];
};
const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be within AppProvider");
  return ctx;
};

const useStateHistory = (current: CognitiveState) => {
  const [history, setHistory] = useState<CognitiveState[]>([]);
  useEffect(() => {
    const iv = setInterval(
      () => setHistory((p) => [...p, current].slice(-10)),
      5000,
    );
    return () => clearInterval(iv);
  }, [current]);
  return history;
};
const calculateConfidence = (h: CognitiveState[]) => {
  if (h.length < 3) return 0.5;
  const counts = h.reduce(
    (a, s) => ({ ...a, [s]: (a[s] || 0) + 1 }),
    {} as Record<CognitiveState, number>,
  );
  return Math.max(...Object.values(counts)) / h.length;
};

/* ── Design tokens + full CSS ── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; overflow: hidden; }

:root {
  /* Greens */
  --g1:#052e16; --g2:#14532d; --g3:#166534; --g4:#15803d; --g5:#16a34a;
  --g6:#22c55e; --g7:#4ade80; --g8:#86efac; --g9:#bbf7d0; --g10:#dcfce7;
  --g11:#f0fdf4; --g12:#f7fef9;
  /* Semantic */
  --focus-bg:#f0fdf4;    --focus-border:#86efac;    --focus-text:#15803d;
  --tired-bg:#fff5f5;    --tired-border:#fca5a5;    --tired-text:#b91c1c;
  --confused-bg:#fffbeb; --confused-border:#fcd34d;  --confused-text:#b45309;
  /* Layout */
  --sidebar:72px;
  /* Fonts */
  --display:'Syne',sans-serif;
  --body:'DM Sans',sans-serif;
  /* Shadows */
  --sh-sm:0 1px 3px rgba(0,0,0,.04),0 2px 8px rgba(21,128,61,.06);
  --sh-md:0 4px 20px rgba(22,163,74,.12),0 1px 4px rgba(0,0,0,.05);
  --sh-lg:0 12px 40px rgba(22,163,74,.18),0 2px 8px rgba(0,0,0,.06);
}

/* ════════════════════ SHELL ════════════════════ */
.ml {
  font-family: var(--body);
  display: flex; height: 100vh; width: 100vw; overflow: hidden;
  background: var(--g12);
  position: relative;
}

/* Ambient background */
.ml::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 65% 50% at 100% 0%, rgba(74,222,128,.13) 0%, transparent 60%),
    radial-gradient(ellipse 45% 40% at 0%  100%, rgba(22,163,74,.08) 0%, transparent 55%),
    radial-gradient(ellipse 30% 30% at 60%  50%, rgba(187,247,208,.12) 0%, transparent 55%);
}

/* ════════════════════ SIDEBAR ════════════════════ */
.ml-sb {
  position: relative; z-index: 100;
  width: var(--sidebar); flex-shrink: 0;
  height: 100vh;
  background: #fff;
  border-right: 1.5px solid var(--g9);
  display: flex; flex-direction: column; align-items: center;
  padding: 18px 0 20px;
  box-shadow: 4px 0 32px rgba(22,163,74,.07);
}

/* Logo mark */
.ml-logo {
  width: 44px; height: 44px;
  background: linear-gradient(145deg, var(--g5), var(--g2));
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none; flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(22,163,74,.38), 0 0 0 3px rgba(34,197,94,.15);
  transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
  margin-bottom: 28px; position: relative;
}
.ml-logo::after {
  content: ''; position: absolute; inset: 0; border-radius: 16px;
  background: linear-gradient(145deg, rgba(255,255,255,.25) 0%, transparent 60%);
}
.ml-logo:hover {
  transform: scale(1.1) rotate(-6deg);
  box-shadow: 0 10px 28px rgba(22,163,74,.5), 0 0 0 4px rgba(34,197,94,.22);
}
.ml-logo svg { color: #fff; width: 20px; height: 20px; }

/* ── Nav items ── */
.ml-nav {
  display: flex; flex-direction: column;
  align-items: center; gap: 4px;
  width: 100%; padding: 0 12px;
}

.ml-nb {
  position: relative;
  width: 48px; height: 48px;
  border-radius: 15px; border: none; cursor: pointer;
  background: transparent; color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  transition: all .22s cubic-bezier(.22,1,.36,1);
  flex-shrink: 0;
}
.ml-nb svg { width: 19px; height: 19px; transition: transform .22s; }
.ml-nb:hover {
  background: var(--g11); color: var(--g5);
}
.ml-nb:hover svg { transform: scale(1.12); }
.ml-nb.active {
  background: linear-gradient(145deg, var(--g10), var(--g11));
  color: var(--g4);
  box-shadow: var(--sh-sm), inset 0 1px 0 rgba(255,255,255,.8);
}
/* Active left accent */
.ml-nb.active::before {
  content: '';
  position: absolute; left: -12px; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 24px;
  background: linear-gradient(180deg, var(--g6), var(--g4));
  border-radius: 0 3px 3px 0;
}
/* Active shimmer dot */
.ml-nb.active::after {
  content: '';
  position: absolute; top: 9px; right: 9px;
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--g5);
  box-shadow: 0 0 0 2px rgba(22,163,74,.25);
}

/* Tooltip */
.ml-tt {
  position: absolute; left: calc(100% + 12px); top: 50%;
  transform: translateY(-50%) translateX(-6px);
  background: #0f1f15; color: #e2f5e8;
  font-family: var(--body); font-size: .68rem; font-weight: 600;
  letter-spacing: .03em; padding: 5px 10px; border-radius: 8px;
  white-space: nowrap; pointer-events: none; z-index: 300;
  opacity: 0; transition: opacity .15s, transform .15s;
  box-shadow: 0 4px 14px rgba(0,0,0,.2);
}
.ml-tt::before {
  content: ''; position: absolute; right: 100%; top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent; border-right-color: #0f1f15;
}
.ml-nb:hover .ml-tt { opacity: 1; transform: translateY(-50%) translateX(0); }

/* Divider */
.ml-divider {
  width: 28px; height: 1.5px; margin: 8px 0; flex-shrink: 0;
  background: linear-gradient(90deg, transparent, var(--g9), transparent);
}

/* ── Sidebar footer ── */
.ml-foot {
  margin-top: auto;
  display: flex; flex-direction: column;
  align-items: center; gap: 5px;
  width: 100%; padding: 0 12px;
}

/* Cognitive state chip in sidebar */
.ml-state-chip {
  width: 48px; padding: 8px 0;
  border-radius: 14px; border: 1.5px solid transparent;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  transition: all .3s cubic-bezier(.22,1,.36,1);
  cursor: default; margin-bottom: 2px;
}
.ml-state-chip.focus    { background: var(--focus-bg);    border-color: var(--focus-border); }
.ml-state-chip.confused { background: var(--confused-bg); border-color: var(--confused-border); }
.ml-state-chip.fatigue  { background: var(--tired-bg);    border-color: var(--tired-border); }
.ml-state-emoji { font-size: 18px; line-height: 1; }
.ml-state-blink {
  width: 6px; height: 6px; border-radius: 50%;
  animation: mlBlink 2s ease-in-out infinite;
}
.focus    .ml-state-blink { background: var(--g5); }
.confused .ml-state-blink { background: #f59e0b; }
.fatigue  .ml-state-blink { background: #ef4444; }

/* Footer action buttons */
.ml-fab {
  width: 40px; height: 40px;
  border-radius: 12px; border: none; cursor: pointer;
  background: transparent; color: #9ca3af;
  display: flex; align-items: center; justify-content: center;
  transition: all .18s; text-decoration: none; flex-shrink: 0;
}
.ml-fab svg { width: 15px; height: 15px; }
.ml-fab:hover { background: var(--g11); color: var(--g5); transform: scale(1.08); }
.ml-fab.active { background: var(--g10); color: var(--g4); box-shadow: 0 0 0 1.5px var(--g8); }
.ml-fab.danger:hover { background: #fff1f2; color: #e11d48; }

/* ════════════════════ MAIN AREA ════════════════════ */
.ml-main {
  position: relative; z-index: 1;
  flex: 1; height: 100vh;
  overflow: hidden; display: flex; flex-direction: column;
}

/* ── Topbar ── */
.ml-topbar {
  flex-shrink: 0; height: 58px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1.5px solid var(--g9);
  display: flex; align-items: center;
  padding: 0 22px; gap: 12px;
  box-shadow: 0 2px 16px rgba(22,163,74,.06);
}

.ml-topbar-brand {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.ml-brand-icon {
  width: 28px; height: 28px; border-radius: 9px;
  background: linear-gradient(135deg, var(--g4), var(--g6));
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(22,163,74,.3);
}
.ml-brand-icon svg { width: 13px; height: 13px; color: #fff; }
.ml-brand-name {
  font-family: var(--display);
  font-size: 1rem; font-weight: 800; letter-spacing: -.03em;
  color: var(--g1); line-height: 1;
}
.ml-brand-sep {
  width: 1px; height: 16px; background: var(--g9); flex-shrink: 0;
}
.ml-page-label {
  font-size: .72rem; font-weight: 600; color: #9ca3af; letter-spacing: .02em;
}

/* Topbar right */
.ml-topbar-right {
  margin-left: auto; display: flex; align-items: center; gap: 10px;
}

/* Confidence bar */
.ml-conf {
  display: flex; align-items: center; gap: 7px;
  background: var(--g11); border: 1px solid var(--g9);
  border-radius: 99px; padding: 5px 12px;
}
.ml-conf-label {
  font-size: .6rem; font-weight: 700; color: var(--g4);
  letter-spacing: .12em; text-transform: uppercase;
}
.ml-conf-track {
  width: 56px; height: 4px; background: var(--g9);
  border-radius: 99px; overflow: hidden;
}
.ml-conf-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--g6), var(--g4));
  transition: width .6s cubic-bezier(.22,1,.36,1);
  box-shadow: 0 0 6px rgba(22,163,74,.5);
}

/* State pill */
.ml-state-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px 6px 10px; border-radius: 99px;
  font-family: var(--display); font-size: .72rem; font-weight: 700;
  letter-spacing: .01em; border: 1.5px solid transparent;
  transition: all .35s cubic-bezier(.22,1,.36,1);
}
.ml-state-pill.focus    { background: var(--focus-bg);    border-color: var(--focus-border);    color: var(--focus-text); }
.ml-state-pill.confused { background: var(--confused-bg); border-color: var(--confused-border); color: var(--confused-text); }
.ml-state-pill.fatigue  { background: var(--tired-bg);    border-color: var(--tired-border);    color: var(--tired-text); }
.ml-pill-dot {
  width: 7px; height: 7px; border-radius: 50%;
  animation: mlBlink 2s ease-in-out infinite;
}
.focus    .ml-pill-dot { background: var(--g5); }
.confused .ml-pill-dot { background: #f59e0b; }
.fatigue  .ml-pill-dot { background: #ef4444; }

/* ── Content ── */
.ml-content {
  flex: 1; overflow: hidden; position: relative;
}

/* ════════════════════ STATE BANNER ════════════════════ */
.ml-banner {
  position: absolute; top: 16px; left: 50%;
  transform: translateX(-50%); z-index: 60;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; border-radius: 99px;
  font-family: var(--body); font-size: .8rem; font-weight: 600;
  letter-spacing: -.01em; white-space: nowrap;
  animation: mlBannerIn .5s cubic-bezier(.34,1.56,.64,1) both;
  box-shadow: 0 8px 32px rgba(0,0,0,.1), 0 2px 6px rgba(0,0,0,.05);
}
.ml-banner.focus    { background: linear-gradient(135deg,#f0fdf4,#dcfce7); border:1.5px solid var(--g8);    color: var(--g2); }
.ml-banner.confused { background: linear-gradient(135deg,#fffdf0,#fffbeb); border:1.5px solid #fcd34d; color: #78350f; }
.ml-banner.fatigue  { background: linear-gradient(135deg,#fff5f5,#fef2f2); border:1.5px solid #fca5a5; color: #7f1d1d; }
.ml-banner-icon { width:28px; height:28px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.focus    .ml-banner-icon { background: var(--g10); color: var(--g4); }
.confused .ml-banner-icon { background: #fef9c3; color: #b45309; }
.fatigue  .ml-banner-icon { background: #fee2e2; color: #b91c1c; }
.ml-banner-icon svg { width: 14px; height: 14px; }
.ml-banner-spin { animation: mlSpin 4s linear infinite; opacity: .5; }

/* ════════════════════ SETTINGS PAGE ════════════════════ */
.ml-settings {
  height: 100%; overflow-y: auto;
  padding: 28px 32px 40px;
  scrollbar-width: thin; scrollbar-color: var(--g9) transparent;
}
.ml-settings::-webkit-scrollbar { width: 4px; }
.ml-settings::-webkit-scrollbar-thumb { background: var(--g8); border-radius: 4px; }

.ml-s-header { margin-bottom: 28px; }
.ml-s-title {
  font-family: var(--display);
  font-size: 1.9rem; font-weight: 800; letter-spacing: -.04em;
  color: var(--g1); line-height: 1; margin-bottom: 5px;
  background: linear-gradient(135deg, var(--g1) 20%, var(--g5) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.ml-s-sub {
  font-size: .82rem; color: #6b7280; font-weight: 400; line-height: 1.4;
}

/* Setting cards */
.ml-s-card {
  background: #fff; border: 1.5px solid var(--g9);
  border-radius: 22px; margin-bottom: 14px; overflow: hidden;
  box-shadow: var(--sh-sm);
  transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s;
  animation: mlFadeUp .45s cubic-bezier(.22,1,.36,1) both;
}
.ml-s-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 36px rgba(22,163,74,.12), 0 2px 8px rgba(0,0,0,.04);
}
.ml-s-card:nth-child(1) { animation-delay:.05s }
.ml-s-card:nth-child(2) { animation-delay:.11s }
.ml-s-card:nth-child(3) { animation-delay:.17s }
.ml-s-card:nth-child(4) { animation-delay:.23s }

.ml-s-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--g12), var(--g11));
  border-bottom: 1px solid var(--g10);
  position: relative; overflow: hidden;
}
.ml-s-card-head::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--g5), var(--g7)); opacity: .6;
}
.ml-s-card-icon {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(145deg, var(--g9), var(--g10));
  border: 1px solid var(--g8);
  display: flex; align-items: center; justify-content: center;
}
.ml-s-card-icon svg { width: 15px; height: 15px; color: var(--g4); }
.ml-s-card-title {
  font-family: var(--display);
  font-size: .9rem; font-weight: 700; color: var(--g1); letter-spacing: -.02em;
}

/* Setting rows */
.ml-s-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--g11);
  transition: background .15s;
}
.ml-s-row:last-of-type { border-bottom: none; }
.ml-s-row:hover { background: var(--g12); }
.ml-s-row-text {}
.ml-s-row-name {
  font-size: .85rem; font-weight: 600; color: #111827; letter-spacing: -.01em;
}
.ml-s-row-desc {
  font-size: .72rem; color: #9ca3af; font-weight: 400; margin-top: 2px; line-height: 1.4;
}

/* Toggle */
.ml-toggle {
  position: relative; width: 44px; height: 26px;
  border-radius: 99px; border: none; cursor: pointer;
  flex-shrink: 0; transition: all .28s cubic-bezier(.22,1,.36,1);
}
.ml-toggle.on {
  background: linear-gradient(135deg, var(--g6), var(--g4));
  box-shadow: 0 3px 10px rgba(22,163,74,.35);
}
.ml-toggle.off { background: #e2e8f0; }
.ml-toggle-knob {
  position: absolute; top: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 5px rgba(0,0,0,.22);
  transition: transform .3s cubic-bezier(.34,1.56,.64,1);
}
.ml-toggle.on  .ml-toggle-knob { transform: translateX(20px); }
.ml-toggle.off .ml-toggle-knob { transform: translateX(3px); }

/* CTA row */
.ml-s-cta-wrap { padding: 0 20px 18px; }
.ml-s-note {
  font-size: .72rem; color: #9ca3af; line-height: 1.6;
  padding: 0 0 10px;
}
.ml-s-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 14px; border: none; cursor: pointer;
  background: linear-gradient(135deg, var(--g4), var(--g6));
  color: #fff; font-family: var(--display);
  font-size: .82rem; font-weight: 700; letter-spacing: .01em;
  text-decoration: none;
  box-shadow: 0 5px 18px rgba(22,163,74,.35);
  transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s;
  position: relative; overflow: hidden;
}
.ml-s-cta::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 55%);
}
.ml-s-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(22,163,74,.45);
}
.ml-s-cta svg { width: 14px; height: 14px; }

/* ════════════════════ KEYFRAMES ════════════════════ */
@keyframes mlBlink    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.75)} }
@keyframes mlSpin     { to{transform:rotate(360deg)} }
@keyframes mlFadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
@keyframes mlBannerIn { from{opacity:0;transform:translateX(-50%) translateY(-20px) scale(.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }

/* ════════════════════ RESPONSIVE ════════════════════ */
@media (max-width: 640px) {
  :root { --sidebar: 60px; }
  .ml-conf { display: none; }
  .ml-brand-sep { display: none; }
  .ml-page-label { display: none; }
}
`;

/* ── State meta ── */
const STATE_EMOJI = { focus: "⚡", fatigue: "😴", confused: "🤔" } as const;
const STATE_LABEL = {
  focus: "In the Zone",
  fatigue: "Fatigued",
  confused: "Confused",
} as const;

const TABS = [
  { id: "chat", icon: <Zap />, label: "Assistant" },
  { id: "dashboard", icon: <BarChart3 />, label: "Analytics" },
  { id: "settings", icon: <Settings />, label: "Settings" },
] as const;

/* ════════════════════ MAIN LAYOUT ════════════════════ */
export function MainLayout() {
  const navigate = useNavigate();
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>("focus");
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat" | "settings">(
    "chat",
  );
  const [focusMode, setFocusMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [eyeDetection, setEyeDetection] = useState(false);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(false);

  const behaviorTracker = BehaviorTracker(baseline);
  const stateHistory = useStateHistory(cognitiveState);
  const stateConfidence = calculateConfidence(stateHistory);

  useEffect(() => {
    const ext = localStorage.getItem("cogniflow_extended_baseline");
    const typ = localStorage.getItem("cogniflow_baseline");
    if (ext) {
      setBaseline(JSON.parse(ext).typing);
      setIsCalibrated(true);
    } else if (typ) {
      setBaseline(JSON.parse(typ));
      setIsCalibrated(true);
    }
  }, []);

  useEffect(() => {
    const analyze = () => {
      const m = behaviorTracker.typingMetrics;
      if (!baseline) {
        setCognitiveState("focus");
        return;
      }
      const wpmD = m.wpm / baseline.wpm;
      const errD = m.errorRate / (baseline.errorRate || 0.05);
      const pauseD = m.pauseTime / (baseline.avgPauseTime || 1000);
      let s: CognitiveState = "focus";
      if (wpmD < 0.7 && pauseD > 1.5) s = "fatigue";
      else if (errD > 2 || (wpmD > 1.3 && errD > 1.5)) s = "confused";
      else if (m.errorRate > 0.15) s = "confused";
      else if (m.wpm < baseline.wpm * 0.6) s = "fatigue";
      setCognitiveState(s);
    };
    const iv = setInterval(analyze, 3000);
    analyze();
    return () => clearInterval(iv);
  }, [behaviorTracker, baseline]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleSignOut = () => {
    ["cogniflow_auth", "cogniflow_user", "cogniflow_profile"].forEach((k) =>
      localStorage.removeItem(k),
    );
    navigate("/login");
  };

  const TAB_LABEL: Record<string, string> = {
    chat: "AI Assistant",
    dashboard: "Analytics",
    settings: "Settings",
  };

  return (
    <AppContext.Provider
      value={{
        cognitiveState,
        baseline,
        setBaseline,
        isCalibrated,
        setIsCalibrated,
        darkMode,
        setDarkMode,
        focusMode,
        setFocusMode,
        voiceEnabled,
        setVoiceEnabled,
        eyeDetection,
        setEyeDetection,
        voiceInputEnabled,
        setVoiceInputEnabled,
        stateConfidence,
        recentStates: stateHistory,
      }}
    >
      <style>{CSS}</style>

      <div className="ml">
        {/* ══════════ SIDEBAR ══════════ */}
        <aside className="ml-sb">
          {/* Logo */}
          <Link to="/app" className="ml-logo">
            <Brain />
          </Link>

          {/* Primary nav */}
          <nav className="ml-nav">
            {TABS.map(({ id, icon, label }) => (
              <button
                key={id}
                className={`ml-nb${activeTab === id ? " active" : ""}`}
                onClick={() => setActiveTab(id as any)}
              >
                {icon}
                <span className="ml-tt">{label}</span>
              </button>
            ))}
          </nav>

          <div className="ml-divider" />

          {/* Footer */}
          <div className="ml-foot">
            {/* State chip */}
            <div className={`ml-state-chip ${cognitiveState}`}>
              <span className="ml-state-emoji">
                {STATE_EMOJI[cognitiveState]}
              </span>
              <span className="ml-state-blink" />
            </div>

            {/* Voice toggle */}
            <button
              className={`ml-fab${voiceInputEnabled ? " active" : ""}`}
              onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
              title={voiceInputEnabled ? "Voice on" : "Voice off"}
            >
              {voiceInputEnabled ? <Mic /> : <MicOff />}
              <span className="ml-tt">
                {voiceInputEnabled ? "Voice On" : "Voice Off"}
              </span>
            </button>

            {/* Profile */}
            <Link to="/profile" className="ml-fab" title="Profile">
              <User />
              <span className="ml-tt">Profile</span>
            </Link>

            {/* Sign out */}
            <button
              className="ml-fab danger"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut />
              <span className="ml-tt">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <div className="ml-main">
          {/* Topbar */}
          <header className="ml-topbar">
            <div className="ml-topbar-brand">
              <div className="ml-brand-icon">
                <Brain />
              </div>
              <span className="ml-brand-name">CogniFlow</span>
            </div>
            <div className="ml-brand-sep" />
            <span className="ml-page-label">{TAB_LABEL[activeTab]}</span>

            <div className="ml-topbar-right">
              {/* Confidence */}
              <div className="ml-conf">
                <span className="ml-conf-label">Conf</span>
                <div className="ml-conf-track">
                  <div
                    className="ml-conf-fill"
                    style={{ width: `${stateConfidence * 100}%` }}
                  />
                </div>
              </div>

              {/* State pill */}
              <div className={`ml-state-pill ${cognitiveState}`}>
                <span className="ml-pill-dot" />
                {STATE_EMOJI[cognitiveState]}&nbsp;{STATE_LABEL[cognitiveState]}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="ml-content">
            <StateBanner
              state={cognitiveState}
              prev={stateHistory[stateHistory.length - 2] || "focus"}
            />

            {activeTab === "chat" && (
              <ChatAssistant
                cognitiveState={cognitiveState}
                confidence={stateConfidence}
              />
            )}
            {activeTab === "dashboard" && (
              <Dashboard behaviorTracker={behaviorTracker} />
            )}
            {activeTab === "settings" && <SettingsPage />}

            <WebcamDetector
              enabled={eyeDetection}
              onFatigueDetected={() => setCognitiveState("fatigue")}
            />
            <VoiceFeedback
              cognitiveState={cognitiveState}
              enabled={voiceEnabled}
            />
            <NotificationSystem
              cognitiveState={cognitiveState}
              focusMode={focusMode}
            />
            <FocusModeBlocker
              enabled={focusMode && cognitiveState === "focus"}
            />
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

/* ════════════════════ STATE BANNER ════════════════════ */
function StateBanner({
  state,
  prev,
}: {
  state: CognitiveState;
  prev: CognitiveState;
}) {
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState(state);

  useEffect(() => {
    if (state !== shown) {
      setShow(true);
      setShown(state);
      const t = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(t);
    }
  }, [state, shown]);

  if (!show || state === prev) return null;

  const cfg = {
    fatigue: {
      icon: <Coffee />,
      text: "You seem tired — a quick break will help.",
    },
    confused: {
      icon: <AlertCircle />,
      text: "Confusion detected — I'll keep things simple.",
    },
    focus: { icon: <Target />, text: "You're in the zone! Excellent focus." },
  };
  const { icon, text } = cfg[state];

  return (
    <div className={`ml-banner ${state}`}>
      <div className="ml-banner-icon">{icon}</div>
      <span>{text}</span>
      <Sparkles className="ml-banner-spin" size={13} />
    </div>
  );
}

/* ════════════════════ SETTINGS PAGE ════════════════════ */
function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`ml-toggle ${on ? "on" : "off"}`}
      onClick={() => onChange(!on)}
      type="button"
    >
      <div className="ml-toggle-knob" />
    </button>
  );
}

function SettingCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ml-s-card">
      <div className="ml-s-card-head">
        <div className="ml-s-card-icon">{icon}</div>
        <span className="ml-s-card-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

function SettingRow({
  name,
  desc,
  checked,
  onChange,
}: {
  name: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="ml-s-row">
      <div className="ml-s-row-text">
        <div className="ml-s-row-name">{name}</div>
        <div className="ml-s-row-desc">{desc}</div>
      </div>
      <Toggle on={checked} onChange={onChange} />
    </div>
  );
}

function SettingsPage() {
  const {
    darkMode,
    setDarkMode,
    focusMode,
    setFocusMode,
    voiceEnabled,
    setVoiceEnabled,
    eyeDetection,
    setEyeDetection,
    voiceInputEnabled,
    setVoiceInputEnabled,
  } = useAppContext();

  return (
    <div className="ml-settings">
      <div className="ml-s-header">
        <div className="ml-s-title">Settings</div>
        <div className="ml-s-sub">Personalise your CogniFlow experience</div>
      </div>

      <SettingCard title="Appearance" icon={<Sun />}>
        <SettingRow
          name="Dark Mode"
          desc="Switch to dark theme to reduce eye strain at night"
          checked={darkMode}
          onChange={setDarkMode}
        />
      </SettingCard>

      <SettingCard title="Focus & Detection" icon={<Eye />}>
        <SettingRow
          name="Focus Mode"
          desc="Pause non-critical notifications while you're focused"
          checked={focusMode}
          onChange={setFocusMode}
        />
        <SettingRow
          name="Eye Detection"
          desc="Webcam-based drowsiness and fatigue detection"
          checked={eyeDetection}
          onChange={setEyeDetection}
        />
        <SettingRow
          name="Voice Input"
          desc="Hands-free voice commands and dictation"
          checked={voiceInputEnabled}
          onChange={setVoiceInputEnabled}
        />
      </SettingCard>

      <SettingCard title="Notifications" icon={<Volume2 />}>
        <SettingRow
          name="Voice Feedback"
          desc="Spoken audio cues when your cognitive state changes"
          checked={voiceEnabled}
          onChange={setVoiceEnabled}
        />
      </SettingCard>

      <SettingCard title="Baseline Calibration" icon={<Activity />}>
        <div className="ml-s-cta-wrap">
          <p className="ml-s-note">
            Recalibrate CogniFlow to your typing rhythm and cognitive patterns
            for more accurate state detection.
          </p>
          <Link to="/baseline-collection" className="ml-s-cta">
            <Zap />
            Start Calibration
            <ChevronRight size={12} style={{ opacity: 0.6 }} />
          </Link>
        </div>
      </SettingCard>
    </div>
  );
}
