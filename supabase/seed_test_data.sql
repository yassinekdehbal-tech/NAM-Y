-- ============================================================
-- NAMY TMS — Données de test (colonnes vérifiées sur Supabase)
-- Appliqué le 2026-04-01
--
-- Schéma réel vérifié via API service_role :
--   entreprises  : id(UUID), nom, type, adresse, cp, ville, telephone, email, actif
--   vehicules    : id(UUID), immatriculation, type, libelle, actif, capacite_m3
--   grilles_tarifaires : id(UUID), nom, type, rayon_km, majoration_ferie, actif
--   lignes_tarifaires_poids : grille_id(UUID), poids_min, poids_max, colis_max_kg, dim_max_cm, prix_pied, prix_lieu, ordre
--   tournees     : id(UUID), nom, date_tournee, heure_depart, chauffeur_id, vehicule_id, statut, couleur
--   expeditions  : id(SERIAL), uuid, entreprise_id(UUID), exp_nom, exp_adresse, exp_cp, exp_ville,
--                  dest_nom, dest_adresse, dest_cp, dest_ville, dest_telephone, dest_email,
--                  date_livraison, creneau, option_livraison, poids_total, nb_colis, description,
--                  prix_ht, prix_ttc, statut, tournee_id(UUID), lat, lng
--   tournee_stops : id(SERIAL), tournee_id(BIGINT!), expedition_id(BIGINT), ordre, nom, adresse, ...
--   historique_expeditions : expedition_id(BIGINT), evenement, commentaire, utilisateur
-- ============================================================

-- 1. ENTREPRISES
INSERT INTO entreprises (id, nom, type, adresse, cp, ville, telephone, email, actif)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'FISSA LIV',            'plateforme',  '125 rue Diderot',           '93700', 'Drancy',      '0148320000', 'contact@fissaliv.fr',    true),
  ('a0000000-0000-0000-0000-000000000002', 'TRUFFAUT LE CHESNAY',  'client',      'Centre commercial Parly 2', '78150', 'Le Chesnay',  '0139541200', 'chesnay@truffaut.com',   true),
  ('a0000000-0000-0000-0000-000000000003', 'TRANSPORT EXPRESS IDF', 'fournisseur', '10 Rue de la Logistique',   '93200', 'Saint-Denis', '0149330000', 'contact@express-idf.fr', true)
ON CONFLICT (id) DO NOTHING;

-- 2. ASSIGNATION GRILLE
INSERT INTO clients_grilles (client_id, grille_id, mode_devis)
VALUES ('a0000000-0000-0000-0000-000000000002', '432b203e-854a-4519-84f2-8ec04cb8f9c7', false)
ON CONFLICT (client_id, grille_id) DO NOTHING;

-- 3. TOURNEE
INSERT INTO tournees (nom, date_tournee, heure_depart, vehicule_id, statut, couleur)
VALUES ('TOURNEE TEST IDF', '2026-04-01', '08:00', '6a6787e2-0750-41e9-8253-1f8990e1d637', 'publie', '#076460');

-- 4. EXPEDITIONS (5 statuts variés)
DO $$
DECLARE
  v_tournee_id UUID;
  v_client_id  UUID := 'a0000000-0000-0000-0000-000000000002';
