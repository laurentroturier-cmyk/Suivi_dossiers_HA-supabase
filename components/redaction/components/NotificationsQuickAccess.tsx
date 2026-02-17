import React, { useState, useEffect } from 'react';
import { X, FileSignature, FileCheck, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Noti1Modal, Noti3Modal, Noti5Modal } from '../../analyse';
import MultiLotsDashboard from './MultiLotsDashboard';
import NotiParLots from './NotiParLots';
import NotiModeSelector from './NotiModeSelector';
import { analyzeMultiLots, isMultiLots } from '../utils/multiLotsAnalyzer';
import type { Noti1Data } from '../types/noti1';
import type { Noti5Data } from '../types/noti5';
import type { Noti3Data } from '../types/noti3';
import type { MultiLotsAnalysis } from '../types/multiLots';

/**
 * Charge les candidats enrichis depuis la table ouverture_plis
 * Cette table contient les données complètes des candidats (SIRET, adresse, email, etc.)
 */
async function loadCandidatsFromOuverturePlis(numProc: string): Promise<any[]> {
  try {
    // Essayer de charger d'abord l'analyse "complet", puis "recevabilite", puis "candidature"
    const typesAnalyse = ['complet', 'recevabilite', 'candidature'] as const;

    for (const typeAnalyse of typesAnalyse) {
      const { data, error } = await supabase
        .from('ouverture_plis')
        .select('candidats')
        .eq('num_proc', numProc)
        .eq('type_analyse', typeAnalyse)
        .maybeSingle();

      if (!error && data?.candidats && Array.isArray(data.candidats) && data.candidats.length > 0) {
        console.log(`✅ Candidats chargés depuis ouverture_plis (${typeAnalyse}):`, data.candidats.length);
        return data.candidats;
      }
    }

    console.log('ℹ️ Aucun candidat trouvé dans ouverture_plis pour:', numProc);
    return [];
  } catch (error) {
    console.error('Erreur chargement ouverture_plis:', error);
    return [];
  }
}

/**
 * Formate une note avec ses décimales (max 2 chiffres après la virgule)
 * Exemple: 42.78 → "42,78"
 */
