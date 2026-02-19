import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Search, PackageOpen, UserCheck, FileCheck, Building2, Mail, Phone, MapPin, Calendar, Clock, Pencil, Save, X, Cloud, CloudOff, CheckCircle2, AlertCircle, FileDown, Loader2, Printer } from 'lucide-react';
import { DepotsData } from '../../../types/depots';
import RecevabiliteOffres from './RecevabiliteOffres';
import { useOuverturePlis } from '../../../hooks/useOuverturePlis';
import { supabase } from '../../../lib/supabase';
import { exportProcessVerbalPdf } from '../utils/procesVerbalPdfExport';
import { ProcessVerbalPreview } from './ProcessVerbalPreview';
import { useDCELots } from '../../../hooks/useDCELots';
import { LotMultiSelector } from '../../shared/LotMultiSelector';

export type OuverturePlisSection = 'candidature' | 'recevabilite';

interface OuverturePlisProps {
  onBack: () => void;
  procedures: any[];
  dossiers: any[];
  /** Numéro de procédure (5 chiffres) pour pré-remplir et ouvrir directement une section (depuis le workflow) */
  initialNumero?: string;
  /** Section à ouvrir au chargement (Analyse des candidatures ou Recevabilité des offres) */
  initialSection?: OuverturePlisSection;
  /** Appelé après application de initialNumero/initialSection (pour réinitialiser en amont) */
  onInitialApplied?: () => void;
}

type OngletType = 'candidature' | 'recevabilite';

interface Candidat {
  numero: number;
  prenom: string;
  nom: string;
  societe: string;
  siret: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  lot: string;
  horsDelai: string;
  admisRejete: string;
  motifRejet: string;
  commentaire: string;

  // Recevabilité
  lotRecevabilite: string;
  recevable: string; // 'Recevable' | 'Éliminé' | ''
  motifRejetRecevabilite: string;
  
  // DC1
  dc1Presentation: string;
  dc1Groupement: string;
  dc1NonInterdiction: string;
  dc1SousTraitance: string;
  dc1PourcentageSousTraite: string;

  // DC2
  dc2CAN1: string;
  dc2CAN2: string;
  dc2CAN3: string;
  dc2CapaciteTechnique: string;

  // Autres documents (oui/non)
  autresPouvoir: string;
  autresKbis: string;
  autresFiscale: string;
  autresURSSAF: string;
  autresRedressement: string;
  autresEffectifs: string;
  autresMissions: string;
  autresVisite: string;
  autresCertification: string;

  // Assurances
  assuranceRC: string;
  assuranceRCSinistre: string;
  assuranceDecennale: string;
  assuranceDecennaleChantier: string;

  // Offre (oui/non)
  offreActeEngagement: string;
  offreBPUDQE: string;
  offreQT: string;
  offreMemoireTech: string;
  offreRIB: string;
}

