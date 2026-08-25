-- Collapse duplicate ratings for the same card within the same review session,
-- then enforce the uniqueness that schema.prisma already declares.
--
-- This is independent of the vocabulary catalog/per-user split: it makes the
-- reviewEvent.upsert in src/lib/review.ts (which targets
-- reviewSessionId_reviewCardId) actually guaranteed rather than best-effort.
--
-- Keep only the latest rating for each card in each review session.
DELETE FROM "ReviewEvent" old_event
USING "ReviewEvent" newer_event
WHERE old_event."reviewSessionId" IS NOT NULL
  AND newer_event."reviewSessionId" = old_event."reviewSessionId"
  AND newer_event."reviewCardId" = old_event."reviewCardId"
  AND (
    newer_event."reviewedAt" > old_event."reviewedAt"
    OR (newer_event."reviewedAt" = old_event."reviewedAt" AND newer_event."id" > old_event."id")
  );

CREATE UNIQUE INDEX "ReviewEvent_reviewSessionId_reviewCardId_key" ON "ReviewEvent"("reviewSessionId", "reviewCardId");
