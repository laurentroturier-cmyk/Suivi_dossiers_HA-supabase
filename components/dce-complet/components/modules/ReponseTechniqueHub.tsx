/**
 * ReponseTechniqueHub.tsx
 * Sélection et mémorisation du type de document de réponse technique
 * pour une procédure DCE.
 *
 * Pattern extensible : ajouter un objet dans REGISTRE_DOCUMENTS_RT
 * suffit pour exposer un nouveau type de document (même si le module
 * n'est pas encore développé : available = false → "coming soon").
 */

import React, { useState } from 'react';
import {
  FileText, ClipboardList, BookOpen, LayoutTemplate,
  CheckCircle2, ArrowRight, Lock, Save, RefreshCw, Pencil,
} from 'lucide-react';
import type { DCESectionType } from '../../types';

// ─── Registre des documents de réponse technique ─────────────────────────────
// Pour ajouter un futur type : il suffit d'ajouter une entrée ici.
// available: false → affiché en "coming soon", non sélectionnable.

export interface DocumentRT {
  /** Clé correspondant à DCESectionType (ou identifiant futur) */
  key: string;
  /** Libellé court affiché dans les badges */
  shortLabel: string;
  /** Libellé complet */
  label: string;
  /** Description affichée dans la carte */
  description: string;
  /** Icône Lucide */
  icon: React.ReactNode;
  /** Classe Tailwind pour l'accent couleur */
  accentClass: string;
  /** Badge optionnel (ex: "Template DNA") */
  badge?: string;
  /** true = module prêt, false = coming soon */
  available: boolean;
}

