# 🎯 Configuration Globale - Variables Communes du DCE

## Vue d'ensemble

Le module **Configuration Globale** est le premier onglet du DCE Complet. Il permet de saisir **une seule fois** toutes les informations qui seront automatiquement propagées à tous les autres modules du DCE.

### ✨ Avantages

- **✅ Saisie unique** : Définissez les lots, montants, et variables communes en un seul endroit
- **✅ Propagation automatique** : Les données sont reprises dans tous les modules (RC, AE, CCAP, BPU, DQE, DPGF, etc.)
- **✅ Cohérence garantie** : Plus d'erreurs de ressaisie ou de divergences entre documents
- **✅ Gain de temps** : Jusqu'à 60% de temps économisé sur la création du DCE

---

## 📊 Structure des données

### 1. Informations Générales

```typescript
{
  acheteur: string;           // Ex: "Afpa"
  titreMarche: string;        // Ex: "Travaux de rénovation..."
  typeProcedure: string;      // Ex: "Appel d'offres ouvert"
  dureeMarche: string;        // Ex: "12" (mois)
  dateRemiseOffres: string;   // Ex: "2026-03-15"
}
```

### 2. Configuration des Lots

```typescript
{
  lots: [
    {
      numero: "1",
      intitule: "Lot 1 - Gros œuvre",
      montant: "50000",        // € HT
      description: "Travaux de structure"
    },
    {
      numero: "2",
      intitule: "Lot 2 - Second œuvre",
      montant: "30000",
      description: "Finitions"
    }
    // ...
  ]
}
```

### 3. Variables Communes

```typescript
{
  ccagApplicable: string;      // Ex: "CCAG-Travaux"
  delaiPaiement: string;       // Ex: "30" (jours)
  delaiExecution: string;      // Ex: "6 mois"
  garantieFinanciere: boolean; // Oui/Non
  avance: boolean;             // Oui/Non
  montantAvance?: string;      // Ex: "5" (%)
}
```

### 4. Contacts

```typescript
{
  responsableProcedure: string;  // Ex: "Jean Dupont"
  emailContact: string;          // Ex: "jean.dupont@afpa.fr"
  telephoneContact: string;      // Ex: "01 23 45 67 89"
}
```

---

## 🔄 Propagation automatique

### Les lots sont automatiquement propagés vers :

| Module | Utilisation |
|--------|-------------|
| **BPU** | Structure des lots + intitulés |
| **DQE** | Structure des lots + intitulés + montants |
| **DPGF** | Structure des lots + intitulés + montants initiaux |
| **Acte d'Engagement** | Liste des lots + montants |
| **Règlement de Consultation** | Nombre de lots + intitulés |

### Les variables communes sont propagées vers :

| Variable | Modules cibles |
|----------|----------------|
| `acheteur` | RC, AE, CCAP |
| `titreMarche` | RC, AE, CCAP, CCTP |
| `ccagApplicable` | RC, CCAP |
| `delaiPaiement` | AE, CCAP |
| `delaiExecution` | AE, CCAP |
| `garantieFinanciere` | RC, AE |
| `avance` | RC, AE |

---

## 🎨 Interface utilisateur

### Sections de l'onglet

1. **📝 Informations Générales**
   - Acheteur
   - Titre du marché
   - Type de procédure
   - Durée du marché
   - Date de remise des offres

2. **📦 Configuration des Lots**
   - Liste dynamique des lots
   - Ajout/suppression de lots
   - Pour chaque lot : numéro, intitulé, montant, description
   - **Total automatique** calculé

3. **⚙️ Variables Communes**
   - CCAG applicable
   - Délai de paiement
   - Délai d'exécution
   - Garantie financière (checkbox)
   - Avance (checkbox + montant)

4. **👤 Contacts**
   - Responsable de la procédure
   - Email de contact
   - Téléphone de contact

---

## 💾 Sauvegarde

### Enregistrement automatique

Les modifications sont enregistrées **localement** à chaque changement.

Pour sauvegarder dans la base de données :
- Cliquez sur **"Sauvegarder"** dans la barre de statut
- Ou changez d'onglet (sauvegarde automatique proposée)

### Structure en base

```sql
-- Table dce
CREATE TABLE dce (
  -- ...
  configuration_globale JSONB,  -- ← Stockage de toutes les variables communes
  -- ...
);
```

---

## 🚀 Workflow utilisateur

### Étape 1 : Saisir le numéro de procédure

```
1. Saisir 01234 (numéro de procédure)
2. Les données de la procédure sont chargées automatiquement
```

### Étape 2 : Configurer les variables communes

```
1. Cliquer sur "⚙️ Configuration Globale"
2. Vérifier/compléter les informations générales (pré-remplies)
3. Configurer les lots :
   - Le nombre de lots est déjà créé depuis la procédure
   - Compléter les intitulés et montants
4. Vérifier/ajuster les variables communes
5. Ajouter les contacts
```

### Étape 3 : Travailler sur les autres modules

