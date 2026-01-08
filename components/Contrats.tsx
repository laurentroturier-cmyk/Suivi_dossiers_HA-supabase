import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  PieChart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Loader2,
  Upload,
  Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Contrat, ContratsStats, ContratsFilters } from '../types/contrats';
import * as XLSX from 'xlsx';

// Helper function to format numbers with French conventions
const formatNumberFR = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num).replace(/\s/g, '\u202F');
};

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const formatPercent = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(num / 100);
};

const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateStr);
};

const formatDisplayDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR');
};

// Calcul du pourcentage de temps écoulé
const calculateTempsConsomme = (dateDebut: string | null, dateFin: string | null): number | null => {
  if (!dateDebut || !dateFin) return null;
  
  const debut = parseDate(dateDebut);
  const fin = parseDate(dateFin);
  
  if (!debut || !fin || isNaN(debut.getTime()) || isNaN(fin.getTime())) return null;
  
  const now = new Date();
  const totalDuration = fin.getTime() - debut.getTime();
  
  if (totalDuration <= 0) return null;
  
  const elapsed = now.getTime() - debut.getTime();
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return (elapsed / totalDuration) * 100;
};

// KPI Tile Component
const KPITile: React.FC<{ 
  label: string; 
  value: string | number; 
  unit?: string; 
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, unit, icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="p-4">
      <div className="flex justify-center mb-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.08em] mb-1 text-center">
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1">
        <p className="text-xl font-bold text-gray-900 tabular-nums">
          {value}
        </p>
        {unit && (
          <p className="text-sm font-normal text-gray-500">
            {unit}
          </p>
        )}
      </div>
    </div>
  </div>
);

// Bar Chart Component
const SimpleBarChart: React.FC<{ 
  data: Record<string, number>; 
  title: string; 
  color: string;
  maxItems?: number;
  onClick?: (label: string) => void;
}> = ({ data, title, color, maxItems = 8, onClick }) => {
  const entries = Object.entries(data)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, maxItems);
  const maxVal = Math.max(...entries.map(e => e[1] as number), 1);
  
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4">{title}</h4>
      <div className="flex-1 space-y-3">
        {entries.map(([label, val]) => (
          <div 
            key={label} 
            className={`space-y-1 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => onClick?.(label)}
          >
            <div className="flex justify-between text-[11px] font-bold text-gray-700">
              <span className="truncate pr-4 max-w-[150px]" title={label}>{label || 'N/C'}</span>
              <span className="tabular-nums">{typeof val === 'number' ? formatNumberFR(val) : val}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${color}`} 
                style={{ width: `${((val as number) / maxVal) * 100}%` }} 
              />
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">Aucune donnée</div>
        )}
      </div>
    </div>
  );
};

