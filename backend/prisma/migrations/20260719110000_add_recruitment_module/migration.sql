-- Recruitment workflow schema.
-- This migration intentionally mirrors the recruitment models already declared in schema.prisma.

-- CreateEnum
CREATE TYPE "RequisitionStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'closed', 'filled');
CREATE TYPE "RequisitionPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE "PostingStatus" AS ENUM ('draft', 'open', 'paused', 'closed', 'archived');
CREATE TYPE "RecruitmentApplicationStatus" AS ENUM ('new', 'reviewing', 'shortlisted', 'interviewing', 'final_review', 'offer_sent', 'offer_accepted', 'offer_declined', 'offer_rescinded', 'background_check', 'pending_onboarding', 'hired', 'rejected', 'candidate_withdrew');
CREATE TYPE "RecruitmentSource" AS ENUM ('website', 'linkedin', 'referral', 'facebook', 'recruitment_agency', 'other');
CREATE TYPE "InterviewFormat" AS ENUM ('in_person', 'video_call', 'phone');
CREATE TYPE "InterviewRoundStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
CREATE TYPE "InterviewResult" AS ENUM ('pass', 'fail', 'pending', 'no_show');
CREATE TYPE "BgcGroup" AS ENUM ('a', 'b', 'c', 'd');
CREATE TYPE "BgcStatus" AS ENUM ('pending', 'in_progress', 'completed', 'passed', 'failed');
CREATE TYPE "RecruitmentOfferStatus" AS ENUM ('draft', 'sent', 'accepted', 'declined', 'rescinded', 'expired');

