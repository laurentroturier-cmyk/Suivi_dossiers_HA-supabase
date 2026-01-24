# 📝 Guide d'utilisation du formulaire CCAP

## 🎯 Vue d'ensemble

Le formulaire CCAP affiche **toutes les sections avec leur contenu complet**, vous permettant de **modifier, enrichir ou supprimer** chaque partie.

---

## 🏗️ Structure du formulaire

### 1. Informations générales (toujours visibles)

#### Dispositions générales
- **Objet** : Description précise des prestations
- **CCAG applicable** : Référence réglementaire (ex: CCAG-TIC)
- **Durée** : Durée initiale du marché
- **Reconduction** : Case à cocher + nombre de reconductions
- **Période transitoire** : Durée du transfert de compétences

#### Prix et paiement
- **Type de prix** : Forfaitaire, unitaire, mixte
- **Révision** : Case à cocher
  - Si oui → **Formule de révision** (ex: SYNTEC)
- **Avance** : Case à cocher
- **Retenue de garantie** : Case à cocher
- **Modalités de paiement** : Description détaillée
- **Délai de paiement** : Nombre de jours

#### Exécution
- **Délai d'exécution** : Planning prévu
- **Pénalités de retard** : Formule applicable
- **Conditions de réception** : Modalités de validation
- **Lieux d'exécution** : Localisation des prestations

---

### 2. Clauses spécifiques (selon type de marché)

#### Pour les marchés TIC/TMA 💻
8 zones de texte éditables :
1. **Propriété intellectuelle** : Cession des droits, connaissances antérieures
2. **Confidentialité** : Obligations, interdictions
3. **Sécurité et RGPD** : ISO 27001, conformité RGPD
4. **Réversibilité** : Transfert de compétences, codes sources
5. **Garantie technique** : Absence virus, malwares
6. **Bons de commande** : Modalités d'émission
7. **Sous-traitance** : Conditions et paiement direct
8. **Engagements RSE** : Conventions OIT, environnement
9. **Éthique** : Loyauté, conformité

#### Pour les marchés Travaux 🏗️
4 zones de texte éditables :
1. **Garantie décennale**
2. **Garantie biennale**
3. **Parfait achèvement**
4. **Assurances** (RC, décennale)

#### Pour les marchés Maintenance/Services 🔧
4 zones de texte éditables :
1. **SLA** (Service Level Agreement)
2. **Astreinte** 24/7
3. **Maintenance préventive**
4. **Maintenance curative**

---

### 3. Sections du CCAP (20 sections pré-remplies)

**Interface accordéon** pour chaque section :

```
┌─────────────────────────────────────────────────────┐
│ ▼  1. Objet du marché              Section 1    [🗑️] │
├─────────────────────────────────────────────────────┤
│ Contenu                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Le présent marché a pour objet la Tierce-      │ │
│ │ Maintenance Applicative (TMA) comprenant :     │ │
│ │ - Maintenance corrective (correction anomalies)│ │
│ │ - Maintenance évolutive (nouvelles fonctions)  │ │
│ │ ...                                            │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ▶  2. Durée et reconduction        Section 2    [🗑️] │
└─────────────────────────────────────────────────────┘
(cliquer pour déplier)
```

#### Actions disponibles

##### ▼ / ▶ Déplier/Replier
- Clic sur l'icône ou n'importe où dans l'en-tête
- Par défaut : **3 premières sections dépliées**

##### ✏️ Modifier le titre
- Clic dans le champ titre
- Édition directe en ligne
- Exemple : "1. Objet du marché" → "1. Description des prestations"

##### ✏️ Modifier le contenu
- Section dépliée → Grande zone de texte visible
- Édition complète du texte
- Possibilité de **tout supprimer** ou **tout réécrire**
- Hauteur minimum : 120px (auto-ajustable)

##### 🗑️ Supprimer une section
- Clic sur l'icône poubelle (rouge)
- Confirmation : "Supprimer cette section ?"
- Suppression immédiate

