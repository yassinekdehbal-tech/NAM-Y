-- ============================================================
-- NAMY TMS — Préparation intégration B2C fissalivraison.fr
-- ============================================================

-- Nouvelles colonnes sur expeditions
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS exp_lat DOUBLE PRECISION;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS exp_lng DOUBLE PRECISION;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS type_prestation TEXT;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS photos_urls JSONB DEFAULT '[]';
ALTER TABLE expeditions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'namy';

-- Note : le champ statut est déjà de type TEXT (pas un enum)
-- La valeur 'en_attente_validation' est utilisable directement
-- Valeurs possibles : en_attente_validation | en_attente | planifie | en_cours | livre | echec | litige | annule

-- RLS : permettre l'INSERT anonyme pour les commandes B2C
-- (le site fissalivraison.fr utilise la anon key Supabase)
DROP POLICY IF EXISTS expeditions_b2c_insert ON expeditions;
CREATE POLICY expeditions_b2c_insert ON expeditions
  FOR INSERT
  WITH CHECK (source = 'fissalivraison');

-- RLS : permettre le SELECT anonyme sur ses propres commandes B2C (via stripe_payment_intent_id)
DROP POLICY IF EXISTS expeditions_b2c_select ON expeditions;
CREATE POLICY expeditions_b2c_select ON expeditions
  FOR SELECT
  USING (source = 'fissalivraison' AND stripe_payment_intent_id IS NOT NULL);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_expeditions_source ON expeditions(source);
CREATE INDEX IF NOT EXISTS idx_expeditions_statut_source ON expeditions(statut, source);
