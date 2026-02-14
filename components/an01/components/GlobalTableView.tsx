import React, { useState } from 'react';
import { AnalysisData } from '../types';
import { ArrowLeft, FileSpreadsheet, FileType, Trophy, Eye, Info, Image as ImageIcon } from 'lucide-react';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from "docx";
import ExportSelectModal from './ExportSelectModal';
import * as XLSX from 'xlsx';

interface Props {
  lots: AnalysisData[];
  globalMetadata: Record<string, string>;
  onBack: () => void;
  onSelectLot: (index: number) => void;
}

const GlobalTableView: React.FC<Props> = ({ lots, globalMetadata, onBack, onSelectLot }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

    const handleExportExcel = () => {
        const metaRows = Object.entries(globalMetadata).map(([key, value]) => [key, value]);
        metaRows.push(["", ""]);
        const headers = ["Lot", "Lauréat", "Montant Lauréat TTC", "Moyenne des offres", "Économie réalisée (€)", "Économie (%)", "Nombre d'offres"];
        const dataRows = lots.map(lot => {
            const winner = lot.stats.winner;
            return [
                lot.lotName,
                winner ? winner.name : "N/A",
                winner ? winner.amountTTC : 0,
                lot.stats.average,
                lot.stats.savingAmount,
                lot.stats.savingPercent / 100,
                lot.offers.length
            ];
        });
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([...metaRows, headers, ...dataRows]);
        const wscols = [{wch: 25}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 10}];
        (ws as any)['!cols'] = wscols;
        XLSX.utils.book_append_sheet(wb, ws, "Synthèse Globale");
        XLSX.writeFile(wb, `Synthese_Multi_Lots.xlsx`);
    };

    const handleExportWord = async () => {
        try {
            setIsExporting(true);
            const metadataRows = Object.entries(globalMetadata).map(([key, value]) => 
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: key, bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph(value)] }),
                    ],
                })
            );
            const tableHeader = new TableRow({
                children: [
                    "Lot", "Lauréat", "Montant", "Économie", "Offres"
                ].map(text => new TableCell({
                    children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })],
                    shading: { fill: "E6E6E6" },
                }))
            });
            const tableRows = lots.map(lot => {
                const winner = lot.stats.winner;
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(lot.lotName)] }),
                        new TableCell({ children: [new Paragraph(winner?.name || "N/A")] }),
                        new TableCell({ children: [new Paragraph({ text: winner ? formatCurrency(winner.amountTTC) : "-", alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ 
                            children: [new Paragraph({ 
                                text: `${formatCurrency(lot.stats.savingAmount)} (${lot.stats.savingPercent.toFixed(1)}%)`, 
                                alignment: AlignmentType.RIGHT 
                            })] 
                        }),
                        new TableCell({ children: [new Paragraph({ text: lot.offers.length.toString(), alignment: AlignmentType.CENTER })] }),
                    ]
                });
            });
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "Synthèse Globale - Analyse des Lots",
                            heading: HeadingLevel.TITLE,
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 400 }
                        }),
                        new Paragraph({ text: "Informations Générales", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                        new Table({ rows: metadataRows, width: { size: 100, type: WidthType.PERCENTAGE }, spacing: { after: 400 } }),
                        new Paragraph({ text: "", spacing: { after: 400 } }),
                        new Paragraph({ text: "Détail par Lot", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
                        new Table({
                            rows: [tableHeader, ...tableRows],
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
                    ]
                }]
            });
            const blob = await Packer.toBlob(doc);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Synthese_Globale.docx`;
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

    return (
        <div className="an01-page flex-1 flex flex-col bg-gray-50 dark:bg-[#0f172a] overflow-hidden h-screen">
            <ExportSelectModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Synthèse Globale" />
            <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-600 px-6 py-4 flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-green-700 transition p-2 rounded-full hover:bg-gray-100" title="Retour aux cartes">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">Synthèse Globale</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                                                    <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition shadow" title="Exporter des éléments sous forme d'image">
                        <ImageIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Img Export</span>
                    </button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow">
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                    <button onClick={handleExportWord} disabled={isExporting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow disabled:opacity-50">
                        <FileType className="w-4 h-4" /> Word
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {Object.keys(globalMetadata).length > 0 && (
                        <div data-export-id="global-metadata" data-export-label="Informations Générales" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                                <Info className="w-4 h-4" /> Informations Générales de la Consultation
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {Object.entries(globalMetadata).map(([key, value]) => (
                                    <div key={key} className="flex flex-col border-b border-gray-50 pb-2 last:border-0">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">{key}</span>
                                        <span className="text-gray-900 font-medium mt-1">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div data-export-id="global-table" data-export-label="Tableau Synthèse Lots" className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300 uppercase font-bold text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Lot</th>
                                        <th className="px-6 py-3">Lauréat</th>
                                        <th className="px-6 py-3 text-right">Montant Lauréat</th>
                                        <th className="px-6 py-3 text-right">Moyenne</th>
                                        <th className="px-6 py-3 text-right">Économie</th>
                                        <th className="px-6 py-3 text-center">Offres</th>
                                        <th className="px-6 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-600">
                                    {lots.map((lot, index) => {
                                        const winner = lot.stats.winner;
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{lot.lotName}</td>
                                                <td className="px-6 py-4">
                                                    {winner ? (
                                                        <div className="flex items-center gap-2">
                                                            <Trophy className="w-4 h-4 text-yellow-500" />
                                                            <span className="font-medium">{winner.name}</span>
                                                        </div>
                                                    ) : <span className="text-gray-400 italic">Aucun lauréat</span>}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono">{winner ? formatCurrency(winner.amountTTC) : "-"}</td>
                                                <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(lot.stats.average)}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${lot.stats.savingPercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(lot.stats.savingAmount)} <span className="text-xs font-normal">({lot.stats.savingPercent.toFixed(1)}%)</span></td>
                                                <td className="px-6 py-4 text-center"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">{lot.offers.length}</span></td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => onSelectLot(index)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition" title="Voir le détail">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GlobalTableView;
