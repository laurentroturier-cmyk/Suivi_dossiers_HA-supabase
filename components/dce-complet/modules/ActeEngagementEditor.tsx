// ============================================
// ACTE D'ENGAGEMENT EDITOR (ATTRI1)
// Éditeur visuel du formulaire officiel
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Eye, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2,
  FileText,
  CheckSquare,
  Building2,
  CreditCard,
  Clock,
  PenTool,
  User,
  FileDown
} from 'lucide-react';
import { generateActeEngagementWord } from '../services/acteEngagementGenerator';
import type { 
  ActeEngagementATTRI1Data, 
  MembreGroupement, 
  CompteBancaire,
  SignataireTitulaire,
  PrestationGroupement
} from '../types/acteEngagement';
import { createDefaultActeEngagementATTRI1, CCAG_OPTIONS } from '../types/acteEngagement';

interface Props {
  data?: ActeEngagementATTRI1Data;
  onSave: (data: ActeEngagementATTRI1Data) => Promise<void> | void;
  isSaving?: boolean;
  numeroProcedure?: string;
  numeroLot?: number;
}

// ============================================
// COMPOSANTS UI RÉUTILISABLES (en dehors du composant principal)
// ============================================

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'date' | 'number' | 'email' | 'tel';
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  className = ''
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  </div>
);

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 3,
  className = ''
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  description
}) => (
  <label className="flex items-start gap-3 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
    <div>
      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
  </label>
);

