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
} from "lucide-react";
import { MultiModalMoodDetector } from './MultiModalMoodDetector';

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
      return "Hi! I can see you're tired. I'll keep my answers short and simple. 💤";
    case "confused":
      return "Hi! I'm here to help. I'll explain things step by step so it's easy to follow. 🎯";
    case "focus":
    default:
      return "Hello! I'm ready to help with detailed, thoughtful answers. What would you like to explore? ⚡";
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

function buildAdaptiveResponse(userMessage: string, state: CognitiveState): string {
  return generateRelevantResponse(userMessage, state);
}

// ==== IMPROVED RESPONSE GENERATION ====

interface IntentResult {
  type: 'seeking_help' | 'seeking_direction' | 'question' | 'statement' | 'greeting' | 'farewell' | 'gratitude' | 'complaint' | 'small_talk';
  topic: string;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'negative' | 'neutral';
}

function analyzeIntent(message: string): IntentResult {
  const lower = message.toLowerCase().trim();
  
  // Check for greetings
  if (lower.match(/^(hi|hello|hey|good morning|good afternoon|good evening|yo|hiya|howdy|what's up|sup)/)) {
    return { type: 'greeting', topic: 'greeting', urgency: 'low', sentiment: 'positive' };
  }
  
  // Check for farewells
  if (lower.match(/\b(bye|goodbye|see you|later|cya|ttyl|night|sleep)/)) {
    return { type: 'farewell', topic: 'farewell', urgency: 'low', sentiment: 'neutral' };
  }
  
  // Check for gratitude
  if (lower.match(/\b(thank|thanks|ty|appreciate|grateful|thx)/)) {
    return { type: 'gratitude', topic: 'thanks', urgency: 'low', sentiment: 'positive' };
  }
  
  // Check for complaints/negativity
  if (lower.match(/\b(hate|suck|terrible|awful|worst|annoying|frustrat|angry|mad|pissed|stupid)/)) {
    return { type: 'complaint', topic: 'complaint', urgency: 'medium', sentiment: 'negative' };
  }
  
  // Check for seeking direction (very specific pattern)
  if (lower.match(/\b(what should i do|what do i do|what can i do|help me|i need help|i don't know what to do|i'm lost|guide me|advise me)\b/)) {
    return { type: 'seeking_direction', topic: 'direction', urgency: 'high', sentiment: 'neutral' };
  }
  
  // Check for seeking help
  if (lower.match(/\b(help|stuck|problem|issue|error|wrong|not working|failed|can't|cannot|unable|fix|solve|broken)\b/)) {
    return { type: 'seeking_help', topic: 'problem', urgency: 'high', sentiment: 'negative' };
  }
  
  // Check for questions
  if (lower.includes('?') || lower.match(/\b(what|how|why|when|where|who|which|can|could|would|will|do|does|is|are|did)\b/)) {
    return { type: 'question', topic: 'question', urgency: 'medium', sentiment: 'neutral' };
  }
  
  // Small talk patterns
  if (lower.match(/\b(nice|cool|awesome|great|good|wow|oh|really|interesting)\b/) || message.length < 20) {
    return { type: 'small_talk', topic: 'chat', urgency: 'low', sentiment: 'neutral' };
  }
  
  return { type: 'statement', topic: 'statement', urgency: 'low', sentiment: 'neutral' };
}

function extractTopic(message: string): string {
  const lower = message.toLowerCase();
  
  const topicPatterns = [
    { pattern: /\b(food|eat|hungry|cook|meal|recipe|breakfast|lunch|dinner|snack)\b/, topic: 'food' },
    { pattern: /\b(code|program|javascript|python|react|angular|vue|html|css|bug|error|debug|api|database|server|tech|software|app|website)\b/, topic: 'technology' },
    { pattern: /\b(work|job|project|task|assignment|deadline|meeting|boss|client|office|business|career)\b/, topic: 'work' },
    { pattern: /\b(learn|study|education|school|college|course|class|exam|test|homework|knowledge)\b/, topic: 'learning' },
    { pattern: /\b(time|date|day|schedule|calendar|plan|organize)\b/, topic: 'planning' },
    { pattern: /\b(feel|feeling|emotion|happy|sad|angry|anxious|stressed|worried|excited)\b/, topic: 'emotions' },
    { pattern: /\b(weather|rain|sunny|cold|hot|temperature|forecast)\b/, topic: 'weather' },
    { pattern: /\b(movie|film|show|tv|series|netflix|watch)\b/, topic: 'entertainment' },
    { pattern: /\b(music|song|listen|playlist|artist|band|album)\b/, topic: 'music' },
    { pattern: /\b(book|read|novel|story|author|literature)\b/, topic: 'reading' },
    { pattern: /\b(game|gaming|play|video game|pc|console|xbox|playstation|nintendo)\b/, topic: 'gaming' },
    { pattern: /\b(sport|exercise|workout|gym|fitness|run|walk|health)\b/, topic: 'health' },
    { pattern: /\b(travel|trip|vacation|holiday|flight|hotel|visit|place)\b/, topic: 'travel' },
    { pattern: /\b(money|finance|budget|save|invest|expense|income|salary)\b/, topic: 'finance' },
  ];
  
  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(lower)) return topic;
  }
  
  return 'general';
}

function generateRelevantResponse(message: string, state: CognitiveState): string {
  const intent = analyzeIntent(message);
  const topic = extractTopic(message);
  
  switch (intent.type) {
    case 'greeting':
      if (state === 'fatigue') return "Hi there! 👋 I can see you're tired. I'll keep things brief. What do you need help with? 💤";
      if (state === 'confused') return "Hello! 😊 I'm here to help you work through whatever you need. What would you like to tackle together?";
      return "Hello! 🌟 I'm ready to help with whatever you're working on. What's on your mind today?";
    
    case 'farewell':
      if (state === 'fatigue') return "Take care! Get some rest. 💤";
      if (state === 'confused') return "Goodbye! Remember, you can always come back if you need help. 😊";
      return "Goodbye! Feel free to return anytime you want to explore ideas together. 👋";
    
    case 'gratitude':
      if (state === 'fatigue') return "You're welcome! Rest up! 💤";
      if (state === 'confused') return "You're very welcome! Let me know if you need more help. 😊";
      return "You're welcome! Happy to help anytime. 🙏";
    
    case 'complaint':
      if (state === 'fatigue') return "I hear you. That sounds frustrating. Take a breath, then tell me what's wrong - I'll help. 💤";
      if (state === 'confused') return "I can tell you're frustrated. Let's slow down and figure this out together. What specifically is bothering you? 🤔";
      return "I understand your frustration. Let me help you work through this. What's the main issue you're facing? 💪";
    
    case 'seeking_direction':
      if (state === 'fatigue') {
        return `I hear you asking "what should I do?" 💤\n\nWhen you're tired, the best approach is:\n• Do the smallest next step\n• Rest after 25 minutes\n• Choose the option that requires least energy\n\nWhat specific situation are you deciding about?`;
      }
      if (state === 'confused') {
        return `You're wondering what to do - let's figure it out together! 🎯\n\n**Step 1: What are your options?**\nList 2-3 possible choices\n\n**Step 2: What's most important?**\n- Quick result?\n- Easy to do?\n- Best long-term outcome?\n\n**Step 3: Try the simplest option first**\n\nWhat decision are you trying to make?`;
      }
      return `You're seeking direction. Let me help you think through this systematically. 🧭\n\n**Decision Framework:**\n\n1. **Clarify the Goal**\n   What outcome are you trying to achieve?\n\n2. **Identify Constraints**\n   - Time available\n   - Resources available\n   - Energy level\n\n3. **Generate Options**\n   Brainstorm without judging\n\n4. **Evaluate & Choose**\n   Which aligns with your priorities?\n\nWhat specific situation are you navigating?`;
    
    case 'seeking_help':
      if (state === 'fatigue') {
        return `I can help! Since you seem tired, let's keep it simple:\n\n**Quick troubleshooting:**\n1. What broke? (one sentence)\n2. When did it last work?\n3. What's the simplest fix to try first?\n\nTell me these and I'll guide you. 💤`;
      }
      if (state === 'confused') {
        return `I'm here to help you solve this! 🎯\n\n**Let's break it down:**\n\n**What exactly is the problem?**\nDescribe what you see happening\n\n**What have you tried so far?**\nSo I don't suggest things you've already done\n\nDon't worry - we'll figure this out step by step! What can you tell me about the problem?`;
      }
      return `I'll help you solve this systematically. 🔧\n\n**Problem-Solving Framework:**\n\n**Phase 1: Understand**\n• What's the expected behavior?\n• What's actually happening?\n• When did this start?\n\n**Phase 2: Isolate**\n• Can you reproduce it?\n• What are the minimal steps?\n\n**Phase 3: Test & Fix**\n• Try the most likely fix\n• Verify it works\n\nWhat problem are you facing?`;
    
    case 'small_talk':
      if (state === 'fatigue') return "I'm here! 💤 What do you need?";
      if (state === 'confused') return "I'm listening! What would you like to chat about or work on? 😊";
      return "I'm here and ready to chat or help with anything! What's on your mind? 💬";
    
    default:
      break;
  }
  
  // Topic-based responses
  switch (topic) {
    case 'food':
      if (state === 'fatigue') return "Food! Keep it simple - maybe something quick like eggs or a sandwich. What do you have available? 🍳💤";
      if (state === 'confused') return "Hungry? 🍽️\n\nLet's decide simply:\n• Do you want to cook or order?\n• Sweet or savory?\n\nWhat sounds good?";
      return `You mentioned food! 🍽️\n\n**Quick Options:**\n• Make something with what you have\n• Order from a favorite place\n• Try a new recipe\n\n**What are you in the mood for?**`;
    
    case 'technology':
      if (state === 'fatigue') return "Tech stuff! 💻 Keep it simple - one small fix at a time. What specifically is the error or problem?";
      if (state === 'confused') return "Tech can be tricky! 💻\n\n**What are you trying to build or fix?**\n\nTell me:\n• The programming language\n• What error you see\n• What you want to happen\n\nI'll break it down!";
      return `Technical question! 💻\n\nI can help with:\n• Debugging code\n• Architecture decisions\n• Learning new technologies\n\n**What specifically do you need help with?**`;
    
    case 'work':
      if (state === 'fatigue') return "Work stuff when tired... tackle one small task, then rest. What's the most urgent thing? 🏢💤";
      if (state === 'confused') return "Work can be overwhelming! 🏢\n\n**What task is confusing you?**\n\nTell me:\n• What you need to do\n• What's unclear\n• When it's due\n\nWe'll make a simple plan!";
      return `Work topic! 🏢\n\nI can help with:\n• Task prioritization\n• Project planning\n• Difficult conversations\n\n**What's your work situation?**`;
    
    case 'emotions':
      if (state === 'fatigue') return "Feelings when tired hit harder. Be gentle with yourself. What's going on? 💙💤";
      if (state === 'confused') return "Emotions can be confusing! 💙\n\n**Let's sort it out:**\n\n1. Name the feeling\n2. What triggered it?\n3. What do you need right now?\n\nI'm here to listen.";
      return `You mentioned feelings. 💙\n\nI can help you:\n• Process emotions\n• Find coping strategies\n• Understand triggers\n\n**What are you experiencing?**`;
    
    default:
      if (state === 'fatigue') {
        return `You asked: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\nQuick answer: Focus on one small thing. Rest often. What specific part do you need help with? 💤`;
      }
      if (state === 'confused') {
        return `You asked: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"\n\nLet me help! Can you tell me:\n• What you're trying to do\n• Where you got stuck\n• What you've tried\n\nI'll break it down! 🤔`;
      }
      return `You asked: "${message}"\n\nTell me more about the context:\n• What's your background with this?\n• What have you tried?\n• What outcome do you want?\n\nThen I can give you a helpful response! 🎯`;
  }
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

  const [multiModalEnabled, setMultiModalEnabled] = useState(false);
  const [lastMultiModalState, setLastMultiModalState] = useState<CognitiveState | null>(null);

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

  const handleMultiModalMood = useCallback((mood: {
    typing: CognitiveState;
    visual: string | null;
    audio: string | null;
    combined: CognitiveState;
    confidence: number;
  }) => {
    // Only update if multi-modal confidence is significantly higher
    if (mood.confidence > 0.7 && mood.combined !== lastMultiModalState) {
      setLastMultiModalState(mood.combined);
      setDetectedState(mood.combined);
      setDetectedConfidence(mood.confidence);
    }
  }, [lastMultiModalState]);

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
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setInput(prev => prev ? `${prev} [Voice not supported]` : '[Voice input requires a modern browser]');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsRecording(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsRecording(false);
    };
    
    recognition.onerror = () => {
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.start();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Multi-Modal Mood Detector */}
      {multiModalEnabled && (
        <MultiModalMoodDetector 
          onMoodDetected={handleMultiModalMood}
          enabled={multiModalEnabled}
        />
      )}

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
          {/* Multi-modal toggle */}
          <button
            onClick={() => setMultiModalEnabled(!multiModalEnabled)}
            className={`rounded-lg p-2 transition-colors ${
              multiModalEnabled 
                ? "bg-green-100 text-green-700" 
                : "text-gray-500 hover:bg-primary-50 hover:text-primary-600"
            }`}
            title="Toggle camera & voice mood detection"
            type="button"
          >
            <Camera className="h-5 w-5" />
          </button>

          <div className="hidden items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400 md:flex">
            <Activity className="h-3 w-3" />
            <span>WPM: {Math.round(typingMetrics.currentWpm)}</span>
            <span className="text-gray-400">|</span>
            <span>Errors: {(typingMetrics.errorRate * 100).toFixed(0)}%</span>
            <span className="text-gray-400">|</span>
            <span>Pauses: {typingMetrics.longPauses}</span>
            {multiModalEnabled && (
              <>
                <span className="text-gray-400">|</span>
                <Eye className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Multi-modal</span>
              </>
            )}
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