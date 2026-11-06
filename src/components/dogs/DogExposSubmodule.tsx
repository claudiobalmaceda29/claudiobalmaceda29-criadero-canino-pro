import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar, ExposicionPOA } from '../../types';
import {
  Trophy,
  Award,
  Medal,
  Calendar,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Sparkles,
  Star,
  CheckCircle,
  X,
  FileText,
} from 'lucide-react';

interface DogExposSubmoduleProps {
  ejemplar?: Ejemplar;
  dog?: Ejemplar;
}

export const DogExposSubmodule: React.FC<DogExposSubmoduleProps> = ({ ejemplar: propEjemplar, dog }) => {
  const ejemplar = (propEjemplar || dog)!;
  const {
    exposiciones,
    addExposicion,
    updateExposicion,
    deleteExposicion,
    currentCriaderoId,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpo, setEditingExpo] = useState<ExposicionPOA | null>(null);

  // Form states
  const [nombreEvento, setNombreEvento] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [lugar, setLugar] = useState('Buenos Aires');
  const [organizador, setOrganizador] = useState('Club POA');
  const [categoria, setCategoria] = useState('1ª Categoría (Más de 24 meses)');
  const [clase, setClase] = useState('Adultos Seleccionados');
  const [juez, setJuez] = useState('');
  const [calificacion, setCalificacion] = useState('VA');
  const [puesto, setPuesto] = useState('1º Puesto (VA1)');
  const [titulosObtenidos, setTitulosObtenidos] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');

  // Filtrar exposiciones de este ejemplar
  const dogExpos = useMemo(() => {
    return exposiciones
      .filter((e) => e.ejemplarId === ejemplar.id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [exposiciones, ejemplar.id]);

  // Análisis estadístico de jueces y resultados
  const stats = useMemo(() => {
    const total = dogExpos.length;
    if (total === 0) return null;

    let podiosCount = 0;
    const juezStats: Record<string, { total: number; mejoresPuestos: string[] }> = {};

    dogExpos.forEach((exp) => {
      const p = (exp.puesto || '').toLowerCase();
      const c = (exp.calificacion || '').toUpperCase();
      if (
        p.includes('1') ||
        p.includes('2') ||
        p.includes('3') ||
        c.includes('VA') ||
        c.includes('V1') ||
        c.includes('SG1')
      ) {
        podiosCount++;
      }

      const juezNorm = exp.juez?.trim() || 'Sin Juez Registrado';
      if (!juezStats[juezNorm]) {
        juezStats[juezNorm] = { total: 0, mejoresPuestos: [] };
      }
      juezStats[juezNorm].total += 1;
      juezStats[juezNorm].mejoresPuestos.push(`${exp.calificacion} (${exp.puesto})`);
    });

    const pctPodios = Math.round((podiosCount / total) * 100);

    // Encontrar juez con mejores resultados
    let mejorJuez = '';
    let mejorJuezPuesto = '';
    let mejorScore = -1;

    dogExpos.forEach((exp) => {
      let score = 0;
      if (exp.calificacion.includes('VA')) score = 100;
      else if (exp.calificacion.includes('V')) score = 80;
      else if (exp.calificacion.includes('SG')) score = 60;
      else score = 40;

      if (score > mejorScore && exp.juez) {
        mejorScore = score;
        mejorJuez = exp.juez;
        mejorJuezPuesto = `${exp.calificacion} - ${exp.puesto} en ${exp.nombreEvento}`;
      }
    });

    return {
      total,
      podiosCount,
      pctPodios,
      mejorJuez,
      mejorJuezPuesto,
      juecesCount: Object.keys(juezStats).length,
    };
  }, [dogExpos]);

  const handleOpenForm = (expo?: ExposicionPOA) => {
    if (expo) {
      setEditingExpo(expo);
      setNombreEvento(expo.nombreEvento);
      setFecha(expo.fecha);
      setLugar(expo.lugar);
      setOrganizador(expo.organizador);
      setCategoria(expo.categoria);
      setClase(expo.clase);
      setJuez(expo.juez);
      setCalificacion(expo.calificacion);
      setPuesto(expo.puesto);
      setTitulosObtenidos((expo.titulosObtenidos || []).join(', '));
      setObservaciones(expo.observaciones || '');
    } else {
      setEditingExpo(null);
      setNombreEvento('');
      setFecha(new Date().toISOString().split('T')[0]);
      setLugar('Buenos Aires');
      setOrganizador('Club POA');
      setCategoria('1ª Categoría');
      setClase('Adultos');
      setJuez('');
      setCalificacion('VA');
      setPuesto('1º Puesto');
      setTitulosObtenidos('');
      setObservaciones('');
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEvento.trim() || !juez.trim()) return;

    const titulosList = titulosObtenidos
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingExpo) {
      updateExposicion(editingExpo.id, {
        nombreEvento: nombreEvento.trim(),
        fecha,
        lugar: lugar.trim(),
        organizador: organizador.trim(),
        categoria: categoria.trim(),
        clase: clase.trim(),
        juez: juez.trim(),
        calificacion: calificacion.trim(),
        puesto: puesto.trim(),
        titulosObtenidos: titulosList,
        observaciones: observaciones.trim(),
      });
    } else {
      addExposicion({
        criaderoId: currentCriaderoId,
        ejemplarId: ejemplar.id,
        ejemplarNombre: ejemplar.nombreCompleto,
        nombreEvento: nombreEvento.trim(),
        fecha,
        lugar: lugar.trim(),
        organizador: organizador.trim(),
        categoria: categoria.trim(),
        clase: clase.trim(),
        juez: juez.trim(),
        calificacion: calificacion.trim(),
        puesto: puesto.trim(),
        titulosObtenidos: titulosList,
        observaciones: observaciones.trim(),
      });
    }

    setIsFormOpen(false);
  };

  const getCalificacionBadge = (calif: string) => {
    const c = calif.toUpperCase();
    if (c.includes('VA')) {
      return 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border-amber-500/40 font-black';
    }
    if (c.includes('V')) {
      return 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40 font-bold';
    }
    if (c.includes('SG')) {
      return 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40 font-bold';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Historial de Pistas y Jueces POA</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Registro oficial de torneos, calificaciones morfológicas y veredictos de jueces
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenForm()}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cargar Resultado</span>
        </button>
      </div>

      {/* Statistical Analysis Box */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                Podios / VA Logrados
              </span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-black text-amber-950 dark:text-amber-100">
              {stats.podiosCount} <span className="text-xs font-normal text-slate-500">de {stats.total} torneos</span>
            </div>
            <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {stats.pctPodios}% de efectividad en pista
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200/70 dark:border-purple-900/40 text-xs col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Mejor Veredicto Histórico</span>
              </span>
              <Star className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-sm font-black text-purple-950 dark:text-purple-100 truncate">
              Juez: {stats.mejorJuez || 'N/A'}
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 truncate">
              {stats.mejorJuezPuesto || 'Registros cargados'}
            </div>
          </div>
        </div>
      )}

      {/* Shows List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs overflow-hidden">
        {dogExpos.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Sin exposiciones registradas aún
            </h5>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hacé clic en &quot;Cargar Resultado&quot; para ingresar los juzgamientos oficiales POA.
            </p>
          </div>
        ) : (
          dogExpos.map((expo) => (
            <div
              key={expo.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${getCalificacionBadge(expo.calificacion)}`}>
                    {expo.calificacion} • {expo.puesto}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {expo.nombreEvento}
                  </h5>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {expo.fecha}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-blue-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Juez: {expo.juez}</span>
                  </span>
                  <span>• {expo.categoria} ({expo.lugar})</span>
                </div>

                {expo.observaciones && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic pt-1 line-clamp-2">
                    &quot;{expo.observaciones}&quot;
                  </p>
                )}

                {expo.titulosObtenidos && expo.titulosObtenidos.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {expo.titulosObtenidos.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
                      >
                        🏆 {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenForm(expo)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteExposicion(expo.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal CRUD Resultado */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{editingExpo ? 'Editar Resultado de Exposición' : 'Registrar Resultado en Pista'}</span>
              </h4>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Evento / Torneo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Torneo Sieger Argentina 2026"
                  value={nombreEvento}
                  onChange={(e) => setNombreEvento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Juez Actuante *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Herr Lothar Quoll"
                    value={juez}
                    onChange={(e) => setJuez(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Calificación
                  </label>
                  <select
                    value={calificacion}
                    onChange={(e) => setCalificacion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none"
                  >
                    <option value="VA">VA (Excelente Seleccionado / Sieger)</option>
                    <option value="V">V (Excelente)</option>
                    <option value="SG">SG (Muy Bueno)</option>
                    <option value="G">G (Bueno)</option>
                    <option value="PROMESA">Promesa Destacada (Cachorros)</option>
                    <option value="MUY_BUENO">Muy Bueno</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Puesto / Posición
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 1º Puesto, VA1, 2º Puesto"
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 1ª Categoría Adultos"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Sede
                  </label>
                  <input
                    type="text"
                    placeholder="ej. CABA / Pilar"
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Títulos o Trofeos Obtenidos (separados por coma)
                </label>
                <input
                  type="text"
                  placeholder="ej. Mejor de Raza, Mejor Grupo de Progenie, Campeón de Pista"
                  value={titulosObtenidos}
                  onChange={(e) => setTitulosObtenidos(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones / Comentarios del Juez en la Pista
                </label>
                <textarea
                  rows={3}
                  placeholder="Descripción morfológica: cruz alta, grupa de excelente posición, fuerte mordida en tijera, trote amplio y armónico..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
                >
                  {editingExpo ? 'Guardar Cambios' : 'Registrar en Ficha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