interface RadioGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  name
}) => (
  <div>
    <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
    <div className="space-y-2">
      {options.map(option => (
        <label key={option.value} className="flex items-start gap-3 cursor-pointer group">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={e => onChange(e.target.value)}
            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
);

type ViewMode = 'edit' | 'preview';
type SectionKey = 'objet' | 'titulaire' | 'prix' | 'groupement' | 'compte' | 'avance' | 'duree' | 'signatureC1' | 'signatureC2' | 'acheteur';

export function ActeEngagementEditor({ 
  data, 
  onSave, 
  isSaving = false,
  numeroProcedure = '',
  numeroLot = 1
}: Props) {
  const [form, setForm] = useState<ActeEngagementATTRI1Data>(
    data || createDefaultActeEngagementATTRI1()
  );
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    objet: true,
    titulaire: true,
    prix: false,
    groupement: false,
    compte: false,
    avance: false,
    duree: false,
    signatureC1: false,
    signatureC2: false,
    acheteur: false,
  });

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  // ============================================
  // HELPERS
  // ============================================

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateForm = <K extends keyof ActeEngagementATTRI1Data>(
    key: K,
    value: ActeEngagementATTRI1Data[K] | ((prev: ActeEngagementATTRI1Data[K]) => ActeEngagementATTRI1Data[K])
  ) => {
    setForm(prev => ({
      ...prev,
      [key]: typeof value === 'function' 
        ? (value as (prev: ActeEngagementATTRI1Data[K]) => ActeEngagementATTRI1Data[K])(prev[key])
        : value
    }));
  };

  const handleSave = () => onSave(form);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportWord = async () => {
    try {
      setIsExporting(true);
      await generateActeEngagementWord(form, numeroProcedure, numeroLot);
    } catch (error) {
      console.error('Erreur lors de l\'export Word:', error);
      alert('Une erreur est survenue lors de l\'export Word');
    } finally {
      setIsExporting(false);
    }
  };

  // Générateur d'ID unique
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // ============================================
  // GESTION DES LISTES DYNAMIQUES
  // ============================================

  const addMembreGroupement = () => {
    const newMembre: MembreGroupement = {
      id: generateId(),
      nomCommercial: '',
      denominationSociale: '',
      adresseAgence: '',
      villeAgence: '',
      telephoneAgence: '',
      siretAgence: '',
      adresseSiege: '',
      villeSiege: '',
      telephoneSiege: '',
      siretSiege: '',
    };
    updateForm('membresGroupement', [...form.membresGroupement, newMembre]);
  };

  const removeMembreGroupement = (id: string) => {
    updateForm('membresGroupement', form.membresGroupement.filter(m => m.id !== id));
  };

  const updateMembreGroupement = (id: string, field: keyof MembreGroupement, value: string) => {
    updateForm('membresGroupement', form.membresGroupement.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const addCompteBancaire = () => {
    const newCompte: CompteBancaire = {
      id: generateId(),
      nomEtablissement: '',
      codeEtablissement: '',
      numeroCompte: '',
      iban: '',
      bic: '',
    };
    updateForm('comptesBancaires', [...form.comptesBancaires, newCompte]);
  };

  const removeCompteBancaire = (id: string) => {
    if (form.comptesBancaires.length <= 1) return;
    updateForm('comptesBancaires', form.comptesBancaires.filter(c => c.id !== id));
  };

  const updateCompteBancaire = (id: string, field: keyof CompteBancaire, value: string) => {
    updateForm('comptesBancaires', form.comptesBancaires.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addPrestationGroupement = () => {
    const newPrestation: PrestationGroupement = {
      membreId: generateId(),
      designationMembre: '',
      naturePrestations: '',
      montantHT: '',
    };
    updateForm('groupement', {
      ...form.groupement,
      repartitionPrestations: [...form.groupement.repartitionPrestations, newPrestation]
    });
  };

  const removePrestationGroupement = (membreId: string) => {
    updateForm('groupement', {
      ...form.groupement,
      repartitionPrestations: form.groupement.repartitionPrestations.filter(p => p.membreId !== membreId)
    });
  };

  const updatePrestationGroupement = (membreId: string, field: keyof PrestationGroupement, value: string) => {
    updateForm('groupement', {
      ...form.groupement,
      repartitionPrestations: form.groupement.repartitionPrestations.map(p =>
        p.membreId === membreId ? { ...p, [field]: value } : p
      )
    });
  };

  const addSignataireGroupement = () => {
    const newSignataire: SignataireTitulaire = {
      nomPrenom: '',
      qualite: '',
      lieuSignature: '',
      dateSignature: '',
      signatureElectronique: true,
    };
    updateForm('mandataireGroupement', {
      ...form.mandataireGroupement,
      signataires: [...form.mandataireGroupement.signataires, newSignataire]
    });
  };

  const removeSignataireGroupement = (index: number) => {
    updateForm('mandataireGroupement', {
      ...form.mandataireGroupement,
      signataires: form.mandataireGroupement.signataires.filter((_, i) => i !== index)
    });
  };

  const updateSignataireGroupement = (index: number, field: keyof SignataireTitulaire, value: string | boolean) => {
    updateForm('mandataireGroupement', {
      ...form.mandataireGroupement,
      signataires: form.mandataireGroupement.signataires.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    });
  };

  // ============================================
  // COMPOSANTS UI
  // ============================================

  const SectionHeader = ({ 
    title, 
    section, 
    icon: Icon,
    subtitle 
  }: { 
    title: string; 
    section: SectionKey; 
    icon: React.ElementType;
    subtitle?: string;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-colors border border-blue-100"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <Icon className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-gray-500" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-500" />
      )}
    </button>
  );

  // ============================================
  // MODE PRÉVISUALISATION
  // ============================================

  const renderPreview = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {/* En-tête officiel */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-75">Ministère de l'Économie et des Finances</p>
            <p className="text-xs opacity-75">Direction des Affaires Juridiques</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">ATTRI1</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold mt-4">MARCHÉS PUBLICS</h1>
        <h2 className="text-xl">ACTE D'ENGAGEMENT</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Section A */}
        <section className="border-l-4 border-blue-500 pl-4">
          <h3 className="text-lg font-bold text-blue-800 mb-3">A - Objet de l'acte d'engagement</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Objet du marché public :</strong> {form.objet.objetMarche || '(Non renseigné)'}</p>
            <p><strong>N° de référence :</strong> {form.objet.numeroReference || numeroProcedure}</p>
            
            <div className="mt-3">
              <p className="font-medium">Cet acte d'engagement correspond :</p>
              <ul className="ml-4 mt-1 space-y-1">
                {form.objet.typeActe.ensembleMarche && (
                  <li>☑ à l'ensemble du marché public (en cas de non allotissement)</li>
                )}
                {form.objet.typeActe.lotSpecifique && (
                  <li>☑ au lot n°{form.objet.typeActe.numeroLot || numeroLot} - {form.objet.typeActe.intituleLot || '(Intitulé du lot)'}</li>
                )}
                {form.objet.typeOffre.offreBase && <li>☑ à l'offre de base</li>}
                {form.objet.typeOffre.variante && (
                  <li>☑ à la variante suivante : {form.objet.typeOffre.descriptionVariante}</li>
                )}
                {form.objet.prestationsSupplementaires.avecPrestations && (
                  <li>☑ avec les prestations supplémentaires : {form.objet.prestationsSupplementaires.description}</li>
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Section B */}
        <section className="border-l-4 border-green-500 pl-4">
          <h3 className="text-lg font-bold text-green-800 mb-3">B - Engagement du titulaire ou du groupement titulaire</h3>
          
          {/* B1 */}
          <div className="mb-4">
            <h4 className="font-semibold text-green-700">B1 - Identification et engagement du titulaire</h4>
            <p className="text-sm mt-2">Après avoir pris connaissance des pièces constitutives du marché public suivantes :</p>
            <ul className="text-sm ml-4 mt-1 space-y-1">
              {form.piecesConstitutives.ccatp && <li>☑ CCATP n° {form.piecesConstitutives.ccatpNumero}</li>}
              {form.piecesConstitutives.ccagFCS && <li>☑ CCAG de Fournitures Courantes et de Services</li>}
              {form.piecesConstitutives.ccagTravaux && <li>☑ CCAG de Travaux</li>}
              {form.piecesConstitutives.ccagPI && <li>☑ CCAG de Prestations Intellectuelles</li>}
              {form.piecesConstitutives.cctp && <li>☑ CCTP n° {form.piecesConstitutives.cctpNumero}</li>}
              {form.piecesConstitutives.autres && <li>☑ Autres : {form.piecesConstitutives.autresDescription}</li>}
            </ul>
            
            <p className="text-sm mt-3">
              <strong>Le signataire</strong> {form.titulaire.civilite} {form.titulaire.nomPrenom || '(Non renseigné)'}
            </p>
            
            {form.titulaire.typeEngagement === 'societe' && (
              <div className="text-sm mt-2 p-3 bg-gray-50 rounded">
                <p><strong>engage la société</strong> {form.titulaire.nomCommercial || form.titulaire.denominationSociale || '(Non renseigné)'}</p>
                <p className="mt-1"><strong>Adresse :</strong> {form.titulaire.adresseEtablissement || '(Non renseigné)'}</p>
                <p><strong>SIRET :</strong> {form.titulaire.siret || '(Non renseigné)'}</p>
                <p><strong>Tél :</strong> {form.titulaire.telephone || '(Non renseigné)'}</p>
              </div>
            )}
          </div>

          {/* B3 */}
          <div className="mb-4">
            <h4 className="font-semibold text-green-700">B3 - Compte(s) à créditer</h4>
            {form.comptesBancaires.map((compte, i) => (
              <div key={compte.id} className="text-sm mt-2 p-3 bg-gray-50 rounded">
                <p><strong>Établissement bancaire :</strong> {compte.nomEtablissement || '(Non renseigné)'} ({compte.codeEtablissement})</p>
                <p><strong>N° de compte :</strong> {compte.numeroCompte || '(Non renseigné)'}</p>
                {compte.iban && <p><strong>IBAN :</strong> {compte.iban}</p>}
              </div>
            ))}
          </div>

          {/* B4 */}
          <div className="mb-4">
            <h4 className="font-semibold text-green-700">B4 - Avance</h4>
            <p className="text-sm mt-1">
              Je renonce au bénéfice de l'avance : {form.avance.renonceBenefice ? '☑ Oui' : '☑ Non'}
            </p>
          </div>

          {/* B5 */}
          <div className="mb-4">
            <h4 className="font-semibold text-green-700">B5 - Durée d'exécution du marché public</h4>
            <p className="text-sm mt-1">
              La durée d'exécution est de <strong>{form.dureeExecution.dureeEnMois}</strong> mois à compter de :
            </p>
            <ul className="text-sm ml-4 mt-1">
              {form.dureeExecution.pointDepart === 'notification' && <li>☑ la date de notification du marché public</li>}
              {form.dureeExecution.pointDepart === 'ordre-service' && <li>☑ la date de notification de l'ordre de service</li>}
              {form.dureeExecution.pointDepart === 'date-execution' && <li>☑ la date de début d'exécution prévue</li>}
            </ul>
            <p className="text-sm mt-2">
              Le marché public est reconductible : {form.dureeExecution.estReconductible ? '☑ Oui' : '☑ Non'}
            </p>
            {form.dureeExecution.estReconductible && (
              <p className="text-sm ml-4">
                Nombre : {form.dureeExecution.nombreReconductions} | Durée : {form.dureeExecution.dureeReconductions}
              </p>
            )}
          </div>
        </section>

        {/* Section C */}
        <section className="border-l-4 border-orange-500 pl-4">
          <h3 className="text-lg font-bold text-orange-800 mb-3">C - Signature du marché public</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-orange-50">
                  <th className="border border-gray-300 p-2 text-left">Nom, prénom et qualité du signataire</th>
                  <th className="border border-gray-300 p-2 text-left">Lieu et date de signature</th>
                  <th className="border border-gray-300 p-2 text-left">Signature</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">
                    {form.signatureTitulaire.nomPrenom || '(Non renseigné)'}<br />
                    <span className="text-gray-500">{form.signatureTitulaire.qualite}</span>
                  </td>
                  <td className="border border-gray-300 p-2">
                    A {form.signatureTitulaire.lieuSignature || '(Lieu)'}<br />
                    Le {form.signatureTitulaire.dateSignature || '(Date)'}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {form.signatureTitulaire.signatureElectronique ? 'électronique' : '(Signature)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section D */}
        <section className="border-l-4 border-purple-500 pl-4">
          <h3 className="text-lg font-bold text-purple-800 mb-3">D - Identification et signature de l'acheteur</h3>
          <div className="text-sm space-y-2">
            <p><strong>Désignation de l'acheteur :</strong> {form.acheteur.designation || '(Non renseigné)'}</p>
            <p><strong>Signataire :</strong> {form.acheteur.signataire.civilite} {form.acheteur.signataire.nomPrenom} - {form.acheteur.signataire.qualite}</p>
            <p><strong>A :</strong> {form.acheteur.lieuSignature}, le {form.acheteur.dateSignature || '...'}</p>
          </div>
        </section>
      </div>

      {/* Pied de page */}
      <div className="bg-gray-100 px-6 py-3 text-xs text-gray-500 flex justify-between">
        <span>ATTRI1 – Acte d'engagement</span>
        <span>N° {form.objet.numeroReference || numeroProcedure} Lot {form.objet.typeActe.numeroLot || numeroLot}</span>
        <span>Version code de la commande publique - 2019</span>
      </div>
    </div>
  );

  // ============================================
  // MODE ÉDITION
  // ============================================

  const renderEditForm = () => (
    <div className="space-y-4">
      {/* SECTION A - OBJET */}
      <div>
        <SectionHeader 
          title="A - Objet de l'acte d'engagement" 
          section="objet" 
          icon={FileText}
          subtitle="Objet du marché public et références"
        />
        {expandedSections.objet && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <TextArea
              label="Objet du marché public"
              value={form.objet.objetMarche}
              onChange={v => updateForm('objet', prev => ({ ...prev, objetMarche: v }))}
              placeholder="Reprendre le contenu de la mention figurant dans l'avis d'appel à la concurrence..."
              rows={3}
            />
            
            <FormField
              label="N° de référence du marché"
              value={form.objet.numeroReference}
              onChange={v => updateForm('objet', prev => ({ ...prev, numeroReference: v }))}
              placeholder={numeroProcedure || "Ex: 23274/AOO/ACCESSOIRES INF/KFI"}
            />

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Cet acte d'engagement correspond :</p>
              
              <div className="space-y-3">
                <Checkbox
                  label="à l'ensemble du marché public (en cas de non allotissement)"
                  checked={form.objet.typeActe.ensembleMarche}
                  onChange={checked => updateForm('objet', prev => ({
                    ...prev,
                    typeActe: { ...prev.typeActe, ensembleMarche: checked, lotSpecifique: !checked }
                  }))}
                />
                
                <div className="flex items-start gap-3">
                  <Checkbox
                    label="au lot n°"
                    checked={form.objet.typeActe.lotSpecifique}
                    onChange={checked => updateForm('objet', prev => ({
                      ...prev,
                      typeActe: { ...prev.typeActe, lotSpecifique: checked, ensembleMarche: !checked }
                    }))}
                  />
                  {form.objet.typeActe.lotSpecifique && (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={form.objet.typeActe.numeroLot}
                        onChange={e => updateForm('objet', prev => ({
                          ...prev,
                          typeActe: { ...prev.typeActe, numeroLot: e.target.value }
                        }))}
                        placeholder={String(numeroLot)}
                        className="w-16 border rounded px-2 py-1 text-sm"
                      />
                      <input
                        type="text"
                        value={form.objet.typeActe.intituleLot}
                        onChange={e => updateForm('objet', prev => ({
                          ...prev,
                          typeActe: { ...prev.typeActe, intituleLot: e.target.value }
                        }))}
                        placeholder="Intitulé du lot"
                        className="flex-1 border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <Checkbox
                  label="à l'offre de base"
                  checked={form.objet.typeOffre.offreBase}
                  onChange={checked => updateForm('objet', prev => ({
                    ...prev,
                    typeOffre: { ...prev.typeOffre, offreBase: checked }
                  }))}
                />
                
                <div className="flex items-start gap-3">
                  <Checkbox
                    label="à la variante suivante :"
                    checked={form.objet.typeOffre.variante}
                    onChange={checked => updateForm('objet', prev => ({
                      ...prev,
                      typeOffre: { ...prev.typeOffre, variante: checked }
                    }))}
                  />
                  {form.objet.typeOffre.variante && (
                    <input
                      type="text"
                      value={form.objet.typeOffre.descriptionVariante}
                      onChange={e => updateForm('objet', prev => ({
                        ...prev,
                        typeOffre: { ...prev.typeOffre, descriptionVariante: e.target.value }
                      }))}
                      placeholder="Description de la variante"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    label="avec les prestations supplémentaires suivantes :"
                    checked={form.objet.prestationsSupplementaires.avecPrestations}
                    onChange={checked => updateForm('objet', prev => ({
                      ...prev,
                      prestationsSupplementaires: { ...prev.prestationsSupplementaires, avecPrestations: checked }
                    }))}
                  />
                  {form.objet.prestationsSupplementaires.avecPrestations && (
                    <input
                      type="text"
                      value={form.objet.prestationsSupplementaires.description}
                      onChange={e => updateForm('objet', prev => ({
                        ...prev,
                        prestationsSupplementaires: { ...prev.prestationsSupplementaires, description: e.target.value }
                      }))}
                      placeholder="Description des prestations"
                      className="flex-1 border rounded px-2 py-1 text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B1 - TITULAIRE */}
      <div>
        <SectionHeader 
          title="B1 - Identification et engagement du titulaire" 
          section="titulaire" 
          icon={Building2}
          subtitle="Pièces constitutives et identification"
        />
        {expandedSections.titulaire && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            {/* Pièces constitutives */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Après avoir pris connaissance des pièces constitutives du marché public suivantes :
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="CCATP n°"
                    checked={form.piecesConstitutives.ccatp}
                    onChange={checked => updateForm('piecesConstitutives', {
                      ...form.piecesConstitutives, ccatp: checked
                    })}
                  />
                  <input
                    type="text"
                    value={form.piecesConstitutives.ccatpNumero}
                    onChange={e => updateForm('piecesConstitutives', {
                      ...form.piecesConstitutives, ccatpNumero: e.target.value
                    })}
                    placeholder="Numéro CCATP"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    disabled={!form.piecesConstitutives.ccatp}
                  />
                </div>
                
                <Checkbox
                  label="CCAG de Fournitures Courantes et de Services"
                  checked={form.piecesConstitutives.ccagFCS}
                  onChange={checked => updateForm('piecesConstitutives', {
                    ...form.piecesConstitutives, ccagFCS: checked
                  })}
                />
                
                <Checkbox
                  label="CCAG de Travaux"
                  checked={form.piecesConstitutives.ccagTravaux}
                  onChange={checked => updateForm('piecesConstitutives', {
                    ...form.piecesConstitutives, ccagTravaux: checked
                  })}
                />
                
                <Checkbox
                  label="CCAG de Prestations Intellectuelles"
                  checked={form.piecesConstitutives.ccagPI}
                  onChange={checked => updateForm('piecesConstitutives', {
                    ...form.piecesConstitutives, ccagPI: checked
                  })}
                />

                <Checkbox
                  label="CCAG TIC"
                  checked={form.piecesConstitutives.ccagTIC}
                  onChange={checked => updateForm('piecesConstitutives', {
                    ...form.piecesConstitutives, ccagTIC: checked
                  })}
                />

                <Checkbox
                  label="CCAG Maîtrise d'œuvre"
                  checked={form.piecesConstitutives.ccagMOE}
                  onChange={checked => updateForm('piecesConstitutives', {
                    ...form.piecesConstitutives, ccagMOE: checked
                  })}
                />
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    label="CCTP n°"
                    checked={form.piecesConstitutives.cctp}
                    onChange={checked => updateForm('piecesConstitutives', {
                      ...form.piecesConstitutives, cctp: checked
                    })}
                  />
                  <input
                    type="text"
                    value={form.piecesConstitutives.cctpNumero}
                    onChange={e => updateForm('piecesConstitutives', {
                      ...form.piecesConstitutives, cctpNumero: e.target.value
                    })}
                    placeholder="Numéro CCTP"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    disabled={!form.piecesConstitutives.cctp}
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center gap-2">
                  <Checkbox
                    label="Autres :"
                    checked={form.piecesConstitutives.autres}
                    onChange={checked => updateForm('piecesConstitutives', {
                      ...form.piecesConstitutives, autres: checked
                    })}
                  />
                  <input
                    type="text"
                    value={form.piecesConstitutives.autresDescription}
                    onChange={e => updateForm('piecesConstitutives', {
                      ...form.piecesConstitutives, autresDescription: e.target.value
                    })}
                    placeholder="Description des autres pièces"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    disabled={!form.piecesConstitutives.autres}
                  />
                </div>
              </div>
            </div>

            {/* Signataire */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Le signataire :</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civilité</label>
                  <select
                    value={form.titulaire.civilite}
                    onChange={e => updateForm('titulaire', prev => ({ ...prev, civilite: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="M.">Monsieur</option>
                    <option value="Mme">Madame</option>
                  </select>
                </div>
                <FormField
                  label="Nom et prénom"
                  value={form.titulaire.nomPrenom}
                  onChange={v => updateForm('titulaire', prev => ({ ...prev, nomPrenom: v }))}
                  placeholder="Ex: Jean DUPONT"
                  className="md:col-span-2"
                  required
                />
              </div>
            </div>

            {/* Type d'engagement */}
            <div className="border-t pt-4">
              <RadioGroup
                label="Type d'engagement"
                name="typeEngagement"
                value={form.titulaire.typeEngagement}
                onChange={v => updateForm('titulaire', prev => ({ 
                  ...prev, 
                  typeEngagement: v as 'propre-compte' | 'societe' | 'groupement' 
                }))}
                options={[
                  { value: 'propre-compte', label: "s'engage, sur la base de son offre et pour son propre compte" },
                  { value: 'societe', label: 'engage la société ... sur la base de son offre' },
                  { value: 'groupement', label: "l'ensemble des membres du groupement s'engagent, sur la base de l'offre du groupement" },
                ]}
              />
            </div>

            {/* Détails société */}
            {form.titulaire.typeEngagement === 'societe' && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    label="Nom commercial"
                    value={form.titulaire.nomCommercial}
                    onChange={v => updateForm('titulaire', prev => ({ ...prev, nomCommercial: v }))}
                    placeholder="Ex: Ma Société SAS"
                  />
                  <FormField
                    label="Dénomination sociale"
                    value={form.titulaire.denominationSociale}
                    onChange={v => updateForm('titulaire', prev => ({ ...prev, denominationSociale: v }))}
                    placeholder="Dénomination sociale"
                  />
                </div>
                
                <FormField
                  label="Adresse de l'établissement"
                  value={form.titulaire.adresseEtablissement}
                  onChange={v => updateForm('titulaire', prev => ({ ...prev, adresseEtablissement: v }))}
                  placeholder="Ex: 10 rue de l'Exemple – 75001 PARIS"
                />
                
                <FormField
                  label="Adresse du siège social (si différente)"
                  value={form.titulaire.adresseSiegeSocial}
                  onChange={v => updateForm('titulaire', prev => ({ ...prev, adresseSiegeSocial: v }))}
                  placeholder="Ex: 25 avenue du Commerce – 69000 LYON"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    label="Téléphone"
                    value={form.titulaire.telephone}
                    onChange={v => updateForm('titulaire', prev => ({ ...prev, telephone: v }))}
                    placeholder="02 31 46 41 67"
                    type="tel"
                  />
                  <FormField
                    label="Télécopie"
                    value={form.titulaire.telecopie}
                    onChange={v => updateForm('titulaire', prev => ({ ...prev, telecopie: v }))}
                    placeholder="Télécopie"
                    type="tel"
                  />
                  <FormField
                    label="SIRET"
                    value={form.titulaire.siret}
                    onChange={v => updateForm('titulaire', prev => ({ ...prev, siret: v }))}
                    placeholder="Ex: 123 456 789 00012"
                    required
                  />
                </div>
                
                <FormField
                  label="Adresse électronique"
                  value={form.titulaire.adresseElectronique}
                  onChange={v => updateForm('titulaire', prev => ({ ...prev, adresseElectronique: v }))}
                  placeholder="email@entreprise.com"
                  type="email"
                />
              </div>
            )}

            {/* Membres du groupement */}
            {form.titulaire.typeEngagement === 'groupement' && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Membres du groupement</p>
                  <button
                    type="button"
                    onClick={addMembreGroupement}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un membre
                  </button>
                </div>
                
                {form.membresGroupement.map((membre, index) => (
                  <div key={membre.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Membre {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeMembreGroupement(membre.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        label="Nom commercial"
                        value={membre.nomCommercial}
                        onChange={v => updateMembreGroupement(membre.id, 'nomCommercial', v)}
                        placeholder="Nom commercial"
                      />
                      <FormField
                        label="Dénomination sociale"
                        value={membre.denominationSociale}
                        onChange={v => updateMembreGroupement(membre.id, 'denominationSociale', v)}
                        placeholder="Dénomination sociale"
                      />
                      <FormField
                        label="Adresse agence"
                        value={membre.adresseAgence}
                        onChange={v => updateMembreGroupement(membre.id, 'adresseAgence', v)}
                        placeholder="Adresse de l'agence"
                      />
                      <FormField
                        label="SIRET agence"
                        value={membre.siretAgence}
                        onChange={v => updateMembreGroupement(membre.id, 'siretAgence', v)}
                        placeholder="SIRET"
                      />
                      <FormField
                        label="Adresse siège"
                        value={membre.adresseSiege}
                        onChange={v => updateMembreGroupement(membre.id, 'adresseSiege', v)}
                        placeholder="Adresse du siège"
                      />
                      <FormField
                        label="SIRET siège"
                        value={membre.siretSiege}
                        onChange={v => updateMembreGroupement(membre.id, 'siretSiege', v)}
                        placeholder="SIRET siège"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION B2 - GROUPEMENT */}
      <div>
        <SectionHeader 
          title="B2 - Nature du groupement et répartition des prestations" 
          section="groupement" 
          icon={User}
          subtitle="En cas de groupement d'opérateurs économiques"
        />
        {expandedSections.groupement && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <RadioGroup
              label="Pour l'exécution du marché public, le groupement d'opérateurs économiques est :"
              name="typeGroupement"
              value={form.groupement.typeGroupement}
              onChange={v => updateForm('groupement', { 
                ...form.groupement, 
                typeGroupement: v as 'conjoint' | 'solidaire' | '' 
              })}
              options={[
                { value: 'conjoint', label: 'Conjoint' },
                { value: 'solidaire', label: 'Solidaire' },
              ]}
            />

            {form.groupement.typeGroupement === 'conjoint' && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Répartition des prestations (groupement conjoint)
                  </p>
                  <button
                    type="button"
                    onClick={addPrestationGroupement}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left border">Désignation du membre</th>
                        <th className="p-2 text-left border">Nature de la prestation</th>
                        <th className="p-2 text-left border">Montant HT</th>
                        <th className="p-2 border w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.groupement.repartitionPrestations.map(prestation => (
                        <tr key={prestation.membreId}>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={prestation.designationMembre}
                              onChange={e => updatePrestationGroupement(prestation.membreId, 'designationMembre', e.target.value)}
                              className="w-full border-0 px-2 py-1 text-sm"
                              placeholder="Nom du membre"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={prestation.naturePrestations}
                              onChange={e => updatePrestationGroupement(prestation.membreId, 'naturePrestations', e.target.value)}
                              className="w-full border-0 px-2 py-1 text-sm"
                              placeholder="Nature de la prestation"
                            />
                          </td>
                          <td className="border p-1">
                            <input
                              type="text"
                              value={prestation.montantHT}
                              onChange={e => updatePrestationGroupement(prestation.membreId, 'montantHT', e.target.value)}
                              className="w-full border-0 px-2 py-1 text-sm"
                              placeholder="Montant HT"
                            />
                          </td>
                          <td className="border p-1 text-center">
                            <button
                              type="button"
                              onClick={() => removePrestationGroupement(prestation.membreId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION B3 - COMPTE BANCAIRE */}
      <div>
        <SectionHeader 
          title="B3 - Compte(s) à créditer" 
          section="compte" 
          icon={CreditCard}
          subtitle="Informations bancaires"
        />
        {expandedSections.compte && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <p className="text-sm text-gray-600 italic">
              Joindre un ou des relevé(s) d'identité bancaire ou postal.
            </p>
            
            {form.comptesBancaires.map((compte, index) => (
              <div key={compte.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Compte {index + 1}</span>
                  {form.comptesBancaires.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompteBancaire(compte.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    label="Nom de l'établissement bancaire"
                    value={compte.nomEtablissement}
                    onChange={v => updateCompteBancaire(compte.id, 'nomEtablissement', v)}
                    placeholder="Ex: BANQUE XYZ"
                    required
                  />
                  <FormField
                    label="Code établissement"
                    value={compte.codeEtablissement}
                    onChange={v => updateCompteBancaire(compte.id, 'codeEtablissement', v)}
                    placeholder="Ex: 12345"
                  />
                  <FormField
                    label="Numéro de compte"
                    value={compte.numeroCompte}
                    onChange={v => updateCompteBancaire(compte.id, 'numeroCompte', v)}
                    placeholder="Ex: 00000000000"
                    required
                  />
                  <FormField
                    label="IBAN (optionnel)"
                    value={compte.iban || ''}
                    onChange={v => updateCompteBancaire(compte.id, 'iban', v)}
                    placeholder="FR76..."
                  />
                  <FormField
                    label="BIC (optionnel)"
                    value={compte.bic || ''}
                    onChange={v => updateCompteBancaire(compte.id, 'bic', v)}
                    placeholder="SOGEFRPP"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addCompteBancaire}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-4 h-4" />
              Ajouter un compte
            </button>
          </div>
        )}
      </div>

      {/* SECTION B4 - AVANCE */}
      <div>
        <SectionHeader 
          title="B4 - Avance" 
          section="avance" 
          icon={CreditCard}
          subtitle="Article R. 2191-3 ou article R. 2391-1 du code de la commande publique"
        />
        {expandedSections.avance && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-6">
              <p className="text-sm font-medium text-gray-700">Je renonce au bénéfice de l'avance :</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="avance"
                    checked={!form.avance.renonceBenefice}
                    onChange={() => updateForm('avance', { renonceBenefice: false })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Non</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="avance"
                    checked={form.avance.renonceBenefice}
                    onChange={() => updateForm('avance', { renonceBenefice: true })}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm">Oui</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION B5 - DURÉE */}
      <div>
        <SectionHeader 
          title="B5 - Durée d'exécution du marché public" 
          section="duree" 
          icon={Clock}
          subtitle="Durée et reconduction"
        />
        {expandedSections.duree && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm">La durée d'exécution du marché public est de</p>
              <input
                type="number"
                value={form.dureeExecution.dureeEnMois}
                onChange={e => updateForm('dureeExecution', { 
                  ...form.dureeExecution, 
                  dureeEnMois: parseInt(e.target.value) || 0 
                })}
                className="w-20 border rounded px-2 py-1 text-sm text-center"
                min={1}
              />
              <p className="text-sm">mois à compter de :</p>
            </div>

            <div className="space-y-2 ml-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pointDepart"
                  checked={form.dureeExecution.pointDepart === 'notification'}
                  onChange={() => updateForm('dureeExecution', { 
                    ...form.dureeExecution, 
                    pointDepart: 'notification' 
                  })}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm">la date de notification du marché public</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pointDepart"
                  checked={form.dureeExecution.pointDepart === 'ordre-service'}
                  onChange={() => updateForm('dureeExecution', { 
                    ...form.dureeExecution, 
                    pointDepart: 'ordre-service' 
                  })}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm">la date de notification de l'ordre de service</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pointDepart"
                  checked={form.dureeExecution.pointDepart === 'date-execution'}
                  onChange={() => updateForm('dureeExecution', { 
                    ...form.dureeExecution, 
                    pointDepart: 'date-execution' 
                  })}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm">la date de début d'exécution prévue par le marché public</span>
              </label>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-6">
                <p className="text-sm font-medium text-gray-700">Le marché public est reconductible :</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reconductible"
                      checked={!form.dureeExecution.estReconductible}
                      onChange={() => updateForm('dureeExecution', { 
                        ...form.dureeExecution, 
                        estReconductible: false 
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm">Non</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reconductible"
                      checked={form.dureeExecution.estReconductible}
                      onChange={() => updateForm('dureeExecution', { 
                        ...form.dureeExecution, 
                        estReconductible: true 
                      })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm">Oui</span>
                  </label>
                </div>
              </div>
              
              {form.dureeExecution.estReconductible && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  <FormField
                    label="Nombre de reconductions"
                    value={form.dureeExecution.nombreReconductions}
                    onChange={v => updateForm('dureeExecution', { 
                      ...form.dureeExecution, 
                      nombreReconductions: v 
                    })}
                    placeholder="Ex: 3"
                  />
                  <FormField
                    label="Durée des reconductions"
                    value={form.dureeExecution.dureeReconductions}
                    onChange={v => updateForm('dureeExecution', { 
                      ...form.dureeExecution, 
                      dureeReconductions: v 
                    })}
                    placeholder="Ex: 12 mois"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION C1 - SIGNATURE TITULAIRE */}
      <div>
        <SectionHeader 
          title="C1 - Signature du marché public par le titulaire individuel" 
          section="signatureC1" 
          icon={PenTool}
          subtitle="Signature du titulaire"
        />
        {expandedSections.signatureC1 && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                label="Nom, prénom du signataire"
                value={form.signatureTitulaire.nomPrenom}
                onChange={v => updateForm('signatureTitulaire', { 
                  ...form.signatureTitulaire, 
                  nomPrenom: v 
                })}
                placeholder="Ex: DUPONT Jean"
                required
              />
              <FormField
                label="Qualité"
                value={form.signatureTitulaire.qualite}
                onChange={v => updateForm('signatureTitulaire', { 
                  ...form.signatureTitulaire, 
                  qualite: v 
                })}
                placeholder="Ex: Directeur d'Agence"
                required
              />
              <FormField
                label="Lieu de signature"
                value={form.signatureTitulaire.lieuSignature}
                onChange={v => updateForm('signatureTitulaire', { 
                  ...form.signatureTitulaire, 
                  lieuSignature: v 
                })}
                placeholder="Ex: Paris"
              />
              <FormField
                label="Date de signature"
                value={form.signatureTitulaire.dateSignature}
                onChange={v => updateForm('signatureTitulaire', { 
                  ...form.signatureTitulaire, 
                  dateSignature: v 
                })}
                placeholder="Ex: 15 décembre 2023"
                type="date"
              />
            </div>
            
            <Checkbox
              label="Signature électronique"
              checked={form.signatureTitulaire.signatureElectronique}
              onChange={checked => updateForm('signatureTitulaire', { 
                ...form.signatureTitulaire, 
                signatureElectronique: checked 
              })}
              description="Le signataire utilise une signature électronique"
            />
            
            <p className="text-xs text-gray-500 italic">
              (*) Le signataire doit avoir le pouvoir d'engager la personne qu'il représente.
            </p>
          </div>
        )}
      </div>

      {/* SECTION C2 - SIGNATURE GROUPEMENT */}
      <div>
        <SectionHeader 
          title="C2 - Signature du marché public en cas de groupement" 
          section="signatureC2" 
          icon={PenTool}
          subtitle="Mandataire et signatures des membres"
        />
        {expandedSections.signatureC2 && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                label="Nom commercial du mandataire"
                value={form.mandataireGroupement.nomCommercial}
                onChange={v => updateForm('mandataireGroupement', { 
                  ...form.mandataireGroupement, 
                  nomCommercial: v 
                })}
                placeholder="Nom commercial"
              />
              <FormField
                label="Dénomination sociale du mandataire"
                value={form.mandataireGroupement.denominationSociale}
                onChange={v => updateForm('mandataireGroupement', { 
                  ...form.mandataireGroupement, 
                  denominationSociale: v 
                })}
                placeholder="Dénomination sociale"
              />
            </div>

            <div className="border-t pt-4">
              <RadioGroup
                label="En cas de groupement conjoint, le mandataire du groupement est :"
                name="typeMandataire"
                value={form.mandataireGroupement.typeMandataire}
                onChange={v => updateForm('mandataireGroupement', { 
                  ...form.mandataireGroupement, 
                  typeMandataire: v as 'conjoint' | 'solidaire' | '' 
                })}
                options={[
                  { value: 'conjoint', label: 'Conjoint' },
                  { value: 'solidaire', label: 'Solidaire' },
                ]}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Les membres du groupement ont donné mandat au mandataire :
              </p>
              <div className="space-y-2 ml-4">
                <Checkbox
                  label="pour signer le présent acte d'engagement en leur nom et pour leur compte"
                  checked={form.mandataireGroupement.mandats.signerActeEngagement}
                  onChange={checked => updateForm('mandataireGroupement', prev => ({
                    ...prev,
                    mandats: { ...prev.mandats, signerActeEngagement: checked }
                  }))}
                />
                <Checkbox
                  label="pour les représenter vis-à-vis de l'acheteur"
                  checked={form.mandataireGroupement.mandats.representerAcheteur}
                  onChange={checked => updateForm('mandataireGroupement', prev => ({
                    ...prev,
                    mandats: { ...prev.mandats, representerAcheteur: checked }
                  }))}
                />
                <Checkbox
                  label="pour coordonner l'ensemble des prestations"
                  checked={form.mandataireGroupement.mandats.coordonnerPrestations}
                  onChange={checked => updateForm('mandataireGroupement', prev => ({
                    ...prev,
                    mandats: { ...prev.mandats, coordonnerPrestations: checked }
                  }))}
                />
                <Checkbox
                  label="pour signer les modifications ultérieures du marché public"
                  checked={form.mandataireGroupement.mandats.signerModifications}
                  onChange={checked => updateForm('mandataireGroupement', prev => ({
                    ...prev,
                    mandats: { ...prev.mandats, signerModifications: checked }
                  }))}
                />
                <Checkbox
                  label="dans les conditions définies par les pouvoirs joints en annexe"
                  checked={form.mandataireGroupement.mandats.conditionsAnnexe}
                  onChange={checked => updateForm('mandataireGroupement', prev => ({
                    ...prev,
                    mandats: { ...prev.mandats, conditionsAnnexe: checked }
                  }))}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">Signataires du groupement</p>
                <button
                  type="button"
                  onClick={addSignataireGroupement}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un signataire
                </button>
              </div>
              
              {form.mandataireGroupement.signataires.map((signataire, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Signataire {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSignataireGroupement(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      label="Nom, prénom"
                      value={signataire.nomPrenom}
                      onChange={v => updateSignataireGroupement(index, 'nomPrenom', v)}
                      placeholder="Nom et prénom"
                    />
                    <FormField
                      label="Qualité"
                      value={signataire.qualite}
                      onChange={v => updateSignataireGroupement(index, 'qualite', v)}
                      placeholder="Qualité"
                    />
                    <FormField
                      label="Lieu"
                      value={signataire.lieuSignature}
                      onChange={v => updateSignataireGroupement(index, 'lieuSignature', v)}
                      placeholder="Lieu de signature"
                    />
                    <FormField
                      label="Date"
                      value={signataire.dateSignature}
                      onChange={v => updateSignataireGroupement(index, 'dateSignature', v)}
                      type="date"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION D - ACHETEUR */}
      <div>
        <SectionHeader 
          title="D - Identification et signature de l'acheteur" 
          section="acheteur" 
          icon={CheckSquare}
          subtitle="Représentant de l'acheteur"
        />
        {expandedSections.acheteur && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
            <FormField
              label="Désignation de l'acheteur"
              value={form.acheteur.designation}
              onChange={v => updateForm('acheteur', prev => ({ ...prev, designation: v }))}
              placeholder="Ex: AFPA - Agence nationale pour la formation professionnelle des adultes"
            />
            
            <FormField
              label="Référence de l'avis (si publication JOUE ou BOAMP)"
              value={form.acheteur.referenceAvis}
              onChange={v => updateForm('acheteur', prev => ({ ...prev, referenceAvis: v }))}
              placeholder="Référence de l'avis de marché"
            />

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Signataire du marché public</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civilité</label>
                  <select
                    value={form.acheteur.signataire.civilite}
                    onChange={e => updateForm('acheteur', prev => ({
                      ...prev,
                      signataire: { ...prev.signataire, civilite: e.target.value }
                    }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="M.">Monsieur</option>
                    <option value="Mme">Madame</option>
                  </select>
                </div>
                <FormField
                  label="Nom, prénom"
                  value={form.acheteur.signataire.nomPrenom}
                  onChange={v => updateForm('acheteur', prev => ({
                    ...prev,
                    signataire: { ...prev.signataire, nomPrenom: v }
                  }))}
                  placeholder="Ex: Marie MARTIN"
                />
                <FormField
                  label="Qualité"
                  value={form.acheteur.signataire.qualite}
                  onChange={v => updateForm('acheteur', prev => ({
                    ...prev,
                    signataire: { ...prev.signataire, qualite: v }
                  }))}
                  placeholder="Ex: Directrice Générale"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                label="Lieu de signature"
                value={form.acheteur.lieuSignature}
                onChange={v => updateForm('acheteur', prev => ({ ...prev, lieuSignature: v }))}
                placeholder="Ex: Paris"
              />
              <FormField
                label="Date de signature"
                value={form.acheteur.dateSignature}
                onChange={v => updateForm('acheteur', prev => ({ ...prev, dateSignature: v }))}
                type="date"
              />
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Le signataire doit avoir le pouvoir d'engager l'acheteur qu'il représente.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-900">
            Acte d'Engagement (ATTRI1)
          </h2>
          {numeroLot && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              Lot {numeroLot}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle Vue */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
                viewMode === 'edit' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Édition
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
                viewMode === 'preview' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              Aperçu
            </button>
          </div>
          
          {/* Bouton Sauvegarder */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>

          {/* Bouton Export Word */}
          <button
            onClick={handleExportWord}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            title="Exporter au format Word (ATTRI1)"
          >
            <FileDown className="w-4 h-4" />
            {isExporting ? 'Export...' : 'Export Word'}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-5xl mx-auto">
          {viewMode === 'edit' ? renderEditForm() : renderPreview()}
        </div>
      </div>
    </div>
  );
}

export default ActeEngagementEditor;
