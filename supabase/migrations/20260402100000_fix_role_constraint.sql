-- Fix CHECK constraint sur utilisateurs.role
-- Accepte les 6 nouveaux rôles + 3 anciens (rétro-compatibilité)
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_role_check;
ALTER TABLE utilisateurs ADD CONSTRAINT utilisateurs_role_check
  CHECK (role IN ('admin','dispatcher','client','vendeur','fournisseur','livreur','dirigeant','exploitant','chauffeur'));
