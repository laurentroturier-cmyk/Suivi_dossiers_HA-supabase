import React, { useState, useEffect } from 'react';
import { Download, TrendingDown, AlertCircle } from 'lucide-react';
import type { BPUTMAData } from '../../types';

interface Props {
  data: BPUTMAData;
  onSave: (data: BPUTMAData) => Promise<void> | void;
  isSaving?: boolean;
}

export function BPUTMAForm({ data, onSave, isSaving = false }: Props) {
  const [nomCandidat, setNomCandidat] = useState(data.nomCandidat || '');
  const [tauxTVA, setTauxTVA] = useState(data.tauxTVA || 20);
  const [priseConnaissance, setPriseConnaissance] = useState(data.priseConnaissance || { forfaitGlobal: 0 });
  const [uom, setUom] = useState(data.uom || { prixUnitaire: 0 });
  const [tauxDegressivite, setTauxDegressivite] = useState(data.tauxDegressivite || { annee2: 0, annee3: 0, annee4: 0 });
  const [autresUO, setAutresUO] = useState(data.autresUO || { uoV: 0, uoA: 0, uoI: 0 });
  const [uoR, setUoR] = useState(data.uoR || { nombreEstime: 0, prixUnitaire: 0 });
  
  const [expertises, setExpertises] = useState(data.expertises || [
    { ref: 'EXP01', designation: 'Production dossier type - Consultant senior', prix: 0 },
    { ref: 'EXP02', designation: 'Production dossier type - Consultant', prix: 0 },
    { ref: 'EXP04', designation: 'Production dossier type - Chef de projet confirmé', prix: 0 },
    { ref: 'EXP05', designation: 'Production dossier type - Chef de projet', prix: 0 },
    { ref: 'EXP07', designation: 'Production dossier type - Architecte expert', prix: 0 },
    { ref: 'EXP08', designation: 'Production dossier type - Architecte', prix: 0 },
    { ref: 'EXP09', designation: 'Production dossier type - Expert logiciel', prix: 0 },
    { ref: 'ACP01', designation: 'Contribution élémentaire - Chef de projet confirmé', prix: 0 },
    { ref: 'ACP02', designation: 'Contribution élémentaire - Chef de projet', prix: 0 },
    { ref: 'ACP05', designation: 'Prestation de suivi d\'exploitation', prix: 0 }
  ]);

  const [realisations, setRealisations] = useState(data.realisations || [
    { ref: 'REA01', designation: 'Spécifications Ingénieur/Développeur (SFG, SFD, product backlog)', prix: 0 },
    { ref: 'REA02', designation: 'Réalisation Ingénieur/Développeur (cycle en V)', prix: 0 },
    { ref: 'REA03', designation: 'Conception plan recette Ingénieur/Développeur/Recetteur', prix: 0 },
    { ref: 'REA04', designation: 'Réalisation recette Recetteur', prix: 0 }
  ]);

  const calculerTTC = (ht: number) => {
    return ht * (1 + tauxTVA / 100);
  };

  const calculerMoyenneUOS = () => {
    const total = realisations.reduce((sum, item) => sum + (parseFloat(String(item.prix)) || 0), 0);
    return realisations.length > 0 ? total / realisations.length : 0;
  };

  const exporterCSV = () => {
    let csv = 'BORDEREAU DES PRIX UNITAIRES - TMA\n\n';
    csv += `Numéro:,25162_AOO_TMMA_LAY\n`;
    csv += `Intitulé:,Prestations de Tierce Maintenance Multi-Applicative\n\n`;
    csv += `Candidat:,${nomCandidat}\n`;
    csv += `Taux TVA:,${tauxTVA}%\n\n`;
    
    csv += 'PRISE DE CONNAISSANCE\n';
    csv += `Prix Forfaitaire HT:,${priseConnaissance.forfaitGlobal}\n`;
    csv += `Prix Forfaitaire TTC:,${calculerTTC(priseConnaissance.forfaitGlobal).toFixed(2)}\n\n`;
    
    csv += 'UNITÉS D\'ŒUVRE DE MAINTENANCE (UO-M)\n';
    csv += `Prix Unitaire HT:,${uom.prixUnitaire}\n`;
    csv += `Prix Unitaire TTC:,${calculerTTC(uom.prixUnitaire).toFixed(2)}\n\n`;
    
    csv += 'TAUX DE DÉGRESSIVITÉ UO-M\n';
    csv += `Année 2/Année 1:,${tauxDegressivite.annee2}%\n`;
    csv += `Année 3/Année 2:,${tauxDegressivite.annee3}%\n`;
    csv += `Année 4/Année 3:,${tauxDegressivite.annee4}%\n\n`;
    
    csv += 'AUTRES UNITÉS D\'ŒUVRE\n';
    csv += `UO-V (Cycle en V):,${autresUO.uoV}\n`;
    csv += `UO-A (AGILE):,${autresUO.uoA}\n`;
    csv += `UO-I (Innovation):,${autresUO.uoI}\n\n`;
    
    csv += 'UO-R (RÉVERSIBILITÉ)\n';
    csv += `Nombre UO-R estimé:,${uoR.nombreEstime}\n`;
    csv += `Prix Unitaire HT:,${uoR.prixUnitaire}\n`;
    csv += `Prix Unitaire TTC:,${calculerTTC(uoR.prixUnitaire).toFixed(2)}\n\n`;
    
    csv += 'PRESTATIONS D\'EXPERTISE ET ACCOMPAGNEMENT\n';
    expertises.forEach(item => {
      csv += `${item.ref} - ${item.designation}:,${item.prix},${calculerTTC(item.prix).toFixed(2)}\n`;
    });
    csv += '\n';
    
    csv += 'PRESTATIONS DE RÉALISATION\n';
    realisations.forEach(item => {
      csv += `${item.ref} - ${item.designation}:,${item.prix},${calculerTTC(item.prix).toFixed(2)}\n`;
    });
    csv += `\nUO-S (Moyenne):,${calculerMoyenneUOS().toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BPU_TMA_v2_${nomCandidat.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const modifierExpertise = (index: number, valeur: string) => {
    const newExpertises = [...expertises];
    newExpertises[index].prix = parseFloat(valeur) || 0;
    setExpertises(newExpertises);
  };

  const modifierRealisation = (index: number, valeur: string) => {
    const newRealisations = [...realisations];
    newRealisations[index].prix = parseFloat(valeur) || 0;
    setRealisations(newRealisations);
  };

  const handleSave = () => {
    const updatedData: BPUTMAData = {
      nomCandidat,
      tauxTVA,
      priseConnaissance,
      uom,
      tauxDegressivite,
      autresUO,
      uoR,
      expertises,
      realisations
    };
    onSave(updatedData);
  };

  return (
    <div className="space-y-6">
      {/* Bouton d'enregistrement en haut */}
      <div className="flex justify-between items-center sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <button
          onClick={exporterCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>

      {/* En-tête */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">Bordereau des Prix Unitaires - TMA v2</h2>
          <p className="text-sm text-slate-300">N° 25162_AOO_TMMA_LAY</p>
          <p className="text-xs text-slate-400 mt-1">Prestations de Tierce Maintenance Multi-Applicative des applications de l'Afpa</p>
        </div>

        <div className="flex items-start gap-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg mb-4">
          <AlertCircle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-100">
            <p className="font-semibold mb-1">Instructions importantes</p>
            <p className="text-amber-200">
              Compléter tous les champs avec des valeurs numériques. En cas de gratuité, saisir 0.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Nom du Candidat <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nomCandidat}
              onChange={(e) => setNomCandidat(e.target.value)}
              placeholder="Veuillez saisir le nom du candidat"
              className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Taux de TVA (%)
            </label>
            <input
              type="number"
              value={tauxTVA}
              onChange={(e) => setTauxTVA(parseFloat(e.target.value) || 0)}
              step="0.1"
              min="0"
              max="100"
              className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section Prise de Connaissance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">01</span>
          <h3 className="text-lg font-bold text-gray-900">Prise de Connaissance</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Phase initiale incluant la compréhension du dossier, décomposition des charges, CV des intervenants et mise en place des prestations selon le CCTP.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prix Forfaitaire HT (€)</label>
            <input
              type="number"
              value={priseConnaissance.forfaitGlobal}
              onChange={(e) => setPriseConnaissance({...priseConnaissance, forfaitGlobal: parseFloat(e.target.value) || 0})}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Prix Forfaitaire TTC (€)</label>
            <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 font-mono font-semibold text-blue-700 text-right">
              {calculerTTC(priseConnaissance.forfaitGlobal).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Unité</label>
            <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
              Forfait
            </div>
          </div>
        </div>
      </div>

      {/* Section UO-M */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">02</span>
          <h3 className="text-lg font-bold text-gray-900">Unité d'Œuvre de Maintenance (UO-M)</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          L'UO-M correspond à la quantité de travail moyenne produite pour une prestation de maintenance standard en une journée (curatif, correctif ou petit évolutif).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prix Unitaire HT (€)</label>
            <input
              type="number"
              value={uom.prixUnitaire}
              onChange={(e) => setUom({...uom, prixUnitaire: parseFloat(e.target.value) || 0})}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Prix Unitaire TTC (€)</label>
            <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 font-mono font-semibold text-blue-700 text-right">
              {calculerTTC(uom.prixUnitaire).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Unité</label>
            <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
              Unitaire
            </div>
          </div>
        </div>
      </div>

      {/* Taux de Dégressivité */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-bold text-gray-900">Taux de Dégressivité UO-M</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Année 2 / Année 1 (%)</label>
            <input
              type="number"
              value={tauxDegressivite.annee2}
              onChange={(e) => setTauxDegressivite({...tauxDegressivite, annee2: parseFloat(e.target.value) || 0})}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Année 3 / Année 2 (%)</label>
            <input
              type="number"
              value={tauxDegressivite.annee3}
              onChange={(e) => setTauxDegressivite({...tauxDegressivite, annee3: parseFloat(e.target.value) || 0})}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Année 4 / Année 3 (%)</label>
            <input
              type="number"
              value={tauxDegressivite.annee4}
              onChange={(e) => setTauxDegressivite({...tauxDegressivite, annee4: parseFloat(e.target.value) || 0})}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Autres Unités d'Œuvre */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">03</span>
          <h3 className="text-lg font-bold text-gray-900">Autres Unités d'Œuvre</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <h4 className="text-md font-semibold mb-2 text-cyan-800">UO-V - Cycle en V</h4>
            <p className="text-gray-600 text-sm mb-3">
              Quantité de travail moyenne pour une évolution en une journée (méthodologie cycle en V)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix Unitaire HT (€)</label>
                <input
                  type="number"
                  value={autresUO.uoV}
                  onChange={(e) => setAutresUO({...autresUO, uoV: parseFloat(e.target.value) || 0})}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Prix Unitaire TTC (€)</label>
                <div className="px-4 py-2 rounded-lg bg-cyan-100 border border-cyan-300 font-mono font-semibold text-cyan-800 text-right">
                  {calculerTTC(autresUO.uoV).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-md font-semibold mb-2 text-purple-800">UO-A - AGILE</h4>
            <p className="text-gray-600 text-sm mb-3">
              Quantité de travail moyenne pour une évolution en une journée (méthodologie AGILE)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix Unitaire HT (€)</label>
                <input
                  type="number"
                  value={autresUO.uoA}
                  onChange={(e) => setAutresUO({...autresUO, uoA: parseFloat(e.target.value) || 0})}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Prix Unitaire TTC (€)</label>
                <div className="px-4 py-2 rounded-lg bg-purple-100 border border-purple-300 font-mono font-semibold text-purple-800 text-right">
                  {calculerTTC(autresUO.uoA).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
            <h4 className="text-md font-semibold mb-2 text-pink-800">UO-I - Innovation</h4>
            <p className="text-gray-600 text-sm mb-3">
              Unité pour études, POC ou prototypes d'axes d'innovation (défini et commandé annuellement)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Prix Unitaire HT (€)</label>
                <input
                  type="number"
                  value={autresUO.uoI}
                  onChange={(e) => setAutresUO({...autresUO, uoI: parseFloat(e.target.value) || 0})}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Prix Unitaire TTC (€)</label>
                <div className="px-4 py-2 rounded-lg bg-pink-100 border border-pink-300 font-mono font-semibold text-pink-800 text-right">
                  {calculerTTC(autresUO.uoI).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UO-R Réversibilité */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">04</span>
          <h3 className="text-lg font-bold text-gray-900">UO-R - Réversibilité</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Quantité de travail moyenne produite pour une prestation de réversibilité en une journée
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre d'UO-R estimé</label>
            <input
              type="number"
              value={uoR.nombreEstime}
              onChange={(e) => setUoR({...uoR, nombreEstime: parseFloat(e.target.value) || 0})}
              step="1"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prix Unitaire HT (€)</label>
            <input
              type="number"
              value={uoR.prixUnitaire}
              onChange={(e) => setUoR({...uoR, prixUnitaire: parseFloat(e.target.value) || 0})}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-mono text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Prix Unitaire TTC (€)</label>
            <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 font-mono font-semibold text-blue-700 text-right">
              {calculerTTC(uoR.prixUnitaire).toFixed(2)}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Total Estimé TTC (€)</label>
            <div className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 font-mono font-semibold text-emerald-700 text-right">
              {calculerTTC(uoR.prixUnitaire * uoR.nombreEstime).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Prestations d'Expertise */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">05</span>
          <h3 className="text-lg font-bold text-gray-900">Prestations d'Expertise et d'Accompagnement</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Référence</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Désignation</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Prix Unitaire HT (€)</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Prix Unitaire TTC (€)</th>
              </tr>
            </thead>
            <tbody>
              {expertises.map((item, index) => (
                <tr key={item.ref} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="font-mono text-blue-600 font-semibold text-xs">{item.ref}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700 text-xs">{item.designation}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.prix}
                      onChange={(e) => modifierExpertise(index, e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-2 py-1 rounded border border-gray-300 font-mono text-right text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="font-mono text-blue-600 font-semibold text-xs">
                      {calculerTTC(item.prix).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prestations de Réalisation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">06</span>
          <h3 className="text-lg font-bold text-gray-900">Prestations de Réalisation</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-50">
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Référence</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Désignation</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Prix Unitaire HT (€)</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Prix Unitaire TTC (€)</th>
              </tr>
            </thead>
            <tbody>
              {realisations.map((item, index) => (
                <tr key={item.ref} className="border-t border-gray-200 hover:bg-purple-50">
                  <td className="px-4 py-2">
                    <span className="font-mono text-purple-600 font-semibold text-xs">{item.ref}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700 text-xs">{item.designation}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.prix}
                      onChange={(e) => modifierRealisation(index, e.target.value)}
                      step="0.01"
                      min="0"
                      className="w-full px-2 py-1 rounded border border-gray-300 font-mono text-right text-xs focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="font-mono text-purple-600 font-semibold text-xs">
                      {calculerTTC(item.prix).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-purple-400 bg-purple-100">
                <td className="px-4 py-3 font-mono text-purple-800 font-bold text-xs" colSpan={2}>
                  UO-S (Moyenne des réalisations)
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-purple-800 font-bold">
                    {calculerMoyenneUOS().toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-purple-800 font-bold">
                    {calculerTTC(calculerMoyenneUOS()).toFixed(2)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
