/**
 * Charge le questionnaire technique du DCE (table questionnaires_techniques)
 * pour un lot donné, afin de proposer critères / sous-critères / questions
 * dans l'étape Critères techniques AN01.
 */

import { supabase } from '@/lib/supabase';
import type { AN01Criterion } from '../types/saisie';

/** Structure minimale du QT stocké (alignée sur redaction questionnaire) */
export interface QTCritere {
  id: string;
  nom: string;
  sousCriteres?: QTSousCritere[];
}

export interface QTSousCritere {
  id: string;
  nom: string;
  questions?: QTQuestion[];
}

export interface QTQuestion {
  id: string;
  intitule: string;
  pointsMax: number;
}

export interface QTDataFromDb {
  criteres?: QTCritere[];
  savedAt?: string;
  version?: string;
}

/** Retourne les identifiants de procédure possibles pour un numéro (ex. 25006 ou 25006_AOO_TMA-EPM_LAY). */
async function getProcedureIdentifiers(numeroProcedureShort: string): Promise<string[]> {
  const trimmed = numeroProcedureShort.trim();
  const seen = new Set<string>([trimmed]);
  const searchTerms: string[] = [trimmed];
  const fiveDigits = /^\d{5}$/.exec(trimmed)?.[0];
  if (fiveDigits) searchTerms.push(fiveDigits);
  else if (trimmed.length > 5) {
    const leading = /^\d{5}/.exec(trimmed)?.[0];
    if (leading) searchTerms.push(leading);
  }

  const add = (v: unknown) => {
    if (v != null && typeof v === 'string' && v.trim()) {
      const s = v.trim();
      if (!seen.has(s)) {
        seen.add(s);
        return s;
      }
    }
    return null;
  };

  try {
    for (const term of [...new Set(searchTerms)]) {
      const { data: byCourt, error: e1 } = await supabase
        .from('procédures')
        .select('NumProc, "numero court procédure afpa", "Numéro de procédure (Afpa)"')
        .ilike('numero court procédure afpa', `%${term}%`)
        .limit(5);
      if (!e1 && byCourt?.length) {
        for (const p of byCourt) {
          add(p?.NumProc);
          add(p?.['Numéro de procédure (Afpa)']);
          add(p?.['numero court procédure afpa']);
        }
      }
      const { data: byAfpa, error: e2 } = await supabase
        .from('procédures')
        .select('NumProc, "numero court procédure afpa", "Numéro de procédure (Afpa)"')
        .ilike('Numéro de procédure (Afpa)', `%${term}%`)
        .limit(5);
      if (!e2 && byAfpa?.length) {
        for (const p of byAfpa) {
          add(p?.NumProc);
          add(p?.['Numéro de procédure (Afpa)']);
          add(p?.['numero court procédure afpa']);
        }
      }
    }
  } catch (_) {}
  return Array.from(seen);
}

/**
 * Charge le questionnaire technique pour la procédure et le lot.
 * consultationNumber : numéro à 5 chiffres (ex. 25006) ou NumProc (ex. 1013-1)
 * numeroLot : numéro de lot (1, 2, 3...)
 * Essaie plusieurs valeurs de num_proc (NumProc, Numéro Afpa, numéro court) pour retrouver le questionnaire.
 */
export async function loadTechnicalQuestionnaireForLot(
  consultationNumber: string,
  numeroLot: number
): Promise<{ criteres: QTCritere[] } | null> {
  if (!consultationNumber?.trim()) return null;

  const possibleNumProcs = await getProcedureIdentifiers(consultationNumber.trim());

  for (const numProc of possibleNumProcs) {
    const { data, error } = await supabase
      .from('questionnaires_techniques')
      .select('qt_data')
      .eq('num_proc', numProc)
      .eq('numero_lot', numeroLot)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') continue;
    const qtData = data?.qt_data as QTDataFromDb | undefined;
    const criteres = qtData?.criteres ?? [];
    if (criteres.length) return { criteres };
  }

  return null;
}

const generateId = () => `crit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Transforme les critères/sous-critères/questions du QT en critères AN01 (3 niveaux).
 * - Un critère AN01 par **question** : code "1.1.1", label = intitulé de la question, barème = pointsMax.
 * - Champs hiérarchie : criterion_label/code, sub_criterion_label/code pour afficher en-têtes.
 * - Si un sous-critère n'a pas de questions, un critère AN01 pour le sous-critère (code 1.1, barème 0).
 */
export function mapQTCriteresToAN01Criteria(qtCriteres: QTCritere[]): AN01Criterion[] {
  const out: AN01Criterion[] = [];

  for (let ci = 0; ci < qtCriteres.length; ci++) {
    const c = qtCriteres[ci];
    const sousCriteres = c.sousCriteres ?? [];
    const critCode = String(ci + 1);
    const critLabel = c.nom || `Critère ${critCode}`;

    if (sousCriteres.length === 0) {
      out.push({
        id: generateId(),
        code: critCode,
        label: critLabel,
        base_points: 0,
        criterion_code: critCode,
        criterion_label: critLabel,
      });
      continue;
    }

    for (let si = 0; si < sousCriteres.length; si++) {
      const s = sousCriteres[si];
      const questions = s.questions ?? [];
      const subCode = `${ci + 1}.${si + 1}`;
      const subLabel = s.nom || `Sous-critère ${subCode}`;

      if (questions.length === 0) {
        out.push({
          id: generateId(),
          code: subCode,
          label: subLabel,
          base_points: 0,
          criterion_code: critCode,
          criterion_label: critLabel,
          sub_criterion_code: subCode,
          sub_criterion_label: subLabel,
        });
        continue;
      }

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        const questionCode = `${ci + 1}.${si + 1}.${qi + 1}`;
        const rawIntitule = (q.intitule ?? '').trim();
        const isPlaceholder =
          !rawIntitule || rawIntitule.toLowerCase() === 'nouvelle question';
        const label = isPlaceholder
          ? `${subLabel} — Q${questionCode}`
          : rawIntitule;
        out.push({
          id: generateId(),
          code: questionCode,
          label,
          base_points: q.pointsMax ?? 0,
          criterion_code: critCode,
          criterion_label: critLabel,
          sub_criterion_code: subCode,
          sub_criterion_label: subLabel,
        });
      }
    }
  }

  return out;
}
