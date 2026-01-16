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

export default function ReglementConsultation() {
  const [showFullEdit, setShowFullEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoadingProcedure, setIsLoadingProcedure] = useState(false);
  const [autoFillStatus, setAutoFillStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  const [formData, setFormData] = useState<RapportCommissionData>({
    enTete: {
      numeroProcedure: '',
      titreMarche: '',
      numeroMarche: '',
      typeMarcheTitle: 'MARCHE PUBLIC DE FOURNITURES ET SERVICES',
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
      adresseWeb: 'www.afpa.fr',
      profilAcheteur: 'http://afpa.e-marchespublics.com',
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

  const handleSave = () => {
    localStorage.setItem('reglementConsultationData', JSON.stringify(formData));
    alert('Données sauvegardées !');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('reglementConsultationData');
    if (saved) {
      setFormData(JSON.parse(saved));
      alert('Données chargées !');
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Règlement de consultation
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Génération de règlement de consultation (marchés publics)
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLoad}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Charger
              </button>
              
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Sauvegarder
              </button>
              
              <button
                onClick={() => setShowFullEdit(!showFullEdit)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <FileCheck className="w-4 h-4 inline mr-2" />
                {showFullEdit ? 'Mode navigation' : 'Édition complète'}
              </button>
              
              <button
                onClick={handleGenerateWord}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
                      <p><strong>N° de marché :</strong> <input type="text" value={formData.enTete.numeroMarche} onChange={(e) => updateField('enTete', 'numeroMarche', e.target.value)} className="border-b border-gray-300 outline-none" /></p>
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
                    <p className="mb-4">L'Agence Nationale pour la Formation Professionnelle des Adultes (ci-après Afpa) est un établissement public à caractère industriel et commercial (EPIC) d'Etat, créé le 1er janvier 2017...</p>
                    <p className="mb-2">L'Afpa a depuis lors pour principales missions et spécialités définies au Code du Travail (articles L5315-1 à L5315-10) :</p>
                    <ul className="list-none ml-4 mb-4 space-y-1">
                      <li>• De participer à la formation et à la qualification des personnes...</li>
                      <li>• De contribuer à la politique de certification du ministère de l'Emploi</li>
                      <li>• De contribuer à l'égal accès des hommes et femmes à la formation professionnelle...</li>
                      <li>• De contribuer à l'égal accès sur tout le territoire...</li>
                      <li>• De contribuer à l'émergence et à l'organisation de nouveaux métiers...</li>
                      <li>• De contribuer à la politique de certification de l'Etat...</li>
                      <li>• De participer à la formation des personnes en recherche d'emploi...</li>
                    </ul>
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
                    <p className="mb-2"><strong>Forme :</strong> <input type="text" value={formData.typeMarche.forme} onChange={(e) => updateField('typeMarche', 'forme', e.target.value)} className="border-b border-gray-300 outline-none" /></p>
                    <p className="mb-2"><strong>Durée initiale :</strong> <input type="text" value={formData.typeMarche.dureeInitiale} onChange={(e) => updateField('typeMarche', 'dureeInitiale', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> mois</p>
                    <p className="mb-2"><strong>Nombre de reconductions :</strong> <input type="text" value={formData.typeMarche.nbReconductions} onChange={(e) => updateField('typeMarche', 'nbReconductions', e.target.value)} className="border-b border-gray-300 outline-none w-20" /></p>
                    <p className="mb-2"><strong>Durée maximale :</strong> <input type="text" value={formData.typeMarche.dureeMax} onChange={(e) => updateField('typeMarche', 'dureeMax', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> mois</p>
                    <p className="mb-2"><strong>Lieu d'exécution :</strong> <input type="text" value={formData.typeMarche.lieuExecution} onChange={(e) => updateField('typeMarche', 'lieuExecution', e.target.value)} className="border-b border-gray-300 outline-none flex-1" /></p>
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
                    <p className="mt-2"><strong>CCAG :</strong> <input type="text" value={formData.dce.urlCCAG} onChange={(e) => updateField('dce', 'urlCCAG', e.target.value)} className="border-b border-gray-300 outline-none flex-1" /></p>
                  </div>

                  {/* Chapitre 7 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">7  CONDITIONS DE REMISE</h2>
                    <p className="mb-2"><strong>Délai de validité des offres :</strong> <input type="text" value={formData.remise.delaiValiditeOffres} onChange={(e) => updateField('remise', 'delaiValiditeOffres', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> jours</p>
                  </div>

                  {/* Chapitre 8 */}
                  <div className="mb-6 not-prose">
                    <h2 className="text-lg font-bold bg-[#5DBDB4] text-black p-2 mb-4">8  JUGEMENT DES OFFRES</h2>
                    <p className="mb-2"><strong>Critère financier :</strong> <input type="text" value={formData.jugement.critereFinancier} onChange={(e) => updateField('jugement', 'critereFinancier', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> %</p>
                    <p className="mb-2"><strong>Critère technique :</strong> <input type="text" value={formData.jugement.critereTechnique} onChange={(e) => updateField('jugement', 'critereTechnique', e.target.value)} className="border-b border-gray-300 outline-none w-20" /> %</p>
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
        <div className="flex gap-2">
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
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg"
            placeholder="12345"
            disabled={isLoading}
          />
          
          {(data.numeroProcedure?.length || 0) === 5 && (
            <button
              onClick={() => onAutoFill(data.numeroProcedure)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Recharger les données depuis Supabase"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
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
            <option>MARCHE PUBLIC DE FOURNITURES ET SERVICES</option>
            <option>MARCHE PUBLIC DE TRAVAUX</option>
            <option>MARCHE PUBLIC DE PRESTATIONS INTELLECTUELLES</option>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
          {data.enTete.numeroMarche && <p className="text-xs">{data.enTete.numeroMarche}</p>}
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
