-- Nouvelles colonnes pour le colisage et la distance
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS poids_max_colis NUMERIC DEFAULT 0;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS nb_colis_lourds INTEGER DEFAULT 0;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS distance_km NUMERIC DEFAULT 0;
