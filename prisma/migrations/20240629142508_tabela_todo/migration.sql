-- AlterTable
ALTER TABLE "sfa_todo" ADD COLUMN     "sfaUser_id" TEXT NOT NULL DEFAULT 'temporary-default-value';

-- CreateTable
CREATE TABLE "sfb_todo" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sfbUser_id" TEXT NOT NULL DEFAULT 'temporary-default-value',

    CONSTRAINT "sfb_todo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sfb_todo" ADD CONSTRAINT "sfb_todo_sfbUser_id_fkey" FOREIGN KEY ("sfbUser_id") REFERENCES "sfb_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sfa_todo" ADD CONSTRAINT "sfa_todo_sfaUser_id_fkey" FOREIGN KEY ("sfaUser_id") REFERENCES "sfa_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
