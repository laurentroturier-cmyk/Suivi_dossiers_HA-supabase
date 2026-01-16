# Liaison Procédure - Règlement de Consultation

## ✅ Fonctionnalité ajoutée - v1.0.6

Le module Règlement de Consultation permet désormais de **lier chaque RC à une procédure** et de **charger automatiquement les données depuis Supabase**.

### 🆕 Nouveautés

1. **Liaison automatique** : Saisie du numéro de procédure → Chargement auto des données
2. **Mapping intelligent** : 20+ champs mappés automatiquement
3. **Feedback visuel** : Messages de succès/erreur en temps réel
4. **Bouton refresh** : Recharger les données à tout moment

## 🎯 Fonctionnement

### Chargement automatique

1. **Saisir le numéro de procédure** (5 chiffres)
2. **Dès le 5ème chiffre** : Interrogation automatique de Supabase
3. **Récupération des données** de la table `procédures`
4. **Pré-remplissage automatique** de tous les champs mappés
5. **Message de confirmation** : ✅ ou ❌ selon le résultat

### Recherche dans Supabase

Le système recherche dans la table `procédures` où :
- Le champ `"Numéro de procédure (Afpa)"` commence par les 5 chiffres saisis
- Exemple : Saisie `12345` → Trouve `12345_01_FO-FORM_001`

## 📊 Champs mappés automatiquement

### ✅ Mapping complet (20+ champs)

| Champ Supabase (procédures) | Champ RC | Section |
|------------------------------|----------|---------|
| **Numéro de procédure (Afpa)** | N° de marché | En-tête |
| **Nom de la procédure** | Titre du marché | En-tête |
| **Date de remise des offres** | Date limite offres | En-tête |
| **Forme du marché** | Type de marché (titre) | En-tête |
| **Acheteur** | Nom pouvoir adjudicateur | Pouvoir adj. |
| **Objet court** | Description objet | Objet |
| **Code CPV Principal** | CPV principal | Objet |
| **Type de procédure** | Mode de passation | Conditions |
| **Nombre de lots** | Nombre de lots | Conditions |
| **Durée du marché (en mois)** | Durée initiale | Type de marché |
| **Durée de validité des offres (en jours)** | Délai validité offres | Remise |

### 🔧 Transformations intelligentes

#### 1. Type de procédure → Mode de passation
```
"Appel d'offres ouvert" → "Appel d'offres ouvert"
"Appel d'offres restreint" → "Appel d'offres restreint"
"Procédure adaptée" → "Procédure adaptée"
"Marché négocié" → "Marché négocié"
```

#### 2. Forme du marché → Type de document
```
Contient "travaux" → "MARCHE PUBLIC DE TRAVAUX"
Contient "prestations intellectuelles" → "MARCHE PUBLIC DE PRESTATIONS INTELLECTUELLES"
Autres → "MARCHE PUBLIC DE FOURNITURES ET SERVICES"
```

#### 3. Forme du marché → Forme juridique
```
"Accord-cadre multi" → "Accord-cadre multi-attributaires"
"Accord-cadre" → "Accord-cadre mono-attributaire"
"Bons de commande" → "Marché à bons de commande"
Autres → "Marché ordinaire"
```

#### 4. Dates calculées automatiquement
```
Date limite offres (J) → Date saisie
Date limite questions → J-10 (calculé)
Date limite réponses → J-7 (calculé)
```

#### 5. Description enrichie
```
Si "Objet court" ≠ "Nom de la procédure" :
  → Concaténation : "{Objet court}\n\n{Nom de la procédure}"
Sinon :
  → Utilise "Nom de la procédure" ou "Objet court"
```

## 🎨 Interface utilisateur

Dans la section **"En-tête"**, un nouveau champ apparaît en première position :

```
┌─────────────────────────────────────┐
│ N° de procédure (5 chiffres)       │
│ [12345]                             │
│ ⚠️ Le numéro de procédure doit     │
│    comporter 5 chiffres             │
└─────────────────────────────────────┘
```

### Caractéristiques

- **Format** : Numéro à exactement 5 chiffres
- **Validation** : 
  - Accepte uniquement les chiffres (0-9)
  - Limite automatique à 5 caractères
  - Alerte visuelle si moins de 5 chiffres
- **Style** : Police monospace, taille agrandie pour meilleure lisibilité
- **Optionnel** : Le champ peut rester vide

## 📄 Intégration dans le document Word

### Position dans le document

Le numéro de procédure apparaît dans l'**en-tête du document Word**, juste après le titre :

```
MARCHE PUBLIC DE FOURNITURES ET SERVICES

REGLEMENT DE CONSULTATION

Procédure n° 12345  ← Apparaît ici si renseigné

[Titre du marché]
[N° de marché]
```

### Format

- **Texte** : "Procédure n° "
- **Numéro** : En gras, taille 24
- **Alignement** : Centré
- **Espacement** : 400 points après

