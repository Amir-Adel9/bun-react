import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../../db";
import {
  categories,
  learningContent,
  learningLessons,
  studentContentEnrollments,
} from "../../db/schema";
import { requireAuth, requireAdmin } from "../../middleware/auth";

// Chain routes for proper Hono RPC type inference
const app = new Hono()
  .use("*", requireAuth, requireAdmin)
  // GET /api/admin/analytics - Get enrollment and completion stats
  .get("/", async (c) => {
  // Total counts
  const [{ totalCategories }] = await db
    .select({ totalCategories: sql<number>`count(*)::int` })
    .from(categories);

  const [{ totalContent }] = await db
    .select({ totalContent: sql<number>`count(*)::int` })
    .from(learningContent);

  const [{ publishedContent }] = await db
    .select({ publishedContent: sql<number>`count(*)::int` })
    .from(learningContent)
    .where(eq(learningContent.published, true));

  const [{ totalLessons }] = await db
    .select({ totalLessons: sql<number>`count(*)::int` })
    .from(learningLessons);

  const [{ totalEnrollments }] = await db
    .select({ totalEnrollments: sql<number>`count(*)::int` })
    .from(studentContentEnrollments);

  const [{ completedEnrollments }] = await db
    .select({ completedEnrollments: sql<number>`count(*)::int` })
    .from(studentContentEnrollments)
    .where(eq(studentContentEnrollments.status, "completed"));

  // Completion rate
  const completionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

  // Popular content (by enrollments)
  const popularContent = await db
    .select({
      id: learningContent.id,
      title: learningContent.title,
      slug: learningContent.slug,
      enrollmentCount: sql<number>`count(${studentContentEnrollments.id})::int`,
    })
    .from(learningContent)
    .leftJoin(
      studentContentEnrollments,
      eq(learningContent.id, studentContentEnrollments.contentId)
    )
    .groupBy(learningContent.id)
    .orderBy(desc(sql`count(${studentContentEnrollments.id})`))
    .limit(5);

  // Category distribution
  const categoryStats = await db
    .select({
      id: categories.id,
      name: categories.name,
      contentCount: sql<number>`count(${learningContent.id})::int`,
    })
    .from(categories)
    .leftJoin(learningContent, eq(categories.id, learningContent.categoryId))
    .groupBy(categories.id)
    .orderBy(desc(sql`count(${learningContent.id})`));

  return c.json({
    data: {
      overview: {
        totalCategories,
        totalContent,
        publishedContent,
        totalLessons,
        totalEnrollments,
        completedEnrollments,
        completionRate,
      },
      popularContent,
      categoryStats,
    },
  });
});

export type AnalyticsRoutes = typeof app;
export default app;
