-- Enum values must be committed before a following migration can use them.
ALTER TYPE "RecruitmentSource" ADD VALUE IF NOT EXISTS 'google_form';
ALTER TYPE "RecruitmentSource" ADD VALUE IF NOT EXISTS 'company_website';
ALTER TYPE "RecruitmentSource" ADD VALUE IF NOT EXISTS 'agency';
