import { prisma } from "../lib/prisma";

async function createTestUser() {
  const existing = await prisma.user.findUnique({
    where: { username: "test_konsumen" },
  });
  if (existing) {
    console.log("User already exists");
    return;
  }

  await prisma.user.create({
    data: {
      name: "Test Konsumen",
      username: "test_konsumen",
      email: "test@example.com",
      role: "KONSUMEN",
    },
  });
  console.log("Test User created");
}

createTestUser();
