import type { CandidatAnalyse, LotGagne, LotPerdu, MultiLotsAnalysis, LotTableau } from '../types/multiLots';

/**
 * Analyse les lots d'une procédure multi-lots et crée une matrice candidat × lot
 * @param rapportData - Données du rapport de présentation
 * @param candidatsOuverture - Liste des candidats de l'ouverture des plis
 * @returns Analyse complète par candidat
 */
export function analyzeMultiLots(
  rapportData: any,
  candidatsOuverture: any[]
): MultiLotsAnalysis {
  
  // Récupérer les lots depuis section7_2_syntheseLots
  const lots: LotTableau[] = rapportData.section7_2_syntheseLots?.lots || [];
  
  if (lots.length === 0) {
    // Pas de lots ou mono-lot, retour vide
    return {
      candidats: [],
      totalLots: 0,
      candidatsGagnants: [],
      candidatsPerdants: [],
      candidatsMixtes: [],
    };
  }

  // Map pour stocker les analyses par candidat
  const candidatsMap = new Map<string, CandidatAnalyse>();

  // Parcourir chaque lot
  lots.forEach((lot) => {
    const numeroLot = String(lot.numero || '');
    const intituleLot = lot.nomLot || lot.nom || lot.intitule || `Lot ${numeroLot}`;
    const tableau = lot.tableau || [];

    // Récupérer les pondérations spécifiques au lot
    // Les pondérations peuvent être dans lot.ponderation, lot.criteres, ou déduites des notes
    let maxEco = 60; // Valeur par défaut
    let maxTech = 40;
    
    // Tenter plusieurs emplacements possibles
    if (lot.criteres) {
      maxEco = lot.criteres.critereFinancier || lot.criteres.criterePrix || 60;
      maxTech = lot.criteres.critereTechnique || lot.criteres.critereValeurTechnique || 40;
    } else if (lot.ponderation) {
      maxEco = lot.ponderation.economique || lot.ponderation.financier || 60;
      maxTech = lot.ponderation.technique || 40;
    } else if (tableau.length > 0) {
      // Déduire des champs noteFinanciereSur70/noteTechniqueSur30
      const premiereCandidature = tableau[0];
      if (premiereCandidature.noteFinanciereSur70 !== undefined) {
        maxEco = 70;
        maxTech = 30;
      } else if (premiereCandidature.noteFinanciereSur60 !== undefined) {
        maxEco = 60;
        maxTech = 40;
      }
    }

    if (tableau.length === 0) return;

    // Trier par rang pour trouver le gagnant
    const tableauTrie = [...tableau].sort((a, b) => (a.rangFinal || 999) - (b.rangFinal || 999));
    const gagnant = tableauTrie[0];
    const nomGagnant = normalizeNom(gagnant.raisonSociale || '');

    // Parcourir tous les candidats du lot
    tableau.forEach((offre) => {
      const nomCandidat = normalizeNom(offre.raisonSociale || '');
      if (!nomCandidat) return;

      // Initialiser le candidat s'il n'existe pas
      if (!candidatsMap.has(nomCandidat)) {
        const coordonnees = findCandidatCoordonnees(nomCandidat, candidatsOuverture);
        candidatsMap.set(nomCandidat, {
          nom: offre.raisonSociale || nomCandidat,
          lotsGagnes: [],
          lotsPerdus: [],
          coordonnees,
        });
      }

      const candidat = candidatsMap.get(nomCandidat)!;
      const noteCandidat = offre.noteFinaleSur100 || 0;
      const noteTechCandidat = offre.noteTechnique || offre.noteTechniqueSur30 || 0;
      const noteFinCandidat = offre.noteFinanciere || offre.noteFinanciereSur70 || 0;
      const rang = offre.rangFinal || 999;

      // Le candidat a-t-il gagné ce lot ?
      if (rang === 1) {
        const lotGagne: LotGagne = {
          numero: numeroLot,
          intitule: intituleLot,
          montant: offre.montantTTC,
          noteCandidat,
          noteTechnique: noteTechCandidat,
          noteFinanciere: noteFinCandidat,
          rang: 1,
          noteGagnant: noteCandidat,
          maxEco,
          maxTech,
        };
        candidat.lotsGagnes.push(lotGagne);
      } else {
        // Le candidat a perdu ce lot
        const noteGagnant = gagnant.noteFinaleSur100 || 100;
        const noteTechGagnant = gagnant.noteTechnique || gagnant.noteTechniqueSur30 || 0;
        const noteFinGagnant = gagnant.noteFinanciere || gagnant.noteFinanciereSur70 || 0;
        
        const lotPerdu: LotPerdu = {
          numero: numeroLot,
          intitule: intituleLot,
          montant: offre.montantTTC,
          noteCandidat,
          noteTechnique: noteTechCandidat,
          noteFinanciere: noteFinCandidat,
          rang,
          gagnant: gagnant.raisonSociale || nomGagnant,
          noteGagnant,
          motifRejet: "Votre offre n'a pas obtenu la meilleure note au regard des critères d'analyse définis dans le Règlement de la Consultation.",
          // Stocker aussi les notes du gagnant pour comparaison
          noteTechGagnant,
          noteFinGagnant,
          maxEco,
          maxTech,
        };
        candidat.lotsPerdus.push(lotPerdu);
      }
    });
  });

  // Convertir la Map en array
  const candidats = Array.from(candidatsMap.values());

  // Classifier les candidats
  const candidatsGagnants = candidats.filter(c => c.lotsGagnes.length > 0 && c.lotsPerdus.length === 0);
  const candidatsPerdants = candidats.filter(c => c.lotsGagnes.length === 0 && c.lotsPerdus.length > 0);
  const candidatsMixtes = candidats.filter(c => c.lotsGagnes.length > 0 && c.lotsPerdus.length > 0);

  return {
    candidats,
    totalLots: lots.length,
    candidatsGagnants,
    candidatsPerdants,
    candidatsMixtes,
  };
}

/**
 * Normalise un nom de candidat pour la comparaison
 */
function normalizeNom(nom: string): string {
  return nom
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
}

/**
 * Trouve les coordonnées d'un candidat depuis ouverture_plis
 */
function findCandidatCoordonnees(nomCandidat: string, candidatsOuverture: any[]): any {
  const nomNormalized = normalizeNom(nomCandidat);
  
  const candidat = candidatsOuverture.find((c: any) => {
    const nomC = normalizeNom(c.societe || c.nom || '');
    return nomC.includes(nomNormalized) || nomNormalized.includes(nomC);
  });

  if (!candidat) return undefined;

  return {
    siret: candidat.siret || '',
    adresse: candidat.adresse || '',
    codePostal: candidat.codePostal || '',
    ville: candidat.ville || '',
    email: candidat.email || '',
    telephone: candidat.telephone || '',
  };
}

/**
 * Vérifie si une procédure est multi-lots
 */
export function isMultiLots(rapportData: any): boolean {
  const lots = rapportData?.section7_2_syntheseLots?.lots || [];
  return lots.length > 1;
}
