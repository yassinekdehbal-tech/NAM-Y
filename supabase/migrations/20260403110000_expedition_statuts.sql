CREATE TABLE IF NOT EXISTS expedition_statuts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expedition_id BIGINT,
  statut TEXT NOT NULL,
  changed_by_id UUID,
  changed_by_nom TEXT,
  changed_by_role TEXT,
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expedition_statuts ENABLE ROW LEVEL SECURITY;
CREATE POLICY exp_statuts_all ON expedition_statuts FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_exp_statuts_expedition ON expedition_statuts(expedition_id);
CREATE INDEX IF NOT EXISTS idx_exp_statuts_created ON expedition_statuts(created_at);
