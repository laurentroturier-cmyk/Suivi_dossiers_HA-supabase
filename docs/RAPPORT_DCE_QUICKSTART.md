# 🚀 Quick Start - Connexion Rapport ↔ DCE

## En 30 secondes

### 1️⃣ Créer le DCE
```
DCE Complet → Numéro procédure: 25001 
→ Section "6. Contenu du DCE" 
→ Liste documents (RC, AE, CCAP...)
→ Sauvegarder
```

### 2️⃣ Charger dans le Rapport
```
Rapport Présentation → Procédure: 25001
→ Paragraphe 3 "DOSSIER DE CONSULTATION"
→ Bouton [📋 Charger depuis DCE]
→ ✅ Auto-rempli !
```

---

## Schéma Ultra-Rapide

```
DCE (table 'dce')               Rapport Présentation
   │                                    │
   │ numero_procedure: "25001"          │ NumProc: "25001"
   │                                    │
   │ reglement_consultation:            │
   │ {                                  │
   │   dce: {                           │
   │     documents: [                   │ ──────────────►
   │       "RC",                         │   Bouton
   │       "AE",                         │   "Charger"
   │       "CCAP"...                     │
   │     ]                              │
   │   }                                │ Paragraphe 3:
   │ }                                  │ "1. RC
   │                                    │  2. AE
   │                                    │  3. CCAP..."
   └────────────────────────────────────┘
```

---

## Test Rapide

1. **Vérifier** qu'un DCE existe pour la procédure
   ```sql
   SELECT numero_procedure, reglement_consultation->'dce'->'documents' 
   FROM dce 
   WHERE numero_procedure = '25001';
   ```

2. **Cliquer** sur "Charger depuis DCE"

3. **Résultat attendu** :
   - ✅ Textarea rempli automatiquement
   - ✅ Badge vert "Données chargées depuis le DCE"
   - ✅ Alert "Données du DCE chargées avec succès"

---

## Erreurs courantes

| Message | Solution |
|---------|----------|
| "Aucun DCE trouvé" | Créer le DCE d'abord dans DCE Complet |
| "RC n'a pas été rempli" | Compléter la section 6 du RC |
| "Pas de liste de documents" | Ajouter des documents dans dce.documents[] |

---

## Doc complète

👉 [RAPPORT_DCE_CONNEXION.md](RAPPORT_DCE_CONNEXION.md)
