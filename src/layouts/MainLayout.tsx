import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import  ChatAssistant  from '../components/ChatAssistant';
import { Dashboard } from '../components/Dashboard';
import { CognitiveStateIndicator } from '../components/CognitiveStateIndicator';
import { WebcamDetector } from '../components/WebcamDetector';
import { VoiceFeedback } from '../components/VoiceFeedback';
import { NotificationSystem } from '../components/NotificationSystem';
import { FocusModeBlocker } from '../components/FocusModeBlocker';
import { BehaviorTracker } from '../hooks/useBehaviorTracker';
import type { CognitiveState, BaselineMetrics } from '../types';

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

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

// State history for trend analysis
const useStateHistory = (currentState: CognitiveState) => {
  const [history, setHistory] = useState<CognitiveState[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const newHistory = [...prev, currentState].slice(-10);
        return newHistory;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentState]);

  return history;
};

// Calculate confidence score
const calculateConfidence = (history: CognitiveState[]): number => {
  if (history.length < 3) return 0.5;
  
  const counts = history.reduce((acc, state) => {
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {} as Record<CognitiveState, number>);
  
  const maxCount = Math.max(...Object.values(counts));
  return maxCount / history.length;
};

export function MainLayout() {
  const navigate = useNavigate();
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>('focus');
  const [baseline, setBaseline] = useState<BaselineMetrics | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'settings'>('chat');
  const [focusMode, setFocusMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [eyeDetection, setEyeDetection] = useState(false);
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(false);

  const behaviorTracker = BehaviorTracker(baseline);
  const stateHistory = useStateHistory(cognitiveState);
  const stateConfidence = calculateConfidence(stateHistory);

  // Load baseline
  useEffect(() => {
    const storedBaseline = localStorage.getItem('cogniflow_extended_baseline');
    const storedTyping = localStorage.getItem('cogniflow_baseline');
    
    if (storedBaseline) {
      const parsed = JSON.parse(storedBaseline);
      setBaseline(parsed.typing);
      setIsCalibrated(true);
    } else if (storedTyping) {
      setBaseline(JSON.parse(storedTyping));
      setIsCalibrated(true);
    }
  }, []);

  // Continuous behavior analysis
  useEffect(() => {
    const analyzeBehavior = () => {
      const metrics = behaviorTracker.typingMetrics;
      const baselineData = baseline;

      if (!baselineData) {
        setCognitiveState('focus');
        return;
      }

      // Calculate deviations
      const wpmDeviation = metrics.wpm / baselineData.wpm;
      const errorDeviation = metrics.errorRate / (baselineData.errorRate || 0.05);
      const pauseDeviation = metrics.pauseTime / (baselineData.avgPauseTime || 1000);

      let newState: CognitiveState = 'focus';
      
      // Fatigue: Low WPM, high pauses
      if (wpmDeviation < 0.7 && pauseDeviation > 1.5) {
        newState = 'fatigue';
      }
      // Confusion: High errors
      else if (errorDeviation > 2 || (wpmDeviation > 1.3 && errorDeviation > 1.5)) {
        newState = 'confused';
      }
      // Focus: Stable performance
      else if (wpmDeviation >= 0.8 && errorDeviation <= 1.2 && pauseDeviation <= 1.2) {
        newState = 'focus';
      }
      else if (metrics.errorRate > 0.15) {
        newState = 'confused';
      } else if (metrics.wpm < baselineData.wpm * 0.6) {
        newState = 'fatigue';
      }

      setCognitiveState(newState);
    };

    const interval = setInterval(analyzeBehavior, 3000);
    analyzeBehavior();

    return () => clearInterval(interval);
  }, [behaviorTracker, baseline]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Adaptive theme
  const getStateTheme = () => {
    switch (cognitiveState) {
      case 'fatigue':
        return 'from-orange-50 to-red-50';
      case 'confused':
        return 'from-yellow-50 to-orange-50';
      case 'focus':
      default:
        return 'from-primary-50 to-white';
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('cogniflow_auth');
    localStorage.removeItem('cogniflow_user');
    localStorage.removeItem('cogniflow_profile');
    navigate('/login');
  };

  return (
    <AppContext.Provider value={{
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
      recentStates: stateHistory
    }}>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        <div className={`flex h-screen overflow-hidden bg-gradient-to-br ${getStateTheme()} dark:from-cogni-dark dark:to-gray-900 transition-colors duration-500`}>
          {/* Sidebar */}
          <aside className="w-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-r border-primary-100 dark:border-gray-800 flex flex-col items-center py-6 gap-4 z-20">
            <Link to="/app" className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg mb-4">
              <Brain className="w-7 h-7 text-white" />
            </Link>

            <NavButton
              active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              icon={<Zap />}
              label="Assistant"
            />
            <NavButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<BarChart3 />}
              label="Dashboard"
            />
            <NavButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings />}
              label="Settings"
            />

            <div className="mt-auto flex flex-col items-center gap-4">
              <CognitiveStateIndicator state={cognitiveState} confidence={stateConfidence} />
              
              <button
                onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  voiceInputEnabled 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                title={voiceInputEnabled ? 'Voice on' : 'Voice off'}
              >
                {voiceInputEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <Link 
                to="/profile" 
                className="p-3 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                title="Profile"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden relative">
            <StateChangeBanner 
              state={cognitiveState} 
              previousState={stateHistory[stateHistory.length - 2] || 'focus'}
            />

            {activeTab === 'chat' && (
              <ChatAssistant 
                cognitiveState={cognitiveState} 
                confidence={stateConfidence}
              />
            )}
            {activeTab === 'dashboard' && <Dashboard behaviorTracker={behaviorTracker} />}
            {activeTab === 'settings' && <SettingsPage />}

            <WebcamDetector 
              enabled={eyeDetection} 
              onFatigueDetected={() => {
                if (cognitiveState !== 'fatigue') {
                  setCognitiveState('fatigue');
                }
              }} 
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
              enabled={focusMode && cognitiveState === 'focus'}
            />
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}

function StateChangeBanner({ state, previousState }: { state: CognitiveState; previousState: CognitiveState }) {
  const [show, setShow] = useState(false);
  const [lastShown, setLastShown] = useState(state);

  useEffect(() => {
    if (state !== lastShown && state !== previousState) {
      setShow(true);
      setLastShown(state);
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [state, previousState, lastShown]);

  if (!show || state === previousState) return null;

  const configs = {
    fatigue: {
      icon: <Coffee className="w-5 h-5" />,
      text: 'You seem tired. Taking a break is recommended.',
      color: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    confused: {
      icon: <AlertCircle className="w-5 h-5" />,
      text: 'You might need help. I\'ll provide simpler explanations.',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    focus: {
      icon: <Target className="w-5 h-5" />,
      text: 'You\'re in the zone! Great focus detected.',
      color: 'bg-green-100 text-green-800 border-green-200'
    }
  };

  const config = configs[state];

  return (
    <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border shadow-lg animate-fade-in flex items-center gap-3 ${config.color}`}>
      {config.icon}
      <span className="font-medium text-sm">{config.text}</span>
      <Sparkles className="w-4 h-4 animate-pulse" />
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl transition-all relative group ${
        active
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
          : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={label}
    >
      {icon}
      <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        {label}
      </span>
    </button>
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
    setVoiceInputEnabled
  } = useAppContext();

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h2>

      <div className="space-y-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500">Reduce eye strain</p>
            </div>
            <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-600" />
            Focus Features
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Focus Mode</p>
                <p className="text-sm text-gray-500">Pause notifications when focused</p>
              </div>
              <ToggleSwitch checked={focusMode} onChange={setFocusMode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Eye Detection</p>
                <p className="text-sm text-gray-500">Enable webcam for fatigue detection</p>
              </div>
              <ToggleSwitch checked={eyeDetection} onChange={setEyeDetection} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Voice Input</p>
                <p className="text-sm text-gray-500">Enable voice commands</p>
              </div>
              <ToggleSwitch checked={voiceInputEnabled} onChange={setVoiceInputEnabled} />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Voice Feedback</p>
              <p className="text-sm text-gray-500">Audio state notifications</p>
            </div>
            <ToggleSwitch checked={voiceEnabled} onChange={setVoiceEnabled} />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recalibrate</h3>
          <p className="text-sm text-gray-500 mb-4">Reset your baseline behavior</p>
          <Link 
            to="/baseline-collection"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Start Baseline Collection
          </Link>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-14 h-8 rounded-full transition-colors relative ${
        checked ? 'bg-primary-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
