/**
 * Types pour le module AN01 Saisie (projet autonome)
 * Alignés sur la spec AN01_module_spec.json
 */

export interface AN01ProjectMeta {
  consultation_number: string;
  procedure_short?: string;
  num_proc?: string;
  description: string;
  buyer: string;
  requester: string;
  technical_validator?: string;
  decision_deadline?: string;
  tva_rate: number;
  financial_weight: number;
  selected_suppliers: number;
}

export interface AN01Lot {
  id: string;
  lot_number: string;
  lot_name: string;
  candidates: AN01Candidate[];
  financial_rows: AN01FinancialRow[];
  criteria: AN01Criterion[];
  /** notation[candidateId][criterionId] = score 0-4 */
  notations: Record<string, Record<string, { score: number; comment?: string }>>;
}

export interface AN01Candidate {
  id: string;
  company_name: string;
}

export interface AN01FinancialRow {
  id: string;
  item_description: string;
  quantity: number;
  /** prix par candidat: candidateId -> prix unitaire */
  prices: Record<string, number>;
}

export interface AN01Criterion {
  id: string;
  code: string;
  label: string;
  base_points: number;
  parent_id?: string;
  /** Hiérarchie 3 niveaux (critère / sous-critère / question) : libellé du critère parent */
  criterion_label?: string;
  /** Code du critère parent (ex. "1") */
  criterion_code?: string;
  /** Libellé du sous-critère parent */
  sub_criterion_label?: string;
  /** Code du sous-critère parent (ex. "1.1") */
  sub_criterion_code?: string;
}

export interface AN01Project {
  id: string;
  meta: AN01ProjectMeta;
  lots: AN01Lot[];
  created_at?: string;
  updated_at?: string;
}

/** Échelle de notation technique (0-4) */
export const NOTATION_SCALE = [
  { value: 0, label: '0 - Non conforme', description: 'Ne répond pas au besoin ou inacceptable' },
  { value: 1, label: '1 - Peu satisfaisant', description: 'Répond partiellement au besoin avec des lacunes importantes' },
  { value: 2, label: '2 - Moyennement satisfaisant', description: 'Répond au minimum attendu' },
  { value: 3, label: '3 - Satisfaisant', description: 'Répond bien au besoin' },
  { value: 4, label: '4 - Au-delà du besoin', description: 'Apporte une réponse au-delà de la demande' },
] as const;

export function createDefaultProject(): AN01Project {
  const id = `an01-${Date.now()}`;
  return {
    id,
    meta: {
      consultation_number: '',
      procedure_short: '',
      num_proc: '',
      description: '',
      buyer: '',
      requester: '',
      tva_rate: 0.2,
      financial_weight: 60,
      selected_suppliers: 1,
    },
    lots: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function createDefaultLot(): AN01Lot {
  return {
    id: `lot-${Date.now()}`,
    lot_number: '',
    lot_name: '',
    candidates: [],
    financial_rows: [],
    criteria: [],
    notations: {},
  };
}

export function createDefaultCandidate(): AN01Candidate {
  return {
    id: `cand-${Date.now()}`,
    company_name: '',
  };
}

export function createDefaultFinancialRow(): AN01FinancialRow {
  return {
    id: `row-${Date.now()}`,
    item_description: '',
    quantity: 0,
    prices: {},
  };
}

export function createDefaultCriterion(): AN01Criterion {
  return {
    id: `crit-${Date.now()}`,
    code: '',
    label: '',
    base_points: 0,
  };
}
