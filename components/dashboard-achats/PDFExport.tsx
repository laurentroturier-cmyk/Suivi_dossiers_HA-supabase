import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { KPIData, AchatRow } from './types';
import { formatCurrencyShort, percentage, formatCurrency, groupSum, topN } from './utils';

interface PDFExportProps {
  kpiData: KPIData;
  chartData: AchatRow[];
  filters: any;
}

// Utilitaire pour charger une image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Fonction pour ajouter l'en-tête avec logo
async function addHeader(pdf: jsPDF, margin: number, pageWidth: number): Promise<number> {
  const currentY = margin;

  // Ajouter le logo Afpa
  try {
    const logo = await loadImage('/logo-afpa.png');
    const logoHeight = 15;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    pdf.addImage(logo, 'PNG', margin, currentY, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Logo non chargé:', error);
  }

  // Titre principal
  pdf.setFontSize(24);
  pdf.setTextColor(0, 158, 226); // Couleur cyan
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dashboard Achats', pageWidth / 2, currentY + 12, { align: 'center' });

  // Sous-titre
  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  pdf.text(`Rapport généré le ${today}`, pageWidth / 2, currentY + 18, { align: 'center' });

  // Ligne de séparation
  pdf.setDrawColor(0, 158, 226);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY + 22, pageWidth - margin, currentY + 22);

  return currentY + 28;
}

// Fonction pour ajouter la section KPI
function addKPISection(pdf: jsPDF, kpiData: KPIData, margin: number, pageWidth: number): void {
  let y = 50;

  // Titre de section
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Indicateurs Clés de Performance', margin, y);
  y += 10;

  // Configuration des KPI
  const kpis = [
    {
      label: 'CA Commandé',
      value: formatCurrencyShort(kpiData.totalCommande),
      detail: `${kpiData.nbLignes} lignes`,
      color: [0, 158, 226] // Cyan
    },
    {
      label: 'CA Facturé',
      value: formatCurrencyShort(kpiData.totalFacture),
      detail: `Taux: ${percentage(kpiData.totalFacture, kpiData.totalCommande)}`,
      color: [16, 185, 129] // Emerald
    },
    {
      label: 'CA Livré',
      value: formatCurrencyShort(kpiData.totalLivre),
      detail: `Taux: ${percentage(kpiData.totalLivre, kpiData.totalCommande)}`,
      color: [251, 146, 60] // Orange
    },
    {
      label: 'Montant Total TTC',
      value: formatCurrencyShort(kpiData.totalMontant),
      detail: '',
      color: [139, 92, 246] // Violet
    },
    {
      label: 'Fournisseurs',
      value: kpiData.nbFournisseurs.toString(),
      detail: 'uniques',
      color: [236, 72, 153] // Pink
    },
    {
      label: 'Commandes',
      value: kpiData.nbCommandes.toString(),
      detail: 'distinctes',
      color: [99, 102, 241] // Indigo
    }
  ];

  // Dessiner les cartes KPI en grille 2x3
  const cardWidth = (pageWidth - 2 * margin - 10) / 2;
  const cardHeight = 25;
  const gap = 5;

  kpis.forEach((kpi, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);

    // Bordure colorée en haut
    pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.rect(x, cardY, cardWidth, 2, 'F');

    // Fond de la carte
    pdf.setFillColor(248, 250, 252);
    pdf.rect(x, cardY + 2, cardWidth, cardHeight - 2, 'F');

    // Bordure
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.rect(x, cardY, cardWidth, cardHeight, 'S');

    // Label
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.label.toUpperCase(), x + 3, cardY + 7);

    // Valeur
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 3, cardY + 15);

    // Détail
    if (kpi.detail) {
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text(kpi.detail, x + 3, cardY + 20);
    }
  });
}

