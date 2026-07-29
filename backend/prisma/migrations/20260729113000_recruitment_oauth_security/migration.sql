-- Persist OAuth callback nonces so state replay protection works across instances.
CREATE TABLE "RecruitmentOAuthStateNonce" (
  "nonce" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecruitmentOAuthStateNonce_pkey" PRIMARY KEY ("nonce")
);

CREATE INDEX "RecruitmentOAuthStateNonce_expiresAt_idx"
  ON "RecruitmentOAuthStateNonce"("expiresAt");
