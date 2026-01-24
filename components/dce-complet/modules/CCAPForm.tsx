import React, { useEffect, useState, useRef } from 'react';
import type { CCAPData } from '../types';
import { Trash2, Plus, ChevronDown, ChevronRight, Upload } from 'lucide-react';
import { parseWordToCCAP } from './ccapWordParser';

interface Props {
  data: CCAPData;
  onSave: (data: CCAPData) => Promise<void> | void;
  isSaving?: boolean;
  onChange?: (data: CCAPData) => void;
}

export function CCAPForm({ data, onSave, isSaving = false, onChange }: Props) {
  const [form, setForm] = useState<CCAPData>(data);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1, 2])); // Les 3 premières sections ouvertes par défaut
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un fichier .docx
    if (!file.name.endsWith('.docx')) {
      alert('Veuillez sélectionner un fichier Word (.docx)');
      return;
    }

    setIsImporting(true);
    try {
      const result = await parseWordToCCAP(file);
      
      // Remplacer les sections par celles importées
      setForm(prev => {
        const next = { ...prev, sections: result.sections };
        onChange?.(next);
        return next;
      });
      
      // Ouvrir les 3 premières sections
      setExpandedSections(new Set([0, 1, 2]));
      
      alert(`✅ ${result.totalSections} sections importées avec succès !`);
    } catch (error) {
      console.error('Erreur import Word:', error);
      alert(`❌ Erreur lors de l'import : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsImporting(false);
      // Réinitialiser l'input pour permettre de ré-importer le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const update = (path: string, value: string | boolean) => {
    setForm(prev => {
      const copy = structuredClone(prev);
      const parts = path.split('.');
      let cursor: any = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      onChange?.(copy);
      return copy;
    });
  };

  const updateSection = (index: number, field: 'titre' | 'contenu', value: string) => {
    setForm(prev => {
      const next = {
        ...prev,
        sections: prev.sections.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        )
      };
      onChange?.(next);
      return next;
    });
  };

  const addSection = () => {
    setForm(prev => {
      const next = {
        ...prev,
        sections: [...prev.sections, { titre: 'Nouvelle section', contenu: '' }]
      };
      onChange?.(next);
      return next;
    });
  };

  const deleteSection = (index: number) => {
    if (confirm('Supprimer cette section ?')) {
      setForm(prev => {
        const next = {
          ...prev,
          sections: prev.sections.filter((_, i) => i !== index)
        };
        onChange?.(next);
        return next;
      });
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

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
          className="px-3 py-1.5 text-sm bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer le CCAP'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Bouton Import Word */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleImportWord}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-[#2F5B58] text-white rounded-md hover:bg-[#234441] transition disabled:opacity-50"
          title="Importer un CCAP Word (.docx)"
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Import...' : 'Importer Word'}
        </button>

        {/* Bouton Ajouter section */}
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          Ajouter une section
        </button>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-semibold text-gray-800">
            Sections du CCAP ({form.sections.length})
          </label>
        </div>

        {form.sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
            Aucune section. Cliquez sur "Ajouter une section" pour commencer.
          </div>
        ) : (
          <div className="space-y-3">
            {form.sections.map((section, index) => (
              <div key={index} className="border rounded-lg bg-white shadow-sm">
                {/* En-tête de section */}
                <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                  <button
                    type="button"
                    onClick={() => toggleSection(index)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {expandedSections.has(index) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    value={section.titre}
                    onChange={e => updateSection(index, 'titre', e.target.value)}
                    className="flex-1 border-0 bg-transparent font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                    placeholder="Titre de la section"
                  />
                  <span className="text-xs text-gray-500 min-w-[60px] text-right">
                    Section {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteSection(index)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                    title="Supprimer cette section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Contenu de section (visible si expanded) */}
                {expandedSections.has(index) && (
                  <div className="p-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Contenu
                    </label>
                    <textarea
                      value={section.contenu}
                      onChange={e => updateSection(index, 'contenu', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm min-h-[120px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Saisissez le contenu de cette section..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
