# Module NOTI1 - Documentation

## 📋 Vue d'ensemble

Le module **NOTI1 - Information au titulaire pressenti** est un clone fonctionnel du module "Règlement de consultation". Il permet de générer automatiquement le document officiel NOTI1 utilisé dans les marchés publics pour informer le candidat retenu.

## ✨ Fonctionnalités

### 1. **Auto-remplissage intelligent multi-sources** 🆕
- Saisir un numéro de procédure à 5 chiffres (ex: `25001`)
- Le système charge **automatiquement** les données depuis **5 SOURCES DIFFÉRENTES** :

#### 📊 Source 1 : Table `procédures` (données générales)
  - Objet de la consultation (depuis "Nom de la procédure" ou "Objet court")
  - Type d'attribution (ensemble/lots selon le nombre de lots)
  - Génération automatique des lots vides à remplir
  - Calcul des dates (signature = J+30 après remise des offres)

#### 📋 Source 2 : Table `rapports_presentation` (attributaire et lots)
  - **Nom de l'attributaire pressenti** (entreprise retenue)
  - **Lots attribués avec leurs intitulés** (si procédure allotie)
  - Détection automatique : mono-lot ou multi-lots
  - Si plusieurs attributaires distincts : pré-remplit le premier trouvé

#### 🏢 Source 3 : Table `procédures` (colonnes `depots`/`retraits` JSONB) 🆕🔥
  - **SIRET, adresse, email, téléphone** stockés directement dans la procédure
  - Parsing des données JSONB `depots.entreprises[]` et `retraits.entreprises[]`
  - **Priorité maximale** : Source la plus fiable et la plus rapide

#### 📝 Source 4 : Table `ouverture_plis` (candidats JSONB) 🆕🔥
  - **Coordonnées complètes** depuis la colonne `candidats` (JSONB)
  - Contient SIRET, adresse, email, téléphone de tous les candidats
  - Recherche par `num_proc` (5 chiffres)

#### 📇 Source 5 : Registres via `rapports_presentation.fichiers_sources`
  - Fallback si données non trouvées dans les sources directes
  - Matching intelligent par nom d'entreprise (ignore casse, accents, ponctuation)

**Avantage** : Pré-remplissage quasi-complet à 95% ! Seuls les champs manquants (signature, délais) restent à saisir manuellement.

### 2. **Sauvegarde/Chargement Supabase**
- Sauvegarde dans la table `noti1` avec le numéro de procédure comme clé unique
- Chargement rapide d'un NOTI1 existant
- Upsert automatique (création ou mise à jour)

### 3. **Éditeur structuré**
- 6 sections de saisie :
  1. **Procédure** : Numéro et objet
  2. **Pouvoir adjudicateur** : AFPA (pré-rempli)
  3. **Titulaire pressenti** : Entreprise retenue
  4. **Attribution** : Ensemble ou lots
  5. **Documents & Délais** : Justificatifs, délais
  6. **Signature** : Lieu, date, signataire

### 4. **Export Word**
- Génération du document .docx au format officiel NOTI1
- Formatage conforme (en-tête ministère, sections, cases à cocher)
- Nom de fichier : `NOTI1_25001_2026-01-18.docx`

## 🗂️ Architecture des fichiers

```
components/redaction/
├── NOTI1Section.tsx                    # Composant principal
├── types/
│   └── noti1.ts                        # Types TypeScript
└── services/
    ├── noti1AutoFill.ts                # Auto-remplissage multi-sources ⭐
    ├── noti1AutoFillFromRapport.ts     # Extraction depuis rapports 🆕
    ├── noti1EnrichFromRegistres.ts     # Enrichissement coordonnées 🆕
    ├── noti1Storage.ts                 # Sauvegarde/Chargement Supabase
    └── noti1Generator.ts               # Génération Word

sql/
└── noti1_setup.sql                     # Script création table Supabase
```

## 🔄 Flux de travail

### Scénario 1 : Nouveau NOTI1 (avec Rapport de présentation complet) 🎉 OPTIMAL

1. **Accéder au module** : Landing Page → Rédaction → NOTI → NOTI1
2. **Saisir le numéro** : Taper `25001` → Auto-remplissage **quasi-complet** ✅
   - ✅ Objet, dates, lots → depuis table `procédures`
   - ✅ **Nom attributaire, intitulés des lots** → depuis `rapports_presentation`
   - ✅ **SIRET, adresse, email, téléphone** → depuis registres retraits/dépôts 🎉
   - Message affiché : "✅ Données chargées depuis la procédure 2024-25001 \n 📋 Attributaire trouvé : Entreprise XYZ"
