import React from 'react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpTdb: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="Tableau de bord Achats"
      subtitle="Module Indicateurs & Pilotage"
      objective="Analyser, filtrer et exporter les données achats (dépenses, commandes, fournisseurs) à partir de fichiers Excel ou CSV."
      onNavigate={onNavigate}
    >
      <div className="manual-content">
        <h2>1) Importation des données</h2>
        <p>Pour commencer l'analyse, vous devez charger vos données brutes dans l'application :</p>
        <ol>
          <li>À l'ouverture du Tableau de bord, une <strong>zone de dépôt (UploadZone)</strong> apparaît si aucune donnée n'est en mémoire.</li>
          <li>Glissez-déposez un ou plusieurs fichiers <strong>Excel (.xlsx)</strong> ou <strong>CSV</strong>, ou cliquez pour parcourir vos dossiers.</li>
          <li>Cliquez sur le bouton <strong>Analyser les données de X fichier(s)</strong>.</li>
          <li>L'application va lire les fichiers, initier une base de données locale sécurisée et compiler les informations importantes.</li>
        </ol>

        <div className="callout">
          <strong>Note</strong> : Les données traitées restent sur votre navigateur. Aucune donnée sensible n'est envoyée ou stockée sur le serveur pour cette fonctionnalité.
        </div>

        <h2>2) Navigation dans le Tableau de bord</h2>
        <p>Une fois les données chargées, vous arrivez sur l'écran d'analyse composé de plusieurs éléments :</p>
        
        <h3>2.1 La barre d'actions (en haut)</h3>
        <ul>
          <li><strong>Indicateur de fraîcheur</strong> : Affiche la date de la dernière mise à jour de vos données. Vous pouvez cliquer sur "Mettre à jour via de nouveaux fichiers" pour ajouter ou écraser des données.</li>
          <li><strong>Télécharger le rapport (PDF)</strong> : Génère un rapport PDF complet incluant les KPIs et graphiques actifs.</li>
          <li><strong>Rafraîchir</strong> : Recharge les graphiques à partir de la base locale.</li>
          <li><strong>Purger les données</strong> : Supprime définitivement l'ensemble des données chargées et vous ramène à l'écran d'importation.</li>
          <li><strong>+ Charger d'autres fichiers</strong> : Permet de compléter vos analyses actuelles avec d'autres données.</li>
        </ul>

        <h3>2.2 La barre de filtres</h3>
        <p>Les filtres vous permettent d'isoler des dépenses spécifiques. Dès qu'un filtre est changé, tous les indicateurs se mettent à jour instantanément.</p>
        <ul>
          <li><strong>Filtres disponibles</strong> : Trimestre, Famille, Fournisseur, Région (entité), Statut, Catégorie.</li>
          <li><strong>RAZ</strong> : Cliquez sur ce bouton pour réinitialiser tous les filtres à zéro.</li>
        </ul>

        <h2>3) Visualisations et Onglets (Tabs)</h2>
        <p>L'écran principal propose 6 vues distinctes pour analyser vos données.</p>
        
        <ol>
          <li><strong>Vue d'ensemble</strong> : Affiche vos principaux KPIs (Chiffre d'Affaires total, Montant commandé, Nb Fournisseurs) et des graphiques généraux sur l'évolution globale.</li>
          <li><strong>Familles & Catégories</strong> : Analyse la répartition des achats par typologie (ex: Informatique, Prestations Intellectuelles). Utile pour repérer les dépenses majoritaires.</li>
          <li><strong>Fournisseurs</strong> : Offre la vision des fournisseurs de rang 1, le "Top 10", la "Longue traîne" et la dépendance économique.</li>
          <li><strong>Entités & Régions</strong> : Répartition des achats selon la géographie ou le centre de profit / coût.</li>
          <li><strong>Analyses Régul & Appro</strong> : Permet de contrôler le processus Procure-to-Pay (taux de couverture contrats, suivi des commandes sans factures, etc.).</li>
          <li><strong>Données détaillées</strong> : Un tableau sous forme de tableur qui liste toutes les lignes individuelles de dépense pour un export éventuel ou une recherche très précise.</li>
        </ol>

        <h2>4) Bonnes pratiques</h2>
        <div className="warning">
          <strong>Confidentialité</strong> : Pensez à <strong>Purger les données</strong> lorsque vous quittez votre poste si vous avez injecté des informations sensibles ou un grand volume de CA.
        </div>
        <ul>
          <li>Sélectionnez un ou deux filtres précis (ex: "Trimestre = T1" et "Famille = IT") avant de générer votre export PDF pour un reporting ciblé.</li>
          <li>Assurez-vous que vos fichiers de base contiennent bien les entêtes standardisés attendus par l'application pour une lecture automatique optimale.</li>
        </ul>
      </div>
    </ModeOpLayout>
  );
};

export default ModeOpTdb;
