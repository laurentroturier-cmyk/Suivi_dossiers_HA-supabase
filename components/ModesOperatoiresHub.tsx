import React from 'react';
import { ArrowLeft, BookOpen, BarChart3, PlayCircle, Building2 } from 'lucide-react';

interface ModesOperatoiresHubProps {
  onNavigate: (tab: string) => void;
}

const ModesOperatoiresHub: React.FC<ModesOperatoiresHubProps> = ({ onNavigate }) => {
  const modules = [
    {
      titre: "Projets & Procédures",
      description: "Manuel complet pour la gestion des dossiers et procédures d'achats",
      icon: <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-100 dark:border-emerald-500/30",
      hover: "hover:border-emerald-400 dark:hover:border-emerald-400 hover:shadow-emerald-500/20",
      guides: [
        { label: "Manuel Utilisateur Acheteur", tab: "modes-operatoires" }
      ]
    },
    {
      titre: "Indicateurs & Pilotage",
      description: "Maîtrisez les outils de pilotage, Gantt et analyses de portefeuille",
      icon: <BarChart3 className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />,
      bg: "bg-cyan-50 dark:bg-cyan-500/10",
      border: "border-cyan-100 dark:border-cyan-500/30",
      hover: "hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-cyan-500/20",
      guides: [
        { label: "Tableau de Bord", tab: "mode-op-tdb" },
        { label: "Planning Gantt", tab: "mode-op-gantt" },
        { label: "Analyse Portefeuille", tab: "mode-op-portefeuille" }
      ]
    },
    {
      titre: "Exécution des Marchés",
      description: "Suivi financier des contrats et gestion juridique des avenants",
      icon: <PlayCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
      bg: "bg-orange-50 dark:bg-orange-500/10",
      border: "border-orange-100 dark:border-orange-500/30",
      hover: "hover:border-orange-400 dark:hover:border-orange-400 hover:shadow-orange-500/20",
      guides: [
        { label: "Suivi des Contrats", tab: "mode-op-execution" },
        { label: "Gestion des Avenants", tab: "mode-op-avenant" }
      ]
    },
    {
      titre: "ImmoVision",
      description: "Pilotage du portefeuille immobilier et analyses décisionnelles",
      icon: <Building2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-100 dark:border-amber-500/30",
      hover: "hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-amber-500/20",
      guides: [
        { label: "Dashboard Immobilier", tab: "mode-op-immo" }
      ]
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f5f6fb] dark:bg-[#0f172a]">
      {/* Fond : calque de base comme sur la landing */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/20 to-indigo-50/20 dark:from-blue-950/10 dark:to-indigo-950/10" />
      </div>

      {/* Header : glass comme landingpage */}
      <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('home')} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Centre de Ressources</h1>
              <p className="text-[11px] text-gray-600 dark:text-slate-400 font-medium">Modes opératoires & Procédures</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none">Accès Utilisateur</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-20 relative z-10 space-y-16">
        {/* Titre Principal */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full shadow-sm">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Base de connaissances</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white leading-tight">
            Maîtrisez votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Environnement</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
            Une documentation claire et structurée pour vous accompagner dans chaque étape de vos processus administratifs et opérationnels.
          </p>
        </div>

        {/* Grille des modules (Tuiles style landing page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {modules.map((mod, idx) => (
            <div 
              key={idx} 
              className="group bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col h-full transition-all hover:scale-[1.01] hover:shadow-2xl hover:border-blue-400/30 dark:hover:border-blue-500/30"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-4">
                  <div className={'w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-6 ' + mod.bg + ' ' + mod.border}>
                    {mod.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{mod.titre}</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed max-w-[260px]">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 space-y-3 mt-auto">
                {mod.guides.map((guide, gIdx) => (
                  <button
                    key={gIdx}
                    onClick={() => onNavigate(guide.tab)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all text-left shadow-sm group/btn"
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 tracking-tight">{guide.label}</span>
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-700 items-center justify-center flex group-hover/btn:bg-blue-600 group-hover/btn:rotate-0 -rotate-45 transition-all outline outline-0 outline-blue-100 group-hover/btn:outline-8">
                      <ArrowLeft className="w-4 h-4 text-gray-400 group-hover/btn:text-white rotate-180 transform transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer décoratif */}
        <div className="pt-12 border-t border-gray-200/50 dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400 md:px-4">
          <p>© 2024 GestProjet — Plateforme DNA Achats</p>
          <div className="flex items-center gap-6 font-medium">
            <a href="#" className="hover:text-blue-500 transition-colors">Support</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Mises à jour</a>
            <a href="#" className="hover:text-blue-500 transition-colors underline underline-offset-4">FAQ</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModesOperatoiresHub;
