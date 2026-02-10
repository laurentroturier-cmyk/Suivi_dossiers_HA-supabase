# 📋 Module TODO Liste - Gestion des Tâches par Procédure

## Vue d'ensemble

Le module TODO Liste permet de gérer les tâches associées à chaque procédure. Chaque procédure dispose de sa propre liste de tâches avec suivi complet : assignation, échéances, statuts et dates de réalisation.

## 🎯 Fonctionnalités

### Gestion des Tâches
- ✅ **Création de tâches** avec toutes les informations nécessaires
- ✅ **Modification** des tâches existantes
- ✅ **Suppression** des tâches
- ✅ **Numérotation automatique** des tâches
- ✅ **Changement rapide de statut** via checkbox

### Informations de Tâche
Chaque tâche contient :
- **N°** : Numéro automatique de la tâche
- **Titre** : Description de la tâche
- **Assigné à** : Personne responsable
- **Échéance** : Date limite
- **Statut** : En attente / En cours / Terminée
- **Date de réalisation** : Date effective de completion
- **Notes** : Commentaires additionnels

### Statistiques en Temps Réel
- **Total** : Nombre total de tâches
- **En attente** : Tâches non démarrées
- **Terminées** : Tâches complétées
- **En retard** : Tâches dépassant l'échéance

### Recherche & Filtrage
- Recherche en temps réel sur titre, assigné et notes
- Filtrage instantané des résultats

### Exports
- **Export Excel** : Fichier .xlsx avec toutes les données
- **Export PDF** : Rapport formaté avec statistiques et tableau

### Interface
- 🎨 Design moderne avec dégradés et animations
- 📱 Responsive (mobile, tablette, desktop)
- 🌓 Support du mode sombre
- ⚡ Interface pleine page avec retour arrière
- 🔔 Alertes visuelles pour les tâches en retard

## 🚀 Utilisation

### 1. Accéder à la TODO Liste

Dans le tableau des **Procédures** :
1. Localisez la procédure souhaitée
2. Cliquez sur le bouton **TODO** (icône checklist amber) dans la colonne Actions
3. La TODO liste s'ouvre en plein écran

### 2. Créer une Tâche

1. Cliquez sur le bouton **"Nouvelle tâche"** (vert, en haut à droite)
2. Remplissez le formulaire :
   - Titre de la tâche **(requis)**
   - Assigné à **(requis)**
   - Échéance **(requis)**
   - Statut (par défaut "En attente")
   - Date de réalisation (optionnel)
   - Notes (optionnel)
3. Cliquez sur **"Créer"**

### 3. Modifier une Tâche

1. Dans le tableau, cliquez sur l'icône **"Modifier"** (crayon bleu)
2. Modifiez les informations souhaitées
3. Cliquez sur **"Modifier"** pour sauvegarder

### 4. Changer le Statut Rapidement

- Cliquez sur la **checkbox** (cercle) à gauche du numéro
- La tâche basculera entre "En attente" et "Terminée"
- La date de réalisation est automatiquement remplie

### 5. Supprimer une Tâche

1. Cliquez sur l'icône **"Supprimer"** (corbeille rouge)
2. Confirmez la suppression

### 6. Exporter les Tâches

1. Cliquez sur le bouton **"Exporter"**
2. Choisissez :
   - **Export Excel** : Pour analyse dans un tableur
   - **Export PDF** : Pour impression ou archivage

Le fichier sera automatiquement téléchargé avec le nom :
`TODO_Procedure_[NumProc]_[Date].xlsx/pdf`

### 7. Rechercher des Tâches

- Utilisez la barre de recherche en haut
- Tapez n'importe quel terme (titre, assigné, notes)
- Les résultats sont filtrés instantanément

### 8. Retour aux Procédures

- Cliquez sur le bouton **"Retour"** en haut à gauche
- Vos modifications sont automatiquement sauvegardées

## 💾 Stockage des Données

### Base de données Supabase

Les tâches sont stockées dans la table `procedures`, colonne `TODOlisteP` au format JSON.

#### Structure SQL

```sql
-- Colonne dans la table procedures
ALTER TABLE procedures 
ADD COLUMN IF NOT EXISTS "TODOlisteP" TEXT;
```

#### Format JSON

```json
[
  {
    "id": "1234567890",
    "numero": 1,
    "titre": "Rédiger le CCAP",
    "assigne_a": "Jean Dupont",
    "echeance": "2024-03-15",
    "statut": "en-cours",
    "date_realisation": "",
    "notes": "Vérifier les clauses particulières"
  }
]
```

### Migration

Pour ajouter la colonne à votre base existante, exécutez le script SQL :
```bash
/sql/add-todo-column.sql
```

