-- AlterEnum
ALTER TYPE "ApplicationType" ADD VALUE 'recruitment';

-- CreateTable
CREATE TABLE "ApplicationRecruitmentDetail" (
    "applicationId" TEXT NOT NULL,
    "positionId" TEXT,
    "positionName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "requirements" TEXT,

    CONSTRAINT "ApplicationRecruitmentDetail_pkey" PRIMARY KEY ("applicationId")
);

-- AddForeignKey
ALTER TABLE "ApplicationRecruitmentDetail" ADD CONSTRAINT "ApplicationRecruitmentDetail_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
