CREATE TABLE IF NOT EXISTS creneaux_client (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  jours TEXT[] DEFAULT '{}',
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creneaux_client ENABLE ROW LEVEL SECURITY;
CREATE POLICY creneaux_client_select ON creneaux_client FOR SELECT USING (true);
CREATE POLICY creneaux_client_manage ON creneaux_client FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_creneaux_client_ent ON creneaux_client(entreprise_id);
