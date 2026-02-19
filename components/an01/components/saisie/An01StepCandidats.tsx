/**
 * Étape 3 : Gestion des candidats (par lot)
 * - Recherche dans le registre (ouverture des plis) pour proposer des candidats
 * - Saisie manuelle pour un candidat non présent dans la liste
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button } from '@/components/ui';
import { Trash2, UserPlus, Search } from 'lucide-react';
import type { AN01Lot, AN01Candidate } from '../../types/saisie';
import { createDefaultCandidate } from '../../types/saisie';
import { extractNumProc5, fetchCandidatesFromOuverturePlis } from '../../utils/fetchCandidatesFromRegistre';

interface An01StepCandidatsProps {
  lots: AN01Lot[];
  /** Numéro de consultation (5 chiffres ou référence complète) pour charger le registre */
  consultationNumber?: string;
  onChange: (lots: AN01Lot[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const An01StepCandidats: React.FC<An01StepCandidatsProps> = ({
  lots,
  consultationNumber,
  onChange,
  onBack,
  onNext,
}) => {
  const [selectedLotIndex, setSelectedLotIndex] = useState(0);
  const [registerCandidates, setRegisterCandidates] = useState<string[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSearch, setRegisterSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const currentLot = lots[selectedLotIndex];

  const numProc5 = useMemo(() => extractNumProc5(consultationNumber || ''), [consultationNumber]);

  useEffect(() => {
    if (!numProc5) return;
    setRegisterLoading(true);
    fetchCandidatesFromOuverturePlis(numProc5)
      .then(setRegisterCandidates)
      .catch(() => setRegisterCandidates([]))
      .finally(() => setRegisterLoading(false));
  }, [numProc5]);

  const filteredRegister = useMemo(() => {
    if (!registerSearch.trim()) return registerCandidates.slice(0, 20);
    const strip = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const q = strip(registerSearch);
    return registerCandidates.filter((s) => strip(s).includes(q)).slice(0, 20);
  }, [registerCandidates, registerSearch]);

  const updateLot = (lotIndex: number, updater: (lot: AN01Lot) => AN01Lot) => {
    const next = lots.map((l, i) => (lotIndex === i ? updater(l) : l));
    onChange(next);
  };

  const addCandidate = (companyName?: string) => {
    if (!currentLot) return;
    const newCand = createDefaultCandidate();
    if (companyName != null && companyName.trim()) newCand.company_name = companyName.trim();
    updateLot(selectedLotIndex, (lot) => ({
      ...lot,
      candidates: [...lot.candidates, newCand],
    }));
    setRegisterSearch('');
    setRegisterOpen(false);
  };

  const removeCandidate = (candIndex: number) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => ({
      ...lot,
      candidates: lot.candidates.filter((_, i) => i !== candIndex),
    }));
  };

  const updateCandidate = (candIndex: number, company_name: string) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => {
      const next = [...lot.candidates];
      next[candIndex] = { ...next[candIndex], company_name };
      return { ...lot, candidates: next };
    });
  };

  const alreadyAdded = useMemo(
    () => new Set(currentLot?.candidates.map((c) => c.company_name.trim().toLowerCase()) || []),
    [currentLot?.candidates]
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between pb-2">
        <Button variant="secondary" onClick={onBack}>
          Retour
        </Button>
        <Button variant="primary" onClick={onNext}>
          Suivant : Grille financière
        </Button>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestion des candidats</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Pour chaque lot, saisissez les candidats (raisons sociales). Vous pouvez choisir dans le registre (ouverture des plis) ou saisir un candidat non présent.
      </p>

      {lots.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Lot à éditer</label>
          <select
            value={selectedLotIndex}
            onChange={(e) => setSelectedLotIndex(parseInt(e.target.value, 10))}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
          >
            {lots.map((lot, i) => (
              <option key={lot.id} value={i}>
                {lot.lot_number} - {lot.lot_name || '(sans nom)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentLot && (
        <>
          {/* Recherche dans le registre (ouverture des plis) */}
          {numProc5 && (
            <div className="rounded-xl border-2 border-teal-200 dark:border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/20 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Search className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Rechercher dans le registre (ouverture des plis)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Candidats enregistrés pour la procédure {numProc5}. Choisissez un nom pour l&apos;ajouter au lot.
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={registerSearch}
                  onChange={(e) => {
                    setRegisterSearch(e.target.value);
                    setRegisterOpen(true);
                  }}
                  onFocus={() => setRegisterOpen(true)}
                  onBlur={() => setTimeout(() => setRegisterOpen(false), 200)}
                  placeholder="Rechercher une raison sociale..."
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
                />
                {registerLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Chargement…</span>
                )}
                {registerOpen && (filteredRegister.length > 0 || registerSearch.trim()) && (
                  <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1">
                    {filteredRegister.length === 0 ? (
                      <li className="px-4 py-2 text-sm text-gray-500">Aucun résultat</li>
                    ) : (
                      filteredRegister.map((societe) => {
                        const already = alreadyAdded.has(societe.toLowerCase());
                        return (
                          <li key={societe}>
                            <button
                              type="button"
                              disabled={already}
                              onClick={() => !already && addCandidate(societe)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${already ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900 dark:text-white'}`}
                            >
                              {societe}
                              {already && ' (déjà ajouté)'}
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </div>
              {numProc5 && registerCandidates.length === 0 && !registerLoading && (
                <p className="text-xs text-gray-500">Aucun candidat enregistré pour cette procédure.</p>
              )}
            </div>
          )}

          {/* Saisie manuelle : ajouter un candidat non présent dans la liste */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Candidats pour : {currentLot.lot_number} - {currentLot.lot_name || '(sans nom)'}
            </span>
            <Button
              size="sm"
              variant="primary"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => addCandidate()}
            >
              Ajouter un candidat (saisie libre)
            </Button>
          </div>

          <div className="space-y-3">
            {currentLot.candidates.map((c, i) => (
              <div key={c.id} className="flex gap-2 items-center">
                <Input
                  fullWidth
                  value={c.company_name}
                  onChange={(e) => updateCandidate(i, e.target.value)}
                  placeholder="Raison sociale"
                />
                <Button size="sm" variant="ghost" onClick={() => removeCandidate(i)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {currentLot.candidates.length === 0 && (
            <p className="text-sm text-gray-500">
              Aucun candidat. Utilisez la recherche ci-dessus ou &quot;Ajouter un candidat (saisie libre)&quot;.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default An01StepCandidats;
