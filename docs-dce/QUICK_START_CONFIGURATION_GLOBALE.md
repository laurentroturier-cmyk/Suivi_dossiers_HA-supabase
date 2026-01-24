# 🎉 Nouvelle fonctionnalité : Configuration Globale

## ✨ Ce qui a été créé

Un **nouvel onglet "⚙️ Configuration Globale"** en première position du module DCE Complet qui vous permet de :

### 🎯 Saisir une seule fois
- ✅ Les **lots** (numéro, intitulé, montant)
- ✅ Les **informations générales** (acheteur, titre, type de procédure)
- ✅ Les **variables communes** (CCAG, délais, garanties)
- ✅ Les **contacts** (responsable, email, téléphone)

### 🔄 Propagation automatique vers
- 📊 **BPU** → Structure des lots
- 📊 **DQE** → Lots + montants
- 📊 **DPGF** → Lots + montants
- 📝 **Acte d'Engagement** → Liste des lots
- 📝 **CCAP** → Variables communes
- 📝 **Règlement de Consultation** → Nombre de lots

---

## 🚀 Comment l'utiliser ?

### Étape 1 : Accéder au module DCE Complet
```
Menu principal → DCE Complet
```

### Étape 2 : Saisir un numéro de procédure
```
Ex: 01234
```

### Étape 3 : Cliquer sur "⚙️ Configuration Globale"
```
Premier onglet dans le menu latéral
```

### Étape 4 : Configurer vos variables
```
1. Informations Générales (pré-remplies depuis la procédure)
2. Configuration des Lots (nombre automatique depuis procédure)
   - Compléter les intitulés
   - Saisir les montants
   - Ajouter des descriptions si besoin
3. Variables Communes (CCAG, délais, etc.)
4. Contacts (responsable, email, téléphone)
```

### Étape 5 : Sauvegarder
```
Cliquer sur "Sauvegarder" dans la barre de statut
```

### Étape 6 : Vérifier la propagation
```
Aller dans BPU, DQE, DPGF → Les lots sont déjà créés ! 🎉
```

---

## 📊 Exemple visuel

### Avant (ancien workflow)
```
┌─────────────────────────────────────┐
│  BPU                                │
│  ⬜ Saisir Lot 1                    │
│  ⬜ Saisir Lot 2                    │
│  ⬜ Saisir Lot 3                    │
│  Temps: 10 min                      │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  DQE                                │
│  ⬜ RE-saisir Lot 1                 │
│  ⬜ RE-saisir Lot 2                 │
│  ⬜ RE-saisir Lot 3                 │
│  Temps: 10 min                      │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  DPGF                               │
│  ⬜ RE-saisir Lot 1                 │
│  ⬜ RE-saisir Lot 2                 │
│  ⬜ RE-saisir Lot 3                 │
│  Temps: 10 min                      │
└─────────────────────────────────────┘

❌ Total: 30 min + risque d'erreurs
```

### Après (nouveau workflow)
```
┌─────────────────────────────────────┐
│  ⚙️ CONFIGURATION GLOBALE           │
│  ✅ Saisir Lot 1 (une fois)         │
│  ✅ Saisir Lot 2 (une fois)         │
│  ✅ Saisir Lot 3 (une fois)         │
│  Temps: 5 min                       │
└─────────────────────────────────────┘
         ↓ Propagation automatique
┌─────────────────────────────────────┐
│  BPU                                │
│  ✅ Lot 1 (créé auto)               │
│  ✅ Lot 2 (créé auto)               │
│  ✅ Lot 3 (créé auto)               │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  DQE                                │
│  ✅ Lot 1 + montant (créé auto)     │
│  ✅ Lot 2 + montant (créé auto)     │
│  ✅ Lot 3 + montant (créé auto)     │
└─────────────────────────────────────┐
│  DPGF                               │
│  ✅ Lot 1 + montant (créé auto)     │
│  ✅ Lot 2 + montant (créé auto)     │
│  ✅ Lot 3 + montant (créé auto)     │
└─────────────────────────────────────┘

✅ Total: 5 min + 0 erreurs
```

---

## 💡 Points importants

### ⚠️ Ordre recommandé
1. **D'abord** : Configurer la Configuration Globale
2. **Ensuite** : Travailler sur les autres modules

### 💾 Sauvegarde
- Les modifications sont **locales** jusqu'à ce que vous cliquiez sur "Sauvegarder"
- Un message de confirmation apparaît en bas du formulaire

### 📝 Initialisation automatique
- Le **nombre de lots** est lu depuis la procédure
- Les lots sont créés automatiquement avec un nom par défaut (`Lot 1`, `Lot 2`, etc.)
- Vous pouvez **modifier** les intitulés et montants

