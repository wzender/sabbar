import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { AdminPage } from "./pages/AdminPage";
import { DaysPage } from "./pages/DaysPage";
import { ExercisePage } from "./pages/ExercisePage";
import { LessonCompletePage } from "./pages/LessonCompletePage";
import { LessonsPage } from "./pages/LessonsPage";
import { LoginPage } from "./pages/LoginPage";

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div className="centered">טוען...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/days" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/days" element={<DaysPage />} />
          <Route path="/days/:dayId/lessons" element={<LessonsPage />} />
          <Route path="/lessons/:lessonId/exercise" element={<ExercisePage />} />
          <Route path="/lessons/:lessonId/complete" element={<LessonCompletePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute requireTeacher />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
