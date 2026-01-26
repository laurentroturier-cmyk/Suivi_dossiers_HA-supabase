import { supabase } from '../../../lib/supabase';
import type { Noti1Data } from '../types';
import type { ProjectData } from '../../../types';
import { autoFillNoti1FromRapport } from './noti1AutoFillFromRapport';
import { enrichNoti1FromAllSources } from './noti1AutoFillFromMultipleSources';

/**
 * Mapping entre les champs de la table procédures et NOTI1
 */
export const PROCEDURE_TO_NOTI1_MAPPING = {
  'Nom de la procédure': 'objetConsultation',
  'Objet court': 'objetConsultation',
};

/**
 * Extrait les 5 premiers chiffres d'un numéro de procédure Afpa
 */
export function extractNumeroCourt(numeroAfpa: string): string {
  const match = numeroAfpa.match(/\d{5}/);
  return match ? match[0] : '';
}

/**
 * Récupère les données d'une procédure depuis Supabase via le numéro court (5 chiffres)
 */
export async function fetchProcedureByNumeroCourt(numeroCourt: string): Promise<ProjectData | null> {
  if (!numeroCourt || numeroCourt.length !== 5) {
    return null;
  }

  try {
    // Récupérer toutes les procédures et filtrer côté client
    const { data: allProcedures, error } = await supabase
      .from('procédures')
      .select('*');

    if (error) {
      console.error('Erreur récupération procédures:', error);
      return null;
    }

    if (!allProcedures || allProcedures.length === 0) {
      console.warn('Aucune procédure dans la base');
      return null;
    }

    // Filtrer côté client pour trouver une procédure dont le numéro Afpa commence par le numéro court
    const procedures = allProcedures.filter(p => {
      const numAfpa = String(p['Numéro de procédure (Afpa)'] || '');
      return numAfpa.startsWith(numeroCourt);
    });

    if (!procedures || procedures.length === 0) {
      console.warn(`Aucune procédure trouvée avec le numéro court ${numeroCourt}`);
      return null;
    }

    // Retourner la première procédure trouvée
    return procedures[0] as ProjectData;
  } catch (err) {
    console.error('Erreur lors de la requête Supabase:', err);
    return null;
  }
}

/**
 * Mappe les données de la procédure vers le format NOTI1
 */
export function mapProcedureToNoti1(
  procedure: ProjectData,
  currentData: Noti1Data
): Noti1Data {
  const mapped = JSON.parse(JSON.stringify(currentData)) as Noti1Data;

  // 1. Objet de la consultation
  const nomProc = procedure['Nom de la procédure'];
  const objetCourt = procedure['Objet court'];

  if (nomProc && objetCourt && nomProc !== objetCourt) {
    mapped.objetConsultation = `${objetCourt}\n\n${nomProc}`;
  } else if (nomProc) {
    mapped.objetConsultation = nomProc;
  } else if (objetCourt) {
    mapped.objetConsultation = objetCourt;
  }

  // 2. Lots (si la procédure est allotie)
  const nbLots = procedure['Nombre de lots'];
  if (nbLots && Number(nbLots) > 0) {
    mapped.attribution.type = 'lots';
    // Créer des lots vides que l'utilisateur pourra remplir
    mapped.attribution.lots = Array.from({ length: Math.min(Number(nbLots), 10) }, (_, i) => ({
      numero: String(i + 1),
      intitule: '',
    }));
  } else {
    mapped.attribution.type = 'ensemble';
    mapped.attribution.lots = [];
  }

  // 3. Dates - Calculer une date de signature par défaut (30 jours après la remise des offres)
  const dateRemise = procedure['Date de remise des offres'] || procedure['Date de remise des offres finales'];
  if (dateRemise) {
    const date = new Date(dateRemise);
    if (!isNaN(date.getTime())) {
      // Date de signature : J+30 après remise des offres
      const dateSignature = new Date(date);
      dateSignature.setDate(dateSignature.getDate() + 30);
      mapped.documents.dateSignature = dateSignature.toISOString().split('T')[0];

      // Date de signature du document
      mapped.signature.date = new Date().toISOString().split('T')[0];
    }
  }

  // 4. Pouvoir adjudicateur - TOUJOURS garder "Agence nationale pour la formation professionnelle des adultes"
  // Le champ "Acheteur" de la table procédures contient le nom de la personne (ex: "Auvray Laurine"),
  // PAS le nom de l'organisme. Ne jamais utiliser ce champ pour le nom de l'organisme.
  // Le nom de l'organisme doit TOUJOURS rester "Agence nationale pour la formation professionnelle des adultes"

  return mapped;
}

