-- EnrollNow
-- V27: Backfill Participant Creation Metadata
--
-- Ensures legacy creationSource='registry' is preserved in custom_attributes
-- for any participant missing explicit creation source metadata.
-- Completely idempotent and non-destructive.

SET search_path TO enrollnow, public;

UPDATE participants
SET custom_attributes = COALESCE(custom_attributes, '{}'::jsonb) || '{"creationSource": "registry", "creationInfo": {"creationSource": "registry"}}'::jsonb
WHERE custom_attributes IS NULL
   OR custom_attributes->>'creationSource' IS NULL;
