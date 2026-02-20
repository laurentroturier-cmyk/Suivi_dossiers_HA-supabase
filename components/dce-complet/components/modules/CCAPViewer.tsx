/**
 * Visionneuse du document CCAP final
 * Modèle visuel basé sur RapportPresentationPreview :
 * barre d'outils sombre plein-écran + feuille A4 blanche simulée
 */

import React, { useState } from 'react';
import { X, FileText, Edit2, Check, GripVertical, Loader2, FileStack } from 'lucide-react';
import type { CCAPData } from '../../types';
import { getCCAPTypeLabel } from './ccapTemplates';
import { CCAP_HEADER_TEXT, CCAP_HEADER_TITLE } from './ccapConstants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Composants document ─────────────────────────────────────────────────────

function SectionHeader({ number, title, color = '#2F5B58' }: { number: string | number; title: string; color?: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2 rounded-lg mb-3 mt-6 first:mt-0"
      style={{ backgroundColor: color }}
    >
      <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 leading-none">
        {number}
      </span>
      <h2 className="text-white font-bold text-xs tracking-wide uppercase">{title}</h2>
    </div>
  );
}

const CCAP_HTML_STYLES = `
  .ccap-html table { border-collapse: collapse; width: 100%; margin: 6px 0; }
  .ccap-html table th, .ccap-html table td { border: 1px solid #d1d5db; padding: 4px 8px; font-size: 10px; text-align: left; vertical-align: top; }
  .ccap-html table th { background-color: #f3f4f6; font-weight: 600; color: #374151; }
  .ccap-html table tr:nth-child(even) td { background-color: #f9fafb; }
  .ccap-html p { margin: 0 0 4px 0; }
  .ccap-html ul, .ccap-html ol { padding-left: 1.2em; margin: 4px 0; }
  .ccap-html li { margin-bottom: 2px; }
  .ccap-html strong { font-weight: 600; }
  .ccap-html em { font-style: italic; }
  .ccap-html h1, .ccap-html h2, .ccap-html h3 { font-weight: 600; margin: 6px 0 3px; }
  .ccap-html blockquote { border-left: 3px solid #d1d5db; padding-left: 8px; color: #6b7280; margin: 4px 0; }
`;

