import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          duration_minutes: number;
          total_marks: number;
          passing_marks: number;
          start_time: string;
          end_time: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      questions: {
        Row: {
          id: string;
          exam_id: string;
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: string;
          marks: number;
          order_number: number;
          created_at: string;
        };
      };
      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          user_id: string;
          started_at: string;
          completed_at: string | null;
          score: number | null;
          total_marks: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          user_id: string;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          total_marks: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          completed_at?: string | null;
          score?: number | null;
          status?: string;
        };
      };
      user_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          marks_obtained: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          marks_obtained: number;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          name_bn: string;
          icon: string;
          color: string;
          created_at: string;
        };
      };
    };
  };
};
