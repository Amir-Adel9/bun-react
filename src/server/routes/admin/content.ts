import { Hono } from "hono";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "../../db";
import { learningContent, learningLessons, categories } from "../../db/schema";
import { requireAuth, requireAdmin } from "../../middleware/auth";

// Chain routes for proper Hono RPC type inference
const app = new Hono()
  .use("*", requireAuth, requireAdmin)
  // GET /api/admin/content - List all content (including unpublished)
  .get("/", async (c) => {
  const result = await db
    .select({
      id: learningContent.id,
      title: learningContent.title,
      slug: learningContent.slug,
      description: learningContent.description,
      difficulty: learningContent.difficulty,
      estimatedMinutes: learningContent.estimatedMinutes,
      thumbnailUrl: learningContent.thumbnailUrl,
      published: learningContent.published,
      createdAt: learningContent.createdAt,
      updatedAt: learningContent.updatedAt,
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(learningContent)
    .innerJoin(categories, eq(learningContent.categoryId, categories.id))
    .orderBy(desc(learningContent.createdAt));

  return c.json({ data: result });
})
// GET /api/admin/content/:id - Get content with lessons
.get("/:id", async (c) => {
  const id = c.req.param("id");

  const content = await db.query.learningContent.findFirst({
    where: eq(learningContent.id, id),
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
// POST /api/admin/content - Create content
.post("/", async (c) => {
  const body = await c.req.json();
  const {
    categoryId,
    title,
    slug,
    description,
    difficulty,
    estimatedMinutes,
    thumbnailUrl,
    published,
  } = body;

  if (!categoryId || !title || !slug || !description || !difficulty || !estimatedMinutes) {
    return c.json(
      { error: "categoryId, title, slug, description, difficulty, and estimatedMinutes are required" },
      400
    );
  }

  // Validate difficulty
  if (!["beginner", "intermediate", "advanced"].includes(difficulty)) {
    return c.json({ error: "Invalid difficulty level" }, 400);
  }

  // Check for duplicate slug
  const existing = await db.query.learningContent.findFirst({
    where: eq(learningContent.slug, slug),
  });

  if (existing) {
    return c.json({ error: "Content with this slug already exists" }, 409);
  }

  // Check if category exists
  const category = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!category) {
    return c.json({ error: "Category not found" }, 404);
  }

  const [content] = await db
    .insert(learningContent)
    .values({
      categoryId,
      title,
      slug,
      description,
      difficulty,
      estimatedMinutes,
      thumbnailUrl: thumbnailUrl || null,
      published: published || false,
    })
    .returning();

  return c.json({ data: content }, 201);
})
// PUT /api/admin/content/:id - Update content
.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const {
    categoryId,
    title,
    slug,
    description,
    difficulty,
    estimatedMinutes,
    thumbnailUrl,
    published,
  } = body;

  const existing = await db.query.learningContent.findFirst({
    where: eq(learningContent.id, id),
  });

  if (!existing) {
    return c.json({ error: "Content not found" }, 404);
  }

  // Validate difficulty if provided
  if (difficulty && !["beginner", "intermediate", "advanced"].includes(difficulty)) {
    return c.json({ error: "Invalid difficulty level" }, 400);
  }

  // Check for duplicate slug
  if (slug && slug !== existing.slug) {
    const duplicate = await db.query.learningContent.findFirst({
      where: eq(learningContent.slug, slug),
    });
    if (duplicate) {
      return c.json({ error: "Content with this slug already exists" }, 409);
    }
  }

  // Check if category exists
  if (categoryId) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });
    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }
  }

  const [content] = await db
    .update(learningContent)
    .set({
      categoryId: categoryId ?? existing.categoryId,
      title: title ?? existing.title,
      slug: slug ?? existing.slug,
      description: description ?? existing.description,
      difficulty: difficulty ?? existing.difficulty,
      estimatedMinutes: estimatedMinutes ?? existing.estimatedMinutes,
      thumbnailUrl: thumbnailUrl !== undefined ? thumbnailUrl : existing.thumbnailUrl,
      published: published !== undefined ? published : existing.published,
      updatedAt: new Date(),
    })
    .where(eq(learningContent.id, id))
    .returning();

  return c.json({ data: content });
})
// DELETE /api/admin/content/:id - Delete content
.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await db.query.learningContent.findFirst({
    where: eq(learningContent.id, id),
  });

  if (!existing) {
    return c.json({ error: "Content not found" }, 404);
  }

  await db.delete(learningContent).where(eq(learningContent.id, id));

  return c.json({ message: "Content deleted" });
});

export type ContentRoutes = typeof app;
export default app;
