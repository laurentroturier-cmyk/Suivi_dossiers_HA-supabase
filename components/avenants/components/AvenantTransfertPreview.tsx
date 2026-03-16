// ============================================
// AvenantTransfertPreview — Visionneuse HTML
// Avenant de transfert (art. R2194-6 2° CCP)
// ============================================

import React from 'react';
import { X, FileDown, Loader2, FileText } from 'lucide-react';
import type { AvenantTransfertData } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string | null | undefined): string {
  if (!d) return '……………………';
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime()))
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { /* ignore */ }
  return d;
}

// ─── Composants de mise en page (identiques à AvenantPreview) ────────────────
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2 py-1 border-b border-[#a7d4d1]/40 last:border-0">
      <span className="text-[10px] font-semibold text-[#1e3d3b] w-48 flex-shrink-0">{label}</span>
      <span className="text-[10px] text-gray-800 flex-1 whitespace-pre-line">{value || '—'}</span>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#1e3d3b] mt-3 mb-1 underline">{children}</p>
  );
}

function ArticleTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#1e3d3b] mt-3 mb-1">{children}</p>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-gray-800 leading-relaxed mb-2">{children}</p>
  );
}

function Divider() {
  return <hr className="border-[#a7d4d1]/60 my-2" />;
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface AvenantTransfertPreviewProps {
  data: AvenantTransfertData;
  onClose: () => void;
  onExport: () => void;
  isExporting: boolean;
}

export function AvenantTransfertPreview({ data, onClose, onExport, isExporting }: AvenantTransfertPreviewProps) {
  const nt = {
    denomination:   data.nouveau_titulaire_denomination || '…………………………………',
    formeJuridique: data.nouveau_titulaire_forme_juridique || '…………………………………',
    rcs:            data.nouveau_titulaire_rcs || '…………………………………',
    rcsVille:       data.nouveau_titulaire_rcs_ville || '…………………',
    adresse:        data.nouveau_titulaire_adresse || '…………………………………',
  };
  const at = {
    denomination:   data.ancien_titulaire_denomination || '…………………………………',
    formeJuridique: data.ancien_titulaire_forme_juridique || '…………………………………',
    rcs:            data.ancien_titulaire_rcs || '…………………………………',
    rcsVille:       data.ancien_titulaire_rcs_ville || '…………………',
    adresse:        data.ancien_titulaire_adresse || '…………………………………',
  };

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
            <p className="font-bold text-sm">
              Aperçu — Avenant de transfert N° {data.numero_avenant ?? '—'}
            </p>
            <p className="text-white/60 text-xs">
              {data.contrat_reference} · {at.denomination} → {nt.denomination}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F5B58] hover:bg-[#254845] disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileDown className="w-4 h-4" />
            }
            {isExporting ? 'Génération…' : 'Exporter PDF'}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Document ── */}
      <div
        className="flex-1 overflow-y-auto bg-slate-200 py-8 px-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto bg-white shadow-2xl rounded-sm text-[10px] text-gray-900" style={{ maxWidth: 820, padding: '36px 40px' }}>

          {/* En-tête */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-[#2F5B58]">
            <div className="text-[10px] font-bold text-[#2F5B58]">Afpa</div>
            <div className="text-center">
              <p className="text-[9px] font-bold text-[#1e3d3b] uppercase tracking-wide">
                MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES
              </p>
              <p className="text-[8px] text-[#2F5B58]">Direction des Affaires Juridiques</p>
            </div>
            <div className="text-[8px] text-gray-400 italic">Marianne</div>
          </div>

          {/* Bandeau titre */}
          <div className="border border-[#2F5B58] rounded-lg overflow-hidden mb-5">
            <div className="flex">
              <div className="flex-1 bg-[#e8f4f3] px-4 py-3 flex flex-col justify-center">
                <p className="text-[11px] font-bold text-[#1e3d3b] text-center uppercase tracking-wider">
                  MARCHÉS PUBLICS
                </p>
                <p className="text-[9px] text-[#2F5B58] text-center">
                  Avenant de transfert au marché public
                </p>
              </div>
              <div className="w-24 bg-[#2F5B58] flex flex-col items-center justify-center py-3 px-2">
                <span className="text-[9px] font-bold text-white text-center">TRANSFERT</span>
                <span className="text-[7px] text-[#d1ede8] text-center mt-1">Art. R2194-6 2° CCP</span>
              </div>
            </div>
            <div className="bg-[#f0faf9] border-t border-[#a7d4d1] px-4 py-2 text-center">
              <span className="text-[10px] font-bold text-[#1e3d3b]">
                AVENANT DE TRANSFERT N° {data.numero_avenant ?? '…………………'}{' '}
                au marché {data.contrat_reference || '…………………………………………'}
              </span>
            </div>
          </div>

          {/* ── A — Renseignements concernant le contrat ── */}
          <SectionHeader letter="A" title="Renseignements concernant le contrat" />
          <InfoBox>
            <InfoRow
              label="Personne publique contractante"
              value={"Afpa\nAgence nationale pour la Formation Professionnelle des Adultes"}
            />
            <InfoRow
              label={data.responsable_contrat_titre || "Personne responsable du contrat"}
              value={data.responsable_contrat_nom}
            />
            <InfoRow
              label="Conducteur de l'opération"
              value={"Direction Nationale des Achats\nAfpa - CITYSCOPE\n3 rue Franklin, 93100 MONTREUIL"}
            />

            <Divider />

            <p className="text-[9px] font-bold text-[#2F5B58] mt-2 mb-1">Nouveau Titulaire du Contrat</p>
            <InfoRow
              label="Désignation et adresse"
              value={`${nt.denomination}\n${nt.formeJuridique} immatriculée au RCS de ${nt.rcsVille} sous le numéro ${nt.rcs}\n${nt.adresse}`}
            />

            <Divider />

            <InfoRow label="Numéro de Contrat Modifié" value={data.contrat_reference} />
            <InfoRow label="Date de notification" value={formatDate(data.date_notification)} />
            <InfoRow
              label="Objet"
              value="Avenant de transfert en application de l'article R2194-6 2° du Code de la Commande Publique"
            />
          </InfoBox>

          {/* ── B — Objet de l'avenant ── */}
          <SectionHeader letter="B" title="Objet de l'avenant" />
          <InfoBox>
            <SubLabel>Préambule</SubLabel>
            <Para>
              La société {at.denomination} (ci-après « ancien titulaire »),{' '}
              {at.formeJuridique}, immatriculée au registre du commerce et des sociétés de{' '}
              {at.rcsVille} sous le numéro {at.rcs}, et ayant comme adresse {at.adresse},{' '}
              a été attributaire du marché n° {data.contrat_reference || '……………………………………'},
              par notification en date du {formatDate(data.date_notification)}.
            </Para>
            <Para>
              Par décision de l'actionnaire unique de l'ancien titulaire et de son groupe, il a
              été décidé de procéder à une {data.nature_operation || 'Fusion Absorption'} entre
              la société {nt.denomination} (société absorbante) et la
              société {at.denomination} (société absorbée), ayant des objets sociaux connexes.
            </Para>
            <Para>
              Conformément au Code de la Commande publique, à la jurisprudence en la matière, un
              accord préalable de l'Afpa a été réclamé et obtenu en date
              du {formatDate(data.date_accord_afpa)}.
            </Para>
            <Para>En conséquence de quoi il a été décidé ce qui suit :</Para>

            <Divider />

            <ArticleTitle>Article 1. Objet</ArticleTitle>
            <Para>
              Le présent avenant a pour objet d'acter, en application de l'article R.2194-6 2°
              du Code de la commande publique, la modification du titulaire du marché initial,
              et des capacités suffisantes du nouveau Titulaire se substituant à l'ancien telles
              que définies par l'Afpa dans la procédure de passation du marché initial.
            </Para>

            <ArticleTitle>Article 2. Modifications</ArticleTitle>
            <Para>
              À compter de la date de prise d'effet des présentes, la
              société {nt.denomination} sera purement et simplement substituée à la
              société {at.denomination} dans l'exécution du marché public initial, les autres
              termes et conditions dudit contrat demeurant inchangés.
            </Para>
            <Para>
              En conséquence, la société {nt.denomination} poursuivra jusqu'à son terme et dans
              son intégralité l'exécution du Marché Public visé en préambule des présentes, en
              lieu et place de l'ancien titulaire.
            </Para>
            <Para>
              Les pièces nécessaires justifiant des capacités du nouveau titulaire (Annexe A :
              DC2 et ses annexes, ainsi que tous les documents justifiant de
              la {data.nature_operation || 'fusion'}) sont jointes en annexe A du présent avenant.
            </Para>
            <Para>
              L'Afpa se libérera des sommes dues par elle au titre du marché public cité en
              préambule, au compte ouvert au nom de la société {nt.denomination}, sous la
              domiciliation bancaire annexée au présent avenant (Annexe B).
            </Para>

            <ArticleTitle>Article 3. Prise d'effet</ArticleTitle>
            <Para>
              Le présent avenant prend effet à compter du {formatDate(data.date_prise_effet)}{' '}
              jusqu'à la complète exécution de la prestation du marché cité en objet.
            </Para>

            <ArticleTitle>Article 4. Incidence financière de l'avenant</ArticleTitle>
            <Para>
              Les conditions techniques et financières du marché restant inchangées, le présent
              avenant n'emporte aucune incidence financière sur le marché.
            </Para>

            <ArticleTitle>Article 5. Conditions générales</ArticleTitle>
            <Para>
              Toutes les clauses et conditions du marché public initial cité en préambule non
              contraires aux présentes restent et demeurent avec leur plein et entier effet.
            </Para>
          </InfoBox>

          {/* ── C — Signatures ── */}
          <SectionHeader letter="C" title="Signatures de l'avenant" />
          <div className="bg-[#e8f4f3] border border-[#a7d4d1] border-t-0 rounded-b-lg overflow-hidden mb-1">
            <div className="flex">
              {/* Colonne gauche — Nouveau titulaire */}
              <div className="flex-1 p-4 border-r border-[#a7d4d1]/60">
                <p className="text-[10px] font-bold text-[#1e3d3b] mb-3">
                  Le Nouveau Titulaire, la société {nt.denomination}
                </p>
                <p className="text-[9px] text-gray-500 italic mb-6">
                  Signature, date et cachet de la Société
                </p>
                <p className="text-[9px] text-gray-700">
                  À ……………………………………… le ………………………
                </p>
              </div>
              {/* Colonne droite — Afpa */}
              <div className="flex-1 p-4">
                <p className="text-[10px] font-bold text-[#1e3d3b] mb-1">Pour l'Afpa, par délégation,</p>
                <p className="text-[10px] text-gray-800">
                  {data.signataire_afpa_nom || '………………………………'}
                </p>
                <p className="text-[9px] text-gray-500 italic mb-6">
                  {data.signataire_afpa_titre || '………………………………'}
                </p>
                <p className="text-[9px] text-gray-700">
                  À Montreuil, le ………………………………………….
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
