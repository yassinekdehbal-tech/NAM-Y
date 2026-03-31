-- ============================================================
-- NAMY TMS — Migration 004 : Row Level Security
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres_entreprise ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chauffeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournee_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grilles_tarifaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_tarifaires_poids ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_tarifaires_zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_tarifaires_colis ENABLE ROW LEVEL SECURITY;
ALTER TABLE frais_annexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_grilles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper : récupérer le rôle de l'utilisateur connecté
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM utilisateurs WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_entreprise_id()
RETURNS BIGINT AS $$
  SELECT entreprise_id FROM utilisateurs WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- POLICIES : entreprises
-- ============================================================
DROP POLICY IF EXISTS "entreprises_select" ON entreprises;
CREATE POLICY "entreprises_select" ON entreprises FOR SELECT USING (true);

DROP POLICY IF EXISTS "entreprises_admin" ON entreprises;
CREATE POLICY "entreprises_admin" ON entreprises FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- ============================================================
-- POLICIES : utilisateurs
-- ============================================================
DROP POLICY IF EXISTS "utilisateurs_select_own" ON utilisateurs;
CREATE POLICY "utilisateurs_select_own" ON utilisateurs FOR SELECT
  USING (auth_id = auth.uid() OR get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "utilisateurs_admin" ON utilisateurs;
CREATE POLICY "utilisateurs_admin" ON utilisateurs FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================================
-- POLICIES : parametres_entreprise
-- ============================================================
DROP POLICY IF EXISTS "params_select" ON parametres_entreprise;
CREATE POLICY "params_select" ON parametres_entreprise FOR SELECT USING (true);

DROP POLICY IF EXISTS "params_admin" ON parametres_entreprise;
CREATE POLICY "params_admin" ON parametres_entreprise FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- ============================================================
-- POLICIES : vehicules + chauffeurs
-- ============================================================
DROP POLICY IF EXISTS "vehicules_select" ON vehicules;
CREATE POLICY "vehicules_select" ON vehicules FOR SELECT USING (true);
DROP POLICY IF EXISTS "vehicules_admin" ON vehicules;
CREATE POLICY "vehicules_admin" ON vehicules FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "chauffeurs_select" ON chauffeurs;
CREATE POLICY "chauffeurs_select" ON chauffeurs FOR SELECT USING (true);
DROP POLICY IF EXISTS "chauffeurs_admin" ON chauffeurs;
CREATE POLICY "chauffeurs_admin" ON chauffeurs FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- ============================================================
-- POLICIES : expeditions
-- ============================================================
DROP POLICY IF EXISTS "expeditions_select" ON expeditions;
CREATE POLICY "expeditions_select" ON expeditions FOR SELECT
  USING (
    get_user_role() IN ('admin', 'dispatcher')
    OR entreprise_id = get_user_entreprise_id()
    OR created_by = (SELECT id FROM utilisateurs WHERE auth_id = auth.uid())
  );

DROP POLICY IF EXISTS "expeditions_insert" ON expeditions;
CREATE POLICY "expeditions_insert" ON expeditions FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'dispatcher', 'vendeur', 'client'));

DROP POLICY IF EXISTS "expeditions_update" ON expeditions;
CREATE POLICY "expeditions_update" ON expeditions FOR UPDATE
  USING (get_user_role() IN ('admin', 'dispatcher', 'livreur'));

