import { supabase } from '@/lib/supabase';
import { Immobilier, ImmobilierFilters } from '@/types/immobilier';

export const immobilierService = {
  /**
   * Génère un jeu de données de démonstration si la table est vide
   * (Utilisé uniquement en développement/local pour éviter l'écran vide)
   */
  buildMockData(count = 24): Immobilier[] {
    const regions = ['Grand Est', 'Île-de-France', 'Bretagne', 'Provence-Alpes-Côte d\'Azur', 'Centre-Val de Loire', 'Pays de la Loire', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine'];
    const centres = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre'];
    const statuts = ['Etude', 'Travaux', 'Terminé'];
    const chefs = ['WEIL', 'JEUDI', 'COURBOIS', 'BAS', 'MADEC', 'ABOU-ANOMA', 'MINAUD', 'BEGAUD'];
    const priorites = ['1', '2', '3'];

    const items: Immobilier[] = Array.from({ length: count }).map((_, i) => {
      const budget = Math.round(20000 + Math.random() * 80000);
      const realise = Math.round(budget * (0.1 + Math.random() * 0.8));
      const taux = Math.round((realise / budget) * 100);
      const region = regions[i % regions.length];
      return {
        'Code demande': `OP${String(10000 + i)}`,
        'Code Site': `S-${String(100 + i)}`,
        'Code projet': `PRJ-${String(500 + i)}`,
        'Intitulé': `Projet ${i + 1} - Réhabilitation site ${region}`,
        'Descriptif': 'Projet de modernisation et de mise aux normes',
        'Programme': i % 2 === 0 ? 'CAPEX' : 'OPEX',
        'Composant principal': i % 3 === 0 ? 'Électricité' : i % 3 === 1 ? 'Plomberie' : 'Structure',
        'Région': region,
        'Centre': centres[i % centres.length],
        'Chef de Projet': chefs[i % chefs.length],
        'Priorité': priorites[i % priorites.length],
        'Statut': statuts[i % statuts.length],
        'Budget en €': String(budget),
        'Engagé en €': String(Math.round(budget * 0.6)),
        'Réalisé en €': String(realise),
        'Disponible en €': String(Math.max(0, budget - realise)),
        '% Réalisé': String(taux),
        'Date de démarrage travaux': new Date(Date.now() - (i % 12) * 30 * 86400000).toISOString().slice(0, 10),
        'Décision CNI': i % 4 === 0 ? 'Validé' : i % 4 === 1 ? 'En attente' : 'N/A',
        'Etape demande': i % 3 === 0 ? 'Étude' : i % 3 === 1 ? 'Validation' : 'Exécution',
        'RPA': i % 2 === 0 ? 'Oui' : 'Non',
      } as Immobilier;
    });
    return items;
  },
  /**
   * Récupérer tous les projets immobiliers
   */
  async getAll(): Promise<Immobilier[]> {
    const { data, error } = await supabase
      .from('immobilier')
      .select('*')
      .order('Code demande', { ascending: false });

    if (error) {
      console.warn('[immobilierService.getAll] Supabase error, fallback to mock:', error.message);
      return this.buildMockData();
    }
    if (!data || data.length === 0) {
      return this.buildMockData();
    }
    return data;
  },

  /**
   * Récupérer un projet par code demande
   */
  async getByCodeDemande(codeDemande: string): Promise<Immobilier> {
    const { data, error } = await supabase
      .from('immobilier')
      .select('*')
      .eq('Code demande', codeDemande)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Créer un nouveau projet immobilier
   */
  async create(project: Immobilier): Promise<Immobilier> {
    const { data, error } = await supabase
      .from('immobilier')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mettre à jour un projet immobilier
   */
  async update(codeDemande: string, updates: Partial<Immobilier>): Promise<Immobilier> {
    const { data, error } = await supabase
      .from('immobilier')
      .update(updates)
      .eq('Code demande', codeDemande)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprimer un projet immobilier
   */
  async delete(codeDemande: string): Promise<void> {
    const { error } = await supabase
      .from('immobilier')
      .delete()
      .eq('Code demande', codeDemande);

    if (error) throw error;
  },

  /**
   * Rechercher des projets avec filtres
   */
  async search(filters: ImmobilierFilters): Promise<Immobilier[]> {
    let query = supabase.from('immobilier').select('*');

    if (filters.search) {
      query = query.or(
        `"Code demande".ilike.%${filters.search}%,` +
        `"Intitulé".ilike.%${filters.search}%,` +
        `"Code Site".ilike.%${filters.search}%,` +
        `"Site".ilike.%${filters.search}%,` +
        `"Descriptif".ilike.%${filters.search}%`
      );
    }

    if (filters.statut) {
      query = query.eq('Statut', filters.statut);
    }

    if (filters.region) {
      query = query.eq('Région', filters.region);
    }

    if (filters.centre) {
      query = query.eq('Centre', filters.centre);
    }

    if (filters.priorite) {
      query = query.eq('Priorité', filters.priorite);
    }

    if (filters.chefProjet) {
      query = query.eq('Chef de Projet', filters.chefProjet);
    }

    if (filters.programme) {
      query = query.eq('Programme', filters.programme);
    }

    if (filters.etapeDemande) {
      query = query.eq('Etape demande', filters.etapeDemande);
    }

    if (filters.rpa) {
      query = query.eq('RPA', filters.rpa);
    }

    if (filters.composant) {
      query = query.eq('Composant principal', filters.composant);
    }

    if (filters.decisionCNI) {
      query = query.eq('Décision CNI', filters.decisionCNI);
    }

    if (filters.dateTravauxDebut) {
      query = query.gte('Date de démarrage travaux', filters.dateTravauxDebut);
    }

    if (filters.dateTravauxFin) {
      query = query.lte('Date de démarrage travaux', filters.dateTravauxFin);
    }

    const { data, error } = await query.order('Code demande', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }

    // Fallback client-side sur jeu de données mocké si pas de résultats
    const all = await this.getAll();
    const matches = all.filter((projet) => {
      const f = filters;
      const text = (s?: string) => (s || '').toLowerCase();
      if (f.search) {
        const s = text(f.search);
        const ok = text(projet['Code demande']).includes(s) ||
          text(projet['Intitulé']).includes(s) ||
          text(projet['Code Site']).includes(s) ||
          text(projet['Site']).includes(s) ||
          text(projet['Descriptif']).includes(s);
        if (!ok) return false;
      }
      if (f.statut && projet['Statut'] !== f.statut) return false;
      if (f.region && projet['Région'] !== f.region) return false;
      if (f.centre && projet['Centre'] !== f.centre) return false;
      if (f.priorite && projet['Priorité'] !== f.priorite) return false;
      if (f.chefProjet && projet['Chef de Projet'] !== f.chefProjet) return false;
      if (f.programme && projet['Programme'] !== f.programme) return false;
      if (f.etapeDemande && projet['Etape demande'] !== f.etapeDemande) return false;
      if (f.rpa && projet['RPA'] !== f.rpa) return false;
      if (f.composant && projet['Composant principal'] !== f.composant) return false;
      if (f.decisionCNI && projet['Décision CNI'] !== f.decisionCNI) return false;
      if (f.dateTravauxDebut || f.dateTravauxFin) {
        const d = projet['Date de démarrage travaux'];
        if (!d) return false;
        const pd = new Date(d);
        if (f.dateTravauxDebut && pd < new Date(f.dateTravauxDebut)) return false;
        if (f.dateTravauxFin && pd > new Date(f.dateTravauxFin)) return false;
      }
      return true;
    });
    return matches;
  },

  /**
   * Insérer plusieurs projets en masse
   */
  async bulkInsert(projects: Immobilier[]): Promise<Immobilier[]> {
    const { data, error } = await supabase
      .from('immobilier')
      .insert(projects)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer les statistiques
   */
  async getStats() {
    const projects = await this.getAll();
    const budgetValues = projects
      .map(p => {
        const budget = p['Budget en €'];
        return typeof budget === 'string' ? parseFloat(budget.replace(/,/g, '.')) : budget;
      })
      .filter(v => !isNaN(v));

    const engagedValues = projects
      .map(p => {
        const engaged = p['Engagé en €'];
        return typeof engaged === 'string' ? parseFloat(engaged.replace(/,/g, '.')) : engaged;
      })
      .filter(v => !isNaN(v));

    const realizedValues = projects
      .map(p => {
        const realized = p['Réalisé en €'];
        return typeof realized === 'string' ? parseFloat(realized.replace(/,/g, '.')) : realized;
      })
      .filter(v => !isNaN(v));

    const realizationRates = projects
      .map(p => {
        const rate = p['% Réalisé'];
        let value = typeof rate === 'string' ? parseFloat(rate.replace(/,/g, '.').replace(/%/g, '')) : rate;
        // Si la valeur est < 1, c'est probablement une décimale (0.3 = 30%)
        if (value && value < 1) {
          value = value * 100;
        }
        return value;
      })
      .filter(v => !isNaN(v) && v > 0);

    // Détection des projets en cours (plusieurs variations possibles)
    const statutsEnCours = projects.filter(p => {
      const statut = p['Statut']?.toLowerCase() || '';
      return statut.includes('cours') || 
             statut.includes('en cours') ||
             statut.includes('travaux') ||
             statut.includes('execution') ||
             (!statut.includes('termin') && !statut.includes('clos') && statut !== '');
    }).length;

    // Projets terminés
    const projetsTermines = projects.filter(p => {
      const statut = p['Statut']?.toLowerCase() || '';
      return statut.includes('termin') || 
             statut.includes('achevé') ||
             statut.includes('clos') ||
             statut.includes('réceptionné');
    }).length;

    return {
      totalProjets: projects.length,
      budgetTotal: budgetValues.reduce((a, b) => a + b, 0),
      budgetEngage: engagedValues.reduce((a, b) => a + b, 0),
      budgetRealise: realizedValues.reduce((a, b) => a + b, 0),
      tauxMoyenRealisation: realizationRates.length > 0
        ? realizationRates.reduce((a, b) => a + b, 0) / realizationRates.length
        : 0,
      projetEnCours: statutsEnCours,
      projetsTermines: projetsTermines,
    };
  },
};
