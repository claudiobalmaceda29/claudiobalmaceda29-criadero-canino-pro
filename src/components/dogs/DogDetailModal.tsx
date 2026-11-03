import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar } from '../../types';
import {
  X,
  Dog,
  GitFork,
  Stethoscope,
  HeartHandshake,
  Trophy,
  Printer,
  Edit,
  Trash2,
  Award,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FolderKanban,
  FileText,
  Activity,
  Globe,
  ExternalLink,
  Upload,
  Download,
  Eye,
  ArrowLeft,
  FileCheck2,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
  Plus,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { DogFormModal } from './DogFormModal';
import { calculateDogAge, formatDateDMY } from '../../lib/dogUtils';
import { persistPedigreeDocument } from '../../lib/documentStorage';

interface DogDetailModalProps {
  dog: Ejemplar;
  onClose: () => void;
  onEdit: () => void;
}

export const DogDetailModal: React.FC<DogDetailModalProps> = ({ dog, onClose, onEdit }) => {
  const {
    montas,
    camadas,
    exposiciones,
    registrosSanitarios,
    addRegistroSanitario,
    deleteRegistroSanitario,
    deleteEjemplar,
    retirarEjemplar,
    reactivarEjemplar,
    updateEjemplar,
    openPrintModal,
    ejemplares,
    currentUser,
    currentCriaderoId,
    currentCriadero,
  } = useApp();

  const [currentDog, setCurrentDog] = useState<Ejemplar>(dog);
  const [dogHistory, setDogHistory] = useState<Ejemplar[]>([]);
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'PEDIGREE' | 'SANIDAD' | 'REPRO' | 'EXPO'>('RESUMEN');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCloningModalOpen, setIsCloningModalOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  // Pedigree document upload states
  const [isUploadingPedigree, setIsUploadingPedigree] = useState(false);
  const [pedigreeUploadProgress, setPedigreeUploadProgress] = useState<string | null>(null);
  const [pedigreeFeedback, setPedigreeFeedback] = useState<string | null>(null);
  const [pedigreeError, setPedigreeError] = useState<string | null>(null);

  const handleUploadPedigreeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setIsUploadingPedigree(true);
      setPedigreeUploadProgress('Subiendo archivo oficial a almacenamiento seguro...');
      setPedigreeFeedback(null);
      setPedigreeError(null);

      const persisted = await persistPedigreeDocument(
        file,
        currentDog.nombreCompleto || currentDog.id,
        (pct, text) => setPedigreeUploadProgress(text)
      );

      const pedigreeUpdates: Partial<Ejemplar> = {
        pedigreeDocUrl: persisted.url,
        pedigreeDocNombre: persisted.docNombre,
        pedigreeDocTipo: persisted.docTipo,
        pedigreeDocFecha: new Date().toISOString().split('T')[0],
        pedigreeDocSize: persisted.sizeStr,
      };

      await updateEjemplar(currentDog.id, pedigreeUpdates);
      setCurrentDog((prev) => ({ ...prev, ...pedigreeUpdates }));
      setPedigreeFeedback('¡Documento de Pedigree físico guardado exitosamente en Firestore!');
    } catch (err: any) {
      console.error('Error guardando documento de pedigree:', err);
      setPedigreeError('No se pudo guardar el documento de pedigree. Intente nuevamente.');
    } finally {
      setIsUploadingPedigree(false);
      setPedigreeUploadProgress(null);
    }
  };

  // Health modal and form states
  const [isAddingSanitaryRecord, setIsAddingSanitaryRecord] = useState(false);
  const [newSanTipo, setNewSanTipo] = useState<'VACUNA' | 'DESPARASITACION' | 'ESTUDIO' | 'CONTROL'>('VACUNA');
  const [newSanNombre, setNewSanNombre] = useState('');
  const [newSanFecha, setNewSanFecha] = useState(new Date().toISOString().split('T')[0]);
  const [newSanProxFecha, setNewSanProxFecha] = useState('');
  const [newSanDosis, setNewSanDosis] = useState('');
  const [newSanVet, setNewSanVet] = useState('Dr. Fernando Soria (MP 4921)');
  const [newSanObs, setNewSanObs] = useState('');
  const [sanitaryFeedback, setSanitaryFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDog(dog);
    setDogHistory([]);
  }, [dog]);

  const isSuperAdmin =
    currentUser.rol === 'SUPER_ADMIN' ||
    currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';
  const isOwnerDog =
    currentDog.criaderoId === currentCriaderoId ||
    (currentUser?.id && currentDog.criaderoId === currentUser.id) ||
    ((currentUser as any)?.uid && currentDog.criaderoId === (currentUser as any).uid);
  const canEditDog = isSuperAdmin || isOwnerDog;
  const isExternalDogFromOther = !canEditDog && (currentDog.esDelPlantel === false || currentDog.esExterno === true);

  // Associated matings
  const dogMontas = montas.filter((m) => m.machoId === currentDog.id || m.hembraId === currentDog.id);

  // Associated litters
  const dogCamadas = camadas.filter((c) => c.padreId === currentDog.id || c.madreId === currentDog.id);

  // Associated shows
  const dogExpos = exposiciones.filter((e) => e.ejemplarId === currentDog.id);

  const handleDelete = () => {
    deleteEjemplar(currentDog.id);
    onClose();
  };

  // Find dog in system by ID, POA or Name
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

  const handleNavigateToAncestor = (ancestor: Ejemplar) => {
    setDogHistory((prev) => [...prev, currentDog]);
    setCurrentDog(ancestor);
  };

  const handleGoBackInHistory = () => {
    if (dogHistory.length === 0) return;
    const previous = dogHistory[dogHistory.length - 1];
    setDogHistory((prev) => prev.slice(0, -1));
    setCurrentDog(previous);
  };



  // Helper to render an ancestor node (clickable if in system, plain text if not)
  const renderAncestorNode = (label: string, name?: string, explicitId?: string, isDirectParent: boolean = false) => {
    const matched = (explicitId && findDogInSystem(explicitId)) || findDogInSystem(name);

    if (matched) {
      return (
        <div
          onClick={() => handleNavigateToAncestor(matched)}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
            isDirectParent
              ? 'bg-blue-100/70 border-blue-300 hover:border-blue-500 hover:bg-blue-100'
              : 'bg-white hover:bg-blue-50/80 border-slate-200 hover:border-blue-400'
          }`}
          title={`Ver ficha completa de ${matched.nombreCompleto}`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">{label}</span>
            <span className="text-[9px] font-black text-blue-700 bg-blue-100/90 group-hover:bg-blue-600 group-hover:text-white px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5">
              <span>En Criadero</span>
              <span>↗</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {matched.fotoUrl && (
              <img
                src={matched.fotoUrl}
                alt={matched.nombreCompleto}
                className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
              />
            )}
            <strong className="text-blue-900 group-hover:text-blue-950 font-black text-xs truncate block">
              {matched.nombreCompleto}
            </strong>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate flex items-center gap-1.5">
            <span>{matched.numeroPOA ? `POA: ${matched.numeroPOA}` : 'POA s/n'}</span>
            {matched.displasiaCadera && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{matched.displasiaCadera}</span>
              </>
            )}
          </div>
        </div>
      );
    }

    // Unregistered ancestor: strictly plain text without links or hover cursor
    return (
      <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
        <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">{label}</span>
        <span className="text-slate-800 text-xs font-bold block truncate mt-0.5">
          {name || 'Sin registrar'}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Navigation Breadcrumb if in history stack */}
        {dogHistory.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
            <button
              onClick={handleGoBackInHistory}
              className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a {dogHistory[dogHistory.length - 1].nombreCompleto}</span>
            </button>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Explorando genealogía ({dogHistory.length} niveles)
            </span>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentDog.fotoUrl ? (
              <img
                src={currentDog.fotoUrl}
                alt={currentDog.nombreCompleto}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-400">
                <Dog className="w-6 h-6 text-slate-500" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {currentDog.nombreCompleto}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    currentDog.sexo === 'MACHO' ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-pink-50 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
                  }`}
                >
                  {currentDog.sexo}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {calculateDogAge(currentDog.fechaNacimiento).text}
                </span>
                {currentDog.pedigreeDocUrl && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <FileCheck2 className="w-3 h-3" />
                    <span>Pedigree Adjunto</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-400 font-mono mt-0.5 font-bold flex flex-wrap items-center gap-2">
                <span>{currentDog.numeroPOA ? `POA: ${currentDog.numeroPOA}` : 'POA en trámite'}</span>
                <span>•</span>
                <span>Chip: {currentDog.microchip || 'S/N'}</span>
                {currentDog.pedigreeDatabaseUrl && (
                  <>
                    <span>•</span>
                    <a
                      href={currentDog.pedigreeDatabaseUrl.startsWith('http') ? currentDog.pedigreeDatabaseUrl : `https://${currentDog.pedigreeDatabaseUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors font-bold text-[11px] border border-blue-200 dark:border-blue-800"
                      title="Abrir ficha en PedigreeDatabase.com"
                    >
                      <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>PedigreeDatabase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isExternalDogFromOther && (
              <button
                type="button"
                onClick={() => setIsCloningModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Clonar / agregar este ejemplar externo a tu plantel para utilizarlo en tus montas y camadas"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Agregar a mi plantel</span>
              </button>
            )}
            {currentDog.pedigreeDocUrl && (
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                title="Ver PDF / Imagen de Pedigree Adjunto"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Ver Pedigree Adjunto</span>
              </button>
            )}
            <button
              onClick={() => openPrintModal('PEDIGREE', currentDog.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Imprimir Pedigree Oficial"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            {canEditDog && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Read-Only Mode Banner */}
        {!canEditDog && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong>Modo Solo Lectura:</strong> Este ejemplar pertenece a otro criadero registrado en la red.
              </span>
            </div>
            {isExternalDogFromOther && (
              <button
                type="button"
                onClick={() => setIsCloningModalOpen(true)}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                title="Clonar / agregar este ejemplar externo a tu plantel"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Agregar a mi plantel</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto text-xs">
          {[
            { id: 'RESUMEN', label: 'Resumen General', icon: Dog },
            { id: 'PEDIGREE', label: 'Pedigree 4 Generaciones', icon: GitFork },
            { id: 'SANIDAD', label: 'Sanidad Avanzada', icon: Stethoscope },
            { id: 'REPRO', label: `Reproducción (${dogMontas.length} / ${dogCamadas.length})`, icon: HeartHandshake },
            { id: 'EXPO', label: `Exposiciones (${dogExpos.length})`, icon: Trophy },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-xs rounded-t-lg'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
          {/* TAB 1: RESUMEN */}
          {activeTab === 'RESUMEN' && (
            <div className="space-y-5">

              {/* Photo & Identity grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 max-h-64 h-56 flex items-center justify-center shadow-xs">
                  {currentDog.fotoUrl ? (
                    <img
                      src={currentDog.fotoUrl}
                      alt={currentDog.nombreCompleto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <Dog className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-2" />
                      <span className="text-xs font-semibold text-slate-500">Sin foto asignada</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Editá el ejemplar para subir una foto</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Raza</span>
                      <strong className="text-slate-900 font-semibold text-xs">{currentDog.raza}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Afijo</span>
                      <strong className="text-blue-700 font-mono text-xs">{currentDog.afijo || currentCriadero?.afijo || 'Sin registrar'}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Fecha Nacimiento</span>
                      <strong className="text-slate-900 font-semibold text-xs">
                        {formatDateDMY(currentDog.fechaNacimiento)} ({calculateDogAge(currentDog.fechaNacimiento).text})
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Color / Manto</span>
                      <strong className="text-slate-900 font-semibold text-xs">{currentDog.color}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Pelo</span>
                      <strong className="text-slate-900 font-semibold text-xs">{currentDog.pelo}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Tatuaje POA</span>
                      <strong className="text-slate-900 font-mono text-xs">{currentDog.tatuaje || 'S/N'}</strong>
                    </div>

                    {/* Link PedigreeDatabase.com */}
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/90 shadow-xs col-span-2 sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-700 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          Link PedigreeDatabase.com
                        </span>
                        {currentDog.pedigreeDatabaseUrl && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                            Ficha Vinculada
                          </span>
                        )}
                      </div>
                      {currentDog.pedigreeDatabaseUrl ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                          <span className="text-xs font-mono text-blue-800 truncate font-semibold" title={currentDog.pedigreeDatabaseUrl}>
                            {currentDog.pedigreeDatabaseUrl}
                          </span>
                          <a
                            href={currentDog.pedigreeDatabaseUrl.startsWith('http') ? currentDog.pedigreeDatabaseUrl : `https://${currentDog.pedigreeDatabaseUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                          >
                            <span>Abrir Ficha en PedigreeDatabase</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                          <span>Sin enlace registrado a PedigreeDatabase.com</span>
                          {canEditDog && (
                            <button
                              type="button"
                              onClick={onEdit}
                              className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                            >
                              + Agregar enlace
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges and Titles */}
                  {currentDog.titulos && currentDog.titulos.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1.5 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        Títulos Obtenidos
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {currentDog.titulos.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Observations */}
                  {currentDog.observaciones && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Observaciones y Carácter
                      </span>
                      <p className="text-slate-700 leading-relaxed">{currentDog.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEDIGREE */}
          {activeTab === 'PEDIGREE' && (
            <div className="space-y-4">
              {/* Pedigree Document Header / Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Árbol Genealógico POA (4 Generaciones)</span>
                    {currentDog.pedigreeDatabaseUrl && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        PedigreeDatabase
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Hacé click en cualquier antepasado cargado en el sistema para navegar a su ficha y pedigree.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentDog.pedigreeDatabaseUrl && (
                    <a
                      href={currentDog.pedigreeDatabaseUrl.startsWith('http') ? currentDog.pedigreeDatabaseUrl : `https://${currentDog.pedigreeDatabaseUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer shadow-xs"
                      title="Abrir ficha en PedigreeDatabase.com"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>PedigreeDatabase</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => openPrintModal('PEDIGREE', currentDog.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Pedigree</span>
                  </button>
                </div>
              </div>

              {/* Documento de Pedigree Físico Adjunto (PDF o Imagen) */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Documento de Pedigree Físico (PDF / Imagen)</span>
                        {currentDog.pedigreeDocUrl && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Cargado
                          </span>
                        )}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {currentDog.pedigreeDocUrl
                          ? `${currentDog.pedigreeDocNombre || 'Documento oficial'} • ${currentDog.pedigreeDocSize || 'Archivo adjunto'}`
                          : 'Cargá y respaldá el pedigree oficial emitido por POA o federación canina en Firebase Storage.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {currentDog.pedigreeDocUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Documento</span>
                        </button>
                        <a
                          href={currentDog.pedigreeDocUrl}
                          download={currentDog.pedigreeDocNombre || `pedigree_${currentDog.nombreCompleto}.pdf`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar</span>
                        </a>
                      </>
                    )}

                    {canEditDog && (
                      <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentDog.pedigreeDocUrl ? 'Reemplazar Pedigree' : '+ Cargar Pedigree Físico'}</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/webp"
                          onChange={handleUploadPedigreeFile}
                          className="hidden"
                          disabled={isUploadingPedigree}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {isUploadingPedigree && (
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                    <span>{pedigreeUploadProgress || 'Subiendo documento oficial a Firebase Storage...'}</span>
                  </div>
                )}

                {pedigreeFeedback && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                    <span className="font-bold">{pedigreeFeedback}</span>
                    <button type="button" onClick={() => setPedigreeFeedback(null)} className="text-xs font-bold text-emerald-700">✕</button>
                  </div>
                )}

                {pedigreeError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{pedigreeError}</span>
                  </div>
                )}
              </div>

              {/* 4 Generation Interactive Chart */}
              {(() => {
                const fatherDog =
                  (currentDog.padreId && findDogInSystem(currentDog.padreId)) ||
                  findDogInSystem(currentDog.padreNombre);
                const motherDog =
                  (currentDog.madreId && findDogInSystem(currentDog.madreId)) ||
                  findDogInSystem(currentDog.madreNombre);

                const finalAbueloPaterno = currentDog.abueloPaterno || fatherDog?.padreNombre;
                const finalAbuelaPaterna = currentDog.abuelaPaterna || fatherDog?.madreNombre;
                const finalAbueloMaterno = currentDog.abueloMaterno || motherDog?.padreNombre;
                const finalAbuelaMaterna = currentDog.abuelaMaterna || motherDog?.madreNombre;

                const abueloPaternoDog = findDogInSystem(fatherDog?.padreId) || findDogInSystem(finalAbueloPaterno);
                const abuelaPaternaDog = findDogInSystem(fatherDog?.madreId) || findDogInSystem(finalAbuelaPaterna);
                const abueloMaternoDog = findDogInSystem(motherDog?.padreId) || findDogInSystem(finalAbueloMaterno);
                const abuelaMaternaDog = findDogInSystem(motherDog?.madreId) || findDogInSystem(finalAbuelaMaterna);

                const finalPpP = currentDog.bisabuelos?.pp_p || fatherDog?.bisabuelos?.pp_p || fatherDog?.abueloPaterno || abueloPaternoDog?.padreNombre;
                const finalPpM = currentDog.bisabuelos?.pp_m || fatherDog?.bisabuelos?.pp_m || fatherDog?.abuelaPaterna || abueloPaternoDog?.madreNombre;
                const finalPmP = currentDog.bisabuelos?.pm_p || fatherDog?.bisabuelos?.pm_p || fatherDog?.abueloMaterno || abuelaPaternaDog?.padreNombre;
                const finalPmM = currentDog.bisabuelos?.pm_m || fatherDog?.bisabuelos?.pm_m || fatherDog?.abuelaMaterna || abuelaPaternaDog?.madreNombre;

                const finalMpP = currentDog.bisabuelos?.mp_p || motherDog?.bisabuelos?.mp_p || motherDog?.abueloPaterno || abueloMaternoDog?.padreNombre;
                const finalMpM = currentDog.bisabuelos?.mp_m || motherDog?.bisabuelos?.mp_m || motherDog?.abuelaPaterna || abueloMaternoDog?.madreNombre;
                const finalMmP = currentDog.bisabuelos?.mm_p || motherDog?.bisabuelos?.mm_p || motherDog?.abueloMaterno || abuelaMaternaDog?.padreNombre;
                const finalMmM = currentDog.bisabuelos?.mm_m || motherDog?.bisabuelos?.mm_m || motherDog?.abuelaMaterna || abuelaMaternaDog?.madreNombre;

                return (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs overflow-x-auto shadow-xs">
                    <div className="min-w-[760px] space-y-4">
                      {/* SIRE BRANCH (PADRE) */}
                      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                          <span className="text-xs font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-blue-600" />
                            Línea Paterna (Padre y Antepasados)
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold">Generaciones I, II y III</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Father (1st Gen) */}
                          <div className="flex flex-col justify-center">
                            {renderAncestorNode('PADRE', currentDog.padreNombre, currentDog.padreId, true)}
                          </div>

                          {/* Grandparents (2nd Gen) */}
                          <div className="space-y-2">
                            {renderAncestorNode('ABUELO PATERNO', finalAbueloPaterno)}
                            {renderAncestorNode('ABUELA PATERNA', finalAbuelaPaterna)}
                          </div>

                          {/* Great-Grandparents (3rd Gen) */}
                          <div className="space-y-1.5 text-[11px]">
                            {renderAncestorNode('BISABUELO', finalPpP)}
                            {renderAncestorNode('BISABUELA', finalPpM)}
                            {renderAncestorNode('BISABUELO', finalPmP)}
                            {renderAncestorNode('BISABUELA', finalPmM)}
                          </div>
                        </div>
                      </div>

                      {/* DAM BRANCH (MADRE) */}
                      <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-3">
                        <div className="flex items-center justify-between border-b border-rose-100 pb-1.5">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-rose-600" />
                            Línea Materna (Madre y Antepasados)
                          </span>
                          <span className="text-[10px] text-rose-600 font-semibold">Generaciones I, II y III</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Mother (1st Gen) */}
                          <div className="flex flex-col justify-center">
                            {renderAncestorNode('MADRE', currentDog.madreNombre, currentDog.madreId, true)}
                          </div>

                          {/* Grandparents (2nd Gen) */}
                          <div className="space-y-2">
                            {renderAncestorNode('ABUELO MATERNO', finalAbueloMaterno)}
                            {renderAncestorNode('ABUELA MATERNA', finalAbuelaMaterna)}
                          </div>

                          {/* Great-Grandparents (3rd Gen) */}
                          <div className="space-y-1.5 text-[11px]">
                            {renderAncestorNode('BISABUELO', finalMpP)}
                            {renderAncestorNode('BISABUELA', finalMpM)}
                            {renderAncestorNode('BISABUELO', finalMmP)}
                            {renderAncestorNode('BISABUELA', finalMmM)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: SANIDAD AVANZADA */}
          {activeTab === 'SANIDAD' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Certificados y Sanidad Oficial</h4>
                  <p className="text-xs text-slate-500">Evaluaciones oficiales de displasia, brucelosis y libreta digital de vacunas</p>
                </div>
                <div className="flex items-center gap-2">
                  {canEditDog && (
                    <button
                      type="button"
                      onClick={() => setIsAddingSanitaryRecord(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Nueva Vacuna / Control</span>
                    </button>
                  )}
                  <button
                    onClick={() => openPrintModal('HEALTH_BOOK', currentDog.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Imprimir Libreta</span>
                  </button>
                </div>
              </div>

              {sanitaryFeedback && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{sanitaryFeedback}</span>
                </div>
              )}

              {/* Health Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Displasia Cadera (HD)</span>
                  <div className="text-sm font-bold text-emerald-700 mt-1">{currentDog.displasiaCadera}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Baremos oficiales POA/SV</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Displasia Codo (ED)</span>
                  <div className="text-sm font-bold text-emerald-700 mt-1">{currentDog.displasiaCodo}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Aprobado para cría</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Test de Brucelosis</span>
                  <div className="text-sm font-bold text-emerald-700 mt-1">
                    {currentDog.brucelosis?.resultado || 'NEGATIVO'}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Vigencia: {currentDog.brucelosis?.vigenciaHasta ? formatDateDMY(currentDog.brucelosis.vigenciaHasta) : 'Al día'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Registro de ADN</span>
                  <div className="text-sm font-bold text-blue-700 mt-1">{currentDog.adn || 'Comprobado'}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Filiación verificada</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Selección de Cría</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">{currentDog.calificacionCria}</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Comisión de Cría POA</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Medicación Actual</span>
                  <div className="text-xs text-slate-700 mt-1">{currentDog.medicacionActual || 'Ninguna'}</div>
                </div>
              </div>

              {/* Libreta Digital: Listado de Vacunas, Desparasitaciones y Controles */}
              {(() => {
                const dogRecords = registrosSanitarios
                  .filter((r) => r.ejemplarId === currentDog.id)
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

                return (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Historial de Inmunizaciones y Controles Veterinarios
                        </h5>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {dogRecords.length} {dogRecords.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>

                    {dogRecords.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                        <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-medium">
                          No hay vacunas ni desparasitaciones registradas aún para {currentDog.nombreCompleto}.
                        </p>
                        {canEditDog && (
                          <button
                            type="button"
                            onClick={() => setIsAddingSanitaryRecord(true)}
                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Registrar Primera Dosis</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                        {dogRecords.map((reg) => (
                          <div
                            key={reg.id}
                            className="p-3 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                                  reg.tipo === 'VACUNA'
                                    ? 'bg-blue-100 text-blue-800'
                                    : reg.tipo === 'DESPARASITACION'
                                    ? 'bg-purple-100 text-purple-800'
                                    : reg.tipo === 'ESTUDIO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {reg.tipo}
                              </span>

                              <div className="min-w-0">
                                <strong className="text-slate-900 font-bold block truncate">
                                  {reg.nombre}
                                </strong>
                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span>Fecha: <strong className="text-slate-700 font-semibold">{formatDateDMY(reg.fecha)}</strong></span>
                                  {reg.proximaFecha && (
                                    <>
                                      <span>•</span>
                                      <span className="text-amber-700 font-medium">
                                        Próximo: {formatDateDMY(reg.proximaFecha)}
                                      </span>
                                    </>
                                  )}
                                  {reg.dosisOLote && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono text-slate-500">Lote: {reg.dosisOLote}</span>
                                    </>
                                  )}
                                  {reg.veterinario && (
                                    <>
                                      <span>•</span>
                                      <span className="text-slate-600">{reg.veterinario}</span>
                                    </>
                                  )}
                                </div>
                                {reg.observaciones && (
                                  <p className="text-[10px] text-slate-500 mt-1 italic">
                                    {reg.observaciones}
                                  </p>
                                )}
                              </div>
                            </div>

                            {canEditDog && (
                              <button
                                type="button"
                                onClick={() => deleteRegistroSanitario(reg.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-end sm:self-center shrink-0"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Inline modal to add sanitary record */}
              {isAddingSanitaryRecord && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                  <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-4 space-y-3 text-xs text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                        <span>Nueva Inmunización / Control Sanitario</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingSanitaryRecord(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newSanNombre.trim()) return;
                        try {
                          await addRegistroSanitario({
                            criaderoId: currentDog.criaderoId || currentCriaderoId,
                            ejemplarId: currentDog.id,
                            tipo: newSanTipo,
                            nombre: newSanNombre.trim(),
                            fecha: newSanFecha,
                            proximaFecha: newSanProxFecha || undefined,
                            dosisOLote: newSanDosis || undefined,
                            veterinario: newSanVet,
                            observaciones: newSanObs || undefined,
                          });
                          setIsAddingSanitaryRecord(false);
                          setNewSanNombre('');
                          setNewSanDosis('');
                          setNewSanProxFecha('');
                          setNewSanObs('');
                          setSanitaryFeedback('¡Vacuna / control registrado con éxito!');
                          setTimeout(() => setSanitaryFeedback(null), 3500);
                        } catch (err: any) {
                          console.error('Error registrando sanidad:', err);
                        }
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tipo de Evento</label>
                        <select
                          value={newSanTipo}
                          onChange={(e) => setNewSanTipo(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="VACUNA">VACUNA</option>
                          <option value="DESPARASITACION">DESPARASITACIÓN</option>
                          <option value="ESTUDIO">ESTUDIO / ANÁLISIS</option>
                          <option value="CONTROL">CONTROL DE RUTINA</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nombre de Vacuna / Tratamiento *
                        </label>
                        <input
                          type="text"
                          required
                          value={newSanNombre}
                          onChange={(e) => setNewSanNombre(e.target.value)}
                          placeholder="ej: Séxtuple + Coronavirus (Vanguard Plus 5/CV-L)"
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Fecha de Aplicación</label>
                          <input
                            type="date"
                            required
                            value={newSanFecha}
                            onChange={(e) => setNewSanFecha(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Próximo Vencimiento</label>
                          <input
                            type="date"
                            value={newSanProxFecha}
                            onChange={(e) => setNewSanProxFecha(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Lote / Dosis</label>
                          <input
                            type="text"
                            value={newSanDosis}
                            onChange={(e) => setNewSanDosis(e.target.value)}
                            placeholder="ej: Lote #4921-A"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Veterinario</label>
                          <input
                            type="text"
                            value={newSanVet}
                            onChange={(e) => setNewSanVet(e.target.value)}
                            placeholder="Dr. Veterinario"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                        <input
                          type="text"
                          value={newSanObs}
                          onChange={(e) => setNewSanObs(e.target.value)}
                          placeholder="Sin reacciones adversas, peso 32kg"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsAddingSanitaryRecord(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Guardar Registro
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REPRODUCCION */}
          {activeTab === 'REPRO' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Historial Reproductivo</h4>
                <p className="text-xs text-slate-500">Montas registradas y camadas obtenidas</p>
              </div>

              {/* Litters produced */}
              <div>
                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-amber-600" />
                  Camadas Registradas ({dogCamadas.length})
                </h5>
                <div className="space-y-2">
                  {dogCamadas.map((camada) => (
                    <div
                      key={camada.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <strong className="text-slate-900 font-bold">{camada.identificador}</strong>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Nacimiento: {formatDateDMY(camada.fechaNacimiento)} • Total: {camada.totalCachorros} cachorros ({camada.nacidosVivos} vivos)
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {camada.estado}
                      </span>
                    </div>
                  ))}
                  {dogCamadas.length === 0 && (
                    <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      Sin camadas registradas para este ejemplar.
                    </div>
                  )}
                </div>
              </div>

              {/* Matings */}
              <div className="pt-2">
                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-pink-600" />
                  Montas Realizadas ({dogMontas.length})
                </h5>
                <div className="space-y-2">
                  {dogMontas.map((monta) => (
                    <div
                      key={monta.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <strong className="text-slate-900">
                          {monta.hembraNombre} x {monta.machoNombre}
                        </strong>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Fecha: {formatDateDMY(monta.fechaMonta)} • Servicio: {monta.tipoServicio}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {monta.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EXPO */}
          {activeTab === 'EXPO' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Participaciones en Torneos y Exposiciones POA</h4>
              <div className="space-y-2 text-xs">
                {dogExpos.map((expo) => (
                  <div
                    key={expo.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-slate-900 font-bold">{expo.nombreEvento}</strong>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {expo.puesto}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                      <span>Fecha: {formatDateDMY(expo.fecha)}</span>
                      <span>•</span>
                      <span>Lugar: {expo.lugar}</span>
                      <span>•</span>
                      <span>Juez: {expo.juez}</span>
                    </div>
                    <div className="text-blue-700 font-semibold text-[11px]">
                      Calificación: {expo.calificacion}
                    </div>
                    {expo.observaciones && (
                      <p className="text-slate-600 text-[11px] italic">&quot;{expo.observaciones}&quot;</p>
                    )}
                  </div>
                ))}
                {dogExpos.length === 0 && (
                  <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                    Sin participaciones de torneos registradas para este ejemplar.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div>
            {canEditDog && (
              <>
                {currentDog.estado === 'RETIRADO' || currentDog.activoEnPlantel === false ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      Ejemplar Retirado / Histórico
                    </span>
                    <button
                      type="button"
                      disabled={isReactivating}
                      onClick={async () => {
                        try {
                          setIsReactivating(true);
                          await reactivarEjemplar(currentDog.id);
                          setCurrentDog((prev) => ({
                            ...prev,
                            estado: 'ACTIVO',
                            activoEnPlantel: true,
                            estadoReproductivo: 'ACTIVO',
                          }));
                        } catch (err) {
                          console.error('Error reactivando ejemplar:', err);
                        } finally {
                          setIsReactivating(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isReactivating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                      <span>Reactivar en Plantel</span>
                    </button>
                  </div>
                ) : !confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    title="Retirar del plantel (Soft Delete - Conserva todo el historial)"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Retirar del Plantel (Soft Delete)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-800 font-bold">¿Retirar ejemplar (conservar historial)?</span>
                    <button
                      onClick={handleDelete}
                      className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors cursor-pointer"
                    >
                      Sí, retirar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors font-medium shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Embedded Document Preview Modal for Pedigree (PDF / Image) */}
      {currentDog.pedigreeDocUrl && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Pedigree Oficial: ${currentDog.nombreCompleto}`}
          docUrl={currentDog.pedigreeDocUrl}
          docNombre={currentDog.pedigreeDocNombre || `pedigree_${currentDog.nombreCompleto.replace(/\s+/g, '_')}.pdf`}
          docTipo={currentDog.pedigreeDocTipo || 'PDF'}
        />
      )}

      {/* Modal for cloning external dog into current kennel */}
      {isCloningModalOpen && (
        <DogFormModal
          dog={currentDog}
          isCloning={true}
          onClose={() => {
            setIsCloningModalOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
