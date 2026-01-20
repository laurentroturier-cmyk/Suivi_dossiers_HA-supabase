/**
 * Debug : Vérifier ce qui est réellement dans la table questionnaires_techniques
 * Lancer depuis la console navigateur :
 * 
 * import { debugQTTable } from './components/redaction/questionnaire/questionnaireTechniqueDebug';
 * await debugQTTable();
 */

import { supabase } from '../../../lib/supabase';

export async function debugQTTable() {
  console.log('🔍 === DEBUG QUESTIONNAIRES_TECHNIQUES ===');
  
  try {
    // 1. Compter les lignes
    const { count, error: countError } = await supabase
      .from('questionnaires_techniques')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total de lignes: ${count}`);
    
    if (count === 0) {
      console.log('⚠️ La table est VIDE !');
      return;
    }
    
    // 2. Afficher les premières 10 lignes
    const { data, error } = await supabase
      .from('questionnaires_techniques')
      .select('num_proc, numero_lot, updated_at')
      .limit(10);
    
    if (error) {
      console.error('❌ Erreur récupération:', error);
      return;
    }
    
    console.log('📋 Premiers enregistrements:');
    data?.forEach((record: any, idx: number) => {
      console.log(`  ${idx + 1}. num_proc="${record.num_proc}" | numero_lot=${record.numero_lot} | updated_at=${record.updated_at}`);
    });
    
    // 3. Chercher spécifiquement 1013-1
    const { data: found1013, error: err1013 } = await supabase
      .from('questionnaires_techniques')
      .select('num_proc, numero_lot')
      .eq('num_proc', '1013-1');
    
    console.log(`\n🔍 Recherche 'num_proc=1013-1': ${found1013?.length || 0} résultat(s)`);
    if (found1013 && found1013.length > 0) {
      console.log('  ✅ TROUVÉ !', found1013);
    }
    
    // 4. Chercher 25006
    const { data: found25006 } = await supabase
      .from('questionnaires_techniques')
      .select('num_proc, numero_lot')
      .eq('num_proc', '25006');
    
    console.log(`🔍 Recherche 'num_proc=25006': ${found25006?.length || 0} résultat(s)`);
    if (found25006 && found25006.length > 0) {
      console.log('  ✅ TROUVÉ !', found25006);
    }
    
    // 5. Afficher les TOUS les num_proc uniques
    console.log(`\n📝 Tous les num_proc distincts:`);
    const { data: allProcs } = await supabase
      .from('questionnaires_techniques')
      .select('num_proc')
      .limit(100);
    
    const uniqueProcs = [...new Set(allProcs?.map((p: any) => p.num_proc))];
    uniqueProcs.forEach(proc => console.log(`  - ${proc}`));
    
  } catch (err) {
    console.error('❌ Erreur debug:', err);
  }
}
