import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Info,
  Search,
  Download,
  Copy,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DpgfReaderProps {
  onClose?: () => void;
}

type DetectedColumns = {
  article?: number;
  designation?: number;
  quantity?: number;
  unit?: number;
  unitPrice?: number;
  totalPrice?: number;
};

type DpgfRow = {
  index: number;
  article?: string;
  designation?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  /** Total HT calculé = quantité × prix unitaire */
  computedTotal?: number;
  raw: (string | number | null)[];
};

const normalizeHeader = (value: any): string => {
  if (value == null) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_/.-]+/g, ' ')
    .trim();
};

function detectColumns(headers: any[]): DetectedColumns {
  const result: DetectedColumns = {};

  headers.forEach((h, idx) => {
    const n = normalizeHeader(h);
    if (!n) return;

    if (!result.article && (n.includes('poste') || n.includes('article') || n.includes('n ') || n.includes('numero'))) {
      result.article = idx;
    }
    if (
      !result.designation &&
      (n.includes('designation') || n.includes('libelle') || n.includes('objet') || n.includes('description'))
    ) {
      result.designation = idx;
    }
    if (!result.quantity && (n.includes('quantite') || n.includes('qte') || n === 'q')) {
      result.quantity = idx;
    }
    if (!result.unit && (n.includes('unite') || n === 'u' || n === 'unite de mesure')) {
      result.unit = idx;
    }
    if (
      !result.unitPrice &&
      (n.includes('prix unitaire') || n.includes('pu ht') || n === 'pu' || n.includes('prix unit'))
    ) {
      result.unitPrice = idx;
    }
    if (
      !result.totalPrice &&
      (n.includes('prix total') || n.includes('montant total') || n.includes('total ht') || n.includes('mt ht'))
    ) {
      result.totalPrice = idx;
    }
  });

  return result;
}

function parseNumber(value: any): number | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return isNaN(value) ? undefined : value;

  const str = String(value).replace(/\u00A0/g, ' '); // NBSP → espace normal

  // Extraire la première portion qui ressemble vraiment à un nombre
  const match = str.match(/[-+]?\d{1,3}(?:[\s\u00A0]?\d{3})*(?:[.,]\d+)?|[-+]?\d+(?:[.,]\d+)?/);
  const candidate = match ? match[0] : str;

  const cleaned = candidate
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