// Donut Chart Component
const DonutChart: React.FC<{ 
  data: Record<string, number>; 
  title: string;
  colors: string[];
  onClick?: (label: string) => void;
}> = ({ data, title, colors, onClick }) => {
  const entries = Object.entries(data)
    .filter(([, val]) => (val as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  const total = entries.reduce((sum, [, val]) => sum + (val as number), 0);
  
  let currentAngle = 0;
  const segments = entries.map(([label, val], index) => {
    const angle = ((val as number) / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { label, val, angle, startAngle, color: colors[index % colors.length] };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">{title}</h4>
      <div className="flex flex-col items-center gap-4 flex-1">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={describeArc(50, 50, 38, seg.startAngle, seg.startAngle + seg.angle - 0.5)}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                className={`transition-all duration-500 ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => onClick?.(seg.label)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800">{formatNumberFR(total)}</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="w-full grid grid-cols-2 gap-x-3 gap-y-1.5">
          {segments.map((seg, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-1.5 min-w-0 ${onClick ? 'cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1' : ''}`}
              onClick={() => onClick?.(seg.label)}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[11px] text-gray-700 truncate" title={seg.label}>{seg.label}</span>
              <span className="text-[11px] font-bold text-gray-900 ml-auto tabular-nums">{formatNumberFR(seg.val as number)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Modal de visualisation d'un contrat
const ContratDetailModal: React.FC<{
  contrat: Contrat;
  onClose: () => void;
}> = ({ contrat, onClose }) => {
  const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-400">-</span>}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#005c4d] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Contrat {contrat.agreement_number}</h2>
            <p className="text-sm text-white/70">{contrat.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
            {/* Informations générales */}
            <div>
              <h3 className="text-xs font-bold text-[#005c4d] uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Informations générales
              </h3>
              <DetailRow label="N° Contrat" value={contrat.agreement_number} />
              <DetailRow label="Description" value={contrat.description} />
              <DetailRow label="Statut" value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  contrat.agreement_status_meaning === 'Open' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {contrat.agreement_status_meaning}
                </span>
              } />
              <DetailRow label="Client Interne" value={contrat.client_interne} />
              <DetailRow label="N° Procédure" value={contrat.numero_procedure} />
              <DetailRow label="N° Lot" value={contrat.numero_lot} />
              <DetailRow label="N° Rang" value={contrat.numero_rang} />
            </div>

            {/* Montants */}
            <div>
              <h3 className="text-xs font-bold text-[#005c4d] uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Montants
              </h3>
              <DetailRow label="Montant Limite (Agreement Limit)" value={
                contrat.agreement_limit ? formatCurrency(contrat.agreement_limit) : null
              } />
              <DetailRow label="Montant du Marché" value={
                contrat.montant_marche ? formatCurrency(contrat.montant_marche) : null
              } />
              <DetailRow label="Montant Consommé" value={
                contrat.blanket_header_released_amount ? formatCurrency(contrat.blanket_header_released_amount) : null
              } />
              <DetailRow label="% Consommé" value={
                (contrat.blanket_header_released_amount !== null && contrat.agreement_limit)
                  ? (
                    (() => {
                      const percent = (contrat.blanket_header_released_amount / contrat.agreement_limit) * 100;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                percent >= 90 ? 'bg-red-500' :
                                percent >= 70 ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <span className="font-bold">{percent.toFixed(1)}%</span>
                        </div>
                      );
                    })()
                  ) : null
              } />
              <DetailRow label="% Temps écoulé" value={
                (() => {
                  const tempsConsomme = calculateTempsConsomme(contrat.date_debut, contrat.date_fin);
                  return tempsConsomme !== null ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            tempsConsomme >= 90 ? 'bg-red-500' :
                            tempsConsomme >= 70 ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(tempsConsomme, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold">{tempsConsomme.toFixed(1)}%</span>
                    </div>
                  ) : null;
                })()
              } />
              <DetailRow label="Taux de Performance" value={
                contrat.taux_performance !== null ? `${contrat.taux_performance.toFixed(1)}%` : null
              } />
              <DetailRow label="Nombre de lignes catalogue" value={contrat.nombre_lignes_catalogue} />
            </div>

            {/* Dates & Fournisseur */}
            <div>
              <h3 className="text-xs font-bold text-[#005c4d] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Dates
              </h3>
              <DetailRow label="Date de Notification" value={formatDisplayDate(contrat.date_notification)} />
              <DetailRow label="Date de Début" value={formatDisplayDate(contrat.date_debut)} />
              <DetailRow label="Date de Fin" value={formatDisplayDate(contrat.date_fin)} />

              <h3 className="text-xs font-bold text-[#005c4d] uppercase tracking-wider mb-4 mt-6 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Fournisseur
              </h3>
              <DetailRow label="Nom du Fournisseur" value={contrat.supplier} />
              <DetailRow label="N° Fournisseur" value={contrat.supplier_number} />
              <DetailRow label="N° D-U-N-S" value={contrat.duns_number} />
              <DetailRow label="Site" value={contrat.site} />
              <DetailRow label="Acheteur" value={contrat.full_name} />
              <DetailRow label="Nom Signataire (fournisseur)" value={contrat.nom_signataire} />
              <DetailRow label="Email Signataire (fournisseur)" value={
                contrat.mail_signataire ? (
                  <a href={`mailto:${contrat.mail_signataire}`} className="text-[#005c4d] hover:underline">
                    {contrat.mail_signataire}
                  </a>
                ) : null
              } />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

const Contrats: React.FC = () => {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'supabase' | 'csv'>('supabase');
  
  // Filters
  const [filters, setFilters] = useState<ContratsFilters>({
    search: '',
    status: '',
    supplier: '',
    clientInterne: '',
    acheteur: '',
    anneeDebut: '',
    anneeFin: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('agreement_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedContrat, setSelectedContrat] = useState<Contrat | null>(null);

  // Handler to open contract detail
  const handleOpenContrat = (contrat: Contrat) => {
    setSelectedContrat(contrat);
  };

  // Parse CSV/Excel file
  const parseContratFile = (file: File): Promise<Contrat[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary', codepage: 65001 });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          console.log('Colonnes du fichier:', jsonData.length > 0 ? Object.keys(jsonData[0]) : 'Aucune donnée');
          console.log('Première ligne:', jsonData[0]);
          
          // Helper function to find column value with multiple possible names
          const getCol = (row: any, ...names: string[]) => {
            for (const name of names) {
              if (row[name] !== undefined) return row[name];
            }
            // Recherche floue pour les colonnes avec encodage différent
            const keys = Object.keys(row);
            for (const name of names) {
              const found = keys.find(k => 
                k.toLowerCase().replace(/[^a-z0-9]/g, '').includes(name.toLowerCase().replace(/[^a-z0-9]/g, ''))
              );
              if (found) return row[found];
            }
            return null;
          };
          
          const mappedData: Contrat[] = jsonData.map((row: any) => ({
            agreement_number: getCol(row, 'Agreement Number') || '',
            description: getCol(row, 'Description') || '',
            agreement_status_meaning: getCol(row, 'Agreement Status Meaning') || '',
            agreement_limit: parseFloat(getCol(row, 'Agreement Limit')) || null,
            montant_marche: parseFloat(getCol(row, 'Montant du marché', 'Montant du march')) || null,
            blanket_header_released_amount: parseFloat(getCol(row, 'Blanket Header Released Amount (Transaction Currency)', 'Blanket Header Released Amount')) || null,
            date_notification: getCol(row, 'Date notification') || null,
            date_debut: getCol(row, 'Date de début', 'Date de dbut', 'Date de d') || null,
            date_fin: getCol(row, 'Date de fin') || null,
            pourcentage_consomme: (() => {
              const val = parseFloat(String(getCol(row, '% consommé', '% consomm', 'consomm') || '').replace(',', '.').replace('%', ''));
              if (isNaN(val)) return null;
              if (val > 0 && val <= 1) return val * 100;
              return val;
            })(),
            nombre_lignes_catalogue: parseInt(getCol(row, 'Nombre de lignes de catalogue')) || null,
            client_interne: getCol(row, 'Client Interne') || null,
            supplier: getCol(row, 'Supplier') || '',
            supplier_number: getCol(row, 'Supplier Number') || null,
            duns_number: getCol(row, 'D-U-N-S Number', 'DUNS Number') || null,
            site: getCol(row, 'Site') || null,
            full_name: getCol(row, 'Full Name') || null,
            mail_signataire: getCol(row, 'Mail du signataire (fournisseur)', 'Mail du signataire') || null,
            nom_signataire: getCol(row, 'Nom du signataire (fournisseur)', 'Nom du signataire') || null,
            numero_lot: getCol(row, 'N° du lot', 'N du lot', 'No du lot') || null,
            numero_rang: getCol(row, 'N° du rang', 'N du rang', 'No du rang') || null,
            numero_procedure: getCol(row, 'n° Procédure', 'n Procdure', 'Procedure', 'n° Procedure') || null,
            taux_performance: parseFloat(String(getCol(row, 'Taux de performance (en %)', 'Taux de performance') || '').replace(',', '.')) || null,
          }));
          
          console.log('Données mappées:', mappedData.length, 'lignes');
          console.log('Premier contrat:', mappedData[0]);
          
          resolve(mappedData);
        } catch (err) {
          console.error('Erreur parsing:', err);
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsBinaryString(file);
    });
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await parseContratFile(file);
      setContrats(data);
      setDataSource('csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du fichier');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data from Supabase
  const fetchContrats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching from Supabase TBL_Contrats...');
      
      // Récupérer toutes les données avec pagination (Supabase limite à 1000 par défaut)
      let allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('TBL_Contrats')
          .select('*')
          .range(from, from + pageSize - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += pageSize;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }
      
      console.log('Total lignes récupérées:', allData.length);
      if (allData.length > 0) {
        console.log('Colonnes disponibles:', Object.keys(allData[0]));
      }
      
      // Map the data to our interface
      const mappedData: Contrat[] = allData.map((row: any) => ({
        agreement_number: row['Agreement Number'] || row.agreement_number || '',
        description: row['Description'] || row.description || '',
        agreement_status_meaning: row['Agreement Status Meaning'] || row.agreement_status_meaning || '',
        agreement_limit: parseFloat(row['Agreement Limit']) || null,
        montant_marche: parseFloat(row['Montant du marché']) || null,
        blanket_header_released_amount: parseFloat(row['Blanket Header Released Amount (Transaction Currency)']) || null,
        date_notification: row['Date notification'] || row.date_notification || null,
        date_debut: row['Date de début'] || row.date_debut || null,
        date_fin: row['Date de fin'] || row.date_fin || null,
        pourcentage_consomme: (() => {
          const val = parseFloat(String(row['% consommé'] || '').replace(',', '.').replace('%', ''));
          if (isNaN(val)) return null;
          if (val > 0 && val <= 1) return val * 100;
          return val;
        })(),
        nombre_lignes_catalogue: parseInt(row['Nombre de lignes de catalogue']) || null,
        client_interne: row['Client Interne'] || row.client_interne || null,
        supplier: row['Supplier'] || row.supplier || '',
        supplier_number: row['Supplier Number'] || row.supplier_number || null,
        duns_number: row['D-U-N-S Number'] || row.duns_number || null,
        site: row['Site'] || row.site || null,
        full_name: row['Full Name'] || row.full_name || null,
        mail_signataire: row['Mail du signataire (fournisseur)'] || row.mail_signataire || null,
        nom_signataire: row['Nom du signataire (fournisseur)'] || row.nom_signataire || null,
        numero_lot: row['N° du lot'] || row.numero_lot || null,
        numero_rang: row['N° du rang'] || row.numero_rang || null,
        numero_procedure: row['n° Procédure'] || row.numero_procedure || null,
        taux_performance: parseFloat(String(row['Taux de performance (en %)'] || '').replace(',', '.')) || null,
      }));
      
      setContrats(mappedData);
    } catch (err) {
      console.error('Error fetching contrats:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des contrats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContrats();
  }, []);

  // Extract unique values for filters
  const uniqueStatuses = useMemo(() => 
    [...new Set(contrats.map(c => c.agreement_status_meaning).filter(Boolean))].sort(),
  [contrats]);
  
  const uniqueSuppliers = useMemo(() => 
    [...new Set(contrats.map(c => c.supplier).filter(Boolean))].sort(),
  [contrats]);
  
  const uniqueClientsInternes = useMemo(() => 
    [...new Set(contrats.map(c => c.client_interne).filter(Boolean))].sort() as string[],
  [contrats]);
  
  const uniqueAcheteurs = useMemo(() => 
    [...new Set(contrats.map(c => c.full_name).filter(Boolean))].sort() as string[],
  [contrats]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    contrats.forEach(c => {
      if (c.date_debut) {
        const date = parseDate(c.date_debut);
        if (date) years.add(date.getFullYear().toString());
      }
    });
    return [...years].sort().reverse();
  }, [contrats]);

  // Filtered and sorted data
  const filteredContrats = useMemo(() => {
    return contrats.filter(c => {
      const matchSearch = !filters.search || 
        c.agreement_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        c.supplier.toLowerCase().includes(filters.search.toLowerCase()) ||
        (c.full_name || '').toLowerCase().includes(filters.search.toLowerCase());
      
      const matchStatus = !filters.status || c.agreement_status_meaning === filters.status;
      const matchSupplier = !filters.supplier || c.supplier === filters.supplier;
      const matchClient = !filters.clientInterne || c.client_interne === filters.clientInterne;
      const matchAcheteur = !filters.acheteur || 
        (c.full_name || '').trim().toLowerCase() === filters.acheteur.trim().toLowerCase();
      
      let matchAnnee = true;
      if (filters.anneeDebut || filters.anneeFin) {
        const dateDebut = parseDate(c.date_debut);
        if (dateDebut) {
          const year = dateDebut.getFullYear();
          if (filters.anneeDebut && year < parseInt(filters.anneeDebut)) matchAnnee = false;
          if (filters.anneeFin && year > parseInt(filters.anneeFin)) matchAnnee = false;
        } else {
          matchAnnee = false;
        }
      }
      
      return matchSearch && matchStatus && matchSupplier && matchClient && matchAcheteur && matchAnnee;
    });
  }, [contrats, filters]);

  const sortedContrats = useMemo(() => {
    return [...filteredContrats].sort((a, b) => {
      const aVal = (a as any)[sortColumn];
      const bVal = (b as any)[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal)
        : aVal - bVal;
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredContrats, sortColumn, sortDirection]);

  // Statistics
  const stats: ContratsStats = useMemo(() => {
    const montantTotal = filteredContrats.reduce((sum, c) => sum + (c.agreement_limit || 0), 0);
    const montantConsomme = filteredContrats.reduce((sum, c) => sum + (c.blanket_header_released_amount || 0), 0);
    
    return {
      totalContrats: filteredContrats.length,
      montantTotal,
      montantConsomme,
      contratsouverts: filteredContrats.filter(c => c.agreement_status_meaning === 'Open').length,
      contratsTermines: filteredContrats.filter(c => c.agreement_status_meaning !== 'Open').length,
      tauxConsommationMoyen: montantTotal > 0 
        ? (montantConsomme / montantTotal) * 100
        : 0,
      nombreFournisseurs: new Set(filteredContrats.map(c => c.supplier)).size,
    };
  }, [filteredContrats]);

  // Charts data
  const chartDataBySupplier = useMemo(() => {
    const data: Record<string, number> = {};
    filteredContrats.forEach(c => {
      const supplier = c.supplier || 'N/C';
      data[supplier] = (data[supplier] || 0) + (c.agreement_limit || 0);
    });
    return data;
  }, [filteredContrats]);

  const chartDataByStatus = useMemo(() => {
    const data: Record<string, number> = {};
    filteredContrats.forEach(c => {
      const status = c.agreement_status_meaning || 'N/C';
      data[status] = (data[status] || 0) + 1;
    });
    return data;
  }, [filteredContrats]);

  const chartDataByYear = useMemo(() => {
    const data: Record<string, number> = {};
    filteredContrats.forEach(c => {
      if (c.date_debut) {
        const date = parseDate(c.date_debut);
        if (date) {
          const year = date.getFullYear().toString();
          data[year] = (data[year] || 0) + 1;
        }
      }
    });
    return data;
  }, [filteredContrats]);

  const chartDataByAcheteur = useMemo(() => {
    const data: Record<string, number> = {};
    filteredContrats.forEach(c => {
      const name = c.full_name || 'N/C';
      data[name] = (data[name] || 0) + 1;
    });
    return data;
  }, [filteredContrats]);

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = sortedContrats.map(c => ({
      'N° Contrat': c.agreement_number,
      'Description': c.description,
      'Statut': c.agreement_status_meaning,
      'Montant Limite': c.agreement_limit,
      'Montant Marché': c.montant_marche,
      'Montant Consommé': c.blanket_header_released_amount,
      '% Consommé': c.pourcentage_consomme,
      '% Temps': calculateTempsConsomme(c.date_debut, c.date_fin),
      'Date Notification': c.date_notification,
      'Date Début': c.date_debut,
      'Date Fin': c.date_fin,
      'Fournisseur': c.supplier,
      'Client Interne': c.client_interne,
      'Acheteur': c.full_name,
      'N° Procédure': c.numero_procedure,
      'N° Lot': c.numero_lot,
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contrats');
    XLSX.writeFile(wb, `contrats_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      supplier: '',
      clientInterne: '',
      acheteur: '',
      anneeDebut: '',
      anneeFin: ''
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.supplier || filters.clientInterne || filters.acheteur || filters.anneeDebut || filters.anneeFin;

  // Si aucune donnée n'est chargée (ni Supabase, ni fichier)
  if (!loading && contrats.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#005c4d] rounded-full mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Contrats
              </h1>
              <p className="text-gray-600 mb-2">
                Aucune donnée trouvée dans Supabase (table TBL_Contrats vide).
              </p>
              <p className="text-gray-500 mb-8">
                Chargez un fichier CSV ou Excel pour visualiser les contrats.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <label className="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors cursor-pointer shadow-lg hover:shadow-xl">
                  <Upload className="w-5 h-5" />
                  Charger un fichier CSV / Excel
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={fetchContrats}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Actualiser Supabase
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#005c4d] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des contrats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <X className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchContrats}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#005c4d] text-white rounded-xl font-medium hover:bg-[#004a3d] transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-8 py-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#005c4d] rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contrats</h1>
                <p className="text-sm text-gray-500">
                  Gestion des contrats et marchés
                  {dataSource === 'csv' && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Fichier local</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Charger CSV
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={fetchContrats}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Recharger depuis Supabase"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d] transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <KPITile 
            label="Total Contrats" 
            value={formatNumberFR(stats.totalContrats)}
            icon={<FileText className="w-5 h-5 text-white" />}
            color="bg-blue-500"
          />
          <KPITile 
            label="Contrats Ouverts" 
            value={formatNumberFR(stats.contratsouverts)}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            color="bg-green-500"
          />
          <KPITile 
            label="Contrats Terminés" 
            value={formatNumberFR(stats.contratsTermines)}
            icon={<Calendar className="w-5 h-5 text-white" />}
            color="bg-gray-500"
          />
          <KPITile 
            label="Montant Total" 
            value={formatCurrency(stats.montantTotal)}
            icon={<DollarSign className="w-5 h-5 text-white" />}
            color="bg-purple-500"
          />
          <KPITile 
            label="Montant Consommé" 
            value={formatCurrency(stats.montantConsomme)}
            icon={<DollarSign className="w-5 h-5 text-white" />}
            color="bg-orange-500"
          />
          <KPITile 
            label="Taux Conso. Moyen" 
            value={formatPercent(stats.tauxConsommationMoyen)}
            icon={<PieChart className="w-5 h-5 text-white" />}
            color="bg-teal-500"
          />
          <KPITile 
            label="Fournisseurs" 
            value={formatNumberFR(stats.nombreFournisseurs)}
            icon={<Users className="w-5 h-5 text-white" />}
            color="bg-indigo-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <SimpleBarChart 
            data={chartDataBySupplier} 
            title="Montant par Fournisseur (Top 8)"
            color="bg-[#005c4d]"
            onClick={(supplier) => setFilters(f => ({ ...f, supplier }))}
          />
          <DonutChart 
            data={chartDataByStatus} 
            title="Répartition par Statut"
            colors={['#10b981', '#6b7280', '#f59e0b', '#ef4444', '#14b8a6', '#64748b', '#eab308', '#f97316']}
            onClick={(status) => setFilters(f => ({ ...f, status }))}
          />
          <SimpleBarChart 
            data={chartDataByYear} 
            title="Contrats par Années d'Échéance"
            color="bg-[#005c4d]"
            onClick={(year) => setFilters(f => ({ ...f, anneeDebut: year, anneeFin: year }))}
          />
          <SimpleBarChart 
            data={chartDataByAcheteur} 
            title="Par Acheteur (Top 8)"
            color="bg-purple-500"
            onClick={(acheteur) => setFilters(f => ({ ...f, acheteur }))}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par n° contrat, description, fournisseur..."
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005c4d] focus:border-transparent text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  showFilters || hasActiveFilters 
                    ? 'bg-[#005c4d] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {hasActiveFilters && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-white text-[#005c4d] text-xs flex items-center justify-center font-bold">
                    {[filters.status, filters.supplier, filters.clientInterne, filters.anneeDebut, filters.anneeFin].filter(Boolean).length}
                  </span>
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
                  >
                    <option value="">Tous les statuts</option>
                    {uniqueStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fournisseur</label>
                  <select
                    value={filters.supplier}
                    onChange={(e) => setFilters(f => ({ ...f, supplier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
                  >
                    <option value="">Tous les fournisseurs</option>
                    {uniqueSuppliers.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Acheteur</label>
                  <select
                    value={filters.acheteur}
                    onChange={(e) => setFilters(f => ({ ...f, acheteur: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
                  >
                    <option value="">Tous les acheteurs</option>
                    {uniqueAcheteurs.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Client Interne</label>
                  <select
                    value={filters.clientInterne}
                    onChange={(e) => setFilters(f => ({ ...f, clientInterne: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
                  >
                    <option value="">Tous les clients</option>
                    {uniqueClientsInternes.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Année début (min)</label>
                  <select
                    value={filters.anneeDebut}
                    onChange={(e) => setFilters(f => ({ ...f, anneeDebut: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
                  >
                    <option value="">Toutes</option>
                    {uniqueYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Année début (max)</label>
                  <select
                    value={filters.anneeFin}
                    onChange={(e) => setFilters(f => ({ ...f, anneeFin: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
                  >
                    <option value="">Toutes</option>
                    {uniqueYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{formatNumberFR(sortedContrats.length)}</span> contrat(s) trouvé(s)
            {hasActiveFilters && ` (sur ${formatNumberFR(contrats.length)} au total)`}
          </p>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Barre de défilement en haut */}
          <div className="overflow-x-auto border-b border-gray-200" style={{ overflowY: 'hidden' }} onScroll={(e) => {
            const target = e.target as HTMLElement;
            const tableContainer = target.parentElement?.querySelector('.table-scroll-container') as HTMLElement;
            if (tableContainer) tableContainer.scrollLeft = target.scrollLeft;
          }}>
            <div style={{ width: '2000px', height: '1px' }}></div>
          </div>
          
          {/* Tableau avec scroll */}
          <div className="overflow-x-auto table-scroll-container" onScroll={(e) => {
            const target = e.target as HTMLElement;
            const topScroll = target.parentElement?.querySelector('.overflow-x-auto') as HTMLElement;
            if (topScroll && topScroll !== target) topScroll.scrollLeft = target.scrollLeft;
          }}>
            <table className="w-full text-sm min-w-[2000px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider w-16">Actions</th>
                  {[
                    { key: 'agreement_number', label: 'N° Contrat' },
                    { key: 'description', label: 'Description' },
                    { key: 'agreement_status_meaning', label: 'Statut' },
                    { key: 'supplier', label: 'Fournisseur' },
                    { key: 'agreement_limit', label: 'Montant Limite' },
                    { key: 'blanket_header_released_amount', label: 'Consommé' },
                    { key: 'pourcentage_consomme', label: '% Conso' },
                    { key: 'pourcentage_temps', label: '% Temps' },
                    { key: 'date_debut', label: 'Date Début' },
                    { key: 'date_fin', label: 'Date Fin' },
                    { key: 'full_name', label: 'Acheteur' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortColumn === col.key && (
                          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedContrats.slice(0, 100).map((contrat, index) => (
                  <tr key={contrat.agreement_number || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleOpenContrat(contrat)}
                        className="inline-flex items-center justify-center w-7 h-7 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d] transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold text-[#005c4d]">{contrat.agreement_number}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-700 max-w-[300px] truncate block" title={contrat.description}>
                        {contrat.description}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                        contrat.agreement_status_meaning === 'Open' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {contrat.agreement_status_meaning || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-700 max-w-[200px] truncate block" title={contrat.supplier}>
                        {contrat.supplier}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-medium text-gray-900">
                        {contrat.agreement_limit ? formatCurrency(contrat.agreement_limit) : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-xs font-medium text-gray-900">
                        {contrat.blanket_header_released_amount ? formatCurrency(contrat.blanket_header_released_amount) : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {(contrat.blanket_header_released_amount !== null && contrat.agreement_limit) ? (
                        (() => {
                          const percent = (contrat.blanket_header_released_amount / contrat.agreement_limit) * 100;
                          return (
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    percent >= 90 ? 'bg-red-500' :
                                    percent >= 70 ? 'bg-orange-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-12 text-right">
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {(() => {
                        const tempsConsomme = calculateTempsConsomme(contrat.date_debut, contrat.date_fin);
                        return tempsConsomme !== null ? (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  tempsConsomme >= 90 ? 'bg-red-500' :
                                  tempsConsomme >= 70 ? 'bg-orange-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(tempsConsomme, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 w-12 text-right">
                              {tempsConsomme.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {formatDisplayDate(contrat.date_debut)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {formatDisplayDate(contrat.date_fin)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-700 max-w-[150px] truncate block" title={contrat.full_name || ''}>
                        {contrat.full_name || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sortedContrats.length > 100 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Affichage limité aux 100 premiers résultats. Utilisez les filtres pour affiner la recherche.
              </p>
            </div>
          )}
          
          {sortedContrats.length === 0 && (
            <div className="px-4 py-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun contrat ne correspond aux critères de recherche.</p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="mt-4 text-sm text-[#005c4d] hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de détail */}
      {selectedContrat && (
        <ContratDetailModal
          contrat={selectedContrat}
          onClose={() => setSelectedContrat(null)}
        />
      )}
    </div>
  );
};

export default Contrats;
