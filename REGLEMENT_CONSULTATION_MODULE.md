# Module Règlement de Consultation - Documentation

## ✅ Module recréé avec succès

Le module de génération de Règlement de Consultation a été **entièrement reconstruit** pour correspondre au vrai document de référence (marchés publics français).

### 🆕 Dernière mise à jour (v1.0.5)
- ✅ **Liaison aux procédures** : Chaque RC peut être lié à une procédure via un numéro à 5 chiffres
- 📖 Voir [PROCEDURE_LINK.md](./PROCEDURE_LINK.md) pour plus de détails

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
- ✅ `components/redaction/ReglementConsultation.tsx` - Composant principal (850+ lignes)
- ✅ `components/redaction/services/reglementConsultationGenerator.ts` - Générateur Word (720 lignes)

### Fichiers mis à jour
- ✅ `components/redaction/types/rapportCommission.ts` - Interface TypeScript mise à jour
- ✅ `App.tsx` - Import du nouveau composant `ReglementConsultation`

## 📋 Structure du document généré

Le module génère un **Règlement de Consultation** conforme aux standards français des marchés publics avec **12 chapitres** :

### 1. TERMINOLOGIE
Définitions : pouvoir adjudicateur, candidat, attributaire, titulaire, DCE

### 2. PRESENTATION DU POUVOIR ADJUDICATEUR
- Nom et adresse
- Téléphone, courriel
- Site web et profil d'acheteur

### 3. OBJET DE LA CONSULTATION
- Description de l'objet
- Code CPV principal
- Codes CPV secondaires

