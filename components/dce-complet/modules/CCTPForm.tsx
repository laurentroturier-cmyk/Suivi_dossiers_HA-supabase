import React, { useEffect, useState } from 'react';
import type { CCTPData } from '../types';

interface Props {
  data: CCTPData;
  onSave: (data: CCTPData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseSpecs = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [titre = '', description = '', exigencesRaw = '', normesRaw = ''] = line.split('|').map(v => v.trim());
      const exigences = exigencesRaw.split(',').map(v => v.trim()).filter(Boolean);
      const normes = normesRaw.split(',').map(v => v.trim()).filter(Boolean);
      return { titre, description, exigences, normes };
    });

const parsePrestations = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [intitule = '', description = '', quantite = '', unite = ''] = line.split('|').map(v => v.trim());
      return { intitule, description, quantite, unite };
    });

const parseLivrables = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [nom = '', description = '', format = '', delai = ''] = line.split('|').map(v => v.trim());
      return { nom, description, format, delai };
    });

export function CCTPForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<CCTPData>(data);
  const [specsText, setSpecsText] = useState('');
  const [prestationsText, setPrestationsText] = useState('');
  const [livrablesText, setLivrablesText] = useState('');

  useEffect(() => {
    setForm(data);
    setSpecsText(
      data.specifications
        .map(s => `${s.titre} | ${s.description} | ${s.exigences.join(',')} | ${s.normes.join(',')}`)
        .join('\n')
    );
    setPrestationsText(
      data.prestations
        .map(p => `${p.intitule} | ${p.description} | ${p.quantite} | ${p.unite}`)
        .join('\n')
    );
    setLivrablesText(
      data.livrables
        .map(l => `${l.nom} | ${l.description} | ${l.format} | ${l.delai}`)
        .join('\n')
    );
  }, [data]);

  const handleSave = () => {
    onSave({
      ...form,
      specifications: parseSpecs(specsText),
      prestations: parsePrestations(prestationsText),
      livrables: parseLivrables(livrablesText),
    });
  };

  return (
    <div className="space-y-6">      {/* Bouton d'enregistrement en haut */}
      <div className="flex justify-end sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-sm bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>
      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Contexte</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea
            value={form.contexte.presentation}
            onChange={e => setForm(prev => ({ ...prev, contexte: { ...prev.contexte, presentation: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px] md:col-span-2"
            placeholder="Presentation du projet"
          />
          <textarea
            value={form.contexte.objectifs}
            onChange={e => setForm(prev => ({ ...prev, contexte: { ...prev.contexte, objectifs: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px]"
            placeholder="Objectifs"
          />
          <textarea
            value={form.contexte.contraintes}
            onChange={e => setForm(prev => ({ ...prev, contexte: { ...prev.contexte, contraintes: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px]"
            placeholder="Contraintes"
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Specifications ("titre | description | exigences separees par , | normes separees par ," par ligne)</label>
        <textarea
          value={specsText}
          onChange={e => setSpecsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[140px] font-mono text-sm"
          placeholder="Infrastructure | Description | exigence1,exigence2 | ISO9001"
        />
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Prestations ("intitule | description | quantite | unite" par ligne)</label>
        <textarea
          value={prestationsText}
          onChange={e => setPrestationsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[140px] font-mono text-sm"
          placeholder="Audit | Description | 10 | Jour"
        />
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Livrables ("nom | description | format | delai" par ligne)</label>
        <textarea
          value={livrablesText}
          onChange={e => setLivrablesText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[140px] font-mono text-sm"
          placeholder="Rapport | Rapport final | PDF | J+30"
        />
      </section>
    </div>
  );
}
