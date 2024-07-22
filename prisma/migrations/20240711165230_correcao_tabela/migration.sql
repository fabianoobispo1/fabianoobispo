/*
  Warnings:

  - You are about to drop the column `email` on the `sfa_movimentacao` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "sfa_movimentacao_email_key";

-- AlterTable
ALTER TABLE "sfa_movimentacao" DROP COLUMN "email";
