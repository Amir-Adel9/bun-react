import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Route imports
import authRouter from "./routes/auth";
import learningRouter from "./routes/learning";
import adminRouter from "./routes/admin";

// Import HTML bundle for SPA (Bun handles bundling)
import indexHtml from "../client/index.html";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000"],
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// API Routes - chain for proper type inference
const apiRoutes = app
  .route("/", authRouter)
  .route("/api/learning", learningRouter)
  .route("/api/admin", adminRouter);

// Export the API type for RPC client
export type AppType = typeof apiRoutes;

// Start server with Bun - combine Hono API with Bun's HTML bundling
const server = Bun.serve({
  port: 3000,
  development: process.env.NODE_ENV !== "production",
  // Use static for the HTML bundle - Bun handles bundling automatically
  static: {
    "/": indexHtml,
    "/admin": indexHtml,
    "/admin/categories": indexHtml,
    "/admin/content": indexHtml,
  },
  fetch: async (req) => {
    const url = new URL(req.url);
    
    // Handle API routes with Hono
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(req);
    }
    
    // Serve static assets
    if (url.pathname.startsWith("/assets/")) {
      const filePath = `./src/client${url.pathname}`;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
    }
    
    // For any other SPA routes (like /admin/content/:id), serve the HTML bundle
    // Use the indexHtml's fetch capability
    return (indexHtml as any).fetch(req);
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}`);
