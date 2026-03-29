import { useCallback, useRef, useState } from 'react';
import type { CognitiveState, BaselineMetrics, TypingMetrics, SessionData } from '../types';

const CALIBRATION_TEXT = "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Technology is best when it brings people together.";

export function BehaviorTracker(baseline: BaselineMetrics | null) {
  const [typingMetrics, setTypingMetrics] = useState<TypingMetrics>({
    wpm: 0,
    errorRate: 0,
    pauseTime: 0,
    lastKeystroke: Date.now()
  });

  const [sessionData, setSessionData] = useState<SessionData>({
    focusTime: 0,
    fatigueCount: 0,
    confusionCount: 0,
    startTime: Date.now()
  });

  const keystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const startTimeRef = useRef(Date.now());
  const pausesRef = useRef<number[]>([]);
  const lastKeystrokeRef = useRef(Date.now());

  const getCognitiveState = useCallback((): CognitiveState => {
    if (!baseline) return 'focus';

    const { wpm, errorRate, pauseTime } = typingMetrics;

    // Fatigue: speed drops below 70% of baseline OR long pauses
    if (wpm < baseline.wpm * 0.7 || pauseTime > baseline.avgPauseTime * 2) {
      return 'fatigue';
    }

    // Confusion: error rate increases by 50% OR very slow typing
    if (errorRate > baseline.errorRate * 1.5 || wpm < baseline.wpm * 0.5) {
      return 'confused';
    }

    // Focus: normal speed, low errors
    if (wpm >= baseline.wpm * 0.8 && errorRate <= baseline.errorRate * 1.2) {
      return 'focus';
    }

    return 'focus';
  }, [typingMetrics, baseline]);

  const trackKeystroke = useCallback(() => {
    const now = Date.now();
    const pauseDuration = now - lastKeystrokeRef.current;

    if (pauseDuration > 1000) {
      pausesRef.current.push(pauseDuration);
    }

    keystrokesRef.current++;
    lastKeystrokeRef.current = now;

    const elapsedMinutes = (now - startTimeRef.current) / 60000;
    const wpm = elapsedMinutes > 0 ? keystrokesRef.current / 5 / elapsedMinutes : 0;
    const avgPause = pausesRef.current.length > 0
      ? pausesRef.current.reduce((a, b) => a + b, 0) / pausesRef.current.length
      : 0;

    setTypingMetrics({
      wpm,
      errorRate: errorsRef.current / Math.max(keystrokesRef.current, 1),
      pauseTime: avgPause,
      lastKeystroke: now
    });
  }, []);

  const trackError = useCallback(() => {
    errorsRef.current++;
  }, []);

  const updateSessionData = useCallback((state: CognitiveState) => {
    setSessionData(prev => {
      const newData = { ...prev };
      if (state === 'focus') {
        newData.focusTime += 1;
      } else if (state === 'fatigue') {
        newData.fatigueCount += 1;
      } else if (state === 'confused') {
        newData.confusionCount += 1;
      }
      return newData;
    });
  }, []);

  return {
    typingMetrics,
    sessionData,
    trackKeystroke,
    trackError,
    getCognitiveState,
    updateSessionData
  };
}

export function useCalibration() {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('');
  const [targetText] = useState(CALIBRATION_TEXT);
  const [metrics, setMetrics] = useState<BaselineMetrics | null>(null);

  const keystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const startTimeRef = useRef(0);
  const pausesRef = useRef<number[]>([]);
  const lastKeystrokeRef = useRef(0);

  const startCalibration = useCallback(() => {
    setIsActive(true);
    setProgress(0);
    setText('');
    keystrokesRef.current = 0;
    errorsRef.current = 0;
    startTimeRef.current = Date.now();
    lastKeystrokeRef.current = Date.now();
    pausesRef.current = [];
  }, []);

  const handleInput = useCallback((value: string) => {
    const now = Date.now();

    if (lastKeystrokeRef.current > 0) {
      const pause = now - lastKeystrokeRef.current;
      if (pause > 1000) {
        pausesRef.current.push(pause);
      }
    }

    keystrokesRef.current++;
    lastKeystrokeRef.current = now;

    // Count errors
    let errors = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== targetText[i]) {
        errors++;
      }
    }
    errorsRef.current = errors;

    setText(value);
    setProgress((value.length / targetText.length) * 100);

    if (value.length >= targetText.length) {
      completeCalibration();
    }
  }, [targetText]);

  const completeCalibration = useCallback(() => {
    const duration = (Date.now() - startTimeRef.current) / 60000;
    const wpm = keystrokesRef.current / 5 / duration;
    const errorRate = errorsRef.current / keystrokesRef.current;
    const avgPauseTime = pausesRef.current.length > 0
      ? pausesRef.current.reduce((a, b) => a + b, 0) / pausesRef.current.length
      : 0;

    const baselineMetrics: BaselineMetrics = {
      wpm,
      errorRate,
      avgPauseTime,
      timestamp: Date.now()
    };

    setMetrics(baselineMetrics);
    setIsActive(false);
  }, []);

  return {
    isActive,
    progress,
    text,
    targetText,
    metrics,
    startCalibration,
    handleInput
  };
}