BEGIN
  SELECT id INTO v_tournee_id FROM tournees
    WHERE nom = 'TOURNEE TEST IDF' AND date_tournee = '2026-04-01'
    ORDER BY created_at DESC LIMIT 1;

  INSERT INTO expeditions (entreprise_id, exp_nom, exp_adresse, exp_cp, exp_ville,
    dest_nom, dest_adresse, dest_cp, dest_ville, dest_telephone, dest_email,
    statut, date_livraison, nb_colis, poids_total, prix_ht, prix_ttc,
    tournee_id, lat, lng, creneau, option_livraison, description)
  VALUES
    (v_client_id, 'TRUFFAUT LE CHESNAY', 'Centre commercial Parly 2', '78150', 'Le Chesnay',
     'Dupont Marie', '14 Rue Bergère', '75009', 'Paris', '0612345678', 'dupont.m@mail.fr',
     'en_attente', '2026-04-01', 5, 85, 57.50, 69.00, NULL, 48.873, 2.348,
     '09:00-12:00', 'Pièce du choix', 'Mobilier de jardin'),

    (v_client_id, 'TRUFFAUT LE CHESNAY', 'Centre commercial Parly 2', '78150', 'Le Chesnay',
     'Martin Luc', '22 Rue Volta', '75003', 'Paris', '0698765432', 'martin.l@gmail.com',
     'en_attente', '2026-04-01', 3, 45, 49.17, 59.00, NULL, 48.862, 2.354,
     '12:00-16:00', 'Pied de camion', 'Plantes vertes x3'),

    (v_client_id, 'TRUFFAUT LE CHESNAY', 'Centre commercial Parly 2', '78150', 'Le Chesnay',
     'Bernard Sophie', '5 Allée des Roses', '78160', 'Marly-le-Roi', '0677889900', 'bernard.s@orange.fr',
     'planifie', '2026-04-01', 8, 120, 74.17, 89.00, v_tournee_id, 48.866, 2.083,
     '09:00-12:00', 'Pièce du choix', 'Canapé + table basse'),

    (v_client_id, 'TRUFFAUT LE CHESNAY', 'Centre commercial Parly 2', '78150', 'Le Chesnay',
     'Leroy Thomas', '33 Rue Louis Siou', '78890', 'Garancières', '0655443322', 'leroy.t@free.fr',
     'livre', '2026-04-01', 12, 200, 90.83, 109.00, v_tournee_id, 48.733, 1.833,
     '12:00-16:00', 'Pièce du choix', 'Étagères bois massif'),

    (v_client_id, 'TRUFFAUT LE CHESNAY', 'Centre commercial Parly 2', '78150', 'Le Chesnay',
     'Petit Claire', '8 Impasse des Lilas', '94120', 'Fontenay-sous-Bois', '0611223344', 'petit.c@yahoo.fr',
     'litige', '2026-04-01', 4, 60, 49.17, 59.00, v_tournee_id, 48.852, 2.487,
     '15:00-18:00', 'Pied de camion', 'Barbecue + accessoires');

  -- 5. STOPS (tournee_id BIGINT → null car type mismatch avec tournees.id UUID)
  INSERT INTO tournee_stops (tournee_id, expedition_id, ordre, nom, adresse, cp, ville, lat, lng, creneau, option, poids, description, tel, nb_colis, eta, statut)
  SELECT NULL, e.id, 1, 'Bernard Sophie', '5 Allée des Roses', '78160', 'Marly-le-Roi',
         48.866, 2.083, '09:00-12:00', 'Pièce du choix', 120, 'Canapé + table basse', '0677889900', 8, '09:30', 'en_attente'
  FROM expeditions e WHERE e.dest_nom = 'Bernard Sophie' AND e.tournee_id = v_tournee_id LIMIT 1;

  INSERT INTO tournee_stops (tournee_id, expedition_id, ordre, nom, adresse, cp, ville, lat, lng, creneau, option, poids, description, tel, nb_colis, eta, statut)
  SELECT NULL, e.id, 2, 'Leroy Thomas', '33 Rue Louis Siou', '78890', 'Garancières',
         48.733, 1.833, '12:00-16:00', 'Pièce du choix', 200, 'Étagères bois massif', '0655443322', 12, '11:15', 'livre'
  FROM expeditions e WHERE e.dest_nom = 'Leroy Thomas' AND e.tournee_id = v_tournee_id LIMIT 1;

  -- 6. HISTORIQUE
  INSERT INTO historique_expeditions (expedition_id, evenement, commentaire, utilisateur)
  SELECT e.id, 'planifie', 'Assignée à la tournée TOURNEE TEST IDF', 'Système'
  FROM expeditions e WHERE e.dest_nom = 'Bernard Sophie' AND e.tournee_id = v_tournee_id LIMIT 1;

  INSERT INTO historique_expeditions (expedition_id, evenement, commentaire, utilisateur)
  SELECT e.id, 'livre', 'Livré avec signature', 'Tarek Makni'
  FROM expeditions e WHERE e.dest_nom = 'Leroy Thomas' AND e.tournee_id = v_tournee_id LIMIT 1;

  INSERT INTO historique_expeditions (expedition_id, evenement, commentaire, utilisateur)
  SELECT e.id, 'litige', 'Client absent — 2ème passage échoué', 'Tarek Makni'
  FROM expeditions e WHERE e.dest_nom = 'Petit Claire' AND e.tournee_id = v_tournee_id LIMIT 1;

  RAISE NOTICE 'Seed terminé — tournee_id = %', v_tournee_id;
END $$;
