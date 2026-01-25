import { RapportSources, RapportContent, Section1Contexte, Section2Deroulement, Section3DossierConsultation, Section4QuestionsReponses, Section5AnalyseCandidatures, Section6Methodologie, Section7ValeurOffres, Section8Performance, Section9Attribution, Section10Calendrier, DocumentConsultation, CritereAnalyse, OffreClassement, LotPerformanceDetail } from './types';
import { AnalysisData, Metadata } from '@/components/an01';
import { DepotsData } from '../../types/depots';
import { RetraitsData } from '../../types/retraits';

/**
 * Génère automatiquement le contenu du Rapport de Présentation
 * à partir des sources de données disponibles
 */
export function generateRapportData(sources: RapportSources): RapportContent {
  // Détection si an01Data contient tous les lots ou un seul lot
  const an01Input = sources.an01Data;
  const isMultiLot = an01Input && typeof an01Input === 'object' && 'allLots' in an01Input;
  
  // Si multi-lot, utiliser le premier lot pour les données de base
  // et garder la référence à tous les lots pour les sections 7.2 et 8.1
  const primaryLotData = isMultiLot ? (an01Input as any).allLots[0] : an01Input;
  const allLotsData = isMultiLot ? (an01Input as any).allLots : null;
  
  // Pour la section 8 (performance), utiliser la synthèse multi-lots si applicable
  const performanceData = allLotsData 
    ? generatePerformanceFromMultiLots(allLotsData, sources)
    : generatePerformance({ ...sources, an01Data: primaryLotData });
  
  return {
    section1_contexte: generateContexte(sources),
    section2_deroulement: generateDeroulement(sources),
    section3_dossierConsultation: generateDossierConsultation(sources),
    section4_questionsReponses: generateQuestionsReponses(sources),
    section5_analyseCandidatures: generateAnalyseCandidatures({ ...sources, an01Data: primaryLotData }),
    section6_methodologie: generateMethodologie({ ...sources, an01Data: primaryLotData }),
    section7_valeurOffres: generateValeurOffres({ ...sources, an01Data: primaryLotData }),
    section7_2_syntheseLots: allLotsData ? generateSyntheseLots(allLotsData, sources) : null,
    section8_performance: performanceData,
    section8_1_synthesePerformance: allLotsData ? generateSynthesePerformanceLots(allLotsData, sources) : null,
    section9_attribution: generateAttribution({ ...sources, an01Data: primaryLotData }),
    section10_calendrier: generateCalendrier(sources),
  };
}

// ===== SECTION 1 : CONTEXTE =====
function generateContexte(sources: RapportSources): Section1Contexte {
  const procedure = sources.procedure || {};
  const dossier = sources.dossier || {};
  
  return {
    objetMarche: procedure['Nom de la procédure'] || dossier['Titre_du_dossier'] || '',
    dureeMarche: parseInt(procedure['Durée du marché (en mois)']) || 0,
    descriptionPrestations: '', // À compléter manuellement
  };
}

// ===== SECTION 2 : DÉROULEMENT DE LA PROCÉDURE =====
function generateDeroulement(sources: RapportSources): Section2Deroulement {
  const procedure = sources.procedure || {};
  const dossier = sources.dossier || {};
  const retraits = sources.retraits as RetraitsData;
  const depots = sources.depots as DepotsData;
  
  const nombreRetraits = retraits 
    ? (retraits.stats.totalTelecharges + retraits.stats.totalReprographies) 
    : 0;
  
  const nombrePlisRecus = depots 
    ? (depots.stats.totalEnveloppesElectroniques + depots.stats.totalEnveloppesPapier) 
    : 0;
  
  // Récupérer la date de publication (Date de lancement de la consultation)
  // Priorité : 1) date_de_lancement_de_la_consultation de la procédure
  //            2) Date_de_lancement_de_la_consultation du dossier
  //            3) datePublication du registre retraits (fallback)
  const datePublication = procedure['date_de_lancement_de_la_consultation'] 
    || dossier['Date_de_lancement_de_la_consultation']
    || retraits?.procedureInfo?.datePublication 
    || '';
  
  return {
    clientInterne: dossier['Client_Interne'] || '',
    datePublication,
    nombreRetraits,
    dateReceptionOffres: procedure['Date de remise des offres'] || '',
    nombrePlisRecus,
    nombreHorsDelai: 0, // TODO: Calculer en comparant dates de réception
    dateOuverturePlis: procedure['Date d\'ouverture des offres'] || '',
    supportProcedure: procedure['Support de procédure'] || '',
    listeRetraitsAnnexe: nombreRetraits > 0,
    listeDepotsAnnexe: nombrePlisRecus > 0,
  };
}