/**
 * Hook principal : récupère et mappe automatiquement les données depuis DEUX sources :
 * 1. Table "procédures" : objet, lots vides, dates
 * 2. Table "rapports_presentation" : attributaire pressenti, lots avec intitulés
 */
export async function autoFillNoti1FromProcedure(
  numeroCourt: string,
  currentData: Noti1Data
): Promise<{
  success: boolean;
  data?: Noti1Data;
  error?: string;
  procedureFound?: any;
  rapportFound?: boolean;
  attributaire?: string;
}> {
  try {
    console.log(`\n🔍 [NOTI1-AUTO-FILL] === DÉBUT AUTO-REMPLISSAGE ===`);
    console.log(`📋 Numéro court: ${numeroCourt}`);

    // ÉTAPE 1 : Récupérer les données de base depuis la table "procédures"
    console.log(`\n📊 [ÉTAPE 1/2] Chargement depuis table "procédures"...`);
    const procedure = await fetchProcedureByNumeroCourt(numeroCourt);

    if (!procedure) {
      console.warn(`❌ [NOTI1] Aucune procédure trouvée pour ${numeroCourt}`);
      return {
        success: false,
        error: `Aucune procédure trouvée avec le numéro ${numeroCourt}. Vérifiez que le champ "Numéro de procédure (Afpa)" contient bien ce numéro.`,
      };
    }

    console.log(`✅ [NOTI1] Procédure trouvée:`, {
      NumProc: procedure.NumProc,
      'Numéro de procédure (Afpa)': procedure['Numéro de procédure (Afpa)'],
      'Nom de la procédure': procedure['Nom de la procédure'],
    });

    // Mapper les données de la procédure (objet, dates, lots vides)
    let mappedData = mapProcedureToNoti1(procedure, currentData);

    // ÉTAPE 2 : Essayer de récupérer les données du rapport de présentation
    console.log(`\n📊 [ÉTAPE 2/3] Tentative de chargement depuis "rapports_presentation"...`);
    const rapportResult = await autoFillNoti1FromRapport(numeroCourt, mappedData);

    let rapportFound = false;
    let attributaire: string | undefined;

    if (rapportResult.success && rapportResult.data) {
      console.log(`✅ [NOTI1] Rapport de présentation trouvé ! Fusion des données...`);

      // Fusionner les données : priorité au rapport pour titulaire et lots
      mappedData = {
        ...mappedData,
        titulaire: rapportResult.data.titulaire, // Nom de l'attributaire
        attribution: rapportResult.data.attribution, // Type et lots avec intitulés
      };

      rapportFound = true;
      attributaire = rapportResult.attributaire;

      console.log(`✅ [NOTI1] Données fusionnées:`, {
        source_procedure: 'objet, dates',
        source_rapport: 'attributaire, lots',
        attributaire: attributaire,
        type_attribution: mappedData.attribution.type,
        nombre_lots: mappedData.attribution.lots?.length || 0,
      });
    } else {
      console.log(`ℹ️ [NOTI1] Pas de rapport de présentation trouvé.`);
      console.log(`   → L'utilisateur devra saisir manuellement le titulaire pressenti.`);
    }

    // ÉTAPE 3 : Enrichir avec les coordonnées depuis toutes les sources disponibles
    console.log(`\n📊 [ÉTAPE 3/3] Enrichissement des coordonnées depuis tables directes...`);
    mappedData = await enrichNoti1FromAllSources(numeroCourt, mappedData);

    console.log(`\n✅ [NOTI1-AUTO-FILL] === FIN AUTO-REMPLISSAGE ===\n`);

    return {
      success: true,
      data: mappedData,
      procedureFound: procedure['Numéro de procédure (Afpa)'],
      rapportFound,
      attributaire,
    };
  } catch (err) {
    console.error('❌ [NOTI1] Erreur autoFillNoti1FromProcedure:', err);
    return {
      success: false,
      error: String(err),
    };
  }
}
