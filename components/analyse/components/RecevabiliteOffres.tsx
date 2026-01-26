import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileCheck, Building2, Plus, Trash2, Cloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { DepotsData } from '../../../types/depots';
import { useOuverturePlis } from '../../../hooks/useOuverturePlis';

interface RecevabiliteOffresProps {
  onBack: () => void;
  procedure: any;
  dossier: any;
  depotsData: DepotsData | null;
  msa: string;
  valideurTechnique: string;
  demandeur: string;
}

interface CandidatRecevabilite {
  numero: number;
  societe: string;
  siret: string;
  lotRecevabilite: string;
  recevable: string;
  motifRejetRecevabilite: string;
}

const RecevabiliteOffres: React.FC<RecevabiliteOffresProps> = ({
  onBack,
  procedure,
  dossier,
  depotsData,
  msa,
  valideurTechnique,
  demandeur
}) => {
  const [candidats, setCandidats] = useState<CandidatRecevabilite[]>([]);
  const [raisonInfructuosite, setRaisonInfructuosite] = useState('');
  const [lotsInfructueux, setLotsInfructueux] = useState<{id: number; lot: string; statut: string}[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Hook de sauvegarde
  const refProc = procedure?.['Référence procédure (plateforme)'];
  const numProc = typeof refProc === 'string' ? refProc.split(' ')[0] : (refProc || '');
  const { loadData, saveData, autoSave, loading, saving, error, lastSaved } = useOuverturePlis(numProc);

  // Charger les candidats depuis les dépôts
  useEffect(() => {
    if (depotsData && depotsData.entreprises) {
      const candidatsInitiaux = depotsData.entreprises.map((entreprise, index) => ({
        numero: index + 1,
        societe: entreprise.societe || '',
        siret: '',
        lotRecevabilite: '',
        recevable: '',
        motifRejetRecevabilite: '',
      }));
      setCandidats(candidatsInitiaux);
    }
  }, [depotsData]);

  // Charger les données sauvegardées
  useEffect(() => {
    if (procedure) {
      loadData('recevabilite').then((savedData) => {
        if (savedData && savedData.recevabilite) {
          const recevabiliteData = savedData.recevabilite as any;
          if (recevabiliteData.candidats) {
            setCandidats(recevabiliteData.candidats);
          }
          if (recevabiliteData.raison_infructuosite) {
            setRaisonInfructuosite(recevabiliteData.raison_infructuosite);
          }
          if (recevabiliteData.lots_infructueux) {
            setLotsInfructueux(recevabiliteData.lots_infructueux);
          }
        }
      });
    }
  }, [procedure]);

  // Fonction de sauvegarde manuelle
  const handleSaveRecevabilite = async () => {
    if (!procedure) return;

    const refProc = procedure['Référence procédure (plateforme)'];
    const procNumero = typeof refProc === 'string' ? refProc.split(' ')[0] : String(refProc || '');

    const result = await saveData({
      num_proc: procNumero,
      reference_proc: String(refProc || ''),
      nom_proc: procedure['Nom de la procédure'],
      id_projet: procedure['IDProjet'],
      msa,
      valideur_technique: valideurTechnique,
      demandeur,
      type_analyse: 'recevabilite',
      statut: 'en_cours',
      recevabilite: {
        candidats,
        raison_infructuosite: raisonInfructuosite,
        lots_infructueux: lotsInfructueux,
      },
    });

    if (result.success) {
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

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
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white">Recevabilité des offres</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Procédure : {procedure?.['Référence procédure (plateforme)']}
                  </p>
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
                onClick={handleSaveRecevabilite}
                disabled={saving || !candidats.length}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
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

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* En-tête avec métadonnées */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-500/30">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            Recevabilité des offres
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-bold text-gray-700 dark:text-gray-300">Consultation n° :</span>{' '}
              <span className="text-gray-900 dark:text-white">{procedure?.['Numéro de procédure (Afpa)']}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-bold text-gray-700 dark:text-gray-300">Description :</span>{' '}
              <span className="text-gray-900 dark:text-white">{procedure?.['Nom de la procédure']}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700 dark:text-gray-300">Nombre de lots :</span>{' '}
              <span className="text-gray-900 dark:text-white">{procedure?.['Nombre de lots'] || '1'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700 dark:text-gray-300">RPA / AT :</span>{' '}
              <span className="text-gray-900 dark:text-white">{procedure?.['RPA/AT'] || msa || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700 dark:text-gray-300">MSA :</span>{' '}
              <span className="text-gray-900 dark:text-white">{msa || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700 dark:text-gray-300">Demandeur :</span>{' '}
              <span className="text-gray-900 dark:text-white">{demandeur || '-'}</span>
            </div>
            <div>
              <span className="font-bold text-gray-700 dark:text-gray-300">Valideur technique :</span>{' '}
              <span className="text-gray-900 dark:text-white">{valideurTechnique || '-'}</span>
            </div>
          </div>
        </div>

        {/* Tableau de recevabilité */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border-2 border-gray-200 dark:border-[#333333] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/40 dark:to-cyan-950/40">
                  <th className="px-4 py-3 text-left text-sm font-black text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
                    Candidat
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-black text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
                    Lot
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-black text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600">
                    Recevable / Éliminé
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-black text-gray-900 dark:text-white">
                    Si rejet : motif
                  </th>
                </tr>
              </thead>
              <tbody className="bg-yellow-50 dark:bg-yellow-950/5">
                {candidats.map((candidat, index) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-[#333333] hover:bg-yellow-100 dark:hover:bg-yellow-950/10 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333333]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-semibold">{candidat.societe}</div>
                          {candidat.siret && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">SIRET: {candidat.siret}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]">
                      <select
                        value={candidat.lotRecevabilite}
                        onChange={(e) => {
                          const newCandidats = [...candidats];
                          newCandidats[index].lotRecevabilite = e.target.value;
                          setCandidats(newCandidats);
                        }}
                        className="w-full text-sm border-2 border-gray-300 dark:border-[#444444] rounded-lg px-3 py-2 bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">-</option>
                        <option value="Unique">Unique</option>
                        <option value="Lot 1">Lot 1</option>
                        <option value="Lot 2">Lot 2</option>
                        <option value="Lot 3">Lot 3</option>
                        <option value="Lot 4">Lot 4</option>
                        <option value="Lot 5">Lot 5</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-[#333333]">
                      <select
                        value={candidat.recevable}
                        onChange={(e) => {
                          const newCandidats = [...candidats];
                          newCandidats[index].recevable = e.target.value;
                          if (e.target.value === 'Recevable') {
                            newCandidats[index].motifRejetRecevabilite = '';
                          }
                          setCandidats(newCandidats);
                        }}
                        className={`w-full text-sm font-semibold border-2 rounded-lg px-3 py-2 focus:outline-none ${
                          candidat.recevable === 'Recevable'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                            : candidat.recevable === 'Éliminé'
                            ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                            : 'border-gray-300 dark:border-[#444444] bg-white dark:bg-[#252525] text-gray-900 dark:text-white'
                        }`}
                      >
                        <option value="">-</option>
                        <option value="Recevable">Recevable</option>
                        <option value="Éliminé">Éliminé</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={candidat.motifRejetRecevabilite}
                        onChange={(e) => {
                          const newCandidats = [...candidats];
                          newCandidats[index].motifRejetRecevabilite = e.target.value;
                          setCandidats(newCandidats);
                        }}
                        disabled={candidat.recevable !== 'Éliminé'}
                        className="w-full text-sm border-2 border-gray-300 dark:border-[#444444] rounded-lg px-3 py-2 bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:border-red-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">-</option>
                        <option value="Irrégulière">Irrégulière</option>
                        <option value="Inacceptable">Inacceptable</option>
                        <option value="Inappropriée">Inappropriée</option>
                        <option value="Anormalement basse">Anormalement basse</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Déclaration d'infructuosité */}
        <div className="bg-gray-100 dark:bg-gray-800/30 rounded-xl p-6 border-2 border-gray-300 dark:border-gray-600">
          <h4 className="text-lg font-black text-gray-900 dark:text-white mb-4">
            Déclaration d'infructuosité ou sans suite de la procédure ou des lots
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                En raison de l'absence d'offres recevables, nous déclarons :
              </label>
              <textarea
                value={raisonInfructuosite}
                onChange={(e) => setRaisonInfructuosite(e.target.value)}
                placeholder="Exemple: Sans suite / Infructueux"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-[#444444] bg-white dark:bg-[#252525] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500"
              />
            </div>
            
            <div className="space-y-3">
              {/* Liste des lots infructueux */}
              {lotsInfructueux.map((lot, index) => (
                <div key={lot.id} className="bg-yellow-50 dark:bg-yellow-950/10 rounded-lg p-4 border border-yellow-300 dark:border-yellow-600">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Lot n°
                        </label>
                        <input
                          type="text"
                          value={lot.lot}
                          onChange={(e) => {
                            const newLots = [...lotsInfructueux];
                            newLots[index].lot = e.target.value;
                            setLotsInfructueux(newLots);
                          }}
                          placeholder="Numéro du lot"
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-[#444444] bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Infructueux / sans suite
                        </label>
                        <input
                          type="text"
                          value={lot.statut}
                          onChange={(e) => {
                            const newLots = [...lotsInfructueux];
                            newLots[index].statut = e.target.value;
                            setLotsInfructueux(newLots);
                          }}
                          placeholder="Infructueux / sans suite"
                          className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-[#444444] bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:outline-none focus:border-yellow-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLotsInfructueux(lotsInfructueux.filter((_, i) => i !== index));
                      }}
                      className="mt-8 p-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                      title="Supprimer ce lot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Bouton ajouter un lot */}
              <button
                onClick={() => {
                  setLotsInfructueux([...lotsInfructueux, { id: Date.now(), lot: '', statut: '' }]);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/10 hover:bg-yellow-100 dark:hover:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400 font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter un lot infructueux
              </button>
            </div>
          </div>
        </div>

        {/* Tableau de référence des motifs de rejet */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-6 border-2 border-gray-200 dark:border-[#333333]">
          <h4 className="text-lg font-black text-gray-900 dark:text-white mb-4">
            Motifs de rejet
          </h4>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-[#333333]">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#333333]">
                    Motifs de rejet
                  </th>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 dark:text-gray-300">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#333333]">
                <tr className="hover:bg-gray-50 dark:hover:bg-[#252525]">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-[#333333]">
                    Irrégulière
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre qui ne respecte pas les exigences formulées dans les documents de la consultation notamment parce qu'elle est incomplète, ou qui méconnaît la législation applicable notamment en matière sociale et environnementale
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-[#252525]">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-[#333333]">
                    Inacceptable
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre dont le prix excède les crédits budgétaires alloués au marché public tels qu'ils ont été déterminés et établis avant le lancement de la procédure
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-[#252525]">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-[#333333]">
                    Inappropriée
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre sans rapport avec le marché public parce qu'elle n'est manifestement pas en mesure, sans modification substantielle, de répondre au besoin et aux exigences de l'acheteur formulées dans les documents de la consultation
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-[#252525]">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-[#333333]">
                    Anormalement basse
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre dont le prix est manifestement sous-évalué et de nature à compromettre la bonne exécution du marché
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecevabiliteOffres;
