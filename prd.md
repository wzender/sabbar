# Sabbar — Product Requirements Document (PRD)

## 1. Overview

**Sabbar** is a web application for teaching Hebrew-speaking students Palestinian dialect Arabic. Students practice via structured daily lessons composed of exercises. Each exercise presents a Hebrew sentence; the student attempts the Arabic translation, then reveals the transliterated answer with pronunciation tips. A teacher manages content and monitors student progress.

---

## 2. Goals

- Provide a simple, structured drill-based Arabic practice tool.
- Track per-student progress at the exercise level.
- Give the teacher full visibility and control over lessons and student progress.
- Deliver a fully Hebrew, RTL user interface.

---

## 3. Users & Roles

| Role | Auth | Description |
|---------|-------------------------------|----------------------------------------------|
| Student | Google OAuth | Any user who signs in via Google. |
| Teacher | Google OAuth (whitelisted email) | A single teacher whose email is set in an environment variable (`TEACHER_EMAIL`). Same login flow, elevated permissions. |

---

## 4. Tech Stack & Deployment

| Layer | Technology |
|------------|-------------------------------|
| Frontend | React (Vite) |
| Backend | Node.js (Express) |
| Database | PostgreSQL |
| Auth | Google OAuth 2.0 |
| Hosting | Render.com (web service + managed PostgreSQL) |
| Platforms | Web app (responsive for desktop & mobile browsers) |

---

## 5. Data Model

### 5.1 Lesson Content (JSON → DB)

Content is organized as **Days → Lessons → Exercises**.

Each exercise (sourced from JSON files) contains:

| Field | Type | Description |
|----------------------------|----------|------------------------------------------------|
| `lesson_id` | integer | Lesson number within a day. |
| `sentence_id` | integer | Exercise order within a lesson. |
| `prompt_he` | string | Hebrew sentence shown to the student. |
| `accepted_answers` | string | Canonical Arabic answer (Arabic script, stored but **never shown to students**). |
| `answer_he_tatiq` | string | Hebrew-transliterated Arabic answer (shown to the student). |
| `tips_for_hebrew_speaking` | array | Pronunciation tips (see below). |

Each tip object:

| Field | Type | Description |
|----------------|--------|----------------------------------------------|
| `word` | string | The specific word the tip applies to. |
| `issue` | string | Short description of the pronunciation trap. |
| `guidance_he` | string | Hebrew guidance on correct pronunciation. |

### 5.2 Database Entities

**users**
- `id` (PK)
- `google_id` (unique)
- `email`
- `name`
- `avatar_url`
- `role` — `student` | `teacher` (derived from `TEACHER_EMAIL` env var)
- `created_at`

**days**
- `id` (PK)
- `day_number` (unique, e.g. 2, 3)
- `title` (optional display name)
- `created_at`

**lessons**
- `id` (PK)
- `day_id` (FK → days)
- `lesson_number`
- `title` (optional)
- `created_at`

**exercises**
- `id` (PK)
- `lesson_id` (FK → lessons)
- `sentence_order`
- `prompt_he`
- `accepted_answers`
- `answer_he_tatiq`
- `tips_for_hebrew_speaking` (JSONB)

**student_progress**
- `id` (PK)
- `user_id` (FK → users)
- `exercise_id` (FK → exercises)
- `completed` (boolean)
- `completed_at` (timestamp)

---

## 6. Features

### 6.1 Authentication

- Google OAuth 2.0 sign-in.
- On first login, a user record is created.
- If the signed-in email matches `TEACHER_EMAIL`, the user is assigned the `teacher` role.
- All other users are `student`.

### 6.2 Student — Day & Lesson Selection

- After login, the student sees a list of available **days**.
- Selecting a day shows the list of **lessons** for that day.
- Each lesson shows a completion indicator (e.g. ✓ completed, progress fraction).

### 6.3 Student — Exercise Flow