// ===== SECTION 3 : DOSSIER DE CONSULTATION =====
function generateDossierConsultation(sources: RapportSources): Section3DossierConsultation {
  // Liste standard des documents de consultation
  const documentsStandard: DocumentConsultation[] = [
    { nom: 'Règlement de la Consultation (RC)', inclus: true },
    { nom: 'Acte d\'Engagement (AE)', inclus: true },
    { nom: 'Cahier des Clauses Administratives Particulières (CCAP) et ses annexes', inclus: true },
    { nom: 'Cahier des Clauses Techniques Particulières (CCTP) et ses annexes', inclus: true },
    { nom: 'Bordereau des Prix Unitaires (BPU)', inclus: false },
    { nom: 'Détail Quantitatif Estimatif (DQE)', inclus: false },
    { nom: 'Cadre de Réponse Technique (CRT) et ses annexes', inclus: true },
  ];
  
  return {
    documentsListe: documentsStandard,
  };
}

// ===== SECTION 4 : QUESTIONS-RÉPONSES =====
function generateQuestionsReponses(sources: RapportSources): Section4QuestionsReponses {
  const procedure = sources.procedure || {};
  const questions = sources.questionsReponses || [];
  
  return {
    nombreQuestions: parseInt(procedure['Nombre de questions']) || questions.length,
    questions,
    enAnnexe: questions.length > 0,
  };
}

// ===== SECTION 5 : ANALYSE DES CANDIDATURES =====
function generateAnalyseCandidatures(sources: RapportSources): Section5AnalyseCandidatures {
  const depots = sources.depots as DepotsData;
  const an01Data = sources.an01Data as AnalysisData;
  
  const nombreTotal = depots?.entreprises?.length || 0;
  const nombreRecevables = an01Data?.offers?.length || 0;
  const nombreRejetees = nombreTotal - nombreRecevables;
  
  // Extraire les motifs de rejet depuis AN01 si disponibles
  const motifsRejet = an01Data?.offers
    ?.filter((o: any) => o.isRejected)
    .map((o: any) => ({
      entreprise: o.name,
      motif: o.rejectionReason || 'Non précisé',
    })) || [];
  
  return {
    nombreCandidaturesTotales: nombreTotal,
    nombreCandidaturesRecevables: nombreRecevables,
    nombreCandidaturesRejetees: nombreRejetees,
    motifsRejet,
  };
}

// ===== SECTION 6 : MÉTHODOLOGIE D'ANALYSE DES OFFRES =====
function generateMethodologie(sources: RapportSources): Section6Methodologie {
  const an01Data = sources.an01Data as AnalysisData;
  
  if (!an01Data || !an01Data.offers || an01Data.offers.length === 0) {
    return {
      criteres: [],
      criteresDetails: [],
      ponderationTechnique: 30,
      ponderationFinancier: 70,
    };
  }
  
  // Récupérer les pondérations depuis les métadonnées AN01 ou calculer
  const poidsTechnique = (an01Data.metadata as Metadata)?.poidsTechnique || 30;
  const poidsFinancier = (an01Data.metadata as Metadata)?.poidsFinancier || 70;
  
  const criteres: CritereAnalyse[] = [
    { nom: 'Valeur économique de l\'offre', ponderation: poidsFinancier },
    { nom: 'Valeur technique de l\'offre', ponderation: poidsTechnique },
  ];
  
  // Extraire les critères techniques depuis technicalAnalysis
  const criteresDetails = an01Data.technicalAnalysis?.[0]?.criteria?.map((c: any) => ({
    nom: c.name,
    points: parseFloat(c.maxScore) || 0,
  })) || [];
  
  return {
    criteres,
    criteresDetails,
    ponderationTechnique: poidsTechnique,
    ponderationFinancier: poidsFinancier,
  };
}

