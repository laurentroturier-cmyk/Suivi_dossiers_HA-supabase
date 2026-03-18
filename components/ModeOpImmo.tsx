import React from 'react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpImmo: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="ImmoVision"
      subtitle="Module Immobilier"
      objective="Piloter et analyser le portefeuille des opérations immobilières, suivre les budgets et l'avancement des grands projets."
      onNavigate={onNavigate}
    >
      <div className="manual-content">
        <h2>1) Indicateurs Clés et Tableau de bord</h2>
        <p>En ouvrant <strong>ImmoVision</strong>, vous disposez immédiatement d'un panorama macroscopique :</p>
        
        <ol>
          <li>Les <strong>Indicateurs clés</strong> (Cartes hautes) compilent la volumétrie : Nombre de projets total, Budget consenti global (exprimé en M€/k€), le taux de réalisation moyen d'avancement, et le compte des projets terminés.</li>
          <li><strong>Analyses et Statistiques</strong> : Les graphiques interactifs classent les projets par :
            <ul>
              <li><strong>Région / Centre</strong> pour identifier où sont situés la majorité de vos efforts budgétaires (Bar Chart).</li>
              <li><strong>Statut</strong> et <strong>Étape de demande</strong> (Donut Charts).</li>
            </ul>
          </li>
        </ol>

        <div className="callout">
          <strong>Astuce</strong> : Les widgets de graphe réagissent aux filtres actifs de la page. Si vous filtrez sur la région "IDF", tous les affichages du Dashboard se recalculent pour n'englober que l'Île-de-France.
        </div>

        <h2>2) Recherche et Filtres</h2>
        <p>Le panneau de filtres d'ImmoVision propose des croisements très précis :</p>
        <ul>
          <li>Vous pouvez chercher par mot clé textuel ("Réfection toiture").</li>
          <li>Croiser un Programme d'investissement avec un Chef de Projet et un statut particulier.</li>
          <li>Sélectionner un filtre "Décision CNI" (Validation).</li>
        </ul>

        <h2>3) La Liste des Projets et Détails</h2>
        <ol>
          <li>Le bas de l'écran liste les dossiers du portefeuille dans un tableau paginé. Chaque ligne résume le Code Demande, le Budget et le %.</li>
          <li><strong>Cliquez sur la ligne</strong> pour ouvrir la modal / pop-up détaillant la fiche complète du bien immobilier visé (surface, planning de démarrage des travaux, localisation exacte, RPA...).</li>
        </ol>

        <div className="warning">
          <strong>Exportation Excel</strong> : Utilisez le bouton "Exporter Excel" en haut à droite pour télécharger la vue actuelle. L'export se compose de deux onglets : le premier prouve les filtres utilisés (audit et traçabilité), et le second l'extraction complète des données filtrées.
        </div>
      </div>
    </ModeOpLayout>
  );
};

export default ModeOpImmo;
