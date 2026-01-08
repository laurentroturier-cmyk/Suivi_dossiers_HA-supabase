# Copilot Instructions for Suivi_dossiers_HA-supabase

## Vue d'ensemble

Ce projet est une application React/Vite pour le suivi des dossiers d'achats publics, intégrant Supabase pour l'authentification, la gestion des rôles et le stockage des données. L'UI utilise Tailwind CSS et lucide-react. L'architecture est modulaire, chaque domaine fonctionnel ayant son propre composant ou dossier.

## Architecture & Points clés
- **Authentification & Rôles** :
  - Basée sur Supabase (`public.profiles`), avec RLS activé. Voir AUTH_SETUP.md et TEST_GUIDE.md pour la structure SQL et les politiques.
  - Les rôles "admin" et "user" sont gérés côté base et affichés dans l'UI.
- **Données** :
  - Les tables principales sont `profiles` et `mes_donnees` (voir supabase-setup.sql).
  - Les imports/export Excel/CSV sont gérés via XLSX côté client (voir an01-utils/services/excelParser.ts et usages dans les composants).
- **Composants majeurs** :
  - `components/` : chaque vue principale (Contrats, RegistreDepots, RegistreRetraits, an01/*, auth/*, etc.)
  - `an01/` : analyse technique, tableaux, graphiques, export DOCX/XLSX
  - `auth/` : login, dashboard admin, gestion des accès
- **Parsers PDF/CSV** :
  - Les fichiers PDF/CSV sont parsés côté client (voir utils/depotsParser.ts, utils/retraitsParser.ts, utils/csvParser.ts).
- **Constantes & Types** :
  - Les champs métiers, listes déroulantes et types sont centralisés dans constants.tsx et types/

## Workflows développeur
- **Démarrage local** :
  1. Configurer Supabase (voir AUTH_SETUP.md)
  2. `npm install`
  3. `npm run dev`
- **Tests** :
  - Suivre TEST_GUIDE.md pour les scénarios d'authentification et de gestion des rôles.
- **Dépannage** :
  - Problèmes courants et solutions SQL dans TEST_GUIDE.md (ex : création manuelle de profil, update de rôle, vérification RLS).

## Conventions spécifiques
- **UI** :
  - Utilisation intensive de Tailwind CSS pour la mise en forme.
  - Les icônes proviennent de lucide-react.
- **Gestion des erreurs** :
  - Les erreurs RLS (403) sont capturées et affichées à l'utilisateur.
- **Export/Import** :
  - Les exports Excel/DOCX sont générés côté client (voir usages de XLSX et docx dans an01/ et auth/AdminDashboard.tsx).
- **Navigation** :
  - SPA avec gestion d'état par React (pas de routing externe).

## Points d'intégration
- **Supabase** : configuration dans lib/supabase.ts
- **Types** : centralisés dans types/
- **Scripts SQL** : voir supabase-setup.sql et fix-admin-policies.sql

## Exemples de fichiers clés
- `components/auth/AdminDashboard.tsx` : gestion des rôles, export structure
- `components/an01/Dashboard.tsx` : analyse technique, exports avancés
- `utils/depotsParser.ts`, `utils/retraitsParser.ts` : parsing PDF
- `constants.tsx` : champs métiers, listes déroulantes

## Documentation complémentaire
- [README.md](../README.md)
- [AUTH_SETUP.md](../AUTH_SETUP.md)
- [TEST_GUIDE.md](../TEST_GUIDE.md)

> **Astuce :** Pour toute logique métier, cherchez d'abord dans `components/`, puis dans `utils/` et `an01-utils/`.
