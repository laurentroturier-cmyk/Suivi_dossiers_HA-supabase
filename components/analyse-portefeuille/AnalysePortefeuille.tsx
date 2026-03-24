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
  "Diversité / complexité des outillages requis",
  "Dossier technique incomplet ou instable",
  "Niveau d'exigence technique inhabituel (surqualité)",
  "Faible ouverture aux solutions de substitution",
  "Difficulté d'intégration au SI / existant technique",
  "Absence de standardisation des besoins",
  "Multiplicité des parties prenantes techniques",
];
const CIC_ITEMS = [
  "Connaissance tardive ou imprécise des besoins",
  "Fournisseur imposé / historique fort",
  "Limites géographiques imposées en interne",
  "Lourdeurs administratives freinant l'achat",
  "Manque de communication interne",
  "Fragmentation des besoins (non-massification)",
  "Urgences récurrentes / achats non planifiés",
  "Gouvernance lourde / arbitrages longs",
];
const CET_ITEMS = [
  "Dépendance technique vis-à-vis des fournisseurs",
  "Coût de transfert (outillage, compétences, réversibilité)",
  "Maîtrise de la technologie par peu d'acteurs",
  "Contraintes normatives (écologie, sécurité, certifications)",
  "Manque de flexibilité des fournisseurs",
  "Complexité technique des solutions du marché",
  "Interopérabilité limitée / standards propriétaires",
  "Risques liés à la cybersécurité / robustesse technique",
];
const CEC_ITEMS = [
  "Entente ou faible concurrence sur le marché",
  "Instabilité du marché (prix, acteurs, conditions)",
  "Réglementation contraignante",
  "Situation relationnelle tendue avec les fournisseurs",
  "Usages / pratiques du secteur contraignants",
  "Inflation ou tension économique sectorielle",
  "Pénurie de ressources (capacités fournisseurs)",
  "Concentration du marché (dépendance géographique ou acteurs dominants)",
];

const RISQUES_ECO     = ['Volatilité des prix (matières premières, énergie)', 'Dépendance à un fournisseur (mono-source)', 'Santé financière des fournisseurs', 'Risque de dérive budgétaire'];
const RISQUES_MARCHE  = ['Faible concurrence / marché oligopolistique', "Rareté de l'offre", "Barrières à l'entrée élevées", 'Tension sur les capacités de production'];
const RISQUES_CONTRAT = ['Complexité du montage contractuel', 'Risque de contentieux', 'Clauses mal définies ou incomplètes', 'Non-conformité au cadre réglementaire (commande publique)'];
const RISQUES_OPE     = ['Défaillance fournisseur (retard, non-livraison)', 'Problèmes de qualité', 'Dépendance à des compétences clés', "Difficulté de mise en œuvre (technique ou organisationnelle)"];
const RISQUES_STRAT   = ["Désalignement avec la stratégie de l'organisation", 'Effet de verrouillage (lock-in fournisseur)', 'Perte de maîtrise interne', 'Sensibilité du projet (politique, médiatique)'];
const RISQUES_TECH    = ['Obsolescence rapide', "Dépendance à une technologie propriétaire", "Difficulté d'intégration au SI existant", 'Cybersécurité / vulnérabilités'];
const RISQUES_RSE     = ['Non-respect des normes environnementales', 'Risques sociaux (conditions de travail, sous-traitance)', "Atteinte à l'image / réputation", 'Non-conformité réglementaire (RGPD, devoir de vigilance…)'];
const RISQUES_LOG     = ["Rupture d'approvisionnement", 'Allongement des délais de livraison', 'Dépendance géographique (zones à risque)', 'Transport et contraintes douanières'];
const RISQUES_INTERNE = ['Manque de ressources internes (temps, compétences)', 'Résistance au changement', 'Mauvaise définition du besoin', 'Faible pilotage du marché (suivi, KPI)'];

type RisqueData = { eco: {prob:number;delai:number}[]; marche: {prob:number;delai:number}[]; contrat: {prob:number;delai:number}[]; ope: {prob:number;delai:number}[]; strat: {prob:number;delai:number}[]; tech: {prob:number;delai:number}[]; rse: {prob:number;delai:number}[]; log: {prob:number;delai:number}[]; interne: {prob:number;delai:number}[] };
const EMPTY_RISQUE = (): RisqueData => ({
  eco: RISQUES_ECO.map(() => ({ prob: 0, delai: 0 })),
  marche: RISQUES_MARCHE.map(() => ({ prob: 0, delai: 0 })),
  contrat: RISQUES_CONTRAT.map(() => ({ prob: 0, delai: 0 })),
  ope: RISQUES_OPE.map(() => ({ prob: 0, delai: 0 })),
  strat: RISQUES_STRAT.map(() => ({ prob: 0, delai: 0 })),
  tech: RISQUES_TECH.map(() => ({ prob: 0, delai: 0 })),
  rse: RISQUES_RSE.map(() => ({ prob: 0, delai: 0 })),
  log: RISQUES_LOG.map(() => ({ prob: 0, delai: 0 })),
  interne: RISQUES_INTERNE.map(() => ({ prob: 0, delai: 0 })),
});

const OPPORT_ECO    = ['Gains financiers (réduction des coûts, TCO)', 'Effet volume / massification des achats', 'Opportunité de renégociation tarifaire', 'Standardisation des besoins'];
const OPPORT_MARCHE = ['Intensité concurrentielle', 'Arrivée de nouveaux entrants', 'Innovation fournisseurs', 'Maturité du marché (croissance vs saturé)'];
const OPPORT_PERF   = ['Possibilité de mise en concurrence efficace', 'Capacité à structurer un marché (allotissement, sourcing)', 'Optimisation contractuelle (durée, clauses, pénalités)', 'Digitalisation / automatisation du processus'];
const OPPORT_INNOV  = ["Apport d'innovation (technique, organisationnelle)", 'Amélioration de la qualité du service ou produit', 'Gains de productivité internes', 'Accès à de nouvelles technologies'];
const OPPORT_STRAT  = ["Contribution aux objectifs de l'organisation", 'Alignement avec la stratégie (ex : transformation digitale)', 'Visibilité interne / projet structurant', "Effet levier sur d'autres projets"];
const OPPORT_RSE    = ["Réduction de l'empreinte carbone", 'Intégration de critères sociaux (insertion, emploi local)', 'Achats responsables / durables', 'Image et conformité réglementaire'];
const OPPORT_ORGA   = ['Simplification des processus internes', 'Réduction du nombre de fournisseurs', 'Amélioration du pilotage (KPI, reporting)', 'Mutualisation inter-services'];
const OPPORT_SECU   = ['Pérennisation des approvisionnements', 'Développement de partenariats stratégiques', 'Meilleure maîtrise des dépendances fournisseurs', 'Anticipation des évolutions réglementaires'];

type OpportunData = { eco: number[]; marche: number[]; perf: number[]; innov: number[]; strat: number[]; rse: number[]; orga: number[]; secu: number[] };
const EMPTY_OPPORTUN = (): OpportunData => ({
  eco: OPPORT_ECO.map(() => 0), marche: OPPORT_MARCHE.map(() => 0), perf: OPPORT_PERF.map(() => 0),
  innov: OPPORT_INNOV.map(() => 0), strat: OPPORT_STRAT.map(() => 0), rse: OPPORT_RSE.map(() => 0),
  orga: OPPORT_ORGA.map(() => 0), secu: OPPORT_SECU.map(() => 0),
});

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

// ─── Couverture contractuelle ─────────────────────────────────────────────────

interface CouvertureContractuelle {
  noteGlobale: number;        // 0-5
  axes: {
    formalisation: number;    // 0-5 — Existence de contrats formels
    clauses: number;          // 0-5 — Qualité des clauses (prix, délais, pénalités)
    sortie: number;           // 0-5 — Clauses de sortie / résiliation
    revision: number;         // 0-5 — Révision de prix / indexation
    sla: number;              // 0-5 — SLA définis et mesurables
    conformite: number;       // 0-5 — Conformité réglementaire
  };
  observations: string;
  actions: string[];
}

