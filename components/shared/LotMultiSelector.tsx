/**
 * LotMultiSelector — sélecteur de lots pour un candidat
 *
 * - Si des lots DCE sont disponibles : cases à cocher multi-sélection
 * - Sinon : saisie manuelle (texte libre, chaque ligne = un lot)
 *
 * value / onChange : chaîne de lots séparés par " / "
 *   ex. "Lot 1 - Prestations IT / Lot 3 - Maintenance"
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, PenLine, CheckSquare } from 'lucide-react';
import type { DCELot } from '../../hooks/useDCELots';

interface LotMultiSelectorProps {
  lots: DCELot[] | null;       // null = pas de DCE → saisie manuelle
  value: string;               // valeur actuelle (séparateur " / ")
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;            // style compact pour le tableau
}

function parseLots(value: string): string[] {
  return value ? value.split(' / ').map(s => s.trim()).filter(Boolean) : [];
}

function joinLots(arr: string[]): string {
  return arr.join(' / ');
}

export function LotMultiSelector({ lots, value, onChange, className = '', compact = false }: LotMultiSelectorProps) {
  const [open, setOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = parseLots(value);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Mode DCE (cases à cocher) ────────────────────────────────────────────
  if (lots && lots.length > 0) {
    const toggleLot = (label: string) => {
      const next = selected.includes(label)
        ? selected.filter(s => s !== label)
        : [...selected, label];
      onChange(joinLots(next));
    };

    const lotLabel = (l: DCELot) =>
      l.intitule
        ? `Lot ${l.numero} - ${l.intitule}`
        : `Lot ${l.numero}`;

    return (
      <div ref={ref} className={`relative ${className}`}>
        {/* Déclencheur */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between gap-1 text-left rounded-lg border bg-white dark:bg-[#252525] transition-colors
            ${compact
              ? 'px-2 py-1 text-xs border-gray-300 dark:border-gray-600 hover:border-[#2F5B58]'
              : 'px-3 py-2 text-sm border-gray-300 dark:border-gray-600 hover:border-[#2F5B58] focus:ring-2 focus:ring-[#2F5B58]'}
            ${open ? 'border-[#2F5B58] ring-2 ring-[#2F5B58]/30' : ''}
          `}
        >
          <span className={`truncate ${selected.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {selected.length === 0
              ? '— Aucun lot —'
              : selected.length === 1
                ? selected[0]
                : `${selected.length} lots sélectionnés`}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown avec cases à cocher */}
        {open && (
          <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
            {/* Sélectionner tout / Aucun */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-[#252525]">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Lots DCE</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => onChange(joinLots(lots.map(lotLabel)))}
                  className="text-xs text-[#2F5B58] hover:underline font-medium">Tous</button>
                <button type="button" onClick={() => onChange('')}
                  className="text-xs text-gray-500 hover:underline">Aucun</button>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto py-1">
              {lots.map(l => {
                const label = lotLabel(l);
                const checked = selected.includes(label);
                return (
                  <label
                    key={l.numero}
                    className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors
                      ${checked ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleLot(label)}
                      className="mt-0.5 accent-[#2F5B58] flex-shrink-0"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200 leading-tight">
                      <span className="font-semibold">Lot {l.numero}</span>
                      {l.intitule && (
                        <span className="text-gray-500 dark:text-gray-400"> — {l.intitule}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Tags sélectionnés */}
            {selected.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1">
                {selected.map(s => (
                  <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2F5B58]/10 text-[#2F5B58] dark:text-teal-300 rounded-full text-xs font-medium">
                    {s}
                    <button type="button" onClick={() => toggleLot(s)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Mode Manuel (aucun DCE) ───────────────────────────────────────────────
  const addManual = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    const next = [...selected, trimmed];
    onChange(joinLots(next));
    setManualInput('');
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-1 text-left rounded-lg border bg-white dark:bg-[#252525] transition-colors
          ${compact
            ? 'px-2 py-1 text-xs border-gray-300 dark:border-gray-600'
            : 'px-3 py-2 text-sm border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#2F5B58]'}
          ${open ? 'border-[#2F5B58] ring-2 ring-[#2F5B58]/30' : 'hover:border-[#2F5B58]'}
        `}
      >
        <span className={`truncate ${selected.length === 0 ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {selected.length === 0
            ? '— Saisie manuelle —'
            : selected.length === 1
              ? selected[0]
              : `${selected.length} lots`}
        </span>
        <PenLine className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
      </button>

      {/* Panneau saisie manuelle */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Aucun DCE configuré — saisie manuelle
            </p>
          </div>

          {/* Tags existants */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-1">
              {selected.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2F5B58]/10 text-[#2F5B58] dark:text-teal-300 rounded-full text-xs font-medium">
                  {s}
                  <button type="button"
                    onClick={() => onChange(joinLots(selected.filter(x => x !== s)))}
                    className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Saisie */}
          <div className="flex gap-1.5 p-2">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addManual(); } }}
              placeholder="ex. Lot 1 ou Unique"
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#252525] text-gray-900 dark:text-white focus:outline-none focus:border-[#2F5B58]"
              autoFocus
            />
            <button
              type="button"
              onClick={addManual}
              className="px-3 py-1.5 bg-[#2F5B58] text-white text-sm rounded-lg hover:bg-[#234441] transition-colors font-medium"
            >
              +
            </button>
          </div>
          <p className="px-3 pb-2 text-xs text-gray-400">Entrée ou + pour ajouter</p>
        </div>
      )}
    </div>
  );
}
