-- CreateTable
CREATE TABLE "sfa_users" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "administrador" BOOLEAN NOT NULL DEFAULT false,
    "data_nascimento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL DEFAULT 'Credentials',

    CONSTRAINT "sfa_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sfa_users_email_key" ON "sfa_users"("email");
