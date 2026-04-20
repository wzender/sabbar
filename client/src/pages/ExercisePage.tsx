import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../lib/api";
import { Exercise } from "../types";

export function ExercisePage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    apiGet<Exercise[]>(`/api/lessons/${lessonId}/exercises`).then(setExercises);
  }, [lessonId]);

  const current = useMemo(() => exercises[index], [exercises, index]);

  const onNext = async () => {
    if (!current) return;
    await apiPost("/api/progress", { exerciseId: current.id });

    if (index === exercises.length - 1) {
      navigate(`/lessons/${lessonId}/complete`);
      return;
    }

    setIndex((prev) => prev + 1);
    setRevealed(false);
  };

  if (!current) {
    return <div className="centered">טוען תרגיל...</div>;
  }

  return (
    <div className="card exercise">
      <div className="subtle">
        תרגיל {index + 1} מתוך {exercises.length}
      </div>
      <h2>{current.prompt_he}</h2>

      {!revealed && (
        <button className="button" onClick={() => setRevealed(true)}>
          הצג תרגום
        </button>
      )}

      {revealed && (
        <>
          <div className="answer-box">{current.answer_he_tatiq}</div>

          <button className="button secondary" disabled>
            שמע אודיו (בקרוב)
          </button>

          {current.tips_for_hebrew_speaking.length > 0 && (
            <div className="tips-list">
              {current.tips_for_hebrew_speaking.map((tip, tipIndex) => (
                <div className="tip-card" key={`${tip.word}-${tipIndex}`}>
                  <strong>{tip.word}</strong>
                  <p>{tip.issue}</p>
                  <p className="guidance">{tip.guidance_he}</p>
                </div>
              ))}
            </div>
          )}

          <button className="button" onClick={onNext}>
            הבא
          </button>
        </>
      )}
    </div>
  );
}
