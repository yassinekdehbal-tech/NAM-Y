-- Contrainte unique sur clients_grilles pour upsert ON CONFLICT
ALTER TABLE clients_grilles DROP CONSTRAINT IF EXISTS clients_grilles_entreprise_grille_unique;
ALTER TABLE clients_grilles ADD CONSTRAINT clients_grilles_entreprise_grille_unique UNIQUE (client_id, grille_id);

-- Colonnes type pour toggle % / € sur parametres_entreprise
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS majoration_dimferies_type TEXT DEFAULT '%';
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS cout_echec_retrait_type TEXT DEFAULT '%';
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS cout_echec_livraison_type TEXT DEFAULT '€';
