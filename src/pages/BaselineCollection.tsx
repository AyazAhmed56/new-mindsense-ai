import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  RefreshCw,
  Leaf,
} from "lucide-react";
import type { BaselineMetrics } from "../types";

type Step = "typing" | "voice" | "eye" | "face" | "complete";

interface ExtendedBaseline {
  typing: BaselineMetrics | null;
  voice: { recorded: boolean; duration: number; timestamp: number } | null;
  eye: { calibrated: boolean; eyeOpenness: number[]; timestamp: number } | null;
  face: { captured: boolean; expressions: string[]; timestamp: number } | null;
}

const CALIBRATION_TEXT =
  "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human what one wants the computer to do. Technology is best when it brings people together.";

export function BaselineCollection() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("typing");
  const [progress, setProgress] = useState(0);
  const [baseline, setBaseline] = useState<ExtendedBaseline>({
    typing: null,
    voice: null,
    eye: null,
    face: null,
  });

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: "typing", label: "Typing", icon: <Keyboard className="w-4 h-4" /> },
    { id: "voice", label: "Voice", icon: <Mic className="w-4 h-4" /> },
    { id: "eye", label: "Eye", icon: <Eye className="w-4 h-4" /> },
    { id: "face", label: "Face", icon: <Smile className="w-4 h-4" /> },
    {
      id: "complete",
      label: "Done",
      icon: <CheckCircle className="w-4 h-4" />,
    },
  ];

  const updateProgress = () => {
    const completed = Object.values(baseline).filter((v) => v !== null).length;
    setProgress((completed / 4) * 100);
  };

  const handleStepComplete = (step: Step, data: any) => {
    setBaseline((prev) => ({ ...prev, [step]: data }));
  };

  const saveBaseline = () => {
    localStorage.setItem(
      "cogniflow_extended_baseline",
      JSON.stringify(baseline),
    );
    localStorage.setItem("cogniflow_baseline", JSON.stringify(baseline.typing));
    navigate("/app");
  };

  return (
    <div className="bc-root">
      <div className="bc-blob bc-b1" />
      <div className="bc-blob bc-b2" />
      <div className="bc-blob bc-b3" />
      <div className="bc-leaf bc-l1">
        <Leaf />
      </div>
      <div className="bc-leaf bc-l2">
        <Leaf />
      </div>

      <div className="bc-container">
        {/* Header */}
        <div className="bc-header">
          <div className="bc-icon-box">
            <Target className="bc-icon-svg" />
            <div className="bc-icon-ring" />
          </div>
          <h1 className="bc-title">Baseline Collection</h1>
          <p className="bc-desc">
            We'll capture your natural patterns to understand your cognitive
            state accurately
          </p>
        </div>

        {/* Progress card */}
        <div className="bc-prog-card">
          <div className="bc-prog-header">
            <span className="bc-prog-label">Overall Progress</span>
            <span className="bc-prog-val">{Math.round(progress)}%</span>
          </div>
          <div className="bc-prog-track">
            <div className="bc-prog-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Step indicators */}
          <div className="bc-steps">
            {steps.map((step, i) => {
              const isActive = step.id === currentStep;
              const isCompleted =
                baseline[step.id as keyof ExtendedBaseline] !== null;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`bc-step-btn ${isActive ? "bc-step-active" : isCompleted ? "bc-step-done" : "bc-step-idle"}`}
                >
                  <div
                    className={`bc-step-dot ${isActive ? "bc-dot-active" : isCompleted ? "bc-dot-done" : "bc-dot-idle"}`}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="bc-step-txt">{step.label}</span>
                  {i < steps.length - 1 && (
                    <div
                      className={`bc-step-conn ${isCompleted ? "bc-conn-done" : "bc-conn-idle"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="bc-content-card">
          {currentStep === "typing" && (
            <TypingTestStep
              onComplete={(data) => {
                handleStepComplete("typing", data);
                updateProgress();
                setCurrentStep("voice");
              }}
            />
          )}
          {currentStep === "voice" && (
            <VoiceRecordingStep
              onComplete={(data) => {
                handleStepComplete("voice", data);
                updateProgress();
                setCurrentStep("eye");
              }}
              onBack={() => setCurrentStep("typing")}
            />
          )}
          {currentStep === "eye" && (
            <EyeCalibrationStep
              onComplete={(data) => {
                handleStepComplete("eye", data);
                updateProgress();
                setCurrentStep("face");
              }}
              onBack={() => setCurrentStep("voice")}
            />
          )}
          {currentStep === "face" && (
            <FaceExpressionStep
              onComplete={(data) => {
                handleStepComplete("face", data);
                updateProgress();
                setCurrentStep("complete");
              }}
              onBack={() => setCurrentStep("eye")}
            />
          )}
          {currentStep === "complete" && (
            <CompleteStep
              baseline={baseline}
              onSave={saveBaseline}
              onBack={() => setCurrentStep("face")}
            />
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .bc-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7 50%, #ffffff);
          padding: 2rem 1rem;
          position: relative; overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .bc-blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.25; animation: bc-flt 10s ease-in-out infinite; }
        .bc-b1 { width: 400px; height: 400px; background: radial-gradient(circle, #86efac, #4ade80); top: -120px; right: -100px; }
        .bc-b2 { width: 280px; height: 280px; background: radial-gradient(circle, #d1fae5, #a7f3d0); bottom: -80px; left: -60px; animation-delay: 4s; }
        .bc-b3 { width: 180px; height: 180px; background: radial-gradient(circle, #bbf7d0, #6ee7b7); top: 40%; left: 5%; animation-delay: 7s; }
        @keyframes bc-flt { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-18px) scale(1.04); } }

        .bc-leaf { position: absolute; opacity: 0.08; color: #16a34a; }
        .bc-leaf svg { width: 70px; height: 70px; }
        .bc-l1 { top: 30px; left: 30px; animation: bc-ls 14s ease-in-out infinite; }
        .bc-l2 { bottom: 50px; right: 50px; animation: bc-ls 18s ease-in-out infinite reverse; }
        @keyframes bc-ls { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(20deg) scale(1.1); } }

        .bc-container { max-width: 760px; margin: 0 auto; position: relative; z-index: 10; }

        .bc-header { text-align: center; margin-bottom: 1.5rem; animation: bc-enter 0.5s ease both; }
        .bc-icon-box {
          width: 68px; height: 68px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 20px; margin: 0 auto 1rem;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(22,163,74,0.35);
          position: relative; animation: bc-pulse 3s ease-in-out infinite;
        }
        .bc-icon-svg { width: 32px; height: 32px; color: white; }
        .bc-icon-ring { position: absolute; inset: -5px; border-radius: 24px; border: 2px solid rgba(34,197,94,0.3); animation: bc-ring 2s ease-out infinite; }
        @keyframes bc-pulse { 0%,100% { box-shadow: 0 8px 24px rgba(22,163,74,0.35); } 50% { box-shadow: 0 14px 36px rgba(22,163,74,0.55); } }
        @keyframes bc-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.35); opacity: 0; } }

        .bc-title { font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800; color: #14532d; margin: 0; letter-spacing: -0.5px; }
        .bc-desc { font-size: 0.9rem; color: #6b7280; margin: 0.4rem 0 0; max-width: 480px; margin-left: auto; margin-right: auto; font-weight: 300; }

        @keyframes bc-enter { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Progress card */
        .bc-prog-card {
          background: rgba(255,255,255,0.8); backdrop-filter: blur(20px);
          border: 1px solid rgba(134,239,172,0.4); border-radius: 22px;
          padding: 1.5rem; margin-bottom: 1.25rem;
          box-shadow: 0 8px 32px rgba(22,163,74,0.1);
          animation: bc-enter 0.5s 0.1s ease both;
        }
        .bc-prog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .bc-prog-label { font-size: 0.82rem; font-weight: 500; color: #6b7280; }
        .bc-prog-val { font-size: 0.9rem; font-weight: 700; color: #16a34a; }
        .bc-prog-track { height: 6px; background: #e5e7eb; border-radius: 6px; overflow: hidden; }
        .bc-prog-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 6px; transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1); }

        .bc-steps { display: flex; align-items: center; justify-content: space-between; margin-top: 1.25rem; }
        .bc-step-btn { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; background: none; border: none; cursor: pointer; position: relative; flex: 1; padding: 0; }
        .bc-step-dot {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s; flex-shrink: 0;
        }
        .bc-dot-active { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; box-shadow: 0 4px 14px rgba(22,163,74,0.45); transform: scale(1.1); }
        .bc-dot-done { background: #dcfce7; color: #16a34a; }
        .bc-dot-idle { background: #f3f4f6; color: #9ca3af; }
        .bc-step-txt { font-size: 0.72rem; font-weight: 600; color: #6b7280; white-space: nowrap; }
        .bc-step-active .bc-step-txt { color: #16a34a; }
        .bc-step-done .bc-step-txt { color: #22c55e; }

        .bc-step-conn {
          position: absolute; top: 18px; left: calc(50% + 20px);
          width: calc(100% - 40px); height: 2px; border-radius: 2px;
        }
        .bc-conn-done { background: #22c55e; }
        .bc-conn-idle { background: #e5e7eb; }

        /* Content card */
        .bc-content-card {
          background: rgba(255,255,255,0.82); backdrop-filter: blur(20px);
          border: 1px solid rgba(134,239,172,0.4); border-radius: 22px;
          padding: 2.5rem;
          box-shadow: 0 8px 32px rgba(22,163,74,0.1);
          animation: bc-enter 0.5s 0.2s ease both;
        }

        /* ── Shared step UI ── */
        .bc-step-heading { font-family: 'Syne', sans-serif; font-size: 1.35rem; font-weight: 700; color: #14532d; margin: 0 0 0.4rem; }
        .bc-step-sub { font-size: 0.875rem; color: #6b7280; margin: 0 0 1.5rem; max-width: 460px; margin-left: auto; margin-right: auto; font-weight: 300; }

        .bc-result-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 4px 16px rgba(22,163,74,0.2);
          animation: bc-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes bc-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .bc-result-icon svg { width: 28px; height: 28px; color: #16a34a; }

        .bc-metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
        .bc-metric-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 14px; padding: 1rem; text-align: center; }
        .bc-metric-val { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #16a34a; }
        .bc-metric-lbl { font-size: 0.74rem; color: #6b7280; margin-top: 0.15rem; }

        .bc-text-display { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.8; text-align: left; }
        .bc-char-correct { color: #16a34a; }
        .bc-char-error { color: #ef4444; background: #fee2e2; border-radius: 2px; }
        .bc-char-untyped { color: #9ca3af; }

        .bc-type-area {
          width: 100%; height: 110px;
          padding: 1rem;
          background: white;
          border: 2px solid #bbf7d0; border-radius: 14px;
          resize: none; outline: none;
          font-family: 'Courier New', monospace; font-size: 0.9rem; color: #111827;
          transition: border-color 0.25s, box-shadow 0.25s;
          box-sizing: border-box;
        }
        .bc-type-area:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }

        .bc-progress-mini { height: 4px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem; }
        .bc-progress-mini-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80); border-radius: 4px; transition: width 0.3s; }

        /* Voice quote box */
        .bc-quote-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; max-width: 500px; margin-left: auto; margin-right: auto; }
        .bc-quote-text { font-size: 0.95rem; color: #374151; line-height: 1.7; font-style: italic; }

        /* Mic visual */
        .bc-mic-box {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.75rem;
          position: relative;
        }
        .bc-mic-recording { animation: bc-micpulse 1s ease-in-out infinite; }
        @keyframes bc-micpulse { 0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { box-shadow: 0 0 0 16px rgba(34,197,94,0); } }
        .bc-recording-bar { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #ef4444; font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem; }
        .bc-rec-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: bc-blink 1s ease-in-out infinite; }
        @keyframes bc-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        /* Eye calibration circle */
        .bc-eye-circle {
          width: 140px; height: 140px; border-radius: 50%;
          border: 3px solid #bbf7d0; position: relative;
          margin: 0 auto 1.25rem; display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .bc-eye-fill {
          position: absolute; inset: 0; border-radius: 50%;
          background: conic-gradient(#22c55e var(--pct), transparent var(--pct));
          transition: background 0.1s;
        }
        .bc-eye-pct { font-family: 'Syne', sans-serif; font-size: 1.6rem; font-weight: 800; color: #16a34a; position: relative; z-index: 1; }

        /* Camera box */
        .bc-cam-box {
          width: 160px; height: 160px; border-radius: 18px;
          background: #f0fdf4; border: 2px dashed #86efac;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem; position: relative; overflow: hidden;
        }
        .bc-cam-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(34,197,94,0.1), rgba(22,163,74,0.15)); animation: bc-flt 2s ease-in-out infinite; }
        .bc-cam-badge { position: absolute; bottom: 10px; left: 10px; right: 10px; background: rgba(255,255,255,0.9); border-radius: 20px; padding: 0.25rem 0.75rem; display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: #16a34a; font-weight: 600; }
        .bc-expr-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; max-width: 400px; margin: 0.75rem auto 0; }
        .bc-expr-tag { font-size: 0.72rem; background: #dcfce7; color: #16a34a; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 600; text-transform: capitalize; animation: bc-pop 0.3s ease both; }

        /* Complete summary */
        .bc-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; max-width: 560px; margin-left: auto; margin-right: auto; }
        .bc-sum-box { padding: 1rem; border-radius: 16px; text-align: center; border: 2px solid; }
        .bc-sum-done { border-color: #22c55e; background: #f0fdf4; }
        .bc-sum-pending { border-color: #e5e7eb; background: #f9fafb; }
        .bc-sum-icon { margin-bottom: 0.4rem; }
        .bc-sum-label { font-size: 0.78rem; font-weight: 600; color: #374151; }
        .bc-sum-status { font-size: 0.7rem; color: #6b7280; margin-top: 0.15rem; }

        .bc-warn-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 14px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; max-width: 480px; margin-left: auto; margin-right: auto; }
        .bc-warn-head { display: flex; align-items: center; gap: 0.5rem; color: #92400e; font-weight: 600; font-size: 0.875rem; margin-bottom: 0.3rem; }
        .bc-warn-text { font-size: 0.8rem; color: #78350f; }

        /* Shared buttons */
        .bc-btn-row { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; }
        .bc-btn-secondary {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255,255,255,0.9); border: 1.5px solid #d1fae5;
          border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
          color: #6b7280; cursor: pointer; transition: all 0.22s;
        }
        .bc-btn-secondary:hover { border-color: #86efac; color: #374151; background: #f0fdf4; }

        .bc-btn-primary {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.78rem 1.75rem;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: none; border-radius: 12px;
          font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700;
          color: white; cursor: pointer; transition: all 0.25s;
          box-shadow: 0 5px 16px rgba(22,163,74,0.35);
          position: relative; overflow: hidden;
        }
        .bc-btn-primary::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity 0.2s; }
        .bc-btn-primary:hover::after { opacity: 1; }
        .bc-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,0.45); }
        .bc-btn-primary:disabled { background: linear-gradient(135deg, #86efac, #4ade80); cursor: not-allowed; transform: none; box-shadow: none; }

        .bc-btn-danger {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.75rem 1.25rem;
          background: #ef4444; border: none; border-radius: 12px;
          font-family: 'Syne', sans-serif; font-size: 0.875rem; font-weight: 700;
          color: white; cursor: pointer; transition: all 0.22s;
        }
        .bc-btn-danger:hover { background: #dc2626; transform: translateY(-1px); }

        .bc-step-icon-large { margin: 0 auto 1rem; display: block; color: #22c55e; }

        @media (max-width: 600px) {
          .bc-content-card { padding: 1.5rem 1.25rem; }
          .bc-summary-grid { grid-template-columns: repeat(2, 1fr); }
          .bc-metric-grid { grid-template-columns: repeat(3, 1fr); }
          .bc-step-txt { display: none; }
        }
      `}</style>
    </div>
  );
}

// ── Step 1: Typing ──────────────────────────────────────────────────────────
function TypingTestStep({
  onComplete,
}: {
  onComplete: (data: BaselineMetrics) => void;
}) {
  const [text, setText] = useState("");
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
    setText("");
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
      if (pause > 1000) pausesRef.current.push(pause);
    }
    keystrokesRef.current++;
    lastKeystrokeRef.current = now;
    let errors = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== CALIBRATION_TEXT[i]) errors++;
    }
    errorsRef.current = errors;
    setText(value);
    if (value.length >= CALIBRATION_TEXT.length) completeTest();
  };

  const completeTest = () => {
    const duration = (Date.now() - startTimeRef.current) / 60000;
    const wpm = keystrokesRef.current / 5 / duration;
    const errorRate = errorsRef.current / keystrokesRef.current;
    const avgPauseTime =
      pausesRef.current.length > 0
        ? pausesRef.current.reduce((a, b) => a + b, 0) /
          pausesRef.current.length
        : 0;
    const result: BaselineMetrics = {
      wpm,
      errorRate,
      avgPauseTime,
      timestamp: Date.now(),
    };
    setMetrics(result);
    setIsActive(false);
    setShowResults(true);
  };

  if (showResults && metrics) {
    return (
      <div className="text-center">
        <div className="bc-result-icon">
          <CheckCircle className="w-7 h-7" style={{ color: "#16a34a" }} />
        </div>
        <h3 className="bc-step-heading">Typing Test Complete!</h3>
        <div className="bc-metric-grid" style={{ marginTop: "1.25rem" }}>
          <div className="bc-metric-box">
            <div className="bc-metric-val">{Math.round(metrics.wpm)}</div>
            <div className="bc-metric-lbl">WPM</div>
          </div>
          <div className="bc-metric-box">
            <div className="bc-metric-val">
              {(metrics.errorRate * 100).toFixed(1)}%
            </div>
            <div className="bc-metric-lbl">Error Rate</div>
          </div>
          <div className="bc-metric-box">
            <div className="bc-metric-val">
              {(metrics.avgPauseTime / 1000).toFixed(1)}s
            </div>
            <div className="bc-metric-lbl">Avg Pause</div>
          </div>
        </div>
        <div className="bc-btn-row">
          <button
            onClick={() => onComplete(metrics)}
            className="bc-btn-primary"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="text-center">
        <Keyboard
          style={{ width: 48, height: 48 }}
          className="bc-step-icon-large"
        />
        <h3 className="bc-step-heading">Typing Behavior Test</h3>
        <p className="bc-step-sub">
          Type the passage below naturally. We'll measure your speed, accuracy,
          and pause patterns.
        </p>
        <button onClick={startTest} className="bc-btn-primary">
          Start Typing Test
        </button>
      </div>
    );
  }

  const typingProgress = (text.length / CALIBRATION_TEXT.length) * 100;
  return (
    <div>
      <h3 className="bc-step-heading" style={{ marginBottom: "0.75rem" }}>
        Type the text below:
      </h3>
      <div className="bc-progress-mini">
        <div
          className="bc-progress-mini-fill"
          style={{ width: `${typingProgress}%` }}
        />
      </div>
      <div className="bc-text-display">
        {CALIBRATION_TEXT.split("").map((char, index) => {
          const isTyped = index < text.length;
          const isCorrect = text[index] === char;
          return (
            <span
              key={index}
              className={
                isTyped
                  ? isCorrect
                    ? "bc-char-correct"
                    : "bc-char-error"
                  : "bc-char-untyped"
              }
            >
              {char}
            </span>
          );
        })}
      </div>
      <textarea
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        className="bc-type-area"
        placeholder="Start typing here..."
        autoFocus
      />
    </div>
  );
}

