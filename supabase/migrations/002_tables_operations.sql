-- ============================================================
-- NAMY TMS — Migration 002 : Tables opérationnelles
-- ============================================================

-- ============================================================
-- TABLE : vehicules
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicules (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  plaque TEXT,
  capacite_m3 NUMERIC,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : chauffeurs (livreurs)
-- ============================================================
CREATE TABLE IF NOT EXISTS chauffeurs (
  id BIGSERIAL PRIMARY KEY,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  tel TEXT,
  entreprise_id BIGINT REFERENCES entreprises(id),
  utilisateur_id BIGINT REFERENCES utilisateurs(id),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : expeditions
-- ============================================================
CREATE TABLE IF NOT EXISTS expeditions (
  id BIGSERIAL PRIMARY KEY,
  -- Expéditeur
  expediteur TEXT,
  expediteur_adresse TEXT,
  expediteur_cp TEXT,
  expediteur_ville TEXT,
  entreprise_id BIGINT REFERENCES entreprises(id),
  -- Destinataire
  destinataire TEXT,
  dest_adresse TEXT,
  dest_cp TEXT,
  dest_ville TEXT,
  dest_tel TEXT,
  dest_email TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  -- Livraison
  date DATE,
  creneau TEXT,
  lieu TEXT DEFAULT 'Pièce du choix',
  description TEXT,
  -- Colis
  poids NUMERIC DEFAULT 0,
  poids_lourd NUMERIC DEFAULT 0,
  taille NUMERIC DEFAULT 0,
  nb_colis INTEGER DEFAULT 1,
  -- Tarification
  prix_ht NUMERIC DEFAULT 0,
  prix_ttc NUMERIC DEFAULT 0,
  type_prix TEXT DEFAULT 'Poids',
  -- Statut
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente','planifie','en_cours','livre','litige','annule')),
  tournee_id BIGINT,
  -- Meta
  created_by BIGINT REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : tournees
-- ============================================================
CREATE TABLE IF NOT EXISTS tournees (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  date DATE NOT NULL,
  heure TEXT DEFAULT '08:00',
  chauffeur TEXT,
  chauffeur_id BIGINT REFERENCES chauffeurs(id),
  vehicule TEXT,
  vehicule_id BIGINT REFERENCES vehicules(id),
  couleur TEXT DEFAULT '#4f7cff',
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon','publie','en_cours','termine','annule')),
  nb_courses INTEGER DEFAULT 0,
  created_by BIGINT REFERENCES utilisateurs(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FK sur expeditions.tournee_id
DO $$ BEGIN
  ALTER TABLE expeditions ADD CONSTRAINT fk_expedition_tournee
    FOREIGN KEY (tournee_id) REFERENCES tournees(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE : tournee_stops
-- ============================================================
CREATE TABLE IF NOT EXISTS tournee_stops (
  id BIGSERIAL PRIMARY KEY,
  tournee_id BIGINT REFERENCES tournees(id) ON DELETE CASCADE,
  expedition_id BIGINT REFERENCES expeditions(id),
  ordre INTEGER DEFAULT 0,
  -- Données dénormalisées pour l'app chauffeur
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
  -- Statut
  statut TEXT DEFAULT 'en_attente' CHECK (statut IN ('en_attente','collecte','en_route','livre','echec')),
  signature_data TEXT,
  photo_url TEXT,
  echec_raison TEXT,
  livre_at TIMESTAMPTZ,
  echec_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLE : checkins (pointages chauffeurs)
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
  id BIGSERIAL PRIMARY KEY,
  chauffeur_id BIGINT REFERENCES chauffeurs(id),
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
-- TABLE : historique_expeditions
-- ============================================================
CREATE TABLE IF NOT EXISTS historique_expeditions (
  id BIGSERIAL PRIMARY KEY,
  expedition_id BIGINT REFERENCES expeditions(id) ON DELETE CASCADE,
  evenement TEXT NOT NULL,
  commentaire TEXT,
  utilisateur TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
