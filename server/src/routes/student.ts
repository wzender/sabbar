import { Router } from "express";
import { query } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/me", (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user: req.user });
});

router.get("/days", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const result = await query<{
    id: number;
    day_number: number;
    title: string | null;
    total_lessons: number;
    completed_lessons: number;
  }>(
    `
      SELECT
        d.id,
        d.day_number,
        d.title,
        COUNT(DISTINCT l.id)::int AS total_lessons,
        COUNT(DISTINCT CASE WHEN lesson_stats.total_exercises = lesson_stats.completed_exercises THEN l.id END)::int AS completed_lessons
      FROM days d
      LEFT JOIN lessons l ON l.day_id = d.id
      LEFT JOIN (
        SELECT
          l2.id AS lesson_id,
          COUNT(e.id)::int AS total_exercises,
          COUNT(sp.id)::int AS completed_exercises
        FROM lessons l2
        LEFT JOIN exercises e ON e.lesson_id = l2.id
        LEFT JOIN student_progress sp ON sp.exercise_id = e.id AND sp.user_id = $1 AND sp.completed = true
        GROUP BY l2.id
      ) lesson_stats ON lesson_stats.lesson_id = l.id
      GROUP BY d.id
      ORDER BY d.day_number ASC
    `,
    [userId],
  );

  return res.json(result.rows);
});

router.get("/days/:dayId/lessons", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const dayId = Number(req.params.dayId);

  const result = await query<{
    id: number;
    lesson_number: number;
    title: string | null;
    total_exercises: number;
    completed_exercises: number;
  }>(
    `
      SELECT
        l.id,
        l.lesson_number,
        l.title,
        COUNT(e.id)::int AS total_exercises,
        COUNT(sp.id)::int AS completed_exercises
      FROM lessons l
      LEFT JOIN exercises e ON e.lesson_id = l.id
      LEFT JOIN student_progress sp
        ON sp.exercise_id = e.id
        AND sp.user_id = $1
        AND sp.completed = true
      WHERE l.day_id = $2
      GROUP BY l.id
      ORDER BY l.lesson_number ASC
    `,
    [userId, dayId],
  );

  return res.json(result.rows);
});

router.get("/lessons/:lessonId/exercises", requireAuth, async (req, res) => {
  const lessonId = Number(req.params.lessonId);

  const result = await query<{
    id: number;
    sentence_order: number;
    prompt_he: string;
    answer_he_tatiq: string;
    tips_for_hebrew_speaking: unknown;
  }>(
    `
      SELECT id, sentence_order, prompt_he, answer_he_tatiq, tips_for_hebrew_speaking
      FROM exercises
      WHERE lesson_id = $1
      ORDER BY sentence_order ASC
    `,
    [lessonId],
  );

  return res.json(result.rows);
});

router.post("/progress", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const exerciseId = Number(req.body?.exerciseId);

  if (!exerciseId) {
    return res.status(400).json({ error: "exerciseId is required" });
  }

  await query(
    `
      INSERT INTO student_progress (user_id, exercise_id, completed, completed_at)
      VALUES ($1, $2, true, NOW())
      ON CONFLICT (user_id, exercise_id)
      DO UPDATE SET completed = true, completed_at = NOW()
    `,
    [userId, exerciseId],
  );

  return res.json({ ok: true });
});

router.get("/progress", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const result = await query<{
    exercise_id: number;
    completed: boolean;
    completed_at: string;
  }>(
    `
      SELECT exercise_id, completed, completed_at
      FROM student_progress
      WHERE user_id = $1 AND completed = true
    `,
    [userId],
  );

  return res.json(result.rows);
});

export default router;
