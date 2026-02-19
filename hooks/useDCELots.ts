/**
 * useDCELots — charge les lots configurés dans le module DCE Complet
 * pour un numéro de procédure à 5 chiffres.
 * Retourne null si aucun DCE trouvé (fallback saisie manuelle).
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DCELot {
  numero: string;   // ex. "1", "01"
  intitule: string; // ex. "Sud-Est 1 - Savoie"
  montant?: string;
}

export function useDCELots(numProc5: string | null) {
  const [lots, setLots] = useState<DCELot[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!numProc5 || numProc5.length !== 5) {
      setLots(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('dce')
      .select('configuration_globale')
      .eq('numero_procedure', numProc5)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);

        if (error || !data?.configuration_globale) {
          setLots(null);
          return;
        }

        const cg = data.configuration_globale as any;
        const lotsArray: DCELot[] = Array.isArray(cg?.lots)
          ? cg.lots.filter((l: any) => l?.intitule || l?.numero)
          : [];

        setLots(lotsArray.length > 0 ? lotsArray : null);
      });

    return () => { cancelled = true; };
  }, [numProc5]);

  return { lots, loading };
}
