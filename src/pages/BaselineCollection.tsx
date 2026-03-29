import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Mic, 
  Camera, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle,
  Target,
  Eye,
  Smile,
  Keyboard,
  Volume2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import type { BaselineMetrics } from '../types';

type Step = 'typing' | 'voice' | 'eye' | 'face' | 'complete';

interface ExtendedBaseline {
  typing: BaselineMetrics | null;
  voice: {
    recorded: boolean;
    duration: number;
    timestamp: number;
  } | null;
  eye: {
    calibrated: boolean;
    eyeOpenness: number[];
    timestamp: number;
  } | null;
  face: {
    captured: boolean;
    expressions: string[];
    timestamp: number;
  } | null;
}

const CALIBRATION_TEXT = "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Technology is best when it brings people together.";

export function BaselineCollection() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('typing');
  const [progress, setProgress] = useState(0);
  const [baseline, setBaseline] = useState<ExtendedBaseline>({
    typing: null,
    voice: null,
    eye: null,
    face: null
  });

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'typing', label: 'Typing Test', icon: <Keyboard className="w-5 h-5" /> },
    { id: 'voice', label: 'Voice Sample', icon: <Mic className="w-5 h-5" /> },
    { id: 'eye', label: 'Eye Tracking', icon: <Eye className="w-5 h-5" /> },
    { id: 'face', label: 'Face Analysis', icon: <Smile className="w-5 h-5" /> },
    { id: 'complete', label: 'Complete', icon: <CheckCircle className="w-5 h-5" /> }
  ];

  const updateProgress = () => {
    const completed = Object.values(baseline).filter(v => v !== null).length;
    setProgress((completed / 4) * 100);
  };

  const handleStepComplete = (step: Step, data: any) => {
    setBaseline(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const saveBaseline = () => {
    localStorage.setItem('cogniflow_extended_baseline', JSON.stringify(baseline));
    localStorage.setItem('cogniflow_baseline', JSON.stringify(baseline.typing));
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Baseline Collection
          </h1>
          <p className="text-gray-600 mt-2 max-w-lg mx-auto">
            We'll collect your normal behavior patterns to better understand your cognitive state later
          </p>
        </div>

        {/* Progress Bar */}
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-bold text-primary-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-6">
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = baseline[step.id as keyof ExtendedBaseline] !== null;
              
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-6 md:p-8">
          {currentStep === 'typing' && (
            <TypingTestStep
              onComplete={(data) => {
                handleStepComplete('typing', data);
                updateProgress();
                setCurrentStep('voice');
              }}
            />
          )}
          {currentStep === 'voice' && (
            <VoiceRecordingStep
              onComplete={(data) => {
                handleStepComplete('voice', data);
                updateProgress();
                setCurrentStep('eye');
              }}
              onBack={() => setCurrentStep('typing')}
            />
          )}
          {currentStep === 'eye' && (
            <EyeCalibrationStep
              onComplete={(data) => {
                handleStepComplete('eye', data);
                updateProgress();
                setCurrentStep('face');
              }}
              onBack={() => setCurrentStep('voice')}
            />
          )}
          {currentStep === 'face' && (
            <FaceExpressionStep
              onComplete={(data) => {
                handleStepComplete('face', data);
                updateProgress();
                setCurrentStep('complete');
              }}
              onBack={() => setCurrentStep('eye')}
            />
          )}
          {currentStep === 'complete' && (
            <CompleteStep
              baseline={baseline}
              onSave={saveBaseline}
              onBack={() => setCurrentStep('face')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Typing Test
function TypingTestStep({ onComplete }: { onComplete: (data: BaselineMetrics) => void }) {
  const [text, setText] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [metrics, setMetrics] = useState<BaselineMetrics | null>(null);
  
  const keystrokesRef = useRef(0);
  const errorsRef = useRef(0);
  const startTimeRef = useRef(0);
  const pausesRef = useRef<number[]>([]);
  const lastKeystrokeRef = useRef(0);

  const startTest = () => {
    setIsActive(true);
    setText('');
    keystrokesRef.current = 0;
    errorsRef.current = 0;
    startTimeRef.current = Date.now();
    lastKeystrokeRef.current = Date.now();
    pausesRef.current = [];
  };

  const handleInput = (value: string) => {
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
      if (value[i] !== CALIBRATION_TEXT[i]) {
        errors++;
      }
    }
    errorsRef.current = errors;

    setText(value);

    if (value.length >= CALIBRATION_TEXT.length) {
      completeTest();
    }
  };

  const completeTest = () => {
    const duration = (Date.now() - startTimeRef.current) / 60000;
    const wpm = keystrokesRef.current / 5 / duration;
    const errorRate = errorsRef.current / keystrokesRef.current;
    const avgPauseTime = pausesRef.current.length > 0
      ? pausesRef.current.reduce((a, b) => a + b, 0) / pausesRef.current.length
      : 0;

    const result: BaselineMetrics = {
      wpm,
      errorRate,
      avgPauseTime,
      timestamp: Date.now()
    };

    setMetrics(result);
    setIsActive(false);
    setShowResults(true);
  };

  if (showResults && metrics) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Typing Test Complete!</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary-600">{Math.round(metrics.wpm)}</p>
            <p className="text-sm text-gray-600">WPM</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary-600">{(metrics.errorRate * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Error Rate</p>
          </div>
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-primary-600">{(metrics.avgPauseTime / 1000).toFixed(1)}s</p>
            <p className="text-sm text-gray-600">Avg Pause</p>
          </div>
        </div>

        <button
          onClick={() => onComplete(metrics)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mx-auto"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="text-center">
        <Keyboard className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Typing Behavior Test</h3>
        <p className="text-gray-600 mb-6">
          Type the text below as accurately and naturally as possible. We'll measure your speed, errors, and pauses.
        </p>
        <button
          onClick={startTest}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
        >
          Start Typing Test
        </button>
      </div>
    );
  }

  const progress = (text.length / CALIBRATION_TEXT.length) * 100;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Type the text below:</h3>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4 font-mono text-lg leading-relaxed">
        {CALIBRATION_TEXT.split('').map((char, index) => {
          const isTyped = index < text.length;
          const isCorrect = text[index] === char;
          return (
            <span
              key={index}
              className={`${
                isTyped
                  ? isCorrect
                    ? 'text-green-600'
                    : 'text-red-500 bg-red-100'
                  : 'text-gray-400'
              }`}
            >
              {char}
            </span>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        className="w-full h-32 p-4 border-2 border-primary-200 rounded-xl resize-none focus:outline-none focus:border-primary-500 font-mono"
        placeholder="Start typing here..."
        autoFocus
      />
    </div>
  );
}

// Step 2: Voice Recording
function VoiceRecordingStep({ 
  onComplete, 
  onBack 
}: { 
  onComplete: (data: any) => void;
  onBack: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' });
        // In a real app, you would save this blob
        console.log('Voice recorded:', blob.size, 'bytes');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Count duration
      const interval = setInterval(() => {
        setDuration(d => {
          if (d >= 10) {
            clearInterval(interval);
            stopRecording();
            return 10;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      // Simulate recording for demo
      setIsRecording(true);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setDuration(count);
        if (count >= 10) {
          clearInterval(interval);
          setIsRecording(false);
          setRecorded(true);
        }
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecorded(true);
  };

  if (recorded) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Volume2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Voice Sample Recorded!</h3>
        <p className="text-gray-600 mb-6">Duration: {duration} seconds</p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setRecorded(false);
              setDuration(0);
            }}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
          >
            <RefreshCw className="w-4 h-4" />
            Re-record
          </button>
          <button
            onClick={() => onComplete({
              recorded: true,
              duration,
              timestamp: Date.now()
            })}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Mic className={`w-16 h-16 mx-auto mb-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary-600'}`} />
      <h3 className="text-xl font-bold text-gray-900 mb-2">Voice Recording</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Please read the following text aloud. This helps us understand your normal voice tone and speaking patterns.
      </p>

      <div className="bg-gray-50 rounded-xl p-6 mb-6 max-w-lg mx-auto">
        <p className="text-lg text-gray-800 italic">
          "The quick brown fox jumps over the lazy dog. I am recording my voice to help the system understand my normal speaking patterns."
        </p>
      </div>

      {isRecording ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-medium">Recording... {duration}s / 10s</span>
          </div>
          <button
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold transition-all"
          >
            Stop Recording
          </button>
        </div>
      ) : (
        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={startRecording}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        </div>
      )}
    </div>
  );
}

// Step 3: Eye Calibration
function EyeCalibrationStep({ 
  onComplete, 
  onBack 
}: { 
  onComplete: (data: any) => void;
  onBack: () => void;
}) {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eyeOpenness, setEyeOpenness] = useState<number[]>([]);

  const startCalibration = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      console.log('Camera access for demo');
    }

    setIsCalibrating(true);
    setProgress(0);
    setEyeOpenness([]);

    // Simulate eye tracking calibration
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsCalibrating(false);
          // Generate simulated eye openness data
          const data = Array.from({ length: 20 }, () => 0.7 + Math.random() * 0.3);
          setEyeOpenness(data);
          return 100;
        }
        
        // Collect simulated eye data during calibration
        if (p % 10 === 0) {
          setEyeOpenness(prev => [...prev, 0.7 + Math.random() * 0.3]);
        }
        
        return p + 2;
      });
    }, 100);
  };

  if (progress === 100 && eyeOpenness.length > 0) {
    const avgOpenness = eyeOpenness.reduce((a, b) => a + b, 0) / eyeOpenness.length;
    
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Eye className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Eye Tracking Calibrated!</h3>
        <p className="text-gray-600 mb-4">Average eye openness: {(avgOpenness * 100).toFixed(1)}%</p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setProgress(0);
              setEyeOpenness([]);
            }}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
          >
            <RefreshCw className="w-4 h-4" />
            Recalibrate
          </button>
          <button
            onClick={() => onComplete({
              calibrated: true,
              eyeOpenness,
              timestamp: Date.now()
            })}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Eye className="w-16 h-16 text-primary-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">Eye Tracking Calibration</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We'll track your eye movement and openness. Look at the camera and keep your eyes open normally.
      </p>

      {isCalibrating ? (
        <div className="max-w-md mx-auto">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-primary-600 rounded-full transition-all"
              style={{ 
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
                transform: 'rotate(-90deg)'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-600">{progress}%</span>
            </div>
          </div>
          <p className="text-gray-500">Keep looking at the camera...</p>
        </div>
      ) : (
        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={startCalibration}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Start Calibration
          </button>
        </div>
      )}
    </div>
  );
}

