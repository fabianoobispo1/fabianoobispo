-- AlterTable
ALTER TABLE "sfb_cartao" ALTER COLUMN "data_pagamento" DROP NOT NULL;

-- CreateTable
CREATE TABLE "sfb_conta" (
    "id" TEXT NOT NULL,
    "conta" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sfbUser_id" TEXT NOT NULL,

    CONSTRAINT "sfb_conta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sfb_conta" ADD CONSTRAINT "sfb_conta_sfbUser_id_fkey" FOREIGN KEY ("sfbUser_id") REFERENCES "sfb_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