##### ➕ Ajouter une section
- Bouton "Ajouter une section" en haut à droite
- Nouvelle section créée avec :
  - Titre : "Nouvelle section"
  - Contenu : vide
- Section ajoutée en fin de liste

---

## 📋 Les 20 sections pré-remplies (type TIC)

Lors de la sélection du type **TIC 💻**, le template génère :

1. **Objet du marché** (description TMA : corrective, évolutive, support)
2. **Durée et reconduction** (24 mois + reconductions max 48 mois)
3. **Lieux d'exécution** (mixte : 1j/sem client + télétravail)
4. **Prix et révision** (SYNTEC, plafond 3%)
5. **Bons de commande** (système FINA, annulation 7j)
6. **Réception et contrôle** (mensuelle/formelle, 15j validation)
7. **Facturation et paiement** (Chorus Pro, 30j, BCE+8)
8. **Propriété intellectuelle** (cession exclusive, connaissances antérieures)
9. **Confidentialité et sécurité** (RGPD, ISO 27001, virus)
10. **Réversibilité** (période transitoire 3 mois)
11. **Obligations du titulaire** (résultat, collaboration, conformité)
12. **Langue d'exécution** (français obligatoire)
13. **Responsabilité et assurances** (RC, attestation 15j)
14. **Sous-traitance** (rang 1, paiement direct ≥600€)
15. **Pénalités** (KPI : disponibilité, délais, qualité)
16. **Évaluation annuelle** (Achats + DSI, plan actions)
17. **Engagement responsable RSE** (OIT, environnement)
18. **Résiliation** (conditions CCP, mise en demeure)
19. **Litiges** (amiable 1 mois, TA Montreuil)
20. **Dérogations au CCAG-TIC** (articles modifiés)

---

## 🔧 Cas d'usage pratiques

### Scénario 1 : Modifier une section existante

**Objectif** : Modifier la section "4. Prix et révision"

1. Faire défiler jusqu'à "4. Prix et révision"
2. Cliquer sur **▶** pour déplier (si replié)
3. Cliquer dans la zone de texte "Contenu"
4. **Modifier** le texte :
   ```
   Prix forfaitaires et unitaires fermes année 1.
   Révision annuelle à partir de l'année 2 selon formule SYNTEC + TP01.
   Si augmentation > 5%/an, possibilité de négociation.
   Bordereau prix révisé transmis 2 mois avant date anniversaire.
   ```
5. Les modifications sont **automatiquement prises en compte**
6. Cliquer **"Enregistrer la section"** en haut pour sauvegarder

### Scénario 2 : Supprimer une section non pertinente

**Objectif** : Supprimer la section "17. Engagement responsable RSE"

1. Trouver la section "17. Engagement responsable RSE"
2. Cliquer sur l'icône **🗑️** (rouge) à droite
3. Confirmer : "Supprimer cette section ?"
4. La section disparaît immédiatement
5. Les sections suivantes sont renumérotées automatiquement

### Scénario 3 : Ajouter une nouvelle section

**Objectif** : Ajouter une section "21. Formation des utilisateurs"

1. Cliquer sur **"➕ Ajouter une section"** en haut à droite
2. Une nouvelle section apparaît en bas avec :
   - Titre : "Nouvelle section"
   - Contenu : vide
3. Modifier le titre : "21. Formation des utilisateurs"
4. Ajouter le contenu :
   ```
   Le titulaire s'engage à former les utilisateurs finaux dans le cadre
   de chaque mise en production de nouvelles fonctionnalités.
   
   Les formations peuvent être :
   - En présentiel dans les locaux du client
   - En distanciel via visioconférence
   - Via des vidéos tutorielles
   
   Durée minimale : 1 jour par mise en production.
   ```
5. Cliquer **"Enregistrer la section"** pour sauvegarder

### Scénario 4 : Enrichir une section

**Objectif** : Ajouter des détails à "9. Confidentialité et sécurité"

