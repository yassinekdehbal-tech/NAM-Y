-- Migration : déplacer véhicule du parc vers le chauffeur
-- La table vehicules reste en place (migration douce) mais n'est plus utilisée

ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS type_vehicule TEXT;
ALTER TABLE chauffeurs ADD COLUMN IF NOT EXISTS immatriculation TEXT;
