-- Stores the weekly/milestone delivery commitment used by Capacity Copilot forecasts.
ALTER TABLE "Project" ADD COLUMN "dealTargetPercent" DOUBLE PRECISION;
