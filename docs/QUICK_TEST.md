# Guide de Test Rapide - Application Refactorisée

## ✅ Modifications effectuées

### HomePage refactorisée
- ✅ Suppression de la dépendance à `LandingPage.tsx` (ancien système)
- ✅ Nouvelle page d'accueil avec :
  - Grille de 6 domaines cliquables (Projets, Procédures, Contrats, Retraits, Dépôts, Indicateurs)
  - Stats en temps réel depuis les stores Zustand
  - Navigation React Router sur chaque carte
  - Design moderne avec icônes lucide-react

### Architecture vérifiée
- ✅ App.tsx : Routing React Router avec MainLayout + Outlet
- ✅ Stores Zustand : useProjects, useDossiers, useContrats
- ✅ Hooks : Auto-chargement des données au montage
- ✅ Services : Appels Supabase dans la couche services/

## 🧪 Tests à effectuer

### 1. Page d'accueil
1. Accéder à `http://localhost:3000/`
2. Vérifier que vous voyez :
   - ✅ Header "Bienvenue sur GestProjet"
   - ✅ 6 cartes de domaines (Projets, Procédures, Contrats, etc.)
   - ✅ Badges de comptage sur Projets et Procédures
   - ✅ Section Stats en bas avec 3 indicateurs

### 2. Navigation
1. Cliquer sur la carte **"Projets"**
   - ✅ Devrait naviguer vers `/projets`
   - ✅ Devrait afficher la table des projets
   - ✅ Devrait charger les données depuis Supabase
   
2. Cliquer sur la carte **"Procédures"**
   - ✅ Devrait naviguer vers `/procedures`
   - ✅ Devrait afficher la table des dossiers
   
3. Utiliser la navigation principale (header)
   - ✅ Cliquer sur "Accueil" → retour à la page d'accueil
   - ✅ Cliquer sur "Projets" → page projets
   - ✅ Cliquer sur "Procédures" → page procédures
   - ✅ Cliquer sur "Contrats" → page contrats

### 3. Données
1. Ouvrir la console navigateur (F12)
2. Onglet **Network**
   - ✅ Vérifier les appels à Supabase
   - ✅ Rechercher `supabase.co/rest/v1/`
   - ✅ Vérifier que les données sont chargées (status 200)

3. Onglet **Console**
   - ❌ **Pas d'erreurs** TypeScript
   - ❌ **Pas d'erreurs** React
   - ❌ **Pas d'erreurs** Zustand

### 4. Fonctionnalités
1. Page Projets :
   - ✅ Recherche : taper un nom de projet
   - ✅ Export Excel : cliquer sur "Exporter"
   - ✅ Voir les détails d'un projet

2. Menu utilisateur (header) :
   - ✅ Voir le badge de rôle (Admin/User)
   - ✅ Cliquer sur "Dashboard" (si admin)
   - ✅ Cliquer sur "Déconnexion"

## 🐛 Si ça ne fonctionne pas

### Problème : Spinner infini ou page blanche
**Solution :** Vérifier la console navigateur
```javascript
// Dans la console, tester :
localStorage.getItem('supabase.auth.token')
```
Si null → Problème d'authentification

### Problème : "Permission denied" ou erreur RLS
**Solution :** Vérifier Supabase
```sql
-- Dans Supabase SQL Editor :
SELECT * FROM public.profiles WHERE email = 'votre.email@test.com';
-- Vérifier que le rôle est bien défini
```

### Problème : Aucune donnée affichée
**Solution :** Vérifier les tables
```sql
-- Dans Supabase SQL Editor :
SELECT COUNT(*) FROM public.mes_donnees;
-- Devrait retourner > 0
```

### Problème : Navigation ne fonctionne pas
**Solution :** Vérifier les erreurs React Router dans la console

## 📊 Structure testée

```
App.tsx (50 lignes)
  └── BrowserRouter
      └── Routes
          ├── /login → Login
          └── / (ProtectedRoute + MainLayout)
              ├── / → HomePage (NOUVEAU - 130 lignes)
              ├── /projets → ProjectsPage
              ├── /procedures → DossiersPage
              ├── /contrats → ContratsPage
              ├── /retraits → RetraitsPage
              ├── /depots → DepotsPage
              └── /admin → AdminPage
```

## ✨ Fonctionnalités implémentées

### HomePage (NOUVEAU)
- 🎨 Design moderne avec Tailwind CSS
- 🔢 Compteurs en temps réel (Projets, Procédures)
- 🚀 Navigation React Router sur chaque carte
- 📊 Section Stats avec 3 indicateurs
- 🌙 Support thème sombre
- 📱 Responsive (mobile, tablette, desktop)

### Hooks personnalisés
- useProjects(autoLoad=true) → Charge automatiquement les projets
- useDossiers(autoLoad=true) → Charge automatiquement les procédures
- useContrats(autoLoad=true) → Charge automatiquement les contrats
- useAuth() → Gestion de l'authentification

### Stores Zustand
- useProjectsStore : CRUD projects + search
- useDossiersStore : CRUD dossiers + search
- useContratsStore : CRUD contrats + search
- useAuthStore : Authentification + profil

## 🎯 Prochaines étapes (si tout fonctionne)

1. ✅ Tester l'import Excel/CSV dans DataImport
2. ✅ Tester les exports (Excel, DOCX) dans AN01
3. ✅ Vérifier les graphiques (TechnicalAnalysis, Gantt)
4. 🔄 Refactoriser Contrats.tsx (1341 lignes)
5. 🔄 Refactoriser AdminDashboard.tsx (866 lignes)
6. 🔄 Unifier le système de styles

## 📝 Notes

- **LandingPage.tsx** : N'est plus utilisé (remplacé par HomePage)
- **App.old.tsx** : Backup de l'ancien App.tsx (4199 lignes)
- **Ancien système** : Navigation par `view` state → REMPLACÉ par React Router
- **Nouveau système** : Routes URL + Zustand stores + Services layer

---

**Date :** ${new Date().toLocaleDateString('fr-FR')}
**Version :** 1.0.2
**Commit :** Refactoring complet (App.tsx 4199L → 50L)