-- CreateTable
CREATE TABLE "JobRequisition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "positionLevel" TEXT,
    "employmentType" "EmployeeType" NOT NULL,
    "salaryMin" DECIMAL(15,2),
    "salaryMax" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "filledCount" INTEGER NOT NULL DEFAULT 0,
    "priority" "RequisitionPriority" NOT NULL DEFAULT 'medium',
    "status" "RequisitionStatus" NOT NULL DEFAULT 'draft',
    "reason" TEXT,
    "targetHireDate" DATE,
    "targetCloseDate" DATE,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalComment" TEXT,
    "positionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobRequisition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobDescription" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "responsibilities" TEXT,
    "requirements" TEXT,
    "benefits" TEXT,
    "salaryMin" DECIMAL(15,2),
    "salaryMax" DECIMAL(15,2),
    "channel" TEXT NOT NULL,
    "postingUrl" TEXT,
    "postingStatus" "PostingStatus" NOT NULL DEFAULT 'draft',
    "postedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobDescription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" DATE,
    "address" TEXT,
    "nationalId" TEXT,
    "source" "RecruitmentSource" NOT NULL,
    "linkedinUrl" TEXT,
    "portfolioUrl" TEXT,
    "cvUrl" TEXT,
    "avatarUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruitmentApplication" (
    "id" TEXT NOT NULL,
    "requisitionId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "RecruitmentApplicationStatus" NOT NULL DEFAULT 'new',
    "rejectReason" TEXT,
    "withdrawReason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" "RecruitmentSource" NOT NULL,
    "assignedToId" TEXT,
    "hiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecruitmentApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationNote" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "format" "InterviewFormat" NOT NULL DEFAULT 'video_call',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "meetingLink" TEXT,
    "interviewerIds" TEXT[] NOT NULL,
    "status" "InterviewRoundStatus" NOT NULL DEFAULT 'scheduled',
    "result" "InterviewResult" NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "recommendation" TEXT,
    "scores" JSONB,
    "answers" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecruitmentOffer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "RecruitmentOfferStatus" NOT NULL DEFAULT 'draft',
    "offeredSalary" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "trialEndDate" DATE,
    "jobTitle" TEXT,
    "department" TEXT,
    "employmentType" "EmployeeType" NOT NULL,
    "benefits" JSONB,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecruitmentOffer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfferVersion" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "salary" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "changeReason" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BackgroundCheck" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "group" "BgcGroup" NOT NULL,
    "status" "BgcStatus" NOT NULL DEFAULT 'pending',
    "idVerified" BOOLEAN,
    "addressVerified" BOOLEAN,
    "criminalRecordCheck" BOOLEAN,
    "legalStatusCheck" BOOLEAN,
    "certificationVerified" BOOLEAN,
    "employmentHistoryVerified" BOOLEAN,
    "financialCheckCompleted" BOOLEAN,
    "creditScoreCheck" BOOLEAN,
    "completedAt" TIMESTAMP(3),
    "passedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failReason" TEXT,
    "checkedById" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobRequisition_code_key" ON "JobRequisition"("code");
CREATE INDEX "JobRequisition_status_idx" ON "JobRequisition"("status");
CREATE INDEX "JobRequisition_requestedById_idx" ON "JobRequisition"("requestedById");
CREATE INDEX "JobRequisition_positionId_idx" ON "JobRequisition"("positionId");
CREATE INDEX "JobRequisition_department_idx" ON "JobRequisition"("department");
CREATE INDEX "JobDescription_requisitionId_idx" ON "JobDescription"("requisitionId");
CREATE INDEX "JobDescription_postingStatus_idx" ON "JobDescription"("postingStatus");
CREATE INDEX "JobDescription_channel_idx" ON "JobDescription"("channel");
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");
CREATE INDEX "Candidate_email_idx" ON "Candidate"("email");
CREATE INDEX "Candidate_source_idx" ON "Candidate"("source");
CREATE UNIQUE INDEX "RecruitmentApplication_requisitionId_candidateId_key" ON "RecruitmentApplication"("requisitionId", "candidateId");
CREATE INDEX "RecruitmentApplication_requisitionId_idx" ON "RecruitmentApplication"("requisitionId");
CREATE INDEX "RecruitmentApplication_candidateId_idx" ON "RecruitmentApplication"("candidateId");
CREATE INDEX "RecruitmentApplication_assignedToId_idx" ON "RecruitmentApplication"("assignedToId");
CREATE INDEX "RecruitmentApplication_status_idx" ON "RecruitmentApplication"("status");
CREATE INDEX "ApplicationNote_applicationId_idx" ON "ApplicationNote"("applicationId");
CREATE INDEX "ApplicationNote_addedById_idx" ON "ApplicationNote"("addedById");
CREATE INDEX "InterviewRound_applicationId_idx" ON "InterviewRound"("applicationId");
CREATE INDEX "InterviewRound_scheduledAt_idx" ON "InterviewRound"("scheduledAt");
CREATE INDEX "InterviewRound_status_idx" ON "InterviewRound"("status");
CREATE UNIQUE INDEX "Scorecard_interviewId_evaluatorId_key" ON "Scorecard"("interviewId", "evaluatorId");
CREATE INDEX "Scorecard_interviewId_idx" ON "Scorecard"("interviewId");
CREATE INDEX "Scorecard_evaluatorId_idx" ON "Scorecard"("evaluatorId");
CREATE INDEX "RecruitmentOffer_applicationId_idx" ON "RecruitmentOffer"("applicationId");
CREATE INDEX "RecruitmentOffer_candidateId_idx" ON "RecruitmentOffer"("candidateId");
CREATE INDEX "RecruitmentOffer_status_idx" ON "RecruitmentOffer"("status");
CREATE UNIQUE INDEX "OfferVersion_offerId_version_key" ON "OfferVersion"("offerId", "version");
CREATE INDEX "OfferVersion_offerId_idx" ON "OfferVersion"("offerId");
CREATE UNIQUE INDEX "BackgroundCheck_offerId_key" ON "BackgroundCheck"("offerId");
CREATE INDEX "BackgroundCheck_candidateId_idx" ON "BackgroundCheck"("candidateId");
CREATE INDEX "BackgroundCheck_status_idx" ON "BackgroundCheck"("status");

-- AddForeignKey
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobRequisition" ADD CONSTRAINT "JobRequisition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobDescription" ADD CONSTRAINT "JobDescription_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "JobRequisition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentApplication" ADD CONSTRAINT "RecruitmentApplication_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationNote" ADD CONSTRAINT "ApplicationNote_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecruitmentOffer" ADD CONSTRAINT "RecruitmentOffer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RecruitmentApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentOffer" ADD CONSTRAINT "RecruitmentOffer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecruitmentOffer" ADD CONSTRAINT "RecruitmentOffer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfferVersion" ADD CONSTRAINT "OfferVersion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "RecruitmentOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "RecruitmentOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
