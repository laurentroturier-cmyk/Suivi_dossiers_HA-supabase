# Rapport de mise à jour NOTI5

## 📝 Résumé

Mise à jour complète du formulaire NOTI5 pour conformité avec le document officiel "MARCHÉS PUBLICS - NOTIFICATION DU MARCHÉ PUBLIC".

## ✅ Modifications effectuées

### 1. Interface TypeScript (`types/noti5.ts`)

#### Ajout de nouvelles propriétés (conforme au document officiel) :

**Section D - Notification :**
- `notification.executionImmediateChecked` : L'exécution commencera à la date de notification
- `notification.executionOrdreServiceChecked` : L'exécution commencera à réception de l'ordre de service

**Section E - Garantie :**
- `garantie.pasPrevue` : Pas de retenue de garantie
- `garantie.prevueSansAllotissement` : En l'absence d'allotissement
- `garantie.retenueGarantieSansAllotissement` : Retenue de garantie prévue
- `garantie.garantiePremiereDemandeOuCautionSansAllotissement` : Garantie à première demande ou caution
- `garantie.prevueAvecAllotissement` : En cas d'allotissement
- `garantie.montantInferieur90k` : Montant < 90 000 € HT
- `garantie.montantSuperieur90kRetenue` : Montant >= 90 000 € HT avec retenue
- `garantie.montantSuperieur90kGarantie` : Montant >= 90 000 € HT avec garantie
- `garantie.modalites` : Précisions sur les modalités

#### Rétro-compatibilité :
- Conservation des propriétés `executionPrestations` et `garanties` en tant que propriétés optionnelles
- Le système supporte à la fois l'ancienne et la nouvelle structure

### 2. Export PDF (`components/Noti5PDF.tsx`)

#### En-tête et introduction :
- ✅ Titre : "NOTIFICATION DU MARCHÉ PUBLIC"
- ✅ Texte d'introduction conforme au document officiel

#### Section A :
- ✅ Note explicative en italique : "(Reprendre le contenu...)"
- ✅ Mention "AFPA" en gras

#### Section B :
- ✅ Note explicative en italique
- ✅ Affichage du numéro de procédure en gras

#### Section C :
- ✅ Note explicative détaillée avec toutes les instructions officielles
- ✅ Champs téléphone et fax conditionnels
- ✅ Mention du mandataire du groupement

#### Section D :
- ✅ Titre complet : "Notification de l'attribution du marché public ou de l'accord-cadre"
- ✅ Note explicative avec instructions sur l'attribution
- ✅ Affichage des lots avec numéro et intitulé
- ✅ Section "Début d'exécution" avec les deux options officielles
- ✅ `wrap={false}` pour éviter les coupures de page

#### Section E :
- ✅ Titre complet : "Retenue de garantie ou garantie à première demande"
- ✅ Note explicative complète sur la retenue de garantie
- ✅ Hiérarchie des options conforme (sans allotissement / avec allotissement)
- ✅ Sous-options avec indentation (propriété `sub`)
- ✅ Affichage conditionnel des modalités
- ✅ Support de l'ancienne structure pour rétro-compatibilité
- ✅ `wrap={false}` pour éviter les coupures de page

#### Section F :
- ✅ Note explicative sur les pièces à fournir
- ✅ Formulation exacte : "2 exemplaires papier... avec mention manuscrite 'exemplaire unique'"
- ✅ "1 copie électronique (PDF)"
- ✅ `wrap={false}` pour éviter les coupures de page

#### Section G :
- ✅ Affichage séparé de `signataireNom` et `signataireTitre`
- ✅ `wrap={false}` pour éviter les coupures de page

#### Amélioration de la pagination :
- ✅ `breakInside: 'avoid'` sur tous les styles critiques :
  - `section`
  - `sectionContent`
  - `paragraph`
  - `checkboxRow`
- ✅ `breakAfter: 'avoid'` sur `sectionHeader`
- ✅ `wrap={false}` sur les sections D, E, F, G

