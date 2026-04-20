export type AppRole = "student" | "teacher";

export interface Tip {
  word: string;
  issue: string;
  guidance_he: string;
}

export interface ExercisePayload {
  sentence_id: number;
  prompt_he: string;
  accepted_answers: string;
  answer_he_tatiq: string;
  tips_for_hebrew_speaking: Tip[];
}
