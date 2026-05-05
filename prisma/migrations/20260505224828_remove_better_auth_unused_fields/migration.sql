/*
  Warnings:

  - You are about to drop the column `accessToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `accountId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `idToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `account` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `verification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- AlterTable
ALTER TABLE "account" DROP COLUMN "accessToken",
DROP COLUMN "accountId",
DROP COLUMN "expiresAt",
DROP COLUMN "idToken",
DROP COLUMN "providerId",
DROP COLUMN "refreshToken";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "emailVerified";

-- DropTable
DROP TABLE "session";

-- DropTable
DROP TABLE "verification";
