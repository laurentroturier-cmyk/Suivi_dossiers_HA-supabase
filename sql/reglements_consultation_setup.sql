-- Table pour sauvegarder les règlements de consultation
CREATE TABLE IF NOT EXISTS public.reglements_consultation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  numero_procedure TEXT NOT NULL UNIQUE, -- Numéro à 5 chiffres (ex: 25091)
  titre_marche TEXT,
  numero_marche TEXT,
  data JSONB NOT NULL, -- Tout le formData du RC
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_rc_user_id ON public.reglements_consultation(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_numero_procedure ON public.reglements_consultation(numero_procedure);
CREATE INDEX IF NOT EXISTS idx_rc_created_at ON public.reglements_consultation(created_at DESC);

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_rc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur update
DROP TRIGGER IF EXISTS rc_updated_at_trigger ON public.reglements_consultation;
CREATE TRIGGER rc_updated_at_trigger
  BEFORE UPDATE ON public.reglements_consultation
  FOR EACH ROW
  EXECUTE FUNCTION update_rc_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.reglements_consultation ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres RC
DROP POLICY IF EXISTS "Users can view own RC" ON public.reglements_consultation;
CREATE POLICY "Users can view own RC"
  ON public.reglements_consultation
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les admins peuvent voir tous les RC
DROP POLICY IF EXISTS "Admins can view all RC" ON public.reglements_consultation;
CREATE POLICY "Admins can view all RC"
  ON public.reglements_consultation
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent insérer leurs propres RC
DROP POLICY IF EXISTS "Users can insert own RC" ON public.reglements_consultation;
CREATE POLICY "Users can insert own RC"
  ON public.reglements_consultation
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres RC
DROP POLICY IF EXISTS "Users can update own RC" ON public.reglements_consultation;
CREATE POLICY "Users can update own RC"
  ON public.reglements_consultation
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres RC
DROP POLICY IF EXISTS "Users can delete own RC" ON public.reglements_consultation;
CREATE POLICY "Users can delete own RC"
  ON public.reglements_consultation
  FOR DELETE
  USING (auth.uid() = user_id);

-- Commentaires pour documentation
COMMENT ON TABLE public.reglements_consultation IS 'Sauvegarde des règlements de consultation par numéro de procédure (5 chiffres)';
COMMENT ON COLUMN public.reglements_consultation.numero_procedure IS 'Numéro unique à 5 chiffres (ex: 25091, 25006)';
COMMENT ON COLUMN public.reglements_consultation.data IS 'Données complètes du règlement de consultation au format JSON';
