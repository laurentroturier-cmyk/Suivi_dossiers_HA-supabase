-- ============================================
-- CONFIGURATION COMPLÈTE SUPABASE
-- Système d'authentification et gestion des rôles
-- ============================================

-- ============================================
-- 1. TABLE PROFILES
-- Stocke les informations de profil utilisateur
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Activer Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Politique : Les admins peuvent voir tous les profils
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent mettre à jour leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. TABLE MES_DONNEES
-- Table de démonstration pour les données
-- ============================================

CREATE TABLE IF NOT EXISTS public.mes_donnees (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  valeur NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_mes_donnees_nom ON public.mes_donnees(nom);

-- Activer Row Level Security
ALTER TABLE public.mes_donnees ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "Authenticated users can view data" ON public.mes_donnees;
CREATE POLICY "Authenticated users can view data"
  ON public.mes_donnees
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Seuls les admins peuvent insérer
DROP POLICY IF EXISTS "Admins can insert data" ON public.mes_donnees;
CREATE POLICY "Admins can insert data"
  ON public.mes_donnees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Seuls les admins peuvent modifier
DROP POLICY IF EXISTS "Admins can update data" ON public.mes_donnees;
CREATE POLICY "Admins can update data"
  ON public.mes_donnees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Seuls les admins peuvent supprimer
DROP POLICY IF EXISTS "Admins can delete data" ON public.mes_donnees;
CREATE POLICY "Admins can delete data"
  ON public.mes_donnees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. FONCTION TRIGGER
-- Crée automatiquement un profil lors de l'inscription
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. FONCTION DE MISE À JOUR AUTOMATIQUE
-- Met à jour le champ updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger pour profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour mes_donnees
DROP TRIGGER IF EXISTS on_mes_donnees_updated ON public.mes_donnees;
CREATE TRIGGER on_mes_donnees_updated
  BEFORE UPDATE ON public.mes_donnees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. DONNÉES DE TEST
-- Données de démonstration
-- ============================================

-- Insérer des données de test dans mes_donnees
INSERT INTO public.mes_donnees (nom, valeur, description) VALUES
  ('Projet Alpha', 45000, 'Développement application mobile'),
  ('Projet Beta', 78000, 'Infrastructure réseau entreprise'),
  ('Projet Gamma', 32000, 'Migration vers le cloud'),
  ('Projet Delta', 15000, 'Formation équipe technique'),
  ('Projet Epsilon', 92000, 'Refonte complète application web'),
  ('Projet Zeta', 25000, 'Audit de sécurité'),
  ('Projet Eta', 58000, 'Intégration système ERP'),
  ('Projet Theta', 41000, 'Dashboard analytics'),
  ('Projet Iota', 19000, 'Application IoT'),
  ('Projet Kappa', 67000, 'Plateforme e-commerce')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. VÉRIFICATIONS
-- Scripts utiles pour vérifier la configuration
-- ============================================

-- Voir tous les profils
-- SELECT * FROM public.profiles;

-- Voir toutes les données
-- SELECT * FROM public.mes_donnees ORDER BY valeur DESC;

-- Voir les politiques RLS sur profiles
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Voir les politiques RLS sur mes_donnees
-- SELECT * FROM pg_policies WHERE tablename = 'mes_donnees';

-- Compter les utilisateurs par rôle
-- SELECT role, COUNT(*) FROM public.profiles GROUP BY role;

-- ============================================
-- 7. GESTION DES RÔLES
-- Scripts pour gérer les rôles utilisateurs
-- ============================================

-- Promouvoir un utilisateur en admin
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'votre.email@exemple.com';

-- Rétrograder un admin en user
-- UPDATE public.profiles
-- SET role = 'user'
-- WHERE email = 'votre.email@exemple.com';

-- Voir les admins
-- SELECT id, email, role, created_at
-- FROM public.profiles
-- WHERE role = 'admin';

-- ============================================
-- 8. NETTOYAGE (Optionnel)
-- Supprimer toutes les configurations
-- ⚠️ ATTENTION : Ceci supprime TOUTES les données !
-- ============================================

-- NE PAS EXÉCUTER EN PRODUCTION

-- DROP TRIGGER IF EXISTS on_mes_donnees_updated ON public.mes_donnees;
-- DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_updated_at();
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.mes_donnees CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================
-- CONFIGURATION TERMINÉE ✅
-- ============================================

-- ============================================
-- 6. TABLE ACCESS_REQUESTS
-- Gestion des demandes d'accès avec validation admin
-- ============================================

CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON public.access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id ON public.access_requests(user_id);

-- Activer Row Level Security
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Politique : Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all access requests" ON public.access_requests;
CREATE POLICY "Admins can view all access requests"
  ON public.access_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Les admins peuvent modifier les demandes
DROP POLICY IF EXISTS "Admins can update access requests" ON public.access_requests;
CREATE POLICY "Admins can update access requests"
  ON public.access_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique : Tout le monde peut créer une demande (sera validée par fonction)
DROP POLICY IF EXISTS "Anyone can insert access request" ON public.access_requests;
CREATE POLICY "Anyone can insert access request"
  ON public.access_requests
  FOR INSERT
  WITH CHECK (true);

-- Politique : Les utilisateurs peuvent voir leur propre demande
DROP POLICY IF EXISTS "Users can view own requests" ON public.access_requests;
CREATE POLICY "Users can view own requests"
  ON public.access_requests
  FOR SELECT
  USING (email = auth.jwt()->>'email' OR user_id = auth.uid());

-- ============================================
-- 7. FONCTION : Vérifier la limite de 5 demandes par email
-- ============================================

CREATE OR REPLACE FUNCTION public.check_access_request_limit()
RETURNS TRIGGER AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Compter le nombre de demandes pour cet email
  SELECT COUNT(*) INTO request_count
  FROM public.access_requests
  WHERE email = NEW.email;
  
  -- Si >= 5 demandes, rejeter l'insertion
  IF request_count >= 5 THEN
    RAISE EXCEPTION 'Limite de demandes atteinte pour cet email. Contactez un administrateur.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier la limite avant insertion
DROP TRIGGER IF EXISTS check_request_limit_trigger ON public.access_requests;
CREATE TRIGGER check_request_limit_trigger
  BEFORE INSERT ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_access_request_limit();

-- ============================================
-- 8. FONCTION : Notifier les admins (optionnel)
-- ============================================

CREATE OR REPLACE FUNCTION public.notify_admins_new_request()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Nouvelle demande d''accès de: % (%)', NEW.email, NEW.first_name || ' ' || NEW.last_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour notifier après insertion
DROP TRIGGER IF EXISTS notify_admins_trigger ON public.access_requests;
CREATE TRIGGER notify_admins_trigger
  AFTER INSERT ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_request();

-- ============================================
-- 9. FONCTION : Approuver une demande et créer le profil
-- ============================================

CREATE OR REPLACE FUNCTION public.approve_access_request(request_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Vérifier que l'admin existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent approuver les demandes';
  END IF;
  
  -- Récupérer la demande
  SELECT * INTO request_record FROM public.access_requests WHERE id = request_id;
  
  IF request_record.status != 'pending' THEN
    RAISE EXCEPTION 'Cette demande a déjà été traitée';
  END IF;
  
  -- Créer le profil utilisateur
  INSERT INTO public.profiles (id, email, role)
  VALUES (request_record.user_id, request_record.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  
  -- Mettre à jour la demande
  UPDATE public.access_requests
  SET status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = admin_id
  WHERE id = request_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. FONCTION : Rejeter une demande
-- ============================================

CREATE OR REPLACE FUNCTION public.reject_access_request(
  request_id UUID, 
  admin_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier que l'admin existe
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent rejeter les demandes';
  END IF;
  
  -- Mettre à jour la demande
  UPDATE public.access_requests
  SET status = 'rejected',
      reviewed_at = NOW(),
      reviewed_by = admin_id,
      rejection_reason = reason
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande non trouvée ou déjà traitée';
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pour vérifier que tout fonctionne :
-- 1. Créez un utilisateur via Authentication > Users
-- 2. Vérifiez qu'un profil a été créé automatiquement :
SELECT 
  p.id,
  p.email,
  p.role,
  p.created_at,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 3. Testez les données :
SELECT COUNT(*) as total_projets, SUM(valeur) as valeur_totale
FROM public.mes_donnees;

-- 4. Vérifiez les demandes d'accès :
SELECT 
  id,
  email,
  first_name || ' ' || last_name as nom_complet,
  status,
  created_at,
  reviewed_at
FROM public.access_requests
ORDER BY created_at DESC;
