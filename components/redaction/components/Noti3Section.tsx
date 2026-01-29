import React, { useState, useEffect } from "react";
import type { Noti3Data } from "../types/noti3";
import { exportNoti3Html, exportNoti3Pdf } from "../utils/noti3HtmlGenerator";
import { exportNoti3PdfReact } from "../utils/noti3PdfReactExport";
import { saveNoti3, loadNoti3 } from "../utils/noti3Storage";
import Noti3Viewer from "./Noti3Viewer";
import { FileText, Eye, Download, Loader2, Save, FolderOpen, CheckCircle2, XCircle } from 'lucide-react';

interface NOTI3SectionProps {
  initialData: Noti3Data;
}

export default function NOTI3Section({ initialData }: NOTI3SectionProps) {
  const [formData, setFormData] = useState<Noti3Data>(initialData);
  const [showViewer, setShowViewer] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const getNumeroProcedureKey = (): string => {
    const match = formData.numeroProcedure?.match(/^(\d{5})/);
    return match ? match[1] : formData.numeroProcedure?.slice(0, 5) || '';
  };

  const handleSave = async () => {
    const numeroKey = getNumeroProcedureKey();
    if (!/^\d{5}$/.test(numeroKey)) {
      setStatus({ type: 'error', message: 'Numéro de procédure invalide (doit commencer par 5 chiffres)' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveNoti3(numeroKey, formData);
      if (!result.success) {
        setStatus({ type: 'error', message: result.error || 'Erreur lors de la sauvegarde du NOTI3' });
      } else {
        setStatus({ type: 'success', message: 'NOTI3 sauvegardé pour ce candidat/lot' });
      }
    } catch (error) {
      console.error('Erreur handleSave NOTI3:', error);
      setStatus({ type: 'error', message: 'Erreur inattendue lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleLoad = async () => {
    const numeroKey = getNumeroProcedureKey();
    if (!/^\d{5}$/.test(numeroKey)) {
      setStatus({ type: 'error', message: 'Numéro de procédure invalide (doit commencer par 5 chiffres)' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const lotNumero = formData.notification.lots?.[0]?.numero;
      const result = await loadNoti3(numeroKey, formData.candidat.denomination, lotNumero);
      if (!result.success || !result.data) {
        setStatus({ type: 'error', message: result.error || 'Aucun NOTI3 sauvegardé pour ce candidat/lot' });
      } else {
        setFormData(result.data);
        setStatus({ type: 'success', message: 'NOTI3 chargé depuis la sauvegarde' });
      }
    } catch (error) {
      console.error('Erreur handleLoad NOTI3:', error);
      setStatus({ type: 'error', message: 'Erreur inattendue lors du chargement' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  const handleExportHtml = async () => {
    setIsExportingHtml(true);
    try {
      await exportNoti3Html(formData);
    } catch (error) {
      console.error('Erreur export HTML:', error);
      alert('Erreur lors de l\'export HTML');
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      // Utilise @react-pdf/renderer pour un PDF de meilleure qualité
      await exportNoti3PdfReact(formData);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const updated = { ...prev };
      let current: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons actions */}
      <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
            NOTI3 – Notification de rejet de candidature ou d'offre
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Candidat : {formData.candidat.denomination}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={handleLoad}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            title="Charger un NOTI3 sauvegardé pour ce candidat/lot"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
            Charger
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
          <button
            onClick={() => setShowViewer(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          <button
            onClick={handleExportHtml}
            disabled={isExportingHtml || isExportingPdf}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isExportingHtml ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export HTML
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingHtml || isExportingPdf}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export PDF
          </button>
        </div>
      </div>

      {/* Statut de sauvegarde/chargement */}
      {status.type && (
        <div
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
            status.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      {/* Section A - Pouvoir adjudicateur */}
      <SectionHeader title="A - Identification du pouvoir adjudicateur" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Nom"
          value={formData.pouvoirAdjudicateur.nom}
          onChange={(v) => updateField('pouvoirAdjudicateur.nom', v)}
        />
        <InputField
          label="Adresse"
          value={formData.pouvoirAdjudicateur.adresseVoie}
          onChange={(v) => updateField('pouvoirAdjudicateur.adresseVoie', v)}
        />
        <InputField
          label="Code postal"
          value={formData.pouvoirAdjudicateur.codePostal}
          onChange={(v) => updateField('pouvoirAdjudicateur.codePostal', v)}
        />
        <InputField
          label="Ville"
          value={formData.pouvoirAdjudicateur.ville}
          onChange={(v) => updateField('pouvoirAdjudicateur.ville', v)}
        />
      </div>

      {/* Section B - Objet de la notification */}
      <SectionHeader title="B - Objet de la notification" />
      <TextareaField
        label="Objet de la consultation"
        value={formData.objetConsultation}
        onChange={(v) => updateField('objetConsultation', v)}
        rows={3}
      />
      <InputField
        label="Numéro de procédure"
        value={formData.numeroProcedure}
        onChange={(v) => updateField('numeroProcedure', v)}
        className="mt-4"
      />
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type de marché
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={formData.notification.type === 'ensemble'}
              onChange={() => updateField('notification.type', 'ensemble')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Ensemble du marché</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={formData.notification.type === 'lots'}
              onChange={() => updateField('notification.type', 'lots')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Lot(s) spécifique(s)</span>
          </label>
        </div>
      </div>
      {formData.notification.type === 'lots' && formData.notification.lots.length > 0 && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Lots concernés
          </label>
          {formData.notification.lots.map((lot, index) => (
            <div key={index} className="flex gap-2">
              <InputField
                label={`Lot ${index + 1} - Numéro`}
                value={lot.numero}
                onChange={(v) => {
                  const newLots = [...formData.notification.lots];
                  newLots[index] = { ...newLots[index], numero: v };
                  updateField('notification.lots', newLots);
                }}
              />
              <InputField
                label="Intitulé"
                value={lot.intitule}
                onChange={(v) => {
                  const newLots = [...formData.notification.lots];
                  newLots[index] = { ...newLots[index], intitule: v };
                  updateField('notification.lots', newLots);
                }}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      )}

      {/* Section C - Candidat non retenu */}
      <SectionHeader title="C - Identification du candidat ou du soumissionnaire" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Dénomination"
          value={formData.candidat.denomination}
          onChange={(v) => updateField('candidat.denomination', v)}
        />
        <InputField
          label="SIRET"
          value={formData.candidat.siret}
          onChange={(v) => updateField('candidat.siret', v)}
        />
        <InputField
          label="Adresse 1"
          value={formData.candidat.adresse1}
          onChange={(v) => updateField('candidat.adresse1', v)}
        />
        <InputField
          label="Adresse 2 (optionnel)"
          value={formData.candidat.adresse2 || ''}
          onChange={(v) => updateField('candidat.adresse2', v)}
        />
        <InputField
          label="Code postal"
          value={formData.candidat.codePostal}
          onChange={(v) => updateField('candidat.codePostal', v)}
        />
        <InputField
          label="Ville"
          value={formData.candidat.ville}
          onChange={(v) => updateField('candidat.ville', v)}
        />
        <InputField
          label="Email"
          value={formData.candidat.email}
          onChange={(v) => updateField('candidat.email', v)}
        />
        <InputField
          label="Téléphone"
          value={formData.candidat.telephone}
          onChange={(v) => updateField('candidat.telephone', v)}
        />
      </div>

      {/* Section D - Rejet */}
      <SectionHeader title="D - Notification de rejet" />
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de rejet
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.rejet.type === 'candidature'}
                onChange={() => updateField('rejet.type', 'candidature')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Candidature non retenue</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.rejet.type === 'offre'}
                onChange={() => updateField('rejet.type', 'offre')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Offre non retenue</span>
            </label>
          </div>
        </div>
        
        <TextareaField
          label="Motifs du rejet"
          value={formData.rejet.motifs}
          onChange={(v) => updateField('rejet.motifs', v)}
          rows={4}
          placeholder="En considération des critères de choix définis dans le Règlement de la Consultation..."
        />
        
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Pondération maximale économique (ex: 60)"
            value={formData.rejet.maxEco || '60'}
            onChange={(v) => updateField('rejet.maxEco', v)}
          />
          <InputField
            label="Pondération maximale technique (ex: 40)"
            value={formData.rejet.maxTech || '40'}
            onChange={(v) => updateField('rejet.maxTech', v)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label={`Note économique / ${formData.rejet.maxEco || '60'}`}
            value={formData.rejet.noteEco}
            onChange={(v) => updateField('rejet.noteEco', v)}
          />
          <InputField
            label={`Note technique / ${formData.rejet.maxTech || '40'}`}
            value={formData.rejet.noteTech}
            onChange={(v) => updateField('rejet.noteTech', v)}
          />
          <InputField
            label="Total / 100"
            value={formData.rejet.total}
            onChange={(v) => updateField('rejet.total', v)}
          />
        </div>
        
        <InputField
          label="Classement (rang)"
          value={formData.rejet.classement}
          onChange={(v) => updateField('rejet.classement', v)}
          placeholder="2"
        />
      </div>

      {/* Section E - Attributaire */}
      <SectionHeader title="E - Identification de l'attributaire" />
      <div className="space-y-4">
        <InputField
          label="Dénomination de l'attributaire"
          value={formData.attributaire.denomination}
          onChange={(v) => updateField('attributaire.denomination', v)}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Pondération maximale économique (ex: 60)"
            value={formData.attributaire.maxEco || '60'}
            onChange={(v) => updateField('attributaire.maxEco', v)}
          />
          <InputField
            label="Pondération maximale technique (ex: 40)"
            value={formData.attributaire.maxTech || '40'}
            onChange={(v) => updateField('attributaire.maxTech', v)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label={`Note économique / ${formData.attributaire.maxEco || '60'}`}
            value={formData.attributaire.noteEco}
            onChange={(v) => updateField('attributaire.noteEco', v)}
          />
          <InputField
            label={`Note technique / ${formData.attributaire.maxTech || '40'}`}
            value={formData.attributaire.noteTech}
            onChange={(v) => updateField('attributaire.noteTech', v)}
          />
          <InputField
            label="Total / 100"
            value={formData.attributaire.total}
            onChange={(v) => updateField('attributaire.total', v)}
          />
        </div>
        
        <TextareaField
          label="Motifs de l'attribution"
          value={formData.attributaire.motifs}
          onChange={(v) => updateField('attributaire.motifs', v)}
          rows={4}
          placeholder="En effet, en considération des critères de choix définis dans le Règlement de la Consultation..."
        />
      </div>

      {/* Section F - Délai standstill */}
      <SectionHeader title="F - Délais et voies de recours" />
      <div className="space-y-4">
        <InputField
          label="Délai de suspension (jours)"
          value={formData.delaiStandstill}
          onChange={(v) => updateField('delaiStandstill', v)}
          placeholder="11"
        />
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200 mb-1">📋 Référé précontractuel</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Le candidat peut, s'il le souhaite, exercer un référé précontractuel contre la présente procédure de passation, 
              devant le président du tribunal administratif, avant la signature du marché public ou de l'accord-cadre.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200 mb-1">⚖️ Recours pour excès de pouvoir</h4>
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Dans l'hypothèse d'une déclaration d'infructuosité de la procédure, le candidat peut, s'il le souhaite, 
              exercer un recours pour excès de pouvoir contre cette décision, devant le tribunal administratif. 
              Le juge doit être saisi dans un délai de deux mois à compter de la notification du présent courrier.
            </p>
          </div>
        </div>
      </div>

      {/* Section G - Signature */}
      <SectionHeader title="G - Signature" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Lieu"
          value={formData.signature.lieu}
          onChange={(v) => updateField('signature.lieu', v)}
          placeholder="Montreuil"
        />
        <InputField
          label="Date"
          value={formData.signature.date}
          onChange={(v) => updateField('signature.date', v)}
          placeholder="02/12/2025"
        />
        <InputField
          label="Titre du signataire"
          value={formData.signature.signataireTitre}
          onChange={(v) => updateField('signature.signataireTitre', v)}
          placeholder="Pour la Direction Nationale des Achats"
        />
        <InputField
          label="Nom du signataire"
          value={formData.signature.signataireNom}
          onChange={(v) => updateField('signature.signataireNom', v)}
          placeholder="Nom et prénom"
        />
      </div>

      {/* Visionneuse */}
      {showViewer && (
        <Noti3Viewer data={formData} onClose={() => setShowViewer(false)} />
      )}
    </div>
  );
}

// Composants réutilisables
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700 mt-6 mb-3">
      {title}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function InputField({ label, value, onChange, className = '', placeholder }: InputFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

function TextareaField({ label, value, onChange, rows = 4, placeholder }: TextareaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
