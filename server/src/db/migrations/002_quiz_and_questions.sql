-- ==============================================================================
-- Migration 002: Quiz & Questions Tables for Supabase / PostgreSQL
-- ==============================================================================

-- 1. Table for Question Bank (AI Quiz & Solved Competitive Exam Questions)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  topic TEXT NOT NULL,
  is_competitive_exam BOOLEAN NOT NULL DEFAULT false,
  exam_tag TEXT NULL,
  category TEXT NOT NULL DEFAULT 'AI_GENERATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic ON quiz_questions(topic);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_comp ON quiz_questions(is_competitive_exam);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);

-- 2. Table for Quiz Sessions & Performance Tracking
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  question_count INTEGER NOT NULL,
  score INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance and user queries
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to question bank
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quiz_questions' AND policyname = 'Allow public read access to quiz_questions'
  ) THEN
    CREATE POLICY "Allow public read access to quiz_questions"
      ON quiz_questions FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow public or authenticated insert to quizzes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Allow public insert into quizzes'
  ) THEN
    CREATE POLICY "Allow public insert into quizzes"
      ON quizzes FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow select on quizzes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Allow select on quizzes'
  ) THEN
    CREATE POLICY "Allow select on quizzes"
      ON quizzes FOR SELECT
      USING (true);
  END IF;
END $$;
