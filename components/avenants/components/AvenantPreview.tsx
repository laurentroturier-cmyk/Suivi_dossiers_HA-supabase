// ============================================
// AvenantPreview — Visionneuse avant export PDF
// Pattern identique à ProcessVerbalPreview.tsx
// ============================================

import React from 'react';
import { X, FileDown, Loader2, FileText } from 'lucide-react';
import type { AvenantData } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime()))
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { /* ignore */ }
  return d;
}

function formatMontant(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' €HT';
}

// ─── Composants de mise en page ───────────────────────────────────────────────

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-0 mb-0 mt-5 first:mt-0 rounded-t-lg overflow-hidden">
      <div className="bg-[#2F5B58] text-white font-black text-sm px-3 py-2 flex-shrink-0">{number}</div>
      <div className="flex-1 bg-[#2F5B58] text-white font-bold text-xs px-3 py-2 uppercase tracking-wide">— {title}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-1 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-semibold text-gray-500 w-44 flex-shrink-0">{label}</span>
      <span className="text-[11px] text-gray-800 flex-1">{value || '—'}</span>
    </div>
  );
}

function InfoBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#e8f4f3] border border-[#a7d4d1] border-t-0 rounded-b-lg p-3 mb-5 ${className}`}>
      {children}
    </div>
  );
}

