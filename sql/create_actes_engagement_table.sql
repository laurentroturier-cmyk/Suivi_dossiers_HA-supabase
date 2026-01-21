-- ============================================
-- Table ACTES_ENGAGEMENT - Support multi-lots
-- Date: 21 janvier 2026
-- ============================================

-- Fonction trigger pour updated_at (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création de la table actes_engagement
CREATE TABLE IF NOT EXISTS public.actes_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : 1 seul enregistrement par (procédure, lot)
  CONSTRAINT actes_engagement_unique_lot UNIQUE (procedure_id, numero_lot)
);

-- Note: La contrainte de clé étrangère est optionnelle
-- Si vous avez une table 'procedures', décommentez cette ligne :
-- ALTER TABLE actes_engagement 
--   ADD CONSTRAINT fk_procedure 
--   FOREIGN KEY (procedure_id) 
--   REFERENCES procedures(numero_procedure) 
--   ON DELETE CASCADE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_actes_engagement_procedure ON actes_engagement(procedure_id);
CREATE INDEX IF NOT EXISTS idx_actes_engagement_lot ON actes_engagement(numero_lot);
CREATE INDEX IF NOT EXISTS idx_actes_engagement_composite ON actes_engagement(procedure_id, numero_lot);

-- Row Level Security
ALTER TABLE actes_engagement ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "Authenticated users can view actes_engagement" ON actes_engagement;
CREATE POLICY "Authenticated users can view actes_engagement"
  ON actes_engagement FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : utilisateurs authentifiés peuvent insérer
DROP POLICY IF EXISTS "Authenticated users can insert actes_engagement" ON actes_engagement;
CREATE POLICY "Authenticated users can insert actes_engagement"
  ON actes_engagement FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Politique : utilisateurs authentifiés peuvent modifier
DROP POLICY IF EXISTS "Authenticated users can update actes_engagement" ON actes_engagement;
CREATE POLICY "Authenticated users can update actes_engagement"
  ON actes_engagement FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Politique : utilisateurs authentifiés peuvent supprimer
DROP POLICY IF EXISTS "Authenticated users can delete actes_engagement" ON actes_engagement;
CREATE POLICY "Authenticated users can delete actes_engagement"
  ON actes_engagement FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_actes_engagement_updated_at ON actes_engagement;
CREATE TRIGGER update_actes_engagement_updated_at
  BEFORE UPDATE ON actes_engagement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE actes_engagement IS 'Stocke les actes d''engagement par lot pour chaque procédure. Supporte N lots par procédure.';
COMMENT ON COLUMN actes_engagement.procedure_id IS 'Identifiant de la procédure (ex: 25091, 24012, etc.)';
COMMENT ON COLUMN actes_engagement.numero_lot IS 'Numéro du lot (1, 2, 3, ...)';
COMMENT ON COLUMN actes_engagement.libelle_lot IS 'Libellé descriptif du lot';
COMMENT ON COLUMN actes_engagement.data IS 'Données JSONB du formulaire Acte d''Engagement';

-- Migration optionnelle : données existantes de la table dce
-- ATTENTION: À exécuter seulement si des données existent dans dce.acte_engagement
-- 
-- INSERT INTO actes_engagement (procedure_id, numero_lot, libelle_lot, data)
-- SELECT 
--   procedure_id,
--   1 as numero_lot,
--   'Lot unique' as libelle_lot,
--   acte_engagement as data
-- FROM dce
-- WHERE acte_engagement IS NOT NULL 
--   AND acte_engagement != '{}'::jsonb
-- ON CONFLICT (procedure_id, numero_lot) DO NOTHING;

-- Vérification finale
SELECT 
  'Table actes_engagement créée avec succès' as message,
  COUNT(*) as nombre_enregistrements
FROM actes_engagement;
