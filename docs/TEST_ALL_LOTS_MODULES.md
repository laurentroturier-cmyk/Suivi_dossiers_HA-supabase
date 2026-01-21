# Test rapide - Tous les modules multi-lots

## ✅ Tables créées

- ✅ `actes_engagement`
- ✅ `cctps`
- ✅ `ccaps`
- ✅ `bpus`
- ✅ `dqes`
- ✅ `dpgfs`

## 🧪 Tests à faire

### 1. Test Acte d'Engagement
- [ ] Créer lot 1
- [ ] Sauvegarder des données
- [ ] Créer lot 2
- [ ] Vérifier navigation

### 2. Test CCTP
- [ ] Aller dans DCE Complet > CCTP
- [ ] Vérifier que le LotSelector s'affiche
- [ ] Créer un lot et sauvegarder

### 3. Test CCAP
- [ ] Aller dans DCE Complet > CCAP
- [ ] Créer un lot

### 4. Test BPU
- [ ] Aller dans DCE Complet > BPU
- [ ] Créer un lot

### 5. Test DQE
- [ ] Aller dans DCE Complet > DQE
- [ ] Créer un lot

### 6. Test DPGF
- [ ] Aller dans DCE Complet > DPGF
- [ ] Créer un lot

## 🔍 Vérification rapide en SQL

```sql
-- Voir toutes les tables créées
SELECT 
  tablename, 
  schemaname
FROM pg_tables 
WHERE tablename IN ('actes_engagement', 'cctps', 'ccaps', 'bpus', 'dqes', 'dpgfs')
ORDER BY tablename;

-- Compter les lots par module pour une procédure
SELECT 
  'AE' as module, COUNT(*) as nb_lots FROM actes_engagement WHERE procedure_id = '25091'
UNION ALL
SELECT 'CCTP', COUNT(*) FROM cctps WHERE procedure_id = '25091'
UNION ALL
SELECT 'CCAP', COUNT(*) FROM ccaps WHERE procedure_id = '25091'
UNION ALL
SELECT 'BPU', COUNT(*) FROM bpus WHERE procedure_id = '25091'
UNION ALL
SELECT 'DQE', COUNT(*) FROM dqes WHERE procedure_id = '25091'
UNION ALL
SELECT 'DPGF', COUNT(*) FROM dpgfs WHERE procedure_id = '25091';
```

## 🎯 Navigation dans l'app

1. Ouvrir http://localhost:3000
2. Se connecter
3. Aller sur **DCE Complet**
4. Sélectionner une procédure (ex: 25091)
5. Tester chaque onglet dans le menu latéral gauche

**Tous les modules sauf RC devraient avoir le LotSelector en haut !**
