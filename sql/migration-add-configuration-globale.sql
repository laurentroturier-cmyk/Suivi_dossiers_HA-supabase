-- ============================================
-- MIGRATION : Ajout de configuration_globale
-- Date : 2026-01-24
-- Description : Ajoute la colonne configuration_globale pour les variables communes du DCE
-- ============================================

-- 1. Ajouter la colonne configuration_globale à la table dce
ALTER TABLE public.dce
ADD COLUMN IF NOT EXISTS configuration_globale JSONB;

-- 2. Ajouter un commentaire explicatif
COMMENT ON COLUMN public.dce.configuration_globale IS 
'Variables communes du DCE : lots (numéro, intitulé, montant), informations générales, contacts, etc.';

-- 3. (Optionnel) Créer un index GIN pour les recherches JSONB
CREATE INDEX IF NOT EXISTS idx_dce_configuration_globale 
ON public.dce USING GIN (configuration_globale);

-- 4. (Optionnel) Initialiser avec une structure par défaut pour les DCE existants
-- Ceci crée une configuration minimale pour les DCE qui n'en ont pas encore
UPDATE public.dce
SET configuration_globale = jsonb_build_object(
  'informationsGenerales', jsonb_build_object(
    'acheteur', '',
    'titreMarche', titre_marche,
    'typeProcedure', '',
    'dureeMarche', '',
    'dateRemiseOffres', ''
  ),
  'lots', '[]'::jsonb,
  'variablesCommunes', jsonb_build_object(
    'ccagApplicable', '',
    'delaiPaiement', '30',
    'delaiExecution', '',
    'garantieFinanciere', false,
    'avance', false,
    'montantAvance', ''
  ),
  'contacts', jsonb_build_object(
    'responsableProcedure', '',
    'emailContact', '',
    'telephoneContact', ''
  )
)
WHERE configuration_globale IS NULL;

-- 5. Vérification
DO $$
DECLARE
  nb_dce_total INTEGER;
  nb_dce_avec_config INTEGER;
BEGIN
  SELECT COUNT(*) INTO nb_dce_total FROM public.dce;
  SELECT COUNT(*) INTO nb_dce_avec_config FROM public.dce WHERE configuration_globale IS NOT NULL;
  
  RAISE NOTICE '✅ Migration terminée :';
  RAISE NOTICE '   - Total DCE : %', nb_dce_total;
  RAISE NOTICE '   - DCE avec configuration_globale : %', nb_dce_avec_config;
  
  IF nb_dce_total = nb_dce_avec_config THEN
    RAISE NOTICE '✅ Tous les DCE ont une configuration_globale';
  ELSE
    RAISE WARNING '⚠️ Certains DCE n''ont pas de configuration_globale';
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
