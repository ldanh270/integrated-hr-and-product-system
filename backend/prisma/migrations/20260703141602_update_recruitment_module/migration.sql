/*
  Warnings:

  - A unique constraint covering the columns `[candidateId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('open', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "PostingStatus" AS ENUM ('draft', 'open', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('new', 'reviewing', 'shortlisted', 'interviewing', 'final_review', 'offer_sent', 'offer_accepted', 'background_check', 'pending_onboarding', 'hired', 'rejected', 'offer_declined', 'offer_rescinded', 'candidate_withdrew');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('website', 'linkedin', 'referral', 'facebook', 'twitter', 'google_form', 'recruitment_agency', 'other');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('in_person', 'video_call', 'phone');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "InterviewResult" AS ENUM ('pass', 'fail', 'borderline', 'pending');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('draft', 'pending_approval', 'sent', 'negotiating', 'accepted', 'declined', 'rescinded');

-- CreateEnum
CREATE TYPE "JobLevel" AS ENUM ('intern', 'fresher', 'junior', 'mid', 'senior', 'lead', 'manager', 'director');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "candidateId" TEXT;

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "headcountNeeded" INTEGER NOT NULL,
    "budgetMin" DECIMAL(15,2),
    "budgetMax" DECIMAL(15,2),
    "status" "RequisitionStatus" NOT NULL DEFAULT 'open',
    "level" "JobLevel" NOT NULL DEFAULT 'junior',
    "targetStartDate" DATE,
    "note" TEXT,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalJobPost" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "source" "CandidateSource" NOT NULL,
    "postUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalJobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resumeUrl" TEXT,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "source" "CandidateSource" NOT NULL DEFAULT 'other',
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'new',
    "kanbanOrder" INTEGER NOT NULL DEFAULT 0,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "rescindedAt" TIMESTAMP(3),
    "rescindedReason" TEXT,
    "rescindedById" TEXT,
    "hiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "format" "InterviewFormat" NOT NULL DEFAULT 'in_person',
    "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "leadInterviewerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRoundCandidate" (
    "roundId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "InterviewRoundCandidate_pkey" PRIMARY KEY ("roundId","applicationId")
);

-- CreateTable
CREATE TABLE "InterviewRoundMember" (
    "roundId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "InterviewRoundMember_pkey" PRIMARY KEY ("roundId","employeeId")
);

-- CreateTable
CREATE TABLE "InterviewScorecard" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "verdict" "InterviewResult" NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT NOT NULL,
    "salary" DECIMAL(15,2) NOT NULL,
    "startDate" DATE NOT NULL,
    "benefits" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseDeadline" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferHistory" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "salary" DECIMAL(15,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRequisition_status_idx" ON "JobRequisition"("status");

-- CreateIndex
CREATE INDEX "JobRequisition_requestedById_idx" ON "JobRequisition"("requestedById");

-- CreateIndex
CREATE INDEX "JobRequisition_approvedById_idx" ON "JobRequisition"("approvedById");

-- CreateIndex
CREATE UNIQUE INDEX "JobDescription_requisitionId_key" ON "JobDescription"("requisitionId");

-- CreateIndex
CREATE INDEX "JobDescription_requisitionId_idx" ON "JobDescription"("requisitionId");

-- CreateIndex
CREATE INDEX "ExternalJobPost_requisitionId_idx" ON "ExternalJobPost"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_phone_key" ON "Candidate"("phone");

-- CreateIndex
CREATE INDEX "JobApplication_status_kanbanOrder_idx" ON "JobApplication"("status", "kanbanOrder");

-- CreateIndex
CREATE INDEX "JobApplication_candidateId_idx" ON "JobApplication"("candidateId");

-- CreateIndex
CREATE INDEX "JobApplication_requisitionId_idx" ON "JobApplication"("requisitionId");

-- CreateIndex
CREATE INDEX "InterviewRound_requisitionId_status_idx" ON "InterviewRound"("requisitionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewRound_requisitionId_roundNumber_key" ON "InterviewRound"("requisitionId", "roundNumber");

-- CreateIndex
CREATE INDEX "InterviewRoundCandidate_applicationId_idx" ON "InterviewRoundCandidate"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewRoundMember_employeeId_idx" ON "InterviewRoundMember"("employeeId");

-- CreateIndex
CREATE INDEX "InterviewScorecard_roundId_idx" ON "InterviewScorecard"("roundId");

-- CreateIndex
CREATE INDEX "InterviewScorecard_applicationId_idx" ON "InterviewScorecard"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewScorecard_roundId_applicationId_interviewerId_key" ON "InterviewScorecard"("roundId", "applicationId", "interviewerId");

-- CreateIndex
CREATE INDEX "Offer_applicationId_status_idx" ON "Offer"("applicationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_applicationId_version_key" ON "Offer"("applicationId", "version");

-- CreateIndex
CREATE INDEX "OfferHistory_offerId_idx" ON "OfferHistory"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_candidateId_key" ON "Employee"("candidateId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalJobPost" ADD CONSTRAINT "ExternalJobPost_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_rescindedById_fkey" FOREIGN KEY ("rescindedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_leadInterviewerId_fkey" FOREIGN KEY ("leadInterviewerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRoundCandidate" ADD CONSTRAINT "InterviewRoundCandidate_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRoundCandidate" ADD CONSTRAINT "InterviewRoundCandidate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRoundMember" ADD CONSTRAINT "InterviewRoundMember_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRoundMember" ADD CONSTRAINT "InterviewRoundMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewScorecard" ADD CONSTRAINT "InterviewScorecard_interviewerId_fkey" FOREIGN KEY ("interviewerId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferHistory" ADD CONSTRAINT "OfferHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
