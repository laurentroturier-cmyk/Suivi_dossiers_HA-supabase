import React, { useState, useEffect } from 'react';
import { FileText, Download, Save, Loader2, CheckCircle2, XCircle, FolderOpen, Plus, Trash2, Eye } from 'lucide-react';
import { saveNoti1, loadNoti1 } from '../utils/noti1Storage';
import { exportNoti1Html, exportNoti1Pdf } from '../utils/noti1HtmlGenerator';
import { exportNoti1PdfReact } from '../utils/noti1PdfReactExport';
import Noti1Viewer from './Noti1Viewer';
import type { Noti1Data } from '../types/noti1';

interface NOTI1SectionProps {
  initialData?: Partial<Noti1Data>;
}

const NOTI1Section: React.FC<NOTI1SectionProps> = ({ initialData }) => {
  const [formData, setFormData] = useState<Noti1Data>({
    numeroProcedure: '',
    pouvoirAdjudicateur: {
      nom: 'Agence nationale pour la formation professionnelle des adultes',
      adresseVoie: '3, rue Franklin',
      codePostal: '93100',
      ville: 'MONTREUIL',
    },
    objetConsultation: '',
    titulaire: {
      denomination: '',
      adresse1: '',
      adresse2: '',
      codePostal: '',
      ville: '',
      siret: '',
      email: '',
      telephone: '',
      fax: '',
      estMandataire: false,
    },
    attribution: {
      type: 'ensemble',
      lots: [],
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
      date: new Date().toLocaleDateString('fr-FR'),
      signataireTitre: 'Direction Nationale des Achats',
      signataireNom: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Merge initialData avec formData
  useEffect(() => {
    if (initialData) {
      console.log('[NOTI1Section] Données initiales reçues:', initialData);
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        // Pré-remplir automatiquement le numéro de procédure avec les 5 premiers chiffres si disponible
        numeroProcedure:
          initialData.numeroProcedure && initialData.numeroProcedure.length > 5
            ? String(initialData.numeroProcedure).slice(0, 5)
            : initialData.numeroProcedure || prev.numeroProcedure,
        pouvoirAdjudicateur: {
          ...prev.pouvoirAdjudicateur,
          ...(initialData.pouvoirAdjudicateur || {}),
        },
        titulaire: {
          ...prev.titulaire,
          ...(initialData.titulaire || {}),
        },
        attribution: {
          ...prev.attribution,
          ...(initialData.attribution || {}),
        },
        documents: {
          ...prev.documents,
          ...(initialData.documents || {}),
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
      const result = await saveNoti1(formData.numeroProcedure, formData);
      if (result.success) {
        setSaveStatus({ type: 'success', message: 'NOTI1 sauvegardé avec succès' });
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

  const handleExportHtml = async () => {
    setIsExportingHtml(true);
    try {
      await exportNoti1Html(formData);
    } catch (error) {
      console.error('Erreur export HTML:', error);
      alert('Erreur lors de l\'export HTML');
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      // Utilise @react-pdf/renderer pour un PDF de meilleure qualité
      await exportNoti1PdfReact(formData);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleLoad = async () => {
    if (!formData.numeroProcedure) {
      alert('Veuillez saisir un numéro de procédure');
      return;
    }

    const result = await loadNoti1(formData.numeroProcedure);
    if (result.success && result.data) {
      setFormData(result.data);
      setSaveStatus({ type: 'success', message: 'NOTI1 chargé avec succès' });
      setTimeout(() => setSaveStatus({ type: null, message: '' }), 3000);
    } else {
      alert(result.error || 'Aucun NOTI1 trouvé pour cette procédure');
    }
  };

  const addLot = () => {
    setFormData((prev) => ({
      ...prev,
      attribution: {
        ...prev.attribution,
        lots: [...prev.attribution.lots, { numero: '', intitule: '' }],
      },
    }));
  };

  const removeLot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attribution: {
        ...prev.attribution,
        lots: prev.attribution.lots.filter((_, i) => i !== index),
      },
    }));
  };

  const updateLot = (index: number, field: 'numero' | 'intitule', value: string) => {
    setFormData((prev) => ({
      ...prev,
      attribution: {
        ...prev.attribution,
        lots: prev.attribution.lots.map((lot, i) =>
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
              <FileText className="w-7 h-7 text-blue-600" />
              NOTI1 - Information au titulaire pressenti
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Le formulaire NOTI1 peut être utilisé par le pouvoir adjudicateur ou l'entité adjudicatrice pour informer le soumissionnaire auquel il est envisagé d'attribuer le marché public que son offre a été retenue.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Il permet aussi de réclamer au titulaire pressenti l'ensemble des documents prouvant qu'il a satisfait à ses obligations fiscales et sociales et à ses obligations d'assurance décennale s'il y est soumis, dans le délai fixé par l'acheteur.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLoad}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Charger
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Sauvegarder
            </button>

            <button
              onClick={() => setShowViewer(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>

            <button
              onClick={handleExportHtml}
              disabled={isExportingHtml || isExportingPdf}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isExportingHtml ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export HTML
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExportingHtml || isExportingPdf}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>

        {/* Message de statut */}
        {saveStatus.type && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
              saveStatus.type === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>{saveStatus.message}</span>
          </div>
        )}

        {/* Numéro de procédure */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Numéro de procédure *
          </label>
          <input
            type="text"
            value={formData.numeroProcedure}
            onChange={(e) => setFormData({ ...formData, numeroProcedure: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 25006_AOO_TMA-EPM_LAY"
          />
        </div>
      </div>

      {/* Section A - Pouvoir adjudicateur */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          A - Identification du pouvoir adjudicateur ou de l'entité adjudicatrice
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
          (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
        </p>

        <div className="space-y-4">
          <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
            AFPA
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom de l'organisme
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section B - Objet de la consultation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          B - Objet de la consultation
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
          (Reprendre le contenu de la mention figurant dans les documents de la consultation.)
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Objet de la consultation *
            </label>
            <textarea
              value={formData.objetConsultation}
              onChange={(e) => setFormData({ ...formData, objetConsultation: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Prestations de tierce maintenance applicative (TMA) de l'application EPM (Oracle)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numéro de procédure (affiché)
            </label>
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
              {formData.numeroProcedure || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Section C - Titulaire pressenti */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          C - Identification du titulaire pressenti
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4">
          [Indiquer le nom commercial et la dénomination sociale du candidat individuel ou de chaque membre du groupement d'entreprises candidat, les adresses de son établissement et de son siège social (si elle est différente de celle de l'établissement), son adresse électronique, ses numéros de téléphone et de télécopie et son numéro SIRET. En cas de candidature groupée, identifier précisément le mandataire du groupement.]
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dénomination sociale *
            </label>
            <input
              type="text"
              value={formData.titulaire.denomination}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  titulaire: { ...formData.titulaire, denomination: e.target.value },
                })
              }
              className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adresse 1 *
            </label>
            <input
              type="text"
              value={formData.titulaire.adresse1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  titulaire: { ...formData.titulaire, adresse1: e.target.value },
                })
              }
              className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Adresse 2
            </label>
            <input
              type="text"
              value={formData.titulaire.adresse2}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  titulaire: { ...formData.titulaire, adresse2: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code postal *
              </label>
              <input
                type="text"
                value={formData.titulaire.codePostal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, codePostal: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={formData.titulaire.ville}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, ville: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SIRET *
              </label>
              <input
                type="text"
                value={formData.titulaire.siret}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, siret: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.titulaire.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.titulaire.telephone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, telephone: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fax
              </label>
              <input
                type="tel"
                value={formData.titulaire.fax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, fax: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.titulaire.estMandataire}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    titulaire: { ...formData.titulaire, estMandataire: e.target.checked },
                  })
                }
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Est mandataire d'un groupement
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Section D - Attribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          D - Information au titulaire pressenti
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Je vous informe que l'offre que vous avez faite, au titre de la consultation désignée ci-dessus, a été retenue :
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              (Cocher la case correspondante.)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.attribution.type === 'ensemble'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      attribution: { ...formData.attribution, type: 'ensemble' },
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  pour l'ensemble du marché public (en cas de non allotissement).
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.attribution.type === 'lots'}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      attribution: { ...formData.attribution, type: 'lots' },
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  pour le(s) lot(s) n° (voir ci-dessous) de la procédure de passation du marché public (en cas d'allotissement.)
                </span>
              </label>
            </div>
          </div>

          {formData.attribution.type === 'lots' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lots attribués - (Indiquer l'intitulé du ou des lots concernés tel qu'il figure dans les documents de la consultation.)
                </label>
                <button
                  onClick={addLot}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un lot
                </button>
              </div>

              {formData.attribution.lots.map((lot, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={lot.numero}
                    onChange={(e) => updateLot(index, 'numero', e.target.value)}
                    placeholder="N°"
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={lot.intitule}
                    onChange={(e) => updateLot(index, 'intitule', e.target.value)}
                    placeholder="Intitulé du lot"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={() => removeLot(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section E - Délai de transmission */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          E - Délai de transmission, par le titulaire pressenti, des attestations sociales et fiscales et, s'il y est soumis, de l'attestation d'assurance de responsabilité décennale
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pour permettre la signature et la notification du marché public, vous devez me transmettre, avant le {' '}
            <input
              type="date"
              value={formData.documents.dateSignature}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  documents: { ...formData.documents, dateSignature: e.target.value },
                })
              }
              className="inline-block w-40 px-2 py-1 border-2 border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded text-gray-900 dark:text-white"
            />
            , les documents figurant :
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              (Cocher la ou les cases correspondantes.)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documents.candidatFrance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documents: { ...formData.documents, candidatFrance: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">en rubrique F (candidat individuel ou membre du groupement établi en France)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.documents.candidatEtranger}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documents: { ...formData.documents, candidatEtranger: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">en rubrique G (candidat individuel ou membre du groupement établi ou domicilié à l'étranger)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section F - Candidat France */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          F - Candidat individuel ou membre du groupement établi en France
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            Uniquement si les informations permettant d'accéder aux documents de preuve n'ont pas été fournis à l'occasion de la présentation des candidatures ou s'ils n'ont pas déjà été fournis par l'opérateur concerné :
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Les documents à produire sont : (Lister les documents de preuve exigés)
            </label>
            <textarea
              value={formData.documents.documentsPreuve}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  documents: { ...formData.documents, documentsPreuve: e.target.value },
                })
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="• Attestation fiscale\n• Attestation URSSAF\n• ..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Délai pour répondre à la demande (en nombre de jours), à défaut de quoi l'offre sera rejetée :
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  value={formData.documents.delaiReponse}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documents: { ...formData.documents, delaiReponse: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 10"
                />
              </div>
              {formData.documents.delaiReponse && (
                <div className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Date calculée : </span>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {(() => {
                      const today = new Date();
                      const jours = parseInt(formData.documents.delaiReponse) || 0;
                      const dateCalculee = new Date(today);
                      dateCalculee.setDate(today.getDate() + jours);
                      return dateCalculee.toLocaleDateString('fr-FR');
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section G - Candidat étranger */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          G - Candidat individuel ou membre du groupement établi ou domicilié à l'étranger
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">
            Uniquement si les informations permettant d'accéder aux documents de preuve n'ont pas été fournis à l'occasion de la présentation des candidatures ou s'ils n'ont pas déjà été fournis par l'opérateur concerné :
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              (Lister les documents de preuve exigés)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Documents équivalents selon la législation du pays d'établissement..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Délai pour répondre à la demande, à défaut de quoi l'offre sera rejetée :
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="jj/mm/aaaa"
            />
          </div>
        </div>
      </div>

      {/* Section H - Signature */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg mb-4">
          H - Signature du pouvoir adjudicateur ou de l'entité adjudicatrice
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lieu
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.signature.date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    signature: { ...formData.signature, date: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre du signataire
            </label>
            <input
              type="text"
              value={formData.signature.signataireTitre}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  signature: { ...formData.signature, signataireTitre: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Direction Nationale des Achats"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom du signataire
            </label>
            <input
              type="text"
              value={formData.signature.signataireNom}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  signature: { ...formData.signature, signataireNom: e.target.value },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Visionneuse */}
      {showViewer && (
        <Noti1Viewer data={formData} onClose={() => setShowViewer(false)} />
      )}
    </div>
  );
};

export default NOTI1Section;
