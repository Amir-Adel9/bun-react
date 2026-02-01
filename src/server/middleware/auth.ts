import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";

// Type for the user in context
type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
};

// Middleware to require authentication
export const requireAuth = createMiddleware<{
  Variables: {
    user: User;
    session: Session;
  };
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", session.user as User);
  c.set("session", session.session as Session);
  await next();
});

// Middleware to require admin role
export const requireAdmin = createMiddleware<{
  Variables: {
    user: User;
    session: Session;
  };
}>(async (c, next) => {
  const user = c.get("user");
  
  if (!user || user.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  await next();
});
