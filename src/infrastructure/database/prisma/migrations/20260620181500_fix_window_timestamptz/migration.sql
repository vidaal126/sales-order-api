-- Fix bug: windowStart/windowEnd were stored as TIME, which discards the date
-- component entirely. Existing rows already lost their original date; this
-- migration reattaches the epoch date (1970-01-01) to preserve the time value
-- consistently with what the application already read back from these columns.
ALTER TABLE "scheduling"
  ALTER COLUMN "windowStart" TYPE TIMESTAMPTZ(3) USING ((DATE '1970-01-01' + "windowStart")::timestamptz),
  ALTER COLUMN "windowEnd" TYPE TIMESTAMPTZ(3) USING ((DATE '1970-01-01' + "windowEnd")::timestamptz);
