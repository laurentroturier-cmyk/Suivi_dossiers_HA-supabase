import React, { useEffect, useState } from 'react';
import type { DocumentsAnnexesData } from '../../types';

interface Props {
  data: DocumentsAnnexesData;
  onSave: (data: DocumentsAnnexesData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseDocuments = (value: string) =>
  value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [nom = '', type = '', taille = '0', url = '', description = ''] = line.split('|').map(v => v.trim());
      return {
        id: crypto.randomUUID(),
        nom,
        type,
        taille: Number(taille) || 0,
        url: url || undefined,
        dateAjout: new Date().toISOString(),
        description: description || undefined,
      };
    });

export function DocumentsAnnexesForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<DocumentsAnnexesData>(data);
  const [docsText, setDocsText] = useState('');

  useEffect(() => {
    setForm(data);
    setDocsText(
      data.documents
        .map(doc => `${doc.nom} | ${doc.type} | ${doc.taille} | ${doc.url || ''} | ${doc.description || ''}`)
        .join('\n')
    );
  }, [data]);

  const handleSave = () => {
    onSave({ ...form, documents: parseDocuments(docsText) });
  };

  return (
    <div className="dce-documents-annexes space-y-8">
      {/* Bouton d'enregistrement en haut */}
      <div className="dce-documents-annexes-bar flex justify-end sticky top-0 bg-white dark:bg-slate-800 z-10 pb-4 border-b border-gray-200 dark:border-slate-600">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-sm bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition disabled:opacity-50 shadow-md"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>

      <p className="text-sm text-gray-700 dark:text-slate-300">Format: "nom | type | taille (octets) | url | description" par ligne.</p>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Documents</label>
        <textarea
          value={docsText}
          onChange={e => setDocsText(e.target.value)}
          className="dce-documents-annexes-textarea w-full border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm min-h-[160px] font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58]"
          placeholder="Annexe technique | pdf | 102400 | https://... | Optionnel"
        />
      </section>
    </div>
  );
}
