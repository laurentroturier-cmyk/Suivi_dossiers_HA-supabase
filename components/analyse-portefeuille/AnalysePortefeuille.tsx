// ============================================
// AnalysePortefeuille — Module Admin
// Analyse stratégique du portefeuille achats
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  RefreshCw, Package, TrendingUp, AlertTriangle, BarChart2,
  Shield, Zap, FileText, Info, Download, Upload, FileSpreadsheet, Search,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SegmentationRow {
  dna_segment: string;
  dna_famille: string | null;
  dna_sousfamille: string | null;
}

type Hierarchy = Record<string, Record<string, string[]>>;

interface FamilleAchat {
  nom: string;
  niveau: 'segment' | 'famille' | 'sousfamille';
  parent?: string;
}

type NiveauAnalyse = 'segment' | 'famille' | 'sousfamille';

interface ContrainteNote { note: number; evo: number }

interface DonneesElement {
  ca: number;           // Chiffre d'affaires (k€)
  budgetPrev: number;   // Budget prévisionnel (k€)
  nbCommandes: number;  // Nb commandes / an
  nbFournisseurs: number; // Nb fournisseurs actifs
  notes: string;
}

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

const EMPTY_DONNEES: DonneesElement = { ca: 0, budgetPrev: 0, nbCommandes: 0, nbFournisseurs: 0, notes: '' };

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

