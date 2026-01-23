import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Save,
  Building,
  FileCheck,
  Scale,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  ChevronRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { generateReglementConsultationWord } from './services/reglementConsultationGenerator';
import { autoFillRCFromProcedure } from './services/procedureAutoFill';
import type { RapportCommissionData } from './types/rapportCommission';

interface ReglementConsultationProps {
  initialNumeroProcedure?: string;
  onDataChange?: (data: RapportCommissionData) => void;
  initialData?: RapportCommissionData;
}

export default function ReglementConsultation({ initialNumeroProcedure, onDataChange, initialData }: ReglementConsultationProps) {
  const [showFullEdit, setShowFullEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoadingProcedure, setIsLoadingProcedure] = useState(false);
  const [autoFillStatus, setAutoFillStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  const [formData, setFormData] = useState<RapportCommissionData>(initialData || {
    enTete: {
      numeroProcedure: initialNumeroProcedure || '',
      titreMarche: '',
      numeroMarche: '',
      typeMarcheTitle: 'Marché public de travaux',
      dateLimiteOffres: '',
      heureLimiteOffres: '',
      dateLimiteQuestions: '',
      dateLimiteReponses: '',
    },
    pouvoirAdjudicateur: {
      nom: 'Agence pour la formation professionnelle des Adultes',
      adresseVoie: '3 rue Franklin',
      codePostal: '93100',
      ville: 'Montreuil-sous-Bois',
      pays: 'France',
      telephone: '',
      courriel: '',
      adresseWeb: 'https://www.afpa.fr/',
      profilAcheteur: 'http://afpa.e-marchespublics.com/',
    },
    objet: {
      description: '',
      cpvPrincipal: '',
      cpvPrincipalLib: '',
      cpvSecondaires: [],
    },
    conditions: {
      modePassation: 'Appel d\'offres ouvert',
      nbLots: '',
      lots: [],
      variantesAutorisees: false,
      ccagApplicable: '',
      groupementSolidaire: true,
      groupementConjoint: true,
      visiteObligatoire: false,
    },
    typeMarche: {
      forme: 'Accord-cadre mono-attributaire',
      dureeInitiale: '12',
      nbReconductions: '3',
      dureeReconduction: '12',
      dureeMax: '48',
      sousTraitanceTotaleInterdite: true,
      lieuExecution: '',
    },
    dce: {
      documents: [
        'Règlement de la Consultation (RC)',
        'Acte d\'Engagement (AE)',
        'Bordereau des Prix Unitaires (BPU)',
        'Cahier des Clauses Administratives Particulières (CCAP)',
        'Cahier des Clauses Techniques Particulières (CCTP)',
        'Détail Quantitatif Estimatif (DQE)',
        'Questionnaire Technique (QT)'
      ],
      urlCCAG: 'https://www.economie.gouv.fr/daj/cahiers-clauses-administratives-generales-et-techniques#CCAG',
    },
    remise: {
      delaiValiditeOffres: '150',
    },
    jugement: {
      critereFinancier: '60',
      critereTechnique: '40',
      sousCriteresTechniques: [
        { nom: 'Organisation', points: '115' },
        { nom: 'Plan de déploiement', points: '60' },
        { nom: 'Entreprise', points: '50' },
        { nom: 'Produits', points: '50' }
      ],
    },
    recours: {
      tribunalNom: 'Tribunal Administratif de Montreuil',
      tribunalAdresse: '7, rue Catherine Puig',
      tribunalVille: '93 100 Montreuil',
      tribunalTel: '01 49 20 20 00',
      tribunalCourriel: 'greffe.ta-montreuil@juradm.fr',
      tribunalSIRET: '130 006 869 00015',
    },
  });

  // Synchroniser formData avec initialData quand elle change
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Notifier le parent à chaque changement de données
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  const sections = [
    { title: 'En-tête', icon: FileText, color: 'blue' },
    { title: 'Pouvoir adjudicateur', icon: Building, color: 'indigo' },
    { title: 'Objet de la consultation', icon: FileCheck, color: 'purple' },
    { title: 'Conditions', icon: Scale, color: 'pink' },
    { title: 'Type de marché', icon: FileText, color: 'red' },
    { title: 'DCE', icon: FileCheck, color: 'orange' },
    { title: 'Jugement des offres', icon: Scale, color: 'amber' },
    { title: 'Procédure de recours', icon: AlertCircle, color: 'yellow' },
  ];

  const updateField = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof RapportCommissionData],
        [field]: value,
      },
    }));
  };

  const addArrayItem = (section: string, field: string, item: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof RapportCommissionData],
        [field]: [...((prev[section as keyof RapportCommissionData] as any)[field] || []), item],
      },
    }));
  };

  const removeArrayItem = (section: string, field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof RapportCommissionData],
        [field]: ((prev[section as keyof RapportCommissionData] as any)[field] || []).filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const handleNumeroProcedureInput = (rawValue: string) => {
    const value = rawValue.replace(/\D/g, '').slice(0, 5);
    updateField('enTete', 'numeroProcedure', value);
    if (value.length === 5) {
      handleAutoFillFromProcedure(value);
    }
  };

  const handleSave = () => {
    localStorage.setItem('reglementConsultationData', JSON.stringify(formData));
    alert('Données sauvegardées localement !');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('reglementConsultationData');
    if (saved) {
      setFormData(JSON.parse(saved));
      alert('Données chargées depuis le navigateur !');
    }
  };

  // Les fonctions de sauvegarde/chargement DB ont été retirées
  // Le RC est maintenant géré uniquement via le module DCE Complet

  const handleGenerateWord = async () => {
    setIsSaving(true);
    try {
      await generateReglementConsultationWord(formData);
    } catch (error) {
      console.error('Erreur génération Word:', error);
      alert('Erreur lors de la génération du document Word');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoFillFromProcedure = async (numeroCourt: string) => {
    if (numeroCourt.length !== 5) return;

    setIsLoadingProcedure(true);
    setAutoFillStatus({ type: null, message: '' });

    try {
      const result = await autoFillRCFromProcedure(numeroCourt, formData);

      if (result.success && result.data) {
        // Préserver le numéro de procédure saisi par l'utilisateur (5 chiffres)
        setFormData({
          ...result.data,
          enTete: {
            ...result.data.enTete,
            numeroProcedure: numeroCourt, // Conserver le numéro court saisi
          },
        });
        const procNumber = result.procedureFound || numeroCourt;
        setAutoFillStatus({
          type: 'success',
          message: `✅ Données chargées depuis la procédure ${procNumber}`,
        });
        
        // Effacer le message après 5 secondes
        setTimeout(() => {
          setAutoFillStatus({ type: null, message: '' });
        }, 5000);
      } else {
        setAutoFillStatus({
          type: 'error',
          message: result.error || 'Erreur lors du chargement',
        });
        
        // Effacer le message d'erreur après 10 secondes pour laisser le temps de lire
        setTimeout(() => {
          setAutoFillStatus({ type: null, message: '' });
        }, 10000);
      }
    } catch (err) {
      console.error('Erreur auto-fill:', err);
      setAutoFillStatus({
        type: 'error',
        message: '❌ Erreur lors du chargement des données',
      });
      
      setTimeout(() => {
        setAutoFillStatus({ type: null, message: '' });
      }, 8000);
    } finally {
      setIsLoadingProcedure(false);
    }
  };

  // Note : Le localStorage n'est plus chargé automatiquement au démarrage
  // Le formulaire démarre toujours vide. Les données sont chargées uniquement
  // quand l'utilisateur saisit un numéro de procédure (auto-fill depuis Supabase)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-[#006d57] dark:text-[#006d57]" />
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Règlement de consultation
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Génération de règlement de consultation (marchés publics)
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Procédure</label>
                <input
                  type="text"
                  value={formData.enTete.numeroProcedure}
                  onChange={(e) => handleNumeroProcedureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formData.enTete.numeroProcedure.length === 5) {
                      e.preventDefault();
                      // Auto-remplissage depuis la procédure uniquement
                    }
                  }}
                  maxLength={5}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="12345"
                />
              </div>
              
              <button
                onClick={() => setShowFullEdit(!showFullEdit)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <FileCheck className="w-4 h-4 inline mr-1" />
                {showFullEdit ? 'Navigation' : 'Édition'}
              </button>
              
              <button
                onClick={handleGenerateWord}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#004d3d] rounded-lg hover:bg-[#006d57] disabled:opacity-50"
              >
                <Download className="w-4 h-4 inline mr-1" />
                {isSaving ? 'Génération...' : 'Télécharger Word'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Navigation sections - masquée en mode édition complète */}
          {!showFullEdit && (
          <div className="col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sections</h2>
              </div>
              
              <nav className="p-2">
                {sections.map((section, index) => {
                  const Icon = section.icon;
                  const isActive = activeSection === index;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setActiveSection(index)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-all ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                        }`} />
                        <span className="text-sm font-medium">{section.title}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          )}

          {/* Contenu */}
          <div className={showFullEdit ? 'col-span-12' : 'col-span-9'}>
            {showFullEdit ? (
              // Mode édition complète : afficher le document complet éditable
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-8 max-w-4xl mx-auto prose prose-sm max-w-none">
                  {/* En-tête du document */}
                  <div className="text-center mb-8 not-prose">
                    <input
                      type="text"
                      value={formData.enTete.typeMarcheTitle}
                      onChange={(e) => updateField('enTete', 'typeMarcheTitle', e.target.value)}
                      className="w-full text-center text-2xl font-bold mb-4 uppercase border-b-2 border-dashed border-blue-300 focus:border-blue-500 outline-none bg-transparent"
                    />
                    <h2 className="text-xl font-bold mb-4">RÈGLEMENT DE CONSULTATION</h2>
                    {formData.enTete.numeroProcedure && (
                      <p className="mb-2">
                        <span className="text-lg">Procédure n° </span>
                        <span className="text-lg font-bold">{formData.enTete.numeroProcedure}</span>
                      </p>
                    )}
                    <textarea
                      value={formData.enTete.titreMarche}
                      onChange={(e) => updateField('enTete', 'titreMarche', e.target.value)}
                      className="w-full text-center text-xl font-bold border-b-2 border-dashed border-blue-300 focus:border-blue-500 outline-none bg-transparent resize-none"
                      rows={2}
                    />
                    <div className="mt-4 text-left">
                      <p className="flex flex-col"><strong>N° de marché :</strong> <input type="text" value={formData.enTete.numeroMarche} onChange={(e) => updateField('enTete', 'numeroMarche', e.target.value)} className="border-b border-gray-300 outline-none break-words w-full" style={{wordBreak: 'break-word'}} /></p>
                      <p><strong>Date limite :</strong> <input type="date" value={formData.enTete.dateLimiteOffres} onChange={(e) => updateField('enTete', 'dateLimiteOffres', e.target.value)} className="border-b border-gray-300 outline-none" /> à <input type="time" value={formData.enTete.heureLimiteOffres} onChange={(e) => updateField('enTete', 'heureLimiteOffres', e.target.value)} className="border-b border-gray-300 outline-none" /></p>
                    </div>
                  </div>

                  {/* Chapitre 1 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">1  TERMINOLOGIE</h2>
                    <p><strong>Acheteur :</strong> Désigne l'Afpa, acheteur agissant en tant que pouvoir adjudicateur</p>
                  </div>

                  {/* Chapitre 2 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">2  PRESENTATION DU POUVOIR ADJUDICATEUR</h2>
                    
                    {/* Bloc institutionnel */}
                    <p className="mb-3 text-sm">L'Agence Nationale pour la Formation Professionnelle des Adultes (ci-après Afpa) est un établissement public à caractère industriel et commercial (EPIC) d'Etat, créé le 1er janvier 2017 à la suite de la restructuration de l'Association nationale pour la formation professionnelle des adultes, par les articles 8 et 9 de l'ordonnance n°2015-968 du 31 juillet 2015.</p>
                    <p className="mb-2 text-sm">L'Afpa a depuis lors pour principales missions et spécialités définies au Code du Travail (articles L5315-1 à L5315-10) :</p>
                    <ul className="list-none ml-4 mb-3 space-y-1 text-sm">
                      <li>• De participer à la formation et à la qualification des personnes en recherche d'emploi, des salariés, et notamment des salariés dont le contrat de travail est rompu ;</li>
                      <li>• De contribuer à la politique de certification du ministère de l'Emploi ;</li>
                      <li>• De contribuer à l'égal accès des hommes et femmes à la formation professionnelle et au développement de la mixité des métiers ;</li>
                      <li>• De contribuer à l'égal accès sur tout le territoire, en priorité dans les zones urbaines sensibles et les bassins d'emploi à redynamiser ;</li>
                      <li>• De contribuer à l'émergence et à l'organisation de nouveaux métiers en lien avec l'évolution du monde économique et social et des compétences attendues par les employeurs ;</li>
                      <li>• De contribuer à la politique de certification de l'Etat par son offre de formation et la délivrance d'un titre du ministère chargé de l'Emploi ;</li>
                      <li>• De participer à la formation des personnes en recherche d'emploi et à la formation des personnes en situation d'emploi par l'intermédiaire de ses filiales, les Sociétés par actions simplifiées et à actionnaire unique, respectivement à ce jour « Afpa Accès à l'Emploi », et « Afpa Entreprises ».</li>
                    </ul>
                    <p className="mb-2 text-sm">A ces fins, le groupe Afpa se caractérise par un maillage territorial complet, proches des milieux professionnels, des collectivités territoriales, et des organismes déconcentrés de l'Etat, avec pour chacune des trois entités du groupe :</p>
                    <ul className="list-none ml-4 mb-4 space-y-1 text-sm">
                      <li>• Un Siège, situé à Montreuil ;</li>
                      <li>• 13 Directions régionales, une par Région administrative ;</li>
                      <li>• 126 sites, rattachés aux Directions régionales</li>
                    </ul>
                    
                    <h3 className="font-bold mt-4 mb-2">2.1 Nom et adresse</h3>
                    <p className="text-sm mb-1">Agence nationale pour la formation professionnelle des adultes (Afpa)</p>
                    <p className="text-sm mb-1">36-38 rue Léon Morane, 93200 Saint-Denis</p>
                    <p className="text-sm mb-4">SIRET : 130 006 869 00015</p>
                    
                    <h3 className="font-bold mt-4 mb-2">2.2 Communication</h3>
                    <p className="text-sm mb-2">Les documents du marché sont disponibles gratuitement en accès direct non restreint et complet, à l'adresse : <span className="text-orange-600 underline">http://afpa.e-marchespublics.com</span></p>
                    <p className="text-sm mb-2">Adresse à laquelle des informations complémentaires peuvent être obtenues : <span className="text-orange-600 underline">http://afpa.e-marchespublics.com</span></p>
                    <p className="text-sm">Les offres ou les demandes de participation doivent être envoyées par voie électronique via : <span className="text-orange-600 underline">http://afpa.e-marchespublics.com</span></p>
                  </div>

                  {/* Chapitre 3 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">3  OBJET DE LA CONSULTATION</h2>
                    <p className="mb-2"><strong>Description :</strong></p>
                    <textarea value={formData.objet.description} onChange={(e) => updateField('objet', 'description', e.target.value)} className="w-full border rounded p-2 mb-4" rows={4} />
                    <p><strong>CPV Principal :</strong> <input type="text" value={formData.objet.cpvPrincipal} onChange={(e) => updateField('objet', 'cpvPrincipal', e.target.value)} className="border-b border-gray-300 outline-none w-40" /> - <input type="text" value={formData.objet.cpvPrincipalLib} onChange={(e) => updateField('objet', 'cpvPrincipalLib', e.target.value)} className="border-b border-gray-300 outline-none flex-1" /></p>
                  </div>

                  {/* Chapitre 4 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">4  CONDITIONS DE LA CONSULTATION</h2>
                    <p className="mb-2"><strong>Mode de passation :</strong> <input type="text" value={formData.conditions.modePassation} onChange={(e) => updateField('conditions', 'modePassation', e.target.value)} className="border-b border-gray-300 outline-none" /></p>
                    <p className="mb-2"><strong>Nombre de lots :</strong> <input type="text" value={formData.conditions.nbLots} onChange={(e) => updateField('conditions', 'nbLots', e.target.value)} className="border-b border-gray-300 outline-none w-20" /></p>
                    <p className="mb-2"><strong>Variantes autorisées :</strong> <input type="checkbox" checked={formData.conditions.variantesAutorisees} onChange={(e) => updateField('conditions', 'variantesAutorisees', e.target.checked)} className="ml-2" /> {formData.conditions.variantesAutorisees ? 'Oui' : 'Non'}</p>
                  </div>

                  {/* Chapitre 5 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">5  TYPE DE MARCHE</h2>
                    
                    <h3 className="font-bold mt-4 mb-2">5.1 Type et forme du marché</h3>
                    <p className="mb-2"><strong>Forme :</strong> <input type="text" value={formData.typeMarche.forme} onChange={(e) => updateField('typeMarche', 'forme', e.target.value)} className="border-b border-gray-300 outline-none" /></p>
                    
                    <h3 className="font-bold mt-4 mb-2">5.2 Durée du marché</h3>
                    <p className="mb-2"><strong>Durée initiale :</strong> <input type="text" value={formData.typeMarche.dureeInitiale} onChange={(e) => updateField('typeMarche', 'dureeInitiale', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> mois</p>
                    <p className="mb-2"><strong>Nombre de reconductions :</strong> <input type="text" value={formData.typeMarche.nbReconductions} onChange={(e) => updateField('typeMarche', 'nbReconductions', e.target.value)} className="border-b border-gray-300 outline-none w-20" /></p>
                    <p className="mb-2"><strong>Durée de reconduction :</strong> <input type="text" value={formData.typeMarche.dureeReconduction} onChange={(e) => updateField('typeMarche', 'dureeReconduction', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> mois</p>
                    <p className="mb-4"><strong>Durée maximale :</strong> <input type="text" value={formData.typeMarche.dureeMax} onChange={(e) => updateField('typeMarche', 'dureeMax', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> mois</p>
                    
                    <h3 className="font-bold mt-4 mb-2">5.3 Sous-traitance</h3>
                    <p className="mb-2 text-sm">Les candidats sont tenus d'indiquer dans l'acte d'engagement, la nature et le montant des prestations qu'ils envisagent de faire exécuter par des sous-traitants, ainsi que le nom de ces sous-traitants, afin de les présenter à l'acceptation et à l'agrément de l'Afpa.</p>
                    <p className="mb-2 text-sm">La sous-traitance de la totalité de l'accord-cadre est interdite.</p>
                    <p className="mb-4 text-sm">Le candidat devra pour cela se conformer notamment aux dispositions des articles R.2193-1 à R.2193-22 du Code de la commande publique relatifs à la sous-traitance dans les marchés publics.</p>
                    
                    <h3 className="font-bold mt-4 mb-2">5.4 Lieu d'exécution</h3>
                    <p className="mb-2"><input type="text" value={formData.typeMarche.lieuExecution} onChange={(e) => updateField('typeMarche', 'lieuExecution', e.target.value)} className="w-full border-b border-gray-300 outline-none" placeholder="À préciser" /></p>
                  </div>

                  {/* Chapitre 6 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">6  CONTENU DU DCE</h2>
                    <p className="mb-2"><strong>Documents :</strong></p>
                    <ul className="list-disc ml-6">
                      {formData.dce.documents.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                    <div className="mt-2 flex flex-col">
                      <label htmlFor="ccag-applicable" className="font-bold mb-1">CCAG Applicable :</label>
                      <select
                        id="ccag-applicable"
                        value={formData.dce.ccagApplicable}
                        onChange={e => updateField('dce', 'ccagApplicable', e.target.value)}
                        className="border-b border-gray-300 outline-none w-full p-1"
                      >
                        <option value="">-- Sélectionner --</option>
                        <option value="CCAG-FCS">CCAG-FCS - Fournitures Courantes et Services</option>
                        <option value="CCAG-PI">CCAG-PI - Prestations Intellectuelles</option>
                        <option value="CCAG-TIC">CCAG-TIC - Techniques de l'Information et de la Communication</option>
                        <option value="CCAG-MI">CCAG-MI - Marchés Industriels</option>
                        <option value="CCAG-Travaux">CCAG-Travaux - Marchés de Travaux</option>
                        <option value="CCAG-MOE">CCAG-MOE - Maîtrise d'Œuvre</option>
                      </select>
                    </div>
                    <p className="mt-2 flex flex-col"><strong>CCAG :</strong> <input type="text" value={formData.dce.urlCCAG} onChange={(e) => updateField('dce', 'urlCCAG', e.target.value)} className="border-b border-gray-300 outline-none break-words w-full" style={{wordBreak: 'break-word'}} /></p>
                  </div>

                  {/* Chapitre 7 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">7  CONDITIONS DE REMISE DES CANDIDATURES ET DES OFFRES</h2>
                    
                    {/* AVERTISSEMENT - Encart vert */}
                    <div className="bg-[#EAF6E0] border border-black p-4 mb-4">
                      <h3 className="text-center font-bold text-lg mb-3">AVERTISSEMENT</h3>
                      <p className="mb-2">Il est de la responsabilité du candidat de s'assurer de la compatibilité de ses outils informatiques, avec la plateforme de dématérialisation.</p>
                      <p className="mb-2">L'attention du candidat est attirée sur la durée d'acheminement des plis électroniques volumineux.</p>
                      <p className="mb-2">Il appartient à chaque candidat de tenir compte de la durée du téléchargement qui est fonction du débit d'accès internet dont il dispose et de la taille des documents qu'il transmet.</p>
                      <p className="mb-2">Seules la date et l'heure de la fin d'acheminement font foi pour déterminer le caractère recevable ou hors délai d'une offre transmise par voie dématérialisée. Ainsi les offres qui seraient réceptionnées par le serveur après l'heure limite (même si le début de la transmission a été effectué avant cette heure) ne seront pas examinées et seront considérées comme « hors délai ».</p>
                      <p>En cas d'envois successifs, seule sera retenue la dernière réponse déposée avant la date limite de remise des plis.</p>
                    </div>

                    <p className="mb-4"><strong>Chaque candidat produit un dossier complet comprenant les pièces suivantes :</strong></p>
                    <p className="mb-2"><strong>D'une part, les documents relatifs à la candidature :</strong></p>
                    <ul className="list-disc ml-6 mb-4 text-sm">
                      <li>Le Document Unique de Marché Européen (DUME) ou les formulaires DC1 et DC2</li>
                      <li>Le numéro INSEE ou extrait K/Kbis (moins de 6 mois)</li>
                      <li>Documents relatifs aux pouvoirs de la personne habilitée</li>
                      <li>Attestation d'assurance responsabilité civile professionnelle</li>
                    </ul>
                    
                    <p className="mb-2"><strong>D'autre part, les documents relatifs à l'offre.</strong></p>
                    
                    <h3 className="font-bold mt-4 mb-2">7.2 Format des documents à remettre</h3>
                    <p className="mb-2 text-sm">Les réponses devront être déposées en version dématérialisée sur le site Dematis à l'adresse <span className="text-orange-600 underline">http://afpa.e-marchespublics.com</span></p>
                    <p className="mb-2 text-sm">Les documents seront fournis dans l'un des formats suivants :</p>
                    <ul className="list-disc ml-6 mb-2 text-sm">
                      <li>Bureautique : norme Office Open XML (2008) - .docx, .xlsx, .pptx</li>
                      <li>PDF : norme ISO 3200-1 (2008)</li>
                    </ul>
                    <p className="mb-2 text-sm italic">NOTA : Le Bordereau de Prix Unitaires, le DQE et le Questionnaire Technique doivent être déposés en format Excel.</p>
                    
                    <h3 className="font-bold mt-4 mb-2">7.3 Langue et devise</h3>
                    <p className="mb-2 text-sm">Tous les documents doivent être rédigés en français. Les indications monétaires seront établies en Euros.</p>
                    
                    <h3 className="font-bold mt-4 mb-2">7.4 Copie de Sauvegarde</h3>
                    <p className="mb-2 text-sm">Le candidat peut adresser une copie de sauvegarde sur support physique (Clé USB) ou papier à l'adresse :</p>
                    <div className="ml-6 text-sm mb-2">
                      <p>Accueil Afpa - Direction Nationale des Achats</p>
                      <p>Tour Cityscope - 3 rue Franklin</p>
                      <p>93100 MONTREUIL</p>
                    </div>
                    
                    <p className="mb-2"><strong>Délai de validité des offres :</strong> <input type="text" value={formData.remise.delaiValiditeOffres} onChange={(e) => updateField('remise', 'delaiValiditeOffres', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> jours</p>
                  </div>

                  {/* Chapitre 8 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">8  SÉLECTION DES CANDIDATURES ET JUGEMENT DES OFFRES</h2>
                    
                    <h3 className="font-bold mt-4 mb-2">8.1 Examen des candidatures</h3>
                    <p className="mb-2 text-sm">Avant de procéder à l'examen des candidatures, s'il apparaît que des pièces du dossier de candidature sont manquantes ou incomplètes, le Pouvoir Adjudicateur peut décider de demander à tous les candidats concernés de produire ou compléter ces pièces dans un délai maximum de cinq (5) jours.</p>
                    <p className="mb-2 text-sm">Les candidatures conformes et recevables seront examinées à partir des seuls renseignements et documents exigés dans le cadre de cette consultation, pour évaluer leur situation juridique ainsi que leurs capacités professionnelles, techniques et financières.</p>
                    <p className="mb-2 text-sm">La sélection des candidatures sera effectuée dans les conditions prévues aux articles R.2144-1 à R2144-7 du Code de la commande publique.</p>
                    <p className="mb-2 text-sm"><strong>Les critères de sélection des candidatures sont :</strong></p>
                    <ul className="list-disc ml-6 mb-4 text-sm">
                      <li>Dossier administratif complet</li>
                      <li>Adéquation des capacités économiques, financières, techniques et professionnelles avec l'objet du marché</li>
                    </ul>
                    
                    <h3 className="font-bold mt-4 mb-2">8.2 Jugement des offres</h3>
                    <p className="mb-2 text-sm">La méthode de notation financière utilisée est celle recommandée par le Ministère de l'Economie et des Finances : la formule linéaire GRAMP.</p>
                    <p className="mb-2 text-sm">Concernant les prix, en cas de discordance constatée dans une offre, les montants portés dans le Bordereau des prix par le candidat prévaudront sur toutes autres indications de l'offre et le montant du détail quantitatif estimatif sera recalculé en conséquence.</p>
                    <p className="mb-2 text-sm">Le jugement des offres sera effectué dans les conditions prévues aux articles R.2152-1 et suivants du code de la commande publique et donnera lieu à un classement des offres.</p>
                    <p className="mb-2 text-sm">L'attention des candidats est attirée sur le fait que toute offre irrégulière pourra faire l'objet d'une demande de régularisation, à condition qu'elle ne soit pas anormalement basse. En revanche, toute offre inacceptable ou inappropriée sera éliminée.</p>
                    <p className="mb-4 text-sm">Le jugement des offres sera effectué dans le respect des principes fondamentaux de la commande publique et donnera lieu à un classement en fonction de la pondération suivante :</p>
                    
                    <p className="mb-2"><strong>Critère financier :</strong> <input type="text" value={formData.jugement.critereFinancier} onChange={(e) => updateField('jugement', 'critereFinancier', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> %</p>
                    <p className="mb-2"><strong>Critère technique :</strong> <input type="text" value={formData.jugement.critereTechnique} onChange={(e) => updateField('jugement', 'critereTechnique', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> %</p>
                    
                    <p className="mb-2 mt-4 text-sm"><strong>L'échelle de notation utilisée pour chaque question est la suivante :</strong></p>
                    <table className="w-full border-collapse border border-gray-300 text-xs mb-4">
                      <thead className="bg-[#EAF6E0]">
                        <tr>
                          <th className="border border-gray-300 p-2 font-bold">Notations des questions</th>
                          <th className="border border-gray-300 p-2 font-bold" colSpan={2}>Définitions</th>
                          <th className="border border-gray-300 p-2 font-bold">Pondération rapportée à la valeur de la question</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="border border-gray-300 p-2 text-center">0</td><td className="border border-gray-300 p-2">0- Ne répond pas</td><td className="border border-gray-300 p-2">Pas de réponse</td><td className="border border-gray-300 p-2 text-center">0</td></tr>
                        <tr><td className="border border-gray-300 p-2 text-center">1</td><td className="border border-gray-300 p-2">1- Très insuffisant</td><td className="border border-gray-300 p-2">Répond de manière très insuffisante à la question et/ou au besoin exprimé</td><td className="border border-gray-300 p-2 text-center">0.25</td></tr>
                        <tr><td className="border border-gray-300 p-2 text-center">2</td><td className="border border-gray-300 p-2">2- Moyen</td><td className="border border-gray-300 p-2">Répond moyennement à la question et/ou au besoin exprimé</td><td className="border border-gray-300 p-2 text-center">0.5</td></tr>
                        <tr><td className="border border-gray-300 p-2 text-center">3</td><td className="border border-gray-300 p-2">3- bon et adapté</td><td className="border border-gray-300 p-2">Apporte une réponse bonne et adaptée à la question et/ou au besoin exprimé</td><td className="border border-gray-300 p-2 text-center">0.75</td></tr>
                        <tr><td className="border border-gray-300 p-2 text-center">4</td><td className="border border-gray-300 p-2">4- Au-delà du besoin</td><td className="border border-gray-300 p-2">Apporte une réponse au-delà de la demande et/ou au besoin exprimé</td><td className="border border-gray-300 p-2 text-center">1</td></tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Chapitre 9 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">9  CONDITION DE VALIDITÉ DE L'ATTRIBUTAIRE PRESSENTI</h2>
                    <p className="mb-2 text-sm">En application de l'article R.2144-4 du Code de la commande publique, le marché est définitivement attribué au candidat retenu sous réserve que celui-ci produise, dans les dix (10) jours suivants la notification d'attribution, les documents détaillés ci-dessous :</p>
                    <ul className="list-disc ml-6 mb-4 text-sm">
                      <li>Une déclaration sur l'honneur attestant qu'il ne se trouve pas dans un cas d'interdiction de soumissionner</li>
                      <li>Les certificats sociaux : attestation URSSAF/AGEFIPH ou RSI, versement régulier des cotisations de congés payés et de chômage intempéries</li>
                      <li>Les certificats fiscaux : impôt sur le revenu, impôt sur les sociétés, impôt sur la valeur ajoutée</li>
                      <li>Le cas échéant, en cas de redressement judiciaire la copie du ou des jugements prononcés</li>
                      <li>Le cas échéant, les pièces prévues aux articles R. 1263-12, D. 8222-5 ou D. 8222-7 ou D. 8254-2 à D. 8254-5 du code du travail sur le travail dissimulé</li>
                    </ul>
                    <p className="mb-2 text-sm">Bien que les documents précités ne soient exigibles qu'auprès de l'attributaire du marché public, il est fortement conseillé aux candidats de se doter de ces documents dès qu'ils soumissionnent à un marché public.</p>
                    <p className="mb-2 text-sm">En cas de cotraitance ou sous-traitance, ces éléments seront à fournir par chaque cotraitant et sous-traitant.</p>
                    <p className="mb-2 text-sm">Le non-respect de ces formalités relatives aux attestations et certificats dans un délai maximum de dix (10) jours à compter de la demande du pouvoir adjudicateur entraîne le rejet de l'offre. La même demande est alors faite au candidat suivant dans le classement des offres.</p>
                    <p className="text-sm">Pour rappel, le candidat retenu est informé que les documents mentionnés aux articles D. 8222-5 ou D. 8222-7 ou D. 8254-2 à D. 8254-5 du code du travail, seront à remettre à l'acheteur tous les 6 mois jusqu'à la fin de l'exécution de son marché, ainsi qu'une attestation d'assurance responsabilité civile en cours de validité (chaque année).</p>
                  </div>
                  
                  {/* Chapitre 10 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">10  NÉGOCIATION</h2>
                    <p className="text-sm">La procédure ne comporte pas de phase de négociation conformément aux articles R.2124-2 et R.2161-2 du Code de la commande publique.</p>
                  </div>

                  {/* Chapitre 11 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">11  DECLARATION SANS SUITE</h2>
                    <p>L'AFPA pourra décider de ne pas donner suite à la présente consultation pour un motif d'intérêt général. Dans l'hypothèse où l'AFPA déciderait de la déclarer sans suite, les candidats ne pourront prétendre à aucune indemnité.</p>
                  </div>

                  {/* Chapitre 12 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">12  PROCEDURE DE RECOURS</h2>
                    <p className="mb-4">En cas de litige, seul le Tribunal administratif de Montreuil est compétent :</p>
                    <div className="text-center mb-4 space-y-1">
                      <p>Tribunal Administratif de Montreuil</p>
                      <p>7, rue Catherine Puig</p>
                      <p>93 100 Montreuil</p>
                      <p>Téléphone : 01 49 20 20 00 - Télécopie : 01 49 20 20 99</p>
                      <p>Courriel : <span className="text-orange-600 underline">greffe.ta-montreuil@juradm.fr</span></p>
                      <p>SIRET : 130 006 869 00015</p>
                    </div>
                    <p className="mb-2 text-sm"><strong>Référé précontractuel :</strong> conformément à l'article L. 551-1 et aux articles R. 551-1 à R. 551-6 du Code de Justice Administrative, tout opérateur économique ayant intérêt à conclure le contrat peut introduire un référé précontractuel contre tout acte de la passation jusqu'à la date de signature du marché, auprès du Tribunal Administratif compétent.</p>
                    <p className="mb-2 text-sm"><strong>Référé contractuel :</strong> conformément à l'article L. 551-13 et aux articles R. 551-7 à R. 551-10 du Code de Justice Administrative...</p>
                    <p className="mb-2 text-sm"><strong>Recours pour excès de pouvoir :</strong> conformément aux articles R. 421-1 et R. 421-2 du Code de Justice Administrative...</p>
                    <p className="mb-4 text-sm"><strong>Recours de plein contentieux :</strong> prévu à l'article R. 421-3 du code de justice administrative et pouvant être exercé dans un délai de deux mois contre les décisions de rejet.</p>
                  </div>
                  
                  <div className="mt-12 space-y-2 not-prose">
                    <p>Fait à Montreuil-sous-Bois,</p>
                    <p>Le ........................</p>
                    <p className="font-bold mt-4">Le Pouvoir Adjudicateur</p>
                  </div>
                </div>

                {/* Boutons d'action en bas */}
                <div className="flex justify-end gap-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Sauvegarder les modifications
                  </button>
                  <button
                    onClick={handleGenerateWord}
                    disabled={isSaving}
                    className="px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    {isSaving ? 'Génération...' : 'Générer Word'}
                  </button>
                </div>
              </div>
            ) : (
              // Mode navigation : afficher une section à la fois
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {activeSection === 0 && (
                  <EnTeteSection 
                    data={formData.enTete} 
                    updateField={updateField}
                    onAutoFill={handleAutoFillFromProcedure}
                    isLoading={isLoadingProcedure}
                    autoFillStatus={autoFillStatus}
                  />
                )}
                {activeSection === 1 && <PouvoirSection data={formData.pouvoirAdjudicateur} updateField={updateField} />}
                {activeSection === 2 && <ObjetSection data={formData.objet} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />}
                {activeSection === 3 && <ConditionsSection data={formData.conditions} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />}
                {activeSection === 4 && <TypeMarcheSection data={formData.typeMarche} updateField={updateField} />}
                {activeSection === 5 && <DCESection data={formData.dce} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />}
                {activeSection === 6 && <JugementSection data={formData.jugement} updateField={updateField} addArrayItem={addArrayItem} removeArrayItem={removeArrayItem} />}
                {activeSection === 7 && <RecoursSection data={formData.recours} updateField={updateField} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sections de formulaire
function EnTeteSection({ data, updateField, onAutoFill, isLoading, autoFillStatus }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">En-tête du document</h2>
      
      {/* Message de statut auto-fill */}
      {autoFillStatus.type && (
        <div className={`p-4 rounded-lg border ${
          autoFillStatus.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
        }`}>
          <div className="flex items-center">
            {autoFillStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{autoFillStatus.message}</span>
          </div>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          N° de procédure (5 chiffres)
        </label>
        <input
          type="text"
          value={data.numeroProcedure || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 5);
            updateField('enTete', 'numeroProcedure', value);
            
            // Auto-fill dès que 5 chiffres sont saisis
            if (value.length === 5) {
              onAutoFill(value);
            }
          }}
          maxLength={5}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg"
          placeholder="12345"
          disabled={isLoading}
        />
        {data.numeroProcedure && (data.numeroProcedure?.length || 0) < 5 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ Le numéro de procédure doit comporter 5 chiffres
          </p>
        )}
        {(data.numeroProcedure?.length || 0) === 5 && !isLoading && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            💡 Les données seront chargées automatiquement depuis la table procédures
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Titre du marché
        </label>
        <textarea
          value={data.titreMarche}
          onChange={(e) => updateField('enTete', 'titreMarche', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Marché de Prestation d'assistance à maitrise d'ouvrage..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            N° de marché
          </label>
          <input
            type="text"
            value={data.numeroMarche}
            onChange={(e) => updateField('enTete', 'numeroMarche', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="AAXXX_XX_XX-XX_XXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type de marché
          </label>
          <select
            value={data.typeMarcheTitle}
            onChange={(e) => updateField('enTete', 'typeMarcheTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option>Marché public de travaux</option>
            <option>Marché public de fournitures</option>
            <option>Marché public de services</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date limite de réception des offres
          </label>
          <input
            type="date"
            value={data.dateLimiteOffres}
            onChange={(e) => updateField('enTete', 'dateLimiteOffres', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Heure limite
          </label>
          <input
            type="time"
            value={data.heureLimiteOffres}
            onChange={(e) => updateField('enTete', 'heureLimiteOffres', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date limite questions
          </label>
          <input
            type="date"
            value={data.dateLimiteQuestions}
            onChange={(e) => updateField('enTete', 'dateLimiteQuestions', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date limite réponses
          </label>
          <input
            type="date"
            value={data.dateLimiteReponses}
            onChange={(e) => updateField('enTete', 'dateLimiteReponses', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}

function PouvoirSection({ data, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Présentation du pouvoir adjudicateur</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nom
          </label>
          <input
            type="text"
            value="Agence pour la formation professionnelle des Adultes"
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            title="Ce nom est fixe et ne peut pas être modifié"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ℹ️ Le nom du pouvoir adjudicateur est fixe et ne peut pas être modifié
          </p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Adresse
          </label>
          <input
            type="text"
            value={data.adresseVoie}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'adresseVoie', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Code postal
          </label>
          <input
            type="text"
            value={data.codePostal}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'codePostal', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ville
          </label>
          <input
            type="text"
            value={data.ville}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'ville', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Téléphone
          </label>
          <input
            type="text"
            value={data.telephone}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'telephone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Courriel
          </label>
          <input
            type="email"
            value={data.courriel}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'courriel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Site web
          </label>
          <input
            type="text"
            value={data.adresseWeb}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'adresseWeb', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profil acheteur
          </label>
          <input
            type="text"
            value={data.profilAcheteur}
            onChange={(e) => updateField('pouvoirAdjudicateur', 'profilAcheteur', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}

function ObjetSection({ data, updateField, addArrayItem, removeArrayItem }: any) {
  const [newCPV, setNewCPV] = useState({ code: '', libelle: '' });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Objet de la consultation</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description de l'objet
        </label>
        <textarea
          value={data.description}
          onChange={(e) => updateField('objet', 'description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          placeholder="Décrivez l'objet de la consultation..."
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Code CPV Principal</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code
            </label>
            <input
              type="text"
              value={data.cpvPrincipal}
              onChange={(e) => updateField('objet', 'cpvPrincipal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: 45000000-7"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Libellé
            </label>
            <input
              type="text"
              value={data.cpvPrincipalLib}
              onChange={(e) => updateField('objet', 'cpvPrincipalLib', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Travaux de construction"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Codes CPV Secondaires</h3>
        
        <div className="space-y-2 mb-3">
          {data.cpvSecondaires?.map((cpv: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{cpv.code}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{cpv.libelle}</div>
              </div>
              <button
                onClick={() => removeArrayItem('objet', 'cpvSecondaires', index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={newCPV.code}
            onChange={(e) => setNewCPV({ ...newCPV, code: e.target.value })}
            placeholder="Code CPV"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newCPV.libelle}
            onChange={(e) => setNewCPV({ ...newCPV, libelle: e.target.value })}
            placeholder="Libellé"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        
        <button
          onClick={() => {
            if (newCPV.code && newCPV.libelle) {
              addArrayItem('objet', 'cpvSecondaires', newCPV);
              setNewCPV({ code: '', libelle: '' });
            }
          }}
          className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Ajouter un CPV secondaire
        </button>
      </div>
    </div>
  );
}

function ConditionsSection({ data, updateField, addArrayItem, removeArrayItem }: any) {
  const [newLot, setNewLot] = useState({ numero: '', intitule: '', montantMax: '' });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Conditions de la consultation</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mode de passation
          </label>
          <select
            value={data.modePassation}
            onChange={(e) => updateField('conditions', 'modePassation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option>Appel d'offres ouvert</option>
            <option>Appel d'offres restreint</option>
            <option>Procédure adaptée</option>
            <option>Marché négocié</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de lots
          </label>
          <input
            type="text"
            value={data.nbLots}
            onChange={(e) => updateField('conditions', 'nbLots', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Lots</h3>
        
        <div className="space-y-2 mb-3">
          {data.lots?.map((lot: any, index: number) => (
            <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Lot n°{lot.numero}: {lot.intitule}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Montant max: {lot.montantMax} € HT</div>
                </div>
                <button
                  onClick={() => removeArrayItem('conditions', 'lots', index)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="text"
            value={newLot.numero}
            onChange={(e) => setNewLot({ ...newLot, numero: e.target.value })}
            placeholder="N°"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newLot.intitule}
            onChange={(e) => setNewLot({ ...newLot, intitule: e.target.value })}
            placeholder="Intitulé"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newLot.montantMax}
            onChange={(e) => setNewLot({ ...newLot, montantMax: e.target.value })}
            placeholder="Montant max €"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        
        <button
          onClick={() => {
            if (newLot.numero && newLot.intitule) {
              addArrayItem('conditions', 'lots', newLot);
              setNewLot({ numero: '', intitule: '', montantMax: '' });
            }
          }}
          className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Ajouter un lot
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Options</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.variantesAutorisees}
              onChange={(e) => updateField('conditions', 'variantesAutorisees', e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Variantes autorisées</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.groupementSolidaire}
              onChange={(e) => updateField('conditions', 'groupementSolidaire', e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Groupement solidaire autorisé</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.groupementConjoint}
              onChange={(e) => updateField('conditions', 'groupementConjoint', e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Groupement conjoint autorisé</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={data.visiteObligatoire}
              onChange={(e) => updateField('conditions', 'visiteObligatoire', e.target.checked)}
              className="mr-2 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Visite préalable obligatoire</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function TypeMarcheSection({ data, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Type de marché</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Forme du marché
        </label>
        <select
          value={data.forme}
          onChange={(e) => updateField('typeMarche', 'forme', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option>Accord-cadre mono-attributaire</option>
          <option>Accord-cadre multi-attributaires</option>
          <option>Marché à bons de commande</option>
          <option>Marché ordinaire</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 min-h-[40px] flex items-center">
            Durée initiale (mois)
          </label>
          <input
            type="text"
            value={data.dureeInitiale}
            onChange={(e) => updateField('typeMarche', 'dureeInitiale', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 min-h-[40px] flex items-center">
            Nb reconductions
          </label>
          <input
            type="text"
            value={data.nbReconductions}
            onChange={(e) => updateField('typeMarche', 'nbReconductions', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 min-h-[40px] flex items-center">
            Durée reconduction (mois)
          </label>
          <input
            type="text"
            value={data.dureeReconduction}
            onChange={(e) => updateField('typeMarche', 'dureeReconduction', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 min-h-[40px] flex items-center">
            Durée max (mois)
          </label>
          <input
            type="text"
            value={data.dureeMax}
            onChange={(e) => updateField('typeMarche', 'dureeMax', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lieu d'exécution
        </label>
        <textarea
          value={data.lieuExecution}
          onChange={(e) => updateField('typeMarche', 'lieuExecution', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Ex: Ensemble du périmètre territorial de l'Afpa"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.sousTraitanceTotaleInterdite}
            onChange={(e) => updateField('typeMarche', 'sousTraitanceTotaleInterdite', e.target.checked)}
            className="mr-2 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Sous-traitance totale interdite</span>
        </label>
      </div>
    </div>
  );
}

function DCESection({ data, updateField, addArrayItem, removeArrayItem }: any) {
  const [newDoc, setNewDoc] = useState('');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Contenu du DCE</h2>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Documents du dossier</h3>

        <div className="space-y-2 mb-3">
          {data.documents?.map((doc: string, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
              <span className="text-gray-900 dark:text-white text-sm">{doc}</span>
              <button
                onClick={() => removeArrayItem('dce', 'documents', index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newDoc}
            onChange={(e) => setNewDoc(e.target.value)}
            placeholder="Ajouter un document..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={() => {
              if (newDoc) {
                addArrayItem('dce', 'documents', newDoc);
                setNewDoc('');
              }
            }}
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Ajouter
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          CCAG Applicable
        </label>
        <select
          value={data.ccagApplicable || ''}
          onChange={e => updateField('dce', 'ccagApplicable', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">-- Sélectionner --</option>
          <option value="CCAG-FCS">CCAG-FCS - Fournitures Courantes et Services</option>
          <option value="CCAG-PI">CCAG-PI - Prestations Intellectuelles</option>
          <option value="CCAG-TIC">CCAG-TIC - Techniques de l'Information et de la Communication</option>
          <option value="CCAG-MI">CCAG-MI - Marchés Industriels</option>
          <option value="CCAG-Travaux">CCAG-Travaux - Marchés de Travaux</option>
          <option value="CCAG-MOE">CCAG-MOE - Maîtrise d'Œuvre</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URL CCAG
        </label>
        <input
          type="text"
          value={data.urlCCAG}
          onChange={(e) => updateField('dce', 'urlCCAG', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function JugementSection({ data, updateField, addArrayItem, removeArrayItem }: any) {
  const [newCritere, setNewCritere] = useState({ nom: '', points: '' });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. Sélection et jugement des offres</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Critère Financier (%)
          </label>
          <input
            type="text"
            value={data.critereFinancier}
            onChange={(e) => updateField('jugement', 'critereFinancier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Critère Technique (%)
          </label>
          <input
            type="text"
            value={data.critereTechnique}
            onChange={(e) => updateField('jugement', 'critereTechnique', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sous-critères techniques</h3>
        
        <div className="space-y-2 mb-3">
          {data.sousCriteresTechniques?.map((critere: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{critere.nom}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{critere.points} points</div>
              </div>
              <button
                onClick={() => removeArrayItem('jugement', 'sousCriteresTechniques', index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={newCritere.nom}
            onChange={(e) => setNewCritere({ ...newCritere, nom: e.target.value })}
            placeholder="Nom du critère"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            type="text"
            value={newCritere.points}
            onChange={(e) => setNewCritere({ ...newCritere, points: e.target.value })}
            placeholder="Points"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        
        <button
          onClick={() => {
            if (newCritere.nom && newCritere.points) {
              addArrayItem('jugement', 'sousCriteresTechniques', newCritere);
              setNewCritere({ nom: '', points: '' });
            }
          }}
          className="w-full px-4 py-2 text-sm text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Plus className="w-4 h-4 inline mr-1" />
          Ajouter un sous-critère
        </button>
      </div>
    </div>
  );
}

function RecoursSection({ data, updateField }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">12. Procédure de recours</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nom du tribunal
        </label>
        <input
          type="text"
          value={data.tribunalNom}
          onChange={(e) => updateField('recours', 'tribunalNom', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Adresse
        </label>
        <input
          type="text"
          value={data.tribunalAdresse}
          onChange={(e) => updateField('recours', 'tribunalAdresse', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ville
        </label>
        <input
          type="text"
          value={data.tribunalVille}
          onChange={(e) => updateField('recours', 'tribunalVille', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Téléphone
          </label>
          <input
            type="text"
            value={data.tribunalTel}
            onChange={(e) => updateField('recours', 'tribunalTel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Courriel
          </label>
          <input
            type="email"
            value={data.tribunalCourriel}
            onChange={(e) => updateField('recours', 'tribunalCourriel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SIRET
        </label>
        <input
          type="text"
          value={data.tribunalSIRET}
          onChange={(e) => updateField('recours', 'tribunalSIRET', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
}

// Prévisualisation
function PreviewContent({ data }: { data: RapportCommissionData }) {
  return (
    <div className="prose dark:prose-invert max-w-none text-xs">
      <h3 className="text-base font-bold mb-4 text-center">RÈGLEMENT DE CONSULTATION</h3>
      
      {data.enTete.numeroProcedure && (
        <div className="mb-2 text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Procédure n° {data.enTete.numeroProcedure}
          </p>
        </div>
      )}
      
      {data.enTete.titreMarche && (
        <div className="mb-4 text-center">
          <p className="font-semibold">{data.enTete.titreMarche}</p>
          {data.enTete.numeroMarche && <p className="text-xs break-words" style={{wordBreak: 'break-word'}}>{data.enTete.numeroMarche}</p>}
        </div>
      )}

      {data.pouvoirAdjudicateur.nom && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">POUVOIR ADJUDICATEUR</h4>
          <p>{data.pouvoirAdjudicateur.nom}</p>
          <p>{data.pouvoirAdjudicateur.adresseVoie}</p>
          <p>{data.pouvoirAdjudicateur.codePostal} {data.pouvoirAdjudicateur.ville}</p>
        </div>
      )}

      {data.objet.description && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">OBJET</h4>
          <p>{data.objet.description}</p>
        </div>
      )}

      {data.conditions.lots && data.conditions.lots.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-sm">LOTS</h4>
          <ul className="list-disc pl-5">
            {data.conditions.lots.map((lot: any, i: number) => (
              <li key={i}>Lot {lot.numero}: {lot.intitule} ({lot.montantMax} € HT)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
