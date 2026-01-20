import React, { useState } from 'react';
import { Save } from 'lucide-react';
import type { CRTData } from '../types';

interface CRTFormProps {
  data: CRTData;
  onSave: (data: CRTData) => void;
  isSaving?: boolean;
}

export function CRTForm({ data, onSave, isSaving = false }: CRTFormProps) {
  const [form, setForm] = useState<CRTData>(data);

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contenu du cadre de réponse technique</label>
        <textarea
          value={form.contenu}
          onChange={(e) => setForm({ ...form, contenu: e.target.value })}
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ajoutez ici le contenu ou la structure du cadre de réponse technique"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes internes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Notes ou instructions complémentaires (non visibles dans le document)"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