function SliderRow({ label, value, onChange, max = 5 }: {
  label: string; value: number; onChange: (v: number) => void; max?: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-[11px] text-gray-600 flex-1 leading-tight">{label}</span>
      <div className="flex items-center gap-2 w-48">
        <input
          type="range" min={0} max={max} value={value}
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

  // Navigation principale : 0=Familles, 1=Matrice Portefeuille, 2=Matrice O/R, 3=Synthèse
  const [activeTab, setActiveTab]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastSaved, setLastSaved]   = useState('');

  // ── Segmentation ──────────────────────────────────────────────────────────
  const [hierarchy, setHierarchy]           = useState<Hierarchy>({});
  const [niveauAnalyse, setNiveauAnalyse]   = useState<NiveauAnalyse>('famille');
  const [cascadeSegment, setCascadeSegment] = useState('');
  const [searchQuery, setSearchQuery]       = useState('');

  // ── Élément sélectionné pour l'analyse ───────────────────────────────────
  const [selectedElement, setSelectedElement] = useState('');
  const [detailTab, setDetailTab]             = useState(0); // 0=Fiche, 1=Contraintes, 2=Risques, 3=Opport., 4=Porter, 5=SWOT

  // ── Stores d'analyse (clé = nom de l'élément) ────────────────────────────
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
  const [profitStore, setProfitStore]     = useState<Record<string, number>>({});
  const [donneesStore, setDonneesStore]   = useState<Record<string, DonneesElement>>({});

  // ─── Chargement segmentation ─────────────────────────────────────────────
  const fetchFamilles = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: e } = await supabase
        .from('Referentiel_segmentation')
        .select('dna_segment, dna_famille, dna_sousfamille')
        .not('dna_segment', 'is', null);
      if (e) throw e;
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

  useEffect(() => { fetchFamilles(); }, [fetchFamilles]);

  // Réinitialiser filtre segment quand le niveau change
  useEffect(() => { setCascadeSegment(''); setSearchQuery(''); }, [niveauAnalyse]);

  // ─── Liste d'items dérivée ────────────────────────────────────────────────
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
      Object.keys(hierarchy[seg] || {}).sort().forEach(fam => {
        (hierarchy[seg]?.[fam] || []).sort().forEach(sf => {
          items.push({ nom: sf, niveau: 'sousfamille', parent: fam });
        });
      });
    });
    return items;
  })();

  const filteredFamilles = searchQuery
    ? familles.filter(f => f.nom.toLowerCase().includes(searchQuery.toLowerCase()))
    : familles;

  const selectedFamilleAchat = familles.find(f => f.nom === selectedElement) ?? null;
  const analysisKey = selectedElement;

  // Stats générales
  const nbSegments     = Object.keys(hierarchy).length;
  const nbFamilles     = Object.values(hierarchy).reduce((s, f) => s + Object.keys(f).length, 0);
  const nbSousFamilles = Object.values(hierarchy).reduce((s, f) =>
    s + Object.values(f).reduce((ss, sf) => ss + sf.length, 0), 0);

  // ─── Persistence localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('analyse-portefeuille');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.contraintesStore) setContraintesStore(d.contraintesStore);
        if (d.risquesStore)     setRisquesStore(d.risquesStore);
        if (d.swotStore)        setSwotStore(d.swotStore);
        if (d.profitStore)      setProfitStore(d.profitStore);
        if (d.donneesStore)     setDonneesStore(d.donneesStore);
        // Rétrocompat : ancienne clé chiffreAffairesStore
        else if (d.chiffreAffairesStore) {
          const migrated: Record<string, DonneesElement> = {};
          Object.entries(d.chiffreAffairesStore as Record<string, number>).forEach(([k, ca]) => {
            migrated[k] = { ...EMPTY_DONNEES, ca };
          });
          setDonneesStore(migrated);
        }
        if (d.selectedElement) setSelectedElement(d.selectedElement);
        // Rétrocompat : ancienne sélection cascade
        else if (d.selection) {
          const key = d.selection.analysisSousfamille || d.selection.analysisFamille || d.selection.analysisSegment || '';
          if (key) setSelectedElement(key);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('analyse-portefeuille', JSON.stringify({
        contraintesStore, risquesStore, swotStore, profitStore, donneesStore, selectedElement,
      }));
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } catch {}
  }, [contraintesStore, risquesStore, swotStore, profitStore, donneesStore, selectedElement]);

  // ─── Helpers données ─────────────────────────────────────────────────────
  const getDonnees = (nom: string): DonneesElement => donneesStore[nom] ?? { ...EMPTY_DONNEES };
  const updateDonnees = useCallback((nom: string, field: keyof DonneesElement, val: number | string) => {
    setDonneesStore(prev => ({
      ...prev,
      [nom]: { ...(prev[nom] ?? { ...EMPTY_DONNEES }), [field]: val },
    }));
  }, []);

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

  const getCIScore = useCallback((famille: string) => {
    const c = getContraintes(famille);
    return scaleTo50(c.cit) + scaleTo50(c.cic);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contraintesStore]);

  const getCEScore = useCallback((famille: string) => {
    const c = getContraintes(famille);
    return scaleTo50(c.cet) + scaleTo50(c.cec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contraintesStore]);

  // ─── Helpers risques ─────────────────────────────────────────────────────
  const getRisques = (famille: string) => risquesStore[famille] || {
    tech: RISQUES_TECH.map(() => ({ prob: 0, delai: 0 })),
    com:  RISQUES_COM.map(()  => ({ prob: 0, delai: 0 })),
    log:  RISQUES_LOG.map(()  => ({ prob: 0, delai: 0 })),
  };

  const updateRisque = (famille: string, cat: 'tech' | 'com' | 'log', idx: number, field: 'prob' | 'delai', val: number) => {
    setRisquesStore(prev => {
      const current = getRisques(famille);
      const updated = { ...current, [cat]: current[cat].map((r, i) => i === idx ? { ...r, [field]: val } : r) };
      return { ...prev, [famille]: updated };
    });
  };

  const getRisqueScore = useCallback((famille: string) => {
    const r = getRisques(famille);
    const score = (arr: { prob: number; delai: number }[]) =>
      arr.reduce((s, x) => s + x.prob * (6 - x.delai), 0);
    return Math.min(30, Math.round((score(r.tech) + score(r.com) + score(r.log)) / 3));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risquesStore]);

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

  // ─── Statut d'un élément ─────────────────────────────────────────────────
  const getElementStatus = useCallback((nom: string): 'complete' | 'partial' | 'empty' => {
    const d = donneesStore[nom];
    const swot = getSwot(nom);
    const checks = [
      getCIScore(nom) > 0 || getCEScore(nom) > 0,
      getRisqueScore(nom) > 0,
      (profitStore[nom] || 0) > 0,
      swot.s.length + swot.w.length + swot.o.length + swot.t.length > 0,
      !!(d && (d.ca > 0 || d.nbCommandes > 0 || d.nbFournisseurs > 0)),
    ];
    const score = checks.filter(Boolean).length;
    if (score >= 4) return 'complete';
    if (score >= 1) return 'partial';
    return 'empty';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contraintesStore, risquesStore, profitStore, swotStore, donneesStore]);

  // ─── Refs ────────────────────────────────────────────────────────────────
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const rpCanvasRef   = useRef<HTMLCanvasElement>(null);

  // ─── Export JSON ─────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      selectedElement,
      contraintesStore, risquesStore, swotStore, profitStore, donneesStore,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-portefeuille-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedElement, contraintesStore, risquesStore, swotStore, profitStore, donneesStore]);

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
        if (data.donneesStore)     setDonneesStore(data.donneesStore);
        if (data.selectedElement)  setSelectedElement(data.selectedElement);
        alert('Analyse importée avec succès.');
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

    // Tous les éléments ayant au moins une donnée
    const allKeys = [...new Set([
      ...Object.keys(contraintesStore),
      ...Object.keys(risquesStore),
      ...Object.keys(swotStore),
      ...Object.keys(profitStore),
      ...Object.keys(donneesStore),
    ])].sort();

    // Feuille Synthèse
    const syntheHeaders = ['Nom', 'CI', 'CE', 'Risque', 'Opportunité', 'Positionnement', 'CA (k€)', 'Budget prev. (k€)', 'Nb commandes', 'Nb fournisseurs', 'Levier'];
    const syntheRows = allKeys.map(nom => {
      const ci = getCIScore(nom);
      const ce = getCEScore(nom);
      const risk = getRisqueScore(nom);
      const profit = profitStore[nom] || 0;
      const d = donneesStore[nom] ?? EMPTY_DONNEES;
      const quad = quadrant(ci, ce);
      const levier = getLevier(ci, ce, risk, profit);
      return [nom, ci || '', ce || '', risk || '', profit || '', ci > 0 || ce > 0 ? quad.label : '', d.ca || '', d.budgetPrev || '', d.nbCommandes || '', d.nbFournisseurs || '', levier];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([syntheHeaders, ...syntheRows]), 'Synthèse');

    // Feuille Données financières
    const donHeaders = ['Élément', 'CA (k€)', 'Budget prev. (k€)', 'Nb commandes/an', 'Nb fournisseurs', 'Notes'];
    const donRows = allKeys.map(nom => {
      const d = donneesStore[nom] ?? EMPTY_DONNEES;
      return [nom, d.ca || '', d.budgetPrev || '', d.nbCommandes || '', d.nbFournisseurs || '', d.notes || ''];
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([donHeaders, ...donRows]), 'Données');

    // Feuille Contraintes
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

    // Feuille Risques
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

    // Feuille SWOT
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
  }, [contraintesStore, risquesStore, swotStore, profitStore, donneesStore, getCIScore, getCEScore, getRisqueScore]);

  // ─── Canvas matrice portefeuille (onglet 1) ───────────────────────────────
  useEffect(() => {
    if (activeTab !== 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();

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

    const analyzed = Object.keys(contraintesStore).filter(k => getCIScore(k) > 0 || getCEScore(k) > 0);
    const items = analyzed.length > 0 ? analyzed : familles.map(f => f.nom);

    const caValues = items.map(n => donneesStore[n]?.ca || 0);
    const maxCA = Math.max(...caValues, 1);
    const MIN_R = 8, MAX_R = 28, DEFAULT_R = 16;

    items.forEach((nom) => {
      const ci = getCIScore(nom);
      const ce = getCEScore(nom);
      const x = (ci / 100) * (W - 40) + 20;
      const y = H - (ce / 100) * (H - 40) - 20;
      const ca = donneesStore[nom]?.ca || 0;
      const r = ca > 0 ? MIN_R + ((ca / maxCA) * (MAX_R - MIN_R)) : DEFAULT_R;

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

      // Afficher le CA dans la bulle si disponible
      if (ca > 0) {
        ctx.font = `bold ${Math.max(7, Math.min(9, r - 4))}px sans-serif`;
        ctx.fillStyle = ci >= 50 && ce >= 50 ? '#dc2626' : ci >= 50 ? '#2563eb' : ce >= 50 ? '#d97706' : '#16a34a';
        ctx.textAlign = 'center';
        ctx.fillText(`${ca >= 1000 ? (ca/1000).toFixed(1)+'M' : ca+'k'}`, x, y + 3);
      }

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      const label = nom.length > 12 ? nom.substring(0, 11) + '…' : nom;
      ctx.fillText(label, x, y + r + 12);
    });
  }, [activeTab, familles, contraintesStore, donneesStore, getCIScore, getCEScore]);

  // ─── Canvas matrice O/R (onglet 2) ────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 2) return;
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

    const qLabels = ['Achats\nSimples', 'Achats\nCritiques', 'Achats\nLeviers', 'Achats\nStratégiques'];
    const qx = [W*0.25, W*0.75, W*0.25, W*0.75];
    const qy = [H*0.75, H*0.75, H*0.25, H*0.25];
    const qc2 = ['#16a34a', '#d97706', '#2563eb', '#6c63ff'];
    qLabels.forEach((lbl, i) => {
      ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = qc2[i]; ctx.globalAlpha = 0.25;
      ctx.textAlign = 'center';
      lbl.split('\n').forEach((line, li) => ctx.fillText(line, qx[i], qy[i] + li * 14));
    });
    ctx.globalAlpha = 1;

    ctx.font = '10px sans-serif'; ctx.fillStyle = '#6b7280'; ctx.globalAlpha = 0.7;
    ctx.textAlign = 'center';
    ctx.fillText('Risques →', W - 40, H - 6);
    ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('← Opportunités', 0, 0); ctx.restore();
    ctx.globalAlpha = 1;

    const riskAnalyzed    = Object.keys(risquesStore).filter(k => getRisqueScore(k) > 0);
    const opportunAnalyzed = Object.keys(profitStore).filter(k => (profitStore[k] || 0) > 0);
    const rpKeys  = [...new Set([...riskAnalyzed, ...opportunAnalyzed])];
    const rpItems = rpKeys.length > 0 ? rpKeys : familles.map(f => f.nom);

    const PALETTE = ['#6c63ff', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#c2410c', '#059669', '#db2777'];

    const rpCaValues = rpItems.map(n => donneesStore[n]?.ca || 0);
    const rpMaxCA = Math.max(...rpCaValues, 1);
    const RP_MIN_R = 8, RP_MAX_R = 30, RP_DEFAULT_R = 18;

    rpItems.forEach((nom, idx) => {
      const risk   = getRisqueScore(nom);
      const opport = (profitStore[nom] || 0);
      const x = (risk / 30) * (W - 60) + 30;
      const y = H - (opport / 5) * (H - 60) - 30;

      const isHighRisk   = risk   >= 15;
      const isHighOpport = opport >= 2.5;

      const quadColor = !isHighRisk && !isHighOpport ? '#16a34a' :
                         isHighRisk && !isHighOpport ? '#2563eb' :
                        !isHighRisk &&  isHighOpport ? '#d97706' : '#6c63ff';

      const bubbleColor = PALETTE[idx % PALETTE.length];
      const ca = donneesStore[nom]?.ca || 0;
      const r = ca > 0 ? RP_MIN_R + ((ca / rpMaxCA) * (RP_MAX_R - RP_MIN_R)) : RP_DEFAULT_R;

      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor + '33';
      ctx.strokeStyle = bubbleColor;
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();

      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#1f2937'; ctx.textAlign = 'center';
      const short = nom.length > 14 ? nom.substring(0, 13) + '…' : nom;
      ctx.fillText(short, x, y + r + 10);

      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = quadColor; ctx.fill();
    });
  }, [activeTab, familles, risquesStore, profitStore, donneesStore, getRisqueScore]);

  // ─── Rendu ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Chargement des familles d'achat…
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
      <AlertTriangle className="w-4 h-4 inline mr-1" /> {error}
      <button onClick={fetchFamilles} className="ml-4 underline text-xs">Réessayer</button>
    </div>
  );

  const analyzedCount = familles.filter(f => getElementStatus(f.nom) !== 'empty').length;

  return (
    <div className="flex flex-col gap-0">

      {/* ── En-tête ── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Portefeuille Achats — Analyse Stratégique</h2>
          <p className="text-xs text-gray-500 mt-0.5">{nbSegments} segments · {nbFamilles} familles · {nbSousFamilles} sous-familles</p>
        </div>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-[10px] text-gray-400 italic border border-gray-100 rounded px-2 py-1">
              ✓ Sauvegardé à {lastSaved}
            </span>
          )}
          <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Importer une analyse JSON"
          >
            <Upload className="w-3.5 h-3.5" /> Importer
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Exporter toute l'analyse en JSON (sauvegarde complète)"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#2F5B58] border border-[#2F5B58] rounded-lg hover:bg-[#254845]"
            title="Exporter vers Excel (toutes les données)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={fetchFamilles} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Onglets principaux ── */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 rounded-t-xl sticky top-0 z-10">
        {[
          { icon: <Package className="w-3.5 h-3.5" />,    label: 'Familles d\'achat',      count: familles.length },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Matrice Portefeuille',   count: analyzedCount > 0 ? analyzedCount : undefined },
          { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Matrice O/R',            count: undefined },
          { icon: <FileText className="w-3.5 h-3.5" />,   label: 'Synthèse',               count: analyzedCount > 0 ? analyzedCount : undefined },
        ].map((tab, i) => (
          <TabBtn key={i} active={activeTab === i} onClick={() => setActiveTab(i)}
            icon={tab.icon} label={tab.label} count={tab.count} />
        ))}
      </div>

      <div className="pt-4">

        {/* ═══════════════════════════════════════════════════
            ONGLET 0 — Familles d'achat (2 panneaux)
        ═══════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <div className="flex gap-4" style={{ minHeight: 580 }}>

            {/* ── Panneau gauche : navigateur d'éléments ── */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-3">

              {/* Filtres */}
              <Card className="p-3 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Niveau</label>
                  <div className="flex gap-1">
                    {(['segment', 'famille', 'sousfamille'] as NiveauAnalyse[]).map(n => (
                      <button
                        key={n}
                        onClick={() => setNiveauAnalyse(n)}
                        className={`flex-1 px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                          niveauAnalyse === n
                            ? 'bg-[#2F5B58] text-white border-[#2F5B58]'
                            : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {n === 'segment' ? 'Seg.' : n === 'famille' ? 'Fam.' : 'S-Fam.'}
                      </button>
                    ))}
                  </div>
                </div>
                {niveauAnalyse !== 'segment' && (
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">Segment</label>
                    <select
                      value={cascadeSegment}
                      onChange={e => setCascadeSegment(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
                    >
                      <option value="">— Tous —</option>
                      {Object.keys(hierarchy).sort().map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
                  />
                </div>
                {/* Légende statuts */}
                <div className="flex flex-wrap gap-2 text-[9px] text-gray-400 border-t border-gray-100 pt-2">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Complet</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> En cours</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" /> Non démarré</span>
                </div>
              </Card>

              {/* Liste d'éléments */}
              <Card className="flex-1 overflow-hidden flex flex-col">
                <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">{filteredFamilles.length} élément{filteredFamilles.length > 1 ? 's' : ''}</span>
                  <span className="text-[10px] text-[#2F5B58] font-semibold">{analyzedCount} analysé{analyzedCount > 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-y-auto flex-1" style={{ maxHeight: 420 }}>
                  {filteredFamilles.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs">Aucun résultat</div>
                  ) : (
                    filteredFamilles.map(f => {
                      const status = getElementStatus(f.nom);
                      const d = donneesStore[f.nom];
                      const isSelected = f.nom === selectedElement;
                      return (
                        <button
                          key={f.nom}
                          onClick={() => { setSelectedElement(f.nom); setDetailTab(0); }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2 border-b border-gray-50 transition-colors ${
                            isSelected ? 'bg-[#e8f4f3] border-l-2 border-l-[#2F5B58]' : 'hover:bg-[#f4faf9]'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            status === 'complete' ? 'bg-green-500' :
                            status === 'partial'  ? 'bg-amber-400' : 'bg-gray-200'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium truncate ${isSelected ? 'text-[#2F5B58]' : 'text-gray-800'}`}>{f.nom}</div>
                            <div className="text-[9px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                              <span className="capitalize">{f.niveau === 'sousfamille' ? 'sous-famille' : f.niveau}</span>
                              {d?.ca > 0 && <><span>·</span><span>{d.ca.toLocaleString()} k€</span></>}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* ── Panneau droit : détail de l'élément ── */}
            <div className="flex-1 min-w-0">
              {!selectedElement ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
                  <Package className="w-14 h-14 mb-4 opacity-15" />
                  <p className="text-sm font-medium text-gray-500">Sélectionnez un élément dans la liste</p>
                  <p className="text-xs mt-1">pour accéder à sa fiche et à l'analyse stratégique</p>
                  <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm">
                    {[
                      { label: 'Saisir les données', desc: 'CA, commandes, fournisseurs' },
                      { label: 'Évaluer', desc: 'Contraintes, risques, SWOT' },
                      { label: 'Visualiser', desc: 'Matrices Portefeuille & O/R' },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-6 h-6 bg-[#2F5B58] text-white rounded-full text-xs font-bold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
                        <div className="text-[10px] font-semibold text-gray-700">{s.label}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">

                  {/* En-tête de l'élément */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base">{selectedElement}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            selectedFamilleAchat?.niveau === 'segment'     ? 'bg-[#e8f4f3] text-[#2F5B58]' :
                            selectedFamilleAchat?.niveau === 'famille'     ? 'bg-indigo-50 text-indigo-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {selectedFamilleAchat?.niveau === 'sousfamille' ? 'sous-famille' : selectedFamilleAchat?.niveau || ''}
                          </span>
                          {selectedFamilleAchat?.parent && (
                            <span className="text-[10px] text-gray-400">↳ {selectedFamilleAchat.parent}</span>
                          )}
                        </div>
                        {/* Barre de complétude */}
                        {(() => {
                          const checks = [
                            { label: 'Fiche', done: !!(donneesStore[selectedElement]?.ca || donneesStore[selectedElement]?.nbCommandes || donneesStore[selectedElement]?.nbFournisseurs) },
                            { label: 'Contraintes', done: getCIScore(selectedElement) > 0 || getCEScore(selectedElement) > 0 },
                            { label: 'Risques', done: getRisqueScore(selectedElement) > 0 },
                            { label: 'Opportunités', done: (profitStore[selectedElement] || 0) > 0 },
                            { label: 'SWOT', done: (() => { const s = getSwot(selectedElement); return s.s.length + s.w.length + s.o.length + s.t.length > 0; })() },
                          ];
                          return (
                            <div className="flex gap-1.5 mt-2.5 flex-wrap">
                              {checks.map(item => (
                                <span key={item.label} className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border ${
                                  item.done
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-gray-50 text-gray-400 border-gray-100'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${item.done ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  {item.label}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      {/* Scores rapides */}
                      <div className="flex gap-4 flex-shrink-0">
                        {[
                          { label: 'CI', value: getCIScore(selectedElement), max: 100, cls: 'text-indigo-600' },
                          { label: 'CE', value: getCEScore(selectedElement), max: 100, cls: 'text-amber-600' },
                          { label: 'Risque', value: getRisqueScore(selectedElement), max: 30, cls: getRisqueScore(selectedElement) >= 20 ? 'text-red-600' : getRisqueScore(selectedElement) > 0 ? 'text-amber-600' : 'text-gray-300' },
                          { label: 'Opport.', value: profitStore[selectedElement] || 0, max: 6, cls: 'text-[#2F5B58]' },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <div className={`text-xl font-bold leading-none ${s.cls}`}>{s.value || '—'}</div>
                            <div className="text-[9px] text-gray-400 mt-0.5">{s.label}{s.value > 0 ? `/${s.max}` : ''}</div>
                          </div>
                        ))}
                        {donneesStore[selectedElement]?.ca > 0 && (
                          <div className="text-center pl-3 border-l border-gray-100">
                            <div className="text-xl font-bold leading-none text-gray-700">
                              {donneesStore[selectedElement].ca.toLocaleString()}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">CA k€</div>
                          </div>
                        )}
                        {(getCIScore(selectedElement) > 0 || getCEScore(selectedElement) > 0) && (
                          <div className="text-center">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${quadrant(getCIScore(selectedElement), getCEScore(selectedElement)).color}`}>
                              {quadrant(getCIScore(selectedElement), getCEScore(selectedElement)).label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sous-onglets d'analyse */}
                  <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 rounded-t-xl">
                    {[
                      { label: 'Fiche',        icon: <FileText className="w-3.5 h-3.5" /> },
                      { label: 'Contraintes',  icon: <BarChart2 className="w-3.5 h-3.5" /> },
                      { label: 'Risques',      icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                      { label: 'Opportunités', icon: <BarChart2 className="w-3.5 h-3.5" /> },
                      { label: 'Porter',       icon: <Shield className="w-3.5 h-3.5" /> },
                      { label: 'SWOT',         icon: <Zap className="w-3.5 h-3.5" /> },
                    ].map((t, i) => (
                      <TabBtn key={i} active={detailTab === i} onClick={() => setDetailTab(i)} icon={t.icon} label={t.label} />
                    ))}
                  </div>

                  {/* ── Sous-onglet 0 : Fiche / Données ── */}
                  {detailTab === 0 && (
                    <FicheElement
                      nom={selectedElement}
                      donnees={getDonnees(selectedElement)}
                      onUpdate={(field, val) => updateDonnees(selectedElement, field, val)}
                    />
                  )}

                  {/* ── Sous-onglet 1 : Contraintes ── */}
                  {detailTab === 1 && (() => {
                    const c = getContraintes(analysisKey);
                    const groups = [
                      { key: 'cit' as const, title: 'Contraintes Internes – Techniques',   items: CIT_ITEMS },
                      { key: 'cic' as const, title: 'Contraintes Internes – Commerciales', items: CIC_ITEMS },
                      { key: 'cet' as const, title: 'Contraintes Externes – Techniques',   items: CET_ITEMS },
                      { key: 'cec' as const, title: 'Contraintes Externes – Commerciales', items: CEC_ITEMS },
                    ];
                    return (
                      <div className="space-y-4">
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
                          <div className="flex items-center gap-8 flex-wrap">
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
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${quadrant(getCIScore(analysisKey), getCEScore(analysisKey)).color}`}>
                                  {quadrant(getCIScore(analysisKey), getCEScore(analysisKey)).label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* ── Sous-onglet 2 : Risques ── */}
                  {detailTab === 2 && (() => {
                    const r = getRisques(analysisKey);
                    const cats = [
                      { key: 'tech' as const, title: 'Risques techniques',    items: RISQUES_TECH },
                      { key: 'com'  as const, title: 'Risques commerciaux',   items: RISQUES_COM },
                      { key: 'log'  as const, title: 'Risques logistiques',   items: RISQUES_LOG },
                    ];
                    return (
                      <div className="space-y-4">
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
                                      <SliderRow label="Probabilité" value={risk.prob}
                                        onChange={v => updateRisque(analysisKey, cat.key, idx, 'prob', v)} />
                                      <SliderRow label="Délai réaction" value={risk.delai}
                                        onChange={v => updateRisque(analysisKey, cat.key, idx, 'delai', v)} />
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
                      </div>
                    );
                  })()}

                  {/* ── Sous-onglet 3 : Opportunités ── */}
                  {detailTab === 3 && (
                    <Card>
                      <CardHeader title={`Opportunités — ${selectedElement}`} icon={<BarChart2 className="w-4 h-4" />} />
                      <div className="p-6">
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                          <strong>Score d'opportunité (0–6) :</strong> 0=Aucune · 1=Très faible · 2=Faible · 3=Modérée · 4=Forte · 5=Très forte · 6=Maximale
                        </div>
                        <div className="flex items-center gap-6">
                          <input
                            type="range" min={0} max={6} value={profitStore[analysisKey] || 0}
                            onChange={e => setProfitStore(prev => ({ ...prev, [analysisKey]: parseInt(e.target.value) }))}
                            className="flex-1 h-2 accent-[#2F5B58]"
                          />
                          <span className="text-3xl font-bold text-[#2F5B58] w-12 text-center">{profitStore[analysisKey] || 0}</span>
                          <span className="text-sm text-gray-400">/ 6</span>
                        </div>
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {[0,1,2,3,4,5,6].map(v => (
                            <button
                              key={v}
                              onClick={() => setProfitStore(prev => ({ ...prev, [analysisKey]: v }))}
                              className={`w-9 h-9 rounded-full text-xs font-bold border transition-all ${
                                (profitStore[analysisKey] || 0) === v
                                  ? 'bg-[#2F5B58] text-white border-[#2F5B58]'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >{v}</button>
                          ))}
                        </div>
                        <div className="mt-6 p-3 bg-[#e8f4f3] border border-[#a7d4d1] rounded-lg text-xs text-[#1e3d3b]">
                          Ce score, combiné au score de risque ({getRisqueScore(analysisKey)}/30),
                          positionne cet élément dans la <strong>Matrice Opportunités/Risques</strong>.
                          {getLevier(getCIScore(analysisKey), getCEScore(analysisKey), getRisqueScore(analysisKey), profitStore[analysisKey] || 0) !== '— À évaluer' && (
                            <> Levier recommandé : <strong>{getLevier(getCIScore(analysisKey), getCEScore(analysisKey), getRisqueScore(analysisKey), profitStore[analysisKey] || 0)}</strong></>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* ── Sous-onglet 4 : Porter ── */}
                  {detailTab === 4 && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 grid-rows-3 gap-3" style={{ minHeight: 460 }}>
                        <div />
                        <Card className="p-4">
                          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-3">🆕 Nouveaux entrants</div>
                          <PorterField label="Entrants potentiels" placeholder="ex. 2-3 acteurs asiatiques" famille={analysisKey} fieldKey="ne_nb" />
                          <PorterField label="Typologies" placeholder="ex. Distributeurs" famille={analysisKey} fieldKey="ne_type" />
                        </Card>
                        <div />
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
                        <div />
                        <Card className="p-4">
                          <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">💡 Substituts</div>
                          <PorterField label="Technologies" placeholder="ex. Impression 3D" famille={analysisKey} fieldKey="ts_tech" />
                          <PorterField label="Horizon" placeholder="ex. 2-3 ans" famille={analysisKey} fieldKey="ts_date" />
                        </Card>
                        <div />
                      </div>
                      <div className="text-[10px] text-gray-400 italic text-center">Note : les données Porter sont locales à cette session (non persistées entre sessions)</div>
                    </div>
                  )}

                  {/* ── Sous-onglet 5 : SWOT ── */}
                  {detailTab === 5 && (() => {
                    const swot = getSwot(analysisKey);
                    const quadrants = [
                      { key: 's' as const, label: 'S — Forces',     sub: 'Strengths · Avantages internes',     cls: 'border-green-300 bg-green-50', labelCls: 'text-green-700', placeholder: 'Ajouter une force...' },
                      { key: 'w' as const, label: 'W — Faiblesses', sub: "Weaknesses · Axes d'amélioration",   cls: 'border-amber-300 bg-amber-50', labelCls: 'text-amber-700', placeholder: 'Ajouter une faiblesse...' },
                      { key: 'o' as const, label: 'O — Opportunités', sub: "Opportunities · Facteurs externes", cls: 'border-blue-300 bg-blue-50',  labelCls: 'text-blue-700', placeholder: "Ajouter une opportunité..." },
                      { key: 't' as const, label: 'T — Menaces',    sub: 'Threats · Risques externes',         cls: 'border-red-300 bg-red-50',   labelCls: 'text-red-700', placeholder: 'Ajouter une menace...' },
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
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            ONGLET 1 — Matrice Portefeuille
        ═══════════════════════════════════════════════════ */}
        {activeTab === 1 && (() => {
          const analyzedItems = Object.keys(contraintesStore).filter(k => getCIScore(k) > 0 || getCEScore(k) > 0);
          const difficiles = analyzedItems.filter(k => getCIScore(k) >= 50 && getCEScore(k) >= 50).length;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Éléments analysés', value: analyzedItems.length, color: 'border-[#2F5B58]' },
                  { label: 'Achats simples',    value: analyzedItems.filter(k => getCIScore(k) < 50 && getCEScore(k) < 50).length, color: 'border-green-400' },
                  { label: 'Achats difficiles', value: difficiles, color: 'border-red-400' },
                  { label: 'Avec CA renseigné', value: analyzedItems.filter(k => (donneesStore[k]?.ca || 0) > 0).length, color: 'border-amber-400' },
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
                    <span className="text-[10px] text-gray-500 flex items-center justify-center" style={{ writingMode: 'vertical-rl', minWidth: 20 }}>CE ↑</span>
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
                    <strong>Lecture :</strong> La taille des bulles est proportionnelle au chiffre d'affaires saisi dans la <em>Fiche</em> de chaque élément.
                    Sans CA renseigné → taille uniforme. Évaluez d'abord les contraintes dans l'onglet <em>Familles</em>.
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════
            ONGLET 2 — Matrice O/R
        ═══════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Matrice Opportunités / Risques" />
              <div className="p-4">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                  <strong>Lecture :</strong> X = Score Risques · Y = Score Opportunités · Taille des bulles proportionnelle au CA.
                  Saisissez risques, opportunités et CA dans l'onglet <em>Familles</em>.
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
            ONGLET 3 — Synthèse globale
        ═══════════════════════════════════════════════════ */}
        {activeTab === 3 && (() => {
          const allKeys = [...new Set([
            ...Object.keys(contraintesStore),
            ...Object.keys(risquesStore),
            ...Object.keys(swotStore),
            ...Object.keys(profitStore),
            ...Object.keys(donneesStore),
          ])].sort();
          return (
            <div className="space-y-4">
              <div className="text-xs text-gray-500 italic">
                Tous les éléments ayant au moins une donnée saisie. {allKeys.length} élément{allKeys.length > 1 ? 's' : ''} au total.
              </div>
              {allKeys.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune donnée saisie. Commencez par sélectionner un élément dans l'onglet <strong>Familles</strong>.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs bg-white rounded-xl border border-gray-200 shadow-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 sticky left-0 bg-gray-50">Nom</th>
                        <th className="text-center px-3 py-3">CI</th>
                        <th className="text-center px-3 py-3">CE</th>
                        <th className="text-center px-3 py-3">Risque</th>
                        <th className="text-center px-3 py-3">Opport.</th>
                        <th className="text-center px-3 py-3">Positionnement</th>
                        <th className="text-right px-3 py-3">CA (k€)</th>
                        <th className="text-right px-3 py-3">Bud. prev.</th>
                        <th className="text-right px-3 py-3">Cmdes/an</th>
                        <th className="text-right px-3 py-3">Fournisseurs</th>
                        <th className="text-left px-3 py-3">Levier</th>
                        <th className="text-center px-3 py-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allKeys.map((nom, idx) => {
                        const ci = getCIScore(nom);
                        const ce = getCEScore(nom);
                        const risk = getRisqueScore(nom);
                        const profit = profitStore[nom] || 0;
                        const d = donneesStore[nom] ?? EMPTY_DONNEES;
                        const quad = quadrant(ci, ce);
                        const levier = getLevier(ci, ce, risk, profit);
                        const status = getElementStatus(nom);
                        return (
                          <tr
                            key={nom + idx}
                            onClick={() => { setSelectedElement(nom); setActiveTab(0); setDetailTab(0); }}
                            className="border-b border-gray-50 hover:bg-[#f4faf9] cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-2.5 font-semibold text-gray-800 sticky left-0 bg-white">{nom}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-indigo-600">{ci || '—'}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-amber-600">{ce || '—'}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                risk >= 20 ? 'bg-red-100 text-red-700' :
                                risk >= 10 ? 'bg-amber-100 text-amber-700' :
                                risk > 0   ? 'bg-green-100 text-green-700' : 'text-gray-300'
                              }`}>{risk || '—'}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center text-[#2F5B58] font-semibold">{profit || '—'}</td>
                            <td className="px-3 py-2.5 text-center">
                              {ci > 0 || ce > 0
                                ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${quad.color}`}>{quad.label}</span>
                                : <span className="text-gray-300">—</span>
                              }
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{d.ca ? d.ca.toLocaleString() : '—'}</td>
                            <td className="px-3 py-2.5 text-right text-gray-500">{d.budgetPrev ? d.budgetPrev.toLocaleString() : '—'}</td>
                            <td className="px-3 py-2.5 text-right text-gray-500">{d.nbCommandes || '—'}</td>
                            <td className="px-3 py-2.5 text-right text-gray-500">{d.nbFournisseurs || '—'}</td>
                            <td className="px-3 py-2.5 text-gray-600 text-[10px]">{levier}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`w-2 h-2 rounded-full inline-block ${
                                status === 'complete' ? 'bg-green-500' :
                                status === 'partial'  ? 'bg-amber-400' : 'bg-gray-200'
                              }`} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="bg-[#e8f4f3] border border-[#a7d4d1] rounded-xl p-4 flex gap-3 text-xs text-[#1e3d3b]">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2F5B58]" />
                <div>
                  Cliquez sur une ligne pour retourner à la fiche de cet élément.
                  Utilisez <strong>JSON</strong> pour sauvegarder/restaurer toute l'analyse, et <strong>Excel</strong> pour exporter les données dans un tableur.
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

// Fiche données financières & opérationnelles
function FicheElement({ nom, donnees, onUpdate }: {
  nom: string;
  donnees: DonneesElement;
  onUpdate: (field: keyof DonneesElement, val: number | string) => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Données financières & opérationnelles" icon={<FileText className="w-4 h-4" />} />
        <div className="p-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Chiffre d'affaires <span className="text-gray-400 font-normal">(k€)</span>
              </label>
              <input
                type="number" min={0} step={1}
                value={donnees.ca || ''}
                onChange={e => onUpdate('ca', parseFloat(e.target.value) || 0)}
                placeholder="Ex : 1 200"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Dimensionne les bulles dans les matrices</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Budget prévisionnel <span className="text-gray-400 font-normal">(k€)</span>
              </label>
              <input
                type="number" min={0} step={1}
                value={donnees.budgetPrev || ''}
                onChange={e => onUpdate('budgetPrev', parseFloat(e.target.value) || 0)}
                placeholder="Ex : 1 500"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Nombre de commandes <span className="text-gray-400 font-normal">/ an</span>
              </label>
              <input
                type="number" min={0} step={1}
                value={donnees.nbCommandes || ''}
                onChange={e => onUpdate('nbCommandes', parseInt(e.target.value) || 0)}
                placeholder="Ex : 48"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                Fournisseurs actifs
              </label>
              <input
                type="number" min={0} step={1}
                value={donnees.nbFournisseurs || ''}
                onChange={e => onUpdate('nbFournisseurs', parseInt(e.target.value) || 0)}
                placeholder="Ex : 3"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-600 block mb-1.5">Notes libres</label>
            <textarea
              rows={3}
              value={donnees.notes || ''}
              onChange={e => onUpdate('notes', e.target.value)}
              placeholder="Observations, contexte marché, spécificités, fournisseurs clés…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#2F5B58] focus:outline-none resize-none"
            />
          </div>
        </div>
      </Card>
      <div className="bg-[#e8f4f3] border border-[#a7d4d1] rounded-xl p-4 flex gap-3 text-xs text-[#1e3d3b]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#2F5B58]" />
        <div>
          <strong>Connexion données financières (à venir)</strong> — Ces champs seront prochainement alimentés automatiquement depuis votre système d'information.
          En attendant, saisissez les valeurs de référence. Les données sont <strong>sauvegardées automatiquement</strong> et exportables via JSON ou Excel.
        </div>
      </div>
    </div>
  );
}

// Porter field (local state — non persisté entre sessions)
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
    return '⚙️ Optimisation interne';
  }
  return '🚨 Gestion de crise + plan de continuité';
}
