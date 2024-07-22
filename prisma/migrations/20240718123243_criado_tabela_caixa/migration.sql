-- CreateTable
CREATE TABLE "sfa_caixa" (
    "id" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "data_mes_referencia" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sfa_caixa_pkey" PRIMARY KEY ("id")
);
