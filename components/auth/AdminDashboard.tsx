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
  Mail
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { UserProfile, DataRecord, AccessRequest } from '../../types/auth';
import { PROJECT_FIELDS, DOSSIER_FIELDS, PROCEDURE_GROUPS } from '../../constants';
import DataImport from './DataImport';

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
  const [activeTab, setActiveTab] = useState<'data' | 'requests' | 'users' | 'import'>('data');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(true);

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

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
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
      <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-[#004d3d] to-[#003329] text-white shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#006d57] rounded-lg flex items-center justify-center relative">
              <LayoutDashboard className="w-6 h-6" />
              {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                  {accessRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold">DNA Gestprojet</h1>
              <p className="text-xs text-emerald-200">Dashboard</p>
            </div>
          </div>

          {/* User Profile */}
          <div className="bg-[#003329]/50 rounded-lg p-4 mb-6 border border-[#006d57]/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#006d57] to-[#004d3d] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{profile.email}</p>
                <div className="mt-2">
                  {profile.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-400/20 text-emerald-200 text-xs font-medium rounded-full border border-emerald-400/30">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#006d57]/20 text-emerald-200 text-xs font-medium rounded-full border border-[#006d57]/30">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'data' ? 'bg-[#006d57]' : 'text-emerald-100 hover:bg-[#003329]/50'
              }`}
            >
              <Database className="w-4 h-4" />
              Mes données
            </button>

            {profile.role === 'admin' && (
              <>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'requests' ? 'bg-[#006d57]' : 'text-emerald-100 hover:bg-[#003329]/50'
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'import' ? 'bg-[#006d57]' : 'text-emerald-100 hover:bg-[#003329]/50'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Import de données
                </button>
              </>
            )}
            
            {onBackToApp && (
              <button 
                onClick={onBackToApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-emerald-100 rounded-lg text-sm font-medium hover:bg-[#003329]/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à l'application
              </button>
            )}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[#006d57]/30">
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
          <p className="text-gray-600">Gérez vos données et votre DNA Gestprojet</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Total Entrées</span>
              <Database className="w-5 h-5 text-[#004d3d]" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Demandes en attente</span>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {accessRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Rôle</span>
              <Shield className="w-5 h-5 text-[#004d3d]" />
            </div>
            <p className="text-lg font-semibold text-gray-900 capitalize">{profile.role}</p>
          </div>
        </div>

        {activeTab === 'data' && (
          <>
            {/* Admin-only Features */}
            {profile.role === 'admin' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#004d3d] rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fonctionnalités Administrateur</h3>
                <p className="text-sm text-gray-600 mb-4">En tant qu'administrateur, vous avez accès à toutes les fonctionnalités de gestion de la plateforme.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={exportFieldsStructure}
                    className="inline-flex items-center gap-3 px-4 py-3 bg-[#004d3d] border border-[#004d3d] rounded-lg hover:bg-[#006d57] transition-all group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <FileSpreadsheet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">Exporter la structure</p>
                      <p className="text-xs text-emerald-100">Tous les champs en Excel</p>
                    </div>
                    <Download className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
                  </button>

                  <button 
                    onClick={() => setShowUserManagement(!showUserManagement)}
                    className="inline-flex items-center gap-3 px-4 py-3 bg-[#004d3d] border border-[#004d3d] rounded-lg hover:bg-[#006d57] transition-all group"
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">Gestion des utilisateurs</p>
                      <p className="text-xs text-emerald-100">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</p>
                    </div>
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-500">Rapports avancés</p>
                      <p className="text-xs text-gray-400">Bientôt disponible</p>
                    </div>
                  </button>

                  <button className="inline-flex items-center gap-3 px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-gray-500">Permissions RLS</p>
                      <p className="text-xs text-gray-400">Bientôt disponible</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Section */}
        {showUserManagement && profile.role === 'admin' && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Gestion des utilisateurs</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Liste de tous les utilisateurs et gestion des rôles
                </p>
              </div>
              <button
                onClick={fetchUsers}
                disabled={usersLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#004d3d] rounded-lg hover:bg-[#006d57] disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>

            {usersLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-[#004d3d] animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#006d57] to-[#004d3d] rounded-full flex items-center justify-center flex-shrink-0">
                              {user.role === 'admin' ? (
                                <Shield className="w-5 h-5 text-white" />
                              ) : (
                                <User className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-semibold text-gray-900">
                                {user.email?.split('@')[0]}
                              </p>
                              {user.id === profile.id && (
                                <span className="text-xs text-emerald-600 font-medium">(Vous)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-700">{user.email}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.id === profile.id ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${
                              user.role === 'admin' 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                            } text-xs font-medium rounded-full`}>
                              {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                              {user.role}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'user')}
                              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#004d3d]/20 outline-none"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.id === profile.id ? (
                            <span className="text-gray-400 italic text-xs">Compte actif</span>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Voulez-vous vraiment changer le rôle de ${user.email} ?`)) {
                                  handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin');
                                }
                              }}
                              className="text-[#004d3d] hover:text-[#006d57] font-medium"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Mes Données</h3>
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#004d3d] rounded-lg hover:bg-[#006d57] disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-[#004d3d] animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des données...</p>
                </div>
              </div>
            ) : data.length === 0 && !error ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune donnée disponible</p>
                </div>
              </div>
            ) : !error ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {data[0] && Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                      {Object.values(row).map((value, cellIdx) => (
                        <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Demandes d'accès</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Gérez les demandes d'accès des nouveaux utilisateurs
                  </p>
                </div>
                <button
                  onClick={fetchAccessRequests}
                  disabled={requestsLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#004d3d] rounded-lg hover:bg-[#006d57] disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>
              </div>

              <div className="p-6">
                {requestsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-[#004d3d] animate-spin" />
                  </div>
                ) : accessRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune demande d'accès</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Pending Requests */}
                    {accessRequests.filter(r => r.status === 'pending').length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          En attente ({accessRequests.filter(r => r.status === 'pending').length})
                        </h4>
                        <div className="space-y-3">
                          {accessRequests.filter(r => r.status === 'pending').map(request => (
                            <div key={request.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <p className="font-semibold text-gray-900">
                                      {request.first_name} {request.last_name}
                                    </p>
                                    <span className="px-2 py-0.5 bg-orange-200 text-orange-700 text-xs rounded-full">
                                      En attente
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-2">
                                    <Mail className="w-3 h-3 inline mr-1" />
                                    {request.email}
                                  </p>
                                  {request.reason && (
                                    <div className="bg-white rounded p-3 mb-3 border border-gray-100">
                                      <p className="text-xs font-medium text-gray-600 mb-1">Raison :</p>
                                      <p className="text-sm text-gray-700">{request.reason}</p>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Demandé le {new Date(request.created_at).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="inline-flex items-center gap-1 px-3 py-2 bg-[#004d3d] text-white text-sm font-medium rounded-lg hover:bg-[#006d57] transition-colors"
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
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Approuvées ({accessRequests.filter(r => r.status === 'approved').length})
                        </h4>
                        <div className="space-y-2">
                          {accessRequests.filter(r => r.status === 'approved').slice(0, 5).map(request => (
                            <div key={request.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {request.first_name} {request.last_name}
                                  </p>
                                  <p className="text-xs text-gray-600">{request.email}</p>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full">
                                    Approuvée
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
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
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Rejetées ({accessRequests.filter(r => r.status === 'rejected').length})
                        </h4>
                        <div className="space-y-2">
                          {accessRequests.filter(r => r.status === 'rejected').slice(0, 5).map(request => (
                            <div key={request.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {request.first_name} {request.last_name}
                                  </p>
                                  <p className="text-xs text-gray-600">{request.email}</p>
                                  {request.rejection_reason && (
                                    <p className="text-xs text-red-700 mt-1">Raison: {request.rejection_reason}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs rounded-full">
                                    Rejetée
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
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
      </main>
    </div>
  );
}
