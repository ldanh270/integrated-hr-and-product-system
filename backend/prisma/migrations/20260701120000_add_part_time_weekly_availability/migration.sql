-- Part-time weekly availability: employee free/busy windows per week (Mon–Sun slots).
-- CreateEnum
CREATE TYPE "PartTimeAvailabilityStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "PartTimeWeeklyAvailability" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "status" "PartTimeAvailabilityStatus" NOT NULL DEFAULT 'submitted',
    "note" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartTimeWeeklyAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartTimeAvailabilityDay" (
    "id" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isBusyAllDay" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartTimeAvailabilityDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartTimeAvailabilitySlot" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PartTimeAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartTimeWeeklyAvailability_weekStart_idx" ON "PartTimeWeeklyAvailability"("weekStart");

-- CreateIndex
CREATE INDEX "PartTimeWeeklyAvailability_status_idx" ON "PartTimeWeeklyAvailability"("status");

-- CreateIndex
CREATE INDEX "PartTimeWeeklyAvailability_reviewedById_idx" ON "PartTimeWeeklyAvailability"("reviewedById");

-- CreateIndex
CREATE UNIQUE INDEX "PartTimeWeeklyAvailability_employeeId_weekStart_key" ON "PartTimeWeeklyAvailability"("employeeId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "PartTimeAvailabilityDay_availabilityId_dayOfWeek_key" ON "PartTimeAvailabilityDay"("availabilityId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "PartTimeAvailabilitySlot_dayId_idx" ON "PartTimeAvailabilitySlot"("dayId");

-- AddForeignKey
ALTER TABLE "PartTimeWeeklyAvailability" ADD CONSTRAINT "PartTimeWeeklyAvailability_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeWeeklyAvailability" ADD CONSTRAINT "PartTimeWeeklyAvailability_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeAvailabilityDay" ADD CONSTRAINT "PartTimeAvailabilityDay_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "PartTimeWeeklyAvailability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartTimeAvailabilitySlot" ADD CONSTRAINT "PartTimeAvailabilitySlot_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "PartTimeAvailabilityDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
