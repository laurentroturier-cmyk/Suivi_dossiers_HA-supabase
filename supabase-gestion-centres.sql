-- ============================================
-- Table pour la gestion des centres et données financières
-- Module Admin - Synthèse multi-régions
-- ============================================

-- Table principale pour stocker les données des centres
CREATE TABLE IF NOT EXISTS public.centres_donnees_financieres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,                    -- Nom du fichier Excel (ex: "AURA - ANNECY")
  centre TEXT NOT NULL,                    -- Nom de l'onglet (ex: "GRN 166")
  annee INTEGER NOT NULL,                  -- Année (2019, 2020, 2021, etc.)
  
  -- Données de repas
  nombre_repas INTEGER,
  dont_repas_stagiaires INTEGER,
  dont_repas_salaries INTEGER,
  autres_repas INTEGER,
  
  -- Produits et charges
  produits_activites NUMERIC(12, 2),
  dont_collectivites_territoriales NUMERIC(12, 2),
  charges_directes NUMERIC(12, 2),
  dont_energie_fluides NUMERIC(12, 2),
  dont_charges_personnel NUMERIC(12, 2),
  
  -- Marges
  marge_couts_directs_ebe NUMERIC(12, 2),
  dotations_amortissements NUMERIC(12, 2),
  charges_structures NUMERIC(12, 2),
  total_charges NUMERIC(12, 2),
  marge_couts_complets NUMERIC(12, 2),
  
  -- Métadonnées
  prestataire TEXT,                        -- Ex: "GRN 166"
  fichier_source TEXT,                     -- Nom complet du fichier uploadé
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index unique pour éviter les doublons
  UNIQUE(region, centre, annee)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_centres_region ON public.centres_donnees_financieres(region);
CREATE INDEX IF NOT EXISTS idx_centres_centre ON public.centres_donnees_financieres(centre);
CREATE INDEX IF NOT EXISTS idx_centres_annee ON public.centres_donnees_financieres(annee);
CREATE INDEX IF NOT EXISTS idx_centres_uploaded_by ON public.centres_donnees_financieres(uploaded_by);

-- Vue pour le tableau de synthèse
CREATE OR REPLACE VIEW public.synthese_centres AS
SELECT 
  region,
  centre,
  annee,
  nombre_repas,
  produits_activites,
  charges_directes,
  marge_couts_directs_ebe,
  marge_couts_complets,
  prestataire,
  uploaded_at
FROM public.centres_donnees_financieres
ORDER BY region, centre, annee;

-- Vue pour les totaux par année
CREATE OR REPLACE VIEW public.vue_totaux_annuels AS
SELECT 
  annee,
  COUNT(DISTINCT centre) as nombre_centres,
  COUNT(DISTINCT region) as nombre_regions,
  COALESCE(SUM(nombre_repas), 0) as total_repas,
  COALESCE(SUM(dont_repas_stagiaires), 0) as total_repas_stagiaires,
  COALESCE(SUM(dont_repas_salaries), 0) as total_repas_salaries,
  COALESCE(SUM(autres_repas), 0) as total_autres_repas,
  COALESCE(SUM(produits_activites), 0) as total_produits_activites,
  COALESCE(SUM(dont_collectivites_territoriales), 0) as total_collectivites_territoriales,
  COALESCE(SUM(charges_directes), 0) as total_charges_directes,
  COALESCE(SUM(dont_energie_fluides), 0) as total_energie_fluides,
  COALESCE(SUM(dont_charges_personnel), 0) as total_charges_personnel,
  COALESCE(SUM(marge_couts_directs_ebe), 0) as total_marge_ebe,
  COALESCE(SUM(dotations_amortissements), 0) as total_dotations_amortissements,
  COALESCE(SUM(charges_structures), 0) as total_charges_structures,
  COALESCE(SUM(total_charges), 0) as total_charges,
  COALESCE(SUM(marge_couts_complets), 0) as total_marge_complets
FROM public.centres_donnees_financieres
GROUP BY annee
ORDER BY annee;

