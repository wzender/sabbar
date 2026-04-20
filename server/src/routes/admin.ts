import { Router } from "express";
import multer from "multer";
import { query } from "../db";
import { requireTeacher } from "../middleware/auth";
import { ExercisePayload } from "../types/models";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireTeacher);

router.get("/days", async (_req, res) => {
  const result = await query(`SELECT * FROM days ORDER BY day_number ASC`);
  res.json(result.rows);
});

router.get("/days/:dayId/lessons", async (req, res) => {
  const dayId = Number(req.params.dayId);
  const result = await query(
    `SELECT * FROM lessons WHERE day_id = $1 ORDER BY lesson_number ASC`,
    [dayId],
  );
  res.json(result.rows);
});

router.get("/lessons/:lessonId/exercises", async (req, res) => {
  const lessonId = Number(req.params.lessonId);
  const result = await query(
    `SELECT * FROM exercises WHERE lesson_id = $1 ORDER BY sentence_order ASC`,
    [lessonId],
  );
  res.json(result.rows);
});

router.get("/students", async (_req, res) => {
  const result = await query(
    `SELECT id, email, name, role, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC`,
  );
  res.json(result.rows);
});

router.get("/students/:id/progress", async (req, res) => {
  const userId = Number(req.params.id);
  const result = await query(
    `
      SELECT
        d.day_number,
        l.lesson_number,
        e.sentence_order,
        sp.completed,
        sp.completed_at
      FROM student_progress sp
      JOIN exercises e ON e.id = sp.exercise_id
      JOIN lessons l ON l.id = e.lesson_id
      JOIN days d ON d.id = l.day_id
      WHERE sp.user_id = $1
      ORDER BY d.day_number, l.lesson_number, e.sentence_order
    `,
    [userId],
  );
  res.json(result.rows);
});

router.post("/days", async (req, res) => {
  const dayNumber = Number(req.body?.day_number);
  const title = req.body?.title ? String(req.body.title) : null;
  if (!dayNumber) return res.status(400).json({ error: "day_number is required" });

  const created = await query(
    `INSERT INTO days (day_number, title) VALUES ($1, $2) RETURNING *`,
    [dayNumber, title],
  );
  res.status(201).json(created.rows[0]);
});

router.put("/days/:id", async (req, res) => {
  const id = Number(req.params.id);
  const dayNumber = Number(req.body?.day_number);
  const title = req.body?.title ? String(req.body.title) : null;

  const updated = await query(
    `UPDATE days SET day_number = $1, title = $2 WHERE id = $3 RETURNING *`,
    [dayNumber, title, id],
  );
  res.json(updated.rows[0]);
});

router.delete("/days/:id", async (req, res) => {
  await query(`DELETE FROM days WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

router.post("/lessons", async (req, res) => {
  const dayId = Number(req.body?.day_id);
  const lessonNumber = Number(req.body?.lesson_number);
  const title = req.body?.title ? String(req.body.title) : null;

  const created = await query(
    `INSERT INTO lessons (day_id, lesson_number, title) VALUES ($1, $2, $3) RETURNING *`,
    [dayId, lessonNumber, title],
  );
  res.status(201).json(created.rows[0]);
});

router.put("/lessons/:id", async (req, res) => {
  const id = Number(req.params.id);
  const dayId = Number(req.body?.day_id);
  const lessonNumber = Number(req.body?.lesson_number);
  const title = req.body?.title ? String(req.body.title) : null;

  const updated = await query(
    `UPDATE lessons SET day_id = $1, lesson_number = $2, title = $3 WHERE id = $4 RETURNING *`,
    [dayId, lessonNumber, title, id],
  );
  res.json(updated.rows[0]);
});

router.delete("/lessons/:id", async (req, res) => {
  await query(`DELETE FROM lessons WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

router.post("/exercises", async (req, res) => {
  const payload = req.body;
  const created = await query(
    `
      INSERT INTO exercises (lesson_id, sentence_order, prompt_he, accepted_answers, answer_he_tatiq, tips_for_hebrew_speaking)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `,
    [
      Number(payload.lesson_id),
      Number(payload.sentence_order),
      String(payload.prompt_he),
      String(payload.accepted_answers || ""),
      String(payload.answer_he_tatiq),
      JSON.stringify(payload.tips_for_hebrew_speaking || []),
    ],
  );
  res.status(201).json(created.rows[0]);
});

router.put("/exercises/:id", async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body;
  const updated = await query(
    `
      UPDATE exercises
      SET lesson_id = $1,
          sentence_order = $2,
          prompt_he = $3,
          accepted_answers = $4,
          answer_he_tatiq = $5,
          tips_for_hebrew_speaking = $6::jsonb
      WHERE id = $7
      RETURNING *
    `,
    [
      Number(payload.lesson_id),
      Number(payload.sentence_order),
      String(payload.prompt_he),
      String(payload.accepted_answers || ""),
      String(payload.answer_he_tatiq),
      JSON.stringify(payload.tips_for_hebrew_speaking || []),
      id,
    ],
  );
  res.json(updated.rows[0]);
});

router.delete("/exercises/:id", async (req, res) => {
  await query(`DELETE FROM exercises WHERE id = $1`, [Number(req.params.id)]);
  res.json({ ok: true });
});

router.post("/import", upload.single("file"), async (req, res) => {
  const lessonId = Number(req.body?.lessonId);
  const dayNumber = Number(req.body?.dayNumber);
  const lessonNumber = Number(req.body?.lessonNumber);

  if (!req.file && !lessonId) {
    return res.status(400).json({ error: "file is required" });
  }

  let targetLessonId = lessonId;

  if (!targetLessonId) {
    if (!dayNumber || !lessonNumber) {
      return res.status(400).json({ error: "dayNumber and lessonNumber are required when lessonId is not provided" });
    }

    const day = await query<{ id: number }>(
      `INSERT INTO days (day_number) VALUES ($1) ON CONFLICT (day_number) DO UPDATE SET day_number = EXCLUDED.day_number RETURNING id`,
      [dayNumber],
    );

    const lesson = await query<{ id: number }>(
      `
        INSERT INTO lessons (day_id, lesson_number)
        VALUES ($1, $2)
        ON CONFLICT (day_id, lesson_number)
        DO UPDATE SET lesson_number = EXCLUDED.lesson_number
        RETURNING id
      `,
      [day.rows[0].id, lessonNumber],
    );

    targetLessonId = lesson.rows[0].id;
  }

  const raw = req.file?.buffer.toString("utf8") || "[]";
  const parsed = JSON.parse(raw) as ExercisePayload[];

  await query(`DELETE FROM exercises WHERE lesson_id = $1`, [targetLessonId]);

  for (const item of parsed) {
    await query(
      `
        INSERT INTO exercises (lesson_id, sentence_order, prompt_he, accepted_answers, answer_he_tatiq, tips_for_hebrew_speaking)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        targetLessonId,
        Number(item.sentence_id),
        item.prompt_he,
        item.accepted_answers,
        item.answer_he_tatiq,
        JSON.stringify(item.tips_for_hebrew_speaking || []),
      ],
    );
  }

  return res.json({ ok: true, lessonId: targetLessonId, imported: parsed.length });
});

export default router;
