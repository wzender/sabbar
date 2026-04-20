import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet } from "../lib/api";
import { Lesson } from "../types";

export function LessonsPage() {
  const { dayId } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!dayId) return;
    apiGet<Lesson[]>(`/api/days/${dayId}/lessons`).then(setLessons);
  }, [dayId]);

  if (lessons.length === 0) {
    return <div className="card">אין שיעורים זמינים ליום זה.</div>;
  }

  return (
    <div>
      <h1>בחירת שיעור</h1>
      <div className="grid">
        {lessons.map((lesson) => (
          <Link className="card" to={`/lessons/${lesson.id}/exercise`} key={lesson.id}>
            <h3>שיעור {String(lesson.lesson_number).padStart(2, "0")}</h3>
            <p className="subtle">
              {lesson.completed_exercises || 0}/{lesson.total_exercises || 0} תרגילים
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
