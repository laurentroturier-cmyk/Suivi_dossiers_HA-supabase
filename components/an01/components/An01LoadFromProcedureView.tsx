/**
 * Écran de recherche par numéro de procédure (5 chiffres) pour précharger
 * les données DCE (procédure, lots, etc.) avant de lancer le wizard de saisie.
 */

import React, { useState } from 'react';
import { Search, Database, FileEdit, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Input, Button, Card } from '@/components/ui';
import { loadAN01ProjectFromProcedure } from '../utils/loadProjectFromProcedure';
import type { AN01Project } from '../types/saisie';

interface An01LoadFromProcedureViewProps {
  onLoaded: (project: AN01Project) => void;
  onSkip: () => void;
  onBack: () => void;
}

const An01LoadFromProcedureView: React.FC<An01LoadFromProcedureViewProps> = ({ onLoaded, onSkip, onBack }) => {
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLoad = async () => {
    const n = numero.replace(/\D/g, '').slice(0, 5);
    if (n.length !== 5) {
      setError('Saisissez un numéro de procédure à 5 chiffres.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await loadAN01ProjectFromProcedure(n);
      if (result.success && result.project) {
        const totalCandidats = result.project.lots.reduce((s, l) => s + l.candidates.length, 0);
        const hasDQE = totalCandidats > 0 || result.project.lots.some((l) => l.financial_rows.length > 0);
        const msg = hasDQE
          ? `Données chargées : ${result.project.meta.consultation_number} – ${result.project.lots.length} lot(s), ${totalCandidats} candidat(s) et grilles financières (Analyse DQE).`
          : `Données chargées : ${result.project.meta.consultation_number} – ${result.project.lots.length} lot(s).`;
        setSuccess(msg);
        setTimeout(() => onLoaded(result.project!), 400);
      } else {
        setError(result.error || 'Impossible de charger les données.');
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="an01-page min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col">
      <div className="w-full px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-500/20 flex items-center justify-center">
            <Database className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Nouveau projet AN01</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Chargez les données enregistrées : procédure, DCE (lots), et Analyse des offres DQE (candidats, grille financière) si une sauvegarde existe.
          </p>
          </div>
        </div>

        <Card variant="outlined" padding="lg" className="border-2 border-teal-200 dark:border-teal-500/40 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Recherche par numéro de procédure
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Saisissez le numéro à 5 chiffres (Afpa) pour charger la procédure et le DCE associé : lots, acheteur, objet du marché.
          </p>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Ex. 12345"
              value={numero}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 5);
                setNumero(v);
                setError(null);
              }}
              className="font-mono text-lg tracking-widest"
            />
            <Button
              variant="primary"
              onClick={handleLoad}
              loading={loading}
              disabled={loading || numero.length !== 5}
              icon={!loading ? <Search className="w-4 h-4" /> : undefined}
            >
              {loading ? 'Chargement...' : 'Charger'}
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm mb-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button variant="ghost" onClick={onBack}>
            Retour au choix
          </Button>
          <Button
            variant="outline"
            icon={<FileEdit className="w-4 h-4" />}
            onClick={onSkip}
          >
            Commencer sans charger
          </Button>
        </div>
      </div>
    </div>
  );
};

export default An01LoadFromProcedureView;
