import React, { useState, useEffect } from "react";
import type { Noti3Data } from "../types/noti3";
import { exportNoti3Html, exportNoti3Pdf } from "../utils/noti3HtmlGenerator";
import Noti3Viewer from "./Noti3Viewer";
import { FileText, Eye, Download, Loader2 } from 'lucide-react';

interface NOTI3SectionProps {
  initialData: Noti3Data;
}

export default function NOTI3Section({ initialData }: NOTI3SectionProps) {
  const [formData, setFormData] = useState<Noti3Data>(initialData);
  const [showViewer, setShowViewer] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

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
      await exportNoti3Pdf(formData);
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
      {/* En-tête avec bouton export */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">
            NOTI3 – Notification de rejet de candidature ou d'offre
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Candidat : {formData.candidat.denomination}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowViewer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          <button
            onClick={handleExportHtml}
            disabled={isExportingHtml || isExportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
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
              <span className="text-sm text-gray-700 dark:text-gray-300">Candidature</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={formData.rejet.type === 'offre'}
                onChange={() => updateField('rejet.type', 'offre')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Offre</span>
            </label>
          </div>
        </div>
        
        <TextareaField
          label="Motifs du rejet"
          value={formData.rejet.motifs}
          onChange={(v) => updateField('rejet.motifs', v)}
          rows={3}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Note économique / 60"
            value={formData.rejet.noteEco}
            onChange={(v) => updateField('rejet.noteEco', v)}
          />
          <InputField
            label="Note technique / 40"
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
          label="Classement"
          value={formData.rejet.classement}
          onChange={(v) => updateField('rejet.classement', v)}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Note économique / 60"
            value={formData.attributaire.noteEco}
            onChange={(v) => updateField('attributaire.noteEco', v)}
          />
          <InputField
            label="Note technique / 40"
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
          rows={3}
        />
      </div>

      {/* Section F - Délai standstill */}
      <SectionHeader title="F - Délais et voies de recours" />
      <InputField
        label="Délai de suspension (jours)"
        value={formData.delaiStandstill}
        onChange={(v) => updateField('delaiStandstill', v)}
      />

      {/* Section G - Signature */}
      <SectionHeader title="G - Signature" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Lieu"
          value={formData.signature.lieu}
          onChange={(v) => updateField('signature.lieu', v)}
        />
        <InputField
          label="Date"
          value={formData.signature.date}
          onChange={(v) => updateField('signature.date', v)}
        />
        <InputField
          label="Signataire / Titre"
          value={formData.signature.signataireTitre}
          onChange={(v) => updateField('signature.signataireTitre', v)}
          className="md:col-span-2"
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
}

function InputField({ label, value, onChange, className = '' }: InputFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
}

function TextareaField({ label, value, onChange, rows = 4 }: TextareaFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}
