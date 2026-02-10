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
  RefreshCw,
  FileDown,
  Trash,
  SquareCheck,
  Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';

interface TodoTask {
  id: string;
  numero: number;
  titre: string;
  categorie?: string;
  assigne_a: string;
  echeance: string;
  statut: 'en-attente' | 'en-cours' | 'terminee';
  date_realisation?: string;
  notes?: string;
}

// Liste prédéfinie des tâches du workflow d'achats publics
const TACHES_PREDEFINIES = [
  // En-tête
  { titre: "Fiche de suivi du dossier d'achat", categorie: "En-tête" },
  { titre: "Détail du projet", categorie: "En-tête" },
  { titre: "Procédure", categorie: "En-tête" },
  { titre: "Attribution", categorie: "En-tête" },
  
  // NO
  { titre: "NO - Initialisation", categorie: "Notification d'Opportunité" },
  { titre: "NO - Rédaction", categorie: "Notification d'Opportunité" },
  { titre: "NO - Correction", categorie: "Notification d'Opportunité" },
  { titre: "NO - Envoi en validation", categorie: "Notification d'Opportunité" },
  { titre: "NO - Correction après validation", categorie: "Notification d'Opportunité" },
  { titre: "NO - Envoi en validation finale", categorie: "Notification d'Opportunité" },
  { titre: "NO - Validée", categorie: "Notification d'Opportunité" },
  
  // DCE
  { titre: "DCE - Initialisation des documents", categorie: "DCE" },
  { titre: "DCE - Création du répertoire PC", categorie: "DCE" },
  { titre: "DCE - Création canal Teams et répertoire", categorie: "DCE" },
  { titre: "DCE - CCAP", categorie: "DCE" },
  { titre: "DCE - CCTP", categorie: "DCE" },
  { titre: "DCE - CCTG", categorie: "DCE" },
  { titre: "DCE - CRT", categorie: "DCE" },
  { titre: "DCE - RC", categorie: "DCE" },
  { titre: "DCE - ATTRI1", categorie: "DCE" },
  { titre: "DCE - BPU", categorie: "DCE" },
  { titre: "DCE - DQE", categorie: "DCE" },
  { titre: "DCE - CEDSO", categorie: "DCE" },
  { titre: "DCE - Annexe RGPD", categorie: "DCE" },
  { titre: "DCE - Annexe Indemnités Afpa", categorie: "DCE" },
  { titre: "DCE - Liste des centres", categorie: "DCE" },
  { titre: "DCE - Liste des plateformes comptables", categorie: "DCE" },
  
  // Publication et analyse
  { titre: "Publication de la procédure", categorie: "Publication" },
  { titre: "Extraction registres des retraits, dépôts, questions et réponses", categorie: "Suivi" },
  { titre: "Analyse des candidatures", categorie: "Analyse" },
  { titre: "Analyse technique", categorie: "Analyse" },
  { titre: "Finalisation AN01", categorie: "Analyse" },
  
  // RP
  { titre: "RP - Rédaction", categorie: "Rapport de Présentation" },
  { titre: "RP - Correction", categorie: "Rapport de Présentation" },
  { titre: "RP - Envoi en validation", categorie: "Rapport de Présentation" },
  { titre: "RP - Validation", categorie: "Rapport de Présentation" },
  
  // Notifications
  { titre: "Notifications - Rejets Dematis", categorie: "Notifications" },
  { titre: "Notifications - Attribution pressentie Dematis", categorie: "Notifications" },
  { titre: "Notifications - Notification Dematis", categorie: "Notifications" },
  
  // Post-attribution
  { titre: "Signature AE", categorie: "Post-attribution" },
  { titre: "Création FIC", categorie: "Post-attribution" },
  { titre: "Création fournisseur", categorie: "Post-attribution" },
  { titre: "Contrats + catalogues FINA", categorie: "Post-attribution" },
  { titre: "Communication interne (DSI ou Flash Achats)", categorie: "Post-attribution" },
  { titre: "Avis d'attribution Dematis", categorie: "Post-attribution" },
  { titre: "Données essentielles Dematis", categorie: "Post-attribution" },
  { titre: "Demande d'informations complémentaires", categorie: "Post-attribution" }
];

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
  const [showPredefinedModal, setShowPredefinedModal] = useState(false);
  const [filtreCategorie, setFiltreCategorie] = useState<string>('');
  const [selectedPredefinedTasks, setSelectedPredefinedTasks] = useState<Set<number>>(new Set());
  const [searchPredefined, setSearchPredefined] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    titre: '',
    categorie: '',
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
      categorie: formData.categorie,
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

  const handleDeleteSelected = () => {
    if (selectedTasks.size === 0) return;
    if (!confirm(`Voulez-vous vraiment supprimer ${selectedTasks.size} tâche(s) sélectionnée(s) ?`)) return;
    
    const updatedTasks = tasks.filter(t => !selectedTasks.has(t.id))
      .map((t, index) => ({ ...t, numero: index + 1 }));
    
    saveTasks(updatedTasks);
    setSelectedTasks(new Set());
  };

  const handleDeleteAll = () => {
    if (tasks.length === 0) return;
    if (!confirm('Attention : cette action va supprimer TOUTES les tâches. Voulez-vous continuer ?')) return;
    saveTasks([]);
    setSelectedTasks(new Set());
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleAllTasks = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleInitializePredefined = () => {
    if (selectedPredefinedTasks.size === 0) {
      alert('Veuillez sélectionner au moins une tâche à importer.');
      return;
    }

    const selectedIndices = Array.from(selectedPredefinedTasks) as number[];
    const newTasks: TodoTask[] = selectedIndices.map((index, idx) => {
      const tache = TACHES_PREDEFINIES[index];
      return {
        id: Date.now().toString() + '_' + idx,
        numero: tasks.length + idx + 1,
        titre: tache.titre,
        categorie: tache.categorie,
        assigne_a: procedureAcheteur || userEmail || '',
        echeance: '',
        statut: 'en-attente' as const,
        notes: ''
      };
    });

    saveTasks([...tasks, ...newTasks]);
    setShowPredefinedModal(false);
    setSelectedPredefinedTasks(new Set());
    setSearchPredefined('');
  };

  const togglePredefinedTask = (index: number) => {
    const newSelected = new Set(selectedPredefinedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPredefinedTasks(newSelected);
  };

  const togglePredefinedCategory = (categorie: string) => {
    const categoryTasks = TACHES_PREDEFINIES
      .map((t, idx) => ({ ...t, index: idx }))
      .filter(t => t.categorie === categorie);
    
    const categoryIndices = categoryTasks.map(t => t.index);
    const allSelected = categoryIndices.every(idx => selectedPredefinedTasks.has(idx));
    
    const newSelected = new Set(selectedPredefinedTasks);
    if (allSelected) {
      categoryIndices.forEach(idx => newSelected.delete(idx));
    } else {
      categoryIndices.forEach(idx => newSelected.add(idx));
    }
    setSelectedPredefinedTasks(newSelected);
  };

  const selectAllPredefined = () => {
    const filtered = getFilteredPredefinedTasks();
    if (filtered.every(t => selectedPredefinedTasks.has(t.index))) {
      // Tout désélectionner
      const newSelected = new Set(selectedPredefinedTasks);
      filtered.forEach(t => newSelected.delete(t.index));
      setSelectedPredefinedTasks(newSelected);
    } else {
      // Tout sélectionner
      const newSelected = new Set(selectedPredefinedTasks);
      filtered.forEach(t => newSelected.add(t.index));
      setSelectedPredefinedTasks(newSelected);
    }
  };

  const getFilteredPredefinedTasks = () => {
    const tasksWithIndex = TACHES_PREDEFINIES.map((t, idx) => ({ ...t, index: idx }));
    if (!searchPredefined) return tasksWithIndex;
    
    const term = searchPredefined.toLowerCase();
    return tasksWithIndex.filter(t => 
      t.titre.toLowerCase().includes(term) ||
      t.categorie?.toLowerCase().includes(term)
    );
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
      categorie: '',
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
      categorie: task.categorie || '',
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
    let filtered = tasks;
    
    // Filtre par catégorie
    if (filtreCategorie) {
      filtered = filtered.filter(t => t.categorie === filtreCategorie);
    }
    
    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.titre.toLowerCase().includes(term) ||
        t.assigne_a.toLowerCase().includes(term) ||
        t.categorie?.toLowerCase().includes(term) ||
        t.notes?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [tasks, searchTerm, filtreCategorie]);

  // Liste des catégories uniques
  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.categorie).filter(Boolean));
    return Array.from(cats).sort();
  }, [tasks]);

  // Export Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      tasks.map(t => ({
        'N°': t.numero,
        'Titre': t.titre,
        'Catégorie': t.categorie || '',
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
      head: [['N°', 'Titre', 'Catégorie', 'Assigné à', 'Échéance', 'Statut', 'Réalisation']],
      body: tasks.map(t => [
        t.numero,
        t.titre,
        t.categorie || '-',
        t.assigne_a,
        t.echeance,
        t.statut === 'terminee' ? 'Terminée' : t.statut === 'en-cours' ? 'En cours' : 'En attente',
        t.date_realisation || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [0, 77, 61] },
      styles: { fontSize: 7 }
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
  const hasAccess = true; // Accès pour tout le monde

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
        <div className="w-full px-6 py-4">
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
              {/* Bouton supprimer sélection */}
              {selectedTasks.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                >
                  <Trash className="w-4 h-4" />
                  Supprimer ({selectedTasks.size})
                </button>
              )}

              {/* Bouton supprimer tout */}
              {tasks.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  className="flex items-center gap-2 px-4 py-2 text-red-700 hover:text-red-800 border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-semibold"
                >
                  <Trash className="w-4 h-4" />
                  Tout supprimer
                </button>
              )}

              {/* Bouton initialiser avec tâches prédéfinies */}
              <button
                onClick={() => setShowPredefinedModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold"
              >
                <FileDown className="w-4 h-4" />
                Tâches standard
              </button>

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
      <div className="w-full px-6 py-6">
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

        {/* Search and Filter Bar */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par catégorie */}
          {categories.length > 0 && (
            <select
              value={filtreCategorie}
              onChange={(e) => setFiltreCategorie(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tasks Table */}
        <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
            <table className="w-full min-w-[1400px]">
              <thead className="bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 text-left w-12">
                    <button
                      onClick={toggleAllTasks}
                      className="hover:scale-110 transition-transform"
                    >
                      {selectedTasks.size === filteredTasks.length && filteredTasks.length > 0 ? (
                        <SquareCheck className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-16">
                    N°
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[250px]">
                    Titre
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[180px]">
                    Catégorie
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider min-w-[180px]">
                    Assigné à
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-36">
                    Échéance
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                    Statut
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-36">
                    Date réalisation
                  </th>
                  <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <ListTodo className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {searchTerm || filtreCategorie ? 'Aucune tâche trouvée' : 'Aucune tâche pour le moment'}
                        </p>
                        {!searchTerm && !filtreCategorie && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => setShowAddModal(true)}
                              className="text-emerald-600 hover:text-emerald-700 font-semibold"
                            >
                              Créer une tâche
                            </button>
                            <span className="text-gray-300">ou</span>
                            <button
                              onClick={() => setShowPredefinedModal(true)}
                              className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Importer les tâches standard
                            </button>
                          </div>
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
                      } ${selectedTasks.has(task.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleTaskSelection(task.id)}
                          className="hover:scale-110 transition-transform"
                        >
                          {selectedTasks.has(task.id) ? (
                            <SquareCheck className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
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
                      <td className="px-4 py-4">
                        <div className="flex flex-col max-w-[250px]">
                          <span className={`text-sm font-semibold ${
                            task.statut === 'terminee' 
                              ? 'line-through text-gray-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {task.titre}
                          </span>
                          {task.notes && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {task.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {task.categorie && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            {task.categorie}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {task.assigne_a}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className={`text-sm ${
                            isTaskLate(task) 
                              ? 'text-red-600 font-bold' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {task.echeance}
                          </span>
                          {isTaskLate(task) && (
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatutColor(task.statut)}`}>
                          {getStatutLabel(task.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {task.date_realisation || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
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

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <input
                  type="text"
                  value={formData.categorie || ''}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Ex: DCE, NO, RP..."
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
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

      {/* Predefined Tasks Modal */}
      {showPredefinedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-[95vw] h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ListTodo className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Tâches standard du workflow d'achats publics
                  </h2>
                  <p className="text-sm text-blue-100 mt-0.5">
                    {selectedPredefinedTasks.size} tâche{selectedPredefinedTasks.size > 1 ? 's' : ''} sélectionnée{selectedPredefinedTasks.size > 1 ? 's' : ''} sur {TACHES_PREDEFINIES.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPredefinedModal(false);
                  setSelectedPredefinedTasks(new Set());
                  setSearchPredefined('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Search and Actions Bar */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900 flex-shrink-0">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une tâche ou catégorie..."
                    value={searchPredefined}
                    onChange={(e) => setSearchPredefined(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <button
                  onClick={selectAllPredefined}
                  className="px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                >
                  {getFilteredPredefinedTasks().every(t => selectedPredefinedTasks.has(t.index)) ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
            </div>

            {/* Info Banner */}
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">ℹ</span>
                  </div>
                  <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                    <p className="font-semibold">Comment ça marche ?</p>
                    <ul className="space-y-1 ml-1">
                      <li>• Cochez les tâches que vous souhaitez importer</li>
                      <li>• Assignation automatique à : <span className="font-bold">{procedureAcheteur || userEmail}</span></li>
                      <li>• Aucune échéance automatique (à renseigner après import si besoin)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks List - Scrollable */}
            <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
              <div className="space-y-4 pb-4">
                {Object.entries(
                  getFilteredPredefinedTasks().reduce((acc, tache) => {
                    const cat = tache.categorie || 'Autre';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(tache);
                    return acc;
                  }, {} as Record<string, Array<typeof TACHES_PREDEFINIES[0] & { index: number }>>)
                ).map(([categorie, taches]) => {
                  const allCategorySelected = taches.every(t => selectedPredefinedTasks.has(t.index));
                  const someCategorySelected = taches.some(t => selectedPredefinedTasks.has(t.index));
                  
                  return (
                    <div key={categorie} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Category Header */}
                      <div 
                        className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-dark-900 dark:to-dark-800 px-4 py-3 border-b border-gray-200 dark:border-dark-700 cursor-pointer hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-colors"
                        onClick={() => togglePredefinedCategory(categorie)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center">
                              {allCategorySelected ? (
                                <SquareCheck className="w-5 h-5 text-blue-600" />
                              ) : someCategorySelected ? (
                                <div className="w-5 h-5 border-2 border-blue-600 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
                                </div>
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {categorie}
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {taches.filter(t => selectedPredefinedTasks.has(t.index)).length} / {taches.length}
                            </span>
                          </div>
                          <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                            {allCategorySelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Tasks in Category */}
                      <div className="divide-y divide-gray-100 dark:divide-dark-700">
                        {taches.map((tache) => (
                          <div
                            key={tache.index}
                            onClick={() => togglePredefinedTask(tache.index)}
                            className={`px-4 py-3 cursor-pointer transition-all ${
                              selectedPredefinedTasks.has(tache.index)
                                ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                : 'hover:bg-gray-50 dark:hover:bg-dark-900'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center flex-shrink-0">
                                {selectedPredefinedTasks.has(tache.index) ? (
                                  <SquareCheck className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium transition-colors ${
                                  selectedPredefinedTasks.has(tache.index)
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {tache.titre}
                                </p>
                              </div>
                              {selectedPredefinedTasks.has(tache.index) && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              {getFilteredPredefinedTasks().length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune tâche trouvée</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Essayez un autre terme de recherche</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 dark:border-dark-700 px-6 py-4 bg-gray-50 dark:bg-dark-900 rounded-b-2xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-blue-600 dark:text-blue-400">{selectedPredefinedTasks.size}</span> tâche{selectedPredefinedTasks.size > 1 ? 's' : ''} prête{selectedPredefinedTasks.size > 1 ? 's' : ''} à être importée{selectedPredefinedTasks.size > 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowPredefinedModal(false);
                      setSelectedPredefinedTasks(new Set());
                      setSearchPredefined('');
                    }}
                    className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg font-semibold transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleInitializePredefined}
                    disabled={selectedPredefinedTasks.size === 0 || saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-semibold transition-all flex items-center gap-2 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 disabled:shadow-none"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Importation...
                      </>
                    ) : (
                      <>
                        <FileDown className="w-5 h-5" />
                        Importer {selectedPredefinedTasks.size > 0 ? `${selectedPredefinedTasks.size} tâche${selectedPredefinedTasks.size > 1 ? 's' : ''}` : ''}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
