-- A form response is an application snapshot. Candidates therefore may share an
-- email address across submissions and postings; connector response IDs handle
-- idempotency instead.
DROP INDEX IF EXISTS "Candidate_email_key";
