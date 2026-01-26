// ============================================
// SERVICE DE SYNCHRONISATION PROCÉDURES ↔ DCE
// Gère les conflits et la mise à jour bidirectionnelle
// ============================================

import { supabase } from '../../../lib/supabase';
import type { ProjectData } from '../../../types';
import type { DCEState } from '../types';
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

/**
 * Mapping DCE → Procédures (table procedures)
 * Clés : chemin dans DCE | Valeurs : colonne dans procedures
 */
export const DCE_TO_PROCEDURE_MAPPING: Record<string, keyof ProjectData> = {
  // En-tête RC
  'reglementConsultation.enTete.titreMarche': 'Nom de la procédure',
  'reglementConsultation.enTete.numeroMarche': 'Numéro de procédure (Afpa)',
  'reglementConsultation.enTete.dateLimiteOffres': 'Date de remise des offres',
  
  // Objet
  // NOTE: 'reglementConsultation.objet.description' est un champ de saisie LIBRE, non mappé avec procédures
  'reglementConsultation.objet.cpvPrincipal': 'Code CPV Principal',
  
  // Conditions
  'reglementConsultation.conditions.modePassation': 'Type de procédure',
  'reglementConsultation.conditions.nbLots': 'Nombre de lots',
  
  // Type de marché
  'reglementConsultation.typeMarche.forme': 'Forme du marché',
  'reglementConsultation.typeMarche.dureeInitiale': 'Durée du marché (en mois)',
  
  // Remise
  'reglementConsultation.remise.delaiValiditeOffres': 'Durée de validité des offres (en jours)',
  
  // Titre marché (niveau global)
  'titreMarche': 'Nom de la procédure',
};

/**
 * Représente un conflit détecté entre DCE et Procédures
 */
export interface DataConflict {
  field: string; // Nom du champ (ex: "Titre du marché")
  dcePath: string; // Chemin dans DCE (ex: "reglementConsultation.enTete.titreMarche")
  procedureColumn: string; // Colonne dans procedures
  dceValue: any; // Valeur dans le DCE
  procedureValue: any; // Valeur dans procedures
  priority: 'procedure' | 'dce'; // Quelle source est prioritaire
}

/**
 * Options de résolution d'un conflit
 */
export type ConflictResolution = 
  | 'keep-procedure'     // Garder la valeur de procedures, écraser DCE
  | 'keep-dce'           // Garder la valeur du DCE, écraser procedures
  | 'skip-field';        // Ne rien faire pour ce champ

/**
 * Résultat de la détection de conflits
 */
export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: DataConflict[];
  recommendation: string;
}

/**
 * Extrait une valeur depuis un objet via un chemin (ex: "a.b.c")
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/**
 * Définit une valeur dans un objet via un chemin (ex: "a.b.c")
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((acc, key) => {
    if (!acc[key]) acc[key] = {};
    return acc[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Compare deux valeurs en normalisant les formats (dates, nombres, texte)
 */
function areValuesEqual(val1: any, val2: any): boolean {
  // Si les deux sont null/undefined/vides
  if (!val1 && !val2) return true;
  
  // Si un seul est vide
  if (!val1 || !val2) return false;
  
  // Normaliser les chaînes
  const str1 = String(val1).trim().toLowerCase();
  const str2 = String(val2).trim().toLowerCase();
  
  // Comparaison stricte
  if (str1 === str2) return true;
  
  // Comparaison de dates (formats multiples)
  const date1 = new Date(val1);
  const date2 = new Date(val2);
  if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
    return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
  }
  
  // Comparaison de nombres
  const num1 = parseFloat(val1);
  const num2 = parseFloat(val2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return num1 === num2;
  }
  
  return false;
}

/**
 * Détecte les conflits entre les données DCE et Procédures
 */
export async function detectConflicts(
  dceState: DCEState,
  procedure: ProjectData
): Promise<ConflictDetectionResult> {
  const conflicts: DataConflict[] = [];
  
  // Comparer chaque champ mappé
  for (const [dcePath, procedureColumn] of Object.entries(DCE_TO_PROCEDURE_MAPPING)) {
    const dceValue = getNestedValue(dceState, dcePath);
    const procedureValue = procedure[procedureColumn];
    
    // Si les valeurs diffèrent
    if (!areValuesEqual(dceValue, procedureValue)) {
      // Ignorer si les deux sont vides
      if (!dceValue && !procedureValue) continue;
      
      conflicts.push({
        field: getFriendlyFieldName(dcePath),
        dcePath,
        procedureColumn: procedureColumn as string,
        dceValue,
        procedureValue,
        priority: 'procedure', // Par défaut, priorité à procedures
      });
    }
  }
  
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    recommendation: conflicts.length > 0
      ? `${conflicts.length} différence(s) détectée(s) entre le DCE et la table procédures.`
      : 'Aucune différence détectée.',
  };
}

