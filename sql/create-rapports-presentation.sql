-- Table pour stocker les rapports de présentation
CREATE TABLE IF NOT EXISTS public.rapports_presentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_proc TEXT NOT NULL,
  titre TEXT NOT NULL,
  auteur TEXT,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_modification TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_revision', 'valide', 'publie')),
  version INTEGER NOT NULL DEFAULT 1,
  rapport_data JSONB NOT NULL,
  fichiers_sources JSONB,
  notes TEXT,
  UNIQUE(num_proc, version)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rapports_presentation_num_proc ON public.rapports_presentation(num_proc);
CREATE INDEX IF NOT EXISTS idx_rapports_presentation_statut ON public.rapports_presentation(statut);
CREATE INDEX IF NOT EXISTS idx_rapports_presentation_date_creation ON public.rapports_presentation(date_creation);
CREATE INDEX IF NOT EXISTS idx_rapports_presentation_rapport_data ON public.rapports_presentation USING GIN (rapport_data);

-- Trigger pour mettre à jour automatiquement date_modification
CREATE OR REPLACE FUNCTION update_rapport_modification_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rapport_modification_date
  BEFORE UPDATE ON public.rapports_presentation
  FOR EACH ROW
  EXECUTE FUNCTION update_rapport_modification_date();

-- Row Level Security (RLS)
ALTER TABLE public.rapports_presentation ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs authentifiés peuvent voir tous les rapports
CREATE POLICY "Authenticated users can view all rapports"
  ON public.rapports_presentation
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Les utilisateurs authentifiés peuvent créer des rapports
CREATE POLICY "Authenticated users can insert rapports"
  ON public.rapports_presentation
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Politique : Les utilisateurs authentifiés peuvent mettre à jour leurs rapports
CREATE POLICY "Authenticated users can update rapports"
  ON public.rapports_presentation
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Politique : Seuls les admins peuvent supprimer des rapports
CREATE POLICY "Admins can delete rapports"
  ON public.rapports_presentation
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Commentaires pour la documentation
COMMENT ON TABLE public.rapports_presentation IS 'Stockage des rapports de présentation générés';
COMMENT ON COLUMN public.rapports_presentation.id IS 'Identifiant unique du rapport';
COMMENT ON COLUMN public.rapports_presentation.num_proc IS 'Référence à la procédure concernée';
COMMENT ON COLUMN public.rapports_presentation.titre IS 'Titre du rapport';
COMMENT ON COLUMN public.rapports_presentation.auteur IS 'Auteur du rapport';
COMMENT ON COLUMN public.rapports_presentation.statut IS 'Statut du rapport : brouillon, en_revision, valide, publie';
COMMENT ON COLUMN public.rapports_presentation.version IS 'Numéro de version du rapport';
COMMENT ON COLUMN public.rapports_presentation.rapport_data IS 'Données complètes du rapport au format JSON';
COMMENT ON COLUMN public.rapports_presentation.fichiers_sources IS 'Métadonnées des fichiers sources utilisés';
COMMENT ON COLUMN public.rapports_presentation.notes IS 'Notes et commentaires sur le rapport';
