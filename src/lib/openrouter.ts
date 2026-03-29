import { supabase, type ChatMessage } from './supabase';

type CognitiveState = 'fatigue' | 'confused' | 'focus';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Fallback mock responses when API is unavailable
function getMockResponse(userMessage: string, cognitiveState: CognitiveState): string {
  const lower = userMessage.toLowerCase();
  
  // Detect topics
  const topics = {
    dataScience: lower.match(/\b(data science|machine learning|ml|ai|python|pandas|numpy|dataset|analytics|statistics|visualization|jupyter|tensorflow|pytorch|scikit|model|algorithm|regression|classification|clustering)\b/),
    programming: lower.match(/\b(code|program|javascript|react|angular|vue|html|css|bug|error|debug|api|database|server|software|app|website|developer|coding)\b/),
    beginner: lower.match(/\b(beginner|newbie|start|learn|learning|just started|first time|no experience|basic|fundamental)\b/),
    career: lower.match(/\b(job|career|work|hire|interview|salary|resume|portfolio|company|industry|professional)\b/),
    project: lower.match(/\b(project|build|create|make|develop|application|system|app|website|product)\b/),
    help: lower.match(/\b(help|stuck|problem|issue|error|wrong|not working|failed|can't|cannot|unable|fix|solve|broken)\b/),
  };
  
  // Greetings
  if (lower.match(/^(hi|hello|hey|howdy)/)) {
    if (cognitiveState === 'fatigue') return "Hi! 💤 I'm here. What's up?";
    if (cognitiveState === 'confused') return "Hello! 😊 I'm here to help. What do you need?";
    return "Hello! I'm ready to help with whatever you're working on. What's on your mind today?";
  }
  
  // Data Science specific
  if (topics.dataScience) {
    if (cognitiveState === 'fatigue') {
      return `Data Science - great choice! 💤\n\nQuick start:\n1. Learn Python basics\n2. Try pandas for data\n3. Build one simple project\n\nRest first, then start with a small dataset!`;
    }
    if (cognitiveState === 'confused') {
      return `Data Science can feel overwhelming! 🎯\n\n**Start here:**\n\n**Step 1: Python Basics**\nVariables, loops, functions\n\n**Step 2: Data with Pandas**\nRead CSV files, filter data\n\n**Step 3: Visualization**\nMake simple charts with matplotlib\n\nWhat's your current level with Python?`;
    }
    return `Data Science is an exciting field! 📊\n\n**Learning Path:**\n\n**Foundation:**\n• Python programming\n• Statistics basics\n• Linear algebra (matrices, vectors)\n\n**Core Skills:**\n• Pandas/NumPy for data manipulation\n• Matplotlib/Seaborn for visualization\n• Scikit-learn for ML algorithms\n\n**Practice:**\n• Kaggle competitions\n• Real datasets (UCI, government data)\n• Build portfolio projects\n\nAre you looking for beginner resources or more advanced topics?`;
  }
  
  // Beginner/Learning path
  if (topics.beginner) {
    if (cognitiveState === 'fatigue') {
      return `Starting fresh is exciting! 💤\n\nYour first step:\n• Pick ONE small thing to learn today\n• Don't try to learn everything\n• Practice for just 20 minutes\n\nWhat one thing interests you most?`;
    }
    if (cognitiveState === 'confused') {
      return `Everyone starts as a beginner! 🎯\n\n**Here's how to start:**\n\n1. **Pick one topic** - Don't try to learn everything\n2. **Find a beginner tutorial** - YouTube or free courses\n3. **Build something tiny** - Even a simple project helps\n4. **Ask questions** - When you get stuck, ask!\n\nWhat subject are you trying to learn?`;
    }
    return `Being a beginner is actually an advantage - you see things with fresh eyes! 🌟\n\n**Beginner Strategy:**\n\n**Mindset:**\n• It's normal to feel overwhelmed\n• Everyone started where you are\n• Progress > Perfection\n\n**Approach:**\n• Start with fundamentals\n• Build small projects immediately\n• Learn by doing, not just watching\n• Join communities (Discord, Reddit)\n\n**Resources:**\n• FreeCodeCamp, Codecademy for basics\n• YouTube tutorials for specific topics\n• Documentation for deep dives\n\nWhat field are you beginning to learn?`;
  }
  
  // Programming/Coding
  if (topics.programming) {
    if (cognitiveState === 'fatigue') {
      return `Coding when tired is hard! 💤\n\nQuick tip:\n• Fix one small bug\n• Write just 10 lines\n• Or read documentation\n• Rest your brain soon\n\nWhat specific error are you seeing?`;
    }
    if (cognitiveState === 'confused') {
      return `Coding confusion is normal! 🎯\n\n**Let's debug together:**\n\n**What language/framework?**\nPython, JavaScript, React, etc.\n\n**What's the error message?**\nCopy the exact error text\n\n**What are you trying to do?**\nDescribe the goal in one sentence\n\nI'll help you step by step!`;
    }
    return `Programming challenge? Let's tackle it! 💻\n\n**Debug Framework:**\n\n**1. Reproduce:**\n   • What triggers the bug?\n   • Can you make it happen consistently?\n\n**2. Isolate:**\n   • Comment out sections\n   • Test components separately\n   • Check recent changes\n\n**3. Research:**\n   • Google the exact error\n   • Check Stack Overflow\n   • Review documentation\n\n**4. Fix & Test:**\n   • Make one change at a time\n   • Verify the fix works\n   • Check for side effects\n\nWhat error or problem are you facing?`;
  }
  
  // Career/Job related
  if (topics.career) {
    if (cognitiveState === 'fatigue') {
      return `Career stuff can wait if you're tired! 💤\n\nQuick wins:\n• Update LinkedIn headline\n• Apply to just 1 job today\n• Message one connection\n\nRest up, tackle bigger stuff tomorrow!`;
    }
    if (cognitiveState === 'confused') {
      return `Career decisions are tough! 🎯\n\n**Clarify what you want:**\n\n**What's most important?**\n• High salary?\n• Work-life balance?\n• Learning opportunities?\n• Remote work?\n\n**What are your options?**\nList 2-3 paths you're considering\n\n**What's blocking you?**\nSkills, experience, connections?\n\nLet's figure out your next step!`;
    }
    return `Career growth is a journey! 🚀\n\n**Strategy:**\n\n**Short-term (0-6 months):**\n• Update resume & LinkedIn\n• Build 2-3 portfolio projects\n• Network on LinkedIn/Twitter\n• Apply strategically (quality > quantity)\n\n**Medium-term (6-12 months):**\n• Develop specialized skills\n• Contribute to open source\n• Speak at meetups/blog\n• Get referrals\n\n**Long-term (1+ years):**\n• Become known in a niche\n• Mentor others\n• Consider leadership or specialization\n\nWhat stage of your career journey are you in?`;
  }
  
  // Project building
  if (topics.project) {
    if (cognitiveState === 'fatigue') {
      return `Projects are fun but tiring! 💤\n\nSmall step today:\n• Write down the next tiny task\n• Do just that one thing\n• Celebrate that win\n\nWhat's the smallest next step?`;
    }
    if (cognitiveState === 'confused') {
      return `Projects can feel overwhelming! 🎯\n\n**Break it down:**\n\n**What's the end goal?**\nDescribe the final product\n\n**What's step 1?**\nJust the very first thing to do\n\n**What's blocking you now?**\nTechnical issue, planning, or motivation?\n\nLet's make a simple plan together!`;
    }
    return `Building projects is the best way to learn! 🏗️\n\n**Project Framework:**\n\n**Phase 1: Plan**\n• Define MVP (Minimum Viable Product)\n• List must-have features\n• Set a deadline\n\n**Phase 2: Build**\n• Start with core functionality\n• Use tutorials/docs liberally\n• Commit code frequently\n\n**Phase 3: Polish**\n• Add error handling\n• Improve UI/UX\n• Write documentation\n\n**Phase 4: Share**\n• Deploy it\n• Post on social media\n• Add to portfolio\n\nWhat kind of project are you building?`;
  }
  
  // Help/Problem solving
  if (topics.help) {
    if (cognitiveState === 'fatigue') {
      return `I can help! Since you seem tired, let's keep it simple:\n\n💤 **Quick troubleshooting:**\n1. What broke? (one sentence)\n2. When did it last work?\n3. What's the simplest fix to try first?\n\nTell me these and I'll guide you.`;
    }
    if (cognitiveState === 'confused') {
      return `I'm here to help you solve this! 🎯\n\n**Let's break it down:**\n\n**What exactly is the problem?**\nDescribe what you see happening\n\n**What have you tried so far?**\nSo I don't suggest things you've already done\n\nDon't worry - we'll figure this out step by step! What can you tell me about the problem?`;
    }
    return `I'll help you solve this systematically. 🔧\n\n**Problem-Solving Framework:**\n\n**Phase 1: Understand**\n• What's the expected behavior?\n• What's actually happening?\n• When did this start?\n\n**Phase 2: Isolate**\n• Can you reproduce it?\n• What are the minimal steps?\n\n**Phase 3: Test & Fix**\n• Try the most likely fix\n• Verify it works\n\nWhat problem are you facing?`;
  }
  
  // Question patterns (general)
  if (lower.includes('?') || lower.match(/\b(what|how|why|when|where|who|which|can|could|would|will|do|does|is|are|did)\b/)) {
    if (cognitiveState === 'fatigue') {
      return `Quick answer: That's a good question! 💤\n\nThe short version: It depends on your specific situation. What's the main thing you're trying to figure out?`;
    }
    if (cognitiveState === 'confused') {
      return `Great question! Let me break this down simply:\n\n🎯 **The basics:**\n• What you're asking about depends on context\n• There are usually a few key factors to consider\n\nCan you tell me more about what you're trying to do? That way I can give you a specific answer!`;
    }
    return `That's an interesting question! Let me provide a comprehensive answer.\n\n**Key considerations:**\n\n1. **Context matters** - The answer depends on your specific situation\n2. **Multiple approaches** - There are often several valid ways to approach this\n3. **Trade-offs** - Each option has its own benefits and considerations\n\nTo give you the most helpful response, could you share a bit more about your background with this topic and what outcome you're hoping for?`;
  }
  
  // Very short responses (acknowledgments)
  if (userMessage.length < 15) {
    if (cognitiveState === 'fatigue') return "Got it. 💤 Tell me more when you have energy.";
    if (cognitiveState === 'confused') return "I see! 🎯 Can you expand on that a bit?";
    return "Interesting! Tell me more about that. 💬";
  }
  
  // Default responses by state
  if (cognitiveState === 'fatigue') {
    return `Got it. 💤\n\nSince you're tired, here's the quick take:\n• Focus on one small thing at a time\n• Rest is important - don't push too hard\n• Come back to this when you have more energy if needed\n\nWhat's the most urgent part you need help with right now?`;
  }
  if (cognitiveState === 'confused') {
    return `I hear you! 🎯\n\nLet's sort this out together:\n\n**First, let's clarify:**\n1. What are you trying to accomplish?\n2. Where specifically are you stuck?\n3. What have you tried so far?\n\nOnce I know these, I can give you a clear step-by-step path forward!`;
  }
  
  return `Thanks for sharing that! 💬\n\nI'd love to help you explore this topic further. A few questions to give you the best response:\n\n• What's your background with this subject?\n• What have you already tried or considered?\n• What would an ideal outcome look like for you?\n\nFeel free to share as much or as little as you'd like!`;
}

function getSystemPrompt(cognitiveState: CognitiveState): string {
  const basePrompt = `You are an adaptive AI assistant that adjusts responses based on the user's cognitive state. `;
  
  switch (cognitiveState) {
    case 'fatigue':
      return basePrompt + `
The user appears TIRED. Adapt your response:
- Keep answers SHORT (1-3 sentences max)
- Use simple, direct language
- Focus on the most important point only
- Be supportive but brief
- Suggest rest if appropriate
- Avoid lists, bullet points, or lengthy explanations`;
    
    case 'confused':
      return basePrompt + `
The user appears CONFUSED. Adapt your response:
- Break information into clear steps
- Use simple explanations
- Be encouraging and patient
- Ask clarifying questions if needed
- Use formatting (like bullet points) to organize
- Explain WHY, not just WHAT`;
    
    case 'focus':
    default:
      return basePrompt + `
The user appears FOCUSED and ENGAGED. Adapt your response:
- Provide comprehensive, detailed answers
- Include context, nuance, and depth
- Use examples and analogies
- Feel free to explore related topics
- Be thorough but stay relevant`;
  }
}

export async function generateAIResponse(
  userMessage: string,
  cognitiveState: CognitiveState,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  // Try OpenRouter API first
  if (OPENROUTER_API_KEY) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'CogniFlow Adaptive Chat'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-haiku',
          messages: [
            { role: 'system', content: getSystemPrompt(cognitiveState) },
            ...chatHistory.slice(-5).map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })),
            { role: 'user', content: userMessage }
          ],
          temperature: cognitiveState === 'fatigue' ? 0.5 : cognitiveState === 'confused' ? 0.7 : 0.8,
          max_tokens: cognitiveState === 'fatigue' ? 150 : cognitiveState === 'confused' ? 300 : 800,
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        }
      }
    } catch (error) {
      console.warn('OpenRouter API failed, using fallback:', error);
    }
  }
  
  // Fallback to mock responses
  console.log('Using fallback response');
  return getMockResponse(userMessage, cognitiveState);
}

export async function sendChatMessage(
  userId: string,
  message: string,
  cognitiveState: CognitiveState,
  confidence: number,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ content: string; messageId: string }> {
  // Save user message
  const userChatMessage: ChatMessage = {
    user_id: userId,
    role: 'user',
    content: message,
    cognitive_state: cognitiveState,
    confidence: confidence
  };
  
  await supabase.from('chat_messages').insert([userChatMessage]);
  
  // Generate AI response
  const aiResponse = await generateAIResponse(message, cognitiveState, chatHistory);
  
  // Save AI response
  const assistantChatMessage: ChatMessage = {
    user_id: userId,
    role: 'assistant',
    content: aiResponse,
    cognitive_state: cognitiveState,
    confidence: confidence
  };
  
  const { data } = await supabase
    .from('chat_messages')
    .insert([assistantChatMessage])
    .select()
    .single();
  
  return {
    content: aiResponse,
    messageId: data?.id || ''
  };
}

export async function getChatMessages(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(100);
  
  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
  
  return data || [];
}
