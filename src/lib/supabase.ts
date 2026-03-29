import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ChatMessage = {
  id?: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  cognitive_state: 'fatigue' | 'confused' | 'focus';
  confidence: number;
  created_at?: string;
};

export type ChatSession = {
  id?: string;
  user_id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
};

export async function saveChatMessage(message: ChatMessage) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();
  
  if (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
  
  return data;
}

export async function getChatHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
  
  return data || [];
}

export async function clearChatHistory(userId: string) {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
}
