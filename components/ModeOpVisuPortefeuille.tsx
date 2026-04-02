import React from 'react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpVisuPortefeuille: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="Visualisation des Analyses de Portefeuille"
      subtitle="Module Indicateurs & Pilotage"
      objective="Offrir une vue consolidée et interactive de l'ensemble des familles d'achats positionnées sur les matrices stratégiques (Opportunités/Risques et Contraintes), avec filtrage multicritère et visualisation plein écran."
      onNavigate={onNavigate}
    >
      <div className="manual-content">

        <h2>1) Accéder au module</h2>
        <p>
          Le module <strong>Visualisation des Analyses de Portefeuille</strong> est accessible depuis le menu principal de l'application, dans la rubrique <strong>Indicateurs &amp; Pilotage</strong>.
          Il affiche l'ensemble des familles et sous-familles d'achats importées, positionnées automatiquement sur les matrices stratégiques.
        </p>

        <h2>2) Comprendre les filtres</h2>
        <p>
          Quatre filtres permettent d'affiner la sélection des éléments affichés sur les matrices :
        </p>
        <ul>
          <li>
            <strong>Segment</strong> — filtre le niveau macro de la nomenclature achats.
            Sélectionner un segment restreint les familles disponibles dans le filtre suivant.
          </li>
          <li>
            <strong>Famille</strong> — filtre sur la famille d'achat au sens standard.
            Dépend du segment sélectionné (cascade automatique).
          </li>
          <li>
            <strong>Sous-famille</strong> — filtre sur la granularité la plus fine.
            Dépend de la famille sélectionnée (cascade automatique).
          </li>
          <li>
            <strong>Acheteur</strong> — filtre multi-sélection indépendant.
            Permet de restreindre l'affichage aux familles portées par un ou plusieurs acheteurs spécifiques.
          </li>
        </ul>

        <div className="callout">
          <strong>Cascade des filtres</strong> : Les filtres Segment → Famille → Sous-famille sont liés.
          Changer un niveau supérieur réinitialise automatiquement les niveaux inférieurs et met à jour les options disponibles.
          Le filtre Acheteur fonctionne de manière totalement indépendante.
        </div>

        <h2>3) Choisir la matrice affichée</h2>
        <p>Deux matrices stratégiques sont disponibles, sélectionnables via les boutons de la barre d'outils :</p>
        <ul>
          <li>
            <strong>Matrice O/R — Opportunités / Risques</strong> : positionne chaque famille selon ses scores d'opportunités (axe Y) et de risques (axe X).
            Les quatre quadrants délimitent des catégories d'achats : <em>Stratégique</em>, <em>Critique</em>, <em>Levier</em> et <em>Simple</em>.
          </li>
          <li>
            <strong>Matrice Contraintes</strong> : positionne chaque famille selon ses scores de Contraintes Internes (CI) et Contraintes Externes (CE).
            Les quadrants correspondent à : <em>Achats Internes</em>, <em>Achats Difficiles</em>, <em>Achats Simples</em> et <em>Achats Externes</em>.
          </li>
        </ul>

        <h2>4) Lire les bulles</h2>
        <p>Chaque famille d'achat est représentée par une bulle colorée sur la matrice :</p>
        <ul>
          <li>
            <strong>Position</strong> : déterminée par les scores associés à la famille (issus du fichier importé).
          </li>
          <li>
            <strong>Taille</strong> : proportionnelle au montant budgétaire (k€) associé à la famille.
            Une grande bulle indique un enjeu financier plus important.
          </li>
          <li>
            <strong>Couleur</strong> : chaque famille se voit attribuer une couleur distincte, cohérente avec la légende.
          </li>
          <li>
            <strong>Numéro</strong> : le chiffre affiché à l'intérieur correspond au numéro de la légende.
            En mode plein écran, le nom complet s'affiche également sous la bulle.
          </li>
        </ul>

        <div className="callout">
          <strong>Nom affiché</strong> : La bulle affiche en priorité la <em>sous-famille</em> si elle est renseignée, sinon la <em>famille</em>.
          Dans le tableau de données, la colonne <strong>Famille</strong> correspond toujours à la famille d'achat, tandis que la colonne <strong>Sous-famille</strong> donne le détail.
        </div>

        <h2>5) Interagir avec les bulles</h2>
        <p>Un clic sur une bulle (ou sur la ligne correspondante dans le tableau) la <strong>sélectionne</strong> :</p>
        <ul>
          <li>La bulle est mise en évidence avec un contour blanc épais.</li>
          <li>Un panneau latéral s'ouvre à droite et affiche le détail de la famille : nom, segment, sous-famille, acheteur, montant et scores.</li>
          <li>Un second clic sur la même bulle désélectionne l'élément.</li>
        </ul>

        <h2>6) Mode Plein Écran</h2>
        <p>
          Pour améliorer la lisibilité sur grand écran ou en présentation, cliquez sur le bouton <strong>Plein Écran</strong> (icône agrandir, à droite de la barre d'outils de la matrice).
        </p>
        <ul>
          <li>La matrice occupe toute la surface de l'écran avec une résolution augmentée.</li>
          <li>Les noms complets de chaque famille apparaissent directement sous chaque bulle.</li>
          <li>Le montant (k€) est également affiché à l'intérieur de chaque bulle.</li>
          <li>La <strong>légende numérotée</strong> s'affiche dans un panneau scrollable à droite : chaque entrée est cliquable pour sélectionner la famille correspondante.</li>
          <li>Les boutons <strong>Matrice O/R</strong> et <strong>Matrice Contraintes</strong> restent accessibles en haut de l'overlay pour basculer d'une vue à l'autre.</li>
        </ul>
        <p>
          Pour fermer le mode plein écran : cliquez sur le bouton <strong>✕</strong> en haut à droite ou appuyez sur la touche <kbd>Échap</kbd>.
        </p>

        <h2>7) Tableau de données</h2>
        <p>
          Sous les matrices, un tableau récapitulatif liste l'ensemble des familles filtrées :
        </p>
        <ul>
          <li><strong>Famille</strong> — nom de la famille d'achat (colonne sticky à gauche).</li>
          <li><strong>Sous-famille</strong> — granularité fine.</li>
          <li><strong>Segment</strong> — niveau macro.</li>
          <li><strong>Acheteur</strong> — responsable désigné.</li>
          <li><strong>Montant (k€)</strong> — budget estimé.</li>
          <li><strong>Risques / Opportunités</strong> — scores globaux.</li>
          <li><strong>CI / CE</strong> — scores de contraintes internes et externes.</li>
          <li><strong>Couverture contractuelle</strong> — niveau de couverture du portefeuille.</li>
          <li><strong>Position</strong> — quadrant stratégique calculé automatiquement.</li>
        </ul>
        <p>Un clic sur une ligne sélectionne la famille correspondante sur la matrice.</p>

        <h2>8) Rafraîchir les données</h2>
        <p>
          Si des données ont été mises à jour depuis l'ouverture de la page, cliquez sur le bouton <strong>Actualiser</strong> (icône rafraîchissement) pour recharger les dernières données depuis la base.
        </p>

      </div>
    </ModeOpLayout>
  );
};

export default ModeOpVisuPortefeuille;
