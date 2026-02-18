// ============================================
// Export Rapport de Présentation vers PDF Professionnel
// Basé sur le pattern jsPDF du module CCAP
// ============================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================
// HELPERS INTERNES
// ============================================

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

/**
 * Convertit du HTML Tiptap en tableau de paragraphes texte brut
 */
function htmlToPlainText(html: string): string[] {
  if (!html) return [];
  if (!html.includes('<')) {
    return html.split('\n').filter(p => p.trim());
  }

  const paragraphs: string[] = [];
  const parser = new DOMParser();
  const domDoc = parser.parseFromString(html, 'text/html');

  const processNode = (node: Element, indent: string = '') => {
    const tag = node.tagName.toLowerCase();
    switch (tag) {
      case 'p': {
        const text = node.textContent?.trim();
        if (text) paragraphs.push(indent + text);
        break;
      }
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const heading = node.textContent?.trim();
        if (heading) paragraphs.push(indent + heading);
        break;
      }
      case 'ul': case 'ol': {
        let counter = 1;
        Array.from(node.children).forEach((li) => {
          if (li.tagName.toLowerCase() !== 'li') return;
          const liText = li.textContent?.trim();
          if (liText) {
            const bullet = tag === 'ul' ? '• ' : `${counter}. `;
            paragraphs.push(indent + bullet + liText);
            counter++;
          }
        });
        break;
      }
      case 'blockquote': {
        const quote = node.textContent?.trim();
        if (quote) paragraphs.push(indent + '» ' + quote);
        break;
      }
      case 'li':
        break; // géré par ul/ol
      default:
        Array.from(node.children).forEach(child => processNode(child as Element, indent));
    }
  };

  Array.from(domDoc.body.children).forEach(child => processNode(child as Element));
  return paragraphs.filter(p => p.trim());
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount).replace(/\u202F/g, ' ');
}

// ============================================
// CONSTRUCTION DU DOCUMENT PDF
// ============================================

