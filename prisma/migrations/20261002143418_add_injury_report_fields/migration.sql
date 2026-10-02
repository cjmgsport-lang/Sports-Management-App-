-- AlterTable
ALTER TABLE "MedicalRecord" ADD COLUMN     "currentInjury" TEXT,
ADD COLUMN     "injuryDate" TIMESTAMP(3),
ADD COLUMN     "injuryHistory" TEXT,
ADD COLUMN     "injuryNotes" TEXT;
