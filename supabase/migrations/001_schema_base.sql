-- ============================================================
-- NAMY TMS — Migration 001 : Schéma de base
-- ============================================================

-- 1. Type enum pour les entreprises
DO $$ BEGIN
  CREATE TYPE entreprise_type AS ENUM ('plateforme', 'client', 'fournisseur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Type enum pour les rôles (nouveaux noms)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'client', 'dispatcher', 'vendeur', 'livreur');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE : entreprises
-- ============================================================
CREATE TABLE IF NOT EXISTS entreprises (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  type entreprise_type NOT NULL DEFAULT 'client',
  adresse TEXT,
  cp TEXT,
  ville TEXT,
  tel TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter la colonne type si la table existe déjà
DO $$ BEGIN
  ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS type entreprise_type DEFAULT 'client';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- TABLE : utilisateurs
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id BIGSERIAL PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role user_role NOT NULL DEFAULT 'vendeur',
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  entreprise_id BIGINT REFERENCES entreprises(id),
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter la colonne permissions si la table existe déjà
DO $$ BEGIN
  ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Migration des anciens rôles vers les nouveaux
UPDATE utilisateurs SET role = 'client' WHERE role::text = 'dirigeant';
UPDATE utilisateurs SET role = 'dispatcher' WHERE role::text = 'exploitant';
UPDATE utilisateurs SET role = 'livreur' WHERE role::text = 'chauffeur';

-- Permissions par défaut selon le rôle
UPDATE utilisateurs SET permissions = '{
  "dispatch": true, "tournees": true, "expeditions": true,
  "grilles": true, "entreprises": true, "utilisateurs": true,
  "statistiques": true, "extraction": true, "configuration": true
}'::jsonb WHERE role = 'admin' AND permissions = '{}'::jsonb;

UPDATE utilisateurs SET permissions = '{
  "expeditions": true, "statistiques": true, "extraction": true
}'::jsonb WHERE role = 'client' AND permissions = '{}'::jsonb;

UPDATE utilisateurs SET permissions = '{
  "dispatch": true, "tournees": true, "expeditions": true,
  "statistiques": true, "extraction": true
}'::jsonb WHERE role = 'dispatcher' AND permissions = '{}'::jsonb;

UPDATE utilisateurs SET permissions = '{
  "expeditions": {"create": true, "read_own": true}
}'::jsonb WHERE role = 'vendeur' AND permissions = '{}'::jsonb;

UPDATE utilisateurs SET permissions = '{
  "tournees": {"read_assigned": true},
  "stops": {"update_status": true, "upload_photo": true, "upload_signature": true}
}'::jsonb WHERE role = 'livreur' AND permissions = '{}'::jsonb;

-- ============================================================
-- TABLE : parametres_entreprise
-- ============================================================
CREATE TABLE IF NOT EXISTS parametres_entreprise (
  id BIGSERIAL PRIMARY KEY,
  entreprise_id BIGINT REFERENCES entreprises(id) ON DELETE CASCADE UNIQUE,
  ouvert_dimanche BOOLEAN DEFAULT false,
  ouvert_feries BOOLEAN DEFAULT false,
  rayon_max_km INTEGER DEFAULT 30,
  fermetures DATE[] DEFAULT '{}',
  jours_service TEXT[] DEFAULT '{"lundi","mardi","mercredi","jeudi","vendredi","samedi"}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
