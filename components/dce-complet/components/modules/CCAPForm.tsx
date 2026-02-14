import React, { useEffect, useState, useRef } from 'react';
import type { CCAPData } from '../../types';
import { Trash2, Plus, ChevronDown, ChevronRight, Upload, GripVertical, Indent, Outdent, FileText } from 'lucide-react';
import { parseWordToCCAP } from './ccapWordParser';
import { RichTextEditor } from './RichTextEditor';

/**
 * Calcule la numérotation automatique des sections selon leur niveau
 * Exemple: "1", "1.1", "1.2", "1.2.1", "2", "2.1"...
 */
function calculateSectionNumbers(sections: CCAPData['sections']): string[] {
  const counters = [0, 0, 0, 0]; // Compteurs pour niveaux 1, 2, 3, 4
  
  return sections.map(section => {
    const niveau = section.niveau || 1;
    
    // Incrémenter le compteur du niveau actuel
    counters[niveau - 1]++;
    
    // Réinitialiser les compteurs des niveaux inférieurs
    for (let i = niveau; i < counters.length; i++) {
      counters[i] = 0;
    }
    
    // Construire le numéro: "1.2.3" pour niveau 3
    return counters.slice(0, niveau).join('.');
  });
}

interface Props {
  data: CCAPData;
  onSave: (data: CCAPData) => Promise<void> | void;
  isSaving?: boolean;
  onChange?: (data: CCAPData) => void;
}

