import * as XLSX from 'xlsx';

/**
 * Génère un fichier Excel template pour l'import de données
 * Ce fichier peut être téléchargé et rempli par les utilisateurs
 */

export const generateProjectsTemplate = () => {
  // En-têtes pour la table projets
  const headers = [
    'IDProjet',
    'Acheteur',
    'Famille Achat Principale',
    'Numéro de procédure (Afpa)',
    'Prescripteur',
    'Client Interne',
    'Statut du Dossier',
    'Programme',
    'Opération',
    'Levier Achat',
    'Renouvellement de marché',
    'Date de lancement de la consultation',
    'Date de déploiement prévisionnelle du marché',
    'Perf achat prévisionnelle (en %)',
    'Montant prévisionnel du marché (€ HT)',
    'Origine du montant pour le calcul de l\'économie',
    'Priorité',
    'Commission Achat',
    'NO - Type de validation',
    'NO - MSA',
    'NO - Date validation MSA',
    'Sur 12 mois économie achat prévisionnelle (€)',
    'Forme du marché',
    'NO - Date prévisionnelle CA ou Commission',
    'NO - Date validation CODIR',
    'NO - Date envoi signature électronique',
    'NO - Date de validation du document',
    'Nom des valideurs',
    'NO - Statut',
    'Objet court',
    'Type de procédure',
    'CCAG',
    'NO - Commentaire',
    'Nombre de lots',
    'Lots réservés',
    'Support de procédure',
    'Référence procédure (plateforme)',
    'Nombre de retraits',
    'Nombre de soumissionnaires',
    'Nombre de questions',
    'Dispo sociales',
    'Dispo environnementales',
    'Projet ouvert à l\'acquisition de solutions innovantes',
    'Projet facilitant l\'accès aux TPE/PME',
    'Date d\'écriture du DCE',
    'Date de remise des offres',
    'Date d\'ouverture des offres',
    'Date des Rejets',
    'Avis d\'attribution',
    'Données essentielles',
    'Finalité de la consultation',
    'Statut de la consultation',
    'Délai de traitement (calcul)',
    'RP - Date validation MSA',
    'RP - Date envoi signature élec',
    'RP - Date de validation du document',
    'RP -  Date validation CODIR',
    '1 Sourcing Date de début',
    '3 DCE (rédaction) Date de début',
    'RP - Commentaire',
    '2 Opportunité Date de début',
    'RP - Statut',
    '5 Analyse date de début',
    '4 Consultation date de début',
    'Planification O/N',
    'Motivation non allotissement',
    'Date limite étude stratégie avec client interne',
    'Nom de la procédure',
    'Durée du marché (en mois)',
    'Date d\'échéance du marché',
    '6 Attribution Date de début',
    '7 Exécution Date de début',
    'Durée de validité des offres (en jours)',
    'Date de remise des offres finales',
    'Date de validité des offres (calculée)',
    'Date de Notification',
    'Code CPV Principal',
    'Commentaire général sur le projet',
    'Archivage (Statut)',
    'Modifié par',
    'Titre du dossier',
    'Old_ID Consult',
    'Old_ID Projet',
    'Durée de publication',
    'Date de remise des candidatures',
    'NANO',
    'Acheteur.mail',
    'A_importer',
    'Id projet à indiquer',
    'Id consult à indiquer',
    'Intermediaire 2',
    'Intermediaire 1',
    'Finalité_a_importer'
  ];

  // Lignes d'exemple
  const exampleRows = [
    [
      'PROJ001',
      'Jean Dupont',
      'Informatique',
      'PROC2024-001',
      'Direction IT',
      'Service Achats',
      'En cours',
      'Digital',
      'Opération 2024',
      'Consolidation',
      'Oui',
      '2024-01-15',
      '2024-06-01',
      '15',
      '50000',
      'Budget prévisionnel',
      'Haute',
      'Commission Achat 2024',
      'Type A',
      'MSA-001',
      '2024-01-10',
      '7500',
      'Accord-cadre',
      '2024-03-15',
      '2024-02-20',
      '2024-02-01',
      '2024-02-15',
      'Jean Dupont, Marie Martin',
      'Validé',
      'Système de gestion documentaire',
      'Appel d\'offres ouvert',
      'CCAG-TIC',
      'Projet prioritaire',
      '3',
      'Lot 1',
      'Plateforme AWS',
      'AWS-2024-001',
      '12',
      '8',
      '5',
      'Oui',
      'Oui',
      'Non',
      'Oui',
      '2024-01-05',
      '2024-02-28',
      '2024-03-01',
      '2024-03-05',
      'Publié',
      'Oui',
      'Amélioration des processus',
      'Lancée',
      '45',
      '2024-01-12',
      '2024-02-05',
      '2024-02-18',
      '2024-02-25',
      '2023-12-01',
      '2024-01-08',
      'Conforme aux attentes',
      '2023-11-15',
      'En attente',
      '2024-02-20',
      '2024-02-15',
      'Oui',
      'Économies attendues',
      '2024-01-20',
      'Système de Gestion Documentaire GED',
      '24',
      '2026-01-15',
      '2024-03-10',
      '2024-06-15',
      '60',
      '2024-03-01',
      '2024-04-30',
      '2024-03-15',
      '48000000-3',
      'Projet stratégique pour la digitalisation',
      'Actif',
      'Admin',
      'GED - Gestion Électronique des Documents',
      'CONS001',
      'PROJ001',
      '30',
      '2024-02-15',
      'Non',
      'jean.dupont@example.com',
      'Oui',
      'PROJ001',
      'CONS001',
      'Service IT',
      'Direction Achats',
      'Amélioration'
    ],
    [
      'PROJ002',
      'Marie Martin',
      'Travaux',
      'PROC2024-002',
      'Direction Immobilier',
      'Service Technique',
      'Planifié',
      'Infrastructure',
      'Opération 2024',
      'Innovation',
      'Non',
      '2024-03-01',
      '2024-09-01',
      '20',
      '120000',
      'Étude de marché',
      'Moyenne',
      'Commission Achat 2024',
      'Type B',
      'MSA-002',
      '2024-02-25',
      '24000',
      'Marché public',
      '2024-05-15',
      '2024-04-10',
      '2024-03-20',
      '2024-04-01',
      'Marie Martin',
      'En cours',
      'Rénovation énergétique',
      'Procédure adaptée',
      'CCAG-Travaux',
      'Projet environnemental',
      '1',
      '',
      'Plateforme Nationale',
      'PN-2024-002',
      '8',
      '5',
      '3',
      'Non',
      'Oui',
      'Oui',
      'Non',
      '2024-02-15',
      '2024-04-30',
      '2024-05-05',
      '',
      'Publié',
      'Oui',
      'Transition énergétique',
      'Planifiée',
      '60',
      '2024-02-28',
      '2024-03-25',
      '2024-04-05',
      '2024-04-20',
      '2024-01-10',
      '2024-02-20',
      'Projet d\'envergure',
      '2024-01-05',
      'Planifié',
      '2024-04-25',
      '2024-04-20',
      'Oui',
      'Respect des normes environnementales',
      '2024-03-10',
      'Rénovation énergétique - Bâtiment A',
      '36',
      '2027-03-01',
      '2024-05-20',
      '2024-09-15',
      '90',
      '2024-05-10',
      '2024-08-08',
      '2024-05-25',
      '45000000-7',
      'Amélioration de l\'efficacité énergétique',
      'Actif',
      'Admin',
      'Rénovation Énergétique Bâtiment A',
      'CONS002',
      'PROJ002',
      '45',
      '2024-04-15',
      'Non',
      'marie.martin@example.com',
      'Oui',
      'PROJ002',
      'CONS002',
      'Bureau d\'études',
      'Direction Immobilier',
      'Économie'
    ]
  ];

  // Créer le workbook
  const wb = XLSX.utils.book_new();
  
  // Créer la feuille avec en-têtes et exemples
  const wsData = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Définir la largeur des colonnes
  ws['!cols'] = headers.map(() => ({ wch: 25 }));

  // Ajouter la feuille au workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Projets');

  // Créer une feuille d'instructions
  const instructionsData = [
    ['INSTRUCTIONS D\'UTILISATION'],
    [''],
    ['1. Remplissez la feuille "Projets" avec vos données'],
    ['2. Conservez les en-têtes de colonnes tels quels (ne pas modifier)'],
    ['3. Les deux premières lignes sont des exemples, vous pouvez les supprimer'],
    ['4. Formats de dates : AAAA-MM-JJ (ex: 2024-01-15)'],
    ['5. Formats de nombres : utilisez des nombres sans séparateur de milliers'],
    ['6. Laissez vide les colonnes non applicables'],
    ['7. Pour les champs Oui/Non : utilisez "Oui" ou "Non"'],
    [''],
    ['COLONNES OBLIGATOIRES :'],
    ['- IDProjet : Identifiant unique du projet'],
    ['- Acheteur : Nom de l\'acheteur'],
    ['- Statut du Dossier : Statut actuel'],
    [''],
    ['COLONNES RECOMMANDÉES :'],
    ['- Numéro de procédure (Afpa)'],
    ['- Date de lancement de la consultation'],
    ['- Montant prévisionnel du marché (€ HT)'],
    ['- Objet court'],
    [''],
    ['APRÈS REMPLISSAGE :'],
    ['1. Sauvegardez le fichier Excel'],
    ['2. Dans l\'application, allez dans Dashboard > Import de données'],
    ['3. Sélectionnez "Projets"'],
    ['4. Chargez ce fichier'],
    ['5. Vérifiez l\'aperçu'],
    ['6. Cliquez sur "Importer dans Supabase"']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return wb;
};

export const generateProceduresTemplate = () => {
  const headers = [
    'Numéro de procédure (Afpa)',
    'Nom de la procédure',
    'Type de procédure',
    'Statut de la consultation',
    'Date de lancement de la consultation',
    'Date de remise des offres',
    'Objet court'
  ];

  const exampleRows = [
    [
      'PROC2024-001',
      'Système de Gestion Documentaire',
      'Appel d\'offres ouvert',
      'Lancée',
      '2024-01-15',
      '2024-02-28',
      'GED pour la digitalisation'
    ],
    [
      'PROC2024-002',
      'Rénovation énergétique',
      'Procédure adaptée',
      'Planifiée',
      '2024-03-01',
      '2024-04-30',
      'Amélioration efficacité énergétique'
    ]
  ];

  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...exampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = headers.map(() => ({ wch: 35 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Procédures');

  // Instructions
  const instructionsData = [
    ['INSTRUCTIONS D\'UTILISATION - PROCÉDURES'],
    [''],
    ['1. Remplissez la feuille "Procédures" avec vos données'],
    ['2. Conservez les en-têtes de colonnes tels quels'],
    ['3. La première ligne est un exemple, vous pouvez la supprimer'],
    ['4. Format de date : AAAA-MM-JJ'],
    [''],
    ['COLONNES OBLIGATOIRES :'],
    ['- Numéro de procédure (Afpa) : Identifiant unique'],
    ['- Nom de la procédure'],
    ['- Type de procédure'],
    [''],
    ['IMPORT :'],
    ['1. Dashboard > Import de données'],
    ['2. Sélectionnez "Procédures"'],
    ['3. Chargez ce fichier'],
    ['4. Vérifiez et importez']
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return wb;
};

export const downloadTemplate = (type: 'projets' | 'procédures') => {
  const wb = type === 'projets' 
    ? generateProjectsTemplate() 
    : generateProceduresTemplate();
  
  const fileName = `template_${type === 'projets' ? 'projets' : 'procedures'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
