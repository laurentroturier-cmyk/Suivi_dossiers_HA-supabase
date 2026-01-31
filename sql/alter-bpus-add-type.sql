-- ============================================
-- Migration: Ajouter le champ type_bpu à la table bpus
-- Permet de gérer différents types de BPU dans une seule table
-- ============================================

-- Ajouter la colonne type_bpu si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bpus' 
        AND column_name = 'type_bpu'
    ) THEN
        -- Ajouter la colonne
        ALTER TABLE public.bpus 
        ADD COLUMN type_bpu TEXT NOT NULL DEFAULT 'standard';
        
        -- Créer un index sur type_bpu pour optimiser les requêtes
        CREATE INDEX IF NOT EXISTS idx_bpus_type ON public.bpus(type_bpu);
        
        -- Créer un index composite pour optimiser les requêtes par procédure et type
        CREATE INDEX IF NOT EXISTS idx_bpus_procedure_type ON public.bpus(procedure_id, type_bpu);
        
        RAISE NOTICE 'Colonne type_bpu ajoutée avec succès à la table bpus';
    ELSE
        RAISE NOTICE 'La colonne type_bpu existe déjà dans la table bpus';
    END IF;
END $$;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN public.bpus.type_bpu IS 'Type de BPU: standard, tma, travaux, services, etc.';

-- Note: La contrainte d'unicité reste (procedure_id, numero_lot) 
-- car un lot ne peut avoir qu'un seul type de BPU
