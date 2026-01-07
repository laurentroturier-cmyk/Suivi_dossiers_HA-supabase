import React, { useState } from 'react';
import { Upload, FileText, Download, Filter, Search, Calendar, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { RetraitsData, EntrepriseRetrait } from '../types/retraits';
import { parseRetraitsFile } from '../utils/retraitsParser';
import { SupabaseClient } from '@supabase/supabase-js';

interface RegistreRetraitsProps {
  supabaseClient?: SupabaseClient | null;
  onOpenProcedure?: (numeroAfpa: string) => void;
  onProcedureUpdated?: () => void;
}

const RegistreRetraits: React.FC<RegistreRetraitsProps> = ({ supabaseClient, onOpenProcedure, onProcedureUpdated }) => {
  const [retraitsData, setRetraitsData] = useState<RetraitsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntention, setFilterIntention] = useState<string>('all');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const updateProcedureRetraits = async (reference: string, nombreRetraits: number) => {
    if (!supabaseClient) {
      console.warn('Supabase non disponible pour mise à jour');
      setUpdateMessage('⚠️ Connexion Supabase non disponible');
      return;
    }

    try {
      // Extraire le numéro AFPA (5 chiffres au début)
      const afpaMatch = reference.match(/^(\d{5})/);
      if (!afpaMatch) {
        console.warn('Numéro AFPA non trouvé dans la référence:', reference);
        setUpdateMessage(`⚠️ Numéro AFPA non trouvé dans la référence: ${reference}`);
        return;
      }

      const numeroAfpa = afpaMatch[1];
      console.log('Recherche procédure avec numéro AFPA:', numeroAfpa);
      
      // Récupérer toutes les procédures et filtrer côté client (workaround pour les noms de colonnes avec caractères spéciaux)
      const { data: allProcedures, error: searchError } = await supabaseClient
        .from('procédures')
        .select('NumProc, "Numéro de procédure (Afpa)", "Nombre de retraits"');

      if (searchError) {
        console.error('Erreur recherche procédure:', searchError);
        setUpdateMessage(`❌ Erreur recherche: ${searchError.message}`);
        return;
      }

      // Filtrer côté client
      const procedures = allProcedures?.filter(p => {
        const numAfpa = String(p['Numéro de procédure (Afpa)'] || '');
        return numAfpa.startsWith(numeroAfpa);
      }) || [];

      if (!procedures || procedures.length === 0) {
        setUpdateMessage(`⚠️ Aucune procédure trouvée avec le numéro AFPA ${numeroAfpa}`);
        return;
      }

      const procedure = procedures[0];
      console.log('Procédure trouvée:', procedure.NumProc, 'Mise à jour avec:', nombreRetraits, 'retraits');
      
      // Mettre à jour le nombre de retraits
      const { error: updateError } = await supabaseClient
        .from('procédures')
        .update({ 'Nombre de retraits': nombreRetraits })
        .eq('NumProc', procedure.NumProc);

      if (updateError) {
        console.error('Erreur mise à jour procédure:', updateError);
        setUpdateMessage(`❌ Erreur mise à jour: ${updateError.message}`);
        return;
      }

      setUpdateMessage(`✅ Procédure ${numeroAfpa} mise à jour : ${nombreRetraits} retrait(s)`);
      setTimeout(() => setUpdateMessage(null), 5000);
      
      // Recharger les procédures pour afficher les nouvelles données
      if (onProcedureUpdated) {
        onProcedureUpdated();
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      setUpdateMessage(`❌ Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setUpdateMessage(null);

    try {
      const data = await parseRetraitsFile(file);
      setRetraitsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleterProcedure = async () => {
    if (!retraitsData?.procedureInfo.reference || !retraitsData?.stats) return;
    
    setLoading(true);
    const totalRetraits = retraitsData.stats.totalTelecharges + retraitsData.stats.anonymes;
    await updateProcedureRetraits(
      retraitsData.procedureInfo.reference,
      totalRetraits
    );
    setLoading(false);
  };

  const handleVoirProcedure = () => {
    if (!retraitsData?.procedureInfo.reference) return;
    const afpaMatch = retraitsData.procedureInfo.reference.match(/^(\d{5})/);
    if (afpaMatch && onOpenProcedure) {
      onOpenProcedure(afpaMatch[1]);
    }
  };

  const handleExportExcel = () => {
    if (!retraitsData) return;
    
    // Logique d'export Excel
    console.log('Export Excel');
  };

  // Filtrer les entreprises
  const filteredEntreprises = retraitsData?.entreprises.filter((entreprise) => {
    const matchSearch = 
      entreprise.societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchIntention = 
      filterIntention === 'all' || entreprise.intention === filterIntention;

    return matchSearch && matchIntention;
  }) || [];

  if (!retraitsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#005c4d] rounded-full mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Registre des Retraits
              </h1>
              <p className="text-gray-600 mb-8">
                Chargez un fichier PDF pour visualiser les retraits de DCE
              </p>

              <label className="inline-flex items-center gap-3 px-8 py-4 bg-[#005c4d] text-white rounded-xl font-medium hover:bg-[#004a3d] transition-colors cursor-pointer shadow-lg hover:shadow-xl">
                <Upload className="w-5 h-5" />
                Charger un fichier PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>

              {loading && (
                <div className="mt-6">
                  <div className="inline-flex items-center gap-3 text-[#005c4d]">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#005c4d]"></div>
                    <span>Chargement en cours...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {updateMessage && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-medium">{updateMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ff6b35] rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Registre des Retraits</h1>
                <p className="text-sm text-gray-500">e-marchespublics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleVoirProcedure}
                disabled={!retraitsData?.procedureInfo.reference || !onOpenProcedure}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Voir procédure
              </button>
              <button
                onClick={handleCompleterProcedure}
                disabled={loading || !retraitsData?.procedureInfo.reference || !supabaseClient}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Compléter procédure
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d] transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter Excel
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Nouveau PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Message de mise à jour */}
        {updateMessage && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm">
            <p className="text-blue-900 font-semibold text-center">{updateMessage}</p>
          </div>
        )}

        {/* Informations de la procédure */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de la Procédure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Objet du marché</p>
                  <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.objet || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Votre référence</p>
                  <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.reference || 'Non renseigné'}</p>
                  {retraitsData.procedureInfo.idEmp && (
                    <p className="text-xs text-gray-500 mt-1">ID EMP: {retraitsData.procedureInfo.idEmp}</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date d'offre</p>
                  <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.dateOffre || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            {retraitsData.procedureInfo.datePublication && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date de publication</p>
                <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.datePublication}</p>
              </div>
            )}
            {retraitsData.procedureInfo.dateCandidature && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date de candidature</p>
                <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.dateCandidature}</p>
              </div>
            )}
            {retraitsData.procedureInfo.dateImpression && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date impression</p>
                <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.dateImpression}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Retraits</p>
            <p className="text-3xl font-bold text-gray-900">{retraitsData.stats.totalTelecharges + retraitsData.stats.anonymes}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">DCE Électroniques</p>
            <p className="text-3xl font-bold text-[#005c4d]">{retraitsData.stats.totalTelecharges}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">DCE Reprographiés</p>
            <p className="text-3xl font-bold text-purple-600">{retraitsData.stats.totalReprographies}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Téléchargements Anonymes</p>
            <p className="text-3xl font-bold text-blue-600">{retraitsData.stats.anonymes}</p>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par société, nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterIntention}
                onChange={(e) => setFilterIntention(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
              >
                <option value="all">Toutes les intentions</option>
                <option value="NC">NC</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des entreprises */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Société</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">E-mail</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Type Retrait</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Lots</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Intention</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Visites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntreprises.map((entreprise, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-gray-900 whitespace-nowrap">{entreprise.prenom} {entreprise.nom}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="whitespace-nowrap">{entreprise.telephone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-[200px]">
                        <p className="text-xs font-medium text-gray-900 truncate" title={entreprise.societe}>{entreprise.societe}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{entreprise.ville} ({entreprise.cp})</span>
                        </div>
                        {entreprise.siret && (
                          <p className="text-[9px] text-gray-400 mt-0.5 truncate">{entreprise.siret}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 max-w-[180px]">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${entreprise.email}`} className="text-xs text-blue-600 hover:underline truncate" title={entreprise.email}>
                          {entreprise.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                        entreprise.typeRetrait === 'Electronique' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {entreprise.typeRetrait}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs text-gray-900 max-w-[120px] truncate" title={entreprise.lots}>{entreprise.lots}</p>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                        entreprise.intention === 'NC' 
                          ? 'bg-gray-100 text-gray-700'
                          : entreprise.intention === 'Oui'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {entreprise.intention}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-[10px] text-gray-600 whitespace-nowrap">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="font-medium">1ère:</span> {entreprise.premiereVisite.split(' ')[0]}
                        </p>
                        <p className="flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="font-medium">Dern:</span> {entreprise.derniereVisite.split(' ')[0]}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntreprises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucune entreprise trouvée</p>
            </div>
          )}

          {filteredEntreprises.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Affichage de {filteredEntreprises.length} sur {retraitsData.entreprises.length} entreprises
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistreRetraits;