const EMPTY_COUVERTURE = (): CouvertureContractuelle => ({
  noteGlobale: -1,
  axes: { formalisation: -1, clauses: -1, sortie: -1, revision: -1, sla: -1, conformite: -1 },
  observations: '',
  actions: [],
});

const COUVERTURE_LEVELS = [
  { note: 0, label: 'Sécurisé',       color: 'bg-green-100 text-green-800 border-green-200',  desc: 'Couverture contractuelle optimale. Tous les contrats sont à jour, robustes et couvrent tous les risques possibles.' },
  { note: 1, label: 'Très bon niveau', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Contrats bien structurés avec quelques ajustements possibles (ex. : renforcement des clauses de sortie ou des pénalités).' },
  { note: 2, label: 'Acceptable',      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', desc: 'Certains contrats manquent de précisions ou ne couvrent pas tous les risques. Risques modérés mais restent gérables.' },
  { note: 3, label: 'Moyen',           color: 'bg-orange-100 text-orange-800 border-orange-200', desc: 'Zones d\'ombre contractuelles importantes. Pas de SLA définis, clauses de résiliation imprécises. Actions correctives nécessaires.' },
  { note: 4, label: 'Faible',          color: 'bg-red-100 text-red-800 border-red-200',     desc: 'Peu ou pas de contrats formels, ou contrats très déséquilibrés. Forte exposition aux risques. Mesures d\'urgence requises.' },
  { note: 5, label: 'Critique',        color: 'bg-red-200 text-red-900 border-red-300',     desc: 'Absence totale de cadre contractuel ou contrats caducs. Aucun levier juridique. Situation à traiter en priorité absolue.' },
];

const AXES_LABELS: Record<keyof CouvertureContractuelle['axes'], string> = {
  formalisation: 'Existence de contrats formels',
  clauses:       'Qualité des clauses (prix, délais, pénalités)',
  sortie:        'Clauses de sortie / résiliation',
  revision:      'Révision de prix / indexation',
  sla:           'SLA définis et mesurables',
  conformite:    'Conformité réglementaire',
};

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
  const [supabaseSaving, setSupabaseSaving] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
  const [risquesStore, setRisquesStore] = useState<Record<string, RisqueData>>({});
  const [swotStore, setSwotStore] = useState<Record<string, {
    s: string[]; w: string[]; o: string[]; t: string[];
  }>>({});
  const [opportunStore, setOpportunStore] = useState<Record<string, OpportunData>>({});
  const [donneesStore, setDonneesStore]   = useState<Record<string, DonneesElement>>({});
  const [couvertureStore, setCouvertureStore] = useState<Record<string, CouvertureContractuelle>>({});
  const [newCouvertureAction, setNewCouvertureAction] = useState('');

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

  // ─── Fonctions Supabase ───────────────────────────────────────────────────
  const loadFromSupabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('analyse_portefeuille_data')
        .select('element_nom, donnees, contraintes, risques, opportunites, swot, porter, couverture_contractuelle')
        .eq('user_id', user.id);
      if (error) throw error;
      if (!data || data.length === 0) return;

      const newDonnees: Record<string, DonneesElement> = {};
      const newContraintes: Record<string, any> = {};
      const newRisques: Record<string, RisqueData> = {};
      const newOpportun: Record<string, OpportunData> = {};
      const newSwot: Record<string, any> = {};
      const newCouverture: Record<string, CouvertureContractuelle> = {};

      data.forEach((row: any) => {
        const nom = row.element_nom;
        if (row.donnees && Object.keys(row.donnees).length > 0)     newDonnees[nom]     = row.donnees;
        if (row.contraintes && Object.keys(row.contraintes).length > 0) newContraintes[nom] = row.contraintes;
        if (row.risques && Object.keys(row.risques).length > 0)     newRisques[nom]     = row.risques;
        if (row.opportunites && Object.keys(row.opportunites).length > 0) newOpportun[nom] = row.opportunites;
        if (row.swot && Object.keys(row.swot).length > 0)           newSwot[nom]        = row.swot;
        if (row.couverture_contractuelle && Object.keys(row.couverture_contractuelle).length > 0) newCouverture[nom] = row.couverture_contractuelle;
      });

      if (Object.keys(newDonnees).length > 0)     setDonneesStore(newDonnees);
      if (Object.keys(newContraintes).length > 0) setContraintesStore(newContraintes);
      if (Object.keys(newRisques).length > 0)     setRisquesStore(newRisques);
      if (Object.keys(newOpportun).length > 0)    setOpportunStore(newOpportun);
      if (Object.keys(newSwot).length > 0)        setSwotStore(newSwot);
      if (Object.keys(newCouverture).length > 0)  setCouvertureStore(newCouverture);
    } catch (err) {
      console.error('Erreur chargement Supabase:', err);
    }
  }, []);

  const saveToSupabase = useCallback(async () => {
    setSupabaseSaving(true);
    setSupabaseStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Collecter tous les éléments ayant au moins une donnée
      const allKeys = [...new Set([
        ...Object.keys(donneesStore),
        ...Object.keys(contraintesStore),
        ...Object.keys(risquesStore),
        ...Object.keys(opportunStore),
        ...Object.keys(swotStore),
        ...Object.keys(couvertureStore),
      ])];

      if (allKeys.length === 0) {
        setSupabaseStatus('saved');
        return;
      }

      const rows = allKeys.map(nom => ({
        user_id:                  user.id,
        element_nom:              nom,
        donnees:                  donneesStore[nom]     || {},
        contraintes:              contraintesStore[nom] || {},
        risques:                  risquesStore[nom]     || {},
        opportunites:             opportunStore[nom]    || {},
        swot:                     swotStore[nom]        || {},
        porter:                   {},
        couverture_contractuelle: couvertureStore[nom]  || {},
      }));

      // Upsert par batch de 50
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error } = await supabase
          .from('analyse_portefeuille_data')
          .upsert(batch, { onConflict: 'user_id,element_nom' });
        if (error) throw error;
      }

      setSupabaseStatus('saved');
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);
      setTimeout(() => setSupabaseStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde Supabase:', err);
      setSupabaseStatus('error');
      setTimeout(() => setSupabaseStatus('idle'), 4000);
    } finally {
      setSupabaseSaving(false);
    }
  }, [donneesStore, contraintesStore, risquesStore, opportunStore, swotStore, couvertureStore]);

  // ─── Persistence localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('analyse-portefeuille');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.contraintesStore)  setContraintesStore(d.contraintesStore);
        if (d.risquesStore)      setRisquesStore(d.risquesStore);
        if (d.swotStore)         setSwotStore(d.swotStore);
        if (d.opportunStore)     setOpportunStore(d.opportunStore);
        if (d.donneesStore)      setDonneesStore(d.donneesStore);
        if (d.couvertureStore)   setCouvertureStore(d.couvertureStore);
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
    // Charger depuis Supabase (priorité sur localStorage)
    loadFromSupabase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('analyse-portefeuille', JSON.stringify({
        contraintesStore, risquesStore, swotStore, opportunStore, donneesStore, selectedElement, couvertureStore,
      }));
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    } catch {}
  }, [contraintesStore, risquesStore, swotStore, opportunStore, donneesStore, selectedElement, couvertureStore]);

  // Auto-save Supabase (debounce 10s)
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasData = Object.keys(donneesStore).length > 0 ||
                      Object.keys(contraintesStore).length > 0 ||
                      Object.keys(risquesStore).length > 0;
      if (hasData) saveToSupabase();
    }, 10000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donneesStore, contraintesStore, risquesStore, opportunStore, swotStore, couvertureStore, saveToSupabase]);

  // ─── Helpers données ─────────────────────────────────────────────────────
  const getDonnees = (nom: string): DonneesElement => donneesStore[nom] ?? { ...EMPTY_DONNEES };
  const updateDonnees = useCallback((nom: string, field: keyof DonneesElement, val: number | string) => {
    setDonneesStore(prev => ({
      ...prev,
      [nom]: { ...(prev[nom] ?? { ...EMPTY_DONNEES }), [field]: val },
    }));
  }, []);

  // ─── Helpers couverture contractuelle ─────────────────────────────────────
  const getCouverture = (famille: string): CouvertureContractuelle =>
    couvertureStore[famille] || EMPTY_COUVERTURE();

  const updateCouverture = useCallback((famille: string, patch: Partial<CouvertureContractuelle>) => {
    setCouvertureStore(prev => ({
      ...prev,
      [famille]: { ...( prev[famille] || EMPTY_COUVERTURE()), ...patch },
    }));
  }, [couvertureStore]);

  const updateCouvertureAxe = useCallback((famille: string, axe: keyof CouvertureContractuelle['axes'], val: number) => {
    setCouvertureStore(prev => {
      const current = prev[famille] || EMPTY_COUVERTURE();
      return { ...prev, [famille]: { ...current, axes: { ...current.axes, [axe]: val } } };
    });
  }, []);

  const addCouvertureAction = useCallback((famille: string, action: string) => {
    if (!action.trim()) return;
    setCouvertureStore(prev => {
      const current = prev[famille] || EMPTY_COUVERTURE();
      return { ...prev, [famille]: { ...current, actions: [...current.actions, action.trim()] } };
    });
  }, []);

  const removeCouvertureAction = useCallback((famille: string, idx: number) => {
    setCouvertureStore(prev => {
      const current = prev[famille] || EMPTY_COUVERTURE();
      const actions = current.actions.filter((_, i) => i !== idx);
      return { ...prev, [famille]: { ...current, actions } };
    });
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
  const getRisques = (famille: string): RisqueData => risquesStore[famille] || EMPTY_RISQUE();

  const updateRisque = (famille: string, cat: keyof RisqueData, idx: number, field: 'prob' | 'delai', val: number) => {
    setRisquesStore(prev => {
      const current = getRisques(famille);
      const updated = { ...current, [cat]: current[cat].map((r, i) => i === idx ? { ...r, [field]: val } : r) };
      return { ...prev, [famille]: updated };
    });
  };

  const getRisqueScore = useCallback((famille: string) => {
    const r = getRisques(famille);
    const score = (arr: { prob: number; delai: number }[]) =>
      arr.reduce((s, x) => s + x.prob * x.delai, 0);
    const allCats = [r.eco, r.marche, r.contrat, r.ope, r.strat, r.tech, r.rse, r.log, r.interne];
    const total = allCats.reduce((s, arr) => s + score(arr), 0);
    return Math.min(30, Math.round((total / (9 * 4 * 25)) * 30));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risquesStore]);

  const getRisqueLevel = (prob: number, delai: number) => {
    const s = prob * delai;
    if (s >= 15) return { label: 'Fort', cls: 'bg-red-100 text-red-700' };
    if (s >= 8)  return { label: 'Moyen', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Faible', cls: 'bg-green-100 text-green-700' };
  };

  // ─── Opportunités helpers ────────────────────────────────────────────────
  const getOpportun = (famille: string): OpportunData => opportunStore[famille] || EMPTY_OPPORTUN();
  const updateOpportun = (famille: string, cat: keyof OpportunData, idx: number, val: number) => {
    setOpportunStore(prev => {
      const current = prev[famille] || EMPTY_OPPORTUN();
      return { ...prev, [famille]: { ...current, [cat]: current[cat].map((v, i) => i === idx ? val : v) } };
    });
  };
  const getOpportunScore = useCallback((famille: string) => {
    const o = opportunStore[famille];
    if (!o) return 0;
    const allItems = [...o.eco, ...o.marche, ...o.perf, ...o.innov, ...o.strat, ...o.rse, ...o.orga, ...o.secu];
    const total = allItems.reduce((s, v) => s + v, 0);
    return Math.min(30, Math.round((total / (8 * 4 * 5)) * 30));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunStore]);

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
      getOpportunScore(nom) > 0,
      swot.s.length + swot.w.length + swot.o.length + swot.t.length > 0,
      !!(d && (d.ca > 0 || d.nbCommandes > 0 || d.nbFournisseurs > 0)),
    ];
    const score = checks.filter(Boolean).length;
    if (score >= 4) return 'complete';
    if (score >= 1) return 'partial';
    return 'empty';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contraintesStore, risquesStore, opportunStore, swotStore, donneesStore]);

  // ─── Refs ────────────────────────────────────────────────────────────────
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const importExcelRef  = useRef<HTMLInputElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const rpCanvasRef     = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef  = useRef<HTMLCanvasElement>(null);
  const barCanvasRef    = useRef<HTMLCanvasElement>(null);

  // ─── État onglet Graphiques ───────────────────────────────────────────────
  const [radarElement, setRadarElement] = useState<string>('');

  // ─── Export JSON ─────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      selectedElement,
      contraintesStore, risquesStore, swotStore, opportunStore, donneesStore,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-portefeuille-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedElement, contraintesStore, risquesStore, swotStore, opportunStore, donneesStore]);

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
        if (data.opportunStore)    setOpportunStore(data.opportunStore);
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

  // ─── Import Excel ─────────────────────────────────────────────────────────
  const importExcel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'array' });

        const newDonnees: Record<string, DonneesElement> = {};
        const newContraintes: Record<string, { cit: ContrainteNote[]; cic: ContrainteNote[]; cet: ContrainteNote[]; cec: ContrainteNote[] }> = {};
        const newRisques: Record<string, RisqueData> = {};
        const newOpportun: Record<string, OpportunData> = {};
        const newSwot: Record<string, { s: string[]; w: string[]; o: string[]; t: string[] }> = {};

        // ── Sheet "Données" ──────────────────────────────────────────────
        const wsDon = wb.Sheets['Données'];
        if (wsDon) {
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsDon, { defval: '' });
          rows.forEach(row => {
            const elem = String(row['Élément'] ?? '').trim();
            if (!elem) return;
            newDonnees[elem] = {
              ca:             parseFloat(String(row['CA (k€)'] ?? '0')) || 0,
              budgetPrev:     parseFloat(String(row['Budget prev. (k€)'] ?? '0')) || 0,
              nbCommandes:    parseInt(String(row['Nb commandes/an'] ?? '0'), 10) || 0,
              nbFournisseurs: parseInt(String(row['Nb fournisseurs'] ?? '0'), 10) || 0,
              notes:          String(row['Notes'] ?? ''),
            };
          });
        }

        // ── Sheet "Contraintes" ───────────────────────────────────────────
        const wsCI = wb.Sheets['Contraintes'];
        if (wsCI) {
          // Mapping label → index pour chaque catégorie
          const citMap: Record<string, number> = {};
          CIT_ITEMS.forEach((lbl, i) => { citMap[lbl] = i; });
          const cicMap: Record<string, number> = {};
          CIC_ITEMS.forEach((lbl, i) => { cicMap[lbl] = i; });
          const cetMap: Record<string, number> = {};
          CET_ITEMS.forEach((lbl, i) => { cetMap[lbl] = i; });
          const cecMap: Record<string, number> = {};
          CEC_ITEMS.forEach((lbl, i) => { cecMap[lbl] = i; });

          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsCI, { defval: '' });
          rows.forEach(row => {
            const elem = String(row['Élément'] ?? '').trim();
            const cat  = String(row['Catégorie'] ?? '').trim().toUpperCase();
            const item = String(row['Item'] ?? '').trim();
            const note = parseInt(String(row['Note (0-5)'] ?? '0'), 10) || 0;
            if (!elem || !cat || !item) return;

            if (!newContraintes[elem]) {
              newContraintes[elem] = {
                cit: CIT_ITEMS.map(() => ({ note: 0, evo: 0 })),
                cic: CIC_ITEMS.map(() => ({ note: 0, evo: 0 })),
                cet: CET_ITEMS.map(() => ({ note: 0, evo: 0 })),
                cec: CEC_ITEMS.map(() => ({ note: 0, evo: 0 })),
              };
            }

            if (cat === 'CIT' && citMap[item] !== undefined) {
              newContraintes[elem].cit[citMap[item]] = { note, evo: 0 };
            } else if (cat === 'CIC' && cicMap[item] !== undefined) {
              newContraintes[elem].cic[cicMap[item]] = { note, evo: 0 };
            } else if (cat === 'CET' && cetMap[item] !== undefined) {
              newContraintes[elem].cet[cetMap[item]] = { note, evo: 0 };
            } else if (cat === 'CEC' && cecMap[item] !== undefined) {
              newContraintes[elem].cec[cecMap[item]] = { note, evo: 0 };
            }
          });
        }

        // ── Sheet "Risques" ───────────────────────────────────────────────
        const wsRisk = wb.Sheets['Risques'];
        if (wsRisk) {
          // Mapping label → { cat, idx }
          type RisqueCatKey = keyof RisqueData;
          const risqueMap: Record<string, { cat: RisqueCatKey; idx: number }> = {};
          ([
            { key: 'eco'     as RisqueCatKey, items: RISQUES_ECO },
            { key: 'marche'  as RisqueCatKey, items: RISQUES_MARCHE },
            { key: 'contrat' as RisqueCatKey, items: RISQUES_CONTRAT },
            { key: 'ope'     as RisqueCatKey, items: RISQUES_OPE },
            { key: 'strat'   as RisqueCatKey, items: RISQUES_STRAT },
            { key: 'tech'    as RisqueCatKey, items: RISQUES_TECH },
            { key: 'rse'     as RisqueCatKey, items: RISQUES_RSE },
            { key: 'log'     as RisqueCatKey, items: RISQUES_LOG },
            { key: 'interne' as RisqueCatKey, items: RISQUES_INTERNE },
          ]).forEach(({ key, items }) => {
            items.forEach((lbl, idx) => { risqueMap[lbl] = { cat: key, idx }; });
          });

          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsRisk, { defval: '' });
          rows.forEach(row => {
            const elem  = String(row['Élément'] ?? '').trim();
            const risqu = String(row['Risque'] ?? '').trim();
            const prob  = parseInt(String(row['Probabilité'] ?? '0'), 10) || 0;
            const delai = parseInt(String(row['Urgence / Criticité'] ?? '0'), 10) || 0;
            if (!elem || !risqu) return;

            if (!newRisques[elem]) newRisques[elem] = EMPTY_RISQUE();
            const mapping = risqueMap[risqu];
            if (mapping) {
              newRisques[elem][mapping.cat][mapping.idx] = { prob, delai };
            }
          });
        }

        // ── Sheet "Opportunités" ──────────────────────────────────────────
        const wsOpp = wb.Sheets['Opportunités'];
        if (wsOpp) {
          type OpportunCatKey = keyof OpportunData;
          const opportunMap: Record<string, { cat: OpportunCatKey; idx: number }> = {};
          ([
            { key: 'eco'    as OpportunCatKey, items: OPPORT_ECO },
            { key: 'marche' as OpportunCatKey, items: OPPORT_MARCHE },
            { key: 'perf'   as OpportunCatKey, items: OPPORT_PERF },
            { key: 'innov'  as OpportunCatKey, items: OPPORT_INNOV },
            { key: 'strat'  as OpportunCatKey, items: OPPORT_STRAT },
            { key: 'rse'    as OpportunCatKey, items: OPPORT_RSE },
            { key: 'orga'   as OpportunCatKey, items: OPPORT_ORGA },
            { key: 'secu'   as OpportunCatKey, items: OPPORT_SECU },
          ]).forEach(({ key, items }) => {
            items.forEach((lbl, idx) => { opportunMap[lbl] = { cat: key, idx }; });
          });

          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsOpp, { defval: '' });
          rows.forEach(row => {
            const elem   = String(row['Élément'] ?? '').trim();
            const critere = String(row['Critère'] ?? '').trim();
            const score  = parseInt(String(row['Score (0-5)'] ?? '0'), 10) || 0;
            if (!elem || !critere) return;

            if (!newOpportun[elem]) newOpportun[elem] = EMPTY_OPPORTUN();
            const mapping = opportunMap[critere];
            if (mapping) {
              newOpportun[elem][mapping.cat][mapping.idx] = score;
            }
          });
        }

        // ── Sheet "SWOT" ──────────────────────────────────────────────────
        const wsSwot = wb.Sheets['SWOT'];
        if (wsSwot) {
          const quadrantMap: Record<string, 's' | 'w' | 'o' | 't'> = {
            'Forces':       's',
            'Faiblesses':   'w',
            'Opportunités': 'o',
            'Menaces':      't',
          };
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wsSwot, { defval: '' });
          rows.forEach(row => {
            const elem     = String(row['Élément'] ?? '').trim();
            const quadrant = String(row['Quadrant'] ?? '').trim();
            const item     = String(row['Item'] ?? '').trim();
            if (!elem || !item) return;

            const q = quadrantMap[quadrant];
            if (!q) return;

            if (!newSwot[elem]) newSwot[elem] = { s: [], w: [], o: [], t: [] };
            newSwot[elem][q].push(item);
          });
        }

        // ── Application des stores ─────────────────────────────────────────
        if (Object.keys(newDonnees).length > 0)     setDonneesStore(newDonnees);
        if (Object.keys(newContraintes).length > 0)  setContraintesStore(newContraintes);
        if (Object.keys(newRisques).length > 0)      setRisquesStore(newRisques);
        if (Object.keys(newOpportun).length > 0)     setOpportunStore(newOpportun);
        if (Object.keys(newSwot).length > 0)         setSwotStore(newSwot);

        const total = new Set([
          ...Object.keys(newDonnees),
          ...Object.keys(newContraintes),
          ...Object.keys(newRisques),
          ...Object.keys(newOpportun),
          ...Object.keys(newSwot),
        ]).size;
        alert(`Import Excel réussi — ${total} élément${total > 1 ? 's' : ''} importé${total > 1 ? 's' : ''}.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        alert(`Erreur lors de l'import Excel : ${msg}`);
      }
    };
    reader.readAsArrayBuffer(file);
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
      ...Object.keys(opportunStore),
      ...Object.keys(donneesStore),
    ])].sort();

    // Feuille Synthèse
    const syntheHeaders = ['Nom', 'CI', 'CE', 'Risque', 'Opportunité', 'Positionnement', 'CA (k€)', 'Budget prev. (k€)', 'Nb commandes', 'Nb fournisseurs', 'Levier'];
    const syntheRows = allKeys.map(nom => {
      const ci = getCIScore(nom);
      const ce = getCEScore(nom);
      const risk = getRisqueScore(nom);
      const profit = getOpportunScore(nom);
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
    const riskHeaders = ['Élément', 'Catégorie', 'Risque', 'Probabilité', 'Urgence / Criticité'];
    const riskRows: (string | number)[][] = [];
    Object.entries(risquesStore).forEach(([key, val]) => {
      ([
        { cat: '1. Économique & financier', items: RISQUES_ECO,     data: val.eco },
        { cat: '2. Marché fournisseurs',    items: RISQUES_MARCHE,  data: val.marche },
        { cat: '3. Contractuel & juridique',items: RISQUES_CONTRAT, data: val.contrat },
        { cat: '4. Opérationnel',           items: RISQUES_OPE,     data: val.ope },
        { cat: '5. Stratégique',            items: RISQUES_STRAT,   data: val.strat },
        { cat: '6. Technologique',          items: RISQUES_TECH,    data: val.tech },
        { cat: '7. RSE & conformité',       items: RISQUES_RSE,     data: val.rse },
        { cat: '8. Logistique & SC',        items: RISQUES_LOG,     data: val.log },
        { cat: '9. Interne',                items: RISQUES_INTERNE, data: val.interne },
      ] as { cat: string; items: string[]; data: {prob:number;delai:number}[] }[]).forEach(({ cat, items, data }) => {
        items.forEach((label, i) => riskRows.push([key, cat, label, data[i]?.prob ?? 0, data[i]?.delai ?? 0]));
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([riskHeaders, ...riskRows]), 'Risques');

    // Feuille Opportunités
    const opportHeaders = ['Élément', 'Catégorie', 'Critère', 'Score (0-5)'];
    const opportRows: (string | number)[][] = [];
    Object.entries(opportunStore).forEach(([key, val]) => {
      ([
        { cat: '1. Potentiel économique',           items: OPPORT_ECO,    data: val.eco },
        { cat: '2. Dynamique marché',               items: OPPORT_MARCHE, data: val.marche },
        { cat: '3. Leviers performance achats',     items: OPPORT_PERF,   data: val.perf },
        { cat: '4. Innovation et valeur ajoutée',   items: OPPORT_INNOV,  data: val.innov },
        { cat: '5. Impact stratégique',             items: OPPORT_STRAT,  data: val.strat },
        { cat: '6. RSE',                            items: OPPORT_RSE,    data: val.rse },
        { cat: '7. Optimisation organisationnelle', items: OPPORT_ORGA,   data: val.orga },
        { cat: '8. Sécurisation',                   items: OPPORT_SECU,   data: val.secu },
      ] as { cat: string; items: string[]; data: number[] }[]).forEach(({ cat, items, data }) => {
        items.forEach((label, i) => opportRows.push([key, cat, label, data[i] ?? 0]));
      });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([opportHeaders, ...opportRows]), 'Opportunités');

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
  }, [contraintesStore, risquesStore, swotStore, opportunStore, donneesStore, getCIScore, getCEScore, getRisqueScore, getOpportunScore]);

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

    // bas-gauche: Simples, bas-droite: Internes (CI↑), haut-gauche: Externes (CE↑), haut-droite: Difficiles
    const labels = ['Achats\nSimples', 'Achats\nInternes', 'Achats\nExternes', 'Achats\nDifficiles'];
    const qx = [W*0.25, W*0.75, W*0.25, W*0.75];
    const qy = [H*0.75, H*0.75, H*0.25, H*0.25];
    const qc = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];
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
      const cx = Math.max(r + 2, Math.min(W - r - 2, x));
      const cy = Math.max(r + 2, Math.min(H - r - 2, y));

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
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
        ctx.fillText(`${ca >= 1000 ? (ca/1000).toFixed(1)+'M' : ca+'k'}`, cx, cy + 3);
      }

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'center';
      const label = nom.length > 12 ? nom.substring(0, 11) + '…' : nom;
      ctx.fillText(label, cx, cy + r + 12);
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
    const opportunAnalyzed = Object.keys(opportunStore).filter(k => getOpportunScore(k) > 0);
    const rpKeys  = [...new Set([...riskAnalyzed, ...opportunAnalyzed])];
    const rpItems = rpKeys.length > 0 ? rpKeys : familles.map(f => f.nom);

    const PALETTE = ['#6c63ff', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#7c3aed', '#c2410c', '#059669', '#db2777'];

    const rpCaValues = rpItems.map(n => donneesStore[n]?.ca || 0);
    const rpMaxCA = Math.max(...rpCaValues, 1);
    const RP_MIN_R = 8, RP_MAX_R = 30, RP_DEFAULT_R = 18;

    rpItems.forEach((nom, idx) => {
      const risk   = getRisqueScore(nom);
      const opport = getOpportunScore(nom);
      const x = (risk / 30) * (W - 60) + 30;
      const y = H - (opport / 30) * (H - 60) - 30;

      const isHighRisk   = risk   >= 15;
      const isHighOpport = opport >= 15;

      const quadColor = !isHighRisk && !isHighOpport ? '#16a34a' :
                         isHighRisk && !isHighOpport ? '#2563eb' :
                        !isHighRisk &&  isHighOpport ? '#d97706' : '#6c63ff';

      const bubbleColor = PALETTE[idx % PALETTE.length];
      const ca = donneesStore[nom]?.ca || 0;
      const r = ca > 0 ? RP_MIN_R + ((ca / rpMaxCA) * (RP_MAX_R - RP_MIN_R)) : RP_DEFAULT_R;
      const cx = Math.max(r + 2, Math.min(W - r - 2, x));
      const cy = Math.max(r + 2, Math.min(H - r - 2, y));

      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = bubbleColor + '33';
      ctx.strokeStyle = bubbleColor;
      ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();

      ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#1f2937'; ctx.textAlign = 'center';
      const short = nom.length > 14 ? nom.substring(0, 13) + '…' : nom;
      ctx.fillText(short, cx, cy + r + 10);

      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = quadColor; ctx.fill();
    });
  }, [activeTab, familles, risquesStore, opportunStore, donneesStore, getRisqueScore, getOpportunScore]);

  // ─── Init radarElement quand les données changent ─────────────────────────
  useEffect(() => {
    const allKeys = [...new Set([
      ...Object.keys(contraintesStore),
      ...Object.keys(risquesStore),
      ...Object.keys(opportunStore),
    ])].sort();
    if (!radarElement && allKeys.length > 0) setRadarElement(allKeys[0]);
  }, [contraintesStore, risquesStore, opportunStore]);

  // ─── Canvas radar (onglet 4) ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 4) return;
    const canvas = radarCanvasRef.current;
    if (!canvas || !radarElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 60;
    const N = 6;
    const labels = ['C. Int. Techniques', 'C. Int. Commerciales', 'C. Ext. Techniques', 'C. Ext. Commerciales', 'Risques', 'Opportunités'];

    const c = contraintesStore[radarElement];
    const citScore = c ? c.cit.reduce((s, x) => s + x.note, 0) / (CIT_ITEMS.length * 5) : 0;
    const cicScore = c ? c.cic.reduce((s, x) => s + x.note, 0) / (CIC_ITEMS.length * 5) : 0;
    const cetScore = c ? c.cet.reduce((s, x) => s + x.note, 0) / (CET_ITEMS.length * 5) : 0;
    const cecScore = c ? c.cec.reduce((s, x) => s + x.note, 0) / (CEC_ITEMS.length * 5) : 0;
    const riskNorm = getRisqueScore(radarElement) / 30;
    const opNorm   = getOpportunScore(radarElement) / 30;
    const values   = [citScore, cicScore, cetScore, cecScore, riskNorm, opNorm];

    // Grilles
    for (let g = 1; g <= 4; g++) {
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const angle = (i * 2 * Math.PI / N) - Math.PI / 2;
        const r = R * g / 4;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.stroke();
    }

    // Axes
    for (let i = 0; i < N; i++) {
      const angle = (i * 2 * Math.PI / N) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1; ctx.stroke();
    }

    // Données
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const angle = (i * 2 * Math.PI / N) - Math.PI / 2;
      const r = R * values[i];
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#2F5B5833'; ctx.fill();
    ctx.strokeStyle = '#2F5B58'; ctx.lineWidth = 2; ctx.stroke();

    // Points
    for (let i = 0; i < N; i++) {
      const angle = (i * 2 * Math.PI / N) - Math.PI / 2;
      const r = R * values[i];
      ctx.beginPath();
      ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#2F5B58'; ctx.fill();
    }

    // Labels
    ctx.font = '10px sans-serif'; ctx.fillStyle = '#374151'; ctx.textAlign = 'center';
    for (let i = 0; i < N; i++) {
      const angle = (i * 2 * Math.PI / N) - Math.PI / 2;
      const lx = cx + (R + 24) * Math.cos(angle);
      const ly = cy + (R + 24) * Math.sin(angle);
      const pct = Math.round(values[i] * 100);
      ctx.fillStyle = '#374151'; ctx.font = '10px sans-serif';
      ctx.fillText(labels[i], lx, ly);
      ctx.fillStyle = '#6b7280'; ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`${pct}%`, lx, ly + 12);
    }
  }, [activeTab, radarElement, contraintesStore, risquesStore, opportunStore, getRisqueScore, getOpportunScore]);

  // ─── Canvas histogramme comparatif (onglet 4) ─────────────────────────────
  useEffect(() => {
    if (activeTab !== 4) return;
    const canvas = barCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const allKeys = [...new Set([
      ...Object.keys(contraintesStore),
      ...Object.keys(risquesStore),
      ...Object.keys(opportunStore),
    ])].sort();

    if (allKeys.length === 0) return;

    const W = canvas.width = canvas.offsetWidth;
    const rowH = 40;
    const H = canvas.height = Math.max(200, allKeys.length * rowH + 30);
    ctx.clearRect(0, 0, W, H);

    const leftMargin = 130;
    const rightMargin = 20;
    const barAreaW = W - leftMargin - rightMargin;
    const barH = 7;
    const barGap = 3;
    const colors = ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

    allKeys.forEach((nom, rowIdx) => {
      const y0 = rowIdx * rowH + 15;
      const ci     = getCIScore(nom) / 100;
      const ce     = getCEScore(nom) / 100;
      const risk   = getRisqueScore(nom) / 30;
      const opport = getOpportunScore(nom) / 30;
      const vals   = [ci, ce, risk, opport];

      ctx.font = '10px sans-serif'; ctx.fillStyle = '#374151'; ctx.textAlign = 'right';
      const short = nom.length > 18 ? nom.substring(0, 17) + '…' : nom;
      ctx.fillText(short, leftMargin - 6, y0 + (barH + barGap) * 2);

      vals.forEach((v, bi) => {
        const barW = Math.max(2, v * barAreaW);
        const by = y0 + bi * (barH + barGap);
        ctx.fillStyle = colors[bi] + 'cc';
        ctx.fillRect(leftMargin, by, barW, barH);
        if (v > 0) {
          ctx.font = '8px sans-serif'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left';
          ctx.fillText(Math.round(v * 100) + '%', leftMargin + barW + 3, by + barH - 1);
        }
      });
    });
  }, [activeTab, contraintesStore, risquesStore, opportunStore, getCIScore, getCEScore, getRisqueScore, getOpportunScore]);

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
          <div className="flex items-center gap-2">
            {supabaseStatus === 'saved' && (
              <span className="text-[10px] text-green-600 italic border border-green-200 rounded px-2 py-1 bg-green-50">
                ☁ Sauvegardé Supabase {lastSaved}
              </span>
            )}
            {supabaseStatus === 'error' && (
              <span className="text-[10px] text-red-600 italic border border-red-200 rounded px-2 py-1 bg-red-50">
                ✗ Erreur sauvegarde
              </span>
            )}
            {supabaseStatus === 'saving' && (
              <span className="text-[10px] text-blue-500 italic border border-blue-200 rounded px-2 py-1 bg-blue-50">
                ↑ Sauvegarde...
              </span>
            )}
            {supabaseStatus === 'idle' && lastSaved && (
              <span className="text-[10px] text-gray-400 italic border border-gray-100 rounded px-2 py-1">
                ☁ {lastSaved}
              </span>
            )}
            <button
              onClick={saveToSupabase}
              disabled={supabaseSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              title="Sauvegarder dans Supabase (cloud)"
            >
              {supabaseSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Sauvegarder
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
          <input ref={importExcelRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={importExcel} />
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
            onClick={() => importExcelRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Importer depuis un fichier Excel (.xlsx)"
          >
            <Upload className="w-3.5 h-3.5" /> Importer Excel
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
          { icon: <BarChart2 className="w-3.5 h-3.5" />,  label: 'Graphiques',             count: undefined },
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
                            { label: 'Opportunités', done: getOpportunScore(selectedElement) > 0 },
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
                          { label: 'Opport.', value: getOpportunScore(selectedElement), max: 30, cls: 'text-[#2F5B58]' },
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
                      { label: 'Couverture',   icon: <Shield className="w-3.5 h-3.5" /> },
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
                    const cats: { key: keyof RisqueData; title: string; items: string[] }[] = [
                      { key: 'eco',     title: '1. Risques économiques et financiers',        items: RISQUES_ECO },
                      { key: 'marche',  title: '2. Risques liés au marché fournisseurs',      items: RISQUES_MARCHE },
                      { key: 'contrat', title: '3. Risques contractuels et juridiques',       items: RISQUES_CONTRAT },
                      { key: 'ope',     title: '4. Risques opérationnels',                    items: RISQUES_OPE },
                      { key: 'strat',   title: '5. Risques stratégiques',                     items: RISQUES_STRAT },
                      { key: 'tech',    title: '6. Risques technologiques',                   items: RISQUES_TECH },
                      { key: 'rse',     title: '7. Risques RSE et conformité',                items: RISQUES_RSE },
                      { key: 'log',     title: '8. Risques logistiques et supply chain',      items: RISQUES_LOG },
                      { key: 'interne', title: '9. Risques internes (organisation)',          items: RISQUES_INTERNE },
                    ];
                    return (
                      <div className="space-y-4">
                        {/* Bloc d'aide */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-2">
                          <p><strong>Comment remplir cet onglet ?</strong></p>
                          <p>Pour chaque risque listé, évaluez deux dimensions :</p>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                            <li><strong>Probabilité (0 → 5)</strong> — Quelle est la chance que ce risque survienne ? <span className="italic">0 = impossible · 5 = quasi-certain</span></li>
                            <li><strong>Urgence / Criticité (0 → 5)</strong> — Si le risque survient, quel est l'impact et l'urgence ? <span className="italic">0 = peu critique · 5 = impact majeur / urgent</span></li>
                          </ul>
                          <p className="pt-1"><strong>Niveau calculé automatiquement :</strong> Score = Probabilité × Urgence — les deux curseurs qui montent = risque plus élevé.</p>
                          <div className="flex gap-3 pt-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Fort ≥ 15</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Moyen ≥ 8</span>
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Faible &lt; 8</span>
                          </div>
                          <p className="pt-1">Le <strong>score global (/30)</strong> positionne cet élément sur l'axe X de la Matrice Opportunités/Risques. Plus il est élevé, plus l'achat est classé "Critique" ou "Stratégique".</p>
                        </div>
                        {cats.map(cat => (
                          <Card key={cat.key}>
                            <CardHeader title={cat.title} />
                            <div className="p-4 space-y-3">
                              {cat.items.map((label, idx) => {
                                const risk = r[cat.key][idx] ?? { prob: 0, delai: 0 };
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
                                      <SliderRow label="Urgence / Criticité" value={risk.delai}
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
                  {detailTab === 3 && (() => {
                    const o = getOpportun(analysisKey);
                    const cats: { key: keyof OpportunData; title: string; items: string[] }[] = [
                      { key: 'eco',    title: '1. Potentiel économique',                         items: OPPORT_ECO },
                      { key: 'marche', title: '2. Dynamique du marché fournisseurs',              items: OPPORT_MARCHE },
                      { key: 'perf',   title: '3. Leviers de performance achats',                 items: OPPORT_PERF },
                      { key: 'innov',  title: '4. Innovation et valeur ajoutée',                  items: OPPORT_INNOV },
                      { key: 'strat',  title: '5. Impact stratégique',                            items: OPPORT_STRAT },
                      { key: 'rse',    title: '6. Responsabilité sociétale et environnementale',  items: OPPORT_RSE },
                      { key: 'orga',   title: '7. Optimisation organisationnelle',                items: OPPORT_ORGA },
                      { key: 'secu',   title: '8. Sécurisation à moyen/long terme',               items: OPPORT_SECU },
                    ];
                    return (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                          <p><strong>Comment remplir cet onglet ?</strong> Pour chaque critère, évaluez le potentiel d'opportunité de 0 à 5.</p>
                          <p><span className="font-medium">0</span> = aucune opportunité &nbsp;·&nbsp; <span className="font-medium">3</span> = opportunité modérée &nbsp;·&nbsp; <span className="font-medium">5</span> = opportunité maximale</p>
                          <p>Le <strong>score global (/30)</strong> positionne cet élément sur l'axe Y de la Matrice Opportunités/Risques.</p>
                        </div>
                        {cats.map(cat => (
                          <Card key={cat.key}>
                            <CardHeader title={cat.title} />
                            <div className="p-4 space-y-2">
                              {cat.items.map((label, idx) => {
                                const val = o[cat.key][idx] || 0;
                                return (
                                  <div key={idx} className="flex items-center gap-3 py-1 border-b border-gray-50 last:border-0">
                                    <span className="text-xs text-gray-700 flex-1">{label}</span>
                                    <div className="flex items-center gap-2 w-40">
                                      <input type="range" min={0} max={5} value={val}
                                        onChange={e => updateOpportun(analysisKey, cat.key, idx, parseInt(e.target.value))}
                                        className="flex-1 h-1.5 accent-amber-500 cursor-pointer" />
                                      <span className="text-xs font-bold text-amber-600 w-4 text-center">{val}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Card>
                        ))}
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">Score opportunité global</span>
                            <span className={`text-2xl font-bold ${getOpportunScore(analysisKey) >= 20 ? 'text-amber-600' : getOpportunScore(analysisKey) >= 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {getOpportunScore(analysisKey)} <span className="text-sm text-gray-400">/ 30</span>
                            </span>
                          </div>
                          <div className="mt-3 p-3 bg-[#e8f4f3] border border-[#a7d4d1] rounded-lg text-xs text-[#1e3d3b]">
                            Ce score, combiné au score de risque ({getRisqueScore(analysisKey)}/30),
                            positionne cet élément dans la <strong>Matrice Opportunités/Risques</strong>.
                            {getLevier(getCIScore(analysisKey), getCEScore(analysisKey), getRisqueScore(analysisKey), getOpportunScore(analysisKey)) !== '— À évaluer' && (
                              <> Levier recommandé : <strong>{getLevier(getCIScore(analysisKey), getCEScore(analysisKey), getRisqueScore(analysisKey), getOpportunScore(analysisKey))}</strong></>
                            )}
                          </div>
                        </Card>
                      </div>
                    );
                  })()}

                  {/* ── Sous-onglet 4 : Porter ── */}
                  {detailTab === 4 && (
                    <div className="space-y-3">
                      {/* Bloc d'aide */}
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 space-y-1.5">
                        <p><strong>Analyse des 5 forces de Porter — adaptée aux achats</strong></p>
                        <p>Cet outil analyse le marché fournisseur de la famille <strong>{analysisKey}</strong> selon 5 angles :</p>
                        <ul className="list-disc list-inside space-y-0.5 pl-1">
                          <li><span className="font-medium text-indigo-700">Nouveaux entrants</span> — De nouveaux fournisseurs peuvent-ils entrer sur ce marché ? Combien, de quel type ?</li>
                          <li><span className="font-medium text-teal-700">Pouvoir fournisseurs</span> — Combien de fournisseurs existent ? Qui domine le marché ? Ont-ils un fort pouvoir de négociation ?</li>
                          <li><span className="font-medium text-amber-700">Pouvoir clients internes</span> — Combien de services internes consomment ce besoin ? Sont-ils dispersés ou concentrés ?</li>
                          <li><span className="font-medium text-red-700">Produits substituts</span> — Existe-t-il des alternatives technologiques ou organisationnelles à ce besoin ?</li>
                          <li><span className="font-medium text-purple-700">Rivalité concurrentielle</span> — Les fournisseurs se font-ils concurrence entre eux ? Le marché est-il mature ou tendu ?</li>
                        </ul>
                        <p className="pt-1 text-indigo-600 italic">Remplissez les champs librement — il n'y a pas de bonne ou mauvaise réponse, l'objectif est de poser un diagnostic qualitatif.</p>
                      </div>
                      <div className="grid grid-cols-3 grid-rows-3 gap-3" style={{ minHeight: 460 }}>
                        <div />
                        <Card className="p-4">
                          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">🆕 Nouveaux entrants</div>
                          <div className="text-[10px] text-gray-400 mb-3 italic">Fournisseurs susceptibles d'entrer sur ce marché</div>
                          <PorterField label="Qui peut entrer ?" placeholder="ex. 2-3 acteurs asiatiques, startups" famille={analysisKey} fieldKey="ne_nb" />
                          <PorterField label="Barrières à l'entrée" placeholder="ex. Fortes (certifications), Faibles" famille={analysisKey} fieldKey="ne_type" />
                        </Card>
                        <div />
                        <Card className="p-4">
                          <div className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-1">🏭 Pouvoir fournisseurs</div>
                          <div className="text-[10px] text-gray-400 mb-3 italic">Capacité des fournisseurs à imposer leurs conditions</div>
                          <PorterField label="Nb fournisseurs actifs" placeholder="ex. 12 (dont 3 leaders)" famille={analysisKey} fieldKey="f_nb" />
                          <PorterField label="Leaders du marché" placeholder="ex. Fournisseur A, B — part ~60 %" famille={analysisKey} fieldKey="f_leaders" />
                        </Card>
                        <Card className="flex items-center justify-center text-center p-4 bg-[#e8f4f3]">
                          <div>
                            <div className="font-bold text-[#2F5B58] text-sm mb-1">Marché analysé</div>
                            <div className="text-xs text-gray-500 mt-1">{analysisKey}</div>
                          </div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">🛒 Pouvoir clients internes</div>
                          <div className="text-[10px] text-gray-400 mb-3 italic">Services internes consommateurs de ce besoin</div>
                          <PorterField label="Nb de services / sites" placeholder="ex. 4 sites, 6 directions" famille={analysisKey} fieldKey="c_nb" />
                          <PorterField label="Type de consommateurs" placeholder="ex. Production, RH, Informatique" famille={analysisKey} fieldKey="c_type" />
                        </Card>
                        <div />
                        <Card className="p-4">
                          <div className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">💡 Produits substituts</div>
                          <div className="text-[10px] text-gray-400 mb-3 italic">Alternatives pouvant remplacer ce besoin</div>
                          <PorterField label="Alternatives identifiées" placeholder="ex. Impression 3D, internalisation" famille={analysisKey} fieldKey="ts_tech" />
                          <PorterField label="Horizon temporel" placeholder="ex. Disponible dans 2-3 ans" famille={analysisKey} fieldKey="ts_date" />
                        </Card>
                        <div />
                      </div>
                      <Card className="p-4">
                        <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">⚔️ Rivalité concurrentielle entre fournisseurs</div>
                        <div className="text-[10px] text-gray-400 mb-3 italic">Intensité de la concurrence entre les fournisseurs en place</div>
                        <PorterField label="Intensité" placeholder="ex. Forte — marché mature avec 10+ acteurs actifs" famille={analysisKey} fieldKey="rc_intensite" />
                        <PorterField label="Tendance du marché" placeholder="ex. En croissance / Saturé / En consolidation" famille={analysisKey} fieldKey="rc_tendance" />
                      </Card>
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

                  {/* ── Sous-onglet 6 : Couverture Contractuelle ── */}
                  {detailTab === 6 && (() => {
                    const cov = getCouverture(analysisKey);
                    const axeKeys = Object.keys(AXES_LABELS) as Array<keyof CouvertureContractuelle['axes']>;
                    const avgAxes = axeKeys.filter(k => cov.axes[k] >= 0).map(k => cov.axes[k]);
                    const avgNote = avgAxes.length > 0 ? Math.round(avgAxes.reduce((s, v) => s + v, 0) / avgAxes.length) : -1;
                    const displayNote = cov.noteGlobale >= 0 ? cov.noteGlobale : avgNote;
                    const levelInfo = displayNote >= 0 ? COUVERTURE_LEVELS[displayNote] : null;

                    return (
                      <div className="space-y-4">
                        {/* Note globale */}
                        <Card>
                          <CardHeader title="Note globale de couverture contractuelle (0 = Sécurisé · 5 = Critique)" icon={<Shield className="w-4 h-4" />} />
                          <div className="p-4 space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex gap-2 flex-wrap">
                                {COUVERTURE_LEVELS.map(l => (
                                  <button
                                    key={l.note}
                                    onClick={() => updateCouverture(analysisKey, { noteGlobale: cov.noteGlobale === l.note ? -1 : l.note })}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                      displayNote === l.note ? l.color + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                  >
                                    <span className="text-base font-bold">{l.note}</span>
                                    <span>{l.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            {levelInfo && (
                              <div className={`p-3 rounded-lg border text-xs ${levelInfo.color}`}>
                                <span className="font-semibold">{levelInfo.label} :</span> {levelInfo.desc}
                              </div>
                            )}
                            {cov.noteGlobale < 0 && avgNote >= 0 && (
                              <p className="text-[11px] text-gray-400 italic">Note calculée automatiquement depuis les axes : {avgNote} — {COUVERTURE_LEVELS[avgNote]?.label}</p>
                            )}
                          </div>
                        </Card>

                        {/* Axes d'évaluation */}
                        <Card>
                          <CardHeader title="Axes d'évaluation détaillés" />
                          <div className="p-4 space-y-1">
                            <div className="grid grid-cols-3 gap-x-4 text-[10px] text-gray-400 font-medium mb-2 px-1">
                              <span>Axe</span>
                              <span className="col-span-2 text-right pr-4">Note (0 = OK · 5 = Critique)</span>
                            </div>
                            {axeKeys.map(axe => (
                              <div key={axe} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                                <span className="text-[11px] text-gray-600 flex-1 leading-tight">{AXES_LABELS[axe]}</span>
                                <div className="flex items-center gap-1.5">
                                  {[-1, 0, 1, 2, 3, 4, 5].map(v => (
                                    <button
                                      key={v}
                                      onClick={() => updateCouvertureAxe(analysisKey, axe, v)}
                                      className={`w-6 h-6 rounded text-[10px] font-bold transition-all border ${
                                        cov.axes[axe] === v
                                          ? v < 0 ? 'bg-gray-200 text-gray-500 border-gray-300'
                                            : v <= 1 ? 'bg-green-500 text-white border-green-600'
                                            : v <= 2 ? 'bg-yellow-400 text-white border-yellow-500'
                                            : v <= 3 ? 'bg-orange-400 text-white border-orange-500'
                                            : 'bg-red-500 text-white border-red-600'
                                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                      }`}
                                      title={v < 0 ? 'Non évalué' : `Note ${v}`}
                                    >
                                      {v < 0 ? '—' : v}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Observations */}
                          <Card>
                            <CardHeader title="Observations" />
                            <div className="p-4">
                              <textarea
                                value={cov.observations}
                                onChange={e => updateCouverture(analysisKey, { observations: e.target.value })}
                                placeholder="Contexte contractuel, points d'attention, historique des litiges..."
                                className="w-full h-32 text-xs border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-[#2F5B58]"
                              />
                            </div>
                          </Card>

                          {/* Actions correctives */}
                          <Card>
                            <CardHeader title="Actions correctives" />
                            <div className="p-4 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  value={newCouvertureAction}
                                  onChange={e => setNewCouvertureAction(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') { addCouvertureAction(analysisKey, newCouvertureAction); setNewCouvertureAction(''); } }}
                                  placeholder="Ajouter une action corrective..."
                                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2F5B58]"
                                />
                                <button
                                  onClick={() => { addCouvertureAction(analysisKey, newCouvertureAction); setNewCouvertureAction(''); }}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F5B58] rounded-lg hover:bg-[#254845]"
                                >+</button>
                              </div>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {cov.actions.length === 0 && (
                                  <p className="text-[11px] text-gray-400 italic">Aucune action définie</p>
                                )}
                                {cov.actions.map((a, i) => (
                                  <div key={i} className="flex items-start gap-2 text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1">
                                    <span className="text-[#2F5B58] font-bold mt-0.5">→</span>
                                    <span className="flex-1">{a}</span>
                                    <button onClick={() => removeCouvertureAction(analysisKey, i)} className="text-gray-300 hover:text-red-400 ml-1">×</button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Tableau de référence */}
                        <Card>
                          <CardHeader title="Référentiel — Modèle de cotation (0 à 5)" />
                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px] border-collapse">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left font-semibold text-gray-600 py-1.5 pr-3 w-8">Note</th>
                                    <th className="text-left font-semibold text-gray-600 py-1.5 pr-3 w-40">Niveau</th>
                                    <th className="text-left font-semibold text-gray-600 py-1.5">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {COUVERTURE_LEVELS.map(l => (
                                    <tr key={l.note} className={`border-b border-gray-100 ${displayNote === l.note ? 'font-semibold' : ''}`}>
                                      <td className="py-1.5 pr-3 align-top">
                                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${l.color}`}>{l.note}</span>
                                      </td>
                                      <td className="py-1.5 pr-3 align-top font-medium text-gray-700">{l.label}</td>
                                      <td className="py-1.5 text-gray-500 leading-relaxed">{l.desc}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </Card>
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
              <div className="grid grid-cols-3 gap-3 mb-2">
                {[
                  { label: 'Éléments analysés', value: analyzedItems.length, color: 'border-[#2F5B58]' },
                  { label: 'Avec CA renseigné', value: analyzedItems.filter(k => (donneesStore[k]?.ca || 0) > 0).length, color: 'border-amber-400' },
                  { label: 'Achats difficiles', value: difficiles, color: 'border-red-400' },
                ].map(s => (
                  <Card key={s.label} className={`p-4 border-t-4 ${s.color}`}>
                    <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Achats simples',   value: analyzedItems.filter(k => getCIScore(k) < 50 && getCEScore(k) < 50).length, color: 'border-green-400',  bg: 'bg-green-50',  dot: 'bg-green-400' },
                  { label: 'Achats internes',  value: analyzedItems.filter(k => getCIScore(k) >= 50 && getCEScore(k) < 50).length, color: 'border-blue-400',   bg: 'bg-blue-50',   dot: 'bg-blue-400' },
                  { label: 'Achats externes',  value: analyzedItems.filter(k => getCIScore(k) < 50 && getCEScore(k) >= 50).length, color: 'border-amber-400',  bg: 'bg-amber-50',  dot: 'bg-amber-400' },
                  { label: 'Achats difficiles', value: difficiles,                                                                  color: 'border-red-400',    bg: 'bg-red-50',    dot: 'bg-red-400' },
                ].map(s => (
                  <Card key={s.label} className={`p-4 border-t-4 ${s.color} ${s.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                      <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                    </div>
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
            ...Object.keys(opportunStore),
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
                        const opport = getOpportunScore(nom);
                        const d = donneesStore[nom] ?? EMPTY_DONNEES;
                        const quad = quadrant(ci, ce);
                        const levier = getLevier(ci, ce, risk, opport);
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
                            <td className="px-3 py-2.5 text-center text-[#2F5B58] font-semibold">{opport || '—'}</td>
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

        {/* ═══════════════════════════════════════════════════
            ONGLET 4 — Graphiques
        ═══════════════════════════════════════════════════ */}
        {activeTab === 4 && (() => {
          const allKeys = [...new Set([
            ...Object.keys(contraintesStore),
            ...Object.keys(risquesStore),
            ...Object.keys(opportunStore),
          ])].sort();

          return (
            <div className="space-y-6">
              {/* Radar */}
              <Card>
                <CardHeader title="Radar multi-axes — Profil d'un élément" icon={<TrendingUp className="w-4 h-4" />} />
                <div className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <label className="text-xs text-gray-600 font-medium">Élément :</label>
                    <select
                      value={radarElement}
                      onChange={e => setRadarElement(e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700"
                    >
                      {allKeys.length === 0 && <option value="">Aucun élément analysé</option>}
                      {allKeys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  {allKeys.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">Évaluez au moins un élément dans l&apos;onglet Familles.</div>
                  ) : (
                    <>
                      <canvas ref={radarCanvasRef} className="w-full" style={{ height: 360 }} />
                      <div className="flex flex-wrap gap-3 mt-3 justify-center text-[10px] text-gray-500">
                        {[
                          { label: 'C. Int. Techniques',    color: '#2F5B58' },
                          { label: 'C. Int. Commerciales',  color: '#2F5B58' },
                          { label: 'C. Ext. Techniques',    color: '#2F5B58' },
                          { label: 'C. Ext. Commerciales',  color: '#2F5B58' },
                          { label: 'Risques',               color: '#ef4444' },
                          { label: 'Opportunités',          color: '#f59e0b' },
                        ].map((l, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
                            {l.label}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Histogramme comparatif */}
              <Card>
                <CardHeader title="Comparaison des scores — Tous les éléments" icon={<BarChart2 className="w-4 h-4" />} />
                <div className="p-4">
                  {allKeys.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-xs">Aucun élément à comparer.</div>
                  ) : (
                    <>
                      <div className="flex gap-4 mb-3 flex-wrap text-[10px]">
                        {[
                          { label: 'CI (Contraintes internes)',  color: '#6366f1' },
                          { label: 'CE (Contraintes externes)',  color: '#f59e0b' },
                          { label: 'Risques',                    color: '#ef4444' },
                          { label: 'Opportunités',               color: '#10b981' },
                        ].map(l => (
                          <div key={l.label} className="flex items-center gap-1.5 text-gray-600">
                            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                            {l.label}
                          </div>
                        ))}
                      </div>
                      <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
                        <canvas ref={barCanvasRef} className="w-full" style={{ height: Math.max(200, allKeys.length * 44 + 20) }} />
                      </div>
                    </>
                  )}
                </div>
              </Card>
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
    if (profit >= 15) return '💰 Mise en concurrence';
    return '⚙️ Optimisation interne';
  }
  return '🚨 Gestion de crise + plan de continuité';
}
