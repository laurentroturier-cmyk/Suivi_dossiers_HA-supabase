import React, { useState, useEffect } from 'react';
import { FileText, Download, Save, Loader2, CheckCircle2, XCircle, FolderOpen } from 'lucide-react';
import { saveNoti5, loadNoti5 } from './services/noti5Storage';
import { generateNoti5Word } from './services/noti5Generator';
import type { Noti5Data } from './types/noti5';

interface NOTI5SectionProps {
  initialData?: Partial<Noti5Data>;
}

const NOTI5Section: React.FC<NOTI5SectionProps> = ({ initialData }) => {
  const [formData, setFormData] = useState<Noti5Data>({
    numeroProcedure: '',
    pouvoirAdjudicateur: {
      nom: 'Agence nationale pour la formation professionnelle des adultes',
      adresseVoie: '3, rue Franklin',
      codePostal: '93100',
      ville: 'MONTREUIL',
    },
    objetConsultation: '',
    attributaire: {
      denomination: '',
      siret: '',
      adresse1: '',
      adresse2: '',
      codePostal: '',
      ville: '',
      email: '',
      telephone: '',
      fax: '',
      estMandataire: false,
    },
    notification: {
      type: 'ensemble',
      lots: [],
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
      actEngagementPapier: false,
      actEngagementPDF: true,
    },
    signature: {
      lieu: 'Montreuil',
      date: new Date().toLocaleDateString('fr-FR'),
      signataireTitre: 'Direction Nationale des Achats',
      signataireNom: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Merge initialData avec formData
  useEffect(() => {
    if (initialData) {
      console.log('[NOTI5Section] Données initiales reçues:', initialData);
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        pouvoirAdjudicateur: {
          ...prev.pouvoirAdjudicateur,
          ...(initialData.pouvoirAdjudicateur || {}),
        },
        attributaire: {
          ...prev.attributaire,
          ...(initialData.attributaire || {}),
        },
        notification: {
          ...prev.notification,
          ...(initialData.notification || {}),
        },
        executionPrestations: {
          ...prev.executionPrestations,
          ...(initialData.executionPrestations || {}),
        },
        garanties: {
          ...prev.garanties,
          ...(initialData.garanties || {}),
        },
        piecesJointes: {
          ...prev.piecesJointes,
          ...(initialData.piecesJointes || {}),
        },
        signature: {
          ...prev.signature,
          ...(initialData.signature || {}),
        },
      }));
    }
  }, [initialData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveNoti5(formData.numeroProcedure, formData);
      if (result.success) {
        setSaveStatus({ type: 'success', message: 'NOTI5 sauvegardé avec succès' });
        setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
      } else {
        setSaveStatus({ type: 'error', message: result.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      await generateNoti5Word(formData);
    } catch (error) {
      console.error('Erreur export Word:', error);
      alert('Erreur lors de l\'export Word');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoad = async () => {
    if (!formData.numeroProcedure) {
      alert('Veuillez saisir un numéro de procédure');
      return;
    }

    const result = await loadNoti5(formData.numeroProcedure);
    if (result.success && result.data) {
      setFormData(result.data);
      setSaveStatus({ type: 'success', message: 'NOTI5 chargé avec succès' });
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
    } else {
      alert(result.error || 'Aucun NOTI5 trouvé pour cette procédure');
    }
  };

  const addLot = () => {
    setFormData((prev) => ({
      ...prev,
      notification: {
        ...prev.notification,
        lots: [...prev.notification.lots, { numero: '', intitule: '' }],
      },
    }));
  };

  const removeLot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      notification: {
        ...prev.notification,
        lots: prev.notification.lots.filter((_, i) => i !== index),
      },
    }));
  };

  const updateLot = (index: number, field: 'numero' | 'intitule', value: string) => {
    setFormData((prev) => ({
      ...prev,
      notification: {
        ...prev.notification,
        lots: prev.notification.lots.map((lot, i) =>
          i === index ? { ...lot, [field]: value } : lot
        ),
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header avec titre et boutons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-green-600" />
              NOTI5 - Information au titulaire pressenti
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Document officiel d'information au soumissionnaire retenu
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLoad}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2"
              title="Charger un NOTI5 existant"
            >
              <FolderOpen className="w-4 h-4" />
              Charger
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>

            <button
              onClick={handleExportWord}
              disabled={isExporting}
              className="py-2 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Word
                </>
              )}
            </button>
          </div>
        </div>

        {/* Message de statut */}
        {saveStatus.type && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            {saveStatus.message}
          </div>
        )}
      </div>

      {/* SECTION: Procédure */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          Procédure
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Numéro de procédure (5 chiffres) *
            </label>
            <input
              type="text"
              value={formData.numeroProcedure}
              onChange={(e) => setFormData({ ...formData, numeroProcedure: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="25006_AOO_TMA-EPM_LAY"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Les données de la procédure seront chargées automatiquement
            </p>
          </div>
        </div>
      </div>

      {/* SECTION A: Pouvoir adjudicateur */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          A - Identification du pouvoir adjudicateur ou de l'entité adjudicatrice
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
          (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              AFPA
            </label>
            <input
              type="text"
              value={formData.pouvoirAdjudicateur.nom}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pouvoirAdjudicateur: { ...formData.pouvoirAdjudicateur, nom: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.pouvoirAdjudicateur.adresseVoie}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pouvoirAdjudicateur: { ...formData.pouvoirAdjudicateur, adresseVoie: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code postal
              </label>
              <input
                type="text"
                value={formData.pouvoirAdjudicateur.codePostal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pouvoirAdjudicateur: { ...formData.pouvoirAdjudicateur, codePostal: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={formData.pouvoirAdjudicateur.ville}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pouvoirAdjudicateur: { ...formData.pouvoirAdjudicateur, ville: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: Objet de la consultation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          B - Objet de la consultation
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
          (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Objet de la consultation *
          </label>
          <textarea
            value={formData.objetConsultation}
            onChange={(e) => setFormData({ ...formData, objetConsultation: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
            placeholder="Exemple : Prestations de Tierce Maintenance Applicative (TMA) de l'EPM"
          />
        </div>
      </div>

      {/* SECTION C: Attributaire */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          C - Identification de l'attributaire
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
          [Indiquer le nom commercial et la dénomination sociale de l'attributaire individuel ou de chaque membre du groupement d'entreprises attributaire, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de groupement d'entreprises attributaire, identifier précisément le mandataire du groupement.]
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entreprise *
            </label>
            <input
              type="text"
              value={formData.attributaire.denomination}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributaire: { ...formData.attributaire, denomination: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
              placeholder="Raison sociale"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse 1 *
            </label>
            <input
              type="text"
              value={formData.attributaire.adresse1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributaire: { ...formData.attributaire, adresse1: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Adresse 2
            </label>
            <input
              type="text"
              value={formData.attributaire.adresse2}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributaire: { ...formData.attributaire, adresse2: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Code postal *
              </label>
              <input
                type="text"
                value={formData.attributaire.codePostal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributaire: { ...formData.attributaire, codePostal: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ville *
              </label>
              <input
                type="text"
                value={formData.attributaire.ville}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributaire: { ...formData.attributaire, ville: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              SIRET *
            </label>
            <input
              type="text"
              value={formData.attributaire.siret}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributaire: { ...formData.attributaire, siret: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
              placeholder="14 chiffres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.attributaire.email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attributaire: { ...formData.attributaire, email: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.attributaire.telephone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributaire: { ...formData.attributaire, telephone: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fax
              </label>
              <input
                type="tel"
                value={formData.attributaire.fax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attributaire: { ...formData.attributaire, fax: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D: Notification */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          D - Notification de l'attribution
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Je vous informe que l'offre que vous avez faite au titre de la consultation désignée ci-dessus a été retenue :
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">
              (Cocher la case correspondante.)
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.notification.type === 'ensemble'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      notification: { ...formData.notification, type: 'ensemble' },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  pour l'ensemble du marché public (en cas de non allotissement).
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.notification.type === 'lots'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      notification: { ...formData.notification, type: 'lots' },
                    })
                  }
                  className="w-4 h-4 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    pour le(s) lot(s) n° de la procédure de passation du marché public ou de l'accord cadre (en cas d'allotissement.) :
                  </span>
                  
                  {formData.notification.type === 'lots' && (
                    <div className="mt-2 space-y-2">
                      {formData.notification.lots.map((lot, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="N°"
                            value={lot.numero}
                            onChange={(e) => updateLot(index, 'numero', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Intitulé du lot"
                            value={lot.intitule}
                            onChange={(e) => updateLot(index, 'intitule', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeLot(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addLot}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        + Ajouter un lot
                      </button>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              L'exécution des prestations commencera :
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">
              (Cocher la case correspondante.)
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.executionPrestations.type === 'immediate'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      executionPrestations: { type: 'immediate' },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  dès réception de la présente notification.
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.executionPrestations.type === 'sur_commande'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      executionPrestations: { type: 'sur_commande' },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  à réception d'un bon de commande ou d'un ordre de service que j'émettrai ultérieurement.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION E: Garanties */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          E - Retenue de garantie ou garantie à première demande
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
          (En cas d'allotissement, cette rubrique est à renseigner pour chacun des lots de la procédure de passation du marché public ou de l'accord-cadre qui est notifié. Préciser pour chaque lot, son numéro et son intitulé tels qu'ils figurent dans les documents de la consultation.)
        </p>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Le marché public qui vous est notifié comporte :
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">
            (Cocher la ou les cases correspondantes.)
          </p>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.garanties.aucuneGarantie}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  garanties: { ...formData.garanties, aucuneGarantie: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              aucune retenue de garantie ou garantie à première demande.
            </span>
          </label>

          <div className="space-y-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.garanties.retenue.active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    garanties: {
                      ...formData.garanties,
                      retenue: { ...formData.garanties.retenue, active: e.target.checked },
                    },
                  })
                }
                className="w-4 h-4 mt-0.5"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  une retenue de garantie d'un montant de
                </span>
                <input
                  type="number"
                  value={formData.garanties.retenue.pourcentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      garanties: {
                        ...formData.garanties,
                        retenue: { ...formData.garanties.retenue, pourcentage: Number(e.target.value) },
                      },
                    })
                  }
                  className="mx-2 w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  % du montant initial du marché public ou de l'accord-cadre, que vous pouvez remplacer par :
                </span>

                <div className="ml-6 mt-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.garanties.retenue.remplacablePar.garantiePremieredemande}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          garanties: {
                            ...formData.garanties,
                            retenue: {
                              ...formData.garanties.retenue,
                              remplacablePar: {
                                ...formData.garanties.retenue.remplacablePar,
                                garantiePremieredemande: e.target.checked,
                              },
                            },
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      une garantie à première demande.
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.garanties.retenue.remplacablePar.cautionPersonnelle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          garanties: {
                            ...formData.garanties,
                            retenue: {
                              ...formData.garanties.retenue,
                              remplacablePar: {
                                ...formData.garanties.retenue.remplacablePar,
                                cautionPersonnelle: e.target.checked,
                              },
                            },
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      une caution personnelle et solidaire.
                    </span>
                  </label>
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.garanties.garantieAvanceSuperieure30}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    garanties: { ...formData.garanties, garantieAvanceSuperieure30: e.target.checked },
                  })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                une garantie à première demande en garantie du remboursement d'une avance supérieure à 30%. Vous ne pourrez recevoir cette avance qu'après avoir constitué cette garantie.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.garanties.garantieAvanceInferieure30.active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    garanties: {
                      ...formData.garanties,
                      garantieAvanceInferieure30: {
                        ...formData.garanties.garantieAvanceInferieure30,
                        active: e.target.checked,
                      },
                    },
                  })
                }
                className="w-4 h-4 mt-0.5"
              />
              <div className="flex-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  (pour les collectivités territoriales uniquement.) une garantie à première demande en garantie du remboursement de toute ou partie d'une avance inférieure ou égale à 30%.
                </span>
                <div className="ml-6 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.garanties.garantieAvanceInferieure30.remplacableParCaution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          garanties: {
                            ...formData.garanties,
                            garantieAvanceInferieure30: {
                              ...formData.garanties.garantieAvanceInferieure30,
                              remplacableParCaution: e.target.checked,
                            },
                          },
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      vous pouvez remplacer cette garantie à première demande par une caution personnelle et solidaire.
                    </span>
                  </label>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION F: Pièces jointes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          F - Pièces jointes à la présente notification
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">
          (En cas d'allotissement, cette rubrique est à renseigner pour chacun des lots de la procédure de passation du marché public ou de l'accord-cadre qui est notifié. Préciser pour chaque lot, son numéro et son intitulé tels qu'ils figurent dans les documents de la consultation.)
        </p>

        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Vous trouverez ci-joints :
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">
            (Cocher la case correspondante.)
          </p>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.piecesJointes.actEngagementPapier}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  piecesJointes: { ...formData.piecesJointes, actEngagementPapier: e.target.checked },
                })
              }
              className="w-4 h-4 mt-0.5"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              deux photocopies de l'acte d'engagement avec ses annexes, dont l'une est revêtue de la formule dite « d'exemplaire unique ». Cet exemplaire est destiné à être remis à l'établissement de crédit en cas de cession ou de nantissement de toute ou partie de votre créance. J'attire votre attention sur le fait qu'il n'est pas possible, en cas de perte, de délivrer un duplicata de l'exemplaire unique.
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.piecesJointes.actEngagementPDF}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  piecesJointes: { ...formData.piecesJointes, actEngagementPDF: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              une copie au format électronique Adobe PDF de l'acte d'engagement.
            </span>
          </label>
        </div>
      </div>

      {/* SECTION G: Signature */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          G - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                À (lieu)
              </label>
              <input
                type="text"
                value={formData.signature.lieu}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signature: { ...formData.signature, lieu: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                le (date)
              </label>
              <input
                type="text"
                value={formData.signature.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signature: { ...formData.signature, date: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="jj/mm/aaaa"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Signature
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-2">
              (représentant du pouvoir adjudicateur ou de l'entité adjudicatrice habilité à signer le marché public)
            </p>
            <input
              type="text"
              value={formData.signature.signataireTitre}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  signature: { ...formData.signature, signataireTitre: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-2"
              placeholder="Titre du signataire (ex: Direction Nationale des Achats)"
            />
            <input
              type="text"
              value={formData.signature.signataireNom}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  signature: { ...formData.signature, signataireNom: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Nom du signataire"
            />
          </div>
        </div>
      </div>

      {/* SECTION H: Notification (Accusé de réception) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-lg">
          H - Notification du marché public au titulaire
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          Cette rubrique comprend tous les éléments relatifs à la réception de la notification du marché public, que cette notification soit remise contre récépissé, ou qu'elle soit transmise par courrier (lettre recommandée avec accusé de réception) ou par voie électronique (profil d'acheteur).
        </p>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            ℹ️ Information
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            La date d'effet du marché public court à compter de la réception de cette notification par l'attributaire, qui devient alors le titulaire du marché public et responsable de sa bonne exécution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NOTI5Section;
