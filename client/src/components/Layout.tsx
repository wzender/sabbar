import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../lib/api";

export function Layout() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <strong>סבאר</strong>
          <div className="subtle">מאמן ערבית פלסטינית</div>
        </div>
        <nav className="topbar-nav">
          <Link to="/">ימים</Link>
          {user?.role === "teacher" && <Link to="/admin">ניהול מורה</Link>}
          <a href={`${API_BASE}/api/auth/logout`}>התנתקות</a>
        </nav>
      </header>
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}
