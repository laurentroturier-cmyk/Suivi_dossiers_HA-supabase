import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Lot {
  numero: string;
  intitule: string;
  montantMax: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lots: Lot[];
  nbLots: number;
  onSave: (lots: Lot[]) => void;
}

export function LotsConfigurationModal({ isOpen, onClose, lots, nbLots, onSave }: Props) {
  const [localLots, setLocalLots] = useState<Lot[]>([]);

  // Initialiser les lots quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      // Si des lots existent déjà, les utiliser
      if (lots.length > 0) {
        setLocalLots([...lots]);
      } else {
        // Sinon, pré-remplir avec le nombre de lots demandé
        const nombreLots = Math.max(1, nbLots);
        const lotsInitiaux: Lot[] = Array.from({ length: nombreLots }, (_, i) => ({
          numero: String(i + 1),
          intitule: '',
          montantMax: '',
        }));
        setLocalLots(lotsInitiaux);
      }
    }
  }, [isOpen, lots, nbLots]);

  const updateLot = (index: number, field: keyof Lot, value: string) => {
    setLocalLots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addLot = () => {
    const nextNumero = localLots.length + 1;
    setLocalLots(prev => [
      ...prev,
      { numero: String(nextNumero), intitule: '', montantMax: '' }
    ]);
  };

  const removeLot = (index: number) => {
    if (localLots.length <= 1) return;
    setLocalLots(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Renuméroter les lots
      return updated.map((lot, i) => ({ ...lot, numero: String(i + 1) }));
    });
  };

  const handleSave = () => {
    onSave(localLots);
    onClose();
  };

  const calculerTotalMontant = () => {
    return localLots.reduce((sum, lot) => {
      const montant = parseFloat(lot.montantMax.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
      return sum + montant;
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#2F5B58] text-white">
          <h2 className="text-lg font-semibold">Configuration des lots</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {localLots.length} lot{localLots.length > 1 ? 's' : ''} configuré{localLots.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={addLot}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition"
            >
              <Plus size={16} />
              Ajouter un lot
            </button>
          </div>

          {/* Table des lots */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    N°
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intitulé du lot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Montant max (€ HT)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {localLots.map((lot, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={lot.numero}
                        onChange={e => updateLot(index, 'numero', e.target.value)}
                        className="w-full border rounded px-2 py-1.5 text-sm text-center bg-gray-100"
                        readOnly
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={lot.intitule}
                        onChange={e => updateLot(index, 'intitule', e.target.value)}
                        placeholder={`Intitulé du lot ${lot.numero}`}
                        className="w-full border rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={lot.montantMax}
                        onChange={e => updateLot(index, 'montantMax', e.target.value)}
                        placeholder="0"
                        className="w-full border rounded px-2 py-1.5 text-sm text-right focus:ring-2 focus:ring-[#2F5B58] focus:border-transparent"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => removeLot(index)}
                        disabled={localLots.length <= 1}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Supprimer ce lot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {localLots.length > 1 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td className="px-4 py-3 font-medium text-sm" colSpan={2}>
                      Total estimé
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-sm text-[#2F5B58]">
                      {calculerTotalMontant().toLocaleString('fr-FR')} €
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition"
          >
            Appliquer les lots
          </button>
        </div>
      </div>
    </div>
  );
}