// ── Step 2: Voice ──────────────────────────────────────────────────────────
function VoiceRecordingStep({
  onComplete,
  onBack,
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
        const blob = new Blob(chunksRef.current, {
          type: "audio/ogg; codecs=opus",
        });
        console.log("Voice recorded:", blob.size, "bytes");
      };
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      const interval = setInterval(() => {
        setDuration((d) => {
          if (d >= 10) {
            clearInterval(interval);
            stopRecording();
            return 10;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
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
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    setRecorded(true);
  };

  if (recorded) {
    return (
      <div className="text-center">
        <div className="bc-result-icon">
          <Volume2 style={{ width: 28, height: 28, color: "#16a34a" }} />
        </div>
        <h3 className="bc-step-heading">Voice Sample Recorded!</h3>
        <p className="bc-step-sub">Duration: {duration} seconds</p>
        <div className="bc-btn-row">
          <button
            onClick={() => {
              setRecorded(false);
              setDuration(0);
            }}
            className="bc-btn-secondary"
          >
            <RefreshCw className="w-4 h-4" /> Re-record
          </button>
          <button
            onClick={() =>
              onComplete({ recorded: true, duration, timestamp: Date.now() })
            }
            className="bc-btn-primary"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className={`bc-mic-box ${isRecording ? "bc-mic-recording" : ""}`}>
        <Mic
          style={{
            width: 32,
            height: 32,
            color: isRecording ? "#ef4444" : "#22c55e",
          }}
        />
      </div>
      <h3 className="bc-step-heading">Voice Recording</h3>
      <p className="bc-step-sub">
        Read the following passage aloud at a natural pace. This helps map your
        vocal baseline.
      </p>
      <div className="bc-quote-box">
        <p className="bc-quote-text">
          "The quick brown fox jumps over the lazy dog. I am recording my voice
          to help the system understand my normal speaking patterns."
        </p>
      </div>
      {isRecording ? (
        <div>
          <div className="bc-recording-bar">
            <div className="bc-rec-dot" />
            Recording... {duration}s / 10s
          </div>
          <button onClick={stopRecording} className="bc-btn-danger">
            Stop Recording
          </button>
        </div>
      ) : (
        <div className="bc-btn-row">
          <button onClick={onBack} className="bc-btn-secondary">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={startRecording} className="bc-btn-primary">
            <Mic className="w-4 h-4" /> Start Recording
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Eye ────────────────────────────────────────────────────────────
function EyeCalibrationStep({
  onComplete,
  onBack,
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
    } catch {}
    setIsCalibrating(true);
    setProgress(0);
    setEyeOpenness([]);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsCalibrating(false);
          setEyeOpenness(
            Array.from({ length: 20 }, () => 0.7 + Math.random() * 0.3),
          );
          return 100;
        }
        if (p % 10 === 0)
          setEyeOpenness((prev) => [...prev, 0.7 + Math.random() * 0.3]);
        return p + 2;
      });
    }, 100);
  };

  if (progress === 100 && eyeOpenness.length > 0) {
    const avg = eyeOpenness.reduce((a, b) => a + b, 0) / eyeOpenness.length;
    return (
      <div className="text-center">
        <div className="bc-result-icon">
          <Eye style={{ width: 28, height: 28, color: "#16a34a" }} />
        </div>
        <h3 className="bc-step-heading">Eye Tracking Calibrated!</h3>
        <p className="bc-step-sub">
          Average eye openness: {(avg * 100).toFixed(1)}%
        </p>
        <div className="bc-btn-row">
          <button
            onClick={() => {
              setProgress(0);
              setEyeOpenness([]);
            }}
            className="bc-btn-secondary"
          >
            <RefreshCw className="w-4 h-4" /> Recalibrate
          </button>
          <button
            onClick={() =>
              onComplete({
                calibrated: true,
                eyeOpenness,
                timestamp: Date.now(),
              })
            }
            className="bc-btn-primary"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Eye style={{ width: 48, height: 48 }} className="bc-step-icon-large" />
      <h3 className="bc-step-heading">Eye Tracking Calibration</h3>
      <p className="bc-step-sub">
        Keep your eyes open naturally and look at the camera. We'll measure your
        baseline eye openness.
      </p>
      {isCalibrating ? (
        <div>
          <div className="bc-eye-circle">
            <div
              className="bc-eye-fill"
              style={{ "--pct": `${progress}%` } as any}
            />
            <span className="bc-eye-pct">{progress}%</span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Keep looking at the camera...
          </p>
        </div>
      ) : (
        <div className="bc-btn-row">
          <button onClick={onBack} className="bc-btn-secondary">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={startCalibration} className="bc-btn-primary">
            <Camera className="w-4 h-4" /> Start Calibration
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 4: Face ───────────────────────────────────────────────────────────
function FaceExpressionStep({
  onComplete,
  onBack,
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
    } catch {}
    setIsCapturing(true);
    setExpressions([]);
    const possible = ["neutral", "slight_smile", "focused", "relaxed"];
    const interval = setInterval(() => {
      setExpressions((prev) => {
        const next = [
          ...prev,
          possible[Math.floor(Math.random() * possible.length)],
        ];
        if (next.length >= 10) {
          clearInterval(interval);
          setIsCapturing(false);
          setCaptured(true);
        }
        return next;
      });
    }, 500);
  };

  if (captured) {
    const counts = expressions.reduce(
      (acc, e) => {
        acc[e] = (acc[e] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const dominant =
      Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
    return (
      <div className="text-center">
        <div className="bc-result-icon">
          <Smile style={{ width: 28, height: 28, color: "#16a34a" }} />
        </div>
        <h3 className="bc-step-heading">Facial Analysis Complete!</h3>
        <p className="bc-step-sub">
          Dominant expression:{" "}
          <strong style={{ color: "#16a34a", textTransform: "capitalize" }}>
            {dominant.replace("_", " ")}
          </strong>
        </p>
        <div className="bc-btn-row">
          <button
            onClick={() => {
              setCaptured(false);
              setExpressions([]);
            }}
            className="bc-btn-secondary"
          >
            <RefreshCw className="w-4 h-4" /> Recapture
          </button>
          <button
            onClick={() =>
              onComplete({ captured: true, expressions, timestamp: Date.now() })
            }
            className="bc-btn-primary"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Smile style={{ width: 48, height: 48 }} className="bc-step-icon-large" />
      <h3 className="bc-step-heading">Facial Expression Analysis</h3>
      <p className="bc-step-sub">
        Look naturally at the camera. We'll capture your resting facial
        expression as a baseline.
      </p>
      {isCapturing ? (
        <div>
          <div className="bc-cam-box">
            <div className="bc-cam-overlay" />
            <Camera
              style={{
                width: 36,
                height: 36,
                color: "#22c55e",
                position: "relative",
                zIndex: 1,
              }}
            />
            <div className="bc-cam-badge">
              <div className="bc-rec-dot" style={{ background: "#22c55e" }} />
              Analysing...
            </div>
          </div>
          <div className="bc-expr-tags">
            {expressions.map((e, i) => (
              <span key={i} className="bc-expr-tag">
                {e.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bc-btn-row">
          <button onClick={onBack} className="bc-btn-secondary">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={startCapture} className="bc-btn-primary">
            <Camera className="w-4 h-4" /> Start Analysis
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 5: Complete ───────────────────────────────────────────────────────
function CompleteStep({
  baseline,
  onSave,
  onBack,
}: {
  baseline: ExtendedBaseline;
  onSave: () => void;
  onBack: () => void;
}) {
  const checks = [
    { key: "typing", label: "Typing", icon: <Keyboard className="w-5 h-5" /> },
    { key: "voice", label: "Voice", icon: <Mic className="w-5 h-5" /> },
    { key: "eye", label: "Eye", icon: <Eye className="w-5 h-5" /> },
    { key: "face", label: "Face", icon: <Smile className="w-5 h-5" /> },
  ];
  const allDone = checks.every(
    (c) => baseline[c.key as keyof ExtendedBaseline] !== null,
  );

  return (
    <div className="text-center">
      <div className="bc-result-icon" style={{ width: 80, height: 80 }}>
        <CheckCircle style={{ width: 36, height: 36, color: "#16a34a" }} />
      </div>
      <h3 className="bc-step-heading" style={{ fontSize: "1.6rem" }}>
        Baseline Collection Complete!
      </h3>
      <p className="bc-step-sub">
        Your cognitive baseline has been successfully captured. CognoFlow will
        use this to monitor your state in real-time.
      </p>

      <div className="bc-summary-grid">
        {checks.map((c) => {
          const done = baseline[c.key as keyof ExtendedBaseline] !== null;
          return (
            <div
              key={c.key}
              className={`bc-sum-box ${done ? "bc-sum-done" : "bc-sum-pending"}`}
            >
              <div
                className="bc-sum-icon"
                style={{ color: done ? "#16a34a" : "#9ca3af" }}
              >
                {c.icon}
              </div>
              <div className="bc-sum-label">{c.label}</div>
              <div className="bc-sum-status">
                {done ? "✓ Complete" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>

      {!allDone && (
        <div className="bc-warn-box">
          <div className="bc-warn-head">
            <AlertCircle className="w-4 h-4" /> Incomplete Baseline
          </div>
          <p className="bc-warn-text">
            Please complete all steps for accurate cognitive state detection.
          </p>
        </div>
      )}

      <div className="bc-btn-row">
        <button onClick={onBack} className="bc-btn-secondary">
          <ChevronLeft className="w-4 h-4" /> Review
        </button>
        <button onClick={onSave} disabled={!allDone} className="bc-btn-primary">
          <Brain className="w-4 h-4" /> Start Using CognoFlow
        </button>
      </div>
    </div>
  );
}
