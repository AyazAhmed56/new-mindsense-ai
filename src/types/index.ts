export type CognitiveState = 'focus' | 'confused' | 'fatigue';

export interface BaselineMetrics {
  wpm: number;
  errorRate: number;
  avgPauseTime: number;
  timestamp: number;
}

export interface TypingMetrics {
  wpm: number;
  errorRate: number;
  pauseTime: number;
  lastKeystroke: number;
}

export interface SessionData {
  focusTime: number;
  fatigueCount: number;
  confusionCount: number;
  startTime: number;
}