-- Table pour tracker les imports de fichiers
CREATE TABLE IF NOT EXISTS public.imports_fichiers_centres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_fichier TEXT NOT NULL,
  region TEXT NOT NULL,
  nombre_onglets INTEGER,
  nombre_lignes_importees INTEGER,
  statut TEXT CHECK (statut IN ('en_cours', 'termine', 'erreur')) DEFAULT 'en_cours',
  message_erreur TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE public.centres_donnees_financieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imports_fichiers_centres ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
DROP POLICY IF EXISTS "Admins can manage centres data" ON public.centres_donnees_financieres;
CREATE POLICY "Admins can manage centres data"
  ON public.centres_donnees_financieres
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage imports" ON public.imports_fichiers_centres;
CREATE POLICY "Admins can manage imports"
  ON public.imports_fichiers_centres
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Les utilisateurs peuvent seulement lire
DROP POLICY IF EXISTS "Users can view centres data" ON public.centres_donnees_financieres;
CREATE POLICY "Users can view centres data"
  ON public.centres_donnees_financieres
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- Fonctions utilitaires
-- ============================================

-- Fonction pour nettoyer les anciennes données d'une région
CREATE OR REPLACE FUNCTION public.nettoyer_donnees_region(p_region TEXT)
RETURNS INTEGER AS $$
DECLARE
  nb_supprime INTEGER;
BEGIN
  DELETE FROM public.centres_donnees_financieres
  WHERE region = p_region;
  
  GET DIAGNOSTICS nb_supprime = ROW_COUNT;
  RETURN nb_supprime;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques par région
