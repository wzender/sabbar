export type Role = "student" | "teacher";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface Day {
  id: number;
  day_number: number;
  title: string | null;
  total_lessons?: number;
  completed_lessons?: number;
}

export interface Lesson {
  id: number;
  day_id?: number;
  lesson_number: number;
  title: string | null;
  total_exercises?: number;
  completed_exercises?: number;
}

export interface Tip {
  word: string;
  issue: string;
  guidance_he: string;
}

export interface Exercise {
  id: number;
  lesson_id?: number;
  sentence_order: number;
  prompt_he: string;
  accepted_answers?: string;
  answer_he_tatiq: string;
  tips_for_hebrew_speaking: Tip[];
}
