import React from 'react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModeOpExecution: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="Suivi des Contrats"
      subtitle="Module Exécution des marchés"
      objective="Suivre l'exécution financière et la performance des contrats notifiés en cours d'exécution."
      onNavigate={onNavigate}
    >
      <div className="manual-content">
        <h2>1) Le Suivi des Contrats</h2>
        <p>L'onglet <strong>Contrats</strong> vous offre une vision centralisée des marchés notifiés et en cours d'exécution.</p>
        
        <ol>
          <li><strong>Import et Synchronisation</strong> : Si l'application détecte un manque de données en base, une zone de dépôt vous invitera à charger un fichier d'extraction Excel / CSV des contrats pour initialiser le module. Autrement, les contrats présents dans Supabase s'afficheront.</li>
          <li><strong>Indicateurs Globaux (KPI)</strong> : En haut de page, le dashboard résume instantanément :
            <ul>
              <li>Le <strong>Montant Engagé</strong> total contre le <strong>Montant Consommé</strong> (avec un calcul automatique du % moyen de consommation de votre portefeuille).</li>
              <li>Le nombre de <strong>contrats ouverts</strong>.</li>
            </ul>
          </li>
          <li><strong>La Table des Contrats</strong> : Vous pouvez filtrer ces données (par Acheteur, Statut, Fournisseur, Client interne, Année).</li>
        </ol>

        <div className="callout">
          <strong>Analyse Visuelle</strong> : Si vous cliquez sur une part du graphique "Répartition par Statut", le tableau se filtrera automatiquement pour ne lister que les contrats concernés (fonctionnalité de Cross-Filtering).
        </div>

        <h2>2) Consulter le détail d'un Contrat</h2>
        <p>En cliquant sur la ligne d'un contrat dans le tableau, une fiche détaillée s'ouvre :</p>
        <ul>
          <li><strong>Jauges de suivi</strong> : Vous y trouverez visuellement le pourcentage de montant consommé et le pourcentage de temps écoulé. Ceci permet de détecter rapidement les marchés qui s'épuisent plus vite que prévu !</li>
          <li><strong>Informations Fournisseur</strong> : Retrouvez le contact signataire, le site, et l'identifiant DUNS.</li>
        </ul>
      </div>
    </ModeOpLayout>
  );
};

export default ModeOpExecution;
