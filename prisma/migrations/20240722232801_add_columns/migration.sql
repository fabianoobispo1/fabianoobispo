/*
  Warnings:

  - Added the required column `index` to the `sfb_kanban_column` table without a default value. This is not possible if the table is not empty.
  - Added the required column `index` to the `sfb_kanban_task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sfb_kanban_column" ADD COLUMN     "index" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sfb_kanban_task" ADD COLUMN     "index" INTEGER NOT NULL;
