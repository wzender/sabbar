import fs from "fs";
import path from "path";
import { pool, query } from "../db";
import { ExercisePayload } from "../types/models";

const LESSON_FILE_REGEX = /^day_(\d+)_lesson_(\d+)\.json$/;

function parseLessonJson(raw: string): ExercisePayload[] {
  const normalized = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(normalized) as ExercisePayload[];
}

async function ensureDay(dayNumber: number): Promise<number> {
  const result = await query<{ id: number }>(
    `
      INSERT INTO days (day_number)
      VALUES ($1)
      ON CONFLICT (day_number)
      DO UPDATE SET day_number = EXCLUDED.day_number
      RETURNING id
    `,
    [dayNumber],
  );
  return result.rows[0].id;
}

async function ensureLesson(dayId: number, lessonNumber: number): Promise<number> {
  const result = await query<{ id: number }>(
    `
      INSERT INTO lessons (day_id, lesson_number)
      VALUES ($1, $2)
      ON CONFLICT (day_id, lesson_number)
      DO UPDATE SET lesson_number = EXCLUDED.lesson_number
      RETURNING id
    `,
    [dayId, lessonNumber],
  );
  return result.rows[0].id;
}

async function seed() {
  const lessonsDir = path.resolve(__dirname, "../../../arabic_daily_lessons");
  const files = fs.readdirSync(lessonsDir).filter((file) => LESSON_FILE_REGEX.test(file)).sort();

  for (const file of files) {
    const match = file.match(LESSON_FILE_REGEX);
    if (!match) continue;

    const dayNumber = Number(match[1]);
    const lessonNumber = Number(match[2]);

    const raw = fs.readFileSync(path.join(lessonsDir, file), "utf8");
    const items = parseLessonJson(raw);

    const dayId = await ensureDay(dayNumber);
    const lessonId = await ensureLesson(dayId, lessonNumber);

    await query(`DELETE FROM exercises WHERE lesson_id = $1`, [lessonId]);

    for (const item of items) {
      await query(
        `
          INSERT INTO exercises
            (lesson_id, sentence_order, prompt_he, accepted_answers, answer_he_tatiq, tips_for_hebrew_speaking)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        `,
        [
          lessonId,
          Number(item.sentence_id),
          item.prompt_he,
          item.accepted_answers,
          item.answer_he_tatiq,
          JSON.stringify(item.tips_for_hebrew_speaking || []),
        ],
      );
    }

    console.log(`Seeded ${file} (${items.length} exercises)`);
  }
}

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
