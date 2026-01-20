# ⚡ DCE COMPLET - DÉMARRAGE RAPIDE

## 🚀 Mise en route (5 minutes)

### 1️⃣ Créer les tables Supabase

```bash
# Copier le contenu de sql/dce-complet-schema.sql
# Aller dans Supabase → SQL Editor → Coller → Exécuter
```

OU directement :

```sql
-- Voir le fichier sql/dce-complet-schema.sql
```

### 2️⃣ Lancer l'app

```bash
npm run dev
```

### 3️⃣ Tester

1. **Connexion** → Ouvrir l'app
2. **Accueil** → Cliquer sur "**DCE Complet ✨**" (section Rédaction)
3. **Saisir** → Numéro de procédure (5 chiffres, ex: `20241`)
4. **Magie** → Le DCE est créé automatiquement ! 🎉

---

## 📋 Ce que vous verrez

### Écran 1 : Sélection
```
┌─────────────────────────────────────────┐
│  Créer ou ouvrir un DCE                 │
│                                         │
│  Numéro de procédure (5 chiffres)      │
│  ┌─────────────────────────────────┐   │
│  │ 20241                 ✓         │   │
│  └─────────────────────────────────┘   │
│  ✓ Fourniture de matériel informatique │
└─────────────────────────────────────────┘
```

### Écran 2 : Interface DCE
```
┌────────────────────────────────────────────────────────┐
│  DCE Complet                                      [X]  │
├────────────────────────────────────────────────────────┤
│  📋 20241 - Fourniture de matériel informatique       │
│  💰 50 000 € HT  |  🏢 Afpa  |  📍 75001 Paris       │
│  ━━━━━━━━━━ 25%    Brouillon    [Sauvegarder]        │
├────────┬───────────────────────────────────────────────┤
│        │                                               │
│ Menu   │  Sélectionnez une section dans le menu       │
│        │                                               │
│ ✓ RC   │  ← Données déjà pré-remplies !               │
│   AE   │                                               │
│   CCAP │                                               │
│   CCTP │                                               │
│   BPU  │                                               │
│   DQE  │                                               │
│   DPGF │                                               │
│   Docs │                                               │
│        │                                               │
└────────┴───────────────────────────────────────────────┘
```

---

## 🎯 Fonctionnalités actives

✅ **Sélecteur intelligent** : Autocomplete sur les procédures  
✅ **Auto-remplissage** : Données procédure → DCE automatique  
✅ **Barre de progression** : Suivi du % de complétion  
✅ **Sauvegarde auto** : Chaque modification est sauvée  
✅ **Navigation** : Menu latéral pour les 8 sections  
✅ **Multi-utilisateur** : Chaque user a son DCE  

---

## 🔧 Troubleshooting express

### ❌ "Procédure non trouvée"
→ Vérifier qu'une procédure existe avec ce numéro dans la table `procédures`

### ❌ "Permission denied"
→ Vérifier que les politiques RLS sont actives :
```sql
SELECT * FROM pg_policies WHERE tablename = 'dce';
```

### ❌ Pas de suggestions
→ Cliquer sur "Réessayer" dans le sélecteur pour recharger les procédures

---

## 📝 Prochaine étape

**Phase 2** : Créer les formulaires de saisie par section  
→ Voir [DCE_MODULE_IMPLEMENTATION_COMPLETE.md](DCE_MODULE_IMPLEMENTATION_COMPLETE.md)

---

**🎉 Vous êtes prêt à tester !**
