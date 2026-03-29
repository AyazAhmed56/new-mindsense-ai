import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Activity,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
  Camera,
  Eye,
  Leaf,
} from "lucide-react";
import { MultiModalMoodDetector } from "./MultiModalMoodDetector";
import { generateAIResponse } from "../lib/openrouter";
import { supabase } from "../lib/supabase";

type CognitiveState = "fatigue" | "confused" | "focus";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  adaptedFor?: CognitiveState;
  timestamp: number;
}

interface TypingSnapshot {
  charsTyped: number;
  backspaces: number;
  corrections: number;
  totalPauseMs: number;
  longPauses: number;
  keystrokeCount: number;
  startedAt: number | null;
  lastKeyAt: number | null;
  currentWpm: number;
  errorRate: number;
}

interface ChatAssistantProps {
  cognitiveState?: CognitiveState;
  confidence?: number;
}

const INITIAL_TYPING: TypingSnapshot = {
  charsTyped: 0,
  backspaces: 0,
  corrections: 0,
  totalPauseMs: 0,
  longPauses: 0,
  keystrokeCount: 0,
  startedAt: null,
  lastKeyAt: null,
  currentWpm: 0,
  errorRate: 0,
};

function getPlaceholderText(state: CognitiveState): string {
  if (state === "fatigue") return "Ask something... short replies mode";
  if (state === "confused") return "Ask something... step-by-step mode";
  return "Ask anything... deep answer mode";
}

function getStateBadge(state: CognitiveState) {
  switch (state) {
    case "fatigue":
      return {
        text: "Simple Mode",
        icon: "💤",
        color: "ca-badge-fatigue",
      };
    case "confused":
      return {
        text: "Guided Mode",
        icon: "🎯",
        color: "ca-badge-confused",
      };
    case "focus":
    default:
      return {
        text: "Advanced Mode",
        icon: "⚡",
        color: "ca-badge-focus",
      };
  }
}

function getWelcomeMessage(state: CognitiveState): string {
  switch (state) {
    case "fatigue":
      return "Hi! I can see you're tired. I'll keep my answers short and simple. 💤";
    case "confused":
      return "Hi! I'm here to help. I'll explain things step by step so it's easy to follow. 🎯";
    case "focus":
    default:
      return "Hello! I'm ready to help with detailed, thoughtful answers. What would you like to explore? ⚡";
  }
}

function detectCognitiveState(metrics: TypingSnapshot): {
  state: CognitiveState;
  confidence: number;
} {
  const wpm = metrics.currentWpm;
  const errorRate = metrics.errorRate;
  const longPauses = metrics.longPauses;
  const corrections = metrics.corrections;

  let fatigueScore = 0;
  let confusedScore = 0;
  let focusScore = 0;

  if (wpm < 18) fatigueScore += 3;
  else if (wpm < 28) fatigueScore += 2;
  if (longPauses >= 3) fatigueScore += 2;
  if (metrics.totalPauseMs > 5000) fatigueScore += 2;
  if (metrics.keystrokeCount > 0 && metrics.charsTyped < 15) fatigueScore += 1;

  if (errorRate >= 0.18) confusedScore += 3;
  else if (errorRate >= 0.1) confusedScore += 2;
  if (corrections >= 3) confusedScore += 2;
  if (metrics.backspaces >= 5) confusedScore += 2;
  if (longPauses >= 2) confusedScore += 1;

  if (wpm >= 30) focusScore += 3;
  else if (wpm >= 22) focusScore += 2;
  if (errorRate < 0.08) focusScore += 2;
  if (metrics.charsTyped >= 25) focusScore += 2;
  if (longPauses <= 1) focusScore += 1;

  const scored = [
    { state: "fatigue" as CognitiveState, score: fatigueScore },
    { state: "confused" as CognitiveState, score: confusedScore },
    { state: "focus" as CognitiveState, score: focusScore },
  ].sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  const margin = Math.max(best.score - second.score, 1);
  const confidence = Math.min(0.95, 0.55 + margin * 0.12);

  return { state: best.state, confidence };
}