1. Déplier la section "9. Confidentialité et sécurité"
2. Cliquer à la fin du texte existant
3. Ajouter :
   ```
   
   Audit de sécurité annuel :
   Le titulaire s'engage à réaliser un audit de sécurité (pentest)
   au minimum une fois par an, aux frais du titulaire.
   
   Notification des incidents :
   Toute violation de données doit être notifiée au client sous 24h.
   ```
4. Enregistrer

### Scénario 5 : Réécrire complètement une section

**Objectif** : Réécrire la section "6. Réception et contrôle"

1. Déplier la section "6. Réception et contrôle"
2. **Sélectionner tout le texte** (Ctrl+A dans la zone)
3. **Supprimer** (touche Suppr)
4. **Saisir le nouveau texte** :
   ```
   Les prestations sont soumises à recette selon les modalités suivantes :
   
   Recette de maintenance corrective :
   - Validation mensuelle lors du comité de pilotage
   - Compte-rendu d'activité présenté par le titulaire
   - Délai de validation : 10 jours ouvrés
   
   Recette de maintenance évolutive :
   - Recette formelle avec procès-verbal
   - Tests de validation sur site de recette
   - Recette définitive, provisoire avec réserves, ou refus
   
   En cas de refus, le titulaire dispose de 5 jours ouvrés pour
   corriger les anomalies et représenter les livrables.
   ```
5. Enregistrer

---

## 💾 Sauvegarde

### Bouton "Enregistrer la section"
- Position : **En haut du formulaire** (sticky)
- Action : Sauvegarde **toutes les modifications** (pas seulement une section)
- États :
  - Normal : "Enregistrer la section" (bleu)
  - En cours : "Enregistrement..." (grisé)
  - Succès : Message vert "CCAP enregistré avec succès" (3 secondes)

### Auto-sauvegarde
⚠️ **Attention** : Il n'y a **pas d'auto-sauvegarde**
- Pensez à cliquer **"Enregistrer la section"** régulièrement
- Les modifications non sauvegardées sont **perdues** si vous quittez la page

---

## 📄 Export Word

### Bouton "Exporter en Word"
- Position : **Dans le header** du composant CCAP (à côté du badge type)
- Couleur : **Vert** avec icône 📥
- Action :
  1. Génère un document Word (`.docx`)
  2. Inclut **toutes les sections** avec leur contenu actuel
  3. Télécharge le fichier : `CCAP_{numeroProcedure}_{date}.docx`

### Contenu du document exporté
- Titre : "CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES"
- Type de marché (ex: "Type de marché : TIC")
- Objet du marché
- **Article 1** : Dispositions générales
- **Article 2** : Prix et paiement
- **Article 3** : Exécution
- **Article 4** : Clauses spécifiques (si présentes)
- **Article 5** : Dispositions complémentaires (les 20 sections)

---

## ✨ Astuces d'utilisation

### 🎯 Organiser les sections

**Replier les sections non modifiées** :
- Cliquez sur **▼** pour replier
- Gardez dépliées uniquement celles en cours d'édition
- Gain de lisibilité et navigation plus rapide

**Utiliser le compteur** :
- "Sections du CCAP (20)" indique le nombre total
- Utile pour vérifier qu'aucune section n'a été supprimée par erreur

### ✏️ Édition efficace

**Copier-coller** :
- Vous pouvez copier du texte depuis Word/PDF
- Le coller dans une section
- Puis éditer/adapter

**Recherche dans la page** :
- Ctrl+F (ou Cmd+F) pour chercher un mot-clé
- Exemple : chercher "RGPD" pour trouver toutes les mentions

**Numérotation automatique** :
- Les sections sont numérotées automatiquement (1, 2, 3...)
- Pas besoin de renuméroter après suppression

### 🚀 Workflow recommandé

1. **Sélectionner le type** (TIC, Travaux, etc.)
   → Template pré-rempli avec 20 sections

2. **Parcourir toutes les sections**
   → Vérifier le contenu pré-rempli

3. **Modifier les sections pertinentes**
   → Adapter au contexte de votre marché

