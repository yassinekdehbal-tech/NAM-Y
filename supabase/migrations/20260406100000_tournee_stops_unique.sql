-- Unique constraint pour l'upsert ETA dans dispatch
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournee_stops_unique
  ON tournee_stops(tournee_id, expedition_id);
