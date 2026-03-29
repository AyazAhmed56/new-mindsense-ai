import { useEffect, useState, useCallback } from "react";
import { X, Bell, Coffee, Brain, Target, Sparkles } from "lucide-react";
import type { CognitiveState } from "../types";

interface Notification {
  id: string;
  type: "fatigue" | "focus" | "confused" | "system";
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationSystemProps {
  cognitiveState: CognitiveState;
  focusMode: boolean;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Instrument+Serif:ital@1&display=swap');

:root {
  --ns-radius: 20px;
  --ns-shadow-green: 0 8px 32px rgba(22,163,74,0.14), 0 2px 8px rgba(0,0,0,0.05);
  --ns-shadow-red:   0 8px 32px rgba(220,38,38,0.14),  0 2px 8px rgba(0,0,0,0.05);
  --ns-shadow-amber: 0 8px 32px rgba(217,119,6,0.14),  0 2px 8px rgba(0,0,0,0.05);
  --ns-shadow-blue:  0 8px 32px rgba(37,99,235,0.14),  0 2px 8px rgba(0,0,0,0.05);
}

.ns-wrap {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 340px;
  width: calc(100vw - 3rem);
  font-family: 'Outfit', sans-serif;
  pointer-events: none;
}

/* ── Card ── */
.ns-card {
  pointer-events: all;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem 1.1rem 0.9rem;
  border-radius: var(--ns-radius);
  border: 1.5px solid transparent;
  background: #ffffff;
  position: relative;
  overflow: hidden;
  animation: nsSlideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ns-card:hover {
  transform: translateX(-4px) scale(1.01);
}

/* Accent bar left */
.ns-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  border-radius: var(--ns-radius) 0 0 var(--ns-radius);
}

/* Progress bar bottom */
.ns-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  height: 2px;
  width: 100%;
  transform-origin: left;
  animation: nsTimer 8s linear forwards;
  border-radius: 0 0 var(--ns-radius) var(--ns-radius);
}

/* Shimmer overlay */
.ns-card-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: nsShimmer 2.5s ease-in-out infinite;
  pointer-events: none;
}

