/**
 * Calcul automatique du statut de la consultation selon les règles définies
 * Les règles sont évaluées dans l'ordre de priorité (1 = priorité la plus haute)
 */

import type { ProjectData } from '../types';

/**
 * Mapping des noms de champs JSON vers les noms réels dans ProjectData
 */
const FIELD_MAPPING: Record<string, keyof ProjectData> = {
  finalite_consultation: 'Finalité de la consultation',
  date_publication_donnees_essentielles: 'Données essentielles',
  date_avis_attribution: 'Avis d\'attribution',
  finalite: 'Finalité de la consultation',
  type_marche: 'Forme du marché',
  Reprise_au_statut_Termine: 'Reprise_au_statut_Termine' as keyof ProjectData,
  statut_rapport_presentation: 'RP - Statut',
  date_ouverture_offres: 'Date d\'ouverture des offres',
  date_remise_offres: 'Date de remise des offres',
  date_publication: 'date_de_lancement_de_la_consultation',
  numero_afpa_consultation: 'Numéro de procédure (Afpa)',
};

/**
 * Récupère la valeur d'un champ depuis une procédure
 */
function getFieldValue(procedure: ProjectData, fieldName: string): any {
  const mappedField = FIELD_MAPPING[fieldName] || fieldName as keyof ProjectData;
  return procedure[mappedField];
}

/**
 * Évalue une condition simple
 */
function evaluateCondition(procedure: ProjectData, condition: any): boolean {
  const { champ, operateur, valeur } = condition;
  
  if (!champ) {
    // Condition par défaut (toujours vraie)
    if (condition.default === true) return true;
    return false;
  }

  const fieldValue = getFieldValue(procedure, champ);
  
  switch (operateur) {
    case '==':
      return String(fieldValue || '').toLowerCase() === String(valeur || '').toLowerCase();
    
    case '!=':
      return String(fieldValue || '').toLowerCase() !== String(valeur || '').toLowerCase();
    
    case '<':
      if (valeur === 'AUJOURDHUI') {
        const date = parseDate(fieldValue);
        if (!date) return false;
        return date < new Date();
      }
      return compareValues(fieldValue, valeur, '<');
    
    case '<=':
      if (valeur === 'AUJOURDHUI') {
        const date = parseDate(fieldValue);
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fieldDate = new Date(date);
        fieldDate.setHours(0, 0, 0, 0);
        return fieldDate <= today;
      }
      return compareValues(fieldValue, valeur, '<=');
    
    case '>':
      if (valeur === 'AUJOURDHUI') {
        const date = parseDate(fieldValue);
        if (!date) return false;
        return date > new Date();
      }
      return compareValues(fieldValue, valeur, '>');
    
    case '>=':
      if (valeur === 'AUJOURDHUI') {
        const date = parseDate(fieldValue);
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fieldDate = new Date(date);
        fieldDate.setHours(0, 0, 0, 0);
        return fieldDate >= today;
      }
      return compareValues(fieldValue, valeur, '>=');
    
    case 'IN':
      if (Array.isArray(valeur)) {
        const fieldStr = String(fieldValue || '').toLowerCase();
        return valeur.some(v => fieldStr === String(v || '').toLowerCase());
      }
      return false;
    
    case 'IS_NOT_NULL':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
    
    default:
      return false;
  }
}

/**
 * Parse une date depuis différents formats
 */
