import React, { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { QTData } from '../../types';

interface QTFormProps {
  data: QTData;
  onSave: (data: QTData) => void;
  isSaving?: boolean;
}

export function QTForm({ data, onSave, isSaving = false }: QTFormProps) {
  const [form, setForm] = useState<QTData>(data);

  const updateQuestion = (index: number, field: 'question' | 'reponse', value: string) => {
    const next = [...form.questions];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, questions: next });
  };

  const addQuestion = () => {
    setForm({ ...form, questions: [...form.questions, { question: '', reponse: '' }] });
  };

  const removeQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Questions / Réponses</h3>
        <button
          onClick={addQuestion}
          type="button"
          className="inline-flex items-center gap-2 px-2 py-1.5 text-sm bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg shadow-md"
        >
          <Plus className="w-4 h-4" />
          Ajouter une question
        </button>
      </div>

      <div className="space-y-3">
        {form.questions.length === 0 && (
          <p className="text-sm text-gray-500">Aucune question pour le moment.</p>
        )}
        {form.questions.map((q, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`Question ${index + 1}`}
                />
                <textarea
                  value={q.reponse}
                  onChange={(e) => updateQuestion(index, 'reponse', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Réponse attendue / éléments de preuve"
                />
              </div>
              <button
                onClick={() => removeQuestion(index)}
                className="p-2 text-red-600 hover:text-red-800"
                title="Supprimer la question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
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

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 shadow-md"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
