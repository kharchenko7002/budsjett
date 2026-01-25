-- CreateEnum
CREATE TYPE "DebtDirection" AS ENUM ('I_OWE', 'OWED_TO_ME');

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "direction" "DebtDirection" NOT NULL,
    "person" TEXT NOT NULL,
    "reason" TEXT,
    "amountOre" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Debt_userId_direction_idx" ON "Debt"("userId", "direction");

-- CreateIndex
CREATE INDEX "Debt_userId_isPaid_idx" ON "Debt"("userId", "isPaid");

-- CreateIndex
CREATE INDEX "Debt_userId_date_idx" ON "Debt"("userId", "date");

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
