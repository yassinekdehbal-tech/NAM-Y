-- Module litiges NAMY

ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS peut_acceder_litiges BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS litiges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expedition_id UUID,
  ouvert_par_id UUID,
  ouvert_par_nom TEXT,
  entreprise_client_id UUID,
  entreprise_transporteur_id UUID,
  categorie TEXT CHECK (categorie IN ('casse','livraison_incomplete','colis_manquant','erreur_adresse')),
  description TEXT,
  valeur_vente NUMERIC DEFAULT 0,
  valeur_achat NUMERIC DEFAULT 0,
  montant_accorde NUMERIC DEFAULT 0,
  responsabilite TEXT CHECK (responsabilite IN ('namy','transporteur','magasin','partage')),
  resolution_type TEXT CHECK (resolution_type IN ('remboursement_total','remboursement_partiel','geste_commercial','refus')),
  statut TEXT DEFAULT 'ouvert' CHECK (statut IN ('ouvert','en_examen','responsabilite_confirmee','rejete','remboursement_accorde','cloture')),
  note_interne TEXT,
  date_limite TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS litiges_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  litige_id UUID REFERENCES litiges(id) ON DELETE CASCADE,
  url TEXT,
  ajoute_par_role TEXT CHECK (ajoute_par_role IN ('magasin','transporteur','livreur','namy')),
  ajoute_par_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS litiges_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  litige_id UUID REFERENCES litiges(id) ON DELETE CASCADE,
  auteur_id UUID,
  auteur_nom TEXT,
  auteur_role TEXT,
  message TEXT,
  visible_magasin BOOLEAN DEFAULT true,
  visible_transporteur BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS permissive (MVP)
ALTER TABLE litiges ENABLE ROW LEVEL SECURITY;
CREATE POLICY litiges_select_all ON litiges FOR SELECT USING (true);
CREATE POLICY litiges_insert_all ON litiges FOR INSERT WITH CHECK (true);
CREATE POLICY litiges_update_all ON litiges FOR UPDATE USING (true);
CREATE POLICY litiges_delete_all ON litiges FOR DELETE USING (true);

ALTER TABLE litiges_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY litiges_photos_select_all ON litiges_photos FOR SELECT USING (true);
CREATE POLICY litiges_photos_insert_all ON litiges_photos FOR INSERT WITH CHECK (true);
CREATE POLICY litiges_photos_delete_all ON litiges_photos FOR DELETE USING (true);

ALTER TABLE litiges_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY litiges_messages_select_all ON litiges_messages FOR SELECT USING (true);
CREATE POLICY litiges_messages_insert_all ON litiges_messages FOR INSERT WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('litiges-photos', 'litiges-photos', true) ON CONFLICT DO NOTHING;
