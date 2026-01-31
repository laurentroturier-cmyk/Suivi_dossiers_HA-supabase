-- ============================================
-- MIGRATION : Source unique pour les lots
-- Date : 31 janvier 2026
-- Description : Copie les lots du Règlement de Consultation vers Configuration Globale
-- ============================================

-- OBJECTIF :
-- Transférer les lots depuis reglements_consultation.data.conditions.lots
-- vers dce.configuration_globale.lots pour centraliser la gestion des lots

-- ⚠️ IMPORTANT : 
-- Cette migration ne supprime PAS les lots du RC, elle les COPIE uniquement
-- Pour éviter toute perte de données

BEGIN;

-- ============================================
-- 1. Copier les lots du RC vers Configuration Globale
-- ============================================

UPDATE public.dce d
SET configuration_globale = jsonb_set(
  COALESCE(configuration_globale, '{}'::jsonb),
  '{lots}',
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'numero', lot->>'numero',
          'intitule', lot->>'intitule',
          'montant', lot->>'montantMax',  -- ⚠️ Mapper montantMax → montant
          'description', ''
        )
      ),
      '[]'::jsonb
    )
    FROM public.reglements_consultation rc,
    jsonb_array_elements(rc.data->'conditions'->'lots') AS lot
    WHERE rc.numero_procedure = d.numero_procedure
  )
)
WHERE 
  -- Ne migrer que si Config Globale est vide
  (configuration_globale->'lots' IS NULL OR 
   jsonb_array_length(configuration_globale->'lots') = 0)
  -- Et si le RC contient des lots
  AND EXISTS (
    SELECT 1 FROM public.reglements_consultation rc
    WHERE rc.numero_procedure = d.numero_procedure
    AND rc.data->'conditions'->'lots' IS NOT NULL
    AND jsonb_array_length(rc.data->'conditions'->'lots') > 0
  );

-- ============================================
-- 2. Vérifications
-- ============================================

-- Vérifier le nombre de DCE concernés
DO $$
DECLARE
  nb_dce_total INTEGER;
  nb_dce_avec_config_lots INTEGER;
  nb_dce_migres INTEGER;
BEGIN
  -- Total des DCE
  SELECT COUNT(*) INTO nb_dce_total FROM public.dce;
  
  -- DCE avec des lots dans Configuration Globale
  SELECT COUNT(*) INTO nb_dce_avec_config_lots 
  FROM public.dce 
  WHERE configuration_globale->'lots' IS NOT NULL
  AND jsonb_array_length(configuration_globale->'lots') > 0;
  
  -- DCE qui auraient pu être migrés (ont des lots dans RC)
  SELECT COUNT(*) INTO nb_dce_migres
  FROM public.dce d
  WHERE EXISTS (
    SELECT 1 FROM public.reglements_consultation rc
    WHERE rc.numero_procedure = d.numero_procedure
    AND rc.data->'conditions'->'lots' IS NOT NULL
    AND jsonb_array_length(rc.data->'conditions'->'lots') > 0
  );
  
  -- Afficher les résultats
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MIGRATION : Source unique pour les lots';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Statistiques :';
  RAISE NOTICE '   - Total DCE : %', nb_dce_total;
  RAISE NOTICE '   - DCE avec lots dans Config Globale : %', nb_dce_avec_config_lots;
  RAISE NOTICE '   - DCE avec lots dans RC (candidats migration) : %', nb_dce_migres;
  RAISE NOTICE '';
  
  IF nb_dce_avec_config_lots >= nb_dce_migres THEN
    RAISE NOTICE '✅ Migration terminée avec succès !';
  ELSE
    RAISE WARNING '⚠️ Certains DCE n''ont pas pu être migrés';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
END $$;

-- ============================================
-- 3. Détail des DCE migrés
-- ============================================

SELECT 
  d.numero_procedure,
  d.titre_marche,
  jsonb_array_length(d.configuration_globale->'lots') as nb_lots_config_globale,
  jsonb_array_length(rc.data->'conditions'->'lots') as nb_lots_rc
FROM public.dce d
LEFT JOIN public.reglements_consultation rc ON rc.numero_procedure = d.numero_procedure
WHERE d.configuration_globale->'lots' IS NOT NULL
  AND jsonb_array_length(d.configuration_globale->'lots') > 0
ORDER BY d.created_at DESC
LIMIT 20;

COMMIT;

-- ============================================
-- 4. Rollback (si nécessaire)
-- ============================================

-- En cas de problème, exécuter ce script pour annuler la migration :
/*
BEGIN;

UPDATE public.dce
SET configuration_globale = jsonb_set(
  configuration_globale,
  '{lots}',
  '[]'::jsonb
)
WHERE configuration_globale->'lots' IS NOT NULL;

COMMIT;
*/

-- ============================================
-- 5. Vérification post-migration (optionnel)
-- ============================================

-- Vérifier que tous les lots ont été correctement copiés
-- avec le mapping montantMax → montant
/*
SELECT 
  d.numero_procedure,
  d.configuration_globale->'lots' as lots_config_globale,
  rc.data->'conditions'->'lots' as lots_rc
FROM public.dce d
LEFT JOIN public.reglements_consultation rc ON rc.numero_procedure = d.numero_procedure
WHERE jsonb_array_length(d.configuration_globale->'lots') > 0
LIMIT 10;
*/
