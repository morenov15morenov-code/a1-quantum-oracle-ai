import "dotenv/config";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed in production environment.");
    process.exit(1);
  }

  console.log("Seeding database...");

  const adminEmail = "admin@atlas-oracle.com";
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).get();

  if (existing) {
    console.log("Admin user already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);

  await db.insert(users).values({
    name: "Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "ADMIN",
  }).run();

  console.log("Admin user created:");
  console.log("  Email: admin@atlas-oracle.com");
  console.log("  Password: admin123");
  console.log("  NOTE: Change this password immediately in production!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  });
