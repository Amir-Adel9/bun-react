import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const client = new SQL(process.env.DATABASE_URL!);
const db = drizzle({ client, schema });

async function main() {
  // Get all users
  const users = await db.select().from(schema.user);
  
  console.log("Current users:");
  users.forEach(u => console.log(`  - ${u.email} (role: ${u.role})`));
  
  if (users.length === 0) {
    console.log("\nNo users found. Please sign up first at http://localhost:3000/admin");
    process.exit(0);
  }
  
  // Update all users to admin
  await db.update(schema.user).set({ role: "admin" });
  
  console.log("\n✅ All users have been updated to admin role!");
  
  process.exit(0);
}

main().catch(console.error);
