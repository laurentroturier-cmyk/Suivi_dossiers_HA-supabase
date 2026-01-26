import React from 'react';
import { Immobilier } from '@/types/immobilier';
import { Users, MapPin, DollarSign, TrendingUp, Calendar, Download, X, FileText, Euro } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/utils';
import { Button, Card } from '@/components/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projet: Immobilier | null;
}

const ImmobilierDetailModal: React.FC<Props> = ({ isOpen, onClose, projet }) => {
  if (!isOpen || !projet) return null;

  const statut = projet['Statut'] || 'N/C';

  const getStatusClasses = (s?: string) => {
    const statutLower = (s || '').toLowerCase();
    if (statutLower.includes('initial')) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
    if (statutLower.includes('travaux') || statutLower.includes('exécution') || statutLower.includes('execution')) return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300';
    if (statutLower.includes('termin') || statutLower.includes('achevé') || statutLower.includes('clos')) return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300';
    return 'bg-gray-100 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300';
  };

  const percentValue = (() => {
    const raw = projet['% Réalisé'];
    let num = typeof raw === 'string' ? parseFloat(raw.replace(/,/g, '.').replace(/%/g, '')) : (raw as number);
    if (!isFinite(num) || isNaN(num)) return 0;
    if (num < 1) num = num * 100; // 0.3 => 30%
    return Math.max(0, Math.min(100, num));
  })();

  const handleExportProjet = () => {
    const headers = [
      'Code demande','Intitulé','Région','Centre','Site','Statut','% Réalisé',
      'Budget en €','Engagé en €','Réalisé en €','Date de démarrage travaux','Date de fin de travaux','Chef de Projet','Programme','Type de programme','Priorité'
    ];
    const row = [
      projet['Code demande'],
      projet['Intitulé'] || '',
      projet['Région'] || '',
      projet['Centre'] || '',
      projet['Site'] || '',
      projet['Statut'] || '',
      typeof projet['% Réalisé'] === 'undefined' ? '' : `${percentValue.toFixed(2)}%`,
      projet['Budget en €'] || '',
      projet['Engagé en €'] || '',
      projet['Réalisé en €'] || '',
      projet['Date de démarrage travaux'] || '',
      projet['Date de fin de travaux'] || '',
      projet['Chef de Projet'] || '',
      projet['Programme'] || '',
      projet['Type de programme'] || '',
      projet['Priorité'] || ''
    ];
    const csv = [headers.join(','), row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `immobilier_${projet['Code demande']}.csv`;
    link.click();
  };

  const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-gray-100">{value || <span className="text-gray-400">-</span>}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header style Contrats */}
        <div className="bg-[var(--accent-green)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Projet {projet['Code demande']}</h2>
            <p className="text-sm text-white/70">{projet['Intitulé'] || ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleExportProjet} 
              variant="ghost"
              size="sm"
              rounded="lg"
              icon={<Download className="w-4 h-4" />}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Exporter
            </Button>
            <Button 
              onClick={onClose} 
              variant="ghost"
              size="sm"
              rounded="lg"
              icon={<X className="w-5 h-5" />}
              className="w-10 h-10 p-0 bg-white/10 hover:bg-white/20 text-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
            {/* Informations générales */}
            <div>
              <h3 className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Informations générales
              </h3>
              <DetailRow label="Code Demande" value={projet['Code demande']} />
              <DetailRow label="Intitulé" value={projet['Intitulé']} />
              <DetailRow label="Statut" value={<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(statut)}`}>{statut}</span>} />
              <DetailRow label="Région" value={projet['Région']} />
              <DetailRow label="Centre" value={projet['Centre']} />
              <DetailRow label="Site" value={projet['Site']} />
              <DetailRow label="Programme" value={projet['Programme']} />
              <DetailRow label="Type de programme" value={projet['Type de programme']} />
              <DetailRow label="Priorité" value={projet['Priorité']} />
            </div>

            {/* Montants */}
            <div>
              <h3 className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Euro className="w-4 h-4" /> Montants
              </h3>
              <DetailRow label="Budget" value={formatCurrency(projet['Budget en €'])} />
              <DetailRow label="Engagé" value={formatCurrency(projet['Engagé en €'])} />
              <DetailRow label="Réalisé" value={formatCurrency(projet['Réalisé en €'])} />
              <DetailRow label="% Réalisé" value={
                (() => {
                  const percent = percentValue;
                  return (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percent >= 90 ? 'bg-red-500' :
                            percent >= 70 ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold">{percent.toFixed(1)}%</span>
                    </div>
                  );
                })()
              } />
            </div>

            {/* Dates & Équipe */}
            <div>
              <h3 className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Dates
              </h3>
              <DetailRow label="Début Travaux" value={projet['Date de démarrage travaux']} />
              <DetailRow label="Fin Travaux" value={projet['Date de fin de travaux']} />

              <h3 className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wider mb-4 mt-6 flex items-center gap-2">
                <Users className="w-4 h-4" /> Équipe
              </h3>
              <DetailRow label="Chef de Projet" value={projet['Chef de Projet']} />
              <DetailRow label="Chargé d'opérations" value={projet["Chargé d'opérations"]} />
              <DetailRow label="RPA" value={projet['RPA']} />
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <h3 className="text-xs font-bold text-[var(--accent-green)] uppercase tracking-wider mb-3">Description du projet</h3>
            <p className="text-sm text-gray-700">{projet['Descriptif'] || 'Aucune description'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImmobilierDetailModal;
