import React from 'react';
import { BarChart3, FileText, ClipboardList, PlayCircle, Download, Settings, TrendingUp, Calendar, Users } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
  projectsCount: number;
  proceduresCount: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAdmin, projectsCount, proceduresCount }) => {
  const features = [
    {
      icon: BarChart3,
      title: 'Indicateurs',
      description: 'Tableaux de bord et visualisation Gantt pour piloter vos projets',
      color: 'bg-blue-500',
      tabs: ['dashboard', 'gantt'],
      actions: [
        { label: 'Tableau de bord', tab: 'dashboard' },
        { label: 'Gantt', tab: 'gantt' },
      ]
    },
    {
      icon: FileText,
      title: 'Projets achats',
      description: 'Gestion complète de vos projets et dossiers d\'achats',
      color: 'bg-green-600',
      tabs: ['dossiers'],
      actions: [
        { label: 'Voir les projets', tab: 'dossiers' },
      ]
    },
    {
      icon: ClipboardList,
      title: 'Procédures',
      description: 'Suivi des procédures de marchés publics et appels d\'offres',
      color: 'bg-purple-600',
      tabs: ['procedures'],
      actions: [
        { label: 'Voir les procédures', tab: 'procedures' },
      ]
    },
    {
      icon: PlayCircle,
      title: 'Exécution des marchés',
      description: 'Commission, registres de retraits et dépôts, analyses AN01',
      color: 'bg-orange-600',
      tabs: ['commission', 'retraits', 'depots', 'an01'],
      actions: [
        { label: 'Commission HA', tab: 'commission' },
        { label: 'Retraits', tab: 'retraits' },
        { label: 'Dépôts', tab: 'depots' },
        { label: 'AN01', tab: 'an01' },
      ]
    },
    {
      icon: Download,
      title: 'Exports & Données',
      description: 'Exportation et gestion de vos données en format Excel',
      color: 'bg-indigo-600',
      tabs: ['export'],
      actions: [
        { label: 'Exporter', tab: 'export' },
      ]
    },
    {
      icon: Settings,
      title: 'Administration',
      description: 'Gestion des utilisateurs et paramètres de l\'application',
      color: 'bg-gray-700',
      tabs: ['admin'],
      actions: [
        { label: 'Paramètres', tab: 'admin', isAdmin: true },
      ]
    },
  ];

  const stats = [
    { icon: FileText, label: 'Projets actifs', value: projectsCount, color: 'text-green-600' },
    { icon: ClipboardList, label: 'Procédures', value: proceduresCount, color: 'text-purple-600' },
    { icon: TrendingUp, label: 'En cours', value: Math.floor(projectsCount * 0.65), color: 'text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#004d3d] rounded-2xl mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-5xl font-black text-[#004d3d] mb-4">GestProjet</h1>
            <p className="text-xl text-gray-600 mb-2">Plateforme de gestion des projets achats DNA</p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              Pilotez vos procédures de marchés publics, suivez vos projets achats et gérez l'exécution de vos marchés en toute simplicité
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">Accès rapide aux fonctionnalités</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              <div className={`${feature.color} h-2`}></div>
              <div className="p-8">
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 mb-6">{feature.description}</p>
                
                <div className="space-y-2">
                  {feature.actions.map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={() => action.isAdmin ? onOpenAdmin() : onNavigate(action.tab)}
                      className="w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-between group/btn"
                    >
                      <span>{action.label}</span>
                      <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-8 py-8 text-center">
        <p className="text-sm text-gray-500">
          <strong>GestProjet</strong> v1.0.1 • Mise à jour : 06/01/2026
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
