import { supabase } from '../../../lib/supabase';
import type { Noti1Data } from '../types/noti1';

/**
 * Enrichit les données NOTI1 avec les coordonnées depuis fichiers_sources
 */
async function enrichFromFichiersSources(
  noti1Data: Noti1Data,
  fichiersSources: any
): Promise<Noti1Data> {
  const enriched = JSON.parse(JSON.stringify(noti1Data)) as Noti1Data;
  const nomEntreprise = enriched.titulaire.denomination?.trim();

  if (!nomEntreprise) {
    console.log('[NOTI1-Sources] Pas de nom d\'entreprise à enrichir');
    return enriched;
  }

  console.log(`[NOTI1-Sources] 🔍 Recherche coordonnées pour: "${nomEntreprise}"`);

  // 1. Chercher dans depots (priorité)
  const depotsData = fichiersSources?.depots;
  if (depotsData?.entreprises && Array.isArray(depotsData.entreprises)) {
    console.log(`[NOTI1-Sources] Recherche dans ${depotsData.entreprises.length} entreprises (dépôts)`);
    
    const entrepriseDepot = depotsData.entreprises.find((e: any) => 
      e.societe?.toLowerCase().includes(nomEntreprise.toLowerCase()) ||
      nomEntreprise.toLowerCase().includes(e.societe?.toLowerCase())
    );

    if (entrepriseDepot) {
      console.log(`✅ [NOTI1-Sources] Entreprise trouvée dans dépôts:`, entrepriseDepot.societe);
      
      enriched.titulaire.adresse1 = entrepriseDepot.adresse || '';
      enriched.titulaire.codePostal = entrepriseDepot.cp || '';
      enriched.titulaire.ville = entrepriseDepot.ville || '';
      enriched.titulaire.telephone = entrepriseDepot.telephone || '';
      enriched.titulaire.fax = entrepriseDepot.fax || '';
      enriched.titulaire.email = entrepriseDepot.email || '';
      
      console.log('[NOTI1-Sources] Coordonnées enrichies depuis dépôts');
      return enriched;
    }
  }

  // 2. Chercher dans retraits
  const retraitsData = fichiersSources?.retraits;
  if (retraitsData?.entreprises && Array.isArray(retraitsData.entreprises)) {
    console.log(`[NOTI1-Sources] Recherche dans ${retraitsData.entreprises.length} entreprises (retraits)`);
    
    const entrepriseRetrait = retraitsData.entreprises.find((e: any) => 
      e.societe?.toLowerCase().includes(nomEntreprise.toLowerCase()) ||
      nomEntreprise.toLowerCase().includes(e.societe?.toLowerCase())
    );

    if (entrepriseRetrait) {
      console.log(`✅ [NOTI1-Sources] Entreprise trouvée dans retraits:`, entrepriseRetrait.societe);
      
      enriched.titulaire.siret = entrepriseRetrait.siret || '';
      enriched.titulaire.adresse1 = entrepriseRetrait.adresse || '';
      enriched.titulaire.codePostal = entrepriseRetrait.cp || '';
      enriched.titulaire.ville = entrepriseRetrait.ville || '';
      enriched.titulaire.telephone = entrepriseRetrait.telephone || '';
      enriched.titulaire.fax = entrepriseRetrait.fax || '';
      enriched.titulaire.email = entrepriseRetrait.email || '';
      
      console.log('[NOTI1-Sources] Coordonnées enrichies depuis retraits');
      return enriched;
    }
  }

  console.warn(`⚠️ [NOTI1-Sources] Entreprise "${nomEntreprise}" non trouvée dans fichiers_sources`);
  return enriched;
}

/**
 * Récupère les données du rapport de présentation pour une procédure donnée
 */
