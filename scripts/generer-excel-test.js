/**
 * Script de génération d'un fichier Excel de test
 * pour le module Gestion Centres
 * 
 * Usage: node scripts/generer-excel-test.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const REGIONS = [
  'AURA - ANNECY',
  'BRETAGNE - RENNES',
  'ILE-DE-FRANCE - PARIS'
];

const CENTRES_PAR_REGION = {
  'AURA - ANNECY': ['GRN 166', 'Centre Annecy Sud', 'Annecy Nord'],
  'BRETAGNE - RENNES': ['GRN 245', 'Centre Rennes Ouest'],
  'ILE-DE-FRANCE - PARIS': ['GRN 301', 'Paris 15e', 'Paris 19e', 'Versailles']
};

const ANNEES = [2019, 2020, 2021, 2022, 2023, 2024];

const LIGNES_DONNEES = [
  'Nombre de repas',
  'Dont repas stagiaires',
  'Dont repas salariés',
  'Autres repas (invités, entreprises ...)',
  "Produits d'activités",
  'Dont collectivité territoriales, subvention et AP',
  'Charges directes',
  'Dont énergie et fluides',
  'Dont charges de personnel',
  'Marge sur coûts directs - EBE',
  'Dotations aux amortissements',
  'Charges structures',
  'Total charges',
  'Marge sur coûts complets',
  'Prestataire'
];

// Fonction pour générer des données aléatoires réalistes
function genererValeur(ligne, annee) {
  const baseAnnee = 2019;
  const tendance = (annee - baseAnnee) * 0.05; // 5% par an
  
  if (ligne === 'Prestataire') {
    return 'GRN ' + Math.floor(Math.random() * 300 + 100);
  }
  
  if (ligne === 'Nombre de repas') {
    return Math.floor(5000 + Math.random() * 10000) * (1 + tendance);
  }
  
  if (ligne.startsWith('Dont repas')) {
    return Math.floor(1000 + Math.random() * 5000) * (1 + tendance);
  }
  
  if (ligne.startsWith('Autres repas')) {
    return Math.floor(500 + Math.random() * 3000) * (1 + tendance);
  }
  
  if (ligne.includes('Produits')) {
    return Math.floor(50000 + Math.random() * 100000) * (1 + tendance);
  }
  
  if (ligne.includes('Charges') || ligne.includes('charges')) {
    return -Math.floor(30000 + Math.random() * 150000) * (1 + tendance);
  }
  
  if (ligne.includes('Marge')) {
    return Math.floor(-50000 + Math.random() * 100000) * (1 + tendance);
  }
  
  if (ligne.includes('Dotations')) {
    return -Math.floor(5000 + Math.random() * 20000) * (1 + tendance);
  }
  
  return 0;
}

// Fonction pour créer un onglet avec données
function creerOnglet(nomCentre) {
  const data = [];
  
  // Ligne d'en-tête avec les années
  const headerRow = ['', ...ANNEES];
  data.push(headerRow);
  
  // Lignes de données
  LIGNES_DONNEES.forEach(ligne => {
    const row = [ligne];
    ANNEES.forEach(annee => {
      const valeur = genererValeur(ligne, annee);
      row.push(ligne === 'Prestataire' ? valeur : Math.round(valeur));
    });
    data.push(row);
  });
  
  return data;
}

// Fonction principale
function genererFichiersTest() {
  const outputDir = path.join(__dirname, '..', 'test-data', 'centres');
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('📊 Génération des fichiers Excel de test...\n');
  
  REGIONS.forEach(region => {
    const workbook = XLSX.utils.book_new();
    const centres = CENTRES_PAR_REGION[region] || [region];
    
    centres.forEach(centre => {
      const data = creerOnglet(centre);
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      
      // Ajuster la largeur des colonnes
      worksheet['!cols'] = [
        { wch: 45 }, // Première colonne (libellés)
        ...ANNEES.map(() => ({ wch: 12 })) // Colonnes années
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, centre);
    });
    
    const filename = `${region}.xlsx`;
    const filepath = path.join(outputDir, filename);
    XLSX.writeFile(workbook, filepath);
    
    console.log(`✅ ${filename}`);
    console.log(`   → ${centres.length} centre(s)`);
    console.log(`   → ${ANNEES.length} années`);
    console.log(`   → ${LIGNES_DONNEES.length} lignes de données\n`);
  });
  
  console.log('🎉 Génération terminée !');
  console.log(`📁 Fichiers créés dans : ${outputDir}`);
  console.log(`\n💡 Utilisez ces fichiers pour tester le module Gestion Centres`);
}

// Exécution
if (require.main === module) {
  try {
    genererFichiersTest();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

module.exports = { genererFichiersTest };
