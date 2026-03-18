import React from 'react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpGantt: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="Planning Gantt"
      subtitle="Module Indicateurs & Pilotage"
      objective="Visualiser et piloter les calendriers globaux des dossiers et des procédures en cours sur une frise chronologique interactive (diagramme de Gantt)."
      onNavigate={onNavigate}
    >
      <div className="manual-content">
        <h2>1) Fonctionnement général du Gantt</h2>
        <p>Le module Gantt transpose visuellement les <strong>Dates clés</strong> saisies dans les fiches projets et procédures. Il permet d'anticiper les goulots d'étranglement ou de repérer les dossiers en retard.</p>
        
        <h3>1.1 Les 3 Vues principales</h3>
        <p>Utilisez les boutons de sélection (au-dessus du tableau à droite) pour adapter le graphe à vos besoins d'analyse :</p>
        <ul>
          <li><strong>Synthèse</strong> : Offre une vue consolidée, présentant simultanément les jalons des dossiers ("phase pré-consultation") et les jalons des procédures ("phase d'ouverture et analyse"). Utile pour une vision manager de bout en bout.</li>
          <li><strong>Projets</strong> : N'affiche que les graphes temporels des <strong>Dossiers</strong>. L'accent est mis sur la validation de la stratégie et le lancement cible de la consultation.</li>
          <li><strong>Procédures</strong> : N'affiche que le calendrier des consultations (date de lancement, publication, remise des offres).</li>
        </ul>

        <h2>2) Appliquer des filtres avancés</h2>
        <p>Le planning global pouvant comporter plusieurs centaines de lignes, <strong>la barre de filtres (en haut)</strong> est primordiale pour cibler un périmètre d'action :</p>
        
        <ol>
          <li><strong>Recherche textuelle</strong> : Saisissez un Numéro de procédure, de dossier ou un mot ou deux du titre pour ne cibler qu'une procédure spécifique.</li>
          <li><strong>Bornes temporelles</strong> : Deux couples de dates sont proposés.
            <ul>
              <li><strong>Lancement</strong> (Du/Au) : Filtre sur la date cible ou réelle de lancement (publication).</li>
              <li><strong>Déploiement / Fin pub.</strong> (Du/Au) : Filtre sur la date de déploiement estimée du marché ou la fin de remise des offres.</li>
            </ul>
          </li>
          <li><strong>Statut</strong> : Ne gardez que les éléments "En cours", ou ceux avec "Attribution imminente".</li>
          <li><strong>Acheteur & Client Interne</strong> : Très utile pour un manager souhaitant analyser la charge de travail d'un acheteur spécifique ou les projets à destination d'un service demandeur.</li>
          <li><strong>Priorité & Type</strong> : P0 à P3 ou filtre par procédure (AOO, MAPA...).</li>
          <li><strong>Statut temporel</strong> : Sélectionnez <em>« retard »</em> pour surligner immédiatement les dossiers dont la date système est dépassée vis-à-vis du jalon.</li>
        </ol>

        <div className="callout">
          <strong>Astuce</strong> : Lorsque plusieurs filtres ou dates sont actifs, un bouton orange <strong>RESET</strong> apparaît à droite pour vider l'ensemble des filtres d'un seul clic.
        </div>

        <h2>3) Lecture du Diagramme</h2>
        <p>Dans la zone centrale (graphe), voici comment interpréter l'affichage :</p>
        
        <ul>
          <li>Chaque ligne dispose d'une étiquette gauche avec son numéro, son titre cliquable et le nom de l'acheteur en charge.</li>
          <li><strong>Barres horizontales</strong> : Représentent la durée effective entre deux dates clés (ex: de la rédaction du DCE à la remise des offres).</li>
          <li><strong>Dates repères (losanges ou ronds)</strong> : Jalons ponctuels (ex: Date d'ouverture des offres, validation CODIR).</li>
          <li><strong>Ligne pointillée rouge verticale</strong> : Représente "Aujourd'hui". Tout élément d'objectif placé à gauche de cette ligne sans être "terminé" est par principe <strong>en retard</strong>.</li>
        </ul>

        <h2>4) Exportation et Impression</h2>
        <ol>
          <li>Configurez le planning sur la période qui vous intéresse (par exemple : le mois en cours).</li>
          <li>Affichez les colonnes ou fermez les éléments nécessaires.</li>
          <li>Utilisez le bouton <strong>Export PDF ou Image (si activé)</strong> depuis le menu latéral de votre navigateur ou de l'application.</li>
          <li>Il peut être conseillé d'utiliser le mode "Paysage" lors de l'impression de cette vue pour en préserver la lisibilité de la frise chronologique.</li>
        </ol>

      </div>
    </ModeOpLayout>
  );
};

export default ModeOpGantt;
