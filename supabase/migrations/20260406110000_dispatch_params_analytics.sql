-- ============================================================
-- Paramètres dispatch + Analytics tournées
-- ============================================================

-- Table paramètres dispatch (singleton global)
CREATE TABLE IF NOT EXISTS parametres_dispatch (
  id BIGSERIAL PRIMARY KEY,
  duree_max_h NUMERIC DEFAULT 8,
  distance_max_km NUMERIC DEFAULT 150,
  distance_absolue_km NUMERIC DEFAULT 200,
  vitesse_moyenne_kmh NUMERIC DEFAULT 30,
  detour_max_retrait_km NUMERIC DEFAULT 12,
  nb_max_retraits INTEGER DEFAULT 0, -- 0 = illimité
  poids_max_colis_seul_kg NUMERIC DEFAULT 30,
  poids_max_commande_seul_kg NUMERIC DEFAULT 100,
  temps_chargement_1 INTEGER DEFAULT 20,
  temps_chargement_2_5 INTEGER DEFAULT 7,
  temps_chargement_6p INTEGER DEFAULT 4,
  temps_livraison_piece INTEGER DEFAULT 15,
  temps_livraison_trottoir INTEGER DEFAULT 7,
  methode_defaut TEXT DEFAULT 'escargot' CHECK (methode_defaut IN ('escargot','ligne_sn','ligne_eo')),
  seuil_rentabilite_min NUMERIC DEFAULT 0,
  rayon_regroupement_km NUMERIC DEFAULT 12,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les valeurs par défaut si pas encore de ligne
INSERT INTO parametres_dispatch (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Table analytics tournées
CREATE TABLE IF NOT EXISTS tournee_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournee_id BIGINT,
  date_tournee DATE,
  eta_estime TEXT,
  heure_reelle_fin TEXT,
  km_estimes NUMERIC,
  km_reels NUMERIC,
  nb_litiges INTEGER DEFAULT 0,
  ordre_modifie_par_livreur BOOLEAN DEFAULT false,
  nb_retraits INTEGER DEFAULT 0,
  nb_stops INTEGER DEFAULT 0,
  ca_total NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE parametres_dispatch ENABLE ROW LEVEL SECURITY;
CREATE POLICY pd_select ON parametres_dispatch FOR SELECT USING (true);
CREATE POLICY pd_update ON parametres_dispatch FOR ALL USING (true);

ALTER TABLE tournee_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY ta_all ON tournee_analytics FOR ALL USING (true);
