import { useEffect, useMemo, useState } from "react";
import { API_BASE, apiDelete, apiGet, apiPost } from "../lib/api";
import { Day, Exercise, Lesson } from "../types";

interface Student {
  id: number;
  email: string;
  name: string;
}

interface StudentProgressRow {
  day_number: number;
  lesson_number: number;
  sentence_order: number;
  completed_at: string;
}

export function AdminPage() {
  const [days, setDays] = useState<Day[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgressRow[]>([]);

  const [dayNumber, setDayNumber] = useState("4");
  const [lessonNumber, setLessonNumber] = useState("1");
  const [importDayNumber, setImportDayNumber] = useState("2");
  const [importLessonNumber, setImportLessonNumber] = useState("1");
  const [importFile, setImportFile] = useState<File | null>(null);

  const refreshDays = async () => {
    const data = await apiGet<Day[]>("/api/admin/days");
    setDays(data);
    if (!selectedDayId && data.length > 0) {
      setSelectedDayId(data[0].id);
    }
  };

  const refreshStudents = async () => {
    const data = await apiGet<Student[]>("/api/admin/students");
    setStudents(data);
  };

  const refreshLessons = async (dayId: number) => {
    const data = await apiGet<Lesson[]>(`/api/admin/days/${dayId}/lessons`);
    setLessons(data);
    if (data.length > 0) {
      setSelectedLessonId(data[0].id);
    } else {
      setSelectedLessonId(null);
      setExercises([]);
    }
  };

  const refreshExercises = async (lessonId: number) => {
    const data = await apiGet<Exercise[]>(`/api/admin/lessons/${lessonId}/exercises`);
    setExercises(data);
  };

  useEffect(() => {
    void refreshDays();
    void refreshStudents();
  }, []);

  useEffect(() => {
    if (!selectedDayId) return;
    void refreshLessons(selectedDayId);
  }, [selectedDayId]);

  useEffect(() => {
    if (!selectedLessonId) return;
    void refreshExercises(selectedLessonId);
  }, [selectedLessonId]);

  const selectedDay = useMemo(() => days.find((d) => d.id === selectedDayId), [days, selectedDayId]);

  const onCreateDay = async () => {
    await apiPost("/api/admin/days", { day_number: Number(dayNumber), title: null });
    await refreshDays();
  };

  const onDeleteDay = async (id: number) => {
    await apiDelete(`/api/admin/days/${id}`);
    await refreshDays();
  };

  const onCreateLesson = async () => {
    if (!selectedDayId) return;
    await apiPost("/api/admin/lessons", {
      day_id: selectedDayId,
      lesson_number: Number(lessonNumber),
      title: null,
    });
    await refreshLessons(selectedDayId);
  };

  const onDeleteLesson = async (id: number) => {
    await apiDelete(`/api/admin/lessons/${id}`);
    if (selectedDayId) {
      await refreshLessons(selectedDayId);
    }
  };

  const onSelectStudent = async (studentId: number) => {
    const rows = await apiGet<StudentProgressRow[]>(`/api/admin/students/${studentId}/progress`);
    setStudentProgress(rows);
  };

  const onImport = async () => {
    if (!importFile) return;

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("dayNumber", importDayNumber);
    formData.append("lessonNumber", importLessonNumber);

    await fetch(`${API_BASE}/api/admin/import`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    await refreshDays();
    if (selectedDayId) {
      await refreshLessons(selectedDayId);
    }
  };

  return (
    <div className="admin-layout">
      <section className="card">
        <h2>ניהול ימים ושיעורים</h2>

        <div className="inline-form">
          <input value={dayNumber} onChange={(e) => setDayNumber(e.target.value)} placeholder="מספר יום" />
          <button className="button" onClick={onCreateDay}>
            הוסף יום
          </button>
        </div>

        <div className="list">
          {days.map((day) => (
            <div className="list-item" key={day.id}>
              <button className="link-button" onClick={() => setSelectedDayId(day.id)}>
                יום {String(day.day_number).padStart(2, "0")}
              </button>
              <button className="button danger" onClick={() => onDeleteDay(day.id)}>
                מחק
              </button>
            </div>
          ))}
        </div>

        {selectedDay && (
          <>
            <h3>שיעורים של יום {selectedDay.day_number}</h3>
            <div className="inline-form">
              <input value={lessonNumber} onChange={(e) => setLessonNumber(e.target.value)} placeholder="מספר שיעור" />
              <button className="button" onClick={onCreateLesson}>
                הוסף שיעור
              </button>
            </div>
            <div className="list">
              {lessons.map((lesson) => (
                <div className="list-item" key={lesson.id}>
                  <button className="link-button" onClick={() => setSelectedLessonId(lesson.id)}>
                    שיעור {String(lesson.lesson_number).padStart(2, "0")}
                  </button>
                  <button className="button danger" onClick={() => onDeleteLesson(lesson.id)}>
                    מחק
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedLessonId && (
          <>
            <h3>תרגילים בשיעור</h3>
            <div className="list">
              {exercises.map((exercise) => (
                <div className="exercise-preview" key={exercise.id}>
                  <strong>{exercise.sentence_order}. </strong>
                  <span>{exercise.prompt_he}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h3>ייבוא JSON</h3>
        <div className="list">
          <input value={importDayNumber} onChange={(e) => setImportDayNumber(e.target.value)} placeholder="מספר יום" />
          <input
            value={importLessonNumber}
            onChange={(e) => setImportLessonNumber(e.target.value)}
            placeholder="מספר שיעור"
          />
          <input type="file" accept=".json" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
          <button className="button" onClick={onImport}>
            ייבוא שיעור מקובץ
          </button>
        </div>
      </section>

      <section className="card">
        <h2>מעקב תלמידים</h2>
        <div className="list">
          {students.map((student) => (
            <button key={student.id} className="link-button" onClick={() => onSelectStudent(student.id)}>
              {student.name} ({student.email})
            </button>
          ))}
        </div>

        <div className="list">
          {studentProgress.map((row, index) => (
            <div className="list-item" key={`${row.completed_at}-${index}`}>
              <span>
                יום {row.day_number}, שיעור {row.lesson_number}, תרגיל {row.sentence_order}
              </span>
              <span className="subtle">{new Date(row.completed_at).toLocaleString("he-IL")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
