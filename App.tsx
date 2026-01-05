import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  PROJECT_FIELDS, 
  DOSSIER_FIELDS,
  DOSSIER_STATUS_OPTIONS,
  TYPE_VALIDATION_OPTIONS,
  NO_STATUT_OPTIONS,
  PROCEDURE_STATUS_OPTIONS,
  RP_STATUT_OPTIONS,
  PROCEDURE_GROUPS,
  NON_ALLOTISSEMENT_OPTIONS,
  FORME_MARCHE_OPTIONS,
  CCAG_OPTIONS,
  SUPPORT_PROCEDURE_OPTIONS,
  FINALITE_CONSULTATION_OPTIONS,
} from './constants';
import { ProjectData, DossierData, TableType } from './types';
import { supabase as initialSupabase } from './lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  formatDisplayDate, 
  formatToInputDate, 
  inputToStoreDate, 
  isDateField,
  excelDateToJSDate
} from './utils/dateUtils';
import { DocumentViewer } from './components/DocumentViewer';
import UploadView from './components/an01/UploadView';
import Dashboard from './components/an01/Dashboard';
import LotSelectionView from './components/an01/LotSelectionView';
import GlobalTableView from './components/an01/GlobalTableView';
import { parseExcelFile } from './an01-utils/services/excelParser';
import { AnalysisData } from './components/an01/types';
import 'html2pdf.js';
import html2canvas from 'html2canvas';
// Expose for components relying on window globals
(window as any).html2canvas = (window as any).html2canvas || html2canvas;

// Import Authentication Components
import Login from './components/auth/Login';
import AdminDashboard from './components/auth/AdminDashboard';
import { UserProfile, AuthState } from './types/auth';
import { supabase } from './lib/supabase';

type Theme = 'light' | 'dark' | 'blue' | 'green';

const BUCKET_NAME = 'Projets DNA';

const getProp = (obj: any, key: string) => {
  if (!obj || !key) return undefined;
  if (obj[key] !== undefined) return obj[key];
  const target = key.toLowerCase().replace(/[\s_()-]/g, '');
  const actualKeys = Object.keys(obj);
  const foundKey = actualKeys.find(k => k.toLowerCase().replace(/[\s_()-]/g, '') === target);
  return foundKey ? obj[foundKey] : undefined;
};

// Fonction pour déterminer si une colonne contient des valeurs numériques et doit être alignée à droite
const isNumericField = (key: string) => {
  const k = key.toLowerCase();
  return k.includes('montant') || 
         k.includes('prix') || 
         k.includes('cout') || 
         k.includes('coût') || 
         k.includes('valeur') || 
         k.includes('nombre') || 
         k.includes('duree') || 
         k.includes('durée') || 
         k.includes('delai') || 
         k.includes('délai') ||
         k.includes('perf') ||
         k.includes('economie') ||
         k.includes('économie') ||
         k === 'idprojet' ||
         k === 'numproc' ||
         /^\d+$/.test(k);
};

const isBooleanChoiceField = (key: string) => {
  const k = key.toLowerCase().replace(/_/g, ' ');
  return k.includes("innovante") || 
         k.includes("tpe/pme") || 
         k.includes("dispo sociales") || 
         k.includes("dispo environnementales");
};

const FileIcon: React.FC<{ fileName: string, publicUrl?: string }> = ({ fileName, publicUrl }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');

  if (isImage && publicUrl) {
    return <img src={publicUrl} alt={fileName} className="w-full h-full object-cover rounded-lg" />;
  }

  if (ext === 'pdf') return <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z"/></svg>;
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>;
  return <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>;
};

const SearchableSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  label: string;
  onRemoteSearch?: (term: string) => Promise<string[]>;
}> = ({ options, value, onChange, placeholder, label, onRemoteSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [remoteResults, setRemoteResults] = useState<string[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    if (remoteResults && remoteResults.length > 0) return remoteResults.slice(0, 300);
    if (!searchTerm) return options.slice(0, 300);
    const normalize = (s: string) => s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ');
    const keywords = normalize(searchTerm)
      .split(/\s+/)
      .filter(k => k.length > 0)
      .map(k => (k.length > 3 && (k.endsWith('s') || k.endsWith('x'))) ? k.slice(0, -1) : k);
    return options
      .filter(opt => {
        const normalizedOpt = normalize(opt);
        return keywords.every(kw => normalizedOpt.includes(kw));
      })
      .slice(0, 300);
  }, [options, searchTerm, remoteResults]);

  useEffect(() => {
    let isCancelled = false;
    const doSearch = async () => {
      if (!onRemoteSearch) { setRemoteResults(null); return; }
      const term = searchTerm.trim();
      if (term.length < 2) { setRemoteResults(null); return; }
      try {
        const res = await onRemoteSearch(term);
        if (!isCancelled) setRemoteResults(Array.from(new Set(res)));
      } catch {
        if (!isCancelled) setRemoteResults(null);
      }
    };
    const handle = setTimeout(doSearch, 250);
    return () => { isCancelled = true; clearTimeout(handle); };
  }, [searchTerm, onRemoteSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{label}</label>
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-semibold focus-within:ring-4 focus-within:ring-[#004d3d]/5 focus-within:border-[#004d3d] transition-all cursor-pointer flex justify-between items-center group"
        >
          <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-700'}`}>{value || placeholder}</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </div>
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-gray-50 bg-gray-50/30">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#004d3d]/10 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                    className={`w-full text-left px-5 py-3 text-xs font-bold transition-colors hover:bg-emerald-50 hover:text-[#004d3d] ${value === opt ? 'bg-emerald-50 text-[#004d3d]' : 'text-gray-600'}`}
                  >
                    {opt}
                  </button>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-xs font-bold text-gray-300 italic">Aucun résultat</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SimpleBarChart: React.FC<{ data: Record<string, number>, title: string, color: string, onClick?: () => void, dataKey?: string }> = ({ data, title, color, onClick, dataKey }) => {
  const entries = Object.entries(data).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 8);
  const maxVal = Math.max(...entries.map(e => e[1] as number), 1);
  return (
    <div 
      className={`bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-blue-300' : ''
      }`}
      onClick={onClick}
      title={onClick ? 'Cliquer pour voir le détail' : ''}
    >
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-6">{title}</h4>
      <div className="flex-1 space-y-4">
        {entries.map(([label, val]) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-gray-700"><span className="truncate pr-4">{label || 'N/C'}</span><span>{Math.round(val as number).toLocaleString('fr-FR')}</span></div>
            <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${((val as number) / (maxVal as number)) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to format numbers with French conventions
const formatNumberFR = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num).replace(/\s/g, '\u202F'); // Use narrow non-breaking space
};

const KPITile: React.FC<{ label: string, value: number, unit?: string }> = ({ label, value, unit }) => {
  const formattedValue = formatNumberFR(value);
  
  return (
    <div className="bg-white flex flex-col h-full rounded-xl border border-gray-100">
      <div className="px-4 py-4 flex flex-col justify-between h-full">
        <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.08em] mb-3 leading-tight text-center">
          {label}
        </p>
        <div className="flex items-baseline gap-1 justify-end text-right">
          <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums tracking-tight">
            {formattedValue}
          </p>
          {unit && (
            <p className="text-sm font-normal text-gray-500 leading-none ml-0.5">
              {unit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // ============================================
  // MAIN APPLICATION STATE - TOUS LES HOOKS DOIVENT ÊTRE ICI
  // (React hooks must be called in the same order every render)
  // ============================================
  const [supabaseClient] = useState<SupabaseClient | null>(initialSupabase);
  
  // AN01 States
  const [an01Data, setAn01Data] = useState<{ lots: AnalysisData[], globalMetadata: Record<string, string> } | null>(null);
  const [an01ProcedureNumber, setAn01ProcedureNumber] = useState<string>('');
  const [an01LoadMode, setAn01LoadMode] = useState<'manual' | 'auto'>('auto');
  const [an01SelectedLotIndex, setAn01SelectedLotIndex] = useState<number | null>(null);
  const [an01ViewMode, setAn01ViewMode] = useState<'grid' | 'table'>('grid');
  const [an01IsLoading, setAn01IsLoading] = useState(false);
  const [an01Error, setAn01Error] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TableType>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'opportunite' | 'procedures_liees' | 'documents' | 'publication' | 'offres' | 'rapport' | 'attribution' | 'marche' | 'strategie'>('general');
  const [detailData, setDetailData] = useState<{ type: 'project' | 'procedure', data: any[], title: string } | null>(null);
  const [procedures, setProcedures] = useState<ProjectData[]>([]);
  const [dossiers, setDossiers] = useState<DossierData[]>([]);
  
  const [refAcheteurs, setRefAcheteurs] = useState<any[]>([]);
  const [refProcedures, setRefProcedures] = useState<any[]>([]);
  const [refClientsInternes, setRefClientsInternes] = useState<string[]>([]);
  const [refCpv, setRefCpv] = useState<string[]>([]);
  const [refSegSousfamilles, setRefSegSousfamilles] = useState<string[]>([]);
  
  const [selectedAcheteurs, setSelectedAcheteurs] = useState<string[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>([]);
  const [selectedProcTypes, setSelectedProcTypes] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedDeployYears, setSelectedDeployYears] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    return DOSSIER_STATUS_OPTIONS.filter(s => !s.startsWith('4') && !s.startsWith('5'));
  });
  const [selectedClientsInternes, setSelectedClientsInternes] = useState<string[]>([]);
  const [selectedCcags, setSelectedCcags] = useState<string[]>([]);
  const [launchFrom, setLaunchFrom] = useState<string>('');
  const [launchTo, setLaunchTo] = useState<string>('');
  const [deployFrom, setDeployFrom] = useState<string>('');
  const [deployTo, setDeployTo] = useState<string>('');
  const [projectSearch, setProjectSearch] = useState('');
  const [procedureSearch, setProcedureSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commissionSortColumn, setCommissionSortColumn] = useState<string>('');
  const [commissionSortDirection, setCommissionSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dossierSortColumn, setDossierSortColumn] = useState<string>('');
  const [dossierSortDirection, setDossierSortDirection] = useState<'asc' | 'desc'>('asc');
  const [procedureSortColumn, setProcedureSortColumn] = useState<string>('');
  const [procedureSortDirection, setProcedureSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isSaving, setIsSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const [editingProject, setEditingProject] = useState<Partial<DossierData> | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<Partial<ProjectData> | null>(null);

  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ name: string, url: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const initial: Theme = 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initial);
    }
    return initial;
  });
  
  // ============================================
  // AUTH STATE - Authentication & Authorization
  // ============================================
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Fetch pending requests count for admin
  useEffect(() => {
    if (authState.profile?.role === 'admin') {
      const fetchPendingCount = async () => {
        const { data, error } = await supabase
          .from('access_requests')
          .select('id')
          .eq('status', 'pending');
        
        if (!error && data) {
          setPendingRequestsCount(data.length);
        }
      };
      
      fetchPendingCount();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [authState.profile]);

  // Memoized values
  const identificationFields = useMemo(() => new Set(PROCEDURE_GROUPS.identification.fields), []);
  const otherGroupedProcedureFields = useMemo(() => new Set(
    Object.entries(PROCEDURE_GROUPS)
      .filter(([key]) => key !== 'identification')
      .flatMap(([, group]) => group.fields)
  ), []);
  const rseFields = useMemo(() => new Set([
    'Dispo sociales',
    'Dispo environnementales',
    "Projet ouvert à l'acquisition de solutions innovantes",
    "Projet facilitant l'accès aux TPE/PME",
  ]), []);

  const themeOptions: { key: Theme; label: string }[] = [
    { key: 'light', label: 'Clair' },
    { key: 'green', label: 'Vert' },
    { key: 'blue', label: 'Bleu' },
    { key: 'dark', label: 'Sombre' }
  ];

  // ============================================
  // AUTH EFFECT - Manage session with onAuthStateChange
  // ============================================
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Get initial session
    const initAuth = async () => {
      try {
        console.log('[AUTH] Starting initialization...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('[AUTH] Session response:', { session: !!session, error: sessionError });
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log('[AUTH] User found, fetching profile...');
          
          try {
            // Timeout pour le fetch du profil (2 secondes max)
            const profilePromise = supabase
              .from('profiles')
              .select('id, email, role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
            );
            
            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            console.log('[AUTH] Profile response:', { data: profileData, error: profileError });

            if (profileError) {
              console.error('Profile fetch error:', profileError);
              // Utiliser l'email pour déterminer le rôle
              const role = session.user.email?.endsWith('@gmail.com') ? 'admin' : 'user';
              setAuthState({
                user: session.user,
                profile: {
                  id: session.user.id,
                  email: session.user.email || '',
                  role
                },
                loading: false,
                error: null
              });
            } else if (!profileData) {
              console.warn('Profile not found for user, using default role');
              const role = session.user.email?.endsWith('@gmail.com') ? 'admin' : 'user';
              setAuthState({
                user: session.user,
                profile: {
                  id: session.user.id,
                  email: session.user.email || '',
                  role
                },
                loading: false,
                error: null
              });
            } else {
              console.log('[AUTH] Profile loaded successfully:', profileData);
              setAuthState({
                user: session.user,
                profile: profileData as UserProfile,
                loading: false,
                error: null
              });
            }
          } catch (err: any) {
            console.error('[AUTH] Profile fetch failed:', err);
            // En cas d'erreur, utiliser un profil par défaut basé sur l'email
            const role = session.user.email?.endsWith('@gmail.com') ? 'admin' : 'user';
            setAuthState({
              user: session.user,
              profile: {
                id: session.user.id,
                email: session.user.email || '',
                role
              },
              loading: false,
              error: null
            });
          }
        } else {
          console.log('[AUTH] No session found');
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      } catch (err: any) {
        console.error('[AUTH] Initialization error:', err);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: err.message
        });
      }
    };

    // Timeout de sécurité - si après 5 secondes toujours en loading, on force l'arrêt
    timeoutId = setTimeout(() => {
      console.warn('[AUTH] Timeout - forcing loading to false');
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Timeout lors de l\'initialisation'
      }));
    }, 5000);

    initAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH] State changed:', event, 'Session:', !!session);

      try {
        if (session?.user) {
          console.log('[AUTH] User signed in, fetching profile...');
          
          try {
            // Timeout pour le fetch du profil (2 secondes max)
            const profilePromise = supabase
              .from('profiles')
              .select('id, email, role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
            );
            
            const { data: profileData, error: profileError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            console.log('[AUTH] Profile fetch result:', { data: profileData, error: profileError });

            if (profileError) {
              console.error('[AUTH] Profile fetch error:', profileError);
              
              // Vérifier si c'est un utilisateur sans profil approuvé
              const { data: accessRequest } = await supabase
                .from('access_requests')
                .select('status')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (accessRequest?.status === 'pending') {
                await supabase.auth.signOut();
                setAuthState({
                  user: null,
                  profile: null,
                  loading: false,
                  error: 'Votre demande d\'accès est en cours d\'examen. Vous ne pouvez pas encore vous connecter.'
                });
                return;
              } else if (accessRequest?.status === 'rejected') {
                await supabase.auth.signOut();
                setAuthState({
                  user: null,
                  profile: null,
                  loading: false,
                  error: 'Votre demande d\'accès a été refusée. Contactez un administrateur.'
                });
                return;
              }
              
              // Si pas de demande ou autre erreur, utiliser le rôle par défaut
              const role = session.user.email?.endsWith('@gmail.com') ? 'admin' : 'user';
              setAuthState({
                user: session.user,
                profile: {
                  id: session.user.id,
                  email: session.user.email || '',
                  role
                },
                loading: false,
                error: null
              });
            } else if (!profileData) {
              console.warn('[AUTH] Profile not found, using default role');
              const role = session.user.email?.endsWith('@gmail.com') ? 'admin' : 'user';
              setAuthState({
                user: session.user,
                profile: {
                  id: session.user.id,
                  email: session.user.email || '',
                  role
                },
                loading: false,
                error: null
              });
            } else {
              console.log('[AUTH] Profile loaded successfully:', profileData);
              setAuthState({
                user: session.user,
                profile: profileData as UserProfile,
                loading: false,
                error: null
              });
            }
          } catch (err: any) {
            console.error('[AUTH] Profile fetch failed:', err);
            const role = session.user.email?.endsWith('@gmail.com') ? 'admin' : 'user';
            setAuthState({
              user: session.user,
              profile: {
                id: session.user.id,
                email: session.user.email || '',
                role
              },
              loading: false,
              error: null
            });
          }
        } else {
          console.log('[AUTH] No session - user signed out');
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null
          });
        }
      } catch (err: any) {
        console.error('[AUTH] Error in auth state change handler:', err);
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: err.message
        });
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // All other refs and effects BEFORE conditional returns
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchData = async (client: SupabaseClient) => {
    setIsLoading(true);
    try {
      const [{ data: d }, { data: p }, { data: ra }, { data: rp }, { data: ci }, { data: cpvData }, { data: seg }] = await Promise.all([
        client.from('projets').select('*'),
        client.from('procédures').select('*'),
        client.from('Referentiel_acheteurs').select('*'),
        client.from('Referentiel_liste_procédures').select('*'),
        client.from('Clients_internes').select('dna_title'),
        client.from('codes_cpv_long').select('TitreLong').limit(5000),
        client.from('Referentiel_segmentation').select('dna_sousfamille').limit(5000)
      ]);
      setDossiers(d || []);
      setProcedures(p || []);
      setRefAcheteurs(ra || []);
      setRefProcedures(rp || []);
      setRefClientsInternes(Array.from(new Set((ci || []).map((x: any) => x.dna_title).filter(Boolean))).sort());
      setRefCpv((cpvData || []).map(x => x.TitreLong).filter(Boolean));
      setRefSegSousfamilles(Array.from(new Set((seg || []).map((x: any) => x.dna_sousfamille).filter(Boolean))).sort());
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  useEffect(() => { if (supabaseClient) fetchData(supabaseClient); }, [supabaseClient]);

  // More refs and effects
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    const top = topScrollRef.current;
    const body = bodyScrollRef.current;
    if (!top || !body) return;

    const syncFromTop = () => { if (body.scrollLeft !== top.scrollLeft) body.scrollLeft = top.scrollLeft; };
    const syncFromBody = () => { if (top.scrollLeft !== body.scrollLeft) top.scrollLeft = body.scrollLeft; };

    top.addEventListener('scroll', syncFromTop);
    body.addEventListener('scroll', syncFromBody);
    setTableScrollWidth(body.scrollWidth - body.clientWidth);

    return () => {
      top.removeEventListener('scroll', syncFromTop);
      body.removeEventListener('scroll', syncFromBody);
    };
  }, [editingProject, editingProcedure]);

  // Fetch files effect
  const fetchFiles = async () => {
    if (!supabaseClient) return;
    const currentId = editingProject ? editingProject.IDProjet : editingProcedure?.NumProc;
    if (!currentId) return;

    const folder = editingProject ? `projets/${currentId}` : `procedures/${currentId}`;
    const { data, error } = await supabaseClient.storage.from(BUCKET_NAME).list(folder);
    if (error) {
      console.error("Error listing files:", error);
      return;
    }

    const filesWithUrls = await Promise.all((data || []).map(async (file) => {
      const { data: urlData } = await supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(`${folder}/${file.name}`);
      return { ...file, publicUrl: urlData?.publicUrl };
    }));

    setFiles(filesWithUrls);
  };

  useEffect(() => {
    if (activeSubTab === 'documents') fetchFiles();
  }, [activeSubTab, editingProject, editingProcedure]);

  // All useMemo calculations - MUST be before conditional returns
  const associatedProcedures = useMemo(() => {
    if (!editingProject?.IDProjet) return [];
    return procedures
      .filter(p => String(getProp(p, 'IDProjet')) === String(editingProject.IDProjet))
      .sort((a, b) => (parseFloat(String(getProp(b, 'NumProc'))) || 0) - (parseFloat(String(getProp(a, 'NumProc'))) || 0));
  }, [procedures, editingProject]);

  const uniqueTypeProcs = useMemo(() => Array.from(new Set(refProcedures.map(rp => String(getProp(rp, 'Type procédure'))).filter(Boolean))).sort(), [refProcedures]);
  const uniqueFamilies = useMemo(() => Array.from(new Set(procedures.map(p => String(getProp(p, 'Famille Achat Principale'))).filter(Boolean))).sort(), [procedures]);
  const uniqueTypesForFilter = useMemo(() => Array.from(new Set(procedures.map(p => String(getProp(p, 'Type de procédure'))).filter(Boolean))).sort(), [procedures]);
  const uniqueCcagsForFilter = useMemo(() => Array.from(new Set(procedures.map(p => String(getProp(p, 'CCAG'))).filter(Boolean))).sort(), [procedures]);
  
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    dossiers.forEach(d => {
      const dateValue = getProp(d, 'Date_de_lancement_de_la_consultation');
      if (dateValue) {
        let year: number;
        // Vérifier si c'est un nombre (format Excel)
        const numValue = parseFloat(String(dateValue));
        if (!isNaN(numValue) && numValue > 1000) {
          // Format Excel: convertir le numéro de série en date
          // Excel commence le 1er janvier 1900 (en réalité 1899-12-30 pour la compatibilité Lotus)
          const excelDate = new Date((numValue - 25569) * 86400 * 1000);
          year = excelDate.getFullYear();
        } else {
          // Format date standard
          year = new Date(dateValue).getFullYear();
        }
        if (!isNaN(year) && year >= 2000 && year <= 2100) {
          years.add(String(year));
        }
      }
    });
    return Array.from(years).sort();
  }, [dossiers]);

  const toggleYear = (year: string) => {
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const uniqueDeployYears = useMemo(() => {
    const years = new Set<string>();
    dossiers.forEach(d => {
      const dateValue = getProp(d, 'Date_de_deploiement_previsionnelle_du_marche');
      if (dateValue) {
        let year: number;
        // Vérifier si c'est un nombre (format Excel)
        const numValue = parseFloat(String(dateValue));
        if (!isNaN(numValue) && numValue > 1000) {
          // Format Excel: convertir le numéro de série en date
          const excelDate = new Date((numValue - 25569) * 86400 * 1000);
          year = excelDate.getFullYear();
        } else {
          // Format date standard
          year = new Date(dateValue).getFullYear();
        }
        if (!isNaN(year) && year >= 2000 && year <= 2100) {
          years.add(String(year));
        }
      }
    });
    return Array.from(years).sort();
  }, [dossiers]);

  const toggleDeployYear = (year: string) => {
    setSelectedDeployYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const toggleDossierStatus = (status: string) => {
    setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const kpis = useMemo(() => {
    const matchesAcheteur = (val: any) => selectedAcheteurs.length === 0 || selectedAcheteurs.includes(val);
    const matchesFamily = (val: any) => selectedFamilies.length === 0 || selectedFamilies.includes(val);
    const matchesProcType = (val: any) => selectedProcTypes.length === 0 || selectedProcTypes.includes(val);
    const matchesPriority = (val: any) => selectedPriorities.length === 0 || selectedPriorities.includes(val);
    const matchesStatus = (val: any) => selectedStatuses.length === 0 || selectedStatuses.includes(val);
    const matchesYear = (d: any) => {
      if (selectedYears.length === 0) return true;
      const dateValue = getProp(d, 'Date_de_lancement_de_la_consultation');
      if (!dateValue) return false;
      
      let year: number;
      // Vérifier si c'est un nombre (format Excel)
      const numValue = parseFloat(String(dateValue));
      if (!isNaN(numValue) && numValue > 1000) {
        // Format Excel: convertir le numéro de série en date
        const excelDate = new Date((numValue - 25569) * 86400 * 1000);
        year = excelDate.getFullYear();
      } else {
        // Format date standard
        year = new Date(dateValue).getFullYear();
      }
      
      return selectedYears.includes(String(year));
    };
    
    const matchesDeployYear = (d: any) => {
      if (selectedDeployYears.length === 0) return true;
      const dateValue = getProp(d, 'Date_de_deploiement_previsionnelle_du_marche');
      if (!dateValue) return false;
      
      let year: number;
      // Vérifier si c'est un nombre (format Excel)
      const numValue = parseFloat(String(dateValue));
      if (!isNaN(numValue) && numValue > 1000) {
        // Format Excel: convertir le numéro de série en date
        const excelDate = new Date((numValue - 25569) * 86400 * 1000);
        year = excelDate.getFullYear();
      } else {
        // Format date standard
        year = new Date(dateValue).getFullYear();
      }
      
      return selectedDeployYears.includes(String(year));
    };

    const filteredDossiers = dossiers.filter(d => (
      matchesAcheteur(getProp(d, 'Acheteur')) &&
      matchesFamily(getProp(d, 'Famille Achat Principale')) &&
      matchesProcType(getProp(d, 'Type de procédure')) &&
      matchesPriority(getProp(d, 'Priorite')) &&
      matchesStatus(getProp(d, 'Statut_du_Dossier')) &&
      matchesYear(d) &&
      matchesDeployYear(d)
    ));

    const filteredProcedures = procedures.filter(p => (
      matchesAcheteur(getProp(p, 'Acheteur')) &&
      matchesFamily(getProp(p, 'Famille Achat Principale')) &&
      matchesProcType(getProp(p, 'Type de procédure'))
    ));

    const nbP = filteredDossiers.length;
    const nbProc = filteredProcedures.length;
    const amtP = filteredDossiers.reduce((acc: number, d) => acc + (parseFloat(String(getProp(d, "Montant_previsionnel_du_marche_(_HT)_")).replace(/[^\d.]/g, '')) || 0), 0);
    const amtProc = filteredProcedures.reduce((acc: number, p) => acc + (parseFloat(String(getProp(p, 'Montant de la procédure')).replace(/[^\d.]/g, '')) || 0), 0);

    // Calculer le montant moyen par type de procédure
    const proceduresTypeStats = filteredProcedures.reduce((acc: Record<string, { total: number; count: number }>, p) => {
      const type = getProp(p, 'Type de procédure') || 'N/C';
      const montant = parseFloat(String(getProp(p, 'Montant de la procédure')).replace(/[^\d.]/g, '')) || 0;
      if (!acc[type]) acc[type] = { total: 0, count: 0 };
      acc[type].total += montant;
      acc[type].count += 1;
      return acc;
    }, {});
    const proceduresTypeMoyenne = Object.entries(proceduresTypeStats).reduce((acc: Record<string, number>, [type, stats]) => {
      acc[type] = (stats as any).count > 0 ? Math.ceil((stats as any).total / (stats as any).count) : 0;
      return acc;
    }, {});

    // Calcul des taux de dispositions environnementales et sociales
    const nbDispoEnv = filteredProcedures.filter(p => {
      const val = String(getProp(p, 'Dispo environnementales') || '').toLowerCase();
      return val === 'oui';
    }).length;
    const tauxDispoEnv = nbProc > 0 ? (nbDispoEnv / nbProc) * 100 : 0;

    const nbDispoSoc = filteredProcedures.filter(p => {
      const val = String(getProp(p, 'Dispo sociales') || '').toLowerCase();
      return val === 'oui';
    }).length;
    const tauxDispoSoc = nbProc > 0 ? (nbDispoSoc / nbProc) * 100 : 0;

    const nbProjetsInnovants = filteredProcedures.filter(p => {
      const val = String(getProp(p, 'Projet ouvert à l\'acquisition de solutions innovantes') || '').toLowerCase();
      return val === 'oui';
    }).length;
    const tauxProjetsInnovants = nbProc > 0 ? (nbProjetsInnovants / nbProc) * 100 : 0;

    const nbProjetsTPEPME = filteredProcedures.filter(p => {
      const val = String(getProp(p, 'Projet facilitant l\'accès aux TPE/PME') || '').toLowerCase();
      return val === 'oui';
    }).length;
    const tauxProjetsTPEPME = nbProc > 0 ? (nbProjetsTPEPME / nbProc) * 100 : 0;

    return {
      nbP,
      nbProc,
      amtP,
      avgP: nbP > 0 ? amtP / nbP : 0,
      amtProc,
      avgProc: nbProc > 0 ? amtProc / nbProc : 0,
      tauxDispoEnv,
      tauxDispoSoc,
      tauxProjetsInnovants,
      tauxProjetsTPEPME,
      filteredDossiers,
      filteredProcedures,
      charts: {
          projetsAcheteur: filteredDossiers.reduce((acc: Record<string, number>, d) => { const v = getProp(d, 'Acheteur') || 'N/C'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          proceduresAcheteur: filteredProcedures.reduce((acc: Record<string, number>, p) => { const v = getProp(p, 'Acheteur') || 'N/C'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          proceduresType: filteredProcedures.reduce((acc: Record<string, number>, p) => { const v = getProp(p, 'Type de procédure') || 'N/C'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          proceduresStatut: filteredProcedures.reduce((acc: Record<string, number>, p) => { const v = getProp(p, 'Statut de la consultation') || 'N/C'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          projetsPriorite: filteredDossiers.reduce((acc: Record<string, number>, d) => { const v = getProp(d, 'Priorite') || 'Non définie'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          projetsStatut: filteredDossiers.reduce((acc: Record<string, number>, d) => { const v = getProp(d, 'Statut_du_Dossier') || 'N/C'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          projetsClientInterne: filteredDossiers.reduce((acc: Record<string, number>, d) => { const v = getProp(d, 'Client_Interne') || 'N/C'; acc[v] = (acc[v] || 0) + 1; return acc; }, {}),
          proceduresTypeMoyenne,
          proceduresDispoEnv: filteredProcedures.reduce((acc: Record<string, number>, p) => { 
            const v = String(getProp(p, 'Dispo environnementales') || '').toLowerCase();
            const label = v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : 'Non renseigné';
            acc[label] = (acc[label] || 0) + 1; 
            return acc; 
          }, {}),
          proceduresDispoSoc: filteredProcedures.reduce((acc: Record<string, number>, p) => { 
            const v = String(getProp(p, 'Dispo sociales') || '').toLowerCase();
            const label = v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : 'Non renseigné';
            acc[label] = (acc[label] || 0) + 1; 
            return acc; 
          }, {}),
          proceduresProjetsInnovants: filteredProcedures.reduce((acc: Record<string, number>, p) => { 
            const v = String(getProp(p, 'Projet ouvert à l\'acquisition de solutions innovantes') || '').toLowerCase();
            const label = v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : 'Non renseigné';
            acc[label] = (acc[label] || 0) + 1; 
            return acc; 
          }, {}),
          proceduresProjetsTPEPME: filteredProcedures.reduce((acc: Record<string, number>, p) => { 
            const v = String(getProp(p, 'Projet facilitant l\'accès aux TPE/PME') || '').toLowerCase();
            const label = v === 'oui' ? 'Oui' : v === 'non' ? 'Non' : 'Non renseigné';
            acc[label] = (acc[label] || 0) + 1; 
            return acc; 
          }, {})
      }
    };
  }, [dossiers, procedures, selectedAcheteurs, selectedFamilies, selectedProcTypes, selectedPriorities, selectedStatuses, selectedYears, selectedDeployYears]);

  const filteredD = useMemo(() => {
    const matchesProjectSearch = (d: DossierData) => {
      if (!projectSearch) return true;
      const idVal = String(getProp(d, 'IDProjet') || '').toLowerCase();
      return idVal.includes(projectSearch.toLowerCase());
    };

    return dossiers
      .filter(d => (
        (selectedAcheteurs.length === 0 || selectedAcheteurs.includes(getProp(d, 'Acheteur'))) &&
        (selectedPriorities.length === 0 || selectedPriorities.includes(getProp(d, 'Priorite'))) &&
        matchesProjectSearch(d)
      ))
      .sort((a, b) => (parseFloat(String(a.IDProjet)) || 0) < (parseFloat(String(b.IDProjet)) || 0) ? 1 : -1);
  }, [dossiers, selectedAcheteurs, selectedPriorities, projectSearch]);

  const filteredP = useMemo(() => {
    const matchesProcedureSearch = (p: ProjectData) => {
      if (!procedureSearch) return true;
      const numProc = String(getProp(p, 'NumProc') || '').toLowerCase();
      const numAfpa = String(getProp(p, 'Numéro de procédure (Afpa)') || '').toLowerCase();
      return numProc.includes(procedureSearch.toLowerCase()) || numAfpa.includes(procedureSearch.toLowerCase());
    };

    return procedures
      .filter(p => (selectedAcheteurs.length === 0 || selectedAcheteurs.includes(getProp(p, 'Acheteur'))) && matchesProcedureSearch(p))
      .sort((a, b) => (parseFloat(String(getProp(b, 'NumProc'))) || 0) - (parseFloat(String(getProp(a, 'NumProc'))) || 0));
  }, [procedures, selectedAcheteurs, procedureSearch]);

  // ============================================
  // AUTH HANDLERS & RENDERING
  // ============================================
  const handleLoginSuccess = () => {
    // Auth state will be updated by onAuthStateChange
  };

  const handleLogout = () => {
    setShowAdminDashboard(false);
    // Auth state will be updated by onAuthStateChange
  };

  const handleBackToApp = () => {
    setShowAdminDashboard(false);
  };

  // Conditional returns AFTER all hooks
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!authState.user || !authState.profile) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show Admin Dashboard if requested
  if (showAdminDashboard) {
    return (
      <AdminDashboard 
        profile={authState.profile} 
        onLogout={handleLogout}
        onBackToApp={handleBackToApp}
      />
    );
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const sanitizeFileName = (name: string) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/[^a-zA-Z0-9.-]/g, "_") 
      .replace(/_{2,}/g, "_"); 
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !supabaseClient) return;

    const currentId = editingProject ? editingProject.IDProjet : editingProcedure?.NumProc;
    if (!currentId) {
      alert("Veuillez d'abord enregistrer l'élément avant d'ajouter des documents.");
      return;
    }

    setIsUploading(true);
    const folder = editingProject ? `projets/${currentId}` : `procedures/${currentId}`;

    const uploadPromises = Array.from(fileList).map(async (file: File) => {
      const safeName = sanitizeFileName(file.name);
      const path = `${folder}/${safeName}`;
      
      const { error } = await supabaseClient.storage.from(BUCKET_NAME).upload(path, file, { 
        upsert: true,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600'
      });

      if (error) throw new Error(`Échec de l'upload pour ${file.name}: ${error.message}`);
      return file.name;
    });

    try {
      const results = await Promise.allSettled(uploadPromises);
      const errors = results.filter(r => r.status === 'rejected');
      
      if (errors.length > 0) {
        alert(`${errors.length} fichier(s) n'ont pas pu être envoyés.`);
      }

      await fetchFiles();
    } catch (err) {
      console.error("Upload process error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const deleteFile = async (fileName: string) => {
    if (!supabaseClient || !window.confirm(`Supprimer définitivement le document "${fileName}" ?`)) return;
    
    const currentId = editingProject ? editingProject.IDProjet : editingProcedure?.NumProc;
    if (!currentId) {
      alert("Erreur: Identifiant manquant pour la suppression.");
      return;
    }

    const folder = editingProject ? `projets/${currentId}` : `procedures/${currentId}`;
    
    // Décodage explicite du nom de fichier au cas où il contient des caractères spéciaux encodés
    const decodedFileName = decodeURIComponent(fileName);
    const fullPath = `${folder}/${decodedFileName}`;

    const previousFiles = [...files];
    setFiles(files.filter(f => f.name !== fileName));

    try {
      // Nettoyage rigoureux du chemin
      const cleanPath = fullPath.replace(/\/+/g, '/').replace(/^\//, '');
      
      const { error } = await supabaseClient.storage.from(BUCKET_NAME).remove([cleanPath]);
      
      if (error) {
        setFiles(previousFiles);
        console.error("Supabase Storage Error:", error);
        alert(`Erreur lors de la suppression : ${error.message}\nChemin: ${cleanPath}`);
      } else {
        await fetchFiles();
      }
    } catch (err: any) {
      setFiles(previousFiles);
      alert(`Erreur critique : ${err.message}`);
    }
  };

  const downloadFile = async (fileName: string) => {
    if (!supabaseClient) return;
    const currentId = editingProject ? editingProject.IDProjet : editingProcedure?.NumProc;
    const folder = editingProject ? `projets/${currentId}` : `procedures/${currentId}`;
    const { data } = await supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(`${folder}/${fileName}`);
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Nettoie les métadonnées et normalise les champs de date (y compris numéros Excel sur 5+ chiffres)
    const normalizeRecordDates = (rec: any) => {
      const out: any = {};
      Object.keys(rec || {}).forEach((key) => {
        if (key === 'id' || key === 'created_at') return; // on retire les colonnes techniques
        const val = getProp(rec, key);
        if (isDateField(key)) {
          if (val == null || val === '') {
            out[key] = '';
          } else {
            const str = String(val);
            // Numéros de série Excel (5+ chiffres) -> Date FR
            if (!isNaN(parseFloat(str)) && /^\d+(\.\d+)?$/.test(str) && str.length >= 5) {
              const d = excelDateToJSDate(parseFloat(str));
              out[key] = d ? d.toLocaleDateString('fr-FR') : formatDisplayDate(str);
            } else {
              // Formats ISO / FR déjà parsables
              out[key] = formatDisplayDate(str);
            }
          }
        } else {
          out[key] = val;
        }
      });
      return out;
    };

    const dossiersWS = XLSX.utils.json_to_sheet(dossiers.map(normalizeRecordDates));
    const proceduresWS = XLSX.utils.json_to_sheet(procedures.map(normalizeRecordDates));
    XLSX.utils.book_append_sheet(workbook, dossiersWS, "Dossiers Projets");
    XLSX.utils.book_append_sheet(workbook, proceduresWS, "Procédures");
    XLSX.writeFile(workbook, `Export_GestMarchés_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const priorityOptions = ['P0 - Pas de priorité', 'P1 - Important', 'P2 - Moyen', 'P3 - Faible'];

  const generateAfpaNumber = () => {
    if (!editingProcedure) return;
    
    // Récupérer le numéro actuel s'il existe
    const currentNumber = editingProcedure["Numéro de procédure (Afpa)"];
    const typeProc = editingProcedure["Type de procédure"] || "";
    const acheteur = editingProcedure["Acheteur"] || "";
    const objetCourt = editingProcedure["Objet court"] || editingProcedure["Nom de la procédure"] || "SANS OBJET";
    
    // Trouver l'abrégé du type de procédure dans le référentiel
    const abrege = (refProcedures.find(rp => getProp(rp, 'Type procédure') === typeProc) || {})['Abrégé'] || 'ZZZZZ';
    
    // Trouver le trigramme de l'acheteur dans le référentiel
    const trigramme = (refAcheteurs.find(a => getProp(a, 'Personne') === acheteur) || {}).Trigramme || 'ZZZ';
    
    let afpaNum = '';
    
    // Vérifier si un numéro existe déjà
    if (currentNumber && currentNumber.trim() !== '') {
      // Le numéro existe : garder le préfixe numérique mais mettre à jour les autres éléments
      const parts = String(currentNumber).split('_');
      if (parts.length > 0 && /^\d{5}$/.test(parts[0])) {
        // Garder le préfixe numérique existant
        afpaNum = `${parts[0]}_${abrege}_${objetCourt}_${trigramme}`;
      } else {
        // Format non reconnu, créer un nouveau numéro
        afpaNum = createNewAfpaNumber(abrege, objetCourt, trigramme);
      }
    } else {
      // Pas de numéro existant : création d'un nouveau numéro
      afpaNum = createNewAfpaNumber(abrege, objetCourt, trigramme);
    }
    
    setEditingProcedure(prev => ({ 
      ...prev, 
      "Numéro de procédure (Afpa)": afpaNum,
      "Objet court": objetCourt,
    }));
  };
  
  // Fonction auxiliaire pour créer un nouveau numéro Afpa
  const createNewAfpaNumber = (abrege: string, objetCourt: string, trigramme: string): string => {
    const year = new Date().getFullYear().toString().slice(-2); // 26 pour 2026, 27 pour 2027
    
    // Trouver le numéro d'ordre maximum pour l'année en cours uniquement
    let maxOrderNumber = 0;
    procedures.forEach(p => {
      const n = getProp(p, 'Numéro de procédure (Afpa)');
      if (n) {
        const numStr = String(n).split('_')[0]; // Prendre la première partie avant '_'
        // Vérifier que le numéro est au format attendu (5 chiffres) et commence par l'année en cours
        if (/^\d{5}$/.test(numStr) && numStr.startsWith(year)) {
          const orderNum = parseInt(numStr.substring(2)); // Prendre les 3 derniers chiffres
          if (!isNaN(orderNum) && orderNum > maxOrderNumber) {
            maxOrderNumber = orderNum;
          }
        }
      }
    });
    
    // Incrémenter de 1 (si aucun numéro pour l'année, maxOrderNumber = 0 donc on commence à 1)
    const nextOrderNumber = maxOrderNumber + 1;
    
    // Formater le numéro complet : AA### (ex: 26001, 26658)
    const fullNumber = `${year}${nextOrderNumber.toString().padStart(3, '0')}`;
    
    // Construire le numéro Afpa complet
    return `${fullNumber}_${abrege}_${objetCourt}_${trigramme}`;
  };

  const handleFieldChange = (type: 'project' | 'procedure', key: string, value: any) => {
    if (type === 'project') setEditingProject(prev => ({ ...prev, [key]: value }));
    else setEditingProcedure(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setSelectedAcheteurs([]);
    setSelectedFamilies([]);
    setSelectedProcTypes([]);
    setSelectedPriorities([]);
    setSelectedYears([]);
    setSelectedDeployYears([]);
    // Réinitialiser avec les 6 statuts par défaut (exclure "4 - Terminé" et "5 - Abandonné")
    setSelectedStatuses(DOSSIER_STATUS_OPTIONS.filter(s => !s.startsWith('4') && !s.startsWith('5')));
    setSelectedClientsInternes([]);
    setSelectedCcags([]);
    setLaunchFrom('');
    setLaunchTo('');
    setDeployFrom('');
    setDeployTo('');
    setProjectSearch('');
    setProcedureSearch('');
  };

  // AN01 Handlers
  const handleAn01LoadFromSupabase = async (procedureNum: string) => {
    if (!supabaseClient) {
      setAn01Error("Client Supabase non disponible");
      return;
    }

    setAn01IsLoading(true);
    setAn01Error(null);

    try {
      // 1. Prendre les 5 premiers caractères du numéro saisi
      const searchPrefix = procedureNum.substring(0, 5);
      
      // 2. Chercher la procédure dans la base avec le numéro Afpa
      const { data: procedureData, error: procError } = await supabaseClient
        .from('procédures')
        .select('NumProc, "Numéro de procédure (Afpa)"')
        .or(`"Numéro de procédure (Afpa)".ilike.${searchPrefix}%`)
        .limit(1);

      if (procError) {
        console.error("Erreur recherche procédure:", procError);
        throw new Error(`Erreur lors de la recherche de la procédure ${searchPrefix}`);
      }

      if (!procedureData || procedureData.length === 0) {
        throw new Error(`Procédure ${searchPrefix} non trouvée dans la base de données`);
      }

      const numProc = procedureData[0].NumProc;

      // 3. Lister les fichiers de cette procédure
      const folder = `procedures/${numProc}`;
      const { data: filesList, error: listError } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .list(folder);

      if (listError) {
        console.error("Erreur liste fichiers:", listError);
        throw listError;
      }

      // 4. Trouver un fichier contenant "an01"
      const an01File = filesList?.find(file => 
        file.name.toLowerCase().includes('an01')
      );

      if (!an01File) {
        setAn01LoadMode('manual');
        setAn01Error(`Aucun fichier AN01 trouvé pour la procédure ${searchPrefix} (${numProc})`);
        setAn01IsLoading(false);
        return;
      }

      // 5. Télécharger le fichier
      const filePath = `${folder}/${an01File.name}`;
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from(BUCKET_NAME)
        .download(filePath);

      if (downloadError) {
        console.error("Erreur téléchargement:", downloadError);
        throw downloadError;
      }

      // 6. Parser le fichier téléchargé
      const result = await parseExcelFile(fileData as File);
      setAn01Data(result);
      
      if (result.lots.length === 1) {
        setAn01SelectedLotIndex(0);
      }
    } catch (err: any) {
      console.error("Erreur chargement AN01:", err);
      setAn01LoadMode('manual');
      setAn01Error(err.message || "Erreur lors du chargement du fichier depuis Supabase");
    } finally {
      setAn01IsLoading(false);
    }
  };

  const handleAn01FileUpload = async (file: File) => {
    setAn01IsLoading(true);
    setAn01Error(null);

    setTimeout(async () => {
      try {
        const result = await parseExcelFile(file);
        setAn01Data(result);
        
        if (result.lots.length === 1) {
          setAn01SelectedLotIndex(0);
        }
      } catch (err: any) {
        console.error(err);
        setAn01Error(err.message || "Impossible de lire le fichier. Assurez-vous qu'il contient des onglets 'Lot X'.");
      } finally {
        setAn01IsLoading(false);
      }
    }, 600);
  };

  const handleAn01Reset = () => {
    setAn01Data(null);
    setAn01SelectedLotIndex(null);
    setAn01Error(null);
    setAn01ViewMode('grid');
    setAn01ProcedureNumber('');
    setAn01LoadMode('auto');
  };

  const handleAn01BackToLotSelection = () => {
    setAn01SelectedLotIndex(null);
  };

  const toggleAcheteur = (name: string) => {
    setSelectedAcheteurs(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleFamily = (name: string) => {
    setSelectedFamilies(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const togglePriority = (priority: string) => {
    setSelectedPriorities(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
  };

  const toggleProcType = (name: string) => {
    setSelectedProcTypes(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const renderFormFields = (type: 'project' | 'procedure', data: any, filterFn?: (key: string) => boolean) => {
    const fields = type === 'project' ? DOSSIER_FIELDS : PROJECT_FIELDS;
    
    // Pour les procédures avec un groupe spécifique (publication, marche, etc.)
    // On doit préserver l'ordre défini dans PROCEDURE_GROUPS
    let orderedKeys: string[] = [];
    
    if (type === 'procedure' && filterFn) {
      // Déterminer quel groupe est actif en testant les champs
      let activeGroup: string[] | null = null;
      for (const [groupName, groupDef] of Object.entries(PROCEDURE_GROUPS)) {
        if (groupDef.fields.some(f => filterFn(f))) {
          activeGroup = groupDef.fields;
          break;
        }
      }
      
      if (activeGroup) {
        // Utiliser l'ordre du groupe
        orderedKeys = activeGroup.filter(k => k !== 'id' && k !== 'created_at' && filterFn(k));
      } else {
        // Fallback: ordre par défaut
        const allProcedureFields = Array.from(new Set([
          ...fields.map(f => f.id),
          ...Object.keys(data),
          ...Object.values(PROCEDURE_GROUPS).flatMap(g => g.fields),
          'NumProc', 'Numéro de procédure (Afpa)', 'Acheteur', 'Famille Achat Principale', 'IDProjet'
        ]));
        orderedKeys = allProcedureFields.filter(k => k !== 'id' && k !== 'created_at' && filterFn(k));
      }
    } else {
      // Pour les projets ou sans groupe spécifique
      const allFields = type === 'procedure' 
        ? Array.from(new Set([
            ...fields.map(f => f.id),
            ...Object.keys(data),
            ...Object.values(PROCEDURE_GROUPS).flatMap(g => g.fields),
            'NumProc', 'Numéro de procédure (Afpa)', 'Acheteur', 'Famille Achat Principale', 'IDProjet'
          ]))
        : Array.from(new Set([...fields.map(f => f.id), ...Object.keys(data)]));
      
      orderedKeys = allFields.filter(k => k !== 'id' && k !== 'created_at');
      if (filterFn) orderedKeys = orderedKeys.filter(filterFn);
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {orderedKeys.map(key => {
          const fieldDef = fields.find(f => f.id === key);
          const label = fieldDef ? fieldDef.label : key.replace(/_/g, ' ');
          const val = data[key] || '';
          const isDate = isDateField(key);

          // Recherche distante Supabase pour CPV (élargit les résultats au-delà du préchargement)
          const remoteSearchCpv = async (term: string): Promise<string[]> => {
            if (!supabaseClient) return [];
            const q = term.trim();
            if (!q) return [];
            const stem = q.length > 3 && (q.endsWith('s') || q.endsWith('x')) ? q.slice(0, -1) : q;
            const { data: r } = await supabaseClient
              .from('codes_cpv_long')
              .select('TitreLong')
              .or(`TitreLong.ilike.%${q}%,TitreLong.ilike.%${stem}%`)
              .limit(100);
            return (r || []).map((x: any) => x.TitreLong).filter(Boolean);
          };
          if (key === "CodesCPVDAE" || key === "Code CPV Principal") return <SearchableSelect key={key} label={label} options={refCpv} value={val} placeholder="CPV..." onChange={v => handleFieldChange(type, key, v)} onRemoteSearch={remoteSearchCpv} />;
          if (key === "Type de procédure" && type === 'procedure') return <SearchableSelect key={key} label={label} options={uniqueTypeProcs} value={val} placeholder="Type..." onChange={v => handleFieldChange(type, key, v)} />;

          if (key === "Statut de la consultation" && type === 'procedure') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                {PROCEDURE_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

          if (key === "RP - Statut" && type === 'procedure') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                {RP_STATUT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

          if (key === "Forme du marché" && type === 'procedure') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                {FORME_MARCHE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

          if (key === "CCAG" && type === 'procedure') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                {CCAG_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

          if (key === "Support de procédure" && type === 'procedure') {
            const options = SUPPORT_PROCEDURE_OPTIONS;
            const isCustom = val && !options.includes(val);
            const selectVal = isCustom ? "Autre" : (val || "");
            const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
              const v = e.target.value;
              if (v === "Autre") {
                // Afficher le champ libre : stocker 'Autre' comme sentinelle si pas déjà une valeur personnalisée
                handleFieldChange(type, key, isCustom ? val : "Autre");
              } else {
                handleFieldChange(type, key, v);
              }
            };
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <select value={selectVal} onChange={onSelectChange} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                  <option value="">Sélectionner...</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {selectVal === "Autre" && (
                  <div className="relative group">
                    <input
                      type="text"
                      value={isCustom ? String(val) : ""}
                      onChange={e => handleFieldChange(type, key, e.target.value)}
                      placeholder="Saisir un support (libre)"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-indigo-100 outline-none"
                    />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1 mt-1">Saisir une valeur libre si nécessaire</p>
                  </div>
                )}
              </div>
            );
          }

          if (key === "Finalité de la consultation" && type === 'procedure') {
            const selected = val ? String(val).split(';').map(v => v.trim()).filter(Boolean) : [];
            const toggleOption = (opt: string) => {
              const newSelected = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt];
              handleFieldChange(type, key, newSelected.join(';'));
            };
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <div className="flex flex-wrap gap-2">
                  {FINALITE_CONSULTATION_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(opt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        selected.includes(opt)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selected.length > 0 && (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                    Sélectionné: {selected.join(', ')}
                  </p>
                )}
              </div>
            );
          }

          if (key === "Motivation non allotissement" && type === 'procedure') {
            const lotsRaw = String(getProp(data, 'Nombre de lots') || '').trim();
            const lotsVal = lotsRaw ? parseInt(lotsRaw.replace(/[^0-9-]/g, ''), 10) : NaN;
            const isRequired = lotsVal === 1;
            const selectClass = `w-full px-5 py-4 bg-gray-50 border rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer ${isRequired && !val ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'}`;
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  {label}
                  {isRequired && <span className="text-red-600 ml-2">*</span>}
                </label>
                <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className={selectClass}>
                  <option value="">Sélectionner...</option>
                  {NON_ALLOTISSEMENT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {isRequired && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1">Obligatoire si Nombre de lots = 1</p>}
              </div>
            );
          }

          // Recherche dynamique Supabase pour Famille Achat (sous-famille)
          if (key === "Famille Achat Principale" && type === 'procedure') {
            const remoteSearchSeg = async (term: string): Promise<string[]> => {
              if (!supabaseClient) return [];
              const q = term.trim();
              if (!q) return [];
              const stem = q.length > 3 && (q.endsWith('s') || q.endsWith('x')) ? q.slice(0, -1) : q;
              const { data: r } = await supabaseClient
                .from('Referentiel_segmentation')
                .select('dna_sousfamille')
                .or(`dna_sousfamille.ilike.%${q}%,dna_sousfamille.ilike.%${stem}%`)
                .limit(100);
              return (r || []).map((x: any) => x.dna_sousfamille).filter(Boolean);
            };
            return <SearchableSelect key={key} label={label} options={refSegSousfamilles} value={val} placeholder="Sous-famille..." onChange={v => handleFieldChange(type, key, v)} onRemoteSearch={remoteSearchSeg} />;
          }
          
          if (key === "Acheteur") return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer text-[#004d3d]">
                <option value="">Sélectionner...</option>
                {[...refAcheteurs].sort((a, b) => {
                  const nameA = getProp(a, 'Personne') || getProp(a, 'Nom') || '';
                  const nameB = getProp(b, 'Personne') || getProp(b, 'Nom') || '';
                  return String(nameA).localeCompare(String(nameB));
                }).map((a, i) => <option key={i} value={getProp(a, 'Personne') || getProp(a, 'Nom')}>{getProp(a, 'Personne') || getProp(a, 'Nom')}</option>)}
              </select>
            </div>
          );

          if (key === "Client_Interne" && type === 'project') {
            const remoteSearchClientsInternes = async (term: string): Promise<string[]> => {
              if (!supabaseClient) return [];
              const q = term.trim();
              if (!q) return [];
              const stem = q.length > 3 && (q.endsWith('s') || q.endsWith('x')) ? q.slice(0, -1) : q;
              const { data: r } = await supabaseClient
                .from('Clients_internes')
                .select('dna_title')
                .or(`dna_title.ilike.%${q}%,dna_title.ilike.%${stem}%`)
                .limit(100);
              return (r || []).map((x: any) => x.dna_title).filter(Boolean);
            };
            return <SearchableSelect key={key} label={label} options={refClientsInternes} value={val} placeholder="Client interne..." onChange={v => handleFieldChange(type, key, v)} onRemoteSearch={remoteSearchClientsInternes} />;
          }

          // Séparateur visuel
          if (key === '---SEPARATOR---') return (
            <div key={key} className="col-span-full my-4">
              <div className="border-t-2 border-gray-200"></div>
            </div>
          );

          if (key === "Renouvellement_de_marche" && type === 'project') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          );

          if (key === "Commission_Achat" && type === 'project') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          );

          if (key === "NO_-_Type_de_validation" && type === 'project') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                {TYPE_VALIDATION_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

          if (key === "NO_-_Statut" && type === 'project') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                {NO_STATUT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

            if (key === "Priorite") return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer text-[#004d3d]">
                  <option value="">Sélectionner...</option>
                  {priorityOptions.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            );

          if (key === "Statut_du_Dossier" && type === 'project') return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer text-[#004d3d]">
                <option value="">Sélectionner...</option>
                {DOSSIER_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          );

          // Sélecteur Oui/Non spécifique pour ces champs de projet
          if (type === 'project' && (key === "Renouvellement_de_marche" || key === "Commission_Achat")) return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          );

          if (isBooleanChoiceField(key)) return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <select value={val} onChange={e => handleFieldChange(type, key, e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none appearance-none cursor-pointer">
                <option value="">Sélectionner...</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
                <option value="Sans objet">Sans objet</option>
              </select>
            </div>
          );

          if (key === "Date d'échéance du marché" && type === 'procedure') {
            const dateNotification = getProp(data, 'Date de Notification');
            let inputClass = `w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-[#004d3d]/5 outline-none`;
            let joursRestants: number | null = null;
            let showAlert = false;
            
            // Calculer si la date d'échéance est dans moins de 120 jours et si Date de Notification est vide
            if (val && !dateNotification) {
              try {
                let dateEcheance: Date | null = null;
                
                // Parser la date (format dd/mm/yyyy ou ISO)
                if (typeof val === 'string' && val.includes('/')) {
                  const parts = val.split('/');
                  if (parts.length === 3) {
                    dateEcheance = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  }
                } else {
                  dateEcheance = new Date(val);
                  if (isNaN(dateEcheance.getTime())) {
                    const excelNum = parseFloat(String(val));
                    if (!isNaN(excelNum) && excelNum > 40000) {
                      dateEcheance = excelDateToJSDate(excelNum);
                    }
                  }
                }
                
                if (dateEcheance && !isNaN(dateEcheance.getTime())) {
                  const maintenant = new Date();
                  joursRestants = Math.ceil((dateEcheance.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (joursRestants < 120) {
                    inputClass = `w-full px-5 py-4 bg-red-50 border-2 border-red-400 rounded-2xl text-sm font-bold text-red-600 focus:ring-4 focus:ring-red-100 outline-none`;
                    showAlert = true;
                  }
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }
            
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <div className="relative group">
                  <input type="date" value={formatToInputDate(val)} onChange={e => handleFieldChange(type, key, inputToStoreDate(e.target.value))} className={inputClass} />
                </div>
                {showAlert && joursRestants !== null && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold px-1">
                    ⚠️ Échéance dans {joursRestants} jour{joursRestants !== 1 ? 's' : ''} (moins de 120 jours et pas encore notifié)
                  </p>
                )}
              </div>
            );
          }

          if (key === "Durée de publication" && type === 'procedure') {
            const dateRemiseOffres = getProp(data, 'Date de remise des offres');
            const dateLancementConsultation = getProp(data, 'date_de_lancement_de_la_consultation');
            const typeProcedure = String(getProp(data, 'Type de procédure') || '');
            
            let dureeCalculee = '';
            let textColorClass = 'text-green-700 dark:text-green-400';
            
            if (dateRemiseOffres && dateLancementConsultation) {
              try {
                let dateOffres: Date | null = null;
                let dateLancement: Date | null = null;
                
                // Parser date de remise des offres
                if (typeof dateRemiseOffres === 'string' && dateRemiseOffres.includes('/')) {
                  const parts = dateRemiseOffres.split('/');
                  if (parts.length === 3) {
                    dateOffres = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  }
                } else {
                  dateOffres = new Date(dateRemiseOffres);
                  if (isNaN(dateOffres.getTime())) {
                    const excelNum = parseFloat(String(dateRemiseOffres));
                    if (!isNaN(excelNum) && excelNum > 40000) {
                      dateOffres = excelDateToJSDate(excelNum);
                    }
                  }
                }
                
                // Parser date de lancement de la consultation
                if (typeof dateLancementConsultation === 'string' && dateLancementConsultation.includes('/')) {
                  const parts = dateLancementConsultation.split('/');
                  if (parts.length === 3) {
                    dateLancement = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  }
                } else {
                  dateLancement = new Date(dateLancementConsultation);
                  if (isNaN(dateLancement.getTime())) {
                    const excelNum = parseFloat(String(dateLancementConsultation));
                    if (!isNaN(excelNum) && excelNum > 40000) {
                      dateLancement = excelDateToJSDate(excelNum);
                    }
                  }
                }
                
                if (dateOffres && dateLancement && !isNaN(dateOffres.getTime()) && !isNaN(dateLancement.getTime())) {
                  // Calcul correct : Date remise offres - Date lancement consultation
                  const jours = Math.ceil((dateOffres.getTime() - dateLancement.getTime()) / (1000 * 60 * 60 * 24));
                  dureeCalculee = String(jours);
                  
                  // Vérification de cohérence : la remise des offres doit être après le lancement
                  if (jours < 0) {
                    textColorClass = 'text-red-600 dark:text-red-400 font-bold';
                  } else {
                    // Déterminer la couleur selon le type de procédure et la durée
                    const dureeInt = jours;
                    if (typeProcedure === 'Demande de Devis' && dureeInt < 15) {
                      textColorClass = 'text-red-600 dark:text-red-400 font-bold';
                    } else if (['Appel d\'Offre Ouvert', 'Appel d\'Offre Restreint', 'Dialogue Compétitif', 'Procédure Avec Négociation'].includes(typeProcedure) && dureeInt < 35) {
                      textColorClass = 'text-red-600 dark:text-red-400 font-bold';
                    } else if (typeProcedure === 'Marché A Procédure Adaptée' && dureeInt < 20) {
                      textColorClass = 'text-red-600 dark:text-red-400 font-bold';
                    }
                  }
                  
                  // Mettre à jour le champ avec la durée calculée
                  if (val !== dureeCalculee) {
                    handleFieldChange(type, key, dureeCalculee);
                  }
                }
              } catch (e) {
                console.error('Erreur calcul durée de publication:', e);
              }
            }
            
            const isNegative = dureeCalculee && parseInt(dureeCalculee) < 0;
            
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <div className={`w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold ${textColorClass} cursor-not-allowed`}>
                  {dureeCalculee ? `${dureeCalculee} jour${Math.abs(parseInt(dureeCalculee)) !== 1 ? 's' : ''}` : 'Calcul en attente...'}
                </div>
                {isNegative && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold px-1">
                    ⚠️ Erreur : La date de remise des offres ne peut pas être antérieure à la date de lancement de la consultation
                  </p>
                )}
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Calcul automatique : Date remise offres - Date lancement consultation
                </p>
              </div>
            );
          }

          if (key === "Date de validité des offres (calculée)" && type === 'procedure') {
            const dateRemise = getProp(data, 'Date de remise des offres');
            const duree = getProp(data, 'Durée de validité des offres (en jours)');
            
            let dateCalculee = '';
            
            if (dateRemise && duree) {
              try {
                let dateObj: Date | null = null;
                
                // Parser la date de remise des offres
                if (typeof dateRemise === 'string' && dateRemise.includes('/')) {
                  const parts = dateRemise.split('/');
                  if (parts.length === 3) {
                    dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  }
                } else {
                  dateObj = new Date(dateRemise);
                  if (isNaN(dateObj.getTime())) {
                    const excelNum = parseFloat(String(dateRemise));
                    if (!isNaN(excelNum) && excelNum > 40000) {
                      dateObj = excelDateToJSDate(excelNum);
                    }
                  }
                }
                
                if (dateObj && !isNaN(dateObj.getTime())) {
                  const jours = parseInt(String(duree).replace(/[^0-9]/g, ''), 10) || 0;
                  dateObj.setDate(dateObj.getDate() + jours);
                  dateCalculee = formatDisplayDate(dateObj.toISOString().split('T')[0]);
                  
                  // Mettre à jour le champ avec la date calculée
                  const dateToStore = dateObj.toISOString().split('T')[0];
                  if (val !== dateToStore) {
                    handleFieldChange(type, key, dateToStore);
                  }
                }
              } catch (e) {
                console.error('Erreur calcul date validité offres:', e);
              }
            }
            
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <div className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-not-allowed">
                  {dateCalculee || 'Calcul en attente...'}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Calcul automatique : Date remise offres + Durée validité offres
                </p>
              </div>
            );
          }

          if (key === "Date_limite_validite_offres calculee" && type === 'procedure') {
            const dateRemise = getProp(data, 'Date de remise des offres');
            const duree = getProp(data, 'Durée de validité des offres (en jours)');
            
            let dateCalculee = '';
            let joursRestants = 0;
            let colorClass = 'text-gray-500';
            
            if (dateRemise && duree) {
              try {
                let dateObj: Date | null = null;
                
                // Si c'est au format dd/mm/yyyy (format d'affichage)
                if (typeof dateRemise === 'string' && dateRemise.includes('/')) {
                  const parts = dateRemise.split('/');
                  if (parts.length === 3) {
                    // Convertir dd/mm/yyyy en yyyy-mm-dd
                    dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                  }
                } else {
                  // Sinon essayer de parser directement
                  dateObj = new Date(dateRemise);
                  if (isNaN(dateObj.getTime())) {
                    // Si c'est un nombre (format Excel)
                    const excelNum = parseFloat(String(dateRemise));
                    if (!isNaN(excelNum) && excelNum > 40000) {
                      dateObj = excelDateToJSDate(excelNum);
                    }
                  }
                }
                
                if (dateObj && !isNaN(dateObj.getTime())) {
                  const jours = parseInt(String(duree).replace(/[^0-9]/g, ''), 10) || 0;
                  dateObj.setDate(dateObj.getDate() + jours);
                  dateCalculee = formatDisplayDate(dateObj.toISOString().split('T')[0]);
                  
                  // Calculer le nombre de jours restants par rapport à aujourd'hui
                  const maintenant = new Date();
                  joursRestants = Math.ceil((dateObj.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (joursRestants > 90) colorClass = 'text-emerald-700 font-bold';
                  else if (joursRestants < 30) colorClass = 'text-red-600 font-bold';
                  else colorClass = 'text-orange-600 font-bold';
                  
                  // Mettre à jour le champ avec la date calculée
                  const dateToStore = dateObj.toISOString().split('T')[0];
                  if (val !== dateToStore) {
                    handleFieldChange(type, key, dateToStore);
                  }
                }
              } catch (e) {
                console.error('Erreur calcul date limite:', e);
                colorClass = 'text-gray-400';
              }
            }
            
            return (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
                <div className={`w-full px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl text-sm font-semibold ${colorClass} cursor-not-allowed`}>
                  {dateCalculee || 'Calcul en attente...'}
                  {dateCalculee && <span className="text-[10px] font-normal ml-2 block text-gray-500">({joursRestants > 0 ? `${joursRestants} jours restants` : `Expiré depuis ${Math.abs(joursRestants)} jours`})</span>}
                </div>
              </div>
            );
          }

          // Vérifier si le champ doit être protégé (non modifiable manuellement)
          const isProtectedField = key === "Numéro de procédure (Afpa)" || key === "NumProc" || key === "IDProjet";
          const isFieldReadOnly = isProtectedField; // Toujours protégé, même pour les admins

          return (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
              <div className="relative group">
                <input 
                  type={isDate ? "date" : "text"} 
                  value={isDate ? formatToInputDate(val) : val} 
                  onChange={e => handleFieldChange(type, key, isDate ? inputToStoreDate(e.target.value) : e.target.value)} 
                  disabled={isFieldReadOnly}
                  className={`w-full ${key === "Numéro de procédure (Afpa)" ? 'pr-14' : 'px-5'} py-4 ${isFieldReadOnly ? 'bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-gray-50'} border border-gray-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-[#004d3d]/5 outline-none`} 
                />
                {key === "Numéro de procédure (Afpa)" && <button onClick={generateAfpaNumber} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#004d3d] text-white rounded-xl shadow-lg hover:scale-105 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const save = async (type: 'project' | 'procedure') => {
    if (!supabaseClient) return;
    setIsSaving(true);
    try {
      let data = type === 'project' ? editingProject : editingProcedure;
      if (type === 'procedure' && !data?.NumProc) throw new Error("Erreur : Un identifiant technique (NumProc) est nécessaire.");
      if (type === 'project' && !data?.IDProjet) throw new Error("Erreur : Un identifiant projet (IDProjet) est nécessaire.");
      // Validation conditionnelle: si Nombre de lots === 1, 'Motivation non allotissement' est obligatoire
      if (type === 'procedure' && data) {
        const lotsRaw = String((data as any)["Nombre de lots"] || '').trim();
        const lotsVal = lotsRaw ? parseInt(lotsRaw.replace(/[^0-9-]/g, ''), 10) : NaN;
        const motivation = String((data as any)["Motivation non allotissement"] || '').trim();
        if (lotsVal === 1 && motivation.length === 0) {
          throw new Error("Veuillez renseigner ‘Motivation non allotissement’ lorsque ‘Nombre de lots’ est égal à 1.");
        }
      }
      // Harmonisation des champs avant enregistrement (évite les colonnes inexistantes côté Supabase)
      if (type === 'procedure' && data) {
        const sanitized: any = { ...data };
        if (sanitized['CodesCPVDAE'] && !sanitized['Code CPV Principal']) {
          sanitized['Code CPV Principal'] = sanitized['CodesCPVDAE'];
        }
        delete sanitized['CodesCPVDAE'];
        // Extraire uniquement le code numérique du CPV pour la colonne bigint
        if (sanitized['Code CPV Principal']) {
          const raw = String(sanitized['Code CPV Principal']);
          const m = raw.match(/\b\d{7,9}\b/);
          if (m) sanitized['Code CPV Principal'] = m[0];
        }
        data = sanitized;
      }
      const { error } = await supabaseClient.from(type === 'project' ? 'projets' : 'procédures').upsert(data);
      if (error) throw error;
      await fetchData(supabaseClient);
    } catch (e: any) { alert(e.message); } finally { setIsSaving(false); }
  };

  const FilterDropdown: React.FC<{
    id: string;
    label?: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
    allLabel?: string;
    formatDisplay?: (opt: string) => string;
  }> = ({ id, label, options, selected, onToggle, allLabel = 'Tout', formatDisplay }) => {
    const isOpen = openDropdown === id;
    const totalCount = options.length;
    const displayText = selected.length === 0 
      ? `${allLabel} (${totalCount})`
      : selected.length === totalCount
      ? `${allLabel} (${totalCount})`
      : `${selected.length} sélectionné(s)`;
    
    return (
      <div className="flex-1 min-w-[220px] relative">
        {label && <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">{label}</label>}
        <button 
          onClick={() => setOpenDropdown(isOpen ? null : id)} 
          className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium flex justify-between items-center text-gray-700 hover:border-gray-300 transition-all h-[54px]"
        >
          <span className="truncate">{displayText}</span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((opt, i) => {
                const isSelected = selected.includes(opt);
                const displayOpt = formatDisplay ? formatDisplay(opt) : opt;
                return (
                  <button 
                    key={i} 
                    onClick={() => onToggle(opt)} 
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between hover:bg-gray-50 ${
                      isSelected ? 'text-gray-900 bg-gray-50' : 'text-gray-600'
                    }`}
                  >
                    <span>{displayOpt}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };



  return (
    <div className="app-shell min-h-screen pb-12">
      {viewingFile && (
        <DocumentViewer 
          fileName={viewingFile.name} 
          publicUrl={viewingFile.url} 
          onClose={() => setViewingFile(null)} 
        />
      )}
      <header className="surface-card border-b sticky top-0 z-40 shadow-sm h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="h-12 object-contain" />
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-[#004d3d]">GestProjet</h1>
            <span className="text-[9px] font-bold text-gray-400 tracking-wide">v1.0.0 • Mise à jour : 01/01/2026</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="flex gap-8">
            {[{ label: 'Projets', key: 'dossiers' }, { label: 'Procédures', key: 'procedures' }, { label: 'Indicateurs', key: 'dashboard' }, { label: 'Gantt', key: 'gantt' }, { label: 'Commission HA', key: 'commission' }, { label: 'Export', key: 'export' }, { label: 'AN01', key: 'an01' }, ...(detailData ? [{ label: 'Détail', key: 'detail' }] : [])].map(t => (
              <button key={t.key} onClick={() => { setActiveTab(t.key as TableType); setEditingProject(null); setEditingProcedure(null); }} className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.key ? 'text-[#004d3d]' : 'text-gray-300 hover:text-gray-500'}`}>{t.label}</button>
            ))}
          </nav>
          
          {/* User Badge & Admin Access */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            {authState.profile && (
              <>
                {authState.profile.role === 'admin' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-300">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-300">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User
                  </span>
                )}
                <button
                  onClick={() => setShowAdminDashboard(true)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 relative"
                  title="Accéder au Dashboard Admin"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                  </svg>
                  Dashboard
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  title="Déconnexion"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </>
            )}
          </div>
          
          <div className="theme-toggle flex gap-1">
            <button
              onClick={() => setTheme('light')}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${theme === 'light' ? 'bg-gray-100 scale-110' : 'hover:bg-gray-50'}`}
              title="Clair"
              aria-pressed={theme === 'light'}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 border border-gray-400"></div>
            </button>
            <button
              onClick={() => setTheme('green')}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${theme === 'green' ? 'bg-emerald-100 scale-110' : 'hover:bg-gray-50'}`}
              title="Vert"
              aria-pressed={theme === 'green'}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"></div>
            </button>
            <button
              onClick={() => setTheme('blue')}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${theme === 'blue' ? 'bg-blue-100 scale-110' : 'hover:bg-gray-50'}`}
              title="Bleu"
              aria-pressed={theme === 'blue'}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${theme === 'dark' ? 'bg-gray-700 scale-110' : 'hover:bg-gray-50'}`}
              title="Sombre"
              aria-pressed={theme === 'dark'}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600"></div>
            </button>
          </div>
          <button 
            onClick={() => supabaseClient && fetchData(supabaseClient)} 
            className={`w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-10">
        {!editingProject && !editingProcedure && (
          <>
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row flex-wrap items-end gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100" ref={dropdownRef}>
                  <FilterDropdown 
                    id="dash-acheteur"
                    label="Acheteur"
                    options={[...refAcheteurs].sort((a, b) => {
                      const nameA = getProp(a, 'Personne') || getProp(a, 'Nom') || '';
                      const nameB = getProp(b, 'Personne') || getProp(b, 'Nom') || '';
                      return String(nameA).localeCompare(String(nameB));
                    }).map(a => getProp(a, 'Personne') || getProp(a, 'Nom'))}
                    selected={selectedAcheteurs}
                    onToggle={toggleAcheteur}
                  />
                  <FilterDropdown 
                    id="dash-priority"
                    label="Priorité"
                    options={priorityOptions}
                    selected={selectedPriorities}
                    onToggle={togglePriority}
                  />
                  <FilterDropdown 
                    id="dash-family"
                    label="Famille d'achat"
                    options={uniqueFamilies}
                    selected={selectedFamilies}
                    onToggle={toggleFamily}
                  />
                  <FilterDropdown 
                    id="dash-proctype"
                    label="Type de procédure"
                    options={uniqueTypesForFilter}
                    selected={selectedProcTypes}
                    onToggle={toggleProcType}
                  />
                  <FilterDropdown 
                    id="dash-year"
                    label="Année de Lancement"
                    options={uniqueYears}
                    selected={selectedYears}
                    onToggle={toggleYear}
                  />
                  <FilterDropdown 
                    id="dash-deploy-year"
                    label="Année de Déploiement"
                    options={uniqueDeployYears}
                    selected={selectedDeployYears}
                    onToggle={toggleDeployYear}
                  />
                  <FilterDropdown 
                    id="dash-status"
                    label="Statut projet"
                    options={DOSSIER_STATUS_OPTIONS}
                    selected={selectedStatuses}
                    onToggle={toggleDossierStatus}
                  />
                  {(selectedAcheteurs.length > 0 || selectedFamilies.length > 0 || selectedProcTypes.length > 0 || selectedPriorities.length > 0 || selectedYears.length > 0 || selectedDeployYears.length > 0 || selectedStatuses.length !== DOSSIER_STATUS_OPTIONS.filter(s => !s.startsWith('4') && !s.startsWith('5')).length) && (
                    <button onClick={resetFilters} className="px-6 py-4 text-xs font-black text-orange-600 uppercase tracking-widest hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 h-[54px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>Reset
                    </button>
                  )}
                </div>
                
                {/* Titre avec années filtrées */}
                {/* Affichage des filtres appliqués */}
                {(selectedAcheteurs.length > 0 || selectedPriorities.length > 0 || selectedFamilies.length > 0 || 
                  selectedProcTypes.length > 0 || selectedYears.length > 0 || selectedDeployYears.length > 0 || 
                  selectedStatuses.length > 0) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Filtres appliqués :</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {selectedAcheteurs.length > 0 && (
                        <li>• Acheteur : {selectedAcheteurs.join(', ')}</li>
                      )}
                      {selectedPriorities.length > 0 && (
                        <li>• Priorité : {selectedPriorities.join(', ')}</li>
                      )}
                      {selectedFamilies.length > 0 && (
                        <li>• Famille d'achat : {selectedFamilies.join(', ')}</li>
                      )}
                      {selectedProcTypes.length > 0 && (
                        <li>• Type de procédure : {selectedProcTypes.join(', ')}</li>
                      )}
                      {selectedYears.length > 0 && (
                        <li>• Année de lancement : {selectedYears.join(', ')}</li>
                      )}
                      {selectedDeployYears.length > 0 && (
                        <li>• Année de déploiement : {selectedDeployYears.join(', ')}</li>
                      )}
                      {selectedStatuses.length > 0 && (
                        <li>• Statut projet : {selectedStatuses.join(', ')}</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Executive KPI Dashboard */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <KPITile label="NB PROJETS" value={kpis.nbP} />
                  <KPITile label="NB PROCÉDURES" value={kpis.nbProc} />
                  <KPITile label="TOTAL PROJET" value={Math.round(kpis.amtP)} unit="€" />
                  <KPITile label="TOTAL PROCÉDURES" value={Math.round(kpis.amtProc)} unit="€" />
                  <KPITile label="MOYENNE PROJET" value={Math.round(kpis.avgP)} unit="€" />
                  <KPITile label="MOYENNE PROCÉDURE" value={Math.round(kpis.avgProc)} unit="€" />
                  <KPITile label="TAUX DISPO. ENVIRONNEMENTALES" value={Math.round(kpis.tauxDispoEnv * 10) / 10} unit="%" />
                  <KPITile label="TAUX DISPO. SOCIALES" value={Math.round(kpis.tauxDispoSoc * 10) / 10} unit="%" />
                  <KPITile label="TAUX PROJETS INNOVANTS" value={Math.round(kpis.tauxProjetsInnovants * 10) / 10} unit="%" />
                  <KPITile label="TAUX PROJETS TPE/PME" value={Math.round(kpis.tauxProjetsTPEPME * 10) / 10} unit="%" />
                </div>
                
                {/* Section PROJETS */}
                <div className="mt-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 w-12 bg-[#004d3d] rounded"></div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">Projets</h2>
                    <div className="flex-1 h-1 bg-gray-200 rounded"></div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                    <SimpleBarChart 
                      data={kpis.charts.projetsAcheteur} 
                      title={selectedAcheteurs.length > 0 ? "Répartition Projets Filtrés" : "Top Acheteurs (Projets)"} 
                      color="bg-[#004d3d]" 
                      onClick={() => {
                        setDetailData({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Acheteur' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.projetsPriorite} 
                      title="Projets par Priorité" 
                      color="bg-teal-600" 
                      onClick={() => {
                        setDetailData({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Priorité' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.projetsStatut} 
                      title="Projets par Statut" 
                      color="bg-emerald-600" 
                      onClick={() => {
                        setDetailData({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Statut' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.projetsClientInterne} 
                      title="Projets par Client Interne" 
                      color="bg-violet-600" 
                      onClick={() => {
                        setDetailData({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Client Interne' });
                        setActiveTab('detail');
                      }}
                    />
                  </div>
                </div>

                {/* Section PROCÉDURES */}
                <div className="mt-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 w-12 bg-indigo-600 rounded"></div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">Procédures</h2>
                    <div className="flex-1 h-1 bg-gray-200 rounded"></div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                    <SimpleBarChart 
                      data={kpis.charts.proceduresAcheteur} 
                      title={selectedAcheteurs.length > 0 ? "Répartition Procédures Filtrées" : "Top Acheteurs (Procédures)"} 
                      color="bg-indigo-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Procédures par Acheteur' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresType} 
                      title="Procédures par Type" 
                      color="bg-orange-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Procédures par Type' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresStatut} 
                      title="Procédures par Statut" 
                      color="bg-blue-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Procédures par Statut' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresTypeMoyenne} 
                      title="Montant Moyen par Type (€)" 
                      color="bg-rose-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Montant Moyen par Type' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresDispoEnv} 
                      title="Dispositions Environnementales" 
                      color="bg-green-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Dispositions Environnementales' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresDispoSoc} 
                      title="Dispositions Sociales" 
                      color="bg-purple-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Dispositions Sociales' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresProjetsInnovants} 
                      title="Projets Innovants" 
                      color="bg-cyan-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Projets Innovants' });
                        setActiveTab('detail');
                      }}
                    />
                    <SimpleBarChart 
                      data={kpis.charts.proceduresProjetsTPEPME} 
                      title="Projets TPE/PME" 
                      color="bg-amber-600" 
                      onClick={() => {
                        setDetailData({ type: 'project', data: kpis.filteredProcedures, title: 'Projets TPE/PME' });
                        setActiveTab('detail');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'export' && (
              <div className="max-w-2xl mx-auto py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button onClick={exportToExcel} className="w-full bg-[#004d3d] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all">Télécharger la base (.xlsx)</button>
              </div>
            )}
            {activeTab === 'gantt' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row flex-wrap items-end gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100" ref={dropdownRef}>
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Recherche</label>
                    <input type="text" placeholder="N° Procédure, Titre..." value={projectSearch} onChange={e => setProjectSearch(e.target.value)} className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Date de Lancement</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={launchFrom} onChange={e => setLaunchFrom(e.target.value)} placeholder="Du" className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors" />
                      <input type="date" value={launchTo} onChange={e => setLaunchTo(e.target.value)} placeholder="Au" className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Date de Déploiement</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" value={deployFrom} onChange={e => setDeployFrom(e.target.value)} placeholder="Du" className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors" />
                      <input type="date" value={deployTo} onChange={e => setDeployTo(e.target.value)} placeholder="Au" className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors" />
                    </div>
                  </div>
                  <FilterDropdown 
                    id="gantt-statut"
                    label="Statut"
                    options={DOSSIER_STATUS_OPTIONS}
                    selected={selectedStatuses}
                    onToggle={(opt) => setSelectedStatuses(prev => prev.includes(opt) ? prev.filter(s => s !== opt) : [...prev, opt])}
                  />
                  <FilterDropdown 
                    id="gantt-acheteur"
                    label="Acheteur"
                    options={[...refAcheteurs].sort((a, b) => {
                      const nameA = getProp(a, 'Personne') || getProp(a, 'Nom') || '';
                      const nameB = getProp(b, 'Personne') || getProp(b, 'Nom') || '';
                      return String(nameA).localeCompare(String(nameB));
                    }).map(a => getProp(a, 'Personne') || getProp(a, 'Nom'))}
                    selected={selectedAcheteurs}
                    onToggle={toggleAcheteur}
                  />
                  <FilterDropdown 
                    id="gantt-priority"
                    label="Priorité"
                    options={priorityOptions}
                    selected={selectedPriorities}
                    onToggle={togglePriority}
                  />
                  <FilterDropdown 
                    id="gantt-client"
                    label="Client Interne"
                    options={refClientsInternes}
                    selected={selectedClientsInternes}
                    onToggle={(opt) => setSelectedClientsInternes(prev => prev.includes(opt) ? prev.filter(c => c !== opt) : [...prev, opt])}
                  />
                  <FilterDropdown 
                    id="gantt-proctype"
                    label="Type Procédure"
                    options={uniqueTypesForFilter}
                    selected={selectedProcTypes}
                    onToggle={toggleProcType}
                  />
                  <FilterDropdown 
                    id="gantt-ccag"
                    label="CCAG"
                    options={uniqueCcagsForFilter}
                    selected={selectedCcags}
                    onToggle={(opt) => setSelectedCcags(prev => prev.includes(opt) ? prev.filter(c => c !== opt) : [...prev, opt])}
                  />
                  {(selectedAcheteurs.length > 0 || selectedClientsInternes.length > 0 || selectedStatuses.length > 0 || selectedPriorities.length > 0 || selectedCcags.length > 0 || selectedProcTypes.length > 0 || projectSearch || launchFrom || launchTo || deployFrom || deployTo) && (
                    <button onClick={resetFilters} className="px-6 py-4 text-xs font-black text-orange-600 uppercase tracking-widest hover:bg-orange-50 rounded-2xl transition-all flex items-center gap-2 h-[54px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>Reset
                    </button>
                  )}
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-[2rem] shadow-sm">
                  {(() => {
                    const procByProject: Record<string, { types: Set<string>; ccags: Set<string>; }> = {};
                    procedures.forEach(p => {
                      const pid = String(getProp(p, 'IDProjet') || '');
                      if (!pid) return;
                      const types = getProp(p, 'Type de procédure') || '';
                      const ccag = getProp(p, 'CCAG') || '';
                      procByProject[pid] = procByProject[pid] || { types: new Set(), ccags: new Set() };
                      procByProject[pid].types.add(types);
                      if (ccag) procByProject[pid].ccags.add(ccag);
                    });
                    const toDate = (s: any) => {
                      if (!s && s !== 0) return null;
                      const str = String(s).trim();
                      if (/^\d{5}(\.\d+)?$/.test(str)) {
                        const d = excelDateToJSDate(parseFloat(str));
                        return d && !isNaN(d.getTime()) ? d : null;
                      }
                      const parts = str.includes('/') ? str.split('/') : str.split('-');
                      if (parts.length === 3) {
                        const [a, b, c] = parts;
                        if (str.includes('/')) {
                          const y = parseInt(c, 10), m = parseInt(b, 10) - 1, d = parseInt(a, 10);
                          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
                        } else {
                          const y = parseInt(a, 10), m = parseInt(b, 10) - 1, d = parseInt(c, 10);
                          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
                        }
                      }
                      const dt = new Date(str);
                      return isNaN(dt.getTime()) ? null : dt;
                    };
                    const inRange = (dt: Date | null, fromStr: string, toStr: string) => {
                      if (!dt) return true;
                      const f = fromStr ? new Date(fromStr) : null;
                      const t = toStr ? new Date(toStr) : null;
                      if (f && dt < f) return false;
                      if (t && dt > t) return false;
                      return true;
                    };
                    
                    const now = new Date();
                    const filtered = dossiers.filter(d => {
                      const ach = String(getProp(d, 'Acheteur') || '');
                      const cli = String(getProp(d, 'Client_Interne') || '');
                      const pri = String(getProp(d, 'Priorite') || '');
                      const stat = String(getProp(d, 'Statut_du_Dossier') || '');
                      const pid = String(getProp(d, 'IDProjet') || '');
                      const typeSet = procByProject[pid]?.types || new Set<string>();
                      const ccagSet = procByProject[pid]?.ccags || new Set<string>();
                      const launch = toDate(getProp(d, 'Date_de_lancement_de_la_consultation'));
                      const deploy = toDate(getProp(d, 'Date_de_deploiement_previsionnelle_du_marche'));
                      const matchesText = !projectSearch || (String(getProp(d, 'Titre_du_dossier') || '').toLowerCase().includes(projectSearch.toLowerCase()) || String(pid).toLowerCase().includes(projectSearch.toLowerCase()));
                      const matchesAch = selectedAcheteurs.length === 0 || selectedAcheteurs.includes(ach);
                      const matchesCli = selectedClientsInternes.length === 0 || selectedClientsInternes.includes(cli);
                      const matchesPri = selectedPriorities.length === 0 || selectedPriorities.includes(pri);
                      const matchesStat = selectedStatuses.includes(stat);
                      const matchesType = selectedProcTypes.length === 0 || Array.from(typeSet).some(t => selectedProcTypes.includes(t));
                      const matchesCcag = selectedCcags.length === 0 || Array.from(ccagSet).some(c => selectedCcags.includes(c));
                      const matchesLaunch = inRange(launch, launchFrom, launchTo);
                      const matchesDeploy = inRange(deploy, deployFrom, deployTo);
                      return matchesText && matchesAch && matchesCli && matchesPri && matchesStat && matchesType && matchesCcag && matchesLaunch && matchesDeploy;
                    });
                    
                    const late = filtered.filter(d => {
                      const deploy = toDate(getProp(d, 'Date_de_deploiement_previsionnelle_du_marche'));
                      if (!deploy) return false;
                      const diffDays = Math.ceil((deploy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 0;
                    }).length;
                    
                    const ongoing = filtered.filter(d => {
                      const deploy = toDate(getProp(d, 'Date_de_deploiement_previsionnelle_du_marche'));
                      if (!deploy) return false;
                      const diffDays = Math.ceil((deploy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays > 0;
                    }).length;

                    const missing = filtered.filter(d => {
                      const deploy = toDate(getProp(d, 'Date_de_deploiement_previsionnelle_du_marche'));
                      return !deploy;
                    }).length;
                    
                    return (
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Projets filtrés</p>
                          <p className="text-4xl font-black text-blue-600 mb-3">{filtered.length}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                              <span className="text-sm font-bold text-red-600">{late} en retard</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-700 rounded-full"></div>
                              <span className="text-sm font-bold text-green-700">{ongoing} en cours</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                              <span className="text-sm font-bold text-gray-600">{missing} sans date</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-2"><span className="w-8 h-3 bg-gradient-to-r from-emerald-200 to-emerald-500 rounded"></span> <span>En cours (futur)</span></div>
                  <div className="flex items-center gap-2"><span className="w-8 h-3 rounded" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 8px, #fecaca 8px, #fecaca 16px)' }}></span> <span>Retard</span></div>
                  <div className="flex items-center gap-2"><span className="w-8 h-3 rounded" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 8px, #d1d5db 8px, #d1d5db 16px)' }}></span> <span>Sans date</span></div>
                  <div className="ml-auto text-gray-300">Repère: Aujourd'hui</div>
                </div>

                <div className="space-y-4">
                  {(() => {
                    const procByProject: Record<string, { types: Set<string>; ccags: Set<string>; numProc?: string; montant?: number; }> = {};
                    procedures.forEach(p => {
                      const pid = String(getProp(p, 'IDProjet') || '');
                      if (!pid) return;
                      const types = getProp(p, 'Type de procédure') || '';
                      const ccag = getProp(p, 'CCAG') || '';
                      const numProc = String(getProp(p, 'NumProc') || '');
                      const montantRaw = String(getProp(p, 'Montant de la procédure') || '');
                      const montant = parseFloat(montantRaw.replace(/[^\d.]/g, '')) || 0;
                      procByProject[pid] = procByProject[pid] || { types: new Set(), ccags: new Set(), numProc: numProc, montant };
                      procByProject[pid].types.add(types);
                      if (ccag) procByProject[pid].ccags.add(ccag);
                      if (montant > (procByProject[pid].montant || 0)) procByProject[pid].montant = montant;
                      if (numProc) procByProject[pid].numProc = numProc;
                    });

                    const toDate = (s: any) => {
                      if (!s && s !== 0) return null;
                      const str = String(s).trim();
                      // Excel 5 chiffres (numéro de série)
                      if (/^\d{5}(\.\d+)?$/.test(str)) {
                        const d = excelDateToJSDate(parseFloat(str));
                        return d && !isNaN(d.getTime()) ? d : null;
                      }
                      const parts = str.includes('/') ? str.split('/') : str.split('-');
                      if (parts.length === 3) {
                        const [a, b, c] = parts;
                        if (str.includes('/')) { // jj/mm/aaaa
                          const y = parseInt(c, 10), m = parseInt(b, 10) - 1, d = parseInt(a, 10);
                          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
                        } else { // yyyy-mm-dd
                          const y = parseInt(a, 10), m = parseInt(b, 10) - 1, d = parseInt(c, 10);
                          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
                        }
                      }
                      const dt = new Date(str);
                      return isNaN(dt.getTime()) ? null : dt;
                    };
                    const inRange = (dt: Date | null, fromStr: string, toStr: string) => {
                      if (!dt) return true;
                      const f = fromStr ? new Date(fromStr) : null;
                      const t = toStr ? new Date(toStr) : null;
                      if (f && dt < f) return false;
                      if (t && dt > t) return false;
                      return true;
                    };

                    const applyFilters = (d: DossierData) => {
                      const ach = String(getProp(d, 'Acheteur') || '');
                      const cli = String(getProp(d, 'Client_Interne') || '');
                      const pri = String(getProp(d, 'Priorite') || '');
                      const stat = String(getProp(d, 'Statut_du_Dossier') || '');
                      const pid = String(getProp(d, 'IDProjet') || '');
                      const typeSet = procByProject[pid]?.types || new Set<string>();
                      const ccagSet = procByProject[pid]?.ccags || new Set<string>();
                      const launch = toDate(getProp(d, 'Date_de_lancement_de_la_consultation'));
                      const deploy = toDate(getProp(d, 'Date_de_deploiement_previsionnelle_du_marche'));
                      const matchesText = !projectSearch || (String(getProp(d, 'Titre_du_dossier') || '').toLowerCase().includes(projectSearch.toLowerCase()) || String(pid).toLowerCase().includes(projectSearch.toLowerCase()));
                      const matchesAch = selectedAcheteurs.length === 0 || selectedAcheteurs.includes(ach);
                      const matchesCli = selectedClientsInternes.length === 0 || selectedClientsInternes.includes(cli);
                      const matchesPri = selectedPriorities.length === 0 || selectedPriorities.includes(pri);
                      const matchesStat = selectedStatuses.includes(stat);
                      const matchesType = selectedProcTypes.length === 0 || Array.from(typeSet).some(t => selectedProcTypes.includes(t));
                      const matchesCcag = selectedCcags.length === 0 || Array.from(ccagSet).some(c => selectedCcags.includes(c));
                      const matchesLaunch = inRange(launch, launchFrom, launchTo);
                      const matchesDeploy = inRange(deploy, deployFrom, deployTo);
                      return matchesText && matchesAch && matchesCli && matchesPri && matchesStat && matchesType && matchesCcag && matchesLaunch && matchesDeploy;
                    };

                    const now = new Date();
                    const withDays = dossiers.filter(applyFilters).map(d => {
                      const deploy = toDate(getProp(d, 'Date_de_deploiement_previsionnelle_du_marche'));
                      const pid = String(getProp(d, 'IDProjet') || '');
                      const numProc = procByProject[pid]?.numProc || '';
                      const amount = procByProject[pid]?.montant || (parseFloat(String(getProp(d, 'Montant_previsionnel_du_marche_(_HT)_')).replace(/[^\d.]/g, '')) || 0);
                      const diffDays = deploy ? Math.ceil((deploy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      return { d, deploy, diffDays, numProc, amount };
                    });

                    const missing = withDays.filter(x => x.diffDays === null);
                    const late = withDays.filter(x => x.diffDays !== null && x.diffDays <= 0).sort((a, b) => a.diffDays - b.diffDays);
                    const future = withDays.filter(x => x.diffDays !== null && x.diffDays > 0);
                    const maxDays = future.length > 0 ? Math.max(...future.map(x => x.diffDays)) : 1;
                    future.sort((a, b) => a.diffDays - b.diffDays || (String(getProp(b.d, 'Priorite') || '').localeCompare(String(getProp(a.d, 'Priorite') || ''))) || (b.amount - a.amount));
                    const ordered = [...missing, ...late, ...future];

                    return ordered.map(({ d, deploy, diffDays, numProc, amount }, i) => {
                      const acheteur = String(getProp(d, 'Acheteur') || 'N/C');
                      const statut = String(getProp(d, 'Statut_du_Dossier') || '');
                      const titre = String(getProp(d, 'Titre_du_dossier') || '');
                      const priorite = String(getProp(d, 'Priorite') || '').split(' - ')[0] || 'N/C';
                      const deployTxt = deploy ? formatDisplayDate(deploy.toISOString().slice(0,10)) : 'N/C';
                      const amountTxt = `${Math.round(amount).toLocaleString()} €`;
                      const statutClass = statut.startsWith('4') ? 'bg-emerald-50 text-emerald-700' : statut.startsWith('3') ? 'bg-orange-50 text-orange-600' : statut.startsWith('5') ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500';
                      const prColor = priorite.startsWith('P1') ? 'bg-red-600' : priorite.startsWith('P2') ? 'bg-orange-500' : 'bg-gray-400';
                      const isMissing = diffDays === null;
                      const isLate = diffDays !== null && diffDays <= 0;
                      const widthPct = isMissing ? 100 : isLate ? 100 : Math.max(6, Math.round((diffDays / maxDays) * 100));
                      return (
                        <div key={i} className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden group">
                          <div className="grid grid-cols-1 md:grid-cols-5">
                            <div className="md:col-span-2 p-6 flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{acheteur}</span>
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${statutClass}`}>{statut || 'N/C'}</span>
                              </div>
                              <div className="text-sm font-black text-gray-900 leading-snug">{titre}</div>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target: {deployTxt}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg text-white ${prColor}`}>{priorite}</span>
                              </div>
                            </div>
                            <div className="md:col-span-3 p-6 relative">
                              <div className="absolute left-6 top-6 bottom-6 w-px bg-gray-200" />
                              <div className="ml-6">
                                {isMissing ? (
                                  <div className="w-full h-10 rounded-xl relative flex items-center justify-between px-4" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 10px, #d1d5db 10px, #d1d5db 20px)' }}>
                                    <div className="flex items-center gap-2 text-gray-600 font-black text-[10px] uppercase tracking-widest"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z"/></svg> Date cible manquante</div>
                                    <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{numProc || 'N° N/C'} — {amountTxt}</div>
                                  </div>
                                ) : isLate ? (
                                  <div className="w-full h-10 rounded-xl relative flex items-center justify-between px-4" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff1f2, #fff1f2 10px, #fecaca 10px, #fecaca 20px)' }}>
                                    <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 1114.14 14.14A10 10 0 014.93 4.93z"/></svg> Retard: {Math.abs(diffDays)}j</div>
                                    <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{numProc || 'N° N/C'} — {amountTxt}</div>
                                  </div>
                                ) : (
                                  <div className="h-10 rounded-xl bg-gradient-to-r from-emerald-200 to-emerald-500 relative flex items-center justify-between px-4" style={{ width: `${widthPct}%` }}>
                                    <div className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">{diffDays}j</div>
                                    <div className="text-[10px] font-black text-white uppercase tracking-widest">{numProc || 'N° N/C'} — {amountTxt}</div>
                                  </div>
                                )}
                              </div>
                              <div className="absolute right-6 top-3 text-[10px] font-black text-gray-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Fin: {deployTxt}</div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            {(activeTab === 'dossiers' || activeTab === 'procedures') && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row flex-wrap items-end gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100" ref={dropdownRef}>
                  <div className="flex-1 min-w-[220px]">
                    {activeTab === 'dossiers' && (
                      <>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Recherche</label>
                        <input
                          type="text"
                          placeholder="N° Projet..."
                          value={projectSearch}
                          onChange={e => setProjectSearch(e.target.value)}
                          className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors"
                        />
                      </>
                    )}
                    {activeTab === 'procedures' && (
                      <>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Recherche</label>
                        <input
                          type="text"
                          placeholder="N° Procédure..."
                          value={procedureSearch}
                          onChange={e => setProcedureSearch(e.target.value)}
                          className="w-full px-6 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none h-[54px] focus:border-gray-300 transition-colors"
                        />
                      </>
                    )}
                  </div>
                  <FilterDropdown 
                    id="list-acheteur"
                    label="Acheteur"
                    options={[...refAcheteurs].sort((a, b) => {
                      const nameA = getProp(a, 'Personne') || getProp(a, 'Nom') || '';
                      const nameB = getProp(b, 'Personne') || getProp(b, 'Nom') || '';
                      return String(nameA).localeCompare(String(nameB));
                    }).map(a => getProp(a, 'Personne') || getProp(a, 'Nom'))}
                    selected={selectedAcheteurs}
                    onToggle={toggleAcheteur}
                  />
                  {activeTab === 'dossiers' && (
                    <FilterDropdown 
                      id="list-priority"
                      label="Priorité"
                      options={priorityOptions}
                      selected={selectedPriorities}
                      onToggle={togglePriority}
                    />
                  )}
                  {(selectedAcheteurs.length > 0 || selectedPriorities.length > 0 || projectSearch || procedureSearch) && (
                    <button onClick={resetFilters} className="px-6 py-4 text-xs font-black text-orange-600 uppercase tracking-widest hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 h-[54px]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>Reset
                    </button>
                  )}
                  <button onClick={() => {
                    if (activeTab === 'dossiers') {
                      const maxId = dossiers.reduce((max, p) => {
                        const num = parseInt(String(p.IDProjet || '') || '0');
                        return num > max ? num : max;
                      }, 0);
                      setEditingProject({ IDProjet: `${maxId + 1}` });
                    } else {
                      // Trouver le plus grand numéro de procédure standalone (format PR####)
                      let maxProcNum = 0;
                      procedures.forEach(proc => {
                        const numProc = String(getProp(proc, 'NumProc') || '');
                        if (numProc.startsWith('PR')) {
                          const numPart = numProc.replace(/^PR/, '').replace(/\D/g, '');
                          const num = parseInt(numPart);
                          if (!isNaN(num) && num > maxProcNum) {
                            maxProcNum = num;
                          }
                        }
                      });
                      const nextNum = (maxProcNum + 1).toString().padStart(4, '0');
                      
                      // Initialiser tous les champs d'identification + champs techniques
                      const newProcedure: Partial<ProjectData> = {
                        // Champs techniques (non dans PROCEDURE_GROUPS mais nécessaires)
                        NumProc: `PR${nextNum}`,
                        "Numéro de procédure (Afpa)": "",
                        Acheteur: "",
                        "Famille Achat Principale": "",
                        IDProjet: "",
                        // Champs d'identification (groupe)
                        "Type de procédure": "",
                        "Code CPV Principal": "",
                        "Nom de la procédure": "",
                        "Objet court": "",
                        "Statut de la consultation": "1 - Initiée",
                      };
                      setEditingProcedure(newProcedure);
                    }
                  }} className={`whitespace-nowrap px-10 py-4 rounded-xl text-white font-semibold text-sm bg-[#004d3d] hover:bg-[#006d57] h-[54px] transition-colors flex items-center gap-2`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    {activeTab === 'dossiers' ? 'Nouveau Projet' : 'Nouvelle Procédure'}
                  </button>
                </div>
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div ref={topScrollRef} className="overflow-x-auto overflow-y-hidden border-b border-gray-100" style={{ paddingBottom: 2 }}>
                    <div style={{ width: tableScrollWidth || '100%', height: 1 }} />
                  </div>
                  <div ref={bodyScrollRef} className="overflow-x-auto overflow-y-hidden">
                    {(() => {
                      const hiddenDossierColumns = ['CodesCPVDAE', 'Renouvellement_de_marche', 'Commission_Achat', 'NO_-_Type_de_validation'];
                      const visibleDossierFields = DOSSIER_FIELDS.filter(f => !hiddenDossierColumns.includes(f.id));
                      const visibleProjectFields = PROJECT_FIELDS;
                      const fieldsForTab = activeTab === 'dossiers' ? visibleDossierFields : visibleProjectFields;
                      
                      const sortColumn = activeTab === 'dossiers' ? dossierSortColumn : procedureSortColumn;
                      const sortDirection = activeTab === 'dossiers' ? dossierSortDirection : procedureSortDirection;
                      
                      const handleSort = (fieldId: string) => {
                        if (activeTab === 'dossiers') {
                          if (dossierSortColumn === fieldId) {
                            setDossierSortDirection(dossierSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setDossierSortColumn(fieldId);
                            setDossierSortDirection('asc');
                          }
                        } else {
                          if (procedureSortColumn === fieldId) {
                            setProcedureSortDirection(procedureSortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setProcedureSortColumn(fieldId);
                            setProcedureSortDirection('asc');
                          }
                        }
                      };
                      
                      const baseRows = activeTab === 'dossiers' ? filteredD : filteredP;
                      const rows = sortColumn ? [...baseRows].sort((a, b) => {
                        const aVal = String(getProp(a, sortColumn) || '');
                        const bVal = String(getProp(b, sortColumn) || '');
                        const comparison = aVal.localeCompare(bVal, 'fr', { numeric: true });
                        return sortDirection === 'asc' ? comparison : -comparison;
                      }) : baseRows;
                      
                      return (
                        <table className="themed-table min-w-full divide-y divide-gray-50">
                          <thead><tr className="bg-gray-50/50">
                            {fieldsForTab.map(f => (
                              <th 
                                key={f.id} 
                                className={`px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#004d3d] transition-colors ${isNumericField(f.id) || isDateField(f.id) ? 'text-right' : 'text-left'}`}
                                onClick={() => handleSort(f.id)}
                              >
                                {f.label} {sortColumn === f.id && (sortDirection === 'asc' ? '↑' : '↓')}
                              </th>
                            ))}
                            <th className="px-8 py-5 text-right sticky right-0 bg-white">Actions</th>
                          </tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {rows.map((item, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 group transition-colors">
                                {fieldsForTab.map(f => {
                                  let cellValue;
                                  if (f.id === 'NumeroAfpa5Chiffres') {
                                    // Extraire les 5 chiffres du numéro Afpa
                                    const fullAfpa = getProp(item, 'Numéro de procédure (Afpa)');
                                    if (fullAfpa) {
                                      const match = String(fullAfpa).match(/\d{5}/);
                                      cellValue = match ? match[0] : '-';
                                    } else {
                                      cellValue = '-';
                                    }
                                  } else if (isDateField(f.id)) {
                                    cellValue = formatDisplayDate(getProp(item, f.id));
                                  } else {
                                    cellValue = getProp(item, f.id) || '-';
                                  }
                                  
                                  return (
                                    <td key={f.id} className={`px-8 py-5 text-xs text-gray-600 font-bold max-w-[200px] truncate ${isNumericField(f.id) || isDateField(f.id) ? 'text-right' : 'text-left'}`}>
                                      {cellValue}
                                    </td>
                                  );
                                })}
                                <td className="px-8 py-5 text-right sticky right-0 bg-white/80 transition-colors backdrop-blur-sm">
                                  <button onClick={() => { if(activeTab === 'dossiers') { setEditingProject(item); setActiveSubTab('general'); } else { setEditingProcedure(item); setActiveSubTab('general'); } }} className={`p-2.5 rounded-xl transition-all ${activeTab === 'dossiers' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-600 bg-blue-50'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {(editingProject || editingProcedure) && (
          <div className="animate-in slide-in-from-bottom-8 duration-600 max-w-6xl mx-auto space-y-8">
            <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-2xl flex items-center justify-between">
              <button onClick={() => { setEditingProject(null); setEditingProcedure(null); }} className="flex items-center gap-3 text-gray-300 font-black text-[10px] uppercase tracking-widest hover:text-gray-500 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg> Retour</button>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em]">Édition {editingProject ? 'Dossier' : 'Procédure'}</h2>
              <div className="flex items-center gap-3">
                <button onClick={() => save(editingProject ? 'project' : 'procedure')} disabled={isSaving} className="px-12 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all bg-[#004d3d] hover:bg-[#006d57]">{isSaving ? 'Enregistrement...' : 'Enregistrer'}</button>
                <button onClick={() => { setEditingProject(null); setEditingProcedure(null); }} className="px-8 py-4 rounded-2xl bg-gray-700 text-white font-black text-xs uppercase tracking-widest hover:bg-gray-600 transition-all">Quitter</button>
              </div>
            </div>
            <div className="bg-white border border-gray-100 p-12 rounded-[3.5rem] shadow-sm min-h-[400px]">
              <div className="flex gap-10 border-b border-gray-50 mb-10 overflow-x-auto pb-2">
                <button onClick={() => setActiveSubTab('general')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'general' ? (editingProject ? 'border-[#004d3d] text-[#004d3d]' : 'border-blue-600 text-blue-600') : 'border-transparent text-gray-300'}`}>Identification</button>
                {editingProject && <button onClick={() => setActiveSubTab('opportunite')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'opportunite' ? 'border-[#004d3d] text-[#004d3d]' : 'border-transparent text-gray-300'}`}>Opportunité</button>}
                {editingProject && <button onClick={() => setActiveSubTab('procedures_liees')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'procedures_liees' ? 'border-[#004d3d] text-[#004d3d]' : 'border-transparent text-gray-300'}`}>Procédures ({associatedProcedures.length})</button>}
                {editingProcedure && (
                  <>
                    <button onClick={() => setActiveSubTab('marche')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'marche' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-300'}`}>{PROCEDURE_GROUPS.marche.label}</button>
                    <button onClick={() => setActiveSubTab('strategie')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'strategie' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-300'}`}>{PROCEDURE_GROUPS.strategie.label}</button>
                    <button onClick={() => setActiveSubTab('publication')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'publication' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-300'}`}>{PROCEDURE_GROUPS.publication.label}</button>
                    <button onClick={() => setActiveSubTab('offres')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'offres' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-300'}`}>{PROCEDURE_GROUPS.offres.label}</button>
                    <button onClick={() => setActiveSubTab('rapport')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'rapport' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-300'}`}>{PROCEDURE_GROUPS.rapport.label}</button>
                    <button onClick={() => setActiveSubTab('attribution')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'attribution' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-300'}`}>{PROCEDURE_GROUPS.attribution.label}</button>
                  </>
                )}
                <button onClick={() => setActiveSubTab('documents')} className={`flex items-center gap-3 px-8 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeSubTab === 'documents' ? (editingProject ? 'border-[#004d3d] text-[#004d3d]' : 'border-blue-600 text-blue-600') : 'border-transparent text-gray-300'}`}>Documents ({files.length})</button>
              </div>
              <div className="animate-in fade-in duration-500">
                {activeSubTab === 'general' && renderFormFields(
                  editingProject ? 'project' : 'procedure',
                  editingProject || editingProcedure,
                  k => editingProject
                    ? DOSSIER_FIELDS.some(f => f.id === k)
                    : ((PROJECT_FIELDS.some(f => f.id === k) || identificationFields.has(k)) && !otherGroupedProcedureFields.has(k))
                )}
                {activeSubTab === 'opportunite' && editingProject && renderFormFields('project', editingProject, (k) => k === 'Commission_Achat' || k === 'NO_-_Type_de_validation' || k.startsWith('NO_-'))}
                {editingProcedure && activeSubTab === 'marche' && renderFormFields('procedure', editingProcedure, (k) => PROCEDURE_GROUPS.marche.fields.includes(k))}
                {editingProcedure && activeSubTab === 'strategie' && (
                  <>
                    {renderFormFields('procedure', editingProcedure, (k) => PROCEDURE_GROUPS.strategie.fields.includes(k) && !rseFields.has(k))}
                    <div className="my-8 border-t border-gray-100" />
                    <div className="mt-2 mb-6">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">RSE</h4>
                    </div>
                    {renderFormFields('procedure', editingProcedure, (k) => rseFields.has(k))}
                  </>
                )}
                {editingProcedure && activeSubTab === 'publication' && renderFormFields('procedure', editingProcedure, (k) => PROCEDURE_GROUPS.publication.fields.includes(k))}
                {editingProcedure && activeSubTab === 'offres' && renderFormFields('procedure', editingProcedure, (k) => PROCEDURE_GROUPS.offres.fields.includes(k))}
                {editingProcedure && activeSubTab === 'rapport' && renderFormFields('procedure', editingProcedure, (k) => PROCEDURE_GROUPS.rapport.fields.includes(k))}
                {editingProcedure && activeSubTab === 'attribution' && renderFormFields('procedure', editingProcedure, (k) => PROCEDURE_GROUPS.attribution.fields.includes(k))}
                {activeSubTab === 'documents' && (
                  <div className="space-y-10">
                    <div className="flex flex-col items-center justify-center border-4 border-dashed rounded-[3rem] p-16 transition-all hover:border-[#004d3d]/20 hover:bg-emerald-50/10 group relative border-gray-50 bg-white">
                      <input type="file" multiple onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isUploading ? 'bg-[#004d3d] text-white animate-pulse' : 'bg-gray-50 text-gray-300 group-hover:scale-110 group-hover:bg-[#004d3d]/10 group-hover:text-[#004d3d]'}`}>{isUploading ? <svg className="w-10 h-10 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}</div>
                      <div className="mt-8 text-center">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest">{isUploading ? 'Téléchargement en cours...' : 'Déposez vos documents ici'}</p>
                        <p className="mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tous formats acceptés (PDF, Excel, Images, etc.)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {files.map((file, i) => (
                        <div key={i} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex items-center gap-5 hover:shadow-md transition-all group overflow-hidden">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-50 transition-colors overflow-hidden border border-gray-50">
                            <FileIcon fileName={file.name} publicUrl={file.publicUrl} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight" title={file.name}>{file.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{(file.metadata?.size / 1024 / 1024).toFixed(2)} Mo</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setViewingFile({ name: file.name, url: file.publicUrl })} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl hover:scale-110 transition-all shadow-sm" title="Visionner">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button onClick={() => downloadFile(file.name)} className="p-2.5 text-emerald-700 bg-emerald-50 rounded-xl hover:scale-110 transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                            <button onClick={() => deleteFile(file.name)} className="p-2.5 text-red-600 bg-red-50 rounded-xl hover:scale-110 transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </div>
                      ))}
                      {files.length === 0 && !isUploading && <div className="col-span-full py-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] italic">Aucun document rattaché</div>}
                    </div>
                  </div>
                )}
                {activeSubTab === 'procedures_liees' && editingProject && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liste des procédures rattachées à ce projet</h4><button onClick={() => { const projId = editingProject.IDProjet; const existingForProject = procedures.filter(p => String(getProp(p, 'IDProjet')) === String(projId)); let maxIdx = 0; existingForProject.forEach(p => { const num = String(getProp(p, 'NumProc')); if (num.includes('-P-')) { const parts = num.split('-P-'); const idx = parseInt(parts[parts.length - 1]); if (!isNaN(idx) && idx > maxIdx) maxIdx = idx; } }); const nextIdx = maxIdx + 1; const newProcId = `${projId}-P-${nextIdx}`; setEditingProcedure({ IDProjet: projId, Acheteur: getProp(editingProject, 'Acheteur'), "Objet court": getProp(editingProject, 'Titre_du_dossier'), NumProc: newProcId }); setEditingProject(null); setActiveSubTab('general'); }} className="px-6 py-3 bg-[#004d3d] hover:bg-[#006d57] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-colors">+ Nouvelle Procédure</button></div>
                    <div className="overflow-x-auto rounded-2xl border border-gray-50">
                      <table className="themed-table min-w-full divide-y divide-gray-50"><thead className="bg-gray-50/50"><tr><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">N° Afpa</th><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Objet court</th><th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Statut</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-gray-50">{associatedProcedures.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-xs font-bold text-gray-300 italic">Aucune procédure trouvée</td></tr> : associatedProcedures.map((proc, idx) => (<tr key={idx} className="hover:bg-gray-50/50"><td className="px-6 py-4 text-xs font-bold text-gray-600">{getProp(proc, 'Numéro de procédure (Afpa)') || '-'}</td><td className="px-6 py-4 text-xs font-bold text-gray-600">{getProp(proc, 'Objet court') || '-'}</td><td className="px-6 py-4 text-xs font-bold text-gray-600">{getProp(proc, 'Statut de la consultation') || '-'}</td><td className="px-6 py-4 text-right"><button onClick={() => { setEditingProcedure(proc); setEditingProject(null); setActiveSubTab('general'); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button></td></tr>))}</tbody></table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'an01' && (
          <div className="an01-wrapper">
            {!an01Data ? (
              <div className="h-screen w-full font-sans text-gray-900 bg-gray-100 flex flex-col">
                {an01LoadMode === 'auto' ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="surface-card p-12 rounded-[2rem] shadow-sm border border-gray-100 max-w-2xl w-full">
                      <h2 className="text-2xl font-black text-[#004d3d] mb-6">Charger l'analyse AN01</h2>
                      <p className="text-sm text-gray-600 mb-6">Saisissez le numéro de procédure Afpa pour charger automatiquement le fichier depuis la base de données.</p>
                      
                      <input
                        type="text"
                        placeholder="Numéro de procédure (Afpa)"
                        value={an01ProcedureNumber}
                        onChange={(e) => setAn01ProcedureNumber(e.target.value)}
                        className="w-full px-6 py-4 rounded-xl border border-gray-200 text-sm font-bold mb-4 focus:outline-none focus:border-[#004d3d]"
                      />
                      
                      {an01Error && (
                        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl text-sm mb-4">
                          {an01Error}
                        </div>
                      )}
                      
                      <div className="flex gap-4">
                        <button
                          onClick={() => an01ProcedureNumber && handleAn01LoadFromSupabase(an01ProcedureNumber)}
                          disabled={!an01ProcedureNumber || an01IsLoading}
                          className="flex-1 px-8 py-4 bg-[#004d3d] text-white rounded-xl font-bold text-sm hover:bg-[#006d57] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {an01IsLoading ? 'Chargement...' : 'Charger depuis la base'}
                        </button>
                        <button
                          onClick={() => setAn01LoadMode('manual')}
                          className="px-8 py-4 border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:border-gray-300 transition-colors"
                        >
                          Chargement manuel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <UploadView 
                    onFileUpload={handleAn01FileUpload} 
                    isLoading={an01IsLoading} 
                    error={an01Error}
                  />
                )}
              </div>
            ) : an01SelectedLotIndex !== null && an01Data.lots[an01SelectedLotIndex] ? (
              <div className="h-screen w-full font-sans text-gray-900 bg-gray-100 flex flex-col">
                <Dashboard 
                  data={an01Data.lots[an01SelectedLotIndex]} 
                  onReset={handleAn01Reset}
                  onBack={an01Data.lots.length > 1 ? handleAn01BackToLotSelection : undefined}
                />
              </div>
            ) : an01ViewMode === 'table' ? (
              <div className="h-screen w-full font-sans text-gray-900 bg-gray-100 flex flex-col">
                <GlobalTableView 
                  lots={an01Data.lots}
                  globalMetadata={an01Data.globalMetadata}
                  onBack={() => setAn01ViewMode('grid')}
                  onSelectLot={(index) => setAn01SelectedLotIndex(index)}
                />
              </div>
            ) : (
              <div className="h-screen w-full font-sans text-gray-900 bg-gray-100 flex flex-col">
                <LotSelectionView 
                  lots={an01Data.lots}
                  onSelectLot={setAn01SelectedLotIndex}
                  onReset={handleAn01Reset}
                  onSwitchToTable={() => setAn01ViewMode('table')}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'detail' && detailData && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#004d3d] mb-2">{detailData.title}</h2>
                  <p className="text-sm text-gray-500">{detailData.data.length} entrée(s) trouvée(s)</p>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab('dashboard');
                    setDetailData(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Retour
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              {/* Barre de défilement supérieure */}
              <div 
                className="overflow-x-auto border-b border-gray-200" 
                onScroll={(e) => {
                  const bottomScroll = document.getElementById('detail-table-bottom');
                  if (bottomScroll) bottomScroll.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
                }}
              >
                <div style={{ height: '1px', width: `${(detailData.type === 'project' ? PROJECT_FIELDS.length : DOSSIER_FIELDS.length) * 200}px` }}></div>
              </div>
              
              {/* Tableau principal */}
              <div 
                id="detail-table-bottom"
                className="overflow-x-auto"
                onScroll={(e) => {
                  const topScroll = document.querySelector('.overflow-x-auto.border-b') as HTMLDivElement;
                  if (topScroll) topScroll.scrollLeft = (e.target as HTMLDivElement).scrollLeft;
                }}
              >
                <table className="themed-table w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      {detailData.type === 'project' ? (
                        PROJECT_FIELDS.map(field => (
                          <th key={field.id} className={`px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${isNumericField(field.id) || isDateField(field.id) ? 'text-right' : 'text-left'}`}>
                            {field.label}
                          </th>
                        ))
                      ) : (
                        DOSSIER_FIELDS.map(field => (
                          <th key={field.id} className={`px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${isNumericField(field.id) || isDateField(field.id) ? 'text-right' : 'text-left'}`}>
                            {field.label}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detailData.data.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        {detailData.type === 'project' ? (
                          PROJECT_FIELDS.map(field => {
                            let displayValue;
                            if (field.id === 'NumeroAfpa5Chiffres') {
                              // Extraire les 5 premiers chiffres du numéro Afpa
                              const fullAfpa = getProp(item, 'Numéro de procédure (Afpa)');
                              if (fullAfpa) {
                                // Chercher 5 chiffres consécutifs n'importe où dans la chaîne
                                const match = String(fullAfpa).match(/\d{5}/);
                                displayValue = match ? match[0] : '-';
                              } else {
                                displayValue = '-';
                              }
                            } else if (isDateField(field.id)) {
                              displayValue = formatDisplayDate(getProp(item, field.id));
                            } else {
                              displayValue = getProp(item, field.id) || '-';
                            }
                            
                            return (
                              <td key={field.id} className={`px-6 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap ${isNumericField(field.id) || isDateField(field.id) ? 'text-right' : 'text-left'}`}>
                                {displayValue}
                              </td>
                            );
                          })
                        ) : (
                          DOSSIER_FIELDS.map(field => (
                            <td key={field.id} className={`px-6 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap ${isNumericField(field.id) || isDateField(field.id) ? 'text-right' : 'text-left'}`}>
                              {isDateField(field.id) 
                                ? formatDisplayDate(getProp(item, field.id)) 
                                : (getProp(item, field.id) || '-')}
                            </td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'commission' && (() => {
          const handleSort = (column: string) => {
            if (commissionSortColumn === column) {
              setCommissionSortDirection(commissionSortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setCommissionSortColumn(column);
              setCommissionSortDirection('asc');
            }
          };
          
          const filteredCommissionProjects = dossiers.filter(d => {
            if (d.Commission_Achat !== "Oui") return false;
            const dateVal = d["NO_-_Date_de_validation_du_document"];
            if (!dateVal || dateVal.trim() === "") {
              const statut = d.Statut_du_Dossier || '';
              return !statut.startsWith('4') && !statut.startsWith('5');
            }
            const numDate = Number(dateVal);
            return !(numDate > 0 && !isNaN(numDate));
          });
          
          const sortedProjects = [...filteredCommissionProjects].sort((a, b) => {
            if (!commissionSortColumn) return 0;
            
            let aVal = '';
            let bVal = '';
            
            switch(commissionSortColumn) {
              case 'dossier': aVal = a.IDProjet || ''; bVal = b.IDProjet || ''; break;
              case 'objet': aVal = a.Titre_du_dossier || ''; bVal = b.Titre_du_dossier || ''; break;
              case 'acheteur': aVal = a.Acheteur || ''; bVal = b.Acheteur || ''; break;
              case 'priorite': aVal = a.Priorite || ''; bVal = b.Priorite || ''; break;
              case 'montant': aVal = a["Montant_previsionnel_du_marche_(_HT)_"] || ''; bVal = b["Montant_previsionnel_du_marche_(_HT)_"] || ''; break;
              case 'date': aVal = a["NO_-_Date_previsionnelle_CA_ou_Commission"] || ''; bVal = b["NO_-_Date_previsionnelle_CA_ou_Commission"] || ''; break;
            }
            
            const comparison = String(aVal).localeCompare(String(bVal), 'fr', { numeric: true });
            return commissionSortDirection === 'asc' ? comparison : -comparison;
          });
          
          return (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="surface-card p-10 rounded-[2rem] shadow-sm border border-gray-100">
                <h2 className="text-xs font-black uppercase tracking-widest text-gray-300 mb-3">Projets à présenter</h2>
                <div className="text-5xl font-black text-[#004d3d]">
                  {filteredCommissionProjects.length}
                </div>
              </div>
            </div>

            <div className="surface-card overflow-hidden rounded-[2rem] shadow-sm border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-8 py-6 text-left text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-[#004d3d] transition-colors" onClick={() => handleSort('dossier')}>
                        Dossier {commissionSortColumn === 'dossier' && (commissionSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-6 text-left text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-[#004d3d] transition-colors" onClick={() => handleSort('objet')}>
                        Objet {commissionSortColumn === 'objet' && (commissionSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-6 text-left text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-[#004d3d] transition-colors" onClick={() => handleSort('acheteur')}>
                        Acheteur {commissionSortColumn === 'acheteur' && (commissionSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-6 text-left text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-[#004d3d] transition-colors" onClick={() => handleSort('priorite')}>
                        Priorité {commissionSortColumn === 'priorite' && (commissionSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-6 text-right text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-[#004d3d] transition-colors" onClick={() => handleSort('montant')}>
                        Montant prévu {commissionSortColumn === 'montant' && (commissionSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-8 py-6 text-right text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-[#004d3d] transition-colors" onClick={() => handleSort('date')}>
                        Date limite validation {commissionSortColumn === 'date' && (commissionSortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.map((d, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-emerald-50/30 transition-colors cursor-pointer" onClick={() => setEditingProject(d)}>
                          <td className="px-8 py-6 text-sm font-black text-[#004d3d]">{d.IDProjet}</td>
                          <td className="px-8 py-6 text-sm text-gray-700">{d.Titre_du_dossier}</td>
                          <td className="px-8 py-6 text-sm text-gray-600">{d.Acheteur}</td>
                          <td className="px-8 py-6 text-sm">
                            <span className={`inline-block px-4 py-2 rounded-full text-xs font-black ${
                              d.Priorite === "Haute" 
                                ? "bg-red-50 text-red-700" 
                                : d.Priorite === "Moyenne" 
                                ? "bg-yellow-50 text-yellow-700" 
                                : "bg-green-50 text-green-700"
                            }`}>
                              {d.Priorite || "Non définie"}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-600 font-bold text-right">
                            {(() => {
                              const montant = d["Montant_previsionnel_du_marche_(_HT)_"];
                              if (!montant) return "—";
                              const num = parseFloat(String(montant).replace(/[^\d.]/g, ''));
                              if (isNaN(num)) return montant;
                              return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(num);
                            })()}
                          </td>
                          <td className="px-8 py-6 text-sm text-gray-600 text-right">
                            {(() => {
                              const dateStr = d["NO_-_Date_previsionnelle_CA_ou_Commission"];
                              if (!dateStr) return "—";
                              const num = Number(dateStr);
                              if (!isNaN(num) && num > 0) {
                                const date = new Date((num - 25569) * 86400 * 1000);
                                return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                              }
                              return dateStr;
                            })()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          );
        })()}
      </main>
    </div>
  );
};

export default App;
