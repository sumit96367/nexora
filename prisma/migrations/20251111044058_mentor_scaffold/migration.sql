-- CreateEnum
CREATE TYPE "MentorStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MentorDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MentorSessionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecommendationVisibility" AS ENUM ('PRIVATE', 'DASHBOARD', 'PROFILE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MENTOR_STATUS', 'SESSION_REQUEST', 'SESSION_STATUS', 'MESSAGE', 'RECOMMENDATION');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mentorStatus" "MentorStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "mentorStatusReason" TEXT,
ADD COLUMN     "mentorStatusUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MentorStatus" NOT NULL DEFAULT 'PENDING',
    "headline" TEXT,
    "bio" TEXT,
    "yearsExperience" INTEGER,
    "industries" TEXT[],
    "skills" TEXT[],
    "hourlyRate" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "availability" JSONB,
    "ratingAverage" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorDocument" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "MentorDocumentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorSession" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "status" "MentorSessionStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "price" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "meetingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,

    CONSTRAINT "MentorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorConversation" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "MentorConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "MentorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorRecommendation" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "sessionId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "RecommendationVisibility" NOT NULL DEFAULT 'DASHBOARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "MentorRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- CreateIndex
CREATE INDEX "MentorDocument_mentorId_idx" ON "MentorDocument"("mentorId");

-- CreateIndex
CREATE INDEX "MentorSession_mentorId_idx" ON "MentorSession"("mentorId");

-- CreateIndex
CREATE INDEX "MentorSession_menteeId_idx" ON "MentorSession"("menteeId");

-- CreateIndex
CREATE INDEX "MentorSession_mentorId_scheduledAt_idx" ON "MentorSession"("mentorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "MentorConversation_lastMessageAt_idx" ON "MentorConversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorConversation_mentorId_menteeId_key" ON "MentorConversation"("mentorId", "menteeId");

-- CreateIndex
CREATE INDEX "MentorMessage_conversationId_idx" ON "MentorMessage"("conversationId");

-- CreateIndex
CREATE INDEX "MentorMessage_senderId_idx" ON "MentorMessage"("senderId");

-- CreateIndex
CREATE INDEX "MentorMessage_createdAt_idx" ON "MentorMessage"("createdAt");

-- CreateIndex
CREATE INDEX "MentorRecommendation_mentorId_idx" ON "MentorRecommendation"("mentorId");

-- CreateIndex
CREATE INDEX "MentorRecommendation_menteeId_idx" ON "MentorRecommendation"("menteeId");

-- CreateIndex
CREATE INDEX "MentorRecommendation_sessionId_idx" ON "MentorRecommendation"("sessionId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorDocument" ADD CONSTRAINT "MentorDocument_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorSession" ADD CONSTRAINT "MentorSession_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorConversation" ADD CONSTRAINT "MentorConversation_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "MentorConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorMessage" ADD CONSTRAINT "MentorMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRecommendation" ADD CONSTRAINT "MentorRecommendation_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRecommendation" ADD CONSTRAINT "MentorRecommendation_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRecommendation" ADD CONSTRAINT "MentorRecommendation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MentorSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
