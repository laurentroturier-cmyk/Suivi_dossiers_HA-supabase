import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, PackageOpen, UserCheck, FileCheck, Building2, Mail, Phone, MapPin, Calendar, Clock, Pencil, Save, X, Cloud, CloudOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { DepotsData } from '../../types/depots';
import RecevabiliteOffres from './RecevabiliteOffres';
import { useOuverturePlis } from '../../hooks/useOuverturePlis';

interface OuverturePlisProps {
  onBack: () => void;
  procedures: any[];
  dossiers: any[];
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

const OuverturePlis: React.FC<OuverturePlisProps> = ({ onBack, procedures, dossiers }) => {
  const [searchNumero, setSearchNumero] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [ongletActif, setOngletActif] = useState<OngletType | null>(null);
  const [showRecevabilite, setShowRecevabilite] = useState(false);
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

  // Vue tableau candidature
  if (ongletActif === 'candidature' && selectedProcedure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#0d0f12] dark:via-[#121212] dark:to-[#0d0f12]">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-[#1E1E1E]/80 dark:border-[#333333] sticky top-0 z-10">
          <div className="max-w-full mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOngletActif(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analyse des candidatures</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Procédure : {selectedProcedure?.['Référence procédure (plateforme)']}</p>
                  </div>
                </div>
              </div>

              {/* Bouton de sauvegarde et indicateurs */}
              <div className="flex items-center gap-4">
                {/* Erreur */}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Bouton de sauvegarde manuelle */}
                <button
                  onClick={handleSaveCandidature}
                  disabled={saving || !candidats.length}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                >
                  {saving ? (
                    <>
                      <Cloud className="w-4 h-4 animate-spin" />
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>

                {/* Message de succès */}
                {showSaveSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium animate-fade-in">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sauvegardé avec succès !</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tableau avec catégories */}
        <div className="max-w-full mx-auto px-6 py-8">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-200 dark:border-[#333333] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                {/* En-têtes de catégories */}
                <thead>
                  <tr>
                    <th className="bg-gray-200 dark:bg-gray-700 px-2 py-3"></th>
                    <th colSpan={7} className="bg-yellow-500 dark:bg-yellow-600 px-4 py-3 text-center text-sm font-black text-gray-900 dark:text-white border-r-2 border-white">
                      Candidat
                    </th>
                    <th colSpan={1} className="bg-blue-500 dark:bg-blue-600 px-4 py-3 text-center text-sm font-black text-white border-r-2 border-white">
                      Dépôt
                    </th>
                    <th colSpan={1} className="bg-green-500 dark:bg-green-600 px-4 py-3 text-center text-sm font-black text-white">
                      Admission
                    </th>
                  </tr>
                  {/* En-têtes de colonnes */}
                  <tr className="border-t-2 border-gray-300">
                    <th className="bg-gray-100 dark:bg-gray-800 px-2 py-2"></th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r border-gray-300">N°</th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r border-gray-300">Prénom</th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r border-gray-300">Nom</th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r border-gray-300">Société</th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r border-gray-300">N° Siret/Siren</th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r border-gray-300">Adresse</th>
                    <th className="bg-yellow-100 dark:bg-yellow-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r-4 border-blue-500">Ville</th>
                    
                    <th className="bg-blue-100 dark:bg-blue-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white border-r-4 border-green-500">Lot</th>
                    
                    <th className="bg-green-100 dark:bg-green-900/30 px-2 py-2 text-xs font-bold text-gray-900 dark:text-white">Admis / Rejeté</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#1E1E1E]">
                  {candidats.map((candidat, index) => (
                    <tr key={index} className="border-t border-gray-200 dark:border-[#333333] hover:bg-gray-50 dark:hover:bg-[#252525]">
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => handleOpenEditModal(index)}
                          className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </button>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white text-center border-r border-gray-200">{candidat.numero}</td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white border-r border-gray-200">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">-</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white border-r border-gray-200">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">{candidat.nom || '-'}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white border-r border-gray-200">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">{candidat.societe || '-'}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white border-r border-gray-200">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">{candidat.siret || '-'}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white border-r border-gray-200">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">{candidat.adresse || '-'}</option>
                        </select>
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 dark:text-white border-r-4 border-blue-500">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">{candidat.ville || '-'}</option>
                        </select>
                      </td>
                      
                      <td className="px-2 py-2 text-xs border-r-4 border-green-500 bg-blue-50/30 dark:bg-blue-950/10">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">-</option>
                        </select>
                      </td>
                      
                      <td className="px-2 py-2 text-xs bg-green-50/30 dark:bg-green-950/10">
                        <select className="w-full text-xs border rounded px-1 py-1 bg-white dark:bg-[#252525]">
                          <option value="">-</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modale d'édition avec onglets */}
        {editModalOpen && editCandidat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#333333]">
                <h2 className="text-2xl font-black text-purple-700 dark:text-purple-300">Candidat n°{editCandidat.numero} - {editCandidat.societe}</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Onglets */}
              <div className="flex gap-2 px-6 pt-4 border-b border-gray-200 dark:border-[#333333] bg-gray-50 dark:bg-[#252525]">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'info'
                      ? 'bg-white dark:bg-[#1E1E1E] text-purple-600 dark:text-purple-400 border-t-2 border-purple-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  Info Générale
                </button>
                <button
                  onClick={() => setActiveTab('dc1')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'dc1'
                      ? 'bg-white dark:bg-[#1E1E1E] text-orange-600 dark:text-orange-400 border-t-2 border-orange-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  DC1
                </button>
                <button
                  onClick={() => setActiveTab('dc2')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'dc2'
                      ? 'bg-white dark:bg-[#1E1E1E] text-blue-600 dark:text-blue-400 border-t-2 border-blue-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  DC2
                </button>
                <button
                  onClick={() => setActiveTab('assurances')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'assurances'
                      ? 'bg-white dark:bg-[#1E1E1E] text-green-600 dark:text-green-400 border-t-2 border-green-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                  }`}
                >
                  Assurances
                </button>
                <button
                  onClick={() => setActiveTab('offre')}
                  className={`px-4 py-2 rounded-t-lg font-semibold transition-colors ${
                    activeTab === 'offre'
                      ? 'bg-white dark:bg-[#1E1E1E] text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
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
                      <input type="text" value={editCandidat.prenom} onChange={e => handleEditField('prenom', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                      <input type="text" value={editCandidat.nom} onChange={e => handleEditField('nom', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Société</label>
                      <input type="text" value={editCandidat.societe} onChange={e => handleEditField('societe', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">N° Siret/Siren</label>
                      <input type="text" value={editCandidat.siret} onChange={e => handleEditField('siret', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="email" value={editCandidat.email} onChange={e => handleEditField('email', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                      <input type="tel" value={editCandidat.telephone} onChange={e => handleEditField('telephone', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Adresse</label>
                      <input type="text" value={editCandidat.adresse} onChange={e => handleEditField('adresse', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Code Postal</label>
                      <input type="text" value={editCandidat.codePostal} onChange={e => handleEditField('codePostal', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                      <input type="text" value={editCandidat.ville} onChange={e => handleEditField('ville', e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 dark:border-[#333333] rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none" />
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
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                      <h3 className="text-sm font-black text-indigo-700 dark:text-indigo-300 mb-3">Détail de l'offre</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix de base (€)</label>
                          <input type="text" value={editCandidat.offrePrixBase} onChange={e => handleEditField('offrePrixBase', e.target.value)} className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix options (€)</label>
                          <input type="text" value={editCandidat.offrePrixOptions} onChange={e => handleEditField('offrePrixOptions', e.target.value)} className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix total (€)</label>
                          <input type="text" value={editCandidat.offrePrixTotal} onChange={e => handleEditField('offrePrixTotal', e.target.value)} className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Délai d'exécution</label>
                          <input type="text" value={editCandidat.offreDelai} onChange={e => handleEditField('offreDelai', e.target.value)} className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Validité de l'offre</label>
                          <input type="text" value={editCandidat.offreValidite} onChange={e => handleEditField('offreValidite', e.target.value)} placeholder="Ex: 90 jours" className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Variantes proposées</label>
                          <textarea value={editCandidat.offreVariantes} onChange={e => handleEditField('offreVariantes', e.target.value)} rows={3} className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Observations</label>
                          <textarea value={editCandidat.offreObservations} onChange={e => handleEditField('offreObservations', e.target.value)} rows={4} className="w-full px-3 py-2 border-2 border-indigo-300 dark:border-indigo-900 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none" />
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
                  <button onClick={handleSaveEdit} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors">
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
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                  <PackageOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-black">1</span>
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
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
                <button
                  onClick={handleSearchProcedure}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Rechercher
                </button>
              </div>
            </div>

            {/* Affichage de la procédure sélectionnée */}
            {selectedProcedure && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 rounded-xl">
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-[#333333] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
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
              className="group bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-purple-200 dark:border-purple-500/40 hover:border-purple-400 dark:hover:border-purple-400 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
              className="group bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-blue-200 dark:border-blue-500/40 hover:border-blue-400 dark:hover:border-blue-400 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/10 rounded-xl border border-purple-200 dark:border-purple-500/30">
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
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {depotsData.stats.totalEnveloppesElectroniques + depotsData.stats.totalEnveloppesPapier}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Tableau des candidatures */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#333333]">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#333333]">
                <thead className="bg-purple-50 dark:bg-purple-950/20">
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
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 px-6 py-4 border-b border-gray-200 dark:border-[#333333]">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