/**
 * Retourne un nom convivial pour un champ DCE
 */
function getFriendlyFieldName(dcePath: string): string {
  const friendlyNames: Record<string, string> = {
    'reglementConsultation.enTete.titreMarche': 'Titre du marché',
    'reglementConsultation.enTete.numeroMarche': 'Numéro de marché',
    'reglementConsultation.enTete.dateLimiteOffres': 'Date limite des offres',
    'reglementConsultation.objet.description': 'Objet de la consultation',
    'reglementConsultation.objet.cpvPrincipal': 'Code CPV',
    'reglementConsultation.conditions.modePassation': 'Mode de passation',
    'reglementConsultation.conditions.nbLots': 'Nombre de lots',
    'reglementConsultation.typeMarche.forme': 'Forme du marché',
    'reglementConsultation.typeMarche.dureeInitiale': 'Durée initiale',
    'reglementConsultation.remise.delaiValiditeOffres': 'Délai de validité des offres',
    'titreMarche': 'Titre du marché (global)',
  };
  
  return friendlyNames[dcePath] || dcePath;
}

/**
 * Applique les résolutions de conflits
 */
export async function resolveConflicts(
  conflicts: DataConflict[],
  resolutions: Record<string, ConflictResolution>,
  dceState: DCEState,
  procedure: ProjectData
): Promise<{
  updatedDCE: DCEState;
  updatedProcedure: Partial<ProjectData>;
  needsDCEUpdate: boolean;
  needsProcedureUpdate: boolean;
}> {
  const updatedDCE = JSON.parse(JSON.stringify(dceState)) as DCEState;
  const updatedProcedure: Partial<ProjectData> = {};
  
  let needsDCEUpdate = false;
  let needsProcedureUpdate = false;
  
  for (const conflict of conflicts) {
    const resolution = resolutions[conflict.dcePath] || 'keep-procedure';
    
    switch (resolution) {
      case 'keep-procedure':
        // Écraser la valeur DCE avec celle de procedures
        setNestedValue(updatedDCE, conflict.dcePath, conflict.procedureValue);
        needsDCEUpdate = true;
        break;
        
      case 'keep-dce':
        // Écraser la valeur procedures avec celle du DCE
        updatedProcedure[conflict.procedureColumn as keyof ProjectData] = conflict.dceValue;
        needsProcedureUpdate = true;
        break;
        
      case 'skip-field':
        // Ne rien faire
        break;
    }
  }
  
  return {
    updatedDCE,
    updatedProcedure,
    needsDCEUpdate,
    needsProcedureUpdate,
  };
}

/**
 * Met à jour la table procedures dans Supabase
 */
export async function updateProcedure(
  numeroProcedure: string,
  updates: Partial<ProjectData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Chercher la procédure par numéro court (5 chiffres)
    const { data: existingProcedures, error: fetchError } = await supabase
      .from('procédures')
      .select('*')
      .eq('numero court procédure afpa', numeroProcedure)
      .limit(1);
    
    if (fetchError) {
      return { success: false, error: fetchError.message };
    }
    
    if (!existingProcedures || existingProcedures.length === 0) {
      return { success: false, error: 'Procédure introuvable' };
    }
    
    const procedureId = existingProcedures[0].id;
    
    // Mettre à jour
    const { error: updateError } = await supabase
      .from('procédures')
      .update(updates)
      .eq('id', procedureId);
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Charge les données de procedures et pré-remplit le DCE
 * Retourne aussi les conflits détectés
 */
export async function loadAndMergeProcedureData(
  numeroProcedure: string,
  currentDCE: DCEState
): Promise<{
  mergedDCE: DCEState;
  procedure: ProjectData | null;
  conflicts: ConflictDetectionResult;
}> {
  // Charger la procédure
  const { data: procedures, error } = await supabase
    .from('procédures')
    .select('*')
    .eq('numero court procédure afpa', numeroProcedure)
    .limit(1);
  
  if (error || !procedures || procedures.length === 0) {
    return {
      mergedDCE: currentDCE,
      procedure: null,
      conflicts: { hasConflicts: false, conflicts: [], recommendation: 'Procédure introuvable' },
    };
  }
  
  const procedure = procedures[0] as ProjectData;
  
  // Détecter les conflits
  const conflicts = await detectConflicts(currentDCE, procedure);
  
  // Pré-remplir le DCE avec les données de procedures (priorité à procedures)
  const mergedDCE = JSON.parse(JSON.stringify(currentDCE)) as DCEState;
  
  for (const [dcePath, procedureColumn] of Object.entries(DCE_TO_PROCEDURE_MAPPING)) {
    const procedureValue = procedure[procedureColumn];
    if (procedureValue && procedureValue !== '') {
      setNestedValue(mergedDCE, dcePath, procedureValue);
    }
  }
  
  return {
    mergedDCE,
    procedure,
    conflicts,
  };
}
