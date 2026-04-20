# Sabbar — Task List

## Phase 1: Project Setup

- [x] 1.1 Initialize monorepo structure (`client/` + `server/`)
- [x] 1.2 Set up React (Vite) frontend with TypeScript
- [x] 1.3 Set up Node.js (Express) backend with TypeScript
- [x] 1.4 Configure ESLint and Prettier
- [x] 1.5 Create `.env.example` with required variables (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TEACHER_EMAIL`, `SESSION_SECRET`)
- [x] 1.6 Add RTL and Hebrew font support to frontend (HTML `dir="rtl"` + `lang="he"`)

## Phase 2: Database

- [x] 2.1 Set up PostgreSQL connection (pg / node-postgres)
- [x] 2.2 Create migration: `users` table
- [x] 2.3 Create migration: `days` table
- [x] 2.4 Create migration: `lessons` table
- [x] 2.5 Create migration: `exercises` table (with JSONB `tips_for_hebrew_speaking`)
- [x] 2.6 Create migration: `student_progress` table
- [x] 2.7 Write seed script to import existing JSON lesson files into the DB

## Phase 3: Authentication

- [x] 3.1 Set up Google OAuth 2.0 (passport-google-oauth20 or similar)
- [x] 3.2 Implement `/api/auth/google` and `/api/auth/callback` endpoints
- [x] 3.3 Create session management (express-session + connect-pg-simple)
- [x] 3.4 Implement `/api/me` endpoint (return user info + role)
- [x] 3.5 Add role derivation logic: match email against `TEACHER_EMAIL` env var
- [x] 3.6 Create auth middleware (`requireAuth`, `requireTeacher`)
- [x] 3.7 Build frontend login page with Google sign-in button
- [x] 3.8 Add auth context/provider in React (store current user, role)
- [x] 3.9 Add protected route wrapper (redirect to login if unauthenticated)

## Phase 4: Student — Core Exercise Flow

- [x] 4.1 Implement `GET /api/days` — list all days
- [x] 4.2 Implement `GET /api/days/:dayId/lessons` — list lessons for a day (with progress summary)
- [x] 4.3 Implement `GET /api/lessons/:lessonId/exercises` — list exercises for a lesson
- [x] 4.4 Build **Day Selection** screen (list of days with progress indicators)
- [x] 4.5 Build **Lesson Selection** screen (list of lessons per day with completion status)
- [x] 4.6 Build **Exercise** screen:
  - [x] 4.6a Display `prompt_he` prominently
  - [x] 4.6b "הצג תרגום" button to reveal answer
  - [x] 4.6c Display `answer_he_tatiq` on reveal
  - [x] 4.6d Display `tips_for_hebrew_speaking` as cards (word → issue → guidance)
  - [x] 4.6e Hide tips section when array is empty
  - [x] 4.6f "הבא" (Next) button to advance to next exercise
  - [x] 4.6g Disabled/placeholder audio button (V2)
- [x] 4.7 Build **Lesson Complete** summary screen

## Phase 5: Progress Tracking

- [x] 5.1 Implement `POST /api/progress` — mark exercise as completed
- [x] 5.2 Implement `GET /api/progress` — get current student's progress
- [x] 5.3 Mark exercise complete when student presses "Next"
- [x] 5.4 Show per-lesson progress on Lesson Selection screen (e.g. "7/15")
- [x] 5.5 Show completed indicator (✓) on Day Selection screen when all lessons in a day are done

## Phase 6: Teacher — Admin UI

- [x] 6.1 Implement admin CRUD endpoints for days (`POST`, `PUT`, `DELETE /api/admin/days`)
- [x] 6.2 Implement admin CRUD endpoints for lessons (`POST`, `PUT`, `DELETE /api/admin/lessons`)
- [x] 6.3 Implement admin CRUD endpoints for exercises (`POST`, `PUT`, `DELETE /api/admin/exercises`)
- [x] 6.4 Implement `POST /api/admin/import` — bulk JSON import
- [x] 6.5 Implement `GET /api/admin/students` — list all students
- [x] 6.6 Implement `GET /api/admin/students/:id/progress` — per-student progress
- [x] 6.7 Build **Admin Dashboard** layout (nav: Lessons | Students)
- [x] 6.8 Build **Day/Lesson/Exercise Management** pages (list, create, edit, delete)
- [x] 6.9 Build **JSON Import** page (file upload, parse, preview, confirm)
- [x] 6.10 Build **Student Progress Dashboard** (student list → per-student detail view)

## Phase 7: Polish & Responsiveness

- [x] 7.1 Ensure full RTL layout on all pages
- [x] 7.2 Test and fix mobile responsiveness
- [x] 7.3 Add loading states and error handling UI
- [x] 7.4 Add empty states (no days, no lessons, no exercises)
- [x] 7.5 Verify Arabic script is never rendered in student-facing UI

## Phase 8: Deployment

- [x] 8.1 Create Render web service for backend
- [x] 8.2 Create Render managed PostgreSQL database
- [x] 8.3 Create Render static site (or client build served by Express)
- [x] 8.4 Configure environment variables on Render
- [x] 8.5 Run migrations and seed data on production DB
- [x] 8.6 Set up Google OAuth credentials for production redirect URI
- [x] 8.7 Smoke test full flow on production (login → pick day → do lesson → check progress)
