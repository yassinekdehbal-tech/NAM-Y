ALTER TABLE parametres_entreprise ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT '{"horaires":false,"grille":false,"vendeur":false,"test":false}';
