import { createContext, useContext } from "react";
import type { BaselineMetrics, CognitiveState } from "../types";
// import type { AppContextType } from "../types";

type AppContextType = {
  cognitiveState: CognitiveState;
  baseline: BaselineMetrics | null;
  setBaseline: (baseline: BaselineMetrics) => void;
  isCalibrated: boolean;
  setIsCalibrated: (value: boolean) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (value: boolean) => void;
  eyeDetection: boolean;
  setEyeDetection: (value: boolean) => void;
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (value: boolean) => void;
  stateConfidence: number;
  recentStates: CognitiveState[];
};

export const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};
