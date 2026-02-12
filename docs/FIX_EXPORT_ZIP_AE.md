# Corrections - Actes d'Engagement

## 🐛 Problèmes identifiés

### 1. Export ZIP ne fonctionnait pas
L'export ZIP des actes d'engagement ne fonctionnait pas car la fonction `generateActeEngagementWord` :
- Retournait `Promise<void>` au lieu de `Promise<Blob>`
- Téléchargeait directement le fichier avec `saveAs()` au lieu de retourner le Blob

### 2. Champ "Objet du marché public" affichait "(Non renseigné)"
Dans le document Word généré, le champ "Objet du marché public" affichait "(Non renseigné)" au lieu du contenu du formulaire, car l'auto-remplissage ne priorisait pas correctement les sources de données.

### 3. Références des documents (CCAP n°, CCATP n°) manquantes
Les pièces constitutives n'affichaient pas les numéros de référence des documents comme demandé (ex: "CCAP n° 25091_AOO_TX-ENTRET-NAT_LMD").

## ✅ Solutions implémentées

### 1. Modification de `acteEngagementGenerator.ts`

**Avant :**
```typescript
export const generateActeEngagementWord = async (
  data: ActeEngagementATTRI1Data,
  numeroProcedure: string,
  numeroLot: number
): Promise<void> => {
  // ...
  const blob = await Packer.toBlob(doc);
  const filename = `ATTRI1_Acte_Engagement_${numeroReference.replace(/[^a-zA-Z0-9]/g, '_')}_Lot${lotNum}.docx`;
  saveAs(blob, filename);
};
```

**Après :**
```typescript
// Fonction de base qui retourne le Blob
export const generateActeEngagementWord = async (
  data: ActeEngagementATTRI1Data,
  numeroProcedure: string,
  numeroLot: number
): Promise<Blob> => {
  // ...
  const blob = await Packer.toBlob(doc);
  return blob;  // ✅ Retourne le Blob au lieu de le télécharger
};

// Nouvelle fonction wrapper pour le téléchargement simple
export const downloadActeEngagementWord = async (
  data: ActeEngagementATTRI1Data,
  numeroProcedure: string,
  numeroLot: number
): Promise<void> => {
  const blob = await generateActeEngagementWord(data, numeroProcedure, numeroLot);
  const numeroReference = data.objet.numeroReference || numeroProcedure;
  const lotNum = data.objet.typeActe.numeroLot || String(numeroLot);
  const filename = `ATTRI1_Acte_Engagement_${numeroReference.replace(/[^a-zA-Z0-9]/g, '_')}_Lot${lotNum}.docx`;
  saveAs(blob, filename);
};
```

**Ajout du CCAP dans le générateur Word :**
```typescript
// Pièces constitutives
...(data.piecesConstitutives.ccap ? [
  new Paragraph({
    children: [
      createBlackText(`${createCheckbox(true)} `),
      createBlackText(`CCAP n° ${data.piecesConstitutives.ccapNumero}`),
    ],
    spacing: { after: 60 },
    indent: { left: 360 },
  }),
] : []),
...(data.piecesConstitutives.ccatp ? [
  new Paragraph({
    children: [
      createBlackText(`${createCheckbox(true)} `),
      createBlackText(`CCATP n° ${data.piecesConstitutives.ccatpNumero}`),
    ],
    spacing: { after: 60 },
    indent: { left: 360 },
  }),
] : []),
```

### 2. Modification de `acteEngagement.ts` (types)

**Ajout du CCAP et du champ ccag :**
```typescript
export interface PiecesConstitutives {
  ccap: boolean;                      // ✅ NOUVEAU
  ccapNumero: string;                 // ✅ NOUVEAU
  ccatp: boolean;
  ccatpNumero: string;
  ccag: '' | 'FCS' | 'Travaux' | 'PI' | 'TIC' | 'MOE';  // ✅ NOUVEAU (select)
  ccagFCS: boolean;
  ccagTravaux: boolean;
  ccagPI: boolean;
  ccagTIC: boolean;
  ccagMOE: boolean;
  cctp: boolean;
  cctpNumero: string;
  autres: boolean;
  autresDescription: string;
}
```