Si le numéro de procédure n'est pas renseigné, cette ligne n'apparaît pas dans le document.

## 👁️ Prévisualisation

Le numéro de procédure apparaît également dans la **prévisualisation** :

```
RÈGLEMENT DE CONSULTATION

Procédure n° 12345  ← En bleu/cyan

[Titre du marché]
```

## 💾 Sauvegarde

Le numéro de procédure est **automatiquement sauvegardé** avec les autres données :

- Dans **localStorage** lors de la sauvegarde
- Rechargé avec **Charger**
- Inclus dans le document Word généré

## 🔧 Utilisation

### 1. Renseigner le numéro

1. Accédez à **Rédaction** → **Règlement de consultation**
2. Dans la section **En-tête** (première section)
3. Saisissez le numéro de procédure à 5 chiffres
4. Exemple : `12345`

### 2. Validation automatique

- ✅ Si 5 chiffres : Aucun message
- ⚠️ Si moins de 5 chiffres : Message d'alerte orange
- 🚫 Caractères non numériques : Automatiquement supprimés
- 🚫 Plus de 5 chiffres : Limité à 5 automatiquement

### 3. Visualisation

- Cliquez sur **Prévisualiser** pour voir le numéro dans l'aperçu
- Le numéro apparaît en bleu, bien visible

### 4. Génération Word

- Cliquez sur **Télécharger Word**
- Le numéro de procédure apparaît dans l'en-tête du document
- Si vide, la ligne n'apparaît pas (document reste propre)

## 📋 Exemples d'utilisation

### Cas 1 : Procédure avec numéro

```
Champs remplis :
- N° de procédure : 45678
- Titre : Marché de prestations de formation
- N° de marché : AA2025_01_FO-FORM_001

Résultat Word :
┌────────────────────────────────────────┐
│   MARCHE PUBLIC DE FOURNITURES ET      │
│              SERVICES                   │
│                                         │
│     REGLEMENT DE CONSULTATION          │
│                                         │
│         Procédure n° 45678             │ ← Visible
│                                         │
│   Marché de prestations de formation   │
│      AA2025_01_FO-FORM_001             │
└────────────────────────────────────────┘
```

### Cas 2 : Sans numéro de procédure

```
Champs remplis :
- N° de procédure : (vide)
- Titre : Marché de matériel informatique
- N° de marché : AA2025_02_IT-MAT_002

Résultat Word :
┌────────────────────────────────────────┐
│   MARCHE PUBLIC DE FOURNITURES ET      │
│              SERVICES                   │
│                                         │
│     REGLEMENT DE CONSULTATION          │
│                                         │
│                                         │ ← Pas de ligne procédure
│   Marché de matériel informatique      │
│      AA2025_02_IT-MAT_002              │
└────────────────────────────────────────┘
```

## 🔗 Lien avec les procédures

Ce numéro à 5 chiffres permet de **tracer** :

1. **Identification unique** : Chaque RC est lié à une procédure spécifique
2. **Classement** : Facilite l'organisation des documents
3. **Recherche** : Retrouver rapidement un RC par son numéro de procédure
4. **Archivage** : Nom du fichier Word inclut le numéro pour tri facile

### Utilisation future possible

- Import de RC par numéro de procédure
- Export de tous les RC d'une procédure
- Tableau de bord filtré par procédure
- Historique des modifications par procédure

## 🎯 Bonnes pratiques

### Numérotation recommandée

- **Séquentielle** : 00001, 00002, 00003...
- **Par année** : 25001, 25002 (année 2025)
- **Par type** : 10XXX (travaux), 20XXX (fournitures), 30XXX (services)
- **Par région** : 93001 (Seine-Saint-Denis), 75001 (Paris)

### Exemples

```
25001 → 1ère procédure de 2025
93045 → 45ème procédure en Seine-Saint-Denis
10123 → 123ème procédure de travaux
```

## 📊 Structure des données

### TypeScript

```typescript
interface RapportCommissionData {
  enTete: {
    numeroProcedure: string; // Numéro à 5 chiffres
    titreMarche: string;
    numeroMarche: string;
    // ... autres champs
  };
  // ... autres sections
}
```

### localStorage

```json
{
  "enTete": {
    "numeroProcedure": "12345",
    "titreMarche": "...",
    "numeroMarche": "..."
  }
}
```

## ✨ Fichiers modifiés

- ✅ `types/rapportCommission.ts` - Interface mise à jour
- ✅ `ReglementConsultation.tsx` - Champ ajouté dans EnTeteSection
- ✅ `reglementConsultationGenerator.ts` - Numéro dans en-tête Word
- ✅ `ReglementConsultation.tsx` - Prévisualisation mise à jour

## 🚀 Version

**Version 1.0.5** - Fonctionnalité de liaison procédure ajoutée

---

Le module est maintenant prêt à être utilisé avec la liaison aux procédures !
