/**
 * Visionneuse du document CCAP final
 */

import React, { useState } from 'react';
import { X, Download, FileText, Edit2, Save, Check, GripVertical } from 'lucide-react';
import type { CCAPData } from '../../types';
import { getCCAPTypeLabel } from './ccapTemplates';
import { CCAP_HEADER_TEXT, CCAP_HEADER_TITLE } from './ccapConstants';

/**
 * Calcule la numérotation automatique des sections selon leur niveau
 */
function calculateSectionNumbers(sections: CCAPData['sections']): string[] {
  const counters = [0, 0, 0, 0];
  
  return sections.map(section => {
    const niveau = section.niveau || 1;
    counters[niveau - 1]++;
    for (let i = niveau; i < counters.length; i++) {
      counters[i] = 0;
    }
    return counters.slice(0, niveau).join('.');
  });
}

interface CCAPViewerProps {
  ccapData: CCAPData;
  numeroProcedure?: string;
  onClose: () => void;
  onExportWord?: () => void;
  onExportPdf?: () => void;
  onChange?: (data: CCAPData) => void;
}

export function CCAPViewer({ ccapData, numeroProcedure, onClose, onExportWord, onExportPdf, onChange }: CCAPViewerProps) {
  const hasImportedSections = Array.isArray(ccapData.sections) && ccapData.sections.length > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editedSections, setEditedSections] = useState(ccapData.sections || []);
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const handleSaveEdits = () => {
    if (onChange) {
      onChange({
        ...ccapData,
        sections: editedSections
      });
    }
    setIsEditing(false);
    setEditingTitleIndex(null);
  };

  const handleCancelEdits = () => {
    setEditedSections(ccapData.sections || []);
    setIsEditing(false);
    setEditingTitleIndex(null);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...editedSections];
    updated[index] = { ...updated[index], titre: newTitle };
    setEditedSections(updated);
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

    const updated = [...editedSections];
    const [draggedSection] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedSection);
    setEditedSections(updated);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const sectionsToDisplay = isEditing ? editedSections : ccapData.sections;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Aperçu du CCAP
            </h2>
            {numeroProcedure && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {numeroProcedure}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasImportedSections && !isEditing && onChange && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSaveEdits}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={handleCancelEdits}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </>
            )}
            {!isEditing && onExportWord && (
              <button
                onClick={onExportWord}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Word
              </button>
            )}
            {!isEditing && onExportPdf && (
              <button
                onClick={onExportPdf}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-12 min-h-[800px]">
            {/* En-tête du document */}
            <div className="text-center mb-12">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES
              </h1>
              
              {ccapData.typeCCAP && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Type de marché : {getCCAPTypeLabel(ccapData.typeCCAP)}
                </p>
              )}
              
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-6">
                {ccapData.dispositionsGenerales.objet || 'Objet du marché'}
              </h2>
            </div>

            {/* Section d'en-tête standard (non numérotée) */}
            <div className="mb-8 pb-6 border-b-2 border-emerald-600">
              <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400 mb-4">
                {CCAP_HEADER_TITLE}
              </h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 text-justify">
                {CCAP_HEADER_TEXT}
              </p>
            </div>

            {/* Contenu principal */}
            <div className="space-y-6 text-gray-900 dark:text-gray-100">
              {hasImportedSections ? (
                // Affichage des sections importées avec hiérarchie
                sectionsToDisplay.map((section, index) => {
                  const isDragging = draggedIndex === index;
                  const isDropTarget = dragOverIndex === index && draggedIndex !== index;
                  const sectionNumbers = calculateSectionNumbers(sectionsToDisplay);
                  const niveau = section.niveau || 1;
                  const marginLeft = (niveau - 1) * 2; // 2rem par niveau
                  const fontSize = niveau === 1 ? 'text-xl' : niveau === 2 ? 'text-lg' : 'text-base';
                  
                  return (
                    <div
                      key={index}
                      draggable={isEditing}
                      onDragStart={() => isEditing && handleDragStart(index)}
                      onDragOver={(e) => isEditing && handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => isEditing && handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      style={{ marginLeft: `${marginLeft}rem` }}
                      className={`space-y-2 relative group transition-all ${
                        isEditing ? 'cursor-grab' : ''
                      } ${
                        isDragging ? 'opacity-50 scale-95 cursor-grabbing' : ''
                      } ${
                        isDropTarget ? 'ring-2 ring-emerald-500 ring-offset-2 rounded-lg p-2' : ''
                      }`}
                    >
                      {/* Poignée de glissement en mode édition */}
                      {isEditing && (
                        <div className="absolute -left-8 top-2 text-gray-400 hover:text-emerald-600 transition cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-5 h-5" />
                        </div>
                      )}
                      
                      {/* Titre de la section avec numérotation */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 border-b-2 border-emerald-600 pb-2">
                          <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 min-w-[3rem]">
                            {sectionNumbers[index]}
                          </span>
                          <input
                            type="text"
                            value={section.titre}
                            onChange={(e) => handleTitleChange(index, e.target.value)}
                            className={`flex-1 ${fontSize} font-bold bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                            placeholder="Titre de la section"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <h3 className={`${fontSize} font-bold text-gray-900 dark:text-white border-b-2 border-emerald-600 pb-2 flex items-baseline gap-2`}>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {sectionNumbers[index]}
                          </span>
                          <span>{section.titre}</span>
                        </h3>
                      )}
                      
                      {/* Contenu de la section */}
                      <div 
                        className="text-sm leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: section.contenu }}
                      />
                    </div>
                  );
                })
              ) : (
                // Affichage du CCAP par défaut (structure formulaire)
                <div className="space-y-6">
                  <Section title="1. DISPOSITIONS GÉNÉRALES">
                    <Field label="Objet du marché" value={ccapData.dispositionsGenerales.objet} />
                    <Field label="Durée du marché" value={ccapData.dispositionsGenerales.duree} />
                    <Field label="CCAG applicable" value={ccapData.dispositionsGenerales.ccagApplicable} />
                  </Section>

                  <Section title="2. PRIX ET RÈGLEMENT">
                    <Field label="Type de prix" value={ccapData.prixPaiement.typePrix} />
                    <Field label="Modalités de paiement" value={ccapData.prixPaiement.modalitesPaiement} />
                    <Field label="Délai de paiement" value={ccapData.prixPaiement.delaiPaiement} />
                    <Field label="Retenue de garantie" value={ccapData.prixPaiement.retenuGarantie ? 'Oui' : 'Non'} />
                  </Section>

                  <Section title="3. CONDITIONS D'EXÉCUTION">
                    <Field label="Délai d'exécution" value={ccapData.execution.delaiExecution} />
                    <Field label="Pénalités de retard" value={ccapData.execution.penalitesRetard} />
                    <Field label="Conditions de réception" value={ccapData.execution.conditionsReception} />
                  </Section>

                  <Section title="4. CLAUSES SPÉCIFIQUES">
                    {ccapData.clausesSpecifiques ? (
                      <div className="space-y-2">
                        <Field label="Propriété intellectuelle" value={ccapData.clausesSpecifiques.proprietéIntellectuelle} />
                        <Field label="Confidentialité" value={ccapData.clausesSpecifiques.confidentialite} />
                        <Field label="Sécurité" value={ccapData.clausesSpecifiques.securite} />
                        <Field label="Garantie décennale" value={ccapData.clausesSpecifiques.garantieDecennale} />
                        <Field label="Garantie biennale" value={ccapData.clausesSpecifiques.garantieBiennale} />
                        <Field label="SLA" value={ccapData.clausesSpecifiques.sla} />
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Aucune clause spécifique définie</p>
                    )}
                  </Section>
                </div>
              )}
            </div>

            {/* Pied de page */}
            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
              <p>Document généré le {new Date().toLocaleDateString('fr-FR')}</p>
              <p className="mt-1">AFPA - Application Suivi Dossiers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-emerald-600 pb-2">
        {title}
      </h3>
      <div className="pl-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  
  return (
    <div className="text-sm">
      <span className="font-semibold text-gray-700 dark:text-gray-300">{label} : </span>
      <span className="text-gray-600 dark:text-gray-400">{value}</span>
    </div>
  );
}
