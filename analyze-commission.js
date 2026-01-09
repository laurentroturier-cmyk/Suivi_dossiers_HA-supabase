import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Polyfill fetch pour Node.js
global.fetch = fetch;

const supabaseUrl = 'https://mygdavujjkmgvvoxqfbl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15Z2RhdnVqamttZ3Z2b3hxZmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NDU2NDUsImV4cCI6MjA1MTIyMTY0NX0.k7qUPQc9_7-j0jyb5wktkHnkqE6-Ty3UQFIaNg-w4pE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeCommission() {
  console.log('🔍 Analyse des projets pour Commission HA...\n');
  
  const { data: projets, error } = await supabase
    .from('projets')
    .select('*');
  
  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }
  
  console.log(`📊 Total projets: ${projets.length}\n`);
  
  // Règle 1: Commission_Achat = "Oui"
  const rule1 = projets.filter(p => p.Commission_Achat === "Oui");
  console.log(`✅ Règle 1 - Commission_Achat = "Oui": ${rule1.length}`);
  console.log(`   Valeurs trouvées: ${[...new Set(projets.map(p => p.Commission_Achat))].join(', ')}\n`);
  
  // Règle 2: Montant > 1000000
  const rule2 = rule1.filter(p => {
    const montant = Number(p["Montant_previsionnel_du_marche_(_HT)_"]) || 0;
    return montant > 1000000;
  });
  console.log(`💰 Règle 2 - Montant > 1M€: ${rule2.length}`);
  const montants = rule1.map(p => Number(p["Montant_previsionnel_du_marche_(_HT)_"]) || 0);
  console.log(`   Montants min/max: ${Math.min(...montants)} / ${Math.max(...montants)}\n`);
  
  // Règle 3: NO - Statut ≠ "3-Validé"
  const rule3 = rule2.filter(p => p["NO_-_Statut"] !== "3-Validé");
  console.log(`📋 Règle 3 - NO Statut ≠ "3-Validé": ${rule3.length}`);
  console.log(`   Statuts trouvés: ${[...new Set(rule2.map(p => p["NO_-_Statut"]))].join(', ')}\n`);
  
  // Règle 4: Conditions complexes sur dates et statuts
  const rule4 = rule3.filter(p => {
    const dateVal = p["NO_-_Date_de_validation_du_document"];
    if (!dateVal || dateVal.trim() === "") {
      const statut = p.Statut_du_Dossier || '';
      return !statut.startsWith('4') && !statut.startsWith('5');
    }
    const numDate = Number(dateVal);
    return !(numDate > 0 && !isNaN(numDate));
  });
  console.log(`📅 Règle 4 - Conditions date/statut: ${rule4.length}`);
  console.log(`   Statuts dossier: ${[...new Set(rule3.map(p => p.Statut_du_Dossier))].join(', ')}\n`);
  
  console.log(`\n🎯 RÉSULTAT FINAL: ${rule4.length} projets affichés dans Commission HA`);
  
  if (rule4.length > 0) {
    console.log('\nDétails des projets qualifiés:');
    rule4.forEach(p => {
      console.log(`- ${p.IDProjet}: ${p.Titre_du_dossier} (${Number(p["Montant_previsionnel_du_marche_(_HT)_"])}€)`);
    });
  }
  
  // Diagnostique les blocages
  console.log('\n🔬 DIAGNOSTIQUE:');
  if (rule1.length === 0) {
    console.log('⚠️  Problème principal: Aucun projet avec Commission_Achat = "Oui"');
  } else if (rule2.length === 0) {
    console.log('⚠️  Problème principal: Tous les projets ont un montant ≤ 1M€');
  } else if (rule3.length === 0) {
    console.log('⚠️  Problème principal: Tous les projets ont NO Statut = "3-Validé"');
  } else if (rule4.length === 0) {
    console.log('⚠️  Problème principal: Conditions date/statut du dossier');
  }
}

analyzeCommission();
