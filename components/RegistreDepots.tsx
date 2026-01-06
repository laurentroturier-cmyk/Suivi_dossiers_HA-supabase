import React, { useState } from 'react';
import { Upload, FileText, Download, Filter, Search, Calendar, Building2, Mail, Phone, MapPin, Package } from 'lucide-react';
import { DepotsData, EntrepriseDepot } from '../types/depots';
import { parseDepotsFile } from '../utils/depotsParser';

const RegistreDepots: React.FC = () => {
  const [depotsData, setDepotsData] = useState<DepotsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseDepotsFile(file);
      setDepotsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!depotsData) return;
    console.log('Export Excel');
  };

  // Filtrer les entreprises
  const filteredEntreprises = depotsData?.entreprises.filter((entreprise) => {
    const matchSearch = 
      entreprise.societe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entreprise.lot.toLowerCase().includes(searchTerm.toLowerCase());

    const matchMode = 
      filterMode === 'all' || entreprise.modeReception.toLowerCase().includes(filterMode.toLowerCase());

    return matchSearch && matchMode;
  }) || [];

  if (!depotsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#005c4d] rounded-full mb-6">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Registre des Dépôts
              </h1>
              <p className="text-gray-600 mb-8">
                Chargez un fichier Excel (.xls, .xlsx, .txt) ou PDF pour visualiser les dépôts d'offres
              </p>

              <label className="inline-flex items-center gap-3 px-8 py-4 bg-[#005c4d] text-white rounded-xl font-medium hover:bg-[#004a3d] transition-colors cursor-pointer shadow-lg hover:shadow-xl">
                <Upload className="w-5 h-5" />
                Charger un fichier
                <input
                  type="file"
                  accept=".xls,.xlsx,.pdf,.txt"
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
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Registre des Dépôts</h1>
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
                  accept=".xls,.xlsx,.pdf,.txt"
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
            <div className="col-span-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Objet du marché</p>
                  <p className="text-sm font-medium text-gray-900">{depotsData.procedureInfo.objet}</p>
                  {depotsData.procedureInfo.auteur && (
                    <p className="text-xs text-gray-500 mt-1">Auteur: {depotsData.procedureInfo.auteur}</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Référence</p>
                  <p className="text-sm font-medium text-gray-900">{depotsData.procedureInfo.reference}</p>
                  {depotsData.procedureInfo.idEmp && (
                    <p className="text-xs text-gray-500 mt-1">ID EMP: {depotsData.procedureInfo.idEmp}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date offre</p>
              <p className="text-sm font-medium text-gray-900">{depotsData.procedureInfo.dateOffre}</p>
            </div>
            {depotsData.procedureInfo.dateExport && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Date export</p>
                <p className="text-sm font-medium text-gray-900">{depotsData.procedureInfo.dateExport}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Dépôts</p>
            <p className="text-3xl font-bold text-gray-900">{depotsData.entreprises.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Enveloppes Électroniques</p>
            <p className="text-3xl font-bold text-[#005c4d]">{depotsData.stats.totalEnveloppesElectroniques}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Enveloppes Papier</p>
            <p className="text-3xl font-bold text-blue-600">{depotsData.stats.totalEnveloppesPapier}</p>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par société, nom, email, lot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005c4d] focus:border-transparent"
              >
                <option value="all">Tous les modes</option>
                <option value="electronique">Électronique</option>
                <option value="papier">Papier</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tableau des dépôts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Ordre</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Société</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">E-mail</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Mode Réception</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Lot</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Date Réception</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Taille</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntreprises.map((entreprise, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <span className="text-xs font-bold text-gray-900">{entreprise.ordre}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-gray-900 whitespace-nowrap">{entreprise.prenom} {entreprise.nom}</p>
                        {entreprise.telephone && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                            <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="whitespace-nowrap">{entreprise.telephone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-[200px]">
                        <p className="text-xs font-medium text-gray-900 truncate" title={entreprise.societe}>{entreprise.societe}</p>
                        {entreprise.ville && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                            <span className="truncate">{entreprise.ville} ({entreprise.cp})</span>
                          </div>
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
                        entreprise.modeReception.toLowerCase().includes('electronique')
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {entreprise.modeReception}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs text-gray-900 max-w-[150px] truncate" title={entreprise.lot}>{entreprise.lot}</p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-[10px] text-gray-600 whitespace-nowrap">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                          {entreprise.dateReception.split(' ')[0]}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs text-gray-600 whitespace-nowrap">{entreprise.taille}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEntreprises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun dépôt trouvé</p>
            </div>
          )}

          {filteredEntreprises.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Affichage de {filteredEntreprises.length} sur {depotsData.entreprises.length} dépôts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistreDepots;
