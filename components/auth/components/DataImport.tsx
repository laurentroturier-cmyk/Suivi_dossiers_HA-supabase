import React, { useState } from 'react';
import { Upload, Download, Database, AlertCircle, CheckCircle, X, FileSpreadsheet, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { downloadTemplate } from '../../../utils/templateGenerator';
import { convertExcelDate } from '@/utils';
import { Button, Card, Input } from '@/components/ui';

interface ImportedData {
  headers: string[];
  rows: any[];
  fileName: string;
}

interface ColumnMapping {
  excelColumn: string;
  supabaseColumn: string;
  mapped: boolean;
}

// Mapping des colonnes Excel vers les colonnes Supabase
const COLUMN_MAPPINGS: Record<string, Record<string, string>> = {
  projets: {
    // Colonnes principales - Mapping des noms Excel vers les vrais noms Supabase
    'IDProjet': 'IDProjet',
    'Acheteur': 'Acheteur',
    'Prescripteur': 'Prescripteur',
    'Client Interne': 'Client_Interne',
    'Statut du Dossier': 'Statut_du_Dossier',
    'Programme': 'Programme',
    'Opération': 'Operation',
    'Levier Achat': 'Levier_Achat',
    'Renouvellement de marché': 'Renouvellement_de_marche',
    'Date de lancement de la consultation': 'Date_de_lancement_de_la_consultation',
    'Date de déploiement prévisionnelle du marché': 'Date_de_deploiement_previsionnelle_du_marche',
    'Perf achat prévisionnelle (en %)': 'Perf_achat_previsionnelle_(en_%)',
    'Montant prévisionnel du marché (€ HT)': 'Montant_previsionnel_du_marche_(_HT)_',
    'Origine du montant pour le calcul de l\'économie': 'Origine_du_montant_pour_le_calcul_de_l\'economie',
    'Priorité': 'Priorite',
    'Commission Achat': 'Commission_Achat',
    'NO - Type de validation': 'NO_-_Type_de_validation',
    'NO - MSA': 'NO_-_MSA',
    'NO - Date validation MSA': 'NO_-_Date_validation_MSA',
    'Sur 12 mois économie achat prévisionnelle (€)': 'Sur_12_mois_economie_achat_previsionnelle_(€)',
    'NO - Date prévisionnelle CA ou Commission': 'NO_-_Date_previsionnelle_CA_ou_Commission',
    'NO - Date validation CODIR': 'NO_-_Date_validation_CODIR',
    'NO - Date envoi signature électronique': 'NO_-_Date_envoi_signature_electronique',
    'NO - Date de validation du document': 'NO_-_Date_de_validation_du_document',
    'Nom des valideurs': 'Nom_des_valideurs',
    'NO - Statut': 'NO_-_Statut',
    'NO - Commentaire': 'NO_-_Commentaire',
    'Projet ouvert à l\'acquisition de solutions innovantes': 'Projet_ouvert_à_l\'acquisition_de_solutions_innovantes',
    'Projet facilitant l\'accès aux TPE/PME': 'Projet_facilitant_l\'accès_aux_TPE/PME',
    'Numéro de procédure (Afpa)': 'NumProc',
    'NumProc': 'NumProc',  // Alias direct
    'Old_ID Consult': 'Old_ID_Consult',
    'Old_ID Projet': 'Old_ID_Projet',
    'Code CPV Principal': 'CodesCPVDAE',
    'Titre du dossier': 'Titre_du_dossier'
  },
  procédures: {
    // Colonnes de la table procédures
    'IDProjet': 'IDProjet',
    'Acheteur': 'Acheteur',
    'Famille Achat Principale': 'Famille Achat Principale',
    'NumProc': 'NumProc',  // ID unique de la procédure (ex: 1402-1)
    'Numéro de procédure (Afpa)': 'Numéro de procédure (Afpa)',  // Identifiant Afpa (ex: 26006_MAPA_TX-REMPL-PORTES-BRETAGNE_PAI)
    'Forme du marché': 'Forme du marché',
    'Objet court': 'Objet court',
    'Type de procédure': 'Type de procédure',
    'CCAG': 'CCAG',
    'Nombre de lots': 'Nombre de lots',
    'Lots réservés': 'Lots réservés',
    'Support de procédure': 'Support de procédure',
    'Référence procédure (plateforme)': 'Référence procédure (plateforme)',
    'Nombre de retraits': 'Nombre de retraits',
    'Nombre de soumissionnaires': 'Nombre de soumissionnaires',
    'Nombre de questions': 'Nombre de questions',
    'Dispo sociales': 'Dispo sociales',
    'Dispo environnementales': 'Dispo environnementales',
    'Projet ouvert à l\'acquisition de solutions innovantes': 'Projet ouvert à l\'acquisition de solutions innovantes',
    'Projet facilitant l\'accès aux TPE/PME': 'Projet facilitant l\'accès aux TPE/PME',
    'Date d\'écriture du DCE': 'Date d\'écriture du DCE',
    'Date de remise des offres': 'Date de remise des offres',
    'Date d\'ouverture des offres': 'Date d\'ouverture des offres',
    'Date des Rejets': 'Date des Rejets',
    'Avis d\'attribution': 'Avis d\'attribution',
    'Données essentielles': 'Données essentielles',
    'Finalité de la consultation': 'Finalité de la consultation',
    'Statut de la consultation': 'Statut de la consultation',
    'Délai de traitement (calcul)': 'Délai de traitement (calcul)',
    'RP - Date validation MSA': 'RP - Date validation MSA',
    'RP - Date envoi signature élec': 'RP - Date envoi signature élec',
    'RP - Date de validation du document': 'RP - Date de validation du document',
    'RP -  Date validation CODIR': 'RP -  Date validation CODIR',
    'RP - Commentaire': 'RP - Commentaire',
    'RP - Statut': 'RP - Statut',
    'Motivation non allotissement': 'Motivation non allotissement',
    'Date limite étude stratégie avec client interne': 'Date limite étude stratégie avec client interne',
    'Nom de la procédure': 'Nom de la procédure',
    'Durée du marché (en mois)': 'Durée du marché (en mois)',
    'Date d\'échéance du marché': 'Date d\'échéance du marché',
    'Durée de validité des offres (en jours)': 'Durée de validité des offres (en jours)',
    'Date de remise des offres finales': 'Date de remise des offres finales',
    'Date de validité des offres (calculée)': 'Date de validité des offres (calculée)',
    'Date de Notification': 'Date de Notification',
    'Code CPV Principal': 'Code CPV Principal',
    'Archivage (Statut)': 'Archivage (Statut)',
    'Old_ID Consult': 'Old_ID Consult',
    'Old_ID Projet': 'Old_ID Projet',
    'Durée de publication': 'Durée de publication',
    'Date de remise des candidatures': 'Date de remise des candidatures',
    'Montant de la procédure': 'Montant de la procédure',
    'Commission HA': 'Commission_HA',
    'Date de lancement de la consultation': 'date_de_lancement_de_la_consultation'
  }
};

// Colonnes NOT NULL pour chaque table - validation requise
const REQUIRED_COLUMNS: Record<string, string[]> = {
  projets: [
    'IDProjet',  // Clé primaire
  ],
  procédures: [
    'NumProc',   // Numéro de procédure - colonne NOT NULL
  ]
};

// Liste des colonnes DATE pour chaque table (utilise les noms Supabase exacts)
const DATE_COLUMNS: Record<string, string[]> = {
  projets: [
    'Date_de_lancement_de_la_consultation',
    'Date_de_deploiement_previsionnelle_du_marche',
    'NO_-_Date_validation_MSA',
    'NO_-_Date_previsionnelle_CA_ou_Commission',
    'NO_-_Date_validation_CODIR',
    'NO_-_Date_envoi_signature_electronique',
    'NO_-_Date_de_validation_du_document'
  ],
  procédures: [
    'Date d\'écriture du DCE',
    'Date de remise des offres',
    'Date d\'ouverture des offres',
    'Date des Rejets',
    'RP - Date validation MSA',
    'RP - Date envoi signature élec',
    'RP - Date de validation du document',
    'RP -  Date validation CODIR',
    'Date limite étude stratégie avec client interne',
    'Date d\'échéance du marché',
    'Date de remise des offres finales',
    'Date de validité des offres (calculée)',
    'Date de Notification',
    'date_de_lancement_de_la_consultation',
    'Date de remise des candidatures'
  ]
};

export default function DataImport() {
  const [selectedTable, setSelectedTable] = useState<'projets' | 'procédures'>('projets');
  const [importedData, setImportedData] = useState<ImportedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Lire la première feuille
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            throw new Error('Le fichier est vide');
          }

          const headers = jsonData[0] as string[];
          const mapping = COLUMN_MAPPINGS[selectedTable];
          
          // Filtrer les colonnes pour garder SEULEMENT celles mappées
          const mappedHeaderIndices: number[] = [];
          const mappings = [];
          const unmappedHeaders: string[] = [];
          
          headers.forEach((header, index) => {
            if (mapping[header]) {
              mappedHeaderIndices.push(index);
              mappings.push({
                excelColumn: header,
                supabaseColumn: mapping[header],
                mapped: true
              });
            } else {
              unmappedHeaders.push(header);
            }
          });
          
          // Filtrer les lignes pour garder SEULEMENT les colonnes mappées
          const filteredRows = jsonData.slice(1)
            .filter(row => 
              Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== '')
            )
            .map(row => mappedHeaderIndices.map(idx => row[idx]));

          const filteredHeaders = mappedHeaderIndices.map(idx => headers[idx]);

          setImportedData({
            headers: filteredHeaders,
            rows: filteredRows,
            fileName: file.name
          });
          
          setColumnMappings(mappings);
          
          // Créer des données d'aperçu (première ligne)
          const preview = filteredRows.slice(0, 10).map(row => {
            const obj: any = {};
            filteredHeaders.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
          
          setPreviewData(preview);
          
          // Message avec informations sur les colonnes filtrées
          let messageText = `✅ Fichier chargé : ${filteredRows.length} ${selectedTable === 'projets' ? 'projet(s)' : 'procédure(s)'} | ${filteredHeaders.length} colonnes mappées`;
          if (unmappedHeaders.length > 0) {
            messageText += ` | ${unmappedHeaders.length} colonne(s) non mappée(s) ignorée(s)`;
          }
          
          setMessage({
            type: 'success',
            text: messageText
          });
        } catch (err: any) {
          setMessage({
            type: 'error',
            text: `Erreur lors de la lecture du fichier : ${err.message}`
          });
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setMessage({
          type: 'error',
          text: 'Erreur lors de la lecture du fichier'
        });
        setLoading(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Erreur : ${err.message}`
      });
      setLoading(false);
    }
  };

  const handleUploadToSupabase = async () => {
    if (!importedData) return;

    setUploading(true);
    setMessage(null);

    try {
      // Transformer les données selon le mapping
      const transformedData = importedData.rows.map(row => {
        const obj: any = {};
        columnMappings.forEach((mapping, index) => {
          let value = row[index];
          
          // Ne garder que les valeurs non vides
          if (value !== null && value !== undefined && value !== '' && String(value).trim() !== '') {
            // Convertir les dates si c'est une colonne DATE
            if (DATE_COLUMNS[selectedTable]?.includes(mapping.supabaseColumn)) {
              value = convertExcelDate(value);
            }
            
            // N'ajouter que si la valeur est valide après conversion
            if (value !== null && value !== '' && String(value).trim() !== '') {
              obj[mapping.supabaseColumn] = value;
            }
          }
        });
        return obj;
      }).filter(obj => Object.keys(obj).length > 0); // Filtrer les lignes vides

      if (transformedData.length === 0) {
        throw new Error('Aucune donnée valide à importer');
      }

      // Vérifier que les colonnes NOT NULL sont présentes
      const requiredCols = REQUIRED_COLUMNS[selectedTable] || [];
      const missingColumns = [];
      
      for (let i = 0; i < transformedData.length; i++) {
        for (const col of requiredCols) {
          if (!transformedData[i][col]) {
            missingColumns.push({ colName: col, rowNumber: i + 1 });
          }
        }
      }

      if (missingColumns.length > 0) {
        const uniqueCols = [...new Set(missingColumns.map(m => m.colName))];
        const detectedCols = Object.keys(transformedData[0] || {});
        throw new Error(`Colonnes obligatoires manquantes : ${uniqueCols.join(', ')}. Colonnes détectées : ${detectedCols.join(', ')}`);
      }

      // Insérer dans Supabase
      const { data, error } = await supabase
        .from(selectedTable)
        .insert(transformedData);

      if (error) {
        throw error;
      }

      setMessage({
        type: 'success',
        text: `✅ ${transformedData.length} ${selectedTable === 'projets' ? 'projet(s)' : 'procédure(s)'} importé(e)s avec succès`
      });

      // Réinitialiser après succès
      setTimeout(() => {
        setImportedData(null);
        setColumnMappings([]);
        setPreviewData([]);
      }, 3000);

    } catch (err: any) {
      console.error('Erreur upload Supabase:', err);
      setMessage({
        type: 'error',
        text: `Erreur lors de l'import : ${err.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setImportedData(null);
    setColumnMappings([]);
    setPreviewData([]);
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import de données</h2>
            <p className="text-sm text-gray-600">Chargez vos données depuis Excel ou CSV</p>
          </div>
        </div>

        {/* Sélection de la table */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Table de destination
          </label>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setSelectedTable('projets');
                handleReset();
              }}
              variant={selectedTable === 'projets' ? 'primary' : 'outline'}
              size="lg"
              rounded="lg"
              icon={<Table className="w-5 h-5" />}
              fullWidth
              className={selectedTable === 'projets' ? '' : 'border-gray-200 hover:border-gray-300'}
            >
              <span className="font-medium">Projets</span>
            </Button>
            <Button
              onClick={() => {
                setSelectedTable('procédures');
                handleReset();
              }}
              variant={selectedTable === 'procédures' ? 'primary' : 'outline'}
              size="lg"
              rounded="lg"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              fullWidth
              className={selectedTable === 'procédures' ? '' : 'border-gray-200 hover:border-gray-300'}
            >
              <span className="font-medium">Procédures</span>
            </Button>
          </div>
        </div>

        {/* Upload de fichier */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fichier Excel ou CSV
          </label>
          <div className="flex items-center gap-4">
            <label className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-sm text-gray-600">
                  Cliquez pour sélectionner un fichier
                </span>
                <span className="text-xs text-gray-400 block mt-1">
                  Excel (.xlsx) ou CSV
                </span>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Mapping des colonnes */}
        {importedData && columnMappings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mapping des colonnes
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {columnMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className={`flex-1 px-3 py-2 rounded ${
                      mapping.mapped ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className="font-medium">{mapping.excelColumn}</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex-1 px-3 py-2 bg-white rounded border border-gray-200">
                      <span className="text-gray-700">{mapping.supabaseColumn}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <span className="inline-block w-3 h-3 bg-green-100 rounded mr-1"></span>
              Mapping automatique détecté
              <span className="inline-block w-3 h-3 bg-yellow-100 rounded mr-1 ml-3"></span>
              Colonne déduite automatiquement
            </p>
          </div>
        )}

        {/* Aperçu des données */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Aperçu des données ({previewData.length} premières lignes)
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {importedData?.headers.slice(0, 8).map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                    {importedData && importedData.headers.length > 8 && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                        ... +{importedData.headers.length - 8} colonnes
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {importedData?.headers.slice(0, 8).map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {row[header] || '-'}
                        </td>
                      ))}
                      {importedData && importedData.headers.length > 8 && (
                        <td className="px-3 py-2 text-sm text-gray-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        {importedData && (
          <div className="flex items-center gap-4">
            <Button
              onClick={handleUploadToSupabase}
              disabled={uploading || !importedData}
              variant="info"
              size="lg"
              rounded="lg"
              icon={uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
              loading={uploading}
              fullWidth
            >
              {uploading ? 'Import en cours...' : `Importer dans Supabase (${selectedTable})`}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              rounded="lg"
              icon={<X className="w-5 h-5" />}
            />
          </div>
        )}
      </div>

      {/* Informations */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Informations importantes :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Les colonnes sont mappées automatiquement selon leurs en-têtes</li>
              <li>Seules les lignes non vides sont importées</li>
              <li>Les doublons éventuels seront gérés par les contraintes de la base</li>
              <li>Vérifiez l'aperçu avant de lancer l'import</li>
              <li>Table sélectionnée : <strong>{selectedTable}</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