export async function fetchRapportPresentation(numeroCourt: string): Promise<any | null> {
  if (!numeroCourt || numeroCourt.length !== 5) {
    return null;
  }

  try {
    console.log(`🔍 [NOTI1-Rapport] Recherche rapport de présentation pour procédure: ${numeroCourt} (type: ${typeof numeroCourt})`);

    // ÉTAPE 1 : Récupérer TOUTES les procédures et filtrer côté client
    // (workaround pour les colonnes avec caractères spéciaux)
    const { data: allProcedures, error: procError } = await supabase
      .from('procédures')
      .select('NumProc, "Numéro de procédure (Afpa)"');

    console.log('📋 [NOTI1-Rapport] Résultat requête procédures:', {
      totalCount: allProcedures?.length || 0,
      error: procError
    });

    if (procError) {
      console.error('Erreur requête procédures:', procError);
      return null;
    }

    if (!allProcedures || allProcedures.length === 0) {
      console.warn(`⚠️ Table procédures vide ou inaccessible`);
      return null;
    }

    // Filtrer côté client pour trouver la procédure avec le numéro court
    const procedure = allProcedures.find(p => {
      const numAfpa = p['Numéro de procédure (Afpa)'];
      if (!numAfpa) return false;
      
      // Extraire les 5 premiers chiffres
      const match = String(numAfpa).match(/^(\d{5})/);
      return match && match[1] === numeroCourt;
    });

    if (!procedure) {
      console.warn(`⚠️ Procédure ${numeroCourt} non trouvée dans la table procédures`);
      console.log(`💡 Recherché dans ${allProcedures.length} procédures`);
      return null;
    }

    const numProcComplet = procedure.NumProc;
    console.log(`✅ Num_proc complet trouvé: ${numProcComplet} (type: ${typeof numProcComplet})`);

    // ÉTAPE 2 : Chercher le rapport avec le num_proc complet
    console.log(`🔍 [NOTI1-Rapport] Recherche rapport avec num_proc: ${numProcComplet}`);
    
    const { data: rapports, error } = await supabase
      .from('rapports_presentation')
      .select('*')
      .eq('num_proc', numProcComplet)
      .order('date_creation', { ascending: false })
      .limit(1);

    console.log('📋 [NOTI1-Rapport] Résultat requête rapports:', {
      count: rapports?.length || 0,
      found: rapports && rapports.length > 0,
      error: error,
      numProcRecherche: numProcComplet
    });

    if (error) {
      console.error('Erreur récupération rapports:', error);
      return null;
    }

    if (!rapports || rapports.length === 0) {
      console.warn(`⚠️ [NOTI1-Rapport] Aucun rapport de présentation trouvé avec num_proc: ${numProcComplet}`);
      console.log('💡 [NOTI1-Rapport] Suggestion: Vérifiez que le rapport existe dans rapports_presentation avec ce num_proc');
      return null;
    }

    // Retourner le rapport le plus récent
    console.log(`✅ [NOTI1-Rapport] Rapport trouvé:`, {
      id: rapports[0].id,
      num_proc: rapports[0].num_proc,
      titre: rapports[0].titre,
      date_creation: rapports[0].date_creation,
      hasFichiersSources: !!rapports[0].fichiers_sources,
      fichiersSourcesKeys: rapports[0].fichiers_sources ? Object.keys(rapports[0].fichiers_sources) : [],
    });

    // IMPORTANT : Log détaillé des fichiers_sources
    if (rapports[0].fichiers_sources) {
      console.log('📁 [NOTI1-Rapport] fichiers_sources présent:', {
        depots: rapports[0].fichiers_sources.depots ? '✅ Oui' : '❌ Non',
        retraits: rapports[0].fichiers_sources.retraits ? '✅ Oui' : '❌ Non',
        an01: rapports[0].fichiers_sources.an01 ? '✅ Oui' : '❌ Non',
        depotsEntreprises: rapports[0].fichiers_sources.depots?.entreprises?.length || 0,
        retraitsEntreprises: rapports[0].fichiers_sources.retraits?.entreprises?.length || 0,
      });
    } else {
      console.warn('⚠️ [NOTI1-Rapport] AUCUN fichiers_sources dans le rapport !');
      console.log('💡 [NOTI1-Rapport] Pour que l\'auto-fill fonctionne, le rapport doit contenir fichiers_sources avec depots/retraits');
    }

    return rapports[0];
  } catch (err) {
    console.error('Erreur lors de la requête rapports_presentation:', err);
    return null;
  }
}

