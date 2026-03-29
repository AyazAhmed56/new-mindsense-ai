import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  MessageSquare,
  Mic,
  MicOff,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

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
  /**
   * Optional fallback state from parent.
   * Local typing-based detection has priority.
   */
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

const SIMPLE_RESPONSES = [
  "Here is the short answer:\n- Main point: keep it simple\n- Next step: do one thing at a time",
  "Simple version:\n1. Start small\n2. Finish one step\n3. Then continue",
  "Quick answer: yes, this can work.\nJust do the basic version first.",
];

const GUIDED_RESPONSES = [
  "Let me explain step by step:\n\n1. Understand the input\n2. Process it clearly\n3. Return the result\n4. Test with a small example",
  "Here is the guided explanation:\n\nStep 1: Identify the problem\nStep 2: Break it into small parts\nStep 3: Solve one part at a time\nStep 4: Combine everything",
  "Let’s make it easy:\n\n1. What goes in?\n2. What happens to it?\n3. What comes out?\n4. Test once and improve",
];

const ADVANCED_RESPONSES = [
  "Here is the detailed answer:\n\n- First, define the input clearly.\n- Then apply the logic layer.\n- Add validation and fallback handling.\n- Finally, optimize for performance and edge cases.\n\nIn a real system, you should separate UI state, typing analysis, and response adaptation into distinct layers.",
  "Deep explanation:\n\nThis works best when you treat cognitive-state detection as a heuristic model, not a truth detector. Use typing speed, correction rate, pause patterns, and recent trend analysis together. Then adapt response depth, structure, and tone from that state.",
  "Advanced version:\n\nA clean design is:\n1. Capture live typing signals\n2. Compute metrics over the current draft\n3. Classify into fatigue / confused / focus\n4. Generate an answer style based on the class\n5. Re-evaluate every message instead of locking the user into one mode",
];

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
        color:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      };
    case "confused":
      return {
        text: "Guided Mode",
        icon: "🎯",
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      };
    case "focus":
    default:
      return {
        text: "Advanced Mode",
        icon: "⚡",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      };
  }
}

function getWelcomeMessage(state: CognitiveState): string {
  switch (state) {
    case "fatigue":
      return "Hi. I’ll keep answers short and simple.";
    case "confused":
      return "Hi. I’ll explain things step by step.";
    case "focus":
    default:
      return "Hi. I can give you deeper and more detailed answers.";
  }
}

function getStateTransitionMessage(state: CognitiveState): string {
  switch (state) {
    case "fatigue":
      return "I’m switching to shorter and simpler replies.";
    case "confused":
      return "I’m switching to guided step-by-step replies.";
    case "focus":
    default:
      return "I’m switching to deeper and more advanced replies.";
  }
}

/**
 * Very blunt truth:
 * typing speed + correction rate is only a heuristic, not actual mind-reading.
 * Still, for a hackathon or beginner project, this is a reasonable approximation.
 */
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

  // Fatigue: slow, lots of pauses, low energy typing
  if (wpm < 18) fatigueScore += 3;
  else if (wpm < 28) fatigueScore += 2;

  if (longPauses >= 3) fatigueScore += 2;
  if (metrics.totalPauseMs > 5000) fatigueScore += 2;
  if (metrics.keystrokeCount > 0 && metrics.charsTyped < 15) fatigueScore += 1;

  // Confused: moderate speed but high correction / backtracking
  if (errorRate >= 0.18) confusedScore += 3;
  else if (errorRate >= 0.1) confusedScore += 2;

  if (corrections >= 3) confusedScore += 2;
  if (metrics.backspaces >= 5) confusedScore += 2;
  if (longPauses >= 2) confusedScore += 1;

  // Focus: stable speed, fewer errors, enough text produced
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

  return {
    state: best.state,
    confidence,
  };
}

function buildAdaptiveResponse(
  userMessage: string,
  state: CognitiveState
): string {
  const trimmed = userMessage.trim();

  if (!trimmed) {
    return "Please type a question first.";
  }

  if (state === "fatigue") {
    const base =
      SIMPLE_RESPONSES[Math.floor(Math.random() * SIMPLE_RESPONSES.length)];
    return `${base}\n\nYour question: ${trimmed.slice(0, 120)}`;
  }

  if (state === "confused") {
    const base =
      GUIDED_RESPONSES[Math.floor(Math.random() * GUIDED_RESPONSES.length)];
    return `${base}\n\nI am structuring this clearly because your typing pattern suggests you may need guidance.`;
  }

  const base =
    ADVANCED_RESPONSES[Math.floor(Math.random() * ADVANCED_RESPONSES.length)];
  return `${base}\n\nYour question can be handled with more depth, so I’m giving you the richer version.`;
}

