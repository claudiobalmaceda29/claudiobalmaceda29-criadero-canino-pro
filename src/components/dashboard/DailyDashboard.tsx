import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TareaDiaria, TipoTareaDiaria, EstadoTareaDiaria } from '../../types';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Syringe,
  Baby,
  Pill,
  FolderKanban,
  Heart,
  Dog,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  ListFilter,
  Layers,
  X,
  Activity,
} from 'lucide-react';

export const DailyDashboard: React.FC = () => {
  const {
    currentCriaderoId,
    currentUser,
    ejemplares,
    camadas,
    cachorros,
    gestaciones,
    registrosSanitarios,
    insumos,
    firebaseUser,
  } = useApp();

  // Vista Kanban o Lista Checklist
  const [viewMode, setViewMode] = useState<'CHECKLIST' | 'KANBAN'>('CHECKLIST');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Formulario de nueva tarea manual
  const [newTitulo, setNewTitulo] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTipo, setNewTipo] = useState<TipoTareaDiaria>('OTRO');
  const [newPrioridad, setNewPrioridad] = useState<'ALTA' | 'MEDIA' | 'BAJA'>('MEDIA');
  const [newFecha, setNewFecha] = useState(() => new Date().toISOString().split('T')[0]);

  // Tareas manuales guardadas en LocalStorage / Firestore
  const [customTasks, setCustomTasks] = useState<TareaDiaria[]>(() => {
    try {
      const stored = localStorage.getItem(`daily_tasks_${currentCriaderoId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Guardar tareas manuales
  const persistCustomTasks = (updated: TareaDiaria[]) => {
    setCustomTasks(updated);
    try {
      localStorage.setItem(`daily_tasks_${currentCriaderoId}`, JSON.stringify(updated));
    } catch {}
  };

  // IDs de tareas dinámicas completadas (para persistir el checkbox de eventos automáticos)
  const [completedDynamicTaskIds, setCompletedDynamicTaskIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`completed_tasks_${currentCriaderoId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const toggleDynamicTask = (taskId: string) => {
    setCompletedDynamicTaskIds((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      try {
        localStorage.setItem(`completed_tasks_${currentCriaderoId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleTask = (task: TareaDiaria) => {
    if (task.id.startsWith('dyn-')) {
      toggleDynamicTask(task.id);
    } else {
      const updated = customTasks.map((t) => {
        if (t.id === task.id) {
          const isDone = t.estado === 'COMPLETADA';
          return {
            ...t,
            estado: (isDone ? 'PENDIENTE' : 'COMPLETADA') as EstadoTareaDiaria,
            completadaEn: isDone ? undefined : new Date().toISOString(),
          };
        }
        return t;
      });
      persistCustomTasks(updated);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitulo.trim()) return;

    const newTask: TareaDiaria = {
      id: `task-${Date.now()}`,
      criaderoId: currentCriaderoId,
      propietarioId: currentUser?.id || firebaseUser?.uid,
      tipo: newTipo,
      titulo: newTitulo.trim(),
      descripcion: newDesc.trim(),
      fechaProgramada: newFecha,
      estado: 'PENDIENTE',
      prioridad: newPrioridad,
      createdAt: new Date().toISOString(),
    };

    persistCustomTasks([newTask, ...customTasks]);
    setNewTitulo('');
    setNewDesc('');
    setIsNewTaskModalOpen(false);
  };

  // Generador de tareas dinámicas del criadero basado en eventos programados reales
  const dynamicTasks = useMemo<TareaDiaria[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tasks: TareaDiaria[] = [];

    // 1. Controles y Vacunaciones Sanitarias programadas
    registrosSanitarios.forEach((reg) => {
      if (reg.proximaFecha) {
        const ejemplar = ejemplares.find((e) => e.id === reg.ejemplarId);
        const fechaProx = new Date(reg.proximaFecha);
        const diffDays = Math.ceil((fechaProx.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7 && diffDays >= -14) {
          const id = `dyn-sanit-${reg.id}-${reg.proximaFecha}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: reg.tipo === 'VACUNA' ? 'VACUNA' : 'DESPARASITACION',
            titulo: `${reg.tipo === 'VACUNA' ? 'Vacunación' : 'Control'}: ${reg.nombre}`,
            descripcion: `Ejemplar: ${ejemplar?.nombreCompleto || 'Sin nombre'} (${reg.proximaFecha})`,
            fechaProgramada: reg.proximaFecha,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: diffDays <= 0 ? 'ALTA' : 'MEDIA',
            entidadRelacionadaTipo: 'EJEMPLAR',
            entidadRelacionadaId: reg.ejemplarId,
            entidadRelacionadaNombre: ejemplar?.nombreCompleto,
            createdAt: todayStr,
          });
        }
      }
    });

    // 2. Hitos de Gestaciones en Curso
    gestaciones
      .filter((g) => g.estado === 'EN_CURSO')
      .forEach((g) => {
        const fechaMonta = new Date(g.fechaMonta);
        const diasGestacion = Math.max(1, Math.floor((today.getTime() - fechaMonta.getTime()) / (1000 * 60 * 60 * 24)));

        // Hito Ecografía (Día 25 al 32)
        if (diasGestacion >= 25 && diasGestacion <= 32) {
          const id = `dyn-gest-eco-${g.id}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: 'ECOGRAFIA',
            titulo: `Ecografía de confirmación (Día ${diasGestacion}/63)`,
            descripcion: `Realizar ecografía obstétrica a ${g.hembraNombre} para confirmar viabilidad y conteo embrionario.`,
            fechaProgramada: todayStr,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: 'ALTA',
            entidadRelacionadaTipo: 'GESTACION',
            entidadRelacionadaId: g.id,
            entidadRelacionadaNombre: g.hembraNombre,
            createdAt: todayStr,
          });
        }

        // Hito Radiografía / Paridera (Día 50 al 58)
        if (diasGestacion >= 50 && diasGestacion <= 58) {
          const id = `dyn-gest-paridera-${g.id}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: 'PARTO',
            titulo: `Preparación de Paridera & Placa RX (${g.hembraNombre})`,
            descripcion: `Desinfectar canil de maternidad, verificar lámpara infrarroja y realizar placa RX para conteo óseo de crías.`,
            fechaProgramada: todayStr,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: 'ALTA',
            entidadRelacionadaTipo: 'GESTACION',
            entidadRelacionadaId: g.id,
            entidadRelacionadaNombre: g.hembraNombre,
            createdAt: todayStr,
          });
        }

        // Hito Parto Inminente (Día 59 a 64)
        if (diasGestacion >= 59) {
          const id = `dyn-gest-parto-${g.id}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: 'PARTO',
            titulo: `Monitoreo Térmico y Asistencia de Parto (${g.hembraNombre})`,
            descripcion: `Tomar temperatura rectal cada 8 horas (caída a <37.2°C anticipa parto en 24h). Alistar kit neonatal.`,
            fechaProgramada: g.fechaEstimadaParto || todayStr,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: 'ALTA',
            entidadRelacionadaTipo: 'GESTACION',
            entidadRelacionadaId: g.id,
            entidadRelacionadaNombre: g.hembraNombre,
            createdAt: todayStr,
          });
        }
      });

    // 3. Hitos de Camadas (Lactancia, Destete, Vacunas)
    camadas
      .filter((c) => c.estado !== 'FINALIZADA' && c.estado !== 'CANCELADA' && c.fechaNacimiento)
      .forEach((c) => {
        const fNac = new Date(c.fechaNacimiento!);
        const diasVida = Math.max(0, Math.floor((today.getTime() - fNac.getTime()) / (1000 * 60 * 60 * 24)));

        // Día 14 al 18: Primera desparasitación neonatal
        if (diasVida >= 13 && diasVida <= 19) {
          const id = `dyn-cam-desp1-${c.id}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: 'DESPARASITACION',
            titulo: `1ª Desparasitación de Camada (${c.identificador})`,
            descripcion: `Suministrar antiparasitario suspensión neonatal (Pyrantel) a los ${c.totalCachorros} cachorros y a la madre.`,
            fechaProgramada: todayStr,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: 'ALTA',
            entidadRelacionadaTipo: 'CAMADA',
            entidadRelacionadaId: c.id,
            entidadRelacionadaNombre: c.identificador,
            createdAt: todayStr,
          });
        }

        // Día 42 al 48: 1ª Vacuna Puppy DP
        if (diasVida >= 42 && diasVida <= 48) {
          const id = `dyn-cam-vac1-${c.id}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: 'VACUNA',
            titulo: `1ª Vacuna Puppy DP (Día 45) - ${c.identificador}`,
            descripcion: `Aplicación de vacuna Parvovirus + Moquillo a los cachorros y entrega de libretas sanitarias.`,
            fechaProgramada: todayStr,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: 'ALTA',
            entidadRelacionadaTipo: 'CAMADA',
            entidadRelacionadaId: c.id,
            entidadRelacionadaNombre: c.identificador,
            createdAt: todayStr,
          });
        }

        // Día 58 al 65: Tatuaje y Microchip oficial POA
        if (diasVida >= 58 && diasVida <= 65) {
          const id = `dyn-cam-poa-${c.id}`;
          tasks.push({
            id,
            criaderoId: currentCriaderoId,
            tipo: 'POA_TRAMITE',
            titulo: `Tatuaje y Colocación de Chip POA (${c.identificador})`,
            descripcion: `Coordinar con tatuador oficial POA e ingresar número de microchip en el libro de cría digital.`,
            fechaProgramada: todayStr,
            estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
            prioridad: 'ALTA',
            entidadRelacionadaTipo: 'CAMADA',
            entidadRelacionadaId: c.id,
            entidadRelacionadaNombre: c.identificador,
            createdAt: todayStr,
          });
        }
      });

    // 4. Alerta de Stock de Alimento bajo
    const alimentoBajo = insumos.filter((i) => i.categoria === 'ALIMENTO' && i.cantidadActual <= i.stockMinimo);
    alimentoBajo.forEach((ins) => {
      const id = `dyn-stock-${ins.id}`;
      tasks.push({
        id,
        criaderoId: currentCriaderoId,
        tipo: 'ALIMENTACION',
        titulo: `Stock Crítico: ${ins.nombre}`,
        descripcion: `Quedan ${ins.cantidadActual} ${ins.unidadMedida} (Mínimo: ${ins.stockMinimo}). Reabastecer bolsa de alimento.`,
        fechaProgramada: todayStr,
        estado: completedDynamicTaskIds.includes(id) ? 'COMPLETADA' : 'PENDIENTE',
        prioridad: 'ALTA',
        entidadRelacionadaTipo: 'INSUMO',
        entidadRelacionadaId: ins.id,
        entidadRelacionadaNombre: ins.nombre,
        createdAt: todayStr,
      });
    });

    return tasks;
  }, [registrosSanitarios, gestaciones, camadas, ejemplares, insumos, completedDynamicTaskIds, currentCriaderoId]);

  // Consolidar todas las tareas (dinámicas + manuales)
  const allTasks = useMemo(() => {
    const combined = [...dynamicTasks, ...customTasks];
    if (selectedCategory === 'TODAS') return combined;
    return combined.filter((t) => t.tipo === selectedCategory);
  }, [dynamicTasks, customTasks, selectedCategory]);

  const pendientes = allTasks.filter((t) => t.estado === 'PENDIENTE');
  const enCurso = allTasks.filter((t) => t.estado === 'EN_CURSO');
  const completadas = allTasks.filter((t) => t.estado === 'COMPLETADA');

  const getTipoIcon = (tipo: TipoTareaDiaria) => {
    switch (tipo) {
      case 'VACUNA':
        return <Syringe className="w-4 h-4 text-emerald-500" />;
      case 'DESPARASITACION':
        return <Pill className="w-4 h-4 text-teal-500" />;
      case 'ECOGRAFIA':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'PARTO':
        return <Baby className="w-4 h-4 text-amber-500" />;
      case 'CELO':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'ALIMENTACION':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'POA_TRAMITE':
        return <FolderKanban className="w-4 h-4 text-indigo-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPrioridadBadge = (p: 'ALTA' | 'MEDIA' | 'BAJA') => {
    switch (p) {
      case 'ALTA':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900';
      case 'MEDIA':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'BAJA':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Pizarra de Tareas Diarias & Checklist
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Eventos programados, sanidad, partos y compromisos automáticos del criadero
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('CHECKLIST')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'CHECKLIST'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Lista Checklist
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'KANBAN'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kanban
            </button>
          </div>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
              Pendientes Hoy
            </span>
            <div className="text-lg font-black text-amber-900 dark:text-amber-200">
              {pendientes.length}
            </div>
          </div>
          <Clock className="w-5 h-5 text-amber-500/60" />
        </div>

        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
              En Progreso
            </span>
            <div className="text-lg font-black text-blue-900 dark:text-blue-200">
              {enCurso.length}
            </div>
          </div>
          <Layers className="w-5 h-5 text-blue-500/60" />
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Completadas
            </span>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-200">
              {completadas.length}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['TODAS', 'VACUNA', 'DESPARASITACION', 'ECOGRAFIA', 'PARTO', 'CELO', 'ALIMENTACION', 'POA_TRAMITE'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            {cat === 'TODAS' ? 'Todas las Tareas' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main View: CHECKLIST or KANBAN */}
      {viewMode === 'CHECKLIST' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs overflow-hidden">
          {allTasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                ¡Todo al día en el Criadero!
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No hay tareas pendientes en este momento. Las alertas automáticas aparecerán según los ciclos reproductivos y el plan sanitario.
              </p>
            </div>
          ) : (
            allTasks.map((task) => {
              const isCompleted = task.estado === 'COMPLETADA';
              return (
                <div
                  key={task.id}
                  className={`p-3.5 sm:p-4 flex items-start gap-3.5 transition-colors ${
                    isCompleted
                      ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-60'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                    title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shrink-0">{getTipoIcon(task.tipo)}</span>
                      <h4
                        className={`text-xs sm:text-sm font-bold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.titulo}
                      </h4>
                      <span
                        className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full border ${getPrioridadBadge(
                          task.prioridad
                        )}`}
                      >
                        {task.prioridad}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {task.descripcion}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10.5px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {task.fechaProgramada}
                      </span>
                      {task.entidadRelacionadaNombre && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                          {task.entidadRelacionadaNombre}
                        </span>
                      )}
                      {task.id.startsWith('dyn-') && (
                        <span className="text-blue-500 font-bold text-[10px]">
                          ⚡ Evento Automático
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* KANBAN COLUMNS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Col 1: PENDIENTES */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Pendientes Hoy</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 font-mono text-[10px]">
                {pendientes.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {pendientes.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Sin tareas pendientes</div>
              ) : (
                pendientes.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        {getTipoIcon(task.tipo)}
                        <span className="truncate">{task.titulo}</span>
                      </div>
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-slate-400 hover:text-emerald-500 cursor-pointer"
                        title="Completar"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {task.descripcion}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      <span>{task.fechaProgramada}</span>
                      <span className={`px-1.5 py-0.5 rounded-full border ${getPrioridadBadge(task.prioridad)}`}>
                        {task.prioridad}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 2: EN CURSO */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-blue-700 dark:text-blue-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>En Progreso</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 font-mono text-[10px]">
                {enCurso.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {enCurso.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Sin tareas en progreso</div>
              ) : (
                enCurso.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        {getTipoIcon(task.tipo)}
                        <span className="truncate">{task.titulo}</span>
                      </div>
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-slate-400 hover:text-emerald-500 cursor-pointer"
                        title="Completar"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {task.descripcion}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Col 3: COMPLETADAS */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completadas</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 font-mono text-[10px]">
                {completadas.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {completadas.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No hay tareas completadas aún</div>
              ) : (
                completadas.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 opacity-70 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs line-through text-slate-500">
                        {getTipoIcon(task.tipo)}
                        <span className="truncate">{task.titulo}</span>
                      </div>
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="text-emerald-600 dark:text-emerald-400 cursor-pointer"
                        title="Reabrir"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Tarea Manual */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                <span>Agregar Tarea al Tablero</span>
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Aplicar pipeta antiparasitaria a camada B"
                  value={newTitulo}
                  onChange={(e) => setNewTitulo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="VACUNA">Vacuna</option>
                    <option value="DESPARASITACION">Desparasitación</option>
                    <option value="ECOGRAFIA">Ecografía</option>
                    <option value="PARTO">Parto / Maternidad</option>
                    <option value="CELO">Celo / Progesterona</option>
                    <option value="ALIMENTACION">Alimentación / Stock</option>
                    <option value="POA_TRAMITE">Trámite POA</option>
                    <option value="POST_VENTA">Post-Venta / Seguimiento</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPrioridad}
                    onChange={(e) => setNewPrioridad(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="ALTA">Alta</option>
                    <option value="MEDIA">Media</option>
                    <option value="BAJA">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fecha Programada
                </label>
                <input
                  type="date"
                  value={newFecha}
                  onChange={(e) => setNewFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción / Instrucciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles específicos para el canilero o veterinario..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
