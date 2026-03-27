import React, { useState } from 'react';
import { Download, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import { MergedRow, FileData } from './types';

interface ExportButtonProps {
  rows: MergedRow[];
  columns: string[];
  files: FileData[];
  disabled?: boolean;
}

// Au-delà de ce seuil → CSV uniquement (XLSX crashe le navigateur)
const XLSX_ROW_LIMIT = 100_000;
const CHUNK_SIZE = 10_000;

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes('"') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportButton({ rows, columns, files, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const date = new Date().toISOString().split('T')[0];
  const isBig = rows.length > XLSX_ROW_LIMIT;

  // ── Export CSV ────────────────────────────────────────────────────────
  const exportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setProgress(0);
    await new Promise(r => setTimeout(r, 50));

    try {
      const parts: string[] = [];
      // BOM UTF-8 pour que Excel l'ouvre correctement
      parts.push('\uFEFF');
      parts.push(['#', 'Fichier source', ...columns].map(escapeCsv).join(';') + '\r\n');

      let i = 0;
      while (i < rows.length) {
        const end = Math.min(i + CHUNK_SIZE, rows.length);
        const chunk: string[] = [];
        for (; i < end; i++) {
          const row = rows[i];
          chunk.push(
            [row._index, row._source, ...columns.map(col => row[col] ?? '')].map(escapeCsv).join(';')
          );
        }
        parts.push(chunk.join('\r\n') + '\r\n');
        setProgress(Math.round((i / rows.length) * 95));
        await new Promise(r => setTimeout(r, 0));
      }

      setProgress(98);
      const blob = new Blob(parts, { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `fusion_excel_${date}.csv`);
      setProgress(100);
    } catch (err) {
      console.error('[ExcelMerger] Erreur export CSV :', err);
    } finally {
      setTimeout(() => { setIsExporting(false); setProgress(0); }, 800);
    }
  };

  // ── Export XLSX (petits volumes uniquement) ────────────────────────────
  const exportXlsx = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setProgress(0);
    await new Promise(r => setTimeout(r, 50));

    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'DNA Gestprojet';
      wb.created = new Date();

      const ws1 = wb.addWorksheet('Données consolidées');
      const headerRow = ws1.addRow(['#', 'Fichier source', ...columns]);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      ws1.getRow(1).height = 22;
      ws1.getColumn(1).width = 8;
      ws1.getColumn(2).width = 32;
      columns.forEach((_, i) => { ws1.getColumn(i + 3).width = 22; });

      let i = 0;
      while (i < rows.length) {
        const end = Math.min(i + CHUNK_SIZE, rows.length);
        for (; i < end; i++) {
          const row = rows[i];
          ws1.addRow([row._index, row._source, ...columns.map(col => row[col] ?? '')]);
        }
        setProgress(Math.round((i / rows.length) * 80));
        await new Promise(r => setTimeout(r, 0));
      }

      setProgress(85);
      const ws2 = wb.addWorksheet('Récapitulatif');
      const h2 = ws2.addRow(['Fichier', 'Nombre de lignes']);
      h2.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      });
      ws2.getColumn(1).width = 42;
      ws2.getColumn(2).width = 20;
      files.forEach(f => ws2.addRow([f.name, f.rowCount]));
      const tot = ws2.addRow(['TOTAL', files.reduce((s, f) => s + f.rowCount, 0)]);
      tot.eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      });

      setProgress(92);
      await new Promise(r => setTimeout(r, 0));

      const buffer = await wb.xlsx.writeBuffer();
      setProgress(98);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(blob, `fusion_excel_${date}.xlsx`);
      setProgress(100);
    } catch (err) {
      console.error('[ExcelMerger] Erreur export XLSX :', err);
    } finally {
      setTimeout(() => { setIsExporting(false); setProgress(0); }, 800);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* CSV — toujours disponible */}
        <button
          onClick={exportCsv}
          disabled={disabled || isExporting}
          aria-label="Exporter en CSV (compatible Excel, tous volumes)"
          aria-busy={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700/60 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:cursor-wait whitespace-nowrap"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {isExporting ? `Export… ${progress}%` : 'Exporter en CSV'}
        </button>

        {/* XLSX — uniquement si volume raisonnable */}
        {!isBig ? (
          <button
            onClick={exportXlsx}
            disabled={disabled || isExporting}
            aria-label="Exporter en XLSX"
            aria-busy={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-700/60 text-white rounded-xl text-sm font-medium transition-colors shadow-sm disabled:cursor-wait whitespace-nowrap"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isExporting ? `Export… ${progress}%` : 'Exporter en XLSX'}
          </button>
        ) : (
          <div
            title={`Export XLSX désactivé au-delà de ${XLSX_ROW_LIMIT.toLocaleString('fr-FR')} lignes — utilisez le CSV`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded-xl text-sm font-medium cursor-not-allowed whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4" />
            XLSX (volume trop élevé)
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {isExporting && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full max-w-[260px] h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-blue-500 transition-all duration-150 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {isBig && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-right max-w-[260px]">
          {rows.length.toLocaleString('fr-FR')} lignes — export CSV recommandé (s'ouvre dans Excel)
        </p>
      )}
    </div>
  );
}
