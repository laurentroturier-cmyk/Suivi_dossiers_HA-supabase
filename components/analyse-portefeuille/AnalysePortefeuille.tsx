// ============================================
// AnalysePortefeuille — Module Admin
// Analyse stratégique du portefeuille achats
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  RefreshCw, Package, TrendingUp, AlertTriangle, BarChart2,
  Shield, Zap, FileText, Info, Download, Upload, FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SegmentationRow {
  dna_segment: string;
  dna_famille: string | null;
  dna_sousfamille: string | null;
}

// Hierarchy: segment → famille → sous-familles[]
type Hierarchy = Record<string, Record<string, string[]>>;

interface FamilleAchat {
  nom: string;      // segment | famille | sous-famille selon niveau
  niveau: 'segment' | 'famille' | 'sousfamille';
  parent?: string;  // segment parent (pour niveau famille/sousfamille)
}

type NiveauAnalyse = 'segment' | 'famille' | 'sousfamille';

interface ContrainteNote { note: number; evo: number }

// ─── Constantes ───────────────────────────────────────────────────────────────


const CIT_ITEMS = [
  "Difficultés d'homologation venant des clients",
  "Diversité des outillages requis",
  "Dossier technique incomplet",
  "Qualité demandée inhabituelle sur le marché",
  "Services techniques peu ouverts aux produits de substitution",
];
const CIC_ITEMS = [
  "Connaissance tardive des besoins",
  "Fournisseur imposé",
  "Limites géographiques imposées en interne",
  "Lourdeurs administratives créant un frein à l'achat",
  "Manque de communication interne",
];
const CET_ITEMS = [
  "Dépendance technique vis-à-vis du fournisseur",
  "Coût de transfert d'outillage",
  "Maîtrise de la technologie par très peu de fournisseurs",
  "Normes strictes sur l'écologie et le recyclage",
  "Manque de flexibilité des fournisseurs",
];
const CEC_ITEMS = [
  "Entente sur le marché des fournisseurs",
  "Instabilité sur le marché",
  "Réglementation contraignante",
  "Situation relationnelle tendue",
  "Usages de la profession contraignants",
];