export default function ChatAssistant({
  cognitiveState = "focus",
}: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTypingReply, setIsTypingReply] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingMetrics, setTypingMetrics] = useState<TypingSnapshot>(INITIAL_TYPING);
  const [detectedState, setDetectedState] = useState<CognitiveState>(cognitiveState);
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0.6);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevDetectedStateRef = useRef<CognitiveState>(cognitiveState);

  const effectiveState = useMemo(() => {
    if (input.trim().length < 6) return cognitiveState;
    return detectedState;
  }, [input, cognitiveState, detectedState]);

  const badge = getStateBadge(effectiveState);

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

  useEffect(() => {
    if (input.trim().length < 6 || typingMetrics.keystrokeCount < 5) return;

    const result = detectCognitiveState(typingMetrics);
    setDetectedState(result.state);
    setDetectedConfidence(result.confidence);
  }, [typingMetrics, input]);

  useEffect(() => {
    if (effectiveState !== prevDetectedStateRef.current && input.trim().length >= 6) {
      const transitionMessage: Message = {
        id: `transition-${Date.now()}`,
        role: "assistant",
        content: getStateTransitionMessage(effectiveState),
        adaptedFor: effectiveState,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.role === "assistant" &&
          last.content === transitionMessage.content
        ) {
          return prev;
        }
        return [...prev, transitionMessage];
      });

      prevDetectedStateRef.current = effectiveState;
    }
  }, [effectiveState, input]);

  const resetTypingMetrics = () => {
    setTypingMetrics(INITIAL_TYPING);
  };

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

      if (nextLength > prevLength) {
        charsTyped += nextLength - prevLength;
      } else if (nextLength < prevLength) {
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

    const stateForReply =
      text.length >= 6 && typingMetrics.keystrokeCount >= 5
        ? detectCognitiveState(typingMetrics).state
        : cognitiveState;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTypingReply(true);

    const delay =
      stateForReply === "fatigue"
        ? 500
        : stateForReply === "confused"
        ? 900
        : 1400;

    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: buildAdaptiveResponse(text, stateForReply),
        adaptedFor: stateForReply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTypingReply(false);
      resetTypingMetrics();
      setDetectedState(stateForReply);
    }, delay);
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
    prevDetectedStateRef.current = cognitiveState;
  };

  const startVoiceInput = () => {
    setIsRecording(true);

    // Fake voice capture placeholder.
    // Replace with Web Speech API if you want real voice input.
    window.setTimeout(() => {
      setIsRecording(false);
      setInput((prev) =>
        prev ? `${prev} voice input text` : "voice input text"
      );
    }, 1800);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-primary-100 p-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ${
              effectiveState === "fatigue"
                ? "bg-gradient-to-br from-orange-500 to-red-600"
                : effectiveState === "confused"
                ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                : "bg-gradient-to-br from-blue-500 to-blue-700"
            }`}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Adaptive Chatbot
            </h2>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}
            >
              <span>{badge.icon}</span>
              <span>{badge.text}</span>
              <span className="opacity-75">
                ({Math.round(detectedConfidence * 100)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400 md:flex">
            <Activity className="h-3 w-3" />
            <span>WPM: {Math.round(typingMetrics.currentWpm)}</span>
            <span className="text-gray-400">|</span>
            <span>Errors: {(typingMetrics.errorRate * 100).toFixed(0)}%</span>
            <span className="text-gray-400">|</span>
            <span>Pauses: {typingMetrics.longPauses}</span>
          </div>

          <button
            onClick={clearChat}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
            title="Clear chat"
            type="button"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 md:max-w-[75%] ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "border border-primary-100 text-gray-800 dark:border-gray-700 dark:text-gray-200"
              }`}
            >
              {message.role === "assistant" && message.adaptedFor && (
                <div
                  className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${getStateBadge(message.adaptedFor).color}`}
                >
                  <span>{getStateBadge(message.adaptedFor).icon}</span>
                  <span>{getStateBadge(message.adaptedFor).text}</span>
                </div>
              )}

              <div className="whitespace-pre-wrap text-sm md:text-base">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isTypingReply && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-primary-100 p-4 dark:border-gray-700">
              <div className="flex gap-2">
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-primary-100 p-4 dark:border-gray-800">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText(effectiveState)}
              className="w-full resize-none rounded-2xl border-2 border-primary-200 bg-white py-4 pl-12 pr-12 text-sm focus:border-primary-500 focus:outline-none dark:border-primary-800 dark:bg-gray-800 dark:text-white md:text-base"
              rows={2}
            />

            <button
              onClick={startVoiceInput}
              type="button"
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-colors ${
                isRecording
                  ? "animate-pulse bg-red-100 text-red-600"
                  : "text-gray-400 hover:bg-primary-50 hover:text-primary-600"
              }`}
              title="Voice input"
            >
              {isRecording ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isTypingReply}
            type="button"
            className="flex items-center justify-center rounded-2xl bg-blue-600 px-6 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift + Enter for new line
          </p>

          <p className="hidden text-xs text-gray-500 md:block">
            Live state is inferred from typing speed, pauses, and correction rate
          </p>
        </div>
      </div>
    </div>
  );
}