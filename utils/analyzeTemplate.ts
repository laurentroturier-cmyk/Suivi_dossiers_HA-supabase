/**
 * Script pour analyser le template Word et extraire/proposer les placeholders
 */

import { analyzeTemplate } from './wordTemplateHandler';

const TEMPLATE_NAME = '25006_RP_Rapport de présentation.docx';

export async function analyzeRapportTemplate(): Promise<void> {
  console.log('🔍 Analyse du template Word...\n');
  
  try {
    const placeholders = await analyzeTemplate(TEMPLATE_NAME);
    
    if (placeholders.length > 0) {
      console.log(`✅ Placeholders trouvés dans le template (${placeholders.length}) :\n`);
      placeholders.forEach((p, i) => {
        console.log(`  ${i + 1}. {${p}}`);
      });
    } else {
      console.log('⚠️  Aucun placeholder trouvé dans le template.\n');
      console.log('📝 Voici les placeholders recommandés à ajouter :\n');
      suggestPlaceholders();
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    console.log('\n📝 Voici les placeholders recommandés à ajouter :\n');
    suggestPlaceholders();
  }
}

function suggestPlaceholders(): void {
  const placeholders = {
    'SECTION 1 - CONTEXTE': [
      '{OBJET_MARCHE}',
      '{DUREE_MARCHE}',
      '{DESCRIPTION_PRESTATIONS}',
    ],
    'SECTION 2 - DÉROULEMENT': [
      '{DATE_PUBLICATION}',
      '{NOMBRE_RETRAITS}',
      '{DATE_RECEPTION_OFFRES}',
      '{NOMBRE_PLIS_RECUS}',
      '{NOMBRE_HORS_DELAI}',
      '{DATE_OUVERTURE_PLIS}',
      '{SUPPORT_PROCEDURE}',
    ],
    'SECTION 3 - DOSSIER CONSULTATION': [
      'Documents inclus (liste à définir manuellement ou via loop)',
    ],
    'SECTION 4 - QUESTIONS-RÉPONSES': [
      '{NOMBRE_QUESTIONS}',
      '{#QUESTIONS}...{/QUESTIONS} (boucle pour liste)',
    ],
    'SECTION 5 - ANALYSE CANDIDATURES': [
      '{NOMBRE_TOTAL_CANDIDATURES}',
      '{NOMBRE_RECEVABLES}',
      '{NOMBRE_IRREGULIERES}',
      '{NOMBRE_INACCEPTABLES}',
    ],
    'SECTION 6 - MÉTHODOLOGIE': [
      '{PONDERATION_ECO}',
      '{PONDERATION_TECH}',
      '{#CRITERES_DETAILS}...{/CRITERES_DETAILS} (boucle)',
    ],
    'SECTION 7 - VALEUR DES OFFRES': [
      '{#OFFRES}...{/OFFRES} (boucle pour tableau)',
      '{MONTANT_ESTIME_TTC}',
      '{MONTANT_ATTRIBUTAIRE_TTC}',
      '{ECART_ABSOLU}',
      '{ECART_POURCENT}',
    ],
    'SECTION 8 - PERFORMANCE': [
      '{PERFORMANCE_ACHAT}',
      '{ECONOMIE_REALISEE}',
    ],
    'SECTION 9 - ATTRIBUTION': [
      '{PRESTATAIRE_PRESSENTI}',
      '{MONTANT_RETENU_TTC}',
    ],
    'SECTION 10 - CALENDRIER': [
      '{DATE_NOTIFICATION}',
      '{DATE_DEMARRAGE}',
    ],
  };

  Object.entries(placeholders).forEach(([section, items]) => {
    console.log(`\n${section}:`);
    items.forEach(item => console.log(`  ${item}`));
  });

  console.log('\n💡 INSTRUCTIONS :');
  console.log('1. Ouvrez le template Word');
  console.log('2. Remplacez les valeurs à remplir par les placeholders ci-dessus');
  console.log('   Exemple: "Objet du marché : " → "Objet du marché : {OBJET_MARCHE}"');
  console.log('3. Pour les tableaux/listes répétées, utilisez les boucles :');
  console.log('   {#OFFRES}');
  console.log('   Raison sociale : {RAISON_SOCIALE}');
  console.log('   Montant : {MONTANT_TTC}');
  console.log('   {/OFFRES}');
  console.log('4. Sauvegardez le template modifié');
  console.log('5. Le code pourra alors le remplir automatiquement !');
}

// Exécuter l'analyse
if (typeof window !== 'undefined') {
  // Exporter pour utilisation dans la console navigateur
  (window as any).analyzeRapportTemplate = analyzeRapportTemplate;
}
