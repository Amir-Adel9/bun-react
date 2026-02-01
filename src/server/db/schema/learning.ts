import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories } from "./categories";
import { user } from "./auth";

// Learning Content
export const learningContent = pgTable(
  "learning_content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    difficulty: varchar("difficulty", { length: 20 }).notNull(), // beginner, intermediate, advanced
    estimatedMinutes: integer("estimated_minutes").notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_content_category").on(table.categoryId),
    index("idx_content_published").on(table.published, table.createdAt),
  ]
);

// Learning Lessons
export const learningLessons = pgTable(
  "learning_lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => learningContent.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    orderIndex: integer("order_index").notNull(),
    estimatedMinutes: integer("estimated_minutes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_content_order").on(table.contentId, table.orderIndex),
    index("idx_lessons_content_order").on(table.contentId, table.orderIndex),
  ]
);

// Student Content Enrollments
export const studentContentEnrollments = pgTable(
  "student_content_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => learningContent.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"), // in_progress, completed
    progressPercentage: integer("progress_percentage").notNull().default(0),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    unique("unique_user_content").on(table.userId, table.contentId),
    index("idx_enrollments_user").on(table.userId, table.status),
  ]
);

// Student Lesson Progress
export const studentLessonProgress = pgTable(
  "student_lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => learningLessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_user_lesson").on(table.userId, table.lessonId),
    index("idx_progress_user_lesson").on(table.userId, table.lessonId),
  ]
);

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  content: many(learningContent),
}));

export const learningContentRelations = relations(
  learningContent,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [learningContent.categoryId],
      references: [categories.id],
    }),
    lessons: many(learningLessons),
    enrollments: many(studentContentEnrollments),
  })
);

export const learningLessonsRelations = relations(
  learningLessons,
  ({ one, many }) => ({
    content: one(learningContent, {
      fields: [learningLessons.contentId],
      references: [learningContent.id],
    }),
    progress: many(studentLessonProgress),
  })
);

export const studentContentEnrollmentsRelations = relations(
  studentContentEnrollments,
  ({ one }) => ({
    user: one(user, {
      fields: [studentContentEnrollments.userId],
      references: [user.id],
    }),
    content: one(learningContent, {
      fields: [studentContentEnrollments.contentId],
      references: [learningContent.id],
    }),
  })
);

export const studentLessonProgressRelations = relations(
  studentLessonProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [studentLessonProgress.userId],
      references: [user.id],
    }),
    lesson: one(learningLessons, {
      fields: [studentLessonProgress.lessonId],
      references: [learningLessons.id],
    }),
  })
);
