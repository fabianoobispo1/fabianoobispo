-- CreateTable
CREATE TABLE "sfa_atleta" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "setor" TEXT,
    "posicao" TEXT,
    "numero" INTEGER,
    "altura" DOUBLE PRECISION,
    "pesso" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sfa_atleta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sfa_atleta_email_key" ON "sfa_atleta"("email");
