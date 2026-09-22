-- AlterTable
ALTER TABLE "ChatChannel" ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'TEAM',
ADD COLUMN     "organizationId" TEXT NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ChatParticipant" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipant_channelId_userId_key" ON "ChatParticipant"("channelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- AddForeignKey
ALTER TABLE "ChatChannel" ADD CONSTRAINT "ChatChannel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatChannel" ADD CONSTRAINT "ChatChannel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ChatChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

