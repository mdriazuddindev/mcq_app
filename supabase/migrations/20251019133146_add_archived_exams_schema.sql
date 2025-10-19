/*
  # Add Archived Exams Schema

  ## Description
  This migration extends the exam portal to support archived exams with the provided JSON structure,
  including exam metadata, questions with images, explanations, and category-based organization.

  ## Changes Made
  
  1. **New Tables**
    - `archived_exams` - Stores metadata about archived exams
      - `id` (uuid, primary key)
      - `exam_id` (text, unique identifier from JSON)
      - `exam_title` (text)
      - `exam_date` (text)
      - `total_questions` (integer)
      - `questions_with_images` (integer)
      - `explanations_found` (integer)
      - `explanations_missing` (integer)
      - `categories` (jsonb, category mapping)
      - `category_stats` (jsonb, question count per category)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `archived_questions` - Stores questions for archived exams
      - `id` (uuid, primary key)
      - `archived_exam_id` (uuid, references archived_exams)
      - `question_number` (integer)
      - `category` (text)
      - `question_text` (text)
      - `question_images` (jsonb array)
      - `options` (jsonb, option1-4)
      - `correct_answer` (text)
      - `explain_id` (text)
      - `explanation` (text)
      - `explanation_images` (jsonb array)
      - `created_at` (timestamptz)
    
    - `exam_sessions` - Tracks individual question attempts in timed exams
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `archived_exam_id` (uuid, references archived_exams)
      - `archived_question_id` (uuid, references archived_questions)
      - `selected_answer` (text)
      - `is_correct` (boolean)
      - `time_spent_seconds` (integer)
      - `answered_at` (timestamptz)
      - `created_at` (timestamptz)

  2. **Security**
    - Enable RLS on all new tables
    - Users can view all archived exams
    - Users can view all archived questions for active exams
    - Users can create and view their own exam sessions
*/

CREATE TABLE IF NOT EXISTS archived_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id text UNIQUE NOT NULL,
  exam_title text NOT NULL,
  exam_date text,
  total_questions integer DEFAULT 0,
  questions_with_images integer DEFAULT 0,
  explanations_found integer DEFAULT 0,
  explanations_missing integer DEFAULT 0,
  categories jsonb DEFAULT '{}'::jsonb,
  category_stats jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE archived_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all archived exams"
  ON archived_exams FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS archived_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archived_exam_id uuid NOT NULL REFERENCES archived_exams(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  category text NOT NULL DEFAULT 'Unknown',
  question_text text NOT NULL,
  question_images jsonb DEFAULT '[]'::jsonb,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  correct_answer text NOT NULL,
  explain_id text,
  explanation text,
  explanation_images jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE archived_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view archived questions"
  ON archived_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM archived_exams
      WHERE archived_exams.id = archived_questions.archived_exam_id
      AND archived_exams.is_active = true
    )
  );

CREATE TABLE IF NOT EXISTS exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  archived_exam_id uuid NOT NULL REFERENCES archived_exams(id) ON DELETE CASCADE,
  archived_question_id uuid NOT NULL REFERENCES archived_questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  time_spent_seconds integer DEFAULT 0,
  answered_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exam sessions"
  ON exam_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exam sessions"
  ON exam_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_archived_questions_exam_id ON archived_questions(archived_exam_id);
CREATE INDEX IF NOT EXISTS idx_archived_questions_question_number ON archived_questions(archived_exam_id, question_number);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_id ON exam_sessions(archived_exam_id);