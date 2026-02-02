import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Database, 
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  RefreshCw,
  Filter,
  Search,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { UserProfile } from '../../../types/auth';

interface GestionCentresProps {
  profile: UserProfile;
}

interface CentreData {
  id: string;
  region: string;
  centre: string;
  annee: number;
  nombre_repas: number | null;
  dont_repas_stagiaires: number | null;
  dont_repas_salaries: number | null;
  autres_repas: number | null;
  produits_activites: number | null;
  dont_collectivites_territoriales: number | null;
  charges_directes: number | null;
  dont_energie_fluides: number | null;
  dont_charges_personnel: number | null;
  marge_couts_directs_ebe: number | null;
  dotations_amortissements: number | null;
  charges_structures: number | null;
  total_charges: number | null;
  marge_couts_complets: number | null;
  prestataire: string | null;
  fichier_source: string | null;
  uploaded_at: string;
}

interface ImportHistory {
  id: string;
  nom_fichier: string;
  region: string;
  nombre_onglets: number;
  nombre_lignes_importees: number;
  statut: string;
  message_erreur: string | null;
  uploaded_at: string;
}

interface RegionStats {
  region: string;
  nombre_centres: number;
  nombre_annees: number;
  total_repas: number;
  total_produits: number;
  derniere_maj: string;
}

interface TotalAnnuel {
  annee: number;
  nombre_centres: number;
  nombre_regions: number;
  total_repas: number;
  total_repas_stagiaires: number;
  total_repas_salaries: number;
  total_autres_repas: number;
  total_produits_activites: number;
  total_collectivites_territoriales: number;
  total_charges_directes: number;
  total_energie_fluides: number;
  total_charges_personnel: number;
  total_marge_ebe: number;
  total_dotations_amortissements: number;
  total_charges_structures: number;
  total_charges: number;
  total_marge_complets: number;
}