function HtmlContent({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      className="ccap-html max-w-none text-gray-800 leading-relaxed"
      style={{ fontSize: '10px' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface CCAPViewerProps {
  ccapData: CCAPData;
  numeroProcedure?: string;
  onClose: () => void;
  onExportWord?: () => void;
  onExportPdf?: () => void;
  isExportingWord?: boolean;
  isExportingPdf?: boolean;
  onChange?: (data: CCAPData) => void;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function CCAPViewer({
  ccapData,
  numeroProcedure,
  onClose,
  onExportWord,
  onExportPdf,
  isExportingWord = false,
  isExportingPdf = false,
  onChange,
}: CCAPViewerProps) {
  const hasImportedSections = Array.isArray(ccapData.sections) && ccapData.sections.length > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editedSections, setEditedSections] = useState(ccapData.sections || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isExporting = isExportingWord || isExportingPdf;

  const handleSaveEdits = () => {
    if (onChange) {
      onChange({ ...ccapData, sections: editedSections });
    }
    setIsEditing(false);
  };

  const handleCancelEdits = () => {
    setEditedSections(ccapData.sections || []);
    setIsEditing(false);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...editedSections];
    updated[index] = { ...updated[index], titre: newTitle };
    setEditedSections(updated);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...editedSections];
    const [dragged] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, dragged);
    setEditedSections(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const sectionsToDisplay = isEditing ? editedSections : (ccapData.sections || []);
  const sectionNumbers = calculateSectionNumbers(sectionsToDisplay);

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const typeLabel = ccapData.typeCCAP ? getCCAPTypeLabel(ccapData.typeCCAP) : null;
  const objet = ccapData.dispositionsGenerales?.objet || '';
  const enteteColor = ccapData.couleurEntete || '#2F5B58';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col" onClick={onClose}>
      <style dangerouslySetInnerHTML={{ __html: CCAP_HTML_STYLES }} />

      {/* ── Barre d'outils sombre ─────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 bg-[#1a2e2c] text-white flex items-center justify-between px-5 py-3 shadow-lg z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Info document */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Aperçu — CCAP</p>
            {(numeroProcedure || typeLabel) && (
              <p className="text-white/60 text-xs">
                {numeroProcedure && `N° ${numeroProcedure}`}
                {numeroProcedure && typeLabel && ' · '}
                {typeLabel}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Mode édition */}
          {hasImportedSections && onChange && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
              title="Modifier l'ordre et les titres des sections"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleSaveEdits}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition"
              >
                <Check className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={handleCancelEdits}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </>
          )}

          {/* Export Word */}
          {!isEditing && onExportWord && (
            <button
              onClick={onExportWord}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B579A] hover:bg-[#1e3f73] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
              title="Exporter en Word (.docx)"
            >
              {isExportingWord ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Génération…</>
              ) : (
                <><FileStack className="w-4 h-4" />Exporter DOCX</>
              )}
            </button>
          )}

          {/* Export PDF */}
          {!isEditing && onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#CC0000] hover:bg-[#a30000] disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
              title="Exporter en PDF"
            >
              {isExportingPdf ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Génération…</>
              ) : (
                <><FileText className="w-4 h-4" />Exporter PDF</>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Zone scrollable (bureau gris, feuille A4 blanche) ────────────── */}
      <div
        className="flex-1 overflow-y-auto bg-slate-200 py-8 px-4"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="mx-auto bg-white shadow-2xl rounded-sm"
          style={{ maxWidth: '820px', minHeight: '1100px', padding: '32px 36px' }}
        >
          {/* En-tête */}
          <div className="flex items-start justify-between mb-5">
            <img
              src="/Image1.png"
              alt="AFPA"
              className="h-10 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-gray-400 text-xs text-right">Édité le {today}</p>
          </div>

          {/* Titre principal */}
          <div className="rounded-lg px-6 py-5 mb-5 text-center" style={{ backgroundColor: enteteColor }}>
            <h1 className="text-white font-black text-xl tracking-wide uppercase">
              Cahier des Clauses Administratives Particulières
            </h1>
            {typeLabel && (
              <p className="text-white/80 text-sm mt-1 font-medium">Type : {typeLabel}</p>
            )}
            {objet && (
              <p className="text-white/70 text-xs mt-1">{objet}</p>
            )}
          </div>

          {/* Fiche procédure */}
          {(numeroProcedure || objet) && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-5 py-3 mb-5 space-y-1">
              {numeroProcedure && (
                <div className="flex gap-1 text-[10px]">
                  <span className="font-semibold text-gray-600 min-w-[160px]">N° de procédure :</span>
                  <span className="text-gray-900">{numeroProcedure}</span>
                </div>
              )}
              {objet && (
                <div className="flex gap-1 text-[10px]">
                  <span className="font-semibold text-gray-600 min-w-[160px]">Objet du marché :</span>
                  <span className="text-gray-900">{objet}</span>
                </div>
              )}
            </div>
          )}

          {/* Section d'en-tête standard (non numérotée) */}
          <SectionHeader number="◆" title={CCAP_HEADER_TITLE} color={enteteColor} />
          <p className="text-[10px] leading-relaxed text-gray-700 text-justify mb-6">
            {CCAP_HEADER_TEXT}
          </p>

          {/* ── Contenu principal ── */}
          <div className="space-y-2">
            {hasImportedSections ? (
              // Sections importées (Word ou template) avec numérotation hiérarchique
              sectionsToDisplay.map((section, index) => {
                const isDragging = draggedIndex === index;
                const isDropTarget = dragOverIndex === index && draggedIndex !== index;
                const niveau = section.niveau || 1;
                const marginLeft = (niveau - 1) * 20;

                return (
                  <div
                    key={index}
                    draggable={isEditing}
                    onDragStart={() => isEditing && handleDragStart(index)}
                    onDragOver={(e) => isEditing && handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => isEditing && handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{ marginLeft: `${marginLeft}px` }}
                    className={`relative transition-all ${isEditing ? 'cursor-grab' : ''} ${
                      isDragging ? 'opacity-50 scale-95 cursor-grabbing' : ''
                    } ${isDropTarget ? 'ring-2 ring-[#2F5B58] ring-offset-2 rounded-lg' : ''}`}
                  >
                    {/* Poignée de glissement */}
                    {isEditing && (
                      <div className="absolute -left-5 top-2 text-gray-400 hover:text-[#2F5B58] transition cursor-grab active:cursor-grabbing z-10">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}

                    {/* Titre — mode lecture */}
                    {!isEditing && (
                      <SectionHeader number={sectionNumbers[index]} title={section.titre} color={section.titreCouleur || enteteColor} />
                    )}

                    {/* Titre — mode édition (input dans bannière) */}
                    {isEditing && (
                      <div className="flex items-center gap-2 rounded-lg px-4 py-2 mb-2 mt-6 first:mt-0" style={{ backgroundColor: section.titreCouleur || enteteColor }}>
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 leading-none">
                          {sectionNumbers[index]}
                        </span>
                        <input
                          type="text"
                          value={section.titre}
                          onChange={(e) => handleTitleChange(index, e.target.value)}
                          className="flex-1 text-xs font-bold bg-white/10 text-white border border-white/30 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/50 uppercase tracking-wide"
                          placeholder="Titre de la section"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}

                    {/* Contenu */}
                    <HtmlContent html={section.contenu} />
                  </div>
                );
              })
            ) : (
              // Fallback : affichage du CCAP structuré (formulaire sans import Word)
              <div className="space-y-2">
                <SectionHeader number="1" title="Dispositions générales" color={enteteColor} />
                <div className="text-[10px] pl-2 space-y-1 mb-2">
                  {ccapData.dispositionsGenerales.objet && (
                    <p><strong>Objet du marché :</strong> {ccapData.dispositionsGenerales.objet}</p>
                  )}
                  {ccapData.dispositionsGenerales.duree && (
                    <p><strong>Durée du marché :</strong> {ccapData.dispositionsGenerales.duree}</p>
                  )}
                  {ccapData.dispositionsGenerales.ccagApplicable && (
                    <p><strong>CCAG applicable :</strong> {ccapData.dispositionsGenerales.ccagApplicable}</p>
                  )}
                  {ccapData.dispositionsGenerales.reconduction && (
                    <p>
                      <strong>Reconduction :</strong> Oui
                      {ccapData.dispositionsGenerales.nbReconductions
                        ? ` (${ccapData.dispositionsGenerales.nbReconductions} fois)`
                        : ''}
                    </p>
                  )}
                </div>

                <SectionHeader number="2" title="Prix et règlement" color={enteteColor} />
                <div className="text-[10px] pl-2 space-y-1 mb-2">
                  {ccapData.prixPaiement.typePrix && (
                    <p><strong>Type de prix :</strong> {ccapData.prixPaiement.typePrix}</p>
                  )}
                  {ccapData.prixPaiement.modalitesPaiement && (
                    <p><strong>Modalités de paiement :</strong> {ccapData.prixPaiement.modalitesPaiement}</p>
                  )}
                  {ccapData.prixPaiement.delaiPaiement && (
                    <p><strong>Délai de paiement :</strong> {ccapData.prixPaiement.delaiPaiement}</p>
                  )}
                  <p><strong>Retenue de garantie :</strong> {ccapData.prixPaiement.retenuGarantie ? 'Oui' : 'Non'}</p>
                  {ccapData.prixPaiement.revision && ccapData.prixPaiement.formuleRevision && (
                    <p><strong>Formule de révision :</strong> {ccapData.prixPaiement.formuleRevision}</p>
                  )}
                </div>

                <SectionHeader number="3" title="Conditions d'exécution" color={enteteColor} />
                <div className="text-[10px] pl-2 space-y-1 mb-2">
                  {ccapData.execution.delaiExecution && (
                    <p><strong>Délai d'exécution :</strong> {ccapData.execution.delaiExecution}</p>
                  )}
                  {ccapData.execution.penalitesRetard && (
                    <p><strong>Pénalités de retard :</strong> {ccapData.execution.penalitesRetard}</p>
                  )}
                  {ccapData.execution.conditionsReception && (
                    <p><strong>Conditions de réception :</strong> {ccapData.execution.conditionsReception}</p>
                  )}
                </div>

                {ccapData.clausesSpecifiques && (
                  <>
                    <SectionHeader number="4" title="Clauses spécifiques" color={enteteColor} />
                    <div className="text-[10px] pl-2 space-y-1 mb-2">
                      {ccapData.clausesSpecifiques.proprietéIntellectuelle && (
                        <p><strong>Propriété intellectuelle :</strong> {ccapData.clausesSpecifiques.proprietéIntellectuelle}</p>
                      )}
                      {ccapData.clausesSpecifiques.confidentialite && (
                        <p><strong>Confidentialité :</strong> {ccapData.clausesSpecifiques.confidentialite}</p>
                      )}
                      {ccapData.clausesSpecifiques.securite && (
                        <p><strong>Sécurité :</strong> {ccapData.clausesSpecifiques.securite}</p>
                      )}
                      {ccapData.clausesSpecifiques.garantieDecennale && (
                        <p><strong>Garantie décennale :</strong> {ccapData.clausesSpecifiques.garantieDecennale}</p>
                      )}
                      {ccapData.clausesSpecifiques.garantieBiennale && (
                        <p><strong>Garantie biennale :</strong> {ccapData.clausesSpecifiques.garantieBiennale}</p>
                      )}
                      {ccapData.clausesSpecifiques.sla && (
                        <p><strong>SLA :</strong> {ccapData.clausesSpecifiques.sla}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Pied de page */}
          <div className="mt-12 pt-5 border-t border-gray-200 text-right text-[10px] text-gray-500 space-y-0.5">
            <p>Document généré le {today}</p>
            <p>AFPA - Application Suivi Dossiers HA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