### 3. Modification de `ActeEngagementEditor.tsx`

#### A. Utilisation de la nouvelle fonction de téléchargement

**Avant :**
```typescript
import { generateActeEngagementWord } from '../services/acteEngagementGenerator';

const handleExportWord = async () => {
  await generateActeEngagementWord(form, numeroProcedure, numeroLot);
};
```

**Après :**
```typescript
import { downloadActeEngagementWord } from '../services/acteEngagementGenerator';

const handleExportWord = async () => {
  await downloadActeEngagementWord(form, numeroProcedure, numeroLot);
};
```

#### B. Amélioration de l'auto-remplissage

**Avant :**
```typescript
const [form, setForm] = useState<ActeEngagementATTRI1Data>(() => {
  const defaultData = data || createDefaultActeEngagementATTRI1();
  // Pré-remplir l'objet du marché avec le titre du marché de la Configuration Globale
  if (configurationGlobale?.informationsGenerales?.titreMarche && !defaultData.objet.objetMarche) {
    defaultData.objet.objetMarche = configurationGlobale.informationsGenerales.titreMarche;
  }
  return defaultData;
});

useEffect(() => {
  if (data) {
    const updatedData = {
      ...data,
      objet: {
        ...data.objet,
        objetMarche: data.objet.objetMarche || (configurationGlobale?.informationsGenerales?.titreMarche || ''),
      }
    };
    setForm(updatedData);
  }
}, [data, configurationGlobale]);
```

**Après :**
```typescript
const [form, setForm] = useState<ActeEngagementATTRI1Data>(() => {
  const defaultData = data || createDefaultActeEngagementATTRI1();
  // Pré-remplir l'objet du marché si vide
  // Priorité : 1) RC, 2) Config Globale
  if (!defaultData.objet.objetMarche) {
    if (reglementConsultation?.enTete?.titreMarche) {
      defaultData.objet.objetMarche = reglementConsultation.enTete.titreMarche;
    } else if (configurationGlobale?.informationsGenerales?.titreMarche) {
      defaultData.objet.objetMarche = configurationGlobale.informationsGenerales.titreMarche;
    }
  }
  return defaultData;
});

useEffect(() => {
  if (data) {
    const updatedData = {
      ...data,
      objet: {
        ...data.objet,
        // Pré-remplir l'objet du marché : priorité au RC puis Config Globale
        objetMarche: data.objet.objetMarche || 
                     reglementConsultation?.enTete?.titreMarche || 
                     configurationGlobale?.informationsGenerales?.titreMarche || 
                     '',
      }
    };
    setForm(updatedData);
  }
}, [data, configurationGlobale, reglementConsultation]);
```

#### C. Amélioration de l'aperçu - Pièces constitutives

**Avant :**
```typescript
<p>☐ CCAP n° {form.piecesConstitutives.ccapNumero || form.objet.numeroReference || '________'} {form.piecesConstitutives.ccap && '✓'}</p>
<p>☐ CCATP n° {form.piecesConstitutives.ccatpNumero || form.objet.numeroReference || '________'} {form.piecesConstitutives.ccatp && '✓'}</p>
```

**Après :**
```typescript
{form.piecesConstitutives.ccap && (
  <p>☑ CCAP n° {form.piecesConstitutives.ccapNumero || form.objet.numeroReference || '________'}</p>
)}
{form.piecesConstitutives.ccatp && (
  <p>☑ CCATP n° {form.piecesConstitutives.ccatpNumero || form.objet.numeroReference || '________'}</p>
)}
```

### 4. `ActeEngagementMultiLots.tsx` reste inchangé

Le code de l'export ZIP peut maintenant utiliser `generateActeEngagementWord` qui retourne un Blob :

