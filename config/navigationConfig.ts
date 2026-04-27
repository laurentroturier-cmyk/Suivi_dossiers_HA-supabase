import {
  BarChart3,
  FileText,
  ClipboardList,
  PlayCircle,
  Download,
  Settings,
  Building2,
  LineChart,
  Edit3,
  BookOpen,
  GitBranch,
  Bell,
  PackageOpen,
  FileSpreadsheet,
  Construction,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavSubAction {
  label: string;
  tab?: string;
  isAdmin?: boolean;
  icon?: LucideIcon;
  color?: string;
}

export interface NavAction {
  label: string;
  tab?: string;
  isAdmin?: boolean;
  icon?: LucideIcon;
  color?: string;
  description?: string;
  badge?: string;
  isGroup?: boolean;
  subActions?: NavSubAction[];
}

export interface NavDomaine {
  id: string;
  titre: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  borderHover: string;
  btnBg: string;
  btnText: string;
  adminOnly?: boolean;
  isExperimental?: boolean;
  actions: NavAction[];
}

export const NAVIGATION_DOMAINES: NavDomaine[] = [
  {
    id: 'indicateurs',
    titre: 'Indicateurs & Pilotage',
    description: 'Tableaux de bord, analyses et visualisation Gantt pour piloter vos projets',
    icon: BarChart3,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-500/20',
    borderColor: 'border-cyan-200 dark:border-cyan-500/40',
    borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Tableau de bord', tab: 'dashboard' },
      { label: 'Planning Gantt', tab: 'gantt' },
      { label: 'Analyse IT', tab: 'analyse-portefeuille' },
      { label: 'Visualisation Portefeuilles', tab: 'visu-portefeuille' },
    ],
  },
  {
    id: 'projets',
    titre: 'Projets d\'achats',
    description: 'Gestion complète de vos dossiers et projets d\'achats publics',
    icon: FileText,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-200 dark:border-emerald-500/40',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Tous les projets', tab: 'dossiers' },
    ],
  },
  {
    id: 'procedures',
    titre: 'Procédures',
    description: 'Suivi des procédures de marchés publics et appels d\'offres',
    icon: ClipboardList,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-500/20',
    borderColor: 'border-violet-200 dark:border-violet-500/40',
    borderHover: 'hover:border-violet-400 dark:hover:border-violet-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Toutes les procédures', tab: 'procedures' },
    ],
  },
  {
    id: 'redaction',
    titre: 'Rédaction',
    description: 'Rédaction des documents et DCE',
    icon: Edit3,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    borderColor: 'border-amber-200 dark:border-amber-500/40',
    borderHover: 'hover:border-amber-400 dark:hover:border-amber-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    isExperimental: true,
    actions: [
      { label: 'DCE Complet', tab: 'dce-complet', icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Accès rapide NOTI', tab: 'notifications-quick', icon: Bell, color: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'NOTI Multi 🚧', tab: 'noti-multi', icon: Construction, color: 'text-gray-500 dark:text-gray-400' },
    ],
  },
  {
    id: 'analyse',
    titre: 'Analyse',
    description: 'Ouverture des plis, analyse des offres et rapports',
    icon: LineChart,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-200 dark:border-emerald-500/40',
    borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    isExperimental: true,
    actions: [
      { label: 'Ouverture des plis', tab: 'ouverture-plis', icon: PackageOpen, color: 'text-purple-600 dark:text-purple-400', description: 'Registres des retraits/dépôts et analyse des candidatures' },
      { label: 'Analyse AN01', tab: 'an01', icon: LineChart, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Rapport de Présentation', tab: 'rapport-presentation', icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Analyse des offres DQE', tab: 'analyse-offres-dqe', icon: BarChart3, color: 'text-[#004d3d] dark:text-cyan-400' },
      { label: 'Analyse DPGF', tab: 'analyse-dpgf', icon: FileSpreadsheet, color: 'text-teal-600 dark:text-teal-400' },
      { label: 'Accès rapide NOTI', tab: 'notifications-quick', icon: Bell, color: 'text-indigo-600 dark:text-indigo-400' },
    ],
  },
  {
    id: 'execution',
    titre: 'Exécution des marchés',
    description: 'Gestion des contrats',
    icon: PlayCircle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    borderColor: 'border-orange-200 dark:border-orange-500/40',
    borderHover: 'hover:border-orange-400 dark:hover:border-orange-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Contrats', tab: 'contrats' },
      { label: 'Avenants', tab: 'avenants' },
    ],
  },
  {
    id: 'immobilier',
    titre: 'ImmoVision',
    description: 'Module immobilier et gestion des biens',
    icon: Building2,
    adminOnly: true,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    borderColor: 'border-amber-200 dark:border-amber-500/40',
    borderHover: 'hover:border-amber-400 dark:hover:border-amber-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'ImmoVision', tab: 'immobilier' },
    ],
  },
  {
    id: 'endev',
    titre: 'EN Dev',
    description: 'Fonctionnalités en cours de développement et maquettes',
    icon: GitBranch,
    adminOnly: true,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    borderColor: 'border-amber-200 dark:border-amber-500/40',
    borderHover: 'hover:border-amber-400 dark:hover:border-amber-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    isExperimental: true,
    actions: [
      { label: 'Workflow Analyse des offres', tab: 'workflow-analyse-offres', icon: BarChart3, color: 'text-[#004d3d] dark:text-cyan-400' },
    ],
  },
  {
    id: 'exports',
    titre: 'Exports & Données',
    description: 'Exportation et import de vos données en format Excel/CSV',
    icon: Download,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    borderColor: 'border-blue-200 dark:border-blue-500/40',
    borderHover: 'hover:border-blue-400 dark:hover:border-blue-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Exporter les données', tab: 'export' },
    ],
  },
  {
    id: 'admin',
    titre: 'Administration',
    description: 'Gestion des utilisateurs et paramètres de l\'application',
    icon: Settings,
    iconColor: 'text-slate-600 dark:text-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-500/20',
    borderColor: 'border-slate-200 dark:border-slate-500/40',
    borderHover: 'hover:border-slate-400 dark:hover:border-slate-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Paramètres', tab: 'admin', isAdmin: true },
    ],
  },
  {
    id: 'modes-operatoires',
    titre: 'Modes opératoires',
    description: 'Consulter les procédures et manuels d\'utilisation',
    icon: BookOpen,
    iconColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-500/20',
    borderColor: 'border-sky-200 dark:border-sky-500/40',
    borderHover: 'hover:border-sky-400 dark:hover:border-sky-400',
    btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
    btnText: 'text-gray-700 dark:text-gray-200',
    actions: [
      { label: 'Ouvrir le Centre de Ressources', tab: 'mode-op-hub' },
    ],
  },
];

