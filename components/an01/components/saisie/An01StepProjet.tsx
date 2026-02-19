/**
 * Étape 1 : Gestion du projet (métadonnées)
 */

import React from 'react';
import { Input, Button } from '@/components/ui';
import type { AN01ProjectMeta } from '../../types/saisie';

interface An01StepProjetProps {
  meta: AN01ProjectMeta;
  onChange: (meta: AN01ProjectMeta) => void;
  onNext: () => void;
}

const An01StepProjet: React.FC<An01StepProjetProps> = ({ meta, onChange, onNext }) => {
  const update = (key: keyof AN01ProjectMeta, value: string | number) => {
    onChange({ ...meta, [key]: value });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-end pb-2">
        <Button onClick={onNext} variant="primary">
          Suivant : Lots
        </Button>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion du projet</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Saisissez les informations générales de la consultation.</p>

      <Input
        label="N° de consultation"
        value={meta.consultation_number}
        onChange={(e) => update('consultation_number', e.target.value)}
        placeholder="ex: 25091_AOO_TX-ENTRET-NAT_LMD"
      />
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Description</label>
        <textarea
          value={meta.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Objet de la consultation..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--accent-green)]"
        />
      </div>
      <Input
        label="Acheteur"
        value={meta.buyer}
        onChange={(e) => update('buyer', e.target.value)}
      />
      <Input
        label="Demandeur"
        value={meta.requester}
        onChange={(e) => update('requester', e.target.value)}
      />
      <Input
        label="Valideur technique (optionnel)"
        value={meta.technical_validator ?? ''}
        onChange={(e) => update('technical_validator', e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Taux de TVA (0-1)"
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={meta.tva_rate}
          onChange={(e) => update('tva_rate', parseFloat(e.target.value) || 0)}
        />
        <Input
          label="Poids financier (%)"
          type="number"
          min={0}
          max={100}
          value={meta.financial_weight}
          onChange={(e) => update('financial_weight', parseInt(e.target.value, 10) || 0)}
          helperText="Le poids technique = 100 - poids financier"
        />
      </div>
      <Input
        label="Nombre de fournisseurs à sélectionner"
        type="number"
        min={1}
        value={meta.selected_suppliers}
        onChange={(e) => update('selected_suppliers', parseInt(e.target.value, 10) || 1)}
      />
    </div>
  );
};

export default An01StepProjet;