function SignatureBox({ title, name }: { title: string; name: string }) {
  return (
    <div className="flex-1 border border-[#2F5B58]/30 rounded-lg p-3 bg-gray-50 min-h-[80px] flex flex-col">
      <p className="text-[10px] font-bold text-[#2F5B58] uppercase mb-1">{title}</p>
      <p className="text-[11px] text-gray-700 font-medium">{name || '—'}</p>
      <div className="mt-auto pt-3 border-t border-gray-200 mt-3">
        <p className="text-[9px] text-gray-400">Signature</p>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AvenantPreviewProps {
  data: AvenantData;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function AvenantPreview({ data, onClose, onExport, isExporting }: AvenantPreviewProps) {
  const montantPrecedent = data.montant_precedent_ht ?? 0;
  const montantAvenant   = data.montant_avenant_ht ?? 0;
  const montantNouveau   = montantPrecedent + montantAvenant;
  const tauxTVA          = parseFloat((data.taux_tva || '20').replace('%', '').trim()) / 100;
  const montantTVA       = montantNouveau * tauxTVA; // eslint-disable-line @typescript-eslint/no-unused-vars
  const today            = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col" onClick={onClose}>
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
            <p className="font-bold text-sm">Aperçu — Avenant N° {data.numero_avenant ?? '—'}</p>
            <p className="text-white/60 text-xs">{data.demande || 'Avenant au marché'} · {data.contrat_reference}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
          >
            {isExporting
              ? <><Loader2 className="w-4 h-4 animate-spin" />Génération…</>
              : <><FileDown className="w-4 h-4" />Exporter PDF</>}
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

      {/* ── Zone scrollable ── */}
      <div className="flex-1 overflow-y-auto bg-slate-200 py-8 px-4" onClick={e => e.stopPropagation()}>
        {/* Page A4 simulée */}
        <div className="mx-auto bg-white shadow-2xl rounded-sm" style={{ maxWidth: 820, padding: '36px 40px' }}>

          {/* En-tête avec logos */}
          <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-[#2F5B58]">
            <img src="/logo-afpa.png" alt="AFPA" className="h-11 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 text-center px-4">
              <p className="text-[9px] font-bold text-[#1e3d3b] uppercase tracking-wide">Ministère de l'économie et des finances</p>
              <p className="text-[8px] text-[#2F5B58] mt-0.5">Direction des affaires juridiques — Marchés publics</p>
            </div>
            <img src="/logo-republique.png" alt="Marianne" className="h-11 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>

          {/* Titre principal */}
          <div className="flex rounded-lg overflow-hidden border border-[#2F5B58] mb-5">
            <div className="flex-1 bg-[#e8f4f3] px-6 py-3 flex flex-col items-center justify-center">
              <h1 className="text-[#1e3d3b] text-sm font-black uppercase tracking-widest">Marchés publics</h1>
              <p className="text-[#2F5B58] text-[10px] mt-0.5">Avenant au marché public</p>
            </div>
            <div className="bg-[#2F5B58] px-5 flex flex-col items-center justify-center min-w-[72px]">
              <span className="text-white text-base font-black">EXE10</span>
              <span className="text-white/60 text-[8px]">Avenant</span>
            </div>
          </div>

          {/* Numéro + référence */}
          <div className="text-center mb-6">
            <p className="text-base font-bold text-gray-800">Avenant N° {data.numero_avenant ?? '—'}</p>
            <p className="text-sm text-gray-500">{data.demande}</p>
          </div>

          {/* SECTION A */}
          <SectionHeader number="A" title="Identification du pouvoir adjudicateur" />
          <InfoBox>
            <InfoRow label="Organisme"          value="AFPA — Association nationale pour la formation professionnelle des adultes" />

            <InfoRow label="Demandeur"          value={data.demandeur} />
            <InfoRow label="Réf. demande"       value={data.demande} />
          </InfoBox>

          {/* SECTION B */}
          <SectionHeader number="B" title="Identification du marché" />
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
            <table className="min-w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  {['Référence marché', 'Date notification', 'Durée', 'Montant initial HT', 'Taux TVA'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-white bg-[#2F5B58] border border-[#234441]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#f7fcfb]">
                  <td className="px-3 py-2 border border-gray-200">{data.contrat_reference || '—'}</td>
                  <td className="px-3 py-2 border border-gray-200">{formatDate(data.date_notification)}</td>
                  <td className="px-3 py-2 border border-gray-200">{data.duree_marche || '—'}</td>
                  <td className="px-3 py-2 border border-gray-200">{formatMontant(data.montant_initial_ht)}</td>
                  <td className="px-3 py-2 border border-gray-200">{data.taux_tva || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION C */}
          <SectionHeader number="C" title="Objet de l'avenant" />

          <p className="text-[10px] font-semibold text-gray-500 mb-1">Description des modifications</p>
          <div
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-[11px] text-gray-700 min-h-[60px] prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0.5"
            dangerouslySetInnerHTML={{ __html: data.description_avenant || '<p>—</p>' }}
          />

          {/* SECTION D */}
          <SectionHeader number="D" title="Incidence financière" />
          <div className="bg-[#e8f4f3] border border-[#a7d4d1] border-t-0 rounded-b-lg p-3 mb-5">

            {/* Oui / Non */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-semibold text-gray-600">L'avenant a une incidence financière sur le montant du marché public :</span>
              <span className="text-[10px] text-gray-400 italic">(Cocher la case correspondante.)</span>
            </div>
            <div className="flex gap-6 mb-4 pl-2">
              {(['Non', 'Oui'] as const).map(opt => {
                const checked = opt === 'Oui' ? data.incidence_financiere : !data.incidence_financiere;
                return (
                  <div key={opt} className="flex items-center gap-1.5">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${checked ? 'bg-[#2F5B58] border-[#2F5B58]' : 'border-gray-400 bg-white'}`}>
                      {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-[10px] font-medium text-gray-700">{opt}</span>
                  </div>
                );
              })}
            </div>

            {data.incidence_financiere && (
              <>
                <p className="text-[10px] font-semibold text-gray-600 mb-2">Montant de l'avenant :</p>
                {/* Tableau avenant */}
                <div className="overflow-x-auto rounded-lg border border-[#a7d4d1] mb-3">
                  <table className="min-w-full border-collapse text-[10px]">
                    <thead>
                      <tr>
                        {['Taux de la TVA', 'Montant HT', 'Montant TTC', "% d'écart"].map(h => (
                          <th key={h} className="px-3 py-2 text-center font-bold text-white bg-[#2F5B58] border border-[#234441]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200 text-center">{data.taux_tva || '—'}</td>
                        <td className={`px-3 py-2 border border-gray-200 text-center font-semibold ${montantAvenant >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {montantAvenant >= 0 ? '+' : ''}{formatMontant(montantAvenant)}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-center">{formatMontant(montantAvenant * (1 + tauxTVA))}</td>
                        <td className={`px-3 py-2 border border-gray-200 text-center font-bold ${montantAvenant >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {montantPrecedent ? `${(montantAvenant / montantPrecedent * 100).toFixed(2)} %` : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tableau récap marché */}
                <div className="overflow-x-auto rounded-lg border border-[#a7d4d1]">
                  <table className="min-w-full border-collapse text-[10px]">
                    <thead>
                      <tr>
                        {['Montant précédent HT', 'Montant avenant HT', 'Nouveau montant HT', 'Nouveau montant TTC'].map(h => (
                          <th key={h} className="px-3 py-2 text-center font-bold text-white bg-[#2F5B58] border border-[#234441]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="px-3 py-2 border border-gray-200 text-center">{formatMontant(montantPrecedent)}</td>
                        <td className={`px-3 py-2 border border-gray-200 text-center font-semibold ${montantAvenant >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                          {montantAvenant >= 0 ? '+' : ''}{formatMontant(montantAvenant)}
                        </td>
                        <td className="px-3 py-2 border border-gray-200 text-center font-bold text-[#2F5B58]">{formatMontant(montantNouveau)}</td>
                        <td className="px-3 py-2 border border-gray-200 text-center font-bold text-[#1e3d3b]">{formatMontant(montantNouveau * (1 + tauxTVA))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {data.nouvelle_date_fin && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3 flex items-center gap-3">
                <span className="text-[10px] font-bold text-amber-800">Nouvelle date de fin :</span>
                <span className="text-[11px] font-bold text-amber-700">{formatDate(data.nouvelle_date_fin)}</span>
              </div>
            )}
          </div>{/* end section D */}

          {/* SECTION E — Titulaire */}
          {(data.titulaire_nom || data.titulaire_siret) && (
            <>
              <SectionHeader number="E" title="Identification du titulaire du marché public" />
              <InfoBox>
                <InfoRow label="Nom / Raison sociale" value={data.titulaire_nom || data.titulaire} />
                <InfoRow label="Numéro SIRET"         value={data.titulaire_siret} />
                <InfoRow label="Adresse"              value={data.titulaire_adresse} />
                <InfoRow label="E-mail"               value={data.titulaire_email} />
              </InfoBox>
            </>
          )}

          {/* SECTION G */}
          <SectionHeader number="G" title="Signatures" />

          <div className="flex gap-3 mb-4">
            <SignatureBox title="Rédigé par"         name={data.redige_par} />
            <SignatureBox title="Demandeur"           name={data.demandeur} />

          </div>

          <p className="text-[10px] font-semibold text-gray-500 mb-2">Signataire fournisseur</p>
          <InfoBox>
            <InfoRow label="Nom signataire"      value={data.frn_nom_signataire} />
            <InfoRow label="Fonction signataire" value={data.frn_fonction_signataire} />
          </InfoBox>
          <div className="flex gap-3">
            <SignatureBox title={data.titulaire || 'Titulaire'} name={data.frn_nom_signataire} />
          </div>

          {/* Pied de page doc */}
          <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-[9px] text-gray-300">
            <span>Avenant au marché — {data.demande}</span>
            <span>Généré le {today}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