function parseDate(value: any): Date | null {
  if (!value) return null;
  
  // Si c'est déjà une Date
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  // Si c'est un nombre (format Excel)
  if (typeof value === 'number' && value > 40000) {
    // Date Excel (nombre de jours depuis 1900-01-01)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Si c'est une chaîne
  if (typeof value === 'string') {
    // Format DD/MM/YYYY
    if (value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        return isNaN(date.getTime()) ? null : date;
      }
    }
    
    // Format ISO ou autre
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

/**
 * Compare deux valeurs
 */
function compareValues(a: any, b: any, operator: string): boolean {
  const numA = typeof a === 'number' ? a : parseFloat(String(a));
  const numB = typeof b === 'number' ? b : parseFloat(String(b));
  
  if (!isNaN(numA) && !isNaN(numB)) {
    switch (operator) {
      case '<': return numA < numB;
      case '<=': return numA <= numB;
      case '>': return numA > numB;
      case '>=': return numA >= numB;
    }
  }
  
  return false;
}

/**
 * Évalue une liste de conditions avec un opérateur logique
 */
function evaluateConditionList(procedure: ProjectData, conditions: any): boolean {
  if (!conditions || !Array.isArray(conditions.liste)) {
    return false;
  }

  const { operateur, liste } = conditions;

  if (operateur === 'ET') {
    // Toutes les conditions doivent être vraies
    return liste.every((cond: any) => {
      if (cond.operateur === 'ET' || cond.operateur === 'OU') {
        return evaluateConditionList(procedure, cond);
      }
      return evaluateCondition(procedure, cond);
    });
  } else if (operateur === 'OU') {
    // Au moins une condition doit être vraie
    return liste.some((cond: any) => {
      if (cond.operateur === 'ET' || cond.operateur === 'OU') {
        return evaluateConditionList(procedure, cond);
      }
      return evaluateCondition(procedure, cond);
    });
  }

  return false;
}

/**
 * Règles de calcul du statut (par ordre de priorité décroissante)
 */
const STATUT_RULES = [
  {
    statut: '5 - Terminée',
    priorite: 1,
    conditions: {
      operateur: 'OU',
      liste: [
        {
          champ: 'finalite_consultation',
          operateur: '==',
          valeur: 'Abandonnée',
        },
        {
          champ: 'date_publication_donnees_essentielles',
          operateur: 'IS_NOT_NULL',
        },
        {
          operateur: 'ET',
          liste: [
            {
              champ: 'date_avis_attribution',
              operateur: 'IS_NOT_NULL',
            },
            {
              champ: 'finalite',
              operateur: 'IS_NOT_NULL',
            },
            {
              champ: 'finalite',
              operateur: '!=',
              valeur: 'Attribuée',
            },
          ],
        },
        {
          operateur: 'ET',
          liste: [
            {
              champ: 'type_marche',
              operateur: '==',
              valeur: 'Subséquent',
            },
            {
              champ: 'finalite',
              operateur: 'IN',
              valeur: ['Sans suite', 'Infructueuse'],
            },
          ],
        },
        {
          champ: 'Reprise_au_statut_Termine',
          operateur: '==',
          valeur: true,
        },
      ],
    },
  },
  {
    statut: '4.4 - Notification en cours',
    priorite: 2,
    conditions: {
      champ: 'statut_rapport_presentation',
      operateur: '==',
      valeur: '3-Validé',
    },
  },
  {
    statut: '4.3 - Validation RP en cours',
    priorite: 3,
    conditions: {
      champ: 'statut_rapport_presentation',
      operateur: 'IN',
      valeur: ['2-En cours'],
    },
  },
  {
    statut: '4.2 - Analyse en cours',
    priorite: 4,
    conditions: {
      operateur: 'ET',
      liste: [
        {
          champ: 'date_ouverture_offres',
          operateur: 'IS_NOT_NULL',
        },
        {
          champ: 'date_ouverture_offres',
          operateur: '<=',
          valeur: 'AUJOURDHUI',
        },
      ],
    },
  },
  {
    statut: '4.1 - En attente de d\'ouverture',
    priorite: 5,
    conditions: {
      champ: 'date_remise_offres',
      operateur: '<',
      valeur: 'AUJOURDHUI',
    },
  },
  {
    statut: '3 - Publiée',
    priorite: 6,
    conditions: {
      champ: 'date_publication',
      operateur: '<=',
      valeur: 'AUJOURDHUI',
    },
  },
  {
    statut: '2 - Rédaction',
    priorite: 7,
    conditions: {
      operateur: 'ET',
      liste: [
        {
          champ: 'date_publication',
          operateur: '>',
          valeur: 'AUJOURDHUI',
        },
        {
          champ: 'numero_afpa_consultation',
          operateur: 'IS_NOT_NULL',
        },
      ],
    },
  },
  {
    statut: '1 - Initiée',
    priorite: 8,
    conditions: {
      default: true,
    },
  },
];

/**
 * Calcule le statut automatique d'une procédure selon les règles définies
 * @param procedure La procédure à évaluer
 * @returns Le statut calculé
 */
export function calculateStatutConsultation(procedure: ProjectData): string {
  // Parcourir les règles dans l'ordre de priorité (1 à 8)
  for (const rule of STATUT_RULES) {
    const { conditions } = rule;
    
    // Si c'est une condition simple
    if (conditions.champ || conditions.default) {
      if (evaluateCondition(procedure, conditions)) {
        return rule.statut;
      }
    }
    // Si c'est une liste de conditions
    else if (conditions.operateur && conditions.liste) {
      if (evaluateConditionList(procedure, conditions)) {
        return rule.statut;
      }
    }
  }
  
  // Par défaut, retourner "1 - Initiée"
  return '1 - Initiée';
}
