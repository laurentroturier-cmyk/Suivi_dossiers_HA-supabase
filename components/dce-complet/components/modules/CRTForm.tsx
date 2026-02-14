import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { CRTData } from '../../types';

interface CRTFormProps {
  data: CRTData;
  onSave: (data: CRTData) => void;
  isSaving?: boolean;
}

export function CRTForm({ data, onSave, isSaving = false }: CRTFormProps) {
  const [form, setForm] = useState<CRTData>(data);

  // Synchroniser avec les données passées depuis le parent
  useEffect(() => {
    setForm(data);
  }, [data]);

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="space-y-6">
      {/* Bouton d'enregistrement en haut */}
      <div className="flex justify-end sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-sm bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4 inline mr-1" />
          {isSaving ? 'Sauvegarde...' : 'Enregistrer la section'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contenu du cadre de réponse technique</label>
        <textarea
          value={form.contenu}
          onChange={(e) => setForm({ ...form, contenu: e.target.value })}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Ajoutez ici le contenu ou la structure du cadre de réponse technique"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes internes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Notes ou instructions complémentaires (non visibles dans le document)"
        />
      </div>
    </div>
  );
}
