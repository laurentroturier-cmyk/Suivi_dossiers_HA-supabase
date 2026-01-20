import { supabase } from '../../../lib/supabase';

export interface QuestionnaireState {
  procedure?: { NumProc?: string; numero_court_procedure_afpa?: string };
  numeroLot?: number;
  criteres: any[];
}

/**
 * ✅ CLEF: Récupère le NumProc complet depuis la table procédures
 * Utilise la même logique que le module QuestionnaireTechnique.tsx :
 * Cherche avec .ilike() sur "numero court procédure afpa" et retourne le NumProc
 */
async function getFullNumProcFromShortCode(numeroProcedureShort: string): Promise<string | null> {
  try {
    console.log(`🔍 Recherche NumProc pour code court: ${numeroProcedureShort}`);
    
    // Chercher dans procédures avec .ilike() sur "numero court procédure afpa" (comme le module historique)
    const { data: procedures, error } = await supabase
      .from('procédures')
      .select('NumProc, "numero court procédure afpa", "Numéro de procédure (Afpa)"')
      .ilike('numero court procédure afpa', `%${numeroProcedureShort}%`)
      .limit(1);

    if (error) {
      console.error('❌ Erreur recherche procédure:', error);
      return null;
    }

    if (!procedures || procedures.length === 0) {
      console.log(`⚠️ Aucune procédure trouvée pour: ${numeroProcedureShort}`);
      return null;
    }

    const numProc = procedures[0]?.NumProc;
    const numAfpa = procedures[0]?.['Numéro de procédure (Afpa)'];
    
    if (numProc) {
      console.log(`✅ NumProc trouvé: ${numeroProcedureShort} (${numAfpa}) → ${numProc}`);
      return numProc;
    }

    console.log(`⚠️ NumProc vide pour: ${numeroProcedureShort}`);
    return null;
  } catch (err) {
    console.error('❌ Erreur getFullNumProcFromShortCode:', err);
    return null;
  }
}

/**
 * Sauvegarde le questionnaire technique
 * - Dans questionnaires_techniques (table historique) avec NumProc complet
 * - Dans la table dce colonne qt (pour synchro DCE) avec numero court
 */
