# Guide de test - Authentification Supabase

## 🚀 Démarrage rapide

### 1. Configuration initiale de Supabase

Avant de tester, assurez-vous d'avoir configuré Supabase (voir [AUTH_SETUP.md](./AUTH_SETUP.md)).

#### Scripts SQL essentiels à exécuter

Copiez et exécutez ces scripts dans l'éditeur SQL de Supabase :

```sql
-- 1. Créer la table profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Créer la table mes_donnees
CREATE TABLE public.mes_donnees (
  id SERIAL PRIMARY KEY,
  nom TEXT,
  valeur NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mes_donnees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view data"
  ON public.mes_donnees FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3. Fonction trigger pour auto-créer les profils
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Insérer des données de test
INSERT INTO public.mes_donnees (nom, valeur, description) VALUES
  ('Projet Alpha', 45000, 'Projet de développement'),
  ('Projet Beta', 78000, 'Infrastructure réseau'),
  ('Projet Gamma', 32000, 'Migration cloud'),
  ('Projet Delta', 15000, 'Formation équipe'),
  ('Projet Epsilon', 92000, 'Refonte application');
```

### 2. Créer des utilisateurs de test

#### Via l'interface Supabase

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Créez deux utilisateurs :

   **Utilisateur standard :**
   - Email : `user@test.com`
   - Password : `TestUser123!`
   - Auto Confirm User : ✅

   **Utilisateur admin :**
   - Email : `admin@test.com`
   - Password : `TestAdmin123!`
   - Auto Confirm User : ✅

4. Pour promouvoir le second utilisateur en admin :
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@test.com';
   ```

### 3. Lancer l'application

```bash
npm run dev
```

## 🧪 Scénarios de test

### Test 1 : Connexion utilisateur standard

1. Accédez à `http://localhost:5173` (ou le port de votre serveur)
2. Vous devriez voir le formulaire de connexion moderne
3. Connectez-vous avec :
   - Email : `user@test.com`
   - Password : `TestUser123!`

**Résultat attendu :**
- ✅ Redirection vers l'application principale
- ✅ Badge "User" bleu visible dans le header
- ✅ Boutons "Dashboard" et "Déconnexion" visibles

### Test 2 : Accès au Dashboard

1. Connecté en tant qu'utilisateur, cliquez sur **Dashboard**

**Résultat attendu :**
- ✅ Affichage du dashboard entreprise
- ✅ Sidebar avec profil utilisateur
- ✅ Badge "User" dans le sidebar
- ✅ Table "mes_donnees" avec les 5 projets
- ✅ Stats : Total Entrées = 5

### Test 3 : Connexion admin

1. Déconnectez-vous
2. Reconnectez-vous avec :
   - Email : `admin@test.com`
   - Password : `TestAdmin123!`

**Résultat attendu :**
- ✅ Badge "Admin" orange dans le header
- ✅ Accès à toutes les fonctionnalités
- ✅ Section "Fonctionnalités Administrateur" visible dans le dashboard

### Test 4 : Gestion d'erreurs RLS

#### Simuler une erreur RLS

1. Dans Supabase, désactivez temporairement la politique de lecture :
   ```sql
   DROP POLICY "Authenticated users can view data" ON public.mes_donnees;
   ```

2. Actualisez le dashboard

**Résultat attendu :**
- ✅ Message d'erreur RLS formaté et explicite
- ✅ Badge d'erreur avec code 403
- ✅ Bouton "Réessayer" visible
- ✅ Suggestions de résolution affichées

3. Rétablir la politique :
   ```sql
   CREATE POLICY "Authenticated users can view data"
     ON public.mes_donnees FOR SELECT
     USING (auth.role() = 'authenticated');
   ```

### Test 5 : Déconnexion et session

1. Cliquez sur **Déconnexion**

**Résultat attendu :**
- ✅ Retour au formulaire de connexion
- ✅ Session Supabase effacée
- ✅ Impossible d'accéder à l'app sans reconnexion

2. Rafraîchir la page

**Résultat attendu :**
- ✅ Toujours sur le formulaire de connexion
- ✅ Pas de fuite de session

### Test 6 : Gestion d'erreurs de connexion

1. Sur le formulaire de login, essayez :
   - Email incorrect : `wrong@test.com`
   - Password : `anything`