async function buildRapportPdf(data: any): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;
  let currentPage = 1;

  const tocEntries: Array<{ title: string; page: number }> = [];
  const logoData = await loadAfpaLogo();
  const acheteur = data?.procedureSelectionnee?.Acheteur || '';

  // ---- HELPER : footer ----
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setPage(pageNum);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    const numProc = data?.numeroProcedure;
    if (numProc) {
      doc.text(`N° ${numProc}`, margin, pageHeight - 10);
    } else {
      doc.text('Rapport de Présentation', margin, pageHeight - 10);
    }

    doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  // ---- HELPER : vérifier saut de page ----
  const checkPageBreak = (neededSpace: number = 20) => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      y = margin;
    }
  };

  // ---- HELPER : bloc texte (sans coupure de paragraphe entre pages) ----
  const addTextBlock = (
    text: string,
    options?: {
      size?: number;
      bold?: boolean;
      spacing?: number;
      leftMargin?: number;
      color?: [number, number, number];
    }
  ) => {
    if (!text) return;
    const size = options?.size ?? 10;
    const bold = options?.bold ?? false;
    const spacing = options?.spacing ?? 5;
    const leftMargin = options?.leftMargin ?? 0;
    const color = options?.color ?? [50, 65, 85];

    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const actualLeft = margin + leftMargin;
    const lines = doc.splitTextToSize(text, contentWidth - leftMargin);
    const totalHeight = lines.length * spacing;
    const maxPageContentHeight = pageHeight - 25 - margin; // hauteur utile d'une page

    // Si le paragraphe entier tient sur une page mais ne tient pas sur la page
    // courante → sauter à la page suivante pour éviter la coupure
    if (totalHeight <= maxPageContentHeight && y + totalHeight > pageHeight - 25) {
      doc.addPage();
      currentPage = doc.getNumberOfPages();
      y = margin;
    }

    // Rendu ligne par ligne (avec fallback si le paragraphe est trop long pour une seule page)
    lines.forEach((line: string) => {
      if (y + spacing > pageHeight - 25) {
        doc.addPage();
        currentPage = doc.getNumberOfPages();
        y = margin;
      }
      doc.text(line, actualLeft, y);
      y += spacing;
    });

    doc.setTextColor(0, 0, 0);
  };

  // ---- HELPER : en-tête de chapitre ----
  const addChapterHeader = (title: string) => {
    checkPageBreak(20);
    tocEntries.push({ title, page: currentPage });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text(title, margin, y);
    y += 6;

    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setTextColor(0, 0, 0);
  };

  // ---- HELPER : sous-titre (keep-with-next : réserve de l'espace pour les items suivants) ----
  const addSubTitle = (text: string, keepWithNextMm: number = 35) => {
    // Réserver sous-titre (6mm) + au moins N mm pour les items qui suivent
    checkPageBreak(6 + keepWithNextMm);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129); // #10B981
    doc.text(text, margin, y);
    y += 6;
    doc.setTextColor(0, 0, 0);
  };

  // ---- HELPER : rendu contenu HTML ----
  const addHtmlContent = (html: string, leftMargin: number = 0) => {
    if (!html) return;
    const paragraphs = htmlToPlainText(html);
    paragraphs.forEach(para => {
      addTextBlock(para, { size: 10, spacing: 5, leftMargin });
    });
    y += 2;
  };

  // ---- HELPER : autoTable avec sync de currentPage ----
  const addTable = (head: string[][], body: (string | number)[][], columnStyles?: any) => {
    autoTable(doc, {
      startY: y,
      head,
      body,
      columnStyles,
      styles: { fontSize: 8, cellPadding: 2, lineColor: [203, 213, 225], lineWidth: 0.3 },
      headStyles: {
        fillColor: [240, 245, 255],
        textColor: [0, 102, 204],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 102, 204],
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 5;
    currentPage = doc.getNumberOfPages();
  };

  // ============================================
  // PAGE 1 : COUVERTURE
  // ============================================

  if (logoData) {
    try { doc.addImage(logoData, 'PNG', margin, margin, 50, 15); } catch { /* logo non dispo */ }
  }

  y = 60;

  // Titre principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 102, 204);
  doc.splitTextToSize('RAPPORT DE PRÉSENTATION', contentWidth).forEach((line: string) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 12;
  });

  y += 4;
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(1);
  doc.line(margin + 30, y, pageWidth - margin - 30, y);
  y += 12;

  // Nom de la procédure
  const nomProcedure = data?.procedureSelectionnee?.['Nom de la procédure'] || '';
  if (nomProcedure) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(50, 65, 85);
    doc.splitTextToSize(nomProcedure, contentWidth - 20).forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 8;
    });
  }

  y += 8;

  if (data?.numeroProcedure) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Procédure n° ${data.numeroProcedure}`, pageWidth / 2, y, { align: 'center' });
    y += 8;
  }

  if (acheteur) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(acheteur, pageWidth / 2, y, { align: 'center' });
    y += 8;
  }

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    pageWidth / 2, y, { align: 'center' }
  );

  doc.setTextColor(0, 0, 0);

  // ============================================
  // PAGES CONTENU
  // ============================================

  doc.addPage();
  currentPage = doc.getNumberOfPages(); // = 2
  y = margin;

  // ─── CH.1 CONTEXTE ───
  addChapterHeader('1. CONTEXTE');
  addHtmlContent(data?.section1_contexte?.objetMarche || '');
  if (data?.section1_contexte?.dureeMarche) {
    addTextBlock(`Pour une durée totale de ${data.section1_contexte.dureeMarche}.`, { size: 10, spacing: 5 });
  }
  y += 5;

  // ─── CH.2 DÉROULEMENT ───
  addChapterHeader('2. DÉROULEMENT DE LA PROCÉDURE');
  const s2 = data?.section2_deroulement || {};
  addTextBlock(
    `La procédure, menée conjointement avec ${s2.clientInterne || 'le client interne'} de l'Afpa, ` +
    `a été lancée sur la plateforme « ${s2.supportProcedure || '—'} » selon le calendrier suivant :`,
    { size: 10, spacing: 5 }
  );
  y += 2;
  [
    `Date de publication : ${s2.datePublication || '—'}`,
    `Nombre de dossiers retirés : ${s2.nombreRetraits ?? 0}`,
    `Date de réception des offres : ${s2.dateReceptionOffres || '—'}`,
    `Nombre de plis reçus : ${s2.nombrePlisRecus ?? 0}`,
    `Date d'ouverture des plis : ${s2.dateOuverturePlis || '—'}`,
  ].forEach(item => addTextBlock(`• ${item}`, { size: 10, spacing: 5, leftMargin: 5 }));
  y += 5;

  // ─── CH.3 DOSSIER DE CONSULTATION ───
  addChapterHeader('3. DOSSIER DE CONSULTATION');
  if (data?.contenuChapitre3) {
    addTextBlock('Le dossier de consultation comprenait :', { size: 10, spacing: 5 });
    addHtmlContent(data.contenuChapitre3);
  } else {
    addTextBlock('[À compléter : Description du DCE et des documents fournis]', { size: 10, spacing: 5, color: [200, 100, 0] });
  }
  y += 5;

  // ─── CH.4 QUESTIONS-RÉPONSES ───
  addChapterHeader('4. QUESTIONS - RÉPONSES');
  if (data?.contenuChapitre4) {
    addHtmlContent(data.contenuChapitre4);
  } else {
    addTextBlock('[À compléter : Questions posées et réponses apportées]', { size: 10, spacing: 5, color: [200, 100, 0] });
  }
  y += 5;

  // ─── CH.5 ANALYSE DES CANDIDATURES ───
  addChapterHeader('5. ANALYSE DES CANDIDATURES');
  const texteAnalyse = data?.section5_proposition?.texteAnalyse;
  if (texteAnalyse) {
    addHtmlContent(texteAnalyse);
  } else {
    addTextBlock(
      "L'analyse des capacités juridiques, techniques et financières a été réalisée à partir de la " +
      "recevabilité des documents administratifs demandés dans chacune de nos procédures.",
      { size: 10, spacing: 5 }
    );
    addTextBlock("L'analyse des candidatures est disponible en annexe.", { size: 10, spacing: 5 });
  }
  y += 5;

  // ─── CH.6 MÉTHODOLOGIE ───
  addChapterHeader("6. MÉTHODOLOGIE D'ANALYSE DES OFFRES");
  const s6 = data?.section6_methodologie || {};
  const poidsFinancier = s6.ponderationFinancier ?? 70;
  const poidsTechnique = s6.ponderationTechnique ?? 30;
  addSubTitle("Critères d'attribution :");
  addTextBlock(`• Critère technique : ${poidsTechnique}%`, { size: 10, spacing: 5, leftMargin: 5 });
  addTextBlock(`• Critère financier : ${poidsFinancier}%`, { size: 10, spacing: 5, leftMargin: 5 });
  y += 3;
  addSubTitle('Méthode de notation :');
  addTextBlock(`• Note technique sur ${poidsTechnique} points`, { size: 10, spacing: 5, leftMargin: 5 });
  addTextBlock(`• Note financière sur ${poidsFinancier} points`, { size: 10, spacing: 5, leftMargin: 5 });
  addTextBlock('• Note finale sur 100 points', { size: 10, spacing: 5, leftMargin: 5 });
  y += 5;

  // ─── CH.7 VALEUR DES OFFRES ───
  addChapterHeader('7. ANALYSE DE LA VALEUR DES OFFRES');
  addTextBlock(
    "L'analyse économique et technique dans son détail est jointe au présent document en annexe.",
    { size: 10, spacing: 5 }
  );
  addTextBlock('Le classement final des offres est le suivant.', { size: 10, spacing: 5 });
  y += 3;

  if (data?.section7_2_syntheseLots?.lots) {
    // Multi-lots
    (data.section7_2_syntheseLots.lots as any[]).forEach((lot: any) => {
      addSubTitle(lot.nomLot || 'Lot');
      if (lot.tableau?.length > 0) {
        const head7 = [[
          'Raison sociale', 'Rang', 'Note /100',
          `Note Fin. /${lot.poidsFinancier ?? 70}`,
          `Note Tech. /${lot.poidsTechnique ?? 30}`,
          'Montant TTC'
        ]];
        const body7 = (lot.tableau as any[]).map((o: any) => [
          o.raisonSociale || '—',
          o.rangFinal ?? '—',
          o.noteFinaleSur100?.toFixed(2) || '—',
          (o.noteFinanciere ?? o.noteFinanciereSur60)?.toFixed(2) || '—',
          (o.noteTechnique ?? o.noteTechniqueSur40)?.toFixed(2) || '—',
          formatCurrency(o.montantTTC || 0),
        ]);
        addTable(head7, body7);
      }
    });

    const montantTotal = data.section7_2_syntheseLots.montantTotalTTC;
    if (montantTotal) {
      addTextBlock(`Montant global de l'attribution (tous lots) : ${formatCurrency(montantTotal)}`, { size: 10, spacing: 5, bold: true });
    }
  } else if (data?.section7_valeurOffres?.tableau) {
    const tableau = data.section7_valeurOffres.tableau as any[];
    const head7 = [['Rang', 'Raison sociale', 'Note Tech.', 'Note Fin.', 'Note /100', 'Montant TTC']];
    const body7 = tableau.map((o: any) => [
      o.rangFinal ?? '—',
      o.raisonSociale || '—',
      (o.noteTechnique ?? o.noteTechniqueSur40)?.toFixed(2) || '—',
      (o.noteFinanciere ?? o.noteFinanciereSur60)?.toFixed(2) || '—',
      o.noteFinaleSur100?.toFixed(2) || '—',
      formatCurrency(o.montantTTC || 0),
    ]);
    addTable(head7, body7);

    const montantEstime = data.section7_valeurOffres.montantEstime;
    const montantAttr = data.section7_valeurOffres.montantAttributaire;
    if (montantEstime > 0) {
      addTextBlock(`Montant de l'estimation : ${formatCurrency(montantEstime)}`, { size: 10, spacing: 5 });
    }
    if (montantAttr) {
      addTextBlock(`Montant de l'offre retenue : ${formatCurrency(montantAttr)}`, { size: 10, spacing: 5 });
      if (montantEstime > 0) {
        const ecart = montantAttr - montantEstime;
        const signe = ecart >= 0 ? '+' : '';
        addTextBlock(
          `Écart par rapport à l'estimation : ${signe}${formatCurrency(ecart)} (${signe}${((ecart / montantEstime) * 100).toFixed(2)}%)`,
          { size: 10, spacing: 5 }
        );
      }
    }
  }
  y += 5;

  // ─── CH.8 PERFORMANCE ───
  addChapterHeader('8. ANALYSE DE LA PERFORMANCE DU DOSSIER');
  const s8 = data?.section8_performance;
  const refCalc = s8?.referenceCalcul || 'par rapport à la moyenne des offres';

  if (s8?.tableauDetaille?.length > 0) {
    addTextBlock('Le tableau ci-dessous présente la performance achat détaillée pour chaque lot :', { size: 10, spacing: 5 });
    y += 2;
    const head8 = [['Lot', 'Moy. HT', 'Moy. TTC', 'Retenue HT', 'Retenue TTC', 'Gains HT', 'Gains TTC', 'Gains %']];
    const body8 = (s8.tableauDetaille as any[]).map((l: any) => [
      l.nomLot || '—',
      formatCurrency(l.moyenneHT || 0),
      formatCurrency(l.moyenneTTC || 0),
      formatCurrency(l.offreRetenueHT || 0),
      formatCurrency(l.offreRetenueTTC || 0),
      formatCurrency(l.gainsHT || 0),
      formatCurrency(l.gainsTTC || 0),
      `${l.gainsPourcent?.toFixed(1) || 0}%`,
    ]);
    addTable(head8, body8);
    addTextBlock(
      `Au global, la performance achat tous lots confondus (${refCalc}) est de ${s8.performanceAchatPourcent.toFixed(1)}%.`,
      { size: 10, spacing: 5 }
    );
    addTextBlock(
      `L'impact budgétaire total estimé est de ${formatCurrency(s8.impactBudgetaireTTC)} TTC (soit ${formatCurrency(s8.impactBudgetaireHT)} HT).`,
      { size: 10, spacing: 5 }
    );
  } else if (s8) {
    addTextBlock(
      `Au global, la performance achat (${refCalc}) est de ${s8.performanceAchatPourcent.toFixed(1)}%.`,
      { size: 10, spacing: 5 }
    );
    addTextBlock(
      `L'impact budgétaire estimé est de ${formatCurrency(s8.impactBudgetaireTTC)} TTC (soit ${formatCurrency(s8.impactBudgetaireHT)} HT).`,
      { size: 10, spacing: 5 }
    );
  }
  y += 5;

  // ─── CH.9 ATTRIBUTION ───
  addChapterHeader("9. PROPOSITION D'ATTRIBUTION");

  if (data?.section7_2_syntheseLots?.lots) {
    addTextBlock(
      "Au regard de ces éléments, la commission d'ouverture souhaite attribuer les lots comme suit :",
      { size: 10, spacing: 5 }
    );
    y += 2;
    const head9 = [['Lot', 'Nom du lot', 'Attributaire pressenti', 'Montant TTC']];
    const body9 = (data.section7_2_syntheseLots.lots as any[]).map((lot: any, idx: number) => {
      const attr = lot.tableau?.find((o: any) => o.rangFinal === 1) || lot.tableau?.[0];
      return [
        idx + 1,
        lot.nomLot || '—',
        attr?.raisonSociale || '—',
        attr ? formatCurrency(attr.montantTTC || 0) : '—',
      ];
    });
    addTable(head9, body9, { 0: { cellWidth: 12 }, 1: { cellWidth: 55 } });
    addTextBlock(
      `Montant total de l'attribution : ${formatCurrency(data.section7_2_syntheseLots.montantTotalTTC)}`,
      { size: 10, spacing: 5, bold: true }
    );
  } else {
    const attrib = data?.section9_attribution?.attributairePressenti || '—';
    addTextBlock(
      `Au regard de ces éléments, la commission d'ouverture souhaite attribuer le marché à ${attrib}.`,
      { size: 10, spacing: 5 }
    );
  }
  y += 5;

  // ─── CH.10 CALENDRIER ───
  addChapterHeader('10. PROPOSITION DE CALENDRIER DE MISE EN ŒUVRE');
  const ch10 = data?.chapitre10;
  if (ch10) {
    if (ch10.validationAttribution) {
      addTextBlock(`Validation de la proposition d'attribution du marché : ${ch10.validationAttribution}`, { size: 10, spacing: 5 });
    }
    if (ch10.envoiRejet) {
      addTextBlock(`Envoi des lettres de rejet : ${ch10.envoiRejet}`, { size: 10, spacing: 5 });
    }
    if (ch10.attributionMarche) {
      addTextBlock(`Attribution du marché : ${ch10.attributionMarche}`, { size: 10, spacing: 5 });
    }
    if (ch10.autresElements) {
      addTextBlock('Autres éléments du calendrier :', { size: 10, spacing: 5, bold: true });
      addHtmlContent(ch10.autresElements);
    }
  }

  // ─── SIGNATURE ───
  // Vérifier AVANT d'ajouter le gap : espace nécessaire = gap(10) + ligne(2) + 2 blocs texte(~15) = ~30mm
  checkPageBreak(40);
  y += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  addTextBlock(
    `Fait à Montreuil, le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    { size: 10, spacing: 6 }
  );
  if (acheteur) {
    addTextBlock(acheteur, { size: 10, spacing: 5, bold: true });
  }

  // ============================================
  // INSERTION DU SOMMAIRE EN PAGE 2
  // ============================================

  if (tocEntries.length > 0) {
    // Insérer une page après la couverture (page 1)
    doc.insertPage(2);

    doc.setPage(2);
    y = margin;

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text('SOMMAIRE', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Entrées du sommaire
    tocEntries.forEach(entry => {
      if (y + 10 > pageHeight - 25) {
        doc.addPage();
        y = margin;
      }

      // Le numéro de page réel (décalé de +1 car on a inséré la page de sommaire)
      const realPage = entry.page + 1;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 102, 204);

      const textWidth = doc.getTextWidth(entry.title);
      doc.text(entry.title, margin, y);

      // Points de conduite
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      let dotX = margin + textWidth + 3;
      const dotsEnd = pageWidth - margin - 15;
      while (dotX < dotsEnd) {
        doc.text('.', dotX, y);
        dotX += 2;
      }

      // Numéro de page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 102, 204);
      doc.text(realPage.toString(), pageWidth - margin, y, { align: 'right' });

      y += 9;
    });
  }

  // ============================================
  // FOOTERS SUR TOUTES LES PAGES
  // ============================================

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    addFooter(i, totalPages);
  }

  return doc;
}

// ============================================
// API PUBLIQUE
// ============================================

/**
 * Génère un Blob PDF (pour prévisualisation ou upload)
 */
export async function generateRapportPresentationPdfBlob(data: any): Promise<Blob> {
  const doc = await buildRapportPdf(data);
  return doc.output('blob');
}

/**
 * Exporte le Rapport de Présentation en PDF (téléchargement direct)
 */
export async function exportRapportPresentationPdf(data: any, filename?: string): Promise<void> {
  const doc = await buildRapportPdf(data);
  const fname =
    filename ||
    `Rapport_Presentation_${data?.numeroProcedure || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname);
}
