-- =============================================
-- Table questionnaire_technique
-- Sauvegarde des questionnaires techniques par numéro de procédure
-- =============================================

CREATE TABLE IF NOT EXISTS public.questionnaire_technique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_procedure TEXT NOT NULL UNIQUE,  -- Numéro à 5 chiffres (ex: 25006)
  titre_marche TEXT,
  data JSONB NOT NULL,  -- Structure complète du questionnaire
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_qt_user_id ON public.questionnaire_technique(user_id);
CREATE INDEX IF NOT EXISTS idx_qt_numero_procedure ON public.questionnaire_technique(numero_procedure);
CREATE INDEX IF NOT EXISTS idx_qt_created_at ON public.questionnaire_technique(created_at DESC);

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_qt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur update
DROP TRIGGER IF EXISTS qt_updated_at_trigger ON public.questionnaire_technique;
CREATE TRIGGER qt_updated_at_trigger
  BEFORE UPDATE ON public.questionnaire_technique
  FOR EACH ROW
  EXECUTE FUNCTION update_qt_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE public.questionnaire_technique ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres QT
DROP POLICY IF EXISTS "Users can view own QT" ON public.questionnaire_technique;
CREATE POLICY "Users can view own QT"
  ON public.questionnaire_technique
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les admins peuvent voir tous les QT
DROP POLICY IF EXISTS "Admins can view all QT" ON public.questionnaire_technique;
CREATE POLICY "Admins can view all QT"
  ON public.questionnaire_technique
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent insérer leurs propres QT
DROP POLICY IF EXISTS "Users can insert own QT" ON public.questionnaire_technique;
CREATE POLICY "Users can insert own QT"
  ON public.questionnaire_technique
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres QT
DROP POLICY IF EXISTS "Users can update own QT" ON public.questionnaire_technique;
CREATE POLICY "Users can update own QT"
  ON public.questionnaire_technique
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres QT
DROP POLICY IF EXISTS "Users can delete own QT" ON public.questionnaire_technique;
CREATE POLICY "Users can delete own QT"
  ON public.questionnaire_technique
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE public.questionnaire_technique IS 'Sauvegarde des questionnaires techniques par numéro de procédure (5 chiffres)';
COMMENT ON COLUMN public.questionnaire_technique.numero_procedure IS 'Numéro unique à 5 chiffres (ex: 25006, 25091)';
COMMENT ON COLUMN public.questionnaire_technique.data IS 'Données complètes du questionnaire technique au format JSON';