4. **Supprimer les sections inutiles**
   → Alléger le document

5. **Ajouter des sections spécifiques**
   → Si besoin particulier

6. **Enregistrer régulièrement**
   → Éviter les pertes de données

7. **Exporter en Word**
   → Document finalisé prêt à signer

---

## ⚠️ Points d'attention

### Limites techniques

**Longueur du contenu** :
- Pas de limite technique
- Mais pour la lisibilité, privilégier des paragraphes courts
- Utiliser plusieurs sections plutôt qu'une très longue

**Caractères spéciaux** :
- Les retours à la ligne sont conservés
- Les tabulations sont transformées en espaces
- Les caractères accentués sont supportés

**Performance** :
- Si > 50 sections, le formulaire peut ralentir
- Recommandation : max 30 sections pour fluidité

### Bonnes pratiques

**Nommage des sections** :
- Utiliser une numérotation (1., 2., 3...)
- Titres courts et explicites
- Exemple : "8. Propriété intellectuelle" plutôt que "Article 8 relatif aux dispositions concernant la propriété intellectuelle et les droits d'auteur"

**Structuration du contenu** :
- Paragraphes courts (3-5 lignes)
- Sauts de ligne entre les paragraphes
- Listes à puces si plusieurs points

**Conformité réglementaire** :
- Vérifier que les sections obligatoires sont présentes :
  - Objet du marché
  - Durée
  - Prix et paiement
  - Conditions d'exécution
  - Propriété intellectuelle (TIC)
  - Résiliation
  - Litiges

---

## 🆘 Dépannage

### Problème : "Mes modifications ne sont pas sauvegardées"

**Solution** :
- Vérifier que vous avez cliqué sur **"Enregistrer la section"**
- Attendre le message de confirmation vert
- Si erreur : vérifier la connexion internet

### Problème : "Une section a disparu"

**Solution** :
- Vérifier qu'elle n'est pas **repliée** (▶)
- Faire défiler vers le bas, peut-être en fin de liste
- Si vraiment supprimée : recharger la page (perte des modifications non sauvegardées)

### Problème : "Le formulaire est lent"

**Solution** :
- Replier toutes les sections sauf celle en cours d'édition
- Réduire le nombre de sections (supprimer les inutiles)
- Vider le cache du navigateur

### Problème : "Je ne trouve pas une clause spécifique"

**Solution** :
- Utiliser Ctrl+F pour chercher un mot-clé
- Vérifier dans les **Clauses spécifiques** (selon type marché)
- Sinon, créer une nouvelle section dédiée

---

## 📚 Exemples de personnalisation

### Exemple 1 : Marché TMA court terme

**Modifications** :
- Section 2 : Durée → "12 mois, non reconductible"
- Supprimer section 10 : Réversibilité (pas nécessaire)
- Section 4 : Prix → "Révision mensuelle selon indice INSEE"

### Exemple 2 : Marché TMA avec astreinte 24/7

**Ajouts** :
- Nouvelle section : "21. Astreinte et interventions urgentes"
  ```
  Le titulaire assure une astreinte 24h/24, 7j/7 pour les interventions urgentes.
  
  Délais d'intervention :
  - Critique (production arrêtée) : 1h max
  - Majeure (dégradation service) : 4h max
  - Mineure : 24h max
  
  Moyens de contact : téléphone portable dédié + email
  Pénalités : 500€ par heure de retard
  ```

### Exemple 3 : Marché TMA avec clause COVID-19

**Ajout** :
- Nouvelle section : "22. Continuité de service en cas de crise sanitaire"
  ```
  En cas de nouvelle crise sanitaire (type COVID-19), le titulaire s'engage à :
  - Maintenir le service à 100% en télétravail
  - Fournir un plan de continuité d'activité (PCA) sous 48h
  - Doubler les sauvegardes de données
  - Reporting quotidien au client
  ```

---

**Version** : 1.0.25  
**Dernière mise à jour** : 24 janvier 2026
