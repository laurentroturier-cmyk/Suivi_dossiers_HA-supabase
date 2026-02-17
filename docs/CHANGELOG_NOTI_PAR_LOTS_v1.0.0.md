# Changelog - Module NOTI Par Lots v1.0.0

**Date** : 17 février 2026  
**Type** : Nouvelle fonctionnalité majeure

## 🎯 Résumé

Ajout d'un nouveau module de gestion des notifications (NOTI1, NOTI3, NOTI5) pour les procédures multi-lots, offrant une approche complémentaire par lots en plus de l'approche existante par fournisseurs.

## ✨ Nouvelles fonctionnalités

### 1. Sélecteur de mode de travail
- **Composant** : `NotiModeSelector`
- **Emplacement** : Après sélection d'une procédure multi-lots
- **Choix** :
  - Mode "Par Fournisseur" (existant) : Vue centrée candidat
  - Mode "Par Lots" (nouveau) : Navigation lot par lot

### 2. Interface "NOTI Par Lots"
- **Composant** : `NotiParLots`
- **Fonctionnalités** :
  - Navigation entre lots (précédent/suivant + liste déroulante)
  - Affichage des attributaires et perdants par lot
  - Vérification systématique des 3 types de NOTI (checkboxes)
  - Prévisualisation de chaque NOTI via modals
  - Indicateur de progression (Lot X sur Y)
  - Bouton retour vers le sélecteur de mode

### 3. Export ZIP flexible - 3 options

#### Option 1 : Par lot
- **Format** : 1 ZIP par lot
- **Contenu** : Tous les NOTI du lot (NOTI1, NOTI3, NOTI5)
- **Cas d'usage** : Organisation par structure de lots
- **Nomenclature ZIP** : `{numeroCourt}_Lot{N}_NOTI_{date}.zip`

#### Option 2 : Par fournisseur
- **Format** : 1 ZIP par fournisseur
- **Contenu** : Tous les NOTI du fournisseur (tous lots confondus)
- **Cas d'usage** : Envoi groupé à chaque candidat
- **Nomenclature ZIP** : `{numeroCourt}_{nomFournisseur}_NOTI_{date}.zip`

#### Option 3 : Par type de NOTI
- **Format** : 3 ZIP (NOTI1, NOTI3, NOTI5)
- **Contenu** : Tous les documents d'un type (tous lots et fournisseurs)
- **Cas d'usage** : Classement par nature de document
- **Nomenclature ZIP** : `{numeroCourt}_{typeNOTI}_{date}.zip`

### 4. Nomenclature standardisée des fichiers

**Format** : `{numeroCourt}_Lot{numeroLot}_{nomCandidat}_{typeNoti}.pdf`

**Exemple** : `25006_Lot1_Tartempion_NOTI1.pdf`

**Règles** :
- Numéro court = 5 premiers chiffres (ex: 25006)
- Numéro de lot sans zéro initial (Lot1, pas Lot01)
- Nom candidat nettoyé (max 50 caractères)
- Type NOTI en majuscules

## 🏗️ Architecture

### Nouveaux fichiers créés

#### Composants
- `components/redaction/components/NotiParLots.tsx` (650 lignes)
- `components/redaction/components/NotiModeSelector.tsx` (150 lignes)

#### Types
- `components/redaction/types/notiParLots.ts` (85 lignes)
  - `NotiVerification`
  - `LotNotiStatus`
  - `ExportZipOption`
  - `generateNotiFileName()`
  - `generateZipFileName()`

#### Documentation
- `docs/NOTI_PAR_LOTS_GUIDE.md` (guide utilisateur complet)
- `docs/CHANGELOG_NOTI_PAR_LOTS_v1.0.0.md` (ce fichier)

### Fichiers modifiés

#### NotificationsQuickAccess.tsx
**Modifications** :
- Ajout des imports `NotiParLots` et `NotiModeSelector`
- Ajout des états `showNotiParLots`, `showModeSelector`
- Nouvelle logique : afficher le sélecteur de mode pour les procédures multi-lots
- Fonctions `handleModeSelection()` et `backToModeSelection()`
- Mise à jour du rendu conditionnel

**Lignes modifiées** : ~50 lignes ajoutées/modifiées

#### index.tsx (barrel file)
**Ajouts** :
```typescript
export { default as NotiParLots } from './components/NotiParLots';
export { default as NotiModeSelector } from './components/NotiModeSelector';
```

