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
    <div className="space-y-8">
      {/* Bouton d'enregistrement en haut */}
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

      <p className="text-sm text-gray-700">Format: "nom | type | taille (octets) | url | description" par ligne.</p>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Documents</label>
        <textarea
          value={docsText}
          onChange={e => setDocsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[160px] font-mono text-sm"
          placeholder="Annexe technique | pdf | 102400 | https://... | Optionnel"
        />
      </section>
    </div>
  );
}
