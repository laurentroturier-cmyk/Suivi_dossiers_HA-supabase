// ============================================
// Export Rapport de Présentation — PDF « Aperçu fidèle »
// Style identique au composant RapportPresentationPreview.tsx
// Couleur principale : #2F5B58 (teal)
// ============================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Palette ──────────────────────────────────────────────────────────────────
const TEAL      = [47, 91, 88]   as [number,number,number]; // #2F5B58
const TEAL_DRK  = [35, 68, 65]   as [number,number,number]; // #234441
const TEAL_LT   = [240, 249, 248] as [number,number,number]; // teal-50
const TEAL_BD   = [180, 220, 216] as [number,number,number]; // teal-200
const BODY      = [50, 65, 80]   as [number,number,number];
const GRAY_LT   = [248, 250, 252] as [number,number,number];
const GRAY_BD   = [203, 213, 225] as [number,number,number];
const ORANGE    = [200, 100, 0]  as [number,number,number];
const WHITE     = [255, 255, 255] as [number,number,number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadAfpaLogo(): Promise<string | null> {
  try {
    const response = await fetch('/Image1.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

function htmlToPlainParagraphs(html: string): Array<{ text: string; bullet: boolean }> {
  if (!html) return [];
  if (!html.includes('<')) {
    return html.split('\n').filter(t => t.trim()).map(t => ({ text: t.trim(), bullet: false }));
  }
  const items: Array<{ text: string; bullet: boolean }> = [];
  const parser = new DOMParser();
  const domDoc = parser.parseFromString(html, 'text/html');
  const walk = (node: Element, inList = false) => {
    const tag = node.tagName?.toLowerCase?.();
    switch (tag) {
      case 'p': { const t = node.textContent?.trim(); if (t) items.push({ text: t, bullet: inList }); break; }
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const t = node.textContent?.trim(); if (t) items.push({ text: t, bullet: false }); break;
      }
      case 'li': { const t = node.textContent?.trim(); if (t) items.push({ text: t, bullet: true }); break; }
      case 'ul': case 'ol': Array.from(node.children).forEach(c => walk(c as Element, true)); break;
      case 'blockquote': { const t = node.textContent?.trim(); if (t) items.push({ text: '» ' + t, bullet: false }); break; }
      default: Array.from(node.children ?? []).forEach(c => walk(c as Element, inList));
    }
  };
  Array.from(domDoc.body.children).forEach(c => walk(c as Element));
  return items.filter(p => p.text.trim());
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })
    .format(amount).replace(/\u202F/g, '\u00a0');
}

// ─── Builder principal ────────────────────────────────────────────────────────

async function buildRapportPdf(data: any): Promise<jsPDF> {
  const doc       = new jsPDF({ unit: 'mm', format: 'a4' });
  const W         = doc.internal.pageSize.getWidth();
  const H         = doc.internal.pageSize.getHeight();
  const ML        = 18;
  const CW        = W - ML * 2;
  const FOOTER_Y  = H - 12;
  let   y         = ML;
  let   pageNo    = 1;

  const tocEntries: Array<{ title: string; page: number }> = [];
  const logoData  = await loadAfpaLogo();
  const proc      = data?.procedureSelectionnee || {};
  const numAfpa   = data?.numeroProcedure || proc['Numéro de procédure (Afpa)'] || proc.NumProc || '';
  const nomProc   = proc['Nom de la procédure'] || '';
  const acheteur  = proc.Acheteur || '';

  // ── Footer ─────────────────────────────────────────────────────────
  const addFooter = (pg: number, total: number) => {
    doc.setPage(pg);
    doc.setDrawColor(...GRAY_BD);
    doc.setLineWidth(0.3);
    doc.line(ML, FOOTER_Y - 3, W - ML, FOOTER_Y - 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    if (numAfpa) doc.text(`N° ${numAfpa}`, ML, FOOTER_Y);
    doc.text(`${pg} / ${total}`, W - ML, FOOTER_Y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // ── Saut de page ────────────────────────────────────────────────────
  const brk = (needed = 20) => {
    if (y + needed > FOOTER_Y - 8) {
      doc.addPage();
      pageNo = doc.getNumberOfPages();
      y = ML;
    }
  };

  // ── Bloc de texte ───────────────────────────────────────────────────
  const addText = (
    text: string,
    opts: { size?: number; bold?: boolean; lh?: number; indent?: number; color?: [number,number,number] } = {}
  ) => {
    if (!text?.trim()) return;
    const size   = opts.size   ?? 10;
    const lh     = opts.lh    ?? 5;
    const indent = opts.indent ?? 0;
    const color  = opts.color  ?? BODY;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines: string[] = doc.splitTextToSize(text, CW - indent);
    const blockH = lines.length * lh;
    if (blockH <= H - ML - (H - FOOTER_Y) && y + blockH > FOOTER_Y - 8) {
      doc.addPage(); pageNo = doc.getNumberOfPages(); y = ML;
    }
    lines.forEach((l: string) => {
      if (y + lh > FOOTER_Y - 8) { doc.addPage(); pageNo = doc.getNumberOfPages(); y = ML; }
      doc.text(l, ML + indent, y);
      y += lh;
    });
    doc.setTextColor(0, 0, 0);
  };

  // ── HTML → texte ────────────────────────────────────────────────────
  const addHtml = (html: string) => {
    const paras = htmlToPlainParagraphs(html);
    paras.forEach(p => addText(p.bullet ? `• ${p.text}` : p.text, { size: 10, lh: 5, indent: p.bullet ? 5 : 0 }));
    y += 2;
  };

  // ── Bandeau de section (teal plein + badge numéro) ───────────────────
  const addSection = (num: string | number, title: string) => {
    brk(16);
    tocEntries.push({ title: `${num}. ${title}`, page: pageNo });
    const bh    = 11;          // hauteur du bandeau
    const tSize = 9.5;         // taille du titre (pt)
    const nSize = 9.5;         // taille du numéro = même que le titre
    const bRad  = 4.8;         // rayon du badge (mm) — assez grand pour « 10 »

    doc.setFillColor(...TEAL);
    doc.roundedRect(ML, y, CW, bh, 2, 2, 'F');

    // ── Badge (cercle sombre centré verticalement)
    const bx = ML + 5 + bRad;        // centre X du cercle
    const cy = y + bh / 2;           // centre Y du bandeau
    doc.setFillColor(...TEAL_DRK);
    doc.circle(bx, cy, bRad, 'F');

    // Numéro : centrage vertical — baseline = cy + 0.35×(nSize×0.353) ≈ cy+1.18
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(nSize);
    doc.setTextColor(...WHITE);
    doc.text(String(num), bx, cy + nSize * 0.353 * 0.35, { align: 'center' });

    // ── Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(tSize);
    doc.setTextColor(...WHITE);
    doc.text(title.toUpperCase(), bx + bRad + 3, y + (bh + tSize * 0.353) / 2 - 0.5);

    doc.setTextColor(0, 0, 0);
    y += bh + 4;
  };

  // ── Sous-titre (nom de lot, etc.) ────────────────────────────────────
  const addSubTitle = (text: string) => {
    brk(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEAL);
    doc.text(text, ML, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
  };

  // ── Tableau ─────────────────────────────────────────────────────────
  const addTable = (
    head: string[][],
    body: (string | number)[][],
    colStyles?: any,
    highlightFirst = false
  ) => {
    brk(30);
    autoTable(doc, {
      startY: y,
      head,
      body,
      columnStyles: colStyles,
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        lineColor: GRAY_BD,
        lineWidth: 0.25,
        textColor: BODY,
      },
      headStyles: {
        fillColor: TEAL,
        textColor: WHITE,
        fontStyle: 'bold',
        lineWidth: 0,
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: GRAY_LT },
      margin: { left: ML, right: ML },
      didParseCell: highlightFirst
        ? (data: any) => {
            if (data.section === 'body' && data.row.index === 0) {
              data.cell.styles.fillColor = [209, 250, 229];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        : undefined,
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    pageNo = doc.getNumberOfPages();
  };

  // ── Fiche info (fond teal clair encadré) ─────────────────────────────
  const addInfoBox = (rows: [string, string][]) => {
    const bh = rows.length * 6 + 6;
    brk(bh + 4);
    doc.setFillColor(...TEAL_LT);
    doc.setDrawColor(...TEAL_BD);
    doc.setLineWidth(0.4);
    doc.roundedRect(ML, y, CW, bh, 2, 2, 'FD');
    let iy = y + 5;
    rows.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(80, 100, 96);
      doc.text(`${label} :`, ML + 4, iy);
      const lblW = doc.getTextWidth(`${label} :`) + 3;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BODY);
      const ls: string[] = doc.splitTextToSize(val || '—', CW - lblW - 8);
      doc.text(ls[0] || '—', ML + 4 + lblW, iy);
      iy += 6;
    });
    y += bh + 4;
  };

  // ════════════════════════════════════════════════════════════════════
  // PAGE 1 — COUVERTURE
  // ════════════════════════════════════════════════════════════════════
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', ML, ML, 44, 13); } catch { /* silencieux */ }
  }
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(`Édité le ${today}`, W - ML, ML + 8, { align: 'right' });

  // Bannière titre (teal)
  const banY = 58;
  const banH = 28;
  doc.setFillColor(...TEAL);
  doc.roundedRect(ML, banY, CW, banH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...WHITE);
  doc.text('RAPPORT DE PRÉSENTATION', W / 2, banY + 11, { align: 'center' });
  if (nomProc) {
    const ls: string[] = doc.splitTextToSize(nomProc, CW - 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(200, 230, 225);
    ls.slice(0, 2).forEach((l: string, i: number) =>
      doc.text(l, W / 2, banY + 20 + i * 5, { align: 'center' })
    );
  }

  y = banY + banH + 12;
  addInfoBox([
    ['N° de procédure (Afpa)', numAfpa],
    ['Référence plateforme',   proc['Référence procédure (plateforme)'] || '—'],
    ['Nom de la procédure',    nomProc],
    ['Acheteur',               acheteur],
  ]);

  doc.setTextColor(0, 0, 0);

  // Position sur page 1 où sera dessiné le sommaire (après la fiche)
  const tocStartY = y + 2;

  // ════════════════════════════════════════════════════════════════════
  // PAGES CONTENU (commencent à la page 2)
  // ════════════════════════════════════════════════════════════════════
  doc.addPage();
  pageNo = doc.getNumberOfPages();
  y = ML;

  // §1 CONTEXTE
  addSection(1, 'Contexte');
  addHtml(data?.section1_contexte?.objetMarche || '');
  if (data?.section1_contexte?.dureeMarche)
    addText(`Pour une durée totale de ${data.section1_contexte.dureeMarche}.`, { size: 10, lh: 5 });
  y += 4;

  // §2 DÉROULEMENT
  addSection(2, 'Déroulement de la procédure');
  const s2 = data?.section2_deroulement || {};
  addText(
    `La procédure, menée conjointement avec ${s2.clientInterne || 'le client interne'} de l'Afpa, `
    + `a été lancée sur la plateforme « ${s2.supportProcedure || '—'} » selon le calendrier suivant :`,
    { size: 10, lh: 5 }
  );
  y += 2;
  [
    `Date de publication : ${s2.datePublication || '—'}`,
    `Nombre de dossiers retirés : ${s2.nombreRetraits ?? 0}`,
    `Date de réception des offres : ${s2.dateReceptionOffres || '—'}`,
    `Nombre de plis reçus : ${s2.nombrePlisRecus ?? 0}`,
    ...(s2.dateOuverturePlis ? [`Date d'ouverture des plis : ${s2.dateOuverturePlis}`] : []),
  ].forEach(item => addText(`• ${item}`, { size: 10, lh: 5, indent: 5 }));
  y += 4;

  // §3 DOSSIER DE CONSULTATION
  addSection(3, 'Dossier de consultation');
  if (data?.contenuChapitre3) addHtml(data.contenuChapitre3);
  else addText('[À compléter : Description du DCE et des documents fournis]', { size: 10, lh: 5, color: ORANGE });
  y += 4;

  // §4 QUESTIONS-RÉPONSES
  addSection(4, 'Questions — Réponses');
  if (data?.contenuChapitre4) addHtml(data.contenuChapitre4);
  else addText('[À compléter : Questions posées et réponses apportées]', { size: 10, lh: 5, color: ORANGE });
  y += 4;

  // §5 ANALYSE DES CANDIDATURES
  addSection(5, 'Analyse des candidatures');
  addText(
    "L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la "
    + "recevabilité des documents administratifs demandés dans chacune de nos procédures.",
    { size: 10, lh: 5 }
  );
  addText("L'analyse des candidatures est disponible en annexe.", { size: 10, lh: 5 });
  y += 4;

  // §6 MÉTHODOLOGIE
  addSection(6, "Méthodologie d'analyse des offres");
  const s6    = data?.section6_methodologie || {};
  const ptech = s6.ponderationTechnique ?? 30;
  const pfin  = s6.ponderationFinancier  ?? 70;
  addText("Critères d'attribution :", { size: 10, lh: 5, bold: true });
  addText(`• Critère technique : ${ptech}%`, { size: 10, lh: 5, indent: 5 });
  addText(`• Critère financier : ${pfin}%`,  { size: 10, lh: 5, indent: 5 });
  y += 3;
  addText('Méthode de notation :', { size: 10, lh: 5, bold: true });
  addText(`• Note technique sur ${ptech} points`, { size: 10, lh: 5, indent: 5 });
  addText(`• Note financière sur ${pfin} points`, { size: 10, lh: 5, indent: 5 });
  addText('• Note finale sur 100 points',         { size: 10, lh: 5, indent: 5 });
  y += 4;

  // §7 VALEUR DES OFFRES
  addSection(7, 'Analyse de la valeur des offres');
  addText("L'analyse économique et technique dans son détail est jointe au présent document en annexe.", { size: 10, lh: 5 });
  addText('Le classement final des offres est le suivant.', { size: 10, lh: 5 });
  y += 3;

  if (data?.section7_2_syntheseLots?.lots) {
    (data.section7_2_syntheseLots.lots as any[]).forEach((lot: any) => {
      addSubTitle(lot.nomLot || 'Lot');
      if (lot.tableau?.length > 0) {
        const head7: string[][] = [[
          'Raison sociale', 'Rang', 'Note /100',
          `Fin. /${lot.poidsFinancier ?? pfin}`,
          `Tech. /${lot.poidsTechnique ?? ptech}`,
          'Montant TTC',
        ]];
        const body7 = (lot.tableau as any[]).map((o: any) => [
          o.raisonSociale || '—',
          String(o.rangFinal ?? '—'),
          Number(o.noteFinaleSur100).toFixed(2),
          Number(o.noteFinanciere ?? o.noteFinanciereSur60 ?? 0).toFixed(2),
          Number(o.noteTechnique  ?? o.noteTechniqueSur40  ?? 0).toFixed(2),
          fmt(o.montantTTC || 0),
        ]);
        addTable(head7, body7, {}, true);
      }
    });
    const total7 = data.section7_2_syntheseLots.montantTotalTTC;
    if (total7) addText(`Montant global de l'attribution (tous lots) : ${fmt(total7)}`, { size: 10, lh: 5, bold: true });
  } else if (data?.section7_valeurOffres?.tableau) {
    const tab = data.section7_valeurOffres.tableau as any[];
    const head7: string[][] = [['Rang', 'Entreprise', `Tech. /${ptech}`, `Fin. /${pfin}`, 'Note /100', 'Montant TTC']];
    const body7 = tab.map((o: any) => [
      `#${o.rangFinal ?? '—'}`,
      o.raisonSociale || '—',
      Number(o.noteTechnique  ?? o.noteTechniqueSur40  ?? 0).toFixed(2),
      Number(o.noteFinanciere ?? o.noteFinanciereSur60 ?? 0).toFixed(2),
      Number(o.noteFinaleSur100).toFixed(2),
      fmt(o.montantTTC || 0),
    ]);
    addTable(head7, body7, {}, true);
    const estim = data.section7_valeurOffres.montantEstime;
    const attr  = data.section7_valeurOffres.montantAttributaire;
    if (estim > 0) addText(`Montant de l'estimation : ${fmt(estim)}`, { size: 10, lh: 5 });
    if (attr)      addText(`Montant de l'offre retenue : ${fmt(attr)}`, { size: 10, lh: 5 });
    if (estim > 0 && attr) {
      const e = attr - estim;
      const s = e >= 0 ? '+' : '';
      addText(`Écart par rapport à l'estimation : ${s}${fmt(e)} (${s}${((e / estim) * 100).toFixed(2)}%)`, { size: 10, lh: 5 });
    }
  }
  y += 4;

  // §8 PERFORMANCE
  addSection(8, 'Analyse de la performance du dossier');
  const s8     = data?.section8_performance;
  const refCal = s8?.referenceCalcul || 'par rapport à la moyenne des offres';

  if (s8?.tableauDetaille?.length > 0) {
    addText('Le tableau ci-dessous présente la performance achat détaillée pour chaque lot :', { size: 10, lh: 5 });
    y += 2;
    const head8: string[][] = [['Lot', 'Moy. HT', 'Moy. TTC', 'Retenue HT', 'Retenue TTC', 'Gains HT', 'Gains TTC', 'Gains %']];
    const body8 = (s8.tableauDetaille as any[]).map((l: any) => [
      l.nomLot || '—',
      fmt(l.moyenneHT || 0),
      fmt(l.moyenneTTC || 0),
      fmt(l.offreRetenueHT || 0),
      fmt(l.offreRetenueTTC || 0),
      fmt(l.gainsHT || 0),
      fmt(l.gainsTTC || 0),
      `${Number(l.gainsPourcent ?? 0).toFixed(1)}%`,
    ]);
    addTable(head8, body8);
    addText(`Performance achat globale (${refCal}) : ${Number(s8.performanceAchatPourcent).toFixed(1)}%`, { size: 10, lh: 5 });
    addText(`Impact budgétaire total estimé : ${fmt(s8.impactBudgetaireTTC)} TTC (soit ${fmt(s8.impactBudgetaireHT)} HT)`, { size: 10, lh: 5 });
  } else if (data?.section8_1_synthesePerformance) {
    const s8b = data.section8_1_synthesePerformance;
    addText(`Performance achat globale (${refCal}) : ${Number(s8b.performanceGlobalePourcent).toFixed(1)}%`, { size: 10, lh: 5 });
    addText(`Impact budgétaire total estimé : ${fmt(s8b.impactBudgetaireTotalTTC)} TTC (soit ${fmt(s8b.impactBudgetaireTotalHT)} HT)`, { size: 10, lh: 5 });
    if (s8b.lotsDetails?.length > 0) {
      y += 2;
      addText('Détail de la performance par lot :', { size: 10, lh: 5, bold: true });
      addTable([['Lot', 'Performance', 'Impact TTC']], (s8b.lotsDetails as any[]).map((l: any) => [
        l.nomLot || '—',
        `${Number(l.performancePourcent).toFixed(1)}%`,
        fmt(l.impactBudgetaireTTC || 0),
      ]));
    }
  } else if (s8) {
    addText(`Performance achat (${refCal}) : ${Number(s8.performanceAchatPourcent).toFixed(1)}%`, { size: 10, lh: 5 });
    addText(`Impact budgétaire estimé : ${fmt(s8.impactBudgetaireTTC)} TTC (soit ${fmt(s8.impactBudgetaireHT)} HT)`, { size: 10, lh: 5 });
  }
  y += 4;

  // §9 ATTRIBUTION
  addSection(9, "Proposition d'attribution");
  if (data?.section7_2_syntheseLots?.lots) {
    addText("Au regard de ces éléments, la commission d'ouverture souhaite attribuer les lots comme suit :", { size: 10, lh: 5 });
    y += 2;
    const head9: string[][] = [['Lot', 'Attributaire pressenti', 'Montant TTC']];
    const body9 = (data.section7_2_syntheseLots.lots as any[]).map((lot: any) => {
      const r1 = lot.tableau?.find((o: any) => o.rangFinal === 1) || lot.tableau?.[0];
      return [lot.nomLot || '—', r1?.raisonSociale || '—', r1 ? fmt(r1.montantTTC || 0) : '—'];
    });
    addTable(head9, body9);
    addText(`Montant total de l'attribution : ${fmt(data.section7_2_syntheseLots.montantTotalTTC)}`, { size: 10, lh: 5, bold: true });
  } else {
    addText(
      `Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à `
      + `${data?.section9_attribution?.attributairePressenti || '—'}.`,
      { size: 10, lh: 5 }
    );
  }
  y += 4;

  // §10 CALENDRIER
  addSection(10, 'Proposition de calendrier de mise en œuvre');
  const ch10 = data?.chapitre10 || {};
  if (ch10.validationAttribution)
    addText(`Validation de la proposition d'attribution du marché : ${ch10.validationAttribution}`, { size: 10, lh: 5 });
  if (ch10.envoiRejet)
    addText(`Envoi des lettres de rejet : ${ch10.envoiRejet}`, { size: 10, lh: 5 });
  if (ch10.attributionMarche)
    addText(`Attribution du marché : ${ch10.attributionMarche}`, { size: 10, lh: 5 });
  if (ch10.autresElements) {
    addText('Autres éléments du calendrier :', { size: 10, lh: 5, bold: true });
    addHtml(ch10.autresElements);
  }

  // SIGNATURE
  brk(35);
  y += 8;
  doc.setDrawColor(...GRAY_BD);
  doc.setLineWidth(0.3);
  doc.line(ML, y, W - ML, y);
  y += 8;
  addText(
    `Fait à Montreuil, le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    { size: 10, lh: 5 }
  );
  if (acheteur) addText(acheteur, { size: 10, lh: 5, bold: true });

  // ════════════════════════════════════════════════════════════════════
  // SOMMAIRE — dessiné sur la PAGE 1, après la fiche procédure
  // ════════════════════════════════════════════════════════════════════
  if (tocEntries.length > 0) {
    doc.setPage(1);
    let ty = tocStartY;

    // Bandeau « SOMMAIRE »
    doc.setFillColor(...TEAL);
    doc.roundedRect(ML, ty, CW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text('SOMMAIRE', W / 2, ty + 6.2, { align: 'center' });
    ty += 13;

    tocEntries.forEach(entry => {
      // Les pages de contenu commencent à la page 2 (pas de décalage à appliquer)
      const realPage = entry.page;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...TEAL);
      doc.text(entry.title, ML, ty);

      const tw = doc.getTextWidth(entry.title);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 180, 180);
      let dx = ML + tw + 2;
      const dend = W - ML - 14;
      while (dx < dend) { doc.text('.', dx, ty); dx += 2.0; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...TEAL);
      doc.text(String(realPage), W - ML, ty, { align: 'right' });
      ty += 8;
    });
    doc.setTextColor(0, 0, 0);
  }

  // ── Footers ─────────────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) addFooter(p, total);

  return doc;
}

// ─── API publique ─────────────────────────────────────────────────────────────

export async function generateRapportPresentationPdfBlob(data: any): Promise<Blob> {
  const doc = await buildRapportPdf(data);
  return doc.output('blob');
}

export async function exportRapportPresentationPdf(data: any, filename?: string): Promise<void> {
  const doc = await buildRapportPdf(data);
  const fname =
    filename ||
    `Rapport_Presentation_${data?.numeroProcedure || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname);
}
