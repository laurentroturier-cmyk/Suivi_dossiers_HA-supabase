import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, PackageOpen, UserCheck, FileCheck, Building2, Mail, Phone, MapPin, Calendar, Clock, Pencil, Save, X, Cloud, CloudOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { DepotsData } from '../../../types/depots';
import RecevabiliteOffres from './RecevabiliteOffres';
import { useOuverturePlis } from '../../../hooks/useOuverturePlis';

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
  
  // Recevabilité
  lotRecevabilite: string;
  recevable: string; // 'Recevable' | 'Éliminé' | ''
  motifRejetRecevabilite: string;
  
  // DC1
  dc1Produit: string;
  dc1PrixHT: string;
  dc1PrixTTC: string;
  dc1Delai: string;
  dc1MoyensProduits: string;
  dc1MoyensHumains: string;
  dc1References: string;
  dc1Titres: string;
  
  // DC2
  dc2Produit: string;
  dc2CAN1: string;
  dc2CAN2: string;
  dc2CAN3: string;
  dc2EffectifMoyen: string;
  dc2OutillageMateriel: string;
  dc2MesuresGestion: string;
  dc2CertificationsQualite: string;
  
  // Assurances
  assuranceRC: string;
  assuranceRCMontant: string;
  assuranceDecennale: string;
  assuranceDecennaleMontant: string;
  assuranceAutre: string;
  assuranceAutreMontant: string;
  
  // Offre
  offrePrixBase: string;
  offrePrixOptions: string;
  offrePrixTotal: string;
  offreDelai: string;
  offreValidite: string;
  offreVariantes: string;
  offreObservations: string;
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
  const [activeTab, setActiveTab] = useState<'info' | 'dc1' | 'dc2' | 'assurances' | 'offre'>('info');
  
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
  
  // Données des dépôts depuis la procédure
  const depotsData: DepotsData | null = selectedProcedure?.depots || null;

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
        // Recevabilité
        lotRecevabilite: '',
        recevable: '',
        motifRejetRecevabilite: '',
        // DC1
        dc1Produit: '',
        dc1PrixHT: '',
        dc1PrixTTC: '',
        dc1Delai: '',
        dc1MoyensProduits: '',
        dc1MoyensHumains: '',
        dc1References: '',
        dc1Titres: '',
        // DC2
        dc2Produit: '',
        dc2CAN1: '',
        dc2CAN2: '',
        dc2CAN3: '',
        dc2EffectifMoyen: '',
        dc2OutillageMateriel: '',
        dc2MesuresGestion: '',
        dc2CertificationsQualite: '',
        // Assurances
        assuranceRC: '',
        assuranceRCMontant: '',
        assuranceDecennale: '',
        assuranceDecennaleMontant: '',
        assuranceAutre: '',
        assuranceAutreMontant: '',
        // Offre
        offrePrixBase: '',
        offrePrixOptions: '',
        offrePrixTotal: '',
        offreDelai: '',
        offreValidite: '',
        offreVariantes: '',
        offreObservations: '',
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
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden flex flex-col">
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
                  className="flex items-center gap-2 px-4 py-2 bg-[#2F5B58] hover:bg-[#234441] disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition font-medium"
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
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4">
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
                  <span className="text-gray-900 dark:text-white font-medium">{candidats.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau pleine page — une seule ligne d'en-tête teal */}
        <div className="flex-1 overflow-auto">
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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {candidats.map((candidat, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="border border-gray-300 dark:border-gray-600 px-1 py-1 text-center sticky left-0 bg-white dark:bg-gray-900 z-[1]">
                      <button
                        onClick={() => handleOpenEditModal(index)}
                        className="p-1.5 rounded hover:bg-[#2F5B58]/10 text-[#2F5B58] dark:text-teal-400 transition"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-sm text-gray-900 dark:text-white text-center tabular-nums">{candidat.numero}</td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.prenom}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], prenom: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.nom}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], nom: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.societe}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], societe: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.siret}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], siret: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.adresse}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], adresse: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.ville}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], ville: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <input
                        value={candidat.lot}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], lot: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 p-0">
                      <select
                        value={candidat.admisRejete}
                        onChange={(e) => { const c = [...candidats]; c[index] = { ...c[index], admisRejete: e.target.value }; setCandidats(c); }}
                        className={`w-full ${colClasses}`}
                      >
                        <option value="">—</option>
                        <option value="Admis">Admis</option>
                        <option value="Rejeté">Rejeté</option>
                      </select>
                    </td>
                  </tr>
                ))}
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
                  onClick={() => setActiveTab('dc1')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'dc1'
                      ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 border-t-2 border-orange-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  DC1
                </button>
                <button
                  onClick={() => setActiveTab('dc2')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'dc2'
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  DC2
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
                      <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Lot</label>
                      <input type="text" value={editCandidat.lot} onChange={e => handleEditField('lot', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Hors Délai</label>
                      <select value={editCandidat.horsDelai} onChange={e => handleEditField('horsDelai', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none">
                        <option value="">-</option>
                        <option value="Oui">Oui</option>
                        <option value="Non">Non</option>
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

                {/* Onglet DC1 */}
                {activeTab === 'dc1' && (
                  <div className="space-y-4">
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-200 dark:border-orange-500/30">
                      <h3 className="text-sm font-black text-orange-700 dark:text-orange-300 mb-3">Document de Candidature 1 (DC1)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Produit</label>
                          <textarea value={editCandidat.dc1Produit} onChange={e => handleEditField('dc1Produit', e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix HT (€)</label>
                          <input type="text" value={editCandidat.dc1PrixHT} onChange={e => handleEditField('dc1PrixHT', e.target.value)} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix TTC (€)</label>
                          <input type="text" value={editCandidat.dc1PrixTTC} onChange={e => handleEditField('dc1PrixTTC', e.target.value)} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Délai d'exécution</label>
                          <input type="text" value={editCandidat.dc1Delai} onChange={e => handleEditField('dc1Delai', e.target.value)} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Moyens de production</label>
                          <textarea value={editCandidat.dc1MoyensProduits} onChange={e => handleEditField('dc1MoyensProduits', e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Moyens humains</label>
                          <textarea value={editCandidat.dc1MoyensHumains} onChange={e => handleEditField('dc1MoyensHumains', e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Références professionnelles</label>
                          <textarea value={editCandidat.dc1References} onChange={e => handleEditField('dc1References', e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Titres et diplômes</label>
                          <textarea value={editCandidat.dc1Titres} onChange={e => handleEditField('dc1Titres', e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-orange-300 dark:border-orange-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet DC2 */}
                {activeTab === 'dc2' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30">
                      <h3 className="text-sm font-black text-blue-700 dark:text-blue-300 mb-3">Document de Candidature 2 (DC2)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Produit</label>
                          <textarea value={editCandidat.dc2Produit} onChange={e => handleEditField('dc2Produit', e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CA n-1 (€)</label>
                          <input type="text" value={editCandidat.dc2CAN1} onChange={e => handleEditField('dc2CAN1', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CA n-2 (€)</label>
                          <input type="text" value={editCandidat.dc2CAN2} onChange={e => handleEditField('dc2CAN2', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CA n-3 (€)</label>
                          <input type="text" value={editCandidat.dc2CAN3} onChange={e => handleEditField('dc2CAN3', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Effectif moyen annuel</label>
                          <input type="text" value={editCandidat.dc2EffectifMoyen} onChange={e => handleEditField('dc2EffectifMoyen', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Outillage et matériel</label>
                          <textarea value={editCandidat.dc2OutillageMateriel} onChange={e => handleEditField('dc2OutillageMateriel', e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mesures de gestion environnementale</label>
                          <textarea value={editCandidat.dc2MesuresGestion} onChange={e => handleEditField('dc2MesuresGestion', e.target.value)} rows={2} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Certifications qualité</label>
                          <input type="text" value={editCandidat.dc2CertificationsQualite} onChange={e => handleEditField('dc2CertificationsQualite', e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 dark:border-blue-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none" />
                        </div>
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
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">RC Professionnelle</label>
                          <select value={editCandidat.assuranceRC} onChange={e => handleEditField('assuranceRC', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none">
                            <option value="">-</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant RC (€)</label>
                          <input type="text" value={editCandidat.assuranceRCMontant} onChange={e => handleEditField('assuranceRCMontant', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Décennale</label>
                          <select value={editCandidat.assuranceDecennale} onChange={e => handleEditField('assuranceDecennale', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none">
                            <option value="">-</option>
                            <option value="Oui">Oui</option>
                            <option value="Non">Non</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant Décennale (€)</label>
                          <input type="text" value={editCandidat.assuranceDecennaleMontant} onChange={e => handleEditField('assuranceDecennaleMontant', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Autre assurance</label>
                          <input type="text" value={editCandidat.assuranceAutre} onChange={e => handleEditField('assuranceAutre', e.target.value)} placeholder="Type d'assurance" className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Montant autre assurance (€)</label>
                          <input type="text" value={editCandidat.assuranceAutreMontant} onChange={e => handleEditField('assuranceAutreMontant', e.target.value)} className="w-full px-3 py-2 border-2 border-green-300 dark:border-green-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-green-500 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Onglet Offre */}
                {activeTab === 'offre' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-teal-950/20 p-4 rounded-xl border border-[#2F5B58]/20 dark:border-teal-500/30">
                      <h3 className="text-sm font-black text-[#2F5B58] dark:text-teal-300 mb-3">Détail de l'offre</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix de base (€)</label>
                          <input type="text" value={editCandidat.offrePrixBase} onChange={e => handleEditField('offrePrixBase', e.target.value)} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix options (€)</label>
                          <input type="text" value={editCandidat.offrePrixOptions} onChange={e => handleEditField('offrePrixOptions', e.target.value)} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix total (€)</label>
                          <input type="text" value={editCandidat.offrePrixTotal} onChange={e => handleEditField('offrePrixTotal', e.target.value)} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Délai d'exécution</label>
                          <input type="text" value={editCandidat.offreDelai} onChange={e => handleEditField('offreDelai', e.target.value)} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Validité de l'offre</label>
                          <input type="text" value={editCandidat.offreValidite} onChange={e => handleEditField('offreValidite', e.target.value)} placeholder="Ex: 90 jours" className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Variantes proposées</label>
                          <textarea value={editCandidat.offreVariantes} onChange={e => handleEditField('offreVariantes', e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Observations</label>
                          <textarea value={editCandidat.offreObservations} onChange={e => handleEditField('offreObservations', e.target.value)} rows={4} className="w-full px-3 py-2 border-2 border-[#2F5B58]/40 dark:border-teal-700 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-[#2F5B58] focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer avec boutons */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#252525]">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Onglet {activeTab === 'info' ? '1/5' : activeTab === 'dc1' ? '2/5' : activeTab === 'dc2' ? '3/5' : activeTab === 'assurances' ? '4/5' : '5/5'} - Toutes les modifications sont enregistrées ensemble
                </div>
                <div className="flex gap-3">
                  <button onClick={handleCancelEdit} className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[#2F5B58] text-white font-semibold hover:bg-[#234441] transition-colors">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#0d0f12] dark:via-[#121212] dark:to-[#0d0f12]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-[#1E1E1E]/80 dark:border-[#333333] sticky top-0 z-10">
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
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Étape 1 : Sélectionner une procédure */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-200 dark:border-[#333333] p-6 mb-6">
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
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#2F5B58] dark:focus:border-teal-400 transition-colors"
                />
                <button
                  onClick={handleSearchProcedure}
                  className="px-6 py-3 bg-[#2F5B58] hover:bg-[#234441] dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
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
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-200 dark:border-[#333333] p-6 mb-6">
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
              className="group bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-[#2F5B58]/20 dark:border-teal-500/40 hover:border-[#2F5B58] dark:hover:border-teal-400 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
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
              className="group bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-emerald-200 dark:border-emerald-500/40 hover:border-emerald-400 dark:hover:border-emerald-400 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
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
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-200 dark:border-[#333333] p-6 mb-6">
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
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Total candidatures :</span>{' '}
                  <span className="text-[#2F5B58] dark:text-teal-400 font-bold">
                    {depotsData.stats.totalEnveloppesElectroniques + depotsData.stats.totalEnveloppesPapier}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Tableau des candidatures */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#333333]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#333333]">
                <thead className="bg-green-50 dark:bg-teal-950/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      N°
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Entreprise
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Ville
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date dépôt
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Heure
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Mode
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1E1E1E] divide-y divide-gray-200 dark:divide-[#333333]">
                  {depotsData.entreprises.map((entreprise, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="font-semibold">{entreprise.societe}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {entreprise.contact}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {entreprise.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div>{entreprise.ville}</div>
                        {entreprise.cp && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{entreprise.cp}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entreprise.dateReception}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        -
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entreprise.modeReception === 'Électronique' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {entreprise.modeReception}
                        </span>
                      </td>
                    </tr>
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
          <div className="bg-gray-50 dark:bg-[#252525] rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#333333] p-12 text-center">
            <PackageOpen className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Veuillez sélectionner une procédure pour commencer l'analyse
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OuverturePlis;
