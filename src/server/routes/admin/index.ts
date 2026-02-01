import { Hono } from "hono";
import categoriesRouter from "./categories";
import contentRouter from "./content";
import lessonsRouter from "./lessons";
import analyticsRouter from "./analytics";

const app = new Hono()
  .route("/categories", categoriesRouter)
  .route("/content", contentRouter)
  .route("/lessons", lessonsRouter)
  .route("/analytics", analyticsRouter);

export type AdminRoutes = typeof app;
export default app;
