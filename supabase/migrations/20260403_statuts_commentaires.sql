-- Nouveaux statuts expéditions
ALTER TABLE expeditions DROP CONSTRAINT IF EXISTS expeditions_statut_check;
ALTER TABLE expeditions ADD CONSTRAINT expeditions_statut_check
CHECK (statut IN ('accepte','en_attente','retire','echec_retrait','livre','echec_livraison','retourne'));

-- Table commentaires expéditions
CREATE TABLE IF NOT EXISTS expedition_commentaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expedition_id INTEGER,
  auteur_id UUID,
  auteur_nom TEXT,
  auteur_role TEXT,
  commentaire TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE expedition_commentaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY exp_comm_select ON expedition_commentaires FOR SELECT USING (true);
CREATE POLICY exp_comm_insert ON expedition_commentaires FOR INSERT WITH CHECK (true);
CREATE POLICY exp_comm_delete ON expedition_commentaires FOR DELETE USING (true);

-- Colonnes photos sur expeditions
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS photos_retrait JSONB DEFAULT '[]';
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS photos_livraison JSONB DEFAULT '[]';
