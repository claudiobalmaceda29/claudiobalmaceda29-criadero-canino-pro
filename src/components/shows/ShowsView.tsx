import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExposicionPOA } from '../../types';
import {
  Trophy,
  Plus,
  Search,
  Award,
  Calendar,
  MapPin,
  User,
  Trash2,
  Edit,
  Save,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const ShowsView: React.FC = () => {
  const { exposiciones, ejemplares, addExposicion, deleteExposicion, currentCriaderoId, exportToCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [ejemplarId, setEjemplarId] = useState(ejemplares[0]?.id || '');
  const [nombreEvento, setNombreEvento] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [lugar, setLugar] = useState('Predio Central POA, Escobar, Buenos Aires');
  const [organizador, setOrganizador] = useState('Club Argentino de Criadores del Perro Ovejero Alemán (POA)');
  const [categoria, setCategoria] = useState('1ra Categoría Seleccionados');
  const [clase, setClase] = useState('Machos Seleccionados');
  const [juez, setJuez] = useState('');
  const [calificacion, setCalificacion] = useState('Excelente 1° (V1)');
  const [puesto, setPuesto] = useState('1° Puesto - Vencedor de Categoría');
  const [titulosRaw, setTitulosRaw] = useState('');
  const [premios, setPremios] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const selectedDog = ejemplares.find((e) => e.id === ejemplarId);

  const filteredShows = exposiciones.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.nombreEvento.toLowerCase().includes(q) ||
      s.ejemplarNombre.toLowerCase().includes(q) ||
      s.juez.toLowerCase().includes(q) ||
      s.puesto.toLowerCase().includes(q)
    );
  });

  const handleSaveShow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreEvento || !selectedDog) return;

    const titulosObtenidos = titulosRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addExposicion({
      criaderoId: currentCriaderoId,
      ejemplarId: selectedDog.id,
      ejemplarNombre: selectedDog.nombreCompleto,
      nombreEvento,
      fecha,
      lugar,
      organizador,
      categoria,
      clase,
      juez,
      calificacion,
      puesto,
      titulosObtenidos,
      premios,
      observaciones,
    });

    setIsFormOpen(false);
    setNombreEvento('');
    setJuez('');
    setTitulosRaw('');
    setPremios('');
    setObservaciones('');
  };

  const handleExportCSV = () => {
    const rows = filteredShows.map((s) => ({
      Evento: s.nombreEvento,
      Fecha: s.fecha,
      Ejemplar: s.ejemplarNombre,
      Lugar: s.lugar,
      Organizador: s.organizador,
      Categoria: s.categoria,
      Clase: s.clase,
      Juez: s.juez,
      Calificacion: s.calificacion,
      Puesto: s.puesto,
      Titulos: (s.titulosObtenidos || []).join(' | '),
      Premios: s.premios || '',
    }));
    exportToCSV(`EXPOSICIONES_POA_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-600" />
            Torneos y Exposiciones POA
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro cronológico oficial de participaciones, juzgamientos, títulos y escarapelas ({exposiciones.length} torneos)
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
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Exposición</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3 text-xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por torneo, ejemplar, juez, puesto..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Shows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShows.map((show) => (
          <div
            key={show.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                    {show.categoria} • {show.clase}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
                    {show.nombreEvento}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  {show.puesto}
                </span>
              </div>

              {/* Dog info */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Ejemplar Competidor</span>
                  <strong className="text-slate-900 text-xs">{show.ejemplarNombre}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Calificación</span>
                  <strong className="text-blue-700 text-xs font-semibold">{show.calificacion}</strong>
                </div>
              </div>

              {/* Show specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{show.fecha}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Juez: {show.juez}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{show.lugar}</span>
                </div>
              </div>

              {/* Titles and awards */}
              {show.titulosObtenidos && show.titulosObtenidos.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {show.titulosObtenidos.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {show.observaciones && (
                <p className="text-[11px] text-slate-500 italic pt-1">
                  &quot;{show.observaciones}&quot;
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => deleteExposicion(show.id)}
                className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Eliminar registro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredShows.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs shadow-xs">
            No se encontraron torneos con el criterio de búsqueda.
          </div>
        )}
      </div>

      {/* New Show Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl text-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Exposición / Torneo POA</h3>
                  <p className="text-xs text-slate-500">Participación oficial</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShow} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ejemplar Competidor *</label>
                <select
                  value={ejemplarId}
                  onChange={(e) => setEjemplarId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                >
                  {ejemplares.map((dog) => (
                    <option key={dog.id} value={dog.id}>
                      {dog.nombreCompleto} ({dog.numeroPOA || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Evento *</label>
                <input
                  type="text"
                  value={nombreEvento}
                  onChange={(e) => setNombreEvento(e.target.value)}
                  placeholder="ej: Exposición Especializada de Estructura POA Córdoba 2026"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lugar</label>
                  <input
                    type="text"
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    placeholder="Escobar, Buenos Aires"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Juez Actuante</label>
                  <input
                    type="text"
                    value={juez}
                    onChange={(e) => setJuez(e.target.value)}
                    placeholder="Sr. Roberto Caputi"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Calificación</label>
                  <input
                    type="text"
                    value={calificacion}
                    onChange={(e) => setCalificacion(e.target.value)}
                    placeholder="Excelente 1° (V1)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Puesto / Resultado</label>
                  <input
                    type="text"
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    placeholder="1° Lugar Vencedor"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Títulos (separados por coma)</label>
                  <input
                    type="text"
                    value={titulosRaw}
                    onChange={(e) => setTitulosRaw(e.target.value)}
                    placeholder="Sieger, Mejor de Raza"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Comentarios del juez sobre mordida, línea dorsal, trote..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Guardar Exposición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
