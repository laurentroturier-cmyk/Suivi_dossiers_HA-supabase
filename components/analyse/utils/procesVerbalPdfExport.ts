// ============================================
// Export Procès Verbal d'Ouverture des Plis — PDF
// Basé sur le pattern jsPDF du projet
// ============================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Palette couleurs ──────────────────────────────────────────────────────────
const TEAL      : [number, number, number] = [47, 91, 88];
const TEAL_LIGHT: [number, number, number] = [227, 242, 241];
const TEXT_DARK : [number, number, number] = [30, 40, 50];
const TEXT_GRAY : [number, number, number] = [100, 116, 139];
const ORANGE    : [number, number, number] = [194, 115, 20];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PVGroupeEntreprise {
  societe: string;
  contact: string;
  email: string;
  ville: string;
  cp: string;
  depots: Array<{
    lot: string;
    modeReception: string;
    dateReception: string;
    observations: string;
    [key: string]: any;
  }>;
}

export interface PVCandidat {
  numero: number;
  prenom: string;
  nom: string;
  societe: string;
  siret: string;
  lot: string;
  horsDelai: string;
  admisRejete: string;
  motifRejet: string;
  // DC1
  dc1Presentation: string;
  dc1Groupement: string;
  dc1NonInterdiction: string;
  dc1SousTraitance: string;
  dc1PourcentageSousTraite: string;
  // DC2
  dc2CAN1: string;
  dc2CAN2: string;
  dc2CAN3: string;
  dc2CapaciteTechnique: string;
  // Autres
  autresPouvoir: string;
  autresKbis: string;
  autresFiscale: string;
  autresURSSAF: string;
  autresRedressement: string;
  autresEffectifs: string;
  autresMissions: string;
  autresVisite: string;
  autresCertification: string;
  // Assurances
  assuranceRC: string;
  assuranceRCSinistre: string;
  assuranceDecennale: string;
  assuranceDecennaleChantier: string;
  // Offre
  offreActeEngagement: string;
  offreBPUDQE: string;
  offreQT: string;
  offreMemoireTech: string;
  offreRIB: string;
  [key: string]: any;
}

export interface PVRecevabilite {
  candidats: Array<{
    numero: number;
    societe: string;
    siret?: string;
    lotRecevabilite: string;
    recevable: string;
    motifRejetRecevabilite: string;
    observation?: string;
  }>;
  raisonInfructuosite: string;
  lotsInfructueux: Array<{ lot: string; statut: string }>;
}

export interface ProcessVerbalData {
  procedure: any;
  depotsData: {
    procedureInfo?: {
      auteur?: string;
      objet?: string;
      datePublication?: string;
      dateCandidature?: string;
      dateOffre?: string;
      reference?: string;
    };
    stats?: {
      totalEnveloppesElectroniques?: number;
      totalEnveloppesPapier?: number;
    };
    entreprises?: any[];
  } | null;
  groupedEntreprises: PVGroupeEntreprise[];
  candidats: PVCandidat[];
  recevabilite: PVRecevabilite | null;
  msa: string;
  valideurTechnique: string;
  demandeur: string;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

async function loadAfpaLogo(): Promise<string | null> {
  try {
    const response = await fetch('/Image1.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch { /* ignore */ }
  return dateStr;
}


// ─── Construction du document ─────────────────────────────────────────────────

async function buildPV(data: ProcessVerbalData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const margin = 15;
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let currentPage = 1;

  const logoData = await loadAfpaLogo();

  // ── Footer ──────────────────────────────────────────────────────────────────
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setPage(pageNum);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_GRAY);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    const numProc = data.procedure?.['Numéro de procédure (Afpa)'] || '';
    doc.text(`Procès Verbal d'Ouverture des Plis — N° ${numProc}`, margin, pageHeight - 7);
    doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // ── Saut de page ────────────────────────────────────────────────────────────
  const checkPageBreak = (needed = 15) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      y = margin;
    }
  };

