# 📝 Placeholders pour le Template Word

## Instructions

1. **Ouvrez le fichier** : `/public/templates/25006_RP_Rapport de présentation.docx`
2. **Remplacez les valeurs** par les placeholders ci-dessous (format `{VARIABLE}`)
3. **Sauvegardez** le fichier modifié
4. **Le module** remplira automatiquement toutes les valeurs !

---

## 📋 SECTION 1 : CONTEXTE

```
Objet du marché : {OBJET_MARCHE}
Durée du marché : {DUREE_MARCHE} mois
Description des prestations : {DESCRIPTION_PRESTATIONS}
```

---

## 📋 SECTION 2 : DÉROULEMENT DE LA PROCÉDURE

```
Date de publication : {DATE_PUBLICATION}
Nombre de retraits du DCE : {NOMBRE_RETRAITS}
Date de réception des offres : {DATE_RECEPTION_OFFRES}
Nombre de plis reçus : {NOMBRE_PLIS_RECUS}
Nombre de plis hors délai : {NOMBRE_HORS_DELAI}
Date d'ouverture des plis : {DATE_OUVERTURE_PLIS}
Support de procédure : {SUPPORT_PROCEDURE}
```

---

## 📋 SECTION 3 : DOSSIER DE CONSULTATION

*Liste des documents - pour l'instant géré manuellement ou via boucle complexe*

---

## 📋 SECTION 4 : QUESTIONS-RÉPONSES

```
Nombre de questions : {NOMBRE_QUESTIONS}

(Pour afficher la liste des Q&R, utiliser une boucle :)
{#QUESTIONS}
Q : {QUESTION}
R : {REPONSE}
{/QUESTIONS}
```

---

## 📋 SECTION 5 : ANALYSE DES CANDIDATURES

```
Nombre total de candidatures : {NOMBRE_TOTAL_CANDIDATURES}
Nombre de candidatures recevables : {NOMBRE_RECEVABLES}
Nombre de candidatures irrégulières : {NOMBRE_IRREGULIERES}
Nombre de candidatures inacceptables : {NOMBRE_INACCEPTABLES}
```

---

## 📋 SECTION 6 : MÉTHODOLOGIE D'ANALYSE

```
Critères d'attribution :
- Valeur économique : {PONDERATION_ECO}%
- Valeur technique : {PONDERATION_TECH}%

Détail des sous-critères techniques :
{#CRITERES_DETAILS}
- {NOM} : {POINTS} points
{/CRITERES_DETAILS}
```

---

## 📋 SECTION 7 : ANALYSE DE LA VALEUR DES OFFRES

**Tableau des offres** (utiliser une boucle dans un tableau Word) :

```
{#OFFRES}
| {RAISON_SOCIALE} | {RANG_FINAL} | {NOTE_FINALE} | {RANG_FINANCIER} | {NOTE_FINANCIERE} | {RANG_TECHNIQUE} | {NOTE_TECHNIQUE} | {MONTANT_TTC} |
{/OFFRES}
```

**Comparaison avec la Note d'Opportunité** :

```
Montant estimé (NO) : {MONTANT_ESTIME_TTC} TTC
Montant de l'offre retenue : {MONTANT_ATTRIBUTAIRE_TTC} TTC
Écart : {ECART_ABSOLU} € ({ECART_POURCENT}%)
```

---

## 📋 SECTION 8 : ANALYSE DE LA PERFORMANCE

```
Performance d'achat : {PERFORMANCE_ACHAT}%
Économie réalisée : {ECONOMIE_REALISEE} €
```

---

## 📋 SECTION 9 : PROPOSITION D'ATTRIBUTION

```
Prestataire pressenti : {PRESTATAIRE_PRESSENTI}
Montant TTC de l'offre retenue : {MONTANT_RETENU_TTC}
```

---

## 📋 SECTION 10 : CALENDRIER PRÉVISIONNEL

```
Date de notification prévisionnelle : {DATE_NOTIFICATION}
Date de démarrage prévisionnelle : {DATE_DEMARRAGE}
```

---

## 💡 NOTES IMPORTANTES

### Boucles pour listes/tableaux

Pour afficher des listes répétées (questions, offres, critères), utilisez cette syntaxe :

```
{#NOM_DE_LA_LISTE}
  ... contenu qui se répète ...
  {VARIABLE_1}, {VARIABLE_2}
{/NOM_DE_LA_LISTE}
```

### Conditions

Pour afficher du contenu conditionnel :

```
{#SI_CONDITION}
  Ce texte s'affiche seulement si la condition est vraie
{/SI_CONDITION}
```

### Format des valeurs

- **Montants** : Seront automatiquement formatés en `123 456,78 €`
- **Dates** : Format `JJ/MM/AAAA`
- **Pourcentages** : Format `12,34%`

---

## 🔧 Étape suivante

Une fois les placeholders ajoutés dans le template Word :
1. Sauvegardez le fichier
2. Informez-moi que c'est fait
3. J'adapterai le code pour remplir automatiquement le template lors de l'export !