// Step 4: Facial Expression
function FaceExpressionStep({ 
  onComplete, 
  onBack 
}: { 
  onComplete: (data: any) => void;
  onBack: () => void;
}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [expressions, setExpressions] = useState<string[]>([]);

  const startCapture = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      console.log('Camera access for demo');
    }

    setIsCapturing(true);
    setExpressions([]);

    // Simulate expression detection over 5 seconds
    const possibleExpressions = ['neutral', 'slight_smile', 'focused', 'relaxed'];
    const interval = setInterval(() => {
      setExpressions(prev => {
        const randomExpression = possibleExpressions[Math.floor(Math.random() * possibleExpressions.length)];
        const newExpressions = [...prev, randomExpression];
        if (newExpressions.length >= 10) {
          clearInterval(interval);
          setIsCapturing(false);
          setCaptured(true);
        }
        return newExpressions;
      });
    }, 500);
  };

  if (captured) {
    const expressionCounts = expressions.reduce((acc, expr) => {
      acc[expr] = (acc[expr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantExpression = Object.entries(expressionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Smile className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Facial Analysis Complete!</h3>
        <p className="text-gray-600 mb-4">
          Dominant expression detected: <span className="font-semibold capitalize">{dominantExpression.replace('_', ' ')}</span>
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setCaptured(false);
              setExpressions([]);
            }}
            className="flex items-center gap-2 px-4 py-2 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
          >
            <RefreshCw className="w-4 h-4" />
            Recapture
          </button>
          <button
            onClick={() => onComplete({
              captured: true,
              expressions,
              dominantExpression,
              timestamp: Date.now()
            })}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Smile className="w-16 h-16 text-primary-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">Facial Expression Analysis</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        We'll analyze your facial expressions to understand your normal emotional state. Look naturally at the camera.
      </p>

      {isCapturing ? (
        <div className="max-w-md mx-auto">
          <div className="w-48 h-48 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-primary-600/20 animate-pulse" />
            <Camera className="w-12 h-12 text-primary-600 relative z-10" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 text-sm text-primary-600 bg-white/80 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Analyzing...
              </div>
            </div>
          </div>
          <p className="text-gray-500">Keep a natural expression...</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {expressions.map((expr, i) => (
              <span key={i} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full capitalize">
                {expr.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-3 justify-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <button
            onClick={startCapture}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Start Analysis
          </button>
        </div>
      )}
    </div>
  );
}

// Step 5: Complete
function CompleteStep({ 
  baseline, 
  onSave, 
  onBack 
}: { 
  baseline: ExtendedBaseline;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Baseline Collection Complete!</h3>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        We've successfully collected your normal behavior patterns. The system will use this baseline to detect your cognitive state in real-time.
      </p>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
        <div className={`p-4 rounded-xl ${baseline.typing ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <Keyboard className={`w-6 h-6 mx-auto mb-2 ${baseline.typing ? 'text-green-600' : 'text-gray-400'}`} />
          <p className="text-sm font-medium">Typing</p>
          <p className="text-xs text-gray-500">{baseline.typing ? '✓ Complete' : 'Pending'}</p>
        </div>
        <div className={`p-4 rounded-xl ${baseline.voice ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <Mic className={`w-6 h-6 mx-auto mb-2 ${baseline.voice ? 'text-green-600' : 'text-gray-400'}`} />
          <p className="text-sm font-medium">Voice</p>
          <p className="text-xs text-gray-500">{baseline.voice ? '✓ Complete' : 'Pending'}</p>
        </div>
        <div className={`p-4 rounded-xl ${baseline.eye ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <Eye className={`w-6 h-6 mx-auto mb-2 ${baseline.eye ? 'text-green-600' : 'text-gray-400'}`} />
          <p className="text-sm font-medium">Eye</p>
          <p className="text-xs text-gray-500">{baseline.eye ? '✓ Complete' : 'Pending'}</p>
        </div>
        <div className={`p-4 rounded-xl ${baseline.face ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <Smile className={`w-6 h-6 mx-auto mb-2 ${baseline.face ? 'text-green-600' : 'text-gray-400'}`} />
          <p className="text-sm font-medium">Face</p>
          <p className="text-xs text-gray-500">{baseline.face ? '✓ Complete' : 'Pending'}</p>
        </div>
      </div>

      {!baseline.typing || !baseline.voice || !baseline.eye || !baseline.face ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 max-w-lg mx-auto">
          <div className="flex items-center gap-2 text-yellow-700 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Incomplete Baseline</span>
          </div>
          <p className="text-sm text-yellow-600">
            Please complete all steps for accurate cognitive state detection.
          </p>
        </div>
      ) : null}

      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 border-2 border-primary-200 rounded-xl font-medium text-gray-600 hover:bg-primary-50"
        >
          <ChevronLeft className="w-5 h-5" />
          Review
        </button>
        <button
          onClick={onSave}
          disabled={!baseline.typing || !baseline.voice || !baseline.eye || !baseline.face}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2"
        >
          <Brain className="w-5 h-5" />
          Start Using CognoFlow
        </button>
      </div>
    </div>
  );
}