### 4. CONDITIONS DE LA CONSULTATION
- Mode de passation (appel d'offres ouvert, restreint, etc.)
- Décomposition en lots
- Variantes (autorisées ou non)
- Groupement d'opérateurs économiques

### 5. TYPE DE MARCHE
- Forme du marché (accord-cadre, marché à bons de commande, etc.)
- Durée initiale et reconductions
- Sous-traitance
- Lieu d'exécution

### 6. CONTENU DU DOSSIER DE CONSULTATION DES ENTREPRISES (DCE)
- Liste des documents (RC, AE, BPU, CCAP, CCTP, DQE, QT...)
- Lien vers les CCAG
- Renseignements complémentaires

### 7. CONDITIONS DE REMISE DES CANDIDATURES ET DES OFFRES
- Documents à produire
- Format des documents
- Délai de validité des offres

### 8. SELECTION DES CANDIDATURES ET JUGEMENT DES OFFRES
- Critères de sélection
- **Pondération** : Critère Financier (60%) / Critère Technique (40%)
- Sous-critères techniques personnalisables

### 9. CONDITION DE VALIDITE DE L'ATTRIBUTAIRE PRESSENTI
Pièces complémentaires après attribution

### 10. NEGOCIATION
Droit de négocier avec les candidats

### 11. DECLARATION SANS SUITE
Droit de déclarer la procédure sans suite

### 12. PROCEDURE DE RECOURS
- Tribunal administratif compétent
- Adresse, téléphone, courriel
- Références légales (Code de justice administrative)

## 🎨 Interface utilisateur

### Navigation par sections (8 onglets)
1. **En-tête** - Titre marché, n°, dates limites
2. **Pouvoir adjudicateur** - Coordonnées complètes
3. **Objet de la consultation** - Description, CPV
4. **Conditions** - Mode passation, lots, variantes
5. **Type de marché** - Forme, durée, reconductions
6. **DCE** - Documents du dossier
7. **Jugement des offres** - Critères et pondération
8. **Procédure de recours** - Tribunal compétent

### Fonctionnalités
- ✅ **Sauvegarde automatique** en localStorage
- ✅ **Bouton Charger** pour récupérer les données
- ✅ **Prévisualisation** en temps réel
- ✅ **Génération Word** au format .docx
- ✅ **Thème clair/sombre** compatible

## 📝 Champs personnalisables

### En-tête
- Titre du marché
- Numéro de marché (ex: AAXXX_XX_XX-XX_XXX)
- Type de marché (Fournitures/Services, Travaux, Prestations intellectuelles)
- Date et heure limites de réception des offres
- Date limite questions/réponses

### Pouvoir adjudicateur
- Nom (pré-rempli : Afpa)
- Adresse complète
- Contact (tél, courriel, web, profil acheteur)

### Objet
- Description textuelle
- CPV principal (code + libellé)
- CPV secondaires (liste dynamique)

### Lots
- Nombre de lots
- Pour chaque lot : n°, intitulé, montant max

### Critères de jugement
- % Financier / % Technique (pré-rempli : 60/40)
- Sous-critères techniques :
  - Organisation (115 pts)
  - Plan de déploiement (60 pts)
  - Entreprise (50 pts)
  - Produits (50 pts)

### Tribunal
- Nom (pré-rempli : Tribunal Administratif de Montreuil)
- Adresse complète
- SIRET

## 🚀 Utilisation

### 1. Accéder au module
- Onglet **Rédaction** → Clic sur **Règlement de consultation**

### 2. Remplir le formulaire
- Naviguer entre les 8 sections via le menu latéral
- Remplir les champs obligatoires (titre, dates, description, lots)
- Ajouter des CPV secondaires, des lots, des sous-critères

### 3. Prévisualiser
- Clic sur **Prévisualiser** pour voir un aperçu du document
- L'aperçu se met à jour en temps réel

### 4. Sauvegarder
- Clic sur **Sauvegarder** pour enregistrer dans le navigateur
- Clic sur **Charger** pour récupérer une session précédente

### 5. Générer le Word
- Clic sur **Télécharger Word**
- Le fichier `.docx` se télécharge automatiquement
- Nom du fichier : `Reglement_Consultation_{NumeroMarche}.docx`

## 🔧 Données pré-remplies

Par défaut, le formulaire contient des **données types Afpa** :

```typescript
Pouvoir adjudicateur :
  - Nom : Afpa
  - Adresse : 3 rue Franklin, 93100 Montreuil-sous-Bois
  - Site : www.afpa.fr
  - Profil : http://afpa.e-marchespublics.com

Type de marché :
  - Forme : Accord-cadre mono-attributaire
  - Durée : 12 mois + 3 reconductions de 12 mois (48 mois max)

DCE : RC, AE, BPU, CCAP, CCTP, DQE, QT

Jugement :
  - Financier : 60%
  - Technique : 40%
    → Organisation (115 pts)
    → Plan de déploiement (60 pts)
    → Entreprise (50 pts)
    → Produits (50 pts)

Tribunal : Tribunal Administratif de Montreuil
```

## ✨ Différences avec l'ancien module

| Ancien (Commission) | Nouveau (RC) |
|---------------------|--------------|
| 8 chapitres | **12 chapitres** |
| Rapport de réunion | **Document légal** |
| Commission d'attribution | **Procédure marchés publics** |
| Analyse des offres | **Règlement consultation** |
| Pas de structure légale | **Conforme Code commande publique** |

## 📦 Dépendances utilisées

- `docx` v9.5.1 - Génération Word
- `file-saver` v2.0.5 - Téléchargement
- `lucide-react` - Icônes
- `React 18` + `TypeScript`
- `Tailwind CSS` - Design

## 🎯 Conformité

Le document généré respecte :
- ✅ Code de la commande publique
- ✅ Code de justice administrative (recours)
- ✅ Structure standard des RC français
- ✅ Terminologie officielle

## 💡 Prochaines étapes possibles

1. **Import automatique** : Importer des données depuis un tableur
2. **Templates** : Sauvegarder plusieurs modèles de RC
3. **Validation** : Vérifier la complétude avant génération
4. **Export PDF** : Génération directe en PDF
5. **Historique** : Versionner les RC générés

## 🐛 Résolution de problèmes

### Le module ne s'affiche pas
→ Vérifier que vous êtes dans l'onglet **Rédaction** → **Règlement de consultation**

### Les données ne se sauvegardent pas
→ Vérifier que localStorage n'est pas désactivé dans le navigateur

### Le Word ne se génère pas
→ Vérifier la console pour les erreurs docx (F12)

### Erreur "404 Not Found"
→ Relancer l'application : `npm run dev`

## 📞 Support

Pour toute question ou amélioration, référez-vous à :
- [AUTH_SETUP.md](./AUTH_SETUP.md)
- [TEST_GUIDE.md](./TEST_GUIDE.md)
- [README.md](./README.md)

---

**Statut** : ✅ Module fonctionnel et testé
**Version** : 1.0.4
**Date** : 2025
