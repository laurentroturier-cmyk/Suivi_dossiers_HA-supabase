// ============================================
// SERVICE DCE COMPLET
// Hub central pour toutes les opérations DCE
// ============================================

import { supabase } from '../../../lib/supabase';
import type { ProjectData } from '../../../types';
import type { 
  DCEState, 
  DCERecord, 
  DCEOperationResult, 
  DCELoadResult,
  DCESectionType,
  DCEStatut
} from '../types';
import { mapProcedureToDCE } from './dceMapping';

export class DCEService {
  /**
   * Charge un DCE depuis Supabase par numéro de procédure
   * Si le DCE n'existe pas, le crée automatiquement avec auto-remplissage
   */
  async loadDCE(numeroProcedure: string): Promise<DCELoadResult> {
    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      // Valider le numéro de procédure (5 chiffres)
      if (!numeroProcedure || numeroProcedure.length !== 5 || !/^\d{5}$/.test(numeroProcedure)) {
        return { success: false, error: 'Numéro de procédure invalide (doit être 5 chiffres)' };
      }

      // Chercher le DCE existant
      const { data: existingDCE, error: loadError } = await supabase
        .from('dce')
        .select('*')
        .eq('numero_procedure', numeroProcedure)
        .eq('user_id', user.id)
        .single();

      // Si le DCE existe, le retourner
      if (existingDCE && !loadError) {
        // Backfill RC depuis l'ancienne table si la colonne est encore vide
        if (!existingDCE.reglement_consultation) {
          const rcRecord = await this.loadExistingRC(numeroProcedure);

          if (rcRecord?.data) {
            const { data: patchedDCE, error: patchError } = await supabase
              .from('dce')
              .update({
                reglement_consultation: rcRecord.data,
                titre_marche: existingDCE.titre_marche || rcRecord.titreMarche || null,
              })
              .eq('id', existingDCE.id)
              .select()
              .single();

            if (!patchError && patchedDCE) {
              return {
                success: true,
                data: this.recordToState(patchedDCE),
                isNew: false,
              };
            }
          }
        }

        // Backfill QT depuis l'ancienne table si la colonne est encore vide
        if (!existingDCE.qt) {
          const qtRecord = await this.loadExistingQT(numeroProcedure);

          if (qtRecord?.data) {
            const { data: patchedDCE, error: patchError } = await supabase
              .from('dce')
              .update({
                qt: qtRecord.data,
              })
              .eq('id', existingDCE.id)
              .select()
              .single();

            if (!patchError && patchedDCE) {
              return {
                success: true,
                data: this.recordToState(patchedDCE),
                isNew: false,
              };
            }
          }
        }

        return {
          success: true,
          data: this.recordToState(existingDCE),
          isNew: false
        };
      }

      // Si erreur autre que "not found", la retourner
      if (loadError && loadError.code !== 'PGRST116') {
        console.error('Erreur chargement DCE:', loadError);
        return { success: false, error: loadError.message };
      }

      // Le DCE n'existe pas → créer automatiquement
      return await this.createDCE(numeroProcedure);
      
    } catch (error: any) {
      console.error('Erreur loadDCE:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }

  /**
   * Crée un nouveau DCE avec auto-remplissage depuis la procédure
   */
  async createDCE(numeroProcedure: string): Promise<DCELoadResult> {
    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      // Charger les données de la procédure
      const procedure = await this.loadProcedure(numeroProcedure);
      const rcRecord = await this.loadExistingRC(numeroProcedure);

      if (!procedure && !rcRecord) {
        return { 
          success: false, 
          error: `Aucune procédure trouvée avec le numéro ${numeroProcedure}` 
        };
      }

      // Auto-mapper procédure → DCE
      let dceData = procedure ? mapProcedureToDCE(procedure) : mapProcedureToDCE({} as ProjectData);
      dceData = { ...dceData, numeroProcedure };

      // Si un RC legacy existe, l'injecter dans le DCE créé
      const reglementConsultation = rcRecord?.data || dceData.reglementConsultation;
      const titreMarche = rcRecord?.titreMarche || dceData.titreMarche;

      // Créer le record dans Supabase
      const record = {
        user_id: user.id,
        numero_procedure: numeroProcedure,
        titre_marche: titreMarche,
        statut: 'brouillon' as DCEStatut,
        version: 1,
        notes: '',
        reglement_consultation: reglementConsultation,
        acte_engagement: dceData.acteEngagement,
        ccap: dceData.ccap,
        cctp: dceData.cctp,
        bpu: dceData.bpu,
        dqe: dceData.dqe,
        dpgf: dceData.dpgf,
        documents_annexes: dceData.documentsAnnexes,
        crt: dceData.crt,
        qt: dceData.qt,
      };

      const { data: createdDCE, error } = await supabase
        .from('dce')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Erreur création DCE:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: this.recordToState(createdDCE),
        isNew: true
      };
      
    } catch (error: any) {
      console.error('Erreur createDCE:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }

  /**
   * Met à jour une section du DCE
   */
  async updateSection(
    numeroProcedure: string,
    section: DCESectionType,
    data: any
  ): Promise<DCEOperationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      // Convertir le nom de section en snake_case pour Supabase
      const columnName = this.sectionToColumnName(section);

      // Mettre à jour la section
      const updateData = { [columnName]: data };
      
      const { data: updated, error } = await supabase
        .from('dce')
        .update(updateData)
        .eq('numero_procedure', numeroProcedure)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur updateSection:', error);
        return { success: false, error: error.message };
      }

      // Synchroniser le RC legacy si nécessaire
      if (section === 'reglementConsultation' && data) {
        const rcRecord = {
          user_id: user.id,
          numero_procedure: numeroProcedure,
          titre_marche: data?.enTete?.titreMarche || updated?.titre_marche || null,
          numero_marche: data?.enTete?.numeroMarche || null,
          data,
        };

        const { error: rcError } = await supabase
          .from('reglements_consultation')
          .upsert(rcRecord, {
            onConflict: 'numero_procedure',
            ignoreDuplicates: false,
          });

        if (rcError) {
          console.error('Erreur synchro RC → reglements_consultation:', rcError);
          return { success: false, error: `Section enregistrée mais RC non synchronisé: ${rcError.message}` };
        }
      }

      // Synchroniser le QT legacy si nécessaire
      if (section === 'qt' && data) {
        const { error: qtError } = await supabase
          .from('questionnaires_techniques')
          .upsert({
            user_id: user.id,
            num_proc: numeroProcedure,
            numero_lot: 1,  // Par défaut pour DCE
            qt_data: data,
          }, {
            onConflict: 'num_proc,numero_lot',
            ignoreDuplicates: false,
          });

        if (qtError) {
          console.warn('⚠️ Synchro QT → questionnaires_techniques non critique:', qtError);
          // On log mais on ne bloque pas - la sauvegarde dans dce a réussi
        }
      }

      return {
        success: true,
        data: this.recordToState(updated),
        id: updated.id
      };
      
    } catch (error: any) {
      console.error('Erreur updateSection:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }

  /**
   * Sauvegarde le DCE complet
   */
  async saveDCE(dceState: DCEState): Promise<DCEOperationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      const record = this.stateToRecord(dceState, user.id);

      const { data: saved, error } = await supabase
        .from('dce')
        .upsert(record, {
          onConflict: 'numero_procedure,user_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur saveDCE:', error);
        return { success: false, error: error.message };
      }

      // Synchroniser le RC dans l'ancienne table pour compatibilité
      if (dceState.reglementConsultation) {
        const rcRecord = {
          user_id: user.id,
          numero_procedure: dceState.numeroProcedure,
          titre_marche: dceState.titreMarche || dceState.reglementConsultation.enTete?.titreMarche || null,
          numero_marche: dceState.reglementConsultation.enTete?.numeroMarche || null,
          data: dceState.reglementConsultation,
        };

        const { error: rcError } = await supabase
          .from('reglements_consultation')
          .upsert(rcRecord, {
            onConflict: 'numero_procedure',
            ignoreDuplicates: false,
          });

        if (rcError) {
          console.error('Erreur synchro RC → reglements_consultation:', rcError);
          return { success: false, error: `DCE sauvegardé mais RC non synchronisé: ${rcError.message}` };
        }
      }

      return {
        success: true,
        data: this.recordToState(saved),
        id: saved.id
      };
      
    } catch (error: any) {
      console.error('Erreur saveDCE:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }

  /**
   * Change le statut du DCE
   */
  async updateStatut(
    numeroProcedure: string,
    statut: DCEStatut
  ): Promise<DCEOperationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Utilisateur non authentifié' };
      }

      const { data: updated, error } = await supabase
        .from('dce')
        .update({ statut })
        .eq('numero_procedure', numeroProcedure)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Erreur updateStatut:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: this.recordToState(updated),
        id: updated.id
      };
      
    } catch (error: any) {
      console.error('Erreur updateStatut:', error);
      return { success: false, error: error.message || 'Erreur inconnue' };
    }
  }

