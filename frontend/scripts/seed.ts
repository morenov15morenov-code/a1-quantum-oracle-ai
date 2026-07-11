import "dotenv/config";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  const adminEmail = "admin@atlas-oracle.com";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log("Admin user already exists.");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin user created:");
  console.log("  Email: admin@atlas-oracle.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
