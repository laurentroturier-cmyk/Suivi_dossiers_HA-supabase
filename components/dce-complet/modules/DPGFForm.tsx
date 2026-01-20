import React, { useEffect, useState } from 'react';
import type { DPGFData } from '../types';

interface Props {
  data: DPGFData;
  onSave: (data: DPGFData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseLots = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [numero = '', intitule = '', montantInitial = '', montantFinal = '', avenantsRaw = ''] =
        line.split('|').map(v => v.trim());
      const avenants = avenantsRaw
        .split(';')
        .map(a => a.trim())
        .filter(Boolean)
        .map(a => {
          const [num = '', objet = '', montant = '', date = ''] = a.split(',').map(v => v.trim());
          return { numero: num, objet, montant, date };
        });
      return { numero, intitule, montantInitial, avenants, montantFinal };
    });

export function DPGFForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<DPGFData>(data);
  const [lotsText, setLotsText] = useState('');

  useEffect(() => {
    setForm(data);
    setLotsText(
      data.lots
        .map(lot => {
          const avenants = lot.avenants
            .map(a => `${a.numero},${a.objet},${a.montant},${a.date}`)
            .join('; ');
          return `${lot.numero} | ${lot.intitule} | ${lot.montantInitial} | ${lot.montantFinal} | ${avenants}`;
        })
        .join('\n')
    );
  }, [data]);

  const handleSave = () => {
    onSave({ ...form, lots: parseLots(lotsText) });
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-700">Format: "numero lot | intitule | montant initial | montant final | num,objet,montant,date; ..."</p>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Lots et avenants</label>
        <textarea
          value={lotsText}
          onChange={e => setLotsText(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 min-h-[160px] font-mono text-sm"
          placeholder="1 | Lot principal | 100000 | 105000 | 1,Avenant,5000,2024-04-01"
        />
      </section>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>
    </div>
  );
}
