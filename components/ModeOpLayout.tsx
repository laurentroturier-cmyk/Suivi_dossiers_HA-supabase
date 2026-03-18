import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ModeOpLayoutProps {
  title: string;
  subtitle: string;
  objective: string;
  application?: string;
  onNavigate?: (tab: string) => void;
  children: React.ReactNode;
}

const ModeOpLayout: React.FC<ModeOpLayoutProps> = ({ 
  title, 
  subtitle, 
  objective, 
  application = "Suivi dossiers HA", 
  onNavigate, 
  children 
}) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#f5f6fb] dark:bg-[#0f172a] font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
      {/* Fond décoratif (bulles/gradients subtils comme sur la landing) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header (Même style que LandingPage) */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onNavigate && (
              <button 
                onClick={() => onNavigate('mode-op-hub')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                title="Retour au Centre de Ressources"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:-translate-x-1 transition-transform" />
              </button>
            )}
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">{subtitle}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-full">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Documentation Officielle</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Conteneur de style Glassmorphism (comme les tuiles de la landing) */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-500">
          
          {/* Bannière d'en-tête du document */}
          <div className="p-8 lg:p-12 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-slate-800/20 dark:to-slate-900/20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Informations Générales</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                    {title}
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed font-medium">
                    {subtitle}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Objectif du module</p>
                      <p className="text-sm text-gray-700 dark:text-slate-200 leading-snug">
                        {objective}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-50 dark:border-slate-700/50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">Application : {application}</span>
                    <span className="text-[10px] text-blue-500 font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 rounded-md">V2.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Article / Contenu du manuel */}
          <div className="p-8 lg:p-12">
            <article className="prose prose-slate dark:prose-invert max-w-none 
              prose-h2:text-xl prose-h2:font-bold prose-h2:border-l-4 prose-h2:border-blue-500 prose-h2:pl-4 prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-base prose-h3:font-bold prose-h3:text-blue-600 dark:prose-h3:text-blue-400
              prose-p:text-gray-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed
              prose-li:text-gray-600 dark:prose-li:text-slate-300
              prose-strong:text-gray-900 dark:prose-strong:text-white
            ">
              {children}
            </article>
          </div>
          
          {/* Footer du document */}
          <div className="px-8 py-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-400 dark:text-slate-500 font-medium lowercase tracking-wide">
            <span>© 2024 GestProjet — Documentation Utilisateur</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-400" /> dna achats</span>
              <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-blue-400" /> support technique</span>
            </div>
          </div>
        </div>
      </main>

      {/* Styles globaux pour le rendu des composants HTML traditionnels s'ils ne sont pas en Tailwind prose */}
      <style>{`
        .manual-content h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }
        :is(.dark) .manual-content h2 { color: #f9fafb; border-left-color: #60a5fa; }
        
        .manual-content h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #2563eb;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        :is(.dark) .manual-content h3 { color: #60a5fa; }

        .manual-content p {
          color: #4b5563;
          line-height: 1.625;
          margin-bottom: 1rem;
        }
        :is(.dark) .manual-content p { color: #cbd5e1; }

        .manual-content ul, .manual-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        .manual-content li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
        :is(.dark) .manual-content li { color: #cbd5e1; }

        .manual-content .callout {
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
          padding: 1.25rem;
          border-radius: 1rem;
          margin: 1.5rem 0;
          color: #1e40af;
          font-size: 0.875rem;
        }
        :is(.dark) .manual-content .callout { background: rgba(59, 130, 246, 0.1); color: #bfdbfe; border-left-color: #60a5fa; }

        .manual-content .warning {
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
          padding: 1.25rem;
          border-radius: 1rem;
          margin: 1.5rem 0;
          color: #92400e;
          font-size: 0.875rem;
        }
        :is(.dark) .manual-content .warning { background: rgba(245, 158, 11, 0.1); color: #fde68a; border-left-color: #fbbf24; }
      `}</style>
    </div>
  );
};

export default ModeOpLayout;
