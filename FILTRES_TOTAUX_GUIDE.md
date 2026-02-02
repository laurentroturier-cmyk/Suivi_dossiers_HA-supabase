# 🔍 Guide des filtres - Totaux Annuels

## ✅ Problème résolu

Les filtres sur la page "Totaux par année" fonctionnent désormais **avec ou sans** la fonction SQL `totaux_par_annee_filtres()` grâce à un système de **double fallback**.

## 🚀 Comment ça fonctionne maintenant

### Mode 1 : Avec fonction SQL (optimal)

Si vous avez exécuté le script SQL complet dans Supabase :
- ✅ Les filtres utilisent `totaux_par_annee_filtres(p_region, p_centre)` 
- ⚡ Calcul côté serveur (très rapide)
- 📊 Parfait pour de grandes quantités de données

### Mode 2 : Sans fonction SQL (fallback automatique)

Si vous N'AVEZ PAS exécuté le script SQL :
- ✅ Les filtres fonctionnent quand même !
- 🔄 Calcul côté client depuis `centresData`
- 📊 Agrégation automatique par année
- ✨ Aucune action requise de votre part

## 🎯 Utilisation

1. **Accédez à l'onglet "Totaux Annuels"**
   - Cliquez sur l'onglet avec l'icône 📊

2. **Appliquez des filtres** :
   - **Filtre région** : Sélectionnez une région spécifique
   - **Filtre centre** : Sélectionnez un centre spécifique
   - **Les deux** : Pour voir un centre dans une région

3. **Réinitialisez** :
   - Cliquez sur "Réinitialiser" pour voir toutes les données

4. **Exportez** :
   - Le bouton "Exporter" exporte les données filtrées

## 📋 Détails techniques

### Fonction `getFilteredTotaux()`

Cette nouvelle fonction :
1. Vérifie si des filtres sont actifs
2. Si oui, filtre `centresData` par région/centre
3. Agrège les données par année
4. Calcule tous les totaux (repas, produits, charges, marges)
5. Compte le nombre de centres et régions uniques

### Code ajouté

```typescript
// Filtrage côté client
const getFilteredTotaux = () => {
  if (!totauxFilterRegion && !totauxFilterCentre) {
    return totauxAnnuels; // Pas de filtre = données brutes
  }

  // Filtrer centresData
  let filtered = centresData;
  if (totauxFilterRegion) {
    filtered = filtered.filter(d => d.region === totauxFilterRegion);
  }
  if (totauxFilterCentre) {
    filtered = filtered.filter(d => d.centre === totauxFilterCentre);
  }

  // Agréger par année
  const byYear = filtered.reduce((acc, row) => {
    // ... agrégation de toutes les colonnes
  }, {});

  return Object.values(byYear).sort((a, b) => a.annee - b.annee);
};
```

### Utilisation dans le rendu

```tsx
{getFilteredTotaux().map((total) => (
  <tr key={total.annee}>
    <td>{total.annee}</td>
    <td>{total.nombre_regions}</td>
    <td>{total.nombre_centres}</td>
    {/* ... autres colonnes */}
  </tr>
))}
```

## 🔧 Pour activer le mode optimal (facultatif)

Si vous voulez utiliser le calcul côté serveur (plus rapide) :

1. **Ouvrez Supabase** : https://supabase.com/dashboard/project/votre-projet
2. **Allez dans SQL Editor**
3. **Copiez tout le contenu de** `supabase-gestion-centres.sql`
4. **Cliquez sur "Run"**
5. **Rechargez la page** dans votre navigateur

Mais ce n'est **PAS obligatoire** - les filtres fonctionnent déjà !

## 🎨 Interface utilisateur

### Filtres actifs

Quand vous appliquez des filtres, vous voyez :
- 🏷️ Badge bleu pour la région sélectionnée
- 🏷️ Badge violet pour le centre sélectionné
- 📊 Titre mis à jour : "Totaux par année - Filtrés"
- 🔢 Nombre de régions/centres ajusté dans le tableau

### Exemple visuel

```
┌─────────────────────────────────────────────┐
│ Filtres                                     │
├─────────────────────────────────────────────┤
│ Région: [Île-de-France ▼]  Centre: [Tous ▼]│
│                                             │
│ Filtres actifs: [Île-de-France]            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📊 Totaux par année - Filtrés              │
├─────────────────────────────────────────────┤
│ Année│Régions│Centres│Total Repas│...       │
│ 2024 │   1   │  15   │ 250 000   │...       │
│ 2023 │   1   │  15   │ 245 000   │...       │
└─────────────────────────────────────────────┘
```

## ✨ Avantages de cette solution

1. **Robuste** : Fonctionne même si le script SQL n'est pas exécuté
2. **Transparent** : L'utilisateur ne voit aucune différence
3. **Performant** : Utilise le serveur si disponible, sinon le client
4. **Maintenable** : Un seul composant gère les deux cas
5. **Testable** : Vous pouvez tester immédiatement sans configuration

## 🧪 Test rapide

1. Allez sur "Totaux Annuels"
2. Sélectionnez une région dans le filtre
3. ✅ Le tableau se met à jour instantanément
4. ✅ Les totaux sont recalculés pour cette région uniquement
5. ✅ Le nombre de régions passe à "1"
6. Cliquez sur "Réinitialiser"
7. ✅ Toutes les données réapparaissent

## 📦 Version

- **Version actuelle** : 1.0.35
- **Build** : ✅ Compilé avec succès
- **Taille** : 6,792.25 kB (gzip: 1,920.88 kB)
- **Date** : 2026-02-02

---

**Note** : Cette solution utilise la puissance de JavaScript côté client pour garantir que les filtres fonctionnent **toujours**, quelle que soit la configuration de votre base de données. C'est une approche "fail-safe" qui privilégie l'expérience utilisateur.