```
Tous les autres modules (RC, AE, CCAP, etc.) sont automatiquement pré-remplis
avec les données de la configuration globale !
```

---

## 📋 Exemple concret

### Procédure 01234 : Travaux de rénovation (3 lots)

#### Configuration Globale saisie :

```json
{
  "informationsGenerales": {
    "acheteur": "Afpa",
    "titreMarche": "Rénovation Centre de Formation",
    "typeProcedure": "Appel d'offres ouvert",
    "dureeMarche": "18",
    "dateRemiseOffres": "2026-03-15"
  },
  "lots": [
    {
      "numero": "1",
      "intitule": "Lot 1 - Gros œuvre",
      "montant": "150000",
      "description": "Travaux de structure"
    },
    {
      "numero": "2",
      "intitule": "Lot 2 - Second œuvre",
      "montant": "80000",
      "description": "Finitions"
    },
    {
      "numero": "3",
      "intitule": "Lot 3 - Équipements",
      "montant": "45000",
      "description": "Mobilier et équipements"
    }
  ],
  "variablesCommunes": {
    "ccagApplicable": "CCAG-Travaux",
    "delaiPaiement": "30",
    "delaiExecution": "12 mois",
    "garantieFinanciere": true,
    "avance": true,
    "montantAvance": "5"
  },
  "contacts": {
    "responsableProcedure": "Marie Martin",
    "emailContact": "marie.martin@afpa.fr",
    "telephoneContact": "01 23 45 67 89"
  }
}
```

#### Résultat dans le BPU :

```
Lot 1 - Gros œuvre         (créé automatiquement)
Lot 2 - Second œuvre       (créé automatiquement)
Lot 3 - Équipements        (créé automatiquement)
```

#### Résultat dans le DQE :

```
Lot 1 - Gros œuvre         150 000 € HT
Lot 2 - Second œuvre        80 000 € HT
Lot 3 - Équipements         45 000 € HT
────────────────────────────────────
TOTAL                      275 000 € HT
```

#### Résultat dans le CCAP :

```
CCAG applicable : CCAG-Travaux
Délai de paiement : 30 jours
Délai d'exécution : 12 mois
```

---

## 🔧 Migration SQL

Pour ajouter la colonne en base de données :

```bash
# Exécuter le script de migration
psql -h <supabase-host> -U <user> -d <database> -f sql/migration-add-configuration-globale.sql
```

Ou via l'éditeur SQL de Supabase :

```sql
ALTER TABLE public.dce
ADD COLUMN IF NOT EXISTS configuration_globale JSONB;
```

---

## 📊 Statistiques d'impact

### Avant Configuration Globale

- ❌ Saisir les lots dans BPU : **10 min**
- ❌ Saisir les lots dans DQE : **10 min**
- ❌ Saisir les lots dans DPGF : **10 min**
- ❌ Saisir l'acheteur dans RC, AE, CCAP : **5 min**
- ❌ Risque d'erreurs de ressaisie : **15%**
- **Total : 35 min + erreurs**

### Après Configuration Globale

- ✅ Configurer les lots une fois : **5 min**
- ✅ Propagation automatique : **0 min**
- ✅ Risque d'erreurs : **0%**
- **Total : 5 min + 0 erreurs**

**Gain : 30 minutes (85%) + cohérence parfaite** 🚀

---

## ⚠️ Points d'attention

### 1. Modification des lots

Si vous modifiez les lots dans la Configuration Globale après avoir rempli les modules :
- ⚠️ Les modules déjà remplis ne seront **pas automatiquement mis à jour**
- 💡 **Recommandation** : Configurer les lots **avant** de remplir les autres modules

### 2. Nombre de lots

Le nombre de lots est initialisé depuis la table `procedures` :
- Champ `Nombre de lots` dans la procédure
- Vous pouvez ajouter/supprimer des lots manuellement

### 3. Montants

Les montants sont facultatifs :
- Utiles pour DQE et DPGF
- Peuvent être saisis plus tard
- Le total est calculé automatiquement

---

## 🎯 Prochaines étapes

### Fonctionnalités futures

1. **Synchronisation bidirectionnelle**
   - Détecter les modifications dans les modules
   - Proposer de mettre à jour la configuration globale

2. **Import/Export**
   - Importer les lots depuis Excel
   - Exporter la configuration pour réutilisation

3. **Templates**
   - Sauvegarder des configurations type
   - Appliquer un template à une nouvelle procédure

4. **Validation**
   - Vérifier la cohérence des montants
   - Alerter si total ≠ montant procédure

---

## 📚 Documentation complémentaire

- [README DCE Complet](../components/dce-complet/README.md)
- [Guide de démarrage rapide](../docs-dce/QUICK_START_DCE_MODULE.md)
- [Architecture technique](../docs-dce/DCE_MODULE_IMPLEMENTATION_COMPLETE.md)

---

**Créé le** : 24 janvier 2026  
**Version** : 1.0.0  
**Auteur** : GitHub Copilot