## 🎨 Interface Utilisateur

### Statistiques (Haut de page)
- 4 cartes avec dégradés de couleur
- Mise à jour en temps réel
- Icônes illustratives

### Tableau
- En-têtes fixes lors du défilement
- Tri par colonne (à venir)
- Actions groupées par ligne
- Indicateurs visuels pour tâches en retard

### Formulaire Modal
- Modal centré avec overlay
- Validation des champs requis
- Boutons désactivés si données invalides
- Feedback visuel lors de l'enregistrement

## 🔐 Sécurité

- Les tâches sont liées à une procédure spécifique via `IDProjet`
- Seuls les utilisateurs authentifiés peuvent accéder aux TODO listes
- Les modifications sont sauvegardées en temps réel dans Supabase
- Politique RLS à configurer si nécessaire

## 🛠️ Architecture Technique

### Composant Principal
`/components/TodoListeProcedure.tsx`

### Props du Composant
```typescript
interface TodoListeProcedureProps {
  procedureId: string;        // ID de la procédure
  procedureNumero: string;    // Numéro de la procédure (affichage)
  onBack: () => void;         // Callback pour retour arrière
}
```

### État Local
```typescript
const [tasks, setTasks] = useState<TodoTask[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [showAddModal, setShowAddModal] = useState(false);
const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
```

### Dépendances
- `lucide-react` : Icônes
- `xlsx` : Export Excel
- `jspdf` + `jspdf-autotable` : Export PDF
- `@supabase/supabase-js` : Base de données

## 📦 Intégration

### Dans App.tsx

```typescript
// Import
import { TodoListeProcedure } from './components/TodoListeProcedure';

// État
const [showTodoListe, setShowTodoListe] = useState(false);
const [selectedProcedureTodo, setSelectedProcedureTodo] = useState<any>(null);

// Bouton dans le tableau des procédures
{activeTab === 'procedures' && (
  <button 
    onClick={() => { 
      setSelectedProcedureTodo(item); 
      setShowTodoListe(true); 
    }} 
    className="p-2.5 rounded-xl transition-all text-amber-600 bg-amber-50"
  >
    {/* Icône TODO */}
  </button>
)}

// Affichage du composant
{showTodoListe && selectedProcedureTodo && (
  <TodoListeProcedure
    procedureId={getProp(selectedProcedureTodo, 'IDProjet')}
    procedureNumero={getProp(selectedProcedureTodo, 'NumProc')}
    onBack={() => {
      setShowTodoListe(false);
      setSelectedProcedureTodo(null);
    }}
  />
)}
```

## 🎯 Cas d'Usage

### 1. Suivi de Projet
- Décomposer une procédure en tâches
- Assigner les responsabilités
- Suivre l'avancement

### 2. Respect des Délais
- Définir des échéances claires
- Identifier les retards
- Prioriser les actions

### 3. Collaboration
- Savoir qui fait quoi
- Partager l'information
- Coordonner les efforts

### 4. Reporting
- Exporter pour réunions
- Archiver l'historique
- Analyser les performances

## ⚠️ Points d'Attention

### Performance
- Les tâches sont chargées au montage du composant
- Sauvegarde à chaque modification (optimisation possible avec debounce)
- Limite recommandée : ~100 tâches par procédure

### Validation
- Titre, assigné et échéance sont obligatoires
- Les dates sont au format YYYY-MM-DD
- Le statut est contraInt à 3 valeurs

### Export PDF
- Utilise jsPDF avec autoTable
- Police par défaut (amélioration possible)
- Mise en page A4 portrait

## 🚀 Évolutions Futures

### Fonctionnalités
- [ ] Pièces jointes par tâche
- [ ] Commentaires et historique
- [ ] Notifications par email
- [ ] Sous-tâches
- [ ] Templates de tâches
- [ ] Import depuis Excel

### Interface
- [ ] Tri par colonne
- [ ] Sélection multiple pour actions groupées
- [ ] Vue Kanban (tableau)
- [ ] Vue calendrier
- [ ] Glisser-déposer pour réorganiser

### Intégration
- [ ] Synchronisation avec Outlook/Google Calendar
- [ ] Export vers MS Project
- [ ] API REST pour intégrations tierces

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation Supabase
2. Vérifiez les logs de la console navigateur
3. Contrôlez les permissions RLS dans Supabase

## 📄 Fichiers du Module

```
/components/TodoListeProcedure.tsx    # Composant principal
/sql/add-todo-column.sql              # Script SQL migration
/README_TODO_LISTE.md                 # Cette documentation
```

---

**Version** : 1.0.0  
**Date** : 2026-02-10  
**Auteur** : GitHub Copilot
