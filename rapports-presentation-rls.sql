-- Politiques RLS pour la table rapports_presentation

-- Activer RLS
ALTER TABLE public.rapports_presentation ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs authentifiés peuvent lire tous les rapports
CREATE POLICY "Authenticated users can view all rapports"
  ON public.rapports_presentation
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Les utilisateurs authentifiés peuvent insérer des rapports
CREATE POLICY "Authenticated users can insert rapports"
  ON public.rapports_presentation
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Politique : Les utilisateurs authentifiés peuvent mettre à jour des rapports
CREATE POLICY "Authenticated users can update rapports"
  ON public.rapports_presentation
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Politique : Les utilisateurs authentifiés peuvent supprimer des rapports
CREATE POLICY "Authenticated users can delete rapports"
  ON public.rapports_presentation
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Créer la fonction trigger si elle n'existe pas
CREATE OR REPLACE FUNCTION update_rapport_modification_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vérifier que le trigger existe
-- (déjà créé selon votre schéma, mais on le recrée au cas où)
DROP TRIGGER IF EXISTS trigger_update_rapport_modification_date ON public.rapports_presentation;
CREATE TRIGGER trigger_update_rapport_modification_date
  BEFORE UPDATE ON public.rapports_presentation
  FOR EACH ROW
  EXECUTE FUNCTION update_rapport_modification_date();
