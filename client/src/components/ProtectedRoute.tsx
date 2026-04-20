import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ requireTeacher = false }: { requireTeacher?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="centered">טוען...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireTeacher && user.role !== "teacher") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
