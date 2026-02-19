/**
 * Étape 4 : Grille financière (postes × candidats)
 */

import React, { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';
import type { AN01Lot, AN01FinancialRow } from '../../types/saisie';
import { createDefaultFinancialRow } from '../../types/saisie';

interface An01StepFinancierProps {
  lots: AN01Lot[];
  onChange: (lots: AN01Lot[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const parseNum = (v: string | number): number => {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

/** Affiche un décimal avec toujours 2 chiffres après la virgule (ex. 25,60 au lieu de 25,6). */
const formatDecimal2 = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  return Number(value).toFixed(2).replace('.', ',');
};

/** Totaux par candidat : somme des (quantité × prix unitaire) par ligne */
const computeTotals = (lot: AN01Lot): { totalQuantity: number; byCandidate: Record<string, number> } => {
  const byCandidate: Record<string, number> = {};
  lot.candidates.forEach(c => { byCandidate[c.id] = 0; });
  let totalQuantity = 0;
  for (const row of lot.financial_rows) {
    const qty = row.quantity ?? 0;
    totalQuantity += qty;
    lot.candidates.forEach(c => {
      byCandidate[c.id] += qty * (row.prices[c.id] ?? 0);
    });
  }
  return { totalQuantity, byCandidate };
};

const An01StepFinancier: React.FC<An01StepFinancierProps> = ({ lots, onChange, onBack, onNext }) => {
  const [selectedLotIndex, setSelectedLotIndex] = useState(0);
  const currentLot = lots[selectedLotIndex];

  const updateLot = (lotIndex: number, updater: (lot: AN01Lot) => AN01Lot) => {
    onChange(lots.map((l, i) => (i === lotIndex ? updater(l) : l)));
  };

  const addRow = () => {
    if (!currentLot) return;
    const newRow = createDefaultFinancialRow();
    const prices: Record<string, number> = {};
    currentLot.candidates.forEach(c => { prices[c.id] = 0; });
    newRow.prices = prices;
    updateLot(selectedLotIndex, (lot) => ({
      ...lot,
      financial_rows: [...lot.financial_rows, newRow],
    }));
  };

  const removeRow = (rowIndex: number) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => ({
      ...lot,
      financial_rows: lot.financial_rows.filter((_, i) => i !== rowIndex),
    }));
  };

  const updateRow = (rowIndex: number, field: 'item_description' | 'quantity', value: string | number) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => {
      const next = [...lot.financial_rows];
      next[rowIndex] = { ...next[rowIndex], [field]: field === 'quantity' ? parseNum(value as string) : value };
      return { ...lot, financial_rows: next };
    });
  };

  const updatePrice = (rowIndex: number, candidateId: string, value: string | number) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => {
      const next = [...lot.financial_rows];
      const row = { ...next[rowIndex], prices: { ...next[rowIndex].prices, [candidateId]: parseNum(value as string) } };
      next[rowIndex] = row;
      return { ...lot, financial_rows: next };
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between pb-2">
        <Button variant="secondary" onClick={onBack}>
          Retour
        </Button>
        <Button variant="primary" onClick={onNext}>
          Suivant : Critères techniques
        </Button>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analyse financière (BPU/DPGF)</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Saisissez les postes et les prix unitaires par candidat.</p>

      {lots.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Lot à éditer</label>
          <select
            value={selectedLotIndex}
            onChange={(e) => setSelectedLotIndex(parseInt(e.target.value, 10))}
            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
          >
            {lots.map((lot, i) => (
              <option key={lot.id} value={i}>
                {lot.lot_number} - {lot.lot_name || '(sans nom)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentLot && currentLot.candidates.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">Ce lot n&apos;a pas de candidats. Retournez à l&apos;étape Candidats pour en ajouter.</p>
      )}
      {currentLot && currentLot.candidates.length > 0 && (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addRow}>
              Ajouter un poste
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="text-left p-2 w-8 border-b border-gray-200 dark:border-gray-600" scope="col"></th>
                  <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600" scope="col">Description du poste</th>
                  <th className="p-2 w-24 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums" scope="col">Quantité</th>
                  {currentLot.candidates.map(c => (
                    <th key={c.id} className="p-2 w-28 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums truncate" title={c.company_name} scope="col">
                      {c.company_name || '(candidat)'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Ligne Total fixe en haut du tableau */}
                {(() => {
                  const { totalQuantity, byCandidate } = computeTotals(currentLot);
                  return (
                    <tr className="an01-row-total border-t border-b-2 border-gray-300 dark:border-gray-600 bg-emerald-50 dark:bg-slate-800 font-medium">
                      <td className="p-2 w-8 border-r border-gray-200 dark:border-gray-600" />
                      <td className="p-2 text-left text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-600">Total</td>
                      <td className="p-2 w-24 text-center text-gray-900 dark:text-white tabular-nums border-r border-gray-200 dark:border-gray-600 align-middle">{formatDecimal2(totalQuantity)}</td>
                      {currentLot.candidates.map(c => (
                        <td key={c.id} className="p-2 w-28 text-center text-gray-900 dark:text-white tabular-nums border-r border-gray-200 dark:border-gray-600 last:border-r-0 align-middle">
                          {formatDecimal2(byCandidate[c.id]) || '0,00'}
                        </td>
                      ))}
                    </tr>
                  );
                })()}
                {currentLot.financial_rows.map((row, ri) => (
                  <tr key={row.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-1 w-8 border-r border-gray-200 dark:border-gray-600 align-top">
                      <button
                        type="button"
                        onClick={() => removeRow(ri)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-2 border-r border-gray-200 dark:border-gray-600 align-top">
                      <input
                        type="text"
                        value={row.item_description}
                        onChange={(e) => updateRow(ri, 'item_description', e.target.value)}
                        placeholder="Libellé du poste"
                        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left"
                      />
                    </td>
                    <td className="p-2 w-24 text-right tabular-nums align-middle border-r border-gray-200 dark:border-gray-600">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatDecimal2(row.quantity)}
                        onChange={(e) => updateRow(ri, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 tabular-nums"
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    {currentLot.candidates.map((c, ci) => (
                      <td key={c.id} className={`p-2 w-28 text-right tabular-nums align-middle border-r border-gray-200 dark:border-gray-600 ${ci === currentLot.candidates.length - 1 ? 'border-r-0' : ''}`}>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formatDecimal2(row.prices[c.id])}
                          onChange={(e) => updatePrice(ri, c.id, e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 tabular-nums"
                          style={{ textAlign: 'right' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {currentLot.financial_rows.length === 0 && (
            <p className="text-sm text-gray-500">Aucun poste. Cliquez sur &quot;Ajouter un poste&quot;.</p>
          )}
        </>
      )}
    </div>
  );
};

export default An01StepFinancier;