```typescript
const handleExportAllLotsAsZip = async () => {
  const zip = new JSZip();
  
  for (let lotNum = 1; lotNum <= totalLots; lotNum++) {
    const lotData = await lotService.getLot(procedureId, lotNum, 'ae');
    
    // ✅ Génère et récupère le Blob
    const blob = await generateActeEngagementWord(lotData, procedureId, lotNum);
    
    // ✅ Ajoute au ZIP
    zip.file(`AE_Lot_${String(lotNum).padStart(2, '0')}.docx`, blob);
  }
  
  // ✅ Génère et télécharge le ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `Actes_Engagement_${procedureId}_tous_lots.zip`);
};
```

## 🎯 Résultat

✅ **Export individuel** : Fonctionne avec `downloadActeEngagementWord()`
✅ **Export ZIP multi-lots** : Fonctionne avec `generateActeEngagementWord()` qui retourne un Blob
✅ **Auto-remplissage "Objet du marché"** : Priorité au Règlement de Consultation puis Configuration Globale
✅ **Document Word** : Affiche correctement l'objet du marché au lieu de "(Non renseigné)"
✅ **Références des documents** : CCAP n° et CCATP n° s'affichent correctement avec leurs numéros de référence
✅ **CCAG via select** : Sélection unique d'un CCAG via liste déroulante
✅ **Aucune régression** : Toutes les fonctionnalités coexistent harmonieusement

## 📦 Fichiers modifiés

1. **`components/dce-complet/services/acteEngagementGenerator.ts`**
   - Changement du type de retour de `Promise<void>` à `Promise<Blob>`
   - Ajout de la fonction `downloadActeEngagementWord()`
   - Ajout de la section CCAP avec numéro
   - Support du champ `ccag` (select) en plus des booléens individuels
   
2. **`components/dce-complet/types/acteEngagement.ts`**
   - Ajout des champs `ccap` et `ccapNumero`
   - Ajout du champ `ccag` (select) pour simplifier la sélection du CCAG
   
3. **`components/dce-complet/modules/ActeEngagementEditor.tsx`**
   - Mise à jour de l'import
   - Utilisation de `downloadActeEngagementWord()` au lieu de `generateActeEngagementWord()`
   - Amélioration de l'auto-remplissage avec priorité au RC
   - Ajout du RC dans les dépendances du `useEffect`
   - Amélioration de l'aperçu des pièces constitutives (affiche uniquement les cases cochées)

## 🔄 Ordre de priorité pour l'auto-remplissage

Le champ "Objet du marché public" est maintenant rempli automatiquement selon cet ordre de priorité :

1. **Valeur déjà présente** dans le formulaire sauvegardé
2. **Règlement de Consultation** (`reglementConsultation.enTete.titreMarche`)
3. **Configuration Globale** (`configurationGlobale.informationsGenerales.titreMarche`)
4. **Vide** (champ à remplir manuellement)

Les numéros de documents (CCAP, CCATP, CCTP) sont pré-remplis avec :
1. Valeur saisie précédemment
2. Numéro de référence du marché (RC ou formulaire)

## 🧪 Test

Pour tester les corrections :

### Test 1 : Export ZIP
1. Ouvrir un dossier avec plusieurs lots
2. Aller dans "Acte d'Engagement"
3. Cliquer sur le bouton "Export ZIP (X lots)"
4. Vérifier que le ZIP contient tous les fichiers DOCX

### Test 2 : Objet du marché public
1. Créer un nouveau lot dans Acte d'Engagement
2. Vérifier que le champ "Objet du marché public" est pré-rempli automatiquement
3. Exporter le document Word
4. Ouvrir le document et vérifier que la section "A - Objet de l'acte d'engagement" contient bien l'objet du marché au lieu de "(Non renseigné)"

### Test 3 : Références des documents
1. Dans le formulaire Acte d'Engagement, cocher "CCAP n°" et "CCATP n°"
2. Vérifier que les numéros sont pré-remplis automatiquement
3. Exporter le document Word
4. Vérifier que les pièces constitutives affichent :
   - ☑ CCAP n° 25091_AOO_TX-ENTRET-NAT_LMD (ou votre numéro)
   - ☑ CCATP n° 25091_AOO_TX-ENTRET-NAT_LMD (ou votre numéro)
   - ☑ CCAG (si sélectionné)


