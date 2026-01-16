# Module Rapport de Commission 🎯

## Vue d'ensemble

Le module **Rapport de Commission** permet de générer automatiquement des rapports de présentation de commission d'appel d'offres au format Word (.docx). Il offre une interface intuitive, chapitrée et professionnelle pour faciliter la saisie et la modification des données.

## 📁 Structure des fichiers

```
components/redaction/
├── RapportCommission.tsx              # Composant principal
├── types/
│   └── rapportCommission.ts           # Types TypeScript
└── services/
    └── rapportCommissionGenerator.ts  # Générateur de documents Word
```

## 🎨 Fonctionnalités

### ✅ Interface utilisateur

- **Navigation par chapitres** : Sidebar avec 8 chapitres principaux
- **Saisie fluide** : Formulaires adaptés à chaque section
- **Prévisualisation en temps réel** : Fenêtre latérale optionnelle
- **Sauvegarde locale** : Enregistrement automatique dans localStorage
- **Export Word** : Génération du document final formaté

### 📋 Structure du rapport (8 chapitres)

1. **Identification du marché**
   - N° de procédure
   - Objet du marché
   - Type de marché (Fournitures/Services/Travaux)
   - Mode de passation
   - Montant estimé
   - Code CPV

2. **Composition de la commission**
   - Date et lieu de réunion
   - Président de séance (nom, fonction)
   - Membres présents (liste dynamique)
   - Membres absents
   - Invités

3. **Objet de la réunion**
   - Type d'analyse (Ouverture des plis, Analyse des candidatures, etc.)
   - Date et heure d'ouverture

4. **Rappel du contexte**
   - Date de publication
   - Date limite de dépôt
   - Critères d'attribution (Prix %, Technique %, Autres)

5. **Déroulement de la séance**
   - Nombre d'offres reçues et recevables
   - Offres irrecevables (avec motifs)
   - Offres inappropriées

6. **Analyse des offres**
   - Tableau des candidats avec notes :
     - Note technique
     - Note financière
     - Note globale
   - Classement automatique

7. **Propositions**
   - Attributaire proposé :
     - Nom
     - Montant HT et TTC
     - Délai d'exécution
   - Conditions particulières
   - Réserves éventuelles

8. **Décisions**
   - Avis de la commission (Favorable, Avec réserves, Défavorable, Infructuosité)
   - Date de notification prévue
   - Observations complémentaires

## 🚀 Utilisation

### Accès au module

1. Depuis la **Vue Rédaction**, cliquez sur la carte **Rapport Commission**
2. Vous accédez à l'interface de saisie avec la navigation par chapitres

### Saisie des données

1. **Sélectionnez un chapitre** dans le sidebar gauche
2. **Remplissez les champs** du formulaire
3. Les données sont **sauvegardées automatiquement** dans votre navigateur
4. Passez au chapitre suivant via le menu latéral

### Prévisualisation

1. Cliquez sur le bouton **"Prévisualiser"** dans le header
2. Une fenêtre latérale s'affiche avec l'aperçu du document
3. La prévisualisation se met à jour en temps réel selon vos saisies

### Génération du document Word

1. Cliquez sur **"Télécharger Word"** dans le header
2. Le document `.docx` est généré et téléchargé automatiquement
3. Nom du fichier : `Rapport_Commission_[NumProc]_[Date].docx`

### Sauvegarde et chargement

- **Sauvegarde** : Cliquez sur "Sauvegarder" pour enregistrer manuellement
- **Chargement** : Cliquez sur "Charger" pour récupérer vos données sauvegardées
- Les données sont persistées dans `localStorage` (navigateur local)

## 💡 Conseils d'utilisation

### Workflow recommandé

1. **Commencez par le chapitre 1** (Identification) pour définir le contexte
2. **Remplissez la composition** de la commission (Chapitre 2)
3. **Complétez les informations techniques** (Chapitres 3-6)
4. **Proposez l'attributaire** (Chapitre 7)
5. **Finalisez avec la décision** (Chapitre 8)
6. **Prévisualisez** avant de générer le Word
7. **Générez le document** final

### Champs obligatoires

Bien que tous les champs soient optionnels, pour un rapport complet, veillez à renseigner :

- N° de procédure (Chapitre 1)
- Date de réunion (Chapitre 2)
- Président de séance (Chapitre 2)
- Nombre d'offres (Chapitre 5)
- Attributaire proposé (Chapitre 7)
- Avis de la commission (Chapitre 8)

### Gestion des listes dynamiques

Plusieurs sections permettent d'ajouter/supprimer des éléments :

