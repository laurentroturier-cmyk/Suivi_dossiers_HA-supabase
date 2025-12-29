<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1boICdDTBnjDXohsc-usjZWElc8Hb_2kI

## 🔐 Nouvelle fonctionnalité : Authentification Supabase

Cette application intègre désormais un système complet d'authentification avec Supabase :

### ✨ Fonctionnalités implémentées

- **Authentification sécurisée** avec email/password
- **Gestion des rôles** (Admin / User) via `public.profiles`
- **Dashboard Enterprise** avec table de données
- **Row Level Security (RLS)** pour la sécurité des données
- **UI moderne** avec Tailwind CSS et lucide-react
- **Gestion d'erreurs RLS** avec affichage visuel des erreurs 403
- **Single Page Application** sans redirection externe

### 📚 Documentation

- **[AUTH_SETUP.md](./AUTH_SETUP.md)** - Configuration complète de Supabase (tables, RLS, triggers)
- **[TEST_GUIDE.md](./TEST_GUIDE.md)** - Guide de test étape par étape

### 🚀 Démarrage rapide

1. Configurez Supabase (voir [AUTH_SETUP.md](./AUTH_SETUP.md))
2. Installez les dépendances : `npm install`
3. Lancez l'app : `npm run dev`
4. Connectez-vous avec vos identifiants Supabase

### 🎯 Composants créés

```
components/
  auth/
    Login.tsx           # Formulaire de connexion moderne
    AdminDashboard.tsx  # Dashboard entreprise
types/
  auth.ts              # Types TypeScript
```

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
