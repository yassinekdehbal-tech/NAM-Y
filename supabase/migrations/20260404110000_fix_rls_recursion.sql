-- Fix récursion RLS : utiliser une fonction SECURITY DEFINER

-- Fonction helper pour récupérer l'entreprise_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_entreprise_id()
RETURNS UUID AS $$
  SELECT entreprise_id FROM utilisateurs WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Fonction helper pour vérifier si l'utilisateur est admin/dispatcher
CREATE OR REPLACE FUNCTION is_admin_or_dispatcher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM utilisateurs WHERE auth_id = auth.uid() AND role IN ('admin','dispatcher'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Supprimer les policies récursives
DROP POLICY IF EXISTS utilisateurs_select_team ON utilisateurs;
DROP POLICY IF EXISTS utilisateurs_update_team ON utilisateurs;
DROP POLICY IF EXISTS utilisateurs_insert_admin ON utilisateurs;
DROP POLICY IF EXISTS utilisateurs_delete_admin ON utilisateurs;

-- SELECT : son profil + même entreprise + admin/dispatcher voient tout
CREATE POLICY utilisateurs_select_v2 ON utilisateurs
  FOR SELECT USING (
    auth_id = auth.uid()
    OR entreprise_id = get_my_entreprise_id()
    OR is_admin_or_dispatcher()
  );

-- INSERT : ouvert (Edge Function utilise service_role)
CREATE POLICY utilisateurs_insert_v2 ON utilisateurs
  FOR INSERT WITH CHECK (true);

-- UPDATE : son profil + même entreprise + admin
CREATE POLICY utilisateurs_update_v2 ON utilisateurs
  FOR UPDATE USING (
    auth_id = auth.uid()
    OR entreprise_id = get_my_entreprise_id()
    OR is_admin_or_dispatcher()
  );

-- DELETE : admin uniquement
CREATE POLICY utilisateurs_delete_v2 ON utilisateurs
  FOR DELETE USING (is_admin_or_dispatcher());
