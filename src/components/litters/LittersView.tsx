import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Camada, EstadoCamada } from '../../types';
import {
  FolderKanban,
  Plus,
  Baby,
  Calendar,
  Trash2,
  Edit,
  Save,
  X,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Camera,
  Upload,
  Loader2,
  Utensils,
  Scale,
} from 'lucide-react';

import { PuppyFormModal } from '../puppies/PuppyFormModal';
import { getCollarColorHex, getCollarColorName, formatDateDMY } from '../../lib/dogUtils';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, uploadDogPhoto } from '../../lib/firebase';
import {
  calcularConsumoCamadaConFreno,
  obtenerEtapaNutricionalCachorro,
} from '../../utils/puppyNutrition';

// ============================================================================
// CONFIGURACIÓN DE IMAGEN POR DEFECTO PARA CAMADAS
// ============================================================================
export const DEFAULT_CAMADA_IMAGE = '/assets/puppy-dog-pet-german-shepherd-wallpaper-preview.jpg';

export const LittersView: React.FC = () => {
  const {
    camadas,
    cachorros,
    ejemplares,
    addCamada,
    updateCamada,
    deleteCamada,
    deleteCachorro,
    addEjemplar,
    currentCriaderoId,
    currentUser,
    setActiveTab,
    exportToCSV,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamada, setEditingCamada] = useState<Camada | null>(null);
  const [isPuppyModalOpen, setIsPuppyModalOpen] = useState(false);
  const [registerPuppyCamadaId, setRegisterPuppyCamadaId] = useState<string | null>(null);
  const [firestorePupsByCamada, setFirestorePupsByCamada] = useState<Record<string, any[]>>({});
  const [puppyToDelete, setPuppyToDelete] = useState<any | null>(null);
  const [isDeletingPup, setIsDeletingPup] = useState(false);
  const [uploadingCamadaId, setUploadingCamadaId] = useState<string | null>(null);

  const handleUploadCamadaPhoto = async (camadaId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    try {
      setUploadingCamadaId(camadaId);
      const res = await uploadDogPhoto(file, `camada_${camadaId}`);
      updateCamada(camadaId, { fotoUrl: res.url });
    } catch (err: any) {
      console.error('Error al subir foto de la camada:', err);
      alert('Error al subir la imagen: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setUploadingCamadaId(null);
    }
  };

  // Consulta estricta en tiempo real a Firestore para cada camada (where('camadaId', '==', camada.id))
  useEffect(() => {
    if (!camadas || camadas.length === 0) return;

    const unsubs: (() => void)[] = [];
    const cachorrosRef = collection(db, 'cachorros');

    camadas.forEach((camada) => {
      try {
        const q = query(cachorrosRef, where('camadaId', '==', camada.id));
        const unsub = onSnapshot(
          q,
          (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() });
            });
            setFirestorePupsByCamada((prev) => ({
              ...prev,
              [camada.id]: list,
            }));
          },
          (err) => {
            console.warn(`Error al consultar cachorros de Firestore para camada ${camada.id}:`, err);
          }
        );
        unsubs.push(unsub);
      } catch (err) {
        console.warn('Error configurando query de Firestore para cachorros:', err);
      }
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [camadas]);

  const machos = ejemplares.filter((e) => e.sexo === 'MACHO');
  const hembras = ejemplares.filter((e) => e.sexo === 'HEMBRA');

  // Orden alfabético estricto por identificador o letra de la camada (ej. Camada "A", Camada "B")
  const sortedCamadas = useMemo(() => {
    return [...camadas].sort((a, b) => {
      const nameA = (a.identificador || '').trim();
      const nameB = (b.identificador || '').trim();
      return nameA.localeCompare(nameB, 'es', {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }, [camadas]);

  // Manejo de eliminación asíncrona de cachorro con confirmación
  const handleConfirmDeletePuppy = async () => {
    if (!puppyToDelete) return;
    try {
      setIsDeletingPup(true);
      // Borrar de Firestore
      await deleteDoc(doc(db, 'cachorros', puppyToDelete.id));
      // Actualizar estado local reactivo del contexto
      deleteCachorro(puppyToDelete.id);
      // Actualizar el mapa local de Firestore inmediatamente
      setFirestorePupsByCamada((prev) => {
        const next: Record<string, any[]> = {};
        Object.keys(prev).forEach((k) => {
          next[k] = (prev[k] || []).filter((p) => p.id !== puppyToDelete.id);
        });
        return next;
      });
      setPuppyToDelete(null);
    } catch (err) {
      console.error('Error al eliminar cachorro de Firestore:', err);
      alert('Hubo un error al intentar eliminar el cachorro de la base de datos.');
    } finally {
      setIsDeletingPup(false);
    }
  };

  // Form states
  const [identificador, setIdentificador] = useState('');
  const [padreId, setPadreId] = useState(machos[0]?.id || '');
  const [madreId, setMadreId] = useState(hembras[0]?.id || '');

  // Unregistered / External Male states
  const [isPadreExterno, setIsPadreExterno] = useState(false);
  const [padreNombreManual, setPadreNombreManual] = useState('');
  const [padreFechaNacimiento, setPadreFechaNacimiento] = useState('');
  const [padreTatuaje, setPadreTatuaje] = useState('');
  const [padreNumeroPOA, setPadreNumeroPOA] = useState('');
  const [padreMicrochip, setPadreMicrochip] = useState('');
  const [padrePelo, setPadrePelo] = useState<'CORTO' | 'LARGO' | 'MEDIO'>('CORTO');

  // Unregistered / External Female states
  const [isMadreExterna, setIsMadreExterna] = useState(false);
  const [madreNombreManual, setMadreNombreManual] = useState('');
  const [madreFechaNacimiento, setMadreFechaNacimiento] = useState('');
  const [madreTatuaje, setMadreTatuaje] = useState('');
  const [madreNumeroPOA, setMadreNumeroPOA] = useState('');
  const [madreMicrochip, setMadreMicrochip] = useState('');
  const [madrePelo, setMadrePelo] = useState<'CORTO' | 'LARGO' | 'MEDIO'>('CORTO');

  const [fechaNacimiento, setFechaNacimiento] = useState(new Date().toISOString().split('T')[0]);
  const [totalCachorros, setTotalCachorros] = useState<number>(6);
  const [machosCount, setMachosCount] = useState<number>(3);
  const [hembrasCount, setHembrasCount] = useState<number>(3);
  const [nacidosVivos, setNacidosVivos] = useState<number>(6);
  const [fallecidos, setFallecidos] = useState<number>(0);
  const [tipoParto, setTipoParto] = useState<'NATURAL' | 'CESAREA'>('NATURAL');
  const [estado, setEstado] = useState<EstadoCamada>('LACTANCIA');
  const [fotoUrl, setFotoUrl] = useState(
    'https://images.unsplash.com/photo-1591160690555-5debfba289f0?auto=format&fit=crop&w=800&q=80'
  );
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedPadre = machos.find((m) => m.id === padreId) || machos[0];
  const selectedMadre = hembras.find((h) => h.id === madreId) || hembras[0];

  const handleOpenCreate = () => {
    setEditingCamada(null);
    setIdentificador(`Camada "${String.fromCharCode(65 + camadas.length)}" 2026`);
    setIsPadreExterno(machos.length === 0);
    setPadreNombreManual('');
    setPadreFechaNacimiento('');
    setPadreTatuaje('');
    setPadreNumeroPOA('');
    setPadreMicrochip('');
    setPadrePelo('CORTO');

    setIsMadreExterna(hembras.length === 0);
    setMadreNombreManual('');
    setMadreFechaNacimiento('');
    setMadreTatuaje('');
    setMadreNumeroPOA('');
    setMadreMicrochip('');
    setMadrePelo('CORTO');

    setTotalCachorros(6);
    setMachosCount(3);
    setHembrasCount(3);
    setNacidosVivos(6);
    setFallecidos(0);
    setFechaNacimiento(new Date().toISOString().split('T')[0]);
    setIsFormOpen(true);
  };

  const handleSaveCamada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) return;

    setIsSaving(true);
    try {
      let finalPadreId = selectedPadre?.id || '';
      let finalPadreNombre = selectedPadre?.nombreCompleto || 'Padre no registrado';

      if (isPadreExterno) {
        if (!padreNombreManual.trim()) {
          alert('Por favor ingresá el nombre del macho reproductor.');
          setIsSaving(false);
          return;
        }
        finalPadreNombre = padreNombreManual.trim();
        // Check if an external dog with same name or POA already exists in the system
        const existingMacho = ejemplares.find(
          (m) =>
            m.sexo === 'MACHO' &&
            ((padreNumeroPOA.trim() && m.numeroPOA.trim().toLowerCase() === padreNumeroPOA.trim().toLowerCase()) ||
              m.nombreCompleto.trim().toLowerCase() === finalPadreNombre.toLowerCase())
        );

        if (existingMacho) {
          finalPadreId = existingMacho.id;
        } else {
          // Register the external sire as an Ejemplar in Firestore/state
          const newSire = await addEjemplar({
            criaderoId: currentCriaderoId,
            nombreCompleto: finalPadreNombre,
            afijo: '',
            sexo: 'MACHO',
            raza: 'Ovejero Alemán (Pastor Alemán)',
            fechaNacimiento: padreFechaNacimiento || '2022-01-01',
            tatuaje: padreTatuaje.trim(),
            numeroPOA: padreNumeroPOA.trim(),
            microchip: padreMicrochip.trim(),
            pelo: padrePelo,
            identificacionInterna: '',
            color: 'Negro y Fuego',
            estadoReproductivo: 'ACTIVO',
            estado: 'ACTIVO',
            calificacionCria: 'Seleccionado',
            displasiaCadera: 'HD "a" Normal (Libre)',
            displasiaCodo: 'ED "0" Normal (Libre)',
            adn: 'Comprobado',
            titulos: [],
            observaciones: 'Macho registrado desde formulario de camada.',
            esExterno: true,
            fotoUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=400&q=80',
          });
          finalPadreId = newSire.id;
        }
      }

      let finalMadreId = selectedMadre?.id || '';
      let finalMadreNombre = selectedMadre?.nombreCompleto || 'Madre no registrada';

      if (isMadreExterna) {
        if (!madreNombreManual.trim()) {
          alert('Por favor ingresá el nombre de la hembra reproductora.');
          setIsSaving(false);
          return;
        }
        finalMadreNombre = madreNombreManual.trim();
        const existingHembra = ejemplares.find(
          (h) =>
            h.sexo === 'HEMBRA' &&
            ((madreNumeroPOA.trim() && h.numeroPOA.trim().toLowerCase() === madreNumeroPOA.trim().toLowerCase()) ||
              h.nombreCompleto.trim().toLowerCase() === finalMadreNombre.toLowerCase())
        );

        if (existingHembra) {
          finalMadreId = existingHembra.id;
        } else {
          // Register the external dam as an Ejemplar in Firestore/state
          const newDam = await addEjemplar({
            criaderoId: currentCriaderoId,
            nombreCompleto: finalMadreNombre,
            afijo: '',
            sexo: 'HEMBRA',
            raza: 'Ovejero Alemán (Pastor Alemán)',
            fechaNacimiento: madreFechaNacimiento || '2022-01-01',
            tatuaje: madreTatuaje.trim(),
            numeroPOA: madreNumeroPOA.trim(),
            microchip: madreMicrochip.trim(),
            pelo: madrePelo,
            identificacionInterna: '',
            color: 'Negro y Fuego',
            estadoReproductivo: 'ACTIVO',
            estado: 'ACTIVO',
            calificacionCria: 'Seleccionado',
            displasiaCadera: 'HD "a" Normal (Libre)',
            displasiaCodo: 'ED "0" Normal (Libre)',
            adn: 'Comprobado',
            titulos: [],
            observaciones: 'Hembra registrada desde formulario de camada.',
            esExterno: true,
            fotoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
          });
          finalMadreId = newDam.id;
        }
      }

      const data: Omit<Camada, 'id' | 'createdAt'> = {
        criaderoId: currentUser?.uid || currentUser?.id || currentCriaderoId,
        identificador,
        padreId: finalPadreId,
        padreNombre: finalPadreNombre,
        padreFechaNacimiento: isPadreExterno ? padreFechaNacimiento : (selectedPadre?.fechaNacimiento || undefined),
        padreTatuaje: isPadreExterno ? padreTatuaje.trim() : (selectedPadre?.tatuaje || undefined),
        padreNumeroPOA: isPadreExterno ? padreNumeroPOA.trim() : (selectedPadre?.numeroPOA || undefined),
        padreMicrochip: isPadreExterno ? padreMicrochip.trim() : (selectedPadre?.microchip || undefined),
        padrePelo: isPadreExterno ? padrePelo : (selectedPadre?.pelo as any || undefined),
        padreEsExterno: isPadreExterno,

        madreId: finalMadreId,
        madreNombre: finalMadreNombre,
        madreFechaNacimiento: isMadreExterna ? madreFechaNacimiento : (selectedMadre?.fechaNacimiento || undefined),
        madreTatuaje: isMadreExterna ? madreTatuaje.trim() : (selectedMadre?.tatuaje || undefined),
        madreNumeroPOA: isMadreExterna ? madreNumeroPOA.trim() : (selectedMadre?.numeroPOA || undefined),
        madreMicrochip: isMadreExterna ? madreMicrochip.trim() : (selectedMadre?.microchip || undefined),
        madrePelo: isMadreExterna ? madrePelo : (selectedMadre?.pelo as any || undefined),
        madreEsExterna: isMadreExterna,

        fechaNacimiento,
        totalCachorros,
        machos: machosCount,
        hembras: hembrasCount,
        nacidosVivos,
        fallecidos,
        tipoParto,
        estado,
        fotoUrl,
        observaciones,
      };

      if (editingCamada) {
        updateCamada(editingCamada.id, data);
      } else {
        addCamada(data);
      }

      setIsFormOpen(false);
    } catch (err) {
      console.error('Error al guardar la camada:', err);
      alert('Ocurrió un error al guardar la camada. Por favor intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const rows = camadas.map((c) => ({
      Identificador: c.identificador,
      FechaNacimiento: c.fechaNacimiento,
      Padre: c.padreNombre,
      Madre: c.madreNombre,
      TotalCachorros: c.totalCachorros,
      Machos: c.machos,
      Hembras: c.hembras,
      NacidosVivos: c.nacidosVivos,
      Fallecidos: c.fallecidos,
      TipoParto: c.tipoParto,
      Estado: c.estado,
    }));
    exportToCSV(`CAMADAS_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const getStatusBadge = (st: EstadoCamada) => {
    switch (st) {
      case 'LACTANCIA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DESTETE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'NACIDA':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'FINALIZADA':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Control Reproductivo & Nacimientos</span>
            <span>•</span>
            <span className="font-mono">{camadas.length} camadas registradas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Camadas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Control de nacimientos reales, lactancia, destete, vacunas y seguimiento individual de cachorros.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-xs hover:scale-[1.02] cursor-pointer"
            title="Exportar listado a Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Camada</span>
          </button>
        </div>
      </div>

      {/* Camadas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedCamadas.map((camada) => {
          // Cachorros consultados de Firestore para esta camada específica
          const pupsFromFirestore = firestorePupsByCamada[camada.id] || [];

          // Unificación de Firestore y memoria local sin duplicados
          const allPupsMap = new Map<string, any>();
          pupsFromFirestore.forEach((p) => allPupsMap.set(p.id, p));
          cachorros.forEach((p) => {
            if (!allPupsMap.has(p.id)) {
              allPupsMap.set(p.id, p);
            }
          });

          // Filtro estricto por camada: evita mezclar cachorros de otra camada (ej. Camada L en Camada A)
          const pupsInLitter = Array.from(allPupsMap.values()).filter((c) => {
            // Si el cachorro tiene camadaNombre explícito, debe pertenecer exactamente a esta camada
            if (c.camadaNombre && c.camadaNombre.trim().toLowerCase() === camada.identificador.trim().toLowerCase()) {
              return true;
            }
            // Si su camadaId coincide con el id de la camada y no tiene otro nombre de camada contradictorio
            if (c.camadaId === camada.id) {
              if (c.camadaNombre && c.camadaNombre.trim().toLowerCase() !== camada.identificador.trim().toLowerCase()) {
                return false;
              }
              return true;
            }
            // Si su camadaId fue guardado como el identificador textual
            if (c.camadaId && c.camadaId.trim().toLowerCase() === camada.identificador.trim().toLowerCase()) {
              return true;
            }
            return false;
          });
          return (
            <div
              key={camada.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={camada.fotoUrl || DEFAULT_CAMADA_IMAGE}
                    alt="Cachorro por defecto"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.src.includes('puppy-dog-pet-german-shepherd-wallpaper-preview.jpg')) {
                        target.src = DEFAULT_CAMADA_IMAGE;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <label
                      className="px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/85 text-white text-[10px] font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 z-10"
                      title="Subir o cambiar foto de la camada"
                    >
                      {uploadingCamadaId === camada.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-300" />
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3 h-3 text-indigo-300" />
                          <span>{camada.fotoUrl ? 'Cambiar Foto' : 'Cargar Foto'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingCamadaId === camada.id}
                        onChange={(e) => handleUploadCamadaPhoto(camada.id, e)}
                      />
                    </label>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${getStatusBadge(
                        camada.estado
                      )}`}
                    >
                      {camada.estado}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-xl font-black text-white group-hover:text-indigo-200 transition-colors">
                      {camada.identificador}
                    </h3>
                    <div className="text-xs text-slate-200 font-mono mt-0.5">
                      Nacimiento: {formatDateDMY(camada.fechaNacimiento)} • Parto {camada.tipoParto}
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="p-5 space-y-4 text-xs">
                  {/* Parents Badges */}
                  {/* Parents Badges */}
                  {(() => {
                    const padreEj = ejemplares.find((e) => e.id === camada.padreId || e.nombreCompleto === camada.padreNombre);
                    const madreEj = ejemplares.find((e) => e.id === camada.madreId || e.nombreCompleto === camada.madreNombre);

                    const pPOA = camada.padreNumeroPOA || padreEj?.numeroPOA;
                    const pTat = camada.padreTatuaje || padreEj?.tatuaje;
                    const pChip = camada.padreMicrochip || padreEj?.microchip;
                    const pPelo = camada.padrePelo || padreEj?.pelo;

                    const mPOA = camada.madreNumeroPOA || madreEj?.numeroPOA;
                    const mTat = camada.madreTatuaje || madreEj?.tatuaje;
                    const mChip = camada.madreMicrochip || madreEj?.microchip;
                    const mPelo = camada.madrePelo || madreEj?.pelo;

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block tracking-wider">
                              Padre Reproductor
                            </span>
                            {camada.padreEsExterno && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                Externo
                              </span>
                            )}
                          </div>
                          <strong className="text-slate-900 dark:text-white truncate block mt-0.5 font-bold">
                            {camada.padreNombre}
                          </strong>
                          {(pPOA || pTat || pChip || pPelo) ? (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex flex-wrap gap-1.5">
                              {pPOA && <span>POA: {pPOA}</span>}
                              {pTat && <span>TAT: {pTat}</span>}
                              {pChip && <span>Chip: {pChip}</span>}
                              {pPelo && (
                                <span>Pelo: {pPelo === 'CORTO' ? 'Corto' : pPelo === 'LARGO' ? 'Largo' : pPelo}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-0.5 italic">Sin datos adicionales</span>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-pink-50/70 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/50">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-pink-700 dark:text-pink-300 block tracking-wider">
                              Madre Reproductora
                            </span>
                            {camada.madreEsExterna && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-300">
                                Externa
                              </span>
                            )}
                          </div>
                          <strong className="text-slate-900 dark:text-white truncate block mt-0.5 font-bold">
                            {camada.madreNombre}
                          </strong>
                          {(mPOA || mTat || mChip || mPelo) ? (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex flex-wrap gap-1.5">
                              {mPOA && <span>POA: {mPOA}</span>}
                              {mTat && <span>TAT: {mTat}</span>}
                              {mChip && <span>Chip: {mChip}</span>}
                              {mPelo && (
                                <span>Pelo: {mPelo === 'CORTO' ? 'Corto' : mPelo === 'LARGO' ? 'Largo' : mPelo}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 block mt-0.5 italic">Sin datos adicionales</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Numbers Grid */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-lg font-black text-slate-900 dark:text-white">{camada.totalCachorros}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Total</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-lg font-black text-blue-700 dark:text-blue-400">{camada.machos}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Machos</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-lg font-black text-pink-700 dark:text-pink-400">{camada.hembras}</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Hembras</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                        {camada.nacidosVivos}
                      </div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold">Vivos</div>
                    </div>
                  </div>

                  {/* Etapa de Alimentación Dinámica & Freno de Racionamiento */}
                  {camada.fechaNacimiento && (() => {
                    const consumoInfo = calcularConsumoCamadaConFreno(camada, pupsInLitter);
                    const etapa = consumoInfo.etapa;

                    return (
                      <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-slate-50 dark:from-slate-800/90 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/50 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 tracking-wider">
                            <Utensils className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Etapa Nutricional ({etapa.rangoSemanas})</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${etapa.badgeColor}`}>
                            {etapa.nombreEtapa}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-950/60 italic">
                          &quot;{etapa.indicacionNutricional}&quot;
                        </p>

                        {/* Racionamiento & Freno por Cachorro Entregado */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] pt-1 border-t border-amber-100 dark:border-slate-800">
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <span>Consumiendo en criadero:</span>
                            <strong className="text-slate-900 dark:text-white font-bold">
                              {consumoInfo.cachorrosConsumiendoActivos} cachorros
                            </strong>
                            {etapa.consumeAlimentoStock && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-bold">
                                ({consumoInfo.consumoTotalCamadaKgDia.toFixed(2)} kg/día)
                              </span>
                            )}
                          </div>

                          {consumoInfo.cachorrosEntregados > 0 && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 flex items-center gap-1"
                              title={`${consumoInfo.cachorrosEntregados} cachorro(s) con estado ENTREGADO: se restaron automáticamente y dejaron de consumir stock de ración.`}
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Freno: {consumoInfo.cachorrosEntregados} entregado(s)</span>
                            </span>
                          )}

                          {!etapa.consumeAlimentoStock && (
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                              Lactancia materna (Stock inicia día 28)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Puppies in litter preview chips with descriptive collar color */}
                  <div className="pt-2">
                    {(() => {
                      const isLitterAtMax = camada.totalCachorros > 0 && pupsInLitter.length >= camada.totalCachorros;
                      return (
                        <>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span>Cachorros con Ficha Registrada ({pupsInLitter.length}{camada.totalCachorros > 0 ? `/${camada.totalCachorros}` : ''})</span>
                              {isLitterAtMax && (
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold border border-amber-500/20">
                                  Cupo Completo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isLitterAtMax) {
                                    alert(`Se ha alcanzado el límite de cachorros declarados para esta camada (${camada.totalCachorros} cachorros en total).`);
                                    return;
                                  }
                                  setRegisterPuppyCamadaId(camada.id);
                                  setIsPuppyModalOpen(true);
                                }}
                                className={`font-bold flex items-center gap-1 cursor-pointer text-[11px] ${
                                  isLitterAtMax
                                    ? 'text-slate-400 dark:text-slate-600 hover:text-slate-500'
                                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                                }`}
                                title={
                                  isLitterAtMax
                                    ? `Límite alcanzado: Ya se registraron los ${camada.totalCachorros} cachorros de la camada`
                                    : 'Registrar nuevo cachorro para esta camada'
                                }
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{isLitterAtMax ? 'Cupo Lleno' : 'Cachorro'}</span>
                              </button>
                              <button
                                onClick={() => setActiveTab('cachorros')}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span>Ver todos</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {pupsInLitter.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">No hay cachorros registrados en esta camada aún.</span>
                            ) : (
                              pupsInLitter.map((p) => {
                                const collarHex = getCollarColorHex(p.colorCollar, p.nombreColorCollar);
                                const collarName = getCollarColorName(p.colorCollar, p.nombreColorCollar);
                                return (
                                  <span
                                    key={p.id}
                                    className="group/pup px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                                    title={p.nombre ? `${p.nombre} (${p.identificadorProvisorio})` : p.identificadorProvisorio}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-1 ring-black/10 dark:ring-white/20"
                                      style={{ backgroundColor: collarHex }}
                                    />
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {collarName}
                                    </span>
                                    {p.nombre && (
                                      <span className="text-[9px] text-slate-400 font-normal">
                                        ({p.nombre.split(' ')[0]})
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPuppyToDelete(p);
                                      }}
                                      className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title={`Eliminar ficha de ${p.nombre || p.identificadorProvisorio}`}
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-500 hover:text-rose-700" />
                                    </button>
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => {
                    setEditingCamada(camada);
                    setIdentificador(camada.identificador);
                    setPadreId(camada.padreId);
                    setMadreId(camada.madreId);
                    setIsPadreExterno(Boolean(camada.padreEsExterno));
                    setPadreNombreManual(camada.padreEsExterno ? camada.padreNombre : '');
                    setPadreFechaNacimiento(camada.padreFechaNacimiento || '');
                    setPadreTatuaje(camada.padreTatuaje || '');
                    setPadreNumeroPOA(camada.padreNumeroPOA || '');
                    setPadreMicrochip(camada.padreMicrochip || '');
                    setPadrePelo(camada.padrePelo || 'CORTO');

                    setIsMadreExterna(Boolean(camada.madreEsExterna));
                    setMadreNombreManual(camada.madreEsExterna ? camada.madreNombre : '');
                    setMadreFechaNacimiento(camada.madreFechaNacimiento || '');
                    setMadreTatuaje(camada.madreTatuaje || '');
                    setMadreNumeroPOA(camada.madreNumeroPOA || '');
                    setMadreMicrochip(camada.madreMicrochip || '');
                    setMadrePelo(camada.madrePelo || 'CORTO');

                    setFechaNacimiento(camada.fechaNacimiento || new Date().toISOString().split('T')[0]);
                    setTotalCachorros(camada.totalCachorros);
                    setMachosCount(camada.machos);
                    setHembrasCount(camada.hembras);
                    setNacidosVivos(camada.nacidosVivos);
                    setFallecidos(camada.fallecidos);
                    setTipoParto(camada.tipoParto || 'NATURAL');
                    setEstado(camada.estado);
                    setFotoUrl(camada.fotoUrl || '');
                    setObservaciones(camada.observaciones || '');
                    setIsFormOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Editar
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('cachorros')}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>Ver Fichas</span>
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Eliminar la camada "${camada.identificador}"? Esta acción no se puede deshacer.`
                        )
                      ) {
                        deleteCamada(camada.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar camada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl text-slate-800 dark:text-slate-200 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>{editingCamada ? 'Editar Camada' : 'Registrar Nueva Camada'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCamada} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nombre / Identificador</label>
                <input
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="Ej: Camada Demo B 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  required
                />
              </div>

              {/* Padre (Macho) Selection or External Form */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Padre (Macho Reproductor)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsPadreExterno(!isPadreExterno)}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isPadreExterno ? '← Seleccionar macho del criadero' : '+ Cargar macho no registrado / externo'}</span>
                  </button>
                </div>

                {!isPadreExterno ? (
                  <div>
                    <select
                      value={padreId}
                      onChange={(e) => setPadreId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                    >
                      {machos.length === 0 && <option value="">No hay machos registrados en el criadero</option>}
                      {machos.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombreCompleto} {m.numeroPOA ? `(POA: ${m.numeroPOA})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-200 font-medium">
                      Macho no registrado en el criadero (servicio externo / reproductor invitado). Sus datos se asociarán a la camada y quedará registrado.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Nombre del macho *
                        </label>
                        <input
                          type="text"
                          value={padreNombreManual}
                          onChange={(e) => setPadreNombreManual(e.target.value)}
                          placeholder="ej: VA1 Gary vom Hühnegrab"
                          required={isPadreExterno}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Fecha de nacimiento
                        </label>
                        <input
                          type="date"
                          value={padreFechaNacimiento}
                          onChange={(e) => setPadreFechaNacimiento(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Número POA
                        </label>
                        <input
                          type="text"
                          value={padreNumeroPOA}
                          onChange={(e) => setPadreNumeroPOA(e.target.value)}
                          placeholder="ej: POA-245100"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Tatuaje POA
                        </label>
                        <input
                          type="text"
                          value={padreTatuaje}
                          onChange={(e) => setPadreTatuaje(e.target.value)}
                          placeholder="ej: TAT-982"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Microchip
                        </label>
                        <input
                          type="text"
                          value={padreMicrochip}
                          onChange={(e) => setPadreMicrochip(e.target.value)}
                          placeholder="90008500..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Tipo de pelo
                        </label>
                        <select
                          value={padrePelo}
                          onChange={(e) => setPadrePelo(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                        >
                          <option value="CORTO">Pelo Corto</option>
                          <option value="LARGO">Pelo Largo</option>
                          <option value="MEDIO">Medio</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Madre (Hembra) Selection or External Form */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-pink-600"></span>
                    <span>Madre (Hembra Reproductora)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMadreExterna(!isMadreExterna)}
                    className="text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isMadreExterna ? '← Seleccionar hembra del criadero' : '+ Cargar hembra no registrada / externa'}</span>
                  </button>
                </div>

                {!isMadreExterna ? (
                  <div>
                    <select
                      value={madreId}
                      onChange={(e) => setMadreId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                    >
                      {hembras.length === 0 && <option value="">No hay hembras registradas en el criadero</option>}
                      {hembras.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.nombreCompleto} {h.numeroPOA ? `(POA: ${h.numeroPOA})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="p-2 rounded-lg bg-pink-50/70 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900 text-[11px] text-pink-800 dark:text-pink-200 font-medium">
                      Hembra no registrada en el criadero (adquisición o servicio externo). Sus datos se asociarán a la camada y quedará registrada.
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Nombre de la hembra *
                        </label>
                        <input
                          type="text"
                          value={madreNombreManual}
                          onChange={(e) => setMadreNombreManual(e.target.value)}
                          placeholder="ej: V Cira von der Liebeswarte"
                          required={isMadreExterna}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Fecha de nacimiento
                        </label>
                        <input
                          type="date"
                          value={madreFechaNacimiento}
                          onChange={(e) => setMadreFechaNacimiento(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Número POA
                        </label>
                        <input
                          type="text"
                          value={madreNumeroPOA}
                          onChange={(e) => setMadreNumeroPOA(e.target.value)}
                          placeholder="ej: POA-248900"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Tatuaje POA
                        </label>
                        <input
                          type="text"
                          value={madreTatuaje}
                          onChange={(e) => setMadreTatuaje(e.target.value)}
                          placeholder="ej: TAT-710"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Microchip
                        </label>
                        <input
                          type="text"
                          value={madreMicrochip}
                          onChange={(e) => setMadreMicrochip(e.target.value)}
                          placeholder="90008500..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-0.5">
                          Tipo de pelo
                        </label>
                        <select
                          value={madrePelo}
                          onChange={(e) => setMadrePelo(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
                        >
                          <option value="CORTO">Pelo Corto</option>
                          <option value="LARGO">Pelo Largo</option>
                          <option value="MEDIO">Medio</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Tipo de Parto</label>
                  <select
                    value={tipoParto}
                    onChange={(e) => setTipoParto(e.target.value as 'NATURAL' | 'CESAREA')}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                  >
                    <option value="NATURAL">Natural</option>
                    <option value="CESAREA">Cesárea</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Estado de Camada</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoCamada)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                  >
                    <option value="LACTANCIA">Lactancia</option>
                    <option value="DESTETE">Destete</option>
                    <option value="NACIDA">Nacida</option>
                    <option value="FINALIZADA">Finalizada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Total</label>
                  <input
                    type="number"
                    value={totalCachorros}
                    onChange={(e) => setTotalCachorros(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Machos</label>
                  <input
                    type="number"
                    value={machosCount}
                    onChange={(e) => setMachosCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Hembras</label>
                  <input
                    type="number"
                    value={hembrasCount}
                    onChange={(e) => setHembrasCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Vivos</label>
                  <input
                    type="number"
                    value={nacidosVivos}
                    onChange={(e) => setNacidosVivos(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Foto Representativa de la Camada
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="h-24 w-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                    <img
                      src={fotoUrl || DEFAULT_CAMADA_IMAGE}
                      alt="Cachorro por defecto"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.src.includes('puppy-dog-pet-german-shepherd-wallpaper-preview.jpg')) {
                          target.src = DEFAULT_CAMADA_IMAGE;
                        }
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Foto a Firebase</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const res = await uploadDogPhoto(f, 'camada_foto');
                              setFotoUrl(res.url);
                            } catch (err: any) {
                              alert('Error al subir imagen: ' + (err.message || 'Error'));
                            }
                          }}
                        />
                      </label>
                      {fotoUrl && (
                        <button
                          type="button"
                          onClick={() => setFotoUrl('')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:text-rose-600 cursor-pointer"
                        >
                          Usar por defecto
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={fotoUrl}
                      onChange={(e) => setFotoUrl(e.target.value)}
                      placeholder="https://... o dejá en blanco para imagen por defecto"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      💡 <strong>Imagen por defecto:</strong> Si no se carga foto propia, se muestra la foto oficial de cachorros.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-all cursor-pointer"
                >
                  Guardar Camada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Puppy Form Modal directly from Litters view */}
      {isPuppyModalOpen && (
        <PuppyFormModal
          initialCamadaId={registerPuppyCamadaId || undefined}
          onClose={() => {
            setIsPuppyModalOpen(false);
            setRegisterPuppyCamadaId(null);
          }}
        />
      )}

      {/* Confirmation Modal to Delete Puppy from Litter */}
      {puppyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ¿Eliminar este cachorro de la camada?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción eliminará permanentemente la ficha del cachorro de Firestore y se actualizará la lista de inmediato.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Cachorro:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {puppyToDelete.nombre || puppyToDelete.nombreDefinitivo || puppyToDelete.identificadorProvisorio}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Collar:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block ring-1 ring-black/10"
                    style={{
                      backgroundColor: getCollarColorHex(
                        puppyToDelete.colorCollar,
                        puppyToDelete.nombreColorCollar
                      ),
                    }}
                  />
                  {getCollarColorName(puppyToDelete.colorCollar, puppyToDelete.nombreColorCollar)}
                </span>
              </div>
              {puppyToDelete.sexo && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Sexo:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {puppyToDelete.sexo === 'MACHO' ? 'Macho' : 'Hembra'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingPup}
                onClick={() => setPuppyToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingPup}
                onClick={handleConfirmDeletePuppy}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingPup ? 'Eliminando...' : 'Sí, eliminar cachorro'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