function formatNote(value: number | undefined | null): string {
  const num = Number(value) || 0;
  // Si c'est un entier, on l'affiche sans décimales
  if (Number.isInteger(num)) {
    return String(num);
  }
  // Sinon on affiche avec 2 décimales max, format français (virgule)
  return num.toLocaleString('fr-FR', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

/**
 * Normalise un nom de société pour la comparaison
 */
function normaliserNom(nom: string): string {
  return nom.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(sarl|sas|eurl|sasu|sa|sci|scp|snc)\s+/gi, '')
    .replace(/\s+(sarl|sas|eurl|sasu|sa|sci|scp|snc)$/gi, '')
    .trim();
}

/**
 * Trouve les coordonnées d'un candidat en cherchant dans ouverture_plis puis depots/retraits
 */
function findCandidatCoordonnees(
  nomCandidat: string,
  candidatsOuverturePlis: any[],
  candidatsDepotsRetraits: any[]
): any {
  const nomNormalise = normaliserNom(nomCandidat);

  // 1. Chercher d'abord dans ouverture_plis (données les plus complètes)
  const candidatOP = candidatsOuverturePlis.find((c: any) => {
    const nomC = c.societe || c.nom || c.raisonSociale || '';
    return normaliserNom(nomC).includes(nomNormalise) ||
           nomNormalise.includes(normaliserNom(nomC));
  });

  if (candidatOP) {
    console.log('✅ Candidat trouvé dans ouverture_plis:', candidatOP.societe);
    return {
      societe: candidatOP.societe || '',
      siret: candidatOP.siret || '',
      adresse: candidatOP.adresse || '',
      codePostal: candidatOP.codePostal || '',
      ville: candidatOP.ville || '',
      email: candidatOP.email || '',
      telephone: candidatOP.telephone || '',
      // Données supplémentaires disponibles dans ouverture_plis
      prenom: candidatOP.prenom || '',
      nom: candidatOP.nom || '',
    };
  }

  // 2. Sinon, chercher dans depots/retraits
  const candidatDR = candidatsDepotsRetraits.find((c: any) => {
    const nomC = c.societe || c.nom || c.raisonSociale || '';
    return normaliserNom(nomC).includes(nomNormalise) ||
           nomNormalise.includes(normaliserNom(nomC));
  });

  if (candidatDR) {
    console.log('ℹ️ Candidat trouvé dans depots/retraits:', candidatDR.societe || candidatDR.nom);
    return {
      societe: candidatDR.societe || candidatDR.raisonSociale || '',
      siret: candidatDR.siret || '',
      adresse: candidatDR.adresse || candidatDR.adressePostale || '',
      codePostal: candidatDR.codePostal || '',
      ville: candidatDR.ville || '',
      email: candidatDR.email || '',
      telephone: candidatDR.telephone || candidatDR.tel || '',
    };
  }

  console.log('⚠️ Candidat non trouvé:', nomCandidat);
  return null;
}

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
  const [showNotiParLots, setShowNotiParLots] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
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
    // Si données pré-chargées, charger les candidats depuis depots/retraits et analyser multi-lots
    if (preloadedData && preloadedData.rapportData && preloadedData.procedure) {
      const loadCandidatsAndAnalyze = async () => {
        try {
          const procedure = preloadedData.procedure;
          
          // Charger les candidats depuis les colonnes depots et retraits
          let candidatsDepots: any[] = [];
          let candidatsRetraits: any[] = [];
          
          try {
            if (procedure.depots) {
              if (typeof procedure.depots === 'string') {
                candidatsDepots = JSON.parse(procedure.depots);
              } else if (Array.isArray(procedure.depots)) {
                candidatsDepots = procedure.depots;
              } else if (typeof procedure.depots === 'object' && procedure.depots !== null) {
                candidatsDepots = Object.values(procedure.depots);
              }
            }
          } catch (e) {
            console.error('Erreur parsing depots:', e);
          }
          
          try {
            if (procedure.retraits) {
              if (typeof procedure.retraits === 'string') {
                candidatsRetraits = JSON.parse(procedure.retraits);
              } else if (Array.isArray(procedure.retraits)) {
                candidatsRetraits = procedure.retraits;
              } else if (typeof procedure.retraits === 'object' && procedure.retraits !== null) {
                candidatsRetraits = Object.values(procedure.retraits);
              }
            }
          } catch (e) {
            console.error('Erreur parsing retraits:', e);
          }
          
          // S'assurer que ce sont bien des tableaux
          candidatsDepots = Array.isArray(candidatsDepots) ? candidatsDepots : [];
          candidatsRetraits = Array.isArray(candidatsRetraits) ? candidatsRetraits : [];
          
          // Combiner les deux sources en éliminant les doublons
          const candidatsMap = new Map();
          [...candidatsDepots, ...candidatsRetraits].forEach((c: any) => {
            const nom = c.societe || c.nom || c.raisonSociale || '';
            if (nom && !candidatsMap.has(nom.toLowerCase())) {
              candidatsMap.set(nom.toLowerCase(), c);
            }
          });
          const candidats = Array.from(candidatsMap.values());

          // 🆕 Extraire le numéro court (5 chiffres) pour la requête ouverture_plis
          const numeroAfpa = procedure['Numéro de procédure (Afpa)'] || procedure.NumProc || '';
          const numeroCourt = numeroAfpa.match(/^(\d{5})/)?.[1] || procedure.NumProc;

          // 🆕 Charger les candidats enrichis depuis ouverture_plis
          const candidatsOuverturePlis = await loadCandidatsFromOuverturePlis(numeroCourt);
          console.log('📋 Candidats ouverture_plis (preloaded):', candidatsOuverturePlis.length);

          // Mettre à jour cachedData avec les candidats
          const updatedData = {
            ...preloadedData,
            candidats,
            candidatsOuverturePlis, // 🆕 Ajout des candidats enrichis
          };
          setCachedData(updatedData);

          // Analyser multi-lots
          const analysis = analyzeMultiLots(preloadedData.rapportData, candidats);
          setMultiLotsAnalysis(analysis);
          if (analysis && analysis.totalLots > 1) {
            // Afficher le sélecteur de mode au lieu d'aller directement au dashboard
            setShowModeSelector(true);
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
      setShowNotiParLots(false);
      setShowModeSelector(false);
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
      console.log('🔍 Recherche procédure:', selectedProcedure);
      const procedure = procedures.find(p => p.NumProc === selectedProcedure);
      if (!procedure) {
        alert('Procédure introuvable');
        setIsLoading(false);
        return;
      }
      console.log('✅ Procédure trouvée:', procedure);

      const numeroAfpa = procedure['Numéro de procédure (Afpa)'];
      const numeroCourt = numeroAfpa?.match(/^(\d{5})/)?.[1];

      if (!numeroCourt) {
        alert('Numéro de procédure invalide');
        setIsLoading(false);
        return;
      }
      console.log('📋 Numéro court:', numeroCourt);

      // Charger les candidats depuis les colonnes depots et retraits
      let candidatsDepots: any[] = [];
      let candidatsRetraits: any[] = [];
      
      console.log('📦 Depots brut:', procedure.depots);
      console.log('📥 Retraits brut:', procedure.retraits);
      
      try {
        if (procedure.depots) {
          if (typeof procedure.depots === 'string') {
            candidatsDepots = JSON.parse(procedure.depots);
          } else if (Array.isArray(procedure.depots)) {
            candidatsDepots = procedure.depots;
          } else if (typeof procedure.depots === 'object' && procedure.depots !== null) {
            // Si c'est un objet, essayer de le convertir en tableau
            candidatsDepots = Object.values(procedure.depots);
          }
        }
      } catch (e) {
        console.error('Erreur parsing depots:', e);
      }
      
      try {
        if (procedure.retraits) {
          if (typeof procedure.retraits === 'string') {
            candidatsRetraits = JSON.parse(procedure.retraits);
          } else if (Array.isArray(procedure.retraits)) {
            candidatsRetraits = procedure.retraits;
          } else if (typeof procedure.retraits === 'object' && procedure.retraits !== null) {
            // Si c'est un objet, essayer de le convertir en tableau
            candidatsRetraits = Object.values(procedure.retraits);
          }
        }
      } catch (e) {
        console.error('Erreur parsing retraits:', e);
      }
      
      // S'assurer que ce sont bien des tableaux
      candidatsDepots = Array.isArray(candidatsDepots) ? candidatsDepots : [];
      candidatsRetraits = Array.isArray(candidatsRetraits) ? candidatsRetraits : [];
      
      console.log('👥 Candidats depots:', candidatsDepots.length);
      console.log('👥 Candidats retraits:', candidatsRetraits.length);
      
      // Combiner les deux sources en éliminant les doublons
      const candidatsMap = new Map();
      [...candidatsDepots, ...candidatsRetraits].forEach((c: any) => {
        const nom = c.societe || c.nom || c.raisonSociale || '';
        if (nom && !candidatsMap.has(nom.toLowerCase())) {
          candidatsMap.set(nom.toLowerCase(), c);
        }
      });
      const candidats = Array.from(candidatsMap.values());
      console.log('✅ Total candidats uniques:', candidats.length);

      // Charger le dernier rapport de présentation
      console.log('📄 Chargement rapport pour NumProc:', procedure.NumProc);
      const { data: rapports, error: rapportError } = await supabase
        .from('rapports_presentation')
        .select('rapport_data')
        .eq('num_proc', procedure.NumProc)
        .order('date_modification', { ascending: false })
        .limit(1);

      if (rapportError) {
        console.error('Erreur chargement rapport:', rapportError);
      }

      const rapportData = rapports?.[0]?.rapport_data || null;
      console.log('📊 Rapport trouvé:', !!rapportData);

      // 🆕 Charger les candidats enrichis depuis ouverture_plis (utiliser numeroCourt = 5 chiffres)
      const candidatsOuverturePlis = await loadCandidatsFromOuverturePlis(numeroCourt);
      console.log('📋 Candidats ouverture_plis:', candidatsOuverturePlis.length);

      // Stocker en cache
      setCachedData({
        procedure,
        candidats,
        candidatsOuverturePlis, // 🆕 Ajout des candidats enrichis
        rapportData,
        numeroAfpa,
        numeroCourt,
      });
      console.log('💾 Données mises en cache');

      // Vérifier si multi-lots
      if (rapportData && isMultiLots(rapportData)) {
        console.log('🎯 Procédure multi-lots détectée');
        const analysis = analyzeMultiLots(rapportData, candidats);
        setMultiLotsAnalysis(analysis);
        // Afficher le sélecteur de mode au lieu d'aller directement au dashboard
        setShowModeSelector(true);
      } else {
        console.log('📌 Procédure mono-lot');
        setMultiLotsAnalysis(null);
        setShowMultiLotsDashboard(false);
        setShowNotiParLots(false);
        setShowModeSelector(false);
      }

      setDataLoaded(true);
      console.log('✅ Chargement terminé avec succès');
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Erreur lors du chargement des données:\n\n${errorMessage}\n\nVérifiez la console pour plus de détails.`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNoti1 = () => {
    if (!cachedData || !cachedData.rapportData) {
      alert('Veuillez d\'abord charger un rapport de présentation pour cette procédure');
      return;
    }

    const { procedure, candidats, candidatsOuverturePlis = [], rapportData } = cachedData;
    const attributaire = rapportData.section9_attribution?.attributairePressenti || '';

    // 🆕 Utiliser la fonction centralisée pour trouver les coordonnées
    // Priorité : ouverture_plis (données complètes) > depots/retraits
    const coordonnees = findCandidatCoordonnees(attributaire, candidatsOuverturePlis, candidats);

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

    const { procedure, candidats, candidatsOuverturePlis = [], rapportData } = cachedData;
    const attributaire = rapportData.section9_attribution?.attributairePressenti || '';

    // 🆕 Utiliser la fonction centralisée pour trouver les coordonnées
    const coordonnees = findCandidatCoordonnees(attributaire, candidatsOuverturePlis, candidats);

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
        executionImmediateChecked: true,
        executionOrdreServiceChecked: false,
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
      garantie: {
        pasPrevue: true,
        prevueSansAllotissement: false,
        retenueGarantieSansAllotissement: false,
        garantiePremiereDemandeOuCautionSansAllotissement: false,
        prevueAvecAllotissement: false,
        montantInferieur90k: false,
        montantSuperieur90kRetenue: false,
        montantSuperieur90kGarantie: false,
        modalites: '',
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

    const { procedure, candidats, candidatsOuverturePlis = [], rapportData } = cachedData;
    const attributaire = rapportData.section9_attribution?.attributairePressenti || '';
    const tableauNotes = rapportData.section7_valeurOffres?.tableau ||
                         rapportData.section7_2_syntheseLots?.lots?.[0]?.tableau ||
                         [];

    // Vérification que le tableau de notes existe et contient des données
    if (!tableauNotes || tableauNotes.length === 0) {
      alert('Aucune donnée d\'analyse trouvée dans le rapport de présentation (section 7)');
      return;
    }

    // Récupérer les pondérations depuis section2_criteres
    const criteres = rapportData.section2_criteres || {};
    const maxEco = String(criteres.criterePrix || criteres.critereFinancier || '60');
    const maxTech = String(criteres.critereTechnique || criteres.critereValeurTechnique || '40');

    const notesAttributaire = tableauNotes.find((offre: any) =>
      normaliserNom(offre.raisonSociale || '').includes(normaliserNom(attributaire)) ||
      normaliserNom(attributaire).includes(normaliserNom(offre.raisonSociale || ''))
    );

    const perdants: Noti3Data[] = [];

    // CHANGEMENT MAJEUR : parcourir tableauNotes au lieu de candidats
    tableauNotes.forEach((offre: any) => {
      const nomCandidat = offre.raisonSociale || '';
      const isAttributaire = normaliserNom(nomCandidat).includes(normaliserNom(attributaire)) ||
                            normaliserNom(attributaire).includes(normaliserNom(nomCandidat));

      // Un candidat est perdant s'il n'est PAS l'attributaire ET a un rang > 1
      if (!isAttributaire && nomCandidat && (offre.rangFinal > 1 || offre.rang > 1)) {
        // 🆕 Utiliser la fonction centralisée pour trouver les coordonnées
        let coordonnees = findCandidatCoordonnees(nomCandidat, candidatsOuverturePlis, candidats);

        // Si pas trouvé, utiliser les données du tableau d'analyse si disponibles
        if (!coordonnees) {
          coordonnees = {
            adresse: offre.adresse || '',
            codePostal: offre.codePostal || '',
            ville: offre.ville || '',
            siret: offre.siret || '',
            email: offre.email || '',
            telephone: offre.telephone || offre.tel || '',
          };
        }

        const noti3: Noti3Data = {
          numeroProcedure: procedure['Numéro de procédure (Afpa)'] || '',
          pouvoirAdjudicateur: {
            nom: 'AFPA\nAgence nationale pour la formation professionnelle des adultes',
            adresseVoie: '3, rue Franklin',
            codePostal: '93100',
            ville: 'MONTREUIL',
          },
          objetConsultation: procedure['Nom de la procédure'] || rapportData.section1_contexte?.objetMarche || '',
          notification: {
            type: 'ensemble',
            lots: [],
          },
          candidat: {
            denomination: nomCandidat,
            adresse1: coordonnees?.adresse || coordonnees?.adressePostale || '',
            codePostal: coordonnees?.codePostal || '',
            ville: coordonnees?.ville || '',
            siret: coordonnees?.siret || '',
            email: coordonnees?.email || '',
            telephone: coordonnees?.telephone || coordonnees?.tel || '',
          },
          rejet: {
            type: 'offre',
            motifs: 'Votre offre n\'a pas obtenu la meilleure note au regard des critères d\'analyse définis dans le Règlement de la Consultation.',
            noteEco: formatNote(offre.noteFinanciere || offre.noteFinanciereSur60),
            noteTech: formatNote(offre.noteTechnique || offre.noteTechniqueSur40),
            total: formatNote(offre.noteFinaleSur100),
            classement: String(offre.rangFinal || offre.rang || '-'),
            maxEco,
            maxTech,
          },
          attributaire: {
            denomination: attributaire,
            noteEco: notesAttributaire ? formatNote(notesAttributaire.noteFinanciere || notesAttributaire.noteFinanciereSur60) : maxEco,
            noteTech: notesAttributaire ? formatNote(notesAttributaire.noteTechnique || notesAttributaire.noteTechniqueSur40) : maxTech,
            total: notesAttributaire ? formatNote(notesAttributaire.noteFinaleSur100) : '100',
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
      alert(`Aucun candidat non retenu trouvé.\n\nVérifiez que :\n- Le tableau d'analyse (section 7) contient tous les candidats\n- L'attributaire est correctement défini (section 9)\n- Les candidats non retenus ont un rang > 1`);
      return;
    }

    setNoti3Data(perdants);
    setShowNoti3Modal(true);
  };

  const resetToProcedureSelection = () => {
    setDataLoaded(false);
    setCachedData(null);
    setSelectedProcedure('');
    setSearchTerm('');
    setShowMultiLotsDashboard(false);
    setShowNotiParLots(false);
    setShowModeSelector(false);
    setMultiLotsAnalysis(null);
    setNoti1Data(null);
    setNoti5Data(null);
    setNoti3Data([]);
  };

  const handleModeSelection = (mode: 'par-candidat' | 'par-lots') => {
    setShowModeSelector(false);
    if (mode === 'par-candidat') {
      setShowMultiLotsDashboard(true);
      setShowNotiParLots(false);
    } else {
      setShowNotiParLots(true);
      setShowMultiLotsDashboard(false);
    }
  };

  const backToModeSelection = () => {
    setShowMultiLotsDashboard(false);
    setShowNotiParLots(false);
    setShowModeSelector(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Conteneur principal : format paysage sur desktop, plein écran léger */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl px-6 py-4 w-full mx-2 max-w-[98vw] h-[90vh] flex flex-col">
        {/* Barre de titre globale */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {dataLoaded && (
              <button
                type="button"
                onClick={resetToProcedureSelection}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-[#252525] text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <span className="text-lg leading-none">←</span>
                <span>Choisir une autre procédure</span>
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications rapides (NOTI1, NOTI5, NOTI3)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {!dataLoaded ? (
          <div className="space-y-4 flex-1 overflow-y-auto p-6">
            <p className="text-sm text-gray-600 dark:text-slate-300">
              Sélectionnez une procédure pour charger les données nécessaires aux notifications
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tapez un numéro (ex: 25001) ou un nom..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {filteredProcedures.length} procédure{filteredProcedures.length > 1 ? 's' : ''} trouvée{filteredProcedures.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Procédure
              </label>
              <select
                value={selectedProcedure}
                onChange={(e) => setSelectedProcedure(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
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
        ) : showModeSelector && multiLotsAnalysis && cachedData ? (
          <div className="flex-1 overflow-y-auto p-6">
            <NotiModeSelector onSelectMode={handleModeSelection} />
          </div>
        ) : showMultiLotsDashboard && multiLotsAnalysis && cachedData ? (
          <div className="flex-1 min-h-0">
            <MultiLotsDashboard
              analysis={multiLotsAnalysis}
              procedureInfo={{
                numeroAfpa: cachedData.procedure['Numéro de procédure (Afpa)'] || '',
                numProc: cachedData.procedure.NumProc || '',
                objet: cachedData.procedure['Nom de la procédure'] || '',
              }}
              procedureData={cachedData.procedure}
              rapportData={cachedData.rapportData}
              onClose={resetToProcedureSelection}
            />
          </div>
        ) : showNotiParLots && multiLotsAnalysis && cachedData ? (
          <div className="flex-1 min-h-0">
            <NotiParLots
              analysis={multiLotsAnalysis}
              procedureInfo={{
                numeroAfpa: cachedData.procedure['Numéro de procédure (Afpa)'] || '',
                numProc: cachedData.procedure.NumProc || '',
                objet: cachedData.procedure['Nom de la procédure'] || '',
                numeroCourt: cachedData.numeroCourt || cachedData.procedure.NumProc?.substring(0, 5) || '',
              }}
              onClose={resetToProcedureSelection}
              onBackToModeSelection={backToModeSelection}
            />
          </div>
        ) : cachedData ? (
          <div className="space-y-4 flex-1 overflow-y-auto p-6">
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

            {/* Le changement de procédure se fait maintenant via le bouton Retour dans la barre de titre */}
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
