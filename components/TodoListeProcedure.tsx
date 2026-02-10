import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle,
  Edit2,
  Trash2,
  FileSpreadsheet,
  FileText,
  X,
  Save,
  Calendar,
  User,
  ListTodo,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';

interface TodoTask {
  id: string;
  numero: number;
  titre: string;
  assigne_a: string;
  echeance: string;
  statut: 'en-attente' | 'en-cours' | 'terminee';
  date_realisation?: string;
  notes?: string;
}

interface TodoListeProcedureProps {
  procedureNumProc: string;
  procedureNumero: string;
  onBack: () => void;
  userRole?: string;
  userEmail?: string;
  procedureAcheteur?: string;
}

export const TodoListeProcedure: React.FC<TodoListeProcedureProps> = ({
  procedureNumProc,
  procedureNumero,
  onBack,
  userRole,
  userEmail,
  procedureAcheteur
}) => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titre: '',
    assigne_a: '',
    echeance: '',
    statut: 'en-attente' as const,
    date_realisation: '',
    notes: ''
  });

  // Charger les tâches depuis Supabase
  useEffect(() => {
    loadTasks();
  }, [procedureNumProc]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des tâches pour NumProc:', procedureNumProc);
      
      const { data, error } = await supabase
        .from('procédures')
        .select('TODOlisteP')
        .eq('NumProc', procedureNumProc)
        .single();

      console.log('📦 Données reçues:', data);
      console.log('❌ Erreur:', error);

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du chargement:', error);
        throw error;
      }
      
      if (data?.TODOlisteP) {
        try {
          const parsedTasks = JSON.parse(data.TODOlisteP);
          console.log('✅ Tâches parsées:', parsedTasks);
          setTasks(parsedTasks);
        } catch (parseErr) {
          console.error('❌ Erreur de parsing JSON:', parseErr);
          setTasks([]);
        }
      } else {
        console.log('ℹ️ Aucune tâche existante, initialisation à []');
        setTasks([]);
      }
    } catch (err) {
      console.error('❌ Erreur chargement tâches:', err);
      alert(`Erreur de chargement: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveTasks = async (updatedTasks: TodoTask[]) => {
    try {
      setSaving(true);
      console.log('💾 Sauvegarde des tâches pour NumProc:', procedureNumProc);
      console.log('📝 Tâches à sauvegarder:', updatedTasks);
      
      const jsonData = JSON.stringify(updatedTasks);
      console.log('📄 JSON à enregistrer:', jsonData);
      
      const { data, error } = await supabase
        .from('procédures')
        .update({ TODOlisteP: jsonData })
        .eq('NumProc', procedureNumProc)
        .select();

      console.log('✅ Réponse Supabase:', data);
      console.log('❌ Erreur Supabase:', error);

      if (error) {
        console.error('❌ Erreur détaillée:', error);
        throw error;
      }
      
      setTasks(updatedTasks);
      console.log('✅ Tâches sauvegardées avec succès');
    } catch (err: any) {
      console.error('❌ Erreur sauvegarde:', err);
      alert(`Erreur lors de la sauvegarde: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = () => {
    const newTask: TodoTask = {
      id: Date.now().toString(),
      numero: tasks.length + 1,
      titre: formData.titre,
      assigne_a: formData.assigne_a,
      echeance: formData.echeance,
      statut: formData.statut,
      date_realisation: formData.date_realisation,
      notes: formData.notes
    };

    saveTasks([...tasks, newTask]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;

    const updatedTasks = tasks.map(t => 
      t.id === editingTask.id 
        ? { ...editingTask, ...formData }
        : t
    );

    saveTasks(updatedTasks);
    resetForm();
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    
    const updatedTasks = tasks.filter(t => t.id !== taskId)
      .map((t, index) => ({ ...t, numero: index + 1 }));
    
    saveTasks(updatedTasks);
  };

  const toggleTaskStatus = async (taskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const newStatut = t.statut === 'terminee' ? 'en-attente' : 'terminee';
        return {
          ...t,
          statut: newStatut,
          date_realisation: newStatut === 'terminee' ? new Date().toISOString().split('T')[0] : ''
        };
      }
      return t;
    });

    saveTasks(updatedTasks);
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      assigne_a: '',
      echeance: '',
      statut: 'en-attente',
      date_realisation: '',
      notes: ''
    });
  };

  const openEditModal = (task: TodoTask) => {
    setEditingTask(task);
    setFormData({
      titre: task.titre,
      assigne_a: task.assigne_a,
      echeance: task.echeance,
      statut: task.statut,
      date_realisation: task.date_realisation || '',
      notes: task.notes || ''
    });
  };

  // Statistiques
  const stats = useMemo(() => {
    const total = tasks.length;
    const terminees = tasks.filter(t => t.statut === 'terminee').length;
    const enAttente = tasks.filter(t => t.statut === 'en-attente').length;
    const enRetard = tasks.filter(t => {
      if (t.statut === 'terminee') return false;
      if (!t.echeance) return false;
      return new Date(t.echeance) < new Date();
    }).length;

    return { total, terminees, enAttente, enRetard };
  }, [tasks]);

  // Filtrage
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    
    const term = searchTerm.toLowerCase();
    return tasks.filter(t => 
      t.titre.toLowerCase().includes(term) ||
      t.assigne_a.toLowerCase().includes(term) ||
      t.notes?.toLowerCase().includes(term)
    );
  }, [tasks, searchTerm]);

  // Export Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      tasks.map(t => ({
        'N°': t.numero,
        'Titre': t.titre,
        'Assigné à': t.assigne_a,
        'Échéance': t.echeance,
        'Statut': t.statut === 'terminee' ? 'Terminée' : t.statut === 'en-cours' ? 'En cours' : 'En attente',
        'Date réalisation': t.date_realisation || '',
        'Notes': t.notes || ''
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tâches');
    XLSX.writeFile(wb, `TODO_Procedure_${procedureNumero}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(18);
    doc.setTextColor(0, 77, 61);
    doc.text(`TODO Liste - Procédure ${procedureNumero}`, 14, 22);
    
    // Statistiques
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total: ${stats.total} | Terminées: ${stats.terminees} | En attente: ${stats.enAttente} | En retard: ${stats.enRetard}`, 14, 30);
    
    // Tableau
    autoTable(doc, {
      startY: 35,
      head: [['N°', 'Titre', 'Assigné à', 'Échéance', 'Statut', 'Date réalisation']],
      body: tasks.map(t => [
        t.numero,
        t.titre,
        t.assigne_a,
        t.echeance,
        t.statut === 'terminee' ? 'Terminée' : t.statut === 'en-cours' ? 'En cours' : 'En attente',
        t.date_realisation || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 77, 61] },
      styles: { fontSize: 8 }
    });

    doc.save(`TODO_Procedure_${procedureNumero}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'terminee': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'en-cours': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'terminee': return 'Terminée';
      case 'en-cours': return 'En cours';
      default: return 'En attente';
    }
  };

  const isTaskLate = (task: TodoTask) => {
    if (task.statut === 'terminee') return false;
    if (!task.echeance) return false;
    return new Date(task.echeance) < new Date();
  };

  // Vérifier l'accès
  const isAdmin = userRole === 'admin';
  const isOwner = userEmail && procedureAcheteur && 
    String(userEmail).toLowerCase() === String(procedureAcheteur).toLowerCase();
  const hasAccess = isAdmin || isOwner;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Afficher un message d'accès refusé si l'utilisateur n'a pas les droits
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette TODO liste.
              Seuls les administrateurs et le propriétaire de la procédure peuvent y accéder.
            </p>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-dark-900 dark:to-dark-800">
      {/* Header */}
      <div className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Retour</span>
              </button>
              
              <div className="h-8 w-px bg-gray-300 dark:bg-dark-600"></div>
              
              <div>
                <div className="flex items-center gap-2">
                  <ListTodo className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    TODO Liste
                  </h1>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Procédure {procedureNumero}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 py-2 z-20">
                    <button
                      onClick={exportToExcel}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Export Excel
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-dark-700 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-red-600" />
                      Export PDF
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-semibold shadow-lg shadow-emerald-600/30"
              >
                <Plus className="w-5 h-5" />
                Nouvelle tâche
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <ListTodo className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En attente</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.enAttente}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminées</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.terminees}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-200 dark:border-dark-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">En retard</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.enRetard}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Titre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Assigné à
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date réalisation
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ListTodo className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {searchTerm ? 'Aucune tâche trouvée' : 'Aucune tâche pour le moment'}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="text-emerald-600 hover:text-emerald-700 font-semibold"
                          >
                            Créer votre première tâche
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-dark-900/50 transition-colors ${
                        isTaskLate(task) ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleTaskStatus(task.id)}
                            className="hover:scale-110 transition-transform"
                          >
                            {task.statut === 'terminee' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {task.numero}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold ${
                            task.statut === 'terminee' 
                              ? 'line-through text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.titre}
                          </span>
                          {task.notes && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {task.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {task.assigne_a}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${
                            isTaskLate(task) 
                              ? 'text-red-600 font-bold' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {task.echeance}
                          </span>
                          {isTaskLate(task) && (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatutColor(task.statut)}`}>
                          {getStatutLabel(task.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {task.date_realisation || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingTask) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTask(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: Rédiger le CCAP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Assigné à *
                  </label>
                  <input
                    type="text"
                    value={formData.assigne_a}
                    onChange={(e) => setFormData({ ...formData, assigne_a: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Échéance *
                  </label>
                  <input
                    type="date"
                    value={formData.echeance}
                    onChange={(e) => setFormData({ ...formData, echeance: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="en-attente">En attente</option>
                    <option value="en-cours">En cours</option>
                    <option value="terminee">Terminée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Date de réalisation
                  </label>
                  <input
                    type="date"
                    value={formData.date_realisation}
                    onChange={(e) => setFormData({ ...formData, date_realisation: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Notes ou commentaires..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTask(null);
                  resetForm();
                }}
                className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleAddTask}
                disabled={!formData.titre || !formData.assigne_a || !formData.echeance || saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/30"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingTask ? 'Modifier' : 'Créer'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
