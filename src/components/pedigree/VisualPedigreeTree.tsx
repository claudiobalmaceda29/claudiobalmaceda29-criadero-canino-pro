import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar } from '../../types';
import {
  GitFork,
  Award,
  ShieldCheck,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ExternalLink,
  Dog as DogIcon,
  Sparkles,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

interface VisualPedigreeTreeProps {
  subjectDog: Ejemplar;
  onSelectDog?: (dog: Ejemplar) => void;
  onViewDogDetail?: (dog: Ejemplar) => void;
}

type PedigreeViewFilter = 'ALL_4G' | 'GEN_3' | 'SIRE_ONLY' | 'DAM_ONLY';

interface AncestorInfo {
  label: string;
  name: string;
  dogRecord?: Ejemplar;
  sexo: 'MACHO' | 'HEMBRA';
  linea: 'SIRE' | 'DAM';
  generation: 1 | 2 | 3;
}

export const VisualPedigreeTree: React.FC<VisualPedigreeTreeProps> = ({
  subjectDog,
  onSelectDog,
  onViewDogDetail,
}) => {
  const { ejemplares } = useApp();

  // Navigation history inside the tree (breadcrumbs)
  const [activeDog, setActiveDog] = useState<Ejemplar>(subjectDog);
  const [navigationTrail, setNavigationTrail] = useState<Ejemplar[]>([]);

  // View Filter: 4G, 3G, Sire, Dam
  const [filterMode, setFilterMode] = useState<PedigreeViewFilter>('ALL_4G');

  // Zoom scale
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Sync if prop changes and no navigation trail
  React.useEffect(() => {
    if (navigationTrail.length === 0) {
      setActiveDog(subjectDog);
    }
  }, [subjectDog, navigationTrail.length]);

  // Helper to find ancestor dog in system by ID, POA or Name
  const findDogInSystem = (nameOrId?: string): Ejemplar | undefined => {
    if (!nameOrId || !nameOrId.trim()) return undefined;
    const clean = nameOrId.trim().toLowerCase();
    return ejemplares.find((e) => {
      if (e.id === nameOrId) return true;
      if (e.nombreCompleto.toLowerCase().trim() === clean) return true;
      if (e.numeroPOA && e.numeroPOA.toLowerCase().trim() === clean) return true;
      if (
        clean.length >= 4 &&
        (e.nombreCompleto.toLowerCase().includes(clean) ||
          clean.includes(e.nombreCompleto.toLowerCase()))
      ) {
        return true;
      }
      return false;
    });
  };

  // Resolve Ancestors for activeDog
  const ancestors = useMemo(() => {
    // Gen 1: Parents
    const fatherDog =
      (activeDog.padreId && findDogInSystem(activeDog.padreId)) ||
      findDogInSystem(activeDog.padreNombre);
    const motherDog =
      (activeDog.madreId && findDogInSystem(activeDog.madreId)) ||
      findDogInSystem(activeDog.madreNombre);

    const padreName = activeDog.padreNombre || fatherDog?.nombreCompleto || 'Padre No Registrado';
    const madreName = activeDog.madreNombre || motherDog?.nombreCompleto || 'Madre No Registrada';

    // Gen 2: Grandparents
    const abueloPaternoName =
      activeDog.abueloPaterno || fatherDog?.padreNombre || 'Abuelo Paterno S/R';
    const abuelaPaternaName =
      activeDog.abuelaPaterna || fatherDog?.madreNombre || 'Abuela Paterna S/R';
    const abueloMaternoName =
      activeDog.abueloMaterno || motherDog?.padreNombre || 'Abuelo Materno S/R';
    const abuelaMaternaName =
      activeDog.abuelaMaterna || motherDog?.madreNombre || 'Abuela Materna S/R';

    const abueloPaternoDog =
      findDogInSystem(fatherDog?.padreId) || findDogInSystem(abueloPaternoName);
    const abuelaPaternaDog =
      findDogInSystem(fatherDog?.madreId) || findDogInSystem(abuelaPaternaName);
    const abueloMaternoDog =
      findDogInSystem(motherDog?.padreId) || findDogInSystem(abueloMaternoName);
    const abuelaMaternaDog =
      findDogInSystem(motherDog?.madreId) || findDogInSystem(abuelaMaternaName);

    // Gen 3: Great-Grandparents
    const ppP =
      activeDog.bisabuelos?.pp_p ||
      fatherDog?.bisabuelos?.pp_p ||
      fatherDog?.abueloPaterno ||
      abueloPaternoDog?.padreNombre ||
      'Bisabuelo PP-P';
    const ppM =
      activeDog.bisabuelos?.pp_m ||
      fatherDog?.bisabuelos?.pp_m ||
      fatherDog?.abuelaPaterna ||
      abueloPaternoDog?.madreNombre ||
      'Bisabuela PP-M';
    const pmP =
      activeDog.bisabuelos?.pm_p ||
      fatherDog?.bisabuelos?.pm_p ||
      fatherDog?.abueloMaterno ||
      abuelaPaternaDog?.padreNombre ||
      'Bisabuelo PM-P';
    const pmM =
      activeDog.bisabuelos?.pm_m ||
      fatherDog?.bisabuelos?.pm_m ||
      fatherDog?.abuelaMaterna ||
      abuelaPaternaDog?.madreNombre ||
      'Bisabuela PM-M';

    const mpP =
      activeDog.bisabuelos?.mp_p ||
      motherDog?.bisabuelos?.mp_p ||
      motherDog?.abueloPaterno ||
      abueloMaternoDog?.padreNombre ||
      'Bisabuelo MP-P';
    const mpM =
      activeDog.bisabuelos?.mp_m ||
      motherDog?.bisabuelos?.mp_m ||
      motherDog?.abuelaPaterna ||
      abueloMaternoDog?.madreNombre ||
      'Bisabuela MP-M';
    const mmP =
      activeDog.bisabuelos?.mm_p ||
      motherDog?.bisabuelos?.mm_p ||
      motherDog?.abueloMaterno ||
      abuelaMaternaDog?.padreNombre ||
      'Bisabuelo MM-P';
    const mmM =
      activeDog.bisabuelos?.mm_m ||
      motherDog?.bisabuelos?.mm_m ||
      motherDog?.abuelaMaterna ||
      abuelaMaternaDog?.madreNombre ||
      'Bisabuela MM-M';

    return {
      // Gen 1
      father: {
        label: 'PADRE (SIRE)',
        name: padreName,
        dogRecord: fatherDog,
        sexo: 'MACHO' as const,
        linea: 'SIRE' as const,
        generation: 1 as const,
      },
      mother: {
        label: 'MADRE (DAM)',
        name: madreName,
        dogRecord: motherDog,
        sexo: 'HEMBRA' as const,
        linea: 'DAM' as const,
        generation: 1 as const,
      },
      // Gen 2
      abueloPaterno: {
        label: 'ABUELO PATERNO',
        name: abueloPaternoName,
        dogRecord: abueloPaternoDog,
        sexo: 'MACHO' as const,
        linea: 'SIRE' as const,
        generation: 2 as const,
      },
      abuelaPaterna: {
        label: 'ABUELA PATERNA',
        name: abuelaPaternaName,
        dogRecord: abuelaPaternaDog,
        sexo: 'HEMBRA' as const,
        linea: 'SIRE' as const,
        generation: 2 as const,
      },
      abueloMaterno: {
        label: 'ABUELO MATERNO',
        name: abueloMaternoName,
        dogRecord: abueloMaternoDog,
        sexo: 'MACHO' as const,
        linea: 'DAM' as const,
        generation: 2 as const,
      },
      abuelaMaterna: {
        label: 'ABUELA MATERNA',
        name: abuelaMaternaName,
        dogRecord: abuelaMaternaDog,
        sexo: 'HEMBRA' as const,
        linea: 'DAM' as const,
        generation: 2 as const,
      },
      // Gen 3
      ppP: {
        label: 'BISABUELO (Paterno-Paterno)',
        name: ppP,
        dogRecord: findDogInSystem(ppP),
        sexo: 'MACHO' as const,
        linea: 'SIRE' as const,
        generation: 3 as const,
      },
      ppM: {
        label: 'BISABUELA (Paterno-Materno)',
        name: ppM,
        dogRecord: findDogInSystem(ppM),
        sexo: 'HEMBRA' as const,
        linea: 'SIRE' as const,
        generation: 3 as const,
      },
      pmP: {
        label: 'BISABUELO (Materno-Paterno)',
        name: pmP,
        dogRecord: findDogInSystem(pmP),
        sexo: 'MACHO' as const,
        linea: 'SIRE' as const,
        generation: 3 as const,
      },
      pmM: {
        label: 'BISABUELA (Materno-Materno)',
        name: pmM,
        dogRecord: findDogInSystem(pmM),
        sexo: 'HEMBRA' as const,
        linea: 'SIRE' as const,
        generation: 3 as const,
      },
      mpP: {
        label: 'BISABUELO (Paterno-Paterno)',
        name: mpP,
        dogRecord: findDogInSystem(mpP),
        sexo: 'MACHO' as const,
        linea: 'DAM' as const,
        generation: 3 as const,
      },
      mpM: {
        label: 'BISABUELA (Paterno-Materno)',
        name: mpM,
        dogRecord: findDogInSystem(mpM),
        sexo: 'HEMBRA' as const,
        linea: 'DAM' as const,
        generation: 3 as const,
      },
      mmP: {
        label: 'BISABUELO (Materno-Paterno)',
        name: mmP,
        dogRecord: findDogInSystem(mmP),
        sexo: 'MACHO' as const,
        linea: 'DAM' as const,
        generation: 3 as const,
      },
      mmM: {
        label: 'BISABUELA (Materno-Materno)',
        name: mmM,
        dogRecord: findDogInSystem(mmM),
        sexo: 'HEMBRA' as const,
        linea: 'DAM' as const,
        generation: 3 as const,
      },
    };
  }, [activeDog, ejemplares]);

  // Navigate deeper into ancestor tree
  const handleFocusAncestor = (ancestorDog: Ejemplar) => {
    setNavigationTrail((prev) => [...prev, activeDog]);
    setActiveDog(ancestorDog);
  };

  // Navigate back via breadcrumb
  const handleBackToSubject = (targetIndex?: number) => {
    if (targetIndex === undefined || targetIndex === -1) {
      setActiveDog(subjectDog);
      setNavigationTrail([]);
    } else {
      const target = navigationTrail[targetIndex];
      if (target) {
        setActiveDog(target);
        setNavigationTrail((prev) => prev.slice(0, targetIndex));
      }
    }
  };

  // Render Single Ancestor Organigram Card
  const renderOrganigramCard = (info: AncestorInfo, isCompact = false) => {
    const dog = info.dogRecord;
    const isSire = info.linea === 'SIRE';
    const isMale = info.sexo === 'MACHO';

    return (
      <div
        className={`rounded-2xl transition-all duration-200 border shadow-xs relative overflow-hidden group ${
          dog
            ? isSire
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/90 dark:border-blue-900/60 hover:border-blue-500 hover:shadow-md'
              : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/90 dark:border-rose-900/60 hover:border-rose-500 hover:shadow-md'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
        } ${isCompact ? 'p-2.5' : 'p-3.5'}`}
      >
        {/* Top Header: Label & Gender */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
              isSire
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200'
            }`}
          >
            {info.label}
          </span>

          <div className="flex items-center gap-1">
            {dog && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Criadero</span>
              </span>
            )}
            <span
              className={`text-[10px] font-bold ${
                isMale ? 'text-blue-600' : 'text-rose-500'
              }`}
            >
              {isMale ? '♂' : '♀'}
            </span>
          </div>
        </div>

        {/* Dog Thumbnail & Identity */}
        <div className="flex items-start gap-2.5">
          {/* Avatar / Photo */}
          <div className="shrink-0 relative">
            {dog?.fotoUrl ? (
              <img
                src={dog.fotoUrl}
                alt={info.name}
                className={`${
                  isCompact ? 'w-10 h-10' : 'w-12 h-12'
                } rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform`}
              />
            ) : (
              <div
                className={`${
                  isCompact ? 'w-10 h-10' : 'w-12 h-12'
                } rounded-xl flex items-center justify-center border shadow-2xs ${
                  isSire
                    ? 'bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    : 'bg-rose-100/70 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                }`}
              >
                <DogIcon className={`${isCompact ? 'w-5 h-5' : 'w-6 h-6'} opacity-75`} />
              </div>
            )}
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1">
            <h5
              onClick={() => {
                if (dog && onViewDogDetail) onViewDogDetail(dog);
              }}
              className={`font-black leading-tight text-slate-900 dark:text-white truncate ${
                isCompact ? 'text-[11px]' : 'text-xs'
              } ${dog ? 'cursor-pointer hover:underline text-blue-900 dark:text-blue-100' : ''}`}
              title={info.name}
            >
              {info.name}
            </h5>

            {/* Cynological Credentials */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              {dog?.numeroPOA ? (
                <span>POA: {dog.numeroPOA}</span>
              ) : (
                <span>{dog ? 'POA en trámite' : 'POA S/R'}</span>
              )}
              {dog?.tatuaje && <span> • TAT: {dog.tatuaje}</span>}
            </div>

            {/* Health / Dysplasia / Selection Badges */}
            {dog && (
              <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px]">
                {dog.displasiaCadera && (
                  <span className="px-1 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-900/50">
                    HD: {dog.displasiaCadera}
                  </span>
                )}
                {dog.calificacionCria && (
                  <span className="px-1 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900/50 truncate max-w-[120px]">
                    {dog.calificacionCria}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Interactive Actions when dog exists in kennel */}
        {dog && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onViewDogDetail && onViewDogDetail(dog)}
              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>Ver Ficha</span>
              <span>↗</span>
            </button>

            <button
              type="button"
              onClick={() => handleFocusAncestor(dog)}
              className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-2xs flex items-center gap-0.5 cursor-pointer"
              title={`Ver árbol genealógico completo de ${dog.nombreCompleto}`}
            >
              <span>Centrar Árbol</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const showSire = filterMode === 'ALL_4G' || filterMode === 'GEN_3' || filterMode === 'SIRE_ONLY';
  const showDam = filterMode === 'ALL_4G' || filterMode === 'GEN_3' || filterMode === 'DAM_ONLY';
  const showGen4 = filterMode === 'ALL_4G';

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters, Zoom, Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => handleBackToSubject(-1)}
            className={`font-black flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              activeDog.id === subjectDog.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DogIcon className="w-3.5 h-3.5" />
            <span>{subjectDog.nombreCompleto}</span>
          </button>

          {navigationTrail.map((trailDog, idx) => (
            <React.Fragment key={trailDog.id + idx}>
              <span className="text-slate-400">/</span>
              <button
                type="button"
                onClick={() => handleBackToSubject(idx)}
                className="font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                {trailDog.nombreCompleto}
              </button>
            </React.Fragment>
          ))}

          {activeDog.id !== subjectDog.id && (
            <>
              <span className="text-slate-400">/</span>
              <span className="font-black text-blue-600 dark:text-blue-400 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 rounded-lg">
                {activeDog.nombreCompleto} (Centrado)
              </span>
              <button
                type="button"
                onClick={() => handleBackToSubject(-1)}
                className="ml-2 text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Volver al Sujeto</span>
              </button>
            </>
          )}
        </div>

        {/* View Mode & Zoom Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generation Filters */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterMode('ALL_4G')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'ALL_4G'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              4 Generaciones
            </button>
            <button
              onClick={() => setFilterMode('GEN_3')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'GEN_3'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              3 Gen
            </button>
            <button
              onClick={() => setFilterMode('SIRE_ONLY')}
              className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'SIRE_ONLY'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Línea Paterna
            </button>
            <button
              onClick={() => setFilterMode('DAM_ONLY')}
              className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMode === 'DAM_ONLY'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Línea Materna
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(0.7, prev - 0.1))}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              title="Alejar Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold px-1.5">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(1.3, prev + 0.1))}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              title="Acercar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-[10px] font-bold"
              title="Restablecer 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Organigram Area */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-50/60 dark:bg-[#070b14]/70 border border-slate-200/90 dark:border-slate-800 shadow-inner overflow-x-auto custom-scrollbar">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
            minWidth: filterMode === 'ALL_4G' ? '1140px' : '880px',
          }}
          className="space-y-8 py-4"
        >
          {/* ROOT SUBJECT NODE */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl max-w-lg w-full text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600" />

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200">
                  EJEMPLAR SUJETO ({activeDog.sexo})
                </span>
                {activeDog.numeroPOA && (
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    POA: {activeDog.numeroPOA}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                {activeDog.fotoUrl && (
                  <img
                    src={activeDog.fotoUrl}
                    alt={activeDog.nombreCompleto}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-300 dark:border-blue-700 shadow-sm"
                  />
                )}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {activeDog.nombreCompleto}
                  </h3>
                  {activeDog.afijo && (
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {activeDog.afijo}
                    </div>
                  )}
                </div>
              </div>

              {/* Cynological summary strip */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-3 text-xs">
                {activeDog.displasiaCadera && (
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    HD: {activeDog.displasiaCadera}
                  </span>
                )}
                <span>•</span>
                {activeDog.displasiaCodo && (
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    ED: {activeDog.displasiaCodo}
                  </span>
                )}
                <span>•</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">
                  {activeDog.calificacionCria || 'Calificación S/D'}
                </span>
              </div>
            </div>

            {/* Tree Branch Stem Connector */}
            <div className="w-0.5 h-8 bg-blue-400 dark:bg-blue-600" />
            <div className="w-3/4 max-w-2xl h-0.5 bg-slate-300 dark:bg-slate-700 relative">
              {showSire && (
                <div className="absolute left-0 top-0 w-0.5 h-6 bg-blue-500" />
              )}
              {showDam && (
                <div className="absolute right-0 top-0 w-0.5 h-6 bg-rose-500" />
              )}
            </div>
          </div>

          {/* TWO MAIN BRANCHES: SIRE & DAM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ========================================== */}
            {/* SIRE (LÍNEA PATERNA) */}
            {/* ========================================== */}
            {showSire && (
              <div className="p-4 rounded-3xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/90 dark:border-blue-900/50 space-y-4">
                {/* Branch Header */}
                <div className="flex items-center justify-between border-b border-blue-200/80 dark:border-blue-900/60 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>LÍNEA PATERNA (PADRE Y ANCESTROS)</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 font-mono">
                    ♂ Padrillo
                  </span>
                </div>

                {/* Level 1: Father */}
                <div className="max-w-md mx-auto">
                  {renderOrganigramCard(ancestors.father)}
                </div>

                {/* Connector Line to Grandparents */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-blue-300 dark:bg-blue-700" />
                  <div className="w-4/5 h-0.5 bg-blue-300 dark:bg-blue-700" />
                </div>

                {/* Level 2: Paternal Grandparents */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {renderOrganigramCard(ancestors.abueloPaterno, true)}
                    {/* Level 3: Great-Grandparents if 4G enabled */}
                    {showGen4 && (
                      <div className="space-y-2 pt-2 border-t border-dashed border-blue-200 dark:border-blue-900/50">
                        {renderOrganigramCard(ancestors.ppP, true)}
                        {renderOrganigramCard(ancestors.ppM, true)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {renderOrganigramCard(ancestors.abuelaPaterna, true)}
                    {/* Level 3: Great-Grandparents if 4G enabled */}
                    {showGen4 && (
                      <div className="space-y-2 pt-2 border-t border-dashed border-blue-200 dark:border-blue-900/50">
                        {renderOrganigramCard(ancestors.pmP, true)}
                        {renderOrganigramCard(ancestors.pmM, true)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* DAM (LÍNEA MATERNA) */}
            {/* ========================================== */}
            {showDam && (
              <div className="p-4 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/90 dark:border-rose-900/50 space-y-4">
                {/* Branch Header */}
                <div className="flex items-center justify-between border-b border-rose-200/80 dark:border-rose-900/60 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-rose-600" />
                    <span>LÍNEA MATERNA (MADRE Y ANCESTROS)</span>
                  </span>
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 font-mono">
                    ♀ Reproductora
                  </span>
                </div>

                {/* Level 1: Mother */}
                <div className="max-w-md mx-auto">
                  {renderOrganigramCard(ancestors.mother)}
                </div>

                {/* Connector Line to Grandparents */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-4 bg-rose-300 dark:bg-rose-700" />
                  <div className="w-4/5 h-0.5 bg-rose-300 dark:bg-rose-700" />
                </div>

                {/* Level 2: Maternal Grandparents */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {renderOrganigramCard(ancestors.abueloMaterno, true)}
                    {/* Level 3: Great-Grandparents if 4G enabled */}
                    {showGen4 && (
                      <div className="space-y-2 pt-2 border-t border-dashed border-rose-200 dark:border-rose-900/50">
                        {renderOrganigramCard(ancestors.mpP, true)}
                        {renderOrganigramCard(ancestors.mpM, true)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {renderOrganigramCard(ancestors.abuelaMaterna, true)}
                    {/* Level 3: Great-Grandparents if 4G enabled */}
                    {showGen4 && (
                      <div className="space-y-2 pt-2 border-t border-dashed border-rose-200 dark:border-rose-900/50">
                        {renderOrganigramCard(ancestors.mmP, true)}
                        {renderOrganigramCard(ancestors.mmM, true)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
