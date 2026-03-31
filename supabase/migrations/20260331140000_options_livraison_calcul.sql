-- ============================================================
-- NAMY TMS — Options de livraison calculées
-- ============================================================

ALTER TABLE options_livraison ADD COLUMN IF NOT EXISTS type_calcul TEXT DEFAULT 'fixe';
ALTER TABLE options_livraison ADD COLUMN IF NOT EXISTS prix_unitaire NUMERIC;
ALTER TABLE options_livraison ADD COLUMN IF NOT EXISTS seuil_gratuit INTEGER DEFAULT 0;
ALTER TABLE options_livraison ADD COLUMN IF NOT EXISTS seuil_declencheur NUMERIC;
ALTER TABLE options_livraison ADD COLUMN IF NOT EXISTS unite_label TEXT;