export const DpgfReader: React.FC<DpgfReaderProps> = ({ onClose }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [startRow, setStartRow] = useState<string>('5');
  const [startCol, setStartCol] = useState<string>('2'); // 2 => colonne B
  const [headers, setHeaders] = useState<any[] | null>(null);
  const [detectedCols, setDetectedCols] = useState<DetectedColumns | null>(null);
  const [rows, setRows] = useState<DpgfRow[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>('Importez votre fichier DPGF pour l’analyser.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewData, setPreviewData] = useState<any[][] | null>(null);
  const [fullPage, setFullPage] = useState(false);

  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().match(/\.(xlsx|xls|xlsm|xlsb)$/)) {
      setError('Format de fichier non supporté. Veuillez importer un fichier Excel (.xlsx, .xls, .xlsm ou .xlsb).');
      return;
    }
    setError(null);
    setInfo('Fichier chargé. Sélectionnez l’onglet et configurez la lecture.');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Impossible de lire le fichier.');
        const wb = XLSX.read(data, { type: 'array' });
        workbookRef.current = wb;
        const sheets = wb.SheetNames || [];
        setSheetNames(sheets);
        setSelectedSheet(sheets[0] || '');
        setHeaders(null);
        setDetectedCols(null);
        setRows([]);
        setPreviewData(null);
      } catch (err: any) {
        console.error('[DpgfReader] Erreur lecture Excel', err);
        setError('Erreur lors de la lecture du fichier DPGF. Vérifiez le format du fichier.');
      }
    };
    reader.onerror = () => {
      setError('Erreur de lecture du fichier. Veuillez réessayer.');
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleAnalyze = useCallback(() => {
    if (!workbookRef.current || !selectedSheet) {
      setError('Aucun fichier ou onglet sélectionné.');
      return;
    }

    const sr = parseInt(startRow, 10);
    const sc = parseInt(startCol, 10);
    if (!sr || sr <= 0 || !sc || sc <= 0) {
      setError('La ligne et la colonne de départ doivent être des nombres strictement positifs.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setInfo(null);

    try {
      const ws = workbookRef.current.Sheets[selectedSheet];
      const sheetArray = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false });
      if (!sheetArray || sheetArray.length === 0) {
        setError('L’onglet sélectionné est vide ou ne contient pas de données.');
        setIsAnalyzing(false);
        return;
      }

      const headerIndex = sr - 1;
      const dataStartIndex = headerIndex + 1;
      if (headerIndex >= sheetArray.length) {
        setError('La ligne de départ est en dehors de la plage de données.');
        setIsAnalyzing(false);
        return;
      }

      const headerRow = (sheetArray[headerIndex] || []) as any[];
      const slicedHeader = headerRow.slice(sc - 1);
      const mapping = detectColumns(slicedHeader);

      const parsedRows: DpgfRow[] = [];
      for (let i = dataStartIndex; i < sheetArray.length; i++) {
        const row = sheetArray[i] || [];
        const slice = row.slice(sc - 1);
        const article = mapping.article != null ? slice[mapping.article] : undefined;
        const designation = mapping.designation != null ? slice[mapping.designation] : undefined;
        const quantity = mapping.quantity != null ? parseNumber(slice[mapping.quantity]) : undefined;
        const unit = mapping.unit != null ? slice[mapping.unit] : undefined;
        const unitPrice = mapping.unitPrice != null ? parseNumber(slice[mapping.unitPrice]) : undefined;
        const computedTotal =
          quantity != null && unitPrice != null ? Number((quantity * unitPrice).toFixed(2)) : undefined;

        const hasContent =
          [article, designation, quantity, unit, unitPrice, computedTotal]
            .some(v => v !== undefined && v !== null && v !== '');
        if (!hasContent) continue;

        parsedRows.push({
          index: i + 1,
          article: article != null ? String(article) : undefined,
          designation: designation != null ? String(designation) : undefined,
          quantity,
          unit: unit != null ? String(unit) : undefined,
          unitPrice,
          computedTotal,
          raw: slice,
        });
      }

      setHeaders(slicedHeader);
      setDetectedCols(mapping);
      setRows(parsedRows);
      setInfo(
        parsedRows.length > 0
          ? `Analyse terminée : ${parsedRows.length} lignes détectées.`
          : 'Aucune ligne DPGF détectée à partir de ces paramètres.',
      );
    } catch (err: any) {
      console.error('[DpgfReader] Erreur analyse DPGF', err);
      setError('Erreur lors de l’analyse du DPGF. Vérifiez la configuration (onglet, ligne, colonne).');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSheet, startRow, startCol]);

  // Aperçu brut du fichier pour aider à repérer la bonne ligne/colonne de départ
  useEffect(() => {
    if (!workbookRef.current || !selectedSheet) {
      setPreviewData(null);
      return;
    }
    try {
      const ws = workbookRef.current.Sheets[selectedSheet];
      const sheetArray = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: false });
      if (!sheetArray || sheetArray.length === 0) {
        setPreviewData(null);
        return;
      }
      const maxRows = Math.min(sheetArray.length, 25);
      let maxCols = 0;
      for (let i = 0; i < maxRows; i++) {
        const row = sheetArray[i] || [];
        if (row.length > maxCols) maxCols = row.length;
      }
      const preview: any[][] = [];
      for (let r = 0; r < maxRows; r++) {
        const row = sheetArray[r] || [];
        const normalized: any[] = [];
        for (let c = 0; c < maxCols; c++) {
          normalized.push(row[c] ?? '');
        }
        preview.push(normalized);
      }
      setPreviewData(preview);
    } catch (e) {
      console.warn('[DpgfReader] Impossible de générer un aperçu brut du fichier', e);
      setPreviewData(null);
    }
  }, [selectedSheet, fileName]);

  const filteredRows = useMemo(() => {
    if (!filter) return rows;
    const f = filter.toLowerCase();
    return rows.filter((r) => {
      return (
        (r.article && r.article.toLowerCase().includes(f)) ||
        (r.designation && r.designation.toLowerCase().includes(f)) ||
        (r.unit && r.unit.toLowerCase().includes(f))
      );
    });
  }, [rows, filter]);

  const stats = useMemo(() => {
    if (rows.length === 0) {
      return { totalHT: 0, lignes: 0, avg: 0 };
    }
    const totalHT = rows.reduce((sum, r) => sum + (r.computedTotal || 0), 0);
    const lignes = rows.length;
    const avg = lignes > 0 ? totalHT / lignes : 0;
    return { totalHT, lignes, avg };
  }, [rows]);

  const handleCopy = useCallback(() => {
    if (rows.length === 0) return;
    const header = ['N°', 'Désignation', 'Quantité', 'Unité', 'Prix unitaire HT', 'Prix total HT'];
    const lines = rows.map((r) =>
      [
        r.article ?? '',
        r.designation ?? '',
        r.quantity ?? '',
        r.unit ?? '',
        r.unitPrice ?? '',
        r.computedTotal ?? '',
      ]
        .map((v) => String(v).replace(/\r?\n/g, ' '))
        .join(';'),
    );
    const csv = [header.join(';'), ...lines].join('\n');
    navigator.clipboard
      .writeText(csv)
      .then(() => setInfo('Données copiées dans le presse-papier (format CSV).'))
      .catch(() => setError('Impossible de copier les données dans le presse-papier.'));
  }, [rows]);

  const handleExportExcel = useCallback(() => {
    if (rows.length === 0) return;
    const header = ['N°', 'Désignation', 'Quantité', 'Unité', 'Prix unitaire HT', 'Prix total HT (calculé)'];
    const data = rows.map((r) => [
      r.article ?? '',
      r.designation ?? '',
      r.quantity ?? '',
      r.unit ?? '',
      r.unitPrice ?? '',
      r.computedTotal ?? '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analyse DPGF');
    const baseName = fileName ? fileName.replace(/\.[^.]+$/, '') : 'analyse_dpgf';
    const exportName = `${baseName}_analyse_dpgf.xlsx`;
    XLSX.writeFile(wb, exportName);
  }, [rows, fileName]);

  const handleNewFile = useCallback(() => {
    setFileName(null);
    setSheetNames([]);
    setSelectedSheet('');
    setHeaders(null);
    setDetectedCols(null);
    setRows([]);
    setFilter('');
    setError(null);
    setInfo('Importez votre fichier DPGF pour l’analyser.');
    setPreviewData(null);
    workbookRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à Analyse</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Lecteur / Analyse DPGF</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Importez un fichier DPGF (Décomposition du Prix Global et Forfaitaire) et analysez les postes.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
            <Info className="w-3.5 h-3.5" />
            <span>Analyse locale du fichier, pas d’envoi vers le serveur.</span>
          </div>
        </div>

        {/* Zone principale : upload + configuration + résultats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche : upload + configuration (masquée en plein écran) */}
          {!fullPage && (
          <div className="space-y-4 lg:col-span-1">
            {/* Upload */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl bg-white dark:bg-gray-900/40 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Déposez votre fichier DPGF ici
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Formats acceptés : <span className="font-semibold">.xlsx, .xls, .xlsm, .xlsb</span>
              </p>
              {fileName ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Fichier sélectionné : <span className="font-semibold">{fileName}</span>
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-gray-500">
                  Cliquez pour parcourir vos fichiers ou glissez-déposez un fichier Excel.
                </p>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.xlsm,.xlsb"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {/* Configuration */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Configuration de la lecture
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Choisissez l’onglet DPGF et indiquez où commencent les données (ligne d’entête et colonne de départ).
              </p>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Onglet Excel
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => setSelectedSheet(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={sheetNames.length === 0}
                  >
                    {sheetNames.length === 0 && <option>— Aucun onglet disponible —</option>}
                    {sheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">
                    Tous les onglets du classeur sont listés ici.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Ligne de départ
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={startRow}
                      onChange={(e) => setStartRow(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">
                      Numéro de la ligne contenant les <span className="font-semibold">en-têtes</span> du DPGF
                      (ex. 5).
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Colonne de départ
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={startCol}
                      onChange={(e) => setStartCol(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">
                      1 = colonne A, 2 = colonne B, etc.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!fileName || !selectedSheet || isAnalyzing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 mt-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    Analyser le DPGF
                  </>
                )}
              </button>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 mt-3">
                <button
                  type="button"
                  onClick={handleNewFile}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  Nouveau fichier
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={rows.length === 0}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copier les données
                </button>
              </div>
            </div>

            {/* Messages d'état */}
            {error && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/40 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-200 mt-0.5" />
                <p className="text-xs text-red-700 dark:text-red-100 whitespace-pre-line">{error}</p>
              </div>
            )}
            {info && !error && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2">
                <Info className="w-4 h-4 text-emerald-700 dark:text-emerald-200 mt-0.5" />
                <p className="text-xs text-emerald-800 dark:text-emerald-100 whitespace-pre-line">{info}</p>
              </div>
            )}
          </div>
          )}

          {/* Colonne droite : aperçu, mapping & tableau */}
          <div className={`${fullPage ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4`}>
            {/* Aperçu brut du fichier pour repérer les bonnes lignes/colonnes */}
            {previewData && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Aperçu brut du fichier (pour repérer le début du DPGF)
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Les numéros de lignes et les colonnes (A, B, C…) vous aident à choisir la ligne d&apos;en-tête et la colonne de départ.
                  </p>
                </div>
                <div className="overflow-auto max-h-64 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="min-w-full text-[11px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/70">
                      <tr>
                        <th className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 w-12">
                          #
                        </th>
                        {previewData[0].map((_, colIdx) => {
                          let n = colIdx + 1;
                          let label = '';
                          while (n > 0) {
                            const rem = (n - 1) % 26;
                            label = String.fromCharCode(65 + rem) + label;
                            n = Math.floor((n - 1) / 26);
                          }
                          return (
                            <th
                              key={colIdx}
                              className="px-2 py-1 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200"
                            >
                              {label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/70'}
                        >
                          <td className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-right text-gray-500 dark:text-gray-400">
                            {rowIdx + 1}
                          </td>
                          {row.map((cell, colIdx) => (
                            <td
                              key={colIdx}
                              className="px-2 py-1 border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 max-w-xs truncate"
                              title={cell != null ? String(cell) : ''}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Aperçu des en-têtes détectés */}
            {headers && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    En-têtes détectés (ligne {startRow}, à partir de la colonne {startCol})
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Mapping automatique des colonnes typiques d’un DPGF.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 dark:bg-gray-900/60">
                      <tr>
                        {headers.map((h, idx) => (
                          <th
                            key={idx}
                            className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-200"
                          >
                            {h || <span className="text-gray-400 italic">Colonne vide</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    {detectedCols && (
                      <tbody>
                        <tr className="bg-white dark:bg-gray-900">
                          {headers.map((_, idx) => {
                            const tags: string[] = [];
                            if (detectedCols.article === idx) tags.push('N°');
                            if (detectedCols.designation === idx) tags.push('Désignation');
                            if (detectedCols.quantity === idx) tags.push('Qté');
                            if (detectedCols.unit === idx) tags.push('Unité');
                            if (detectedCols.unitPrice === idx) tags.push('PU HT');
                            if (detectedCols.totalPrice === idx) tags.push('Total HT');
                            return (
                              <td
                                key={idx}
                                className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-600 dark:text-gray-300"
                              >
                                {tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {tags.map((t) => (
                                      <span
                                        key={t}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-100"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-600 italic">Non mappé</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* Barre de recherche + stats */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Rechercher dans les postes (N°, désignation, unité)…"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs sm:text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 mr-1">Postes</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{rows.length}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-200 mr-1">Total HT (calculé)</span>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-50">
                    {stats.totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 mr-1">Montant moyen (calculé)</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {stats.avg.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Tableau d'analyse */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Tableau d’analyse DPGF
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFullPage((v) => !v)}
                    disabled={rows.length === 0}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40"
                  >
                    {fullPage ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        Vue standard
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        Pleine page
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    disabled={rows.length === 0}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Excel
                  </button>
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                  Aucune donnée analysée pour le moment. Importez un fichier DPGF puis lancez l’analyse.
                </div>
              ) : (
                <div className="overflow-auto max-h-[520px] border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900/70">
                      <tr>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-200 w-16">
                          N°
                        </th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-200">
                          Désignation
                        </th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-right font-semibold text-gray-700 dark:text-gray-200 w-20">
                          Quantité
                        </th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-left font-semibold text-gray-700 dark:text-gray-200 w-20">
                          Unité
                        </th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-right font-semibold text-gray-700 dark:text-gray-200 w-28">
                          Prix unitaire HT
                        </th>
                        <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-right font-semibold text-gray-700 dark:text-gray-200 w-28">
                          Prix total HT
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-[10px] font-medium text-emerald-700 dark:text-emerald-100 align-middle">
                            auto
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r, idx) => (
                        <tr
                          key={`${r.index}-${idx}`}
                          className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900/70'}
                        >
                          <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">
                            {r.article || ''}
                          </td>
                          <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100">
                            {r.designation || <span className="text-gray-400 italic">Sans libellé</span>}
                          </td>
                          <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-right text-gray-800 dark:text-gray-100">
                            {r.quantity != null ? r.quantity.toLocaleString('fr-FR') : ''}
                          </td>
                          <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-200">
                            {r.unit || ''}
                          </td>
                          <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-right text-gray-800 dark:text-gray-100">
                            {r.unitPrice != null
                              ? r.unitPrice.toLocaleString('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                })
                              : ''}
                          </td>
                          <td className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 text-right font-semibold text-gray-900 dark:text-gray-50">
                            {r.computedTotal != null
                              ? r.computedTotal.toLocaleString('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                })
                              : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {rows.length > 0 && (
                      <tfoot>
                        <tr className="bg-emerald-50 dark:bg-emerald-900/40">
                          <td
                            colSpan={2}
                            className="px-3 py-2 border-t border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-50"
                          >
                            Totaux
                          </td>
                          <td className="px-3 py-2 border-t border-emerald-200 dark:border-emerald-800 text-right text-xs text-emerald-800 dark:text-emerald-100">
                            {/* total quantités si toutes numériques */}
                          </td>
                          <td className="px-3 py-2 border-t border-emerald-200 dark:border-emerald-800" />
                          <td className="px-3 py-2 border-t border-emerald-200 dark:border-emerald-800 text-right text-xs text-emerald-800 dark:text-emerald-100">
                            {rows.length} postes
                          </td>
                          <td className="px-3 py-2 border-t border-emerald-200 dark:border-emerald-800 text-right font-bold text-emerald-900 dark:text-emerald-50">
                            {stats.totalHT.toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

