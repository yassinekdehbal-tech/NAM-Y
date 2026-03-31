-- ============================================================
-- NAMY TMS — Migration complète (compatible types existants)
-- ============================================================

-- ============================================================
-- TABLE : entreprises (UUID PK — existe déjà)
-- ============================================================
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'client';

-- ============================================================
-- TABLE : utilisateurs (UUID PK — existe déjà)
-- ============================================================
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Migration des anciens rôles
UPDATE utilisateurs SET role = 'client' WHERE role = 'dirigeant';
UPDATE utilisateurs SET role = 'dispatcher' WHERE role = 'exploitant';
UPDATE utilisateurs SET role = 'livreur' WHERE role = 'chauffeur';

-- Permissions par défaut
UPDATE utilisateurs SET permissions = '{"dispatch":true,"tournees":true,"expeditions":true,"grilles":true,"entreprises":true,"utilisateurs":true,"statistiques":true,"extraction":true,"configuration":true}'::jsonb
  WHERE role = 'admin' AND (permissions = '{}'::jsonb OR permissions IS NULL);
UPDATE utilisateurs SET permissions = '{"expeditions":true,"statistiques":true,"extraction":true}'::jsonb
  WHERE role = 'client' AND (permissions = '{}'::jsonb OR permissions IS NULL);
UPDATE utilisateurs SET permissions = '{"dispatch":true,"tournees":true,"expeditions":true,"statistiques":true,"extraction":true}'::jsonb
  WHERE role = 'dispatcher' AND (permissions = '{}'::jsonb OR permissions IS NULL);
UPDATE utilisateurs SET permissions = '{"expeditions":{"create":true,"read_own":true}}'::jsonb
  WHERE role = 'vendeur' AND (permissions = '{}'::jsonb OR permissions IS NULL);
UPDATE utilisateurs SET permissions = '{"tournees":{"read_assigned":true},"stops":{"update_status":true,"upload_photo":true,"upload_signature":true}}'::jsonb
  WHERE role = 'livreur' AND (permissions = '{}'::jsonb OR permissions IS NULL);

-- ============================================================
-- TABLE : parametres_entreprise (nouvelle, FK UUID vers entreprises)
-- ============================================================
CREATE TABLE IF NOT EXISTS parametres_entreprise (
  id BIGSERIAL PRIMARY KEY,
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE CASCADE UNIQUE,
  ouvert_dimanche BOOLEAN DEFAULT false,
  ouvert_feries BOOLEAN DEFAULT false,
  rayon_max_km INTEGER DEFAULT 30,
  fermetures DATE[] DEFAULT '{}',
  jours_service TEXT[] DEFAULT '{"lundi","mardi","mercredi","jeudi","vendredi","samedi"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : vehicules (existe déjà — ajouter colonnes manquantes)
-- ============================================================
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS capacite_m3 NUMERIC;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;
ALTER TABLE vehicules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- TABLE : chauffeurs (existe déjà — ajouter colonnes manquantes)
-- ============================================================
ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS utilisateur_id UUID REFERENCES utilisateurs(id);
ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- TABLE : tournees (existe déjà — ajouter colonnes manquantes)
-- ============================================================
ALTER TABLE tournees ADD COLUMN IF NOT EXISTS chauffeur_id BIGINT;
ALTER TABLE tournees ADD COLUMN IF NOT EXISTS vehicule_id BIGINT;
ALTER TABLE tournees ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE tournees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- TABLE : expeditions (existe déjà — ajouter colonnes manquantes)
-- ============================================================
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- TABLE : tournee_stops (nouvelle — FK BIGINT car tournees/expeditions sont BIGINT/INT)
-- ============================================================
CREATE TABLE IF NOT EXISTS tournee_stops (
  id BIGSERIAL PRIMARY KEY,
  tournee_id BIGINT,
  expedition_id BIGINT,
  ordre INTEGER DEFAULT 0,
  nom TEXT,
  adresse TEXT,
  cp TEXT,
  ville TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  creneau TEXT,
  option TEXT,
  poids NUMERIC,
  description TEXT,
  tel TEXT,
  nb_colis INTEGER,
  eta TEXT,
  statut TEXT DEFAULT 'en_attente',
  signature_data TEXT,
  photo_url TEXT,
  echec_raison TEXT,
  livre_at TIMESTAMPTZ,
  echec_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : checkins (nouvelle)
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
  id BIGSERIAL PRIMARY KEY,
  chauffeur_id BIGINT,
  chauffeur_nom TEXT,
  date DATE NOT NULL,
  heure_debut TEXT,
  heure_fin_prevue TEXT,
  heure_fin TEXT,
  plaque TEXT,
  vehicule TEXT,
  stops_total INTEGER,
  stops_livres INTEGER,
  stops_echec INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : historique_expeditions (nouvelle)
-- ============================================================
CREATE TABLE IF NOT EXISTS historique_expeditions (
  id BIGSERIAL PRIMARY KEY,
  expedition_id BIGINT,
  evenement TEXT NOT NULL,
  commentaire TEXT,
  utilisateur TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLES : grilles tarifaires (nouvelles)
-- ============================================================
CREATE TABLE IF NOT EXISTS grilles_tarifaires (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  type TEXT NOT NULL,
  rayon INTEGER DEFAULT 30,
  maj INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_tarifaires_poids (
  id BIGSERIAL PRIMARY KEY,
  grille_id UUID REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  poids_min NUMERIC DEFAULT 0,
  poids_max NUMERIC NOT NULL,
  colis_max NUMERIC DEFAULT 130,
  dim_max NUMERIC DEFAULT 400,
  prix_pied_camion NUMERIC DEFAULT 0,
  prix_lieu_choix NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_tarifaires_zone (
  id BIGSERIAL PRIMARY KEY,
  grille_id UUID REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT,
  t1 NUMERIC,
  t2 NUMERIC,
  t3 NUMERIC,
  km_t1 NUMERIC,
  km_t2 NUMERIC,
  km_t3 NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lignes_tarifaires_colis (
  id BIGSERIAL PRIMARY KEY,
  grille_id UUID REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  nom_categorie TEXT NOT NULL,
  nb_min INTEGER DEFAULT 1,
  nb_max INTEGER DEFAULT 999,
  prix_base NUMERIC,
  prix_supp NUMERIC,
  lieu TEXT DEFAULT 'Pied de camion',
  seuil_devis INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frais_annexes (
  id BIGSERIAL PRIMARY KEY,
  grille_id UUID REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  actif BOOLEAN DEFAULT true,
  description TEXT NOT NULL,
  cout TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS options_livraison (
  id BIGSERIAL PRIMARY KEY,
  grille_id UUID REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prix NUMERIC DEFAULT 0,
  unite TEXT DEFAULT 'Forfait',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients_grilles (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID REFERENCES entreprises(id) ON DELETE CASCADE,
  grille_id UUID,
  mode_devis BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, grille_id)
);

-- ============================================================
-- RLS — ouvert pour le MVP (à resserrer en production)
-- ============================================================
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'parametres_entreprise','tournee_stops','checkins','historique_expeditions',
    'grilles_tarifaires','lignes_tarifaires_poids','lignes_tarifaires_zone',
    'lignes_tarifaires_colis','frais_annexes','options_livraison','clients_grilles'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_select_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (true)', t || '_select_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)', t || '_insert_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (true)', t || '_update_all', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete_all', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (true)', t || '_delete_all', t);
  END LOOP;
END $$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-photos', 'delivery-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT DO NOTHING;