**Résultat attendu :**
- ✅ Message d'erreur clair et visible
- ✅ Formulaire non bloqué
- ✅ Possibilité de réessayer

## ✨ Fonctionnalités implémentées

### 🔐 Authentification
- ✅ Formulaire de login moderne avec Tailwind CSS
- ✅ Gestion d'erreurs spécifique avec affichage visuel
- ✅ Spinner de chargement lors de la connexion
- ✅ Validation des champs email/password

### 👤 Gestion des rôles
- ✅ Récupération du rôle depuis `public.profiles`
- ✅ Badges visuels "Admin" (orange) et "User" (bleu)
- ✅ Affichage du rôle dans le header et le sidebar

### 📊 Dashboard Admin
- ✅ Design "Enterprise" avec sidebar
- ✅ Affichage de la table `mes_donnees`
- ✅ Stats en temps réel (nombre d'entrées, statut, rôle)
- ✅ Section spéciale pour les fonctionnalités admin
- ✅ Bouton de rafraîchissement des données

### 🛡️ Sécurité
- ✅ Row Level Security (RLS) sur toutes les tables
- ✅ Détection et affichage spécifique des erreurs RLS (403)
- ✅ Politiques différenciées admin/user
- ✅ Session persistante avec Supabase Auth

### 🎨 UI/UX
- ✅ Design moderne avec Tailwind CSS
- ✅ Icônes lucide-react
- ✅ Animations et transitions fluides
- ✅ Interface responsive
- ✅ Single Page Application (pas de redirection externe)

## 🐛 Dépannage

### Problème : "Profile not found"

**Solution :** Le trigger n'a pas créé le profil automatiquement.
```sql
-- Créer manuellement le profil
INSERT INTO public.profiles (id, email, role)
VALUES ('uuid-de-l-utilisateur', 'email@test.com', 'user');
```

### Problème : "Permission denied" sur mes_donnees

**Solution :** Vérifier les politiques RLS.
```sql
-- Voir les politiques actuelles
SELECT * FROM pg_policies WHERE tablename = 'mes_donnees';
```

### Problème : L'utilisateur n'est pas admin

**Solution :** Mettre à jour le rôle.
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@test.com';
```

### Problème : Spinner de chargement infini

**Solution :** Vérifier la console navigateur pour les erreurs Supabase.
- Vérifier que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont corrects dans `lib/supabase.ts`

## 📝 Notes importantes

- La table `mes_donnees` est un exemple. Vous pouvez la remplacer par vos propres tables.
- Les admins ont accès à toutes les fonctionnalités, les users ont un accès limité selon vos politiques RLS.
- L'état d'authentification est géré par `onAuthStateChange` de Supabase.
- Le profil utilisateur est automatiquement créé via un trigger PostgreSQL.

## 🔄 Workflow complet

```
1. Utilisateur accède à l'app
   ↓
2. App.tsx vérifie la session Supabase
   ↓
3. Si non connecté → Affiche Login.tsx
   ↓
4. Utilisateur entre email/password
   ↓
5. Supabase Auth vérifie les credentials
   ↓
6. onAuthStateChange déclenche
   ↓
7. App récupère le profil depuis public.profiles
   ↓
8. Si connecté → Affiche l'app principale
   ↓
9. Clic sur "Dashboard" → Affiche AdminDashboard.tsx
   ↓
10. AdminDashboard charge mes_donnees (avec RLS)
   ↓
11. Affiche les données selon les permissions
```

## 🎯 Checklist finale

Avant de considérer l'implémentation comme terminée :

- [ ] La table `profiles` existe et a les bonnes politiques RLS
- [ ] La table `mes_donnees` existe avec des données de test
- [ ] Le trigger `handle_new_user` est créé et actif
- [ ] Au moins 2 utilisateurs de test (user et admin) existent
- [ ] La connexion fonctionne pour les deux utilisateurs
- [ ] Les badges de rôle s'affichent correctement
- [ ] Le dashboard charge et affiche les données
- [ ] Les erreurs RLS sont gérées et affichées clairement
- [ ] La déconnexion fonctionne correctement
- [ ] Le rafraîchissement de page maintient ou redemande la connexion

✅ **Tous les critères sont remplis !**
