import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Monta } from '../../types';
import {
  HeartHandshake,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  X,
  FileSpreadsheet,
  CalendarClock,
  Activity,
  ArrowRight,
  Edit,
} from 'lucide-react';
import { formatDateDMY } from '../../lib/dogUtils';

export const MatingsView: React.FC = () => {
  const {
    montas,
    ejemplares,
    addMonta,
    deleteMonta,
    updateMonta,
    gestaciones,
    addGestacion,
    currentCriaderoId,
    exportToCSV,
    setActiveTab,
    addEjemplar,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMonta, setEditingMonta] = useState<Monta | null>(null);

  const machos = ejemplares.filter((e) => e.sexo === 'MACHO');
  const hembras = ejemplares.filter((e) => e.sexo === 'HEMBRA');

  // Form states
  const [hembraId, setHembraId] = useState(hembras[0]?.id || '');
  const [machoId, setMachoId] = useState(machos[0]?.id || '');
  const [fechaMonta, setFechaMonta] = useState(new Date().toISOString().split('T')[0]);
  const [codigoCiclo, setCodigoCiclo] = useState('CICLO-2026-01');
  const [tipoServicio, setTipoServicio] = useState<'NATURAL' | 'INSEMINACION_FRESCA' | 'INSEMINACION_CONGELADA'>('NATURAL');
  const [duracion, setDuracion] = useState('Abrochamiento 20 minutos');
  const [estado, setEstado] = useState<'PENDIENTE' | 'CONFIRMADA_PREÑADA' | 'FALLIDA_VACIA'>('PENDIENTE');
  const [observaciones, setObservaciones] = useState('');

  // Estados para macho no registrado / externo
  const [isMachoExterno, setIsMachoExterno] = useState(false);
  const [machoNombreManual, setMachoNombreManual] = useState('');
  const [machoFechaNacimiento, setMachoFechaNacimiento] = useState('');
  const [machoTatuaje, setMachoTatuaje] = useState('');
  const [machoNumeroPOA, setMachoNumeroPOA] = useState('');
  const [machoMicrochip, setMachoMicrochip] = useState('');
  const [machoPelo, setMachoPelo] = useState<'CORTO' | 'LARGO' | 'MEDIO'>('CORTO');
  const [isSaving, setIsSaving] = useState(false);

  const selectedHembra = hembras.find((h) => h.id === hembraId) || hembras[0];
  const selectedMacho = machos.find((m) => m.id === machoId) || machos[0];

  const handleOpenCreate = () => {
    setEditingMonta(null);
    setIsMachoExterno(machos.length === 0);
    setMachoNombreManual('');
    setMachoFechaNacimiento('');
    setMachoTatuaje('');
    setMachoNumeroPOA('');
    setMachoMicrochip('');
    setMachoPelo('CORTO');
    setHembraId(hembras[0]?.id || '');
    setMachoId(machos[0]?.id || '');
    setFechaMonta(new Date().toISOString().split('T')[0]);
    setCodigoCiclo(`CICLO-${new Date().getFullYear()}-${String(montas.length + 1).padStart(2, '0')}`);
    setTipoServicio('NATURAL');
    setDuracion('Abrochamiento 20 minutos');
    setEstado('PENDIENTE');
    setObservaciones('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Monta) => {
    setEditingMonta(m);
    setHembraId(m.hembraId);

    const foundMacho = machos.find((d) => d.id === m.machoId || d.nombreCompleto === m.machoNombre);
    if (foundMacho) {
      setMachoId(foundMacho.id);
      setIsMachoExterno(false);
      setMachoNombreManual('');
      setMachoFechaNacimiento(foundMacho.fechaNacimiento || '');
      setMachoTatuaje(foundMacho.tatuaje || '');
      setMachoNumeroPOA(foundMacho.numeroPOA || '');
      setMachoMicrochip(foundMacho.microchip || '');
      setMachoPelo((foundMacho.pelo as any) || 'CORTO');
    } else {
      setIsMachoExterno(true);
      setMachoNombreManual(m.machoNombre || '');
      setMachoId('');
      setMachoFechaNacimiento('');
      setMachoTatuaje('');
      setMachoNumeroPOA('');
      setMachoMicrochip('');
      setMachoPelo('CORTO');
    }

    setFechaMonta(m.fechaMonta || new Date().toISOString().split('T')[0]);
    setCodigoCiclo(m.codigoCiclo || '');
    setTipoServicio(m.tipoServicio || 'NATURAL');
    setDuracion(m.duracion || 'Abrochamiento 20 minutos');
    setEstado(m.estado || 'PENDIENTE');
    setObservaciones(m.observaciones || '');
    setIsFormOpen(true);
  };

  const handleSaveMonta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHembra) {
      alert('Por favor seleccioná una hembra reproductora.');
      return;
    }

    setIsSaving(true);
    try {
      let finalMachoId = selectedMacho?.id || '';
      let finalMachoNombre = selectedMacho?.nombreCompleto || 'Macho no registrado';

      if (isMachoExterno) {
        if (!machoNombreManual.trim()) {
          alert('Por favor ingresá el nombre completo del padrillo externo.');
          setIsSaving(false);
          return;
        }

        finalMachoNombre = machoNombreManual.trim();

        // Verificar si ya existe en Firestore / estado local por POA o por Nombre
        const cleanPOA = machoNumeroPOA.trim().toLowerCase();
        const cleanNombre = finalMachoNombre.toLowerCase();

        const existingMacho = ejemplares.find(
          (m) =>
            m.sexo === 'MACHO' &&
            ((cleanPOA && m.numeroPOA?.trim().toLowerCase() === cleanPOA) ||
              m.nombreCompleto?.trim().toLowerCase() === cleanNombre)
        );

        if (existingMacho) {
          finalMachoId = existingMacho.id;
          finalMachoNombre = existingMacho.nombreCompleto;
        } else {
          // Crear automáticamente en la colección de ejemplares de Firestore con esDelPlantel: false y esExterno: true
          const newSire = await addEjemplar({
            criaderoId: currentCriaderoId,
            nombreCompleto: finalMachoNombre,
            afijo: '',
            sexo: 'MACHO',
            raza: 'Ovejero Alemán (Pastor Alemán)',
            fechaNacimiento: machoFechaNacimiento || '2022-01-01',
            tatuaje: machoTatuaje.trim(),
            numeroPOA: machoNumeroPOA.trim(),
            microchip: machoMicrochip.trim(),
            pelo: machoPelo,
            identificacionInterna: '',
            color: 'Negro y Fuego',
            estadoReproductivo: 'ACTIVO',
            estado: 'ACTIVO',
            calificacionCria: 'Seleccionado',
            displasiaCadera: 'HD "a" Normal (Libre)',
            displasiaCodo: 'ED "0" Normal (Libre)',
            adn: 'Comprobado',
            titulos: [],
            observaciones: 'Padrillo externo registrado automáticamente desde Nueva Monta.',
            esDelPlantel: false,
            esExterno: true,
            fotoUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=400&q=80',
          });
          finalMachoId = newSire.id;
          finalMachoNombre = newSire.nombreCompleto;
        }
      } else {
        if (!selectedMacho) {
          alert('Por favor seleccioná un macho reproductor del criadero.');
          setIsSaving(false);
          return;
        }
        finalMachoId = selectedMacho.id;
        finalMachoNombre = selectedMacho.nombreCompleto;
      }

      // Fecha estimada de parto = 63 días después del servicio
      const serviceDate = new Date(fechaMonta);
      const estimatedWhelping = new Date(serviceDate.getTime() + 63 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      if (editingMonta) {
        await updateMonta(editingMonta.id, {
          codigoCiclo,
          hembraId: selectedHembra.id,
          hembraNombre: selectedHembra.nombreCompleto,
          machoId: finalMachoId,
          machoNombre: finalMachoNombre,
          fechaMonta,
          tipoServicio,
          duracion,
          estado,
          fechaEstimadaParto: estimatedWhelping,
          observaciones,
        });
      } else {
        await addMonta({
          criaderoId: currentCriaderoId,
          codigoCiclo,
          hembraId: selectedHembra.id,
          hembraNombre: selectedHembra.nombreCompleto,
          machoId: finalMachoId,
          machoNombre: finalMachoNombre,
          fechaMonta,
          tipoServicio,
          duracion,
          estado,
          fechaEstimadaParto: estimatedWhelping,
          observaciones,
        });
      }

      setIsFormOpen(false);
      setEditingMonta(null);
      setObservaciones('');
    } catch (err) {
      console.error('Error guardando la monta:', err);
      alert('Ocurrió un error al guardar la monta. Por favor intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasarAGestacion = (m: Monta) => {
    // Verificar si ya existe un registro de gestación para esta cruza
    const existingGest = gestaciones.find(
      (g) => (g.hembraId === m.hembraId && g.fechaMonta === m.fechaMonta) || g.id === m.id
    );

    if (existingGest) {
      setActiveTab('gestacion');
      return;
    }

    const baseDate = new Date(m.fechaMonta);
    const addDays = (d: Date, days: number) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy.toISOString().split('T')[0];
    };

    const hitos = [
      {
        id: `hito-1-${Date.now()}`,
        diaObjetivo: 28,
        titulo: 'Ecografía de confirmación embrionaria',
        descripcion: 'Verificar sacos gestacionales y vitalidad cardíaca.',
        fechaPlanificada: addDays(baseDate, 28),
        completado: false,
      },
      {
        id: `hito-2-${Date.now()}`,
        diaObjetivo: 45,
        titulo: 'Cambio de dieta a Puppy / Starter',
        descripcion: 'Aumento calórico fraccionado en 3 tomas y refuerzo proteico.',
        fechaPlanificada: addDays(baseDate, 45),
        completado: false,
      },
      {
        id: `hito-3-${Date.now()}`,
        diaObjetivo: 55,
        titulo: 'Radiografía de conteo fetal y acondicionamiento de paridera',
        descripcion: 'Conteo de cráneos y columnas para determinar cantidad exacta previa al parto.',
        fechaPlanificada: addDays(baseDate, 55),
        completado: false,
      },
      {
        id: `hito-4-${Date.now()}`,
        diaObjetivo: 60,
        titulo: 'Curva de temperatura rectal',
        descripcion: 'Monitoreo 3 veces al día. Caída por debajo de 37.2°C anticipa parto en 12-24hs.',
        fechaPlanificada: addDays(baseDate, 60),
        completado: false,
      },
      {
        id: `hito-5-${Date.now()}`,
        diaObjetivo: 63,
        titulo: 'Fecha estimada de parto (Whelping Day)',
        descripcion: 'Día probable de parto según ciclo biológico de 63 días.',
        fechaPlanificada: m.fechaEstimadaParto || addDays(baseDate, 63),
        completado: false,
      },
    ];

    addGestacion({
      criaderoId: currentCriaderoId,
      hembraId: m.hembraId,
      hembraNombre: m.hembraNombre,
      machoId: m.machoId,
      machoNombre: m.machoNombre,
      fechaMonta: m.fechaMonta,
      fechaEstimadaParto: m.fechaEstimadaParto || addDays(baseDate, 63),
      estado: 'EN_CURSO',
      observaciones: `Gestación vinculada desde Servicio de Monta (${m.codigoCiclo}).`,
      hitos,
    });

    updateMonta(m.id, { estado: 'CONFIRMADA_PREÑADA' });
    alert(`Se ha creado el registro de gestación para ${m.hembraNombre} x ${m.machoNombre}.`);
    setActiveTab('gestacion');
  };

  const handleExportCSV = () => {
    const rows = montas.map((m) => ({
      CodigoCiclo: m.codigoCiclo,
      Hembra: m.hembraNombre,
      Macho: m.machoNombre,
      FechaMonta: m.fechaMonta,
      TipoServicio: m.tipoServicio,
      Duracion: m.duracion || '',
      Estado: m.estado,
      FechaEstimadaParto: m.fechaEstimadaParto,
      Observaciones: m.observaciones || '',
    }));
    exportToCSV(`MONTAS_Y_SERVICIOS_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-pink-600" />
            Registro de Montas y Servicios Reproductivos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Cruzas naturales, inseminaciones, cálculo automático de parto estimado a 63 días ({montas.length} montas)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Monta</span>
          </button>
        </div>
      </div>

      {/* Grid of Matings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {montas.map((m) => {
          const machoEj = ejemplares.find((e) => e.id === m.machoId || e.nombreCompleto === m.machoNombre);
          const isMachoExternoCard = machoEj?.esDelPlantel === false || machoEj?.esExterno;

          return (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">
                        {m.codigoCiclo}
                      </span>
                      {isMachoExternoCard && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Macho Externo
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                      {m.hembraNombre} x {m.machoNombre}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      m.estado === 'CONFIRMADA_PREÑADA'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : m.estado === 'FALLIDA_VACIA'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {m.estado}
                  </span>
                </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 block">Fecha de Monta:</span>
                  <strong className="text-slate-800 font-mono">{formatDateDMY(m.fechaMonta)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Parto Estimado (63d):</span>
                  <strong className="text-amber-800 font-mono font-bold">{formatDateDMY(m.fechaEstimadaParto)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Tipo de Servicio:</span>
                  <span className="text-slate-700">{m.tipoServicio}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Duración:</span>
                  <span className="text-slate-700">{m.duracion || 'N/D'}</span>
                </div>
              </div>

              {m.observaciones && (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  &quot;{m.observaciones}&quot;
                </p>
              )}
            </div>

            {(() => {
              const hasGestation = gestaciones.some(
                (g) => (g.hembraId === m.hembraId && g.fechaMonta === m.fechaMonta) || g.id === m.id
              );
              return (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {hasGestation ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('gestacion')}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1.5 border border-purple-200 transition-colors cursor-pointer"
                        title="Ver cronograma y seguimiento de gestación en curso"
                      >
                        <Activity className="w-3.5 h-3.5 text-purple-600" />
                        <span>Ver Gestación</span>
                        <ArrowRight className="w-3 h-3 text-purple-400" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePasarAGestacion(m)}
                        className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:scale-[1.02] transition-all cursor-pointer"
                        title="Crear registro de gestación heredando los datos del servicio"
                      >
                        <CalendarClock className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>Pasar a Gestación</span>
                      </button>
                    )}

                    {m.estado === 'PENDIENTE' && (
                      <button
                        type="button"
                        onClick={() => updateMonta(m.id, { estado: 'FALLIDA_VACIA' })}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200 transition-colors cursor-pointer"
                      >
                        Hembra Vacía
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
                      title="Editar servicio reproductivo"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMonta(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-slate-50"
                      title="Eliminar registro de monta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
      </div>

      {/* New / Edit Mating Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl text-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMonta ? 'Editar Monta Registrada' : 'Registrar Nueva Monta'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingMonta ? 'Modificar datos del servicio reproductivo en Firestore' : 'Servicio reproductivo planificado o realizado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonta} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
              {/* Hembra Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hembra (Madre) *
                </label>
                <select
                  value={hembraId}
                  onChange={(e) => setHembraId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  {hembras.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nombreCompleto} {h.numeroPOA ? `(POA: ${h.numeroPOA})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Macho (Padrillo) Selection / External Form */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="block font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Macho (Padrillo) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMachoExterno(!isMachoExterno)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {isMachoExterno
                        ? '← Seleccionar macho del plantel'
                        : '+ Cargar macho no registrado / externo'}
                    </span>
                  </button>
                </div>

                {!isMachoExterno ? (
                  <div>
                    <select
                      value={machoId}
                      onChange={(e) => {
                        if (e.target.value === '__EXTERNO__') {
                          setIsMachoExterno(true);
                        } else {
                          setMachoId(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {machos.length === 0 && (
                        <option value="">No hay machos registrados en el criadero</option>
                      )}
                      {machos.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombreCompleto} {m.numeroPOA ? `(POA: ${m.numeroPOA})` : ''}
                        </option>
                      ))}
                      <option value="__EXTERNO__" className="text-blue-600 font-bold">
                        + Cargar macho no registrado / externo...
                      </option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-1 border-t border-slate-200">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-900 font-medium leading-relaxed">
                      Macho no registrado en el plantel (servicio externo / reproductor invitado). Sus datos se guardarán automáticamente en Firestore como ejemplar externo y se asociarán a esta monta.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-0.5">
                          Nombre completo del macho *
                        </label>
                        <input
                          type="text"
                          value={machoNombreManual}
                          onChange={(e) => setMachoNombreManual(e.target.value)}
                          placeholder="ej: VA1 Gary vom Hühnegrab"
                          required={isMachoExterno}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-0.5">
                          Fecha de nacimiento
                        </label>
                        <input
                          type="date"
                          value={machoFechaNacimiento}
                          onChange={(e) => setMachoFechaNacimiento(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-0.5">
                          Número POA
                        </label>
                        <input
                          type="text"
                          value={machoNumeroPOA}
                          onChange={(e) => setMachoNumeroPOA(e.target.value)}
                          placeholder="ej: POA-245100"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-0.5">
                          Tatuaje POA
                        </label>
                        <input
                          type="text"
                          value={machoTatuaje}
                          onChange={(e) => setMachoTatuaje(e.target.value)}
                          placeholder="ej: TAT-982"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-0.5">
                          Microchip
                        </label>
                        <input
                          type="text"
                          value={machoMicrochip}
                          onChange={(e) => setMachoMicrochip(e.target.value)}
                          placeholder="90008500..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-0.5">
                          Tipo de pelo
                        </label>
                        <select
                          value={machoPelo}
                          onChange={(e) => setMachoPelo(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none cursor-pointer"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Monta *</label>
                  <input
                    type="date"
                    value={fechaMonta}
                    onChange={(e) => setFechaMonta(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código de Ciclo</label>
                  <input
                    type="text"
                    value={codigoCiclo}
                    onChange={(e) => setCodigoCiclo(e.target.value)}
                    placeholder="CICLO-2026-01"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Servicio</label>
                  <select
                    value={tipoServicio}
                    onChange={(e) => setTipoServicio(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    <option value="NATURAL">Monta Natural Asistida</option>
                    <option value="INSEMINACION_FRESCA">Inseminación Artificial Fresca</option>
                    <option value="INSEMINACION_CONGELADA">Inseminación Congelada</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500 cursor-pointer"
                  >
                    <option value="PENDIENTE">PENDIENTE DE ECOGRAFÍA</option>
                    <option value="CONFIRMADA_PREÑADA">CONFIRMADA PREÑADA</option>
                    <option value="FALLIDA_VACIA">FALLIDA / VACÍA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones / Duración</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="ej: Abrochamiento 22 minutos. Valores de progesterona 6.5 ng/ml previo."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingMonta ? 'Guardar Cambios' : 'Guardar Monta'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
