-- Migration : ajout des colonnes manquantes dans la table avenants
-- Ces colonnes ont été ajoutées à l'interface TypeScript mais pas en base de données.

-- Colonne incidence_financiere (ajoutée dans la gestion de l'impact financier)
ALTER TABLE avenants
  ADD COLUMN IF NOT EXISTS incidence_financiere BOOLEAN NOT NULL DEFAULT true;

-- Colonnes d'identification du titulaire (depuis Référentiel Fournisseurs)
ALTER TABLE avenants
  ADD COLUMN IF NOT EXISTS titulaire_nom TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titulaire_siret TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titulaire_adresse TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS titulaire_email TEXT NOT NULL DEFAULT '';

-- Optionnel : supprimer l'ancienne colonne valideur_direction si elle existe encore
-- (elle a été retirée de l'interface TypeScript)
-- ALTER TABLE avenants DROP COLUMN IF EXISTS valideur_direction;
