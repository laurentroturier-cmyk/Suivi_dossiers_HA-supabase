import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  LogOut, 
  Shield, 
  User, 
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { UserProfile, DataRecord } from '../../types/auth';
import { PROJECT_FIELDS, DOSSIER_FIELDS, PROCEDURE_GROUPS } from '../../constants';

interface AdminDashboardProps {
  profile: UserProfile;
  onLogout: () => void;
  onBackToApp?: () => void;
}

export default function AdminDashboard({ profile, onLogout, onBackToApp }: AdminDashboardProps) {
  const [data, setData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rlsError, setRlsError] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRlsError(false);

      const { data: fetchedData, error: fetchError } = await supabase
        .from('mes_donnees')
        .select('*')
        .order('id', { ascending: true });

      if (fetchError) {
        // Détection d'erreur RLS (403/permission denied)
        if (fetchError.code === '42501' || fetchError.message.includes('permission denied')) {
          setRlsError(true);
          setError('Accès refusé : vos permissions ne permettent pas d\'accéder à ces données.');
        } else {
          setError(fetchError.message);
        }
        console.error('Erreur lors du chargement des données:', fetchError);
      } else {
        setData(fetchedData || []);
      }
    } catch (err: any) {
      console.error('Erreur:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const exportFieldsStructure = () => {
    const workbook = XLSX.utils.book_new();

    // Feuille 1: Champs Dossiers (Projets)
    const dossierData = [
      ['Module', 'Groupe', 'Nom du Champ', 'Clé Technique', 'Type', 'Description'],
      ...DOSSIER_FIELDS.map(field => [
        'Dossiers/Projets',
        field.group || 'Général',
        field.label,
        field.key,
        field.type || 'text',
        field.placeholder || ''
      ])
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(dossierData);
    ws1['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, ws1, 'Champs Dossiers');

    // Feuille 2: Champs Procédures
    const procedureData = [
      ['Module', 'Groupe', 'Nom du Champ', 'Clé Technique', 'Type', 'Description'],
      ...PROJECT_FIELDS.map(field => [
        'Procédures',
        field.group || 'Général',
        field.label,
        field.key,
        field.type || 'text',
        field.placeholder || ''
      ])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(procedureData);
    ws2['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, ws2, 'Champs Procédures');

    // Feuille 3: Groupes de Procédures
    const groupesData = [
      ['Module', 'Nom du Groupe', 'Clé Technique', 'Champs Inclus'],
      ...Object.entries(PROCEDURE_GROUPS).map(([key, group]: [string, any]) => [
        'Configuration',
        group.label,
        key,
        group.fields.join(', ')
      ])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(groupesData);
    ws3['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, ws3, 'Groupes Procédures');

    // Feuille 4: Module AN01
    const an01Data = [
      ['Module', 'Section', 'Type de Champ', 'Description'],
      ['AN01', 'Upload', 'Fichier Excel', 'Analyse des lots de marché'],
      ['AN01', 'Global', 'Métadonnées', 'Informations générales de la procédure'],
      ['AN01', 'Lots', 'Liste', 'Détail des lots analysés'],
      ['AN01', 'Analyse Technique', 'Visualisation', 'Graphiques et scores'],
      ['AN01', 'Vue Tableau', 'Grid', 'Tableau comparatif des lots']
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(an01Data);
    ws4['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, ws4, 'Module AN01');

    // Feuille 5: Guide d'utilisation
    const guideData = [
      ['Section', 'Information'],
      ['Objectif', 'Ce fichier documente tous les champs de l\'application pour faciliter l\'intégration de données'],
      ['Usage', 'Utilisez les clés techniques pour mapper vos données sources'],
      ['Types', 'text = Texte simple | date = Date | select = Liste déroulante | number = Nombre'],
      ['Import', 'Pour importer des données, utilisez les clés techniques de chaque feuille'],
      ['Format Date', 'Format attendu: DD/MM/YYYY'],
      ['', ''],
      ['Pages Principales', ''],
      ['Dashboard', 'Vue d\'ensemble avec KPIs et graphiques'],
      ['Dossiers', 'Gestion des projets/dossiers'],
      ['Procédures', 'Gestion des procédures de marché'],
      ['AN01', 'Module d\'analyse des offres']
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(guideData);
    ws5['!cols'] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, ws5, 'Guide');

    // Télécharger le fichier
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Structure_Champs_Application_${timestamp}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Enterprise</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.email}</p>
                <div className="mt-2">
                  {profile.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                      <User className="w-3 h-3" />
                      User
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Database className="w-4 h-4" />
              Mes données
            </button>
            
            {onBackToApp && (
              <button 
                onClick={onBackToApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'application
              </button>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/20 border border-red-600/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
          <p className="text-gray-600">Gérez vos données et votre entreprise</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Entrées</span>
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Statut</span>
              {error ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {error ? 'Erreur' : 'Connecté'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Rôle</span>
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900 capitalize">{profile.role}</p>
          </div>
        </div>

        {/* Admin-only Features */}
        {profile.role === 'admin' && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fonctionnalités Administrateur</h3>
                <p className="text-sm text-gray-700 mb-4">En tant qu'administrateur, vous avez accès à toutes les fonctionnalités de gestion de la plateforme.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={exportFieldsStructure}
                    className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all group"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <FileSpreadsheet className="w-5 h-5 text-green-700" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">Exporter la structure</p>
                      <p className="text-xs text-gray-600">Tous les champs en Excel</p>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">Gestion des utilisateurs</p>
                      <p className="text-xs text-gray-600">Bientôt disponible</p>
                    </div>
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">Rapports avancés</p>
                      <p className="text-xs text-gray-600">Bientôt disponible</p>
                    </div>
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 hover:border-amber-400 transition-all opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-900">Permissions RLS</p>
                      <p className="text-xs text-gray-600">Bientôt disponible</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display (RLS) */}
        {rlsError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Erreur d'accès (RLS)
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  {error}
                </p>
                <div className="bg-red-100/50 rounded-lg p-4 mb-4">
                  <p className="text-xs font-mono text-red-800">Code: 403 Forbidden</p>
                  <p className="text-xs text-red-700 mt-2">
                    Les politiques de sécurité au niveau des lignes (RLS) de Supabase bloquent votre accès à cette table.
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* General Error */}
        {error && !rlsError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Erreur</p>
              <p className="text-sm text-yellow-700 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Mes Données</h3>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des données...</p>
                </div>
              </div>
            ) : data.length === 0 && !error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune donnée disponible</p>
                </div>
              </div>
            ) : !error ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {data[0] && Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                      {Object.values(row).map((value, cellIdx) => (
                        <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>

        {/* Admin Features */}
        {profile.role === 'admin' && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">
                    Fonctionnalités Administrateur
                  </h3>
                  <p className="text-sm text-amber-700 mb-4">
                    En tant qu'administrateur, vous avez accès à toutes les fonctionnalités de gestion de la plateforme.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button className="px-4 py-3 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-50 transition-colors text-left">
                      🛠️ Gestion des utilisateurs
                    </button>
                    <button className="px-4 py-3 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-50 transition-colors text-left">
                      📊 Rapports avancés
                    </button>
                    <button className="px-4 py-3 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-50 transition-colors text-left">
                      ⚙️ Configuration système
                    </button>
                    <button className="px-4 py-3 bg-white border border-amber-200 rounded-lg text-sm font-medium text-amber-900 hover:bg-amber-50 transition-colors text-left">
                      🔒 Permissions RLS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