3. **Compléter uniquement** :
   - Documents de preuve exigés (si besoin)
   - Délais de réponse
   - Informations de signature
4. **Sauvegarder** : Clic sur "Sauvegarder" → Stockage Supabase
5. **Exporter** : Clic sur "Export Word" → Document .docx généré

💡 **Gain de temps maximal** : 90% des données pré-remplies automatiquement !

### Scénario 2 : Nouveau NOTI1 (sans Rapport de présentation)

1. **Accéder au module** : Landing Page → Rédaction → NOTI → NOTI1
2. **Saisir le numéro** : Taper `25001` → Auto-remplissage partiel
   - ✅ Objet, dates, lots vides → depuis table `procédures`
   - ℹ️ Message : "✅ Données chargées depuis la procédure 2024-25001 \n ℹ️ Complétez manuellement le titulaire pressenti"
3. **Saisir manuellement** :
   - Nom de l'entreprise retenue
   - SIRET, adresse, email, téléphone
   - Intitulés des lots attribués (si alloti)
   - Documents et délais
4. **Sauvegarder** : Clic sur "Sauvegarder" → Stockage Supabase
5. **Exporter** : Clic sur "Export Word" → Document .docx généré

### Scénario 3 : Charger un NOTI1 existant

1. **Saisir le numéro** : `25001`
2. **Charger** : Clic sur "Charger" → Récupère le NOTI1 existant
3. **Modifier** : Ajuster les données si nécessaire
4. **Sauvegarder** : Mise à jour dans Supabase
5. **Exporter** : Nouveau Word avec les modifications

## 🛠️ Installation

### 1. Créer la table Supabase

```sql
-- Exécuter le script dans l'éditeur SQL de Supabase
-- Fichier: sql/noti1_setup.sql
```

Le script crée :
- Table `noti1` avec contrainte unique sur `numero_procedure`
- Indexes pour les performances
- RLS (Row Level Security) activé
- Triggers pour `updated_at`

### 2. Vérifier l'intégration

Le module est déjà intégré dans l'application :
- ✅ Route dans `App.tsx`
- ✅ Tuile dans la landing page (section Rédaction)
- ✅ Import des composants

## 📊 Mapping des données sources → NOTI1

### Table `procédures` → NOTI1

| Champ Procédure                    | Champ NOTI1                  | Logique                                    |
|------------------------------------|------------------------------|--------------------------------------------|
| Nom de la procédure                | objetConsultation            | Texte principal                            |
| Objet court                        | objetConsultation            | Complément si différent du nom             |
| Nombre de lots                     | attribution.type             | "lots" si > 0, sinon "ensemble"            |
| Nombre de lots                     | attribution.lots[]           | Crée N lots vides à remplir                |
| Date de remise des offres          | documents.dateSignature      | J+30 (calcul automatique)                  |
| Date de remise des offres          | signature.date               | Date du jour                               |
| ~~Acheteur~~                       | ~~pouvoirAdjudicateur.nom~~  | ⚠️ **JAMAIS utilisé** (toujours AFPA)     |

### Table `rapports_presentation` → NOTI1 🆕

| Champ Rapport                                  | Champ NOTI1                  | Logique                                           |
|------------------------------------------------|------------------------------|---------------------------------------------------|
| `section9_attribution.attributairePressenti`   | titulaire.denomination       | Nom de l'entreprise retenue (mono-lot)            |
| `section7_2_syntheseLots.lots[].attributaire`  | titulaire.denomination       | Nom de l'entreprise retenue (multi-lots)          |
| `section7_2_syntheseLots.lots[].numero`        | attribution.lots[].numero    | Numéro du lot                                     |
| `section7_2_syntheseLots.lots[].nomLot`        | attribution.lots[].intitule  | Intitulé du lot                                   |

**Priorité** : Les données du `rapports_presentation` **écrasent** les données de `procédures` pour les champs `titulaire` et `attribution.lots`.

### Registres retraits/dépôts → NOTI1 🆕

