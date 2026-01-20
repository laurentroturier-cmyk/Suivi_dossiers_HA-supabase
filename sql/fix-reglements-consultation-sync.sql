-- =============================================
-- FIX: Vérifier et réparer la synchro reglements_consultation ↔ dce
-- =============================================

-- 1. Vérifier la RLS sur reglements_consultation
SELECT tablename, policyname FROM pg_policies 
WHERE tablename = 'reglements_consultation' 
ORDER BY policyname;

-- 2. Vérifier les données de test 25006
SELECT 
  id, 
  user_id, 
  numero_procedure, 
  titre_marche, 
  created_at, 
  updated_at 
FROM public.reglements_consultation 
WHERE numero_procedure = '25006';

-- 3. Vérifier si 25006 est aussi dans la table dce
SELECT 
  id, 
  user_id, 
  numero_procedure, 
  titre_marche, 
  reglement_consultation IS NOT NULL as has_rc,
  created_at, 
  updated_at 
FROM public.dce 
WHERE numero_procedure = '25006';

-- 4. Vérifier les profils admin
SELECT id, email, role FROM public.profiles WHERE role = 'admin';

-- 5. Vérifier l'utilisateur courant
SELECT auth.uid() as current_user_id;

-- 6. Diagnostic : voir ce que RLS permet de lire
-- (À exécuter comme l'utilisateur connecté)
SELECT 
  numero_procedure,
  titre_marche,
  'reglements_consultation' as source
FROM public.reglements_consultation;

SELECT 
  numero_procedure,
  titre_marche,
  'dce' as source
FROM public.dce;

-- =============================================
-- OPTIONNEL : Si vous voulez forcer une entrée de test
-- =============================================

-- Créer un test RC pour 25006 si absent (remplacer uuid par l'ID utilisateur réel)
-- INSERT INTO public.reglements_consultation (user_id, numero_procedure, titre_marche, numero_marche, data)
-- VALUES (
--   auth.uid(),
--   '25006',
--   'Test Procédure 25006',
--   'TEST-2024',
--   '{"enTete": {"numeroProcedure": "25006", "titreMarche": "Test Procédure 25006"}}'::jsonb
-- )
-- ON CONFLICT (numero_procedure) DO UPDATE
-- SET titre_marche = 'Test Procédure 25006'
-- WHERE reglements_consultation.user_id = auth.uid();
