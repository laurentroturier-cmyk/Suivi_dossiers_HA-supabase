import React, { useState } from 'react';
import { Upload, FileText, Download, Filter, Search, Calendar, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { RetraitsData, EntrepriseRetrait } from '../types/retraits';
import { parseRetraitsFile } from '../utils/retraitsParser';

const RegistreRetraits: React.FC = () => {
  const [retraitsData, setRetraitsData] = useState<RetraitsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntention, setFilterIntention] = useState<string>('all');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseRetraitsFile(file);
      setRetraitsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du fichier');
    } finally {
      setLoading(false);
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
                Chargez un fichier Excel (.xls, .xlsx) ou PDF pour visualiser les données des retraits
              </p>

              <label className="inline-flex items-center gap-3 px-8 py-4 bg-[#005c4d] text-white rounded-xl font-medium hover:bg-[#004a3d] transition-colors cursor-pointer shadow-lg hover:shadow-xl">
                <Upload className="w-5 h-5" />
                Charger un fichier
                <input
                  type="file"
                  accept=".xls,.xlsx,.pdf"
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
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d] transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter Excel
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Nouveau fichier
                <input
                  type="file"
                  accept=".xls,.xlsx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Informations de la procédure */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de la Procédure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Objet du marché</p>
                  <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.objet}</p>
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
                  <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.reference}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date limite</p>
                  <p className="text-sm font-medium text-gray-900">{retraitsData.procedureInfo.dateLimit}</p>
                  {retraitsData.procedureInfo.idEmp && (
                    <p className="text-xs text-gray-500 mt-1">ID EMP: {retraitsData.procedureInfo.idEmp}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Entrées</p>
            <p className="text-3xl font-bold text-gray-900">{retraitsData.entreprises.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">DCE Téléchargés</p>
            <p className="text-3xl font-bold text-[#005c4d]">{retraitsData.stats.totalTelecharges}</p>
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
