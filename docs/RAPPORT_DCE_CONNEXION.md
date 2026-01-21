# 🔗 Connexion Rapport de Présentation ↔ DCE Complet

## 📋 Fonctionnalité

Le module **Rapport de Présentation** peut maintenant récupérer automatiquement les données du module **DCE Complet** pour auto-remplir le paragraphe **3. DOSSIER DE CONSULTATION**.

---

## 🎯 Point commun : Numéro de procédure

Les deux modules sont liés par le **numéro de procédure à 5 chiffres** (ex : `25001`, `25091`).

```
┌─────────────────────────────────────────┐
│  Module DCE Complet                     │
│  └─ Section "6. Contenu du DCE"         │
│     └─ Liste des documents              │
│        (RC, AE, CCAP, CCTP, BPU...)     │
│                                         │
│  Sauvegarde dans :                      │
│  Table 'dce'                            │
│  Colonne 'reglement_consultation'       │
│  Clé : 'numero_procedure' (25001)       │
└─────────────────────────────────────────┘
                   ↓
                   ↓ Récupération via Supabase
                   ↓
┌─────────────────────────────────────────┐
│  Module Rapport de Présentation         │
│  └─ Paragraphe 3 "Dossier de           │
│     Consultation"                       │
│     └─ Bouton "Charger depuis DCE"      │
│        (Auto-remplissage)               │
│                                         │
│  Clé : 'NumProc' (25001)                │
└─────────────────────────────────────────┘
```

---

## 🚀 Utilisation

### Étape 1 : Créer le DCE (si pas déjà fait)

1. Allez dans **DCE Complet**
2. Saisissez le numéro de procédure (ex : `25001`)
3. Remplissez la section **"6. Contenu du DCE"**
4. Cliquez sur **Sauvegarder**

### Étape 2 : Charger les données dans le Rapport

1. Allez dans **Rapport de Présentation**
2. Sélectionnez la même procédure (`25001`)
3. Dans le **Paragraphe 3 "DOSSIER DE CONSULTATION"**, cliquez sur le bouton :
   
   ```
   📋 Charger depuis DCE
   ```

4. ✅ **Les données sont automatiquement chargées et formatées !**

---

## 📊 Données récupérées

### Depuis `dce.reglement_consultation`

La fonction récupère la structure JSONB suivante :

```json
{
  "dce": {
    "documents": [
      "Règlement de la Consultation (RC)",
      "Acte d'Engagement (AE)",
      "Bordereau des Prix Unitaires (BPU)",
      "Cahier des Clauses Administratives Particulières (CCAP)",
      "Cahier des Clauses Techniques Particulières (CCTP)",
      "Détail Quantitatif Estimatif (DQE)",
      "Questionnaire Technique (QT)"
    ],
    "ccagApplicable": "Fournitures",
    "renseignements": "..."
  }
}
```

### Format d'affichage généré

```
Description du DCE et des documents fournis :

1. Règlement de la Consultation (RC)
2. Acte d'Engagement (AE)
3. Bordereau des Prix Unitaires (BPU)
4. Cahier des Clauses Administratives Particulières (CCAP)
5. Cahier des Clauses Techniques Particulières (CCTP)
6. Détail Quantitatif Estimatif (DQE)
7. Questionnaire Technique (QT)
```

---

## 🔧 Implémentation technique

### Fichier modifié

**`components/analyse/RapportPresentation.tsx`**

### 1. État ajouté

```tsx
const [dceData, setDceData] = useState<any>(null);
const [loadingDCE, setLoadingDCE] = useState(false);
```

### 2. Fonction de chargement

```tsx
const loadDCEData = async () => {
  if (!procedureSelectionnee?.NumProc) {
    alert('Aucune procédure sélectionnée');
    return;
  }

  setLoadingDCE(true);
  try {
    // Récupération depuis Supabase
    const { data, error } = await supabase
      .from('dce')
      .select('reglement_consultation')
      .eq('numero_procedure', procedureSelectionnee.NumProc)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        alert(`Aucun DCE trouvé pour la procédure ${procedureSelectionnee.NumProc}.\n\nVeuillez d'abord créer le DCE dans le module "6. Contenu du DCE".`);
        return;
      }
      throw error;
    }

    if (!data?.reglement_consultation) {
      alert(`Le DCE existe mais le Règlement de Consultation n'a pas encore été rempli.\n\nAllez dans le module "DCE Complet" > "6. Contenu du DCE" pour le compléter.`);
      return;
    }

    const rcData = data.reglement_consultation;
    setDceData(rcData);

    // Auto-remplir le champ "Dossier de Consultation"
    if (rcData.dce?.documents && Array.isArray(rcData.dce.documents)) {
      const documentsList = rcData.dce.documents
        .map((doc: string, index: number) => `${index + 1}. ${doc}`)
        .join('\n');
      
      const dceDescription = `Description du DCE et des documents fournis :\n\n${documentsList}`;
      setContenuChapitre3(dceDescription);
      
      alert('✅ Données du DCE chargées avec succès !\n\nLe paragraphe 3 "DOSSIER DE CONSULTATION" a été automatiquement rempli.');
    } else {
      alert('⚠️ Le Règlement de Consultation ne contient pas de liste de documents.');
    }

  } catch (error: any) {
    console.error('Erreur lors du chargement du DCE:', error);
    alert(`Erreur lors du chargement du DCE :\n${error.message || 'Erreur inconnue'}`);
  } finally {
    setLoadingDCE(false);
  }
};
```

### 3. Interface utilisateur

```tsx
<div className="flex items-center justify-between mb-2">
  <p className="text-sm text-gray-700 font-medium">✏️ Saisissez ou collez le contenu ci-dessous :</p>
  <button
    onClick={loadDCEData}
    disabled={!procedureSelectionnee || loadingDCE}
    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-all"
    title="Charger automatiquement les données depuis le module DCE Complet"
  >
    {loadingDCE ? (
      <>
        <Clock className="w-4 h-4 animate-spin" />
        Chargement...
      </>
    ) : (
      <>
        <FileCheck className="w-4 h-4" />
        Charger depuis DCE
      </>
    )}
  </button>