export function CCAPForm({ data, onSave, isSaving = false, onChange }: Props) {
  const [form, setForm] = useState<CCAPData>(data);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set()); // Toutes les sections fermées par défaut
  const [isImporting, setIsImporting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(data);
  }, [data]);

  // Fermer le menu d'insertion si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showInsertMenu && insertMenuRef.current) {
        const target = e.target as HTMLElement;
        if (!insertMenuRef.current.contains(target)) {
          setShowInsertMenu(false);
        }
      }
    };
    
    if (showInsertMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showInsertMenu]);

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

  const updateSection = (
    index: number,
    field: 'titre' | 'contenu' | 'titreCouleur' | 'titreTaille',
    value: string | number | undefined
  ) => {
    setForm(prev => {
      const next = {
        ...prev,
        sections: prev.sections.map((s, i) => {
          if (i !== index) return s;
          const updated = { ...s, [field]: value };
          if (value === undefined && (field === 'titreCouleur' || field === 'titreTaille')) {
            delete updated[field as 'titreCouleur' | 'titreTaille'];
          }
          return updated;
        })
      };
      onChange?.(next);
      return next;
    });
  };

  const changeSectionLevel = (index: number, delta: number) => {
    setForm(prev => {
      const section = prev.sections[index];
      const currentLevel = section.niveau || 1;
      const newLevel = Math.min(4, Math.max(1, currentLevel + delta)); // Entre 1 et 4
      
      const next = {
        ...prev,
        sections: prev.sections.map((s, i) =>
          i === index ? { ...s, niveau: newLevel } : s
        )
      };
      onChange?.(next);
      return next;
    });
  };

  /**
   * Applique la couleur et la taille du titre de la section donnée à toutes les sections du même niveau.
   */
  const applyStyleToAllOfLevel = (index: number) => {
    const section = form.sections[index];
    if (!section) return;
    const niveau = section.niveau || 1;
    setForm(prev => {
      const next = {
        ...prev,
        sections: prev.sections.map((s, i) => {
          const sNiveau = s.niveau || 1;
          if (sNiveau !== niveau) return s;
          return {
            ...s,
            titreCouleur: section.titreCouleur,
            titreTaille: section.titreTaille,
          };
        }),
      };
      onChange?.(next);
      return next;
    });
  };

  const addSection = (afterIndex?: number, niveau: number = 1) => {
    setForm(prev => {
      const newSection = { titre: 'Nouvelle section', contenu: '', niveau };
      const sections = [...prev.sections];
      let insertedIndex = sections.length; // Par défaut, à la fin
      
      if (afterIndex === -1) {
        // Insérer au début
        sections.unshift(newSection);
        insertedIndex = 0;
      } else if (afterIndex !== undefined && afterIndex >= 0) {
        // Insérer après la section spécifiée
        sections.splice(afterIndex + 1, 0, newSection);
        insertedIndex = afterIndex + 1;
      } else {
        // Ajouter à la fin par défaut
        sections.push(newSection);
        insertedIndex = sections.length - 1;
      }
      
      // Ouvrir automatiquement la section nouvellement créée
      setExpandedSections(prevExpanded => {
        const newExpanded = new Set(prevExpanded);
        newExpanded.add(insertedIndex);
        return newExpanded;
      });
      
      const next = {
        ...prev,
        sections
      };
      onChange?.(next);
      return next;
    });
    
    // Fermer le menu d'insertion
    setShowInsertMenu(false);
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setForm(prev => {
      const sections = [...prev.sections];
      const [draggedSection] = sections.splice(draggedIndex, 1);
      sections.splice(targetIndex, 0, draggedSection);
      
      const next = { ...prev, sections };
      onChange?.(next);
      return next;
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
          className="px-3 py-1.5 text-sm bg-gradient-to-b from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50 shadow-md"
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
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 shadow-md"
          title="Importer un CCAP Word (.docx)"
        >
          <FileText className="w-4 h-4" />
          <Upload className="w-3.5 h-3.5" />
          {isImporting ? 'Import...' : 'Importer Word'}
        </button>

        {/* Bouton Ajouter section avec menu */}
        <div ref={insertMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              if (form.sections.length === 0) {
                // Si aucune section, ajouter directement
                addSection();
              } else {
                // Sinon, afficher le menu de positionnement
                setShowInsertMenu(!showInsertMenu);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-b from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Ajouter une section
          </button>

          {/* Menu déroulant pour choisir la position et le niveau */}
          {showInsertMenu && form.sections.length > 0 && (
            <div className="absolute left-0 top-full mt-1 w-[450px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  📌 Choisissez la position et le type de section
                </p>
              </div>
              <div className="py-1">
                {/* Option : Insérer au début */}
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Au début :</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => addSection(-1, 1)}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    >
                      📄 Chapitre
                    </button>
                    <button
                      type="button"
                      onClick={() => addSection(-1, 2)}
                      className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
                    >
                      📑 Sous-chapitre
                    </button>
                    <button
                      type="button"
                      onClick={() => addSection(-1, 3)}
                      className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                    >
                      📃 Sous-sous-chapitre
                    </button>
                  </div>
                </div>
                
                {/* Liste des sections existantes */}
                {form.sections.map((section, index) => {
                  const sectionNumbers = calculateSectionNumbers(form.sections);
                  const niveau = section.niveau || 1;
                  const niveauIcon = niveau === 1 ? '📄' : niveau === 2 ? '📑' : '📃';
                  
                  return (
                    <div
                      key={index}
                      className="px-3 py-2 border-b border-gray-100 dark:border-gray-700"
                    >
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                        <span className="font-mono">{sectionNumbers[index]}</span>
                        <span className="truncate">{niveauIcon} {section.titre || '(Sans titre)'}</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addSection(index, 1)}
                          className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        >
                          📄 Chapitre
                        </button>
                        <button
                          type="button"
                          onClick={() => addSection(index, 2)}
                          className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
                        >
                          📑 Sous-chapitre
                        </button>
                        <button
                          type="button"
                          onClick={() => addSection(index, 3)}
                          className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                        >
                          📃 Sous-sous-chap.
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Bouton annuler */}
              <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowInsertMenu(false)}
                  className="w-full px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition rounded"
                >
                  ✕ Annuler
                </button>
              </div>
            </div>
          )}
        </div>
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
            {form.sections.map((section, index) => {
              const isDragging = draggedIndex === index;
              const isDropTarget = dragOverIndex === index && draggedIndex !== index;
              const sectionNumbers = calculateSectionNumbers(form.sections);
              const niveau = section.niveau || 1;
              const indentClass = niveau === 1 ? '' : niveau === 2 ? 'ml-6' : niveau === 3 ? 'ml-12' : 'ml-16';
              const niveauColor = niveau === 1 ? 'text-blue-600 dark:text-blue-400' : 
                                  niveau === 2 ? 'text-emerald-600 dark:text-emerald-400' :
                                  niveau === 3 ? 'text-purple-600 dark:text-purple-400' :
                                  'text-orange-600 dark:text-orange-400';
              const sameLevelCount = form.sections.filter(s => (s.niveau || 1) === niveau).length;
              const niveauLabel = niveau === 1 ? 'titres' : niveau === 2 ? 'sous-titres' : niveau === 3 ? 'sous-sous-titres' : 'niv. 4';
              
              return (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg bg-white shadow-sm transition-all ${indentClass} ${
                    isDragging ? 'opacity-50 scale-95 cursor-grabbing' : 'cursor-grab'
                  } ${
                    isDropTarget ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                  }`}
                >
                  {/* En-tête de section */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                    {/* Poignée de glissement */}
                    <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-emerald-600 transition">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    {/* Numérotation automatique */}
                    <span className={`font-mono text-sm font-bold ${niveauColor} min-w-[3rem]`}>
                      {sectionNumbers[index]}
                    </span>
                    
                    {/* Boutons de niveau */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => changeSectionLevel(index, -1)}
                        disabled={niveau <= 1}
                        className="p-0.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Diminuer le niveau (← Chapitre)"
                      >
                        <Outdent className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => changeSectionLevel(index, 1)}
                        disabled={niveau >= 4}
                        className="p-0.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Augmenter le niveau (→ Sous-chapitre)"
                      >
                        <Indent className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
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
                      style={{ color: section.titreCouleur || undefined }}
                      className="flex-1 border-0 bg-transparent font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1"
                      placeholder="Titre de la section"
                    />
                    {/* Style du titre (couleur + taille, utilisés dans l'app et à l'export PDF) */}
                    <div className="flex items-center gap-1 shrink-0" title="Style du titre (affiché ici et à l'export PDF)">
                      <input
                        type="color"
                        value={section.titreCouleur || '#0066cc'}
                        onChange={e => updateSection(index, 'titreCouleur', e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                        title="Couleur du titre"
                      />
                      <button
                        type="button"
                        onClick={() => updateSection(index, 'titreCouleur', undefined)}
                        className="text-[10px] text-gray-500 hover:text-gray-700 px-1"
                        title="Réinitialiser la couleur"
                      >
                        Déf.
                      </button>
                      <select
                        value={section.titreTaille ?? ''}
                        onChange={e => updateSection(index, 'titreTaille', e.target.value === '' ? undefined : Number(e.target.value))}
                        className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white max-w-[4rem]"
                        title="Taille du titre (PDF)"
                      >
                        <option value="">Déf.</option>
                        <option value={18}>18</option>
                        <option value={16}>16</option>
                        <option value={14}>14</option>
                        <option value={12}>12</option>
                        <option value={11}>11</option>
                      </select>
                      {sameLevelCount >= 2 && (
                        <button
                          type="button"
                          onClick={() => applyStyleToAllOfLevel(index)}
                          className="text-[10px] whitespace-nowrap px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-800/50 transition"
                          title={`Appliquer cette couleur et taille à tous les ${niveauLabel} (niveau ${niveau}) — ${sameLevelCount} section(s)`}
                        >
                          → Tous {niveauLabel}
                        </button>
                      )}
                    </div>
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
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Contenu
                      </label>
                      <RichTextEditor
                        value={section.contenu}
                        onChange={(value) => updateSection(index, 'contenu', value)}
                        placeholder="Saisissez le contenu de cette section..."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
