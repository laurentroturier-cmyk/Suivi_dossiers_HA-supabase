-- ============================================
-- TABLES MULTI-LOTS POUR TOUS LES MODULES DCE
-- Date: 21 janvier 2026
-- Support: CCTP, CCAP, BPU, DQE, DPGF
-- ============================================

-- Note: La fonction update_updated_at_column() existe déjà
-- Si ce n'est pas le cas, décommentez ci-dessous :
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- ============================================
-- TABLE CCTPS (Cahier des Clauses Techniques Particulières)
-- ============================================

CREATE TABLE IF NOT EXISTS public.cctps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT cctps_unique_lot UNIQUE (procedure_id, numero_lot)
);

CREATE INDEX IF NOT EXISTS idx_cctps_procedure ON cctps(procedure_id);
CREATE INDEX IF NOT EXISTS idx_cctps_lot ON cctps(numero_lot);
CREATE INDEX IF NOT EXISTS idx_cctps_composite ON cctps(procedure_id, numero_lot);

ALTER TABLE cctps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view cctps" ON cctps;
CREATE POLICY "Authenticated users can view cctps"
  ON cctps FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert cctps" ON cctps;
CREATE POLICY "Authenticated users can insert cctps"
  ON cctps FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update cctps" ON cctps;
CREATE POLICY "Authenticated users can update cctps"
  ON cctps FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete cctps" ON cctps;
CREATE POLICY "Authenticated users can delete cctps"
  ON cctps FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_cctps_updated_at ON cctps;
CREATE TRIGGER update_cctps_updated_at
  BEFORE UPDATE ON cctps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cctps IS 'Cahier des Clauses Techniques Particulières par lot';

-- ============================================
-- TABLE CCAPS (Cahier des Clauses Administratives Particulières)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ccaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT ccaps_unique_lot UNIQUE (procedure_id, numero_lot)
);

CREATE INDEX IF NOT EXISTS idx_ccaps_procedure ON ccaps(procedure_id);
CREATE INDEX IF NOT EXISTS idx_ccaps_lot ON ccaps(numero_lot);
CREATE INDEX IF NOT EXISTS idx_ccaps_composite ON ccaps(procedure_id, numero_lot);

ALTER TABLE ccaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view ccaps" ON ccaps;
CREATE POLICY "Authenticated users can view ccaps"
  ON ccaps FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert ccaps" ON ccaps;
CREATE POLICY "Authenticated users can insert ccaps"
  ON ccaps FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update ccaps" ON ccaps;
CREATE POLICY "Authenticated users can update ccaps"
  ON ccaps FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete ccaps" ON ccaps;
CREATE POLICY "Authenticated users can delete ccaps"
  ON ccaps FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_ccaps_updated_at ON ccaps;
CREATE TRIGGER update_ccaps_updated_at
  BEFORE UPDATE ON ccaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE ccaps IS 'Cahier des Clauses Administratives Particulières par lot';

-- ============================================
-- TABLE BPUS (Bordereau de Prix Unitaires)
-- ============================================

CREATE TABLE IF NOT EXISTS public.bpus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT bpus_unique_lot UNIQUE (procedure_id, numero_lot)
);

CREATE INDEX IF NOT EXISTS idx_bpus_procedure ON bpus(procedure_id);
CREATE INDEX IF NOT EXISTS idx_bpus_lot ON bpus(numero_lot);
CREATE INDEX IF NOT EXISTS idx_bpus_composite ON bpus(procedure_id, numero_lot);

ALTER TABLE bpus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view bpus" ON bpus;
CREATE POLICY "Authenticated users can view bpus"
  ON bpus FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert bpus" ON bpus;
CREATE POLICY "Authenticated users can insert bpus"
  ON bpus FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update bpus" ON bpus;
CREATE POLICY "Authenticated users can update bpus"
  ON bpus FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete bpus" ON bpus;
CREATE POLICY "Authenticated users can delete bpus"
  ON bpus FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_bpus_updated_at ON bpus;
CREATE TRIGGER update_bpus_updated_at
  BEFORE UPDATE ON bpus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE bpus IS 'Bordereau de Prix Unitaires par lot';

-- ============================================
-- TABLE DQES (Décomposition Quantitative Estimative)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dqes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT dqes_unique_lot UNIQUE (procedure_id, numero_lot)
);

CREATE INDEX IF NOT EXISTS idx_dqes_procedure ON dqes(procedure_id);
CREATE INDEX IF NOT EXISTS idx_dqes_lot ON dqes(numero_lot);
CREATE INDEX IF NOT EXISTS idx_dqes_composite ON dqes(procedure_id, numero_lot);

ALTER TABLE dqes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view dqes" ON dqes;
CREATE POLICY "Authenticated users can view dqes"
  ON dqes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert dqes" ON dqes;
CREATE POLICY "Authenticated users can insert dqes"
  ON dqes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update dqes" ON dqes;
CREATE POLICY "Authenticated users can update dqes"
  ON dqes FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete dqes" ON dqes;
CREATE POLICY "Authenticated users can delete dqes"
  ON dqes FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_dqes_updated_at ON dqes;
CREATE TRIGGER update_dqes_updated_at
  BEFORE UPDATE ON dqes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE dqes IS 'Décomposition Quantitative Estimative par lot';

-- ============================================
-- TABLE DPGFS (Décomposition du Prix Global et Forfaitaire)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dpgfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT dpgfs_unique_lot UNIQUE (procedure_id, numero_lot)
);

CREATE INDEX IF NOT EXISTS idx_dpgfs_procedure ON dpgfs(procedure_id);
CREATE INDEX IF NOT EXISTS idx_dpgfs_lot ON dpgfs(numero_lot);
CREATE INDEX IF NOT EXISTS idx_dpgfs_composite ON dpgfs(procedure_id, numero_lot);

ALTER TABLE dpgfs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view dpgfs" ON dpgfs;
CREATE POLICY "Authenticated users can view dpgfs"
  ON dpgfs FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert dpgfs" ON dpgfs;
CREATE POLICY "Authenticated users can insert dpgfs"
  ON dpgfs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update dpgfs" ON dpgfs;
CREATE POLICY "Authenticated users can update dpgfs"
  ON dpgfs FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete dpgfs" ON dpgfs;
CREATE POLICY "Authenticated users can delete dpgfs"
  ON dpgfs FOR DELETE USING (auth.role() = 'authenticated');

DROP TRIGGER IF EXISTS update_dpgfs_updated_at ON dpgfs;
CREATE TRIGGER update_dpgfs_updated_at
  BEFORE UPDATE ON dpgfs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE dpgfs IS 'Décomposition du Prix Global et Forfaitaire par lot';

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================

SELECT 
  'Toutes les tables multi-lots créées avec succès' as message,
  (SELECT COUNT(*) FROM actes_engagement) as nb_actes_engagement,
  (SELECT COUNT(*) FROM cctps) as nb_cctps,
  (SELECT COUNT(*) FROM ccaps) as nb_ccaps,
  (SELECT COUNT(*) FROM bpus) as nb_bpus,
  (SELECT COUNT(*) FROM dqes) as nb_dqes,
  (SELECT COUNT(*) FROM dpgfs) as nb_dpgfs;
