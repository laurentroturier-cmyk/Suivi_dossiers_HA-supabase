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
