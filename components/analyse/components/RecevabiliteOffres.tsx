import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, FileCheck, Building2, Plus, Trash2, Cloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { DepotsData } from '../../../types/depots';
import { useOuverturePlis } from '../../../hooks/useOuverturePlis';
import { useDCELots } from '../../../hooks/useDCELots';
import { LotMultiSelector } from '../../shared/LotMultiSelector';

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
  observation?: string;
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

  // Numéro 5 chiffres pour le DCE
  const numProc5 = useMemo(() => {
    const n = procedure?.['NumeroAfpa5Chiffres'];
    if (n) return String(n);
    const afpa = String(procedure?.['Numéro de procédure (Afpa)'] || '');
    const m = afpa.match(/^(\d{5})/);
    return m ? m[1] : null;
  }, [procedure]);

  // Chargement des lots depuis le DCE Complet
  const { lots: dceLots } = useDCELots(numProc5);

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
        observation: '',
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

  const inputBase = 'w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58] outline-none';

  return (
    <div className="ouverture-plis-module recevabilite-offres-module min-h-screen bg-white dark:bg-gray-900">
      {/* Header — thème app (teal #2F5B58) */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2F5B58]/10 dark:bg-teal-500/20 flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-[#2F5B58] dark:text-teal-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#2F5B58] dark:text-teal-400">Recevabilité des offres</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Procédure : {procedure?.['Référence procédure (plateforme)']}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              <button
                onClick={handleSaveRecevabilite}
                disabled={saving || !candidats.length}
                className="px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg transition flex items-center gap-2 font-medium shadow-md"
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
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* En-tête avec métadonnées — style DQE (teal / vert clair) */}
        <div className="recevabilite-info-band bg-gradient-to-r from-green-50 to-emerald-50 dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-600">
          <h3 className="text-lg font-bold text-[#2F5B58] dark:text-teal-400 mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
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

        {/* Tableau de recevabilité — thème app (teal en-tête, colonne Observation) */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#2F5B58] text-white">
                  <th className="px-4 py-3 text-left text-sm font-semibold border-r border-[#234441]">Candidat</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-r border-[#234441]">Lot</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-r border-[#234441]">Recevable / Éliminé</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-r border-[#234441]">Si rejet : motif</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Observation</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {candidats.map((candidat, index) => (
                  <tr key={index} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#2F5B58] dark:text-teal-400 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{candidat.societe}</div>
                          {candidat.siret && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">SIRET: {candidat.siret}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                      <LotMultiSelector
                        lots={dceLots}
                        value={candidat.lotRecevabilite}
                        onChange={(val) => {
                          const newCandidats = [...candidats];
                          newCandidats[index].lotRecevabilite = val;
                          setCandidats(newCandidats);
                        }}
                        compact
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
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
                        className={`w-full text-sm font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58] ${
                          candidat.recevable === 'Recevable'
                            ? 'border border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                            : candidat.recevable === 'Éliminé'
                            ? 'border border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                            : inputBase
                        }`}
                      >
                        <option value="">-</option>
                        <option value="Recevable">Recevable</option>
                        <option value="Éliminé">Éliminé</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                      <select
                        value={candidat.motifRejetRecevabilite}
                        onChange={(e) => {
                          const newCandidats = [...candidats];
                          newCandidats[index].motifRejetRecevabilite = e.target.value;
                          setCandidats(newCandidats);
                        }}
                        disabled={candidat.recevable !== 'Éliminé'}
                        className={`${inputBase} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">-</option>
                        <option value="Irrégulière">Irrégulière</option>
                        <option value="Inacceptable">Inacceptable</option>
                        <option value="Inappropriée">Inappropriée</option>
                        <option value="Anormalement basse">Anormalement basse</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={candidat.observation ?? ''}
                        onChange={(e) => {
                          const newCandidats = [...candidats];
                          newCandidats[index] = { ...newCandidats[index], observation: e.target.value };
                          setCandidats(newCandidats);
                        }}
                        placeholder="Observation..."
                        className={inputBase}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Déclaration d'infructuosité — thème app (teal / gris) */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-[#2F5B58] dark:text-teal-400 mb-4">
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
                className={`${inputBase} w-full`}
              />
            </div>
            
            <div className="space-y-3">
              {lotsInfructueux.map((lot, index) => (
                <div key={lot.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Lot
                        </label>
                        <LotMultiSelector
                          lots={dceLots}
                          value={lot.lot}
                          onChange={(val) => {
                            const newLots = [...lotsInfructueux];
                            newLots[index].lot = val;
                            setLotsInfructueux(newLots);
                          }}
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
                          className={inputBase}
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

              <button
                onClick={() => {
                  setLotsInfructueux([...lotsInfructueux, { id: Date.now(), lot: '', statut: '' }]);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-[#2F5B58] dark:border-teal-500 bg-[#2F5B58]/5 dark:bg-teal-500/10 hover:bg-[#2F5B58]/10 dark:hover:bg-teal-500/20 text-[#2F5B58] dark:text-teal-400 font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter un lot infructueux
              </button>
            </div>
          </div>
        </div>

        {/* Tableau de référence des motifs de rejet — thème app */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-bold text-[#2F5B58] dark:text-teal-400 mb-4">
            Motifs de rejet
          </h4>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#2F5B58] text-white">
                  <th className="px-4 py-3 text-left font-semibold border-r border-[#234441]">
                    Motifs de rejet
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
                    Irrégulière
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre qui ne respecte pas les exigences formulées dans les documents de la consultation notamment parce qu'elle est incomplète, ou qui méconnaît la législation applicable notamment en matière sociale et environnementale
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
                    Inacceptable
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre dont le prix excède les crédits budgétaires alloués au marché public tels qu'ils ont été déterminés et établis avant le lancement de la procédure
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
                    Inappropriée
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    Offre sans rapport avec le marché public parce qu'elle n'est manifestement pas en mesure, sans modification substantielle, de répondre au besoin et aux exigences de l'acheteur formulées dans les documents de la consultation
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700">
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
