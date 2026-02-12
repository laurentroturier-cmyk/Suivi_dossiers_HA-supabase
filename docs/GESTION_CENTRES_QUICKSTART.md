# 🚀 Quick Start - Module Gestion Centres

Module admin pour l'import et l'analyse de données financières multi-régions.

## ⚡ Installation en 3 étapes

### 1️⃣ Configuration Supabase (5 min)

```bash
# 1. Ouvrir l'éditeur SQL dans Supabase
# 2. Copier-coller le contenu de supabase-gestion-centres.sql
# 3. Exécuter le script
```

Le script crée :
- ✅ 2 tables avec RLS
- ✅ 1 vue pour reporting
- ✅ 2 fonctions utilitaires
- ✅ Politiques de sécurité admin/user

### 2️⃣ Vérification (1 min)

```sql
-- Vérifier que les tables existent
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('centres_donnees_financieres', 'imports_fichiers_centres');

-- Résultat attendu : 2 lignes
```

### 3️⃣ Utilisation (Immédiat)

1. Se connecter en tant qu'**admin**
2. Aller dans **Dashboard Admin**
3. Cliquer sur **"Gestion Centres"** (icône Building2)
4. Uploader vos fichiers Excel

## 📁 Format des fichiers Excel

```
Nom du fichier → Région
├── Onglet 1 → Centre 1
│   └── Colonnes : 2019 | 2020 | 2021 | 2022 | 2023 | 2024
├── Onglet 2 → Centre 2
│   └── ...
└── Onglet N → Centre N
```

**Lignes attendues** :
- Nombre de repas
- Dont repas stagiaires
- Dont repas salariés
- Autres repas
- Produits d'activités
- Charges directes
- Marges (EBE, coûts complets, etc.)

## 🎯 Fonctionnalités

| Onglet | Description |
|--------|-------------|
| **Import Fichiers** | Upload multiple (max 13 fichiers) |
| **Données** | Tableau avec filtres et export Excel |
| **Statistiques** | Vue agrégée par région |
| **Historique** | Suivi des imports |

## 🔒 Sécurité

- ✅ **Accès exclusif** : Admins uniquement
- ✅ **RLS actif** : Politiques Supabase
- ✅ **Lecture seule** : Users peuvent consulter

## 📊 Exemple d'utilisation

```typescript
// 1. Sélectionner 13 fichiers Excel
const files = [
  'AURA - ANNECY.xlsx',
  'BRETAGNE - RENNES.xlsx',
  // ... 11 autres régions
];

// 2. Uploader via l'interface
// → Parsing automatique
// → Insertion en base
// → Notification de succès

// 3. Consulter les données
// → Filtrer par région/centre/année
// → Exporter en Excel
```

## 🐛 Problèmes courants

### "Permission denied"
→ Vérifier que l'utilisateur est admin :
```sql
SELECT role FROM profiles WHERE email = 'votre.email@example.com';
```

### "Aucune donnée trouvée"
→ Vérifier le format Excel :
- Années en colonnes (2019, 2020, etc.)
- Libellés des lignes présents

### Import lent
→ Importer par lots de 3-4 fichiers

## 📚 Documentation complète

Voir [MODULE_GESTION_CENTRES.md](./MODULE_GESTION_CENTRES.md) pour :
- Architecture détaillée
- Structure des tables SQL
- Mapping des données
- API et fonctions
- Maintenance et évolutions

## ✅ Checklist

- [ ] Script SQL exécuté dans Supabase
- [ ] Tables créées et visibles
- [ ] Compte admin configuré
- [ ] Test d'import avec 1 fichier
- [ ] Données visibles dans le tableau
- [ ] Export Excel fonctionnel

---

**Temps total d'installation** : ~10 minutes  
**Prérequis** : Supabase configuré + Compte admin