CREATE OR REPLACE FUNCTION public.stats_par_region()
RETURNS TABLE (
  region TEXT,
  nombre_centres BIGINT,
  nombre_annees BIGINT,
  total_repas BIGINT,
  total_produits NUMERIC,
  derniere_maj TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdf.region,
    COUNT(DISTINCT cdf.centre) as nombre_centres,
    COUNT(DISTINCT cdf.annee) as nombre_annees,
    SUM(cdf.nombre_repas) as total_repas,
    SUM(cdf.produits_activites) as total_produits,
    MAX(cdf.updated_at) as derniere_maj
  FROM public.centres_donnees_financieres cdf
  GROUP BY cdf.region
  ORDER BY cdf.region;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les totaux par année toutes régions confondues
CREATE OR REPLACE FUNCTION public.totaux_par_annee()
RETURNS TABLE (
  annee INTEGER,
  nombre_centres BIGINT,
  nombre_regions BIGINT,
  total_repas BIGINT,
  total_repas_stagiaires BIGINT,
  total_repas_salaries BIGINT,
  total_autres_repas BIGINT,
  total_produits_activites NUMERIC,
  total_collectivites_territoriales NUMERIC,
  total_charges_directes NUMERIC,
  total_energie_fluides NUMERIC,
  total_charges_personnel NUMERIC,
  total_marge_ebe NUMERIC,
  total_dotations_amortissements NUMERIC,
  total_charges_structures NUMERIC,
  total_charges NUMERIC,
  total_marge_complets NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdf.annee,
    COUNT(DISTINCT cdf.centre) as nombre_centres,
    COUNT(DISTINCT cdf.region) as nombre_regions,
    COALESCE(SUM(cdf.nombre_repas), 0)::BIGINT as total_repas,
    COALESCE(SUM(cdf.dont_repas_stagiaires), 0)::BIGINT as total_repas_stagiaires,
    COALESCE(SUM(cdf.dont_repas_salaries), 0)::BIGINT as total_repas_salaries,
    COALESCE(SUM(cdf.autres_repas), 0)::BIGINT as total_autres_repas,
    COALESCE(SUM(cdf.produits_activites), 0) as total_produits_activites,
    COALESCE(SUM(cdf.dont_collectivites_territoriales), 0) as total_collectivites_territoriales,
    COALESCE(SUM(cdf.charges_directes), 0) as total_charges_directes,
    COALESCE(SUM(cdf.dont_energie_fluides), 0) as total_energie_fluides,
    COALESCE(SUM(cdf.dont_charges_personnel), 0) as total_charges_personnel,
    COALESCE(SUM(cdf.marge_couts_directs_ebe), 0) as total_marge_ebe,
    COALESCE(SUM(cdf.dotations_amortissements), 0) as total_dotations_amortissements,
    COALESCE(SUM(cdf.charges_structures), 0) as total_charges_structures,
    COALESCE(SUM(cdf.total_charges), 0) as total_charges,
    COALESCE(SUM(cdf.marge_couts_complets), 0) as total_marge_complets
  FROM public.centres_donnees_financieres cdf
  GROUP BY cdf.annee
  ORDER BY cdf.annee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les totaux par année avec filtres région et centre
CREATE OR REPLACE FUNCTION public.totaux_par_annee_filtres(
  p_region TEXT DEFAULT NULL,
  p_centre TEXT DEFAULT NULL
)
RETURNS TABLE (
  annee INTEGER,
  nombre_centres BIGINT,
  nombre_regions BIGINT,
  total_repas BIGINT,
  total_repas_stagiaires BIGINT,
  total_repas_salaries BIGINT,
  total_autres_repas BIGINT,
  total_produits_activites NUMERIC,
  total_collectivites_territoriales NUMERIC,
  total_charges_directes NUMERIC,
  total_energie_fluides NUMERIC,
  total_charges_personnel NUMERIC,
  total_marge_ebe NUMERIC,
  total_dotations_amortissements NUMERIC,
  total_charges_structures NUMERIC,
  total_charges NUMERIC,
  total_marge_complets NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdf.annee,
    COUNT(DISTINCT cdf.centre) as nombre_centres,
    COUNT(DISTINCT cdf.region) as nombre_regions,
    COALESCE(SUM(cdf.nombre_repas), 0)::BIGINT as total_repas,
    COALESCE(SUM(cdf.dont_repas_stagiaires), 0)::BIGINT as total_repas_stagiaires,
    COALESCE(SUM(cdf.dont_repas_salaries), 0)::BIGINT as total_repas_salaries,
    COALESCE(SUM(cdf.autres_repas), 0)::BIGINT as total_autres_repas,
    COALESCE(SUM(cdf.produits_activites), 0) as total_produits_activites,
    COALESCE(SUM(cdf.dont_collectivites_territoriales), 0) as total_collectivites_territoriales,
    COALESCE(SUM(cdf.charges_directes), 0) as total_charges_directes,
    COALESCE(SUM(cdf.dont_energie_fluides), 0) as total_energie_fluides,
    COALESCE(SUM(cdf.dont_charges_personnel), 0) as total_charges_personnel,
    COALESCE(SUM(cdf.marge_couts_directs_ebe), 0) as total_marge_ebe,
    COALESCE(SUM(cdf.dotations_amortissements), 0) as total_dotations_amortissements,
    COALESCE(SUM(cdf.charges_structures), 0) as total_charges_structures,
    COALESCE(SUM(cdf.total_charges), 0) as total_charges,
    COALESCE(SUM(cdf.marge_couts_complets), 0) as total_marge_complets
  FROM public.centres_donnees_financieres cdf
  WHERE 
    (p_region IS NULL OR cdf.region = p_region)
    AND (p_centre IS NULL OR cdf.centre = p_centre)
  GROUP BY cdf.annee
  ORDER BY cdf.annee;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_centres_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_centres_timestamp ON public.centres_donnees_financieres;
CREATE TRIGGER trigger_update_centres_timestamp
  BEFORE UPDATE ON public.centres_donnees_financieres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_centres_updated_at();

-- ============================================
-- Commentaires
-- ============================================

COMMENT ON TABLE public.centres_donnees_financieres IS 
'Données financières des centres de restauration par région et année';

COMMENT ON TABLE public.imports_fichiers_centres IS 
'Historique des imports de fichiers Excel pour le suivi';

COMMENT ON VIEW public.synthese_centres IS 
'Vue synthétique des données centres pour reporting';


COMMENT ON VIEW public.vue_totaux_annuels IS 
'Totaux par année toutes régions confondues pour analyse comparative';

COMMENT ON FUNCTION public.totaux_par_annee() IS 
'Retourne les totaux agrégés par année avec toutes les catégories de données';

COMMENT ON FUNCTION public.totaux_par_annee_filtres(TEXT, TEXT) IS 
'Retourne les totaux agrégés par année avec filtres optionnels sur région et centre';