import React, { useState, useEffect } from 'react';
import { X, FileSignature, FileCheck, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Noti1Modal from '../analyse/Noti1Modal';
import Noti5Modal from '../analyse/Noti5Modal';
import Noti3Modal from '../analyse/Noti3Modal';
import MultiLotsDashboard from './MultiLotsDashboard';
import { analyzeMultiLots, isMultiLots } from './services/multiLotsAnalyzer';
import type { Noti1Data } from './types/noti1';
import type { Noti5Data } from './types/noti5';
import type { Noti3Data } from './types/noti3';
import type { MultiLotsAnalysis } from './types/multiLots';

interface NotificationsQuickAccessProps {
  procedures?: any[]; // Optionnel si preloadedData fourni
  onClose: () => void;
  preloadedData?: { // Données pré-chargées depuis le rapport
    procedure: any;
    candidats: any[];
    rapportData: any;
  };
}

export default function NotificationsQuickAccess({ procedures = [], onClose, preloadedData }: NotificationsQuickAccessProps) {
  const [selectedProcedure, setSelectedProcedure] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(!!preloadedData); // True si données pré-chargées
  const [cachedData, setCachedData] = useState<any>(preloadedData || null); // Initialiser avec preloadedData
  const [multiLotsAnalysis, setMultiLotsAnalysis] = useState<MultiLotsAnalysis | null>(null);
  const [showMultiLotsDashboard, setShowMultiLotsDashboard] = useState(false);
  
  // États des modals
  const [showNoti1Modal, setShowNoti1Modal] = useState(false);
  const [showNoti5Modal, setShowNoti5Modal] = useState(false);
  const [showNoti3Modal, setShowNoti3Modal] = useState(false);
  
  // Données des NOTI
  const [noti1Data, setNoti1Data] = useState<Noti1Data | null>(null);
  const [noti5Data, setNoti5Data] = useState<Noti5Data | null>(null);
  const [noti3Data, setNoti3Data] = useState<Noti3Data[]>([]);

  // Filtrer les procédures selon le terme de recherche
  const filteredProcedures = procedures.filter(proc => {
    if (!searchTerm) return true;
    const numeroAfpa = (proc['Numéro de procédure (Afpa)'] || '').toLowerCase();
    const nomProcedure = (proc['Nom de la procédure'] || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return numeroAfpa.includes(search) || nomProcedure.includes(search);
  });

  // Cleanup à la fermeture
  useEffect(() => {
    // Si données pré-chargées, charger les candidats depuis Supabase et analyser multi-lots
    if (preloadedData && preloadedData.rapportData && preloadedData.procedure) {
      const loadCandidatsAndAnalyze = async () => {
        try {
          // Extraire le numéro court de la procédure
          const numeroAfpa = preloadedData.procedure['Numéro de procédure (Afpa)'];
          const numeroCourt = numeroAfpa?.match(/^(\d{5})/)?.[1];

          let candidats: any[] = [];

          if (numeroCourt) {
            // Charger les candidats depuis ouverture_plis
            const { data: allOuverturePlis } = await supabase
              .from('ouverture_plis')
              .select('*');

            if (allOuverturePlis && allOuverturePlis.length > 0) {
              const procedureMatch = allOuverturePlis.find((pli: any) => 
                String(pli.num_proc) === numeroCourt
              );

              if (procedureMatch) {
                candidats = typeof procedureMatch.candidats === 'string' 
                  ? JSON.parse(procedureMatch.candidats)
                  : (procedureMatch.candidats || []);
              }
            }
          }

          // Mettre à jour cachedData avec les candidats
          const updatedData = {
            ...preloadedData,
            candidats,
          };
          setCachedData(updatedData);

          // Analyser multi-lots
          const analysis = analyzeMultiLots(preloadedData.rapportData, candidats);
          setMultiLotsAnalysis(analysis);
          if (analysis && analysis.totalLots > 1) {
            setShowMultiLotsDashboard(true);
          }
        } catch (error) {
          console.error('Erreur chargement candidats:', error);
        }
      };

      loadCandidatsAndAnalyze();
    }
    
    return () => {
      setCachedData(null);
      setMultiLotsAnalysis(null);
      setShowMultiLotsDashboard(false);
      setNoti1Data(null);
      setNoti5Data(null);
      setNoti3Data([]);
    };
  }, [preloadedData]);

  const loadProcedureData = async () => {
    if (!selectedProcedure) {
      alert('Veuillez sélectionner une procédure');
      return;
    }

    setIsLoading(true);
    try {
      const procedure = procedures.find(p => p.NumProc === selectedProcedure);
      if (!procedure) {
        alert('Procédure introuvable');
        return;
      }

      const numeroAfpa = procedure['Numéro de procédure (Afpa)'];
      const numeroCourt = numeroAfpa?.match(/^(\d{5})/)?.[1];

      if (!numeroCourt) {
        alert('Numéro de procédure invalide');
        return;
      }

      // Charger les données depuis ouverture_plis et rapports_presentation
      const { data: allOuverturePlis } = await supabase
        .from('ouverture_plis')
        .select('*');

      const procedureMatch = allOuverturePlis?.find((pli: any) => 
        String(pli.num_proc) === numeroCourt
      );

      let candidats: any[] = [];
      if (procedureMatch) {
        try {
          candidats = typeof procedureMatch.candidats === 'string' 
            ? JSON.parse(procedureMatch.candidats)
            : (procedureMatch.candidats || []);
        } catch (e) {
          console.error('Erreur parsing candidats:', e);
        }
      }

      // Charger le dernier rapport de présentation
      const { data: rapport } = await supabase
        .from('rapports_presentation')
        .select('rapport_data')
        .eq('num_proc', procedure.NumProc)
        .order('date_modification', { ascending: false })
        .limit(1)
        .single();

      const rapportData = rapport?.rapport_data;

      // Stocker en cache
      setCachedData({
        procedure,
        candidats,
        rapportData,
        numeroAfpa,
        numeroCourt,
      });

      // Vérifier si multi-lots
      if (rapportData && isMultiLots(rapportData)) {
        const analysis = analyzeMultiLots(rapportData, candidats);
        setMultiLotsAnalysis(analysis);
        setShowMultiLotsDashboard(true);
      } else {
        setMultiLotsAnalysis(null);
        setShowMultiLotsDashboard(false);
      }

      setDataLoaded(true);
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      alert('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNoti1 = () => {
    if (!cachedData || !cachedData.rapportData) {
      alert('Veuillez d\'abord charger un rapport de présentation pour cette procédure');
      return;
    }

    const { procedure, candidats, rapportData } = cachedData;
    const attributaire = rapportData.section9_attribution?.attributairePressenti || '';
    
    const coordonnees = candidats.find((c: any) => 
      (c.societe || c.nom || '').toLowerCase().includes(attributaire.toLowerCase()) ||
      attributaire.toLowerCase().includes((c.societe || c.nom || '').toLowerCase())
    );

    const lots = rapportData.section7_2_syntheseLots?.lots || [];
    const lotsForNoti1 = lots.map((lot: any) => ({
      numero: String(lot.numero || ''),
      intitule: lot.nomLot || lot.nom || '',
    }));

    const noti1: Noti1Data = {
      numeroProcedure: procedure['Numéro de procédure (Afpa)'] || '',
      pouvoirAdjudicateur: {
        nom: 'Agence nationale pour la formation professionnelle des adultes',
        adresseVoie: '3, rue Franklin',
        codePostal: '93100',
        ville: 'MONTREUIL',
      },
      objetConsultation: procedure['Nom de la procédure'] || rapportData.section1_contexte?.objetMarche || '',
      titulaire: {
        denomination: attributaire,
        siret: coordonnees?.siret || '',
        adresse1: coordonnees?.adresse || '',
        adresse2: '',
        codePostal: coordonnees?.codePostal || '',
        ville: coordonnees?.ville || '',
        email: coordonnees?.email || '',
        telephone: coordonnees?.telephone || '',
        fax: '',
        estMandataire: false,
      },
      attribution: {
        type: lots.length > 1 ? 'lots' : 'ensemble',
        lots: lotsForNoti1,
      },
      documents: {
        dateSignature: '',
        candidatFrance: true,
        candidatEtranger: false,
        documentsPreuve: '',
        delaiReponse: '',
        decompteA: 'réception',
      },
      signature: {
        lieu: 'Montreuil',
        date: '',
        signataireTitre: '',
        signataireNom: '',
      },
    };

    setNoti1Data(noti1);
    setShowNoti1Modal(true);
  };

  const generateNoti5 = () => {
    if (!cachedData || !cachedData.rapportData) {
      alert('Veuillez d\'abord charger un rapport de présentation pour cette procédure');
      return;
    }

    const { procedure, candidats, rapportData } = cachedData;
    const attributaire = rapportData.section9_attribution?.attributairePressenti || '';
    
    const coordonnees = candidats.find((c: any) => 
      (c.societe || c.nom || '').toLowerCase().includes(attributaire.toLowerCase()) ||
      attributaire.toLowerCase().includes((c.societe || c.nom || '').toLowerCase())
    );

    const lots = rapportData.section7_2_syntheseLots?.lots || [];
    const lotsForNoti5 = lots.map((lot: any) => ({
      numero: String(lot.numero || ''),
      intitule: lot.nomLot || lot.nom || '',
    }));

    const noti5: Noti5Data = {
      numeroProcedure: procedure['Numéro de procédure (Afpa)'] || '',
      pouvoirAdjudicateur: {
        nom: 'AFPA',
        adresseVoie: '3, rue Franklin',
        codePostal: '93100',
        ville: 'MONTREUIL',
      },
      objetConsultation: procedure['Nom de la procédure'] || rapportData.section1_contexte?.objetMarche || '',
      notification: {
        type: lots.length > 1 ? 'lots' : 'ensemble',
        lots: lotsForNoti5,
      },
      attributaire: {
        denomination: attributaire,
        siret: coordonnees?.siret || '',
        adresse1: coordonnees?.adresse || '',
        adresse2: '',
        codePostal: coordonnees?.codePostal || '',
        ville: coordonnees?.ville || '',
        email: coordonnees?.email || '',
        telephone: coordonnees?.telephone || '',
        fax: '',
        estMandataire: false,
      },
      executionPrestations: {
        type: 'immediate',
      },
      garanties: {
        aucuneGarantie: true,
        retenue: {
          active: false,
          pourcentage: 0,
          remplacablePar: {
            garantiePremieredemande: false,
            cautionPersonnelle: false,
          },
        },
        garantieAvanceSuperieure30: false,
        garantieAvanceInferieure30: {
          active: false,
          remplacableParCaution: false,
        },
      },
      piecesJointes: {
        actEngagementPapier: true,
        actEngagementPDF: true,
      },
      signature: {
        lieu: 'Montreuil',
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        signataireTitre: 'Le Directeur National des Achats',
        signataireNom: '',
      },
    };

    setNoti5Data(noti5);
    setShowNoti5Modal(true);
  };

  const generateNoti3 = () => {
    if (!cachedData || !cachedData.rapportData) {
      alert('Veuillez d\'abord charger un rapport de présentation pour cette procédure');
      return;
    }

    const { procedure, candidats, rapportData } = cachedData;
    const attributaire = rapportData.section9_attribution?.attributairePressenti || '';
    const tableauNotes = rapportData.section7_valeurOffres?.tableau || 
                         rapportData.section7_2_syntheseLots?.lots?.[0]?.tableau || [];
    
    // Récupérer les pondérations depuis section2_criteres
    const criteres = rapportData.section2_criteres || {};
    const maxEco = String(criteres.criterePrix || criteres.critereFinancier || '60');
    const maxTech = String(criteres.critereTechnique || criteres.critereValeurTechnique || '40');
    
    const notesAttributaire = tableauNotes.find((offre: any) => 
      offre.raisonSociale?.toLowerCase().includes(attributaire.toLowerCase()) ||
      attributaire.toLowerCase().includes(offre.raisonSociale?.toLowerCase())
    );

    const perdants: Noti3Data[] = [];

    candidats.forEach((candidat: any) => {
      const nomCandidat = candidat.societe || candidat.nom || '';
      const isAttributaire = nomCandidat.toLowerCase().includes(attributaire.toLowerCase()) || 
                            attributaire.toLowerCase().includes(nomCandidat.toLowerCase());
      
      if (!isAttributaire && nomCandidat) {
        const notesCandidat = tableauNotes.find((offre: any) => 
          offre.raisonSociale?.toLowerCase().includes(nomCandidat.toLowerCase()) ||
          nomCandidat.toLowerCase().includes(offre.raisonSociale?.toLowerCase())
        );

        const noti3: Noti3Data = {
          numeroProcedure: procedure['Numéro de procédure (Afpa)'] || '',
          pouvoirAdjudicateur: {
            nom: 'AFPA - Association nationale pour la formation professionnelle des adultes',
            adresseVoie: '13, place du Général de Gaulle',
            codePostal: '93100',
            ville: 'Montreuil',
          },
          objetConsultation: procedure['Nom de la procédure'] || rapportData.section1_contexte?.objetMarche || '',
          notification: {
            type: 'ensemble',
            lots: [],
          },
          candidat: {
            denomination: nomCandidat,
            adresse1: candidat.adresse || '',
            codePostal: candidat.codePostal || '',
            ville: candidat.ville || '',
            siret: candidat.siret || '',
            email: candidat.email || '',
            telephone: candidat.telephone || '',
          },
          rejet: {
            type: 'offre',
            motifs: 'Votre offre n\'a pas obtenu la meilleure note au regard des critères d\'analyse définis dans le Règlement de la Consultation.',
            noteEco: notesCandidat ? String(Math.round(notesCandidat.noteFinanciere || notesCandidat.noteFinanciereSur60 || 0)) : '0',
            noteTech: notesCandidat ? String(Math.round(notesCandidat.noteTechnique || notesCandidat.noteTechniqueSur40 || 0)) : '0',
            total: notesCandidat ? String(Math.round(notesCandidat.noteFinaleSur100 || 0)) : '0',
            classement: notesCandidat ? String(notesCandidat.rangFinal || '-') : '-',
            maxEco,
            maxTech,
          },
          attributaire: {
            denomination: attributaire,
            noteEco: notesAttributaire ? String(Math.round(notesAttributaire.noteFinanciere || notesAttributaire.noteFinanciereSur60 || 0)) : maxEco,
            noteTech: notesAttributaire ? String(Math.round(notesAttributaire.noteTechnique || notesAttributaire.noteTechniqueSur40 || 0)) : maxTech,
            total: notesAttributaire ? String(Math.round(notesAttributaire.noteFinaleSur100 || 0)) : '100',
            motifs: 'Offre économiquement la plus avantageuse au regard des critères d\'analyse.',
            maxEco,
            maxTech,
          },
          delaiStandstill: '11',
          signature: {
            lieu: 'Montreuil',
            date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
            signataireTitre: 'Le Directeur National des Achats',
            signataireNom: '',
          },
        };
        perdants.push(noti3);
      }
    });

    if (perdants.length === 0) {
      alert('Aucun candidat non retenu trouvé');
      return;
    }

    setNoti3Data(perdants);
    setShowNoti3Modal(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Notifications rapides (NOTI1, NOTI5, NOTI3)
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {!dataLoaded ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sélectionnez une procédure pour charger les données nécessaires aux notifications
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tapez un numéro (ex: 25001) ou un nom..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {filteredProcedures.length} procédure{filteredProcedures.length > 1 ? 's' : ''} trouvée{filteredProcedures.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Procédure
              </label>
              <select
                value={selectedProcedure}
                onChange={(e) => setSelectedProcedure(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                size={Math.min(filteredProcedures.length + 1, 8)}
              >
                <option value="">-- Sélectionner une procédure --</option>
                {filteredProcedures.map((proc) => (
                  <option key={proc.NumProc} value={proc.NumProc}>
                    {proc['Numéro de procédure (Afpa)']} - {proc['Nom de la procédure']}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadProcedureData}
              disabled={!selectedProcedure || isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Charger les données'
              )}
            </button>
          </div>
        ) : showMultiLotsDashboard && multiLotsAnalysis && cachedData ? (
          <MultiLotsDashboard
            analysis={multiLotsAnalysis}
            procedureInfo={{
              numeroAfpa: cachedData.procedure['Numéro de procédure (Afpa)'] || '',
              numProc: cachedData.procedure.NumProc || '',
              objet: cachedData.procedure['Nom de la procédure'] || '',
            }}
            procedureData={cachedData.procedure}
            rapportData={cachedData.rapportData}
            onClose={() => {
              setDataLoaded(false);
              setCachedData(null);
              setSelectedProcedure('');
              setSearchTerm('');
              setShowMultiLotsDashboard(false);
              setMultiLotsAnalysis(null);
            }}
          />
        ) : cachedData ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✓ Données chargées pour : {cachedData.procedure['Nom de la procédure']}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {cachedData.candidats.length} candidat(s) trouvé(s)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={generateNoti1}
                className="flex flex-col items-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                <FileSignature className="w-8 h-8" />
                <span>NOTI1</span>
                <span className="text-xs opacity-90">Attribution</span>
              </button>

              <button
                onClick={generateNoti5}
                className="flex flex-col items-center gap-2 p-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                <FileCheck className="w-8 h-8" />
                <span>NOTI5</span>
                <span className="text-xs opacity-90">Marché public</span>
              </button>

              <button
                onClick={generateNoti3}
                className="flex flex-col items-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                <FileText className="w-8 h-8" />
                <span>NOTI3</span>
                <span className="text-xs opacity-90">Rejets</span>
              </button>
            </div>

            <button
              onClick={() => {
                setDataLoaded(false);
                setCachedData(null);
                setSelectedProcedure('');
                setSearchTerm('');
              }}
              className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              ← Changer de procédure
            </button>
          </div>
        ) : null}
      </div>

      {/* Modals */}
      {showNoti1Modal && noti1Data && cachedData && (
        <Noti1Modal
          isOpen={showNoti1Modal}
          onClose={() => setShowNoti1Modal(false)}
          initialData={noti1Data}
          procedureInfo={{
            numeroAfpa: cachedData.procedure['Numéro de procédure (Afpa)'] || '',
            numProc: cachedData.procedure.NumProc || '',
            objet: cachedData.procedure['Nom de la procédure'] || '',
          }}
        />
      )}

      {showNoti5Modal && noti5Data && cachedData && (
        <Noti5Modal
          isOpen={showNoti5Modal}
          onClose={() => setShowNoti5Modal(false)}
          initialData={noti5Data}
          procedureInfo={{
            numeroAfpa: cachedData.procedure['Numéro de procédure (Afpa)'] || '',
            numProc: cachedData.procedure.NumProc || '',
            objet: cachedData.procedure['Nom de la procédure'] || '',
          }}
        />
      )}

      {showNoti3Modal && noti3Data.length > 0 && cachedData && (
        <Noti3Modal
          isOpen={showNoti3Modal}
          onClose={() => setShowNoti3Modal(false)}
          perdants={noti3Data}
          procedureInfo={{
            numeroAfpa: cachedData.procedure['Numéro de procédure (Afpa)'] || '',
            numProc: cachedData.procedure.NumProc || '',
            objet: cachedData.procedure['Nom de la procédure'] || '',
          }}
        />
      )}
    </div>
  );
}