1. A single exercise is shown at a time.
2. The **Hebrew sentence** (`prompt_he`) is displayed prominently.
3. The student attempts the Arabic pronunciation out loud.
4. The student presses a **"הצג תרגום"** (Show Translation) button.
5. The system reveals:
   - The **transliterated answer** (`answer_he_tatiq`).
   - **Pronunciation tips** (`tips_for_hebrew_speaking`), displayed per-word in a clear, user-friendly format:
     - The word in bold.
     - The issue description.
     - The guidance in a highlighted/callout style.
   - If the tips array is empty, no tips section is shown.
6. The student presses **"הבא"** (Next) to advance to the next exercise.
7. When the student completes the last exercise, a summary screen is shown and the lesson is marked complete.

### 6.4 Student — Progress View

- A dashboard or indicator on the day/lesson selection screen showing:
  - Which lessons have been completed.
  - How many exercises were completed within each lesson.

### 6.5 Teacher — Admin UI

- **Lesson Management:**
  - View all days and lessons.
  - Create / edit / delete days.
  - Create / edit / delete lessons within a day.
  - Create / edit / delete exercises within a lesson.
  - Bulk-import lessons from JSON files (matching the existing JSON format).
- **Student Progress Dashboard:**
  - View a list of all students.
  - Per-student: see which days/lessons/exercises they completed and when.

### 6.6 Audio (Placeholder — V2)

- The UI should include a **disabled/placeholder audio button** on each exercise.
- In a future version, this will play TTS or pre-recorded audio of the Arabic pronunciation.
- No audio functionality is required for V1.

---

## 7. UI / UX Requirements

- **Language:** All UI text in Hebrew.
- **Direction:** Full RTL layout.
- **Responsive:** Must work well on desktop and mobile browsers.
- **Exercise screen:** Clean, focused layout — one exercise at a time, large readable text for Hebrew and transliterated content.
- **Tips display:** Each tip rendered as a card or callout — word highlighted, issue and guidance clearly separated.
- **Arabic script is never displayed to the student.** Only `answer_he_tatiq` (Hebrew transliteration) is shown.

---

## 8. API Endpoints (High-Level)

| Method | Endpoint | Description |
|--------|----------------------------------|----------------------------------------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/me` | Current user info + role |
| GET | `/api/days` | List all days |
| GET | `/api/days/:dayId/lessons` | List lessons for a day |
| GET | `/api/lessons/:lessonId/exercises` | List exercises for a lesson |
| POST | `/api/progress` | Mark exercise as completed |
| GET | `/api/progress` | Get current student's progress |
| GET | `/api/admin/students` | (Teacher) List all students |
| GET | `/api/admin/students/:id/progress` | (Teacher) Student's progress |
| POST | `/api/admin/days` | (Teacher) Create day |
| PUT | `/api/admin/days/:id` | (Teacher) Update day |
| DELETE | `/api/admin/days/:id` | (Teacher) Delete day |
| POST | `/api/admin/lessons` | (Teacher) Create lesson |
| PUT | `/api/admin/lessons/:id` | (Teacher) Update lesson |
| DELETE | `/api/admin/lessons/:id` | (Teacher) Delete lesson |
| POST | `/api/admin/exercises` | (Teacher) Create exercise |
| PUT | `/api/admin/exercises/:id` | (Teacher) Update exercise |
| DELETE | `/api/admin/exercises/:id` | (Teacher) Delete exercise |
| POST | `/api/admin/import` | (Teacher) Bulk import from JSON |

---

## 9. Non-Functional Requirements

- **Security:** OAuth-only auth; teacher endpoints protected by role check; no raw SQL exposure.
- **Performance:** Lesson data is small — no special caching needed for V1.
- **Persistence:** PostgreSQL on Render managed DB; data survives redeployments.
- **Accessibility:** Semantic HTML; proper `lang` and `dir` attributes for RTL.

---

## 10. Out of Scope (V1)

- Audio playback (placeholder only).
- Speech recognition / voice input.
- Spaced repetition or adaptive ordering.
- Multi-teacher support.
- Student-to-student interaction.
- Offline mode / PWA.

---

## 11. Open Questions

*None currently — update as they arise during development.*