// ===== SECTION 7 : ANALYSE DE LA VALEUR DES OFFRES =====
function generateValeurOffres(sources: RapportSources): Section7ValeurOffres {
  const an01Data = sources.an01Data as AnalysisData;
  const dossier = sources.dossier || {};
  
  if (!an01Data || !an01Data.offers) {
    return {
      tableau: [],
      montantEstime: 0,
      montantAttributaire: 0,
      ecartAbsolu: 0,
      ecartPourcent: 0,
    };
  }
  
  // Mapper les offres au format du rapport
  const tableau: OffreClassement[] = an01Data.offers.map((offer: any) => ({
    raisonSociale: offer.name,
    rangFinal: offer.rankFinal,
    noteFinaleSur100: offer.scoreFinal,
    rangFinancier: offer.rankFinancial,
    noteFinanciereSur60: offer.scoreFinancial,
    rangTechnique: offer.rankTechnical,
    noteTechniqueSur40: offer.scoreTechnical,
    montantTTC: offer.amountTTC,
  }));
  
  // Calcul du montant estimé (depuis dossier ou procédure) + TVA
  const procedure = sources.procedure || {};
  
  // Récupérer la valeur brute - PRIORITÉ À LA PROCÉDURE
  let montantHTString = procedure['Montant de la procédure']
    || dossier['Montant_previsionnel_du_marche_(_HT)_'];
  
  // Nettoyer la valeur : enlever espaces, vérifier qu'elle n'est pas vide
  if (montantHTString) {
    montantHTString = String(montantHTString).trim();
  }
  
  // Vérifier que la valeur n'est pas vide, null, undefined, "0", ou "0,00"
  let montantHT = 0;
  if (montantHTString && montantHTString !== '' && montantHTString !== '0' && montantHTString !== '0,00') {
    const parsed = parseFloat(montantHTString.replace(',', '.').replace(/\s/g, ''));
    montantHT = (!isNaN(parsed) && parsed > 0) ? parsed : 0;
  }
  
  const tva = parseFloat(an01Data.metadata?.tva) || 20;
  const montantEstime = montantHT > 0 ? montantHT * (1 + tva / 100) : 0;
  
  console.log('🔍 DEBUG MONTANT ESTIMÉ:');
  console.log('  - Procédure [Montant de la procédure]:', procedure['Montant de la procédure'], '← PRIORITÉ');
  console.log('  - Dossier [Montant_previsionnel_du_marche_(_HT)_]:', dossier['Montant_previsionnel_du_marche_(_HT)_']);
  console.log('  - montantHTString (valeur sélectionnée):', montantHTString);
  console.log('  - montantHT (après parsing):', montantHT);
  console.log('  - TVA:', tva);
  console.log('  - montantEstime (final TTC):', montantEstime);
  
  const montantAttributaire = an01Data.stats?.winner?.amountTTC || 0;
  const ecartAbsolu = montantEstime > 0 ? montantEstime - montantAttributaire : 0;
  const ecartPourcent = montantEstime > 0 ? (ecartAbsolu / montantEstime) * 100 : 0;
  
  return {
    tableau,
    montantEstime,
    montantAttributaire,
    ecartAbsolu,
    ecartPourcent,
  };
}

// ===== SECTION 8 : ANALYSE DE LA PERFORMANCE =====
function generatePerformance(sources: RapportSources): Section8Performance {
  const an01Data = sources.an01Data as AnalysisData;
  
  if (!an01Data || !an01Data.stats) {
    return {
      valeurReference: 0,
      performanceAchatPourcent: 0,
      impactBudgetaireTTC: 0,
      impactBudgetaireHT: 0,
      montantAttributaireTTC: 0,
      montantAttributaireHT: 0,
    };
  }
  
  const tva = parseFloat(an01Data.metadata?.tva) || 20;
  const montantAttributaireTTC = an01Data.stats.winner?.amountTTC || 0;
  const montantAttributaireHT = montantAttributaireTTC / (1 + tva / 100);
  
  return {
    valeurReference: an01Data.stats.average,
    performanceAchatPourcent: an01Data.stats.savingPercent,
    impactBudgetaireTTC: an01Data.stats.savingAmount,
    impactBudgetaireHT: an01Data.stats.savingAmount / (1 + tva / 100),
    montantAttributaireTTC,
    montantAttributaireHT,
  };
}

// ===== SECTION 8 : PERFORMANCE CALCULÉE DEPUIS MULTI-LOTS =====
function generatePerformanceFromMultiLots(allLots: AnalysisData[], sources: RapportSources): Section8Performance {
  const totalSavings = allLots.reduce((sum, lot) => sum + (lot.stats?.savingAmount || 0), 0);
  const totalAverage = allLots.reduce((sum, lot) => sum + (lot.stats?.average || 0), 0);
  const totalAttributaireTTC = allLots.reduce((sum, lot) => sum + (lot.stats?.winner?.amountTTC || 0), 0);
  const performanceGlobale = totalAverage > 0 ? (-1 * totalSavings / totalAverage) * 100 : 0;
  
  const tva = parseFloat(allLots[0]?.metadata?.tva) || 20;
  const totalAttributaireHT = totalAttributaireTTC / (1 + tva / 100);
  
  // Générer le tableau détaillé pour chaque lot
  const tableauDetaille = allLots.map(lot => {
    const moyenneTTC = lot.stats?.average || 0;
    const moyenneHT = moyenneTTC / (1 + tva / 100);
    const offreRetenueTTC = lot.stats?.winner?.amountTTC || 0;
    const offreRetenueHT = offreRetenueTTC / (1 + tva / 100);
    const gainsTTC = offreRetenueTTC - moyenneTTC; // Négatif = économie
    const gainsHT = offreRetenueHT - moyenneHT;
    const gainsPourcent = moyenneTTC > 0 ? (gainsTTC / moyenneTTC) * 100 : 0;
    
    return {
      nomLot: lot.lotName || 'Lot',
      moyenneHT,
      moyenneTTC,
      offreRetenueHT,
      offreRetenueTTC,
      gainsHT,
      gainsTTC,
      gainsPourcent,
    };
  });
  
  return {
    valeurReference: totalAverage,
    performanceAchatPourcent: performanceGlobale,
    impactBudgetaireTTC: totalSavings,
    impactBudgetaireHT: totalSavings / (1 + tva / 100),
    montantAttributaireTTC: totalAttributaireTTC,
    montantAttributaireHT: totalAttributaireHT,
    tableauDetaille,
  };
}

