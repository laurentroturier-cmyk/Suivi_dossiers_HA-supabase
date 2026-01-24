// CCAP - Clause Administrative Particulière (Commune à tous les lots)
import React, { useState, useEffect } from 'react';
import { CCAPForm } from './CCAPForm';
import { createDefaultCCAP } from './defaults';
import { CCAP_TYPES, createCCAPFromTemplate, getCCAPTypeLabel } from './ccapTemplates';
import { exportCCAPToWord } from './ccapExportWord';
import type { CCAPData, CCAPType } from '../types';
import { Save, FileCheck, AlertCircle, Sparkles, FileDown } from 'lucide-react';

interface Props {
  procedureId: string;
  numeroProcedure?: string; // Pour le nom de fichier Word
  onSave?: (data: CCAPData) => void;
  initialData?: CCAPData;
}

export function CCAPMultiLots({ procedureId, numeroProcedure, onSave, initialData }: Props) {
  const [ccapData, setCcapData] = useState<CCAPData>(initialData || createDefaultCCAP());
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(!initialData?.typeCCAP);
  const [selectedType, setSelectedType] = useState<CCAPType | null>(initialData?.typeCCAP || null);

  useEffect(() => {
    if (initialData) {
      setCcapData(initialData);
      setSelectedType(initialData.typeCCAP || null);
      setShowTypeSelector(!initialData.typeCCAP);
    }
  }, [initialData]);

  const handleSave = async (data: CCAPData) => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      setCcapData(data);
      if (onSave) {
        await onSave(data);
      }
      setSaveMessage({ type: 'success', text: 'CCAP enregistré avec succès' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.message || 'Erreur lors de l\'enregistrement' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    setSaveMessage(null);
    
    try {
      await exportCCAPToWord(ccapData, numeroProcedure);
      setSaveMessage({ type: 'success', text: 'CCAP exporté au format Word avec succès' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: `Erreur lors de l'export Word : ${error.message}` });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectType = (type: CCAPType) => {
    const objet = ccapData.dispositionsGenerales.objet;
    const newCCAP = createCCAPFromTemplate(type, objet);
    setCcapData(newCCAP);
    setSelectedType(type);
    setShowTypeSelector(false);
  };

  const handleChangeType = () => {
    setShowTypeSelector(true);
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              CCAP - Clause Administrative Particulière
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Le CCAP est commun à tous les lots de la procédure. Les modifications apportées s'appliquent à l'ensemble du marché.
            </p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {selectedType && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-100">Type actuel :</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs font-semibold rounded">
                      {CCAP_TYPES.find(t => t.value === selectedType)?.icon} {getCCAPTypeLabel(selectedType)}
                    </span>
                  </div>
                  <button
                    onClick={handleChangeType}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Changer de type
                  </button>
                  <button
                    onClick={handleExportWord}
                    disabled={isExporting}
                    className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    {isExporting ? 'Export en cours...' : 'Exporter en Word'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de type de CCAP */}
      {showTypeSelector && (
        <div className="bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Choisissez le type de CCAP
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sélectionnez le type de marché pour pré-remplir le CCAP avec un modèle adapté
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CCAP_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleSelectType(type.value)}
                className="flex flex-col items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">
                  {type.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {type.description}
                </div>
              </button>
            ))}
          </div>

          {selectedType && (
            <button
              onClick={() => setShowTypeSelector(false)}
              className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Annuler et revenir au formulaire
            </button>
          )}
        </div>
      )}

      {/* Message de sauvegarde */}
      {saveMessage && (
        <div className={`rounded-lg p-3 flex items-center gap-2 ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          {saveMessage.type === 'success' ? (
            <Save className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{saveMessage.text}</span>
        </div>
      )}

      {/* Formulaire CCAP */}
      {!showTypeSelector && (
        <CCAPForm
          data={ccapData}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
