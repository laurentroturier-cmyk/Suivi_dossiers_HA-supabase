import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Save, AlertCircle, Search, X, FileSpreadsheet, Copy } from 'lucide-react';
import { Critere, SousCritere, Question, QuestionnaireState, Procedure } from './types';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';

const QuestionnaireTechnique: React.FC = () => {
  const [state, setState] = useState<QuestionnaireState>({
    criteres: []
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Procedure[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [hasExistingQuestionnaire, setHasExistingQuestionnaire] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [selectedLotsForDuplication, setSelectedLotsForDuplication] = useState<number[]>([]);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Génération d'ID unique
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Recherche de procédure par numéro
  const searchProcedures = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    setError('');

    try {
      const { data, error: err } = await supabase
        .from('procédures')
        .select('NumProc, "numero court procédure afpa", "Numéro de procédure (Afpa)", "Nom de la procédure", "Nombre de lots"')
        .ilike('numero court procédure afpa', `%${query}%`)
        .limit(10);

      if (err) throw err;

      // Mapper les résultats avec les bons noms de colonnes
      const results = (data || []).map((proc: any) => ({
        id: proc['NumProc'],
        NumProc: proc['NumProc'],
        'numero court procédure afpa': proc['numero court procédure afpa'],
        'Numéro de procédure (Afpa)': proc['Numéro de procédure (Afpa)'],
        nom_procedure: proc['Nom de la procédure'],
        nombre_lots: proc['Nombre de lots'] || 0
      }));

      setSearchResults(results);
      setShowSearchResults(true);
      setError('');
    } catch (err: any) {
      console.error('Erreur recherche procédure:', err);
      setError(err?.message || 'Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  // Sélection d'une procédure
  const selectProcedure = async (procedure: Procedure) => {
    setState(prev => ({
      ...prev,
      procedure,
      numeroLot: procedure.nombre_lots > 0 ? 1 : undefined
    }));
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Charger le questionnaire s'il existe
    await loadQuestionnaireFromDatabase(procedure.NumProc || procedure.id);
  };

  // Supprimer la procédure sélectionnée
  const removeProcedure = () => {
    setState(prev => ({
      ...prev,
      procedure: undefined,
      numeroLot: undefined
    }));
    setHasExistingQuestionnaire(false);
  };

  // Charger le questionnaire depuis la base de données
  const loadQuestionnaireFromDatabase = async (numProc: string) => {
    setIsLoadingFromDb(true);
    setError('');
    
    try {
      console.log('🔍 Chargement du questionnaire pour NumProc:', numProc, 'Lot:', state.numeroLot);
      
      // Si pas de numéro de lot, on ne peut pas charger
      if (!state.numeroLot) {
        console.log('ℹ️ Pas de numéro de lot défini, chargement annulé');
        setHasExistingQuestionnaire(false);
        setIsLoadingFromDb(false);
        return;
      }

      // Charger depuis la nouvelle table questionnaires_techniques
      const { data, error: fetchError } = await supabase
        .from('questionnaires_techniques')
        .select('qt_data, updated_at')
        .eq('num_proc', numProc)
        .eq('numero_lot', state.numeroLot)
        .single();

      if (fetchError) {
        // Si erreur PGRST116 (pas de ligne trouvée), c'est normal
        if (fetchError.code === 'PGRST116') {
          console.log('ℹ️ Aucun questionnaire sauvegardé pour ce lot, réinitialisation');
          setHasExistingQuestionnaire(false);
          // Réinitialiser les critères pour ce nouveau lot
          setState(prev => ({
            ...prev,
            criteres: []
          }));
          setIsLoadingFromDb(false);
          return;
        }
        console.error('❌ Erreur lors du chargement:', fetchError);
        throw fetchError;
      }

      console.log('📦 Données reçues depuis questionnaires_techniques:', data);

      if (data?.qt_data) {
        console.log('✅ Questionnaire trouvé, dernière MAJ:', data.updated_at);
        setHasExistingQuestionnaire(true);
        
        // Charger automatiquement le questionnaire
        const savedData = data.qt_data;
        setState(prev => ({
          ...prev,
          criteres: savedData.criteres || []
        }));
        
        console.log('✅ Questionnaire chargé avec succès depuis la base');
      } else {
        console.log('ℹ️ Aucun questionnaire sauvegardé pour cette procédure/lot, réinitialisation');
        setHasExistingQuestionnaire(false);
        // Réinitialiser les critères
        setState(prev => ({
          ...prev,
          criteres: []
        }));
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement questionnaire:', err);
      setError(err.message || 'Erreur lors du chargement du questionnaire');
      setHasExistingQuestionnaire(false);
    } finally {
      setIsLoadingFromDb(false);
    }
  };

  // Sauvegarde du questionnaire dans la base de données
  const saveQuestionnaireToDatabase = async () => {
    if (!state.procedure?.NumProc) {
      setError('Aucune procédure sélectionnée pour la sauvegarde');
      return;
    }

    if (!state.numeroLot) {
      setError('Veuillez sélectionner un numéro de lot');
      return;
    }

    setIsSavingToDb(true);
    setError('');
    setSaveSuccess(false);

    try {
      // Préparer les données à sauvegarder
      const questionnaireData = {
        criteres: state.criteres,
        savedAt: new Date().toISOString(),
        version: '1.0'
      };

      console.log('💾 Sauvegarde du questionnaire pour NumProc:', state.procedure.NumProc, 'Lot:', state.numeroLot);
      console.log('📝 Données à sauvegarder:', questionnaireData);

      // Upsert dans la table questionnaires_techniques
      const { data, error: upsertError } = await supabase
        .from('questionnaires_techniques')
        .upsert({
          num_proc: state.procedure.NumProc,
          numero_lot: state.numeroLot,
          qt_data: questionnaireData
        }, {
          onConflict: 'num_proc,numero_lot' // Clé unique
        })
        .select();

      if (upsertError) {
        console.error('❌ Erreur lors de la sauvegarde:', upsertError);
        throw upsertError;
      }

      console.log('✅ Questionnaire sauvegardé avec succès:', data);
      setHasExistingQuestionnaire(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Erreur sauvegarde questionnaire:', err);
      setError(err.message || 'Erreur lors de la sauvegarde dans la base de données');
    } finally {
      setIsSavingToDb(false);
    }
  };

  // Dupliquer le questionnaire vers d'autres lots
  const duplicateQuestionnaireToLots = async () => {
    if (!state.procedure?.NumProc || !state.numeroLot || selectedLotsForDuplication.length === 0) {
      setError('Veuillez sélectionner au moins un lot de destination');
      return;
    }

    if (state.criteres.length === 0) {
      setError('Le questionnaire actuel est vide, rien à dupliquer');
      return;
    }

    setIsDuplicating(true);
    setError('');

    try {
      // Préparer les données à dupliquer
      const questionnaireData = {
        criteres: state.criteres,
        savedAt: new Date().toISOString(),
        version: '1.0',
        duplicatedFrom: state.numeroLot
      };

      // Créer un tableau de promesses pour insérer dans tous les lots sélectionnés
      const upsertPromises = selectedLotsForDuplication.map(lotNumber =>
        supabase
          .from('questionnaires_techniques')
          .upsert({
            num_proc: state.procedure!.NumProc,
            numero_lot: lotNumber,
            qt_data: questionnaireData
          }, {
            onConflict: 'num_proc,numero_lot'
          })
      );

      // Exécuter toutes les insertions en parallèle
      const results = await Promise.all(upsertPromises);

      // Vérifier les erreurs
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('❌ Erreurs lors de la duplication:', errors);
        throw new Error(`Erreur lors de la duplication vers ${errors.length} lot(s)`);
      }

      console.log(`✅ Questionnaire dupliqué avec succès vers ${selectedLotsForDuplication.length} lot(s)`);
      alert(`✅ Questionnaire dupliqué avec succès vers les lots : ${selectedLotsForDuplication.join(', ')}`);
      
      // Fermer la modal et réinitialiser
      setShowDuplicateModal(false);
      setSelectedLotsForDuplication([]);
    } catch (err: any) {
      console.error('❌ Erreur duplication questionnaire:', err);
      setError(err.message || 'Erreur lors de la duplication');
    } finally {
      setIsDuplicating(false);
    }
  };

  // Ouvrir la modal de duplication
  const openDuplicateModal = () => {
    if (!state.procedure || !state.numeroLot) {
      setError('Veuillez sélectionner une procédure et un lot');
      return;
    }
    if (state.criteres.length === 0) {
      setError('Le questionnaire actuel est vide, rien à dupliquer');
      return;
    }
    setShowDuplicateModal(true);
    setSelectedLotsForDuplication([]);
  };

  // Gérer la sélection/désélection d'un lot
  const toggleLotSelection = (lotNumber: number) => {
    setSelectedLotsForDuplication(prev => 
      prev.includes(lotNumber)
        ? prev.filter(n => n !== lotNumber)
        : [...prev, lotNumber]
    );
  };

  // Calcul du total des points d'un critère
  const calculerTotalCritere = (critere: Critere): number => {
    return critere.sousCriteres.reduce((totalCritere, sousCritere) => {
      return totalCritere + sousCritere.questions.reduce((totalSC, question) => {
        return totalSC + (question.pointsMax || 0);
      }, 0);
    }, 0);
  };

  // === GESTION DES CRITÈRES (Niveau 1) ===
  const ajouterCritere = () => {
    const nouveauCritere: Critere = {
      id: generateId(),
      nom: 'Nouveau critère',
      sousCriteres: [],
      isExpanded: true
    };
    setState(prev => ({
      ...prev,
      criteres: [...prev.criteres, nouveauCritere]
    }));
  };

  const modifierNomCritere = (critereId: string, nouveauNom: string) => {
    setState(prev => ({
      ...prev,
      criteres: prev.criteres.map(c =>
        c.id === critereId ? { ...c, nom: nouveauNom } : c
      )
    }));
  };

  const supprimerCritere = (critereId: string) => {
    if (window.confirm('Supprimer ce critère et tout son contenu ?')) {
      setState(prev => ({
        ...prev,
        criteres: prev.criteres.filter(c => c.id !== critereId)
      }));
    }
  };

  const toggleCritere = (critereId: string) => {
    setState(prev => ({
      ...prev,
      criteres: prev.criteres.map(c =>
        c.id === critereId ? { ...c, isExpanded: !c.isExpanded } : c
      )
    }));
  };

  // === GESTION DES SOUS-CRITÈRES (Niveau 2) ===
  const ajouterSousCritere = (critereId: string) => {
    const nouveauSousCritere: SousCritere = {
      id: generateId(),
      nom: 'Nouveau sous-critère',
      questions: []
    };
    setState(prev => ({
      ...prev,
      criteres: prev.criteres.map(c =>
        c.id === critereId
          ? { ...c, sousCriteres: [...c.sousCriteres, nouveauSousCritere], isExpanded: true }
          : c
      )
    }));
  };

  const modifierNomSousCritere = (critereId: string, sousCritereId: string, nouveauNom: string) => {
    setState(prev => ({
      ...prev,
      criteres: prev.criteres.map(c =>
        c.id === critereId
          ? {
              ...c,
              sousCriteres: c.sousCriteres.map(sc =>
                sc.id === sousCritereId ? { ...sc, nom: nouveauNom } : sc
              )
            }
          : c
      )
    }));
  };

  const supprimerSousCritere = (critereId: string, sousCritereId: string) => {
    if (window.confirm('Supprimer ce sous-critère et toutes ses questions ?')) {
      setState(prev => ({
        ...prev,
        criteres: prev.criteres.map(c =>
          c.id === critereId
            ? { ...c, sousCriteres: c.sousCriteres.filter(sc => sc.id !== sousCritereId) }
            : c
        )
      }));
    }
  };

  // === GESTION DES QUESTIONS (Niveau 3) ===
  const ajouterQuestion = (critereId: string, sousCritereId: string) => {
    const nouvelleQuestion: Question = {
      id: generateId(),
      intitule: 'Nouvelle question',
      pointsMax: 10,
      description: '',
      evaluateurs: ''
    };
    setState(prev => ({
      ...prev,
      criteres: prev.criteres.map(c =>
        c.id === critereId
          ? {
              ...c,
              sousCriteres: c.sousCriteres.map(sc =>
                sc.id === sousCritereId
                  ? { ...sc, questions: [...sc.questions, nouvelleQuestion] }
                  : sc
              )
            }
          : c
      )
    }));
  };

  const modifierQuestion = (
    critereId: string,
    sousCritereId: string,
    questionId: string,
    champ: keyof Question,
    valeur: any
  ) => {
    setState(prev => ({
      ...prev,
      criteres: prev.criteres.map(c =>
        c.id === critereId
          ? {
              ...c,
              sousCriteres: c.sousCriteres.map(sc =>
                sc.id === sousCritereId
                  ? {
                      ...sc,
                      questions: sc.questions.map(q =>
                        q.id === questionId ? { ...q, [champ]: valeur } : q
                      )
                    }
                  : sc
              )
            }
          : c
      )
    }));
  };

  const supprimerQuestion = (critereId: string, sousCritereId: string, questionId: string) => {
    if (window.confirm('Supprimer cette question ?')) {
      setState(prev => ({
        ...prev,
        criteres: prev.criteres.map(c =>
          c.id === critereId
            ? {
                ...c,
                sousCriteres: c.sousCriteres.map(sc =>
                  sc.id === sousCritereId
                    ? { ...sc, questions: sc.questions.filter(q => q.id !== questionId) }
                    : sc
                )
              }
            : c
        )
      }));
    }
  };

  // Export Excel du questionnaire
  const exportQuestionnaireToExcel = () => {
    try {
      // Créer le workbook
      const wb = XLSX.utils.book_new();

      // FEUILLE 1: Vue détaillée avec structure hiérarchique
      const detailData: any[][] = [];
      
      // En-tête du fichier
      detailData.push(['QUESTIONNAIRE TECHNIQUE - CONFIGURATION DÉTAILLÉE']);
      detailData.push([]);
      detailData.push(['Procédure:', state.procedure?.['Numéro de procédure (Afpa)'] || 'Non définie']);
      detailData.push(['Nom:', state.procedure?.nom_procedure || '']);
      detailData.push(['Lot:', state.numeroLot || 'N/A']);
      detailData.push(['Date d\'export:', new Date().toLocaleString('fr-FR')]);
      detailData.push([]);
      
      // Calculer les totaux
      const totalCriteres = state.criteres.length;
      const totalSousCriteres = state.criteres.reduce((sum, c) => sum + c.sousCriteres.length, 0);
      const totalQuestions = state.criteres.reduce((sum, c) => 
        sum + c.sousCriteres.reduce((s, sc) => s + sc.questions.length, 0), 0
      );
      const totalPointsMax = state.criteres.reduce((sum, c) => 
        sum + c.sousCriteres.reduce((s, sc) => 
          s + sc.questions.reduce((q, quest) => q + (quest.pointsMax || 0), 0), 0
        ), 0
      );
      
      detailData.push(['TOTAUX:', `${totalCriteres} critères`, `${totalSousCriteres} sous-critères`, `${totalQuestions} questions`, `${totalPointsMax} points max`]);
      detailData.push([]);
      detailData.push([]);

      // Structure détaillée
      state.criteres.forEach((critere, critereIndex) => {
        // Ligne CRITERE (niveau 1)
        detailData.push([
          `CRITÈRE ${critereIndex + 1}`,
          critere.nom,
          `Pondération: ${critere.ponderation}%`,
          `${critere.sousCriteres.length} sous-critère(s)`,
          ''
        ]);
        detailData.push([]);

        critere.sousCriteres.forEach((sousCritere, sousCritereIndex) => {
          // Ligne SOUS-CRITERE (niveau 2)
          detailData.push([
            '',
          `  ├─ SOUS-CRITÈRE ${critereIndex + 1}.${sousCritereIndex + 1}`,
            sousCritere.nom,
            `Pondération: ${sousCritere.ponderation}%`,
            `${sousCritere.questions.length} question(s)`
          ]);
          
          // En-tête des questions
          if (sousCritere.questions.length > 0) {
            detailData.push([
              '',
              '',
              'N°',
              'Question',
              'Points Max',
              'Type',
              'Obligatoire',
              'Description/Attente',
              'Évaluateurs'
            ]);

            // Lignes QUESTIONS (niveau 3)
            sousCritere.questions.forEach((question, questionIndex) => {
              const numeroQuestion = `${critereIndex + 1}.${sousCritereIndex + 1}.${questionIndex + 1}`;
              detailData.push([
                '',
                '',
                numeroQuestion,
                question.intitule || '-',
                question.pointsMax || 0,
                question.type || 'Texte libre',
                question.obligatoire ? 'Oui' : 'Non',
                question.description || '-',
                question.evaluateurs || '-'
              ]);
            });
          }
          
          detailData.push([]); // Ligne vide entre sous-critères
        });

        detailData.push([]); // Ligne vide entre critères
        detailData.push([]); // Ligne vide supplémentaire
      });

      // Créer la feuille avec les données
      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      
      // Définir les largeurs de colonnes
      wsDetail['!cols'] = [
        { wch: 18 },  // Niveau critère
        { wch: 35 },  // Niveau sous-critère
        { wch: 8 },   // N°
        { wch: 70 },  // Question (plus large)
        { wch: 12 },  // Points Max
        { wch: 18 },  // Type
        { wch: 12 },  // Obligatoire
        { wch: 60 },  // Description/Attente
        { wch: 40 }   // Évaluateurs
      ];

      XLSX.utils.book_append_sheet(wb, wsDetail, 'Structure détaillée');

      // FEUILLE 2: Vue Synthèse par critère
      const syntheseData: any[] = [];
      state.criteres.forEach((critere, idx) => {
        const nbSousCriteres = critere.sousCriteres.length;
        const nbQuestions = critere.sousCriteres.reduce((sum, sc) => sum + sc.questions.length, 0);
        const pointsMax = critere.sousCriteres.reduce((sum, sc) => 
          sum + sc.questions.reduce((s, q) => s + (q.pointsMax || 0), 0), 0
        );
        
        syntheseData.push({
          'N°': idx + 1,
          'Critère': critere.nom,
          'Pondération (%)': critere.ponderation,
          'Nb Sous-critères': nbSousCriteres,
          'Nb Questions': nbQuestions,
          'Points Max Total': pointsMax,
          'Points moyens/question': nbQuestions > 0 ? (pointsMax / nbQuestions).toFixed(1) : 0
        });
      });

      if (syntheseData.length > 0) {
        const wsSynthese = XLSX.utils.json_to_sheet(syntheseData);
        wsSynthese['!cols'] = [
          { wch: 8 },   // N°
          { wch: 40 },  // Critère
          { wch: 18 },  // Pondération
          { wch: 18 },  // Nb Sous-critères
          { wch: 15 },  // Nb Questions
          { wch: 18 },  // Points Max
          { wch: 22 }   // Moyenne
        ];
        XLSX.utils.book_append_sheet(wb, wsSynthese, 'Synthèse critères');
      }

      // FEUILLE 3: Liste complète des questions (tableau plat pour analyse)
      const questionsData: any[] = [];
      let numQuestion = 1;
      
      state.criteres.forEach((critere, critereIdx) => {
        critere.sousCriteres.forEach((sousCritere, scIdx) => {
          sousCritere.questions.forEach((question, qIdx) => {
            const numeroComplet = `${critereIdx + 1}.${scIdx + 1}.${qIdx + 1}`;
            questionsData.push({
              'N° Global': numQuestion++,
              'N° Hiérarchique': numeroComplet,
              'Critère N°': critereIdx + 1,
              'Critère': critere.nom,
              'Pond. Critère (%)': critere.ponderation,
              'Sous-critère N°': `${critereIdx + 1}.${scIdx + 1}`,
              'Sous-critère': sousCritere.nom,
              'Pond. S-C (%)': sousCritere.ponderation,
              'N° Question': qIdx + 1,
              'Question': question.intitule || '-',
              'Points Max': question.pointsMax || 0,
              'Type Réponse': 'Texte libre',
              'Obligatoire': 'Non',
              'Description/Attente': question.description || '-',
              'Évaluateurs': question.evaluateurs || '-'
            });
          });
        });
      });

      if (questionsData.length > 0) {
        const wsQuestions = XLSX.utils.json_to_sheet(questionsData);
        wsQuestions['!cols'] = [
          { wch: 12 },  // N° Global
          { wch: 16 },  // N° Hiérarchique (1.1.1)
          { wch: 12 },  // Critère N°
          { wch: 30 },  // Critère
          { wch: 16 },  // Pond. Critère
          { wch: 16 },  // Sous-critère N°
          { wch: 30 },  // Sous-critère
          { wch: 14 },  // Pond. S-C
          { wch: 12 },  // N° Question
          { wch: 70 },  // Question (texte complet)
          { wch: 12 },  // Points Max
          { wch: 18 },  // Type
          { wch: 12 },  // Obligatoire
          { wch: 60 },  // Description/Attente
          { wch: 40 }   // Évaluateurs
        ];
        XLSX.utils.book_append_sheet(wb, wsQuestions, 'Toutes les questions');
      }

      // Générer le nom du fichier
      const procedureRef = state.procedure?.['Numéro de procédure (Afpa)'] || 'questionnaire';
      const lotSuffix = state.numeroLot ? `_lot${state.numeroLot}` : '';
      const fileName = `QT_${procedureRef}${lotSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Télécharger
      XLSX.writeFile(wb, fileName);
      
      console.log('✅ Export Excel réussi:', fileName);
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      setError('Erreur lors de l\'export Excel');
    }
  };

  // Recharger le questionnaire quand le numéro de lot change
  useEffect(() => {
    if (state.procedure?.NumProc && state.numeroLot) {
      console.log('🔄 Changement de lot détecté, rechargement du QT...');
      loadQuestionnaireFromDatabase(state.procedure.NumProc);
    }
  }, [state.numeroLot]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration du Questionnaire</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Structure hiérarchique d'évaluation</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportQuestionnaireToExcel}
                disabled={state.criteres.length === 0}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-full font-medium transition shadow-md"
                title="Exporter la configuration en Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exporter Excel
              </button>
              <button
                onClick={ajouterCritere}
                className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white px-6 py-2.5 rounded-full font-medium transition shadow-md"
              >
                <Plus className="w-4 h-4" />
                Ajouter un critère
              </button>
            </div>
          </div>

          {/* Section Procédure */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-teal-300 dark:border-teal-700 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Affectation à une procédure</h2>
            
            {!state.procedure ? (
              <div className="space-y-4">
                {/* Champ de recherche */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numéro court procédure Afpa
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchProcedures(e.target.value);
                      }}
                      onFocus={() => searchQuery && setShowSearchResults(true)}
                      placeholder="Rechercher par numéro..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {isSearching && (
                      <span className="absolute right-3 top-3 text-gray-400">⟳</span>
                    )}
                  </div>

                  {/* Résultats de recherche */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {searchResults.map((proc) => {
                        const numero =
                          proc["numero court procédure afpa"] ||
                          proc['Numéro de procédure (Afpa)'] ||
                          'Numéro de procédure non renseigné';
                        return (
                        <button
                          key={proc.id}
                          onClick={() => selectProcedure(proc)}
                          className="w-full text-left px-4 py-3 hover:bg-teal-50 dark:hover:bg-teal-900/30 border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{numero}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{proc.nom_procedure}</div>
                          {proc.nombre_lots > 0 && (
                            <div className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                              {proc.nombre_lots} lot{proc.nombre_lots > 1 ? 's' : ''}
                            </div>
                          )}
                        </button>
                      );
                      })}
                    </div>
                  )}

                  {showSearchResults && searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center text-gray-500 dark:text-gray-400 z-10">
                      Aucune procédure trouvée
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Indicateur de chargement */}
                {isLoadingFromDb && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-blue-700 dark:text-blue-300 font-medium">Chargement du questionnaire...</span>
                  </div>
                )}

                {/* Indicateur questionnaire existant */}
                {hasExistingQuestionnaire && !isLoadingFromDb && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-700 dark:text-green-300 font-medium">
                      ✅ Questionnaire chargé depuis la base de données
                    </span>
                  </div>
                )}

                {/* Informations procédure sélectionnée */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-700">
                    <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1">
                      ID Procédure (NumProc)
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{state.procedure.NumProc || state.procedure.id}</p>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-700">
                    <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1">
                      Numéro de procédure (Afpa)
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {state.procedure['Numéro de procédure (Afpa)'] ||
                        state.procedure["numero court procédure afpa"] ||
                        state.procedure.numero_procedure ||
                        'Non renseigné'}
                    </p>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 border border-teal-200 dark:border-teal-700">
                    <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wide mb-1">
                      Nom de la procédure
                    </label>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{state.procedure.nom_procedure}</p>
                  </div>
                </div>

                {/* Sélection du lot si plusieurs */}
                {state.procedure.nombre_lots > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                    <label className="block text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                      Numéro du lot
                    </label>
                    <select
                      value={state.numeroLot || ''}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        numeroLot: parseInt(e.target.value)
                      }))}
                      className="w-full px-4 py-2 border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {Array.from({ length: state.procedure.nombre_lots }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Lot {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Bouton retirer procédure */}
                <button
                  onClick={removeProcedure}
                  className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30 px-4 py-2 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                  Changer de procédure
                </button>

                {/* Boutons d'action */}
                {state.criteres.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={saveQuestionnaireToDatabase}
                        disabled={isSavingToDb}
                        className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm ${
                          saveSuccess
                            ? 'bg-green-600 text-white'
                            : 'bg-teal-800 hover:bg-teal-900 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSavingToDb ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enregistrement...
                          </>
                        ) : saveSuccess ? (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Enregistré dans la procédure !
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            Enregistrer dans la procédure {state.procedure.NumProc}
                          </>
                        )}
                      </button>

                      <button
                        onClick={openDuplicateModal}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-sm"
                      >
                        <Copy className="w-5 h-5" />
                        Dupliquer vers d'autres lots
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>Les modifications sont enregistrées par lot</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Liste des critères */}
        {state.criteres.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Aucun critère défini. Commencez par ajouter un critère.</p>
          </div>
        )}

        <div className="space-y-4">
          {state.criteres.map((critere, critereIndex) => {
            const totalPoints = calculerTotalCritere(critere);
            return (
              <div key={critere.id} className="bg-white dark:bg-gray-800 rounded-xl border-2 border-teal-300 dark:border-teal-700 overflow-hidden shadow-sm">
                {/* Bandeau Critère */}
                <div className="bg-teal-100 dark:bg-teal-900/30 border-b border-teal-300 dark:border-teal-700 p-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCritere(critere.id)}
                      className="text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800/50 p-1 rounded"
                    >
                      {critere.isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <span className="font-bold text-teal-950 dark:text-teal-200 text-sm">Critère {critereIndex + 1}</span>
                    <input
                      type="text"
                      value={critere.nom}
                      onChange={(e) => modifierNomCritere(critere.id, e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-700 border border-teal-300 dark:border-teal-600 rounded px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Nom du critère"
                    />
                    <div className="flex items-center gap-2 bg-teal-200 dark:bg-teal-800/50 px-3 py-1.5 rounded">
                      <span className="text-xs font-medium text-teal-900 dark:text-teal-300">Total:</span>
                      <span className="font-bold text-teal-900 dark:text-teal-200">{totalPoints} pts</span>
                    </div>
                    <button
                      onClick={() => supprimerCritere(critere.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"
                      title="Supprimer le critère"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contenu du critère */}
                {critere.isExpanded && (
                  <div className="p-4 space-y-4">
                    {/* Bouton ajouter sous-critère */}
                    <button
                      onClick={() => ajouterSousCritere(critere.id)}
                      className="flex items-center gap-2 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/40 px-3 py-2 rounded text-sm font-medium transition"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un sous-critère
                    </button>

                    {/* Liste des sous-critères */}
                    {critere.sousCriteres.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic pl-4">Aucun sous-critère défini</p>
                    )}

                    {critere.sousCriteres.map((sousCritere, scIndex) => (
                      <div key={sousCritere.id} className="ml-8 border-l-2 border-teal-400 dark:border-teal-700 pl-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                            {critereIndex + 1}.{scIndex + 1}
                          </span>
                          <input
                            type="text"
                            value={sousCritere.nom}
                            onChange={(e) => modifierNomSousCritere(critere.id, sousCritere.id, e.target.value)}
                            className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Nom du sous-critère"
                          />
                          <button
                            onClick={() => supprimerSousCritere(critere.id, sousCritere.id)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                            title="Supprimer le sous-critère"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bouton ajouter question */}
                        <button
                          onClick={() => ajouterQuestion(critere.id, sousCritere.id)}
                          className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800/40 px-2 py-1 rounded mb-2"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter une question
                        </button>

                        {/* Liste des questions */}
                        {sousCritere.questions.length === 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic ml-4">Aucune question définie</p>
                        )}

                        <div className="space-y-3">
                          {sousCritere.questions.map((question, qIndex) => (
                            <div key={question.id} className="ml-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                              <div className="flex items-start gap-3 mb-2">
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-2">
                                  {critereIndex + 1}.{scIndex + 1}.{qIndex + 1}
                                </span>
                                <input
                                  type="text"
                                  value={question.intitule}
                                  onChange={(e) =>
                                    modifierQuestion(critere.id, sousCritere.id, question.id, 'intitule', e.target.value)
                                  }
                                  className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="Intitulé de la question"
                                />
                                <input
                                  type="number"
                                  value={question.pointsMax}
                                  onChange={(e) =>
                                    modifierQuestion(critere.id, sousCritere.id, question.id, 'pointsMax', parseInt(e.target.value) || 0)
                                  }
                                  className="w-20 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  min="0"
                                  placeholder="Pts"
                                />
                                <button
                                  onClick={() => supprimerQuestion(critere.id, sousCritere.id, question.id)}
                                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                                  title="Supprimer la question"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Champs optionnels */}
                              <div className="space-y-2 ml-8">
                                <div className="grid grid-cols-2 gap-2">
                                  <select
                                    value={question.type || 'Texte libre'}
                                    onChange={(e) =>
                                      modifierQuestion(critere.id, sousCritere.id, question.id, 'type', e.target.value)
                                    }
                                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  >
                                    <option value="Texte libre">Texte libre</option>
                                    <option value="Oui/Non">Oui/Non</option>
                                    <option value="Choix multiple">Choix multiple</option>
                                    <option value="Numérique">Numérique</option>
                                    <option value="Document">Document</option>
                                  </select>
                                  <label className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={question.obligatoire || false}
                                      onChange={(e) =>
                                        modifierQuestion(critere.id, sousCritere.id, question.id, 'obligatoire', e.target.checked)
                                      }
                                      className="w-4 h-4 text-teal-600 focus:ring-2 focus:ring-teal-500 rounded"
                                    />
                                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Obligatoire</span>
                                  </label>
                                </div>
                                <textarea
                                  value={question.description || ''}
                                  onChange={(e) =>
                                    modifierQuestion(critere.id, sousCritere.id, question.id, 'description', e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="Description / Extrait CCTP (optionnel)"
                                  rows={2}
                                />
                                <input
                                  type="text"
                                  value={question.evaluateurs || ''}
                                  onChange={(e) =>
                                    modifierQuestion(critere.id, sousCritere.id, question.id, 'evaluateurs', e.target.value)
                                  }
                                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="Évaluateurs (ex: Expert Juridique, Chef de projet)"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer avec boutons de sauvegarde */}


        {/* Modal de duplication */}
        {showDuplicateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Copy className="w-5 h-5 text-blue-600" />
                    Dupliquer le questionnaire
                  </h3>
                  <button
                    onClick={() => setShowDuplicateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Dupliquer le questionnaire du <strong>Lot {state.numeroLot}</strong> vers :
                </p>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {state.procedure?.nombre_lots && Array.from({ length: state.procedure.nombre_lots }, (_, i) => i + 1)
                    .filter(lotNum => lotNum !== state.numeroLot) // Exclure le lot actuel
                    .map(lotNum => (
                      <label
                        key={lotNum}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLotsForDuplication.includes(lotNum)}
                          onChange={() => toggleLotSelection(lotNum)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Lot {lotNum}
                        </span>
                      </label>
                    ))}
                </div>

                {selectedLotsForDuplication.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>{selectedLotsForDuplication.length}</strong> lot(s) sélectionné(s) : {selectedLotsForDuplication.join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDuplicateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={duplicateQuestionnaireToLots}
                    disabled={isDuplicating || selectedLotsForDuplication.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDuplicating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Duplication...
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Dupliquer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireTechnique;