/**
 * Extrait les informations de l'attributaire depuis le rapport de présentation
 */
export function extractAttributaireFromRapport(rapport: any): {
  denomination: string;
  lots: Array<{ numero: string; intitule: string }>;
} | null {
  try {
    console.log('[NOTI1-Rapport] 🔍 Extraction attributaire du rapport...');
    console.log('[NOTI1-Rapport] 📦 Rapport complet:', rapport);
    const rapportData = rapport.rapport_data;

    if (!rapportData) {
      console.warn('[NOTI1-Rapport] ⚠️ Pas de rapport_data dans le rapport');
      return null;
    }

    console.log('[NOTI1-Rapport] 📋 Structure rapport_data:', rapportData);
    console.log('[NOTI1-Rapport] 🔑 Clés disponibles:', Object.keys(rapportData));

    // Cas 1: Procédure avec un seul lot
    if (rapportData.section9_attribution?.attributairePressenti) {
      const denomination = rapportData.section9_attribution.attributairePressenti;
      console.log(`✅ [NOTI1-Rapport] Attributaire mono-lot trouvé: "${denomination}"`);

      return {
        denomination,
        lots: [], // Pas de lots, attribution en ensemble
      };
    } else {
      console.log('[NOTI1-Rapport] ℹ️ Pas d\'attributairePressenti dans section9_attribution');
    }

    // Cas 2: Procédure allotie (multi-lots)
    if (rapportData.section7_2_syntheseLots?.lots) {
      const lots = rapportData.section7_2_syntheseLots.lots;
      console.log(`✅ [NOTI1-Rapport] ${lots.length} lot(s) trouvé(s) dans section7_2_syntheseLots`);

      // Extraire tous les attributaires distincts
      const attributairesSet = new Set<string>();
      const lotsInfo: Array<{ numero: string; intitule: string; attributaire: string }> = [];

      lots.forEach((lot: any, index: number) => {
        console.log(`[NOTI1-Rapport] Lot ${index + 1}:`, lot);
        if (lot.attributaire) {
          attributairesSet.add(lot.attributaire);
          lotsInfo.push({
            numero: String(lot.numero || index + 1),
            intitule: lot.nomLot || lot.nom || `Lot ${index + 1}`,
            attributaire: lot.attributaire,
          });
        } else {
          console.log(`[NOTI1-Rapport] ⚠️ Lot ${index + 1} sans attributaire`);
        }
      });

      // Si un seul attributaire pour tous les lots
      if (attributairesSet.size === 1) {
        const denomination = Array.from(attributairesSet)[0];
        console.log(`✅ [NOTI1-Rapport] Attributaire unique multi-lots: "${denomination}"`);

        return {
          denomination,
          lots: lotsInfo.map(l => ({ numero: l.numero, intitule: l.intitule })),
        };
      }

      // Si plusieurs attributaires différents
      if (attributairesSet.size > 1) {
        console.warn(`⚠️ [NOTI1-Rapport] Plusieurs attributaires distincts trouvés. NOTI1 ne peut être généré que pour un seul attributaire à la fois.`);
        console.log('[NOTI1-Rapport] Attributaires:', Array.from(attributairesSet));

        // Retourner le premier attributaire trouvé avec ses lots
        const premierAttributaire = Array.from(attributairesSet)[0];
        const lotsAttributaire = lotsInfo
          .filter(l => l.attributaire === premierAttributaire)
          .map(l => ({ numero: l.numero, intitule: l.intitule }));

        console.log(`[NOTI1-Rapport] Premier attributaire sélectionné: "${premierAttributaire}"`);

        return {
          denomination: premierAttributaire,
          lots: lotsAttributaire,
        };
      }

      console.log(`[NOTI1-Rapport] ℹ️ Aucun lot avec attributaire dans section7_2_syntheseLots`);
    } else {
      console.log('[NOTI1-Rapport] ℹ️ Pas de section7_2_syntheseLots.lots');
    }

    console.warn('[NOTI1-Rapport] ❌ Aucune information d\'attributaire trouvée dans le rapport');
    return null;
  } catch (err) {
    console.error('Erreur extraction attributaire:', err);
    return null;
  }
}