</div>
```

### 4. Indicateur visuel

```tsx
{dceData && (
  <div className="mt-2 p-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
    <p className="text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
      <Check className="w-3 h-3" />
      Données chargées depuis le DCE (Procédure {procedureSelectionnee?.NumProc})
    </p>
  </div>
)}
```

---

## 🎨 Interface

### Avant le clic

```
┌─────────────────────────────────────────────────────────┐
│  3. DOSSIER DE CONSULTATION                   📁        │
│                                                          │
│  ✏️ Saisissez...   [📋 Charger depuis DCE] (bouton)    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Description du DCE et des documents...          │   │
│  │                                                 │   │
│  │ Exemple :                                       │   │
│  │ - Acte d'engagement                             │   │
│  │ - CCAP                                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Après le clic (succès)

```
┌─────────────────────────────────────────────────────────┐
│  3. DOSSIER DE CONSULTATION                   📁        │
│                                                          │
│  ✏️ Saisissez...   [📋 Charger depuis DCE]             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Description du DCE et des documents fournis :   │   │
│  │                                                 │   │
│  │ 1. Règlement de la Consultation (RC)            │   │
│  │ 2. Acte d'Engagement (AE)                       │   │
│  │ 3. Bordereau des Prix Unitaires (BPU)           │   │
│  │ 4. Cahier des Clauses Adm. Part. (CCAP)        │   │
│  │ 5. Cahier des Clauses Tech. Part. (CCTP)       │   │
│  │ 6. Détail Quantitatif Estimatif (DQE)          │   │
│  │ 7. Questionnaire Technique (QT)                 │   │
│  └─────────────────────────────────────────────────┘   │
│  ✓ 234 caractères saisis                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✓ Données chargées depuis le DCE (Proc. 25001) │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Gestion d'erreurs

### Cas 1 : Aucune procédure sélectionnée

```
❌ Alert : "Aucune procédure sélectionnée"
```

### Cas 2 : DCE inexistant

```
❌ Alert : "Aucun DCE trouvé pour la procédure 25001.

Veuillez d'abord créer le DCE dans le module '6. Contenu du DCE'."
```

### Cas 3 : DCE existe, mais RC vide

```
❌ Alert : "Le DCE existe mais le Règlement de Consultation n'a pas encore été rempli.

Allez dans le module 'DCE Complet' > '6. Contenu du DCE' pour le compléter."
```

### Cas 4 : RC existe, mais pas de documents

```
⚠️ Alert : "Le Règlement de Consultation ne contient pas de liste de documents."
```

### Cas 5 : Erreur Supabase

```
❌ Alert : "Erreur lors du chargement du DCE :
[Message d'erreur détaillé]"
```

---

## 🧪 Tests

### Test 1 : Workflow complet

1. **DCE Complet** → Créer DCE pour procédure `25001`
2. **DCE Complet** → Remplir section "6. Contenu du DCE"
3. **DCE Complet** → Sauvegarder
4. **Rapport Présentation** → Sélectionner procédure `25001`
5. **Rapport Présentation** → Cliquer "Charger depuis DCE"
6. ✅ **Vérifier** : Paragraphe 3 auto-rempli avec la liste numérotée

### Test 2 : DCE inexistant

1. **Rapport Présentation** → Sélectionner procédure `99999` (n'existe pas)
2. **Rapport Présentation** → Cliquer "Charger depuis DCE"
3. ✅ **Vérifier** : Alert "Aucun DCE trouvé..."

### Test 3 : Édition manuelle après chargement

1. **Rapport Présentation** → Charger DCE
2. **Rapport Présentation** → Modifier le texte manuellement
3. ✅ **Vérifier** : Le texte reste éditable
4. ✅ **Vérifier** : Badge "Données chargées..." toujours affiché

---

## 📈 Évolutions futures possibles

### 1. Charger plus de données du RC

Actuellement, seule la **liste des documents** est chargée.

**Possibilités d'extension** :

- CCAG applicable
- Renseignements complémentaires
- Objet de la consultation
- Modalités de remise

### 2. Synchronisation bidirectionnelle

- Détecter si le DCE a été modifié depuis le chargement
- Proposer de recharger automatiquement

### 3. Aperçu avant chargement

Afficher un modal avec un aperçu des données avant de les insérer.

---

## 🔗 Liens avec d'autres modules

| Module Source | Module Cible | Données partagées |
|---------------|--------------|-------------------|
| **DCE Complet** | Rapport Présentation | Liste des documents du DCE |
| Acte Engagement | Rapport Présentation | Montant estimé *(futur)* |
| Règlement Consultation | Rapport Présentation | Critères de jugement *(futur)* |

---

## 📝 Résumé

✅ **Connexion établie** entre Rapport de Présentation et DCE Complet  
✅ **Auto-remplissage** du paragraphe 3 "DOSSIER DE CONSULTATION"  
✅ **Gestion d'erreurs** complète avec messages explicites  
✅ **UI intuitive** avec bouton dédié et indicateur visuel  
✅ **Clé commune** : Numéro de procédure à 5 chiffres

---

**Date** : 21 janvier 2026  
**Version** : 1.0.14  
**Fichier modifié** : `components/analyse/RapportPresentation.tsx`  
**Fonction ajoutée** : `loadDCEData()`
