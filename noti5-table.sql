-- Table pour stocker les documents NOTI5
CREATE TABLE IF NOT EXISTS public.noti5_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero_procedure TEXT NOT NULL,
  titre_marche TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, numero_procedure)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_noti5_user_id ON public.noti5_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_noti5_numero_procedure ON public.noti5_documents(numero_procedure);

-- RLS
ALTER TABLE public.noti5_documents ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leurs propres NOTI5
CREATE POLICY \"Users can view own noti5\"
  ON public.noti5_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent créer leurs propres NOTI5
CREATE POLICY \"Users can insert own noti5\"
  ON public.noti5_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent modifier leurs propres NOTI5
CREATE POLICY \"Users can update own noti5\"
  ON public.noti5_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres NOTI5
CREATE POLICY \"Users can delete own noti5\"
  ON public.noti5_documents
  FOR DELETE
  USING (auth.uid() = user_id);
