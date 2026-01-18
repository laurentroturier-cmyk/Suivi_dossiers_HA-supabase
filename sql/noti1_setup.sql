-- =====================================================
-- Table NOTI1 - Information au titulaire pressenti
-- =====================================================
-- Cette table stocke les documents NOTI1 pour informer
-- les candidats retenus dans le cadre des marchés publics
-- =====================================================

-- Suppression de la table si elle existe (attention en production!)
DROP TABLE IF EXISTS noti1;

-- Création de la table noti1
CREATE TABLE noti1 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_procedure VARCHAR(5) NOT NULL UNIQUE,
  titre_marche TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX idx_noti1_user_id ON noti1(user_id);
CREATE INDEX idx_noti1_numero_procedure ON noti1(numero_procedure);
CREATE INDEX idx_noti1_updated_at ON noti1(updated_at DESC);

-- Contrainte pour valider le format du numéro de procédure (5 chiffres)
ALTER TABLE noti1
  ADD CONSTRAINT check_numero_procedure_format
  CHECK (numero_procedure ~ '^\d{5}$');

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_noti1_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at lors de la modification
CREATE TRIGGER trigger_update_noti1_updated_at
  BEFORE UPDATE ON noti1
  FOR EACH ROW
  EXECUTE FUNCTION update_noti1_updated_at();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE noti1 ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres NOTI1
CREATE POLICY "Users can view their own NOTI1"
  ON noti1
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent créer leurs propres NOTI1
CREATE POLICY "Users can create their own NOTI1"
  ON noti1
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres NOTI1
CREATE POLICY "Users can update their own NOTI1"
  ON noti1
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent supprimer leurs propres NOTI1
CREATE POLICY "Users can delete their own NOTI1"
  ON noti1
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Commentaires pour la documentation
-- =====================================================

COMMENT ON TABLE noti1 IS 'Stockage des documents NOTI1 - Information au titulaire pressenti';
COMMENT ON COLUMN noti1.id IS 'Identifiant unique du document';
COMMENT ON COLUMN noti1.user_id IS 'Référence vers l''utilisateur créateur';
COMMENT ON COLUMN noti1.numero_procedure IS 'Numéro de procédure (5 chiffres, unique)';
COMMENT ON COLUMN noti1.titre_marche IS 'Titre/objet de la consultation (pour affichage rapide)';
COMMENT ON COLUMN noti1.data IS 'Données complètes du NOTI1 au format JSON';
COMMENT ON COLUMN noti1.created_at IS 'Date de création du document';
COMMENT ON COLUMN noti1.updated_at IS 'Date de dernière modification';

-- =====================================================
-- Fin du script
-- =====================================================
