# 🚀 Test Auto-Fill Règlement de Consultation

## ✅ Fonctionnalité implémentée

Le module RC charge maintenant **automatiquement** les données depuis la table Supabase `procédures` dès que vous saisissez un numéro de procédure à 5 chiffres.

## 🧪 Test rapide

### Étape 1 : Accéder au module
1. Ouvrir **http://localhost:3001/**
2. Cliquer sur **Rédaction** → **Règlement de consultation**

### Étape 2 : Tester l'auto-fill
1. Dans la section **En-tête**
2. Saisir les **5 premiers chiffres** d'un "Numéro de procédure (Afpa)" existant dans Supabase
3. **Automatique** : Dès le 5ème chiffre, le système charge les données

### Étape 3 : Vérifier le résultat

**✅ Si la procédure existe** :
- Message vert : "✅ Données chargées depuis la procédure XXXXX"
- Formulaire pré-rempli avec :
  - Titre du marché
  - N° de marché complet
  - Dates (offres, questions, réponses)
  - Type de marché
  - Mode de passation
  - Nombre de lots
  - CPV principal
  - Durée, etc.

**❌ Si la procédure n'existe pas** :
- Message rouge : "Aucune procédure trouvée avec le numéro court XXXXX"
- Formulaire reste vide
- Possibilité de remplir manuellement

## 📋 Champs pré-remplis automatiquement

Une fois le numéro saisi, vérifiez ces champs :

### Section En-tête
- ✅ N° de marché (complet, ex: 12345_01_FO-FORM_001)
- ✅ Titre du marché
- ✅ Type de marché (Fournitures/Services, Travaux, etc.)
- ✅ Date limite offres
- ✅ Date limite questions (J-10 calculé)
- ✅ Date limite réponses (J-7 calculé)

### Section Objet
- ✅ Description (objet court + nom procédure)
- ✅ Code CPV principal

### Section Conditions
- ✅ Mode de passation (appel d'offres ouvert, restreint, etc.)
- ✅ Nombre de lots

### Section Type de marché
- ✅ Forme (accord-cadre, bons de commande, etc.)
- ✅ Durée initiale (en mois)

### Section Remise
- ✅ Délai validité des offres (en jours)

## 🔄 Bouton Recharger

Si vous avez déjà saisi un numéro à 5 chiffres, un **bouton bleu avec icône 🔄** apparaît.

**Utilité** :
- Recharger les données si elles ont été mises à jour dans Supabase
- Réinitialiser le formulaire avec les données de base
- Vérifier les dernières modifications

## 💡 Exemple concret

### Cas d'utilisation

**Données dans Supabase** :
```
Table: procédures
Numéro de procédure (Afpa): 24567_02_IT-MAT_003
Nom de la procédure: Fourniture de matériel informatique
Type de procédure: Appel d'offres ouvert
Forme du marché: Accord-cadre mono-attributaire
Date de remise des offres: 2026-04-15
Nombre de lots: 2
Code CPV Principal: 30200000-1
Durée du marché (en mois): 24
```

**Test** :
1. Saisir : `24567`
2. Résultat immédiat :
   - ✅ Message de succès
   - Titre : "Fourniture de matériel informatique"
   - N° marché : "24567_02_IT-MAT_003"
   - Date offres : 15/04/2026
   - Date questions : 05/04/2026
   - Date réponses : 08/04/2026
   - Mode : "Appel d'offres ouvert"
   - Forme : "Accord-cadre mono-attributaire"
   - Lots : "2"
   - CPV : "30200000-1"
   - Durée : "24" mois

## ⚠️ Points d'attention

### Données à compléter manuellement

Même avec l'auto-fill, certains champs nécessitent une saisie manuelle :

1. **Heure limite offres** (ex: 12:00)
2. **Libellé CPV** (seul le code est récupéré)
3. **CPV secondaires** (liste complète)
4. **Détail des lots** (n°, intitulé, montant max)
5. **Sous-critères techniques** (Organisation, Plan déploiement, etc.)
6. **Coordonnées contact** (téléphone, courriel si différent)

### Vérification recommandée

Après l'auto-fill, parcourez **toutes les sections** pour :
- Vérifier la cohérence des données
- Compléter les champs manquants
- Ajuster si nécessaire

## 🐛 Problèmes courants

### "Aucune procédure trouvée"

**Vérifier** :
1. Le numéro existe-t-il dans la table `procédures` ?
2. Le champ "Numéro de procédure (Afpa)" contient-il bien ces 5 chiffres ?
3. Êtes-vous authentifié ? (vérifier le badge User/Admin)

**Solution** :
- Aller dans l'onglet **Procédures** de l'application
- Vérifier le numéro exact
- Ou créer la procédure si elle n'existe pas

### Spinner qui tourne en boucle

**Causes** :
- Problème de connexion Supabase
- RLS bloquant l'accès

**Solution** :
1. Ouvrir la console (F12)
2. Vérifier les erreurs dans l'onglet Console
3. Se déconnecter/reconnecter si nécessaire
4. Relancer `npm run dev`

### Données incohérentes

**Vérifier** :
- Les données dans Supabase sont complètes
- Les formats de dates sont corrects
- Les valeurs ne sont pas nulles

**Solution** :
- Mettre à jour la procédure dans Supabase
- Utiliser le bouton 🔄 Recharger

## 📊 Mapping des champs

**Document complet** : Voir [PROCEDURE_LINK.md](./PROCEDURE_LINK.md)

**Résumé** :
- 11+ champs mappés directement
- 2 dates calculées (questions/réponses)
- 3 transformations intelligentes (type, mode, forme)
- **Total : ~17 champs automatiques**

## ✨ Workflow complet

```
1. Saisir numéro procédure (5 chiffres)
   ↓
2. Auto-fill immédiat
   ↓
3. Vérifier les données chargées
   ↓
4. Compléter les champs manquants
   ↓
5. Naviguer entre les sections
   ↓
6. Prévisualiser (optionnel)
   ↓
7. Sauvegarder (localStorage)
   ↓
8. Télécharger Word
```

## 🎯 Checklist de test

- [ ] Numéro de procédure existant → ✅ Succès
- [ ] Numéro inexistant → ❌ Erreur claire
- [ ] Bouton Recharger fonctionne
- [ ] Toutes les sections sont pré-remplies
- [ ] Dates calculées correctement (J-10, J-7)
- [ ] Type de marché adapté (Travaux, Services, etc.)
- [ ] Mode de passation correct
- [ ] Forme du marché correcte
- [ ] Prévisualisation affiche les données
- [ ] Génération Word inclut les données
- [ ] Sauvegarde/Chargement fonctionne
- [ ] Messages de succès/erreur s'affichent
- [ ] Messages disparaissent après quelques secondes

---

**Version testée** : 1.0.6  
**Statut** : ✅ Fonctionnel  
**Application** : http://localhost:3001/
