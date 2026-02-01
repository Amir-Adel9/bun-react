import { Hono } from "hono";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import { db } from "../../db";
import { learningLessons, learningContent } from "../../db/schema";
import { requireAuth, requireAdmin } from "../../middleware/auth";

// Chain routes for proper Hono RPC type inference
const app = new Hono()
  .use("*", requireAuth, requireAdmin)
  // POST /api/admin/lessons/content/:contentId/lessons - Add lesson to content
  .post("/content/:contentId/lessons", async (c) => {
  const contentId = c.req.param("contentId");
  const body = await c.req.json();
  const { title, body: lessonBody, orderIndex, estimatedMinutes } = body;

  if (!title || !lessonBody) {
    return c.json({ error: "Title and body are required" }, 400);
  }

  // Check if content exists
  const content = await db.query.learningContent.findFirst({
    where: eq(learningContent.id, contentId),
  });

  if (!content) {
    return c.json({ error: "Content not found" }, 404);
  }

  // If orderIndex not provided, add to end
  let finalOrderIndex = orderIndex;
  if (finalOrderIndex === undefined) {
    const [{ maxOrder }] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${learningLessons.orderIndex}), -1)` })
      .from(learningLessons)
      .where(eq(learningLessons.contentId, contentId));
    finalOrderIndex = maxOrder + 1;
  }

  const [lesson] = await db
    .insert(learningLessons)
    .values({
      contentId,
      title,
      body: lessonBody,
      orderIndex: finalOrderIndex,
      estimatedMinutes: estimatedMinutes || null,
    })
    .returning();

  return c.json({ data: lesson }, 201);
})
// PUT /api/admin/lessons/:id - Update lesson
.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { title, body: lessonBody, orderIndex, estimatedMinutes } = body;

  const existing = await db.query.learningLessons.findFirst({
    where: eq(learningLessons.id, id),
  });

  if (!existing) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  // Handle reordering if orderIndex changed
  if (orderIndex !== undefined && orderIndex !== existing.orderIndex) {
    const contentId = existing.contentId;
    const oldIndex = existing.orderIndex;
    const newIndex = orderIndex;

    if (newIndex > oldIndex) {
      // Moving down: shift lessons between old and new positions up
      await db
        .update(learningLessons)
        .set({ orderIndex: sql`${learningLessons.orderIndex} - 1` })
        .where(
          and(
            eq(learningLessons.contentId, contentId),
            gt(learningLessons.orderIndex, oldIndex),
            lt(learningLessons.orderIndex, newIndex + 1)
          )
        );
    } else {
      // Moving up: shift lessons between new and old positions down
      await db
        .update(learningLessons)
        .set({ orderIndex: sql`${learningLessons.orderIndex} + 1` })
        .where(
          and(
            eq(learningLessons.contentId, contentId),
            gt(learningLessons.orderIndex, newIndex - 1),
            lt(learningLessons.orderIndex, oldIndex)
          )
        );
    }
  }

  const [lesson] = await db
    .update(learningLessons)
    .set({
      title: title ?? existing.title,
      body: lessonBody ?? existing.body,
      orderIndex: orderIndex ?? existing.orderIndex,
      estimatedMinutes: estimatedMinutes !== undefined ? estimatedMinutes : existing.estimatedMinutes,
    })
    .where(eq(learningLessons.id, id))
    .returning();

  return c.json({ data: lesson });
})
// DELETE /api/admin/lessons/:id - Delete lesson
.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await db.query.learningLessons.findFirst({
    where: eq(learningLessons.id, id),
  });

  if (!existing) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  // Delete the lesson
  await db.delete(learningLessons).where(eq(learningLessons.id, id));

  // Reorder remaining lessons
  await db
    .update(learningLessons)
    .set({ orderIndex: sql`${learningLessons.orderIndex} - 1` })
    .where(
      and(
        eq(learningLessons.contentId, existing.contentId),
        gt(learningLessons.orderIndex, existing.orderIndex)
      )
    );

  return c.json({ message: "Lesson deleted" });
});

export type LessonsRoutes = typeof app;
export default app;
