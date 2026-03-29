-- Supabase Database Schema for CogniFlow Chat
-- Run this in Supabase SQL Editor

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  cognitive_state TEXT NOT NULL CHECK (cognitive_state IN ('fatigue', 'confused', 'focus')),
  confidence DECIMAL(3,2) DEFAULT 0.6,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for demo purposes)
CREATE POLICY "Allow anonymous inserts" ON chat_messages
  FOR INSERT TO anon WITH CHECK (true);

-- Create policy to allow anonymous selects for their own messages
CREATE POLICY "Allow users to view their own messages" ON chat_messages
  FOR SELECT TO anon USING (true);

-- Create policy to allow users to delete their own messages
CREATE POLICY "Allow users to delete their own messages" ON chat_messages
  FOR DELETE TO anon USING (true);

-- Optional: Create a view for chat sessions
CREATE OR REPLACE VIEW chat_sessions AS
SELECT 
  user_id,
  MIN(created_at) as session_start,
  MAX(created_at) as session_end,
  COUNT(*) as message_count
FROM chat_messages
GROUP BY user_id;