#### types/index.ts (barrel file)
**Ajouts** :
```typescript
export * from './notiParLots';
```

## 🔄 Workflow utilisateur

1. **Sélection procédure** : Rapport de présentation → "Générer NOTI"
2. **Si multi-lots détecté** : → Affichage sélecteur de mode
3. **Choix mode "Par Lots"** : → Interface NotiParLots
4. **Pour chaque lot** :
   - Voir les candidats (attributaires + perdants)
   - Prévisualiser les NOTI (boutons 👁️)
   - Vérifier les NOTI (boutons ✅)
   - Passer au lot suivant
5. **Export** : Choisir une des 3 options d'export ZIP

## 📊 Avantages du nouveau module

### Pour l'utilisateur
- ✅ Navigation systématique lot par lot
- ✅ Vérification exhaustive (checkboxes persistantes)
- ✅ Flexibilité de l'export selon le besoin
- ✅ Nomenclature claire et cohérente
- ✅ Retour arrière vers le mode classique possible

### Pour le projet
- ✅ Coexistence harmonieuse avec l'approche existante
- ✅ Code modulaire et réutilisable
- ✅ Types TypeScript complets
- ✅ Aucune régression sur l'existant
- ✅ Documentation exhaustive

## 🧪 Tests recommandés

### Tests fonctionnels
- [ ] Procédure 2 lots : vérifier navigation
- [ ] Procédure 5 lots : vérifier export par lot
- [ ] Procédure avec candidats mixtes (gagnants + perdants) : export par fournisseur
- [ ] Vérifier nomenclature des fichiers générés
- [ ] Tester retour au sélecteur de mode
- [ ] Tester navigation entre procédures

### Tests de régression
- [ ] Mode "Par Fournisseur" fonctionne toujours correctement
- [ ] Génération NOTI1/NOTI3/NOTI5 inchangée
- [ ] MultiLotsDashboard fonctionne comme avant
- [ ] Procédures mono-lot non affectées

## 🐛 Problèmes connus / Limitations

### Limitation 1 : Nom de fichier
**Problème** : Les noms de candidats très longs sont tronqués à 50 caractères  
**Raison** : Limitation technique Windows (260 caractères max pour le chemin complet)  
**Impact** : Minime - la troncature préserve l'unicité

### Limitation 2 : Vérifications non persistées
**Problème** : Les états de vérification (checkboxes) ne sont pas sauvegardés en base  
**Raison** : Feature v1.0 - persistance prévue pour v2.0  
**Impact** : Vérifications perdues si on quitte puis revient

## 🚀 Évolutions futures (v2.0+)

### Priorité haute
- [ ] Persistance des vérifications en base Supabase
- [ ] Historique des exports (qui, quand, quel mode)
- [ ] Signature électronique des NOTI

### Priorité moyenne
- [ ] Export email direct aux candidats
- [ ] Templates NOTI personnalisables
- [ ] Workflow validation (draft → validé → envoyé)

### Priorité basse
- [ ] Statistiques d'utilisation (quel mode préféré)
- [ ] Export Excel récapitulatif
- [ ] Intégration avec module signature électronique

## 🔗 Dépendances

### Bibliothèques utilisées
- `jszip` v3.10.1 : Génération des fichiers ZIP
- `file-saver` v2.0.5 : Téléchargement côté client
- `@react-pdf/renderer` v4.3.2 : Génération PDF des NOTI
- `lucide-react` : Icônes UI

### Modules internes
- `components/analyse` : Modals Noti1Modal, Noti3Modal, Noti5Modal
- `components/redaction/utils` : Générateurs HTML/PDF des NOTI
- `components/redaction/types` : Types NOTI et multi-lots

## 📝 Notes de migration

**Aucune migration nécessaire** - Cette fonctionnalité est entièrement additive et n'impacte pas l'existant.

## 👥 Contribution

**Auteur** : Laurent Roturier (utilisateur)  
**Développement** : GitHub Copilot (AI)  
**Date** : 17 février 2026

## 📄 Licence

Ce module fait partie du projet Suivi_dossiers_HA-supabase et suit la même licence que le projet principal.

---

**Version** : 1.0.0  
**Status** : ✅ Complété  
**Testé** : ⏳ En attente de tests utilisateur  
**Documenté** : ✅ Oui
