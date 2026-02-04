-- ============================================
-- Ajout de la colonne "Commentaire général sur le projet" à la table projets
-- ============================================
-- Ta table projets utilise des noms de colonnes entre guillemets (style Excel).
-- Cette colonne manquante est ajoutée avec le même style.

-- Ajoute la colonne (nom entre guillemets pour espaces et caractères spéciaux)
ALTER TABLE public.projets
ADD COLUMN IF NOT EXISTS "Commentaire général sur le projet" TEXT;
