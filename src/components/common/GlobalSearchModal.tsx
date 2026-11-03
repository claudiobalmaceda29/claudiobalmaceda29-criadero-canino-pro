import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Ejemplar, Cachorro, Camada } from '../../types';
import {
  Search,
  X,
  Dog,
  Baby,
  FolderKanban,
  ArrowRight,
  Lock,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { DogDetailModal } from '../dogs/DogDetailModal';
import { PuppyDetailModal } from '../puppies/PuppyDetailModal';
import { DogFormModal } from '../dogs/DogFormModal';
import { formatDateDMY, matchesCompositeDogSearch, normalizeSearchText } from '../../lib/dogUtils';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    globalSearchQuery,
    setGlobalSearchQuery,
    ejemplares,
    cachorros,
    camadas,
    criaderos,
    currentCriaderoId,
    currentUser,
    setActiveTab,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DOGS' | 'PUPS' | 'LITTERS' | 'EXTERNOS'>('ALL');
  const [globalDogs, setGlobalDogs] = useState<Ejemplar[]>([]);
  const [globalPups, setGlobalPups] = useState<Cachorro[]>([]);
  const [globalLitters, setGlobalLitters] = useState<Camada[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [hasLoadedGlobal, setHasLoadedGlobal] = useState(false);

  // Modals triggered directly from search results
  const [selectedDog, setSelectedDog] = useState<Ejemplar | null>(null);
  const [selectedPuppy, setSelectedPuppy] = useState<Cachorro | null>(null);
  const [selectedLitter, setSelectedLitter] = useState<Camada | null>(null);
  const [cloningDog, setCloningDog] = useState<Ejemplar | null>(null);

  // Fetch Firestore collections globally (without criaderoId filter) on modal open
  useEffect(() => {
    if (!isSearchOpen || hasLoadedGlobal) return;
    let isCancelled = false;

    const fetchGlobalData = async () => {
      setIsLoadingGlobal(true);
      try {
        const [dogsSnap, pupsSnap, littersSnap] = await Promise.all([
          getDocs(collection(db, 'ejemplares')),
          getDocs(collection(db, 'cachorros')),
          getDocs(collection(db, 'camadas')),
        ]);

        if (isCancelled) return;

        const dogsList: Ejemplar[] = dogsSnap.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id,
        }));

        const pupsList: Cachorro[] = pupsSnap.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id,
        }));

        const littersList: Camada[] = littersSnap.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id,
        }));

        setGlobalDogs(dogsList);
        setGlobalPups(pupsList);
        setGlobalLitters(littersList);
        setHasLoadedGlobal(true);
      } catch (err) {
        console.warn('Buscador Global: error consultando Firestore global, usando registros en memoria:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingGlobal(false);
        }
      }
    };

    fetchGlobalData();

    return () => {
      isCancelled = true;
    };
  }, [isSearchOpen, hasLoadedGlobal]);

  // Combine local state and global Firestore records deduplicated by ID
  const allDogs = useMemo(() => {
    const map = new Map<string, Ejemplar>();
    ejemplares.forEach((d) => map.set(d.id, d));
    globalDogs.forEach((d) => map.set(d.id, d));
    return Array.from(map.values());
  }, [ejemplares, globalDogs]);

  const allPups = useMemo(() => {
    const map = new Map<string, Cachorro>();
    cachorros.forEach((p) => map.set(p.id, p));
    globalPups.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [cachorros, globalPups]);

  const allLitters = useMemo(() => {
    const map = new Map<string, Camada>();
    camadas.forEach((l) => map.set(l.id, l));
    globalLitters.forEach((l) => map.set(l.id, l));
    return Array.from(map.values());
  }, [camadas, globalLitters]);

  // Helper to resolve kennel name from criaderoId
  const getKennelInfo = (criaderoId?: string, afijoFallback?: string) => {
    if (!criaderoId) return afijoFallback ? `Criadero ${afijoFallback}` : 'Criadero Externo';
    const found = criaderos.find((c) => c.id === criaderoId);
    if (found) {
      return found.nombre ? `${found.nombre} (${found.afijo || 'Sin Afijo'})` : found.afijo || 'Criadero';
    }
    return afijoFallback ? `Criadero ${afijoFallback}` : 'Criadero Externo';
  };

  // Search Results
  const results = useMemo(() => {
    const rawQ = globalSearchQuery || '';
    const qNorm = normalizeSearchText(rawQ);
    if (!qNorm) return { dogs: [], pups: [], litters: [], externalDogs: [] };

    const dogs = allDogs.filter((e) => matchesCompositeDogSearch(e, rawQ));

    const pups = allPups.filter((c) => {
      const pupName = normalizeSearchText(c.nombre);
      const pupIdent = normalizeSearchText(c.identificadorProvisorio);
      const pupPoa = normalizeSearchText(c.numeroPOA);
      const pupTat = normalizeSearchText(c.tatuaje);
      const pupChip = normalizeSearchText(c.microchip);
      const pupCamada = normalizeSearchText(c.camadaNombre);
      const pupComp = normalizeSearchText(c.comprador?.nombre);
      const pupPadre = normalizeSearchText(c.padreNombre);
      const pupMadre = normalizeSearchText(c.madreNombre);

      const composite = `${pupName} ${pupIdent} ${pupCamada} ${pupPoa} ${pupTat} ${pupChip} ${pupComp}`;

      if (
        composite.includes(qNorm) ||
        pupName.includes(qNorm) ||
        pupCamada.includes(qNorm) ||
        pupPoa.includes(qNorm) ||
        pupTat.includes(qNorm) ||
        pupChip.includes(qNorm) ||
        pupComp.includes(qNorm) ||
        pupPadre.includes(qNorm) ||
        pupMadre.includes(qNorm)
      ) {
        return true;
      }

      const tokens = qNorm.split(' ').filter(Boolean);
      if (tokens.length > 1 && tokens.every((t) => composite.includes(t))) {
        return true;
      }
      return false;
    });

    const litters = allLitters.filter((l) => {
      const litIdent = normalizeSearchText(l.identificador);
      const litPadre = normalizeSearchText(l.padreNombre);
      const litMadre = normalizeSearchText(l.madreNombre);
      const litDate = normalizeSearchText(l.fechaNacimiento);
      const composite = `${litIdent} ${litPadre} ${litMadre} ${litDate}`;

      if (
        composite.includes(qNorm) ||
        litIdent.includes(qNorm) ||
        litPadre.includes(qNorm) ||
        litMadre.includes(qNorm)
      ) {
        return true;
      }

      const tokens = qNorm.split(' ').filter(Boolean);
      if (tokens.length > 1 && tokens.every((t) => composite.includes(t))) {
        return true;
      }
      return false;
    });

    const externalDogs = dogs.filter(
      (d) =>
        (d.criaderoId !== currentCriaderoId || !d.criaderoId) &&
        (d.esDelPlantel === false || d.esExterno === true)
    );

    return { dogs, pups, litters, externalDogs };
  }, [globalSearchQuery, allDogs, allPups, allLitters, currentCriaderoId]);

  if (!isSearchOpen) return null;

  const totalResults =
    results.dogs.length + results.pups.length + results.litters.length;

  const handleManualRefresh = async () => {
    setIsLoadingGlobal(true);
    try {
      const [dogsSnap, pupsSnap, littersSnap] = await Promise.all([
        getDocs(collection(db, 'ejemplares')),
        getDocs(collection(db, 'cachorros')),
        getDocs(collection(db, 'camadas')),
      ]);

      const dogsList: Ejemplar[] = dogsSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
      const pupsList: Cachorro[] = pupsSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
      const littersList: Camada[] = littersSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));

      setGlobalDogs(dogsList);
      setGlobalPups(pupsList);
      setGlobalLitters(littersList);
      setHasLoadedGlobal(true);
    } catch (err) {
      console.warn('Error refreshing global search data:', err);
    } finally {
      setIsLoadingGlobal(false);
    }
  };

  const handleOpenDog = (dog: Ejemplar) => {
    setSelectedDog(dog);
  };

  const handleOpenPuppy = (puppy: Cachorro) => {
    setSelectedPuppy(puppy);
  };

  const handleOpenLitter = (litter: Camada) => {
    setSelectedLitter(litter);
  };

  const handleCloneExternalDog = (e: React.MouseEvent, dog: Ejemplar) => {
    e.stopPropagation();
    setCloningDog(dog);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden flex flex-col max-h-[88vh]">
          {/* Search Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Buscar por Nombre, TAT (tatuaje), POA, Microchip, Camada en toda la base global..."
              autoFocus
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />

            {isLoadingGlobal && (
              <span title="Consultando Firestore...">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
              </span>
            )}

            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>

          {/* Subheader: Filter Chips & Global Mode Info */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                Todos ({totalResults})
              </button>
              <button
                onClick={() => setActiveFilter('DOGS')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'DOGS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                Ejemplares ({results.dogs.length})
              </button>
              <button
                onClick={() => setActiveFilter('PUPS')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'PUPS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                Cachorros ({results.pups.length})
              </button>
              <button
                onClick={() => setActiveFilter('LITTERS')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'LITTERS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                Camadas ({results.litters.length})
              </button>
              <button
                onClick={() => setActiveFilter('EXTERNOS')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === 'EXTERNOS'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Externos / Adoptar ({results.externalDogs.length})
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">Búsqueda multi-criadero global activa</span>
              <button
                onClick={handleManualRefresh}
                className="hover:text-blue-600 transition-colors p-1"
                title="Actualizar datos desde Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGlobal ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Results Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!globalSearchQuery.trim() ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  Buscador Global Multi-Criadero
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Ingresá el <strong>Nombre</strong>, <strong>Tatuaje (TAT)</strong>, <strong>Número de POA</strong> o <strong>Microchip</strong>. Buscamos en tiempo real en todos los registros de la plataforma sin aislar por criadero.
                </p>
                <div className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Los ejemplares de otros criadores se abren en <strong>Modo Solo Lectura</strong>. Podrás adoptar ejemplares externos para sumarlos a tu plantel.</span>
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <p>No se encontraron coincidencias para &quot;<strong>{globalSearchQuery}</strong>&quot;.</p>
                <p className="text-[11px] text-slate-400">Verificá que el nombre, tatuaje POA o microchip estén bien escritos.</p>
              </div>
            ) : (
              <>
                {/* 1. EJEMPLARES */}
                {(activeFilter === 'ALL' || activeFilter === 'DOGS' || activeFilter === 'EXTERNOS') &&
                  (activeFilter === 'EXTERNOS' ? results.externalDogs : results.dogs).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Dog className="w-4 h-4" />
                          Ejemplares (
                          {activeFilter === 'EXTERNOS' ? results.externalDogs.length : results.dogs.length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {(activeFilter === 'EXTERNOS' ? results.externalDogs : results.dogs).map((dog) => {
                          const isMine = Boolean(currentCriaderoId && dog.criaderoId === currentCriaderoId);
                          const isExternal = dog.esDelPlantel === false || dog.esExterno === true;
                          const kennelLabel = getKennelInfo(dog.criaderoId, dog.afijo);

                          return (
                            <div
                              key={dog.id}
                              onClick={() => handleOpenDog(dog)}
                              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={
                                    dog.fotoUrl ||
                                    'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=120&q=80'
                                  }
                                  alt={dog.nombreCompleto}
                                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                      {dog.nombreCompleto}
                                    </h5>

                                    {/* Ownership & Read-Only Badges */}
                                    {isMine ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        Mi Criadero
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                        <Lock className="w-3 h-3 text-amber-600" />
                                        Solo Lectura • {kennelLabel}
                                      </span>
                                    )}

                                    {isExternal && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                        Ejemplar Externo
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                                    <span>{dog.sexo === 'MACHO' ? 'Macho' : 'Hembra'}</span>
                                    <span>•</span>
                                    <span>POA: <strong className="font-mono text-slate-700 dark:text-slate-200">{dog.numeroPOA || 'S/N'}</strong></span>
                                    <span>•</span>
                                    <span>TAT: <strong className="font-mono text-purple-700 dark:text-purple-400">{dog.tatuaje || 'S/N'}</strong></span>
                                    {dog.microchip && (
                                      <>
                                        <span>•</span>
                                        <span>Chip: <strong className="font-mono">{dog.microchip}</strong></span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                {/* Claim/Adopt External Dog Button */}
                                {!isMine && isExternal && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCloneExternalDog(e, dog)}
                                    className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    title="Sumar este ejemplar externo a mi propio criadero"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Agregar a mi plantel</span>
                                  </button>
                                )}

                                <div className="p-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-1">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* 2. CACHORROS */}
                {(activeFilter === 'ALL' || activeFilter === 'PUPS') && results.pups.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Baby className="w-4 h-4" />
                      Cachorros ({results.pups.length})
                    </div>

                    <div className="space-y-2">
                      {results.pups.map((pup) => {
                        const isMine = Boolean(currentCriaderoId && pup.criaderoId === currentCriaderoId);
                        const kennelLabel = getKennelInfo(pup.criaderoId);

                        return (
                          <div
                            key={pup.id}
                            onClick={() => handleOpenPuppy(pup)}
                            className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-3 h-10 rounded-full shrink-0 shadow-xs"
                                style={{ backgroundColor: pup.colorCollar || '#10b981' }}
                              />
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                    {pup.nombre || pup.identificadorProvisorio}
                                  </h5>

                                  {isMine ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      Mi Criadero
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                      <Lock className="w-3 h-3 text-amber-600" />
                                      Solo Lectura • {kennelLabel}
                                    </span>
                                  )}

                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                    {pup.estadoComercial}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                                  <span>Camada: {pup.camadaNombre}</span>
                                  <span>•</span>
                                  <span>Sexo: {pup.sexo}</span>
                                  {pup.tatuaje && (
                                    <>
                                      <span>•</span>
                                      <span>TAT: <strong className="font-mono text-purple-700 dark:text-purple-400">{pup.tatuaje}</strong></span>
                                    </>
                                  )}
                                  {pup.numeroPOA && (
                                    <>
                                      <span>•</span>
                                      <span>POA: <strong className="font-mono">{pup.numeroPOA}</strong></span>
                                    </>
                                  )}
                                  {pup.microchip && (
                                    <>
                                      <span>•</span>
                                      <span>Chip: <strong className="font-mono">{pup.microchip}</strong></span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-transform group-hover:translate-x-1">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. CAMADAS */}
                {(activeFilter === 'ALL' || activeFilter === 'LITTERS') && results.litters.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4" />
                      Camadas ({results.litters.length})
                    </div>

                    <div className="space-y-2">
                      {results.litters.map((litter) => {
                        const isMine = Boolean(currentCriaderoId && litter.criaderoId === currentCriaderoId);
                        const kennelLabel = getKennelInfo(litter.criaderoId);

                        return (
                          <div
                            key={litter.id}
                            onClick={() => handleOpenLitter(litter)}
                            className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 shrink-0">
                                <FolderKanban className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                                    Camada {litter.identificador}
                                  </h5>

                                  {isMine ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      Mi Criadero
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                      <Lock className="w-3 h-3 text-amber-600" />
                                      Solo Lectura • {kennelLabel}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  <span>Progenitores: <strong>{litter.padreNombre}</strong> x <strong>{litter.madreNombre}</strong></span>
                                  <span> • Total: {litter.totalCachorros} cachorros ({formatDateDMY(litter.fechaNacimiento)})</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-1">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span>
              Mostrando registros de toda la base central de <strong>Mi Criadero Canino</strong>.
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aislamiento de escritura activo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODALS (Automatically respect Read-Only & Ownership) */}

      {/* 1. Dog Detail Modal */}
      {selectedDog && (
        <DogDetailModal
          dog={selectedDog}
          onClose={() => setSelectedDog(null)}
          onEdit={() => {}}
        />
      )}

      {/* 2. Puppy Detail Modal */}
      {selectedPuppy && (
        <PuppyDetailModal
          puppy={selectedPuppy}
          onClose={() => setSelectedPuppy(null)}
          onEdit={() => {}}
        />
      )}

      {/* 3. Litter Detail Modal / Preview */}
      {selectedLitter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Ficha de Camada {selectedLitter.identificador}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {getKennelInfo(selectedLitter.criaderoId)}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLitter(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-only notice if external */}
            {selectedLitter.criaderoId !== currentCriaderoId && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Solo Lectura:</strong> Esta camada pertenece a otro criadero registrado.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Padre</span>
                <strong className="text-slate-900 dark:text-white text-sm">{selectedLitter.padreNombre}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Madre</span>
                <strong className="text-slate-900 dark:text-white text-sm">{selectedLitter.madreNombre}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha Nacimiento</span>
                <strong className="text-slate-900 dark:text-white">{formatDateDMY(selectedLitter.fechaNacimiento)}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cachorros Totales</span>
                <strong className="text-emerald-600 text-sm font-bold">{selectedLitter.totalCachorros}</strong>
              </div>
            </div>

            {selectedLitter.observaciones && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Observaciones</span>
                <p className="text-slate-600 dark:text-slate-300">{selectedLitter.observaciones}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLitter(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Dog Form Modal for Cloning External Dog into Current Kennel */}
      {cloningDog && (
        <DogFormModal
          dog={cloningDog}
          isCloning={true}
          onClose={() => {
            setCloningDog(null);
            handleManualRefresh();
          }}
        />
      )}
    </>
  );
};
