import React, { useEffect, useState, useRef } from 'react';
import { Settings2, Download, Upload, Table } from 'lucide-react';
import type { RapportCommissionData } from '../../../redaction/types/rapportCommission';
import { LotsConfigurationModal } from './LotsConfigurationModal';
import { exportLotsToExcel, importLotsFromExcel, type LotExcel } from '../../utils/lotsExcelService';

interface Props {
  data: RapportCommissionData;
  onSave: (data: RapportCommissionData) => Promise<void> | void;
  isSaving?: boolean;
}

const parseList = (value: string): string[] =>
  value
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean);

export function ReglementConsultationForm({ data, onSave, isSaving = false }: Props) {
  const [form, setForm] = useState<RapportCommissionData>(data);
  const [cpvSecondairesText, setCpvSecondairesText] = useState('');
  const [lotsText, setLotsText] = useState('');
  const [sousCriteresText, setSousCriteresText] = useState('');
  const [isLotsModalOpen, setIsLotsModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parser le nombre de lots depuis le formulaire
  const nbLotsValue = parseInt(form.conditions.nbLots) || 0;

  // Parser les lots depuis le textarea
  const getCurrentLots = (): LotExcel[] => {
    return lotsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [numero = '', intitule = '', montantMax = ''] = line.split('|').map(v => v.trim());
        return { numero, intitule, montantMax };
      });
  };

  // Fonction pour mettre à jour les lots (utilisée par modale et import Excel)
  const updateLotsFromArray = (lots: LotExcel[]) => {
    const newLotsText = lots
      .map(l => `${l.numero} | ${l.intitule} | ${l.montantMax}`)
      .join('\n');
    setLotsText(newLotsText);

    // Mettre à jour aussi le nombre de lots si différent
    if (lots.length !== nbLotsValue) {
      setForm(prev => ({
        ...prev,
        conditions: { ...prev.conditions, nbLots: String(lots.length) }
      }));
    }
  };

  // Fonction pour mettre à jour les lots depuis la modale
  const handleLotsFromModal = (lots: Array<{ numero: string; intitule: string; montantMax: string }>) => {
    updateLotsFromArray(lots);
  };

  // Export Excel
  const handleExportExcel = () => {
    const lots = getCurrentLots();
    const procedureNum = form.enTete.numeroProcedure || 'procedure';
    exportLotsToExcel(lots, nbLotsValue, `lots_${procedureNum}`);
  };

  // Import Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      const lots = await importLotsFromExcel(file);
      updateLotsFromArray(lots);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Erreur lors de l\'import');
    }

    // Reset l'input file pour permettre de réimporter le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setForm(data);
    setCpvSecondairesText(
      data.objet.cpvSecondaires
        .map(c => `${c.code} | ${c.libelle}`)
        .join('\n')
    );
    setLotsText(
      data.conditions.lots
        .map(l => `${l.numero} | ${l.intitule} | ${l.montantMax}`)
        .join('\n')
    );
    setSousCriteresText(
      data.jugement.sousCriteresTechniques
        .map(s => `${s.nom} | ${s.points}`)
        .join('\n')
    );
  }, [data]);

  const updateForm = (updater: (prev: RapportCommissionData) => RapportCommissionData) => {
    setForm(prev => updater(prev));
  };

  const handleSave = () => {
    const cpvSecondaires = parseList(cpvSecondairesText).map(line => {
      const [code = '', libelle = ''] = line.split('|').map(v => v.trim());
      return { code, libelle };
    });

    const lots = parseList(lotsText).map(line => {
      const [numero = '', intitule = '', montantMax = ''] = line.split('|').map(v => v.trim());
      return { numero, intitule, montantMax };
    });

    const sousCriteres = parseList(sousCriteresText).map(line => {
      const [nom = '', points = ''] = line.split('|').map(v => v.trim());
      return { nom, points };
    });

    onSave({
      ...form,
      objet: { ...form.objet, cpvSecondaires },
      conditions: { ...form.conditions, lots },
      jugement: { ...form.jugement, sousCriteresTechniques: sousCriteres },
    });
  };

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de procédure</label>
          <input
            value={form.enTete.numeroProcedure}
            onChange={e => updateForm(p => ({ ...p, enTete: { ...p.enTete, numeroProcedure: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="20241"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre du marché</label>
          <input
            value={form.enTete.titreMarche}
            onChange={e => updateForm(p => ({ ...p, enTete: { ...p.enTete, titreMarche: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Objet principal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date limite des offres</label>
          <input
            value={form.enTete.dateLimiteOffres}
            onChange={e => updateForm(p => ({ ...p, enTete: { ...p.enTete, dateLimiteOffres: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heure limite</label>
          <input
            value={form.enTete.heureLimiteOffres}
            onChange={e => updateForm(p => ({ ...p, enTete: { ...p.enTete, heureLimiteOffres: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="17:00"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Acheteur</label>
          <input
            value={form.pouvoirAdjudicateur.nom}
            onChange={e => updateForm(p => ({ ...p, pouvoirAdjudicateur: { ...p.pouvoirAdjudicateur, nom: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Nom de l'acheteur"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
          <input
            value={form.pouvoirAdjudicateur.ville}
            onChange={e => updateForm(p => ({ ...p, pouvoirAdjudicateur: { ...p.pouvoirAdjudicateur, ville: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Ville"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            value={form.pouvoirAdjudicateur.adresseVoie}
            onChange={e => updateForm(p => ({ ...p, pouvoirAdjudicateur: { ...p.pouvoirAdjudicateur, adresseVoie: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Adresse complète"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
          <input
            value={form.pouvoirAdjudicateur.codePostal}
            onChange={e => updateForm(p => ({ ...p, pouvoirAdjudicateur: { ...p.pouvoirAdjudicateur, codePostal: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="75000"
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description du marché</label>
        <textarea
          value={form.objet.description}
          onChange={e => updateForm(p => ({ ...p, objet: { ...p.objet, description: e.target.value } }))}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px]"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPV principal</label>
            <input
              value={form.objet.cpvPrincipal}
              onChange={e => updateForm(p => ({ ...p, objet: { ...p.objet, cpvPrincipal: e.target.value } }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
              placeholder="12345678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Libellé CPV principal</label>
            <input
              value={form.objet.cpvPrincipalLib}
              onChange={e => updateForm(p => ({ ...p, objet: { ...p.objet, cpvPrincipalLib: e.target.value } }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
              placeholder="Services ..."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPV secondaires ("code | libellé" par ligne)</label>
          <textarea
            value={cpvSecondairesText}
            onChange={e => setCpvSecondairesText(e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px] font-mono text-sm"
            placeholder="12345678 | Description"
          />
        </div>
      </section>

      <section className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de passation</label>
            <input
              value={form.conditions.modePassation}
              onChange={e => updateForm(p => ({ ...p, conditions: { ...p.conditions, modePassation: e.target.value } }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
              placeholder="AO ouvert"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de lots</label>
            <input
              value={form.conditions.nbLots}
              onChange={e => updateForm(p => ({ ...p, conditions: { ...p.conditions, nbLots: e.target.value } }))}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
              placeholder="1"
            />
          </div>
        </div>

        {/* Section Lots avec boutons de configuration */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Lots ("numéro | intitulé | montant max" par ligne)
          </label>
          {nbLotsValue > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsLotsModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition shadow-md"
              >
                <Settings2 size={16} />
                Configurer
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition shadow-md"
                title="Exporter les lots vers Excel"
              >
                <Table size={16} />
                Export Excel
              </button>
              <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition cursor-pointer shadow-md">
                <Table size={16} />
                <Upload size={14} />
                Import Excel
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Message d'erreur d'import */}
        {importError && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {importError}
          </div>
        )}

        <textarea
          value={lotsText}
          onChange={e => setLotsText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px] font-mono text-sm"
          placeholder="1 | Lot principal | 50000"
        />

        {/* Modale de configuration des lots */}
        <LotsConfigurationModal
          isOpen={isLotsModalOpen}
          onClose={() => setIsLotsModalOpen(false)}
          lots={lotsText
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              const [numero = '', intitule = '', montantMax = ''] = line.split('|').map(v => v.trim());
              return { numero, intitule, montantMax };
            })}
          nbLots={nbLotsValue}
          onSave={handleLotsFromModal}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forme du marché</label>
          <input
            value={form.typeMarche.forme}
            onChange={e => updateForm(p => ({ ...p, typeMarche: { ...p.typeMarche, forme: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Accord-cadre ..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lieu d'exécution</label>
          <input
            value={form.typeMarche.lieuExecution}
            onChange={e => updateForm(p => ({ ...p, typeMarche: { ...p.typeMarche, lieuExecution: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="Ville / site"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Délai validité des offres (jours)</label>
          <input
            value={form.remise.delaiValiditeOffres}
            onChange={e => updateForm(p => ({ ...p, remise: { ...p.remise, delaiValiditeOffres: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="90"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Critère financier (%)</label>
          <input
            value={form.jugement.critereFinancier}
            onChange={e => updateForm(p => ({ ...p, jugement: { ...p.jugement, critereFinancier: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Critère technique (%)</label>
          <input
            value={form.jugement.critereTechnique}
            onChange={e => updateForm(p => ({ ...p, jugement: { ...p.jugement, critereTechnique: e.target.value } }))}
            className="w-full border rounded-lg px-2 py-1.5 text-sm"
            placeholder="60"
          />
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Sous-critères techniques ("nom | points" par ligne)</label>
        <textarea
          value={sousCriteresText}
          onChange={e => setSousCriteresText(e.target.value)}
          className="w-full border rounded-lg px-2 py-1.5 text-sm min-h-[80px] font-mono text-sm"
          placeholder="Méthodologie | 20"
        />
      </section>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition disabled:opacity-50 shadow-md"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer la section'}
        </button>
      </div>
    </div>
  );
}
