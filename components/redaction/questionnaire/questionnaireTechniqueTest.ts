/**
 * Test simple : Vérifier que la résolution NumProc fonctionne
 * Lancer depuis la console :
 * 
 * import { testQTLoading } from './components/redaction/questionnaire/questionnaireTechniqueStorage';
 * testQTLoading('25006');
 */

import { supabase } from '../../../lib/supabase';

export async function testQTLoading(numeroProcedureShort: string) {
  console.log('🧪 TEST: Vérification du chargement QT');
  console.log('='.repeat(50));
  
  try {
    // Étape 1: Trouver le NumProc complet
    console.log(`1️⃣ Recherche NumProc pour: ${numeroProcedureShort}`);
    
    const { data: procData, error: procError } = await supabase
      .from('procédures')
      .select('NumProc, "numero court procédure afpa"')
      .ilike('numero court procédure afpa', `%${numeroProcedureShort}%`)
      .maybeSingle();
    
    if (procError) {
      console.error('❌ Erreur requête procédures:', procError);
      return;
    }
    
    if (!procData) {
      console.error('❌ Procédure non trouvée');
      return;
    }
    
    console.log(`✅ Procédure trouvée: NumProc=${procData.NumProc}`);
    
    // Étape 2: Chercher les questionnaires_techniques avec ce NumProc
    console.log(`2️⃣ Recherche questionnaires_techniques avec NumProc: ${procData.NumProc}`);
    
    const { data: qtData, error: qtError } = await supabase
      .from('questionnaires_techniques')
      .select('*')
      .eq('num_proc', procData.NumProc)
      .eq('numero_lot', 1);
    
    if (qtError) {
      console.error('❌ Erreur requête questionnaires_techniques:', qtError);
      return;
    }
    
    console.log(`✅ Questionnaires trouvés: ${qtData?.length || 0}`);
    
    if (qtData && qtData.length > 0) {
      console.log('📦 Premier QT:', {
        num_proc: qtData[0].num_proc,
        numero_lot: qtData[0].numero_lot,
        qt_data_keys: Object.keys(qtData[0].qt_data || {})
      });
    }
    
    console.log('='.repeat(50));
    console.log('✅ TEST RÉUSSI: Le mapping et la recherche fonctionnent!');
    
  } catch (err) {
    console.error('❌ Erreur test:', err);
  }
}
