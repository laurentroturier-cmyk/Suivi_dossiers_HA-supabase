-- =============================================
-- TABLES POUR MODULE ANALYSE DES OFFRES DQE
-- Date: 17 février 2026
-- =============================================

-- =============================================
-- 1. TABLE ANALYSE_OFFRES_DQE (table principale)
-- =============================================

CREATE TABLE IF NOT EXISTS public.analyse_offres_dqe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_procedure TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  titre_marche TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT analyse_offres_dqe_unique UNIQUE (numero_procedure, numero_lot)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_analyse_offres_dqe_user_id ON public.analyse_offres_dqe(user_id);
CREATE INDEX IF NOT EXISTS idx_analyse_offres_dqe_numero_procedure ON public.analyse_offres_dqe(numero_procedure);
CREATE INDEX IF NOT EXISTS idx_analyse_offres_dqe_numero_lot ON public.analyse_offres_dqe(numero_lot);

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_analyse_offres_dqe_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS analyse_offres_dqe_updated_at_trigger ON public.analyse_offres_dqe;
CREATE TRIGGER analyse_offres_dqe_updated_at_trigger
  BEFORE UPDATE ON public.analyse_offres_dqe
  FOR EACH ROW
  EXECUTE FUNCTION update_analyse_offres_dqe_updated_at();

-- RLS
ALTER TABLE public.analyse_offres_dqe ENABLE ROW LEVEL SECURITY;

-- SELECT: Tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "All users can view analyse_offres_dqe" ON public.analyse_offres_dqe;
CREATE POLICY "All users can view analyse_offres_dqe"
  ON public.analyse_offres_dqe
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Seul l'utilisateur peut créer ses propres analyses
DROP POLICY IF EXISTS "Users can insert own analyse_offres_dqe" ON public.analyse_offres_dqe;
CREATE POLICY "Users can insert own analyse_offres_dqe"
  ON public.analyse_offres_dqe
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Le propriétaire OU un admin peut modifier
DROP POLICY IF EXISTS "Users and admins can update analyse_offres_dqe" ON public.analyse_offres_dqe;
CREATE POLICY "Users and admins can update analyse_offres_dqe"
  ON public.analyse_offres_dqe
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: Le propriétaire OU un admin peut supprimer
DROP POLICY IF EXISTS "Users and admins can delete analyse_offres_dqe" ON public.analyse_offres_dqe;
CREATE POLICY "Users and admins can delete analyse_offres_dqe"
  ON public.analyse_offres_dqe
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- 2. TABLE ANALYSE_OFFRES_DQE_CANDIDATS
-- =============================================

CREATE TABLE IF NOT EXISTS public.analyse_offres_dqe_candidats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analyse_id UUID REFERENCES public.analyse_offres_dqe(id) ON DELETE CASCADE,
  numero_candidat INTEGER NOT NULL,
  societe TEXT,
  siret TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT analyse_offres_dqe_candidats_unique UNIQUE (analyse_id, numero_candidat)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_analyse_offres_dqe_candidats_analyse_id ON public.analyse_offres_dqe_candidats(analyse_id);

-- Trigger
DROP TRIGGER IF EXISTS analyse_offres_dqe_candidats_updated_at_trigger ON public.analyse_offres_dqe_candidats;
CREATE TRIGGER analyse_offres_dqe_candidats_updated_at_trigger
  BEFORE UPDATE ON public.analyse_offres_dqe_candidats
  FOR EACH ROW
  EXECUTE FUNCTION update_analyse_offres_dqe_updated_at();

-- RLS
ALTER TABLE public.analyse_offres_dqe_candidats ENABLE ROW LEVEL SECURITY;

