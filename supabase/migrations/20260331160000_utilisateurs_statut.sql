-- Ajouter colonne statut aux utilisateurs
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif';
