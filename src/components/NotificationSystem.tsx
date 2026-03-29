import { useEffect, useState, useCallback } from 'react';
import { X, Bell, Coffee, Brain, Target } from 'lucide-react';
import type { CognitiveState } from '../types';

interface Notification {
  id: string;
  type: 'fatigue' | 'focus' | 'confused' | 'system';
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationSystemProps {
  cognitiveState: CognitiveState;
  focusMode: boolean;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Familjen+Grotesk:wght@600;700&display=swap');

.ns-wrap {
  position: fixed; top: 1.25rem; right: 1.25rem;
  z-index: 50; display: flex; flex-direction: column; gap: .6rem;
  max-width: 330px; width: calc(100vw - 2.5rem);
}

.ns-card {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #ffffff;
  border: 1.5px solid #d1fae5;
  border-left: 4px solid transparent;
  border-radius: 16px;
  padding: .9rem 1rem;
  display: flex; align-items: flex-start; gap: .75rem;
  box-shadow: 0 4px 20px rgba(0,0,0,.08), 0 1px 4px rgba(0,0,0,.04);
  animation: nsIn .38s cubic-bezier(.22,1,.36,1) both;
  position: relative; overflow: hidden;
}

/* shimmer top edge */
.ns-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent);
}

/* timer bar bottom */
.ns-card::after {
  content: ''; position: absolute; bottom: 0; left: 0;
  height: 2.5px; width: 100%;
  transform-origin: left; animation: nsTimer 8s linear both; border-radius: 0 0 16px 16px;
}

.ns-card.fatigue  { border-left-color: #dc2626; }
.ns-card.fatigue::after  { background: linear-gradient(90deg,#dc2626,#fca5a5); }
.ns-card.confused { border-left-color: #d97706; }
.ns-card.confused::after { background: linear-gradient(90deg,#d97706,#fde68a); }
.ns-card.focus    { border-left-color: #16a34a; }
.ns-card.focus::after    { background: linear-gradient(90deg,#16a34a,#4ade80); }
.ns-card.system   { border-left-color: #2563eb; }
.ns-card.system::after   { background: linear-gradient(90deg,#2563eb,#93c5fd); }

.ns-icon {
  flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.ns-icon svg { width: 16px; height: 16px; }

.ns-card.fatigue  .ns-icon { background: #fef2f2; color: #dc2626; }
.ns-card.confused .ns-icon { background: #fffbeb; color: #d97706; }
.ns-card.focus    .ns-icon { background: #f0fdf4; color: #16a34a; }
.ns-card.system   .ns-icon { background: #eff6ff; color: #2563eb; }

.ns-body { flex: 1; min-width: 0; }

.ns-title {
  font-family: 'Familjen Grotesk', sans-serif;
  font-size: .84rem; font-weight: 700; letter-spacing: -.01em;
  color: #052e16; margin-bottom: 3px;
}
.ns-card.fatigue  .ns-title { color: #7f1d1d; }
.ns-card.confused .ns-title { color: #78350f; }
.ns-card.system   .ns-title { color: #1e3a8a; }

.ns-msg { font-size: .74rem; color: #4d8c6a; line-height: 1.45; }
.ns-card.fatigue  .ns-msg { color: #991b1b; opacity:.8; }
.ns-card.confused .ns-msg { color: #92400e; opacity:.8; }
.ns-card.system   .ns-msg { color: #1e40af; opacity:.8; }

.ns-close {
  flex-shrink: 0; background: none; border: none; cursor: pointer;
  padding: 3px; border-radius: 6px; color: #9ca3af;
  transition: color .15s, background .15s;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.ns-close:hover { color: #374151; background: #f3f4f6; }
.ns-close svg { width: 13px; height: 13px; }

/* timestamp badge */
.ns-time {
  font-size: .62rem; color: #9ca3af; font-weight: 500; margin-top: 4px;
}

@keyframes nsIn {
  from { opacity:0; transform:translateX(28px) scale(.95); }
  to   { opacity:1; transform:none; }
}
@keyframes nsTimer {
  from { transform:scaleX(1); }
  to   { transform:scaleX(0); }
}
`;

export function NotificationSystem({ cognitiveState, focusMode }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastState, setLastState] = useState<CognitiveState>('focus');
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp'>) => {
    if (focusMode && n.type !== 'fatigue') return;
    const note: Notification = { ...n, id: Date.now().toString(), timestamp: Date.now() };
    setNotifications(p => [note, ...p].slice(0, 5));
    setTimeout(() => setNotifications(p => p.filter(x => x.id !== note.id)), 8000);
  }, [focusMode]);

  useEffect(() => {
    if (cognitiveState !== lastState) {
      if (cognitiveState === 'fatigue') {
        addNotification({ type: 'fatigue', title: 'You seem tired 😴', message: 'Consider taking a 5-minute break to recharge.' });
      } else if (cognitiveState === 'confused') {
        addNotification({ type: 'confused', title: 'Need help? 🤔', message: 'Try breaking your task into smaller steps.' });
      } else if (cognitiveState === 'focus' && lastState !== 'focus') {
        addNotification({ type: 'focus', title: 'In the zone! ⚡', message: 'Great focus! Keep up the momentum.' });
        setFocusStartTime(Date.now());
      }
      setLastState(cognitiveState);
    }
  }, [cognitiveState, lastState, addNotification]);

  useEffect(() => {
    if (focusMode && focusStartTime && cognitiveState === 'focus') {
      const iv = setInterval(() => {
        const d = Date.now() - focusStartTime;
        if (d > 45 * 60000 && d < 46 * 60000) {
          addNotification({ type: 'system', title: 'Focus Session Duration', message: "You've been focused for 45 minutes. Consider a break soon." });
        }
      }, 60000);
      return () => clearInterval(iv);
    }
  }, [focusMode, focusStartTime, cognitiveState, addNotification]);

  const remove = (id: string) => setNotifications(p => p.filter(n => n.id !== id));

  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  if (notifications.length === 0) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="ns-wrap">
        {notifications.map(n => (
          <div key={n.id} className={`ns-card ${n.type}`}>
            <div className="ns-icon">
              {n.type === 'fatigue'  && <Coffee />}
              {n.type === 'confused' && <Brain />}
              {n.type === 'focus'    && <Target />}
              {n.type === 'system'   && <Bell />}
            </div>
            <div className="ns-body">
              <div className="ns-title">{n.title}</div>
              <div className="ns-msg">{n.message}</div>
              <div className="ns-time">{fmtTime(n.timestamp)}</div>
            </div>
            <button className="ns-close" onClick={() => remove(n.id)}><X /></button>
          </div>
        ))}
      </div>
    </>
  );
}