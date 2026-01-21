# ⚡ RAPPORT ↔ DCE - Aide-mémoire 1 page

## 🎯 En 3 étapes

```
1️⃣ DCE Complet → Section "6. Contenu du DCE" → Sauvegarder

2️⃣ Rapport Présentation → Sélectionner procédure → Paragraphe 3

3️⃣ Cliquer "📋 Charger depuis DCE" → ✅ Fait !
```

---

## 🔗 Connexion

```
Table 'dce'                    Rapport Présentation
   │                                  │
   │ numero_procedure: "25001"        │ NumProc: "25001"
   │                                  │
   │ reglement_consultation: {        │
   │   dce: {                         │
   │     documents: [...]   ──────────┼──► Paragraphe 3
   │   }                              │     (auto-rempli)
   │ }                                │
   └──────────────────────────────────┘
```

---

## 📋 Bouton

```
┌─────────────────────────────────┐
│  [📋 Charger depuis DCE]        │  ← Bouton teal
└─────────────────────────────────┘
         ↓ Clic
┌─────────────────────────────────┐
│  [⏳ Chargement...]              │  ← Pendant
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  Description du DCE et des      │
│  documents fournis :            │
│                                 │
│  1. RC                          │
│  2. AE                          │  ← Auto-rempli
│  3. BPU                         │
│  4. CCAP                        │
│  ...                            │
└─────────────────────────────────┘
         ↓
┌─────────────────────────────────┐
│  ✓ Données chargées depuis le   │  ← Badge
│    DCE (Procédure 25001)        │
└─────────────────────────────────┘
```

---

## ⚠️ Erreurs

| Message | Solution |
|---------|----------|
| "Aucune procédure" | Sélectionner d'abord |
| "DCE introuvable" | Créer le DCE |
| "RC vide" | Remplir section 6 |

---

## 💡 Astuce

**Gain de temps** : 5 min → 5 sec (98%)

---

## 📚 Docs

- [Guide Utilisateur](GUIDE_UTILISATEUR_RAPPORT_DCE.md) - Mode d'emploi
- [Quick Start](RAPPORT_DCE_QUICKSTART.md) - 30 secondes
- [Doc Technique](RAPPORT_DCE_CONNEXION.md) - Pour devs
- [Index](INDEX_RAPPORT_DCE.md) - Tous les docs

---

**v1.0.15** | 21/01/2026