/* Type: fatigue */
.ns-card.fatigue {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fff8f8 0%, #ffffff 100%);
  box-shadow: var(--ns-shadow-red);
}
.ns-card.fatigue::before { background: linear-gradient(180deg, #ef4444, #fca5a5); }
.ns-card.fatigue::after  { background: linear-gradient(90deg, #ef4444, #fca5a5); }

/* Type: confused */
.ns-card.confused {
  border-color: #fde68a;
  background: linear-gradient(135deg, #fffdf0 0%, #ffffff 100%);
  box-shadow: var(--ns-shadow-amber);
}
.ns-card.confused::before { background: linear-gradient(180deg, #f59e0b, #fde68a); }
.ns-card.confused::after  { background: linear-gradient(90deg, #f59e0b, #fde68a); }

/* Type: focus */
.ns-card.focus {
  border-color: #bbf7d0;
  background: linear-gradient(135deg, #f8fff9 0%, #ffffff 100%);
  box-shadow: var(--ns-shadow-green);
}
.ns-card.focus::before { background: linear-gradient(180deg, #22c55e, #86efac); }
.ns-card.focus::after  { background: linear-gradient(90deg, #22c55e, #86efac); }

/* Type: system */
.ns-card.system {
  border-color: #bfdbfe;
  background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
  box-shadow: var(--ns-shadow-blue);
}
.ns-card.system::before { background: linear-gradient(180deg, #3b82f6, #93c5fd); }
.ns-card.system::after  { background: linear-gradient(90deg, #3b82f6, #93c5fd); }

/* ── Icon ── */
.ns-icon {
  flex-shrink: 0;
  width: 40px; height: 40px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.ns-icon svg { width: 18px; height: 18px; }
.ns-icon-ring {
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  border: 1.5px solid transparent;
  animation: nsRingPulse 2s ease-in-out infinite;
}

.ns-card.fatigue  .ns-icon { background: linear-gradient(135deg,#fef2f2,#fee2e2); color: #dc2626; }
.ns-card.fatigue  .ns-icon-ring { border-color: rgba(220,38,38,0.3); }
.ns-card.confused .ns-icon { background: linear-gradient(135deg,#fffbeb,#fef3c7); color: #d97706; }
.ns-card.confused .ns-icon-ring { border-color: rgba(217,119,6,0.3); }
.ns-card.focus    .ns-icon { background: linear-gradient(135deg,#f0fdf4,#dcfce7); color: #16a34a; }
.ns-card.focus    .ns-icon-ring { border-color: rgba(22,163,74,0.3); }
.ns-card.system   .ns-icon { background: linear-gradient(135deg,#eff6ff,#dbeafe); color: #2563eb; }
.ns-card.system   .ns-icon-ring { border-color: rgba(37,99,235,0.3); }

/* ── Body ── */
.ns-body { flex: 1; min-width: 0; padding-top: 1px; }

.ns-title {
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 3px;
}
.ns-card.fatigue  .ns-title { color: #7f1d1d; }
.ns-card.confused .ns-title { color: #78350f; }
.ns-card.focus    .ns-title { color: #14532d; }
.ns-card.system   .ns-title { color: #1e3a8a; }

.ns-msg {
  font-size: 0.73rem;
  line-height: 1.5;
  font-weight: 500;
}
.ns-card.fatigue  .ns-msg { color: #b91c1c; opacity: 0.8; }
.ns-card.confused .ns-msg { color: #92400e; opacity: 0.8; }
.ns-card.focus    .ns-msg { color: #166534; opacity: 0.8; }
.ns-card.system   .ns-msg { color: #1e40af; opacity: 0.8; }

.ns-time {
  font-size: 0.62rem;
  font-weight: 600;
  opacity: 0.45;
  margin-top: 5px;
  letter-spacing: 0.03em;
}
.ns-card.fatigue  .ns-time { color: #991b1b; }
.ns-card.confused .ns-time { color: #92400e; }
.ns-card.focus    .ns-time { color: #15803d; }
.ns-card.system   .ns-time { color: #1e40af; }

/* ── Close btn ── */
.ns-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  width: 26px; height: 26px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #9ca3af;
  transition: all 0.18s;
  margin-top: 1px;
}
.ns-close:hover {
  background: rgba(0,0,0,0.06);
  color: #374151;
  transform: rotate(90deg);
}
.ns-close svg { width: 13px; height: 13px; }

/* ── Keyframes ── */
@keyframes nsSlideIn {
  from { opacity: 0; transform: translateX(32px) scale(0.93); }
  to   { opacity: 1; transform: none; }
}
@keyframes nsTimer {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}
@keyframes nsShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes nsRingPulse {
  0%, 100% { transform: scale(1);   opacity: 0.7; }
  50%       { transform: scale(1.06); opacity: 0.2; }
}
`;

export function NotificationSystem({
  cognitiveState,
  focusMode,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastState, setLastState] = useState<CognitiveState>("focus");
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "timestamp">) => {
      if (focusMode && n.type !== "fatigue") return;
      const note: Notification = {
        ...n,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      setNotifications((p) => [note, ...p].slice(0, 5));
      setTimeout(
        () => setNotifications((p) => p.filter((x) => x.id !== note.id)),
        8000,
      );
    },
    [focusMode],
  );

  useEffect(() => {
    if (cognitiveState !== lastState) {
      if (cognitiveState === "fatigue") {
        addNotification({
          type: "fatigue",
          title: "You seem tired 😴",
          message: "Consider a 5-minute break to recharge your focus.",
        });
      } else if (cognitiveState === "confused") {
        addNotification({
          type: "confused",
          title: "Need some help? 🤔",
          message: "Try breaking your task into smaller steps.",
        });
      } else if (cognitiveState === "focus" && lastState !== "focus") {
        addNotification({
          type: "focus",
          title: "In the zone! ⚡",
          message: "Great focus detected. Keep up the momentum!",
        });
        setFocusStartTime(Date.now());
      }
      setLastState(cognitiveState);
    }
  }, [cognitiveState, lastState, addNotification]);

  useEffect(() => {
    if (focusMode && focusStartTime && cognitiveState === "focus") {
      const iv = setInterval(() => {
        const d = Date.now() - focusStartTime;
        if (d > 45 * 60000 && d < 46 * 60000) {
          addNotification({
            type: "system",
            title: "45-min Focus Session 🎯",
            message: "Outstanding! Consider a short break to stay sharp.",
          });
        }
      }, 60000);
      return () => clearInterval(iv);
    }
  }, [focusMode, focusStartTime, cognitiveState, addNotification]);

  const remove = (id: string) =>
    setNotifications((p) => p.filter((n) => n.id !== id));

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  if (notifications.length === 0) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="ns-wrap">
        {notifications.map((n) => (
          <div key={n.id} className={`ns-card ${n.type}`}>
            <div className="ns-card-shimmer" />
            <div className="ns-icon">
              {n.type === "fatigue" && <Coffee />}
              {n.type === "confused" && <Brain />}
              {n.type === "focus" && <Target />}
              {n.type === "system" && <Sparkles />}
              <div className="ns-icon-ring" />
            </div>
            <div className="ns-body">
              <div className="ns-title">{n.title}</div>
              <div className="ns-msg">{n.message}</div>
              <div className="ns-time">{fmtTime(n.timestamp)}</div>
            </div>
            <button className="ns-close" onClick={() => remove(n.id)}>
              <X />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
