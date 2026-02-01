import { hc } from "hono/client";
import type { AppType } from "../../server";

// Create Hono RPC client
const client = hc<AppType>("/", {
  init: {
    credentials: "include",
  },
});

// Export the typed client
export const api = client.api;

// Helper to extract JSON data from response
async function getData<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error((error as { error?: string }).error || "An error occurred");
  }
  return response.json() as Promise<T>;
}

// Admin API wrapper for easier usage
export const adminApi = {
  // Categories
  getCategories: async () => {
    const res = await api.admin.categories.$get();
    return getData<{ data: Category[] }>(res);
  },

  createCategory: async (data: CreateCategoryInput) => {
    const res = await api.admin.categories.$post({ json: data });
    return getData<{ data: Category }>(res);
  },

  updateCategory: async (id: string, data: Partial<CreateCategoryInput>) => {
    const res = await api.admin.categories[":id"].$put({ param: { id }, json: data });
    return getData<{ data: Category }>(res);
  },

  deleteCategory: async (id: string) => {
    const res = await api.admin.categories[":id"].$delete({ param: { id } });
    return getData<{ message: string }>(res);
  },

  // Content
  getContent: async () => {
    const res = await api.admin.content.$get();
    return getData<{ data: Content[] }>(res);
  },

  getContentById: async (id: string) => {
    const res = await api.admin.content[":id"].$get({ param: { id } });
    return getData<{ data: ContentWithLessons }>(res);
  },

  createContent: async (data: CreateContentInput) => {
    const res = await api.admin.content.$post({ json: data });
    return getData<{ data: Content }>(res);
  },

  updateContent: async (id: string, data: Partial<CreateContentInput>) => {
    const res = await api.admin.content[":id"].$put({ param: { id }, json: data });
    return getData<{ data: Content }>(res);
  },

  deleteContent: async (id: string) => {
    const res = await api.admin.content[":id"].$delete({ param: { id } });
    return getData<{ message: string }>(res);
  },

  // Lessons
  createLesson: async (contentId: string, data: CreateLessonInput) => {
    const res = await api.admin.lessons.content[":contentId"].lessons.$post({
      param: { contentId },
      json: data,
    });
    return getData<{ data: Lesson }>(res);
  },

  updateLesson: async (id: string, data: Partial<CreateLessonInput>) => {
    const res = await api.admin.lessons[":id"].$put({ param: { id }, json: data });
    return getData<{ data: Lesson }>(res);
  },

  deleteLesson: async (id: string) => {
    const res = await api.admin.lessons[":id"].$delete({ param: { id } });
    return getData<{ message: string }>(res);
  },

  // Analytics
  getAnalytics: async () => {
    const res = await api.admin.analytics.$get();
    return getData<{ data: Analytics }>(res);
  },
};

// Learning API wrapper
export const learningApi = {
  getContent: async (params?: { category?: string; difficulty?: string }) => {
    const res = await api.learning.content.$get({ query: params || {} });
    return getData<{ data: unknown[] }>(res);
  },

  getContentBySlug: async (slug: string) => {
    const res = await api.learning.content[":slug"].$get({ param: { slug } });
    return getData<{ data: unknown }>(res);
  },

  getCategories: async () => {
    const res = await api.learning.categories.$get();
    return getData<{ data: unknown[] }>(res);
  },

  enroll: async (id: string) => {
    const res = await api.learning.content[":id"].enroll.$post({ param: { id } });
    return getData<{ data: unknown; message: string }>(res);
  },

  getMyLibrary: async () => {
    const res = await api.learning["my-library"].$get();
    return getData<{ data: unknown[] }>(res);
  },

  completeLesson: async (id: string) => {
    const res = await api.learning.lessons[":id"].complete.$post({ param: { id } });
    return getData<{ data: unknown }>(res);
  },
};

// Types
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  createdAt: string;
};

export type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
};

export type Content = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  thumbnailUrl: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export type Lesson = {
  id: string;
  contentId: string;
  title: string;
  body: string;
  orderIndex: number;
  estimatedMinutes: number | null;
  createdAt: string;
};

export type ContentWithLessons = Content & {
  lessons: Lesson[];
};

export type CreateContentInput = {
  categoryId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  thumbnailUrl?: string;
  published?: boolean;
};

export type CreateLessonInput = {
  title: string;
  body: string;
  orderIndex?: number;
  estimatedMinutes?: number;
};

export type Analytics = {
  overview: {
    totalCategories: number;
    totalContent: number;
    publishedContent: number;
    totalLessons: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
  };
  popularContent: {
    id: string;
    title: string;
    slug: string;
    enrollmentCount: number;
  }[];
  categoryStats: {
    id: string;
    name: string;
    contentCount: number;
  }[];
};
