# Export PDF du Rapport de Présentation

## Vue d'ensemble

Le module de Rapport de Présentation permet désormais de générer un PDF professionnel qui suit **exactement la même structure** que l'export DOCX existant.

## Caractéristiques

### ✅ Structure identique au DOCX

Le PDF respecte les **10 chapitres** du document Word :

1. **CONTEXTE** - Objet et durée du marché
2. **DÉROULEMENT DE LA PROCÉDURE** - Calendrier, publication, réception
3. **DOSSIER DE CONSULTATION** - Composition du DCE
4. **QUESTIONS - RÉPONSES** - Échanges avec les candidats
5. **ANALYSE DES CANDIDATURES** - Vérification des capacités
6. **MÉTHODOLOGIE D'ANALYSE DES OFFRES** - Critères et pondérations
7. **ANALYSE DE LA VALEUR DES OFFRES** - Classement et tableau comparatif
8. **ANALYSE DE LA PERFORMANCE DU DOSSIER** - Performance achat, impact budgétaire
9. **PROPOSITION D'ATTRIBUTION** - Attributaire pressenti
10. **PROPOSITION DE CALENDRIER DE MISE EN ŒUVRE** - Validation, rejet, attribution

### ✅ Design professionnel AFPA

- **Logo unique** : Logo AFPA (Image1.png) en haut à droite
- **Couleur signature** : #56BAA2 (vert AFPA) pour les titres et en-têtes
- **Police** : Helvetica (standard PDF)
- **Header/Footer** : Numéro de page, date de génération, mentions légales

### ✅ Données automatiques depuis Supabase

- Chargement automatique des **dépôts** et **retraits** depuis la table \`procédures\` (colonnes JSONB)
- Pas besoin de fichiers CSV/PDF manuels
- Synchronisation avec les données de l'application

## Utilisation

### Génération du PDF

1. Ouvrir le module **Analyse > Rapport de Présentation**
2. Sélectionner une procédure
3. Les données de dépôts/retraits se chargent automatiquement
4. Remplir les différents chapitres
5. Cliquer sur **"Exporter en PDF"** (bouton bleu)

Le PDF est généré et téléchargé automatiquement.

## Architecture technique

### Fichiers modifiés

\`\`\`
components/analyse/components/
  ├── RapportPresentation.tsx          # Composant principal (ajout bouton PDF)
  ├── RapportPresentationPDF.tsx       # Template PDF (restructuré)
  └── utils/
      └── rapportPresentationPdfExport.ts  # Logique export PDF (modifié)
\`\`\`

### Dépendances

- **@react-pdf/renderer** v4.3.2 : Génération PDF côté client
- **Supabase** : Chargement automatique des données

### Template PDF

Le composant \`RapportPresentationPDF.tsx\` :
- Utilise \`@react-pdf/renderer\` (Document, Page, View, Text, Image)
- Styles inline avec \`StyleSheet.create()\`
- Helper \`formatCurrency()\` pour les montants
- Helper \`formatDate()\` pour les dates
- Logo AFPA en base64 intégré

### Export

La fonction \`generateRapportPresentationPdfBlob()\` :
1. Charge le logo AFPA depuis \`/Image1.png\`
2. Convertit en base64
3. Génère le PDF avec \`pdf().toBlob()\`
4. Retourne un Blob téléchargeable

## Alignement DOCX ↔ PDF

| Élément | DOCX | PDF | Status |
|---------|------|-----|--------|
| **Logo** | Image1.png | Image1.png base64 | ✅ |
| **Couleur** | #56BAA2 | #56BAA2 | ✅ |
| **Structure** | 10 chapitres | 10 chapitres | ✅ |
| **Header** | Titre + logo | Titre + logo | ✅ |
| **Footer** | Page + date | Page + date | ✅ |
| **Tableaux** | Offres classées | Offres classées | ✅ |
| **Signature** | Fait à Montreuil | Fait à Montreuil | ✅ |

## Personnalisation

### Modifier les couleurs

Dans \`RapportPresentationPDF.tsx\`, chercher \`#56BAA2\` et remplacer par la nouvelle couleur.

### Ajouter un chapitre

1. Ajouter le contenu dans \`data\` (RapportPresentation.tsx)
2. Créer une section \`<View style={styles.chapter}>\` dans le template PDF
3. Mettre à jour le SOMMAIRE

### Modifier le logo

Remplacer \`/Image1.png\` par un nouveau fichier, ou modifier le chemin dans \`rapportPresentationPdfExport.ts\`.

## Différences avec le DOCX

| Aspect | DOCX | PDF |
|--------|------|-----|
| **Éditable** | ✅ Oui (Word/LibreOffice) | ❌ Non (lecture seule) |
| **Poids** | ~200-500 KB | ~150-300 KB |
| **Compatibilité** | Windows/Mac/Linux | Universel |
| **Formatage** | Peut varier selon l'éditeur | Rendu identique partout |

## Dépannage

### Le PDF ne se génère pas

- Vérifier que \`@react-pdf/renderer\` est installé : \`npm list @react-pdf/renderer\`
- Vérifier la console navigateur pour les erreurs
- S'assurer que \`/Image1.png\` existe et est accessible

### Les données ne s'affichent pas

- Vérifier que la procédure sélectionnée a des données dans \`depots\` et \`retraits\` (colonnes JSONB Supabase)
- Vérifier les champs remplis dans les chapitres

### Le logo ne s'affiche pas

- Vérifier que \`/Image1.png\` existe à la racine du projet
- Vérifier la conversion base64 dans \`loadImageAsBase64()\`

## Notes techniques

### Pourquoi @react-pdf/renderer ?

- **Avantages** :
  - Génération côté client (pas de serveur nécessaire)
  - Syntaxe React familière
  - Contrôle total du design
  - Léger et rapide

- **Inconvénients** :
  - Pas éditable (contrairement au DOCX)
  - Syntaxe de style limitée (pas de CSS complet)

### Performances

- Génération : ~1-2 secondes pour un rapport de 10-15 pages
- Taille : ~200-300 KB selon le nombre d'offres
- Compatible : Chrome, Firefox, Safari, Edge

## Roadmap

- [ ] Export multi-lots (tableau par lot)
- [ ] Graphiques de performance
- [ ] Annexes automatiques (analyse candidatures)
- [ ] Thèmes personnalisables
- [ ] Signature électronique

## Support

Pour toute question ou amélioration :
- Consulter la documentation @react-pdf/renderer : https://react-pdf.org/
- Voir les fichiers sources dans \`components/analyse/\`
