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

/* ─────────────────────────── Context ─────────────────────────── */
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

/* ─────────────────────────── CSS ─────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;overflow:hidden}

:root{
  --g50:#f0fdf4;--g100:#dcfce7;--g200:#bbf7d0;--g300:#86efac;
  --g400:#4ade80;--g500:#22c55e;--g600:#16a34a;--g700:#15803d;--g900:#14532d;
  --sb:68px;
  --body:'Plus Jakarta Sans',sans-serif;
  --head:'Bricolage Grotesque',sans-serif;
}

/* ── Shell ── */
.cf{font-family:var(--body);display:flex;height:100vh;width:100vw;overflow:hidden;background:#f4fdf6;position:relative}
.cf::before{content:'';position:fixed;inset:0;
  background:
    radial-gradient(ellipse 70% 55% at 95% 0%,rgba(74,222,128,.1) 0%,transparent 55%),
    radial-gradient(ellipse 50% 45% at 0% 100%,rgba(34,197,94,.07) 0%,transparent 55%);
  pointer-events:none;z-index:0}

/* ── Sidebar ── */
.cf-sb{
  position:relative;z-index:50;
  width:var(--sb);flex-shrink:0;height:100vh;
  background:#fff;
  border-right:1px solid #d1fae5;
  display:flex;flex-direction:column;align-items:center;
  padding:14px 0 18px;
  box-shadow:2px 0 24px rgba(22,163,74,.07);
  overflow:hidden;
}

/* Logo */
.cf-logo{
  width:40px;height:40px;flex-shrink:0;
  background:linear-gradient(145deg,#22c55e,#15803d);
  border-radius:13px;
  display:flex;align-items:center;justify-content:center;
  margin-bottom:20px;
  box-shadow:0 4px 14px rgba(22,163,74,.38),0 0 0 3px rgba(34,197,94,.13);
  text-decoration:none;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s;
}
.cf-logo:hover{transform:scale(1.1) rotate(-4deg);box-shadow:0 8px 22px rgba(22,163,74,.48),0 0 0 4px rgba(34,197,94,.2)}
.cf-logo svg{color:#fff;width:19px;height:19px}

/* Nav */
.cf-nav{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%;padding:0 10px}

.cf-nb{
  position:relative;width:48px;height:48px;flex-shrink:0;
  border-radius:13px;border:none;cursor:pointer;
  background:transparent;color:#94a3b8;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s cubic-bezier(.22,1,.36,1);
}
.cf-nb svg{width:18px;height:18px;transition:transform .2s}
.cf-nb:hover{background:var(--g50);color:var(--g700)}
.cf-nb:hover svg{transform:scale(1.12)}
.cf-nb.on{background:linear-gradient(145deg,var(--g50),var(--g100));color:var(--g700);box-shadow:0 2px 10px rgba(22,163,74,.12),inset 0 1px 0 rgba(255,255,255,.8)}
.cf-nb.on::after{content:'';position:absolute;left:-10px;top:50%;transform:translateY(-50%);width:3px;height:22px;background:linear-gradient(180deg,var(--g400),var(--g600));border-radius:0 3px 3px 0}

/* Tooltip */
.cf-tip{
  position:absolute;left:calc(100% + 10px);top:50%;
  transform:translateY(-50%) translateX(-4px);
  background:#0e1c26;color:#f1f5f9;
  font-family:var(--body);font-size:.67rem;font-weight:600;letter-spacing:.02em;
  padding:5px 9px;border-radius:7px;white-space:nowrap;
  opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;z-index:300;
}
.cf-tip::before{content:'';position:absolute;right:100%;top:50%;transform:translateY(-50%);border:4px solid transparent;border-right-color:#0e1c26}
.cf-nb:hover .cf-tip{opacity:1;transform:translateY(-50%) translateX(0)}

/* Divider */
.cf-div{width:26px;height:1px;background:linear-gradient(90deg,transparent,var(--g200),transparent);margin:6px 0;flex-shrink:0}

/* Footer */
.cf-foot{margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:3px;width:100%;padding:0 10px}

/* State indicator — small, contained */
.cf-si{
  width:46px;flex-shrink:0;
  display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:7px 0;border-radius:12px;border:1.5px solid transparent;transition:all .3s;
}
.cf-si.fc {background:var(--g50);border-color:var(--g200)}
.cf-si.ff {background:#fff5f5;border-color:#fecaca}
.cf-si.fz {background:#fffbeb;border-color:#fde68a}
.cf-si-em{font-size:17px;line-height:1}
.cf-si-dot{width:6px;height:6px;border-radius:50%;animation:cfDot 2s ease-in-out infinite}
.fc .cf-si-dot{background:var(--g500)}
.ff .cf-si-dot{background:#ef4444}
.fz .cf-si-dot{background:#f59e0b}

/* Footer icon buttons */
.cf-fb{
  width:40px;height:40px;flex-shrink:0;
  border-radius:11px;border:none;cursor:pointer;
  background:transparent;color:#94a3b8;
  display:flex;align-items:center;justify-content:center;
  transition:all .18s;text-decoration:none;
}
.cf-fb svg{width:15px;height:15px}
.cf-fb:hover{background:var(--g50);color:var(--g700)}
.cf-fb.on{background:var(--g50);color:var(--g600);box-shadow:0 0 0 1.5px var(--g300)}
.cf-fb.red:hover{background:#fff1f2;color:#e11d48}

/* ── Main ── */
.cf-main{position:relative;z-index:1;flex:1;height:100vh;overflow:hidden;display:flex;flex-direction:column}

/* ── Topbar ── */
.cf-top{
  flex-shrink:0;height:54px;
  background:rgba(255,255,255,.9);backdrop-filter:blur(18px);
  border-bottom:1px solid #d1fae5;
  display:flex;align-items:center;padding:0 18px;gap:10px;
  box-shadow:0 1px 14px rgba(22,163,74,.05);
}
.cf-top-brand{font-family:var(--head);font-size:.98rem;font-weight:800;color:var(--g900);letter-spacing:-.035em;line-height:1}
.cf-top-slash{font-size:.72rem;font-weight:500;color:#cbd5e1;margin:0 2px}
.cf-top-page{font-size:.72rem;font-weight:600;color:#94a3b8}

/* Confidence */
.cf-conf{display:flex;align-items:center;gap:5px;margin-left:auto}
.cf-conf-lbl{font-size:.64rem;font-weight:600;color:#94a3b8;letter-spacing:.02em;text-transform:uppercase}
.cf-conf-track{width:52px;height:3px;background:#e2e8f0;border-radius:99px;overflow:hidden}
.cf-conf-fill{height:100%;background:linear-gradient(90deg,var(--g400),var(--g600));border-radius:99px;transition:width .5s}

/* State pill */
.cf-pill{
  display:flex;align-items:center;gap:6px;
  padding:5px 12px 5px 8px;border-radius:99px;
  font-size:.72rem;font-weight:700;letter-spacing:.01em;
  border:1.5px solid transparent;transition:all .3s;
}
.cf-pill.fc{background:var(--g50);border-color:var(--g200);color:var(--g700)}
.cf-pill.ff{background:#fff5f5;border-color:#fecaca;color:#991b1b}
.cf-pill.fz{background:#fffbeb;border-color:#fde68a;color:#78350f}
.cf-pill-dot{width:7px;height:7px;border-radius:50%;animation:cfDot 2s ease-in-out infinite}
.fc .cf-pill-dot{background:var(--g500)}
.ff .cf-pill-dot{background:#ef4444}
.fz .cf-pill-dot{background:#f59e0b}

/* ── Content ── */
.cf-cnt{flex:1;overflow:hidden;position:relative}

/* ── Banner ── */
.cf-bnr{
  position:absolute;top:14px;left:50%;
  transform:translateX(-50%);z-index:60;
  display:flex;align-items:center;gap:9px;
  padding:9px 18px;border-radius:99px;
  font-family:var(--body);font-size:.77rem;font-weight:700;letter-spacing:-.01em;
  white-space:nowrap;
  box-shadow:0 8px 28px rgba(0,0,0,.11),0 2px 6px rgba(0,0,0,.05);
  animation:cfBnr .5s cubic-bezier(.34,1.56,.64,1) both;
}
.cf-bnr.fc{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1.5px solid var(--g300);color:var(--g900)}
.cf-bnr.ff{background:linear-gradient(135deg,#fff5f5,#fef2f2);border:1.5px solid #fca5a5;color:#7f1d1d}
.cf-bnr.fz{background:linear-gradient(135deg,#fffdf0,#fffbeb);border:1.5px solid #fde68a;color:#78350f}
.cf-bnr svg{width:15px;height:15px;flex-shrink:0}
.cf-spin{animation:cfSpin 4s linear infinite;opacity:.5}

/* ── Settings ── */
.cf-spage{height:100%;overflow-y:auto;padding:26px 28px;scrollbar-width:thin;scrollbar-color:var(--g200) transparent}
.cf-shead{margin-bottom:24px}
.cf-stitle{font-family:var(--head);font-size:1.7rem;font-weight:800;color:var(--g900);letter-spacing:-.04em;line-height:1.1;margin-bottom:3px}
.cf-ssub{font-size:.78rem;font-weight:500;color:#94a3b8}

.cf-card{background:#fff;border:1px solid #d1fae5;border-radius:17px;margin-bottom:10px;box-shadow:0 2px 14px rgba(22,163,74,.06),0 1px 3px rgba(0,0,0,.03);overflow:hidden;transition:box-shadow .22s,transform .22s}
.cf-card:hover{box-shadow:0 8px 30px rgba(22,163,74,.1),0 2px 7px rgba(0,0,0,.04);transform:translateY(-1px)}
.cf-ch{display:flex;align-items:center;gap:9px;padding:14px 18px;border-bottom:1px solid #f0fdf4;background:linear-gradient(135deg,#fafffc,#f0fdf4)}
.cf-ci{width:30px;height:30px;border-radius:8px;background:linear-gradient(145deg,var(--g100),var(--g200));display:flex;align-items:center;justify-content:center;color:var(--g700)}
.cf-ci svg{width:14px;height:14px}
.cf-ct{font-family:var(--head);font-size:.88rem;font-weight:800;color:var(--g900);letter-spacing:-.025em}

.cf-row{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #f8fffe;transition:background .14s}
.cf-row:last-child{border-bottom:none}
.cf-row:hover{background:#fafffe}
.cf-rn{font-size:.83rem;font-weight:700;color:#1a2e22;letter-spacing:-.01em}
.cf-rd{font-size:.7rem;color:#94a3b8;font-weight:500;margin-top:2px}

/* Toggle */
.cf-tog{position:relative;width:42px;height:24px;border-radius:99px;border:none;cursor:pointer;flex-shrink:0;transition:background .26s cubic-bezier(.22,1,.36,1)}
.cf-tog.on{background:linear-gradient(135deg,var(--g400),var(--g600));box-shadow:0 2px 7px rgba(22,163,74,.33)}
.cf-tog.off{background:#dde3ea}
.cf-togdot{position:absolute;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:transform .28s cubic-bezier(.34,1.56,.64,1)}
.cf-tog.on  .cf-togdot{transform:translateX(20px)}
.cf-tog.off .cf-togdot{transform:translateX(2px)}

/* CTA */
.cf-cta{display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,var(--g500),var(--g700));color:#fff;font-family:var(--body);font-size:.79rem;font-weight:700;padding:9px 18px;border-radius:11px;text-decoration:none;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,.3);transition:all .2s;letter-spacing:-.01em;margin:0 18px 14px}
.cf-cta:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(22,163,74,.4)}
.cf-cta svg{width:13px;height:13px}
.cf-cnote{font-size:.71rem;color:#94a3b8;font-weight:500;padding:0 18px 14px;line-height:1.55}

/* ── Keyframes ── */
@keyframes cfDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}
@keyframes cfBnr{from{opacity:0;transform:translateX(-50%) translateY(-18px) scale(.92)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
@keyframes cfSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

const STATE_LABEL: Record<CognitiveState, string> = {
  focus: "In the Zone",
  fatigue: "Fatigued",
  confused: "Confused",
};
const STATE_EMOJI: Record<CognitiveState, string> = {
  focus: "⚡",
  fatigue: "😴",
  confused: "🤔",
};
const STATE_CLS: Record<CognitiveState, string> = {
  focus: "fc",
  fatigue: "ff",
  confused: "fz",
};

const TABS = [
  { id: "chat", icon: <Zap />, label: "Assistant" },
  { id: "dashboard", icon: <BarChart3 />, label: "Analytics" },
  { id: "settings", icon: <Settings />, label: "Settings" },
] as const;

/* ─────────────────────────── MainLayout ─────────────────────────── */
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

  const sc = STATE_CLS[cognitiveState];
  const tabLabel: Record<string, string> = {
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

      <div className="cf">
        {/* ══ SIDEBAR ══ */}
        <aside className="cf-sb">
          <Link to="/app" className="cf-logo">
            <Brain />
          </Link>

          <nav className="cf-nav">
            {TABS.map(({ id, icon, label }) => (
              <button
                key={id}
                className={`cf-nb ${activeTab === id ? "on" : ""}`}
                onClick={() => setActiveTab(id as any)}
              >
                {icon}
                <span className="cf-tip">{label}</span>
              </button>
            ))}
          </nav>

          <div className="cf-div" />

          <div className="cf-foot">
            {/* Compact state icon — no overflow */}
            <div className={`cf-si ${sc}`}>
              <span className="cf-si-em">{STATE_EMOJI[cognitiveState]}</span>
              <span className="cf-si-dot" />
            </div>

            <button
              className={`cf-fb ${voiceInputEnabled ? "on" : ""}`}
              onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
              title={voiceInputEnabled ? "Voice on" : "Voice off"}
            >
              {voiceInputEnabled ? <Mic /> : <MicOff />}
            </button>

            <Link to="/profile" className="cf-fb" title="Profile">
              <User />
            </Link>

            <button
              className="cf-fb red"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut />
            </button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <div className="cf-main">
          {/* Topbar */}
          <div className="cf-top">
            <span className="cf-top-brand">CogniFlow</span>
            <span className="cf-top-slash">/</span>
            <span className="cf-top-page">{tabLabel[activeTab]}</span>

            {/* Confidence meter */}
            <div className="cf-conf">
              <span className="cf-conf-lbl">Conf</span>
              <div className="cf-conf-track">
                <div
                  className="cf-conf-fill"
                  style={{ width: `${stateConfidence * 100}%` }}
                />
              </div>
            </div>

            {/* State pill */}
            <div className={`cf-pill ${sc}`}>
              <span className="cf-pill-dot" />
              {STATE_EMOJI[cognitiveState]}&nbsp;{STATE_LABEL[cognitiveState]}
            </div>
          </div>

          {/* Content area */}
          <div className="cf-cnt">
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
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}

/* ─────────── StateBanner ─────────── */
function StateBanner({
  state,
  prev,
}: {
  state: CognitiveState;
  prev: CognitiveState;
}) {
  const [show, setShow] = useState(false);
  const [shown, setShown] = useState(state);
  const sc = STATE_CLS[state];

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
    <div className={`cf-bnr ${sc}`}>
      {icon}
      <span>{text}</span>
      <Sparkles className="cf-spin" style={{ width: 13, height: 13 }} />
    </div>
  );
}

/* ─────────── Settings ─────────── */
function Tog({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`cf-tog ${on ? "on" : "off"}`}
      onClick={() => onChange(!on)}
    >
      <div className="cf-togdot" />
    </button>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="cf-card">
      <div className="cf-ch">
        <div className="cf-ci">{icon}</div>
        <div className="cf-ct">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Row({
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
    <div className="cf-row">
      <div>
        <div className="cf-rn">{name}</div>
        <div className="cf-rd">{desc}</div>
      </div>
      <Tog on={checked} onChange={onChange} />
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
    <div className="cf-spage">
      <div className="cf-shead">
        <div className="cf-stitle">Settings</div>
        <div className="cf-ssub">Personalise your CogniFlow experience</div>
      </div>

      <Card title="Appearance" icon={<Sun />}>
        <Row
          name="Dark Mode"
          desc="Switch to dark theme to reduce eye strain at night"
          checked={darkMode}
          onChange={setDarkMode}
        />
      </Card>

      <Card title="Focus & Detection" icon={<Eye />}>
        <Row
          name="Focus Mode"
          desc="Pause non-critical notifications while you're focused"
          checked={focusMode}
          onChange={setFocusMode}
        />
        <Row
          name="Eye Detection"
          desc="Webcam-based drowsiness and fatigue detection"
          checked={eyeDetection}
          onChange={setEyeDetection}
        />
        <Row
          name="Voice Input"
          desc="Hands-free voice commands and dictation"
          checked={voiceInputEnabled}
          onChange={setVoiceInputEnabled}
        />
      </Card>

      <Card title="Notifications" icon={<Volume2 />}>
        <Row
          name="Voice Feedback"
          desc="Spoken audio cues when your cognitive state changes"
          checked={voiceEnabled}
          onChange={setVoiceEnabled}
        />
      </Card>

      <Card title="Baseline Calibration" icon={<Activity />}>
        <div className="cf-cnote">
          Recalibrate CogniFlow to your typing rhythm and cognitive patterns for
          more accurate state detection.
        </div>
        <Link to="/baseline-collection" className="cf-cta">
          <Zap /> Start Calibration
          <ChevronRight style={{ width: 12, height: 12, opacity: 0.6 }} />
        </Link>
      </Card>
    </div>
  );
}
