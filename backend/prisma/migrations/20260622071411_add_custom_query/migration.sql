-- CreateTable
CREATE TABLE "CustomQuery" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'gantt',
    "projectId" TEXT,
    "employeeId" TEXT NOT NULL,
    "queryData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomQuery_employeeId_type_idx" ON "CustomQuery"("employeeId", "type");

-- AddForeignKey
ALTER TABLE "CustomQuery" ADD CONSTRAINT "CustomQuery_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomQuery" ADD CONSTRAINT "CustomQuery_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
