/**
 * Étape 2 : Gestion des lots
 */

import React from 'react';
import { Input, Button } from '@/components/ui';
import { Plus, Trash2, Copy } from 'lucide-react';
import type { AN01Lot, AN01FinancialRow } from '../../types/saisie';
import { createDefaultLot } from '../../types/saisie';

interface An01StepLotsProps {
  lots: AN01Lot[];
  onChange: (lots: AN01Lot[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const An01StepLots: React.FC<An01StepLotsProps> = ({ lots, onChange, onBack, onNext }) => {
  const addLot = () => {
    onChange([...lots, createDefaultLot()]);
  };

  const removeLot = (index: number) => {
    if (lots.length <= 1) return;
    onChange(lots.filter((_, i) => i !== index));
  };

  const duplicateLot = (index: number) => {
    const lot = lots[index];
    const candIdMap: Record<string, string> = {};
    const newCandidates = lot.candidates.map(c => {
      const newId = `cand-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      candIdMap[c.id] = newId;
      return { ...c, id: newId };
    });
    const newPrices = (row: AN01FinancialRow) => {
      const p: Record<string, number> = {};
      Object.entries(row.prices || {}).forEach(([oldId, val]) => {
        const newId = candIdMap[oldId];
        if (newId) p[newId] = val;
      });
      newCandidates.forEach(c => { if (!p[c.id]) p[c.id] = 0; });
      return p;
    };
    const copy: AN01Lot = {
      ...lot,
      id: `lot-${Date.now()}`,
      candidates: newCandidates,
      financial_rows: lot.financial_rows.map(r => ({ ...r, id: `row-${Date.now()}-${r.id}`, prices: newPrices(r) })),
      criteria: lot.criteria.map(c => ({ ...c, id: `crit-${Date.now()}-${c.id}` })),
      notations: {},
    };
    const next = [...lots];
    next.splice(index + 1, 0, copy);
    onChange(next);
  };

  const updateLot = (index: number, updates: Partial<AN01Lot>) => {
    const next = [...lots];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between pb-2">
        <Button variant="secondary" onClick={onBack}>
          Retour
        </Button>
        <Button variant="primary" onClick={onNext} disabled={lots.length === 0}>
          Suivant : Candidats
        </Button>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des lots</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Ajoutez un ou plusieurs lots pour cette consultation.</p>

      {lots.map((lot, index) => (
        <div key={lot.id} className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">Lot {index + 1}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" icon={<Copy className="w-4 h-4" />} onClick={() => duplicateLot(index)}>
                Dupliquer
              </Button>
              {lots.length > 1 && (
                <Button size="sm" variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => removeLot(index)}>
                  Supprimer
                </Button>
              )}
            </div>
          </div>
          <Input
            label="N° de lot"
            value={lot.lot_number}
            onChange={(e) => updateLot(index, { lot_number: e.target.value })}
            placeholder="ex: 01"
          />
          <Input
            label="Nom du lot"
            value={lot.lot_name}
            onChange={(e) => updateLot(index, { lot_name: e.target.value })}
            placeholder="ex: Sud-Est 1 - Savoie"
          />
        </div>
      ))}

      <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={addLot} fullWidth>
        Ajouter un lot
      </Button>

      {lots.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">Ajoutez au moins un lot pour continuer.</p>
      )}
    </div>
  );
};

export default An01StepLots;
