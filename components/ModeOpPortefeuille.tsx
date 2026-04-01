import React from 'react';
import { ArrowLeft } from 'lucide-react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpPortefeuille: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="Analyse IT"
      subtitle="Module Indicateurs & Pilotage"
      objective="Permettre à l'acheteur d'analyser la maturité et les contraintes d'une famille d'achats, et de consolider un mapping stratégique des achats de l'entité."
      onNavigate={onNavigate}
    >
      <div className="manual-content">
        <h2>1) Comprendre l'arborescence</h2>
        <p>L'analyse de portefeuille est toujours rattachée à une nomenclature hiérarchique :</p>
        <ul>
          <li><strong>Segment</strong> (Macro)</li>
          <li><strong>Famille ACHAT</strong> (Standard)</li>
          <li><strong>Sous-famille ACHAT</strong> (Micro)</li>
        </ul>
        <ol>
          <li>Pour amorcer votre travail, sélectionnez le <strong>Niveau d'analyse</strong> souhaité en haut de l'écran (généralement "Famille").</li>
          <li>Recherchez le nom de la famille dans la barre latérale gauche (avec le champ recherche) et cliquez dessus.</li>
        </ol>

        <div className="callout">
          <strong>Information</strong> : Une pastille de statut s'affiche à côté de chaque famille :
          <br/>🔴 (Vide) - 🟠 (Partiellement remplie) - 🟢 (Complète). Votre objectif stratégique est de verdir votre périmètre d'achats !
        </div>

        <h2>2) Remplir la fiche de Segment / Famille</h2>
        <p>Le panneau de droite comporte 6 écrans (onglets) de saisies d'informations, accessibles par le menu d'icônes horizontal au-dessus des données :</p>
        
        <h3>2.1 Données</h3>
        <p>Saisissez les principales macros d'informations : Chiffre d'Affaires associé (k€), le Budget prévisionnel, et le volume d'activité (nombre de commandes annuelles et nombre de fournisseurs référencés). Vous disposez aussi d'un champ bloc-notes libre.</p>

        <h3>2.2 Évaluation de la couverture contractuelle</h3>
        <p>Attribuez une note globale (sécurisé, moyen, faible...) et notez sur 5 les axes spécifiques de vos contrats (clauses, pénalités, SLA). Des exemples de plans d'action de sécurisation y sont proposés.</p>

        <h3>2.3 Contraintes (Matrice de Kraljic simplifiée)</h3>
        <p>Renseignez 4 sous-parties pour calculer les scores d'incidents technologiques et concurrentiels :</p>
        <ul>
          <li><strong>CIT</strong> : Contraintes Internes (Technique) & <strong>CIC</strong> : Contraintes Internes (Commerciales) basent la dépendance interne.</li>
          <li><strong>CET / CEC</strong> basent la difficulté du marché fournisseur, soit les freins Externes.</li>
        </ul>
        <p>Pour chaque assertion, de 0 à 5, qualifiez la famille de l'achat. Ceci placera dynamiquement l'achat en quadrant (Achats "Simples", "Difficiles", "Externes" ou "Internes").</p>

        <h3>2.4 Matrice des Risques / Matrice des Opportunités</h3>
        <p>Pour chaque ligne de risque (ex: "Volatilité des prix" dans le thème Économique), réglez deux jauges : <strong>Probabilité (0-5)</strong> et <strong>Délai/Gravité (0-5)</strong>.</p>
        <p>Les mêmes évaluations de 0 à 5 s'appliquent sur l'onglet <strong>Opportunités</strong> (Economie, Marché, Performance, RSE, Stratégie...).</p>

        <h3>2.5 Analyse S.W.O.T.</h3>
        <p>Ajoutez des "puces" explicites pour qualifier vos :
           <strong>S (Forces)</strong>, <strong>W (Faiblesses)</strong>, <strong>O (Opportunités)</strong> et <strong>T (Menaces/Risques)</strong> concernant cette famille d'achat dans le texte libre de synthèse.</p>

        <h2>3) Exploiter la Synthèse et les Matrices</h2>
        <p>En basculant le menu de navigation complètement <strong>à gauche, avec les gros boutons d'onglets principaux</strong> :</p>
        
        <ol>
          <li>Cliquer sur <strong>Matrice Portefeuille</strong> : Vous visualiserez votre/vos famille(s) placées dynamiquement sur une matrice Contraintes Internes / Contraintes Externes, déterminant le positionnement achat.</li>
          <li>Cliquer sur <strong>Matrice Opp/Risque</strong> : Place la famille sur un graphique de faisabilité stratégique et de priorité d'action de l'équipe achats.</li>
          <li>Cliquer sur <strong>Synthèse Globale</strong> pour consulter tous les scores combinés, ainsi qu'une vue consolidée de vos notes "S.W.O.T" affichée dans des cartes synthétiques.</li>
        </ol>

        <h2>4) Sauvegarde et Import/Export</h2>
        <ol>
          <li><strong>Base de données distante</strong> : À chaque saisie et après 10 secondes d'inactivité, l'application sauvegarde automatiquement sur le serveur Supabase votre analyse (notification "Sauvegardé à HH:mm" visible).</li>
          <li><strong>Import/Export JSON</strong> : Un moyen rapide de dupliquer votre travail, ou de faire un backup de vos saisies actuelles dans un fichier texte structuré lisible par une autre session du logiciel.</li>
          <li><strong>Import Excel</strong> : Conçu pour les analystes voulant écraser un volume massif de contraintes directement depuis un template fourni. <em>Réservé aux profils avancés</em>.</li>
        </ol>

        <div className="warning">
          <strong>Attention</strong> : Si vous modifiez massivement vos évaluations sans connexion internet active à l'application, l'autosave distante pourrait échouer, bien que persistante dans le navigateur. Privilégiez un export JSON si le réseau doute.
        </div>
      </div>
    </ModeOpLayout>
  );
};

export default ModeOpPortefeuille;
