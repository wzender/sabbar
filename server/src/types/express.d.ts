import "express-session";
import { AppRole } from "./models";

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      role: AppRole;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    passport?: {
      user: number;
    };
  }
}

export {};