/**
 * Mappe les données du rapport de présentation vers le format NOTI1
 */
export function mapRapportToNoti1(
  rapport: any,
  currentData: Noti1Data
): Noti1Data {
  const mapped = JSON.parse(JSON.stringify(currentData)) as Noti1Data;

  const attributaireInfo = extractAttributaireFromRapport(rapport);

  if (!attributaireInfo) {
    console.warn('[NOTI1-Rapport] Impossible d\'extraire les informations de l\'attributaire');
    return mapped;
  }

  // 1. Remplir le titulaire pressenti (nom de l'entreprise uniquement)
  mapped.titulaire.denomination = attributaireInfo.denomination;

  // 2. Gérer les lots
  if (attributaireInfo.lots.length > 0) {
    // Procédure allotie
    mapped.attribution.type = 'lots';
    mapped.attribution.lots = attributaireInfo.lots;
  } else {
    // Procédure en ensemble (non allotie)
    mapped.attribution.type = 'ensemble';
    mapped.attribution.lots = [];
  }

  console.log(`✅ [NOTI1-Rapport] Données mappées:`, {
    titulaire: mapped.titulaire.denomination,
    type: mapped.attribution.type,
    nombreLots: mapped.attribution.lots?.length || 0,
  });

  return mapped;
}

/**
 * Hook principal : récupère et mappe automatiquement les données depuis le rapport de présentation
 */
export async function autoFillNoti1FromRapport(
  numeroCourt: string,
  currentData: Noti1Data
): Promise<{
  success: boolean;
  data?: Noti1Data;
  error?: string;
  rapportFound?: any;
  attributaire?: string;
}> {
  try {
    console.log(`🔍 [NOTI1-Rapport] Auto-remplissage depuis rapport de présentation: ${numeroCourt}`);

    const rapport = await fetchRapportPresentation(numeroCourt);

    if (!rapport) {
      return {
        success: false,
        error: `Aucun rapport de présentation trouvé pour la procédure ${numeroCourt}`,
      };
    }

    let mappedData = mapRapportToNoti1(rapport, currentData);

    const attributaireInfo = extractAttributaireFromRapport(rapport);

    // ÉTAPE 3 : Enrichir avec les coordonnées depuis fichiers_sources du rapport
    if (attributaireInfo?.denomination) {
      console.log(`📋 [NOTI1-Rapport] Recherche coordonnées pour: "${attributaireInfo.denomination}"`);
      
      // Chercher dans rapport.fichiers_sources (racine), pas dans rapport_data
      if (rapport.fichiers_sources) {
        console.log('[NOTI1-Rapport] fichiers_sources trouvé dans le rapport');
        mappedData = await enrichFromFichiersSources(mappedData, rapport.fichiers_sources);
      } else {
        console.warn('[NOTI1-Rapport] ⚠️ Pas de fichiers_sources dans le rapport');
      }
    } else {
      console.log(`⚠️ [NOTI1-Rapport] Pas d'attributaire trouvé, impossible d'enrichir les coordonnées`);
    }

    return {
      success: true,
      data: mappedData,
      rapportFound: rapport.num_proc,
      attributaire: attributaireInfo?.denomination,
    };
  } catch (err) {
    console.error('❌ [NOTI1-Rapport] Erreur autoFillNoti1FromRapport:', err);
    return {
      success: false,
      error: String(err),
    };
  }
}
