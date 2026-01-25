import React, { useEffect, useState } from 'react';
import { X, FileText, Image as ImageIcon, Loader2, CheckSquare, Square } from 'lucide-react';
import { Document, Packer, Paragraph, ImageRun, HeadingLevel, AlignmentType } from "docx";
import { jsPDF } from 'jspdf';

interface ExportSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

interface ExportableElement {
  id: string;
  label: string;
}

const ExportSelectModal: React.FC<ExportSelectModalProps> = ({ isOpen, onClose, title }) => {
  const [elements, setElements] = useState<ExportableElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Scan DOM for exportable elements when modal opens
  useEffect(() => {
    if (isOpen) {
      const foundElements: ExportableElement[] = [];
      document.querySelectorAll('[data-export-id]').forEach((el) => {
        const id = el.getAttribute('data-export-id');
        const label = el.getAttribute('data-export-label');
        if (id && label) {
          foundElements.push({ id, label });
        }
      });
      setElements(foundElements);
      // Select all by default
      setSelectedIds(foundElements.map(e => e.id));
    }
  }, [isOpen]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === elements.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(elements.map(e => e.id));
    }
  };

  const captureImages = async (): Promise<{ title: string, dataUrl: string, width: number, height: number }[]> => {
    const images = [];
    
    // Sort selectedIds based on their appearance in the 'elements' list to maintain DOM order
    const sortedIds = elements.filter(e => selectedIds.includes(e.id)).map(e => e.id);

    for (const id of sortedIds) {
      const element = document.querySelector(`[data-export-id="${id}"]`) as HTMLElement;
      const label = element?.getAttribute('data-export-label') || '';
      
      if (element && window.html2canvas) {
        // Temporary style fix for capture (avoid transparent backgrounds in some cases)
        const originalBg = element.style.backgroundColor;
        if (!originalBg) element.style.backgroundColor = '#ffffff';

        try {
          const canvas = await window.html2canvas(element, { scale: 2, useCORS: true, logging: false });
          images.push({
            title: label,
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height
          });
        } catch (e) {
          console.error(`Failed to capture ${id}`, e);
        } finally {
          element.style.backgroundColor = originalBg;
        }
      }
    }
    return images;
  };

  const handleExportWord = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    
    try {
      const images = await captureImages();
      
      const children: any[] = [
        new Paragraph({
          text: `Export Éléments - ${title}`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      ];

      images.forEach(img => {
        children.push(
          new Paragraph({
            text: img.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: fetch(img.dataUrl).then(r => r.blob()),
                transformation: {
                  width: 600, // Max width in Word (approx)
                  height: (img.height / img.width) * 600
                }
              })
            ]
          })
        );
      });

      const doc = new Document({
        sections: [{ properties: {}, children: children }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Export_Images_${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();

    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export Word.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportPDF = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);

    try {
      const images = await captureImages();
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const maxImgWidth = pageWidth - (margin * 2);

      let yPos = margin;

      doc.setFontSize(18);
      doc.text(`Export Éléments - ${title}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      images.forEach((img, index) => {
        // Check if we need a new page
        // Calculate image height in PDF units
        const imgHeight = (img.height / img.width) * maxImgWidth;
        
        if (yPos + imgHeight + 15 > pageHeight) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(12);
        doc.setTextColor(50);
        doc.text(img.title, margin, yPos);
        yPos += 7;

        doc.addImage(img.dataUrl, 'PNG', margin, yPos, maxImgWidth, imgHeight);
        yPos += imgHeight + 10;
      });

      doc.save(`Export_Images_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'export PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            Exporter des éléments
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-4">
            Sélectionnez les éléments à exporter sous forme d'images dans votre rapport.
          </p>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Éléments détectés</span>
            <button onClick={toggleAll} className="text-xs text-indigo-600 hover:underline">
              {selectedIds.length === elements.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="space-y-2">
            {elements.length === 0 ? (
               <p className="text-sm text-orange-500 italic">Aucun élément exportable détecté sur cette vue.</p>
            ) : (
              elements.map((el) => (
                <div 
                  key={el.id} 
                  onClick={() => toggleSelection(el.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${selectedIds.includes(el.id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}
                  `}
                >
                  {selectedIds.includes(el.id) ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm font-medium ${selectedIds.includes(el.id) ? 'text-indigo-900' : 'text-gray-600'}`}>
                    {el.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex gap-3">
          <button 
            onClick={handleExportWord}
            disabled={isProcessing || selectedIds.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Word
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isProcessing || selectedIds.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportSelectModal;