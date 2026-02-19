// ============================================
// ProcessVerbalPreview — Visionneuse du Procès Verbal
// Rendu HTML fidèle avant export PDF
// ============================================

import React from 'react';
import { X, FileDown, Loader2, Printer } from 'lucide-react';
import type { ProcessVerbalData } from '../utils/procesVerbalPdfExport';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { /* ignore */ }
  return dateStr;
}


function DecisionBadge({ val }: { val: string }) {
  if (!val) return <span className="text-gray-400 text-xs">—</span>;
  const isElim = val === 'Éliminé' || val === 'Eliminé';
  const isAdmis = val === 'Admis';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      isElim  ? 'bg-red-100 text-red-700'
      : isAdmis ? 'bg-emerald-100 text-emerald-700'
      : 'bg-gray-100 text-gray-600'
    }`}>
      {val}
    </span>
  );
}

// ─── Composants de mise en page du document ───────────────────────────────────

function SectionHeader({ number, title, badge }: { number: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#2F5B58] rounded-lg mb-3 mt-6 first:mt-0">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        <h2 className="text-white font-bold text-sm tracking-wide uppercase">{title}</h2>
      </div>
      {badge && (
        <span className="text-white/80 text-xs font-medium whitespace-nowrap">{badge}</span>
      )}
    </div>
  );
}


interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> { children: React.ReactNode }
function Th({ children, className = '', ...rest }: ThProps) {
  return (
    <th
      className={`px-2 py-1.5 text-left text-[10px] font-bold text-white bg-[#2F5B58] border border-[#234441] whitespace-nowrap ${className}`}
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
      className={`px-2 py-1.5 text-xs text-gray-700 border border-gray-200 align-top ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}
function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
      <table className="min-w-full border-collapse text-xs">{children}</table>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface ProcessVerbalPreviewProps {
  data: ProcessVerbalData;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function ProcessVerbalPreview({ data, onClose, onExport, isExporting }: ProcessVerbalPreviewProps) {
  const proc = data.procedure;
  const numAfpa   = String(proc?.['Numéro de procédure (Afpa)'] || proc?.['NumProc'] || '—');
  const refProc   = String(proc?.['Référence procédure (plateforme)'] || '—');
  const nomProc   = String(proc?.['Nom de la procédure'] || '—');
  const acheteur  = String(proc?.['Acheteur'] || '—');
  const dateOffre = data.depotsData?.procedureInfo?.dateOffre || '';
  const today     = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  const nbTotal = data.depotsData?.entreprises?.length ?? 0;
  const nbElec  = data.depotsData?.stats?.totalEnveloppesElectroniques ?? 0;
  const nbPap   = data.depotsData?.stats?.totalEnveloppesPapier ?? 0;

  const recv = data.recevabilite;

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
            <Printer className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Aperçu — Procès Verbal d'Ouverture des Plis</p>
            <p className="text-white/60 text-xs">N° {numAfpa} · {nomProc}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
          >
            {isExporting ? (
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

      {/* ── Zone scrollable (fond gris ardoise, simule un bureau) ── */}
      <div
        className="flex-1 overflow-y-auto bg-slate-200 py-8 px-4"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Page A4 simulée ── */}
        <div
          className="mx-auto bg-white shadow-2xl rounded-sm"
          style={{ maxWidth: '820px', minHeight: '1100px', padding: '32px 36px' }}
        >

          {/* ════ EN-TÊTE PAGE DE GARDE ════ */}
          <div className="flex items-start justify-between mb-5">
            {/* Logo placeholder */}
            <img
              src="/Image1.png"
              alt="AFPA"
              className="h-10 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <p className="text-gray-400 text-xs text-right">
              Édité le {today}
            </p>
          </div>

          {/* Titre */}
          <div className="bg-[#2F5B58] rounded-lg px-6 py-5 mb-5 text-center">
            <h1 className="text-white font-black text-xl tracking-wide uppercase">
              Procès Verbal d&apos;Ouverture des Plis
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Analyse des candidatures et recevabilité des offres
            </p>
          </div>

          {/* Fiche procédure */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-teal-50 border border-teal-200 rounded-lg px-5 py-4 mb-4 text-sm">
            {[
              ['N° AFPA',          numAfpa],
              ['Référence',        refProc],
              ['Marché',           nomProc],
              ["Date d'ouverture", formatDate(dateOffre)],
              ['Acheteur',         acheteur],
              [''],
              ['MSA',              data.msa || '—'],
              ['Valideur technique', data.valideurTechnique || '—'],
              ['Demandeur',        data.demandeur || '—'],
            ].map(([label, value], i) =>
              label ? (
                <div key={i} className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-gray-500 font-semibold text-xs whitespace-nowrap flex-shrink-0">{label} :</span>
                  <span className="text-gray-900 text-xs truncate" title={value}>{value}</span>
                </div>
              ) : <div key={i} />
            )}
          </div>

          {/* Chiffres clés */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[
              { label: 'Sociétés',        val: data.groupedEntreprises.length },
              { label: 'Total offres',    val: nbTotal },
              { label: 'Électroniques',   val: nbElec },
              { label: 'Papier',          val: nbPap },
              { label: 'Candidats analysés', val: data.candidats.length },
            ].map(item => (
              <div key={item.label} className="text-center bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-1">
                <p className="text-xl font-black text-[#2F5B58]">{item.val}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* ════ §1 — LISTE DES CANDIDATURES REÇUES ════ */}
          <SectionHeader
            number="1"
            title="Liste des candidatures reçues"
            badge={`${data.groupedEntreprises.length} entreprise(s) · ${nbTotal} offre(s)`}
          />

          {data.groupedEntreprises.length > 0 ? (
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-8">N°</Th>
                  <Th>Entreprise</Th>
                  <Th>Contact</Th>
                  <Th>Lot(s)</Th>
                  <Th>Mode réception</Th>
                  <Th>Date réception</Th>
                  <Th>Observations</Th>
                </tr>
              </thead>
              <tbody>
                {data.groupedEntreprises.map((g, gi) =>
                  g.depots.map((d, di) => (
                    <tr key={`${gi}-${di}`} className={di % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <Td className="text-center font-semibold text-gray-400">
                        {di === 0 ? gi + 1 : ''}
                      </Td>
                      <Td className="font-semibold text-gray-900">
                        {di === 0 ? g.societe || '—' : ''}
                      </Td>
                      <Td>{di === 0 ? g.contact || '—' : ''}</Td>
                      <Td>
                        {d.lot ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium">
                            {d.lot}
                          </span>
                        ) : '—'}
                      </Td>
                      <Td>{d.modeReception || '—'}</Td>
                      <Td className="whitespace-nowrap">{formatDate(d.dateReception)}</Td>
                      <Td className="text-gray-500 italic">{d.observations || ''}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          ) : (
            <p className="text-gray-400 italic text-sm mb-4">Aucune candidature reçue.</p>
          )}

          {/* ════ §2 — ANALYSE DES CANDIDATURES ════ */}
          <SectionHeader
            number="2"
            title="Analyse des candidatures"
            badge={`${data.candidats.length} candidat(s)`}
          />

          {data.candidats.length > 0 ? (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="w-8">N°</Th>
                    <Th>Société</Th>
                    <Th>Lot(s)</Th>
                    <Th>Hors délai</Th>
                    <Th>Décision</Th>
                    <Th>Motif rejet</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.candidats.map((c, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <Td className="text-center font-semibold text-gray-400">{c.numero}</Td>
                      <Td className="font-semibold">{c.societe || '—'}</Td>
                      <Td>
                        {c.lot ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium">
                            {c.lot}
                          </span>
                        ) : '—'}
                      </Td>
                      <Td className="text-center">
                        {c.horsDelai === 'Oui'
                          ? <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold">Hors délai</span>
                          : <span className="text-gray-300">—</span>}
                      </Td>
                      <Td className="text-center"><DecisionBadge val={c.admisRejete} /></Td>
                      <Td className="text-gray-500 italic">{c.motifRejet || ''}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>

            </>
          ) : (
            <p className="text-gray-400 italic text-sm mb-4">Aucune donnée d&apos;analyse des candidatures enregistrée.</p>
          )}

          {/* ════ §3 — RECEVABILITÉ DES OFFRES ════ */}
          <SectionHeader
            number="3"
            title="Recevabilité des offres"
            badge={recv ? `${recv.candidats.length} candidat(s)` : undefined}
          />

          {recv && recv.candidats.length > 0 ? (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="w-8">N°</Th>
                    <Th>Société</Th>
                    <Th>Lot(s)</Th>
                    <Th className="text-center">Décision</Th>
                    <Th>Motif rejet / élimination</Th>
                    <Th>Observation</Th>
                  </tr>
                </thead>
                <tbody>
                  {recv.candidats.map((c, i) => {
                    const isElim = c.recevable === 'Éliminé' || c.recevable === 'Eliminé';
                    return (
                      <tr
                        key={i}
                        className={isElim ? 'bg-orange-50' : (i % 2 === 0 ? 'bg-white' : 'bg-gray-50')}
                      >
                        <Td className="text-center font-semibold text-gray-400">{i + 1}</Td>
                        <Td className="font-semibold">{c.societe || '—'}</Td>
                        <Td>
                          {c.lotRecevabilite ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium">
                              {c.lotRecevabilite}
                            </span>
                          ) : '—'}
                        </Td>
                        <Td className="text-center">
                          <DecisionBadge val={c.recevable} />
                        </Td>
                        <Td className="text-gray-600">{c.motifRejetRecevabilite || ''}</Td>
                        <Td className="text-gray-500 italic">{c.observation || ''}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableWrap>

              {/* Infructuosité */}
              {(recv.raisonInfructuosite || recv.lotsInfructueux.length > 0) && (
                <div className="border border-orange-300 bg-orange-50 rounded-lg p-4 mb-4">
                  <p className="text-orange-800 font-bold text-xs uppercase tracking-wide mb-2">
                    Déclaration d&apos;infructuosité
                  </p>
                  {recv.raisonInfructuosite && (
                    <p className="text-orange-900 text-sm mb-3 leading-relaxed">{recv.raisonInfructuosite}</p>
                  )}
                  {recv.lotsInfructueux.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {recv.lotsInfructueux.map((l, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 border border-orange-300 text-orange-800 rounded-full text-xs font-medium"
                        >
                          <span className="font-bold">{l.lot || '—'}</span>
                          <span className="text-orange-600">— {l.statut || 'Infructueux'}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 italic text-sm mb-4">Aucune donnée de recevabilité enregistrée.</p>
          )}

          {/* ════ §4 — SIGNATURES ════ */}
          <SectionHeader number="4" title="Signatures et visa" />

          <div className="grid grid-cols-3 gap-4 mt-2">
            {[
              { titre: 'Le Demandeur',           nom: data.demandeur },
              { titre: 'Le Valideur Technique',  nom: data.valideurTechnique },
              { titre: 'Le MSA',                 nom: data.msa },
            ].map((sig, i) => (
              <div
                key={i}
                className="border-2 border-[#2F5B58]/30 rounded-xl p-4 bg-gray-50 flex flex-col items-center text-center gap-1"
                style={{ minHeight: '110px' }}
              >
                <p className="text-[#2F5B58] font-bold text-xs uppercase tracking-wide">{sig.titre}</p>
                {sig.nom && <p className="text-gray-700 text-sm font-medium mt-1">{sig.nom}</p>}
                <div className="flex-1" />
                <div className="w-full border-t border-gray-300 mt-3 pt-1">
                  <span className="text-gray-300 italic text-xs">Signature</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pied de page document */}
          <div className="mt-8 pt-3 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400">
            <span>Procès Verbal d&apos;Ouverture des Plis — N° {numAfpa}</span>
            <span>Édité le {today}</span>
          </div>

        </div>
        {/* Fin page A4 */}
      </div>
      {/* Fin zone scrollable */}
    </div>
  );
}
