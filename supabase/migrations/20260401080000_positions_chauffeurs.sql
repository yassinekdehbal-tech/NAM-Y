CREATE TABLE IF NOT EXISTS positions_chauffeurs (
  id BIGSERIAL PRIMARY KEY,
  chauffeur_id BIGINT,
  chauffeur_nom TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  tournee_id BIGINT,
  stops_restants INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_chauffeur ON positions_chauffeurs(chauffeur_id);

ALTER TABLE positions_chauffeurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY positions_select ON positions_chauffeurs FOR SELECT USING (true);
CREATE POLICY positions_upsert ON positions_chauffeurs FOR INSERT WITH CHECK (true);
CREATE POLICY positions_update ON positions_chauffeurs FOR UPDATE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE positions_chauffeurs;
