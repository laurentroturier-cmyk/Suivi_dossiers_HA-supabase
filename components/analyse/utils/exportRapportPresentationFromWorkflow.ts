/**
 * Orchestrateur : charge la procédure, le rapport sauvegardé et exporte le Rapport de Présentation en PDF.
 * Utilisé depuis le workflow "Analyse des Offres" (tuile Export PDF).
 */

import { supabase } from '../../../lib/supabase';
import { exportRapportPresentationPdf } from './rapportPresentationPdfExport';

export type ExportProgressCallback = (step: string, progress: number) => void;

const PROGRESS_LOAD_PROCEDURE = 0.15;
const PROGRESS_LOAD_RAPPORT = 0.5;
const PROGRESS_GENERATE_PDF = 0.9;
const PROGRESS_DONE = 1;

export interface ExportRapportResult {
  success: boolean;
  error?: string;
}

/**
 * Charge le rapport de présentation sauvegardé le plus récent pour une procédure.
 */
async function loadLatestRapport(numProc: string): Promise<{ rapport_data: any; titre?: string } | null> {
  const { data, error } = await supabase
    .from('rapports_presentation')
    .select('rapport_data, titre')
    .eq('num_proc', numProc)
    .order('date_creation', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erreur chargement rapport:', error);
    throw new Error(`Impossible de charger le rapport : ${error.message}`);
  }
  return data;
}

/**
 * Exporte le Rapport de Présentation en PDF depuis le workflow :
 * 1. Valide procédure et numéro
 * 2. Charge le rapport sauvegardé (rapports_presentation)
 * 3. Génère et télécharge le PDF
 *
 * @param numeroProcedure Numéro à 5 chiffres (affiché)
 * @param procedure Objet procédure (doit contenir NumProc, "Numéro de procédure (Afpa)")
 * @param onProgress Callback optionnel pour la barre de progression (étape, 0–1)
 */
export async function exportRapportPresentationFromWorkflow(
  numeroProcedure: string,
  procedure: any,
  onProgress?: ExportProgressCallback
): Promise<ExportRapportResult> {
  const report = (step: string, progress: number) => {
    onProgress?.(step, progress);
  };

  try {
    report('Vérification de la procédure...', 0.05);

    if (!numeroProcedure || numeroProcedure.trim().length !== 5 || !/^\d{5}$/.test(numeroProcedure.trim())) {
      return {
        success: false,
        error: 'Numéro de procédure invalide. Saisissez un numéro à 5 chiffres.',
      };
    }

    if (!procedure || typeof procedure !== 'object') {
      return {
        success: false,
        error: 'Aucune procédure sélectionnée. Sélectionnez une procédure dans le workflow avant d\'exporter.',
      };
    }

    const numProc = procedure.NumProc ?? procedure.num_proc;
    if (!numProc) {
      return {
        success: false,
        error: 'Procédure incomplète (numéro interne manquant). Réessayez après avoir sélectionné la procédure.',
      };
    }

    report('Chargement du rapport sauvegardé...', PROGRESS_LOAD_PROCEDURE);

    const rapportRow = await loadLatestRapport(String(numProc));

    if (!rapportRow) {
      return {
        success: false,
        error: 'Aucun rapport de présentation sauvegardé pour cette procédure. Générez et enregistrez d\'abord un rapport dans le module « Rapport de Présentation ».',
      };
    }

    const rapportData = rapportRow.rapport_data;
    if (!rapportData || typeof rapportData !== 'object') {
      return {
        success: false,
        error: 'Le rapport sauvegardé est vide ou invalide. Régénérez et enregistrez le rapport dans le module « Rapport de Présentation ».',
      };
    }

    report('Génération du PDF...', PROGRESS_LOAD_RAPPORT);

    const numeroAfpa = procedure['Numéro de procédure (Afpa)'] || numeroProcedure;
    const pdfData = {
      ...rapportData,
      numeroProcedure: numeroAfpa,
      procedureSelectionnee: procedure,
      contenuChapitre3: rapportData.contenuChapitre3 ?? '',
      contenuChapitre4: rapportData.contenuChapitre4 ?? '',
      chapitre10: rapportData.chapitre10 ?? {
        validationAttribution: "à l'issue de la validation d'attribution du marché",
        envoiRejet: "à l'issue du délai de standstill",
        attributionMarche: '',
        autresElements: '',
      },
    };

    report('Téléchargement du PDF...', PROGRESS_GENERATE_PDF);

    const filename = `Rapport_Presentation_${numeroAfpa || numeroProcedure}_${new Date().toISOString().split('T')[0]}.pdf`;
    await exportRapportPresentationPdf(pdfData, filename);

    report('Export terminé.', PROGRESS_DONE);

    return { success: true };
  } catch (err: any) {
    const message = err?.message || 'Erreur inattendue lors de l\'export PDF.';
    console.error('exportRapportPresentationFromWorkflow:', err);
    return {
      success: false,
      error: message,
    };
  }
}
