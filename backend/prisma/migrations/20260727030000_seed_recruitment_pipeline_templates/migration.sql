-- Upgrade only the original generated template; custom stages remain untouched.
UPDATE "RecruitmentPipelineStage" SET "name" = 'Nộp đơn', "color" = '#3B82F6', "isDefault" = true, "isCompleted" = false WHERE "position" = 0 AND "name" = 'Mới';
UPDATE "RecruitmentPipelineStage" SET "name" = 'Phỏng vấn vòng 1', "color" = '#F59E0B', "isCompleted" = false WHERE "position" = 1 AND "name" = 'Đang xem xét';
UPDATE "RecruitmentPipelineStage" SET "name" = 'Phỏng vấn vòng 2', "color" = '#8B5CF6', "isCompleted" = false WHERE "position" = 2 AND "name" = 'Phỏng vấn';
UPDATE "RecruitmentPipelineStage" SET "name" = 'Đậu', "color" = '#10B981', "isCompleted" = true WHERE "position" = 3 AND "name" = 'Đã tuyển';
INSERT INTO "RecruitmentPipelineStage" ("id", "postingId", "name", "color", "position", "isDefault", "isCompleted", "updatedAt")
SELECT 'stage_rejected_' || substr(md5("id"), 1, 15), "id", 'Từ chối', '#EF4444', 4, false, true, CURRENT_TIMESTAMP FROM "JobPosting"
WHERE NOT EXISTS (SELECT 1 FROM "RecruitmentPipelineStage" s WHERE s."postingId" = "JobPosting"."id" AND s."name" = 'Từ chối');