export const REGISTRE_DOCUMENTS_RT: DocumentRT[] = [
  {
    key: 'crt',
    shortLabel: 'CRT',
    label: 'Cadre de Réponse Technique (CRT)',
    description:
      'Structure libre sous forme de rubriques et sous-rubriques. Le candidat rédige ses réponses en texte riche. Adapté aux marchés de services intellectuels.',
    icon: <FileText className="w-5 h-5" />,
    accentClass: 'border-sky-300 bg-sky-50',
    available: true,
  },
  {
    key: 'qt',
    shortLabel: 'QT',
    label: 'Questionnaire Technique',
    description:
      'Questionnaire à critères et sous-critères avec notation par points. Le candidat renseigne chaque critère individuellement.',
    icon: <ClipboardList className="w-5 h-5" />,
    accentClass: 'border-indigo-300 bg-indigo-50',
    available: true,
  },
  {
    key: 'qtGenerique',
    shortLabel: 'QT DNA',
    label: 'QT Générique commun',
    description:
      'Questionnaire Technique au format DNA : tableau avec colonnes N°, Questions, Réponse attendue, Réponse soumissionnaire, Points, Conformité. Import / export Excel natif.',
    icon: <LayoutTemplate className="w-5 h-5" />,
    accentClass: 'border-emerald-300 bg-emerald-50',
    badge: 'Template DNA',
    available: true,
  },
  // ── Futurs types — décommenter et compléter lorsque le module sera prêt ────
  {
    key: 'memoireTechnique',
    shortLabel: 'MT',
    label: 'Mémoire Technique',
    description:
      'Document libre rédigé par le candidat décrivant sa méthodologie, ses moyens et son organisation. En cours de développement.',
    icon: <BookOpen className="w-5 h-5" />,
    accentClass: 'border-purple-300 bg-purple-50',
    available: false,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReponseTechniqueHubProps {
  /** Type de document actuellement enregistré en base pour cette procédure */
  selectedType?: string | null;
  /** Navigation vers un module */
  onSelectSection: (section: DCESectionType) => void;
  /** Sauvegarde du choix en base */
  onSaveChoice: (type: string) => Promise<void>;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export const ReponseTechniqueHub: React.FC<ReponseTechniqueHubProps> = ({
  selectedType,
  onSelectSection,
  onSaveChoice,
}) => {
  // Mode "selection" si aucun choix enregistré ou si l'utilisateur clique "Changer"
  const [mode, setMode] = useState<'confirmed' | 'selecting'>(
    selectedType ? 'confirmed' : 'selecting'
  );
  const [pendingKey, setPendingKey] = useState<string>(selectedType || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const confirmedDoc = REGISTRE_DOCUMENTS_RT.find(d => d.key === selectedType);
  const pendingDoc = REGISTRE_DOCUMENTS_RT.find(d => d.key === pendingKey);

  // ── Sauvegarde du choix ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!pendingKey) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSaveChoice(pendingKey);
      setMode('confirmed');
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Sauvegarder ET ouvrir ──────────────────────────────────────────────────
  const handleSaveAndOpen = async () => {
    if (!pendingKey) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSaveChoice(pendingKey);
      setMode('confirmed');
      onSelectSection(pendingKey as DCESectionType);
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MODE CONFIRMÉ — un choix est enregistré en base
  // ─────────────────────────────────────────────────────────────────────────
  if (mode === 'confirmed' && confirmedDoc) {
    return (
      <div className="space-y-6">

        {/* Bandeau document sélectionné */}
        <div className="flex items-center gap-4 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
            {confirmedDoc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Document de réponse technique sélectionné
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{confirmedDoc.label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{confirmedDoc.description}</p>
          </div>
          {confirmedDoc.badge && (
            <span className="flex-shrink-0 text-[10px] px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-semibold">
              {confirmedDoc.badge}
            </span>
          )}
        </div>

        {/* Actions principales */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSelectSection(confirmedDoc.key as DCESectionType)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg shadow-md text-sm font-medium"
          >
            Ouvrir — {confirmedDoc.shortLabel}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingKey(selectedType || '');
              setMode('selecting');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5" />
            Changer de document
          </button>
        </div>

        {/* Rappel : autres documents disponibles (lecture seule) */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Autres types disponibles
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {REGISTRE_DOCUMENTS_RT.filter(d => d.key !== selectedType).map(doc => (
              <div
                key={doc.key}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left ${
                  doc.available
                    ? 'bg-white border-gray-200 opacity-60'
                    : 'bg-gray-50 border-gray-100 opacity-40'
                }`}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                  {doc.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{doc.label}</p>
                  {!doc.available && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 mt-0.5">
                      <Lock className="w-2.5 h-2.5" /> En préparation
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MODE SÉLECTION
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <h3 className="text-base font-semibold text-emerald-900">
          Choisissez le document de réponse technique
        </h3>
        <p className="mt-1 text-sm text-emerald-800">
          Ce choix est enregistré pour la procédure et sera réutilisé lors de l'analyse des offres.
          Sélectionnez le modèle qui correspond à vos attentes, puis confirmez.
        </p>
      </div>

      {/* Grille de sélection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REGISTRE_DOCUMENTS_RT.map(doc => {
          const isSelected = pendingKey === doc.key;
          const isDisabled = !doc.available;

          return (
            <button
              key={doc.key}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && setPendingKey(doc.key)}
              className={`
                relative flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all
                ${isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200'
                  : isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* Radio indicator */}
              <div className={`
                flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300 bg-white'}
              `}>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              {/* Icône */}
              <div className={`
                flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}
              `}>
                {doc.icon}
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {doc.label}
                  </span>
                  {doc.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold">
                      {doc.badge}
                    </span>
                  )}
                  {!doc.available && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">
                      <Lock className="w-2.5 h-2.5" /> En préparation
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barre d'actions */}
      {pendingKey && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700">
              Sélectionné :{' '}
              <span className="font-semibold text-emerald-700">{pendingDoc?.label}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Le choix sera mémorisé en base et réutilisé lors de l'analyse des offres.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {/* Enregistrer uniquement */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg disabled:opacity-50"
            >
              {isSaving
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
            {/* Enregistrer et ouvrir */}
            <button
              type="button"
              onClick={handleSaveAndOpen}
              disabled={isSaving || !pendingDoc?.available}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 shadow-sm"
            >
              {isSaving
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <ArrowRight className="w-3.5 h-3.5" />}
              Enregistrer et ouvrir
            </button>
          </div>
        </div>
      )}

      {!pendingKey && (
        <p className="text-sm text-slate-400 text-center py-2">
          Sélectionnez un type de document ci-dessus pour continuer.
        </p>
      )}

      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {saveError}
        </p>
      )}

      {/* Annuler si un choix était déjà enregistré */}
      {selectedType && (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => {
              setPendingKey(selectedType);
              setMode('confirmed');
            }}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            ← Annuler et revenir au document sélectionné
          </button>
        </div>
      )}
    </div>
  );
};
