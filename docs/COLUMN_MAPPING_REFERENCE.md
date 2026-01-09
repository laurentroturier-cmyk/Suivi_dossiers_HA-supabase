# Mapping des Colonnes - Référence Technique

## 📊 Table : projets

### Colonnes Excel → Supabase

| # | Colonne Excel | Colonne Supabase | Type | Obligatoire |
|---|---------------|------------------|------|-------------|
| 1 | IDProjet | id_projet | TEXT | ✅ |
| 2 | Acheteur | acheteur | TEXT | ✅ |
| 3 | Famille Achat Principale | famille_achat_principale | TEXT | ❌ |
| 4 | Numéro de procédure (Afpa) | numero_procedure_afpa | TEXT | ⭐ |
| 5 | Prescripteur | prescripteur | TEXT | ❌ |
| 6 | Client Interne | client_interne | TEXT | ❌ |
| 7 | Statut du Dossier | statut_dossier | TEXT | ✅ |
| 8 | Programme | programme | TEXT | ❌ |
| 9 | Opération | operation | TEXT | ❌ |
| 10 | Levier Achat | levier_achat | TEXT | ❌ |
| 11 | Renouvellement de marché | renouvellement_marche | TEXT | ❌ |
| 12 | Date de lancement de la consultation | date_lancement_consultation | DATE | ⭐ |
| 13 | Date de déploiement prévisionnelle du marché | date_deploiement_previsionnelle | DATE | ❌ |
| 14 | Perf achat prévisionnelle (en %) | perf_achat_previsionnelle | NUMERIC(10,2) | ❌ |
| 15 | Montant prévisionnel du marché (€ HT) | montant_previsionnel_marche | NUMERIC(15,2) | ⭐ |
| 16 | Origine du montant pour le calcul de l'économie | origine_montant_economie | TEXT | ❌ |
| 17 | Priorité | priorite | TEXT | ❌ |
| 18 | Commission Achat | commission_achat | TEXT | ❌ |
| 19 | NO - Type de validation | no_type_validation | TEXT | ❌ |
| 20 | NO - MSA | no_msa | TEXT | ❌ |
| 21 | NO - Date validation MSA | no_date_validation_msa | DATE | ❌ |
| 22 | Sur 12 mois économie achat prévisionnelle (€) | economie_achat_previsionnelle_12mois | NUMERIC(15,2) | ❌ |
| 23 | Forme du marché | forme_marche | TEXT | ❌ |
| 24 | NO - Date prévisionnelle CA ou Commission | no_date_previsionnelle_ca | DATE | ❌ |
| 25 | NO - Date validation CODIR | no_date_validation_codir | DATE | ❌ |
| 26 | NO - Date envoi signature électronique | no_date_envoi_signature_electronique | DATE | ❌ |
| 27 | NO - Date de validation du document | no_date_validation_document | DATE | ❌ |
| 28 | Nom des valideurs | nom_valideurs | TEXT | ❌ |
| 29 | NO - Statut | no_statut | TEXT | ❌ |
| 30 | Objet court | objet_court | TEXT | ⭐ |
| 31 | Type de procédure | type_procedure | TEXT | ❌ |
| 32 | CCAG | ccag | TEXT | ❌ |
| 33 | NO - Commentaire | no_commentaire | TEXT | ❌ |
| 34 | Nombre de lots | nombre_lots | INTEGER | ❌ |
| 35 | Lots réservés | lots_reserves | TEXT | ❌ |
| 36 | Support de procédure | support_procedure | TEXT | ❌ |
| 37 | Référence procédure (plateforme) | reference_procedure_plateforme | TEXT | ❌ |
| 38 | Nombre de retraits | nombre_retraits | INTEGER | ❌ |
| 39 | Nombre de soumissionnaires | nombre_soumissionnaires | INTEGER | ❌ |
| 40 | Nombre de questions | nombre_questions | INTEGER | ❌ |
| 41 | Dispo sociales | dispo_sociales | TEXT | ❌ |
| 42 | Dispo environnementales | dispo_environnementales | TEXT | ❌ |
| 43 | Projet ouvert à l'acquisition de solutions innovantes | projet_solutions_innovantes | TEXT | ❌ |
| 44 | Projet facilitant l'accès aux TPE/PME | projet_acces_tpe_pme | TEXT | ❌ |
| 45 | Date d'écriture du DCE | date_ecriture_dce | DATE | ❌ |
| 46 | Date de remise des offres | date_remise_offres | DATE | ❌ |
| 47 | Date d'ouverture des offres | date_ouverture_offres | DATE | ❌ |
| 48 | Date des Rejets | date_rejets | DATE | ❌ |
| 49 | Avis d'attribution | avis_attribution | TEXT | ❌ |
| 50 | Données essentielles | donnees_essentielles | TEXT | ❌ |
| 51 | Finalité de la consultation | finalite_consultation | TEXT | ❌ |
| 52 | Statut de la consultation | statut_consultation | TEXT | ❌ |
| 53 | Délai de traitement (calcul) | delai_traitement_calcul | INTEGER | ❌ |
| 54 | RP - Date validation MSA | rp_date_validation_msa | DATE | ❌ |
| 55 | RP - Date envoi signature élec | rp_date_envoi_signature_elec | DATE | ❌ |
| 56 | RP - Date de validation du document | rp_date_validation_document | DATE | ❌ |
| 57 | RP - Date validation CODIR | rp_date_validation_codir | DATE | ❌ |
| 58 | 1 Sourcing Date de début | sourcing_date_debut | DATE | ❌ |
| 59 | 3 DCE (rédaction) Date de début | dce_redaction_date_debut | DATE | ❌ |
| 60 | RP - Commentaire | rp_commentaire | TEXT | ❌ |
| 61 | 2 Opportunité Date de début | opportunite_date_debut | DATE | ❌ |
| 62 | RP - Statut | rp_statut | TEXT | ❌ |
| 63 | 5 Analyse date de début | analyse_date_debut | DATE | ❌ |
| 64 | 4 Consultation date de début | consultation_date_debut | DATE | ❌ |
| 65 | Planification O/N | planification_on | TEXT | ❌ |
| 66 | Motivation non allotissement | motivation_non_allotissement | TEXT | ❌ |
| 67 | Date limite étude stratégie avec client interne | date_limite_etude_strategie | DATE | ❌ |
| 68 | Nom de la procédure | nom_procedure | TEXT | ❌ |
| 69 | Durée du marché (en mois) | duree_marche_mois | INTEGER | ❌ |
| 70 | Date d'échéance du marché | date_echeance_marche | DATE | ❌ |
| 71 | 6 Attribution Date de début | attribution_date_debut | DATE | ❌ |
| 72 | 7 Exécution Date de début | execution_date_debut | DATE | ❌ |
| 73 | Durée de validité des offres (en jours) | duree_validite_offres_jours | INTEGER | ❌ |
| 74 | Date de remise des offres finales | date_remise_offres_finales | DATE | ❌ |
| 75 | Date de validité des offres (calculée) | date_validite_offres_calculee | DATE | ❌ |
| 76 | Date de Notification | date_notification | DATE | ❌ |
| 77 | Code CPV Principal | code_cpv_principal | TEXT | ❌ |
| 78 | Commentaire général sur le projet | commentaire_general_projet | TEXT | ❌ |
| 79 | Archivage (Statut) | archivage_statut | TEXT | ❌ |
| 80 | Modifié par | modifie_par | TEXT | ❌ |
| 81 | Titre du dossier | titre_dossier | TEXT | ❌ |
| 82 | Old_ID Consult | old_id_consult | TEXT | ❌ |
| 83 | Old_ID Projet | old_id_projet | TEXT | ❌ |
| 84 | Durée de publication | duree_publication | INTEGER | ❌ |
| 85 | Date de remise des candidatures | date_remise_candidatures | DATE | ❌ |
| 86 | NANO | nano | TEXT | ❌ |
| 87 | Acheteur.mail | acheteur_mail | TEXT | ❌ |
| 88 | A_importer | a_importer | TEXT | ❌ |
| 89 | Id projet à indiquer | id_projet_a_indiquer | TEXT | ❌ |
| 90 | Id consult à indiquer | id_consult_a_indiquer | TEXT | ❌ |
| 91 | Intermediaire 2 | intermediaire_2 | TEXT | ❌ |
| 92 | Intermediaire 1 | intermediaire_1 | TEXT | ❌ |
| 93 | Finalité_a_importer | finalite_a_importer | TEXT | ❌ |

