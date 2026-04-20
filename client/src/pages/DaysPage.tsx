import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../lib/api";
import { Day } from "../types";

export function DaysPage() {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Day[]>("/api/days")
      .then(setDays)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="centered">טוען ימים...</div>;

  if (days.length === 0) {
    return <div className="card">אין ימים זמינים כרגע.</div>;
  }

  return (
    <div>
      <h1>בחירת יום</h1>
      <div className="grid">
        {days.map((day) => {
          const completed = day.total_lessons && day.total_lessons > 0 && day.total_lessons === day.completed_lessons;
          return (
            <Link className="card day-card" to={`/days/${day.id}/lessons`} key={day.id}>
              <h3>יום {String(day.day_number).padStart(2, "0")}</h3>
              <p className="subtle">
                {day.completed_lessons || 0}/{day.total_lessons || 0} שיעורים
              </p>
              {completed ? <span className="chip success">הושלם</span> : <span className="chip">בתהליך</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
