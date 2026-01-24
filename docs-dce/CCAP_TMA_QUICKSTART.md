# 🎯 CCAP TMA/TIC - Quick Start

## ✅ Implémentation terminée

### 📦 Fichiers créés/modifiés

1. **Types enrichis** : [types/index.ts](../components/dce-complet/types/index.ts)
   - Ajout `clausesSpecifiques` (TIC, Travaux, Maintenance, Services)
   - Nouveaux champs : `periodeTransitoire`, `formuleRevision`, `lieuxExecution`

2. **Template TIC/TMA complet** : [ccapTemplates.ts](../components/dce-complet/modules/ccapTemplates.ts)
   - 20 sections pré-remplies conformes CCAP AFPA
   - Toutes clauses modifiables

3. **Export Word** : [ccapExportWord.ts](../components/dce-complet/modules/ccapExportWord.ts)
   - Génération .docx structuré
   - Utilise bibliothèque `docx` v9.5.1

4. **Formulaire enrichi** : [CCAPForm.tsx](../components/dce-complet/modules/CCAPForm.tsx)
   - Tous champs éditables
   - Sections conditionnelles selon type

5. **Composant principal** : [CCAPMultiLots.tsx](../components/dce-complet/modules/CCAPMultiLots.tsx)
   - Bouton "Exporter en Word" ajouté
   - Prop `numeroProcedure` pour nom fichier

6. **Documentation** : [CCAP_TMA_TIC_README.md](./CCAP_TMA_TIC_README.md)
   - Guide complet 300+ lignes
   - Tous articles détaillés

---

## 🚀 Utilisation

### 1. Créer un CCAP TIC/TMA

```tsx
import { CCAPMultiLots } from './components/dce-complet/modules/CCAPMultiLots';

<CCAPMultiLots
  procedureId="proc-123"
  numeroProcedure="25006"  // Pour nom fichier Word
  onSave={async (data) => {
    // Sauvegarder dans Supabase
    await supabase.from('dce').update({ ccap: data })...
  }}
  initialData={existingCCAP}  // Si modification
/>
```

### 2. Workflow utilisateur

1. **Sélection type** : Clic carte "TIC 💻"
2. **Édition** : Modifier formulaire (tous champs éditables)
3. **Sauvegarde** : Clic "Enregistrer la section"
4. **Export Word** : Clic "Exporter en Word" → Téléchargement `CCAP_25006_2026-01-24.docx`

---

## 📋 Contenu du template TIC

### Dispositions générales
- Objet : Prestations de Tierce-Maintenance Applicative (TMA)
- CCAG-TIC (arrêté 30 mars 2021)
- Durée : 24 mois + reconductions (max 48 mois)
- Période transitoire : 3 mois

### Prix et paiement
- Type : Forfaitaire + Unitaire
- Révision : Annuelle SYNTEC
- Délai : 30 jours

### 20 sections pré-remplies
1. Objet du marché
2. Durée et reconduction
3. Lieux d'exécution (mixte : 1j/sem client + télétravail)
4. Prix et révision (formule SYNTEC)
5. Bons de commande (FINA)
6. Réception et contrôle
7. Facturation et paiement (Chorus Pro)
8. Propriété intellectuelle (cession exclusive)
9. Confidentialité et sécurité (ISO 27001, RGPD)
10. Réversibilité (période transitoire)
11. Obligations du titulaire
12. Langue d'exécution (français obligatoire)
13. Responsabilité et assurances
14. Sous-traitance (rang 1 souhaité)
15. Pénalités (KPI CCTP)
16. Évaluation annuelle
17. Engagement responsable RSE (OIT)
18. Résiliation
19. Litiges (TA Montreuil)
20. Dérogations au CCAG-TIC

---

## 🎨 Interface

### Boutons
- **"Changer de type"** : Retour sélecteur (confirmation si données)
- **"Enregistrer la section"** : Sauvegarde Supabase
- **"Exporter en Word"** (vert) : Génération .docx

### Badge type
```
Type actuel : 💻 TIC
```

### Message succès
```
✅ CCAP enregistré avec succès
✅ CCAP exporté au format Word avec succès
```

---

## ✨ Clauses spécifiques TIC (éditables)

- ✏️ **Propriété intellectuelle** : Cession droits, connaissances antérieures
- ✏️ **Confidentialité** : Obligations, interdictions publication
- ✏️ **Sécurité et RGPD** : ISO 27001, RGPD, absence virus
- ✏️ **Réversibilité** : Transfert compétences, codes sources
- ✏️ **Garantie technique** : Absence malwares
- ✏️ **Bons de commande** : Modalités FINA
- ✏️ **Sous-traitance** : Conditions, paiement direct
- ✏️ **Engagements RSE** : OIT, environnement
- ✏️ **Éthique** : Loyauté, conformité

---

## 📄 Format du document Word exporté

```
╔════════════════════════════════════════════╗
║ CAHIER DES CLAUSES ADMINISTRATIVES         ║
║          PARTICULIÈRES                     ║
║                                            ║
║ Type de marché : TIC                       ║
║ Prestations de Tierce-Maintenance...       ║
╚════════════════════════════════════════════╝

ARTICLE 1 - DISPOSITIONS GÉNÉRALES
  1.1 Objet du marché : ...
  1.2 CCAG applicable : CCAG-TIC...
  1.3 Durée : 24 mois
  1.4 Reconduction : Oui - 2 fois 12 mois
  1.5 Période transitoire : 3 mois

ARTICLE 2 - PRIX ET MODALITÉS DE PAIEMENT
  2.1 Type de prix : forfaitaire
  2.2 Révision des prix : Oui
  2.3 Formule de révision : PR = P₀ × (Sy / S₀)
  ...

ARTICLE 3 - CONDITIONS D'EXÉCUTION
  ...

ARTICLE 4 - CLAUSES SPÉCIFIQUES
  4.1 Propriété intellectuelle
  4.2 Confidentialité
  4.3 Sécurité et RGPD
  ...

ARTICLE 5 - DISPOSITIONS COMPLÉMENTAIRES
  1. Objet du marché
  ...
  20. Dérogations au CCAG-TIC
```

---

## ✅ Conformité réglementaire

- ✅ CCAG-TIC arrêté 30/03/2021
- ✅ Code de la commande publique
- ✅ RGPD (UE 2016/679)
- ✅ ISO 27001
- ✅ Conventions OIT (C29, C105, C138, C182, C111)

---

## 📚 Documentation complète

Voir [CCAP_TMA_TIC_README.md](./CCAP_TMA_TIC_README.md) (300+ lignes) pour :
- Structure détaillée des 20 articles
- Exemples de personnalisation
- Tests et validation
- Références réglementaires
- Évolutions futures

---

**Version** : 1.0.25  
**Compilé sans erreurs** : ✅  
**Tests** : À effectuer sur environnement dev