**Légende :**
- ✅ Obligatoire (identifiant, statut)
- ⭐ Recommandé (clés métier importantes)
- ❌ Optionnel

**Total : 93 colonnes métier + 3 colonnes système (id, created_at, updated_at)**

---

## 📊 Table : procedures

### Colonnes Excel → Supabase

| # | Colonne Excel | Colonne Supabase | Type | Obligatoire |
|---|---------------|------------------|------|-------------|
| 1 | Numéro de procédure (Afpa) | numero_procedure | TEXT | ✅ UNIQUE |
| 2 | Nom de la procédure | nom_procedure | TEXT | ✅ |
| 3 | Type de procédure | type_procedure | TEXT | ✅ |
| 4 | Statut de la consultation | statut_consultation | TEXT | ❌ |
| 5 | Date de lancement de la consultation | date_lancement | DATE | ⭐ |
| 6 | Date de remise des offres | date_remise_offres | DATE | ⭐ |
| 7 | Objet court | objet_court | TEXT | ⭐ |

**Total : 7 colonnes métier + 3 colonnes système (id, created_at, updated_at)**

---

## 🔧 Colonnes système (ajoutées automatiquement)

Toutes les tables ont ces colonnes :

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique (PK) |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Date de dernière modification |

---

## 📝 Notes de mapping

