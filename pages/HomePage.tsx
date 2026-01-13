import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useDossiers, useAuth } from '@/hooks';
import { BarChart3, FileText, ClipboardList, Download, Upload, TrendingUp, Calendar, Shield, LineChart, Building2, Edit3, PlayCircle, Lock } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { dossiers } = useDossiers();
  const { profile, isAdmin } = useAuth();
  const [showDevModal, setShowDevModal] = useState(false);

  const domaines = [
    {
      id: 'dashboard',
      titre: 'Tableau de bord',
      description: 'Vue d\'ensemble et indicateurs',
      icon: BarChart3,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
      borderColor: 'border-indigo-200 dark:border-indigo-500/40',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'gantt',
      titre: 'Planning Gantt',
      description: 'Planification des projets',
      icon: Calendar,
      iconColor: 'text-pink-600 dark:text-pink-400',
      iconBg: 'bg-pink-100 dark:bg-pink-500/20',
      borderColor: 'border-pink-200 dark:border-pink-500/40',
      action: () => navigate('/gantt'),
    },
    {
      id: 'projets',
      titre: 'Projets',
      description: 'Gestion des projets d\'achats publics',
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      borderColor: 'border-blue-200 dark:border-blue-500/40',
      count: projects.length,
      action: () => navigate('/projets'),
      subItems: [
        {
          id: 'immobilier',
          titre: 'ImmoVision',
          description: 'Gestion du portefeuille immobilier',
          icon: Building2,
          iconColor: 'text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-100 dark:bg-amber-500/20',
          borderColor: 'border-amber-200 dark:border-amber-500/40',
          action: () => navigate('/immobilier'),
        },
      ],
    },
    {
      id: 'procedures',
      titre: 'Procédures',
      description: 'Suivi des procédures d\'achats',
      icon: ClipboardList,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      borderColor: 'border-purple-200 dark:border-purple-500/40',
      count: dossiers.length,
      action: () => navigate('/procedures'),
    },
    {
      id: 'execution',
      titre: 'Exécution des marchés',
      description: 'Gestion des contrats',
      icon: PlayCircle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      borderColor: 'border-orange-200 dark:border-orange-500/40',
      subItems: [
        {
          id: 'contrats',
          titre: 'Contrats',
          description: 'Gestion des contrats',
          icon: FileText,
          iconColor: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-500/20',
          borderColor: 'border-green-200 dark:border-green-500/40',
          action: () => navigate('/contrats'),
        },
      ],
    },
    {
      id: 'analyse',
      titre: 'Analyse',
      description: 'Analyses et registres des offres',
      icon: LineChart,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200 dark:border-emerald-500/40',
      action: () => setTimeout(() => {}, 0),
      subItems: [
        {
          id: 'analyse-retraits',
          titre: 'Registre Retraits',
          description: 'Suivi des retraits de DCE',
          icon: Download,
          iconColor: 'text-orange-600 dark:text-orange-400',
          iconBg: 'bg-orange-100 dark:bg-orange-500/20',
          borderColor: 'border-orange-200 dark:border-orange-500/40',
          action: () => navigate('/retraits'),
        },
        {
          id: 'analyse-depots',
          titre: 'Registre Dépôts',
          description: 'Suivi des dépôts de plis',
          icon: Upload,
          iconColor: 'text-cyan-600 dark:text-cyan-400',
          iconBg: 'bg-cyan-100 dark:bg-cyan-500/20',
          borderColor: 'border-cyan-200 dark:border-cyan-500/40',
          action: () => navigate('/depots'),
        },
        {
          id: 'analyse-an01',
          titre: 'AN01',
          description: 'Analyse technique des offres',
          icon: LineChart,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
          borderColor: 'border-emerald-200 dark:border-emerald-500/40',
          action: () => navigate('/an01'),
        },
      ],
    },
    {
      id: 'redaction',
      titre: 'Rédaction',
      description: 'Rédaction des documents et DCE (en construction)',
      icon: Edit3,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-500/40',
      adminOnly: true,
      action: () => {
        if (isAdmin) {
          navigate('/redaction');
        } else {
          setShowDevModal(true);
        }
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bienvenue sur GestProjet
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Plateforme de gestion des achats publics
          </p>
        </div>

        {/* Domaines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domaines.map((domaine) => {
            const Icon = domaine.icon;
            return (
              <div key={domaine.id}>
                <div
                  onClick={domaine.action}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${domaine.borderColor} p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${domaine.adminOnly && !isAdmin ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${domaine.iconBg} rounded-xl flex items-center justify-center relative`}>
                      <Icon className={`w-6 h-6 ${domaine.iconColor}`} />
                      {domaine.adminOnly && !isAdmin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    {domaine.count !== undefined && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-bold text-gray-700 dark:text-gray-300">
                        {domaine.count}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {domaine.titre}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {domaine.description}
                  </p>
                </div>

                {/* Sub-items pour projets / analyse */}
                {domaine.subItems && (
                  <div className="mt-3 space-y-2">
                    {domaine.subItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      return (
                        <div
                          key={subItem.id}
                          onClick={subItem.action}
                          className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${subItem.borderColor} p-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 ${subItem.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <SubIcon className={`w-5 h-5 ${subItem.iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                {subItem.titre}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {subItem.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Projets actifs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Procédures</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{dossiers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux de succès</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">85%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal En cours de développement */}
      {showDevModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDevModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                <Edit3 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                En cours de développement
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Le module Rédaction est actuellement en cours de développement.
              </p>
              <button
                onClick={() => setShowDevModal(false)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
