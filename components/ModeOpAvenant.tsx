import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpAvenant: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="modes-operatoires-container bg-white dark:bg-slate-900 min-h-screen rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 m-6 overflow-hidden relative">
      <style>{`
        .modes-operatoires-container {
          --text: #111827;
          --muted: #4b5563;
          --border: #e5e7eb;
          --accent: #0f766e;
          --accent-2: #1d4ed8;
          --bg-soft: #f9fafb;
          font-family: Calibri, Arial, sans-serif;
          color: var(--text);
          line-height: 1.35;
        }
        :is(.dark) .modes-operatoires-container {
          --text: #f8fafc;
          --muted: #94a3b8;
          --border: #334155;
          --accent: #2dd4bf;
          --accent-2: #60a5fa;
          --bg-soft: #1e293b;
        }
        .modes-operatoires-container .page {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 48px;
        }
        .modes-operatoires-container h1 {
          font-size: 26px;
          margin: 0 0 6px 0;
          letter-spacing: 0.2px;
          font-weight: bold;
        }
        .modes-operatoires-container .subtitle {
          color: var(--muted);
          font-size: 13px;
          margin: 0 0 18px 0;
        }
        .modes-operatoires-container .meta {
          border: 1px solid var(--border);
          background: var(--bg-soft);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 12px;
          color: var(--muted);
          margin: 0 0 18px 0;
        }
        .modes-operatoires-container h2 {
          font-size: 18px;
          margin: 20px 0 8px 0;
          padding-top: 16px;
          border-top: 2px solid var(--border);
          font-weight: bold;
        }
        .modes-operatoires-container h3 {
          font-size: 14px;
          margin: 14px 0 6px 0;
          color: var(--accent);
          font-weight: bold;
        }
        .modes-operatoires-container p { margin: 6px 0; }
        .modes-operatoires-container ul, .modes-operatoires-container ol { 
          margin: 6px 0 10px 20px; 
          list-style-type: disc;
        }
        .modes-operatoires-container ol {
          list-style-type: decimal;
        }
        .modes-operatoires-container li { margin: 4px 0; }
        .modes-operatoires-container .callout {
          border-left: 4px solid var(--accent-2);
          background: #eff6ff;
          padding: 10px 12px;
          border-radius: 8px;
          margin: 10px 0;
          color: #1e3a8a;
        }
        :is(.dark) .modes-operatoires-container .callout {
          background: #1e3a8a20;
          border-left-color: #3b82f6;
          color: #bfdbfe;
        }
        .modes-operatoires-container .warning {
          border-left: 4px solid #b45309;
          background: #fffbeb;
          padding: 10px 12px;
          border-radius: 8px;
          margin: 10px 0;
          color: #92400e;
        }
        :is(.dark) .modes-operatoires-container .warning {
          background: #78350f20;
          border-left-color: #f59e0b;
          color: #fde68a;
        }
        .modes-operatoires-container .small { font-size: 12px; color: var(--muted); }
      `}</style>

      {/* Bouton Retour au Hub */}
      {onNavigate && (
        <div className="absolute top-6 left-6">
          <button 
            onClick={() => onNavigate('mode-op-hub')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors text-sm border border-gray-200 dark:border-slate-600 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au Centre de Ressources
          </button>
        </div>
      )}

      <div className="page" style={{ paddingTop: onNavigate ? '80px' : '40px' }}>
        <h1>Mode opératoire : Gestion des Avenants</h1>
        <p className="subtitle">Module <strong>Exécution (Avenants aux marchés)</strong></p>

        <div className="meta">
          <div><strong>Objectif</strong> : Créer, valider, éditer et générer les PDF juridiques pour les deux grands types d'avenants : Standard (EXE10) et Transfert (Changement de titulaire).</div>
        </div>

        <h2>1) Fonctionnement et Vue Principale</h2>
        <p>Le module Avenants vous présente l'ensemble des actes modificatifs rattachés à vos contrats ouverts.</p>
        <ul>
          <li><strong>Indicateurs rapides</strong> : Le tableau liste les avenants par Numéro, Type, Référence, Contrat, Montant HT, Date et Statut.</li>
          <li><strong>Le code Type</strong> :
            <ul>
              <li><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">Standard</span> : Modification de prestations, délai ou prix.</li>
              <li><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">Transfert</span> : Modification liée à la vie de l'entreprise (fusion, absorption).</li>
            </ul>
          </li>
          <li><strong>Statuts</strong> : Un avenant peut être en <strong>Brouillon</strong> (modifiable) ou <strong>Validé</strong> (prêt à être notifié).</li>
        </ul>

        <h2>2) Créer un Avenant Standard (Type EXE10)</h2>
        <p>Utile lorsque le périmètre du marché, son montant global ou sa durée doivent être modifiés.</p>
        
        <ol>
          <li>Cliquez sur le bouton <strong>+ Nouvel avenant</strong> puis sélectionnez <strong>Avenant standard</strong>.</li>
          <li>Remplissez le Numéro de l'avenant (ex: <em>Avenant n°1</em>) et la Référence du contrat visé.</li>
          <li><strong>L'incidence financière</strong> : Saisissez le montant de l'avenant (en positif si augmentation, ou en négatif si diminution / moins-value).</li>
          <li>Indiquez la modification exacte dans le champ texte (objet de la modification technique ou administrative).</li>
          <li>Sauvegardez en <em>Brouillon</em> pour continuer plus tard, ou <em>Validé</em> si les informations sont figées.</li>
        </ol>

        <div className="callout">
          <strong>Impact financier</strong> : Le tableau de bord appliquera une coloration verte (augmentation) ou rouge (diminution) au montant saisi pour rendre sa lecture instantanée.
        </div>

        <h2>3) Créer un Avenant de Transfert</h2>
        <p>Utile en cas de changement de titulaire (rachat d'entreprise, fusion, changement de SIRET).</p>
        
        <ol>
          <li>Cliquez sur le bouton <strong>+ Nouvel avenant</strong> puis sélectionnez <strong>Avenant de transfert</strong>.</li>
          <li>Une double interface apparaît avec un logigramme visuel : <em>Ancien Titulaire ➔ Nouveau Titulaire</em>.</li>
          <li>Renseignez scrupuleusement les coordonnées complètes de l'ancien acteur, puis du nouveau (Dénomination, Forme juridique, SIRET, Adresse, Nom du Représentant).</li>
        </ol>
        
        <div className="warning">
          <strong>Important</strong> : Par définition, dans la jurisprudence des marchés, un avenant de transfert pur est <strong>Sans incidence financière</strong> sur le contrat d'origine. Aucun montant ne vous sera demandé.
        </div>

        <h2>4) Aperçu et Génération PDF (CERFA)</h2>
        <p>Pour chaque ligne d'avenant, la colonne de droite "Actions" contient plusieurs boutons vitaux :</p>
        
        <ul>
          <li><strong>L'icône "Oeil" (Aperçu)</strong> : Permet de prévisualiser l'intégralité des données en format Pop-Up plein écran, sans risquer de modifier les données par erreur.</li>
          <li><strong>L'icône "Télécharger PDF"</strong> : Génère un document PDF en une fraction de seconde, normalisé et reprenant un formalisme règlementaire. Il est directement structuré pour y accoler les tampons / signatures des cocontractants.</li>
        </ul>

      </div>
    </div>
  );
};

export default ModeOpAvenant;
