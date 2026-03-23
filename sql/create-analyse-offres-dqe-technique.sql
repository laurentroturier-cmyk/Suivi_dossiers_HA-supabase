-- =============================================
-- TABLES POUR MODULE ANALYSE DES OFFRES DQE
-- Parties 2 (Analyse technique) et 3 (Synthèse)
-- Date: 23 mars 2026
-- =============================================

-- Réutilise le trigger existant update_analyse_offres_dqe_updated_at()
-- créé dans create-analyse-offres-dqe-tables.sql

-- =============================================
-- 1. TABLE ANALYSE_OFFRES_DQE_TECHNIQUE
-- Config technique par lot (critères + pondérations)
-- Relation : un seul enregistrement par analyse_id (UNIQUE)
-- =============================================

CREATE TABLE IF NOT EXISTS public.analyse_offres_dqe_technique (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analyse_id      UUID REFERENCES public.analyse_offres_dqe(id) ON DELETE CASCADE NOT NULL,
  poids_financier INTEGER NOT NULL DEFAULT 60 CHECK (poids_financier BETWEEN 0 AND 100),
  poids_technique INTEGER NOT NULL DEFAULT 40 CHECK (poids_technique BETWEEN 0 AND 100),
  -- criteria : tableau de AN01Criterion sérialisé en JSON
  -- schema : { id, code, label, base_points, parent_id?, criterion_label?, criterion_code?,
  --            sub_criterion_label?, sub_criterion_code? }[]
  criteria        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT aod_technique_poids_check CHECK (poids_financier + poids_technique = 100),
  CONSTRAINT aod_technique_unique UNIQUE (analyse_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_aod_technique_analyse_id ON public.analyse_offres_dqe_technique(analyse_id);

-- Trigger updated_at (réutilise la fonction existante)
DROP TRIGGER IF EXISTS aod_technique_updated_at_trigger ON public.analyse_offres_dqe_technique;
CREATE TRIGGER aod_technique_updated_at_trigger
  BEFORE UPDATE ON public.analyse_offres_dqe_technique
  FOR EACH ROW
  EXECUTE FUNCTION update_analyse_offres_dqe_updated_at();

-- RLS
ALTER TABLE public.analyse_offres_dqe_technique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view aod_technique" ON public.analyse_offres_dqe_technique;
CREATE POLICY "All users can view aod_technique"
  ON public.analyse_offres_dqe_technique
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert aod_technique" ON public.analyse_offres_dqe_technique;
CREATE POLICY "Authenticated users can insert aod_technique"
  ON public.analyse_offres_dqe_technique
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update aod_technique" ON public.analyse_offres_dqe_technique;
CREATE POLICY "Authenticated users can update aod_technique"
  ON public.analyse_offres_dqe_technique
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete aod_technique" ON public.analyse_offres_dqe_technique;
CREATE POLICY "Authenticated users can delete aod_technique"
  ON public.analyse_offres_dqe_technique
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- 2. TABLE ANALYSE_OFFRES_DQE_NOTATIONS
-- Notations individuelles : une ligne par (analyse_id, candidat_id, critere_id)
-- Permet UPSERT efficace sur la contrainte unique
-- =============================================

CREATE TABLE IF NOT EXISTS public.analyse_offres_dqe_notations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analyse_id  UUID REFERENCES public.analyse_offres_dqe(id) ON DELETE CASCADE NOT NULL,
  candidat_id UUID REFERENCES public.analyse_offres_dqe_candidats(id) ON DELETE CASCADE NOT NULL,
  critere_id  TEXT NOT NULL,
  score       INTEGER NOT NULL CHECK (score BETWEEN 0 AND 4),
  commentaire TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT aod_notations_unique UNIQUE (analyse_id, candidat_id, critere_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_aod_notations_analyse_id  ON public.analyse_offres_dqe_notations(analyse_id);
CREATE INDEX IF NOT EXISTS idx_aod_notations_candidat_id ON public.analyse_offres_dqe_notations(candidat_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS aod_notations_updated_at_trigger ON public.analyse_offres_dqe_notations;
CREATE TRIGGER aod_notations_updated_at_trigger
  BEFORE UPDATE ON public.analyse_offres_dqe_notations
  FOR EACH ROW
  EXECUTE FUNCTION update_analyse_offres_dqe_updated_at();

-- RLS
ALTER TABLE public.analyse_offres_dqe_notations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can view aod_notations" ON public.analyse_offres_dqe_notations;
CREATE POLICY "All users can view aod_notations"
  ON public.analyse_offres_dqe_notations
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert aod_notations" ON public.analyse_offres_dqe_notations;
CREATE POLICY "Authenticated users can insert aod_notations"
  ON public.analyse_offres_dqe_notations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update aod_notations" ON public.analyse_offres_dqe_notations;
CREATE POLICY "Authenticated users can update aod_notations"
  ON public.analyse_offres_dqe_notations
  FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete aod_notations" ON public.analyse_offres_dqe_notations;
CREATE POLICY "Authenticated users can delete aod_notations"
  ON public.analyse_offres_dqe_notations
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- COMMENTAIRES
-- =============================================

COMMENT ON TABLE public.analyse_offres_dqe_technique IS
  'Configuration technique (critères DCE + pondérations financier/technique) par lot d''analyse DQE';
COMMENT ON TABLE public.analyse_offres_dqe_notations IS
  'Notations techniques 0-4 par candidat et par critère pour l''analyse des offres DQE';

-- =============================================
-- VÉRIFICATION
-- =============================================

SELECT
  '✅ Tables analyse_offres_dqe Partie 2 & 3 créées avec succès!' AS status,
  (SELECT COUNT(*) FROM analyse_offres_dqe_technique) AS nb_technique,
  (SELECT COUNT(*) FROM analyse_offres_dqe_notations) AS nb_notations;
