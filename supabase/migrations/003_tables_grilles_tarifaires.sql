-- ============================================================
-- NAMY TMS — Migration 003 : Grilles tarifaires
-- ============================================================

-- ============================================================
-- TABLE : grilles_tarifaires (config principale)
-- ============================================================
CREATE TABLE IF NOT EXISTS grilles_tarifaires (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('poids', 'zone', 'colis')),
  rayon INTEGER DEFAULT 30,
  maj INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : lignes_tarifaires_poids
-- ============================================================
CREATE TABLE IF NOT EXISTS lignes_tarifaires_poids (
  id BIGSERIAL PRIMARY KEY,
  grille_id BIGINT REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  poids_min NUMERIC DEFAULT 0,
  poids_max NUMERIC NOT NULL,
  colis_max NUMERIC DEFAULT 130,
  dim_max NUMERIC DEFAULT 400,
  prix_pied_camion NUMERIC DEFAULT 0,
  prix_lieu_choix NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : lignes_tarifaires_zone
-- ============================================================
CREATE TABLE IF NOT EXISTS lignes_tarifaires_zone (
  id BIGSERIAL PRIMARY KEY,
  grille_id BIGINT REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
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

-- ============================================================
-- TABLE : lignes_tarifaires_colis
-- ============================================================
CREATE TABLE IF NOT EXISTS lignes_tarifaires_colis (
  id BIGSERIAL PRIMARY KEY,
  grille_id BIGINT REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  nom_categorie TEXT NOT NULL,
  nb_min INTEGER DEFAULT 1,
  nb_max INTEGER DEFAULT 999,
  prix_base NUMERIC,
  prix_supp NUMERIC,
  lieu TEXT DEFAULT 'Pied de camion',
  seuil_devis INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : frais_annexes
-- ============================================================
CREATE TABLE IF NOT EXISTS frais_annexes (
  id BIGSERIAL PRIMARY KEY,
  grille_id BIGINT REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  actif BOOLEAN DEFAULT true,
  description TEXT NOT NULL,
  cout TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : options_livraison
-- ============================================================
CREATE TABLE IF NOT EXISTS options_livraison (
  id BIGSERIAL PRIMARY KEY,
  grille_id BIGINT REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prix NUMERIC DEFAULT 0,
  unite TEXT DEFAULT 'Forfait',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : clients_grilles (assignation grille ↔ entreprise)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients_grilles (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES entreprises(id) ON DELETE CASCADE,
  grille_id BIGINT REFERENCES grilles_tarifaires(id) ON DELETE CASCADE,
  mode_devis BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, grille_id)
);
