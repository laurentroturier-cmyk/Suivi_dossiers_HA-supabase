-- ============================================
-- SCHÉMA DCE COMPLET
-- Module de rédaction centralisé du DCE
-- ============================================

-- ============================================
-- 1. TABLE DCE (Table principale)
-- Stocke tous les modules du DCE dans une seule table
-- ============================================

CREATE TABLE IF NOT EXISTS public.dce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_procedure VARCHAR(5) NOT NULL UNIQUE,
  procedure_id UUID, -- Référence à la table procédures (si existe)
  
  -- Métadonnées
  statut VARCHAR(50) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en-cours', 'finalisé', 'publié')),
  titre_marche TEXT,
  version INT DEFAULT 1,
  notes TEXT,
  
  -- Modules du DCE (stockés en JSONB pour flexibilité)
  reglement_consultation JSONB,
  acte_engagement JSONB,
  ccap JSONB,
  cctp JSONB,
  bpu JSONB,
  dqe JSONB,
  dpgf JSONB,
  documents_annexes JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_dce_user_id ON public.dce(user_id);
CREATE INDEX IF NOT EXISTS idx_dce_numero_procedure ON public.dce(numero_procedure);
CREATE INDEX IF NOT EXISTS idx_dce_statut ON public.dce(statut);
CREATE INDEX IF NOT EXISTS idx_dce_procedure_id ON public.dce(procedure_id);

-- Commentaires
COMMENT ON TABLE public.dce IS 'Table principale pour le module DCE Complet - stocke tous les modules du DCE';
COMMENT ON COLUMN public.dce.numero_procedure IS 'Numéro de procédure à 5 chiffres (clé de liaison)';
COMMENT ON COLUMN public.dce.statut IS 'Statut du DCE : brouillon, en-cours, finalisé, publié';
COMMENT ON COLUMN public.dce.reglement_consultation IS 'Données du Règlement de Consultation';
COMMENT ON COLUMN public.dce.acte_engagement IS 'Données de l''Acte d''Engagement';

-- ============================================
-- 2. TABLE DCE_VERSIONS (Historique optionnel)
-- Stocke l'historique des modifications
-- ============================================

CREATE TABLE IF NOT EXISTS public.dce_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dce_id UUID NOT NULL REFERENCES public.dce(id) ON DELETE CASCADE,
  version INT NOT NULL,
  section VARCHAR(100), -- 'reglement_consultation', 'acte_engagement', etc.
  data_before JSONB,
  data_after JSONB,
  modified_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_dce_versions_dce_id ON public.dce_versions(dce_id);
CREATE INDEX IF NOT EXISTS idx_dce_versions_section ON public.dce_versions(section);
CREATE INDEX IF NOT EXISTS idx_dce_versions_modified_at ON public.dce_versions(modified_at DESC);

COMMENT ON TABLE public.dce_versions IS 'Historique des modifications du DCE (audit trail)';

-- ============================================
-- 3. POLITIQUES RLS (Row Level Security)
-- ============================================

-- Activer RLS
ALTER TABLE public.dce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dce_versions ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres DCE
DROP POLICY IF EXISTS "Users can view own DCE" ON public.dce;
CREATE POLICY "Users can view own DCE"
  ON public.dce
  FOR SELECT
  USING (user_id = auth.uid());

-- Politique : Les utilisateurs peuvent insérer leurs propres DCE
DROP POLICY IF EXISTS "Users can insert own DCE" ON public.dce;
CREATE POLICY "Users can insert own DCE"
  ON public.dce
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Politique : Les utilisateurs peuvent modifier leurs propres DCE
DROP POLICY IF EXISTS "Users can update own DCE" ON public.dce;
CREATE POLICY "Users can update own DCE"
  ON public.dce
  FOR UPDATE
  USING (user_id = auth.uid());

-- Politique : Les utilisateurs peuvent supprimer leurs propres DCE
DROP POLICY IF EXISTS "Users can delete own DCE" ON public.dce;
CREATE POLICY "Users can delete own DCE"
  ON public.dce
  FOR DELETE
  USING (user_id = auth.uid());

-- Politique : Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all DCE" ON public.dce;
CREATE POLICY "Admins can view all DCE"
  ON public.dce
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politiques pour dce_versions
DROP POLICY IF EXISTS "Users can view own DCE versions" ON public.dce_versions;
CREATE POLICY "Users can view own DCE versions"
  ON public.dce_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dce d
      WHERE d.id = dce_versions.dce_id
      AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert DCE versions" ON public.dce_versions;
CREATE POLICY "System can insert DCE versions"
  ON public.dce_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dce d
      WHERE d.id = dce_versions.dce_id
      AND d.user_id = auth.uid()
    )
  );

-- ============================================
-- 4. FONCTION TRIGGER
-- Met à jour automatiquement updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_dce_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger pour dce
DROP TRIGGER IF EXISTS on_dce_updated ON public.dce;
CREATE TRIGGER on_dce_updated
  BEFORE UPDATE ON public.dce
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_dce_updated_at();

-- ============================================
-- 5. FONCTION POUR CRÉER UNE VERSION
-- (Optionnel - pour audit trail)
-- ============================================

CREATE OR REPLACE FUNCTION public.create_dce_version(
  p_dce_id UUID,
  p_section VARCHAR(100),
  p_data_before JSONB,
  p_data_after JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_version_id UUID;
  v_current_version INT;
BEGIN
  -- Récupérer la version actuelle du DCE
  SELECT version INTO v_current_version
  FROM public.dce
  WHERE id = p_dce_id;
  
  -- Insérer la nouvelle version
  INSERT INTO public.dce_versions (
    dce_id,
    version,
    section,
    data_before,
    data_after,
    modified_by
  )
  VALUES (
    p_dce_id,
    v_current_version,
    p_section,
    p_data_before,
    p_data_after,
    auth.uid()
  )
  RETURNING id INTO v_version_id;
  
  -- Incrémenter la version du DCE
  UPDATE public.dce
  SET version = version + 1
  WHERE id = p_dce_id;
  
  RETURN v_version_id;
END;
$$;

COMMENT ON FUNCTION public.create_dce_version IS 'Crée une nouvelle version dans l''historique et incrémente le numéro de version du DCE';

-- ============================================
-- 6. VUES UTILES
-- ============================================

-- Vue : DCE avec informations utilisateur
CREATE OR REPLACE VIEW public.vw_dce_with_user AS
SELECT 
  d.id,
  d.numero_procedure,
  d.titre_marche,
  d.statut,
  d.version,
  d.created_at,
  d.updated_at,
  p.email as user_email,
  p.role as user_role
FROM public.dce d
LEFT JOIN public.profiles p ON d.user_id = p.id;

COMMENT ON VIEW public.vw_dce_with_user IS 'Vue combinant DCE et informations utilisateur';

-- ============================================
-- 7. DONNÉES DE TEST (Optionnel)
-- ============================================

-- Exemple d'insertion (décommenté si besoin)
/*
INSERT INTO public.dce (
  user_id,
  numero_procedure,
  titre_marche,
  statut,
  reglement_consultation
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  '01000',
  'MOE-EXT-DIJON - Test',
  'brouillon',
  '{
    "enTete": {
      "numeroMarche": "24267_PNSC_MOE-EXT-DIJON_LLQ",
      "titreMarche": "MOE-EXT-DIJON"
    }
  }'::jsonb
);
*/

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