  /**
   * Publie le DCE (change statut à "publié")
   */
  async publishDCE(numeroProcedure: string): Promise<DCEOperationResult> {
    return this.updateStatut(numeroProcedure, 'publié');
  }

  /**
   * Charge les données de la procédure depuis Supabase
   */
  private async loadProcedure(numeroProcedure: string): Promise<ProjectData | null> {
    try {
      // 1) Tentative directe : colonne "numero court procédure afpa" (5 chiffres)
      const { data: directProcedure, error: directError } = await supabase
        .from('procédures')
        .select('*')
        .eq('numero court procédure afpa', numeroProcedure)
        .maybeSingle();

      if (directError && directError.code !== 'PGRST116') {
        console.error('Erreur récupération procédure (requête directe):', directError);
      }

      if (directProcedure) {
        return directProcedure as ProjectData;
      }

      // 2) Fallback : récupérer toutes les procédures et filtrer côté client sur les anciens champs
      const { data: allProcedures, error } = await supabase
        .from('procédures')
        .select('*');

      if (error) {
        console.error('Erreur récupération procédures:', error);
        return null;
      }

      if (!allProcedures || allProcedures.length === 0) {
        console.warn('Aucune procédure dans la base');
        return null;
      }

      const procedures = allProcedures.filter(p => {
        const numCourt = String(p['numero court procédure afpa'] || '');
        const numAfpa = String(p['Numéro de procédure (Afpa)'] || '');
        const numProc = String(p['NumProc'] || '');
        return numCourt === numeroProcedure || numAfpa.startsWith(numeroProcedure) || numProc.startsWith(numeroProcedure);
      });

      if (!procedures || procedures.length === 0) {
        console.warn(`Aucune procédure trouvée avec le numéro court ${numeroProcedure}`);
        return null;
      }

      return procedures[0] as ProjectData;
      
    } catch (err) {
      console.error('Erreur loadProcedure:', err);
      return null;
    }
  }