export default function GestionCentres({ profile }: GestionCentresProps) {
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [centresData, setCentresData] = useState<CentreData[]>([]);
  const [filteredData, setFilteredData] = useState<CentreData[]>([]);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [totauxAnnuels, setTotauxAnnuels] = useState<TotalAnnuel[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filterRegion, setFilterRegion] = useState<string>('');
  const [filterCentre, setFilterCentre] = useState<string>('');
  const [filterAnnee, setFilterAnnee] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [totauxFilterRegion, setTotauxFilterRegion] = useState<string>('');
  const [totauxFilterCentre, setTotauxFilterCentre] = useState<string>('');
  const [activeView, setActiveView] = useState<'upload' | 'data' | 'stats' | 'history' | 'totaux'>('upload');

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [centresData, filterRegion, filterCentre, filterAnnee, searchTerm]);

  useEffect(() => {
    if (activeView === 'totaux') {
      fetchTotauxAnnuels(totauxFilterRegion, totauxFilterCentre);
    }
  }, [totauxFilterRegion, totauxFilterCentre, activeView]);

  // Fonction pour filtrer les totaux côté client si nécessaire
  const getFilteredTotaux = () => {
    if (!totauxFilterRegion && !totauxFilterCentre) {
      return totauxAnnuels;
    }

    // Si on a des filtres mais que la fonction SQL n'a pas pu les appliquer,
    // on va recalculer côté client depuis centresData
    if (totauxAnnuels.length > 0 && (totauxFilterRegion || totauxFilterCentre)) {
      // Filtrer les données brutes
      let filtered = centresData;
      if (totauxFilterRegion) {
        filtered = filtered.filter(d => d.region === totauxFilterRegion);
      }
      if (totauxFilterCentre) {
        filtered = filtered.filter(d => d.centre === totauxFilterCentre);
      }

      // Agréger par année
      const byYear = filtered.reduce((acc, row) => {
        const key = row.annee;
        if (!acc[key]) {
          acc[key] = {
            annee: row.annee,
            centres: new Set(),
            regions: new Set(),
            total_repas: 0,
            total_repas_stagiaires: 0,
            total_repas_salaries: 0,
            total_autres_repas: 0,
            total_produits_activites: 0,
            total_collectivites_territoriales: 0,
            total_charges_directes: 0,
            total_energie_fluides: 0,
            total_charges_personnel: 0,
            total_marge_ebe: 0,
            total_dotations_amortissements: 0,
            total_charges_structures: 0,
            total_charges: 0,
            total_marge_complets: 0
          };
        }
        
        acc[key].centres.add(row.centre);
        acc[key].regions.add(row.region);
        acc[key].total_repas += row.nombre_repas || 0;
        acc[key].total_repas_stagiaires += row.dont_repas_stagiaires || 0;
        acc[key].total_repas_salaries += row.dont_repas_salaries || 0;
        acc[key].total_autres_repas += row.autres_repas || 0;
        acc[key].total_produits_activites += row.produits_activites || 0;
        acc[key].total_collectivites_territoriales += row.dont_collectivites_territoriales || 0;
        acc[key].total_charges_directes += row.charges_directes || 0;
        acc[key].total_energie_fluides += row.dont_energie_fluides || 0;
        acc[key].total_charges_personnel += row.dont_charges_personnel || 0;
        acc[key].total_marge_ebe += row.marge_couts_directs_ebe || 0;
        acc[key].total_dotations_amortissements += row.dotations_amortissements || 0;
        acc[key].total_charges_structures += row.charges_structures || 0;
        acc[key].total_charges += row.total_charges || 0;
        acc[key].total_marge_complets += row.marge_couts_complets || 0;
        
        return acc;
      }, {} as Record<number, any>);

      return Object.values(byYear).map(item => ({
        ...item,
        nombre_centres: item.centres.size,
        nombre_regions: item.regions.size
      })).sort((a, b) => a.annee - b.annee);
    }

    return totauxAnnuels;
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchCentresData(),
      fetchImportHistory(),
      fetchRegionStats(),
      fetchTotauxAnnuels('', '')
    ]);
  };

  const fetchCentresData = async () => {
    try {
      const { data, error } = await supabase
        .from('centres_donnees_financieres')
        .select('*')
        .order('region', { ascending: true })
        .order('centre', { ascending: true })
        .order('annee', { ascending: true });

      if (error) throw error;
      setCentresData(data || []);
    } catch (err: any) {
      console.error('Erreur chargement données:', err);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('imports_fichiers_centres')
        .select('*')
        .order('uploaded_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setImportHistory(data || []);
    } catch (err: any) {
      console.error('Erreur historique imports:', err);
    }
  };

  const fetchRegionStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('stats_par_region');

      if (error) throw error;
      setRegionStats(data || []);
    } catch (err: any) {
      console.error('Erreur stats régions:', err);
    }
  };

  const fetchTotauxAnnuels = async (region: string = '', centre: string = '') => {
    try {
      // Si des filtres sont appliqués ET que la fonction existe
      if (region || centre) {
        const { data, error } = await supabase
          .rpc('totaux_par_annee_filtres', {
            p_region: region || null,
            p_centre: centre || null
          });

        if (error) {
          console.warn('Fonction totaux_par_annee_filtres non disponible, utilisation de totaux_par_annee');
          throw error;
        }
        setTotauxAnnuels(data || []);
      } else {
        // Sans filtres, utiliser la fonction simple
        const { data, error } = await supabase.rpc('totaux_par_annee');
        if (error) throw error;
        setTotauxAnnuels(data || []);
      }
    } catch (err: any) {
      console.error('Erreur totaux annuels:', err);
      // Fallback : charger toutes les données
      const { data, error } = await supabase.rpc('totaux_par_annee');
      if (!error && data) {
        setTotauxAnnuels(data);
      } else {
        setUploadStatus({ 
          type: 'error', 
          message: '⚠️ Erreur de chargement. Veuillez exécuter le script SQL dans Supabase.' 
        });
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...centresData];

    if (filterRegion) {
      filtered = filtered.filter(d => d.region === filterRegion);
    }
    if (filterCentre) {
      filtered = filtered.filter(d => d.centre === filterCentre);
    }
    if (filterAnnee) {
      filtered = filtered.filter(d => d.annee === parseInt(filterAnnee));
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.region.toLowerCase().includes(term) ||
        d.centre.toLowerCase().includes(term) ||
        (d.prestataire && d.prestataire.toLowerCase().includes(term))
      );
    }

    setFilteredData(filtered);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      setUploadStatus({ type: 'info', message: `${files.length} fichier(s) sélectionné(s)` });
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const allData: any[] = [];

          // Extraire le nom de la région depuis le nom du fichier
          const region = file.name.replace(/\.xlsx?$/i, '');

          // Parcourir tous les onglets
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length > 0) {
              // Trouver la ligne d'en-tête avec les années
              let headerRowIndex = -1;
              let yearColumns: { [key: number]: number } = {};

              for (let i = 0; i < jsonData.length; i++) {
                const row: any = jsonData[i];
                if (row && row.length > 0) {
                  // Chercher les années dans la ligne
                  row.forEach((cell: any, colIndex: number) => {
                    const cellStr = String(cell);
                    if (/^(19|20)\d{2}$/.test(cellStr)) {
                      if (headerRowIndex === -1) headerRowIndex = i;
                      yearColumns[parseInt(cellStr)] = colIndex;
                    }
                  });
                  if (headerRowIndex !== -1) break;
                }
              }

              if (headerRowIndex === -1) return;

              // Mapping des lignes de données
              const dataRowsMapping: { [key: string]: number } = {
                'Nombre de repas': -1,
                'Dont repas stagiaires': -1,
                'Dont repas salariés': -1,
                'Autres repas': -1,
                "Produits d'activités": -1,
                'Dont collectivité territoriales': -1,
                'Charges directes': -1,
                'Dont énergie et fluides': -1,
                'Dont charges de personnel': -1,
                'Marge sur coûts directs - EBE': -1,
                'Dotations aux amortissements': -1,
                'Charges structures': -1,
                'Total charges': -1,
                'Marge sur coûts complets': -1,
                'Prestataire': -1
              };

              // Trouver les lignes de données
              for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row: any = jsonData[i];
                if (row && row[0]) {
                  const label = String(row[0]).trim();
                  for (const key in dataRowsMapping) {
                    if (label.includes(key) || key.includes(label)) {
                      dataRowsMapping[key] = i;
                    }
                  }
                }
              }

              // Extraire les données pour chaque année
              Object.keys(yearColumns).forEach(yearStr => {
                const year = parseInt(yearStr);
                const colIndex = yearColumns[year];

                const dataRow: any = {
                  region,
                  centre: sheetName,
                  annee: year,
                  fichier_source: file.name
                };

                // Extraire chaque valeur
                if (dataRowsMapping['Nombre de repas'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Nombre de repas']][colIndex];
                  dataRow.nombre_repas = val ? parseInt(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Dont repas stagiaires'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Dont repas stagiaires']][colIndex];
                  dataRow.dont_repas_stagiaires = val ? parseInt(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Dont repas salariés'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Dont repas salariés']][colIndex];
                  dataRow.dont_repas_salaries = val ? parseInt(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Autres repas'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Autres repas']][colIndex];
                  dataRow.autres_repas = val ? parseInt(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping["Produits d'activités"] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping["Produits d'activités"]][colIndex];
                  dataRow.produits_activites = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Dont collectivité territoriales'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Dont collectivité territoriales']][colIndex];
                  dataRow.dont_collectivites_territoriales = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Charges directes'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Charges directes']][colIndex];
                  dataRow.charges_directes = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Dont énergie et fluides'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Dont énergie et fluides']][colIndex];
                  dataRow.dont_energie_fluides = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Dont charges de personnel'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Dont charges de personnel']][colIndex];
                  dataRow.dont_charges_personnel = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Marge sur coûts directs - EBE'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Marge sur coûts directs - EBE']][colIndex];
                  dataRow.marge_couts_directs_ebe = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Dotations aux amortissements'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Dotations aux amortissements']][colIndex];
                  dataRow.dotations_amortissements = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Charges structures'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Charges structures']][colIndex];
                  dataRow.charges_structures = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Total charges'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Total charges']][colIndex];
                  dataRow.total_charges = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Marge sur coûts complets'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Marge sur coûts complets']][colIndex];
                  dataRow.marge_couts_complets = val ? parseFloat(String(val).replace(/\s/g, '')) : null;
                }
                if (dataRowsMapping['Prestataire'] !== -1) {
                  const val = (jsonData as any)[dataRowsMapping['Prestataire']][colIndex];
                  dataRow.prestataire = val ? String(val) : null;
                }

                allData.push(dataRow);
              });
            }
          });

          resolve(allData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setUploadStatus({ type: 'error', message: 'Aucun fichier sélectionné' });
      return;
    }

    setLoading(true);
    setUploadStatus({ type: 'info', message: 'Import en cours...' });

    try {
      let totalImported = 0;

      for (const file of selectedFiles) {
        const region = file.name.replace(/\.xlsx?$/i, '');

        // Créer l'enregistrement d'import
        const { data: importRecord, error: importError } = await supabase
          .from('imports_fichiers_centres')
          .insert({
            nom_fichier: file.name,
            region,
            statut: 'en_cours',
            uploaded_by: profile.id
          })
          .select()
          .single();

        if (importError) throw importError;

        try {
          // Parser le fichier
          const parsedData = await parseExcelFile(file);

          if (parsedData.length === 0) {
            throw new Error('Aucune donnée trouvée dans le fichier');
          }

          // Ajouter l'ID de l'utilisateur
          const dataWithUser = parsedData.map(row => ({
            ...row,
            uploaded_by: profile.id
          }));

          // Insérer en base (upsert pour éviter les doublons)
          const { error: insertError } = await supabase
            .from('centres_donnees_financieres')
            .upsert(dataWithUser, {
              onConflict: 'region,centre,annee'
            });

          if (insertError) throw insertError;

          // Compter les onglets uniques
          const uniqueSheets = new Set(parsedData.map(d => d.centre));

          // Mettre à jour l'enregistrement d'import
          await supabase
            .from('imports_fichiers_centres')
            .update({
              statut: 'termine',
              nombre_onglets: uniqueSheets.size,
              nombre_lignes_importees: parsedData.length,
              completed_at: new Date().toISOString()
            })
            .eq('id', importRecord.id);

          totalImported += parsedData.length;

        } catch (fileError: any) {
          // Enregistrer l'erreur
          await supabase
            .from('imports_fichiers_centres')
            .update({
              statut: 'erreur',
              message_erreur: fileError.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', importRecord.id);

          throw fileError;
        }
      }

      setUploadStatus({ 
        type: 'success', 
        message: `${totalImported} ligne(s) importée(s) avec succès depuis ${selectedFiles.length} fichier(s)` 
      });
      setSelectedFiles([]);
      await fetchAllData();

    } catch (err: any) {
      console.error('Erreur import:', err);
      setUploadStatus({ 
        type: 'error', 
        message: `Erreur: ${err.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les données ? Cette action est irréversible.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('centres_donnees_financieres')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tout

      if (error) throw error;

      setUploadStatus({ type: 'success', message: 'Toutes les données ont été supprimées' });
      await fetchAllData();
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: `Erreur: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Synthèse Centres');
    XLSX.writeFile(wb, `synthese_centres_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const uniqueRegions = Array.from(new Set(centresData.map(d => d.region))).sort();
  const uniqueCentres = Array.from(new Set(centresData.map(d => d.centre))).sort();
  const uniqueAnnees = Array.from(new Set(centresData.map(d => d.annee))).sort((a, b) => b - a);

  const formatNumber = (num: number | null) => {
    if (num === null) return '-';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (num: number | null) => {
    if (num === null) return '-';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-7 h-7 text-emerald-600" />
              Gestion des Centres - Multi-Régions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Import et analyse des données financières par région et centre
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">
              {centresData.length} enregistrements
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex gap-4">
            {[
              { id: 'upload', label: 'Import Fichiers', icon: Upload },
              { id: 'data', label: 'Données', icon: FileText },
              { id: 'totaux', label: 'Totaux Annuels', icon: TrendingUp },
              { id: 'stats', label: 'Statistiques', icon: BarChart3 },
              { id: 'history', label: 'Historique', icon: RefreshCw }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeView === tab.id 
                    ? 'border-emerald-600 text-emerald-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Upload View */}
        {activeView === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Import de fichiers Excel
              </h2>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    multiple
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-sm text-gray-600"
                  >
                    <span className="text-emerald-600 font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez vos fichiers Excel
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Sélectionnez jusqu'à 13 fichiers (format .xlsx ou .xls)
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Fichiers sélectionnés ({selectedFiles.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{file.name}</span>
                          <span className="text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={loading || selectedFiles.length === 0}
                    className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Importer les fichiers
                      </>
                    )}
                  </button>
                  {centresData.length > 0 && (
                    <button
                      onClick={handleDeleteAllData}
                      disabled={loading}
                      className="px-6 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Tout supprimer
                    </button>
                  )}
                </div>

                {uploadStatus && (
                  <div className={`
                    rounded-lg p-4 flex items-start gap-3
                    ${uploadStatus.type === 'success' ? 'bg-green-50 text-green-800' : ''}
                    ${uploadStatus.type === 'error' ? 'bg-red-50 text-red-800' : ''}
                    ${uploadStatus.type === 'info' ? 'bg-blue-50 text-blue-800' : ''}
                  `}>
                    {uploadStatus.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
                    {uploadStatus.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
                    {uploadStatus.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{uploadStatus.message}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Instructions d'import
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Le <strong>nom du fichier</strong> sera utilisé comme nom de région (ex: "AURA - ANNECY.xlsx" → région "AURA - ANNECY")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Chaque <strong>onglet</strong> du fichier correspond à un centre</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Les données doivent contenir les années en colonnes (2019, 2020, 2021, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Si des données existent déjà pour une région/centre/année, elles seront mises à jour</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Data View */}
        {activeView === 'data' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Région</label>
                  <select
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Toutes</option>
                    {uniqueRegions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Centre</label>
                  <select
                    value={filterCentre}
                    onChange={(e) => setFilterCentre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Tous</option>
                    {uniqueCentres.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Année</label>
                  <select
                    value={filterAnnee}
                    onChange={(e) => setFilterAnnee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Toutes</option>
                    {uniqueAnnees.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {filteredData.length} résultat(s) affiché(s)
                </p>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Région</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Centre</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Année</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Repas</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Produits</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Charges</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Marge EBE</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Marge Complète</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-medium">{row.region}</td>
                        <td className="px-4 py-3 text-gray-700">{row.centre}</td>
                        <td className="px-4 py-3 text-gray-700">{row.annee}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-mono">{formatNumber(row.nombre_repas)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-mono">{formatCurrency(row.produits_activites)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-mono">{formatCurrency(row.charges_directes)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${(row.marge_couts_directs_ebe || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(row.marge_couts_directs_ebe)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${(row.marge_couts_complets || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(row.marge_couts_complets)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stats View */}
        {activeView === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {regionStats.map(stat => (
              <div key={stat.region} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{stat.region}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-900">Centres</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{stat.nombre_centres}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-900">Années</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{stat.nombre_annees}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-900">Total Repas</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{formatNumber(stat.total_repas)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-900">Total Produits</span>
                    </div>
                    <p className="text-xl font-bold text-orange-900">{formatCurrency(stat.total_produits)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Dernière mise à jour : {new Date(stat.derniere_maj).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History View */}
        {activeView === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Historique des imports</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {importHistory.map(item => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{item.nom_fichier}</p>
                          <p className="text-sm text-gray-600">{item.region}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>{item.nombre_onglets} onglets</span>
                        <span>{item.nombre_lignes_importees} lignes</span>
                        <span>{new Date(item.uploaded_at).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                    <div>
                      {item.statut === 'termine' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Terminé
                        </span>
                      )}
                      {item.statut === 'en_cours' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          En cours
                        </span>
                      )}
                      {item.statut === 'erreur' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Erreur
                        </span>
                      )}
                    </div>
                  </div>
                  {item.message_erreur && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {item.message_erreur}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totaux Annuels View */}
        {activeView === 'totaux' && (
          <div className="space-y-6">
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filtrer par région</label>
                  <select
                    value={totauxFilterRegion}
                    onChange={(e) => setTotauxFilterRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Toutes les régions</option>
                    {uniqueRegions.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filtrer par centre</label>
                  <select
                    value={totauxFilterCentre}
                    onChange={(e) => setTotauxFilterCentre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Tous les centres</option>
                    {uniqueCentres.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTotauxFilterRegion('');
                      setTotauxFilterCentre('');
                    }}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Réinitialiser
                  </button>
                </div>
              </div>
              {(totauxFilterRegion || totauxFilterCentre) && (
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Filtres actifs :</span>
                  {totauxFilterRegion && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs">{totauxFilterRegion}</span>}
                  {totauxFilterCentre && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs">{totauxFilterCentre}</span>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    Totaux par année
                    {totauxFilterRegion || totauxFilterCentre ? ' - Filtrés' : ' - Toutes régions'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Vue consolidée des données financières par catégorie
                  </p>
                </div>
                <button
                  onClick={() => {
                    const dataToExport = getFilteredTotaux();
                    const ws = XLSX.utils.json_to_sheet(dataToExport);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Totaux Annuels');
                    XLSX.writeFile(wb, `totaux_annuels_${new Date().toISOString().split('T')[0]}.xlsx`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>

              {/* Tableau des totaux */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50">Année</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Régions</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Centres</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase">Total Repas</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase">Stagiaires</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase">Salariés</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-blue-600 uppercase">Autres</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-green-700 uppercase">Produits</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-green-600 uppercase">Collect. Terr.</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-red-700 uppercase">Charges Dir.</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-red-600 uppercase">Énergie</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-red-600 uppercase">Personnel</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-purple-700 uppercase">Marge EBE</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-orange-600 uppercase">Dotations</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-orange-600 uppercase">Struct.</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-red-700 uppercase">Total Charges</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-purple-700 uppercase">Marge Complète</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getFilteredTotaux().map((total) => (
                      <tr key={total.annee} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-white">{total.annee}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{total.nombre_regions}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{total.nombre_centres}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-900 font-semibold">{formatNumber(total.total_repas)}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700">{formatNumber(total.total_repas_stagiaires)}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700">{formatNumber(total.total_repas_salaries)}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700">{formatNumber(total.total_autres_repas)}</td>
                        <td className="px-4 py-3 text-right font-mono text-green-900 font-semibold">{formatCurrency(total.total_produits_activites)}</td>
                        <td className="px-4 py-3 text-right font-mono text-green-700">{formatCurrency(total.total_collectivites_territoriales)}</td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${total.total_charges_directes < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatCurrency(total.total_charges_directes)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${total.total_energie_fluides < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(total.total_energie_fluides)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${total.total_charges_personnel < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(total.total_charges_personnel)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${total.total_marge_ebe < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatCurrency(total.total_marge_ebe)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${total.total_dotations_amortissements < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(total.total_dotations_amortissements)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${total.total_charges_structures < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(total.total_charges_structures)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${total.total_charges < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatCurrency(total.total_charges)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${total.total_marge_complets < 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatCurrency(total.total_marge_complets)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Légende */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Légende des catégories</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900">Repas</p>
                      <p className="text-gray-600">Volume total et détail par type</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-green-900">Produits</p>
                      <p className="text-gray-600">Revenus d'activités et subventions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900">Charges</p>
                      <p className="text-gray-600">Dépenses directes et structures</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-purple-900">Marges</p>
                      <p className="text-gray-600">EBE et résultat complet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
