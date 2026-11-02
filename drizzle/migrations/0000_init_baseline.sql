-- Baseline for the remixed project's database.
-- The copied migration history from the source project was cleared; this
-- establishes an empty starting point and lets Drizzle create its own
-- migration journal table in the new database.
CREATE SCHEMA IF NOT EXISTS drizzle;