- **Membres présents** : Ajoutez autant de membres que nécessaire
- **Autres critères** : Ajoutez des critères personnalisés
- **Offres irrecevables** : Listez toutes les offres rejetées avec motifs
- **Candidats** : Tableau complet avec notes détaillées

Pour chaque liste :
1. Remplissez les champs de saisie
2. Cliquez sur le bouton "+ Ajouter..."
3. L'élément apparaît dans la liste
4. Cliquez sur "✕" pour supprimer un élément

## 🎯 Format du document Word généré

### Mise en forme professionnelle

- **Titres de chapitres** : Style "Heading 1" avec numérotation
- **Marges** : 2 cm sur tous les côtés
- **Police** : Calibri (par défaut)
- **Espacement** : Cohérent entre les sections
- **Tableaux** : Bordures et en-têtes formatés
- **Signature** : Zone de signature en fin de document

### Structure du document

```
┌─────────────────────────────────────────┐
│ RAPPORT DE PRÉSENTATION                 │
│ COMMISSION D'APPEL D'OFFRES              │
├─────────────────────────────────────────┤
│ 1. IDENTIFICATION DU MARCHÉ              │
│    - N° procédure : ...                  │
│    - Objet : ...                         │
│    [...]                                 │
├─────────────────────────────────────────┤
│ 2. COMPOSITION DE LA COMMISSION          │
│    - Date : ...                          │
│    - Président : ...                     │
│    - Membres présents :                  │
│      • Nom 1 - Fonction 1                │
│      • Nom 2 - Fonction 2                │
│    [...]                                 │
├─────────────────────────────────────────┤
│ [Chapitres 3 à 8]                        │
├─────────────────────────────────────────┤
│ Fait à _______, le _______              │
│                                          │
│ Le Président de la Commission            │
│                                          │
│ Signature                                │
└─────────────────────────────────────────┘
```

## 🔧 Personnalisation

### Modification des champs

Pour ajouter/modifier des champs, éditez les fichiers :

1. **Types** : `components/redaction/types/rapportCommission.ts`
2. **Interface** : `components/redaction/RapportCommission.tsx`
3. **Générateur** : `components/redaction/services/rapportCommissionGenerator.ts`

### Ajout d'un nouveau chapitre

1. Ajoutez le chapitre dans le tableau `chapters` du composant
2. Créez un nouveau composant de formulaire (ex: `NouveauChapter`)
3. Ajoutez-le au switch `renderChapterContent()`
4. Mettez à jour le générateur Word

## 📦 Technologies utilisées

- **React** : Interface utilisateur
- **TypeScript** : Typage fort
- **Tailwind CSS** : Styling moderne
- **lucide-react** : Icônes
- **docx** : Génération de documents Word
- **file-saver** : Téléchargement de fichiers
- **localStorage** : Persistance locale

## 🐛 Dépannage

### Le document Word ne se génère pas

- Vérifiez que la bibliothèque `docx` est installée
- Consultez la console du navigateur pour voir les erreurs
- Assurez-vous d'avoir rempli au moins un champ

### Les données ne se sauvegardent pas

- Vérifiez que localStorage est activé dans votre navigateur
- Testez dans un autre navigateur
- Videz le cache si nécessaire

### La prévisualisation ne s'affiche pas

- Vérifiez la largeur de votre écran (la prévisualisation nécessite assez d'espace)
- Testez en mode plein écran

## 🎓 Exemple d'utilisation

### Scénario : Rapport pour un appel d'offres

```
1. Identification du marché
   - N° procédure : 2024-AO-TRAVAUX-001
   - Objet : Travaux de rénovation énergétique
   - Type : Travaux
   - Mode : Appel d'offres ouvert
   - Montant : 250 000 € HT

2. Composition
   - Date : 15/01/2025
   - Président : M. DUPONT - Directeur des Services Techniques
   - Membres : M. MARTIN, Mme BERNARD, M. DURAND

3. Analyse
   - 5 offres reçues
   - 4 offres recevables
   - 1 offre irrecevable (dossier incomplet)

4. Proposition
   - Attributaire : Entreprise ABC
   - Montant HT : 235 000 €
   - Montant TTC : 282 000 €

5. Décision
   - Avis : Favorable
   - Date notification : 20/01/2025
```

Le document Word généré contiendra toutes ces informations formatées de manière professionnelle, prêt à être signé et archivé.

## 📞 Support

Pour toute question ou amélioration, référez-vous à la documentation technique dans les fichiers source ou contactez l'équipe de développement.

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2025
