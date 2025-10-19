/*
  # MCQ Exam Portal Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `exams`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `duration_minutes` (integer)
      - `total_marks` (integer)
      - `passing_marks` (integer)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz, optional)
      - `is_active` (boolean)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `questions`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `question_text` (text)
      - `option_a` (text)
      - `option_b` (text)
      - `option_c` (text)
      - `option_d` (text)
      - `correct_answer` (text, 'A', 'B', 'C', or 'D')
      - `marks` (integer)
      - `order_number` (integer)
      - `created_at` (timestamptz)
    
    - `exam_attempts`
      - `id` (uuid, primary key)
      - `exam_id` (uuid, references exams)
      - `user_id` (uuid, references profiles)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz, optional)
      - `score` (integer, optional)
      - `total_marks` (integer)
      - `status` (text, 'in_progress', 'completed', 'abandoned')
      - `created_at` (timestamptz)
    
    - `user_answers`
      - `id` (uuid, primary key)
      - `attempt_id` (uuid, references exam_attempts)
      - `question_id` (uuid, references questions)
      - `selected_answer` (text, 'A', 'B', 'C', or 'D')
      - `is_correct` (boolean)
      - `marks_obtained` (integer)
      - `created_at` (timestamptz)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `name_bn` (text, Bengali name)
      - `icon` (text)
      - `color` (text)
      - `created_at` (timestamptz)
    
    - `exam_categories`
      - `exam_id` (uuid, references exams)
      - `category_id` (uuid, references categories)
      - Primary key (exam_id, category_id)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to:
      - Read their own profile and other profiles (public data)
      - Update their own profile
      - Read active exams
      - Create and read their own exam attempts
      - Create and read their own answers
      - Read categories
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_bn text NOT NULL,
  icon text NOT NULL DEFAULT '📚',
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  total_marks integer NOT NULL,
  passing_marks integer NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active exams"
  ON exams FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  marks integer NOT NULL DEFAULT 1,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view questions for active exams"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = questions.exam_id
      AND exams.is_active = true
    )
  );

-- Create exam_attempts table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  score integer,
  total_marks integer NOT NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON exam_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attempts"
  ON exam_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON exam_attempts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_answers table
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer text NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct boolean NOT NULL,
  marks_obtained integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON user_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = user_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own answers"
  ON user_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_attempts
      WHERE exam_attempts.id = user_answers.attempt_id
      AND exam_attempts.user_id = auth.uid()
    )
  );

-- Create exam_categories junction table
CREATE TABLE IF NOT EXISTS exam_categories (
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (exam_id, category_id)
);

ALTER TABLE exam_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exam categories"
  ON exam_categories FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample categories
INSERT INTO categories (name, name_bn, icon, color) VALUES
  ('Archive', 'আর্কাইভ', '📁', '#f59e0b'),
  ('Quick Practice', 'দ্রুত প্র্যাকটিস', '⚡', '#eab308'),
  ('Mock Exams', 'মক পরীক্ষা', '🎨', '#ec4899'),
  ('Chit Chat', 'চিট চ্যাট', '💬', '#3b82f6'),
  ('AI Practice', 'চর্চা AI', '🤖', '#8b5cf6'),
  ('Leaderboard', 'লিডারবোর্ড', '🏆', '#f59e0b')
ON CONFLICT DO NOTHING;