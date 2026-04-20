import { Link } from "react-router-dom";

export function LessonCompletePage() {
  return (
    <div className="card centered-block">
      <h1>כל הכבוד!</h1>
      <p>סיימת את השיעור בהצלחה.</p>
      <Link to="/" className="button">
        חזרה לימים
      </Link>
    </div>
  );
}