export default function ChatAssistant({
  cognitiveState = "focus",
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTypingReply, setIsTypingReply] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingMetrics, setTypingMetrics] =
    useState<TypingSnapshot>(INITIAL_TYPING);
  const [detectedState, setDetectedState] =
    useState<CognitiveState>(cognitiveState);
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0.6);
  const [multiModalEnabled, setMultiModalEnabled] = useState(false);
  const [lastMultiModalState, setLastMultiModalState] =
    useState<CognitiveState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("anonymous");
  const [apiStatus, setApiStatus] = useState<"online" | "offline">("online");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const effectiveState = useMemo(() => {
    if (input.trim().length < 6) return cognitiveState;
    return detectedState;
  }, [input, cognitiveState, detectedState]);

  const badge = getStateBadge(effectiveState);

  useEffect(() => {
    const storedUserId = localStorage.getItem("cogniflow_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("cogniflow_user_id", newUserId);
      setUserId(newUserId);
    }
  }, []);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: getWelcomeMessage(cognitiveState),
        adaptedFor: cognitiveState,
        timestamp: Date.now(),
      },
    ]);
  }, [cognitiveState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTypingReply]);

  const handleMultiModalMood = useCallback(
    (mood: {
      typing: CognitiveState;
      visual: string | null;
      audio: string | null;
      combined: CognitiveState;
      confidence: number;
    }) => {
      if (mood.confidence > 0.7 && mood.combined !== lastMultiModalState) {
        setLastMultiModalState(mood.combined);
        setDetectedState(mood.combined);
        setDetectedConfidence(mood.confidence);
      }
    },
    [lastMultiModalState],
  );

  const resetTypingMetrics = () => setTypingMetrics(INITIAL_TYPING);

  const handleInputChange = (value: string) => {
    const now = Date.now();
    setTypingMetrics((prev) => {
      const startedAt = prev.startedAt ?? now;
      const lastKeyAt = prev.lastKeyAt ?? now;
      const delta = now - lastKeyAt;
      const isLongPause = delta > 1200;
      const prevLength = input.length;
      const nextLength = value.length;

      let charsTyped = prev.charsTyped;
      let backspaces = prev.backspaces;
      let corrections = prev.corrections;

      if (nextLength > prevLength) charsTyped += nextLength - prevLength;
      else if (nextLength < prevLength) {
        backspaces += prevLength - nextLength;
        corrections += 1;
      }

      const minutes = Math.max((now - startedAt) / 60000, 1 / 60);
      const currentWpm = charsTyped > 0 ? charsTyped / 5 / minutes : 0;
      const totalActions = Math.max(charsTyped + backspaces, 1);
      const errorRate = (backspaces + corrections) / totalActions;

      return {
        charsTyped,
        backspaces,
        corrections,
        totalPauseMs: prev.totalPauseMs + (isLongPause ? delta : 0),
        longPauses: prev.longPauses + (isLongPause ? 1 : 0),
        keystrokeCount: prev.keystrokeCount + 1,
        startedAt,
        lastKeyAt: now,
        currentWpm,
        errorRate,
      };
    });
    setInput(value);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTypingReply) return;

    setError(null);
    const stateForReply =
      text.length >= 6 && typingMetrics.keystrokeCount >= 5
        ? detectCognitiveState(typingMetrics).state
        : cognitiveState;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      adaptedFor: stateForReply,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTypingReply(true);

    try {
      const chatHistory = messages
        .slice(-10)
        .map((msg) => ({ role: msg.role, content: msg.content }));
      const aiResponse = await generateAIResponse(
        text,
        stateForReply,
        chatHistory,
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        adaptedFor: stateForReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setApiStatus("online");

      supabase
        .from("chat_messages")
        .insert([
          {
            user_id: userId,
            role: "user",
            content: text,
            cognitive_state: stateForReply,
            confidence: detectedConfidence,
          },
          {
            user_id: userId,
            role: "assistant",
            content: aiResponse,
            cognitive_state: stateForReply,
            confidence: detectedConfidence,
          },
        ])
        .then(({ error }) => {
          if (error) console.error("Error saving chat:", error);
        });
    } catch (err) {
      console.error("Error generating response:", err);
      setApiStatus("offline");
      setError("AI API offline - using fallback responses");
    } finally {
      setIsTypingReply(false);
      resetTypingMetrics();
      setDetectedState(stateForReply);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: getWelcomeMessage(cognitiveState),
        adaptedFor: cognitiveState,
        timestamp: Date.now(),
      },
    ]);
    setInput("");
    resetTypingMetrics();
    setDetectedState(cognitiveState);
    setDetectedConfidence(0.6);
    setError(null);
  };

  const startVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setInput((prev) =>
        prev
          ? `${prev} [Voice not supported]`
          : "[Voice input requires a modern browser]",
      );
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  /* ── State-specific accent colors ── */
  const stateAccent = {
    fatigue: {
      grad: "linear-gradient(135deg, #f97316, #dc2626)",
      ring: "rgba(249,115,22,0.3)",
      dot: "#f97316",
    },
    confused: {
      grad: "linear-gradient(135deg, #eab308, #f97316)",
      ring: "rgba(234,179,8,0.3)",
      dot: "#eab308",
    },
    focus: {
      grad: "linear-gradient(135deg, #22c55e, #16a34a)",
      ring: "rgba(34,197,94,0.3)",
      dot: "#22c55e",
    },
  }[effectiveState];

  return (
    <div className="ca-root">
      {/* Decorative background */}
      <div className="ca-bg-blob ca-bg-1" />
      <div className="ca-bg-blob ca-bg-2" />
      <div className="ca-leaf ca-leaf-1">
        <Leaf />
      </div>
      <div className="ca-leaf ca-leaf-2">
        <Leaf />
      </div>

      <div className="ca-shell">
        {multiModalEnabled && (
          <MultiModalMoodDetector
            onMoodDetected={handleMultiModalMood}
            enabled={multiModalEnabled}
          />
        )}

        {/* ── Header ── */}
        <div className="ca-header">
          <div className="ca-header-shimmer" />
          <div className="ca-header-body">
            <div className="ca-header-left">
              <div
                className="ca-avatar"
                style={{ background: stateAccent.grad }}
              >
                <Sparkles className="ca-avatar-icon" />
                <div
                  className="ca-avatar-ring"
                  style={{ borderColor: stateAccent.ring }}
                />
              </div>
              <div>
                <h2 className="ca-title">Adaptive Chatbot</h2>
                <div className={`ca-badge ${badge.color}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                  <span className="ca-badge-conf">
                    ({Math.round(detectedConfidence * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="ca-header-right">
              {apiStatus === "offline" && (
                <span className="ca-offline-tag">Fallback Mode</span>
              )}

              {/* Metrics pill */}
              <div className="ca-metrics-pill">
                <Activity className="ca-metrics-ico" />
                <span>WPM: {Math.round(typingMetrics.currentWpm)}</span>
                <span className="ca-metrics-sep">·</span>
                <span>Err: {(typingMetrics.errorRate * 100).toFixed(0)}%</span>
                <span className="ca-metrics-sep">·</span>
                <span>⏸ {typingMetrics.longPauses}</span>
                {multiModalEnabled && (
                  <>
                    <span className="ca-metrics-sep">·</span>
                    <Eye
                      className="ca-metrics-ico"
                      style={{ color: "#22c55e" }}
                    />
                    <span style={{ color: "#22c55e" }}>MM</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setMultiModalEnabled(!multiModalEnabled)}
                className={`ca-icon-btn ${multiModalEnabled ? "ca-icon-btn-active" : ""}`}
                title="Toggle multi-modal detection"
                type="button"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={clearChat}
                className="ca-icon-btn"
                title="Clear chat"
                type="button"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="ca-messages">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`ca-msg-row ${msg.role === "user" ? "ca-msg-row-user" : "ca-msg-row-ai"}`}
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              {msg.role === "assistant" && (
                <div
                  className="ca-ai-dot"
                  style={{ background: stateAccent.dot }}
                />
              )}

              <div
                className={`ca-bubble ${msg.role === "user" ? "ca-bubble-user" : "ca-bubble-ai"}`}
                style={
                  msg.role === "user" ? { background: stateAccent.grad } : {}
                }
              >
                {msg.role === "assistant" && msg.adaptedFor && (
                  <div
                    className={`ca-msg-badge ${getStateBadge(msg.adaptedFor).color}`}
                  >
                    <span>{getStateBadge(msg.adaptedFor).icon}</span>
                    <span>{getStateBadge(msg.adaptedFor).text}</span>
                  </div>
                )}
                <div className="ca-bubble-text">{msg.content}</div>
              </div>
            </div>
          ))}

          {isTypingReply && (
            <div className="ca-msg-row ca-msg-row-ai">
              <div
                className="ca-ai-dot"
                style={{ background: stateAccent.dot }}
              />
              <div className="ca-bubble ca-bubble-ai ca-bubble-typing">
                <span
                  className="ca-dot-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="ca-dot-bounce"
                  style={{ animationDelay: "140ms" }}
                />
                <span
                  className="ca-dot-bounce"
                  style={{ animationDelay: "280ms" }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="ca-inputbar">
          {error && <div className="ca-error-banner">{error}</div>}

          <div className="ca-input-row">
            <div className="ca-textarea-wrap">
              <MessageSquare className="ca-textarea-ico" />
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholderText(effectiveState)}
                className="ca-textarea"
                rows={2}
              />
              <button
                onClick={startVoiceInput}
                type="button"
                className={`ca-voice-btn ${isRecording ? "ca-voice-btn-active" : ""}`}
                title="Voice input"
              >
                {isRecording ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isTypingReply}
              type="button"
              className="ca-send-btn"
              style={{
                background:
                  !input.trim() || isTypingReply ? "#d1d5db" : stateAccent.grad,
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="ca-hints">
            <span>Enter to send · Shift+Enter for new line</span>
            <span className="ca-hints-right">
              Live cognitive state from typing patterns
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Root & layout ── */
        .ca-root {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: linear-gradient(160deg, #f0fdf4 0%, #dcfce7 40%, #ffffff 100%);
          font-family: 'DM Sans', sans-serif;
        }

        /* decorative blobs */
        .ca-bg-blob {
          position: absolute; border-radius: 50%;
          filter: blur(70px); opacity: 0.2;
          pointer-events: none; z-index: 0;
          animation: ca-bfloat 12s ease-in-out infinite;
        }
        .ca-bg-1 { width: 320px; height: 320px; background: radial-gradient(circle, #86efac, #4ade80); top: -80px; right: -80px; }
        .ca-bg-2 { width: 220px; height: 220px; background: radial-gradient(circle, #d1fae5, #a7f3d0); bottom: -60px; left: -60px; animation-delay: 5s; }
        @keyframes ca-bfloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-16px) scale(1.05); } }

        .ca-leaf { position: absolute; opacity: 0.07; color: #16a34a; pointer-events: none; z-index: 0; }
        .ca-leaf svg { width: 60px; height: 60px; }
        .ca-leaf-1 { top: 20px; left: 20px; animation: ca-lf 16s ease-in-out infinite; }
        .ca-leaf-2 { bottom: 80px; right: 20px; animation: ca-lf 20s ease-in-out infinite reverse; }
        @keyframes ca-lf { 0%,100% { transform: rotate(-20deg); } 50% { transform: rotate(18deg) scale(1.08); } }

        .ca-shell {
          position: relative; z-index: 1;
          display: flex; flex-direction: column;
          height: 100%; min-height: 0;
        }

        /* ── Header ── */
        .ca-header {
          flex-shrink: 0;
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(134,239,172,0.4);
          box-shadow: 0 2px 16px rgba(22,163,74,0.06);
          overflow: hidden;
          animation: ca-slidedown 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes ca-slidedown { from { opacity:0; transform: translateY(-16px); } to { opacity:1; transform: translateY(0); } }

        .ca-header-shimmer {
          height: 3px;
          background: linear-gradient(90deg, #22c55e, #4ade80, #86efac, #4ade80, #22c55e);
          background-size: 200% 100%;
          animation: ca-shimmer 3s linear infinite;
        }
        @keyframes ca-shimmer { 0% { background-position: 0%; } 100% { background-position: 200%; } }

        .ca-header-body {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; padding: 0.85rem 1.25rem; flex-wrap: wrap;
        }
        .ca-header-left { display: flex; align-items: center; gap: 0.85rem; }

        .ca-avatar {
          width: 42px; height: 42px; border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          position: relative; flex-shrink: 0;
          box-shadow: 0 6px 20px rgba(22,163,74,0.3);
          animation: ca-avpulse 3s ease-in-out infinite;
        }
        .ca-avatar-icon { width: 20px; height: 20px; color: white; }
        .ca-avatar-ring {
          position: absolute; inset: -4px; border-radius: 17px;
          border: 2px solid; animation: ca-avring 2s ease-out infinite;
        }
        @keyframes ca-avpulse { 0%,100% { box-shadow: 0 6px 20px rgba(22,163,74,0.3); } 50% { box-shadow: 0 8px 28px rgba(22,163,74,0.5); } }
        @keyframes ca-avring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.35); opacity: 0; } }

        .ca-title { font-family: 'Syne', sans-serif; font-size: 0.95rem; font-weight: 700; color: #14532d; margin: 0; }
        .ca-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.15rem 0.65rem; border-radius: 20px;
          font-size: 0.72rem; font-weight: 600; margin-top: 0.2rem;
        }
        .ca-badge-focus   { background: #dcfce7; color: #15803d; }
        .ca-badge-fatigue { background: #fee2e2; color: #b91c1c; }
        .ca-badge-confused{ background: #fef9c3; color: #92400e; }
        .ca-badge-conf { opacity: 0.65; }

        .ca-header-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

        .ca-offline-tag { font-size: 0.72rem; font-weight: 600; color: #f97316; background: #fff7ed; padding: 0.2rem 0.6rem; border-radius: 20px; }

        .ca-metrics-pill {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(240,253,244,0.8);
          border: 1px solid #bbf7d0; border-radius: 20px;
          padding: 0.3rem 0.85rem;
          font-size: 0.72rem; color: #374151; font-weight: 500;
        }
        .ca-metrics-ico { width: 12px; height: 12px; color: #22c55e; }
        .ca-metrics-sep { color: #bbf7d0; }

        .ca-icon-btn {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(240,253,244,0.8);
          border: 1px solid #d1fae5; color: #6b7280;
          cursor: pointer; transition: all 0.2s;
        }
        .ca-icon-btn:hover { background: #dcfce7; color: #16a34a; border-color: #86efac; }
        .ca-icon-btn-active { background: #dcfce7; color: #16a34a; border-color: #86efac; }

        /* ── Messages ── */
        .ca-messages {
          flex: 1; min-height: 0;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex; flex-direction: column; gap: 0.9rem;
          scroll-behavior: smooth;
        }
        .ca-messages::-webkit-scrollbar { width: 4px; }
        .ca-messages::-webkit-scrollbar-track { background: transparent; }
        .ca-messages::-webkit-scrollbar-thumb { background: #bbf7d0; border-radius: 4px; }

        .ca-msg-row {
          display: flex; align-items: flex-end; gap: 0.5rem;
          animation: ca-msgfade 0.35s ease both;
        }
        @keyframes ca-msgfade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ca-msg-row-user { flex-direction: row-reverse; }
        .ca-msg-row-ai   { flex-direction: row; }

        .ca-ai-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          margin-bottom: 6px; opacity: 0.7;
        }

        .ca-bubble {
          max-width: 80%;
          padding: 0.85rem 1.1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          line-height: 1.6;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
          transition: box-shadow 0.2s;
        }
        .ca-bubble:hover { box-shadow: 0 4px 18px rgba(0,0,0,0.1); }

        .ca-bubble-user {
          color: white;
          border-radius: 20px 20px 4px 20px;
        }
        .ca-bubble-ai {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(134,239,172,0.45);
          color: #1f2937;
          border-radius: 20px 20px 20px 4px;
          backdrop-filter: blur(12px);
        }
        .ca-bubble-typing {
          display: flex; align-items: center; gap: 5px;
          padding: 0.9rem 1.1rem;
        }
        .ca-bubble-text { white-space: pre-wrap; }

        .ca-msg-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.1rem 0.55rem; border-radius: 20px;
          font-size: 0.68rem; font-weight: 600; margin-bottom: 0.5rem;
        }

        .ca-dot-bounce {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e; display: inline-block;
          animation: ca-bounce 1.2s ease-in-out infinite;
        }
        @keyframes ca-bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-7px); opacity: 1; } }

        /* ── Input bar ── */
        .ca-inputbar {
          flex-shrink: 0;
          padding: 1rem 1.25rem;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(134,239,172,0.4);
          box-shadow: 0 -2px 16px rgba(22,163,74,0.06);
        }

        .ca-error-banner {
          background: #fff7ed; border: 1px solid #fed7aa; color: #c2410c;
          padding: 0.5rem 0.9rem; border-radius: 12px;
          font-size: 0.8rem; margin-bottom: 0.75rem;
        }

        .ca-input-row { display: flex; gap: 0.65rem; align-items: flex-end; }

        .ca-textarea-wrap { position: relative; flex: 1; }
        .ca-textarea-ico {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          width: 16px; height: 16px; color: #9ca3af; pointer-events: none;
          transition: color 0.2s;
        }
        .ca-textarea {
          width: 100%;
          padding: 0.85rem 3rem 0.85rem 2.75rem;
          background: rgba(255,255,255,0.95);
          border: 1.5px solid #d1fae5; border-radius: 18px;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; color: #111827;
          resize: none; outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          box-sizing: border-box;
        }
        .ca-textarea:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
        .ca-textarea::placeholder { color: #9ca3af; font-weight: 300; }

        .ca-voice-btn {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          width: 30px; height: 30px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; color: #9ca3af; cursor: pointer;
          transition: all 0.2s;
        }
        .ca-voice-btn:hover { color: #22c55e; background: #f0fdf4; }
        .ca-voice-btn-active { color: #ef4444 !important; background: #fee2e2 !important; animation: ca-recpulse 1s ease-in-out infinite; }
        @keyframes ca-recpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

        .ca-send-btn {
          width: 50px; height: 50px; border-radius: 16px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: none; color: white; cursor: pointer;
          transition: all 0.22s;
          box-shadow: 0 5px 16px rgba(22,163,74,0.3);
        }
        .ca-send-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(22,163,74,0.45); }
        .ca-send-btn:disabled { cursor: not-allowed; box-shadow: none; }

        .ca-hints {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 0.5rem;
          font-size: 0.71rem; color: #9ca3af;
        }
        .ca-hints-right { display: none; }
        @media (min-width: 640px) { .ca-hints-right { display: block; } }

        /* hide metrics pill on mobile */
        @media (max-width: 540px) {
          .ca-metrics-pill { display: none; }
          .ca-bubble { max-width: 90%; }
        }
      `}</style>
    </div>
  );
}
