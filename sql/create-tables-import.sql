-- ============================================
-- CRÉATION DES TABLES POUR L'IMPORT DE DONNÉES
-- ============================================
-- Tables : projets et procedures
-- Date : 2026-01-09

-- ============================================
-- TABLE: projets
-- ============================================
CREATE TABLE IF NOT EXISTS public.projets (
  -- Identifiant unique
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Champs principaux
  id_projet TEXT,
  acheteur TEXT,
  famille_achat_principale TEXT,
  numero_procedure_afpa TEXT,
  prescripteur TEXT,
  client_interne TEXT,
  statut_dossier TEXT,
  programme TEXT,
  operation TEXT,
  levier_achat TEXT,
  renouvellement_marche TEXT,
  
  -- Dates
  date_lancement_consultation DATE,
  date_deploiement_previsionnelle DATE,
  date_ecriture_dce DATE,
  date_remise_offres DATE,
  date_ouverture_offres DATE,
  date_rejets DATE,
  date_echeance_marche DATE,
  date_remise_offres_finales DATE,
  date_validite_offres_calculee DATE,
  date_notification DATE,
  date_remise_candidatures DATE,
  
  -- Montants et économies
  perf_achat_previsionnelle NUMERIC(10, 2),
  montant_previsionnel_marche NUMERIC(15, 2),
  economie_achat_previsionnelle_12mois NUMERIC(15, 2),
  
  -- Champs de gestion
  origine_montant_economie TEXT,
  priorite TEXT,
  commission_achat TEXT,
  forme_marche TEXT,
  nom_valideurs TEXT,
  objet_court TEXT,
  type_procedure TEXT,
  ccag TEXT,
  
  -- Champs numériques
  nombre_lots INTEGER,
  lots_reserves TEXT,
  nombre_retraits INTEGER,
  nombre_soumissionnaires INTEGER,
  nombre_questions INTEGER,
  duree_marche_mois INTEGER,
  duree_validite_offres_jours INTEGER,
  duree_publication INTEGER,
  
  -- Champs booléens/options
  dispo_sociales TEXT,
  dispo_environnementales TEXT,
  projet_solutions_innovantes TEXT,
  projet_acces_tpe_pme TEXT,
  planification_on TEXT,
  
  -- Champs support et références
  support_procedure TEXT,
  reference_procedure_plateforme TEXT,
  avis_attribution TEXT,
  donnees_essentielles TEXT,
  finalite_consultation TEXT,
  statut_consultation TEXT,
  code_cpv_principal TEXT,
  
  -- Champs NO (Notification/Ordre)
  no_type_validation TEXT,
  no_msa TEXT,
  no_date_validation_msa DATE,
  no_date_previsionnelle_ca DATE,
  no_date_validation_codir DATE,
  no_date_envoi_signature_electronique DATE,
  no_date_validation_document DATE,
  no_statut TEXT,
  no_commentaire TEXT,
  
  -- Champs RP (Rapport/Procédure)
  rp_date_validation_msa DATE,
  rp_date_envoi_signature_elec DATE,
  rp_date_validation_document DATE,
  rp_date_validation_codir DATE,
  rp_commentaire TEXT,
  rp_statut TEXT,
  
  -- Dates de phases
  sourcing_date_debut DATE,
  opportunite_date_debut DATE,
  dce_redaction_date_debut DATE,
  consultation_date_debut DATE,
  analyse_date_debut DATE,
  attribution_date_debut DATE,
  execution_date_debut DATE,
  
  -- Champs calculés et métiers
  delai_traitement_calcul INTEGER,
  motivation_non_allotissement TEXT,
  date_limite_etude_strategie DATE,
  nom_procedure TEXT,
  commentaire_general_projet TEXT,
  
  -- Champs d'archivage et audit
  archivage_statut TEXT,
  modifie_par TEXT,
  titre_dossier TEXT,
  old_id_consult TEXT,
  old_id_projet TEXT,
  
  -- Champs divers
  nano TEXT,
  acheteur_mail TEXT,
  a_importer TEXT,
  id_projet_a_indiquer TEXT,
  id_consult_a_indiquer TEXT,
  intermediaire_1 TEXT,
  intermediaire_2 TEXT,
  finalite_a_importer TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_projets_id_projet ON public.projets(id_projet);
CREATE INDEX IF NOT EXISTS idx_projets_numero_procedure ON public.projets(numero_procedure_afpa);
CREATE INDEX IF NOT EXISTS idx_projets_statut ON public.projets(statut_dossier);
CREATE INDEX IF NOT EXISTS idx_projets_acheteur ON public.projets(acheteur);
CREATE INDEX IF NOT EXISTS idx_projets_date_lancement ON public.projets(date_lancement_consultation);

-- RLS (Row Level Security)
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view projets"
  ON public.projets
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Seuls les admins peuvent insérer/modifier
CREATE POLICY "Admins can insert projets"
  ON public.projets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update projets"
  ON public.projets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete projets"
  ON public.projets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: procedures
-- ============================================
CREATE TABLE IF NOT EXISTS public.procedures (
  -- Identifiant unique
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Champs principaux
  numero_procedure TEXT UNIQUE,
  nom_procedure TEXT,
  type_procedure TEXT,
  statut_consultation TEXT,
  objet_court TEXT,
  
  -- Dates
  date_lancement DATE,
  date_remise_offres DATE,
  date_ouverture_offres DATE,
  date_notification DATE,
  
  -- Informations complémentaires
  acheteur TEXT,
  famille_achat TEXT,
  montant_previsionnel NUMERIC(15, 2),
  nombre_lots INTEGER,
  nombre_candidats INTEGER,
  code_cpv TEXT,
  
  -- Référence au projet (si applicable)
  projet_id UUID REFERENCES public.projets(id),
  
  -- Commentaires
  commentaire TEXT
);

-- Index
CREATE INDEX IF NOT EXISTS idx_procedures_numero ON public.procedures(numero_procedure);
CREATE INDEX IF NOT EXISTS idx_procedures_statut ON public.procedures(statut_consultation);
CREATE INDEX IF NOT EXISTS idx_procedures_projet ON public.procedures(projet_id);

-- RLS
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view procedures"
  ON public.procedures
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Seuls les admins peuvent insérer/modifier
CREATE POLICY "Admins can insert procedures"
  ON public.procedures
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update procedures"
  ON public.procedures
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete procedures"
  ON public.procedures
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TRIGGER : Mise à jour automatique du champ updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projets_updated_at
  BEFORE UPDATE ON public.projets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================
COMMENT ON TABLE public.projets IS 'Table principale des projets d''achats publics';
COMMENT ON TABLE public.procedures IS 'Table des procédures de consultation';

COMMENT ON COLUMN public.projets.id_projet IS 'Identifiant métier du projet';
COMMENT ON COLUMN public.projets.numero_procedure_afpa IS 'Numéro de procédure Afpa';
COMMENT ON COLUMN public.projets.montant_previsionnel_marche IS 'Montant prévisionnel en euros HT';

COMMENT ON COLUMN public.procedures.numero_procedure IS 'Numéro unique de la procédure';
COMMENT ON COLUMN public.procedures.projet_id IS 'Référence au projet parent';

-- ============================================
-- FIN DU SCRIPT
-- ============================================
