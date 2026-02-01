import { Hono } from "hono";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  categories,
  learningContent,
  learningLessons,
  studentContentEnrollments,
  studentLessonProgress,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";

// Chain routes for proper Hono RPC type inference
const app = new Hono()
  // GET /api/learning/content - List published content
  .get("/content", async (c) => {
    const categorySlug = c.req.query("category");
    const difficulty = c.req.query("difficulty");

    let query = db
      .select({
        id: learningContent.id,
        title: learningContent.title,
        slug: learningContent.slug,
        description: learningContent.description,
        difficulty: learningContent.difficulty,
        estimatedMinutes: learningContent.estimatedMinutes,
        thumbnailUrl: learningContent.thumbnailUrl,
        createdAt: learningContent.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },
      })
      .from(learningContent)
      .innerJoin(categories, eq(learningContent.categoryId, categories.id))
      .where(eq(learningContent.published, true))
      .orderBy(desc(learningContent.createdAt));

    const results = await query;

    // Filter in memory for simplicity (can optimize with dynamic where later)
    let filtered = results;
    if (categorySlug) {
      filtered = filtered.filter((r) => r.category.slug === categorySlug);
    }
    if (difficulty) {
      filtered = filtered.filter((r) => r.difficulty === difficulty);
    }

    return c.json({ data: filtered });
  })
  // GET /api/learning/content/:slug - Get content detail with lessons
  .get("/content/:slug", async (c) => {
    const slug = c.req.param("slug");

    const content = await db.query.learningContent.findFirst({
      where: and(
        eq(learningContent.slug, slug),
        eq(learningContent.published, true)
      ),
      with: {
        category: true,
        lessons: {
          orderBy: [asc(learningLessons.orderIndex)],
        },
      },
    });

    if (!content) {
      return c.json({ error: "Content not found" }, 404);
    }

    return c.json({ data: content });
  })
  // GET /api/learning/categories - List all categories
  .get("/categories", async (c) => {
    const result = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.displayOrder));

    return c.json({ data: result });
  })
  // POST /api/learning/content/:id/enroll - Enroll in content
  .post("/content/:id/enroll", requireAuth, async (c) => {
    const contentId = c.req.param("id");
    const user = c.get("user");

    // Check if content exists and is published
    const content = await db.query.learningContent.findFirst({
      where: and(
        eq(learningContent.id, contentId),
        eq(learningContent.published, true)
      ),
    });

    if (!content) {
      return c.json({ error: "Content not found" }, 404);
    }

    // Upsert enrollment (idempotent)
    const existing = await db.query.studentContentEnrollments.findFirst({
      where: and(
        eq(studentContentEnrollments.userId, user.id),
        eq(studentContentEnrollments.contentId, contentId)
      ),
    });

    if (existing) {
      return c.json({ data: existing, message: "Already enrolled" });
    }

    const [enrollment] = await db
      .insert(studentContentEnrollments)
      .values({
        userId: user.id,
        contentId: contentId,
        status: "in_progress",
        progressPercentage: 0,
      })
      .returning();

    return c.json({ data: enrollment, message: "Enrolled successfully" }, 201);
  })
  // GET /api/learning/my-library - Get enrolled content for user
  .get("/my-library", requireAuth, async (c) => {
    const user = c.get("user");

    const enrollments = await db
      .select({
        id: studentContentEnrollments.id,
        status: studentContentEnrollments.status,
        progressPercentage: studentContentEnrollments.progressPercentage,
        startedAt: studentContentEnrollments.startedAt,
        completedAt: studentContentEnrollments.completedAt,
        content: {
          id: learningContent.id,
          title: learningContent.title,
          slug: learningContent.slug,
          description: learningContent.description,
          difficulty: learningContent.difficulty,
          estimatedMinutes: learningContent.estimatedMinutes,
          thumbnailUrl: learningContent.thumbnailUrl,
        },
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },
      })
      .from(studentContentEnrollments)
      .innerJoin(
        learningContent,
        eq(studentContentEnrollments.contentId, learningContent.id)
      )
      .innerJoin(categories, eq(learningContent.categoryId, categories.id))
      .where(eq(studentContentEnrollments.userId, user.id))
      .orderBy(desc(studentContentEnrollments.startedAt));

    return c.json({ data: enrollments });
  })
  // POST /api/learning/lessons/:id/complete - Mark lesson complete
  .post("/lessons/:id/complete", requireAuth, async (c) => {
    const lessonId = c.req.param("id");
    const user = c.get("user");

    // Get lesson and its content
    const lesson = await db.query.learningLessons.findFirst({
      where: eq(learningLessons.id, lessonId),
      with: {
        content: true,
      },
    });

    if (!lesson) {
      return c.json({ error: "Lesson not found" }, 404);
    }

    // Check if user is enrolled in the content
    const enrollment = await db.query.studentContentEnrollments.findFirst({
      where: and(
        eq(studentContentEnrollments.userId, user.id),
        eq(studentContentEnrollments.contentId, lesson.contentId)
      ),
    });

    if (!enrollment) {
      return c.json({ error: "Not enrolled in this content" }, 403);
    }

    // Insert lesson progress (idempotent via unique constraint)
    try {
      await db
        .insert(studentLessonProgress)
        .values({
          userId: user.id,
          lessonId: lessonId,
        })
        .onConflictDoNothing();
    } catch {
      // Already completed, ignore
    }

    // Calculate new progress
    const [{ totalLessons }] = await db
      .select({ totalLessons: sql<number>`count(*)::int` })
      .from(learningLessons)
      .where(eq(learningLessons.contentId, lesson.contentId));

    const [{ completedLessons }] = await db
      .select({ completedLessons: sql<number>`count(*)::int` })
      .from(studentLessonProgress)
      .innerJoin(
        learningLessons,
        eq(studentLessonProgress.lessonId, learningLessons.id)
      )
      .where(
        and(
          eq(studentLessonProgress.userId, user.id),
          eq(learningLessons.contentId, lesson.contentId)
        )
      );

    const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
    const isCompleted = progressPercentage === 100;

    // Update enrollment progress
    await db
      .update(studentContentEnrollments)
      .set({
        progressPercentage,
        status: isCompleted ? "completed" : "in_progress",
        completedAt: isCompleted ? new Date() : null,
      })
      .where(eq(studentContentEnrollments.id, enrollment.id));

    return c.json({
      data: {
        lessonId,
        progressPercentage,
        isCompleted,
      },
    });
  });

export type LearningRoutes = typeof app;
export default app;
