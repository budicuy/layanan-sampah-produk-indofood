import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

const hashedPassword = await bcrypt.hash("password", 10);

async function main() {
  console.log("🚀 Performing CRUD operations...");

  // CREATE
  const newUser = await prisma.user.create({
    data: { name: "Alice", username: `alice-${Date.now()}` },
  });
  console.log("✅ CREATE: New user created:", newUser);

  // READ
  const foundUser = await prisma.user.findUnique({ where: { id: newUser.id } });
  console.log("✅ READ: Found user:", foundUser);

  // UPDATE
  const updatedUser = await prisma.user.update({
    where: { id: newUser.id },
    data: { name: "Alice Smith" },
  });
  console.log("✅ UPDATE: User updated:", updatedUser);

  // DELETE
  await prisma.user.delete({ where: { id: newUser.id } });
  console.log("✅ DELETE: User deleted.");

  console.log("\n🎉 CRUD operations completed successfully!");

  // BUAT USER ADMIN
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: { name: "Admin", password: hashedPassword, role: "ADMIN" },
    create: {
      name: "Admin",
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ CREATE: New user created:", adminUser);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