-- SELECT: Tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "All users can view candidats" ON public.analyse_offres_dqe_candidats;
CREATE POLICY "All users can view candidats"
  ON public.analyse_offres_dqe_candidats
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Seuls les utilisateurs authentifiés peuvent créer
DROP POLICY IF EXISTS "Authenticated users can insert candidats" ON public.analyse_offres_dqe_candidats;
CREATE POLICY "Authenticated users can insert candidats"
  ON public.analyse_offres_dqe_candidats
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Seuls les utilisateurs authentifiés peuvent modifier
DROP POLICY IF EXISTS "Authenticated users can update candidats" ON public.analyse_offres_dqe_candidats;
CREATE POLICY "Authenticated users can update candidats"
  ON public.analyse_offres_dqe_candidats
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DELETE: Seuls les utilisateurs authentifiés peuvent supprimer
DROP POLICY IF EXISTS "Authenticated users can delete candidats" ON public.analyse_offres_dqe_candidats;
CREATE POLICY "Authenticated users can delete candidats"
  ON public.analyse_offres_dqe_candidats
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- 3. TABLE ANALYSE_OFFRES_DQE_LIGNES
-- =============================================

CREATE TABLE IF NOT EXISTS public.analyse_offres_dqe_lignes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidat_id UUID REFERENCES public.analyse_offres_dqe_candidats(id) ON DELETE CASCADE,
  numero_ligne INTEGER NOT NULL,
  prix_unitaire NUMERIC,
  montant_ligne NUMERIC,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_analyse_offres_dqe_lignes_candidat_id ON public.analyse_offres_dqe_lignes(candidat_id);

-- Trigger
DROP TRIGGER IF EXISTS analyse_offres_dqe_lignes_updated_at_trigger ON public.analyse_offres_dqe_lignes;
CREATE TRIGGER analyse_offres_dqe_lignes_updated_at_trigger
  BEFORE UPDATE ON public.analyse_offres_dqe_lignes
  FOR EACH ROW
  EXECUTE FUNCTION update_analyse_offres_dqe_updated_at();

-- RLS
ALTER TABLE public.analyse_offres_dqe_lignes ENABLE ROW LEVEL SECURITY;

-- SELECT: Tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "All users can view lignes" ON public.analyse_offres_dqe_lignes;
CREATE POLICY "All users can view lignes"
  ON public.analyse_offres_dqe_lignes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: Seuls les utilisateurs authentifiés peuvent créer
DROP POLICY IF EXISTS "Authenticated users can insert lignes" ON public.analyse_offres_dqe_lignes;
CREATE POLICY "Authenticated users can insert lignes"
  ON public.analyse_offres_dqe_lignes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Seuls les utilisateurs authentifiés peuvent modifier
DROP POLICY IF EXISTS "Authenticated users can update lignes" ON public.analyse_offres_dqe_lignes;
CREATE POLICY "Authenticated users can update lignes"
  ON public.analyse_offres_dqe_lignes
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- DELETE: Seuls les utilisateurs authentifiés peuvent supprimer
DROP POLICY IF EXISTS "Authenticated users can delete lignes" ON public.analyse_offres_dqe_lignes;
CREATE POLICY "Authenticated users can delete lignes"
  ON public.analyse_offres_dqe_lignes
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- =============================================
-- COMMENTAIRES
-- =============================================

COMMENT ON TABLE public.analyse_offres_dqe IS 'Table principale pour les analyses d''offres DQE par procédure et lot';
COMMENT ON TABLE public.analyse_offres_dqe_candidats IS 'Candidats pour chaque analyse DQE';
COMMENT ON TABLE public.analyse_offres_dqe_lignes IS 'Lignes de détail pour chaque candidat';

-- =============================================
-- VÉRIFICATION
-- =============================================

SELECT 
  '✅ Tables analyse_offres_dqe créées avec succès!' as status,
  (SELECT COUNT(*) FROM analyse_offres_dqe) as nb_analyses,
  (SELECT COUNT(*) FROM analyse_offres_dqe_candidats) as nb_candidats,
  (SELECT COUNT(*) FROM analyse_offres_dqe_lignes) as nb_lignes;
