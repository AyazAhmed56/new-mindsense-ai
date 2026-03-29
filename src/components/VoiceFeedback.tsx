import { useEffect, useCallback, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { CognitiveState } from '../types';

interface VoiceFeedbackProps {
  cognitiveState: CognitiveState;
  enabled: boolean;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&display=swap');

.vf-indicator {
  position: fixed; bottom: 1.25rem; left: 1.25rem; z-index: 45;
  background: #ffffff; border: 1.5px solid #bbf7d0;
  border-radius: 99px; padding: 6px 14px 6px 9px;
  display: flex; align-items: center; gap: 7px;
  box-shadow: 0 4px 18px rgba(22,163,74,.18);
  font-family: 'Plus Jakarta Sans', sans-serif;
  animation: vfIn .35s cubic-bezier(.22,1,.36,1) both;
}
.vf-icon {
  width: 26px; height: 26px; border-radius: 50%;
  background: #f0fdf4; color: #16a34a;
  display: flex; align-items: center; justify-content: center;
}
.vf-icon svg { width: 13px; height: 13px; }
.vf-text { font-size: .72rem; font-weight: 600; color: #166534; letter-spacing: .02em; }
.vf-bars {
  display: flex; align-items: center; gap: 2px; margin-left: 2px;
}
.vf-bar {
  width: 3px; background: #16a34a; border-radius: 2px;
  animation: vfBar 1s ease-in-out infinite;
}
.vf-bar:nth-child(1){ height:6px;  animation-delay:0s }
.vf-bar:nth-child(2){ height:12px; animation-delay:.15s }
.vf-bar:nth-child(3){ height:8px;  animation-delay:.3s }
.vf-bar:nth-child(4){ height:14px; animation-delay:.1s }
.vf-bar:nth-child(5){ height:6px;  animation-delay:.25s }

@keyframes vfIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
@keyframes vfBar { 0%,100%{transform:scaleY(.4)} 50%{transform:scaleY(1)} }
`;

export function VoiceFeedback({ cognitiveState, enabled }: VoiceFeedbackProps) {
  const lastSpokenRef = useRef<CognitiveState | null>(null);
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (!enabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate   = 0.9;
      utterance.pitch  = 1;
      utterance.volume = 0.7;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend   = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (lastSpokenRef.current === null) {
      lastSpokenRef.current = cognitiveState;
      return;
    }
    if (lastSpokenRef.current !== cognitiveState) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        let message = '';
        switch (cognitiveState) {
          case 'fatigue':  message = "You seem tired. Consider taking a short break to recharge."; break;
          case 'confused': message = "I noticed you might need some help. Try breaking the problem into smaller steps."; break;
          case 'focus':    message = "You're in the zone! Great focus. Keep it up."; break;
        }
        if (message) {
          speak(message);
          lastSpokenRef.current = cognitiveState;
        }
      }, 5000);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [cognitiveState, speak, enabled]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!enabled || !speaking) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="vf-indicator">
        <div className="vf-icon"><Volume2 /></div>
        <span className="vf-text">Speaking…</span>
        <div className="vf-bars">
          <div className="vf-bar" />
          <div className="vf-bar" />
          <div className="vf-bar" />
          <div className="vf-bar" />
          <div className="vf-bar" />
        </div>
      </div>
    </>
  );
}