### ➕ Gestion des lots
- **Ajouter un lot** : Bouton "Ajouter un lot" en haut à droite
- **Supprimer un lot** : Icône poubelle sur chaque lot (minimum 1 lot requis)
- **Total automatique** : Calculé en temps réel

---

## 📋 Avant de commencer : Migration SQL

**Important** : Vous devez exécuter une migration SQL pour ajouter la colonne en base de données.

### Via l'éditeur SQL de Supabase

Copiez-collez ce script dans l'éditeur SQL :

```sql
-- Ajouter la colonne configuration_globale
ALTER TABLE public.dce
ADD COLUMN IF NOT EXISTS configuration_globale JSONB;

-- Commentaire
COMMENT ON COLUMN public.dce.configuration_globale IS 
'Variables communes du DCE : lots, informations générales, contacts';

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_dce_configuration_globale 
ON public.dce USING GIN (configuration_globale);
```

Ou exécutez le fichier complet :
```bash
sql/migration-add-configuration-globale.sql
```

---

## 📊 Gain de temps estimé

| Action | Avant | Après | Gain |
|--------|-------|-------|------|
| Créer les lots dans BPU | 10 min | 0 min | **100%** |
| Créer les lots dans DQE | 10 min | 0 min | **100%** |
| Créer les lots dans DPGF | 10 min | 0 min | **100%** |
| Saisir variables communes | 5 min | 5 min | 0% |
| **TOTAL** | **35 min** | **5 min** | **-85%** |

**Économie par DCE : 30 minutes** ⏱️

---

## 🎨 Aperçu de l'interface

```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ Configuration Globale                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ℹ️  Les informations saisies ici seront automatiquement  │
│     reprises dans : RC, AE, CCAP, CCTP, BPU, DQE, DPGF    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  📝 Informations Générales                                 │
│  ┌──────────────────────────┬──────────────────────────┐  │
│  │ Acheteur: Afpa          │ Titre: Travaux...        │  │
│  └──────────────────────────┴──────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  📦 Configuration des Lots (3 lots)    [+ Ajouter un lot] │
│  ┌────────────────────────────────────────────┐           │
│  │ 1  Lot 1 - Gros œuvre                      │  [🗑️]     │
│  │    Montant: 50 000 € HT                    │           │
│  └────────────────────────────────────────────┘           │
│  ┌────────────────────────────────────────────┐           │
│  │ 2  Lot 2 - Second œuvre                    │  [🗑️]     │
│  │    Montant: 30 000 € HT                    │           │
│  └────────────────────────────────────────────┘           │
│  ┌────────────────────────────────────────────┐           │
│  │ 3  Lot 3 - Équipements                     │  [🗑️]     │
│  │    Montant: 15 000 € HT                    │           │
│  └────────────────────────────────────────────┘           │
│                                                            │
│  Total estimatif: 95 000,00 € HT                          │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  ⚙️ Variables Communes                                     │
│  CCAG: CCAG-Travaux  |  Délai paiement: 30 jours         │
│  ☑️ Garantie financière  |  ☑️ Avance (5%)                │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  👤 Contacts                                               │
│  Responsable: Jean Dupont                                 │
│  Email: jean.dupont@afpa.fr  |  Tél: 01 23 45 67 89      │
│                                                            │
└────────────────────────────────────────────────────────────┘
│  ✅ Modifications enregistrées automatiquement            │
└────────────────────────────────────────────────────────────┘
```

---

## 🆘 Support

### Questions fréquentes

**Q : Les modules existants seront-ils mis à jour automatiquement ?**  
R : Non, pour l'instant seuls les nouveaux modules ou modules vides sont pré-remplis. Modification manuelle requise pour les modules déjà remplis.

**Q : Puis-je modifier le nombre de lots ?**  
R : Oui, vous pouvez ajouter/supprimer des lots avec les boutons prévus à cet effet.

**Q : Que se passe-t-il si je modifie un lot après avoir rempli le BPU ?**  
R : Le BPU ne sera pas automatiquement mis à jour. Il faut le modifier manuellement.

### Documentation complète

- [Guide complet Configuration Globale](./CONFIGURATION_GLOBALE_GUIDE.md)
- [Documentation technique](./IMPLEMENTATION_CONFIGURATION_GLOBALE.md)

---

**Prêt à gagner du temps ?** 🚀

1. ✅ Exécuter la migration SQL
2. ✅ Lancer l'application (`npm run dev`)
3. ✅ Tester avec une procédure réelle
4. ✅ Profiter du gain de temps !
