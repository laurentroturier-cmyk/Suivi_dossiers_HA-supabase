-- ============================================================================
-- TABLE OUVERTURE DES PLIS - SUPABASE
-- ============================================================================
-- Ce script crée la table pour sauvegarder les données du module 
-- d'ouverture des plis (analyse des candidatures + recevabilité des offres)
-- ============================================================================

-- Suppression de la table si elle existe (pour réinitialisation)
DROP TABLE IF EXISTS public.ouverture_plis CASCADE;

-- ============================================================================
-- CRÉATION DE LA TABLE
-- ============================================================================
CREATE TABLE public.ouverture_plis (
  -- Identifiants et métadonnées
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations de la procédure
  num_proc TEXT NOT NULL,                    -- Numéro AFPA 5 chiffres
  reference_proc TEXT,                       -- Référence complète de la procédure
  nom_proc TEXT,                             -- Nom de la procédure
  id_projet TEXT,                            -- ID du projet/dossier rattaché
  
  -- Informations complémentaires
  msa TEXT,                                  -- MSA
  valideur_technique TEXT,                   -- Valideur technique
  demandeur TEXT,                            -- Demandeur
  
  -- Type d'analyse sauvegardée
  type_analyse TEXT CHECK (type_analyse IN ('candidature', 'recevabilite', 'complet')),
  
  -- Statut et version
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'en_cours', 'valide', 'archive')),
  version INTEGER DEFAULT 1,
  
  -- Notes et commentaires
  notes TEXT,
  
  -- ========================================================================
  -- DONNÉES JSONB - Flexible et performant
  -- ========================================================================
  
  -- Données des candidats (analyse candidature)
  candidats JSONB DEFAULT '[]'::jsonb,
  -- Structure du JSONB candidats :
  -- [
  --   {
  --     "numero": 1,
  --     "prenom": "...",
  --     "nom": "...",
  --     "societe": "...",
  --     "siret": "...",
  --     "email": "...",
  --     "adresse": "...",
  --     "codePostal": "...",
  --     "ville": "...",
  --     "telephone": "...",
  --     "lot": "...",
  --     "horsDelai": "...",
  --     "admisRejete": "...",
  --     "motifRejet": "...",
  --     "dc1": { ... },
  --     "dc2": { ... },
  --     "assurances": { ... },
  --     "offre": { ... }
  --   }
  -- ]
  
  -- Données de recevabilité des offres
  recevabilite JSONB DEFAULT '{}'::jsonb,
  -- Structure du JSONB recevabilite :
  -- {
  --   "candidats": [
  --     {
  --       "numero": 1,
  --       "societe": "...",
  --       "siret": "...",
  --       "lotRecevabilite": "...",
  --       "recevable": "Recevable|Éliminé",
  --       "motifRejetRecevabilite": "..."
  --     }
  --   ],
  --   "raisonInfructuosite": "...",
  --   "lotsInfructueux": [
  --     {
  --       "id": 123456789,
  --       "lot": "Lot 1",
  --       "statut": "Infructueux"
  --     }
  --   ]
  -- }
  
  -- Métadonnées supplémentaires (informations procédure, dépôts, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Contrainte unique : une seule entrée par procédure et type d'analyse
  CONSTRAINT unique_proc_type UNIQUE (num_proc, type_analyse)
);

-- ============================================================================
-- INDEXES POUR PERFORMANCE
-- ============================================================================

-- Index sur le numéro de procédure (recherche fréquente)
CREATE INDEX idx_ouverture_plis_num_proc ON public.ouverture_plis(num_proc);

-- Index sur le statut (filtrage par statut)
CREATE INDEX idx_ouverture_plis_statut ON public.ouverture_plis(statut);

-- Index sur la date de création (tri chronologique)
CREATE INDEX idx_ouverture_plis_created_at ON public.ouverture_plis(created_at DESC);

-- Index sur le créateur (filtrer par utilisateur)
CREATE INDEX idx_ouverture_plis_created_by ON public.ouverture_plis(created_by);

-- Index GIN sur les colonnes JSONB pour recherche rapide
CREATE INDEX idx_ouverture_plis_candidats ON public.ouverture_plis USING gin(candidats);
CREATE INDEX idx_ouverture_plis_recevabilite ON public.ouverture_plis USING gin(recevabilite);

-- ============================================================================
-- TRIGGER POUR MISE À JOUR AUTOMATIQUE DU TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_ouverture_plis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ouverture_plis_updated_at
  BEFORE UPDATE ON public.ouverture_plis
  FOR EACH ROW
  EXECUTE FUNCTION update_ouverture_plis_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.ouverture_plis ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs authentifiés peuvent voir leurs propres données
CREATE POLICY "Users can view own data"
  ON public.ouverture_plis
  FOR SELECT
  USING (auth.uid() = created_by);

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all data"
  ON public.ouverture_plis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent créer leurs propres données
CREATE POLICY "Users can insert own data"
  ON public.ouverture_plis
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Politique : Les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update own data"
  ON public.ouverture_plis
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Politique : Les admins peuvent tout modifier
CREATE POLICY "Admins can update all data"
  ON public.ouverture_plis
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete own data"
  ON public.ouverture_plis
  FOR DELETE
  USING (auth.uid() = created_by);