-- ============================================================
-- POLICIES : tournees
-- ============================================================
DROP POLICY IF EXISTS "tournees_select" ON tournees;
CREATE POLICY "tournees_select" ON tournees FOR SELECT
  USING (
    get_user_role() IN ('admin', 'dispatcher')
    OR chauffeur_id = (SELECT c.id FROM chauffeurs c JOIN utilisateurs u ON c.utilisateur_id = u.id WHERE u.auth_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "tournees_manage" ON tournees;
CREATE POLICY "tournees_manage" ON tournees FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- ============================================================
-- POLICIES : tournee_stops
-- ============================================================
DROP POLICY IF EXISTS "stops_select" ON tournee_stops;
CREATE POLICY "stops_select" ON tournee_stops FOR SELECT
  USING (
    get_user_role() IN ('admin', 'dispatcher')
    OR tournee_id IN (
      SELECT t.id FROM tournees t
      JOIN chauffeurs c ON t.chauffeur_id = c.id
      JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE u.auth_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "stops_update_livreur" ON tournee_stops;
CREATE POLICY "stops_update_livreur" ON tournee_stops FOR UPDATE
  USING (get_user_role() IN ('admin', 'dispatcher', 'livreur'));

DROP POLICY IF EXISTS "stops_manage" ON tournee_stops;
CREATE POLICY "stops_manage" ON tournee_stops FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- ============================================================
-- POLICIES : checkins
-- ============================================================
DROP POLICY IF EXISTS "checkins_select" ON checkins;
CREATE POLICY "checkins_select" ON checkins FOR SELECT
  USING (get_user_role() IN ('admin', 'dispatcher') OR chauffeur_nom = (SELECT prenom || ' ' || nom FROM utilisateurs WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "checkins_insert" ON checkins;
CREATE POLICY "checkins_insert" ON checkins FOR INSERT
  WITH CHECK (get_user_role() IN ('admin', 'dispatcher', 'livreur'));

DROP POLICY IF EXISTS "checkins_update" ON checkins;
CREATE POLICY "checkins_update" ON checkins FOR UPDATE
  USING (get_user_role() IN ('admin', 'dispatcher', 'livreur'));

-- ============================================================
-- POLICIES : grilles tarifaires (lecture pour tous, écriture admin/dispatcher)
-- ============================================================
DROP POLICY IF EXISTS "grilles_select" ON grilles_tarifaires;
CREATE POLICY "grilles_select" ON grilles_tarifaires FOR SELECT USING (true);
DROP POLICY IF EXISTS "grilles_manage" ON grilles_tarifaires;
CREATE POLICY "grilles_manage" ON grilles_tarifaires FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "lignes_poids_select" ON lignes_tarifaires_poids;
CREATE POLICY "lignes_poids_select" ON lignes_tarifaires_poids FOR SELECT USING (true);
DROP POLICY IF EXISTS "lignes_poids_manage" ON lignes_tarifaires_poids;
CREATE POLICY "lignes_poids_manage" ON lignes_tarifaires_poids FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "lignes_zone_select" ON lignes_tarifaires_zone;
CREATE POLICY "lignes_zone_select" ON lignes_tarifaires_zone FOR SELECT USING (true);
DROP POLICY IF EXISTS "lignes_zone_manage" ON lignes_tarifaires_zone;
CREATE POLICY "lignes_zone_manage" ON lignes_tarifaires_zone FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "lignes_colis_select" ON lignes_tarifaires_colis;
CREATE POLICY "lignes_colis_select" ON lignes_tarifaires_colis FOR SELECT USING (true);
DROP POLICY IF EXISTS "lignes_colis_manage" ON lignes_tarifaires_colis;
CREATE POLICY "lignes_colis_manage" ON lignes_tarifaires_colis FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "frais_select" ON frais_annexes;
CREATE POLICY "frais_select" ON frais_annexes FOR SELECT USING (true);
DROP POLICY IF EXISTS "frais_manage" ON frais_annexes;
CREATE POLICY "frais_manage" ON frais_annexes FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "options_select" ON options_livraison;
CREATE POLICY "options_select" ON options_livraison FOR SELECT USING (true);
DROP POLICY IF EXISTS "options_manage" ON options_livraison;
CREATE POLICY "options_manage" ON options_livraison FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

DROP POLICY IF EXISTS "clients_grilles_select" ON clients_grilles;
CREATE POLICY "clients_grilles_select" ON clients_grilles FOR SELECT USING (true);
DROP POLICY IF EXISTS "clients_grilles_manage" ON clients_grilles;
CREATE POLICY "clients_grilles_manage" ON clients_grilles FOR ALL
  USING (get_user_role() IN ('admin', 'dispatcher'));

-- ============================================================
-- POLICIES : historique
-- ============================================================
DROP POLICY IF EXISTS "historique_select" ON historique_expeditions;
CREATE POLICY "historique_select" ON historique_expeditions FOR SELECT USING (true);
DROP POLICY IF EXISTS "historique_insert" ON historique_expeditions;
CREATE POLICY "historique_insert" ON historique_expeditions FOR INSERT WITH CHECK (true);

-- ============================================================
-- Supabase Storage bucket pour photos et signatures
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-photos', 'delivery-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT DO NOTHING;

-- Policy storage : tout le monde peut lire, livreurs/dispatchers peuvent écrire
DROP POLICY IF EXISTS "photos_select" ON storage.objects;
CREATE POLICY "photos_select" ON storage.objects FOR SELECT USING (bucket_id IN ('delivery-photos', 'signatures'));

DROP POLICY IF EXISTS "photos_insert" ON storage.objects;
CREATE POLICY "photos_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('delivery-photos', 'signatures'));
