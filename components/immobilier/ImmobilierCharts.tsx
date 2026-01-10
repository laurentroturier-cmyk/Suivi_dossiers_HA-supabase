import React, { useMemo } from 'react';
import { useImmobilier } from '@/hooks';
import { TrendingUp, Home, DollarSign, Percent, MapPin, Users, Target } from 'lucide-react';

const formatNumberFR = (num: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num).replace(/\s/g, '\u202F');
};

const formatKCurrency = (num: number): string => {
  if (isNaN(num)) return '-';
  const kValue = Math.round(num / 1000);
  return `${kValue.toLocaleString('fr-FR')} K€`;
};

// KPI Tile Component
const KPITile: React.FC<{ 
  label: string; 
  value: string | number; 
  unit?: string; 
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, unit, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
    <div className="p-4">
      <div className="flex justify-center mb-3">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.08em] mb-1 text-center">
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1">
        <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums break-words max-w-[180px] leading-tight">
          {value}
        </p>
        {unit && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{unit}</span>
        )}
      </div>
    </div>
  </div>
);

// Bar Chart Component
const SimpleBarChart: React.FC<{ 
  data: Record<string, number>; 
  title: string; 
  color: string;
  maxItems?: number;
  onClick?: (label: string) => void;
  activeLabel?: string;
}> = ({ data, title, color, maxItems = 8, onClick, activeLabel }) => {
  const entries = Object.entries(data)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, maxItems);
  const maxVal = Math.max(...entries.map(e => e[1] as number), 1);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-4">{title}</h4>
      <div className="flex-1 space-y-3">
        {entries.map(([label, val]) => (
          <div 
            key={label} 
            className="space-y-1 cursor-pointer"
            onClick={() => onClick && onClick(label)}
          >
            <div className={`flex justify-between text-[11px] font-bold ${activeLabel && activeLabel !== label ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
              <span className={`truncate pr-4 max-w-[150px] ${activeLabel === label ? 'font-extrabold' : ''}`} title={label}>{label || 'N/C'}</span>
              <span className="tabular-nums">{typeof val === 'number' ? formatNumberFR(val) : val}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${color} ${activeLabel ? (activeLabel === label ? 'opacity-100' : 'opacity-35') : ''}`} 
                style={{ width: `${((val as number) / maxVal) * 100}%` }} 
              />
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">Aucune donnée</div>
        )}
      </div>
    </div>
  );
};

// Donut Chart Component
const DonutChart: React.FC<{ 
  data: Record<string, number>; 
  title: string;
  colors: string[];
  onSegmentClick?: (label: string) => void;
  activeLabel?: string;
}> = ({ data, title, colors, onSegmentClick, activeLabel }) => {
  const entries = Object.entries(data)
    .filter(([, val]) => (val as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number));
  const total = entries.reduce((sum, [, val]) => sum + (val as number), 0);
  
  let currentAngle = 0;
  const segments = entries.map(([label, val], index) => {
    const angle = ((val as number) / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { label, val, angle, startAngle, color: colors[index % colors.length] };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col">
      <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-3">{title}</h4>
      <div className="flex flex-col items-center gap-4 flex-1">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-32 h-32">
            {segments.map((seg, i) => (
              <path
                key={i}
                d={describeArc(50, 50, 38, seg.startAngle, seg.startAngle + seg.angle - 0.5)}
                fill="none"
                stroke={seg.color}
                strokeWidth={activeLabel ? (activeLabel === seg.label ? 22 : 14) : 20}
                className={`transition-all duration-500 cursor-pointer ${activeLabel && activeLabel !== seg.label ? 'opacity-40' : ''}`}
                onClick={() => onSegmentClick && onSegmentClick(seg.label)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800 dark:text-white">{formatNumberFR(total)}</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="w-full grid grid-cols-2 gap-x-3 gap-y-1.5">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => onSegmentClick && onSegmentClick(seg.label)}>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className={`text-[11px] truncate ${activeLabel && activeLabel !== seg.label ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} ${activeLabel === seg.label ? 'font-bold' : ''}`} title={seg.label}>{seg.label}</span>
              <span className={`text-[11px] ml-auto tabular-nums ${activeLabel && activeLabel !== seg.label ? 'text-gray-400 dark:text-gray-500' : 'font-bold text-gray-900 dark:text-white'}`}>{formatNumberFR(seg.val as number)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ImmobilierCharts: React.FC = () => {
  const { projets, filters, updateFilters } = useImmobilier();

  const chartsData = useMemo(() => {
    // Projets par région
    const parRegion: Record<string, number> = {};
    projets.forEach(p => {
      const region = p['Région'] || 'Non définie';
      parRegion[region] = (parRegion[region] || 0) + 1;
    });

    // Projets par statut
    const parStatut: Record<string, number> = {};
    projets.forEach(p => {
      const statut = p['Statut'] || 'Non défini';
      parStatut[statut] = (parStatut[statut] || 0) + 1;
    });

    // Budget par région (en milliers)
    const budgetParRegion: Record<string, number> = {};
    projets.forEach(p => {
      const region = p['Région'] || 'Non définie';
      const budget = typeof p['Budget en €'] === 'string' 
        ? parseFloat(p['Budget en €'].replace(/,/g, '.')) 
        : p['Budget en €'] || 0;
      budgetParRegion[region] = (budgetParRegion[region] || 0) + budget;
    });

    // Projets par chef de projet
    const parChef: Record<string, number> = {};
    projets.forEach(p => {
      const chef = p['Chef de Projet'] || 'Non assigné';
      parChef[chef] = (parChef[chef] || 0) + 1;
    });

    // Projets par priorité
    const parPriorite: Record<string, number> = {};
    projets.forEach(p => {
      const prio = p['Priorité'] || 'Non définie';
      parPriorite[prio] = (parPriorite[prio] || 0) + 1;
    });

    return { parRegion, parStatut, budgetParRegion, parChef, parPriorite };
  }, [projets]);

  return (
    <div data-export-id="charts" data-export-label="Graphiques" className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          title="Projets par région"
          data={chartsData.parRegion}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          maxItems={8}
          activeLabel={filters.region}
          onClick={(region) => updateFilters({ region: filters.region === region ? undefined : region })}
        />
        <DonutChart
          title="Répartition par statut"
          data={chartsData.parStatut}
          colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']}
          activeLabel={filters.statut}
          onSegmentClick={(statut) => updateFilters({ statut: filters.statut === statut ? undefined : statut })}
        />
        <SimpleBarChart
          title="Projets par chef de projet"
          data={chartsData.parChef}
          color="bg-gradient-to-r from-emerald-500 to-emerald-600"
          maxItems={8}
          activeLabel={filters.chefProjet}
          onClick={(chef) => updateFilters({ chefProjet: filters.chefProjet === chef ? undefined : chef })}
        />
        <SimpleBarChart
          title="Projets par priorité"
          data={chartsData.parPriorite}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          maxItems={6}
          activeLabel={filters.priorite}
          onClick={(priorite) => updateFilters({ priorite: filters.priorite === priorite ? undefined : priorite })}
        />
      </div>
    </div>
  );
};

export default ImmobilierCharts;