// Fonction pour ajouter un tableau
function addTable(
  pdf: jsPDF,
  margin: number,
  startY: number,
  pageWidth: number,
  data: [string, number][],
  col1Label: string,
  col2Label: string
): number {
  let y = startY;
  const tableWidth = pageWidth - 2 * margin;
  const col1Width = tableWidth * 0.6;
  const col2Width = tableWidth * 0.4;
  const rowHeight = 7;

  // En-tête
  pdf.setFillColor(0, 158, 226);
  pdf.rect(margin, y, tableWidth, rowHeight, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text(col1Label, margin + 2, y + 5);
  pdf.text(col2Label, margin + col1Width + 2, y + 5);
  
  y += rowHeight;

  // Lignes de données
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  
  data.forEach((row, index) => {
    const bgColor = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(margin, y, tableWidth, rowHeight, 'F');

    // Bordures
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.1);
    pdf.rect(margin, y, tableWidth, rowHeight, 'S');

    // Texte
    pdf.setFontSize(8);
    const label = row[0].length > 50 ? row[0].substring(0, 47) + '...' : row[0];
    pdf.text(label, margin + 2, y + 5);
    pdf.text(formatCurrency(row[1]), margin + col1Width + 2, y + 5);

    y += rowHeight;
  });

  return y;
}

// Fonction pour ajouter le pied de page
function addFooter(pdf: jsPDF, margin: number, pageWidth: number, pageHeight: number) {
  const footerY = pageHeight - 10;
  
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.setFont('helvetica', 'italic');
  
  // Numéro de page
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(
      `Page ${i} sur ${pageCount}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    
    // Mention
    pdf.text(
      'Document confidentiel - Afpa',
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
  }
}

// Fonction pour ajouter les graphiques
async function addChartsSection(
  pdf: jsPDF,
  chartData: AchatRow[],
  margin: number,
  pageWidth: number,
  pageHeight: number
): Promise<void> {
  let y = 50;

  // Titre de section
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Analyses Graphiques', margin, y);
  y += 10;

  // Préparer les données
  const trimData = groupSum(chartData, 'Trimestre', 'Montant de la ventilation de commande');
  const famData = groupSum(chartData, "Famille d'achats", 'Montant de la ventilation de commande');
  const fournData = groupSum(chartData, 'Fournisseur', 'Montant de la ventilation de commande');

  // Tableau: CA par Trimestre
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CA par Trimestre', margin, y);
  y += 7;

  const trimEntries = Object.entries(trimData).sort();
  y = addTable(pdf, margin, y, pageWidth, trimEntries, 'Trimestre', 'CA Commandé');

  y += 10;

  // Tableau: Top 10 Familles
  if (y > pageHeight - 80) {
    pdf.addPage();
    y = await addHeader(pdf, margin, pageWidth);
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top 10 Familles d\'achats', margin, y);
  y += 7;

  const famEntries = topN(famData, 10);
  y = addTable(pdf, margin, y, pageWidth, famEntries, 'Famille', 'Montant');

  y += 10;

  // Tableau: Top 10 Fournisseurs
  if (y > pageHeight - 80) {
    pdf.addPage();
    y = await addHeader(pdf, margin, pageWidth);
  }

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top 10 Fournisseurs', margin, y);
  y += 7;

  const fournEntries = topN(fournData, 10);
  y = addTable(pdf, margin, y, pageWidth, fournEntries, 'Fournisseur', 'Montant');

  // Footer
  addFooter(pdf, margin, pageWidth, pageHeight);
}

export const PDFExport: React.FC<PDFExportProps> = ({ kpiData, chartData, filters }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Configuration du PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      // Page 1: En-tête + KPI
      await addHeader(pdf, margin, pageWidth);
      addKPISection(pdf, kpiData, margin, pageWidth);

      // Page 2: Graphiques
      pdf.addPage();
      await addHeader(pdf, margin, pageWidth);
      await addChartsSection(pdf, chartData, margin, pageWidth, pageHeight);

      // Sauvegarder le PDF
      const fileName = `dashboard-achats-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg transition-all font-medium shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Génération PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export PDF Pro
        </>
      )}
    </button>
  );
};

