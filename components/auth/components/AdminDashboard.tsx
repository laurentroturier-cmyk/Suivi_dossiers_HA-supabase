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
  Download,
  UserPlus,
  Clock,
  UserCheck,
  UserX,
  Mail,
  Zap,
  Building2,
  ShoppingCart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { UserProfile, DataRecord, AccessRequest } from '../../../types/auth';
import { PROJECT_FIELDS, DOSSIER_FIELDS, PROCEDURE_GROUPS } from '../../../constants';
import DataImport from './DataImport';
import GestionCentres from './GestionCentres';
import { DashboardAchats } from '../../dashboard-achats';

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
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'data' | 'requests' | 'users' | 'import' | 'centres' | 'commandes-fina'>('data');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(true);
  const [powerAutomateLoading, setPowerAutomateLoading] = useState(false);
  const [powerAutomateResult, setPowerAutomateResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchData();
    fetchAccessRequests();
    if (profile.role === 'admin') {
      fetchUsers();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setRlsError(false);

      // Table mes_donnees désactivée - ne plus charger ces données
      setData([]);
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

  const fetchAccessRequests = async () => {
    try {
      setRequestsLoading(true);
      const { data: requests, error: requestsError } = await supabase
        .from('access_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setAccessRequests(requests || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des demandes:', err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('approve_access_request', {
        request_id: requestId,
        admin_id: profile.id
      });

      if (error) throw error;

      await fetchAccessRequests();
      alert('Demande approuvée avec succès !');
    } catch (err: any) {
      console.error('Erreur lors de l\'approbation:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Raison du rejet (optionnel):');
    
    try {
      const { error } = await supabase.rpc('reject_access_request', {
        request_id: requestId,
        admin_id: profile.id,
        reason: reason || null
      });

      if (error) throw error;

      await fetchAccessRequests();
      alert('Demande rejetée.');
    } catch (err: any) {
      console.error('Erreur lors du rejet:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('Fetching users...');
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('email', { ascending: true });

      console.log('Users data:', usersData);
      console.log('Users error:', usersError);

      if (usersError) {
        console.error('Erreur Supabase:', usersError);
        throw usersError;
      }
      setUsers(usersData || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      alert('Erreur de chargement: ' + err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user' | 'gral') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      alert('Rôle mis à jour avec succès !');
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du rôle:', err);
      alert('Erreur: ' + err.message);
    }
  };

  const testPowerAutomate = async () => {
    try {
      setPowerAutomateLoading(true);
      setPowerAutomateResult(null);

      console.log('🚀 Envoi de la requête Power Automate...');
      
      const payload = {
        Qui: 'Appli gestion de projet',
        Quoi: 'Demande de signature RP',
        Contenu: '649-1'
      };
      
      console.log('📦 Payload:', payload);

      const response = await fetch('https://defaultaab83e7456b04278b32c502d1f8f5b.3e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/10a7d190b4aa4de985011f0db576e813/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lSnRxNNfZ2Mbq04okg0qZpa8rztjM1LLWxyMydrK7CU', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📨 Réponse reçue:', response);
      console.log('Status:', response.status);
      console.log('Type:', response.type);

      if (response.status === 404) {
        setPowerAutomateResult({
          success: false,
          message: `Erreur 404 : L'endpoint Power Automate n'existe pas ou l'URL est incorrecte. Vérifiez l'URL fournie.`
        });
      } else if (response.ok) {
        const result = await response.text();
        console.log('📄 Contenu:', result);
        setPowerAutomateResult({
          success: true,
          message: `Succès ! Réponse: ${result || 'OK'}`
        });
      } else {
        const errorText = await response.text().catch(() => 'Pas de détails');
        setPowerAutomateResult({
          success: false,
          message: `Erreur HTTP ${response.status}: ${response.statusText} - ${errorText}`
        });
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du test Power Automate:', err);
      setPowerAutomateResult({
        success: false,
        message: `Erreur réseau ou CORS: ${err.message || 'Erreur inconnue'}. Vérifiez que l'URL Power Automate est correcte et autorise les requêtes cross-origin.`
      });
    } finally {
      setPowerAutomateLoading(false);
    }
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
    <div className="admin-dashboard min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-600 to-indigo-800 dark:bg-slate-800 dark:from-slate-800 dark:to-slate-900 text-white shadow-xl backdrop-blur-xl border-r border-white/10 dark:border-slate-700">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white/20 dark:bg-slate-700 backdrop-blur-sm rounded-lg flex items-center justify-center relative border border-white/20 dark:border-slate-600">
              <LayoutDashboard className="w-6 h-6" />
              {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {accessRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold">DNA Gestprojet</h1>
              <p className="text-xs text-blue-200 dark:text-slate-400">Dashboard</p>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-white/10 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20 dark:border-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.email}</p>
                <div className="mt-2">
                  {profile.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 dark:bg-slate-600 text-blue-100 dark:text-slate-200 text-xs font-medium rounded-full border border-white/30 dark:border-slate-500 backdrop-blur-sm">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 dark:bg-slate-600 text-blue-100 dark:text-slate-200 text-xs font-medium rounded-full border border-white/20 dark:border-slate-500 backdrop-blur-sm">
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
            <button 
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'data' ? 'bg-white/20 dark:bg-slate-700 backdrop-blur-sm border border-white/30 dark:border-slate-600 shadow-lg' : 'text-blue-100 dark:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-700/80 border border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              Mes données
            </button>

            {profile.role === 'admin' && (
              <>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'requests' ? 'bg-white/20 dark:bg-slate-700 backdrop-blur-sm border border-white/30 dark:border-slate-600 shadow-lg' : 'text-blue-100 dark:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-700/80 border border-transparent'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Demandes d'accès
                  {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {accessRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setActiveTab('import')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'import' ? 'bg-white/20 dark:bg-slate-700 backdrop-blur-sm border border-white/30 dark:border-slate-600 shadow-lg' : 'text-blue-100 dark:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-700/80 border border-transparent'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import de données
                </button>

                <button 
                  onClick={() => setActiveTab('centres')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'centres' ? 'bg-white/20 dark:bg-slate-700 backdrop-blur-sm border border-white/30 dark:border-slate-600 shadow-lg' : 'text-blue-100 dark:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-700/80 border border-transparent'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Gestion Centres
                </button>

                <button 
                  onClick={() => setActiveTab('commandes-fina')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === 'commandes-fina' ? 'bg-white/20 dark:bg-slate-700 backdrop-blur-sm border border-white/30 dark:border-slate-600 shadow-lg' : 'text-blue-100 dark:text-slate-200 hover:bg-white/10 dark:hover:bg-slate-700/80 border border-transparent'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Commandes Fina par Trimestre
                </button>

                <button 
                  onClick={testPowerAutomate}
                  disabled={powerAutomateLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-white/10 dark:hover:bg-slate-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 dark:border-slate-600"
                >
                  {powerAutomateLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Test Power Automate
                </button>
              </>
            )}
            
            {onBackToApp && (
              <button 
                onClick={onBackToApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-blue-100 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-white/10 dark:hover:bg-slate-700/80 transition-all border border-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'application
              </button>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/20 dark:border-slate-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 dark:bg-slate-700/80 backdrop-blur-sm text-red-200 dark:text-red-300 rounded-xl text-sm font-medium hover:bg-red-500/20 dark:hover:bg-red-900/40 border border-white/20 dark:border-slate-600 hover:border-red-400/30 transition-all"
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tableau de bord</h2>
          <p className="text-gray-600 dark:text-slate-400">Gérez vos données et votre DNA Gestprojet</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Entrées</span>
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.length}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Demandes en attente</span>
              <Clock className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {accessRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Statut</span>
              <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Connecté</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Rôle: {profile.role}</p>
          </div>
        </div>

        {/* Power Automate Result */}
        {powerAutomateResult && profile.role === 'admin' && (
          <div className={`mb-8 p-6 rounded-2xl border ${
            powerAutomateResult.success 
              ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-700' 
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {powerAutomateResult.success ? (
                <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  powerAutomateResult.success ? 'text-indigo-800 dark:text-indigo-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  Test Power Automate
                </h3>
                <p className={`text-sm ${
                  powerAutomateResult.success ? 'text-indigo-700 dark:text-indigo-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {powerAutomateResult.message}
                </p>
              </div>
              <button
                onClick={() => setPowerAutomateResult(null)}
                className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <>
            {/* Admin-only Features */}
            {profile.role === 'admin' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Fonctionnalités Administrateur</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">En tant qu'administrateur, vous avez accès à toutes les fonctionnalités de gestion de la plateforme.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={exportFieldsStructure}
                    className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 hover:from-sky-500 hover:to-indigo-700 dark:hover:from-slate-500 dark:hover:to-slate-600 border border-white/20 dark:border-slate-600 rounded-xl transition-all group shadow-lg shadow-indigo-500/25 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600"
                  >
                    <div className="w-10 h-10 bg-white/15 dark:bg-slate-500/50 rounded-lg flex items-center justify-center group-hover:bg-white/25 dark:group-hover:bg-slate-500/70 transition-colors backdrop-blur-sm">
                      <FileSpreadsheet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">Exporter la structure</p>
                      <p className="text-xs text-blue-100/90 dark:text-slate-400">Tous les champs en Excel</p>
                    </div>
                    <Download className="w-4 h-4 text-white/80 dark:text-slate-300 group-hover:text-white dark:group-hover:text-white transition-colors" />
                  </button>

                  <button 
                    onClick={() => setShowUserManagement(!showUserManagement)}
                    className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 hover:from-sky-500 hover:to-indigo-700 dark:hover:from-slate-500 dark:hover:to-slate-600 border border-white/20 dark:border-slate-600 rounded-xl transition-all group shadow-lg shadow-indigo-500/25 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600"
                  >
                    <div className="w-10 h-10 bg-white/15 dark:bg-slate-500/50 rounded-lg flex items-center justify-center group-hover:bg-white/25 dark:group-hover:bg-slate-500/70 transition-colors backdrop-blur-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">Gestion des utilisateurs</p>
                      <p className="text-xs text-blue-100/90 dark:text-slate-400">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
                    </div>
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Rapports avancés</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Bientôt disponible</p>
                    </div>
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">Permissions RLS</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Bientôt disponible</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        {showUserManagement && profile.role === 'admin' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                  Liste de tous les utilisateurs et gestion des rôles
                </p>
              </div>
              <button
                onClick={fetchUsers}
                disabled={usersLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 hover:from-sky-500 hover:to-indigo-700 dark:hover:from-slate-500 dark:hover:to-slate-600 rounded-xl shadow-lg shadow-indigo-500/25 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 dark:text-slate-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-slate-600">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-600 bg-white dark:bg-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors bg-white dark:bg-slate-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-white/20 dark:ring-slate-600">
                              {user.role === 'admin' ? (
                                <Shield className="w-5 h-5 text-white" />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {user.email?.split('@')[0]}
                              </p>
                              {user.id === profile.id && (
                                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">(Vous)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-700 dark:text-slate-300">{user.email}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.id === profile.id ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${
                              user.role === 'admin' 
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700' 
                                : 'bg-blue-100 dark:bg-slate-600 text-blue-700 dark:text-slate-200 border border-blue-200 dark:border-slate-500'
                            } text-xs font-medium rounded-full`}>
                              {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {user.role}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user' | 'gral')}
                              className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            >
                              <option value="user">user</option>
                              <option value="gral">gral</option>
                              <option value="admin">admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.id === profile.id ? (
                            <span className="text-gray-400 dark:text-slate-500 italic text-xs">Compte actif</span>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Voulez-vous vraiment changer le rôle de ${user.email} ?`)) {
                                  handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin');
                                }
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                            >
                              {user.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Error Display (RLS) */}
        {rlsError && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 dark:border-red-600 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Erreur d'accès (RLS)
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {error}
                </p>
                <div className="bg-red-100/50 dark:bg-red-900/30 rounded-lg p-4 mb-4">
                  <p className="text-xs font-mono text-red-800 dark:text-red-200">Code: 403 Forbidden</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-2">
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
          <div className="mb-6 bg-yellow-50 dark:bg-amber-950/30 border border-yellow-200 dark:border-amber-700 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-amber-200">Erreur</p>
              <p className="text-sm text-yellow-700 dark:text-amber-300 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="text-yellow-600 dark:text-amber-400 hover:text-yellow-700 dark:hover:text-amber-300"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-600 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mes Données</h3>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 hover:from-sky-500 hover:to-indigo-700 dark:hover:from-slate-500 dark:hover:to-slate-600 rounded-xl shadow-lg shadow-indigo-500/25 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600 disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-slate-400">Chargement des données...</p>
                </div>
              </div>
            ) : data.length === 0 && !error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Database className="w-12 h-12 text-gray-300 dark:text-slate-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-slate-400">Aucune donnée disponible</p>
                </div>
              </div>
            ) : !error ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600">
                  <tr>
                    {data[0] && Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-slate-300 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-600">
                  {data.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      {Object.values(row).map((value, cellIdx) => (
                        <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-300">
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
          </>
        )}

        {/* Access Requests Tab */}
        {activeTab === 'requests' && profile.role === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-600 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demandes d'accès</h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    Gérez les demandes d'accès des nouveaux utilisateurs
                  </p>
                </div>
                <button
                  onClick={fetchAccessRequests}
                  disabled={requestsLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-br from-sky-400 to-indigo-600 dark:from-slate-600 dark:to-slate-700 hover:from-sky-500 hover:to-indigo-700 dark:hover:from-slate-500 dark:hover:to-slate-600 rounded-xl shadow-lg shadow-indigo-500/25 dark:shadow-none ring-2 ring-white/20 dark:ring-slate-600 disabled:opacity-50 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              <div className="p-6">
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </div>
                ) : accessRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 text-gray-300 dark:text-slate-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-slate-400">Aucune demande d'accès</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending Requests */}
                    {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                          En attente ({accessRequests.filter(r => r.status === 'pending').length})
                        </h4>
                        <div className="space-y-3">
                          {accessRequests.filter(r => r.status === 'pending').map(request => (
                            <div key={request.id} className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {request.first_name} {request.last_name}
                                    </p>
                                    <span className="px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200 text-xs rounded-full">
                                      En attente
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">
                                    <Mail className="w-3 h-3 inline mr-1" />
                                    {request.email}
                                  </p>
                                  {request.reason && (
                                    <div className="bg-white dark:bg-slate-700 rounded p-3 mb-3 border border-gray-100 dark:border-slate-600">
                                      <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Raison :</p>
                                      <p className="text-sm text-gray-700 dark:text-slate-300">{request.reason}</p>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Demandé le {new Date(request.created_at).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-gradient-to-br from-sky-400 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/25 ring-2 ring-white/20 transition-all"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    Approuver
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                                  >
                                    <UserX className="w-4 h-4" />
                                    Rejeter
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approved Requests */}
                    {accessRequests.filter(r => r.status === 'approved').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          Approuvées ({accessRequests.filter(r => r.status === 'approved').length})
                        </h4>
                        <div className="space-y-2">
                          {accessRequests.filter(r => r.status === 'approved').slice(0, 5).map(request => (
                            <div key={request.id} className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {request.first_name} {request.last_name}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-slate-400">{request.email}</p>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                                    Approuvée
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {new Date(request.reviewed_at!).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rejected Requests */}
                    {accessRequests.filter(r => r.status === 'rejected').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          Rejetées ({accessRequests.filter(r => r.status === 'rejected').length})
                        </h4>
                        <div className="space-y-2">
                          {accessRequests.filter(r => r.status === 'rejected').slice(0, 5).map(request => (
                            <div key={request.id} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {request.first_name} {request.last_name}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-slate-400">{request.email}</p>
                                  {request.rejection_reason && (
                                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">Raison: {request.rejection_reason}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs rounded-full">
                                    Rejetée
                                  </span>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {new Date(request.reviewed_at!).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Import Data Tab */}
        {activeTab === 'import' && (
          <DataImport />
        )}

        {/* Gestion Centres Tab - ADMIN ONLY */}
        {activeTab === 'centres' && profile.role === 'admin' && (
          <GestionCentres profile={profile} />
        )}

        {/* Commandes Fina Tab - ADMIN ONLY */}
        {activeTab === 'commandes-fina' && profile.role === 'admin' && (
          <div className="h-full overflow-auto min-h-[60vh] bg-gray-50 dark:bg-[#0f172a] rounded-2xl">
            <DashboardAchats onBack={() => setActiveTab('data')} />
          </div>
        )}
      </main>
    </div>
  );
}