### 3. Export HTML (`utils/noti5HtmlGenerator.ts`)

#### CSS de pagination :
- ✅ `orphans: 4` et `widows: 4` pour contrôle des lignes orphelines
- ✅ `page-break-inside: avoid` sur :
  - `.section-content`
  - `.section-group`
  - `.checkbox-item` individuels

#### Contenu :
- ✅ Section A : Note explicative et mention AFPA
- ✅ Section B : Note explicative et numéro de procédure
- ✅ Section C : Note explicative complète
- ✅ Section D : 
  - Titre complet officiel
  - Note explicative
  - Options d'exécution conformes
- ✅ Section E :
  - Note explicative officielle
  - Structure hiérarchique conforme
  - Sous-options indentées (`.checkbox-item-indented`)
  - Support rétro-compatibilité
- ✅ Section F : Notes explicatives et formulation exacte
- ✅ Section G : `signataireNom` et `signataireTitre` séparés

#### Rétro-compatibilité HTML :
- ✅ Gestion de `data.notification?.executionImmediateChecked || data.executionPrestations?.type === 'immediate'`
- ✅ Gestion de `data.garantie?.pasPrevue || data.garanties?.aucuneGarantie`
- ✅ Affichage conditionnel de l'ancienne structure de garantie

## 🔄 Rétro-compatibilité

Le système est **entièrement rétro-compatible** :

### Nouveaux champs prioritaires
Si `data.garantie` et `data.notification.executionImmediateChecked` existent, ils sont utilisés en priorité.

### Anciens champs en fallback
Si les nouveaux champs ne sont pas définis, le système utilise automatiquement :
- `data.executionPrestations.type` pour la section D
- `data.garanties.aucuneGarantie` et `data.garanties.retenue` pour la section E

### Affichage conditionnel
Les anciennes données de garantie sont affichées dans un bloc visuel distinct si `data.garanties.retenue.active` est vrai.

## 📋 Checklist de conformité

- ✅ Interface TypeScript mise à jour avec nouveaux champs
- ✅ Export PDF conforme au document officiel
- ✅ Export HTML conforme au document officiel
- ✅ Pagination améliorée (pas de paragraphes coupés)
- ✅ Rétro-compatibilité assurée
- ✅ Notes explicatives en italique
- ✅ Formulations exactes du document officiel
- ✅ Hiérarchie des options respectée
- ✅ Séparation `signataireNom` / `signataireTitre`
- ✅ `wrap={false}` sur sections critiques (D, E, F, G)
- ✅ Aucune erreur TypeScript

## 🎯 Tests recommandés

1. **Test ancien formulaire** : Vérifier qu'un NOTI5 existant (avec `executionPrestations` et `garanties`) s'affiche correctement
2. **Test nouveau formulaire** : Vérifier qu'un nouveau NOTI5 (avec `notification.executionImmediateChecked` et `garantie`) s'affiche correctement
3. **Test pagination PDF** : Vérifier qu'aucune section ne se coupe sur 2 pages
4. **Test pagination HTML** : Imprimer en PDF depuis HTML et vérifier la pagination

## 📚 Fichiers modifiés

1. `/components/redaction/types/noti5.ts` - Interface TypeScript
2. `/components/redaction/components/Noti5PDF.tsx` - Export PDF React
3. `/components/redaction/utils/noti5HtmlGenerator.ts` - Export HTML

## ⚠️ Note importante

Le composant `/components/redaction/components/NOTI5Section.tsx` (formulaire de saisie) utilise encore l'ancienne structure `executionPrestations` et `garanties`. Pour une mise à jour complète, il faudrait également modifier ce composant pour utiliser les nouveaux champs `notification.executionImmediateChecked` et `garantie.*`.

Actuellement, la rétro-compatibilité permet au système de fonctionner avec les deux structures.

---

**Date de mise à jour** : ${new Date().toLocaleDateString('fr-FR')}
**Conformité** : Document officiel NOTI5 - Marchés Publics