-- Politique : Les admins peuvent tout supprimer
CREATE POLICY "Admins can delete all data"
  ON public.ouverture_plis
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour compter les candidats
CREATE OR REPLACE FUNCTION get_candidats_count(plis_id UUID)
RETURNS INTEGER AS $$
  SELECT jsonb_array_length(candidats) 
  FROM public.ouverture_plis 
  WHERE id = plis_id;
$$ LANGUAGE sql STABLE;

-- Fonction pour obtenir les candidats recevables
CREATE OR REPLACE FUNCTION get_candidats_recevables(plis_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.ouverture_plis,
       jsonb_array_elements(recevabilite->'candidats') AS candidat
  WHERE id = plis_id
  AND candidat->>'recevable' = 'Recevable';
$$ LANGUAGE sql STABLE;

-- Fonction pour obtenir les candidats éliminés
CREATE OR REPLACE FUNCTION get_candidats_elimines(plis_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.ouverture_plis,
       jsonb_array_elements(recevabilite->'candidats') AS candidat
  WHERE id = plis_id
  AND candidat->>'recevable' = 'Éliminé';
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- VUES UTILES
-- ============================================================================

-- Vue pour avoir un résumé des ouvertures de plis
CREATE OR REPLACE VIEW v_ouverture_plis_summary AS
SELECT 
  op.id,
  op.num_proc,
  op.reference_proc,
  op.nom_proc,
  op.type_analyse,
  op.statut,
  op.msa,
  op.valideur_technique,
  op.demandeur,
  op.created_at,
  op.updated_at,
  p.email as created_by_email,
  p.role as created_by_role,
  jsonb_array_length(op.candidats) as nb_candidats_total,
  (
    SELECT COUNT(*)::INTEGER
    FROM jsonb_array_elements(op.recevabilite->'candidats') AS candidat
    WHERE candidat->>'recevable' = 'Recevable'
  ) as nb_candidats_recevables,
  (
    SELECT COUNT(*)::INTEGER
    FROM jsonb_array_elements(op.recevabilite->'candidats') AS candidat
    WHERE candidat->>'recevable' = 'Éliminé'
  ) as nb_candidats_elimines,
  jsonb_array_length(op.recevabilite->'lotsInfructueux') as nb_lots_infructueux
FROM public.ouverture_plis op
LEFT JOIN public.profiles p ON op.created_by = p.id;

-- ============================================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Décommenter pour insérer des données de test
/*
INSERT INTO public.ouverture_plis (
  num_proc,
  reference_proc,
  nom_proc,
  msa,
  valideur_technique,
  demandeur,
  type_analyse,
  statut,
  created_by,
  candidats,
  recevabilite,
  notes
) VALUES (
  '25006',
  '25006_AOO_TMA-EPM_LAY',
  'Prestations de Tierce Maintenance Applicative (TMA) de l''EPM',
  'Laurent ROTURIER',
  'Muhdi MERZOUGA',
  'Julien MICHELLET',
  'complet',
  'en_cours',
  auth.uid(),
  '[
    {
      "numero": 1,
      "societe": "Praesto Consulting",
      "siret": "123456789",
      "lot": "Unique",
      "admisRejete": "Admis"
    },
    {
      "numero": 2,
      "societe": "Klee Performance",
      "siret": "987654321",
      "lot": "Unique",
      "admisRejete": "Admis"
    }
  ]'::jsonb,
  '{
    "candidats": [
      {
        "numero": 1,
        "societe": "Praesto Consulting",
        "lotRecevabilite": "Unique",
        "recevable": "Recevable"
      },
      {
        "numero": 2,
        "societe": "Klee Performance",
        "lotRecevabilite": "Unique",
        "recevable": "Éliminé",
        "motifRejetRecevabilite": "Irrégulière"
      }
    ],
    "raisonInfructuosite": "",
    "lotsInfructueux": []
  }'::jsonb,
  'Données de test pour la procédure 25006'
);
*/

-- ============================================================================
-- COMMENTAIRES SUR LA TABLE ET LES COLONNES
-- ============================================================================

COMMENT ON TABLE public.ouverture_plis IS 'Sauvegarde des données du module d''ouverture des plis (analyse candidatures + recevabilité)';
COMMENT ON COLUMN public.ouverture_plis.num_proc IS 'Numéro de procédure AFPA (5 chiffres)';
COMMENT ON COLUMN public.ouverture_plis.type_analyse IS 'Type d''analyse: candidature, recevabilite, ou complet';
COMMENT ON COLUMN public.ouverture_plis.candidats IS 'Tableau JSONB des candidats avec toutes leurs informations';
COMMENT ON COLUMN public.ouverture_plis.recevabilite IS 'Objet JSONB contenant les données de recevabilité des offres';
COMMENT ON COLUMN public.ouverture_plis.statut IS 'Statut: brouillon, en_cours, valide, archive';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

-- Vérification
SELECT 
  'Table ouverture_plis créée avec succès!' as message,
  COUNT(*) as nb_colonnes
FROM information_schema.columns 
WHERE table_name = 'ouverture_plis' 
  AND table_schema = 'public';
