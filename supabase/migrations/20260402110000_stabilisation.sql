-- ============================================================
-- NAMY TMS — Migration de stabilisation 02/04/2026
-- Regroupe tous les fix de schéma identifiés lors de l'audit
-- ============================================================

-- 1. Ajouter created_by à expeditions (pour traçabilité vendeur)
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES utilisateurs(id);

-- 2. Enlever la contrainte role si c'est un enum trop restrictif
-- Le rôle est un TEXT libre, pas besoin de contrainte
-- (déjà TEXT dans la migration initiale — vérification)

-- 3. Ajouter type_vehicule et immatriculation à chauffeurs
-- (pour le dispatch sans jointure vehicules)
ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS type_vehicule TEXT;
ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS immatriculation TEXT;

-- 4. Vérifier que toutes les colonnes B2C sont présentes sur expeditions
-- (normalement déjà faites par 20260402000000_b2c_preparation.sql)
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS exp_lat DOUBLE PRECISION;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS exp_lng DOUBLE PRECISION;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS type_prestation TEXT;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS photos_urls JSONB DEFAULT '[]';
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'namy';

-- 5. Ajouter index de performance
CREATE INDEX IF NOT EXISTS idx_expeditions_date ON expeditions(date);
CREATE INDEX IF NOT EXISTS idx_expeditions_entreprise ON expeditions(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_expeditions_statut ON expeditions(statut);
CREATE INDEX IF NOT EXISTS idx_expeditions_tournee ON expeditions(tournee_id);
CREATE INDEX IF NOT EXISTS idx_tournees_date ON tournees(date);
CREATE INDEX IF NOT EXISTS idx_tournee_stops_tournee ON tournee_stops(tournee_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_entreprise ON utilisateurs(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);

-- 6. S'assurer que les tables secondaires existent
CREATE TABLE IF NOT EXISTS fermetures_namy (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  raison TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creneaux_livraison (
  id BIGSERIAL PRIMARY KEY,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  heure_debut TEXT NOT NULL,
  heure_fin TEXT NOT NULL,
  limite INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS sur nouvelles tables
ALTER TABLE fermetures_namy ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fermetures_namy_select ON fermetures_namy;
CREATE POLICY fermetures_namy_select ON fermetures_namy FOR SELECT USING (true);
DROP POLICY IF EXISTS fermetures_namy_manage ON fermetures_namy;
CREATE POLICY fermetures_namy_manage ON fermetures_namy FOR ALL USING (true);

ALTER TABLE creneaux_livraison ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS creneaux_livraison_select ON creneaux_livraison;
CREATE POLICY creneaux_livraison_select ON creneaux_livraison FOR SELECT USING (true);
DROP POLICY IF EXISTS creneaux_livraison_manage ON creneaux_livraison;
CREATE POLICY creneaux_livraison_manage ON creneaux_livraison FOR ALL USING (true);
