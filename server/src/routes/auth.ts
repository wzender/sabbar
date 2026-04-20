import { Router } from "express";
import passport from "../auth";
import { query } from "../db";

const router = Router();

function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL);
}

router.get("/status", (_req, res) => {
  res.json({ googleConfigured: isGoogleConfigured() });
});

router.get("/google", (req, res, next) => {
  if (!isGoogleConfigured()) {
    const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    if (req.accepts("html")) {
      return res.redirect(`${clientOrigin}/?authError=google_not_configured`);
    }
    return res.status(503).json({ error: "Google OAuth is not configured" });
  }
  return passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth-failed",
    session: true,
  }),
  (_req, res) => {
    res.redirect(process.env.CLIENT_ORIGIN || "http://localhost:5173");
  },
);

router.get("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }
    req.session.destroy(() => {
      res.clearCookie("sabbar.sid");
      res.redirect(process.env.CLIENT_ORIGIN || "http://localhost:5173");
    });
  });
});

router.get("/failed", (_req, res) => {
  res.status(401).json({ error: "Authentication failed" });
});

router.post("/dev-login", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }

  const email = String(req.body?.email || "student@example.com").toLowerCase();
  const name = String(req.body?.name || "Dev User");
  const role = email === (process.env.TEACHER_EMAIL || "").toLowerCase() ? "teacher" : "student";
  const googleId = `dev-${email}`;

  const upsert = await query<{ id: number; email: string; name: string; role: "student" | "teacher" }>(
    `
      INSERT INTO users (google_id, email, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (google_id) DO UPDATE
      SET email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role
      RETURNING id, email, name, role
    `,
    [googleId, email, name, role],
  );

  req.login(upsert.rows[0], (error) => {
    if (error) {
      return res.status(500).json({ error: "Failed to login" });
    }
    return res.json({ user: upsert.rows[0] });
  });
});

export default router;
