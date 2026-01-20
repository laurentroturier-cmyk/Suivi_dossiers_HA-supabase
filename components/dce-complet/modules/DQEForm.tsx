import React, { useEffect, useState } from 'react';
import type { DQEData } from '../types';

interface Props {
  data: DQEData;
  onSave: (data: DQEData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseLots = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [numero = '', intitule = '', lignesRaw = '', totalLot = ''] = line.split('|').map(v => v.trim());
      const lignes = lignesRaw
        .split(';')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
          const [num = '', designation = '', unite = '', quantite = '', prixUnitaire = '', montantTotal = ''] =
            l.split(',').map(v => v.trim());
          return { numero: num, designation, unite, quantite, prixUnitaire, montantTotal };
        });
      return { numero, intitule, lignes, totalLot };
    });

export function DQEForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<DQEData>(data);
  const [lotsText, setLotsText] = useState('');

  useEffect(() => {
    setForm(data);
    setLotsText(
      data.lots
        .map(lot => {
          const lignes = lot.lignes
            .map(ligne => `${ligne.numero},${ligne.designation},${ligne.unite},${ligne.quantite},${ligne.prixUnitaire || ''},${ligne.montantTotal || ''}`)
            .join('; ');
          return `${lot.numero} | ${lot.intitule} | ${lignes} | ${lot.totalLot}`;
        })
        .join('\n')
    );
  }, [data]);

  const handleSave = () => {
    onSave({ ...form, lots: parseLots(lotsText) });
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-700">Format: "numero lot | intitule lot | num,designation,unite,quantite,prixU,montant; ... | total lot"</p>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Lots et lignes</label>
        <textarea
          value={lotsText}
          onChange={e => setLotsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[180px] font-mono text-sm"
          placeholder="1 | Lot principal | 01,Prestation,U,10,100,1000; 02,Option,U,5,50,250 | 1250"
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total general</label>
          <input
            value={form.totalGeneral}
            onChange={e => setForm(prev => ({ ...prev, totalGeneral: e.target.value }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Total"
          />
        </div>
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