export const TAB_TO_DOMAINE_ID: Record<string, string> = {
  // Indicateurs & Pilotage
  'dashboard': 'indicateurs',
  'gantt': 'indicateurs',
  'analyse-portefeuille': 'indicateurs',
  'visu-portefeuille': 'indicateurs',
  // Projets d'achats
  'dossiers': 'projets',
  // Procédures
  'procedures': 'procedures',
  // Rédaction
  'redaction': 'redaction',
  'dce-complet': 'redaction',
  'dce': 'redaction',
  'noti1': 'redaction',
  'noti-multi': 'redaction',
  'reglement-consultation': 'redaction',
  'questionnaire-technique': 'redaction',
  'notifications-quick': 'redaction',
  // Analyse
  'analyse': 'analyse',
  'ouverture-plis': 'analyse',
  'an01': 'analyse',
  'rapport-presentation': 'analyse',
  'analyse-offres-dqe': 'analyse',
  'analyse-dpgf': 'analyse',
  'retraits': 'analyse',
  'depots': 'analyse',
  // Exécution des marchés
  'contrats': 'execution',
  'avenants': 'execution',
  // ImmoVision
  'immobilier': 'immobilier',
  // EN Dev
  'workflow-analyse-offres': 'endev',
  // Exports & Données
  'export': 'exports',
  // Administration
  'admin': 'admin',
  // Modes opératoires
  'mode-op-hub': 'modes-operatoires',
  'modes-operatoires': 'modes-operatoires',
  'mode-op-tdb': 'modes-operatoires',
  'mode-op-gantt': 'modes-operatoires',
  'mode-op-portefeuille': 'modes-operatoires',
  'mode-op-execution': 'modes-operatoires',
  'mode-op-avenant': 'modes-operatoires',
  'mode-op-immo': 'modes-operatoires',
  'mode-op-visu-portefeuille': 'modes-operatoires',
};
