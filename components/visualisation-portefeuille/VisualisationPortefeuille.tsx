// ============================================================
// VisualisationPortefeuille — Module de visualisation
// Matrices bubble chart : Contraintes (CI/CE) et O/R
// Données stockées dans Supabase (visu_portefeuille_elements)
// ============================================================

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from 'react';
import * as XLSX from 'xlsx';
import { Upload, BarChart2, RefreshCw, CheckCircle, AlertCircle, Loader2, ChevronDown, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PortfolioElement {
  id: number;
  titre: string;
  famille: string;
  sousFamille: string;
  segment: string;
  acheteur: string;
  couvertureContractuelle: string;
  totalOpportun: number;
  totalRisques: number;
  totalCIT: number;
  totalCIC: number;
  totalCET: number;
  totalCEC: number;
  // Annotations persistées en base
  displayName: string;
  montant: number;
}

// ─── Constantes ─────────────────────────────────────────────────────────────────

const BUBBLE_COLORS = [
  '#2F5B58',
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#10B981',
  '#F97316',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

const MIN_R = 8;
const MAX_R = 36;
const DEFAULT_R = 14;


// ─── Helpers ────────────────────────────────────────────────────────────────────

function safeNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function formatCA(val: number): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1).replace('.', ',')}M`;
  return `${Math.round(val)}k`;
}

function findColIndex(header: unknown[], terms: string[]): number {
  for (let i = 0; i < header.length; i++) {
    const cell = String(header[i] ?? '').toLowerCase();
    for (const t of terms) {
      if (cell.includes(t.toLowerCase())) return i;
    }
  }
  return -1;
}

// ─── Lecture Excel ───────────────────────────────────────────────────────────────

interface RawElement {
  id: number;
  titre: string;
  famille: string;
  sousFamille: string;
  segment: string;
  acheteur: string;
  couvertureContractuelle: string;
  totalOpportun: number;
  totalRisques: number;
  totalCIT: number;
  totalCIC: number;
  totalCET: number;
  totalCEC: number;
  montant: number | null;
}

function parseExcel(buffer: ArrayBuffer): RawElement[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
  }) as unknown[][];

  if (rows.length < 2) return [];

  const header = rows[0] as unknown[];
  const iID = 0;
  const iTitre = 1;

  // Termes ordonnés du plus spécifique au plus général pour éviter les faux matchs
  const iFamille      = findColIndex(header, ["famille d'achat", 'famille']);
  const iSousFamille  = findColIndex(header, ["sous-famille d'achats", "sous-famille d'achat", "sous famille d'achats", "sous famille d'achat", 'sous-famille', 'sous famille']);
  const iSegment      = findColIndex(header, ['segment']);
  const iAcheteur   = findColIndex(header, ['acheteur']);
  const iCouverture = findColIndex(header, ['couverture']);
  const iOpportun   = findColIndex(header, ['total_opportun', 'total opportun', 'opportun']);
  const iRisques    = findColIndex(header, ['total_risques', 'total risques']);
  const iCIT        = findColIndex(header, ['total_cit', 'cit']);
  const iCIC        = findColIndex(header, ['total_cic', 'cic']);
  const iCET        = findColIndex(header, ['total_cet', 'cet']);
  const iCEC        = findColIndex(header, ['total_cec', 'cec']);
  // Colonne AT (index 45) pour le montant en k€
  const iMontantNamed = findColIndex(header, ['montant', 'ca (k', 'budget', 'k€', 'ke']);
  const iMontant    = iMontantNamed >= 0 ? iMontantNamed : 45;

  const elements: RawElement[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    const id = safeNum(row[iID]);
    if (!id) continue;

    elements.push({
      id,
      titre:      String(row[iTitre] ?? '').trim(),
      famille:    iFamille     >= 0 ? String(row[iFamille]     ?? '').trim() : '',
      sousFamille: iSousFamille >= 0 ? String(row[iSousFamille] ?? '').trim() : '',
      segment:    iSegment     >= 0 ? String(row[iSegment]     ?? '').trim() : '',
      acheteur: iAcheteur  >= 0 ? String(row[iAcheteur] ?? '').trim() : '',
      couvertureContractuelle: iCouverture >= 0 ? String(row[iCouverture] ?? '').trim() : '',
      totalOpportun: iOpportun >= 0 ? safeNum(row[iOpportun]) : 0,
      totalRisques:  iRisques  >= 0 ? safeNum(row[iRisques]) : 0,
      totalCIT: iCIT >= 0 ? safeNum(row[iCIT]) : 0,
      totalCIC: iCIC >= 0 ? safeNum(row[iCIC]) : 0,
      totalCET: iCET >= 0 ? safeNum(row[iCET]) : 0,
      totalCEC: iCEC >= 0 ? safeNum(row[iCEC]) : 0,
      montant:  row[iMontant] != null && row[iMontant] !== '' ? safeNum(row[iMontant]) || null : null,
    });
  }

  return elements;
}

// ─── Score couleur pour dot (matrice OR) ─────────────────────────────────────────

function dotColor(el: PortfolioElement, midOR: number): string {
  const x = el.totalRisques;
  const y = el.totalOpportun;
  if (x >= midOR && y >= midOR) return '#8B5CF6'; // Stratégiques
  if (x < midOR  && y >= midOR) return '#F97316'; // Critiques
  if (x >= midOR && y < midOR)  return '#3B82F6'; // Leviers
  return '#10B981';                                // Simples
}

// ─── Supabase helpers ────────────────────────────────────────────────────────────

type DbRow = {
  id: number;
  titre: string;
  famille: string;
  sous_famille: string;
  segment: string;
  acheteur: string;
  couverture_contractuelle: string;
  total_opportun: number;
  total_risques: number;
  total_cit: number;
  total_cic: number;
  total_cet: number;
  total_cec: number;
  display_name: string | null;
  montant_k: number | null;
};

function dbToElement(row: DbRow): PortfolioElement {
  return {
    id:    row.id,
    titre: row.titre,
    famille: row.famille,
    sousFamille: row.sous_famille ?? '',
    segment: row.segment,
    acheteur: row.acheteur,
    couvertureContractuelle: row.couverture_contractuelle,
    totalOpportun: row.total_opportun,
    totalRisques:  row.total_risques,
    totalCIT: row.total_cit,
    totalCIC: row.total_cic,
    totalCET: row.total_cet,
    totalCEC: row.total_cec,
    displayName: row.display_name ?? '',
    montant: row.montant_k ?? 0,
  };
}

function rawToDbRow(raw: RawElement, existing?: PortfolioElement): DbRow {
  return {
    id:    raw.id,
    titre: raw.titre,
    famille: raw.famille,
    sous_famille: raw.sousFamille,
    segment: raw.segment,
    acheteur: raw.acheteur,
    couverture_contractuelle: raw.couvertureContractuelle,
    total_opportun: raw.totalOpportun,
    total_risques:  raw.totalRisques,
    total_cit: raw.totalCIT,
    total_cic: raw.totalCIC,
    total_cet: raw.totalCET,
    total_cec: raw.totalCEC,
    // Préserver le nom affiché existant ; montant vient de l'Excel (colonne AT)
    display_name: existing?.displayName ?? null,
    montant_k:    raw.montant,
  };
}

// ─── Composant principal ─────────────────────────────────────────────────────────

export function VisualisationPortefeuille({ isAdmin = false }: { isAdmin?: boolean }): React.ReactElement {
  const fileRef   = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const [elements,      setElements]      = useState<PortfolioElement[]>([]);
  const [selectedId,        setSelectedId]        = useState<number | null>(null);
  const [filterSegment,     setFilterSegment]     = useState('');
  const [filterFamille,     setFilterFamille]     = useState('');
  const [filterSousFamille, setFilterSousFamille] = useState('');
  const [filterAcheteur,    setFilterAcheteur]    = useState<string[]>([]);
  const [activeMatrix,      setActiveMatrix]      = useState<'contraintes' | 'or'>('or');

  // ── États Supabase ────────────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(true);
  const [importing,   setImporting]   = useState(false);
  const [saveStatus,  setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dbError,     setDbError]     = useState<string | null>(null);

  // ── Chargement initial depuis Supabase ───────────────────────────────────────

  const loadFromSupabase = useCallback(async () => {
    setLoading(true);
    setDbError(null);
    try {
      const { data, error } = await supabase
        .from('visu_portefeuille_elements')
        .select('*')
        .order('famille');

      if (error) throw error;
      if (data && data.length > 0) {
        setElements((data as DbRow[]).map(dbToElement));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setDbError(`Erreur chargement : ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromSupabase();
  }, [loadFromSupabase]);

  // ── Import Excel → Supabase ──────────────────────────────────────────────────

  const handleLoad = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        const rawElements = parseExcel(buf);
        if (rawElements.length === 0) return;

        setImporting(true);
        setDbError(null);

        try {
          // 1. Supprimer tout le contenu existant en base
          const { error: deleteError } = await supabase
            .from('visu_portefeuille_elements')
            .delete()
            .neq('id', -1); // condition toujours vraie = supprime tout
          if (deleteError) throw deleteError;

          // 2. Insérer les nouvelles lignes par batch de 100
          const rows: DbRow[] = rawElements.map(raw => rawToDbRow(raw));
          for (let i = 0; i < rows.length; i += 100) {
            const batch = rows.slice(i, i + 100);
            const { error } = await supabase
              .from('visu_portefeuille_elements')
              .insert(batch);
            if (error) throw error;
          }

          // 3. Recharger
          await loadFromSupabase();
          setSelectedId(null);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setDbError(`Erreur import : ${msg}`);
        } finally {
          setImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [elements, loadFromSupabase]
  );

  // ── Mise à jour annotation (nom / montant) avec debounce ─────────────────────

  const updateAnnotation = useCallback(
    async (id: number, patch: { display_name?: string; montant_k?: number }) => {
      setSaveStatus('saving');
      try {
        const { error } = await supabase
          .from('visu_portefeuille_elements')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    },
    []
  );

  const handleNameChange = useCallback(
    (id: number, val: string) => {
      // Mise à jour optimiste de l'état React
      setElements(prev =>
        prev.map(el => el.id === id ? { ...el, displayName: val } : el)
      );
      // Debounce 1.5s avant envoi en base
      clearTimeout(debounceRef.current[id]);
      debounceRef.current[id] = setTimeout(() => {
        updateAnnotation(id, { display_name: val || null as unknown as string });
      }, 1500);
    },
    [updateAnnotation]
  );

  const handleMontantChange = useCallback(
    (id: number, val: string) => {
      const n = parseFloat(val);
      const montant = isNaN(n) ? 0 : n;
      // Mise à jour optimiste
      setElements(prev =>
        prev.map(el => el.id === id ? { ...el, montant } : el)
      );
      clearTimeout(debounceRef.current[id + 100000]);
      debounceRef.current[id + 100000] = setTimeout(() => {
        updateAnnotation(id, { montant_k: montant || null as unknown as number });
      }, 1500);
    },
    [updateAnnotation]
  );

  // ── Filtres ──────────────────────────────────────────────────────────────────

  const segments     = Array.from(new Set(elements.map(e => e.segment).filter(Boolean))).sort();
  const familles     = Array.from(new Set(elements.map(e => e.famille).filter(Boolean))).sort();
  const sousFamilles = Array.from(new Set(elements.map(e => e.sousFamille).filter(Boolean))).sort();
  const acheteurs    = Array.from(new Set(elements.map(e => e.acheteur).filter(Boolean))).sort();

  const filtered = elements.filter(el => {
    if (filterSegment     && el.segment     !== filterSegment)     return false;
    if (filterFamille     && el.famille     !== filterFamille)     return false;
    if (filterSousFamille && el.sousFamille !== filterSousFamille) return false;
    if (filterAcheteur.length > 0 && !filterAcheteur.includes(el.acheteur)) return false;
    return true;
  });

  const selectedEl = elements.find(e => e.id === selectedId) ?? null;

  // ── Rayon bulle ──────────────────────────────────────────────────────────────

  const maxMontant = Math.max(0, ...elements.map(el => el.montant));

  // Médiane O/R calculée depuis les données réelles (pour la couleur des dots)
  const midOR = Math.max(
    ...elements.map(el => Math.max(el.totalRisques, el.totalOpportun)), 0
  ) / 2;

  function getBubbleRadius(id: number): number {
    const el = elements.find(e => e.id === id);
    const m = el?.montant ?? 0;
    if (m === 0 || maxMontant === 0) return DEFAULT_R;
    return MIN_R + ((m / maxMontant) * (MAX_R - MIN_R));
  }

  // ── Dessin canvas ────────────────────────────────────────────────────────────

  const drawMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = (canvas.width  = canvas.offsetWidth);
    const H = (canvas.height = canvas.offsetHeight);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    const PAD = { top: 45, right: 30, bottom: 55, left: 65 };
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top  - PAD.bottom;

    // ── Calcul dynamique de l'échelle depuis les données réelles ─────────────
    const xVals = filtered.map(el =>
      activeMatrix === 'contraintes' ? (el.totalCET + el.totalCEC) / 2 : el.totalRisques
    );
    const yVals = filtered.map(el =>
      activeMatrix === 'contraintes' ? (el.totalCIT + el.totalCIC) / 2 : el.totalOpportun
    );

    const rawMax = Math.max(0, ...xVals, ...yVals);
    // Arrondir au prochain "beau chiffre" pour une échelle lisible
    const niceMax = (() => {
      if (rawMax <= 0) return 10;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
      const candidates = [1, 2, 2.5, 5, 10].map(f => f * magnitude);
      return candidates.find(c => c >= rawMax) ?? rawMax * 1.2;
    })();
    const MAX_VAL = niceMax;
    const MID_VAL = MAX_VAL / 2;
    // Nombre de graduations : 5 à 6 max, arrondi "propre"
    const STEP = (() => {
      const raw = MAX_VAL / 5;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      for (const f of [1, 2, 2.5, 5, 10]) {
        if (f * mag >= raw) return f * mag;
      }
      return raw;
    })();

    const toX = (v: number) => PAD.left + (v / MAX_VAL) * plotW;
    const toY = (v: number) => PAD.top  + plotH - (v / MAX_VAL) * plotH;

    // Fond
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(PAD.left, PAD.top, plotW, plotH);

    // Grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.8;
    for (let v = 0; v <= MAX_VAL; v += STEP) {
      const xg = toX(v); const yg = toY(v);
      ctx.beginPath(); ctx.moveTo(xg, PAD.top); ctx.lineTo(xg, PAD.top + plotH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD.left, yg); ctx.lineTo(PAD.left + plotW, yg); ctx.stroke();
    }

    // Échelle axes
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = 0; v <= MAX_VAL; v += STEP) ctx.fillText(String(v), toX(v), PAD.top + plotH + 6);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let v = 0; v <= MAX_VAL; v += STEP) ctx.fillText(String(v), PAD.left - 8, toY(v));

    // Médianes
    ctx.strokeStyle = 'rgba(239,68,68,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(toX(MID_VAL), PAD.top); ctx.lineTo(toX(MID_VAL), PAD.top + plotH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD.left, toY(MID_VAL)); ctx.lineTo(PAD.left + plotW, toY(MID_VAL)); ctx.stroke();
    ctx.setLineDash([]);

    // Labels quadrants
    const quadrantDefs = activeMatrix === 'contraintes'
      ? [
          { label: 'Achats Simples',    x: PAD.left + plotW * 0.25, y: PAD.top + plotH * 0.80, color: '#16a34a' },
          { label: 'Achats Externes',   x: PAD.left + plotW * 0.75, y: PAD.top + plotH * 0.80, color: '#d97706' },
          { label: 'Achats Internes',   x: PAD.left + plotW * 0.25, y: PAD.top + plotH * 0.18, color: '#2563eb' },
          { label: 'Achats Difficiles', x: PAD.left + plotW * 0.75, y: PAD.top + plotH * 0.18, color: '#dc2626' },
        ]
      : [
          { label: 'Achats Simples',      x: PAD.left + plotW * 0.25, y: PAD.top + plotH * 0.80, color: '#16a34a' },
          { label: 'Achats Leviers',      x: PAD.left + plotW * 0.75, y: PAD.top + plotH * 0.80, color: '#2563eb' },
          { label: 'Achats Critiques',    x: PAD.left + plotW * 0.25, y: PAD.top + plotH * 0.18, color: '#d97706' },
          { label: 'Achats Stratégiques', x: PAD.left + plotW * 0.75, y: PAD.top + plotH * 0.18, color: '#6c63ff' },
        ];

    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textBaseline = 'middle';
    quadrantDefs.forEach(({ label, x, y, color }) => {
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y);
    });
    ctx.globalAlpha = 1;

    // Titre matrice
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(
      activeMatrix === 'contraintes' ? 'Matrice des Contraintes' : 'Matrice Opportunités / Risques',
      PAD.left + plotW / 2,
      8
    );

    // Labels axes
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      activeMatrix === 'contraintes' ? 'Contraintes Externes (CE)' : 'Risques',
      PAD.left + plotW / 2,
      H - 4
    );
    ctx.save();
    ctx.translate(14, PAD.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'top';
    ctx.fillText(
      activeMatrix === 'contraintes' ? 'Contraintes internes (CI)' : 'Opportunités',
      0, 0
    );
    ctx.restore();

    // Bulles
    filtered.forEach((el, idx) => {
      const xVal = activeMatrix === 'contraintes'
        ? (el.totalCET + el.totalCEC) / 2
        : el.totalRisques;
      const yVal = activeMatrix === 'contraintes'
        ? (el.totalCIT + el.totalCIC) / 2
        : el.totalOpportun;

      const r  = getBubbleRadius(el.id);
      const cx = Math.min(Math.max(toX(xVal), PAD.left + r + 2), PAD.left + plotW - r - 2);
      const cy = Math.min(Math.max(toY(yVal), PAD.top  + r + 2), PAD.top  + plotH - r - 2);

      const color = BUBBLE_COLORS[idx % BUBBLE_COLORS.length];
      const isSelected = el.id === selectedId;

      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur  = 4;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color + 'dd';
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 2;
      ctx.stroke();
      ctx.strokeStyle = isSelected ? '#1f2937' : color;
      ctx.lineWidth   = isSelected ? 2.5 : 1;
      ctx.stroke();

      // Montant dans la bulle
      const montant = el.montant;
      if (r > 14 && montant > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.min(12, r * 0.55)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatCA(montant), cx, cy);
      }

      // Label avec halo blanc
      const name = el.displayName || el.famille;
      ctx.font = '9.5px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth   = 3;
      ctx.lineJoin    = 'round';
      ctx.strokeText(name, cx, cy + r + 4);
      ctx.fillStyle = '#1f2937';
      ctx.fillText(name, cx, cy + r + 4);
    });

    ctx.textBaseline = 'alphabetic';
    ctx.shadowBlur   = 0;

    // Bordure
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth   = 1;
    ctx.strokeRect(PAD.left, PAD.top, plotW, plotH);
  }, [filtered, activeMatrix, selectedId, elements]);

  // ── Clic canvas ──────────────────────────────────────────────────────────────

  const handleCanvasClick = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const W    = canvas.width;
      const H    = canvas.height;
      const mx   = (e.clientX - rect.left) * (W / rect.width);
      const my   = (e.clientY - rect.top)  * (H / rect.height);

      const PAD    = { top: 45, right: 30, bottom: 55, left: 65 };
      const plotW  = W - PAD.left - PAD.right;
      const plotH  = H - PAD.top  - PAD.bottom;

      // Même calcul dynamique que drawMatrix
      const xVals = filtered.map(el =>
        activeMatrix === 'contraintes' ? (el.totalCET + el.totalCEC) / 2 : el.totalRisques
      );
      const yVals = filtered.map(el =>
        activeMatrix === 'contraintes' ? (el.totalCIT + el.totalCIC) / 2 : el.totalOpportun
      );
      const rawMax = Math.max(0, ...xVals, ...yVals);
      const niceMax = (() => {
        if (rawMax <= 0) return 10;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
        const candidates = [1, 2, 2.5, 5, 10].map(f => f * magnitude);
        return candidates.find(c => c >= rawMax) ?? rawMax * 1.2;
      })();
      const MAX_VAL = niceMax;

      const toX = (v: number) => PAD.left + (v / MAX_VAL) * plotW;
      const toY = (v: number) => PAD.top  + plotH - (v / MAX_VAL) * plotH;

      let hitId: number | null = null;
      let hitDist = Infinity;

      filtered.forEach(el => {
        const xVal = activeMatrix === 'contraintes'
          ? (el.totalCET + el.totalCEC) / 2 : el.totalRisques;
        const yVal = activeMatrix === 'contraintes'
          ? (el.totalCIT + el.totalCIC) / 2 : el.totalOpportun;

        const r  = getBubbleRadius(el.id);
        const cx = Math.min(Math.max(toX(xVal), PAD.left + r + 2), PAD.left + plotW - r - 2);
        const cy = Math.min(Math.max(toY(yVal), PAD.top  + r + 2), PAD.top  + plotH - r - 2);

        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        if (dist < r && dist < hitDist) { hitDist = dist; hitId = el.id; }
      });

      setSelectedId(hitId);
    },
    [filtered, activeMatrix, elements]
  );

  // ── useEffect dessin / resize / clic ─────────────────────────────────────────

  useEffect(() => { drawMatrix(); }, [drawMatrix]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.onclick = handleCanvasClick;
    return () => { canvas.onclick = null; };
  }, [handleCanvasClick]);

  useEffect(() => {
    const observer = new ResizeObserver(() => drawMatrix());
    const canvas   = canvasRef.current;
    if (canvas) observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawMatrix]);

  // ─── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: '#2F5B58' }}>
        <div>
          <h2 className="text-lg font-semibold text-white">Visualisation des Analyses de Portefeuilles</h2>
          <p className="text-xs text-teal-200">
            {loading ? 'Chargement…' : `${elements.length} élément${elements.length !== 1 ? 's' : ''} en base`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicateur de sauvegarde */}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-xs text-teal-200">
              <Loader2 size={13} className="animate-spin" /> Sauvegarde…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-green-300">
              <CheckCircle size={13} /> Sauvegardé
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-300">
              <AlertCircle size={13} /> Erreur
            </span>
          )}

          {/* Rafraîchir */}
          <button
            onClick={loadFromSupabase}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            title="Recharger depuis Supabase"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Import Excel — admin uniquement */}
          {isAdmin && (
            <>
              <input ref={fileRef} type="file" accept=".xlsx" onChange={handleLoad} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                title="Remplace toutes les données Supabase par le contenu du fichier Excel"
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {importing ? 'Import en cours…' : 'Remplacer (Excel)'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Erreur DB */}
      {dbError && (
        <div className="mx-4 mt-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={15} />
          {dbError}
        </div>
      )}

      {/* Corps */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 gap-3">
          <Loader2 size={28} className="animate-spin" />
          <span>Chargement depuis Supabase…</span>
        </div>
      ) : elements.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
          <BarChart2 size={56} strokeWidth={1} />
          <p className="text-base text-center max-w-xs">
            Aucune donnée en base. Chargez un fichier Excel pour initialiser les analyses.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Colonne gauche : liste ── */}
          <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 space-y-1.5">
              {/* Groupe 1 — Segment / Famille / Sous-famille */}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Catégorie</p>
              <select
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={filterSegment}
                onChange={e => setFilterSegment(e.target.value)}
              >
                <option value="">Tous les segments</option>
                {segments.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={filterFamille}
                onChange={e => setFilterFamille(e.target.value)}
              >
                <option value="">Toutes les familles</option>
                {familles.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={filterSousFamille}
                onChange={e => setFilterSousFamille(e.target.value)}
              >
                <option value="">Toutes les sous-familles</option>
                {sousFamilles.map(sf => <option key={sf} value={sf}>{sf}</option>)}
              </select>

              {/* Séparateur */}
              <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Acheteur</p>
                <MultiSelectAcheteur
                  options={acheteurs}
                  selected={filterAcheteur}
                  onChange={setFilterAcheteur}
                />
              </div>

              <p className="text-xs text-gray-400 text-right pt-0.5">{filtered.length} / {elements.length}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.map(el => {
                const name     = el.displayName || el.famille;
                const isActive = el.id === selectedId;
                return (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(isActive ? null : el.id)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      isActive ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor(el, midOR) }} />
                      <span className="text-xs font-medium text-gray-800 truncate">{name}</span>
                    </div>
                    {el.sousFamille && <p className="text-[10px] text-teal-600 ml-4 truncate">{el.sousFamille}</p>}
                    {el.segment && <p className="text-[10px] text-gray-400 ml-4 truncate">{el.segment}</p>}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Colonne droite ── */}
          <main className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
            {/* Fiche identité */}
            {selectedEl && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">Fiche — {selectedEl.famille}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {selectedEl.sousFamille && <span className="text-xs text-teal-600 font-medium">{selectedEl.sousFamille}</span>}
                      {selectedEl.segment && <span className="text-xs text-gray-500">{selectedEl.segment}</span>}
                    </div>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nom d'affichage</label>
                    <input
                      type="text"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={selectedEl.displayName}
                      placeholder={selectedEl.famille}
                      onChange={e => handleNameChange(selectedEl.id, e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Montant (k€)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={selectedEl.montant || ''}
                      placeholder="0"
                      onChange={e => handleMontantChange(selectedEl.id, e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <ScoreBadge label="Risques"       value={selectedEl.totalRisques}  color="bg-red-50 text-red-700" />
                  <ScoreBadge label="Opportunités"  value={selectedEl.totalOpportun} color="bg-purple-50 text-purple-700" />
                  <ScoreBadge label="CI (interne)"  value={(selectedEl.totalCIT + selectedEl.totalCIC) / 2} color="bg-blue-50 text-blue-700" />
                  <ScoreBadge label="CE (externe)"  value={(selectedEl.totalCET + selectedEl.totalCEC) / 2} color="bg-orange-50 text-orange-700" />
                  <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                    <span className="text-gray-500">Couverture contractuelle</span>
                    <span className="font-medium text-gray-800 ml-auto">{selectedEl.couvertureContractuelle || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Matrices */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMatrix('or')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeMatrix === 'or' ? 'bg-[#2F5B58] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Matrice O/R
                </button>
                <button
                  onClick={() => setActiveMatrix('contraintes')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeMatrix === 'contraintes' ? 'bg-[#2F5B58] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Matrice Contraintes
                </button>
              </div>

              <canvas ref={canvasRef} className="w-full cursor-crosshair" style={{ height: 380 }} />

              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                {activeMatrix === 'or' ? (
                  <>
                    <LegendDot color="#10B981" label="Simples (bas R / bas O)" />
                    <LegendDot color="#3B82F6" label="Leviers (haut R / bas O)" />
                    <LegendDot color="#F97316" label="Critiques (bas R / haut O)" />
                    <LegendDot color="#8B5CF6" label="Stratégiques (haut R / haut O)" />
                  </>
                ) : (
                  <>
                    <LegendDot color="#10B981" label="Achats Simples" />
                    <LegendDot color="#F97316" label="Achats Externes" />
                    <LegendDot color="#3B82F6" label="Achats Internes" />
                    <LegendDot color="#EF4444" label="Achats Difficiles" />
                  </>
                )}
                <span className="text-gray-400 ml-auto italic">Taille des bulles proportionnelle au montant (k€)</span>
              </div>
            </div>

            {/* ── Tableau des valeurs ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Tableau des valeurs</h4>
                <span className="text-xs text-gray-400">{filtered.length} élément{filtered.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-[180px]">Famille</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 min-w-[150px]">Sous-famille</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 min-w-[120px]">Segment</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600 min-w-[120px]">Acheteur</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Montant (k€)</th>
                      <th className="text-right px-3 py-2 font-semibold text-red-600">Risques</th>
                      <th className="text-right px-3 py-2 font-semibold text-purple-600">Opportunités</th>
                      <th className="text-right px-3 py-2 font-semibold text-blue-600">CI</th>
                      <th className="text-right px-3 py-2 font-semibold text-orange-600">CE</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Couverture</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Positionnement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((el, idx) => {
                      const ci = (el.totalCIT + el.totalCIC) / 2;
                      const ce = (el.totalCET + el.totalCEC) / 2;
                      const isSelected = el.id === selectedId;
                      const color = BUBBLE_COLORS[idx % BUBBLE_COLORS.length];
                      const pos = (() => {
                        const x = el.totalRisques; const y = el.totalOpportun;
                        if (x >= midOR && y >= midOR) return { label: 'Stratégique', cls: 'text-purple-700 bg-purple-50' };
                        if (x < midOR  && y >= midOR) return { label: 'Critique',    cls: 'text-orange-700 bg-orange-50' };
                        if (x >= midOR && y < midOR)  return { label: 'Levier',      cls: 'text-blue-700 bg-blue-50' };
                        return { label: 'Simple', cls: 'text-green-700 bg-green-50' };
                      })();
                      return (
                        <tr
                          key={el.id}
                          onClick={() => setSelectedId(isSelected ? null : el.id)}
                          className={`border-b border-gray-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-50' : idx % 2 === 0 ? 'hover:bg-gray-50' : 'bg-gray-50/40 hover:bg-gray-100/60'
                          }`}
                        >
                          <td className={`px-3 py-2 sticky left-0 font-medium ${isSelected ? 'bg-teal-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              {el.displayName || el.famille}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-teal-700 font-medium">{el.sousFamille || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{el.segment || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{el.acheteur || '—'}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-800">
                            {el.montant > 0 ? el.montant.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—'}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-red-600">{el.totalRisques.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-purple-600">{el.totalOpportun.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-blue-600">{ci.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-orange-600">{ce.toFixed(1)}</td>
                          <td className="px-3 py-2 text-gray-500">{el.couvertureContractuelle || '—'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${pos.cls}`}>{pos.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────────

function MultiSelectAcheteur({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(v => v !== opt) : [...selected, opt]);
  };

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  const label = selected.length === 0
    ? 'Tous les acheteurs'
    : selected.length === 1
    ? selected[0]
    : `${selected.length} acheteurs`;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors ${
          selected.length > 0 ? 'border-teal-500 text-teal-700 font-medium' : 'border-gray-200 text-gray-700'
        }`}
      >
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {selected.length > 0 && (
            <span
              onMouseDown={e => { e.stopPropagation(); onChange([]); setSearch(''); }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.stopPropagation()}
              placeholder="Rechercher…"
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400 italic">Aucun résultat</p>
            )}
            {filtered.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-teal-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="accent-teal-600 w-3.5 h-3.5 flex-shrink-0"
                />
                <span className={selected.includes(opt) ? 'font-medium text-teal-700' : 'text-gray-800'}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ label, value, color }: { label: string; value: number; color: string }): React.ReactElement {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${color}`}>
      <span>{label}</span>
      <span className="font-bold ml-2">{value.toFixed(1)}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }): React.ReactElement {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