const RISQUES_TECH = [
  "Arrêt de production pour panne fournisseur", "Non-respect des délais d'intervention",
  "Obsolescence technologique du fournisseur", "Défaut qualité récurrent", "Perte de savoir-faire fournisseur",
];
const RISQUES_COM = [
  "Dépendance vis-à-vis d'un fournisseur unique", "Risque juridique contractuel",
  "Défaillance financière du fournisseur", "Entente ou monopole sur le marché", "Fournisseur imposé par le client",
];
const RISQUES_LOG = [
  "Délais de livraison non respectés", "Rupture de stock critique",
  "Problèmes de transport / douane", "Emballage inadapté / dommages", "Variabilité des délais",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scaleTo50(arr: ContrainteNote[]): number {
  const sum = arr.reduce((s, x) => s + x.note, 0);
  return Math.round((sum / (arr.length * 5)) * 50);
}

function quadrant(ci: number, ce: number): { label: string; color: string } {
  if (ci < 50 && ce < 50) return { label: 'Achats simples', color: 'bg-green-100 text-green-700' };
  if (ci >= 50 && ce < 50) return { label: 'Achats internes', color: 'bg-blue-100 text-blue-700' };
  if (ci < 50 && ce >= 50) return { label: 'Achats externes', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Achats difficiles', color: 'bg-red-100 text-red-700' };
}

// ─── Composants de base ───────────────────────────────────────────────────────

function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; count?: number | string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
        active
          ? 'border-[#2F5B58] text-[#2F5B58] bg-white'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-[#2F5B58] text-white' : 'bg-gray-200 text-gray-600'
        }`}>{count}</span>
      )}
    </button>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
      {icon && <span className="text-[#2F5B58]">{icon}</span>}
      <h3 className="text-xs font-bold text-[#2F5B58] uppercase tracking-wider">{title}</h3>
    </div>
  );
}

function SliderRow({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] text-gray-600 flex-1 leading-tight">{label}</span>
      <div className="flex items-center gap-2 w-48">
        <input
          type="range" min={0} max={5} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          className="flex-1 h-1.5 accent-[#2F5B58] cursor-pointer"
        />
        <span className="text-xs font-bold text-[#2F5B58] w-4 text-center">{value}</span>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AnalysePortefeuille() {
  const [activeTab, setActiveTab]       = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // ── Segmentation ──────────────────────────────────────────────────────────
  const [hierarchy, setHierarchy]       = useState<Hierarchy>({});
  const [niveauAnalyse, setNiveauAnalyse] = useState<NiveauAnalyse>('famille');

  // Cascade de sélection (pour filtrer l'affichage)
  const [cascadeSegment, setCascadeSegment]         = useState('');
  const [cascadeFamille, setCascadeFamille]         = useState('');

  // Cascade de sélection pour l'analyse (onglets 1-7) — toujours segment → famille → sous-famille
  const [analysisSegment, setAnalysisSegment]         = useState('');
  const [analysisFamille, setAnalysisFamille]         = useState('');
  const [analysisSousfamille, setAnalysisSousfamille] = useState('');

  // ── Stores d'analyse (clé = nom du niveau sélectionné) ───────────────────
  const [contraintesStore, setContraintesStore] = useState<Record<string, {
    cit: ContrainteNote[]; cic: ContrainteNote[]; cet: ContrainteNote[]; cec: ContrainteNote[];
  }>>({});
  const [risquesStore, setRisquesStore] = useState<Record<string, {
    tech: { prob: number; delai: number }[];
    com:  { prob: number; delai: number }[];
    log:  { prob: number; delai: number }[];
  }>>({});
  const [swotStore, setSwotStore] = useState<Record<string, {
    s: string[]; w: string[]; o: string[]; t: string[];
  }>>({});
  const [profitStore, setProfitStore] = useState<Record<string, number>>({});

  // ─── Chargement de la segmentation depuis Referentiel_segmentation ────────
  const fetchFamilles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from('Referentiel_segmentation')
        .select('dna_segment, dna_famille, dna_sousfamille')
        .not('dna_segment', 'is', null);

      if (e) throw e;

      // Construire la hiérarchie segment → famille → sous-familles[]
      const hier: Hierarchy = {};
      (data || []).forEach((row: SegmentationRow) => {
        const seg = (row.dna_segment || '').trim();
        const fam = (row.dna_famille || '').trim();
        const sf  = (row.dna_sousfamille || '').trim();
        if (!seg) return;
        if (!hier[seg]) hier[seg] = {};
        if (fam) {
          if (!hier[seg][fam]) hier[seg][fam] = [];
          if (sf && !hier[seg][fam].includes(sf)) hier[seg][fam].push(sf);
        }
      });
      setHierarchy(hier);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Réinitialiser la cascade d'affichage quand le niveau change
  useEffect(() => {
    setCascadeSegment('');
    setCascadeFamille('');
  }, [niveauAnalyse]);

  // Clé d'analyse = niveau le plus fin sélectionné dans la cascade d'analyse
  const analysisKey = analysisSousfamille || analysisFamille || analysisSegment;
  const analysisNiveau = analysisSousfamille ? 'sous-famille' : analysisFamille ? 'famille' : analysisSegment ? 'segment' : '';

  useEffect(() => { fetchFamilles(); }, [fetchFamilles]);

  // ─── Persistence localStorage ─────────────────────────────────────────────
  // Chargement au montage du composant
  useEffect(() => {
    try {
      const saved = localStorage.getItem('analyse-portefeuille');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.contraintesStore) setContraintesStore(d.contraintesStore);
        if (d.risquesStore)     setRisquesStore(d.risquesStore);
        if (d.swotStore)        setSwotStore(d.swotStore);
        if (d.profitStore)      setProfitStore(d.profitStore);
        if (d.selection) {
          if (d.selection.analysisSegment)    setAnalysisSegment(d.selection.analysisSegment);
          if (d.selection.analysisFamille)    setAnalysisFamille(d.selection.analysisFamille);
          if (d.selection.analysisSousfamille) setAnalysisSousfamille(d.selection.analysisSousfamille);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionnellement vide — chargement unique au montage

  // Sauvegarde automatique à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem('analyse-portefeuille', JSON.stringify({
        contraintesStore,
        risquesStore,
        swotStore,
        profitStore,
        selection: { analysisSegment, analysisFamille, analysisSousfamille },
      }));
    } catch {}
  }, [contraintesStore, risquesStore, swotStore, profitStore, analysisSegment, analysisFamille, analysisSousfamille]);

  // ─── Helpers contraintes ─────────────────────────────────────────────────
  const getContraintes = (famille: string) => contraintesStore[famille] || {
    cit: CIT_ITEMS.map(() => ({ note: 0, evo: 0 })),
    cic: CIC_ITEMS.map(() => ({ note: 0, evo: 0 })),
    cet: CET_ITEMS.map(() => ({ note: 0, evo: 0 })),
    cec: CEC_ITEMS.map(() => ({ note: 0, evo: 0 })),
  };

  const updateContrainte = (famille: string, cat: 'cit' | 'cic' | 'cet' | 'cec', idx: number, note: number) => {
    setContraintesStore(prev => {
      const current = prev[famille] || getContraintes(famille);
      const updated = { ...current, [cat]: current[cat].map((item, i) => i === idx ? { ...item, note } : item) };
      return { ...prev, [famille]: updated };
    });
  };

  const getCIScore = (famille: string) => {
    const c = getContraintes(famille);
    return scaleTo50(c.cit) + scaleTo50(c.cic);
  };
  const getCEScore = (famille: string) => {
    const c = getContraintes(famille);
    return scaleTo50(c.cet) + scaleTo50(c.cec);
  };

  // ─── Helpers risques ─────────────────────────────────────────────────────
  const getRisques = (famille: string) => risquesStore[famille] || {
    tech: RISQUES_TECH.map(() => ({ prob: 0, delai: 0 })),
    com:  RISQUES_COM.map(()  => ({ prob: 0, delai: 0 })),
    log:  RISQUES_LOG.map(()  => ({ prob: 0, delai: 0 })),
  };

  const updateRisque = (famille: string, cat: 'tech' | 'com' | 'log', idx: number, field: 'prob' | 'delai', val: number) => {
    setRisquesStore(prev => {
      const current = getRisques(famille);
      const updated = {
        ...current,
        [cat]: current[cat].map((r, i) => i === idx ? { ...r, [field]: val } : r),
      };
      return { ...prev, [famille]: updated };
    });
  };

  const getRisqueScore = (famille: string) => {
    const r = getRisques(famille);
    const score = (arr: { prob: number; delai: number }[]) =>
      arr.reduce((s, x) => s + x.prob * (6 - x.delai), 0);
    return Math.min(30, Math.round((score(r.tech) + score(r.com) + score(r.log)) / 3));
  };

  const getRisqueLevel = (prob: number, delai: number) => {
    const s = prob * (6 - delai);
    if (s >= 15) return { label: 'Fort', cls: 'bg-red-100 text-red-700' };
    if (s >= 8)  return { label: 'Moyen', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Faible', cls: 'bg-green-100 text-green-700' };
  };

  // ─── SWOT helpers ────────────────────────────────────────────────────────
  const getSwot = (famille: string) => swotStore[famille] || { s: [], w: [], o: [], t: [] };
  const addSwotItem = (famille: string, cat: 's' | 'w' | 'o' | 't', val: string) => {
    if (!val.trim()) return;
    setSwotStore(prev => {
      const current = getSwot(famille);
      return { ...prev, [famille]: { ...current, [cat]: [...current[cat], val.trim()] } };
    });
  };
  const removeSwotItem = (famille: string, cat: 's' | 'w' | 'o' | 't', idx: number) => {
    setSwotStore(prev => {
      const current = getSwot(famille);
      return { ...prev, [famille]: { ...current, [cat]: current[cat].filter((_, i) => i !== idx) } };
    });
  };

  // ─── Liste d'items dérivée de la hiérarchie + niveau d'analyse ──────────
  const familles: FamilleAchat[] = (() => {
    const segments = Object.keys(hierarchy).sort();
    if (niveauAnalyse === 'segment') {
      return segments.map(s => ({ nom: s, niveau: 'segment' as const }));
    }
    if (niveauAnalyse === 'famille') {
      const segs = cascadeSegment ? [cascadeSegment] : segments;
      const items: FamilleAchat[] = [];
      segs.forEach(seg => {
        Object.keys(hierarchy[seg] || {}).sort().forEach(fam => {
          items.push({ nom: fam, niveau: 'famille', parent: seg });
        });
      });
      return items;
    }
    // sous-famille
    const segs = cascadeSegment ? [cascadeSegment] : segments;
    const items: FamilleAchat[] = [];
    segs.forEach(seg => {
      const fams = cascadeFamille
        ? (hierarchy[seg]?.[cascadeFamille] ? [cascadeFamille] : [])
        : Object.keys(hierarchy[seg] || {});
      fams.forEach(fam => {
        (hierarchy[seg]?.[fam] || []).sort().forEach(sf => {
          items.push({ nom: sf, niveau: 'sousfamille', parent: fam });
        });
      });
    });
    return items;
  })();

  // ─── Sélection depuis le tableau → cascade + bascule onglet Contraintes ──
  const selectForAnalysis = useCallback((f: FamilleAchat) => {
    if (f.niveau === 'segment') {
      setAnalysisSegment(f.nom);
      setAnalysisFamille('');
      setAnalysisSousfamille('');
    } else if (f.niveau === 'famille') {
      setAnalysisSegment(f.parent || '');
      setAnalysisFamille(f.nom);
      setAnalysisSousfamille('');
    } else {
      // sous-famille : retrouver le segment parent dans la hiérarchie
      const parentFamille = f.parent || '';
      const parentSegment = Object.keys(hierarchy).find(seg =>
        hierarchy[seg]?.[parentFamille] !== undefined
      ) || '';
      setAnalysisSegment(parentSegment);
      setAnalysisFamille(parentFamille);
      setAnalysisSousfamille(f.nom);
    }
    setActiveTab(1);
  }, [hierarchy]);

  // ─── Calculs globaux ─────────────────────────────────────────────────────
  const countWithCI    = familles.filter(f => getCIScore(f.nom) > 0 || getCEScore(f.nom) > 0).length;
  const countDifficile = familles.filter(f => getCIScore(f.nom) >= 50 && getCEScore(f.nom) >= 50).length;
  const nbSegments     = Object.keys(hierarchy).length;
  const nbFamilles     = Object.values(hierarchy).reduce((s, f) => s + Object.keys(f).length, 0);
  const nbSousFamilles = Object.values(hierarchy).reduce((s, f) =>
    s + Object.values(f).reduce((ss, sf) => ss + sf.length, 0), 0);

  // ─── Refs pour export/import ─────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Export JSON ─────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      selection: { analysisSegment, analysisFamille, analysisSousfamille },
      contraintesStore,
      risquesStore,
      swotStore,
      profitStore,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-portefeuille-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysisSegment, analysisFamille, analysisSousfamille, contraintesStore, risquesStore, swotStore, profitStore]);

  // ─── Import JSON ─────────────────────────────────────────────────────────
  const importJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.contraintesStore) setContraintesStore(data.contraintesStore);
        if (data.risquesStore)     setRisquesStore(data.risquesStore);
        if (data.swotStore)        setSwotStore(data.swotStore);
        if (data.profitStore)      setProfitStore(data.profitStore);
        if (data.selection) {
          setAnalysisSegment(data.selection.analysisSegment || '');
          setAnalysisFamille(data.selection.analysisFamille || '');
          setAnalysisSousfamille(data.selection.analysisSousfamille || '');
        }
      } catch {
        alert('Fichier JSON invalide ou corrompu.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ─── Export Excel ─────────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Feuille 1 : Synthèse
    const syntheHeaders = ['Nom', 'Niveau', 'Parent', 'CI', 'CE', 'Risque', 'Positionnement', 'Levier'];
    const syntheRows = familles.map(f => {
      const ci = getCIScore(f.nom);
      const ce = getCEScore(f.nom);
      const risk = getRisqueScore(f.nom);
      const profit = profitStore[f.nom] || 0;
      const quad = quadrant(ci, ce);
      const levier = getLevier(ci, ce, risk, profit);
      return [f.nom, f.niveau, f.parent || '', ci || '', ce || '', risk || '', ci > 0 || ce > 0 ? quad.label : '', levier];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([syntheHeaders, ...syntheRows]), 'Synthèse');

    // Feuille 2 : Contraintes
    const ciHeaders = ['Élément', 'Catégorie', 'Item', 'Note (0-5)'];
    const ciRows: (string | number)[][] = [];
    Object.entries(contraintesStore).forEach(([key, val]) => {
      [
        { cat: 'CIT', items: CIT_ITEMS, notes: val.cit },
        { cat: 'CIC', items: CIC_ITEMS, notes: val.cic },
        { cat: 'CET', items: CET_ITEMS, notes: val.cet },
        { cat: 'CEC', items: CEC_ITEMS, notes: val.cec },
      ].forEach(({ cat, items, notes }) => {
        items.forEach((label, i) => ciRows.push([key, cat, label, notes[i]?.note ?? 0]));
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([ciHeaders, ...ciRows]), 'Contraintes');

    // Feuille 3 : Risques
    const riskHeaders = ['Élément', 'Catégorie', 'Risque', 'Probabilité', 'Délai réaction'];
    const riskRows: (string | number)[][] = [];
    Object.entries(risquesStore).forEach(([key, val]) => {
      [
        { cat: 'Technique', items: RISQUES_TECH, data: val.tech },
        { cat: 'Commercial', items: RISQUES_COM, data: val.com },
        { cat: 'Logistique', items: RISQUES_LOG, data: val.log },
      ].forEach(({ cat, items, data }) => {
        items.forEach((label, i) => riskRows.push([key, cat, label, data[i]?.prob ?? 0, data[i]?.delai ?? 0]));
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([riskHeaders, ...riskRows]), 'Risques');

    // Feuille 4 : SWOT
    const swotHeaders = ['Élément', 'Quadrant', 'Item'];
    const swotRows: string[][] = [];
    Object.entries(swotStore).forEach(([key, val]) => {
      (['s', 'w', 'o', 't'] as const).forEach(q => {
        const labels = { s: 'Forces', w: 'Faiblesses', o: 'Opportunités', t: 'Menaces' };
        (val[q] || []).forEach(item => swotRows.push([key, labels[q], item]));
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([swotHeaders, ...swotRows]), 'SWOT');

    XLSX.writeFile(wb, `analyse-portefeuille-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, [familles, contraintesStore, risquesStore, swotStore, profitStore, getCIScore, getCEScore, getRisqueScore]);

  // ─── Canvas matrice portefeuille ─────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab !== 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    // Grille de fond
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();

    // Étiquettes quadrants
    const labels = ['Achats\nSimples', 'Achats\nExternes', 'Achats\nInternes', 'Achats\nDifficiles'];
    const qx = [W*0.25, W*0.75, W*0.25, W*0.75];
    const qy = [H*0.75, H*0.75, H*0.25, H*0.25];
    const qc = ['#16a34a', '#d97706', '#2563eb', '#dc2626'];
    labels.forEach((lbl, i) => {
      ctx.font = '11px sans-serif'; ctx.fillStyle = qc[i]; ctx.globalAlpha = 0.25;
      ctx.textAlign = 'center';
      lbl.split('\n').forEach((line, li) => ctx.fillText(line, qx[i], qy[i] + li * 14 - 7));
    });
    ctx.globalAlpha = 1;

    // Bulles — afficher tous les éléments analysés (depuis contraintesStore)
    // Si aucun analysé, replier sur familles pour donner un aperçu visuel
    const analyzed = Object.keys(contraintesStore).filter(k => getCIScore(k) > 0 || getCEScore(k) > 0);
    const items = analyzed.length > 0 ? analyzed : familles.map(f => f.nom);

    items.forEach((nom) => {
      const ci = getCIScore(nom);
      const ce = getCEScore(nom);
      const x = (ci / 100) * (W - 40) + 20;
      const y = H - (ce / 100) * (H - 40) - 20;
      const r = 16;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = ci >= 50 && ce >= 50 ? 'rgba(220,38,38,0.2)' :
                      ci >= 50 ? 'rgba(37,99,235,0.2)' :
                      ce >= 50 ? 'rgba(217,119,6,0.2)' : 'rgba(22,163,74,0.2)';
      ctx.strokeStyle = ci >= 50 && ce >= 50 ? '#dc2626' :
                        ci >= 50 ? '#2563eb' :
                        ce >= 50 ? '#d97706' : '#16a34a';
      ctx.lineWidth = 1.5;
      ctx.fill(); ctx.stroke();

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      const label = nom.length > 12 ? nom.substring(0, 11) + '…' : nom;
      ctx.fillText(label, x, y + r + 12);
    });
  }, [activeTab, familles, contraintesStore]);

  // ─── Canvas matrice R/P ───────────────────────────────────────────────────
  const rpCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab !== 5) return;
    const canvas = rpCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();

    // Quadrants: X=Risques, Y=Opportunités
    // BL = faibles risques, faibles opport → Achats Simples
    // BR = forts risques, faibles opport  → Achats Critiques
    // TL = faibles risques, fortes opport → Achats Leviers
    // TR = forts risques, fortes opport   → Achats Stratégiques
    const qLabels = ['Achats\nSimples', 'Achats\nCritiques', 'Achats\nLeviers', 'Achats\nStratégiques'];
    const qx = [W*0.25, W*0.75, W*0.25, W*0.75];
    const qy = [H*0.75, H*0.75, H*0.25, H*0.25];
    const qc2 = ['#16a34a', '#d97706', '#2563eb', '#6c63ff'];
    qLabels.forEach((lbl, i) => {
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = qc2[i]; ctx.globalAlpha = 0.25;
      ctx.textAlign = 'center';
      const lines = lbl.split('\n');
      lines.forEach((line, li) => ctx.fillText(line, qx[i], qy[i] + li * 14));
    });
    ctx.globalAlpha = 1;

    // Axes labels
    ctx.font = '10px sans-serif'; ctx.fillStyle = '#6b7280'; ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.fillText('Risques →', W - 40, H - 6);
    ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('← Opportunités', 0, 0); ctx.restore();
    ctx.globalAlpha = 1;

    // Items analysés (risques ou opportunités renseignés) ou fallback familles
    const riskAnalyzed = Object.keys(risquesStore).filter(k => getRisqueScore(k) > 0);
    const opportunAnalyzed = Object.keys(profitStore).filter(k => (profitStore[k] || 0) > 0);
    const rpKeys = [...new Set([...riskAnalyzed, ...opportunAnalyzed])];
    const rpItems = rpKeys.length > 0 ? rpKeys : familles.map(f => f.nom);

    // Palette couleurs distinctes pour les bulles (comme Power BI)
    const PALETTE = ['#6c63ff', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#c2410c', '#059669', '#db2777'];

    rpItems.forEach((nom, idx) => {
      const risk    = getRisqueScore(nom);                // 0-30
      const opport  = (profitStore[nom] || 0);            // 0-5
      const x = (risk / 30) * (W - 60) + 30;             // X = Risques
      const y = H - (opport / 5) * (H - 60) - 30;       // Y = Opportunités (inversé)

      const isHighRisk   = risk   >= 15;  // seuil 50 %
      const isHighOpport = opport >= 2.5; // seuil 50 %

      const quadColor = !isHighRisk && !isHighOpport ? '#16a34a' :
                         isHighRisk && !isHighOpport ? '#2563eb' :
                        !isHighRisk &&  isHighOpport ? '#d97706' : '#6c63ff';

      const bubbleColor = PALETTE[idx % PALETTE.length];
      const r = 14 + Math.min(opport * 2, 12); // taille liée à l'opportunité

      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor + '33'; // 20% opacité
      ctx.strokeStyle = bubbleColor;
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();

      // Label
      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#1f2937'; ctx.textAlign = 'center';
      const short = nom.length > 14 ? nom.substring(0, 13) + '…' : nom;
      ctx.fillText(short, x, y + r + 10);

      // Dot quadrant indicator
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = quadColor; ctx.fill();
    });
  }, [activeTab, familles, risquesStore, profitStore]);

  // ─── Rendu des onglets ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement des familles d'achat…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
        <button onClick={fetchFamilles} className="ml-4 underline text-xs">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Portefeuille Achats — Analyse Stratégique</h2>
          <p className="text-xs text-gray-500 mt-0.5">{nbSegments} segments · {nbFamilles} familles · {nbSousFamilles} sous-familles</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Importer une analyse (JSON)"
          >
            <Upload className="w-3.5 h-3.5" /> Importer
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Exporter l'analyse (JSON)"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2F5B58] border border-[#2F5B58] rounded-lg hover:bg-[#254845]"
            title="Exporter l'analyse (Excel)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={fetchFamilles} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-3.5 h-3.5" /> Rafraîchir
          </button>
        </div>
      </div>

      {/* ── Sélecteur d'analyse global (persistant pour tous les onglets) ── */}
      <AnalysisCascadeSelector
        hierarchy={hierarchy}
        segment={analysisSegment}
        onSegment={s => { setAnalysisSegment(s); setAnalysisFamille(''); setAnalysisSousfamille(''); }}
        famille={analysisFamille}
        onFamille={f => { setAnalysisFamille(f); setAnalysisSousfamille(''); }}
        sousfamille={analysisSousfamille}
        onSousfamille={setAnalysisSousfamille}
        analysisKey={analysisKey}
        analysisNiveau={analysisNiveau}
      />

      {/* ── Onglets ── */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 rounded-t-xl -mx-0 sticky top-0 z-10 mt-3">
        {[
          { icon: <Package className="w-3.5 h-3.5" />, label: 'Familles d\'achat', count: familles.length },
          { icon: <BarChart2 className="w-3.5 h-3.5" />, label: 'Contraintes' },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Portefeuille' },
          { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: 'Risques Rupture' },
          { icon: <BarChart2 className="w-3.5 h-3.5" />, label: 'Opportunités' },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Matrice O/R' },
          { icon: <Shield className="w-3.5 h-3.5" />, label: 'Forces de Porter' },
          { icon: <Zap className="w-3.5 h-3.5" />, label: 'SWOT Achats' },
          { icon: <FileText className="w-3.5 h-3.5" />, label: 'Synthèse' },
        ].map((tab, i) => (
          <TabBtn key={i} active={activeTab === i} onClick={() => setActiveTab(i)}
            icon={tab.icon} label={tab.label} count={tab.count} />
        ))}
      </div>

      <div className="pt-4">

        {/* ═══════════════════════════════════════════════════
            ONGLET 0 — Familles d'achat (données Supabase)
        ═══════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div className="space-y-4">

            {/* Sélecteur niveau + cascade */}
            <Card className="p-4">
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Niveau d'analyse</label>
                  <div className="flex gap-2">
                    {(['segment', 'famille', 'sousfamille'] as NiveauAnalyse[]).map(n => (
                      <button
                        key={n}
                        onClick={() => setNiveauAnalyse(n)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          niveauAnalyse === n
                            ? 'bg-[#2F5B58] text-white border-[#2F5B58]'
                            : 'text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {n === 'segment' ? 'Segment' : n === 'famille' ? 'Famille' : 'Sous-famille'}
                      </button>
                    ))}
                  </div>
                </div>

                {niveauAnalyse !== 'segment' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">Filtrer par segment</label>
                    <select
                      value={cascadeSegment}
                      onChange={e => { setCascadeSegment(e.target.value); setCascadeFamille(''); }}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
                    >
                      <option value="">— Tous les segments —</option>
                      {Object.keys(hierarchy).sort().map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {niveauAnalyse === 'sousfamille' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-2">Filtrer par famille</label>
                    <select
                      value={cascadeFamille}
                      onChange={e => setCascadeFamille(e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
                    >
                      <option value="">— Toutes les familles —</option>
                      {(cascadeSegment
                        ? Object.keys(hierarchy[cascadeSegment] || {})
                        : [...new Set(Object.values(hierarchy).flatMap(h => Object.keys(h)))]
                      ).sort().map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </Card>

            {/* Stats globales */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Segments', value: nbSegments, color: 'border-[#2F5B58]' },
                { label: 'Familles', value: nbFamilles, color: 'border-teal-400' },
                { label: 'Sous-familles', value: nbSousFamilles, color: 'border-indigo-400' },
                { label: 'Éléments affichés', value: familles.length, color: 'border-amber-400' },
              ].map(s => (
                <Card key={s.label} className={`p-4 border-t-4 ${s.color}`}>
                  <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
                </Card>
              ))}
            </div>

            {/* Tableau des éléments */}
            <Card>
              <CardHeader title={`Référentiel segmentation — niveau : ${niveauAnalyse}`} icon={<Package className="w-4 h-4" />} />
              <div className="p-1">
                {familles.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Aucun élément trouvé pour ce niveau
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 font-semibold">#</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Nom</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Niveau</th>
                        <th className="text-left px-4 py-2.5 font-semibold">Parent</th>
                        <th className="text-center px-4 py-2.5 font-semibold">CI / CE</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Positionnement</th>
                        <th className="text-center px-4 py-2.5 font-semibold">Analyser</th>
                      </tr>
                    </thead>
                    <tbody>
                      {familles.map((f, i) => {
                        const ci = getCIScore(f.nom);
                        const ce = getCEScore(f.nom);
                        const quad = quadrant(ci, ce);
                        const isSelected = f.nom === analysisKey;
                        return (
                          <tr
                            key={f.nom + i}
                            onClick={() => selectForAnalysis(f)}
                            className={`border-b border-gray-50 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#e8f4f3] border-l-2 border-l-[#2F5B58]'
                                : 'hover:bg-[#f4faf9]'
                            }`}
                          >
                            <td className="px-4 py-2.5 text-gray-400 font-mono">{i + 1}</td>
                            <td className="px-4 py-2.5">
                              <span className={`font-semibold ${isSelected ? 'text-[#2F5B58]' : 'text-gray-800'}`}>{f.nom}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                f.niveau === 'segment' ? 'bg-[#e8f4f3] text-[#2F5B58]' :
                                f.niveau === 'famille' ? 'bg-indigo-50 text-indigo-700' :
                                'bg-amber-50 text-amber-700'
                              }`}>{f.niveau}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-[11px]">{f.parent || '—'}</td>
                            <td className="px-4 py-2.5 text-center">
                              {ci > 0 || ce > 0 ? (
                                <span className="font-mono text-[11px] text-gray-600">{ci} / {ce}</span>
                              ) : (
                                <span className="text-gray-300 text-[10px]">Non évalué</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {ci > 0 || ce > 0 ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${quad.color}`}>{quad.label}</span>
                              ) : (
                                <span className="text-gray-300 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {isSelected ? (
                                <span className="text-[10px] font-semibold text-[#2F5B58]">✓ Sélectionné</span>
                              ) : (
                                <span className="text-[10px] text-gray-400 group-hover:text-[#2F5B58]">→ Analyser</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>

            <div className="bg-[#e8f4f3] border border-[#a7d4d1] rounded-xl p-4 flex gap-3 text-sm text-[#1e3d3b]">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2F5B58]" />
              <div>
                <strong>Source : Referentiel_segmentation</strong> — Choisissez le niveau d'analyse (Segment, Famille, Sous-famille)
                puis filtrez via les sélecteurs en cascade. Chaque élément sélectionné dans les onglets suivants
                (Contraintes, Risques, SWOT…) est indépendant et identifié par son nom.
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 1 — Contraintes
        ═══════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {!analysisKey && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                Sélectionnez un segment (et optionnellement une famille / sous-famille) dans le sélecteur ci-dessus pour commencer l'analyse.
              </div>
            )}
            {analysisKey && (() => {
              const c = getContraintes(analysisKey);
              const groups = [
                { key: 'cit' as const, title: 'Contraintes Internes – Techniques',    color: 'text-indigo-600',  items: CIT_ITEMS },
                { key: 'cic' as const, title: 'Contraintes Internes – Commerciales',  color: 'text-teal-600',    items: CIC_ITEMS },
                { key: 'cet' as const, title: 'Contraintes Externes – Techniques',    color: 'text-amber-600',   items: CET_ITEMS },
                { key: 'cec' as const, title: 'Contraintes Externes – Commerciales',  color: 'text-red-600',     items: CEC_ITEMS },
              ];
              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    {groups.map(g => (
                      <Card key={g.key}>
                        <CardHeader title={g.title} />
                        <div className="p-4">
                          {g.items.map((label, idx) => (
                            <SliderRow
                              key={idx} label={label}
                              value={c[g.key][idx]?.note ?? 0}
                              onChange={v => updateContrainte(analysisKey, g.key, idx, v)}
                            />
                          ))}
                          <div className="mt-3 text-right text-xs font-semibold text-[#2F5B58]">
                            Score : {scaleTo50(c[g.key])} / 50
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-8">
                        <div>
                          <span className="text-xs text-gray-500">Contraintes Internes (CI)</span>
                          <div className="text-2xl font-bold text-indigo-600">{getCIScore(analysisKey)} <span className="text-sm text-gray-400">/ 100</span></div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Contraintes Externes (CE)</span>
                          <div className="text-2xl font-bold text-amber-600">{getCEScore(analysisKey)} <span className="text-sm text-gray-400">/ 100</span></div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Positionnement</span>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${quadrant(getCIScore(analysisKey), getCEScore(analysisKey)).color}`}>
                              {quadrant(getCIScore(analysisKey), getCEScore(analysisKey)).label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 italic">Évaluation automatiquement sauvegardée</div>
                    </div>
                  </Card>
                </>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 2 — Matrice Portefeuille
        ═══════════════════════════════════════════════════ */}
        {activeTab === 2 && (() => {
          const analyzedItems = Object.keys(contraintesStore).filter(k => getCIScore(k) > 0 || getCEScore(k) > 0);
          const difficiles = analyzedItems.filter(k => getCIScore(k) >= 50 && getCEScore(k) >= 50).length;
          return (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Éléments analysés', value: analyzedItems.length, color: 'border-[#2F5B58]' },
                { label: 'Éléments affichés (Tab 0)', value: familles.length, color: 'border-teal-400' },
                { label: 'Avec scores CI/CE', value: analyzedItems.length, color: 'border-amber-400' },
                { label: 'Achats difficiles', value: difficiles, color: 'border-red-400' },
              ].map(s => (
                <Card key={s.label} className={`p-4 border-t-4 ${s.color}`}>
                  <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader title="Matrice Portefeuille — Contraintes Internes vs Externes" />
              <div className="p-4">
                <div className="flex gap-2 mb-2">
                  <span className="text-[10px] text-gray-500 font-medium rotate-[-90deg] flex items-center justify-center" style={{ writingMode: 'vertical-rl', minWidth: 20 }}>CE ↑</span>
                  <div className="flex-1">
                    <canvas ref={canvasRef} className="w-full rounded-lg border border-gray-100" style={{ height: 440 }} />
                  </div>
                </div>
                <div className="text-center text-[10px] text-gray-500 mt-1">CI →</div>
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                  {[
                    { label: 'Achats simples', color: 'bg-green-500' },
                    { label: 'Achats internes', color: 'bg-blue-500' },
                    { label: 'Achats externes', color: 'bg-amber-500' },
                    { label: 'Achats difficiles', color: 'bg-red-500' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <div className={`w-3 h-3 rounded-full ${l.color} opacity-60`} />
                      {l.label}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[#e8f4f3] border border-[#a7d4d1] rounded-lg text-xs text-[#1e3d3b]">
                  <strong>Lecture :</strong> Bas-gauche = <strong>Achats simples</strong> (faibles contraintes).
                  Haut-droite = <strong>Achats difficiles</strong>.
                  La taille des bulles est proportionnelle à l'enjeu financier.
                  Évaluez d'abord les contraintes dans l'onglet <em>Contraintes</em>.
                </div>
              </div>
            </Card>
          </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════
            ONGLET 3 — Risques de rupture
        ═══════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <div className="space-y-4">
            {!analysisKey && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                Sélectionnez un segment (et optionnellement une famille / sous-famille) dans le sélecteur ci-dessus pour commencer l'analyse.
              </div>
            )}
            {analysisKey && (() => {
              const r = getRisques(analysisKey);
              const cats = [
                { key: 'tech' as const, title: 'Risques techniques',    items: RISQUES_TECH },
                { key: 'com'  as const, title: 'Risques commerciaux',   items: RISQUES_COM },
                { key: 'log'  as const, title: 'Risques logistiques',   items: RISQUES_LOG },
              ];
              return (
                <>
                  {cats.map(cat => (
                    <Card key={cat.key}>
                      <CardHeader title={cat.title} />
                      <div className="p-4 space-y-3">
                        {cat.items.map((label, idx) => {
                          const risk = r[cat.key][idx] || { prob: 0, delai: 0 };
                          const level = getRisqueLevel(risk.prob, risk.delai);
                          return (
                            <div key={idx} className="pb-3 border-b border-gray-50 last:border-0">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs text-gray-700">{label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${level.cls}`}>{level.label}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <SliderRow
                                  label="Probabilité"
                                  value={risk.prob}
                                  onChange={v => updateRisque(analysisKey, cat.key, idx, 'prob', v)}
                                />
                                <SliderRow
                                  label="Délai réaction"
                                  value={risk.delai}
                                  onChange={v => updateRisque(analysisKey, cat.key, idx, 'delai', v)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">Score risque global</span>
                      <span className={`text-2xl font-bold ${getRisqueScore(analysisKey) >= 20 ? 'text-red-600' : getRisqueScore(analysisKey) >= 10 ? 'text-amber-600' : 'text-green-600'}`}>
                        {getRisqueScore(analysisKey)} <span className="text-sm text-gray-400">/ 30</span>
                      </span>
                    </div>
                  </Card>
                </>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 4 — Opportunités (scores)
        ═══════════════════════════════════════════════════ */}
        {activeTab === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Opportunités par famille d'achat" />
              <div className="p-4">
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Score d'opportunité (0–6) :</strong> 0=Aucune · 1=Très faible · 2=Faible · 3=Modérée · 4=Forte · 5=Très forte · 6=Maximale — reflète le potentiel de gains / leviers d'action disponibles. Ces scores alimentent la Matrice O/R.
                </div>
                <div className="space-y-2">
                  {familles.map(f => (
                    <div key={f.nom} className="flex items-center gap-4">
                      <span className="text-xs font-medium text-gray-700 w-48 truncate">{f.nom}</span>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="range" min={0} max={6} value={profitStore[f.nom] || 0}
                          onChange={e => setProfitStore(prev => ({ ...prev, [f.nom]: parseInt(e.target.value) }))}
                          className="flex-1 h-1.5 accent-[#2F5B58]"
                        />
                        <span className="text-xs font-bold text-[#2F5B58] w-4 text-center">{profitStore[f.nom] || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 5 — Matrice Opportunités / Risques
        ═══════════════════════════════════════════════════ */}
        {activeTab === 5 && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Matrice Opportunités / Risques" />
              <div className="p-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  <strong>Lecture :</strong> X = Score Risques (onglet Risques Rupture) · Y = Score Opportunités (onglet Opportunités) · Taille des bulles proportionnelle aux opportunités. Saisissez d'abord les risques et les scores d'opportunité.
                </div>
                <canvas ref={rpCanvasRef} className="w-full rounded-lg border border-gray-100" style={{ height: 420 }} />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { icon: '🟢', title: 'Achats Simples',      desc: 'Faibles risques, faibles opportunités. Simplifier les processus, e-procurement, contrats cadre.', cls: 'border-l-green-500' },
                    { icon: '🔵', title: 'Achats Leviers',      desc: 'Faibles risques, fortes opportunités. Mise en concurrence, enchères inversées, renégociation.', cls: 'border-l-blue-500' },
                    { icon: '🟠', title: 'Achats Critiques',    desc: 'Forts risques, faibles opportunités. Sécuriser la supply chain, double sourcing, contrats longs.', cls: 'border-l-amber-500' },
                    { icon: '🟣', title: 'Achats Stratégiques', desc: 'Forts risques, fortes opportunités. Partenariat, codéveloppement, relation long terme.', cls: 'border-l-indigo-500' },
                  ].map(q => (
                    <div key={q.title} className={`p-3 bg-gray-50 border-l-4 ${q.cls} rounded-r-lg`}>
                      <p className="text-xs font-bold text-gray-700 mb-1">{q.icon} {q.title}</p>
                      <p className="text-[11px] text-gray-500">{q.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 6 — Forces de Porter
        ═══════════════════════════════════════════════════ */}
        {activeTab === 6 && (
          <div className="space-y-4">
            {!analysisKey && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                Sélectionnez un segment (et optionnellement une famille / sous-famille) dans le sélecteur ci-dessus pour commencer l'analyse.
              </div>
            )}
            {analysisKey && (
              <div className="grid grid-cols-3 grid-rows-3 gap-3" style={{ minHeight: 500 }}>
                {/* Ligne 1 */}
                <div />
                <Card className="p-4">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">🆕 Nouveaux entrants</div>
                  <PorterField label="Entrants potentiels" placeholder="ex. 2-3 acteurs asiatiques" famille={analysisKey} fieldKey="ne_nb" />
                  <PorterField label="Typologies" placeholder="ex. Distributeurs" famille={analysisKey} fieldKey="ne_type" />
                </Card>
                <div />
                {/* Ligne 2 */}
                <Card className="p-4">
                  <div className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-3">🏭 Fournisseurs</div>
                  <PorterField label="Nb fournisseurs" placeholder="ex. 12" famille={analysisKey} fieldKey="f_nb" />
                  <PorterField label="Leaders" placeholder="ex. Fournisseur A, B" famille={analysisKey} fieldKey="f_leaders" />
                </Card>
                <Card className="flex items-center justify-center text-center p-4 bg-[#e8f4f3]">
                  <div>
                    <div className="font-bold text-[#2F5B58] text-sm mb-1">Marché existant</div>
                    <div className="text-xs text-gray-500">{analysisKey}</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3">🛒 Clients internes</div>
                  <PorterField label="Nb clients internes" placeholder="ex. 4 sites" famille={analysisKey} fieldKey="c_nb" />
                  <PorterField label="Typologies" placeholder="ex. Production, R&D" famille={analysisKey} fieldKey="c_type" />
                </Card>
                {/* Ligne 3 */}
                <div />
                <Card className="p-4">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">💡 Technologies de substitution</div>
                  <PorterField label="Technologies" placeholder="ex. Impression 3D" famille={analysisKey} fieldKey="ts_tech" />
                  <PorterField label="Horizon" placeholder="ex. 2-3 ans" famille={analysisKey} fieldKey="ts_date" />
                </Card>
                <div />
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 7 — SWOT
        ═══════════════════════════════════════════════════ */}
        {activeTab === 7 && (
          <div className="space-y-4">
            {!analysisKey && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                Sélectionnez un segment (et optionnellement une famille / sous-famille) dans le sélecteur ci-dessus pour commencer l'analyse.
              </div>
            )}
            {analysisKey && (() => {
              const swot = getSwot(analysisKey);
              const quadrants = [
                { key: 's' as const, label: 'S — Forces', sub: 'Strengths · Avantages internes', cls: 'border-green-300 bg-green-50', labelCls: 'text-green-700', placeholder: 'Ajouter une force...' },
                { key: 'w' as const, label: 'W — Faiblesses', sub: "Weaknesses · Axes d'amélioration", cls: 'border-amber-300 bg-amber-50', labelCls: 'text-amber-700', placeholder: 'Ajouter une faiblesse...' },
                { key: 'o' as const, label: 'O — Opportunités', sub: "Opportunities · Facteurs externes", cls: 'border-blue-300 bg-blue-50', labelCls: 'text-blue-700', placeholder: "Ajouter une opportunité..." },
                { key: 't' as const, label: 'T — Menaces', sub: 'Threats · Risques externes', cls: 'border-red-300 bg-red-50', labelCls: 'text-red-700', placeholder: 'Ajouter une menace...' },
              ];
              return (
                <div className="grid grid-cols-2 gap-4">
                  {quadrants.map(q => (
                    <SwotQuadrant
                      key={q.key} {...q} items={swot[q.key]}
                      onAdd={val => addSwotItem(analysisKey, q.key, val)}
                      onRemove={idx => removeSwotItem(analysisKey, q.key, idx)}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 8 — Synthèse
        ═══════════════════════════════════════════════════ */}
        {activeTab === 8 && (
          <div className="space-y-4">
            {familles.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Aucune famille d'achat disponible.</p>
              </div>
            ) : (
              <>
                <div className="mb-2 text-xs text-gray-500 italic">
                  Synthèse consolidée. Complétez les onglets Contraintes, Risques et SWOT pour enrichir cette vue.
                </div>
                <table className="w-full text-xs bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3">Nom</th>
                      <th className="text-left px-4 py-3">Niveau</th>
                      <th className="text-center px-4 py-3">CI</th>
                      <th className="text-center px-4 py-3">CE</th>
                      <th className="text-center px-4 py-3">Risque</th>
                      <th className="text-center px-4 py-3">Positionnement</th>
                      <th className="text-center px-4 py-3">Levier recommandé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familles.map((f, idx) => {
                      const ci = getCIScore(f.nom);
                      const ce = getCEScore(f.nom);
                      const risk = getRisqueScore(f.nom);
                      const profit = profitStore[f.nom] || 0;
                      const quad = quadrant(ci, ce);
                      const levier = getLevier(ci, ce, risk, profit);
                      return (
                        <tr key={f.nom + idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-semibold text-gray-800">{f.nom}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              f.niveau === 'segment' ? 'bg-[#e8f4f3] text-[#2F5B58]' :
                              f.niveau === 'famille' ? 'bg-indigo-50 text-indigo-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>{f.niveau}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center font-mono text-indigo-600">{ci || '—'}</td>
                          <td className="px-4 py-2.5 text-center font-mono text-amber-600">{ce || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                              risk >= 20 ? 'bg-red-100 text-red-700' :
                              risk >= 10 ? 'bg-amber-100 text-amber-700' :
                              risk > 0   ? 'bg-green-100 text-green-700' : 'text-gray-300'
                            }`}>{risk || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {ci > 0 || ce > 0 ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${quad.color}`}>{quad.label}</span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-[10px] text-gray-600">{levier}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

// Sélecteur en cascade pour les onglets d'analyse (Segment → Famille → Sous-famille)
function AnalysisCascadeSelector({
  hierarchy, segment, onSegment, famille, onFamille, sousfamille, onSousfamille, analysisKey, analysisNiveau,
}: {
  hierarchy: Hierarchy;
  segment: string; onSegment: (s: string) => void;
  famille: string; onFamille: (f: string) => void;
  sousfamille: string; onSousfamille: (sf: string) => void;
  analysisKey: string; analysisNiveau: string;
}) {
  const segments = Object.keys(hierarchy).sort();
  const familles = segment ? Object.keys(hierarchy[segment] || {}).sort() : [];
  const sousFamilles = (segment && famille) ? (hierarchy[segment]?.[famille] || []).sort() : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Étape 1 — Segment */}
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
            1 · Segment
          </label>
          <select
            value={segment}
            onChange={e => onSegment(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none min-w-[200px]"
          >
            <option value="">— Choisir un segment —</option>
            {segments.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Étape 2 — Famille (optionnel) */}
        {segment && familles.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              2 · Famille <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
            </label>
            <select
              value={famille}
              onChange={e => onFamille(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none min-w-[200px]"
            >
              <option value="">— Analyser le segment —</option>
              {familles.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}

        {/* Étape 3 — Sous-famille (optionnel) */}
        {famille && sousFamilles.length > 0 && (
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              3 · Sous-famille <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
            </label>
            <select
              value={sousfamille}
              onChange={e => onSousfamille(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none min-w-[200px]"
            >
              <option value="">— Analyser la famille —</option>
              {sousFamilles.map(sf => <option key={sf} value={sf}>{sf}</option>)}
            </select>
          </div>
        )}

        {/* Badge du niveau analysé */}
        {analysisKey && (
          <div className="flex flex-col gap-1 ml-auto text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Analyse en cours</span>
            <span className="font-semibold text-sm text-gray-800">{analysisKey}</span>
            <span className={`self-end px-2 py-0.5 rounded-full text-[10px] font-medium ${
              analysisNiveau === 'segment' ? 'bg-[#e8f4f3] text-[#2F5B58]' :
              analysisNiveau === 'famille' ? 'bg-indigo-50 text-indigo-700' :
              'bg-amber-50 text-amber-700'
            }`}>{analysisNiveau}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Porter field (local state simple)
function PorterField({ label, placeholder }: { label: string; placeholder: string; famille: string; fieldKey: string }) {
  const [val, setVal] = useState('');
  return (
    <div className="mb-2">
      <label className="text-[10px] text-gray-500 block mb-0.5">{label}</label>
      <input
        type="text" value={val} onChange={e => setVal(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#2F5B58] focus:outline-none"
      />
    </div>
  );
}

// SWOT quadrant
function SwotQuadrant({ label, sub, cls, labelCls, placeholder, items, onAdd, onRemove }: {
  label: string; sub: string; cls: string; labelCls: string; placeholder: string;
  items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void;
}) {
  const [input, setInput] = useState('');
  const handleAdd = () => {
    if (input.trim()) { onAdd(input); setInput(''); }
  };
  return (
    <div className={`border rounded-xl p-4 min-h-[180px] ${cls}`}>
      <div className={`text-base font-bold mb-0.5 ${labelCls}`}>{label}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-3">{sub}</div>
      <div className="flex gap-2 mb-3">
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-[#2F5B58] focus:outline-none bg-white"
        />
        <button onClick={handleAdd} className="px-2 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium hover:bg-gray-50">+</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
            {item}
            <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 font-bold ml-0.5">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

// Levier recommandé selon quadrant + risque + profit
function getLevier(ci: number, ce: number, risk: number, profit: number): string {
  if (ci === 0 && ce === 0) return '— À évaluer';
  if (ci < 50 && ce < 50) return '📋 Contrat cadre / e-procurement';
  if (ci < 50 && ce >= 50) {
    if (risk >= 15) return '🛡 Double source + contrat MT';
    return '🤝 Partenariat fournisseur';
  }
  if (ci >= 50 && ce < 50) {
    if (profit >= 4) return '💰 Mise en concurrence';
    return '📊 Simplification interne';
  }
  return '🔬 Codéveloppement / CdCF';
}
