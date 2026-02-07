import React, { useState, useMemo } from 'react';
import { AnalysisData, Offer } from '../types';
import { ArrowLeft, FileSpreadsheet, FileText, Trophy, Star, TrendingUp, Search, IdCard, BarChart3, Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Archive, Loader2, Microscope, FileType, Image as ImageIcon } from 'lucide-react';
import ScoreChart from './ScoreChart';
import PriceChart from './PriceChart';
import TrendChart from './TrendChart';
import SidePanel from './SidePanel';
import TechnicalAnalysisView from './TechnicalAnalysisView';
import ExportSelectModal from './ExportSelectModal';
// Import docx primitives
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { formatCurrency, formatNumber } from '@/utils';
import { Button } from '@/components/ui';

interface Props {
  data: AnalysisData;
  onReset: () => void;
  onBack?: () => void; // Retour aux lots
  /** Retour à l'étape Synthèse du wizard (saisie) pour modifier puis revoir l'analyse */
  onBackToStep6?: () => void;
}

const Dashboard: React.FC<Props> = ({ data, onReset, onBack, onBackToStep6 }) => {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [filter, setFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showTechnicalAnalysis, setShowTechnicalAnalysis] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // State for Sorting and Pagination
  const [sortConfig, setSortConfig] = useState<{ key: keyof Offer; direction: 'asc' | 'desc' }>({ key: 'rankFinal', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { lotName, metadata, offers, stats, technicalAnalysis } = data;
  const winner = stats.winner;

  // Sorting and Filtering Logic
  const processedOffers = useMemo(() => {
    const normalizeText = (text: any): string => {
      if (!text) return '';
      return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const searchTerm = normalizeText(filter);
    
    let result = offers.filter(o => {
      if (!searchTerm) return true;
      
      return (
        normalizeText(o.name).includes(searchTerm) ||
        normalizeText(metadata.description).includes(searchTerm) ||
        normalizeText(metadata.consultation).includes(searchTerm) ||
        normalizeText(lotName).includes(searchTerm)
      );
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [offers, filter, sortConfig, metadata, lotName]);

  // Pagination Logic
  const totalPages = Math.ceil(processedOffers.length / itemsPerPage);
  // Show all offers during export to capture full table in PDF
  const paginatedOffers = isExporting ? processedOffers : processedOffers.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleSort = (key: keyof Offer) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  const SortIcon = ({ column }: { column: keyof Offer }) => {
    if (sortConfig.key !== column) return <div className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-30" />; 
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-3 h-3 ml-1 text-green-600" /> 
      : <ChevronDown className="w-3 h-3 ml-1 text-green-600" />;
  };

  const getPdfOptions = () => ({
    margin: [10, 10, 10, 10],
    filename: `Analyse_${lotName}_${metadata.consultation}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.body.scrollWidth },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak: { mode: ['avoid-all', 'css'], avoid: '.pdf-avoid-break' }
  });

  const handleExportPDF = () => {
    setIsExporting(true);
    document.body.classList.add('generating-pdf');
    const element = document.getElementById('dashboard-container');
    
    setTimeout(() => {
      if (window.html2pdf) {
        window.html2pdf()
          .set(getPdfOptions())
          .from(element)
          .save()
          .then(() => {
             document.body.classList.remove('generating-pdf');
             setIsExporting(false);
          });
      } else {
        setIsExporting(false);
        document.body.classList.remove('generating-pdf');
      }
    }, 500);
  };

  const generateExcelWorkbook = () => {
      const metaDataRows = [
          ["SYNTHÈSE DE CONSULTATION", ""],
          ["Lot", lotName],
          ["Référence", metadata.consultation],
          ["Date", metadata.date],
          ["Description", metadata.description],
          ["Acheteur", metadata.buyer],
          ["Demandeur", metadata.requester],
          [""] 
      ];

      const tableHeaders = ["Rang", "Candidat", "Note Globale", "Note Technique", "Note Financière", "Montant TTC"];

      const offerRows = offers.map(o => [
          o.rankFinal,
          o.name,
          o.scoreFinal,
          o.scoreTechnical,
          o.scoreFinancial,
          o.amountTTC
      ]);

      const worksheetData = [...metaDataRows, tableHeaders, ...offerRows];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      
      const wscols = [{wch: 25}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}];
      ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Synthèse");
      return wb;
  };

  const handleExportExcel = () => {
      const wb = generateExcelWorkbook();
        XLSX.writeFile(wb, `Analyse_${lotName}_${metadata.consultation}.xlsx`);
  };

  // --- WORD GENERATION LOGIC ---
  const generateWordBlob = async (): Promise<Blob> => {
    // ... Word generation logic remains the same (omitted for brevity, assume existing function logic)
     const tableHeaderStyle = {
      fill: { type: "pattern", pattern: "solid", fgColor: "E6E6E6" },
      bold: true,
      size: 20 // 10pt
    };

    // 1. Metadata Table
    const metadataRows = [
        ["Lot", lotName],
        ["Consultation", metadata.consultation],
        ["Date", metadata.date],
        ["Description", metadata.description],
        ["Acheteur", metadata.buyer],
        ["Demandeur", metadata.requester]
    ].map(([key, value]) => 
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: key, bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph(value || "-")] }),
            ],
        })
    );

    // 2. Stats Summary
    const statsParagraphs = [
        new Paragraph({ 
            text: `Offre Lauréate : ${winner?.name || 'N/A'}`, 
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200 }
        }),
        new Paragraph({
            text: `Montant : ${winner ? formatCurrency(winner.amountTTC) : '-'} | Note Globale : ${winner?.scoreFinal.toFixed(2) || '-'}`,
            spacing: { after: 200 }
        }),
        new Paragraph({ text: `Moyenne du marché : ${formatCurrency(stats.average)}` }),
        new Paragraph({ text: `Gain estimé : ${formatCurrency(stats.savingAmount)} (${stats.savingPercent.toFixed(1)}%)` }),
    ];

    // 3. Offers Table
    const offersHeader = new TableRow({
        children: [
            "Rang", "Candidat", "Note Globale", "Technique", "Financier", "Prix"
        ].map(text => new TableCell({
            children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
            shading: { fill: "10b981" }, // Green header
        }))
    });

    const offersRows = [...offers]
        .sort((a, b) => a.rankFinal - b.rankFinal)
        .map(o => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: o.rankFinal.toString(), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph(o.name)] }),
                new TableCell({ children: [new Paragraph({ text: o.scoreFinal.toFixed(2), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: o.scoreTechnical.toFixed(2), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: o.scoreFinancial.toFixed(2), alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ text: formatCurrency(o.amountTTC), alignment: AlignmentType.RIGHT })] }),
            ]
        }));

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: `Rapport d'Analyse - ${lotName}`,
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({ text: "Informations Générales", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                new Table({
                    rows: metadataRows,
                    width: { size: 100, type: WidthType.PERCENTAGE },
                }),
                new Paragraph({ text: "Synthèse Financière", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
                ...statsParagraphs,
                new Paragraph({ text: "Classement des Offres", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
                new Table({
                    rows: [offersHeader, ...offersRows],
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 1 },
                        bottom: { style: BorderStyle.SINGLE, size: 1 },
                        left: { style: BorderStyle.SINGLE, size: 1 },
                        right: { style: BorderStyle.SINGLE, size: 1 },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                        insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                    }
                })
            ],
        }],
    });
    return await Packer.toBlob(doc);
  };

  const handleExportWord = async () => {
      try {
          setIsExporting(true);
          const blob = await generateWordBlob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `Rapport_${lotName}_${metadata.consultation}.docx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      } catch (err) {
          console.error(err);
          alert("Erreur lors de la génération du fichier Word");
      } finally {
          setIsExporting(false);
      }
  };

  const handleExportZip = () => {
    setIsExporting(true);
    document.body.classList.add('generating-pdf');
    const element = document.getElementById('dashboard-container');

    setTimeout(async () => {
      try {
          const zip = new JSZip();
        const cleanRef = metadata.consultation.replace(/[^a-z0-9]/gi, '_') || 'Consultation';
        const cleanLot = lotName.replace(/[^a-z0-9]/gi, '_');

        const wb = generateExcelWorkbook();
          const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        zip.file(`Analyse_${cleanLot}_${cleanRef}.xlsx`, excelBuffer);

        if (window.html2pdf) {
           const pdfBlob = await window.html2pdf()
            .set(getPdfOptions())
            .from(element)
            .output('blob');
           zip.file(`Analyse_${cleanLot}_${cleanRef}.pdf`, pdfBlob);
        }

        const wordBlob = await generateWordBlob();
        zip.file(`Rapport_${cleanLot}_${cleanRef}.docx`, wordBlob);

        const zipContent = await zip.generateAsync({type: "blob"});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipContent);
        link.download = `Dossier_Analyse_${cleanLot}_${cleanRef}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

      } catch (error) {
        console.error("Erreur lors de la génération du ZIP", error);
        alert("Une erreur est survenue lors de la création du fichier ZIP.");
      } finally {
        document.body.classList.remove('generating-pdf');
        setIsExporting(false);
      }
    }, 500);
  };

  // Switch to Technical View if active
  if (showTechnicalAnalysis && technicalAnalysis) {
      return (
          <TechnicalAnalysisView 
            technicalData={technicalAnalysis} 
            onBack={() => setShowTechnicalAnalysis(false)} 
            winnerName={winner?.name}
          />
      );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden relative h-screen">
      
      <ExportSelectModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
        title={`Analyse ${lotName}`}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          {onBack ? (
            <Button 
                onClick={onBack}
                variant="ghost"
                size="sm"
                rounded="full"
                icon={<ArrowLeft className="w-5 h-5" />}
                className="no-print"
                title="Retour aux lots"
            >
                <span className="text-sm font-medium hidden sm:inline">Retour Lots</span>
            </Button>
          ) : (
            <Button 
                onClick={onReset}
                variant="ghost"
                size="sm"
                rounded="full"
                icon={<ArrowLeft className="w-5 h-5" />}
                className="no-print"
                title="Retour à l'accueil"
            />
          )}
          {onBackToStep6 && (
            <Button
              onClick={onBackToStep6}
              variant="outline"
              size="sm"
              rounded="full"
              icon={<ArrowLeft className="w-5 h-5" />}
              className="no-print border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              title="Retour à l'étape Synthèse du wizard pour modifier"
            >
              <span className="text-sm font-medium">Retour à l&apos;étape Synthèse</span>
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded uppercase tracking-wider">{lotName}</span>
              <span className="hidden sm:inline">| Synthèse</span>
            </h1>
          </div>
        </div>
        <div className="flex gap-3 no-print">
            
          {technicalAnalysis && (
              <Button 
                onClick={() => setShowTechnicalAnalysis(true)}
                variant="secondary"
                size="sm"
                icon={<Microscope className="w-4 h-4" />}
                className="border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
              >
                  <span className="hidden sm:inline">Analyse QT</span>
              </Button>
          )}

          <div className="h-8 w-px bg-gray-300 mx-1"></div>

          <Button 
            onClick={() => setShowExportModal(true)}
            variant="secondary"
            size="sm"
            icon={<ImageIcon className="w-4 h-4" />}
            title="Exporter des éléments sous forme d'image"
          >
            <span className="hidden sm:inline">Img Export</span>
          </Button>

          <Button 
            onClick={handleExportZip} 
            disabled={isExporting}
            variant="info"
            size="sm"
            icon={isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            loading={isExporting}
          >
            <span className="hidden sm:inline">Tout (ZIP)</span>
          </Button>
          
          <Button 
            onClick={handleExportExcel} 
            disabled={isExporting}
            variant="success"
            size="sm"
            icon={<FileSpreadsheet className="w-4 h-4" />}
          />
          
          <Button 
            onClick={handleExportWord} 
            disabled={isExporting}
            variant="info"
            size="sm"
            icon={<FileType className="w-4 h-4" />}
          />

          <Button 
            onClick={handleExportPDF} 
            disabled={isExporting}
            variant="secondary"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            className="bg-gray-800 hover:bg-gray-900 text-white border-gray-800"
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6" id="main-scroll">
        <div id="dashboard-container" className="pdf-container max-w-7xl mx-auto space-y-6">
          
          {/* Hero Section */}
          {winner && (
            <div 
              data-export-id="winner-card" 
              data-export-label="Carte du Lauréat"
              className="pdf-avoid-break bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 text-green-200 opacity-50 pointer-events-none">
                <Trophy className="w-32 h-32" />
              </div>
              
              <div className="z-10 w-full md:w-auto">
                <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Candidat Recommandé</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2 truncate max-w-xl" title={winner.name}>{winner.name}</h2>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center text-green-800 bg-white/50 px-3 py-1 rounded-full">
                    <Star className="w-5 h-5 mr-1 fill-current" />
                    <span className="font-bold text-lg">{winner.scoreFinal.toFixed(2)}/100</span>
                  </div>
                  <div className="h-4 w-px bg-green-300 hidden md:block"></div>
                  <div className="font-mono text-xl text-green-900 font-bold">{formatCurrency(winner.amountTTC)}</div>
                </div>
              </div>

              <div className="z-10 mt-4 md:mt-0 flex gap-4 md:gap-6 text-center w-full md:w-auto">
                <div className="bg-white/80 backdrop-blur rounded-lg p-3 shadow-sm border border-green-100 flex-1 md:flex-none min-w-[120px]">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Économie / Moyenne</p>
                  <p className={`text-xl md:text-2xl font-bold ${stats.savingPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.savingPercent > 0 ? '+' : ''}{stats.savingPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur rounded-lg p-3 shadow-sm border border-green-100 flex-1 md:flex-none min-w-[120px]">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Gain Monétaire</p>
                  <p className={`text-xl md:text-2xl font-bold ${stats.savingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.savingAmount > 0 ? '+' : ''}{formatCurrency(stats.savingAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Metadata Card */}
            <div 
              data-export-id="metadata-card" 
              data-export-label="Fiche Signalétique"
              className="pdf-avoid-break md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <IdCard className="w-4 h-4" /> Fiche Signalétique
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Acheteur</p>
                  <p className="font-medium truncate text-gray-800" title={metadata.buyer}>{metadata.buyer}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Demandeur</p>
                  <p className="font-medium truncate text-gray-800" title={metadata.requester}>{metadata.requester}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Description</p>
                  <p className="font-medium truncate text-gray-800" title={metadata.description}>{metadata.description}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Référence Consultation</p>
                  <p className="font-medium truncate text-gray-800" title={metadata.consultation}>
                    {metadata.consultation}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Date</p>
                  <p className="font-medium truncate text-gray-800 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    {metadata.date}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Taux TVA détecté</p>
                  <p className="font-mono bg-gray-100 text-gray-600 inline-block px-2 rounded text-xs py-0.5 mt-1">{metadata.tva}</p>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div 
              data-export-id="stats-card" 
              data-export-label="Indicateurs Marché"
              className="pdf-avoid-break md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between"
            >
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Indicateurs Marché
              </h3>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-gray-500 text-xs">Moyenne des offres</p>
                  <p className="text-xl font-bold text-gray-700">{formatCurrency(stats.average)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-xs">Offre la plus basse</p>
                  <p className="text-lg font-medium text-green-600">{formatCurrency(stats.min)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Offre la plus haute</p>
                  <p className="text-lg font-medium text-red-500">{formatCurrency(stats.max)}</p>
                </div>
              </div>
              <div>
                 <div className="w-full bg-gray-100 rounded-full h-2 relative">
                    <div className="absolute top-0 left-0 h-full bg-gray-300 w-full rounded-full opacity-20"></div>
                 </div>
                 <p className="text-xs text-center text-gray-400 mt-2">Écart type des prix analysé sur {offers.length} offres</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              data-export-id="score-chart" 
              data-export-label="Graphique des Scores"
              className="pdf-avoid-break bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-gray-600" /> Répartition des Notes (Tech vs Fin)
              </h3>
              <ScoreChart offers={offers} />
            </div>
            <div 
              data-export-id="price-chart" 
              data-export-label="Graphique des Prix"
              className="pdf-avoid-break bg-white rounded-xl shadow-sm border border-gray-200 p-5"
            >
              <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-gray-600" /> Comparaison des Offres Financières
              </h3>
              <PriceChart offers={offers} average={stats.average} />
            </div>
          </div>

          {/* Trend Chart */}
          <div 
            data-export-id="trend-chart" 
            data-export-label="Graphique des Tendances"
            className="pdf-avoid-break bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-gray-600" /> Analyse des Tendances (Par classement)
            </h3>
            <TrendChart offers={offers} />
          </div>

          {/* Table */}
          <div 
            data-export-id="offers-table" 
            data-export-label="Tableau des Offres"
            className="pdf-avoid-break bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
              <h3 className="font-bold text-gray-700">Détail des Offres</h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Filtrer par nom..." 
                  value={filter}
                  onChange={handleFilterChange}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-full sm:w-64 transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs select-none">
                  <tr>
                    <th 
                        className="px-6 py-3 text-center w-16 cursor-pointer hover:bg-gray-100 group transition-colors"
                        onClick={() => handleSort('rankFinal')}
                    >
                        <div className="flex items-center justify-center">
                            Rang <SortIcon column="rankFinal" />
                        </div>
                    </th>
                    <th 
                        className="px-6 py-3 cursor-pointer hover:bg-gray-100 group transition-colors"
                        onClick={() => handleSort('name')}
                    >
                        <div className="flex items-center">
                            Candidat <SortIcon column="name" />
                        </div>
                    </th>
                    <th 
                        className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 group transition-colors"
                        onClick={() => handleSort('scoreFinal')}
                    >
                        <div className="flex items-center justify-end">
                            Note Globale <SortIcon column="scoreFinal" />
                        </div>
                    </th>
                    <th 
                        className="px-6 py-3 text-right text-blue-600 cursor-pointer hover:bg-gray-100 group transition-colors"
                        onClick={() => handleSort('scoreFinancial')}
                    >
                        <div className="flex items-center justify-end">
                            Note Fin. <SortIcon column="scoreFinancial" />
                        </div>
                    </th>
                    <th 
                        className="px-6 py-3 text-right text-green-600 cursor-pointer hover:bg-gray-100 group transition-colors"
                        onClick={() => handleSort('scoreTechnical')}
                    >
                        <div className="flex items-center justify-end">
                            Note Tech. <SortIcon column="scoreTechnical" />
                        </div>
                    </th>
                    <th 
                        className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 group transition-colors"
                        onClick={() => handleSort('amountTTC')}
                    >
                        <div className="flex items-center justify-end">
                            Montant TTC <SortIcon column="amountTTC" />
                        </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedOffers.map((offer) => {
                    const isWinner = offer.rankFinal === 1;
                    return (
                      <tr 
                        key={offer.id} 
                        onClick={() => setSelectedOffer(offer)}
                        className={`
                          hover:bg-gray-50 cursor-pointer transition-colors duration-150
                          ${isWinner ? 'bg-green-50/50 hover:bg-green-50 border-l-4 border-l-green-500' : 'bg-white border-l-4 border-l-transparent'}
                        `}
                      >
                        <td className="px-6 py-4 font-bold text-center text-gray-700">
                           {isWinner ? <Trophy className="w-4 h-4 text-yellow-500 mx-auto" /> : offer.rankFinal}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {offer.name}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-800">
                          {formatNumber(offer.scoreFinal)}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-600">
                          {formatNumber(offer.scoreFinancial)} <span className="text-xs text-gray-400 opacity-60">({offer.rankFinancial})</span>
                        </td>
                        <td className="px-6 py-4 text-right text-green-600">
                          {formatNumber(offer.scoreTechnical)} <span className="text-xs text-gray-400 opacity-60">({offer.rankTechnical})</span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium">
                          {formatCurrency(offer.amountTTC)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50/50 no-print">
                    <div className="text-xs text-gray-500">
                        Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, processedOffers.length)} sur {processedOffers.length} offres
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            variant="ghost"
                            size="sm"
                            rounded="md"
                            icon={<ChevronLeft className="w-5 h-5" />}
                        />
                        <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <Button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            variant="ghost"
                            size="sm"
                            rounded="md"
                            icon={<ChevronRight className="w-5 h-5" />}
                        />
                    </div>
                  </div>
              )}
            </div>
          </div>

          <div className="hidden print-only text-center text-xs text-gray-400 mt-10">
            <p>Document généré automatiquement le {new Date().toLocaleDateString('fr-FR')} via Afpa DNA.</p>
          </div>

        </div>
      </main>

      <SidePanel 
        offer={selectedOffer} 
        offers={offers} 
        isOpen={!!selectedOffer} 
        onClose={() => setSelectedOffer(null)} 
        stats={stats}
      />
    </div>
  );
};

export default Dashboard;