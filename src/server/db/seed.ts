import { drizzle } from "drizzle-orm/bun-sql";
import { SQL } from "bun";
import * as schema from "./schema";

const client = new SQL(process.env.DATABASE_URL!);
const db = drizzle({ client, schema });

const categoriesData = [
  { name: "History", slug: "history", description: "Explore the fascinating stories of our past.", icon: "scroll", displayOrder: 0 },
  { name: "Astronomy", slug: "astronomy", description: "Journey through the cosmos and discover the universe.", icon: "telescope", displayOrder: 1 },
  { name: "Wildlife", slug: "wildlife", description: "Learn about the incredible diversity of life on Earth.", icon: "paw-print", displayOrder: 2 },
  { name: "Geography", slug: "geography", description: "Discover the physical features of our planet.", icon: "globe", displayOrder: 3 },
  { name: "Science", slug: "science", description: "Understand the principles that govern nature.", icon: "flask", displayOrder: 4 },
  { name: "Culture", slug: "culture", description: "Explore human traditions, arts, and societies.", icon: "landmark", displayOrder: 5 },
];

const contentData = [
  { categorySlug: "history", title: "Ancient Egypt: Land of the Pharaohs", slug: "ancient-egypt", description: "Discover the mysteries of ancient Egypt, from the pyramids to hieroglyphics.", difficulty: "beginner", estimatedMinutes: 45, published: true },
  { categorySlug: "history", title: "The Roman Empire: Rise and Fall", slug: "roman-empire", description: "Learn about the rise and fall of one of history's greatest empires.", difficulty: "intermediate", estimatedMinutes: 60, published: true },
  { categorySlug: "history", title: "Medieval Europe: Knights and Castles", slug: "medieval-europe", description: "Explore the age of knights, castles, and feudal systems.", difficulty: "intermediate", estimatedMinutes: 55, published: true },
  { categorySlug: "astronomy", title: "Solar System Exploration", slug: "solar-system", description: "Journey through our solar system and learn about each planet.", difficulty: "beginner", estimatedMinutes: 50, published: true },
  { categorySlug: "astronomy", title: "Stars and Galaxies", slug: "stars-galaxies", description: "Understand the life cycle of stars and the structure of galaxies.", difficulty: "intermediate", estimatedMinutes: 65, published: true },
  { categorySlug: "astronomy", title: "The Search for Exoplanets", slug: "exoplanets", description: "Discover how scientists search for planets beyond our solar system.", difficulty: "advanced", estimatedMinutes: 80, published: true },
  { categorySlug: "wildlife", title: "African Savanna Wildlife", slug: "african-savanna", description: "Meet the incredible animals that call the African savanna home.", difficulty: "beginner", estimatedMinutes: 40, published: true },
  { categorySlug: "wildlife", title: "Ocean Depths: Marine Life", slug: "ocean-depths", description: "Dive deep into the ocean to discover marine life and ecosystems.", difficulty: "intermediate", estimatedMinutes: 55, published: true },
  { categorySlug: "wildlife", title: "Rainforest Ecosystems", slug: "rainforest-ecosystems", description: "Explore the biodiversity and importance of tropical rainforests.", difficulty: "beginner", estimatedMinutes: 45, published: true },
  { categorySlug: "geography", title: "Volcanic Landscapes", slug: "volcanic-landscapes", description: "Learn how volcanoes shape our planet's surface and create new land.", difficulty: "intermediate", estimatedMinutes: 50, published: true },
  { categorySlug: "geography", title: "The World's Great Rivers", slug: "great-rivers", description: "Discover the world's great rivers and their importance.", difficulty: "beginner", estimatedMinutes: 40, published: true },
  { categorySlug: "science", title: "The Physics of Light", slug: "physics-of-light", description: "Explore the fascinating properties of light and optics.", difficulty: "advanced", estimatedMinutes: 70, published: true },
  { categorySlug: "science", title: "Introduction to Genetics", slug: "intro-genetics", description: "Learn the basics of genetics and how traits are inherited.", difficulty: "intermediate", estimatedMinutes: 65, published: true },
  { categorySlug: "science", title: "Renewable Energy Sources", slug: "renewable-energy", description: "Discover clean energy sources that power our sustainable future.", difficulty: "beginner", estimatedMinutes: 45, published: true },
  { categorySlug: "culture", title: "Indigenous Cultures of the Americas", slug: "indigenous-americas", description: "Learn about the rich cultures of indigenous peoples.", difficulty: "beginner", estimatedMinutes: 55, published: true },
  { categorySlug: "culture", title: "Asian Traditions and Festivals", slug: "asian-traditions", description: "Explore the diverse traditions and festivals of Asian cultures.", difficulty: "beginner", estimatedMinutes: 50, published: true },
];

const lessonTemplates = [
  { title: "Introduction", body: "Welcome to this learning module. In this lesson, we'll cover the basics and set the foundation for what's to come. Get ready to explore fascinating concepts and ideas that will expand your understanding.", estimatedMinutes: 8 },
  { title: "Key Concepts", body: "This lesson dives into the core concepts you need to understand. We'll break down complex ideas into digestible parts and provide examples to help you grasp the material.", estimatedMinutes: 12 },
  { title: "Deep Dive", body: "Now that you have the basics, let's explore further. This lesson takes you deeper into the subject matter with detailed explanations and real-world applications.", estimatedMinutes: 15 },
  { title: "Case Studies", body: "Learn from real examples in this lesson. We'll examine case studies that illustrate the concepts we've discussed and show how they apply in practice.", estimatedMinutes: 12 },
  { title: "Summary and Review", body: "In this final lesson, we'll review everything we've learned. Test your understanding with review questions and solidify your knowledge.", estimatedMinutes: 10 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (in correct order for foreign keys)
  console.log("  Clearing existing data...");
  await db.delete(schema.studentLessonProgress);
  await db.delete(schema.studentContentEnrollments);
  await db.delete(schema.learningLessons);
  await db.delete(schema.learningContent);
  await db.delete(schema.categories);

  // Insert categories
  console.log("  Inserting categories...");
  const insertedCategories = await db.insert(schema.categories).values(categoriesData).returning();
  
  const categoryMap = new Map(insertedCategories.map(c => [c.slug, c.id]));

  // Insert content
  console.log("  Inserting content...");
  for (const content of contentData) {
    const categoryId = categoryMap.get(content.categorySlug);
    if (!categoryId) continue;

    const [insertedContent] = await db.insert(schema.learningContent).values({
      categoryId,
      title: content.title,
      slug: content.slug,
      description: content.description,
      difficulty: content.difficulty,
      estimatedMinutes: content.estimatedMinutes,
      published: content.published,
    }).returning();

    // Insert lessons for this content
    for (let i = 0; i < lessonTemplates.length; i++) {
      const lesson = lessonTemplates[i];
      await db.insert(schema.learningLessons).values({
        contentId: insertedContent.id,
        title: lesson.title,
        body: `${lesson.body}\n\nThis is part of the "${content.title}" course.`,
        orderIndex: i,
        estimatedMinutes: lesson.estimatedMinutes,
      });
    }
  }

  console.log("✅ Seeding complete!");
  console.log(`   - ${categoriesData.length} categories`);
  console.log(`   - ${contentData.length} content items`);
  console.log(`   - ${contentData.length * lessonTemplates.length} lessons`);
  
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
