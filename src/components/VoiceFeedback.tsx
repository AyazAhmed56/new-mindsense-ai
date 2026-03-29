import { useEffect, useCallback, useRef } from 'react';
import type { CognitiveState } from '../types';

interface VoiceFeedbackProps {
  cognitiveState: CognitiveState;
  enabled: boolean;
}

export function VoiceFeedback({ cognitiveState, enabled }: VoiceFeedbackProps) {
  const lastSpokenRef = useRef<CognitiveState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = useCallback((text: string) => {
    if (!enabled) return;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      window.speechSynthesis.speak(utterance);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Don't speak on initial render
    if (lastSpokenRef.current === null) {
      lastSpokenRef.current = cognitiveState;
      return;
    }

    // Only speak when state changes
    if (lastSpokenRef.current !== cognitiveState) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce: wait 5 seconds before speaking
      timeoutRef.current = setTimeout(() => {
        let message = '';
        switch (cognitiveState) {
          case 'fatigue':
            message = "You seem tired. Consider taking a short break to recharge.";
            break;
          case 'confused':
            message = "I noticed you might need some help. Try breaking the problem into smaller steps.";
            break;
          case 'focus':
            message = "You're in the zone! Great focus. Keep it up.";
            break;
        }

        if (message) {
          speak(message);
          lastSpokenRef.current = cognitiveState;
        }
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cognitiveState, speak, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return null;
}