### Règles de conversion automatique

Si une colonne Excel n'est pas dans le mapping prédéfini :
1. Conversion en minuscules
2. Remplacement des espaces par `_`
3. Suppression des caractères spéciaux
4. Exemple : `"Mon Champ Spécial!"` → `"mon_champ_special"`

### Formats de données

**Dates :**
- Format Excel : `AAAA-MM-JJ` ou format date Excel
- Format Supabase : `DATE`
- Exemple : `2024-01-15`

**Nombres :**
- Format Excel : nombre sans séparateur de milliers
- Format Supabase : `NUMERIC(10,2)` ou `INTEGER`
- Exemple : `50000` ou `50000.50`

**Texte :**
- Format Excel : texte libre
- Format Supabase : `TEXT`
- Caractères spéciaux acceptés

**Booléens :**
- Format Excel : `"Oui"`, `"Non"`, `"O"`, `"N"`, `true`, `false`
- Format Supabase : `TEXT` (pour compatibilité)
- Recommandation : utiliser `"Oui"` ou `"Non"`

---

## 🔍 Index créés

### Table projets

| Index | Colonne | Raison |
|-------|---------|--------|
| idx_projets_id_projet | id_projet | Recherche par ID projet |
| idx_projets_numero_procedure | numero_procedure_afpa | Recherche par numéro |
| idx_projets_statut | statut_dossier | Filtrage par statut |
| idx_projets_acheteur | acheteur | Recherche par acheteur |
| idx_projets_date_lancement | date_lancement_consultation | Tri par date |

### Table procedures

| Index | Colonne | Raison |
|-------|---------|--------|
| idx_procedures_numero | numero_procedure | Clé unique |
| idx_procedures_statut | statut_consultation | Filtrage |
| idx_procedures_projet | projet_id | Foreign key |

---

## 🎨 Exemple de fichier Excel

```
| IDProjet | Acheteur | ... | Date de lancement | Montant (€ HT) |
|----------|----------|-----|-------------------|----------------|
| PROJ001  | J. Dupont| ... | 2024-01-15        | 50000          |
| PROJ002  | M. Martin| ... | 2024-03-01        | 120000         |
```

---

**Mis à jour** : 2026-01-09  
**Version** : 1.0.0
