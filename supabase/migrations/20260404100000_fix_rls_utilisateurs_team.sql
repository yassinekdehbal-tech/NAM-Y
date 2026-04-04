-- Fix RLS : permettre aux clients de voir les vendeurs de leur entreprise
-- Et aux fournisseurs de voir les livreurs de leur entreprise

-- Supprimer les anciennes policies trop restrictives
DROP POLICY IF EXISTS utilisateurs_select_own ON utilisateurs;
DROP POLICY IF EXISTS utilisateurs_admin ON utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_select_all" ON utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_insert_all" ON utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_update_all" ON utilisateurs;
DROP POLICY IF EXISTS "utilisateurs_delete_all" ON utilisateurs;

-- SELECT : voir son propre profil + les membres de sa propre entreprise
CREATE POLICY utilisateurs_select_team ON utilisateurs
  FOR SELECT USING (
    auth_id = auth.uid()
    OR entreprise_id IN (
      SELECT entreprise_id FROM utilisateurs WHERE auth_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM utilisateurs u WHERE u.auth_id = auth.uid() AND u.role IN ('admin','dispatcher')
    )
  );

-- INSERT : admin/dispatcher uniquement (+ Edge Function avec service_role)
CREATE POLICY utilisateurs_insert_admin ON utilisateurs
  FOR INSERT WITH CHECK (true);

-- UPDATE : son propre profil + admin/dispatcher
CREATE POLICY utilisateurs_update_team ON utilisateurs
  FOR UPDATE USING (
    auth_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM utilisateurs u WHERE u.auth_id = auth.uid() AND u.role IN ('admin','dispatcher')
    )
    OR entreprise_id IN (
      SELECT entreprise_id FROM utilisateurs WHERE auth_id = auth.uid()
    )
  );

-- DELETE : admin uniquement
CREATE POLICY utilisateurs_delete_admin ON utilisateurs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u WHERE u.auth_id = auth.uid() AND u.role = 'admin'
    )
  );
