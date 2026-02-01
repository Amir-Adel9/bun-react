import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { db } from "../../db";
import { categories } from "../../db/schema";
import { requireAuth, requireAdmin } from "../../middleware/auth";

// Chain routes for proper Hono RPC type inference
const app = new Hono()
  .use("*", requireAuth, requireAdmin)
  // GET /api/admin/categories - List all categories
  .get("/", async (c) => {
  const result = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.displayOrder));

  return c.json({ data: result });
})
// POST /api/admin/categories - Create category
.post("/", async (c) => {
  const body = await c.req.json();
  const { name, slug, description, icon, displayOrder } = body;

  if (!name || !slug) {
    return c.json({ error: "Name and slug are required" }, 400);
  }

  // Check for duplicate slug
  const existing = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (existing) {
    return c.json({ error: "Category with this slug already exists" }, 409);
  }

  const [category] = await db
    .insert(categories)
    .values({
      name,
      slug,
      description: description || null,
      icon: icon || null,
      displayOrder: displayOrder || 0,
    })
    .returning();

  return c.json({ data: category }, 201);
})
// PUT /api/admin/categories/:id - Update category
.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, slug, description, icon, displayOrder } = body;

  // Check if category exists
  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!existing) {
    return c.json({ error: "Category not found" }, 404);
  }

  // Check for duplicate slug (excluding current category)
  if (slug && slug !== existing.slug) {
    const duplicate = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    if (duplicate) {
      return c.json({ error: "Category with this slug already exists" }, 409);
    }
  }

  const [category] = await db
    .update(categories)
    .set({
      name: name ?? existing.name,
      slug: slug ?? existing.slug,
      description: description !== undefined ? description : existing.description,
      icon: icon !== undefined ? icon : existing.icon,
      displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
    })
    .where(eq(categories.id, id))
    .returning();

  return c.json({ data: category });
})
// DELETE /api/admin/categories/:id - Delete category
.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await db.query.categories.findFirst({
    where: eq(categories.id, id),
  });

  if (!existing) {
    return c.json({ error: "Category not found" }, 404);
  }

  await db.delete(categories).where(eq(categories.id, id));

  return c.json({ message: "Category deleted" });
});

export type CategoriesRoutes = typeof app;
export default app;
