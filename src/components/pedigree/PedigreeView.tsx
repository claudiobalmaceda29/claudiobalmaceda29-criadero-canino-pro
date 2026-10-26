import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar } from '../../types';
import {
  GitFork,
  Printer,
  Search,
  Award,
  ShieldCheck,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  FileText,
  Eye,
  Download,
  Upload,
  Globe,
  ExternalLink,
  FileCheck2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { DogDetailModal } from '../dogs/DogDetailModal';
import { parsePedigreeFile } from '../../lib/pdfPedigreeParser';

export const PedigreeView: React.FC = () => {
  const {
    ejemplares,
    openPrintModal,
    updateEjemplar,
    currentUser,
    currentCriaderoId,
    extractPedigreeFromPDF,
  } = useApp();
  const [selectedDogId, setSelectedDogId] = useState<string>(ejemplares[0]?.id || '');
  const [generationsCount, setGenerationsCount] = useState<3 | 4>(4);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [viewingDetailDog, setViewingDetailDog] = useState<Ejemplar | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const isSuperAdmin =
    currentUser.rol === 'SUPER_ADMIN' ||
    currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

  const selectedDog = ejemplares.find((e) => e.id === selectedDogId) || ejemplares[0];
  const canEditSelectedDog = selectedDog && (isSuperAdmin || selectedDog.criaderoId === currentCriaderoId);

  // Helper to find ancestor dog in system by ID, POA or Name
  const findDogInSystem = (nameOrId?: string): Ejemplar | undefined => {
    if (!nameOrId || !nameOrId.trim()) return undefined;
    const clean = nameOrId.trim().toLowerCase();
    return ejemplares.find((e) => {
      if (e.id === nameOrId) return true;
      if (e.nombreCompleto.toLowerCase().trim() === clean) return true;
      if (e.numeroPOA && e.numeroPOA.toLowerCase().trim() === clean) return true;
      if (clean.length >= 4 && (e.nombreCompleto.toLowerCase().includes(clean) || clean.includes(e.nombreCompleto.toLowerCase()))) {
        return true;
      }
      return false;
    });
  };

  // Upload pedigree document for selected dog with OCR extraction
  const handleUploadPedigreeDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDog) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setIsExtractingPdf(true);
    setExtractionMessage(null);
    setExtractionError(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (!ev.target?.result) {
        setIsExtractingPdf(false);
        setExtractionError('No se pudo leer el archivo seleccionado.');
        return;
      }
      const base64Data = ev.target.result as string;
      const baseUpdates: Partial<Ejemplar> = {
        pedigreeDocUrl: base64Data,
        pedigreeDocNombre: file.name,
        pedigreeDocTipo: isPdf ? 'PDF' : 'IMAGEN',
        pedigreeDocFecha: new Date().toISOString().split('T')[0],
        pedigreeDocSize: `${(file.size / 1024).toFixed(0)} KB`,
      };

      // Save base attached file
      await updateEjemplar(selectedDog.id, baseUpdates);

      try {
        const res = await parsePedigreeFile(file, ejemplares);
        if (res.success && res.data) {
          const data = res.data;
          const lineageUpdates: Partial<Ejemplar> = {};
          if (data.padre?.nombre) {
            lineageUpdates.padreNombre = data.padre.nombre;
            if (res.matchedFather) {
              lineageUpdates.padreId = res.matchedFather.id;
            }
          }
          if (data.madre?.nombre) {
            lineageUpdates.madreNombre = data.madre.nombre;
            if (res.matchedMother) {
              lineageUpdates.madreId = res.matchedMother.id;
            }
          }
          if (data.abueloPaterno?.nombre) lineageUpdates.abueloPaterno = data.abueloPaterno.nombre;
          if (data.abuelaPaterna?.nombre) lineageUpdates.abuelaPaterna = data.abuelaPaterna.nombre;
          if (data.abueloMaterno?.nombre) lineageUpdates.abueloMaterno = data.abueloMaterno.nombre;
          if (data.abuelaMaterna?.nombre) lineageUpdates.abuelaMaterna = data.abuelaMaterna.nombre;
          if (data.bisabuelos) {
            lineageUpdates.bisabuelos = {
              ...(selectedDog.bisabuelos || {}),
              ...data.bisabuelos,
            };
          }
          if (data.sujeto?.numeroPOA && !selectedDog.numeroPOA) {
            lineageUpdates.numeroPOA = data.sujeto.numeroPOA;
          }

          await updateEjemplar(selectedDog.id, { ...baseUpdates, ...lineageUpdates });
          const count = res.ancestorsCount || data.conteoAntepasadosIdentificados || 0;
          setExtractionMessage(
            `¡Genealogía extraída con éxito! Se completaron ${count} antepasados del pedigree oficial (${file.name}).`
          );
        } else {
          setExtractionMessage('Documento de pedigree adjuntado exitosamente.');
        }
      } catch (err: any) {
        console.error('Error extracting pedigree in PedigreeView:', err);
        setExtractionError('Documento guardado, pero ocurrió un problema con la extracción automática OCR.');
      } finally {
        setIsExtractingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Render ancestor card: clickable if in system, plain text without link if not
  const renderAncestorNode = (
    label: string,
    name?: string,
    explicitId?: string,
    isDirectParent: boolean = false,
    branch: 'SIRE' | 'DAM' = 'SIRE'
  ) => {
    const matched = (explicitId && findDogInSystem(explicitId)) || findDogInSystem(name);

    if (matched) {
      return (
        <div
          onClick={() => setSelectedDogId(matched.id)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
            isDirectParent
              ? branch === 'SIRE'
                ? 'bg-blue-100/70 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                : 'bg-rose-100/70 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/60'
              : 'bg-white dark:bg-slate-800/90 hover:bg-blue-50/70 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 hover:border-blue-400'
          }`}
          title={`Ver pedigree de ${matched.nombreCompleto} (Click para cambiar árbol)`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`text-[9px] uppercase font-bold tracking-wider ${
                branch === 'SIRE' ? 'text-blue-700 dark:text-blue-400' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              {label}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-900/50 group-hover:bg-blue-600 group-hover:text-white px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5">
                <span>En Criadero</span>
                <span>↗</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {matched.fotoUrl && (
              <img
                src={matched.fotoUrl}
                alt={matched.nombreCompleto}
                className="w-6 h-6 rounded-md object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            )}
            <strong className="text-blue-900 dark:text-blue-100 group-hover:text-blue-950 dark:group-hover:text-white font-black text-xs truncate block">
              {matched.nombreCompleto}
            </strong>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate flex items-center justify-between">
            <span>{matched.numeroPOA ? `POA: ${matched.numeroPOA}` : 'POA s/n'}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewingDetailDog(matched);
              }}
              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold hover:underline"
              title="Abrir ficha completa"
            >
              Ficha
            </button>
          </div>
        </div>
      );
    }

    // Unregistered ancestor: strictly plain text without links or pointer styling
    return (
      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">{label}</span>
        <span className="text-slate-800 dark:text-slate-100 text-xs font-bold block truncate mt-0.5">
          {name || 'Sin registrar'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GitFork className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Genealogía y Pedigrees POA
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Visualizador interactivo de líneas de sangre, antepasados y documentos de pedigree oficiales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Generation toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl text-xs">
            <button
              onClick={() => setGenerationsCount(3)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                generationsCount === 3
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3 Generaciones
            </button>
            <button
              onClick={() => setGenerationsCount(4)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                generationsCount === 4
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              4 Generaciones
            </button>
          </div>

          {/* Pedigree Doc Button (View / Upload) */}
          {selectedDog?.pedigreeDocUrl ? (
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Ver PDF o imagen del pedigree oficial adjunto"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Pedigree Adjunto</span>
            </button>
          ) : (
            canEditSelectedDog && (
              <label className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Adjuntar Pedigree (PDF/Img)</span>
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUploadPedigreeDoc} />
              </label>
            )
          )}

          {selectedDog && (
            <button
              onClick={() => openPrintModal('PEDIGREE', selectedDog.id)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Pedigree Oficial</span>
            </button>
          )}
        </div>
      </div>

      {/* Pedigree OCR Extraction Feedback Banners */}
      {isExtractingPdf && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 flex items-center gap-2.5 text-xs">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          <div>
            <strong className="block font-bold">Extrayendo genealogía con IA y OCR...</strong>
            <span className="text-[11px] text-blue-700 dark:text-blue-300">
              Analizando documento oficial de pedigree y actualizando el árbol de 4 generaciones.
            </span>
          </div>
        </div>
      )}

      {extractionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{extractionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setExtractionMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {extractionError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{extractionError}</span>
        </div>
      )}

      {/* Dog Selector Strip */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Ejemplar en consulta:</label>
          <select
            value={selectedDogId}
            onChange={(e) => setSelectedDogId(e.target.value)}
            className="w-full md:w-80 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-bold"
          >
            {ejemplares.map((dog) => (
              <option key={dog.id} value={dog.id}>
                {dog.nombreCompleto} ({dog.sexo} • {dog.numeroPOA || 'S/N'})
              </option>
            ))}
          </select>
        </div>

        {selectedDog && (
          <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">HD:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedDog.displasiaCadera}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">ED:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedDog.displasiaCodo}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">POA:</span>
              <span className="font-mono text-blue-700 dark:text-blue-400 font-semibold">{selectedDog.numeroPOA || 'En trámite'}</span>
            </div>

            <button
              type="button"
              onClick={() => setViewingDetailDog(selectedDog)}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[11px] transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
            >
              Ver Ficha Completa
            </button>
          </div>
        )}
      </div>

      {/* Mobile scroll hint */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300">
        <span>👈 Deslizá horizontalmente para ver todas las generaciones</span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">Árbol Interactivo</span>
      </div>

      {/* Main Pedigree Tree Visualizer */}
      {selectedDog ? (
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          <div className="min-w-[880px] space-y-6">
            {/* Subject Node */}
            <div className="flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-400 dark:border-blue-700 max-w-md w-full text-center shadow-xs">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 uppercase">
                    EJEMPLAR SUJETO ({selectedDog.sexo})
                  </span>
                  {selectedDog.pedigreeDocUrl && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileCheck2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                      <span>Pedigree {selectedDog.pedigreeDocTipo || 'Doc'}</span>
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{selectedDog.nombreCompleto}</h3>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-mono mt-0.5 font-semibold">
                  {selectedDog.afijo} • POA: {selectedDog.numeroPOA} • Chip: {selectedDog.microchip || 'S/N'}
                </div>
                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex justify-center gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{selectedDog.displasiaCadera}</span>
                  <span>•</span>
                  <span className="font-medium">{selectedDog.calificacionCria}</span>
                </div>
              </div>
            </div>

            {/* Tree Branching Grid */}
            <div className="grid grid-cols-1 gap-6">
              {/* SIRE BRANCH (PADRE) */}
              <div className="p-4 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/40 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    LÍNEA PATERNA (PADRE Y ANTEPASADOS)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {generationsCount === 4 ? '3 Generaciones de Antepasados' : '2 Generaciones de Antepasados'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Father (1st Gen) */}
                  <div className="flex flex-col justify-center">
                    {renderAncestorNode('PADRE', selectedDog.padreNombre, selectedDog.padreId, true, 'SIRE')}
                  </div>

                  {/* Grandparents (2nd Gen) */}
                  <div className="space-y-2">
                    {renderAncestorNode('ABUELO PATERNO', selectedDog.abueloPaterno, undefined, false, 'SIRE')}
                    {renderAncestorNode('ABUELA PATERNA', selectedDog.abuelaPaterna, undefined, false, 'SIRE')}
                  </div>

                  {/* Great-Grandparents (3rd / 4th Gen) */}
                  {generationsCount === 4 && (
                    <div className="space-y-1.5 text-[11px]">
                      {renderAncestorNode('BISABUELO', selectedDog.bisabuelos?.pp_p, undefined, false, 'SIRE')}
                      {renderAncestorNode('BISABUELA', selectedDog.bisabuelos?.pp_m, undefined, false, 'SIRE')}
                      {renderAncestorNode('BISABUELO', selectedDog.bisabuelos?.pm_p, undefined, false, 'SIRE')}
                      {renderAncestorNode('BISABUELA', selectedDog.bisabuelos?.pm_m, undefined, false, 'SIRE')}
                    </div>
                  )}
                </div>
              </div>

              {/* DAM BRANCH (MADRE) */}
              <div className="p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-4">
                <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900/40 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    LÍNEA MATERNA (MADRE Y ANTEPASADOS)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {generationsCount === 4 ? '3 Generaciones de Antepasados' : '2 Generaciones de Antepasados'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Mother (1st Gen) */}
                  <div className="flex flex-col justify-center">
                    {renderAncestorNode('MADRE', selectedDog.madreNombre, selectedDog.madreId, true, 'DAM')}
                  </div>

                  {/* Grandparents (2nd Gen) */}
                  <div className="space-y-2">
                    {renderAncestorNode('ABUELO MATERNO', selectedDog.abueloMaterno, undefined, false, 'DAM')}
                    {renderAncestorNode('ABUELA MATERNA', selectedDog.abuelaMaterna, undefined, false, 'DAM')}
                  </div>

                  {/* Great-Grandparents (3rd / 4th Gen) */}
                  {generationsCount === 4 && (
                    <div className="space-y-1.5 text-[11px]">
                      {renderAncestorNode('BISABUELO', selectedDog.bisabuelos?.mp_p, undefined, false, 'DAM')}
                      {renderAncestorNode('BISABUELA', selectedDog.bisabuelos?.mp_m, undefined, false, 'DAM')}
                      {renderAncestorNode('BISABUELO', selectedDog.bisabuelos?.mm_p, undefined, false, 'DAM')}
                      {renderAncestorNode('BISABUELA', selectedDog.bisabuelos?.mm_m, undefined, false, 'DAM')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 shadow-xs">
          No hay ejemplares registrados en este criadero para consultar pedigrees.
        </div>
      )}

      {/* Embedded Document Preview Modal for Pedigree (PDF / Image) */}
      {selectedDog?.pedigreeDocUrl && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Pedigree Oficial: ${selectedDog.nombreCompleto}`}
          docUrl={selectedDog.pedigreeDocUrl}
          docNombre={selectedDog.pedigreeDocNombre || `pedigree_${selectedDog.nombreCompleto.replace(/\s+/g, '_')}.pdf`}
          docTipo={selectedDog.pedigreeDocTipo || 'PDF'}
        />
      )}

      {/* Dog Detail Modal if user clicked 'Ficha' */}
      {viewingDetailDog && (
        <DogDetailModal
          dog={viewingDetailDog}
          onClose={() => setViewingDetailDog(null)}
          onEdit={() => {}}
        />
      )}
    </div>
  );
};
