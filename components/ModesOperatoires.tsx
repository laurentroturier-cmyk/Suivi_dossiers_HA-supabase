import React from 'react';
import ModeOpLayout from './ModeOpLayout';

interface Props {
  onNavigate?: (tab: string) => void;
}

const ModesOperatoires: React.FC<Props> = ({ onNavigate }) => {
  return (
    <ModeOpLayout
      title="Manuel Utilisateur (Profil Acheteur)"
      subtitle="Modules Projets & Procédures"
      objective="Consultation, recherche, filtres, export et création de procédures."
      onNavigate={onNavigate}
    >
      <div className="manual-content">
        <h2>1) Objectif</h2>
        <p>Ce guide explique, pour un profil <strong>Acheteur</strong>, comment :</p>
        <ul>
          <li>Consulter et retrouver rapidement un <strong>projet</strong> ou une <strong>procédure</strong></li>
          <li>Utiliser les <strong>recherches</strong> et <strong>filtres</strong></li>
          <li><strong>Exporter</strong> les données (Excel)</li>
          <li>Créer une <strong>nouvelle procédure</strong> (si autorisé)</li>
          <li>Consulter les <strong>détails</strong> d’une procédure</li>
        </ul>

        <h2>2) Pré-requis (profil Acheteur)</h2>
        <ul>
          <li>Être <strong>connecté</strong> avec un compte Acheteur.</li>
          <li>Selon la configuration, l’application peut appliquer un <strong>filtre Acheteur par défaut</strong> (votre nom) et limiter la visibilité.</li>
        </ul>

        <h2>3) Module Projets</h2>
        <h3>3.1 Accéder au module</h3>
        <p>Ouvrir l’écran <strong>Projets</strong>.</p>

        <h3>3.2 Comprendre l’écran</h3>
        <p>Vous retrouvez :</p>
        <ul>
          <li>Un titre <strong>“Projets”</strong> et une courte description</li>
          <li>Une barre d’actions avec :
            <ul>
              <li>un champ <strong>Rechercher un projet…</strong></li>
              <li>un bouton <strong>Exporter</strong></li>
            </ul>
          </li>
          <li>Une table listant les projets (ID, objet, acheteur, statut) avec l’action <strong>Modifier</strong></li>
        </ul>

        <h3>3.3 Rechercher un projet</h3>
        <ol>
          <li>Dans <strong>“Rechercher un projet…”</strong>, saisissez un mot-clé.</li>
          <li>La recherche se déclenche à partir de <strong>2 caractères</strong>.</li>
        </ol>
        <div className="callout">
          <strong>Conseil</strong> : privilégiez l’<strong>ID Projet</strong> si vous l’avez. Sinon, utilisez un mot du champ <strong>Objet</strong>.
        </div>

        <h3>3.4 Exporter la liste (Excel)</h3>
        <ol>
          <li>Cliquez sur <strong>Exporter</strong>.</li>
          <li>Un fichier <code>.xlsx</code> est téléchargé (ex. <code>projets_YYYY-MM-DD.xlsx</code>).</li>
        </ol>
        <div className="warning">
          <strong>Important</strong> : l’export correspond à la <strong>liste affichée</strong> (si une recherche est active, l’export reflète ce filtre).
        </div>

        <h3>3.5 Modifier un projet</h3>
        <ol>
          <li>Sur la ligne du projet, cliquez sur <strong>Modifier</strong>.</li>
          <li>Vous passez en écran/état d’édition (selon le paramétrage de l’application).</li>
        </ol>

        <h2>4) Module Procédures</h2>
        <h3>4.1 Accéder au module</h3>
        <p>Ouvrir l’écran <strong>Procédures</strong>.</p>

        <h3>4.2 Rechercher une procédure (liste)</h3>
        <ol>
          <li>Dans le champ <strong>Recherche</strong> (ex. “N° Procédure…”), saisissez un identifiant :</li>
        </ol>
        <ul>
          <li><strong>NumProc</strong> (identifiant interne), ou</li>
          <li><strong>Numéro de procédure (Afpa)</strong>.</li>
        </ul>
        <div className="callout">
          <strong>Note</strong> : si vous n’avez qu’un <strong>numéro court</strong> (5 chiffres), voir § 4.6.
        </div>

        <h3>4.3 Filtrer les procédures</h3>
        <p>Filtres fréquents (selon l’écran) :</p>
        <ul>
          <li><strong>Acheteur</strong></li>
          <li><strong>Statut</strong> (statut de la consultation)</li>
          <li><strong>Année lancement</strong></li>
          <li><strong>Année remise offres</strong></li>
        </ul>
        <div className="callout">
          <strong>Bonnes pratiques</strong> : combinez “Acheteur” + “Statut”, puis ajoutez une année si besoin.
        </div>

        <h3>4.4 Réinitialiser (Reset)</h3>
        <p>Quand des filtres/recherches sont actifs, cliquez sur <strong>Reset</strong> pour revenir à une vue non filtrée.</p>

        <h3>4.5 Créer une nouvelle procédure (si autorisé)</h3>
        <ol>
          <li>Cliquez sur <strong>Nouvelle Procédure</strong>.</li>
          <li>Un identifiant <strong>NumProc</strong> est généré au format <strong>PR####</strong> (ex. <code>PR0007</code>).</li>
          <li>Complétez les champs essentiels puis sauvegardez.</li>
        </ol>
        <div className="warning">
          <strong>Droits</strong> : certaines mises à jour peuvent être restreintes. En cas de blocage, contactez un administrateur.
        </div>

        <h3>4.6 Saisir une procédure via numéro court (5 chiffres)</h3>
        <p>Certains écrans (ex. DCE/RC) proposent un champ “numéro court”.</p>
        <ul>
          <li>Le numéro doit contenir <strong>exactement 5 chiffres</strong> (ex. <code>26008</code>).</li>
          <li>Dès <strong>2 caractères</strong>, des <strong>suggestions</strong> peuvent apparaître.</li>
          <li>À <strong>5 chiffres</strong> :
            <ul>
              <li>✅ Procédure trouvée → confirmation (titre affiché)</li>
              <li>❌ Non trouvée / format invalide → message d’erreur</li>
            </ul>
          </li>
        </ul>
        <div className="callout">
          <strong>Astuce</strong> : si vous ne trouvez pas via numéro court, tentez la recherche dans la liste Procédures via <strong>NumProc</strong> ou <strong>N° Afpa</strong>.
        </div>

        <h3>4.7 Consulter le détail d’une procédure</h3>
        <p>Selon les écrans, un détail peut s’ouvrir et présenter des onglets :</p>
        <ul>
          <li>Informations générales</li>
          <li>Marché et procédure</li>
          <li>Dates</li>
          <li>Performance et RP</li>
        </ul>

        <h2>5) Messages fréquents</h2>
        <ul>
          <li><strong>“Aucun projet trouvé”</strong> : élargir la recherche, vérifier l’orthographe, essayer l’ID.</li>
          <li><strong>“Format invalide (5 chiffres)”</strong> : saisir uniquement des chiffres, longueur = 5.</li>
          <li><strong>“Aucune procédure trouvée…”</strong> : vérifier le numéro, essayer par NumProc / N° Afpa.</li>
          <li><strong>Erreur / droits insuffisants</strong> : certaines actions peuvent nécessiter un rôle admin.</li>
        </ul>

        <h2>6) Bonnes pratiques</h2>
        <ul>
          <li>Commencer par un identifiant (ID Projet / NumProc / N° Afpa) quand disponible.</li>
          <li>Limiter les filtres à l’essentiel pour éviter de masquer des résultats.</li>
          <li>Exporter après avoir appliqué les filtres pertinents (l’export reflète la vue).</li>
        </ul>

        <h2>7) Support</h2>
        <p>En cas de difficulté, notez :</p>
        <ul>
          <li>l’identifiant (ID projet / NumProc / N° Afpa / numéro court)</li>
          <li>le message d’erreur affiché</li>
        </ul>
        <p className="small">Puis contactez l’administrateur de l’application.</p>
      </div>
    </ModeOpLayout>
  );
};

export default ModesOperatoires;
