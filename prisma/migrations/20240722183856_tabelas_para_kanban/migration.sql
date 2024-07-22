-- CreateTable
CREATE TABLE "sfb_kanban_column" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sfbUser_id" TEXT NOT NULL,

    CONSTRAINT "sfb_kanban_column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sfb_kanban_task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "sfb_kanban_task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sfb_kanban_column" ADD CONSTRAINT "sfb_kanban_column_sfbUser_id_fkey" FOREIGN KEY ("sfbUser_id") REFERENCES "sfb_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sfb_kanban_task" ADD CONSTRAINT "sfb_kanban_task_status_fkey" FOREIGN KEY ("status") REFERENCES "sfb_kanban_column"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
