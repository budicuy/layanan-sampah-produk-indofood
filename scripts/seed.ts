import "dotenv/config";
import { hashPassword } from "@better-auth/utils/password";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { account, user } from "../lib/db/schema";

async function seed() {
  console.log("🌱 Seeding user budi...");

  const usernameValue = "budi";
  const email = "budi@banksampah.com";

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, usernameValue))
    .limit(1);

  if (existing.length > 0) {
    console.log("ℹ️  User 'budi' already exists, skipping.");
    process.exit(0);
  }

  const userId = generateId();
  const hashedPassword = await hashPassword("budi");

  await db.insert(user).values({
    id: userId,
    name: "Budi",
    email,
    emailVerified: false,
    username: usernameValue,
    displayUsername: usernameValue,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(account).values({
    id: generateId(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ User created successfully!");
  console.log("   Username : budi");
  console.log("   Password : budi");
  console.log("   Email    : budi@banksampah.com");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
