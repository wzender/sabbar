import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { query } from "./db";
import { AppRole } from "./types/models";

function roleFromEmail(email: string): AppRole {
  return email.toLowerCase() === (process.env.TEACHER_EMAIL || "").toLowerCase()
    ? "teacher"
    : "student";
}

function getPrimaryEmail(profile: Profile): string {
  const email = profile.emails?.[0]?.value;
  if (!email) {
    throw new Error("Google profile missing email");
  }
  return email;
}

passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const result = await query<{
      id: number;
      email: string;
      name: string;
      role: AppRole;
    }>("SELECT id, email, name, role FROM users WHERE id = $1", [id]);

    if (!result.rows[0]) {
      done(null, false);
      return;
    }

    done(null, result.rows[0]);
  } catch (error) {
    done(error as Error);
  }
});

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL;

if (clientID && clientSecret && callbackURL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = getPrimaryEmail(profile);
          const name = profile.displayName || email;
          const avatarUrl = profile.photos?.[0]?.value || null;
          const role = roleFromEmail(email);

          const upsert = await query<{
            id: number;
            email: string;
            name: string;
            role: AppRole;
          }>(
            `
            INSERT INTO users (google_id, email, name, avatar_url, role)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (google_id) DO UPDATE
            SET email = EXCLUDED.email,
                name = EXCLUDED.name,
                avatar_url = EXCLUDED.avatar_url,
                role = EXCLUDED.role
            RETURNING id, email, name, role
          `,
            [profile.id, email, name, avatarUrl, role],
          );

          done(null, upsert.rows[0]);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );
}

export default passport;
