import React, { useState, useMemo } from 'react';
import { CandidateTechnicalAnalysis } from './types';
import { ArrowLeft, User, Award, MessageSquare, AlertCircle, BarChart3, Image as ImageIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ExportSelectModal from './ExportSelectModal';

interface Props {
  technicalData: CandidateTechnicalAnalysis[];
  onBack: () => void;
  winnerName?: string;
}

const TechnicalAnalysisView: React.FC<Props> = ({ technicalData, onBack, winnerName }) => {
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter candidates to only include those with at least one score > 0
  const validCandidates = useMemo(() => {
    if (!technicalData) return [];
    return technicalData.filter(candidate => {
        return candidate.criteria.some(crit => {
            let score = 0;
            if (typeof crit.score === 'number') score = crit.score;
            else if (typeof crit.score === 'string') score = parseFloat(crit.score.replace(',', '.')) || 0;
            return score > 0;
        });
    });
  }, [technicalData]);

  const selectedData = validCandidates[selectedCandidateIndex];
  const isWinner = selectedData?.candidateName === winnerName;

  // Filter criteria with score 0 for the list view
  const displayedCriteria = useMemo(() => {
    if (!selectedData) return [];
    return selectedData.criteria.filter(crit => {
        let score = 0;
        if (typeof crit.score === 'number') score = crit.score;
        else if (typeof crit.score === 'string') score = parseFloat(crit.score.replace(',', '.')) || 0;
        return score > 0;
    });
  }, [selectedData]);

  const chartData = useMemo(() => {
    if (!validCandidates || validCandidates.length === 0) return [];

    // 1. Calculate market stats per criterion (based on valid candidates)
    const criteriaStats: Record<string, { sum: number; count: number }> = {};

    validCandidates.forEach(candidate => {
        candidate.criteria.forEach(crit => {
            let score = 0;
            if (typeof crit.score === 'number') {
                score = crit.score;
            } else if (typeof crit.score === 'string') {
                score = parseFloat(crit.score.replace(',', '.')) || 0;
            }
            
            const key = crit.name;
            
            if (!criteriaStats[key]) {
                criteriaStats[key] = { sum: 0, count: 0 };
            }
            criteriaStats[key].sum += score;
            criteriaStats[key].count += 1;
        });
    });

    // 2. Build chart data for selected candidate
    if (!selectedData) return [];

    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    return selectedData.criteria.map(crit => {
        const key = crit.name;
        const stats = criteriaStats[key];
        const average = stats && stats.count > 0 ? stats.sum / stats.count : 0;
        
        let score = 0;
        if (typeof crit.score === 'number') score = crit.score;
        else if (typeof crit.score === 'string') score = parseFloat(crit.score.replace(',', '.')) || 0;

        const shortName = crit.name.length > 15 ? crit.name.substring(0, 15) + '...' : crit.name;

        // Ensure both individual score and average are rounded to 2 decimals
        return {
            name: shortName,
            fullName: crit.name,
            score: round2(score),
            average: round2(average),
        };
    }).filter(d => d.score > 0); // Filter from chart if score is 0

  }, [validCandidates, selectedData]);

  if (!validCandidates || validCandidates.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-10 bg-white m-4 rounded-xl shadow-sm text-center">
              <AlertCircle className="w-16 h-16 text-orange-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-800">Aucune donnée technique détaillée</h2>
              <p className="text-gray-500 mt-2 max-w-md">
                  Aucun candidat avec des critères techniques significatifs (score {'>'} 0) n'a été trouvé.
              </p>
              <button 
                onClick={onBack}
                className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                  Retour au tableau de bord
              </button>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      <ExportSelectModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={`Analyse Technique - ${selectedData.candidateName}`}
      />

      {/* Header specific to this view */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-6 h-6 text-green-600" />
                Analyse Technique Détaillée
            </h2>
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow"
            >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Img Export</span>
            </button>
            <div className="text-sm text-gray-400 hidden sm:block">
                {validCandidates.length} Candidats analysés
            </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Candidate List */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
            <div className="p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">Candidats</p>
                {validCandidates.map((data, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedCandidateIndex(idx)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3
                            ${selectedCandidateIndex === idx 
                                ? 'bg-green-50 text-green-700 shadow-sm border border-green-100' 
                                : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                            }
                        `}
                    >
                        <User className={`w-4 h-4 ${selectedCandidateIndex === idx ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className="truncate">{data.candidateName}</span>
                        {data.candidateName === winnerName && (
                            <Award className="w-3 h-3 text-yellow-500 ml-auto" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content - Criteria Table */}
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                     <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 md:hidden">
                        {/* Mobile Selector fallback could go here, for now relying on layout */}
                        <User className="w-6 h-6 text-gray-600" />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-800">
                         {selectedData.candidateName}
                         {isWinner && <span className="ml-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full align-middle font-normal">Lauréat</span>}
                     </h3>
                </div>

                {/* Chart Section */}
                {chartData.length > 0 && (
                    <div 
                        data-export-id="tech-profile-chart"
                        data-export-label={`Profil Technique - ${selectedData.candidateName}`}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6"
                    >
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-500" />
                            Profil Technique vs Moyenne Marché
                        </h4>
                        <div className="h-64 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={chartData} margin={{top: 5, right: 30, left: 0, bottom: 5}}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                     <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 11, fill: '#9ca3af'}} 
                                        interval={0} 
                                        height={30}
                                     />
                                     <YAxis tick={{fontSize: 11, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                                     <Tooltip 
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        cursor={{fill: '#f9fafb'}}
                                        formatter={(value: number, name: string) => [value, name === 'score' ? 'Note Candidat' : 'Moyenne']}
                                        labelFormatter={(label, payload) => payload[0]?.payload.fullName || label}
                                     />
                                     <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                     <Bar dataKey="score" name="Note Candidat" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                     <Bar dataKey="average" name="Moyenne" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={20} />
                                 </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {displayedCriteria.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                        Aucun critère technique significatif (score &gt; 0) trouvé pour ce candidat.
                    </div>
                ) : (
                    <div 
                        data-export-id="tech-criteria-list"
                        data-export-label={`Détail Critères - ${selectedData.candidateName}`}
                        className="space-y-4"
                    >
                        {displayedCriteria.map((crit, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4 flex flex-col sm:flex-row gap-4">
                                    {/* Score Section */}
                                    <div className="sm:w-32 flex-shrink-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <span className="text-2xl font-bold text-green-600">{typeof crit.score === 'number' ? crit.score.toFixed(2) : crit.score}</span>
                                        {crit.maxScore && <span className="text-xs text-gray-500 font-medium">/ {crit.maxScore}</span>}
                                    </div>

                                    {/* Content Section */}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 mb-2">{crit.name}</h4>
                                        
                                        {crit.comment ? (
                                            <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50/50 p-3 rounded-lg">
                                                <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                <p className="italic leading-relaxed">"{crit.comment}"</p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Pas de commentaire disponible.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysisView;