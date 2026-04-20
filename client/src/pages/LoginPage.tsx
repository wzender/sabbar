import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { loginUrl, devLogin, googleAuthEnabled, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("student@example.com");
  const [name, setName] = useState("תלמיד לדוגמה");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/days", { replace: true });
    }
  }, [user, navigate]);

  const onDevLogin = async () => {
    setError("");
    try {
      await devLogin(email, name);
    } catch {
      setError("התחברות פיתוח נכשלה");
    }
  };

  return (
    <div className="card auth-card">
      <h1>ברוכים הבאים לסבאר</h1>
      <p>תרגול יומי בערבית פלסטינית לדוברי עברית</p>

      {googleAuthEnabled ? (
        <a className="button" href={loginUrl}>
          התחברות עם Google
        </a>
      ) : (
        <p className="subtle">התחברות עם Google אינה זמינה כרגע בסביבה המקומית.</p>
      )}

      <div className="divider" />

      <h2>מצב פיתוח</h2>
      <p className="subtle">להרצה מקומית ללא הגדרת Google OAuth</p>
      <label>
        אימייל
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        שם
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="button secondary" onClick={onDevLogin}>
        התחברות פיתוח
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
