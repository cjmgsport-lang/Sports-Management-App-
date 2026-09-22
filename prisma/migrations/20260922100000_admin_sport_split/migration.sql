-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN     "organizationId" TEXT,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TrialSelectionDocument" ADD COLUMN     "biological" INTEGER,
ADD COLUMN     "cognitive" INTEGER,
ADD COLUMN     "conditioning" INTEGER,
ADD COLUMN     "coordination" INTEGER,
ADD COLUMN     "creative" INTEGER,
ADD COLUMN     "emotionalSkill" INTEGER,
ADD COLUMN     "leadershipCharacter" INTEGER,
ADD COLUMN     "mental" INTEGER,
ADD COLUMN     "socioAffective" INTEGER;

-- AlterTable
ALTER TABLE "UploadAsset" ADD COLUMN     "folder" TEXT,
ADD COLUMN     "linkedFeedbackId" TEXT;

-- CreateTable
CREATE TABLE "MatchGoal" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "scorerId" TEXT NOT NULL,
    "minute" INTEGER,
    "ownGoal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchCard" (
    "id" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "minute" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrengthConditioningEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "benchPressKg" DOUBLE PRECISION,
    "squatKg" DOUBLE PRECISION,
    "sprint10mSec" DOUBLE PRECISION,
    "sprint40mSec" DOUBLE PRECISION,
    "verticalJumpCm" DOUBLE PRECISION,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrengthConditioningEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "dateInjured" TIMESTAMP(3) NOT NULL,
    "report" TEXT NOT NULL,
    "treatment" TEXT,
    "healing" TEXT,
    "rehabilitation" TEXT,
    "returnToTrainDate" TIMESTAMP(3),
    "returnToPlayDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'INJURED',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Injury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "startYear" INTEGER,
    "endYear" INTEGER,
    "positionRole" TEXT,
    "bursaryCost" TEXT,
    "dualCareer" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameContinuumMoment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "moment" TEXT NOT NULL,
    "imagePath" TEXT,
    "imageMimeType" TEXT,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameContinuumMoment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingResource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "teamId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameContinuumMoment_teamId_moment_key" ON "GameContinuumMoment"("teamId", "moment");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_scorerId_fkey" FOREIGN KEY ("scorerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchCard" ADD CONSTRAINT "MatchCard_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchCard" ADD CONSTRAINT "MatchCard_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadAsset" ADD CONSTRAINT "UploadAsset_linkedFeedbackId_fkey" FOREIGN KEY ("linkedFeedbackId") REFERENCES "WeeklyFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthConditioningEntry" ADD CONSTRAINT "StrengthConditioningEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthConditioningEntry" ADD CONSTRAINT "StrengthConditioningEntry_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrengthConditioningEntry" ADD CONSTRAINT "StrengthConditioningEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentRecord" ADD CONSTRAINT "RecruitmentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentRecord" ADD CONSTRAINT "RecruitmentRecord_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameContinuumMoment" ADD CONSTRAINT "GameContinuumMoment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingResource" ADD CONSTRAINT "TrainingResource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingResource" ADD CONSTRAINT "TrainingResource_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingResource" ADD CONSTRAINT "TrainingResource_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