export async function saveQuestionnaireTechnique(
  numeroProcedure: string,
  data: QuestionnaireState,
  titreMarche?: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // 🔧 CLEF FIX: Résoudre le NumProc complet depuis le code court (5 chiffres)
    let fullNumProc = numeroProcedure;
    if (numeroProcedure.length === 5 && /^\d{5}$/.test(numeroProcedure)) {
      const resolved = await getFullNumProcFromShortCode(numeroProcedure);
      if (resolved) {
        fullNumProc = resolved;
      } else {
        console.warn(`⚠️ NumProc non résolu pour ${numeroProcedure}, on utilise le code court`);
      }
    }

    // Préparer les données du questionnaire
    const questionnaireData = {
      criteres: data.criteres || [],
      savedAt: new Date().toISOString(),
      version: '1.0'
    };

    // 1. Sauvegarder dans questionnaires_techniques (table historique, avec NumProc complet)
    console.log(`📝 Sauvegarde QT avec NumProc: ${fullNumProc}`);
    const { error: qtError } = await supabase
      .from('questionnaires_techniques')
      .upsert({
        num_proc: fullNumProc,  // ✅ Utiliser le NumProc complet
        numero_lot: 1,  // Par défaut pour DCE (pas multi-lots)
        qt_data: questionnaireData,
        user_id: user.id,
      }, {
        onConflict: 'num_proc,numero_lot',
        ignoreDuplicates: false,
      });

    if (qtError) {
      console.error('❌ Erreur sauvegarde questionnaires_techniques:', qtError);
      return { success: false, error: qtError.message };
    }

    // 2. Synchroniser dans la table dce (colonne qt) - NON-CRITIQUE
    try {
      const { error: dceError } = await supabase
        .from('dce')
        .upsert({
          user_id: user.id,
          numero_procedure: numeroProcedure,
          titre_marche: titreMarche || null,
          qt: questionnaireData,
        }, {
          onConflict: 'numero_procedure,user_id',
          ignoreDuplicates: false,
        });

      if (dceError) {
        console.warn('⚠️ Synchro QT → DCE non critique:', dceError);
        // On continue quand même - la sauvegarde dans questionnaires_techniques a réussi
      }
    } catch (syncErr) {
      console.warn('⚠️ Erreur synchro QT → DCE:', syncErr);
      // On continue quand même
    }

    return { success: true };
  } catch (error: any) {
    console.error('❌ Erreur sauvegarde QT:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Charge un questionnaire technique depuis questionnaires_techniques par numéro de procédure
 * 🔧 CLEF FIX: Résoud le NumProc complet pour chercher dans questionnaires_techniques
 */
export async function loadQuestionnaireTechnique(
  numeroProcedure: string
): Promise<{ success: boolean; data?: QuestionnaireState; error?: string }> {
  try {
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // 🔧 CLEF FIX: Résoudre le NumProc complet depuis le code court
    let fullNumProc = numeroProcedure;
    if (numeroProcedure.length === 5 && /^\d{5}$/.test(numeroProcedure)) {
      const resolved = await getFullNumProcFromShortCode(numeroProcedure);
      if (resolved) {
        fullNumProc = resolved;
        console.log(`🔗 Chargement QT avec NumProc résolu: ${numeroProcedure} → ${fullNumProc}`);
      } else {
        console.warn(`⚠️ NumProc non résolu pour ${numeroProcedure}, utilisation du code court`);
      }
    }

    // Charger depuis questionnaires_techniques (numero_lot = 1 par défaut pour DCE)
    console.log(`🔍 Recherche QT pour NumProc: ${fullNumProc}, numero_lot: 1`);
    const { data: result, error } = await supabase
      .from('questionnaires_techniques')
      .select('*')
      .eq('num_proc', fullNumProc)  // ✅ Utiliser le NumProc complet
      .eq('numero_lot', 1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur chargement QT Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!result) {
      console.log(`ℹ️ Aucun QT trouvé pour NumProc: ${fullNumProc}`);
      return { success: false, error: 'Aucun questionnaire trouvé pour ce numéro de procédure' };
    }

    console.log(`✅ QT trouvé et chargé pour NumProc: ${fullNumProc}`);
    const questionnaireData = result.qt_data as QuestionnaireState;
    
    return { 
      success: true, 
      data: {
        ...questionnaireData,
        procedure: {
          NumProc: fullNumProc,
          numero_court_procedure_afpa: numeroProcedure
        }
      }
    };
  } catch (error: any) {
    console.error('❌ Erreur chargement QT:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Récupère un QT existant depuis questionnaires_techniques
 * (pour backfill DCE si le DCE.qt était vide)
 * 🔧 CLEF FIX: Résoud le NumProc complet
 */
export async function loadExistingQT(
  numeroProcedure: string
): Promise<{ data: any; } | null> {
  try {
    // 🔧 CLEF FIX: Résoudre le NumProc complet depuis le code court
    let fullNumProc = numeroProcedure;
    if (numeroProcedure.length === 5 && /^\d{5}$/.test(numeroProcedure)) {
      const resolved = await getFullNumProcFromShortCode(numeroProcedure);
      if (resolved) {
        fullNumProc = resolved;
        console.log(`🔗 Backfill QT avec NumProc résolu: ${numeroProcedure} → ${fullNumProc}`);
      }
    }

    console.log(`🔍 Recherche QT existant pour NumProc: ${fullNumProc}`);
    const { data: qtRecord, error } = await supabase
      .from('questionnaires_techniques')
      .select('qt_data')
      .eq('num_proc', fullNumProc)  // ✅ Utiliser le NumProc complet
      .eq('numero_lot', 1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Erreur récupération QT legacy:', error);
      return null;
    }

    if (!qtRecord) {
      console.log(`ℹ️ Aucun QT legacy trouvé pour NumProc: ${fullNumProc}`);
      return null;
    }

    console.log(`✅ QT legacy trouvé pour NumProc: ${fullNumProc}`);
    return {
      data: qtRecord.qt_data,
    };
  } catch (err) {
    console.error('❌ Erreur loadExistingQT:', err);
    return null;
  }
}
