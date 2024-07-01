-- CreateTable
CREATE TABLE "sfb_cartao" (
    "id" TEXT NOT NULL,
    "cartao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3) NOT NULL,
    "limite" DOUBLE PRECISION NOT NULL,
    "limite_usado" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sfbUser_id" TEXT NOT NULL,

    CONSTRAINT "sfb_cartao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sfb_cartao" ADD CONSTRAINT "sfb_cartao_sfbUser_id_fkey" FOREIGN KEY ("sfbUser_id") REFERENCES "sfb_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
