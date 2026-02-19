// ============================================
// RapportPresentationPreview — Visionneuse du Rapport de Présentation
// Rendu HTML fidèle avant export PDF/DOCX (pattern ProcessVerbalPreview)
// ============================================

import React from 'react';
import { X, FileDown, Loader2, FileText, FileStack } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
}

/** Convertit du HTML Tiptap en JSX inline (rendu simplifié mais fidèle). */
function HtmlContent({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      className="prose prose-sm max-w-none text-gray-800 text-xs leading-relaxed"
      style={{ fontSize: '10px' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Composants document ─────────────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string | number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 bg-[#2F5B58] rounded-lg mb-3 mt-6 first:mt-0">
      <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h2 className="text-white font-bold text-xs tracking-wide uppercase">{title}</h2>
    </div>
  );
}

interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> { children: React.ReactNode }
function Th({ children, className = '', ...rest }: ThProps) {
  return (
    <th
      className={`px-2 py-1.5 text-left text-[9px] font-bold text-white bg-[#2F5B58] border border-[#234441] whitespace-nowrap ${className}`}
      {...rest}
    >
      {children}
    </th>
  );
}
interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> { children: React.ReactNode }
function Td({ children, className = '', ...rest }: TdProps) {
  return (
    <td
      className={`px-2 py-1.5 text-[10px] text-gray-700 border border-gray-200 align-top ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}
function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mb-3">
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex gap-1 text-[10px]">
      <span className="font-semibold text-gray-600 min-w-[160px]">{label} :</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RapportPreviewData {
  procedure: any;
  rapportGenere: any;
  contenuChapitre3: string;
  contenuChapitre4: string;
  chapitre10: {
    validationAttribution: string;
    envoiRejet: string;
    attributionMarche: string;
    autresElements: string;
  };
}

interface RapportPresentationPreviewProps {
  data: RapportPreviewData;
  onClose: () => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  isExportingPdf: boolean;
  isExportingDocx: boolean;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function RapportPresentationPreview({
  data,
  onClose,
  onExportPDF,
  onExportDOCX,
  isExportingPdf,
  isExportingDocx,
}: RapportPresentationPreviewProps) {
  const { procedure, rapportGenere: r, contenuChapitre3, contenuChapitre4, chapitre10 } = data;
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const numAfpa = String(procedure?.['Numéro de procédure (Afpa)'] || procedure?.['NumProc'] || '—');
  const nomProc = String(procedure?.['Nom de la procédure'] || '—');
  const acheteur = String(procedure?.['Acheteur'] || '—');
  const isExporting = isExportingPdf || isExportingDocx;

  const poidsTech = r?.section6_methodologie?.ponderationTechnique ?? 30;
  const poidsFin  = r?.section6_methodologie?.ponderationFinancier  ?? 70;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* ── Barre d'outils ── */}
      <div
        className="flex-shrink-0 bg-[#1a2e2c] text-white flex items-center justify-between px-5 py-3 shadow-lg z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Aperçu — Rapport de Présentation</p>
            <p className="text-white/60 text-xs">N° {numAfpa} · {nomProc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export DOCX */}
          <button
            onClick={onExportDOCX}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
            title="Exporter en Word (.docx)"
          >
            {isExportingDocx ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Génération…</>
            ) : (
              <><FileStack className="w-4 h-4" />Exporter DOCX</>
            )}
          </button>
          {/* Export PDF */}
          <button
            onClick={onExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition"
            title="Exporter en PDF"
          >
            {isExportingPdf ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Génération…</>
            ) : (
              <><FileDown className="w-4 h-4" />Exporter PDF</>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Zone scrollable (bureau gris, feuille A4 blanche) ── */}
      <div
        className="flex-1 overflow-y-auto bg-slate-200 py-8 px-4"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="mx-auto bg-white shadow-2xl rounded-sm"
          style={{ maxWidth: '820px', minHeight: '1100px', padding: '32px 36px' }}
        >

          {/* ══ EN-TÊTE ══ */}
          <div className="flex items-start justify-between mb-5">
            <img
              src="/Image1.png"
              alt="AFPA"
              className="h-10 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-gray-400 text-xs text-right">Édité le {today}</p>
          </div>

          {/* Titre */}
          <div className="bg-[#2F5B58] rounded-lg px-6 py-5 mb-5 text-center">
            <h1 className="text-white font-black text-xl tracking-wide uppercase">
              Rapport de Présentation
            </h1>
            <p className="text-white/80 text-sm mt-1 font-medium">{nomProc}</p>
          </div>

          {/* Fiche procédure */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-5 py-4 mb-5 space-y-1">
            <InfoRow label="N° de procédure (Afpa)"   value={numAfpa} />
            <InfoRow label="Référence plateforme"     value={procedure?.['Référence procédure (plateforme)'] || '—'} />
            <InfoRow label="Nom de la procédure"      value={nomProc} />
            <InfoRow label="Acheteur"                 value={acheteur} />
          </div>

          {/* ══ §1 CONTEXTE ══ */}
          <SectionHeader number={1} title="Contexte" />
          <div className="mb-2 text-[10px] text-gray-800">
            <HtmlContent html={r?.section1_contexte?.objetMarche || ''} />
            {r?.section1_contexte?.dureeMarche && (
              <p className="mt-1">Pour une durée totale de <strong>{r.section1_contexte.dureeMarche}</strong>.</p>
            )}
          </div>

          {/* ══ §2 DÉROULEMENT ══ */}
          <SectionHeader number={2} title="Déroulement de la procédure" />
          {r?.section2_deroulement && (
            <div className="mb-2 text-[10px] text-gray-800 space-y-1">
              <p>
                La procédure, menée conjointement avec la{' '}
                <strong>{r.section2_deroulement.clientInterne || procedure?.Client_Interne || '—'}</strong>{' '}
                de l'Afpa, a été lancée sur la plateforme «{' '}
                <strong>{r.section2_deroulement.supportProcedure}</strong> » selon le calendrier suivant :
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>Date de publication : <strong>{r.section2_deroulement.datePublication}</strong></li>
                <li>Nombre de dossiers retirés : <strong>{r.section2_deroulement.nombreRetraits}</strong></li>
                <li>Date de réception des offres : <strong>{r.section2_deroulement.dateReceptionOffres}</strong></li>
                <li>Nombre de plis reçus : <strong>{r.section2_deroulement.nombrePlisRecus}</strong></li>
                {r.section2_deroulement.dateOuverturePlis && (
                  <li>Date d'ouverture des plis : <strong>{r.section2_deroulement.dateOuverturePlis}</strong></li>
                )}
              </ul>
            </div>
          )}

          {/* ══ §3 DOSSIER DE CONSULTATION ══ */}
          <SectionHeader number={3} title="Dossier de consultation" />
          <div className="mb-2">
            {contenuChapitre3 ? (
              <HtmlContent html={contenuChapitre3} />
            ) : (
              <p className="text-[10px] italic text-orange-500">[À compléter : Description du DCE et des documents fournis]</p>
            )}
          </div>

          {/* ══ §4 QUESTIONS / RÉPONSES ══ */}
          <SectionHeader number={4} title="Questions — Réponses" />
          <div className="mb-2">
            {contenuChapitre4 ? (
              <HtmlContent html={contenuChapitre4} />
            ) : (
              <p className="text-[10px] italic text-orange-500">[À compléter : Questions posées et réponses apportées]</p>
            )}
          </div>

          {/* ══ §5 ANALYSE DES CANDIDATURES ══ */}
          <SectionHeader number={5} title="Analyse des candidatures" />
          <div className="mb-2 text-[10px] text-gray-800 space-y-1">
            <p>L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la recevabilité des documents administratifs demandés dans chacune de nos procédures.</p>
            <p>L'analyse des candidatures est disponible en annexe.</p>
          </div>

          {/* ══ §6 MÉTHODOLOGIE ══ */}
          <SectionHeader number={6} title="Méthodologie d'analyse des offres" />
          <div className="mb-2 text-[10px] text-gray-800 space-y-1">
            <p><strong>Critères d'attribution :</strong></p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Critère technique : <strong>{poidsTech}%</strong></li>
              <li>Critère financier : <strong>{poidsFin}%</strong></li>
            </ul>
            <p className="mt-1"><strong>Méthode de notation :</strong></p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Note technique sur {poidsTech} points</li>
              <li>Note financière sur {poidsFin} points</li>
              <li>Note finale sur 100 points</li>
            </ul>
          </div>

          {/* ══ §7 VALEUR DES OFFRES ══ */}
          <SectionHeader number={7} title="Analyse de la valeur des offres" />
          <div className="mb-2">
            <p className="text-[10px] text-gray-800 mb-2">
              L'analyse économique et technique dans son détail est jointe au présent document en annexe.
              Le classement final des offres est le suivant :
            </p>

            {r?.section7_2_syntheseLots ? (
              // Multi-lots
              r.section7_2_syntheseLots.lots.map((lot: any, idx: number) => (
                <div key={idx} className="mb-4">
                  <p className="text-[10px] font-semibold text-teal-700 mb-1">{lot.nomLot}</p>
                  <TableWrap>
                    <thead>
                      <tr>
                        <Th>Raison sociale</Th>
                        <Th className="text-center">Rang</Th>
                        <Th className="text-center">Note /100</Th>
                        <Th className="text-center">Note Tech. /{lot.poidsTechnique ?? poidsTech}</Th>
                        <Th className="text-center">Note Fin. /{lot.poidsFinancier ?? poidsFin}</Th>
                        <Th className="text-right">Montant TTC</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {lot.tableau.map((offre: any, oIdx: number) => (
                        <tr key={oIdx} className={oIdx === 0 ? 'bg-emerald-50' : ''}>
                          <Td className={oIdx === 0 ? 'font-semibold' : ''}>{offre.raisonSociale}</Td>
                          <Td className="text-center">{offre.rangFinal}</Td>
                          <Td className="text-center font-semibold">{Number(offre.noteFinaleSur100).toFixed(2)}</Td>
                          <Td className="text-center">{Number(offre.noteTechnique).toFixed(2)}</Td>
                          <Td className="text-center">{Number(offre.noteFinanciere).toFixed(2)}</Td>
                          <Td className="text-right">{formatCurrency(offre.montantTTC)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </TableWrap>
                </div>
              ))
            ) : r?.section7_valeurOffres?.tableau ? (
              // Lot unique
              <>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Rang</Th>
                      <Th>Entreprise</Th>
                      <Th className="text-center">Note Tech. /{poidsTech}</Th>
                      <Th className="text-center">Note Fin. /{poidsFin}</Th>
                      <Th className="text-center">Note /100</Th>
                      <Th className="text-right">Montant TTC</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.section7_valeurOffres.tableau.map((offre: any, idx: number) => (
                      <tr key={idx} className={idx === 0 ? 'bg-emerald-50' : ''}>
                        <Td className={idx === 0 ? 'font-semibold' : ''}>#{offre.rangFinal}</Td>
                        <Td className={idx === 0 ? 'font-semibold' : ''}>{offre.raisonSociale}</Td>
                        <Td className="text-center">{Number(offre.noteTechnique ?? offre.noteTechniqueSur40 ?? 0).toFixed(2)}</Td>
                        <Td className="text-center">{Number(offre.noteFinanciere ?? offre.noteFinanciereSur60 ?? 0).toFixed(2)}</Td>
                        <Td className="text-center font-semibold">{Number(offre.noteFinaleSur100).toFixed(2)}</Td>
                        <Td className="text-right">{formatCurrency(offre.montantTTC)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
                {r.section7_valeurOffres.montantEstime > 0 && (
                  <p className="text-[10px] mt-1">
                    <strong>Montant de l'estimation :</strong> {formatCurrency(r.section7_valeurOffres.montantEstime)}
                  </p>
                )}
                <p className="text-[10px] mt-0.5">
                  <strong>Montant de l'offre retenue :</strong> {formatCurrency(r.section7_valeurOffres.montantAttributaire)}
                </p>
                {r.section7_valeurOffres.montantEstime > 0 && (() => {
                  const ecart = r.section7_valeurOffres.montantAttributaire - r.section7_valeurOffres.montantEstime;
                  const pct   = (ecart / r.section7_valeurOffres.montantEstime) * 100;
                  const s = ecart >= 0 ? '+' : '';
                  return (
                    <p className="text-[10px] mt-0.5">
                      <strong>Écart par rapport à l'estimation :</strong> {s}{formatCurrency(ecart)} ({s}{pct.toFixed(2)}%)
                    </p>
                  );
                })()}
              </>
            ) : null}
          </div>

          {/* ══ §8 PERFORMANCE ══ */}
          <SectionHeader number={8} title="Analyse de la performance du dossier" />
          <div className="mb-2 text-[10px] text-gray-800">
            {r?.section8_performance?.tableauDetaille ? (
              <>
                <p className="mb-2">Le tableau ci-dessous présente la performance achat détaillée pour chaque lot :</p>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Lot</Th>
                      <Th className="text-right">Moy. HT</Th>
                      <Th className="text-right">Moy. TTC</Th>
                      <Th className="text-right">Retenue HT</Th>
                      <Th className="text-right">Retenue TTC</Th>
                      <Th className="text-right">Gains HT</Th>
                      <Th className="text-right">Gains TTC</Th>
                      <Th className="text-right">Gains %</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.section8_performance.tableauDetaille.map((lot: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <Td className="font-semibold">{lot.nomLot}</Td>
                        <Td className="text-right">{formatCurrency(lot.moyenneHT)}</Td>
                        <Td className="text-right">{formatCurrency(lot.moyenneTTC)}</Td>
                        <Td className="text-right">{formatCurrency(lot.offreRetenueHT)}</Td>
                        <Td className="text-right">{formatCurrency(lot.offreRetenueTTC)}</Td>
                        <Td className={`text-right font-semibold ${lot.gainsHT < 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrency(lot.gainsHT)}</Td>
                        <Td className={`text-right font-semibold ${lot.gainsTTC < 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrency(lot.gainsTTC)}</Td>
                        <Td className={`text-right font-semibold ${(lot.gainsPourcent ?? 0) < 0 ? 'text-emerald-700' : 'text-red-600'}`}>{Number(lot.gainsPourcent ?? 0).toFixed(1)}%</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
                <p className="mt-1">
                  Performance achat globale ({r.section8_performance.referenceCalcul || 'par rapport à la moyenne des offres'}) :{' '}
                  <strong>{Number(r.section8_performance.performanceAchatPourcent).toFixed(1)}%</strong>
                </p>
                <p className="mt-0.5">
                  Impact budgétaire total estimé :{' '}
                  <strong>{formatCurrency(r.section8_performance.impactBudgetaireTTC)} TTC</strong>{' '}
                  (soit {formatCurrency(r.section8_performance.impactBudgetaireHT)} HT)
                </p>
              </>
            ) : r?.section8_1_synthesePerformance ? (
              <>
                <p>
                  Performance achat globale ({r.section8_performance?.referenceCalcul || 'par rapport à la moyenne des offres'}) :{' '}
                  <strong>{Number(r.section8_1_synthesePerformance.performanceGlobalePourcent).toFixed(1)}%</strong>
                </p>
                <p className="mt-0.5">
                  Impact budgétaire total estimé :{' '}
                  <strong>{formatCurrency(r.section8_1_synthesePerformance.impactBudgetaireTotalTTC)} TTC</strong>{' '}
                  (soit {formatCurrency(r.section8_1_synthesePerformance.impactBudgetaireTotalHT)} HT)
                </p>
                {r.section8_1_synthesePerformance.lotsDetails?.length > 0 && (
                  <>
                    <p className="mt-2 font-semibold">Détail de la performance par lot :</p>
                    <TableWrap>
                      <thead>
                        <tr>
                          <Th>Lot</Th>
                          <Th className="text-right">Performance</Th>
                          <Th className="text-right">Impact TTC</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.section8_1_synthesePerformance.lotsDetails.map((lot: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <Td>{lot.nomLot}</Td>
                            <Td className={`text-right font-semibold ${lot.performancePourcent < 0 ? 'text-emerald-700' : 'text-red-600'}`}>{Number(lot.performancePourcent).toFixed(1)}%</Td>
                            <Td className={`text-right ${lot.impactBudgetaireTTC < 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrency(lot.impactBudgetaireTTC)}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                  </>
                )}
              </>
            ) : r?.section8_performance ? (
              <>
                <p>
                  Performance achat (par rapport à la moyenne des offres) :{' '}
                  <strong>{Number(r.section8_performance.performanceAchatPourcent).toFixed(1)}%</strong>
                </p>
                <p className="mt-0.5">
                  Impact budgétaire estimé :{' '}
                  <strong>{formatCurrency(r.section8_performance.impactBudgetaireTTC)} TTC</strong>{' '}
                  (soit {formatCurrency(r.section8_performance.impactBudgetaireHT)} HT)
                </p>
              </>
            ) : null}
          </div>

          {/* ══ §9 PROPOSITION D'ATTRIBUTION ══ */}
          <SectionHeader number={9} title="Proposition d'attribution" />
          <div className="mb-2 text-[10px] text-gray-800">
            {r?.section7_2_syntheseLots ? (
              <>
                <p className="mb-1">Au regard de ces éléments, la commission d'ouverture souhaite attribuer les lots comme suit :</p>
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Lot</Th>
                      <Th>Attributaire</Th>
                      <Th className="text-right">Montant TTC</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.section7_2_syntheseLots.lots.map((lot: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <Td className="font-semibold">{lot.nomLot}</Td>
                        <Td>{lot.attributaire}</Td>
                        <Td className="text-right font-semibold">{formatCurrency(lot.montantAttributaire)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
                <p className="mt-1 font-semibold">
                  Montant total de l'attribution : {formatCurrency(r.section7_2_syntheseLots.montantTotalTTC)}
                </p>
              </>
            ) : r?.section9_attribution ? (
              <p>
                Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à{' '}
                <strong>{r.section9_attribution.attributairePressenti}</strong>.
              </p>
            ) : null}
          </div>

          {/* ══ §10 CALENDRIER ══ */}
          <SectionHeader number={10} title="Proposition de calendrier de mise en œuvre" />
          <div className="mb-4 text-[10px] text-gray-800 space-y-1">
            <p>
              <strong>Validation de la proposition d'attribution du marché :</strong>{' '}
              {chapitre10?.validationAttribution || '—'}
            </p>
            <p>
              <strong>Envoi des lettres de rejet :</strong>{' '}
              {chapitre10?.envoiRejet || '—'}
            </p>
            <p>
              <strong>Attribution du marché :</strong>{' '}
              {chapitre10?.attributionMarche || '[À compléter]'}
            </p>
            {chapitre10?.autresElements && (
              <div>
                <strong>Autres éléments du calendrier :</strong>
                <HtmlContent html={chapitre10.autresElements} />
              </div>
            )}
          </div>

          {/* ── Bloc signature ── */}
          <div className="border-t border-gray-200 pt-5 mt-8 text-right text-[10px] text-gray-700 space-y-1">
            <p className="font-semibold">{acheteur}</p>
            <p>Fait à Montreuil, le {today}</p>
          </div>

        </div>{/* fin page A4 */}
      </div>{/* fin zone scrollable */}
    </div>
  );
}

export default RapportPresentationPreview;
