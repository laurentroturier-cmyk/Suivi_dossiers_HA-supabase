// ============================================
// AvenantPreview — Visionneuse avant export PDF
// Structure officielle EXE10
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

function formatMontant(val: number | null | undefined, suffix = '€'): string {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + suffix;
}

// ─── Composants de mise en page ───────────────────────────────────────────────
function SectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="flex items-center gap-0 mt-5 first:mt-0 rounded-t-lg overflow-hidden">
      <div className="bg-[#2F5B58] text-white font-black text-sm px-3 py-2 flex-shrink-0">{letter}</div>
      <div className="flex-1 bg-[#2F5B58] text-white font-bold text-[11px] px-3 py-2 uppercase tracking-wide">
        – {title}
      </div>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#e8f4f3] border border-[#a7d4d1] border-t-0 rounded-b-lg p-3 mb-1">
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 py-1 border-b border-[#a7d4d1]/40 last:border-0">
      <span className="text-[10px] font-semibold text-[#1e3d3b] w-44 flex-shrink-0">{label}</span>
      <span className="text-[10px] text-gray-800 flex-1">{value || '—'}</span>
    </div>
  );
}

function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] italic text-gray-500 mb-2 leading-relaxed">{children}</p>
  );
}

function SubLabel({ children, underline = true }: { children: React.ReactNode; underline?: boolean }) {
  return (
    <p className={`text-[10px] font-bold text-[#1e3d3b] mt-3 mb-1 ${underline ? 'underline' : ''}`}>
      {children}
    </p>
  );
}

function Bullet({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 ml-3 mb-0.5">
      <span className="text-[10px] text-[#1e3d3b]">•</span>
      <span className="text-[10px] text-[#1e3d3b]">{label} :</span>
      <span className="text-[10px] font-semibold text-gray-800">{value || '—'}</span>
    </div>
  );
}

function CheckBoxRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#2F5B58] border-[#2F5B58]' : 'border-gray-400 bg-white'}`}>
        {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className="text-[10px] font-medium text-gray-700">{label}</span>
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
  const montantInitial    = data.montant_initial_ht ?? 0;
  const montantPrecedent  = data.montant_precedent_ht ?? 0;
  const montantAvenant    = data.montant_avenant_ht ?? 0;
  const montantNouveau    = montantPrecedent + montantAvenant;
  const tauxTVA           = parseFloat((data.taux_tva || '20').replace('%', '').trim()) / 100;
  const montantInitialTTC = montantInitial * (1 + tauxTVA);
  const montantAvenantTTC = montantAvenant * (1 + tauxTVA);
  const montantNouveauTTC = montantNouveau * (1 + tauxTVA);
  const montantCumule     = montantNouveau - montantInitial;
  const pctEcart          = montantInitial ? (montantAvenant / montantInitial * 100) : null;
  const pctCumule         = montantInitial ? (montantCumule / montantInitial * 100) : null;
  const today             = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

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
            <p className="text-white/60 text-xs">{data.contrat_reference} · {data.demande || 'Avenant au marché'}</p>
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
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Zone scrollable ── */}
      <div className="flex-1 overflow-y-auto bg-slate-200 py-8 px-4" onClick={e => e.stopPropagation()}>
        <div className="mx-auto bg-white shadow-2xl rounded-sm" style={{ maxWidth: 820, padding: '36px 40px' }}>

          {/* ── En-tête avec logos ── */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#2F5B58]">
            <img src="/logo-afpa.png" alt="AFPA" className="h-11 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <div className="flex-1 text-center px-4">
              <p className="text-[9px] font-bold text-[#1e3d3b] uppercase tracking-wide">Ministère de l'économie et des finances</p>
              <p className="text-[8px] text-[#2F5B58] mt-0.5">Direction des Affaires Juridiques</p>
            </div>
            <img src="/logo-republique.png" alt="Marianne" className="h-11 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>

          {/* ── Bandeau titre ── */}
          <div className="rounded-lg overflow-hidden border border-[#2F5B58] mb-4">
            <div className="flex">
              <div className="flex-1 bg-[#e8f4f3] px-6 py-3 flex flex-col items-center justify-center">
                <h1 className="text-[#1e3d3b] text-sm font-black uppercase tracking-widest">Marchés publics</h1>
                <p className="text-[#2F5B58] text-[10px] mt-0.5">Avenant au marché public</p>
              </div>
              <div className="bg-[#2F5B58] px-5 flex flex-col items-center justify-center min-w-[72px]">
                <span className="text-white text-base font-black">EXE10</span>
                <span className="text-white/60 text-[8px]">Avenant</span>
              </div>
            </div>
            <div className="bg-[#f0faf9] border-t border-[#a7d4d1] py-2 text-center">
              <p className="text-[11px] font-bold text-[#1e3d3b]">
                AVENANT N° {data.numero_avenant ?? '…………………'} au marché {data.contrat_reference || '…………………………………………'}
              </p>
            </div>
          </div>

          {/* Intro */}
          <p className="text-[9px] italic text-gray-500 mb-5 leading-relaxed">
            Le formulaire EXE10 est un modèle d'avenant, qui peut être utilisé par le pouvoir adjudicateur
            ou l'entité adjudicatrice, dans le cadre de l'exécution d'un marché public.
          </p>

          {/* ─── A — Identification du pouvoir adjudicateur ─── */}
          <SectionHeader letter="A" title="Identification du pouvoir adjudicateur ou de l'entité adjudicatrice" />
          <InfoBox>
            <Instruction>(Reprendre le contenu de la mention figurant dans les documents constitutifs du marché public.)</Instruction>
            <div className="flex gap-2 py-1 border-b border-[#a7d4d1]/40">
              <span className="text-[10px] font-semibold text-[#1e3d3b] w-44 flex-shrink-0">Organisme</span>
              <span className="text-[10px] text-gray-800 flex-1">
                Afpa - Agence pour la formation professionnelle des adultes<br />
                3 rue Franklin — 93100 MONTREUIL
              </span>
            </div>
          </InfoBox>

          {/* ─── B — Identification du titulaire ─── */}
          <SectionHeader letter="B" title="Identification du titulaire du marché public" />
          <InfoBox>
            <Instruction>
              [Indiquer le nom commercial et la dénomination sociale du titulaire individuel ou de chaque membre
              du groupement titulaire, les adresses de son établissement et de son siège social, son adresse
              électronique, ses numéros de téléphone et son numéro SIRET.]
            </Instruction>
            <InfoRow label="Nom / Raison sociale" value={data.titulaire_nom || data.titulaire} />
            <InfoRow label="Numéro SIRET"         value={data.titulaire_siret} />
            <InfoRow label="Adresse"              value={data.titulaire_adresse} />
            <InfoRow label="E-mail"               value={data.titulaire_email} />
          </InfoBox>

          {/* ─── C — Objet du marché public ─── */}
          <SectionHeader letter="C" title="Objet du marché public" />
          <InfoBox>
            <SubLabel>Objet du marché public :</SubLabel>
            <p className="text-[10px] text-gray-800 mb-1">{data.contrat_libelle || '—'}</p>
            <Instruction>
              (Reprendre le contenu de la mention figurant dans les documents constitutifs du marché public.
              En cas d'allotissement, préciser également l'objet et la dénomination du lot concerné.)
            </Instruction>
            <div className="border-t border-[#a7d4d1]/50 my-2" />
            <InfoRow label="Date de la notification" value={formatDate(data.date_notification)} />
            <InfoRow
              label="Durée d'exécution"
              value={data.duree_marche ? `${data.duree_marche} mois` : '—'}
            />
            <div className="border-t border-[#a7d4d1]/50 my-2" />
            <SubLabel underline={false}>Montant initial du marché public :</SubLabel>
            <Bullet label="Taux de la TVA" value={data.taux_tva || '—'} />
            <Bullet label="Montant HT"     value={formatMontant(data.montant_initial_ht)} />
            <Bullet label="Montant TTC"    value={formatMontant(montantInitialTTC, '€ TTC')} />
          </InfoBox>

          {/* ─── D — Objet de l'avenant ─── */}
          <SectionHeader letter="D" title="Objet de l'avenant" />
          <InfoBox>
            <SubLabel>Modifications introduites par le présent avenant :</SubLabel>
            <Instruction>
              (Détailler toutes les modifications, avec ou sans incidence financière, introduites dans le marché
              public par le présent avenant. Préciser les articles du CCAP ou du CCTP modifiés ou complétés
              ainsi que l'incidence financière de chacune des modifications apportées.)
            </Instruction>
            <div
              className="bg-white border border-[#a7d4d1]/50 rounded p-2 mb-3 text-[10px] text-gray-700 min-h-[50px] prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0.5"
              dangerouslySetInnerHTML={{ __html: data.description_avenant || '<p>—</p>' }}
            />

            <div className="border-t border-[#a7d4d1]/50 my-3" />

            <SubLabel>Incidence financière de l'avenant :</SubLabel>
            <p className="text-[10px] text-gray-700 mb-1">
              L'avenant a une incidence financière sur le montant du marché public :
            </p>
            <p className="text-[9px] italic text-gray-500 mb-2">(Cocher la case correspondante.)</p>
            <div className="flex gap-8 mb-4 pl-2">
              <CheckBoxRow checked={!data.incidence_financiere} label="Non" />
              <CheckBoxRow checked={!!data.incidence_financiere} label="Oui" />
            </div>

            {data.incidence_financiere && (
              <>
                <SubLabel underline={false}>Montant de l'avenant :</SubLabel>
                <Bullet label="Taux de la TVA"                     value={data.taux_tva || '—'} />
                <Bullet label="Montant HT"                         value={`${montantAvenant >= 0 ? '+' : ''}${formatMontant(data.montant_avenant_ht)}`} />
                <Bullet label="Montant TTC"                        value={`${montantAvenant >= 0 ? '+' : ''}${formatMontant(montantAvenantTTC, '€ TTC')}`} />
                <Bullet
                  label="% d'écart introduit par l'avenant"
                  value={pctEcart !== null ? `${pctEcart >= 0 ? '+' : ''}${pctEcart.toFixed(2)} %` : '—'}
                />
                {pctCumule !== null && (
                  <Bullet
                    label="% d'écart cumulé (tous avenants)"
                    value={`${pctCumule >= 0 ? '+' : ''}${pctCumule.toFixed(2)} %`}
                  />
                )}

                <SubLabel underline={false}>Nouveau montant du marché public :</SubLabel>
                <Bullet label="Taux de la TVA" value={data.taux_tva || '—'} />
                <Bullet label="Montant HT"     value={formatMontant(montantNouveau)} />
                <Bullet label="Montant TTC"    value={formatMontant(montantNouveauTTC, '€ TTC')} />
              </>
            )}

            {data.nouvelle_date_fin && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-3 flex items-center gap-3">
                <span className="text-[10px] font-bold text-amber-800">Nouvelle date de fin :</span>
                <span className="text-[10px] font-bold text-amber-700">{formatDate(data.nouvelle_date_fin)}</span>
              </div>
            )}
          </InfoBox>

          {/* ─── E — Signature du titulaire ─── */}
          <SectionHeader letter="E" title="Signature du titulaire du marché public" />
          <div className="bg-[#e8f4f3] border border-[#a7d4d1] border-t-0 rounded-b-lg p-3 mb-1">
            <table className="w-full border-collapse text-[10px] border border-[#a7d4d1] rounded overflow-hidden">
              <thead>
                <tr className="bg-[#2F5B58] text-white">
                  <th className="px-3 py-2 text-left font-bold border-r border-[#5a9c98] w-2/5">
                    Nom, prénom et qualité<br />du signataire (*)
                  </th>
                  <th className="px-3 py-2 text-left font-bold border-r border-[#5a9c98] w-1/3">Lieu et date de signature</th>
                  <th className="px-3 py-2 text-left font-bold">Signature</th>
                </tr>
              </thead>
              <tbody>
                {/* Première ligne préremplie */}
                <tr className="border-t border-[#a7d4d1]/50 bg-white">
                  <td className="px-3 py-3 border-r border-[#a7d4d1]/50 text-gray-700">
                    {[data.frn_nom_signataire, data.frn_fonction_signataire].filter(Boolean).join(' — ') || '\u00A0'}
                  </td>
                  <td className="px-3 py-3 border-r border-[#a7d4d1]/50">&nbsp;</td>
                  <td className="px-3 py-3">&nbsp;</td>
                </tr>
                {/* 4 lignes vides */}
                {[...Array(4)].map((_, i) => (
                  <tr key={i} className="border-t border-[#a7d4d1]/50 bg-white">
                    <td className="px-3 py-4 border-r border-[#a7d4d1]/50">&nbsp;</td>
                    <td className="px-3 py-4 border-r border-[#a7d4d1]/50">&nbsp;</td>
                    <td className="px-3 py-4">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] italic text-gray-500 mt-2">
              (*) Le signataire doit avoir le pouvoir d'engager la personne qu'il représente.
            </p>
          </div>

          {/* ─── F — Signature du pouvoir adjudicateur ─── */}
          <SectionHeader letter="F" title="Signature du pouvoir adjudicateur ou de l'entité adjudicatrice" />
          <div className="bg-[#e8f4f3] border border-[#a7d4d1] border-t-0 rounded-b-lg p-3 mb-1">
            <p className="text-[10px] font-bold text-[#1e3d3b] mb-1">Pour l'Etat et ses établissements :</p>
            <Instruction>(Visa ou avis de l'autorité chargée du contrôle financier.)</Instruction>

            {/* Bloc signature officiel */}
            <div className="flex justify-end">
              <div className="w-1/2 flex flex-col items-center">
                <p className="text-[10px] text-gray-700 mb-6">A : ……………………………… le ………………</p>
                <p className="text-[10px] text-gray-700 mb-1">Signature</p>
                <p className="text-[9px] italic text-gray-500 text-center">
                  (représentant du pouvoir adjudicateur ou de l'entité adjudicatrice)
                </p>
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div className="mt-8 pt-3 border-t border-gray-100 flex justify-between text-[9px] text-gray-300">
            <span>EXE10 – Avenant</span>
            <span>({data.contrat_reference || "référence du marché public ou de l'accord-cadre"})</span>
            <span>Généré le {today}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
