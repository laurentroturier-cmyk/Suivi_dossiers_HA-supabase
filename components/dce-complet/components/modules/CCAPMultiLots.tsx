// CCAP - Clause Administrative Particulière (Commune à tous les lots)
import React, { useState, useEffect, useRef } from 'react';
import { CCAPForm } from './CCAPForm';
import { createDefaultCCAP } from './defaults';
import { CCAP_TYPES, createCCAPFromTemplate, getCCAPTypeLabel } from './ccapTemplates';
import { exportCCAPToWord } from './ccapExportWord';
import { exportCCAPToPdf } from './ccapExportPdf';
import { parseWordToCCAP } from './ccapWordParser';
import { CCAPViewer } from './CCAPViewer';
import type { CCAPData, CCAPType } from '../../types';
import { Save, FileCheck, AlertCircle, Sparkles, FileDown, Upload, FileText, Eye } from 'lucide-react';

interface Props {
  procedureId: string;
  numeroProcedure?: string; // Pour le nom de fichier Word
  onSave?: (data: CCAPData) => void;
  initialData?: CCAPData;
  /**
   * Quand vrai, on ouvre directement l'écran de sélection du type de CCAP
   * à chaque fois que le module est monté (clic sur "CCAP" dans le menu).
   */
  openTypeSelectorOnMount?: boolean;
  /**
   * Callback optionnel pour revenir à l'écran de choix des pièces
   * (par exemple la page "Pièces administratives & techniques" du DCE complet).
   */
  onBackToHub?: () => void;
}

export function CCAPMultiLots({
  procedureId,
  numeroProcedure,
  onSave,
  initialData,
  openTypeSelectorOnMount = false,
  onBackToHub,
}: Props) {
  const [ccapData, setCcapData] = useState<CCAPData>(initialData || createDefaultCCAP());
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(
    openTypeSelectorOnMount || !initialData?.typeCCAP,
  );
  const [selectedType, setSelectedType] = useState<CCAPType | null>(initialData?.typeCCAP || null);
  const [showViewer, setShowViewer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effet pour initialiser le type et le sélecteur au premier montage
  useEffect(() => {
    if (initialData) {
      setCcapData(initialData);
      setSelectedType(initialData.typeCCAP || null);
      // Ne montrer le sélecteur de type que si aucun type n'est défini
      // et non pas à chaque changement de données
      if (!initialData.typeCCAP) {
        setShowTypeSelector(true);
      }
    } else if (openTypeSelectorOnMount) {
      // Pas de données initiales : on force l'ouverture du sélecteur de type
      setShowTypeSelector(true);
    }
  }, [initialData?.typeCCAP, openTypeSelectorOnMount]); // Dépendance uniquement sur le type, pas sur toutes les données

  // Effet pour mettre à jour les données CCAP quand initialData change (après sauvegarde)
  useEffect(() => {
    if (initialData) {
      setCcapData(initialData);
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

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setSaveMessage(null);

    try {
      await exportCCAPToPdf(ccapData, numeroProcedure);
      setSaveMessage({ type: 'success', text: 'CCAP exporté au format PDF avec succès' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: `Erreur lors de l'export PDF : ${error.message}` });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setSaveMessage({ type: 'error', text: 'Veuillez sélectionner un fichier Word (.docx)' });
      return;
    }

    setIsImporting(true);
    setSaveMessage(null);

    try {
      const result = await parseWordToCCAP(file);
      setCcapData(prev => ({
        ...prev,
        sections: result.sections,
      }));
      setShowTypeSelector(false);
      setSaveMessage({ type: 'success', text: `${result.totalSections} sections importées avec succès` });
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error?.message || "Erreur lors de l'import Word" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      {/* Bouton de retour vers la page de choix des pièces */}
      {onBackToHub && (
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onBackToHub}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900"
          >
            <span className="text-base leading-none">←</span>
            Retour aux pièces administratives & techniques
          </button>
        </div>
      )}

      {/* En-tête avec info */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileCheck className="w-5 h-5 text-[#2F5B58] dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              CCAP - Clause Administrative Particulière
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Le CCAP est commun à tous les lots de la procédure. Les modifications apportées s'appliquent à l'ensemble du marché.
            </p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {selectedType && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-green-900 dark:text-green-100">Type actuel :</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs font-semibold rounded">
                      {CCAP_TYPES.find(t => t.value === selectedType)?.icon} {getCCAPTypeLabel(selectedType)}
                    </span>
                  </div>
                  <button
                    onClick={handleChangeType}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline"
                  >
                    Changer de type
                  </button>
                </>
              )}
              {/* Couleur de l'en-tête */}
              <div className="flex items-center gap-1.5 ml-auto" title="Couleur de fond des titres de section et de l'en-tête">
                <span className="text-xs text-green-800 dark:text-green-200 font-medium">Couleur titres :</span>
                <input
                  type="color"
                  value={ccapData.couleurEntete || '#2F5B58'}
                  onChange={e => setCcapData(prev => ({ ...prev, couleurEntete: e.target.value }))}
                  className="w-7 h-7 rounded cursor-pointer border border-green-300 dark:border-green-700"
                  title="Couleur de fond des bannières de titre"
                />
                {ccapData.couleurEntete && (
                  <button
                    type="button"
                    onClick={() => setCcapData(prev => { const { couleurEntete: _, ...rest } = prev; return rest as typeof prev; })}
                    className="text-[10px] text-green-700 dark:text-green-300 hover:underline"
                    title="Réinitialiser la couleur par défaut"
                  >
                    Déf.
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowViewer(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-xs font-medium rounded-md hover:from-emerald-600 hover:to-emerald-700 transition-colors shadow-md"
                title="Prévisualiser le document CCAP"
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
              <button
                onClick={handleExportWord}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-blue-500 to-blue-600 text-white text-xs font-medium rounded-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                title="Exporter au format Word (.docx)"
              >
                <FileText className="w-4 h-4" />
                {isExporting ? 'Export en cours...' : 'Exporter en Word'}
              </button>
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-b from-red-500 to-red-600 text-white text-xs font-medium rounded-md hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                title="Exporter au format PDF"
              >
                <FileText className="w-4 h-4" />
                {isExportingPdf ? 'Export PDF...' : 'Exporter en PDF'}
              </button>
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
          <div className="flex items-center gap-2 mb-4">
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
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              title="Importer un CCAP Word (.docx)"
            >
              <FileText className="w-4 h-4" />
              <Upload className="w-3.5 h-3.5" />
              {isImporting ? 'Import en cours...' : 'Importer Word'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CCAP_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleSelectType(type.value)}
                className="flex flex-col items-start p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-left group"
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300">
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
          onChange={setCcapData}
        />
      )}

      {/* Visionneuse CCAP */}
      {showViewer && (
        <CCAPViewer
          ccapData={ccapData}
          numeroProcedure={numeroProcedure}
          onClose={() => setShowViewer(false)}
          onExportWord={handleExportWord}
          onExportPdf={handleExportPdf}
          isExportingWord={isExporting}
          isExportingPdf={isExportingPdf}
          onChange={(updatedData) => {
            setCcapData(updatedData);
            if (onSave) {
              onSave(updatedData);
            }
          }}
        />
      )}
    </div>
  );
}
