import React, { useEffect, useState } from 'react';
import type { CCAPData } from '../types';

interface Props {
  data: CCAPData;
  onSave: (data: CCAPData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseSections = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [titre = '', contenu = ''] = line.split('|').map(v => v.trim());
      return { titre, contenu };
    });

export function CCAPForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<CCAPData>(data);
  const [sectionsText, setSectionsText] = useState('');

  useEffect(() => {
    setForm(data);
    setSectionsText(data.sections.map(s => `${s.titre} | ${s.contenu}`).join('\n'));
  }, [data]);

  const update = (path: string, value: string | boolean) => {
    setForm(prev => {
      const copy = structuredClone(prev);
      const parts = path.split('.');
      let cursor: any = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const handleSave = () => {
    const sections = parseSections(sectionsText);
    onSave({ ...form, sections });
  };

  return (
    <div className="space-y-6">
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

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Dispositions generales</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.dispositionsGenerales.objet}
            onChange={e => update('dispositionsGenerales.objet', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Objet"
          />
          <input
            value={form.dispositionsGenerales.ccagApplicable}
            onChange={e => update('dispositionsGenerales.ccagApplicable', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="CCAG applicable"
          />
          <input
            value={form.dispositionsGenerales.duree}
            onChange={e => update('dispositionsGenerales.duree', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Duree"
          />
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.dispositionsGenerales.reconduction}
              onChange={e => update('dispositionsGenerales.reconduction', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Reconduction</span>
          </label>
          <input
            value={form.dispositionsGenerales.nbReconductions || ''}
            onChange={e => update('dispositionsGenerales.nbReconductions', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Nombre de reconductions"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Prix et paiement</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <input
            value={form.prixPaiement.typePrix}
            onChange={e => update('prixPaiement.typePrix', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="forfaitaire / unitaire"
          />
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.prixPaiement.revision}
              onChange={e => update('prixPaiement.revision', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Revision</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.prixPaiement.avance}
              onChange={e => update('prixPaiement.avance', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Avance</span>
          </label>
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={form.prixPaiement.retenuGarantie}
              onChange={e => update('prixPaiement.retenuGarantie', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Retenue de garantie</span>
          </label>
          <input
            value={form.prixPaiement.modalitesPaiement}
            onChange={e => update('prixPaiement.modalitesPaiement', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm md:col-span-2"
            placeholder="Modalites de paiement"
          />
          <input
            value={form.prixPaiement.delaiPaiement}
            onChange={e => update('prixPaiement.delaiPaiement', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Delai de paiement"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Execution</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.execution.delaiExecution}
            onChange={e => update('execution.delaiExecution', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Delai d'execution"
          />
          <input
            value={form.execution.penalitesRetard}
            onChange={e => update('execution.penalitesRetard', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Penalites de retard"
          />
          <input
            value={form.execution.conditionsReception}
            onChange={e => update('execution.conditionsReception', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm md:col-span-2"
            placeholder="Conditions de reception"
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Sections libres ("titre | contenu" par ligne)</label>
        <textarea
          value={sectionsText}
          onChange={e => setSectionsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[140px] font-mono text-sm"
          placeholder="Modalites | Details..."
        />
      </section>
    </div>
  );
}