// ===== SECTION 9 : PROPOSITION D'ATTRIBUTION =====
function generateAttribution(sources: RapportSources): Section9Attribution {
  const an01Data = sources.an01Data as AnalysisData;
  
  return {
    attributairePressenti: an01Data?.stats?.winner?.name || '',
  };
}

// ===== SECTION 7.2 : SYNTHÈSE DES LOTS =====
function generateSyntheseLots(allLots: AnalysisData[], sources: RapportSources): any {
  return {
    nombreLots: allLots.length,
    lots: allLots.map((lot, index) => {
      // Génération du tableau des offres pour ce lot
      const tableau = lot.offers?.map(offer => ({
        raisonSociale: offer.name,
        rangFinal: offer.rankFinal,
        noteFinaleSur100: offer.scoreFinal,
        rangFinancier: offer.rankFinancial,
        noteFinanciere: offer.scoreFinancial, // Note brute (pas forcément sur 60)
        rangTechnique: offer.rankTechnical,
        noteTechnique: offer.scoreTechnical, // Note brute (pas forcément sur 40)
        montantTTC: offer.amountTTC,
      })) || [];
      
      return {
        numero: index + 1,
        nomLot: lot.lotName || `Lot ${index + 1}`,
        nom: lot.lotName || `Lot ${index + 1}`, // Pour compatibilité
        montantAttributaire: lot.stats?.winner?.amountTTC || 0,
        attributaire: lot.stats?.winner?.name || '',
        nombreOffres: lot.offers?.length || 0,
        tableau: tableau,
        poidsTechnique: (lot.metadata as Metadata)?.poidsTechnique || 30,
        poidsFinancier: (lot.metadata as Metadata)?.poidsFinancier || 70,
      };
    }),
    montantTotalTTC: allLots.reduce((sum, lot) => sum + (lot.stats?.winner?.amountTTC || 0), 0),
  };
}

// ===== SECTION 8.1 : SYNTHÈSE PERFORMANCE MULTI-LOTS =====
function generateSynthesePerformanceLots(allLots: AnalysisData[], sources: RapportSources): any {
  const totalSavings = allLots.reduce((sum, lot) => sum + (lot.stats?.savingAmount || 0), 0);
  const totalBudget = allLots.reduce((sum, lot) => sum + (lot.stats?.average || 0), 0);
  const performanceGlobale = totalBudget > 0 ? (totalSavings / totalBudget) * 100 : 0;
  
  const tva = parseFloat(allLots[0]?.metadata?.tva) || 20;
  
  return {
    performanceGlobalePourcent: performanceGlobale,
    impactBudgetaireTotalTTC: totalSavings,
    impactBudgetaireTotalHT: totalSavings / (1 + tva / 100),
    lotsDetails: allLots.map((lot, index) => ({
      numero: index + 1,
      nom: lot.lotName || `Lot ${index + 1}`,
      performancePourcent: lot.stats?.savingPercent || 0,
      impactTTC: lot.stats?.savingAmount || 0,
    })),
  };
}

// ===== SECTION 10 : CALENDRIER DE MISE EN ŒUVRE =====
function generateCalendrier(sources: RapportSources): Section10Calendrier {
  const procedure = sources.procedure || {};
  
  return {
    dateValidationMSA: procedure['RP - Date validation MSA'] || '',
    dateValidationCODIR: procedure['RP -  Date validation CODIR'] || '',
    dateEnvoiLettresRejet: '', // À calculer : après validation attribution
    dateAttribution: procedure['Date de Notification'] || '',
    delaiStandstill: 10, // 10 jours ouvrés par défaut
  };
}
