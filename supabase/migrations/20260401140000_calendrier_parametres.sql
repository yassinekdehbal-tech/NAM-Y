-- ============================================================
-- NAMY TMS — Migration : Calendrier & Paramètres opérationnels
-- 2026-04-01
-- ============================================================

-- 1. Colonnes supplémentaires parametres_entreprise
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS fermetures_exceptionnelles date[] DEFAULT '{}';
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS suspendu boolean DEFAULT false;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS raison_suspension text;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS suspendu_le timestamptz;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS suspendu_par uuid;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS historique_suspensions jsonb DEFAULT '[]';

-- 2. Table creneaux_livraison
CREATE TABLE IF NOT EXISTS creneaux_livraison (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  heure_debut TIME NOT NULL,
  heure_fin TIME NOT NULL,
  limite_colis INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creneaux_livraison ENABLE ROW LEVEL SECURITY;
CREATE POLICY creneaux_livraison_select_all ON creneaux_livraison FOR SELECT USING (true);
CREATE POLICY creneaux_livraison_insert_all ON creneaux_livraison FOR INSERT WITH CHECK (true);
CREATE POLICY creneaux_livraison_update_all ON creneaux_livraison FOR UPDATE USING (true);
CREATE POLICY creneaux_livraison_delete_all ON creneaux_livraison FOR DELETE USING (true);

-- 3. Table fermetures_namy
CREATE TABLE IF NOT EXISTS fermetures_namy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  raison TEXT,
  cree_par UUID,
  cree_a TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fermetures_namy ENABLE ROW LEVEL SECURITY;
CREATE POLICY fermetures_namy_select_all ON fermetures_namy FOR SELECT USING (true);
CREATE POLICY fermetures_namy_insert_all ON fermetures_namy FOR INSERT WITH CHECK (true);
CREATE POLICY fermetures_namy_update_all ON fermetures_namy FOR UPDATE USING (true);
CREATE POLICY fermetures_namy_delete_all ON fermetures_namy FOR DELETE USING (true);
