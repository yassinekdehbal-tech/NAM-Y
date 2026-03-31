-- Paramètres contractuels client dans parametres_entreprise
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS majoration_dimanche_ferie NUMERIC DEFAULT 20;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS cout_echec_retrait NUMERIC DEFAULT 50;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS cout_echec_livraison NUMERIC DEFAULT 0;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS limite_commandes_jour INTEGER DEFAULT 0;
ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS delai_annulation_heures INTEGER DEFAULT 24;