  // ── En-tête de section ──────────────────────────────────────────────────────
  const addSectionHeader = (title: string, badge?: string) => {
    checkPageBreak(18);
    doc.setFillColor(...TEAL);
    doc.roundedRect(margin, y, contentWidth, 8.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 4, y + 5.8);
    if (badge) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(badge, pageWidth - margin - 4, y + 5.8, { align: 'right' });
    }
    y += 12;
    doc.setTextColor(0, 0, 0);
  };

  // ── autoTable ────────────────────────────────────────────────────────────────
  const addTable = (
    head: string[][],
    body: string[][],
    columnStyles?: any,
    headFill?: [number, number, number],
  ) => {
    autoTable(doc, {
      startY: y,
      head,
      body,
      columnStyles,
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        lineColor: [203, 213, 225],
        lineWidth: 0.25,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        fillColor: headFill ?? TEAL,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [247, 252, 251] },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
    });
    y = (doc as any).lastAutoTable.finalY + 5;
    currentPage = doc.getNumberOfPages();
  };

  // ── Bloc texte ────────────────────────────────────────────────────────────────
  const addTextBlock = (text: string, opts?: { size?: number; color?: [number, number, number]; indent?: number }) => {
    if (!text) return;
    const size   = opts?.size ?? 9;
    const color  = opts?.color ?? TEXT_DARK;
    const indent = opts?.indent ?? 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + indent, y);
      y += 4.5;
    });
    doc.setTextColor(0, 0, 0);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE DE GARDE
  // ═══════════════════════════════════════════════════════════════════════════

  // Logo
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', margin, y, 35, 12); } catch { /* ignore */ }
  }

  // Date en haut à droite
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...TEXT_GRAY);
  doc.text(`Édité le ${today}`, pageWidth - margin, y + 5, { align: 'right' });
  y += 20;

  // Titre principal
  doc.setFillColor(...TEAL);
  doc.rect(margin, y, contentWidth, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("PROCÈS VERBAL D'OUVERTURE DES PLIS", pageWidth / 2, y + 10, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Analyse des candidatures et recevabilité des offres', pageWidth / 2, y + 19, { align: 'center' });
  y += 30;

  // Fiche procédure (encadré)
  const proc = data.procedure;
  const numAfpa    = String(proc?.['Numéro de procédure (Afpa)'] || proc?.['NumProc'] || '—');
  const refProc    = String(proc?.['Référence procédure (plateforme)'] || '—');
  const nomProc    = String(proc?.['Nom de la procédure'] || '—');
  const acheteur   = String(proc?.['Acheteur'] || '—');
  const dateOffre  = data.depotsData?.procedureInfo?.dateOffre || '';

  doc.setFillColor(...TEAL_LIGHT);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'S');
  y += 6;

  const col2X = margin + contentWidth / 2 + 2;
  const labelW = 44;

  const kv = (label: string, value: string, x: number, yPos: number, maxW: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_GRAY);
    doc.text(label + ' :', x, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_DARK);
    const lines = doc.splitTextToSize(value, maxW);
    doc.text(lines[0] ?? '—', x + labelW, yPos);
  };

  const half = contentWidth / 2 - 4;
  kv('N° AFPA',         numAfpa,             margin,  y,     half - labelW);
  kv('Référence',       refProc,             col2X,   y,     half - labelW);
  y += 6;
  kv('Marché',          nomProc,             margin,  y,     half - labelW);
  kv('Date ouverture',  formatDate(dateOffre), col2X, y,     half - labelW);
  y += 6;
  kv('Acheteur',        acheteur,            margin,  y,     half - labelW);
  y += 6;
  kv('MSA',             data.msa || '—',     margin,  y,     half - labelW);
  kv('Valideur tech.',  data.valideurTechnique || '—', col2X, y, half - labelW);
  y += 6;
  kv('Demandeur',       data.demandeur || '—', margin, y,   half - labelW);
  y += 10;

  // Statistiques dépôts
  const nbTotal = data.depotsData?.entreprises?.length ?? 0;
  const nbElec  = data.depotsData?.stats?.totalEnveloppesElectroniques ?? 0;
  const nbPap   = data.depotsData?.stats?.totalEnveloppesPapier ?? 0;

  addTable(
    [['Sociétés candidates', 'Total offres reçues', 'Offres électroniques', 'Offres papier', 'Candidats analysés']],
    [[
      String(data.groupedEntreprises.length),
      String(nbTotal),
      String(nbElec),
      String(nbPap),
      String(data.candidats.length),
    ]],
    {
      0: { halign: 'center' as const },
      1: { halign: 'center' as const },
      2: { halign: 'center' as const },
      3: { halign: 'center' as const },
      4: { halign: 'center' as const },
    },
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — LISTE DES CANDIDATURES REÇUES (DÉPÔTS)
  // ═══════════════════════════════════════════════════════════════════════════

  const badge1 = `${data.groupedEntreprises.length} entreprise(s) · ${nbTotal} offre(s)`;
  addSectionHeader('1. LISTE DES CANDIDATURES REÇUES', badge1);

  if (data.groupedEntreprises.length > 0) {
    const rows: string[][] = [];
    let num = 1;
    data.groupedEntreprises.forEach(g => {
      g.depots.forEach((d, i) => {
        rows.push([
          i === 0 ? String(num++) : '',
          i === 0 ? (g.societe || '—') : '',
          i === 0 ? (g.contact || '—') : '',
          d.lot || '—',
          d.modeReception || '—',
          formatDate(d.dateReception),
          d.observations || '',
        ]);
      });
    });

    addTable(
      [['N°', 'Entreprise', 'Contact', 'Lot(s)', 'Mode réception', 'Date réception', 'Observations']],
      rows,
      {
        0: { cellWidth: 8,  halign: 'center' as const },
        1: { cellWidth: 42 },
        2: { cellWidth: 30 },
        3: { cellWidth: 22 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22 },
        6: { cellWidth: 'auto' },
      },
    );
  } else {
    addTextBlock('Aucune candidature reçue.', { color: TEXT_GRAY });
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — ANALYSE DES CANDIDATURES
  // ═══════════════════════════════════════════════════════════════════════════

  addSectionHeader('2. ANALYSE DES CANDIDATURES', `${data.candidats.length} candidat(s)`);

  if (data.candidats.length > 0) {

    addTable(
      [['N°', 'Société', 'Lot(s)', 'Hors délai', 'Décision', 'Motif rejet']],
      data.candidats.map(c => [
        String(c.numero),
        c.societe || '—',
        c.lot || '—',
        c.horsDelai === 'Oui' ? 'Oui' : '—',
        c.admisRejete || '—',
        c.motifRejet || '',
      ]),
      {
        0: { cellWidth: 8,  halign: 'center' as const },
        1: { cellWidth: 45 },
        2: { cellWidth: 28 },
        3: { cellWidth: 18, halign: 'center' as const },
        4: { cellWidth: 28 },
        5: { cellWidth: 'auto' },
      },
    );

  } else {
    addTextBlock('Aucune donnée d\'analyse des candidatures enregistrée.', { color: TEXT_GRAY });
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — RECEVABILITÉ DES OFFRES
  // ═══════════════════════════════════════════════════════════════════════════

  const recv = data.recevabilite;
  addSectionHeader('3. RECEVABILITÉ DES OFFRES', recv ? `${recv.candidats.length} candidat(s)` : '');

  if (recv && recv.candidats.length > 0) {

    // Tableau recevabilité
    const rowsRecv = recv.candidats.map((c, i) => [
      String(i + 1),
      c.societe || '—',
      c.lotRecevabilite || '—',
      c.recevable || '—',
      c.motifRejetRecevabilite || '',
      c.observation || '',
    ]);

    // Surligner les lignes "Éliminé" en orange clair
    autoTable(doc, {
      startY: y,
      head: [['N°', 'Société', 'Lot(s)', 'Décision', 'Motif rejet / élimination', 'Observation']],
      body: rowsRecv,
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' as const },
        1: { cellWidth: 45 },
        2: { cellWidth: 28 },
        3: { cellWidth: 22, halign: 'center' as const },
        4: { cellWidth: 40 },
        5: { cellWidth: 'auto' },
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        lineColor: [203, 213, 225],
        lineWidth: 0.25,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        fillColor: TEAL,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fillColor: [248, 252, 251] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      willDrawCell: (hookData) => {
        if (hookData.section === 'body') {
          const decision = rowsRecv[hookData.row.index]?.[3] ?? '';
          if (decision === 'Éliminé' || decision === 'Eliminé') {
            hookData.doc.setFillColor(255, 245, 235);
          }
        }
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
    });
    y = (doc as any).lastAutoTable.finalY + 6;
    currentPage = doc.getNumberOfPages();

    // Infructuosité
    if (recv.raisonInfructuosite || recv.lotsInfructueux.length > 0) {
      checkPageBreak(30);
      doc.setFillColor(255, 247, 230);
      doc.setDrawColor(...ORANGE);
      doc.setLineWidth(0.4);

      const infruHeight = 8
        + (recv.raisonInfructuosite ? Math.ceil(recv.raisonInfructuosite.length / 80) * 4.5 + 4 : 0)
        + recv.lotsInfructueux.length * 5 + 6;
      doc.roundedRect(margin, y, contentWidth, Math.max(infruHeight, 20), 1.5, 1.5, 'FD');

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...ORANGE);
      doc.text('Déclaration d\'infructuosité', margin + 4, y);
      y += 6;

      if (recv.raisonInfructuosite) {
        addTextBlock(recv.raisonInfructuosite, { size: 8.5, indent: 4 });
        y += 2;
      }

      if (recv.lotsInfructueux.length > 0) {
        recv.lotsInfructueux.forEach(l => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...TEXT_DARK);
          doc.text(`• ${l.lot || '—'} — ${l.statut || 'Infructueux'}`, margin + 6, y);
          y += 5;
        });
      }
      y += 6;
    }

  } else {
    addTextBlock('Aucune donnée de recevabilité enregistrée.', { color: TEXT_GRAY });
    y += 4;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — SIGNATURES
  // ═══════════════════════════════════════════════════════════════════════════

  checkPageBreak(55);
  addSectionHeader('4. SIGNATURES ET VISA');
  y += 4;

  const signataires = [
    { titre: 'Le Demandeur',          nom: data.demandeur },
    { titre: 'Le Valideur Technique', nom: data.valideurTechnique },
    { titre: 'Le MSA',                nom: data.msa },
  ];
  const sigW = (contentWidth - 10) / signataires.length;

  signataires.forEach((sig, i) => {
    const x = margin + i * (sigW + 5);
    doc.setFillColor(247, 250, 252);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, sigW, 38, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...TEAL);
    doc.text(sig.titre, x + sigW / 2, y + 7, { align: 'center' });

    if (sig.nom) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_DARK);
      doc.text(sig.nom, x + sigW / 2, y + 14, { align: 'center' });
    }

    // Ligne signature
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(x + 5, y + 30, x + sigW - 5, y + 30);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Signature', x + sigW / 2, y + 36, { align: 'center' });
  });

  y += 45;

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTERS sur toutes les pages
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    addFooter(p, totalPages);
  }

  return doc;
}

// ─── Export public ────────────────────────────────────────────────────────────

export async function exportProcessVerbalPdf(data: ProcessVerbalData): Promise<void> {
  const doc = await buildPV(data);
  const numProc = data.procedure?.['Numéro de procédure (Afpa)'] || 'PV';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`PV_Ouverture_Plis_${numProc}_${dateStr}.pdf`);
}
