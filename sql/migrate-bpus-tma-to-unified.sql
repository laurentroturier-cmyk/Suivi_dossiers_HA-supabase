-- ============================================
-- Migration optionnelle : bpus_tma → bpus (avec type_bpu = 'tma')
-- À exécuter UNIQUEMENT si vous aviez créé la table bpus_tma
-- ============================================

-- Vérifier si la table bpus_tma existe
DO $$ 
DECLARE
    table_exists BOOLEAN;
    rows_migrated INTEGER := 0;
BEGIN
    -- Vérifier l'existence de la table bpus_tma
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bpus_tma'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Table bpus_tma trouvée, début de la migration...';
        
        -- Migrer les données de bpus_tma vers bpus avec type_bpu = 'tma'
        INSERT INTO public.bpus (id, procedure_id, numero_lot, libelle_lot, type_bpu, data, created_at, updated_at)
        SELECT 
            id,
            procedure_id,
            numero_lot,
            libelle_lot,
            'tma' AS type_bpu, -- 🆕 Définir le type
            data,
            created_at,
            updated_at
        FROM public.bpus_tma
        ON CONFLICT (procedure_id, numero_lot) DO UPDATE
        SET
            type_bpu = 'tma',
            data = EXCLUDED.data,
            libelle_lot = EXCLUDED.libelle_lot,
            updated_at = EXCLUDED.updated_at;
        
        -- Compter les lignes migrées
        GET DIAGNOSTICS rows_migrated = ROW_COUNT;
        
        RAISE NOTICE '✅ % lignes migrées de bpus_tma vers bpus', rows_migrated;
        
        -- OPTIONNEL : Supprimer la table bpus_tma après migration
        -- Décommentez les lignes ci-dessous si vous voulez supprimer l'ancienne table
        -- DROP TABLE IF EXISTS public.bpus_tma CASCADE;
        -- RAISE NOTICE '🗑️ Table bpus_tma supprimée';
        
    ELSE
        RAISE NOTICE 'ℹ️ Table bpus_tma non trouvée, aucune migration nécessaire';
    END IF;
END $$;