const OuverturePlis: React.FC<OuverturePlisProps> = ({
  onBack,
  procedures,
  dossiers,
  initialNumero = '',
  initialSection,
  onInitialApplied,
}) => {
  const [searchNumero, setSearchNumero] = useState(initialNumero || '');
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [ongletActif, setOngletActif] = useState<OngletType | null>(null);
  const [showRecevabilite, setShowRecevabilite] = useState(false);
  const [initialApplied, setInitialApplied] = useState(false);
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editCandidat, setEditCandidat] = useState<Candidat | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'dc1dc2dc4' | 'autres' | 'assurances' | 'offre'>('info');
  
  // Champs de saisie
  const [msa, setMsa] = useState('');
  const [valideurTechnique, setValideurTechnique] = useState('');
  const [demandeur, setDemandeur] = useState('');
  
  // Déclaration d'infructuosité
  const [lotsInfructueux, setLotsInfructueux] = useState<{lot: string; statut: string}[]>([]);
  const [raisonInfructuosite, setRaisonInfructuosite] = useState('');
  
  // Hook de sauvegarde
  const { saving, lastSaved, saveData, loadData, autoSave, error } = useOuverturePlis(searchNumero);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPVPreview, setShowPVPreview] = useState(false);
  const [pvData, setPvData] = useState<Parameters<typeof ProcessVerbalPreview>[0]['data'] | null>(null);
  
  // Données des dépôts depuis la procédure
  const depotsData: DepotsData | null = selectedProcedure?.depots || null;

  // Numéro 5 chiffres pour le DCE
  const numProc5 = useMemo(() => {
    if (!selectedProcedure) return null;
    const n = selectedProcedure['NumeroAfpa5Chiffres'];
    if (n) return String(n);
    const afpa = String(selectedProcedure['Numéro de procédure (Afpa)'] || '');
    const m = afpa.match(/^(\d{5})/);
    return m ? m[1] : null;
  }, [selectedProcedure]);

  // Lots depuis le DCE Complet
  const { lots: dceLots } = useDCELots(numProc5);

  // Groupement des dépôts par entreprise pour la liste des candidatures
  const groupedEntreprises = useMemo(() => {
    if (!depotsData?.entreprises) return [];
    const map = new Map<string, { societe: string; contact: string; email: string; ville: string; cp: string; depots: typeof depotsData.entreprises }>();
    depotsData.entreprises.forEach(e => {
      const key = (e.societe || '').trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { societe: e.societe, contact: e.contact, email: e.email, ville: e.ville, cp: e.cp, depots: [] });
      }
      map.get(key)!.depots.push(e);
    });
    return Array.from(map.values());
  }, [depotsData]);

  // Groupement des candidats par entreprise pour la vue tableau (regroupement lignes consécutives)
  const groupedCandidatsView = useMemo(() => {
    const groups: Array<{ societe: string; items: Array<{ candidat: Candidat; originalIndex: number }> }> = [];
    candidats.forEach((candidat, index) => {
      const key = (candidat.societe || '').trim().toLowerCase();
      const last = groups[groups.length - 1];
      if (last && (last.societe || '').trim().toLowerCase() === key) {
        last.items.push({ candidat, originalIndex: index });
      } else {
        groups.push({ societe: candidat.societe, items: [{ candidat, originalIndex: index }] });
      }
    });
    return groups;
  }, [candidats]);

  // Recherche de procédure
  const handleSearchProcedure = () => {
    if (!searchNumero.trim()) return;

    const procedure = procedures.find(p => {
      // Chercher dans NumeroAfpa5Chiffres
      if (p['NumeroAfpa5Chiffres'] === searchNumero) return true;
      
      // Extraire les 5 premiers chiffres du "Numéro de procédure (Afpa)"
      const numAfpaComplet = p['Numéro de procédure (Afpa)'];
      if (numAfpaComplet) {
        const match = numAfpaComplet.match(/^(\d{5})/);
        if (match && match[1] === searchNumero) return true;
      }
      
      return false;
    });

    if (procedure) {
      setSelectedProcedure(procedure);
      
      // Récupérer le demandeur depuis le dossier rattaché
      const dossierId = procedure['IDProjet'];
      if (dossierId) {
        const dossier = dossiers.find(d => d.IDProjet === dossierId);
        if (dossier && dossier['Demandeur']) {
          setDemandeur(dossier['Demandeur']);
        }
      }
    } else {
      setSelectedProcedure(null);
      setDemandeur('');
    }
  };

  // Réinitialiser au changement de numéro
  useEffect(() => {
    if (searchNumero === '') {
      setSelectedProcedure(null);
      setDemandeur('');
    }
  }, [searchNumero]);

  // Ouverture directe depuis le workflow : appliquer initialNumero puis initialSection
  useEffect(() => {
    if (initialApplied || (!initialNumero && !initialSection)) return;

    if (initialNumero && initialNumero.trim().length === 5) {
      setSearchNumero(initialNumero);
      if (procedures.length > 0) {
        const procedure = procedures.find((p: any) => {
          if (p['NumeroAfpa5Chiffres'] === initialNumero) return true;
          const numAfpaComplet = p['Numéro de procédure (Afpa)'];
          if (numAfpaComplet) {
            const match = String(numAfpaComplet).match(/^(\d{5})/);
            if (match && match[1] === initialNumero) return true;
          }
          return false;
        });
        if (procedure) {
          setSelectedProcedure(procedure);
          const dossierId = procedure['IDProjet'];
          if (dossierId) {
            const dossier = dossiers.find((d: any) => d.IDProjet === dossierId);
            if (dossier?.['Demandeur']) setDemandeur(dossier['Demandeur']);
          }
        }
      }
    }
  }, [initialNumero, initialSection, procedures, dossiers, initialApplied]);

  useEffect(() => {
    if (initialApplied || !initialSection || !selectedProcedure) return;
    if (initialSection === 'candidature') {
      setOngletActif('candidature');
    } else if (initialSection === 'recevabilite') {
      setShowRecevabilite(true);
    }
    setInitialApplied(true);
    onInitialApplied?.();
  }, [initialSection, selectedProcedure, initialApplied, onInitialApplied]);

  // Charger les candidats depuis les dépôts
  useEffect(() => {
    if (depotsData && depotsData.entreprises && ongletActif === 'candidature') {
      const candidatsInitiaux = depotsData.entreprises.map((entreprise, index) => ({
        numero: index + 1,
        prenom: '',
        nom: entreprise.contact || '',
        societe: entreprise.societe || '',
        siret: '',
        email: entreprise.email || '',
        adresse: entreprise.adresse || '',
        codePostal: entreprise.cp || '',
        ville: entreprise.ville || '',
        telephone: entreprise.telephone || '',
        lot: '',
        horsDelai: '',
        admisRejete: '',
        motifRejet: '',
        commentaire: '',
        // Recevabilité
        lotRecevabilite: '',
        recevable: '',
        motifRejetRecevabilite: '',
        // DC1
        dc1Presentation: '',
        dc1Groupement: '',
        dc1NonInterdiction: '',
        dc1SousTraitance: '',
        dc1PourcentageSousTraite: '',
        // DC2
        dc2CAN1: '',
        dc2CAN2: '',
        dc2CAN3: '',
        dc2CapaciteTechnique: '',
        // Autres documents
        autresPouvoir: '',
        autresKbis: '',
        autresFiscale: '',
        autresURSSAF: '',
        autresRedressement: '',
        autresEffectifs: '',
        autresMissions: '',
        autresVisite: '',
        autresCertification: '',
        // Assurances
        assuranceRC: '',
        assuranceRCSinistre: '',
        assuranceDecennale: '',
        assuranceDecennaleChantier: '',
        // Offre
        offreActeEngagement: '',
        offreBPUDQE: '',
        offreQT: '',
        offreMemoireTech: '',
        offreRIB: '',
      }));
      setCandidats(candidatsInitiaux);
    }
  }, [depotsData, ongletActif]);

  // Fonctions de gestion de la modale d'édition
  const handleOpenEditModal = (index: number) => {
    setEditIndex(index);
    setEditCandidat({ ...candidats[index] });
    setEditModalOpen(true);
  };

  const handleEditField = (field: keyof Candidat, value: string) => {
    if (!editCandidat) return;
    setEditCandidat({ ...editCandidat, [field]: value });
  };

  const handleSaveEdit = () => {
    if (editIndex === null || !editCandidat) return;
    const newCandidats = [...candidats];
    newCandidats[editIndex] = editCandidat;
    setCandidats(newCandidats);
    setEditModalOpen(false);
    setEditIndex(null);
    setEditCandidat(null);
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditIndex(null);
    setEditCandidat(null);
    setActiveTab('info');
  };

  // Collecte des données PV (utilisé par l'aperçu ET l'export direct)
  const buildPVData = async () => {
    // ── 1. Candidature ──────────────────────────────────────────────────────
    // Les candidats ne sont chargés en état QUE quand ongletActif === 'candidature'.
    // On force un chargement Supabase pour ne pas dépendre de l'onglet ouvert.
    const candData = await loadData('candidature');
    const finalCandidats =
      candData?.candidats && (candData.candidats as any[]).length > 0
        ? (candData.candidats as any[])
        : candidats; // fallback sur l'état si déjà peuplé

    // ── 2. Recevabilité ─────────────────────────────────────────────────────
    // RecevabiliteOffres sauvegarde avec num_proc = refProc.split(' ')[0]
    // (ex. "25006_AOO_TMA-EPM_LAY") alors que searchNumero = "25006".
    // On tente les deux clés pour être robuste.
    const refProc = selectedProcedure?.['Référence procédure (plateforme)'];
    const recevKey = typeof refProc === 'string' ? refProc.split(' ')[0] : String(refProc || '');
    const keysToTry = [...new Set([recevKey, searchNumero].filter(Boolean))];

    let recevabilite = null;
    for (const key of keysToTry) {
      const { data: recevRaw } = await supabase
        .from('ouverture_plis')
        .select('recevabilite')
        .eq('num_proc', key)
        .eq('type_analyse', 'recevabilite')
        .maybeSingle();
      if (recevRaw?.recevabilite) {
        const r = recevRaw.recevabilite as any;
        recevabilite = {
          candidats: r.candidats ?? [],
          raisonInfructuosite: r.raison_infructuosite ?? '',
          lotsInfructueux: r.lots_infructueux ?? [],
        };
        break;
      }
    }

    return {
      procedure: selectedProcedure,
      depotsData,
      groupedEntreprises,
      candidats: finalCandidats,
      recevabilite,
      msa: candData?.msa || msa,
      valideurTechnique: candData?.valideur_technique || valideurTechnique,
      demandeur: candData?.demandeur || demandeur,
    };
  };

  // Ouvrir la visionneuse du Procès Verbal
  const handleOpenPreview = async () => {
    if (!selectedProcedure) return;
    setIsExporting(true); // réutilise le spinner pour le chargement
    try {
      const data = await buildPVData();
      setPvData(data);
      setShowPVPreview(true);
    } catch (err) {
      console.error('Erreur chargement données PV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Export Procès Verbal PDF (depuis la visionneuse ou directement)
  const handleExportPV = async () => {
    if (!selectedProcedure) return;
    setIsExporting(true);
    try {
      const data = pvData ?? await buildPVData();
      await exportProcessVerbalPdf(data);
    } catch (err) {
      console.error('Erreur export PV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction de sauvegarde manuelle
  const handleSaveCandidature = async () => {
    if (!selectedProcedure) return;

    const result = await saveData({
      num_proc: searchNumero,
      reference_proc: selectedProcedure['Référence procédure (plateforme)'],
      nom_proc: selectedProcedure['Nom de la procédure'],
      id_projet: selectedProcedure['IDProjet'],
      msa,
      valideur_technique: valideurTechnique,
      demandeur,
      type_analyse: 'candidature',
      statut: 'en_cours',
      candidats,
    });

    if (result.success) {
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  // Charger les données sauvegardées au chargement de la procédure
  useEffect(() => {
    if (selectedProcedure && ongletActif === 'candidature') {
      loadData('candidature').then((savedData) => {
        if (savedData) {
          setMsa(savedData.msa || '');
          setValideurTechnique(savedData.valideur_technique || '');
          setDemandeur(savedData.demandeur || '');
          if (savedData.candidats && savedData.candidats.length > 0) {
            setCandidats(savedData.candidats);
          }
        }
      });
    }
  }, [selectedProcedure, ongletActif]);

  // Vue tableau candidature — pleine page, style DQE/BPU (teal, tableau pleine page)
  if (ongletActif === 'candidature' && selectedProcedure) {
    const colClasses = 'border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58] rounded min-w-0';
    return (
      <div className="ouverture-plis-module ouverture-plis-candidature fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden flex flex-col">
        {/* En-tête fixe — style DQE */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm z-20 flex-shrink-0">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOngletActif(null)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Retour
                </button>
                <h1 className="text-xl font-bold text-[#2F5B58] dark:text-teal-400 border-l border-gray-300 dark:border-gray-600 pl-4">
                  ANALYSE DES CANDIDATURES
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={handleSaveCandidature}
                  disabled={saving || !candidats.length}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition font-medium shadow-md"
                >
                  {saving ? (
                    <>
                      <Cloud className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </button>
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Sauvegardé
                  </div>
                )}
              </div>
            </div>
            {/* Infos procédure — style DQE */}
            <div className="ouverture-plis-info-band bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-slate-800 rounded-lg p-4 border border-transparent dark:border-slate-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Procédure :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{selectedProcedure?.['Référence procédure (plateforme)'] || searchNumero}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Marché :</span>{' '}
                  <span className="text-gray-900 dark:text-white truncate block max-w-[200px]" title={String(selectedProcedure?.['Nom de la procédure'] || '')}>
                    {selectedProcedure?.['Nom de la procédure'] || '—'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Acheteur :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{selectedProcedure?.['Acheteur'] || '—'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Candidats :</span>{' '}
                  <span className="text-gray-900 dark:text-white font-medium">
                    {groupedCandidatsView.length > 0 && candidats.length !== groupedCandidatsView.length
                      ? `${groupedCandidatsView.length} entreprise(s) · ${candidats.length} candidature(s)`
                      : candidats.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau pleine page — une seule ligne d'en-tête teal */}
        <div className="ouverture-plis-table-scroll flex-1 overflow-auto">
          <div className="min-w-full inline-block align-top">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2F5B58] text-white">
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold sticky left-0 bg-[#2F5B58] z-10" style={{ width: '44px', minWidth: '44px' }}></th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ width: '50px', minWidth: '50px' }}>N°</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '90px' }}>Prénom</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '140px' }}>Nom</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '160px' }}>Société</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '120px' }}>N° Siret/Siren</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '180px' }}>Adresse</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '120px' }}>Ville</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '80px' }}>Lot</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '110px' }}>Admis / Rejeté</th>
                  <th className="border border-[#234441] px-2 py-3 text-left font-semibold" style={{ minWidth: '180px' }}>Commentaire</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {groupedCandidatsView.map((group, gi) =>
                  group.items.map(({ candidat, originalIndex }, ci) => (
                    <tr key={originalIndex} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-center sticky left-0 bg-white dark:bg-gray-900 z-[1]">
                        <button
                          onClick={() => handleOpenEditModal(originalIndex)}
                          className="p-1.5 rounded hover:bg-[#2F5B58]/10 text-[#2F5B58] dark:text-teal-400 transition"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                      {ci === 0 && (
                        <>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-900 dark:text-white text-center tabular-nums align-middle font-semibold">{gi + 1}</td>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 p-0 align-middle">
                            <input
                              value={candidat.prenom}
                              onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], prenom: e.target.value }; setCandidats(c); }}
                              className={`w-full ${colClasses}`}
                            />
                          </td>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 p-0 align-middle">
                            <input
                              value={candidat.nom}
                              onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], nom: e.target.value }; setCandidats(c); }}
                              className={`w-full ${colClasses}`}
                            />
                          </td>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 p-0 align-middle">
                            <input
                              value={candidat.societe}
                              onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], societe: e.target.value }; setCandidats(c); }}
                              className={`w-full ${colClasses}`}
                            />
                          </td>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 p-0 align-middle">
                            <input
                              value={candidat.siret}
                              onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], siret: e.target.value }; setCandidats(c); }}
                              className={`w-full ${colClasses}`}
                            />
                          </td>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 p-0 align-middle">
                            <input
                              value={candidat.adresse}
                              onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], adresse: e.target.value }; setCandidats(c); }}
                              className={`w-full ${colClasses}`}
                            />
                          </td>
                          <td rowSpan={group.items.length} className="border border-gray-300 dark:border-gray-600 p-0 align-middle">
                            <input
                              value={candidat.ville}
                              onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], ville: e.target.value }; setCandidats(c); }}
                              className={`w-full ${colClasses}`}
                            />
                          </td>
                        </>
                      )}
                      <td className="border border-gray-300 dark:border-gray-600 p-1">
                        <LotMultiSelector
                          lots={dceLots}
                          value={candidat.lot}
                          onChange={(val) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], lot: val }; setCandidats(c); }}
                          compact
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-0">
                        <select
                          value={candidat.admisRejete}
                          onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], admisRejete: e.target.value }; setCandidats(c); }}
                          className={`w-full ${colClasses}`}
                        >
                          <option value="">—</option>
                          <option value="Admis">Admis</option>
                          <option value="Rejeté">Rejeté</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-0">
                        <input
                          value={candidat.commentaire}
                          onChange={(e) => { const c = [...candidats]; c[originalIndex] = { ...c[originalIndex], commentaire: e.target.value }; setCandidats(c); }}
                          placeholder="—"
                          className={`w-full ${colClasses}`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modale d'édition avec onglets — style teal cohérent DQE */}
        {editModalOpen && editCandidat && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col relative border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-[#2F5B58] dark:text-teal-400">Candidat n°{editCandidat.numero} — {editCandidat.societe || 'Sans société'}</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex gap-2 px-6 pt-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'info'
                      ? 'bg-white dark:bg-gray-900 text-[#2F5B58] dark:text-teal-400 border-t-2 border-[#2F5B58]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Info Générale
                </button>
                <button
                  onClick={() => setActiveTab('dc1dc2dc4')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'dc1dc2dc4'
                      ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 border-t-2 border-orange-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  DC1 · DC2 · DC4
                </button>
                <button
                  onClick={() => setActiveTab('autres')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'autres'
                      ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 border-t-2 border-purple-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Autres documents
                </button>
                <button
                  onClick={() => setActiveTab('assurances')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'assurances'
                      ? 'bg-white dark:bg-gray-900 text-green-600 dark:text-green-400 border-t-2 border-green-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Assurances
                </button>
                <button
                  onClick={() => setActiveTab('offre')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'offre'
                      ? 'bg-white dark:bg-gray-900 text-[#2F5B58] dark:text-teal-400 border-t-2 border-[#2F5B58]'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Offre
                </button>
              </div>

              {/* Contenu défilant */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Onglet Info Générale */}
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
                      <input type="text" value={editCandidat.prenom} onChange={e => handleEditField('prenom', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                      <input type="text" value={editCandidat.nom} onChange={e => handleEditField('nom', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Société</label>
                      <input type="text" value={editCandidat.societe} onChange={e => handleEditField('societe', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">N° Siret/Siren</label>
                      <input type="text" value={editCandidat.siret} onChange={e => handleEditField('siret', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" value={editCandidat.email} onChange={e => handleEditField('email', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                      <input type="tel" value={editCandidat.telephone} onChange={e => handleEditField('telephone', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                      <input type="text" value={editCandidat.adresse} onChange={e => handleEditField('adresse', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Code Postal</label>
                      <input type="text" value={editCandidat.codePostal} onChange={e => handleEditField('codePostal', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                      <input type="text" value={editCandidat.ville} onChange={e => handleEditField('ville', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]/20 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        Lot{dceLots ? ' (depuis DCE)' : ' (saisie manuelle)'}
                      </label>
                      <LotMultiSelector
                        lots={dceLots}
                        value={editCandidat.lot}
                        onChange={(val) => handleEditField('lot', val)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Hors Délai</label>
                      <select value={editCandidat.horsDelai} onChange={e => handleEditField('horsDelai', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none">
                        <option value="">-</option>
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Admis / Rejeté</label>
                      <select value={editCandidat.admisRejete} onChange={e => handleEditField('admisRejete', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none">
                        <option value="">-</option>
                        <option value="Admis">Admis</option>
                        <option value="Rejeté">Rejeté</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Si rejet : motif</label>
                      <input type="text" value={editCandidat.motifRejet} onChange={e => handleEditField('motifRejet', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                    </div>
                  </div>
                )}

                {/* Onglet DC1 · DC2 · DC4 */}
                {activeTab === 'dc1dc2dc4' && (
                  <div className="space-y-6">
                    {/* DC1 */}
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-500/30">
                      <h3 className="text-sm font-black text-orange-700 dark:text-orange-300 mb-3">DC1 — Lettre de candidature</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Présentation du candidat</label>
                          <textarea value={editCandidat.dc1Presentation} onChange={e => handleEditField('dc1Presentation', e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Liste des membres du groupement</label>
                          <textarea value={editCandidat.dc1Groupement} onChange={e => handleEditField('dc1Groupement', e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" placeholder="Laisser vide si candidature individuelle" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">DC4</label>
                          <select value={editCandidat.dc1NonInterdiction} onChange={e => handleEditField('dc1NonInterdiction', e.target.value)} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none">
                            <option value="">—</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Sous-traitance</label>
                          <select value={editCandidat.dc1SousTraitance} onChange={e => handleEditField('dc1SousTraitance', e.target.value)} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none">
                            <option value="">—</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">% Sous-traité</label>
                          <input type="number" min={0} max={100} value={editCandidat.dc1PourcentageSousTraite} onChange={e => handleEditField('dc1PourcentageSousTraite', e.target.value)} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" placeholder="Ex : 30" />
                        </div>
                      </div>
                    </div>

                    {/* DC2 */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30">
                      <h3 className="text-sm font-black text-blue-700 dark:text-blue-300 mb-3">DC2 — Déclaration du candidat</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CA n-1 (€ HT)</label>
                          <input type="number" min={0} value={editCandidat.dc2CAN1} onChange={e => handleEditField('dc2CAN1', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CA n-2 (€ HT)</label>
                          <input type="number" min={0} value={editCandidat.dc2CAN2} onChange={e => handleEditField('dc2CAN2', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CA n-3 (€ HT)</label>
                          <input type="number" min={0} value={editCandidat.dc2CAN3} onChange={e => handleEditField('dc2CAN3', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-3 bg-blue-100 dark:bg-blue-900/30 px-4 py-3 rounded-lg flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Chiffre d'affaires moyen HT (moyenne des 3 exercices)</span>
                          <span className="text-base font-black text-blue-800 dark:text-blue-200">
                            {(() => {
                              const v1 = parseFloat(editCandidat.dc2CAN1) || 0;
                              const v2 = parseFloat(editCandidat.dc2CAN2) || 0;
                              const v3 = parseFloat(editCandidat.dc2CAN3) || 0;
                              const count = [v1, v2, v3].filter(v => v > 0).length;
                              if (count === 0) return '—';
                              const moy = (v1 + v2 + v3) / count;
                              return moy.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
                            })()}
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Capacité technique à répondre au marché</label>
                          <select value={editCandidat.dc2CapaciteTechnique} onChange={e => handleEditField('dc2CapaciteTechnique', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none">
                            <option value="">—</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Autres documents */}
                {activeTab === 'autres' && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-200 dark:border-purple-500/30">
                      <h3 className="text-sm font-black text-purple-700 dark:text-purple-300 mb-3">Autres documents fournis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {([
                          ['autresPouvoir', 'Pouvoir ou délégation de pouvoir de signature'],
                          ['autresKbis', 'Extrait Kbis'],
                          ['autresFiscale', 'Attestation Fiscale'],
                          ['autresURSSAF', 'Attestation URSSAF'],
                          ['autresRedressement', 'Procédure de redressement judiciaire'],
                          ['autresEffectifs', 'Effectifs Moyens annuels (moy. 3 années)'],
                          ['autresMissions', 'Liste de missions similaires et références'],
                          ['autresVisite', 'Attestation de visite'],
                          ['autresCertification', 'Certification SS3 / SS4'],
                        ] as [keyof Candidat, string][]).map(([field, label]) => (
                          <div key={field}>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                            <select value={editCandidat[field] as string} onChange={e => handleEditField(field, e.target.value)} className="w-full px-3 py-2 border-2 border-purple-300 dark:border-purple-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none">
                              <option value="">—</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Assurances */}
                {activeTab === 'assurances' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-500/30">
                      <h3 className="text-sm font-black text-green-700 dark:text-green-300 mb-3">Assurances</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assurance responsabilité civile</label>
                          <select value={editCandidat.assuranceRC} onChange={e => handleEditField('assuranceRC', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none">
                            <option value="">—</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant maxi des dommages par sinistre (€)</label>
                          <input type="text" value={editCandidat.assuranceRCSinistre} onChange={e => handleEditField('assuranceRCSinistre', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assurance garantie décennale</label>
                          <select value={editCandidat.assuranceDecennale} onChange={e => handleEditField('assuranceDecennale', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none">
                            <option value="">—</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant maxi du chantier (€)</label>
                          <input type="text" value={editCandidat.assuranceDecennaleChantier} onChange={e => handleEditField('assuranceDecennaleChantier', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Offre */}
                {activeTab === 'offre' && (
                  <div className="space-y-4">
                    <div className="bg-teal-50 dark:bg-teal-950/20 p-4 rounded-xl border border-[#2F5B58]/20 dark:border-teal-500/30">
                      <h3 className="text-sm font-black text-[#2F5B58] dark:text-teal-300 mb-3">Documents de l'offre</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {([
                          ['offreActeEngagement', "Acte d'engagement"],
                          ['offreBPUDQE', 'BPU-DQE / CDPGF'],
                          ['offreQT', 'QT'],
                          ['offreMemoireTech', 'Mémoire technique'],
                          ['offreRIB', 'RIB'],
                        ] as [keyof Candidat, string][]).map(([field, label]) => (
                          <div key={field}>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                            <select value={editCandidat[field] as string} onChange={e => handleEditField(field, e.target.value)} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none">
                              <option value="">—</option>
                              <option value="Oui">Oui</option>
                              <option value="Non">Non</option>
                              <option value="Non Applicable">Non Applicable</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer avec boutons */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#252525]">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Onglet {activeTab === 'info' ? '1/5' : activeTab === 'dc1dc2dc4' ? '2/5' : activeTab === 'autres' ? '3/5' : activeTab === 'assurances' ? '4/5' : '5/5'} - Toutes les modifications sont enregistrées ensemble
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCancelEdit} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white font-semibold transition-colors shadow-md">
                    <Save className="w-4 h-4" />
                    Enregistrer tout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Afficher la page de recevabilité si activée
  if (showRecevabilite && selectedProcedure) {
    const dossierRattache = dossiers.find(d => d.IDProjet === selectedProcedure?.IDProjet);
    
    return (
      <RecevabiliteOffres
        onBack={() => setShowRecevabilite(false)}
        procedure={selectedProcedure}
        dossier={dossierRattache}
        depotsData={depotsData}
        msa={msa}
        valideurTechnique={valideurTechnique}
        demandeur={demandeur}
      />
    );
  }

  return (
    <div className="ouverture-plis-module min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:bg-[#0f172a]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-[#0f172a]/95 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2F5B58]/10 dark:bg-teal-500/20 flex items-center justify-center">
                  <PackageOpen className="w-6 h-6 text-[#2F5B58] dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">Ouverture des plis</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyse des candidatures et recevabilité des offres</p>
                </div>
              </div>
            </div>

            {/* Boutons Procès Verbal — visibles dès qu'une procédure est sélectionnée */}
            {selectedProcedure && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Aperçu (principal) */}
                <button
                  onClick={handleOpenPreview}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-md"
                  title="Visualiser le Procès Verbal avant export"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement…
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Aperçu PV
                    </>
                  )}
                </button>
                {/* Export direct (secondaire) */}
                <button
                  onClick={handleExportPV}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-gray-50 disabled:opacity-60 text-[#2F5B58] font-semibold rounded-xl transition shadow-sm border border-[#2F5B58]/30"
                  title="Exporter directement en PDF sans aperçu"
                >
                  <FileDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Étape 1 : Sélectionner une procédure */}
        <div className="ouverture-plis-card ouverture-plis-card-selection bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-600 p-6 mb-6 shadow-none dark:shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#2F5B58]/10 dark:bg-teal-500/20 flex items-center justify-center">
              <span className="text-[#2F5B58] dark:text-teal-400 font-black">1</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Sélectionner une procédure</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Numéro AFPA (5 chiffres)
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchNumero}
                  onChange={(e) => setSearchNumero(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchProcedure()}
                  placeholder="Ex: 25006"
                  maxLength={5}
                  className="ouverture-plis-input-numero flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-[#2F5B58] dark:focus:border-teal-400 transition-colors"
                />
                <button
                  onClick={handleSearchProcedure}
                  className="px-6 py-3 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] dark:from-teal-600 dark:to-teal-700 dark:hover:from-teal-500 dark:hover:to-teal-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-md"
                >
                  <Search className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>

            {/* Affichage de la procédure sélectionnée */}
            {selectedProcedure && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-teal-950/20 border border-[#2F5B58]/20 dark:border-teal-500/30 rounded-xl">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">Procédure sélectionnée :</span>{' '}
                    <span className="text-gray-900 dark:text-white">{selectedProcedure['Numéro de procédure (Afpa)']}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">Nom :</span>{' '}
                    <span className="text-gray-900 dark:text-white">{selectedProcedure['Nom de la procédure']}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">Acheteur :</span>{' '}
                    <span className="text-gray-900 dark:text-white">{selectedProcedure['Acheteur']}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300">Statut :</span>{' '}
                    <span className="text-gray-900 dark:text-white">{selectedProcedure['Statut de la consultation']}</span>
                  </div>
                  {demandeur && (
                    <div>
                      <span className="font-bold text-gray-700 dark:text-gray-300">Dossier rattaché :</span>{' '}
                      <span className="text-gray-900 dark:text-white">{dossiers.find(d => d.IDProjet === selectedProcedure['IDProjet'])?.Titre_du_dossier}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations complémentaires (si procédure sélectionnée) */}
        {selectedProcedure && (
          <div className="ouverture-plis-card bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-600 p-6 mb-6 shadow-none dark:shadow-none">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Informations complémentaires</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  MSA
                </label>
                <input
                  type="text"
                  value={msa}
                  onChange={(e) => setMsa(e.target.value)}
                  placeholder="Nom du MSA"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2F5B58] dark:focus:border-teal-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Valideur technique
                </label>
                <input
                  type="text"
                  value={valideurTechnique}
                  onChange={(e) => setValideurTechnique(e.target.value)}
                  placeholder="Nom du valideur"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2F5B58] dark:focus:border-teal-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Demandeur
                </label>
                <input
                  type="text"
                  value={demandeur}
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Boutons Analyse candidature / Recevabilité des offres */}
        {selectedProcedure && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <button
              onClick={() => setOngletActif('candidature')}
              className="ouverture-plis-action-card group bg-white dark:bg-slate-800 rounded-2xl border-2 border-[#2F5B58]/20 dark:border-slate-600 hover:border-[#2F5B58] dark:hover:border-teal-400 p-8 transition-all hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#2F5B58]/10 dark:bg-teal-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-8 h-8 text-[#2F5B58] dark:text-teal-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Analyse candidature</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyser les candidatures reçues
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setShowRecevabilite(true)}
              className="ouverture-plis-action-card group bg-white dark:bg-slate-800 rounded-2xl border-2 border-emerald-200 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-teal-400 p-8 transition-all hover:shadow-lg dark:hover:shadow-none hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Recevabilité des offres</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vérifier la recevabilité des offres
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Liste des dépôts */}
        {selectedProcedure && depotsData && (
          <div className="ouverture-plis-card bg-white dark:bg-slate-800 rounded-2xl border-2 border-gray-200 dark:border-slate-600 p-6 mb-6 shadow-none dark:shadow-none">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Liste des candidatures reçues</h2>
            
            {/* Informations de la procédure */}
            <div className="mb-6 p-4 bg-green-50 dark:bg-teal-950/10 rounded-xl border border-[#2F5B58]/20 dark:border-teal-500/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Référence :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{depotsData.procedureInfo.reference}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Auteur :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{depotsData.procedureInfo.auteur}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Objet :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{depotsData.procedureInfo.objet}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Date de publication :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{depotsData.procedureInfo.datePublication}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Date limite candidature :</span>{' '}
                  <span className="text-gray-900 dark:text-white">{depotsData.procedureInfo.dateCandidature}</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Entreprises :</span>{' '}
                    <span className="text-[#2F5B58] dark:text-teal-400 font-bold">{groupedEntreprises.length}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total offres reçues :</span>{' '}
                    <span className="text-[#2F5B58] dark:text-teal-400 font-bold">
                      {depotsData.stats.totalEnveloppesElectroniques + depotsData.stats.totalEnveloppesPapier}
                    </span>
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                      ({depotsData.stats.totalEnveloppesElectroniques} électronique{depotsData.stats.totalEnveloppesElectroniques > 1 ? 's' : ''}
                      {depotsData.stats.totalEnveloppesPapier > 0 && `, ${depotsData.stats.totalEnveloppesPapier} papier`})
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tableau des candidatures — groupé par entreprise */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#333333]">
              <table className="min-w-full">
                <thead className="bg-[#2F5B58] dark:bg-teal-900/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider w-10">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center gap-2"><Building2 className="w-4 h-4" />Entreprise</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4" />Email</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />Ville</div>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                      Total offres
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Lot</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Date dépôt</div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mode</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1E1E1E]">
                  {groupedEntreprises.map((groupe, groupIdx) => (
                    groupe.depots.map((depot, depotIdx) => {
                      const isFirst = depotIdx === 0;
                      const rowSpan = groupe.depots.length;
                      const isMulti = rowSpan > 1;
                      return (
                        <tr
                          key={`${groupIdx}-${depotIdx}`}
                          className={`
                            ${isFirst ? 'border-t-2 border-[#2F5B58]/30 dark:border-teal-700/40' : 'border-t border-gray-100 dark:border-[#2a2a2a]'}
                            ${isFirst ? 'bg-white dark:bg-[#1E1E1E]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]'}
                            hover:bg-green-50/40 dark:hover:bg-teal-950/10 transition-colors
                          `}
                        >
                          {/* N° — uniquement sur la première ligne du groupe */}
                          {isFirst && (
                            <td rowSpan={rowSpan} className="px-4 py-3 text-sm font-bold text-[#2F5B58] dark:text-teal-400 align-top whitespace-nowrap">
                              {groupIdx + 1}
                            </td>
                          )}

                          {/* Entreprise — uniquement sur la première ligne */}
                          {isFirst && (
                            <td rowSpan={rowSpan} className="px-4 py-3 text-sm align-top">
                              <div className="font-bold text-gray-900 dark:text-white">{groupe.societe}</div>
                            </td>
                          )}

                          {/* Contact — uniquement sur la première ligne */}
                          {isFirst && (
                            <td rowSpan={rowSpan} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-top">
                              {groupe.contact}
                            </td>
                          )}

                          {/* Email — uniquement sur la première ligne */}
                          {isFirst && (
                            <td rowSpan={rowSpan} className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 align-top break-all">
                              {groupe.email}
                            </td>
                          )}

                          {/* Ville — uniquement sur la première ligne */}
                          {isFirst && (
                            <td rowSpan={rowSpan} className="px-4 py-3 text-sm text-gray-900 dark:text-white align-top">
                              <div>{groupe.ville}</div>
                              {groupe.cp && <div className="text-xs text-gray-500 dark:text-gray-400">{groupe.cp}</div>}
                            </td>
                          )}

                          {/* Total offres — uniquement sur la première ligne, centré */}
                          {isFirst && (
                            <td rowSpan={rowSpan} className="px-4 py-3 text-center align-middle">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                                ${isMulti
                                  ? 'bg-[#2F5B58] text-white shadow-sm'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                {rowSpan}
                              </span>
                            </td>
                          )}

                          {/* Lot — une ligne par dépôt */}
                          <td className="px-4 py-2 text-sm">
                            {depot.lot ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-900/30 text-[#2F5B58] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                {depot.lot}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs italic">—</span>
                            )}
                          </td>

                          {/* Date dépôt */}
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {depot.dateReception || '—'}
                          </td>

                          {/* Mode */}
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              depot.modeReception === 'Électronique'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}>
                              {depot.modeReception || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contenu sélectionné */}
        {selectedProcedure && ongletActif === 'candidature' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-200 dark:border-[#333333] overflow-hidden">
            {/* Section title */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 px-6 py-4 border-b border-gray-200 dark:border-[#333333]">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-[#2F5B58] dark:text-teal-400" />
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Analyse des candidatures</h2>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Contenu de l'analyse des candidatures à développer...
                </p>
              </div>
            </div>
          </div>
        )}



        {/* Message si aucune procédure sélectionnée */}
        {!selectedProcedure && (
          <div className="ouverture-plis-card bg-gray-50 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 p-12 text-center">
            <PackageOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Veuillez sélectionner une procédure pour commencer l'analyse
            </p>
          </div>
        )}
      </div>

      {/* ── Visionneuse Procès Verbal (overlay z-50) ── */}
      {showPVPreview && pvData && (
        <ProcessVerbalPreview
          data={pvData}
          onClose={() => setShowPVPreview(false)}
          onExport={handleExportPV}
          isExporting={isExporting}
        />
      )}
    </div>
  );
};

export default OuverturePlis;
