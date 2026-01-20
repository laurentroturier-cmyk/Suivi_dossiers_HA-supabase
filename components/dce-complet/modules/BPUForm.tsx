import React, { useEffect, useState } from 'react';
import type { BPUData } from '../types';

interface Props {
  data: BPUData;
  onSave: (data: BPUData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseLots = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [numero = '', intitule = '', lignesRaw = ''] = line.split('|').map(v => v.trim());
      const lignes = lignesRaw
        .split(';')
        .map(l => l.trim())
        .filter(Boolean)
        .map(l => {
          const [num = '', designation = '', unite = '', prixUnitaire = '', quantiteEstimative = ''] =
            l.split(',').map(v => v.trim());
          return { numero: num, designation, unite, prixUnitaire, quantiteEstimative };
        });
      return { numero, intitule, lignes };
    });

export function BPUForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<BPUData>(data);
  const [lotsText, setLotsText] = useState('');

  useEffect(() => {
    setForm(data);
    setLotsText(
      data.lots
        .map(lot => {
          const lignes = lot.lignes
            .map(ligne => `${ligne.numero},${ligne.designation},${ligne.unite},${ligne.prixUnitaire},${ligne.quantiteEstimative || ''}`)
            .join('; ');
          return `${lot.numero} | ${lot.intitule} | ${lignes}`;
        })
        .join('\n')
    );
  }, [data]);

  const handleSave = () => {
    const lots = parseLots(lotsText);
    onSave({ ...form, lots });
  };

  return (
    <div className="space-y-8">
      {/* Bouton d'enregistrement en haut */}
      <div className="flex justify-end sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>

      <p className="text-sm text-gray-700">Format: "numero lot | intitule lot | num,designation,unite,prix unitaire,quantite; ..."</p>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Lots et lignes</label>
        <textarea
          value={lotsText}
          onChange={e => setLotsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[160px] font-mono text-sm"
          placeholder="1 | Lot principal | 01,Prestation,U,100,10; 02,Option,U,50,5"
        />
      </section>
    </div>
  );
}
