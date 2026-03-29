import { useEffect, useCallback, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { CognitiveState } from "../types";

interface VoiceFeedbackProps {
  cognitiveState: CognitiveState;
  enabled: boolean;
}

const STATE_CONFIG: Record<
  CognitiveState,
  { emoji: string; label: string; color: string; bg: string; border: string }
> = {
  focus: {
    emoji: "⚡",
    label: "Focus boost",
    color: "#15803d",
    bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
    border: "#86efac",
  },
  fatigue: {
    emoji: "☕",
    label: "Rest reminder",
    color: "#dc2626",
    bg: "linear-gradient(135deg,#fff8f8,#fef2f2)",
    border: "#fca5a5",
  },
  confused: {
    emoji: "🧩",
    label: "Guidance mode",
    color: "#d97706",
    bg: "linear-gradient(135deg,#fffdf0,#fffbeb)",
    border: "#fde68a",
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&display=swap');

.vf-root {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 9000;
  font-family: 'Outfit', sans-serif;
}

/* ── Speaking indicator ── */
.vf-pill {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 1.1rem 0.6rem 0.7rem;
  border-radius: 99px;
  border: 1.5px solid var(--vf-border);
  background: var(--vf-bg);
  box-shadow:
    0 0 0 4px var(--vf-glow),
    0 8px 28px rgba(0,0,0,0.08);
  animation: vfPillIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  position: relative;
  overflow: hidden;
}
.vf-pill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: vfShimmer 2s ease-in-out infinite;
}

.vf-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--vf-icon-bg);
  color: var(--vf-color);
  flex-shrink: 0;
  box-shadow: 0 2px 8px var(--vf-glow);
  position: relative;
}
.vf-icon-wrap svg { width: 14px; height: 14px; }
.vf-icon-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid var(--vf-color);
  opacity: 0.3;
  animation: vfRingExpand 1.8s ease-out infinite;
}

.vf-text-group { flex: 1; }
.vf-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vf-color);
  opacity: 0.65;
  line-height: 1;
  margin-bottom: 2px;
}
.vf-speaking-text {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--vf-color);
  letter-spacing: -0.01em;
}

/* Waveform bars */
.vf-wave {
  display: flex;
  align-items: center;
  gap: 2.5px;
  height: 22px;
}
.vf-wave-bar {
  width: 3px;
  background: var(--vf-color);
  border-radius: 3px;
  transform-origin: bottom;
}
.vf-wave-bar:nth-child(1) { height: 8px;  animation: vfWave 0.9s ease-in-out infinite;             animation-delay: 0s; }
.vf-wave-bar:nth-child(2) { height: 16px; animation: vfWave 0.9s ease-in-out infinite alternate;    animation-delay: 0.12s; }
.vf-wave-bar:nth-child(3) { height: 10px; animation: vfWave 0.9s ease-in-out infinite;              animation-delay: 0.24s; }
.vf-wave-bar:nth-child(4) { height: 20px; animation: vfWave 0.9s ease-in-out infinite alternate;    animation-delay: 0.08s; }
.vf-wave-bar:nth-child(5) { height: 12px; animation: vfWave 0.9s ease-in-out infinite;              animation-delay: 0.16s; }
.vf-wave-bar:nth-child(6) { height: 7px;  animation: vfWave 0.9s ease-in-out infinite alternate;    animation-delay: 0.3s; }

/* Emoji badge */
.vf-emoji {
  font-size: 1.1rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

/* ── Keyframes ── */
@keyframes vfPillIn {
  from { opacity: 0; transform: translateY(12px) scale(0.92); }
  to   { opacity: 1; transform: none; }
}
@keyframes vfShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes vfWave {
  0%,100% { transform: scaleY(0.35); }
  50%     { transform: scaleY(1); }
}
@keyframes vfRingExpand {
  0%   { transform: scale(1);   opacity: 0.4; }
  100% { transform: scale(1.8); opacity: 0; }
}
`;

export function VoiceFeedback({ cognitiveState, enabled }: VoiceFeedbackProps) {
  const lastSpokenRef = useRef<CognitiveState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [activeState, setActiveState] = useState<CognitiveState>("focus");

  const speak = useCallback(
    (text: string) => {
      if (!enabled) return;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.7;
        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    if (lastSpokenRef.current === null) {
      lastSpokenRef.current = cognitiveState;
      return;
    }
    if (lastSpokenRef.current !== cognitiveState) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const messages: Record<CognitiveState, string> = {
          fatigue: "You seem tired. Consider taking a short break to recharge.",
          confused:
            "I noticed you might need some help. Try breaking the problem into smaller steps.",
          focus: "You're in the zone! Great focus. Keep it up.",
        };
        speak(messages[cognitiveState]);
        setActiveState(cognitiveState);
        lastSpokenRef.current = cognitiveState;
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [cognitiveState, speak, enabled]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!enabled || !speaking) return null;

  const cfg = STATE_CONFIG[activeState];

  return (
    <>
      <style>{CSS}</style>
      <div className="vf-root">
        <div
          className="vf-pill"
          style={
            {
              "--vf-bg": cfg.bg,
              "--vf-border": cfg.border,
              "--vf-color": cfg.color,
              "--vf-glow": `${cfg.border}55`,
              "--vf-icon-bg": `${cfg.border}66`,
            } as React.CSSProperties
          }
        >
          <div className="vf-icon-wrap">
            <Volume2 />
            <div className="vf-icon-ring" />
          </div>
          <div className="vf-text-group">
            <div className="vf-label">{cfg.label}</div>
            <div className="vf-speaking-text">Speaking now…</div>
          </div>
          <div className="vf-wave">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="vf-wave-bar"
                style={{ animationDelay: `${i * 0.06}s` }}
              />
            ))}
          </div>
          <div className="vf-emoji">{cfg.emoji}</div>
        </div>
      </div>
    </>
  );
}
