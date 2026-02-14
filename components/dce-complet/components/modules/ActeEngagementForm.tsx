import React, { useEffect, useState } from 'react';
import type { ActeEngagementData } from '../../types';

interface Props {
  data: ActeEngagementData;
  onSave: (data: ActeEngagementData) => Promise<void> | void;
  isSaving?: boolean;
}

export function ActeEngagementForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<ActeEngagementData>(data);

  useEffect(() => {
    setForm(data);
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

  const handleSave = () => onSave(form);

  return (
    <div className="space-y-6">
      {/* Bouton d'enregistrement en haut */}
      <div className="flex justify-end sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 font-medium shadow-md flex items-center gap-2"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Acheteur</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.acheteur.nom}
            onChange={e => update('acheteur.nom', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Nom"
          />
          <input
            value={form.acheteur.representant}
            onChange={e => update('acheteur.representant', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Representant"
          />
          <input
            value={form.acheteur.qualite}
            onChange={e => update('acheteur.qualite', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Qualite"
          />
          <input
            value={form.acheteur.siret}
            onChange={e => update('acheteur.siret', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="SIRET"
          />
          <input
            value={form.acheteur.adresse}
            onChange={e => update('acheteur.adresse', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm md:col-span-2"
            placeholder="Adresse"
          />
          <input
            value={form.acheteur.codePostal}
            onChange={e => update('acheteur.codePostal', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Code postal"
          />
          <input
            value={form.acheteur.ville}
            onChange={e => update('acheteur.ville', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Ville"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Marché</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.marche.numero}
            onChange={e => update('marche.numero', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Numero"
          />
          <input
            value={form.marche.objet}
            onChange={e => update('marche.objet', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Objet"
          />
          <input
            value={form.marche.montant}
            onChange={e => update('marche.montant', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Montant"
          />
          <input
            value={form.marche.duree}
            onChange={e => update('marche.duree', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Duree"
          />
          <input
            value={form.marche.dateNotification}
            onChange={e => update('marche.dateNotification', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Date notification"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Candidat</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={form.candidat.raisonSociale}
            onChange={e => update('candidat.raisonSociale', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Raison sociale"
          />
          <input
            value={form.candidat.formeJuridique}
            onChange={e => update('candidat.formeJuridique', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Forme juridique"
          />
          <input
            value={form.candidat.representant}
            onChange={e => update('candidat.representant', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Representant"
          />
          <input
            value={form.candidat.qualite}
            onChange={e => update('candidat.qualite', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Qualite"
          />
          <input
            value={form.candidat.siret}
            onChange={e => update('candidat.siret', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="SIRET"
          />
          <input
            value={form.candidat.adresse}
            onChange={e => update('candidat.adresse', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm md:col-span-2"
            placeholder="Adresse"
          />
          <input
            value={form.candidat.codePostal}
            onChange={e => update('candidat.codePostal', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Code postal"
          />
          <input
            value={form.candidat.ville}
            onChange={e => update('candidat.ville', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Ville"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Prix</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={form.prix.montantHT}
            onChange={e => update('prix.montantHT', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Montant HT"
          />
          <input
            value={form.prix.tva}
            onChange={e => update('prix.tva', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="TVA"
          />
          <input
            value={form.prix.montantTTC}
            onChange={e => update('prix.montantTTC', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Montant TTC"
          />
          <input
            value={form.prix.delaiPaiement}
            onChange={e => update('prix.delaiPaiement', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Delai de paiement"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-semibold text-gray-800">Conditions</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <input
            value={form.conditions.delaiExecution}
            onChange={e => update('conditions.delaiExecution', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Delai d'execution"
          />
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={form.conditions.garantieFinanciere}
              onChange={e => update('conditions.garantieFinanciere', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Garantie financiere</span>
          </label>
          <label className="inline-flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={form.conditions.avance}
              onChange={e => update('conditions.avance', e.target.checked)}
              className="h-4 w-4"
            />
            <span>Avance</span>
          </label>
          <input
            value={form.conditions.montantAvance || ''}
            onChange={e => update('conditions.montantAvance', e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Montant avance"
          />
        </div>
      </section>
    </div>
  );
}