  /**
   * Récupère un RC existant dans la table legacy
   */
  private async loadExistingRC(numeroProcedure: string): Promise<{ data: any; titreMarche: string | null; numeroMarche: string | null; } | null> {
    try {
      const { data: rcRecord, error } = await supabase
        .from('reglements_consultation')
        .select('data,titre_marche,numero_marche')
        .eq('numero_procedure', numeroProcedure)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération RC legacy:', error);
      }

      if (!rcRecord) {
        return null;
      }

      const titreMarche = rcRecord.titre_marche || (rcRecord.data as any)?.enTete?.titreMarche || null;
      const numeroMarche = rcRecord.numero_marche || (rcRecord.data as any)?.enTete?.numeroMarche || null;

      return {
        data: rcRecord.data,
        titreMarche,
        numeroMarche,
      };
    } catch (err) {
      console.error('Erreur loadExistingRC:', err);
      return null;
    }
  }

  /**
   * Convertit un DCERecord (Supabase) en DCEState (React)
   */
  private recordToState(record: DCERecord): DCEState {
    return {
      id: record.id,
      numeroProcedure: record.numero_procedure,
      procedureId: record.procedure_id,
      userId: record.user_id,
      statut: record.statut,
      titreMarche: record.titre_marche,
      version: record.version,
      notes: record.notes,
      reglementConsultation: record.reglement_consultation,
      acteEngagement: record.acte_engagement,
      ccap: record.ccap,
      cctp: record.cctp,
      bpu: record.bpu,
      dqe: record.dqe,
      dpgf: record.dpgf,
      documentsAnnexes: record.documents_annexes,
      crt: record.crt,
      qt: record.qt,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /**
   * Convertit un DCEState (React) en DCERecord (Supabase)
   */
  private stateToRecord(state: DCEState, userId: string): any {
    return {
      id: state.id,
      user_id: userId,
      numero_procedure: state.numeroProcedure,
      procedure_id: state.procedureId,
      statut: state.statut,
      titre_marche: state.titreMarche,
      version: state.version,
      notes: state.notes,
      reglement_consultation: state.reglementConsultation,
      acte_engagement: state.acteEngagement,
      ccap: state.ccap,
      cctp: state.cctp,
      bpu: state.bpu,
      dqe: state.dqe,
      dpgf: state.dpgf,
      documents_annexes: state.documentsAnnexes,
      crt: state.crt,
      qt: state.qt,
    };
  }

  /**
   * Convertit un nom de section en nom de colonne Supabase
   */
  private sectionToColumnName(section: DCESectionType): string {
    const mapping: Record<DCESectionType, string> = {
      reglementConsultation: 'reglement_consultation',
      acteEngagement: 'acte_engagement',
      ccap: 'ccap',
      cctp: 'cctp',
      bpu: 'bpu',
      dqe: 'dqe',
      dpgf: 'dpgf',
      documentsAnnexes: 'documents_annexes',
      crt: 'crt',
      qt: 'qt',
    };
    return mapping[section];
  }

  /**
   * Récupère un QT existant depuis questionnaires_techniques
   */
  private async loadExistingQT(numeroProcedure: string): Promise<{ data: any } | null> {
    try {
      const { data: qtRecord, error } = await supabase
        .from('questionnaires_techniques')
        .select('qt_data')
        .eq('num_proc', numeroProcedure)
        .eq('numero_lot', 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération QT legacy:', error);
      }

      if (!qtRecord) {
        return null;
      }

      return {
        data: qtRecord.qt_data,
      };
    } catch (err) {
      console.error('Erreur loadExistingQT:', err);
      return null;
    }
  }
}

// Export singleton instance
export const dceService = new DCEService();
