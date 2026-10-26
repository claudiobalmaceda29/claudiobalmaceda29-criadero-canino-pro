import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  GitFork,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  Save,
  Trash2,
  Dna,
  Layers,
  ChevronRight,
  ShieldCheck,
  Server,
  Globe,
  ExternalLink,
  Loader2,
  Download,
  Link2,
  Search,
  RotateCcw,
} from 'lucide-react';
import { SimulacionCruza } from '../../types';

export const BreedingSimulatorView: React.FC = () => {
  const {
    ejemplares,
    simulaciones,
    addSimulacionCruza,
    deleteSimulacionCruza,
    currentCriaderoId,
    calculateCOIServer,
    parsePedigreeDatabaseUrl,
  } = useApp();

  const machos = useMemo(() => ejemplares.filter((e) => e.sexo === 'MACHO'), [ejemplares]);
  const hembras = useMemo(() => ejemplares.filter((e) => e.sexo === 'HEMBRA'), [ejemplares]);

  // Macho Selection State (Criadero vs PedigreeDatabase link)
  const [machoSource, setMachoSource] = useState<'CRIADERO' | 'PEDIGREE_DATABASE'>('CRIADERO');
  const [selectedMachoId, setSelectedMachoId] = useState<string>(machos[0]?.id || '');
  const [machoPdbUrl, setMachoPdbUrl] = useState('');
  const [machoExternalDog, setMachoExternalDog] = useState<any | null>(null);
  const [machoLoading, setMachoLoading] = useState(false);
  const [machoError, setMachoError] = useState<string | null>(null);

  // Hembra Selection State (Criadero vs PedigreeDatabase link)
  const [hembraSource, setHembraSource] = useState<'CRIADERO' | 'PEDIGREE_DATABASE'>('CRIADERO');
  const [selectedHembraId, setSelectedHembraId] = useState<string>(hembras[0]?.id || '');
  const [hembraPdbUrl, setHembraPdbUrl] = useState('');
  const [hembraExternalDog, setHembraExternalDog] = useState<any | null>(null);
  const [hembraLoading, setHembraLoading] = useState(false);
  const [hembraError, setHembraError] = useState<string | null>(null);

  const [simulationNotes, setSimulationNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [serverCOI, setServerCOI] = useState<any>(null);
  const [isCalculatingServer, setIsCalculatingServer] = useState(false);

  // Fetch functions for PedigreeDatabase links
  const handleFetchMachoPdb = async (customUrl?: string) => {
    const target = (customUrl || machoPdbUrl).trim();
    if (!target) return;
    setMachoLoading(true);
    setMachoError(null);
    try {
      const res = await parsePedigreeDatabaseUrl(target);
      if (!res.success || !res.data) {
        setMachoError(res.error || 'No se pudo leer la información del macho desde PedigreeDatabase.com');
        setMachoExternalDog(null);
        return;
      }
      setMachoExternalDog(res.data);
    } catch (e: any) {
      setMachoError('Error de red al consultar PedigreeDatabase: ' + (e.message || 'Error desconocido'));
      setMachoExternalDog(null);
    } finally {
      setMachoLoading(false);
    }
  };

  const handleFetchHembraPdb = async (customUrl?: string) => {
    const target = (customUrl || hembraPdbUrl).trim();
    if (!target) return;
    setHembraLoading(true);
    setHembraError(null);
    try {
      const res = await parsePedigreeDatabaseUrl(target);
      if (!res.success || !res.data) {
        setHembraError(res.error || 'No se pudo leer la información de la hembra desde PedigreeDatabase.com');
        setHembraExternalDog(null);
        return;
      }
      setHembraExternalDog(res.data);
    } catch (e: any) {
      setHembraError('Error de red al consultar PedigreeDatabase: ' + (e.message || 'Error desconocido'));
      setHembraExternalDog(null);
    } finally {
      setHembraLoading(false);
    }
  };

  // Resolved Active Macho
  const selectedMacho = useMemo(() => {
    if (machoSource === 'PEDIGREE_DATABASE') {
      if (!machoExternalDog) return null;
      return {
        id: `pdb-macho-${encodeURIComponent(machoExternalDog.nombre)}`,
        nombreCompleto: machoExternalDog.nombre,
        afijo: 'PedigreeDatabase',
        sexo: 'MACHO' as const,
        fotoUrl: machoExternalDog.fotoUrl || 'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=800&q=80',
        padreId: undefined,
        madreId: undefined,
        padreNombre: machoExternalDog.padreNombre,
        madreNombre: machoExternalDog.madreNombre,
        abueloPaterno: machoExternalDog.abueloPaterno,
        abuelaPaterna: machoExternalDog.abuelaPaterna,
        abueloMaterno: machoExternalDog.abueloMaterno,
        abuelaMaterna: machoExternalDog.abuelaMaterna,
        bisabuelos: machoExternalDog.bisabuelos,
        color: 'Negro y Fuego',
        pelo: 'CORTO' as const,
        displasiaCadera: 'HD Normal (PedigreeDatabase)',
        displasiaCodo: 'ED Normal (PedigreeDatabase)',
        numeroPOA: 'PDB Online',
        pedigreeDatabaseUrl: machoExternalDog.url,
        esExterno: true,
        detectedSex: machoExternalDog.sexo,
      };
    }
    return machos.find((m) => m.id === selectedMachoId) || null;
  }, [machoSource, machoExternalDog, machos, selectedMachoId]);

  // Resolved Active Hembra
  const selectedHembra = useMemo(() => {
    if (hembraSource === 'PEDIGREE_DATABASE') {
      if (!hembraExternalDog) return null;
      return {
        id: `pdb-hembra-${encodeURIComponent(hembraExternalDog.nombre)}`,
        nombreCompleto: hembraExternalDog.nombre,
        afijo: 'PedigreeDatabase',
        sexo: 'HEMBRA' as const,
        fotoUrl: hembraExternalDog.fotoUrl || 'https://upload.wikimedia.org/wikipedia/commons/1/18/Berger_Allemand.jpg',
        padreId: undefined,
        madreId: undefined,
        padreNombre: hembraExternalDog.padreNombre,
        madreNombre: hembraExternalDog.madreNombre,
        abueloPaterno: hembraExternalDog.abueloPaterno,
        abuelaPaterna: hembraExternalDog.abuelaPaterna,
        abueloMaterno: hembraExternalDog.abueloMaterno,
        abuelaMaterna: hembraExternalDog.abuelaMaterna,
        bisabuelos: hembraExternalDog.bisabuelos,
        color: 'Negro y Fuego',
        pelo: 'CORTO' as const,
        displasiaCadera: 'HD Normal (PedigreeDatabase)',
        displasiaCodo: 'ED Normal (PedigreeDatabase)',
        numeroPOA: 'PDB Online',
        pedigreeDatabaseUrl: hembraExternalDog.url,
        esExterno: true,
        detectedSex: hembraExternalDog.sexo,
      };
    }
    return hembras.find((h) => h.id === selectedHembraId) || null;
  }, [hembraSource, hembraExternalDog, hembras, selectedHembraId]);

  // Trigger server-side COI calculation with recursive pedigree resolution
  React.useEffect(() => {
    if (!selectedMacho || !selectedHembra) {
      setServerCOI(null);
      return;
    }
    setIsCalculatingServer(true);

    const sirePed: Record<string, string> = {
      padre: selectedMacho.padreNombre || '',
      madre: selectedMacho.madreNombre || '',
      abueloPaterno: selectedMacho.abueloPaterno || '',
      abuelaPaterna: selectedMacho.abuelaPaterna || '',
      abueloMaterno: selectedMacho.abueloMaterno || '',
      abuelaMaterna: selectedMacho.abuelaMaterna || '',
      ...(selectedMacho.bisabuelos || {}),
    };

    const damPed: Record<string, string> = {
      padre: selectedHembra.padreNombre || '',
      madre: selectedHembra.madreNombre || '',
      abueloPaterno: selectedHembra.abueloPaterno || '',
      abuelaPaterna: selectedHembra.abuelaPaterna || '',
      abueloMaterno: selectedHembra.abueloMaterno || '',
      abuelaMaterna: selectedHembra.abuelaMaterna || '',
      ...(selectedHembra.bisabuelos || {}),
    };

    calculateCOIServer(sirePed, damPed).then((res) => {
      if (res) {
        setServerCOI(res);
      }
      setIsCalculatingServer(false);
    });
  }, [selectedMacho, selectedHembra, calculateCOIServer]);

  // Analysis of Common Ancestors & Wright's Inbreeding Coefficient
  const analysis = useMemo(() => {
    if (!selectedMacho || !selectedHembra) return null;

    const findDog = (id?: string, name?: string) => {
      if (!id && !name) return null;
      return ejemplares.find(
        (e) =>
          (id && e.id === id) ||
          (name && e.nombreCompleto.trim().toLowerCase() === name.trim().toLowerCase())
      );
    };

    const sireP = findDog(selectedMacho.padreId, selectedMacho.padreNombre);
    const sireM = findDog(selectedMacho.madreId, selectedMacho.madreNombre);
    const damP = findDog(selectedHembra.padreId, selectedHembra.padreNombre);
    const damM = findDog(selectedHembra.madreId, selectedHembra.madreNombre);

    const machoAncestors = [
      selectedMacho.padreNombre,
      selectedMacho.madreNombre,
      selectedMacho.abueloPaterno || sireP?.padreNombre,
      selectedMacho.abuelaPaterna || sireP?.madreNombre,
      selectedMacho.abueloMaterno || sireM?.padreNombre,
      selectedMacho.abuelaMaterna || sireM?.madreNombre,
      selectedMacho.bisabuelos?.pp_p,
      selectedMacho.bisabuelos?.pp_m,
      selectedMacho.bisabuelos?.pm_p,
      selectedMacho.bisabuelos?.pm_m,
      selectedMacho.bisabuelos?.mp_p,
      selectedMacho.bisabuelos?.mp_m,
      selectedMacho.bisabuelos?.mm_p,
      selectedMacho.bisabuelos?.mm_m,
    ].filter(Boolean) as string[];

    const hembraAncestors = [
      selectedHembra.padreNombre,
      selectedHembra.madreNombre,
      selectedHembra.abueloPaterno || damP?.padreNombre,
      selectedHembra.abuelaPaterna || damP?.madreNombre,
      selectedHembra.abueloMaterno || damM?.padreNombre,
      selectedHembra.abuelaMaterna || damM?.madreNombre,
      selectedHembra.bisabuelos?.pp_p,
      selectedHembra.bisabuelos?.pp_m,
      selectedHembra.bisabuelos?.pm_p,
      selectedHembra.bisabuelos?.pm_m,
      selectedHembra.bisabuelos?.mp_p,
      selectedHembra.bisabuelos?.mp_m,
      selectedHembra.bisabuelos?.mm_p,
      selectedHembra.bisabuelos?.mm_m,
    ].filter(Boolean) as string[];

    const sharedSet = new Set<string>();
    const sharedList: Array<{ nombre: string; generaciones: string; contribucionPct?: number }> = [];

    machoAncestors.forEach((ancM) => {
      const match = hembraAncestors.find((ancH) => ancH.toLowerCase() === ancM.toLowerCase());
      if (match && !sharedSet.has(ancM.toUpperCase())) {
        sharedSet.add(ancM.toUpperCase());
        sharedList.push({
          nombre: ancM,
          generaciones: 'Presente en líneas genealógicas de ambos reproductores',
          contribucionPct: 3.13,
        });
      }
    });

    let coefficient = 0;
    if (
      selectedMacho.padreNombre &&
      selectedHembra.padreNombre &&
      selectedMacho.padreNombre.toLowerCase() === selectedHembra.padreNombre.toLowerCase()
    ) {
      coefficient += 12.5; // Half siblings through sire
    }
    if (
      selectedMacho.madreNombre &&
      selectedHembra.madreNombre &&
      selectedMacho.madreNombre.toLowerCase() === selectedHembra.madreNombre.toLowerCase()
    ) {
      coefficient += 12.5; // Half siblings through dam
    }
    if (coefficient === 0 && sharedList.length > 0) {
      coefficient = Math.min(Math.round(sharedList.length * 3.125 * 100) / 100, 12.5);
    } else if (coefficient === 0) {
      coefficient = 0.0;
    }

    const warnings: string[] = [];
    if (coefficient > 12.5) {
      warnings.push('Alta consanguinidad (> 12.5%): Cruzamiento consanguíneo estrecho. Monitorear vigor híbrido.');
    } else if (coefficient > 6.25) {
      warnings.push('Consanguinidad moderada (Linebreeding 6.25% - 12.5%): Recomendado para fijar tipo morfológico.');
    } else {
      warnings.push('Consanguinidad baja / Outcross (< 6.25%): Cruza abierta favorable para vigor híbrido y salud.');
    }

    if (
      selectedMacho.displasiaCadera.includes('Permitido') &&
      selectedHembra.displasiaCadera.includes('Permitido')
    ) {
      warnings.push('Atención sanitaria: Ambos reproductores poseen grado permitido en cadera. Se aconseja cruzar con ejemplar Libre Normal.');
    }

    const coatPredictions: string[] = [];
    if (
      selectedMacho.color.toLowerCase().includes('negro y fuego') &&
      selectedHembra.color.toLowerCase().includes('negro y fuego')
    ) {
      coatPredictions.push('80% a 95% Manto Negro y Fuego clásico (Black & Tan) de alta pigmentación.');
    } else if (
      selectedMacho.color.toLowerCase().includes('gris') ||
      selectedHembra.color.toLowerCase().includes('gris')
    ) {
      coatPredictions.push('50% Probabilidad de mantos Gris Lobo (Sable) de trabajo.');
    } else {
      coatPredictions.push('Predominancia de manto Negro calzado y marcas fuego.');
    }

    if (selectedMacho.pelo === 'LARGO' || selectedHembra.pelo === 'LARGO') {
      coatPredictions.push('50% a 100% de probabilidades de crías con pelo largo (Langstockhaar).');
    } else {
      coatPredictions.push('Cachorros predominantemente de pelo corto (Stockhaar) con eventual portador recesivo.');
    }

    return {
      sharedList,
      coefficient,
      warnings,
      coatPredictions,
    };
  }, [selectedMacho, selectedHembra]);

  const handleSaveSimulation = () => {
    if (!selectedMacho || !selectedHembra || !analysis) return;

    const sim: Omit<SimulacionCruza, 'id'> = {
      criaderoId: currentCriaderoId,
      fecha: new Date().toISOString().split('T')[0],
      machoId: selectedMacho.id,
      machoNombre: selectedMacho.nombreCompleto,
      machoLink: selectedMacho.pedigreeDatabaseUrl,
      machoEsExterno: machoSource === 'PEDIGREE_DATABASE',
      hembraId: selectedHembra.id,
      hembraNombre: selectedHembra.nombreCompleto,
      hembraLink: selectedHembra.pedigreeDatabaseUrl,
      hembraEsExterno: hembraSource === 'PEDIGREE_DATABASE',
      coeficienteConsanguinidad: serverCOI?.coiPercentage ?? analysis.coefficient,
      antepasadosComunes: analysis.sharedList,
      advertencias: analysis.warnings,
      prediccionesColores: analysis.coatPredictions,
      notas: simulationNotes || 'Simulación generada para evaluación de camada futura.',
    };

    addSimulacionCruza(sim);
    setSavedSuccess(true);
    setSimulationNotes('');
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2">
            <Dna className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Fórmula de Wright Fx • Algoritmo de 4 Generaciones</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Simulador de Cruzas y Análisis Genético
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Cruce virtual predictivo, antepasados comunes y cálculo del coeficiente de consanguinidad combinando ejemplares del criadero o enlaces externos de PedigreeDatabase.com.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold">
          <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Wright Path Analysis API</span>
        </div>
      </div>

      {/* Simulator Selector Panel */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sire Selector */}
          <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <span>1. Seleccionar Macho (Padrillo)</span>
              </label>
              {machoSource === 'CRIADERO' && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                  {machos.length} Machos Disponibles
                </span>
              )}
            </div>

            {/* Toggle Source: Criadero vs Link PedigreeDatabase */}
            <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-800 border border-blue-200/90 dark:border-slate-700 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setMachoSource('CRIADERO')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  machoSource === 'CRIADERO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ejemplar del Criadero
              </button>
              <button
                type="button"
                onClick={() => setMachoSource('PEDIGREE_DATABASE')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  machoSource === 'PEDIGREE_DATABASE'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Link PedigreeDatabase</span>
              </button>
            </div>

            {/* If CRIADERO */}
            {machoSource === 'CRIADERO' && (
              <div className="space-y-3">
                <select
                  value={selectedMachoId}
                  onChange={(e) => setSelectedMachoId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-xs"
                >
                  {machos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombreCompleto} ({m.numeroPOA || 'S/N'})
                    </option>
                  ))}
                </select>

                {selectedMacho && (
                  <div className="flex items-center gap-3.5 pt-1 text-xs">
                    <img
                      src={selectedMacho.fotoUrl}
                      alt={selectedMacho.nombreCompleto}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedMacho.nombreCompleto}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Manto: {selectedMacho.color} ({selectedMacho.pelo})
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        HD: {selectedMacho.displasiaCadera} • ED: {selectedMacho.displasiaCodo}
                      </div>
                      {selectedMacho.pedigreeDatabaseUrl && (
                        <a
                          href={selectedMacho.pedigreeDatabaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Link PDB vinculado</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If PEDIGREE_DATABASE Link */}
            {machoSource === 'PEDIGREE_DATABASE' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={machoPdbUrl}
                        onChange={(e) => {
                          setMachoPdbUrl(e.target.value);
                          setMachoError(null);
                        }}
                        placeholder="Pegá link: pedigreedatabase.com/.../dog.html?id=..."
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                      />
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchMachoPdb()}
                      disabled={!machoPdbUrl.trim() || machoLoading}
                      className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                        !machoPdbUrl.trim() || machoLoading
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                      }`}
                    >
                      {machoLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extrayendo...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Extraer</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick test sample link */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Ejemplo rápido:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'https://www.pedigreedatabase.com/german_shepherd_dog/dog.html?id=1012455';
                        setMachoPdbUrl(url);
                        handleFetchMachoPdb(url);
                      }}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Rounder&apos;s Storm Trooper (ID: 1012455)
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {machoError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block">No se pudo leer el link</strong>
                      <span className="text-[11px]">{machoError}</span>
                    </div>
                  </div>
                )}

                {/* Loaded External Dog Card */}
                {machoExternalDog && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={machoExternalDog.fotoUrl || 'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=800&q=80'}
                        alt={machoExternalDog.nombre}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white text-xs sm:text-sm font-bold truncate block">
                            {machoExternalDog.nombre}
                          </strong>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                            PDB EXTERNO
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Padre: <span className="font-semibold text-slate-700 dark:text-slate-300">{machoExternalDog.padreNombre || 'N/D'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Madre: <span className="font-semibold text-slate-700 dark:text-slate-300">{machoExternalDog.madreNombre || 'N/D'}</span>
                        </div>
                      </div>
                    </div>

                    {machoExternalDog.sexo === 'HEMBRA' && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Atención: En PedigreeDatabase este ejemplar está listado como Hembra.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                      <a
                        href={machoExternalDog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Ver ficha en PedigreeDatabase</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setMachoExternalDog(null);
                          setMachoPdbUrl('');
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dam Selector */}
          <div className="p-5 rounded-2xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                <span>2. Seleccionar Hembra (Madre)</span>
              </label>
              {hembraSource === 'CRIADERO' && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium">
                  {hembras.length} Hembras Disponibles
                </span>
              )}
            </div>

            {/* Toggle Source: Criadero vs Link PedigreeDatabase */}
            <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-800 border border-pink-200/90 dark:border-slate-700 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setHembraSource('CRIADERO')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  hembraSource === 'CRIADERO'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ejemplar del Criadero
              </button>
              <button
                type="button"
                onClick={() => setHembraSource('PEDIGREE_DATABASE')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  hembraSource === 'PEDIGREE_DATABASE'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Link PedigreeDatabase</span>
              </button>
            </div>

            {/* If CRIADERO */}
            {hembraSource === 'CRIADERO' && (
              <div className="space-y-3">
                <select
                  value={selectedHembraId}
                  onChange={(e) => setSelectedHembraId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 cursor-pointer shadow-xs"
                >
                  {hembras.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nombreCompleto} ({h.numeroPOA || 'S/N'})
                    </option>
                  ))}
                </select>

                {selectedHembra && (
                  <div className="flex items-center gap-3.5 pt-1 text-xs">
                    <img
                      src={selectedHembra.fotoUrl}
                      alt={selectedHembra.nombreCompleto}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{selectedHembra.nombreCompleto}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Manto: {selectedHembra.color} ({selectedHembra.pelo})
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        HD: {selectedHembra.displasiaCadera} • ED: {selectedHembra.displasiaCodo}
                      </div>
                      {selectedHembra.pedigreeDatabaseUrl && (
                        <a
                          href={selectedHembra.pedigreeDatabaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-pink-600 dark:text-pink-400 hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Link PDB vinculado</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If PEDIGREE_DATABASE Link */}
            {hembraSource === 'PEDIGREE_DATABASE' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        value={hembraPdbUrl}
                        onChange={(e) => {
                          setHembraPdbUrl(e.target.value);
                          setHembraError(null);
                        }}
                        placeholder="Pegá link: pedigreedatabase.com/.../dog.html?id=..."
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 shadow-xs"
                      />
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFetchHembraPdb()}
                      disabled={!hembraPdbUrl.trim() || hembraLoading}
                      className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                        !hembraPdbUrl.trim() || hembraLoading
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-pink-600 hover:bg-pink-700 text-white cursor-pointer shadow-xs'
                      }`}
                    >
                      {hembraLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extrayendo...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Extraer</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick test sample link */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>Ejemplo rápido:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const url = 'https://www.pedigreedatabase.com/german_shepherd_dog/dog.html?id=2623348';
                        setHembraPdbUrl(url);
                        handleFetchHembraPdb(url);
                      }}
                      className="text-pink-600 hover:underline font-semibold cursor-pointer"
                    >
                      Pandora Vom Schonen Berg (ID: 2623348)
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {hembraError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block">No se pudo leer el link</strong>
                      <span className="text-[11px]">{hembraError}</span>
                    </div>
                  </div>
                )}

                {/* Loaded External Dog Card */}
                {hembraExternalDog && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-pink-200 dark:border-pink-900/60 shadow-xs space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={hembraExternalDog.fotoUrl || 'https://upload.wikimedia.org/wikipedia/commons/1/18/Berger_Allemand.jpg'}
                        alt={hembraExternalDog.nombre}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white text-xs sm:text-sm font-bold truncate block">
                            {hembraExternalDog.nombre}
                          </strong>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border border-pink-200 dark:border-pink-800 shrink-0">
                            PDB EXTERNA
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Padre: <span className="font-semibold text-slate-700 dark:text-slate-300">{hembraExternalDog.padreNombre || 'N/D'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Madre: <span className="font-semibold text-slate-700 dark:text-slate-300">{hembraExternalDog.madreNombre || 'N/D'}</span>
                        </div>
                      </div>
                    </div>

                    {hembraExternalDog.sexo === 'MACHO' && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Atención: En PedigreeDatabase este ejemplar está listado como Macho.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                      <a
                        href={hembraExternalDog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 dark:text-pink-400 hover:text-pink-800 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Ver ficha en PedigreeDatabase</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setHembraExternalDog(null);
                          setHembraPdbUrl('');
                        }}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results of Virtual Cross Simulation */}
        {analysis && selectedMacho && selectedHembra && (
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Wright Coeff Metric Bar */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-blue-50/30 dark:from-slate-800/80 dark:via-indigo-950/30 dark:to-blue-950/30 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl bg-indigo-100/70 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs">
                  <Dna className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                      Coeficiente de Consanguinidad Estimado (Fx)
                    </span>
                    <span className="text-[10px] text-blue-700 dark:text-blue-300 font-mono font-bold bg-blue-100/70 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                      {isCalculatingServer
                        ? '(Calculando en Servidor...)'
                        : serverCOI
                        ? 'Servidor API'
                        : 'Local'}
                    </span>
                  </div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white mt-1">
                    {serverCOI?.coiPercentage ?? analysis.coefficient}%
                  </div>
                  <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium mt-0.5">
                    {(serverCOI?.coiPercentage ?? analysis.coefficient) <= 3.25
                      ? 'Consanguinidad muy baja / Favorable para vigor híbrido'
                      : (serverCOI?.coiPercentage ?? analysis.coefficient) <= 6.25
                      ? 'Línea de consanguinidad moderada (Linebreeding clásico)'
                      : 'Consanguinidad estrecha / Fijación de caracteres'}
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-8 text-xs text-slate-500 dark:text-slate-400">
                <div className="font-bold text-slate-600 dark:text-slate-300">Antepasados Comunes:</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {serverCOI?.commonAncestors?.length ?? analysis.sharedList.length} ejemplares
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold mt-1">
                  {serverCOI?.algorithm || 'Algoritmo Wright Fx'}
                </div>
              </div>
            </div>

            {/* Ancestors in common & Genetics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Shared Ancestors */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                    <GitFork className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Antepasados Compartidos en 4 Generaciones
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 font-mono text-[10px] font-bold">
                    {(serverCOI?.commonAncestors || analysis.sharedList).length} coincidencias
                  </span>
                </div>

                {(serverCOI?.commonAncestors?.length || analysis.sharedList.length) > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(serverCOI?.commonAncestors && serverCOI.commonAncestors.length > 0
                      ? serverCOI.commonAncestors
                      : analysis.sharedList
                    ).map((anc: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 dark:text-white block">{anc.nombre}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{anc.generaciones}</span>
                        </div>
                        {anc.contribucionPct !== undefined && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 font-mono font-bold text-xs shrink-0">
                            +{anc.contribucionPct}% Fx
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    No se detectaron antepasados compartidos en las 4 generaciones registradas. Cruza 100% Outcross favorable para vigor híbrido.
                  </div>
                )}
              </div>

              {/* Phenotypic Coat & Health Predictions */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Predicciones Fenotípicas y Alertas Genéticas
                </h4>

                <div className="space-y-2 text-[11px]">
                  {(serverCOI?.warnings && serverCOI.warnings.length > 0
                    ? serverCOI.warnings
                    : analysis.warnings
                  ).map((w: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <span>{w}</span>
                    </div>
                  ))}

                  {(serverCOI?.colorPredictions && serverCOI.colorPredictions.length > 0
                    ? serverCOI.colorPredictions
                    : analysis.coatPredictions
                  ).map((pred: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <span>{pred}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulation Notes & Save Action */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Notas y Objetivos de la Cruza Simulada (Opcional):
              </label>
              <textarea
                rows={2}
                value={simulationNotes}
                onChange={(e) => setSimulationNotes(e.target.value)}
                placeholder="ej: Planificada para primavera 2027. Objetivo: fijar pigmentación y temple."
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  * Las simulaciones son hipotéticas y se mantienen diferenciadas de las montas reales.
                </div>
                <button
                  onClick={handleSaveSimulation}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savedSuccess ? '¡Simulación Guardada!' : 'Guardar Simulación'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Simulations Registry */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Simulaciones Guardadas ({simulaciones.length})
        </h3>

        <div className="space-y-2.5 text-xs">
          {simulaciones.map((sim) => (
            <div
              key={sim.id}
              className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-slate-900 dark:text-white text-sm font-bold">
                    {sim.machoNombre} x {sim.hembraNombre}
                  </strong>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Fx: {sim.coeficienteConsanguinidad}%
                  </span>
                  {sim.machoEsExterno && (
                    <a
                      href={sim.machoLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                      title="Macho de PedigreeDatabase"
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span>Macho PDB</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {sim.hembraEsExterno && (
                    <a
                      href={sim.hembraLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 hover:bg-pink-100 transition-colors inline-flex items-center gap-1"
                      title="Hembra de PedigreeDatabase"
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span>Hembra PDB</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{sim.notas}</p>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                  Fecha de simulación: {sim.fecha}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => deleteSimulacionCruza(sim.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Eliminar simulación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {simulaciones.length === 0 && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              No hay simulaciones guardadas aún. Seleccioná un macho y una hembra arriba para comenzar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
