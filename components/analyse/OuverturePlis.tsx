import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, PackageOpen, UserCheck, FileCheck, Building2, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react';
import { DepotsData } from '../../types/depots';

interface OuverturePlisProps {
  onBack: () => void;
  procedures: any[];
  dossiers: any[];
}

type OngletType = 'candidature' | 'recevabilite';

const OuverturePlis: React.FC<OuverturePlisProps> = ({ onBack, procedures, dossiers }) => {
  const [searchNumero, setSearchNumero] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [ongletActif, setOngletActif] = useState<OngletType | null>(null);
  
  // Champs de saisie
  const [msa, setMsa] = useState('');
  const [valideurTechnique, setValideurTechnique] = useState('');
  const [demandeur, setDemandeur] = useState('');
  
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
              onClick={() => setOngletActif('recevabilite')}
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
                        {entreprise.siret && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">SIRET: {entreprise.siret}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {entreprise.contact}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {entreprise.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div>{entreprise.ville}</div>
                        {entreprise.codePostal && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{entreprise.codePostal}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entreprise.dateReception}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entreprise.heureReception}
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
        {selectedProcedure && ongletActif && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border-2 border-gray-200 dark:border-[#333333] overflow-hidden">{/* Section title */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 px-6 py-4 border-b border-gray-200 dark:border-[#333333]">
              <div className="flex items-center gap-3">
                {ongletActif === 'candidature' ? (
                  <>
                    <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Analyse des candidatures</h2>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Recevabilité des offres</h2>
                  </>
                )}
              </div>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {ongletActif === 'candidature' && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Contenu de l'analyse des candidatures à développer...
                  </p>
                </div>
              )}

              {ongletActif === 'recevabilite' && (
                <div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm">
                    <p>Contenu de la recevabilité des offres à développer...</p>
                  </div>
                </div>
              )}
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