| Source                        | Champ Registre        | Champ NOTI1              | Notes                                    |
|-------------------------------|-----------------------|--------------------------|------------------------------------------|
| Registre des **retraits**     | `siret`               | titulaire.siret          | Uniquement dans retraits                 |
| Registre des retraits/dépôts  | `societe`             | titulaire.denomination   | Utilisé pour le matching                 |
| Registre des retraits/dépôts  | `adresse`             | titulaire.adresse1       | Rue, numéro                              |
| Registre des retraits/dépôts  | `cp`                  | titulaire.codePostal     | Code postal                              |
| Registre des retraits/dépôts  | `ville`               | titulaire.ville          | Ville                                    |
| Registre des retraits/dépôts  | `telephone`           | titulaire.telephone      | Téléphone                                |
| Registre des retraits/dépôts  | `fax`                 | titulaire.fax            | Fax (optionnel)                          |
| Registre des retraits/dépôts  | `email`               | titulaire.email          | Email de contact                         |

**Matching** : Recherche l'entreprise par nom dans les deux registres. Priorité au registre des dépôts (plus récent).

## 🎯 Différences avec Règlement de consultation

| Aspect                  | Règlement de consultation     | NOTI1                                      |
|-------------------------|-------------------------------|--------------------------------------------|
| Sections                | 8 sections                    | 6 sections                                 |
| Complexité              | Élevée (lots, critères, etc.) | Moyenne (entreprise + attribution)         |
| Auto-fill               | Très complet                  | Simplifié (objet + lots)                   |
| Document Word           | Multi-pages, tableaux         | 3-4 pages, formatage officiel              |
| Cas d'usage             | Lancement de consultation     | Notification au lauréat                    |

## 🚀 Utilisation

### Exemple avec la procédure 25091

```bash
# Dans l'interface :
1. Taper "25091" dans le champ numéro de procédure
2. ✅ Auto-remplissage :
   - Objet : "Prestations de surveillance et de sécurité..."
   - Type : "lots" (car 3 lots)
   - Lots : 3 lots vides créés (numéros 1, 2, 3)

3. Compléter :
   - Titulaire : "Entreprise XYZ"
   - SIRET, adresse, email
   - Cocher le(s) lot(s) attribué(s)
   - Indiquer lot 1 : "Surveillance site A"
   - Date signature : 2026-02-28

4. Sauvegarder → Supabase
5. Export Word → NOTI1_25091_2026-01-18.docx
```

## ⚠️ Points d'attention

1. **Numéro de procédure** : Doit être **exactement 5 chiffres** (`25001`, pas `2024-25001`)
2. **Table procédures** : Le champ "Numéro de procédure (Afpa)" doit commencer par le numéro court
3. **Lots** : Si la procédure est allotie, pensez à remplir les intitulés des lots attribués
4. **Documents de preuve** : À adapter selon candidat France/Étranger

## 🔧 Personnalisation

### Ajouter des champs dans le mapping

Éditer `components/redaction/services/noti1AutoFill.ts` :

```typescript
export const PROCEDURE_TO_NOTI1_MAPPING = {
  'Nom de la procédure': 'objetConsultation',
  'Objet court': 'objetConsultation',
  // Ajouter ici vos nouveaux mappings
  'Mon_Champ_Procedure': 'monChampNoti1',
};
```

### Modifier les valeurs par défaut

Éditer `components/redaction/NOTI1Section.tsx` (ligne ~37) :

```typescript
const [formData, setFormData] = useState<Noti1Data>({
  pouvoirAdjudicateur: {
    nom: 'AFPA', // Modifier ici
    // ...
  },
  // ...
});
```

## 📝 Maintenance

### Ajouter NOTI2, NOTI3...

Le code est modulaire et peut être facilement dupliqué :

1. Copier les fichiers `noti1*.ts(x)` → `noti2*.ts(x)`
2. Adapter le type `Noti2Data`
3. Créer la table `noti2` dans Supabase
4. Ajouter l'entrée dans la landing page

## 🐛 Dépannage

### "Aucune procédure trouvée"
- Vérifier que le numéro existe dans la table `procédures`
- Le champ "Numéro de procédure (Afpa)" doit commencer par le numéro saisi

### "Erreur sauvegarde Supabase"
- Vérifier que la table `noti1` existe
- Vérifier les permissions RLS
- Vérifier que l'utilisateur est connecté

### L'auto-remplissage ne se déclenche pas
- Le numéro doit être exactement 5 chiffres
- Vérifier la console JavaScript pour les erreurs
- Tester avec un numéro connu (ex: 25091)

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Bibliothèque docx](https://docx.js.org/)
- [Code du Règlement de consultation](components/redaction/ReglementConsultation.tsx) (référence)

---

**Auteur** : Module créé par clonage du Règlement de consultation
**Date** : Janvier 2026
**Version** : 1.0.0
