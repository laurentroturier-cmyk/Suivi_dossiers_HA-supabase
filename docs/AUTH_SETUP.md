# Configuration de l'authentification Supabase

Ce projet utilise Supabase pour l'authentification et la gestion des rôles utilisateurs.

## Configuration de la base de données Supabase

### 1. Table `profiles`

Créez une table `profiles` dans votre base de données Supabase avec la structure suivante :

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Politique : Les admins peuvent tout voir
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. Table `mes_donnees`

Créez une table pour les données de démonstration :

```sql
CREATE TABLE public.mes_donnees (
  id SERIAL PRIMARY KEY,
  nom TEXT,
  valeur NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.mes_donnees ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view data"
  ON public.mes_donnees
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : Seuls les admins peuvent modifier
CREATE POLICY "Admins can modify data"
  ON public.mes_donnees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. Fonction trigger pour créer automatiquement un profil

```sql
-- Fonction pour créer un profil automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 4. Données de test

```sql
-- Insérer des données de test dans mes_donnees
INSERT INTO public.mes_donnees (nom, valeur) VALUES
  ('Projet A', 15000),
  ('Projet B', 32000),
  ('Projet C', 8500);
```

## Création des utilisateurs

### Via l'interface Supabase

1. Allez dans Authentication > Users
2. Créez un nouvel utilisateur
3. Notez son UUID
4. Dans la table `profiles`, modifiez le `role` de 'user' à 'admin' si nécessaire :

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@exemple.com';
```

### Via SQL (pour le développement uniquement)

```sql
-- ATTENTION : Ne pas utiliser en production
-- Créer un utilisateur de test admin
-- Vous devrez créer l'utilisateur via l'interface Supabase Auth d'abord,
-- puis mettre à jour son rôle :

UPDATE public.profiles
SET role = 'admin'
WHERE id = 'uuid-de-l-utilisateur';
```

## Utilisation

### Connexion

1. Lancez l'application : `npm run dev`
2. Vous serez redirigé vers la page de connexion
3. Entrez vos identifiants Supabase
4. Vous serez automatiquement redirigé vers l'application

### Interface

- **Badge utilisateur** : Affiche votre rôle (Admin ou User) dans le header
- **Bouton Dashboard** : Accédez au dashboard admin avec la table `mes_donnees`
- **Bouton Déconnexion** : Déconnectez-vous de l'application

### Gestion des erreurs RLS

Si vous voyez une erreur "403 Forbidden" ou "permission denied" :

1. Vérifiez que les politiques RLS sont correctement configurées
2. Vérifiez que votre rôle est correctement défini dans la table `profiles`
3. L'interface affiche une erreur spécifique avec des suggestions de résolution

## Architecture

### Composants créés

- `components/auth/Login.tsx` : Formulaire de connexion moderne
- `components/auth/AdminDashboard.tsx` : Dashboard entreprise avec table de données
- `types/auth.ts` : Types TypeScript pour l'authentification

### Logique d'authentification

L'authentification est gérée dans `App.tsx` :

1. `onAuthStateChange` écoute les changements de session
2. Récupération du profil depuis `public.profiles`
3. Affichage conditionnel selon l'état d'authentification :
   - Loading → Spinner
   - Non authentifié → Formulaire de login
   - Authentifié → Application principale ou Dashboard admin

## Sécurité

✅ **Row Level Security (RLS)** activé sur toutes les tables
✅ **Gestion des rôles** via la table profiles
✅ **Politiques différenciées** admin vs user
✅ **Gestion d'erreurs** spécifique pour les erreurs RLS

## Technologies utilisées

- **Supabase Auth** : Authentification
- **Supabase Database** : PostgreSQL avec RLS
- **React Hooks** : useState, useEffect
- **Tailwind CSS** : UI moderne
- **lucide-react** : Icônes
