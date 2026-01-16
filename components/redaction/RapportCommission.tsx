import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Save, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  Users,
  Building,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { generateRapportCommissionWord } from './services/rapportCommissionGenerator';
import type { RapportCommissionData } from './types/rapportCommission';

export default function RapportCommission() {
  const [activeChapter, setActiveChapter] = useState<string>('identification');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<RapportCommissionData>({
    // 1. IDENTIFICATION DU MARCHÉ
    identification: {
      numProcedure: '',
      objet: '',
      typeMarche: '',
      modePassation: '',
      montantEstime: '',
      codeCPV: '',
    },
    
    // 2. COMPOSITION DE LA COMMISSION
    commission: {
      dateReunion: '',
      lieuReunion: '',
      president: {
        nom: '',
        fonction: '',
      },
      membres: [],
      absents: [],
      invites: [],
    },
    
    // 3. OBJET DE LA RÉUNION
    objetReunion: {
      typeAnalyse: 'Ouverture des plis',
      dateOuverture: '',
      heureOuverture: '',
    },
    
    // 4. RAPPEL DU CONTEXTE
    contexte: {
      publicationDate: '',
      dateLimiteDepot: '',
      criteres: {
        prix: '',
        technique: '',
        autres: [],
      },
    },
    
    // 5. DÉROULEMENT DE LA SÉANCE
    deroulement: {
      nombreOffresRecues: '',
      nombreOffresRecevables: '',
      offresIrrecevables: [],
      offresInappropriees: [],
    },
    
    // 6. ANALYSE DES OFFRES
    analyse: {
      candidats: [],
      notesTechniques: [],
      notesFinancieres: [],
      classement: [],
    },
    
    // 7. PROPOSITIONS
    propositions: {
      attributaire: {
        nom: '',
        montantHT: '',
        montantTTC: '',
        delaiExecution: '',
      },
      conditionsParticulieres: '',
      reserves: '',
    },
    
    // 8. DÉCISIONS
    decisions: {
      avisCommission: '',
      dateNotification: '',
      observations: '',
    },
  });

  const chapters = [
    { 
      id: 'identification', 
      title: '1. Identification du marché', 
      icon: FileCheck,
      description: 'Informations générales sur le marché'
    },
    { 
      id: 'commission', 
      title: '2. Composition de la commission', 
      icon: Users,
      description: 'Membres présents et absents'
    },
    { 
      id: 'objetReunion', 
      title: '3. Objet de la réunion', 
      icon: Calendar,
      description: 'Type et date de la séance'
    },
    { 
      id: 'contexte', 
      title: '4. Rappel du contexte', 
      icon: Building,
      description: 'Publication et critères'
    },
    { 
      id: 'deroulement', 
      title: '5. Déroulement de la séance', 
      icon: FileText,
      description: 'Nombre d\'offres et recevabilité'
    },
    { 
      id: 'analyse', 
      title: '6. Analyse des offres', 
      icon: FileCheck,
      description: 'Notes et classement'
    },
    { 
      id: 'propositions', 
      title: '7. Propositions', 
      icon: AlertCircle,
      description: 'Attributaire proposé'
    },
    { 
      id: 'decisions', 
      title: '8. Décisions', 
      icon: FileCheck,
      description: 'Avis de la commission'
    },
  ];

  const updateField = (chapter: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [chapter]: {
        ...prev[chapter as keyof RapportCommissionData],
        [field]: value,
      },
    }));
  };

  const updateNestedField = (chapter: string, parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [chapter]: {
        ...prev[chapter as keyof RapportCommissionData],
        [parent]: {
          ...(prev[chapter as keyof RapportCommissionData] as any)[parent],
          [field]: value,
        },
      },
    }));
  };

  const addArrayItem = (chapter: string, field: string, item: any) => {
    setFormData(prev => ({
      ...prev,
      [chapter]: {
        ...prev[chapter as keyof RapportCommissionData],
        [field]: [...((prev[chapter as keyof RapportCommissionData] as any)[field] || []), item],
      },
    }));
  };

  const removeArrayItem = (chapter: string, field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [chapter]: {
        ...prev[chapter as keyof RapportCommissionData],
        [field]: ((prev[chapter as keyof RapportCommissionData] as any)[field] || []).filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const handleGenerateWord = async () => {
    setIsSaving(true);
    try {
      await generateRapportCommissionWord(formData);
    } catch (error) {
      console.error('Erreur génération Word:', error);
      alert('Erreur lors de la génération du document Word');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveData = () => {
    // Sauvegarder dans localStorage pour l'instant
    localStorage.setItem('rapportCommissionData', JSON.stringify(formData));
    alert('Données sauvegardées !');
  };

  const handleLoadData = () => {
    const saved = localStorage.getItem('rapportCommissionData');
    if (saved) {
      setFormData(JSON.parse(saved));
      alert('Données chargées !');
    }
  };

  useEffect(() => {
    // Charger automatiquement les données au démarrage
    const saved = localStorage.getItem('rapportCommissionData');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Règlement de consultation
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Génération de règlement de consultation
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLoadData}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Charger
              </button>
              
              <button
                onClick={handleSaveData}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Sauvegarder
              </button>
              
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-2" />
                {showPreview ? 'Masquer' : 'Prévisualiser'}
              </button>
              
              <button
                onClick={handleGenerateWord}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                {isSaving ? 'Génération...' : 'Télécharger Word'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Navigation chapitres */}
          <div className="col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Chapitres
                </h2>
              </div>
              
              <nav className="p-2">
                {chapters.map((chapter) => {
                  const Icon = chapter.icon;
                  const isActive = activeChapter === chapter.id;
                  
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => setActiveChapter(chapter.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                            {chapter.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {chapter.description}
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className={showPreview ? 'col-span-5' : 'col-span-9'}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {renderChapterContent()}
            </div>
          </div>

          {/* Prévisualisation */}
          {showPreview && (
            <div className="col-span-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Aperçu du document
                  </h2>
                </div>
                
                <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  <PreviewContent data={formData} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function renderChapterContent() {
    switch (activeChapter) {
      case 'identification':
        return <IdentificationChapter data={formData.identification} updateField={updateField} />;
      case 'commission':
        return <CommissionChapter data={formData.commission} updateField={updateField} updateNestedField={updateNestedField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 'objetReunion':
        return <ObjetReunionChapter data={formData.objetReunion} updateField={updateField} />;
      case 'contexte':
        return <ContexteChapter data={formData.contexte} updateField={updateField} updateNestedField={updateNestedField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 'deroulement':
        return <DeroulementChapter data={formData.deroulement} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 'analyse':
        return <AnalyseChapter data={formData.analyse} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />;
      case 'propositions':
        return <PropositionsChapter data={formData.propositions} updateField={updateField} updateNestedField={updateNestedField} />;
      case 'decisions':
        return <DecisionsChapter data={formData.decisions} updateField={updateField} />;
      default:
        return null;
    }
  }
}

// Composants pour chaque chapitre
function IdentificationChapter({ data, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          1. Identification du marché
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            N° de procédure
          </label>
          <input
            type="text"
            value={data.numProcedure}
            onChange={(e) => updateField('identification', 'numProcedure', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 2024-MP-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de marché
          </label>
          <select
            value={data.typeMarche}
            onChange={(e) => updateField('identification', 'typeMarche', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner...</option>
            <option value="Fournitures">Fournitures</option>
            <option value="Services">Services</option>
            <option value="Travaux">Travaux</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Objet du marché
        </label>
        <textarea
          value={data.objet}
          onChange={(e) => updateField('identification', 'objet', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Décrivez l'objet du marché..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mode de passation
          </label>
          <select
            value={data.modePassation}
            onChange={(e) => updateField('identification', 'modePassation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner...</option>
            <option value="Appel d'offres ouvert">Appel d'offres ouvert</option>
            <option value="Appel d'offres restreint">Appel d'offres restreint</option>
            <option value="Procédure adaptée">Procédure adaptée</option>
            <option value="Marché négocié">Marché négocié</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Montant estimé (€ HT)
          </label>
          <input
            type="text"
            value={data.montantEstime}
            onChange={(e) => updateField('identification', 'montantEstime', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 150 000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Code CPV
        </label>
        <input
          type="text"
          value={data.codeCPV}
          onChange={(e) => updateField('identification', 'codeCPV', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: 45000000-7"
        />
      </div>
    </div>
  );
}

function CommissionChapter({ data, updateField, updateNestedField, addArrayItem, removeArrayItem }: any) {
  const [newMembre, setNewMembre] = useState({ nom: '', fonction: '' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          2. Composition de la commission
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date de réunion
          </label>
          <input
            type="date"
            value={data.dateReunion}
            onChange={(e) => updateField('commission', 'dateReunion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lieu de réunion
          </label>
          <input
            type="text"
            value={data.lieuReunion}
            onChange={(e) => updateField('commission', 'lieuReunion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Salle du conseil"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Président de séance
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom
            </label>
            <input
              type="text"
              value={data.president.nom}
              onChange={(e) => updateNestedField('commission', 'president', 'nom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fonction
            </label>
            <input
              type="text"
              value={data.president.fonction}
              onChange={(e) => updateNestedField('commission', 'president', 'fonction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Membres présents
        </h3>
        
        <div className="space-y-2 mb-3">
          {data.membres.map((membre: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{membre.nom}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{membre.fonction}</div>
              </div>
              <button
                onClick={() => removeArrayItem('commission', 'membres', index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={newMembre.nom}
            onChange={(e) => setNewMembre({ ...newMembre, nom: e.target.value })}
            placeholder="Nom"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newMembre.fonction}
            onChange={(e) => setNewMembre({ ...newMembre, fonction: e.target.value })}
            placeholder="Fonction"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        
        <button
          onClick={() => {
            if (newMembre.nom && newMembre.fonction) {
              addArrayItem('commission', 'membres', newMembre);
              setNewMembre({ nom: '', fonction: '' });
            }
          }}
          className="mt-2 w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          + Ajouter un membre
        </button>
      </div>
    </div>
  );
}

function ObjetReunionChapter({ data, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          3. Objet de la réunion
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Type d'analyse
        </label>
        <select
          value={data.typeAnalyse}
          onChange={(e) => updateField('objetReunion', 'typeAnalyse', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="Ouverture des plis">Ouverture des plis</option>
          <option value="Analyse des candidatures">Analyse des candidatures</option>
          <option value="Analyse des offres">Analyse des offres</option>
          <option value="Négociation">Négociation</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date d'ouverture
          </label>
          <input
            type="date"
            value={data.dateOuverture}
            onChange={(e) => updateField('objetReunion', 'dateOuverture', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Heure d'ouverture
          </label>
          <input
            type="time"
            value={data.heureOuverture}
            onChange={(e) => updateField('objetReunion', 'heureOuverture', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function ContexteChapter({ data, updateField, updateNestedField, addArrayItem, removeArrayItem }: any) {
  const [newCritere, setNewCritere] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          4. Rappel du contexte
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date de publication
          </label>
          <input
            type="date"
            value={data.publicationDate}
            onChange={(e) => updateField('contexte', 'publicationDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date limite de dépôt
          </label>
          <input
            type="date"
            value={data.dateLimiteDepot}
            onChange={(e) => updateField('contexte', 'dateLimiteDepot', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Critères d'attribution
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prix (%)
            </label>
            <input
              type="text"
              value={data.criteres.prix}
              onChange={(e) => updateNestedField('contexte', 'criteres', 'prix', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valeur technique (%)
            </label>
            <input
              type="text"
              value={data.criteres.technique}
              onChange={(e) => updateNestedField('contexte', 'criteres', 'technique', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 40"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Autres critères
          </label>
          <div className="space-y-2 mb-2">
            {data.criteres.autres?.map((critere: string, index: number) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                <span className="text-gray-900 dark:text-white">{critere}</span>
                <button
                  onClick={() => removeArrayItem('contexte', 'criteres.autres', index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCritere}
              onChange={(e) => setNewCritere(e.target.value)}
              placeholder="Ajouter un critère..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={() => {
                if (newCritere) {
                  const currentAutres = data.criteres.autres || [];
                  updateNestedField('contexte', 'criteres', 'autres', [...currentAutres, newCritere]);
                  setNewCritere('');
                }
              }}
              className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeroulementChapter({ data, updateField, addArrayItem, removeArrayItem }: any) {
  const [newIrrecevable, setNewIrrecevable] = useState({ nom: '', motif: '' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          5. Déroulement de la séance
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre d'offres reçues
          </label>
          <input
            type="number"
            value={data.nombreOffresRecues}
            onChange={(e) => updateField('deroulement', 'nombreOffresRecues', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre d'offres recevables
          </label>
          <input
            type="number"
            value={data.nombreOffresRecevables}
            onChange={(e) => updateField('deroulement', 'nombreOffresRecevables', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Offres irrecevables
        </h3>
        
        <div className="space-y-2 mb-3">
          {data.offresIrrecevables?.map((offre: any, index: number) => (
            <div key={index} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">{offre.nom}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{offre.motif}</div>
                </div>
                <button
                  onClick={() => removeArrayItem('deroulement', 'offresIrrecevables', index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={newIrrecevable.nom}
            onChange={(e) => setNewIrrecevable({ ...newIrrecevable, nom: e.target.value })}
            placeholder="Nom du candidat"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <textarea
            value={newIrrecevable.motif}
            onChange={(e) => setNewIrrecevable({ ...newIrrecevable, motif: e.target.value })}
            placeholder="Motif d'irrecevabilité..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={() => {
              if (newIrrecevable.nom && newIrrecevable.motif) {
                addArrayItem('deroulement', 'offresIrrecevables', newIrrecevable);
                setNewIrrecevable({ nom: '', motif: '' });
              }
            }}
            className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            + Ajouter une offre irrecevable
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyseChapter({ data, updateField, addArrayItem, removeArrayItem }: any) {
  const [newCandidat, setNewCandidat] = useState({ nom: '', noteTechnique: '', noteFinanciere: '', noteGlobale: '' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          6. Analyse des offres
        </h2>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Candidats et notes
        </h3>
        
        <div className="space-y-2 mb-3">
          {data.candidats?.map((candidat: any, index: number) => (
            <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Candidat</div>
                    <div className="font-medium text-gray-900 dark:text-white">{candidat.nom}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Note technique</div>
                    <div className="font-medium text-gray-900 dark:text-white">{candidat.noteTechnique}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Note financière</div>
                    <div className="font-medium text-gray-900 dark:text-white">{candidat.noteFinanciere}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Note globale</div>
                    <div className="font-medium text-gray-900 dark:text-white">{candidat.noteGlobale}</div>
                  </div>
                </div>
                <button
                  onClick={() => removeArrayItem('analyse', 'candidats', index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          <input
            type="text"
            value={newCandidat.nom}
            onChange={(e) => setNewCandidat({ ...newCandidat, nom: e.target.value })}
            placeholder="Nom"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newCandidat.noteTechnique}
            onChange={(e) => setNewCandidat({ ...newCandidat, noteTechnique: e.target.value })}
            placeholder="Note tech."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newCandidat.noteFinanciere}
            onChange={(e) => setNewCandidat({ ...newCandidat, noteFinanciere: e.target.value })}
            placeholder="Note fin."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newCandidat.noteGlobale}
            onChange={(e) => setNewCandidat({ ...newCandidat, noteGlobale: e.target.value })}
            placeholder="Note glob."
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        
        <button
          onClick={() => {
            if (newCandidat.nom) {
              addArrayItem('analyse', 'candidats', newCandidat);
              setNewCandidat({ nom: '', noteTechnique: '', noteFinanciere: '', noteGlobale: '' });
            }
          }}
          className="mt-2 w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          + Ajouter un candidat
        </button>
      </div>
    </div>
  );
}

function PropositionsChapter({ data, updateField, updateNestedField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          7. Propositions
        </h2>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Attributaire proposé
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom de l'attributaire
            </label>
            <input
              type="text"
              value={data.attributaire.nom}
              onChange={(e) => updateNestedField('propositions', 'attributaire', 'nom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant HT (€)
              </label>
              <input
                type="text"
                value={data.attributaire.montantHT}
                onChange={(e) => updateNestedField('propositions', 'attributaire', 'montantHT', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant TTC (€)
              </label>
              <input
                type="text"
                value={data.attributaire.montantTTC}
                onChange={(e) => updateNestedField('propositions', 'attributaire', 'montantTTC', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Délai d'exécution
            </label>
            <input
              type="text"
              value={data.attributaire.delaiExecution}
              onChange={(e) => updateNestedField('propositions', 'attributaire', 'delaiExecution', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 6 mois"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Conditions particulières
        </label>
        <textarea
          value={data.conditionsParticulieres}
          onChange={(e) => updateField('propositions', 'conditionsParticulieres', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Conditions particulières d'exécution..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Réserves éventuelles
        </label>
        <textarea
          value={data.reserves}
          onChange={(e) => updateField('propositions', 'reserves', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Réserves formulées..."
        />
      </div>
    </div>
  );
}

function DecisionsChapter({ data, updateField }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          8. Décisions
        </h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Avis de la commission
        </label>
        <select
          value={data.avisCommission}
          onChange={(e) => updateField('decisions', 'avisCommission', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Sélectionner...</option>
          <option value="Favorable">Favorable</option>
          <option value="Favorable avec réserves">Favorable avec réserves</option>
          <option value="Défavorable">Défavorable</option>
          <option value="Déclaration d'infructuosité">Déclaration d'infructuosité</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date de notification prévue
        </label>
        <input
          type="date"
          value={data.dateNotification}
          onChange={(e) => updateField('decisions', 'dateNotification', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observations complémentaires
        </label>
        <textarea
          value={data.observations}
          onChange={(e) => updateField('decisions', 'observations', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Observations de la commission..."
        />
      </div>
    </div>
  );
}

// Composant de prévisualisation
function PreviewContent({ data }: { data: RapportCommissionData }) {
  return (
    <div className="prose dark:prose-invert max-w-none text-sm">
      <h3 className="text-lg font-bold mb-4">RÈGLEMENT DE CONSULTATION</h3>
      
      {data.identification.numProcedure && (
        <div className="mb-6">
          <h4 className="font-semibold text-base mb-2">1. IDENTIFICATION DU MARCHÉ</h4>
          <div className="space-y-1 text-sm">
            {data.identification.numProcedure && <p><strong>N° de procédure:</strong> {data.identification.numProcedure}</p>}
            {data.identification.objet && <p><strong>Objet:</strong> {data.identification.objet}</p>}
            {data.identification.typeMarche && <p><strong>Type:</strong> {data.identification.typeMarche}</p>}
            {data.identification.modePassation && <p><strong>Mode de passation:</strong> {data.identification.modePassation}</p>}
          </div>
        </div>
      )}

      {data.commission.dateReunion && (
        <div className="mb-6">
          <h4 className="font-semibold text-base mb-2">2. COMPOSITION DE LA COMMISSION</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Date:</strong> {new Date(data.commission.dateReunion).toLocaleDateString('fr-FR')}</p>
            {data.commission.lieuReunion && <p><strong>Lieu:</strong> {data.commission.lieuReunion}</p>}
            {data.commission.president.nom && (
              <p><strong>Président:</strong> {data.commission.president.nom} - {data.commission.president.fonction}</p>
            )}
            {data.commission.membres.length > 0 && (
              <div>
                <strong>Membres présents:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {data.commission.membres.map((m: any, i: number) => (
                    <li key={i}>{m.nom} - {m.fonction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {data.deroulement.nombreOffresRecues && (
        <div className="mb-6">
          <h4 className="font-semibold text-base mb-2">5. DÉROULEMENT DE LA SÉANCE</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Offres reçues:</strong> {data.deroulement.nombreOffresRecues}</p>
            <p><strong>Offres recevables:</strong> {data.deroulement.nombreOffresRecevables}</p>
            {data.deroulement.offresIrrecevables && data.deroulement.offresIrrecevables.length > 0 && (
              <div>
                <strong>Offres irrecevables:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {data.deroulement.offresIrrecevables.map((o: any, i: number) => (
                    <li key={i}>{o.nom} - {o.motif}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {data.propositions.attributaire.nom && (
        <div className="mb-6">
          <h4 className="font-semibold text-base mb-2">7. PROPOSITIONS</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Attributaire proposé:</strong> {data.propositions.attributaire.nom}</p>
            {data.propositions.attributaire.montantHT && (
              <p><strong>Montant HT:</strong> {data.propositions.attributaire.montantHT} €</p>
            )}
            {data.propositions.attributaire.montantTTC && (
              <p><strong>Montant TTC:</strong> {data.propositions.attributaire.montantTTC} €</p>
            )}
          </div>
        </div>
      )}

      {data.decisions.avisCommission && (
        <div className="mb-6">
          <h4 className="font-semibold text-base mb-2">8. DÉCISIONS</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Avis de la commission:</strong> {data.decisions.avisCommission}</p>
            {data.decisions.observations && (
              <p><strong>Observations:</strong> {data.decisions.observations}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
