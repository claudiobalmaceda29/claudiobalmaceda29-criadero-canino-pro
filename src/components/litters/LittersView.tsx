import React, { useState } from 'react';
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
} from 'lucide-react';

export const LittersView: React.FC = () => {
  const {
    camadas,
    cachorros,
    ejemplares,
    addCamada,
    updateCamada,
    deleteCamada,
    currentCriaderoId,
    setActiveTab,
    exportToCSV,
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCamada, setEditingCamada] = useState<Camada | null>(null);

  const machos = ejemplares.filter((e) => e.sexo === 'MACHO');
  const hembras = ejemplares.filter((e) => e.sexo === 'HEMBRA');

  // Form states
  const [identificador, setIdentificador] = useState('');
  const [padreId, setPadreId] = useState(machos[0]?.id || '');
  const [madreId, setMadreId] = useState(hembras[0]?.id || '');
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

  const selectedPadre = machos.find((m) => m.id === padreId) || machos[0];
  const selectedMadre = hembras.find((h) => h.id === madreId) || hembras[0];

  const handleOpenCreate = () => {
    setEditingCamada(null);
    setIdentificador(`Camada "${String.fromCharCode(65 + camadas.length)}" 2026`);
    setIsFormOpen(true);
  };

  const handleSaveCamada = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !selectedPadre || !selectedMadre) return;

    const data: Omit<Camada, 'id' | 'createdAt'> = {
      criaderoId: currentCriaderoId,
      identificador,
      padreId: selectedPadre.id,
      padreNombre: selectedPadre.nombreCompleto,
      madreId: selectedMadre.id,
      madreNombre: selectedMadre.nombreCompleto,
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
        {camadas.map((camada) => {
          const pupsInLitter = cachorros.filter((c) => c.camadaId === camada.id);
          return (
            <div
              key={camada.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={
                      camada.fotoUrl ||
                      'https://images.unsplash.com/photo-1591160690555-5debfba289f0?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={camada.identificador}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

                  <div className="absolute top-3 right-3">
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
                      Nacimiento: {camada.fechaNacimiento} • Parto {camada.tipoParto}
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="p-5 space-y-4 text-xs">
                  {/* Parents Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                      <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block tracking-wider">
                        Padre Reproductor
                      </span>
                      <strong className="text-slate-900 dark:text-white truncate block mt-0.5 font-bold">
                        {camada.padreNombre}
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-pink-50/70 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/50">
                      <span className="text-[10px] uppercase font-bold text-pink-700 dark:text-pink-300 block tracking-wider">
                        Madre Reproductora
                      </span>
                      <strong className="text-slate-900 dark:text-white truncate block mt-0.5 font-bold">
                        {camada.madreNombre}
                      </strong>
                    </div>
                  </div>

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

                  {/* Puppies in litter preview chips */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                      <span>Cachorros con Ficha Registrada ({pupsInLitter.length})</span>
                      <button
                        onClick={() => setActiveTab('cachorros')}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver todos</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {pupsInLitter.map((p) => (
                        <span
                          key={p.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.colorCollar || '#3b82f6' }}
                          />
                          <span>{p.nombre || p.identificadorProvisorio}</span>
                        </span>
                      ))}
                    </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Padre (Macho)</label>
                  <select
                    value={padreId}
                    onChange={(e) => setPadreId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                  >
                    {machos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Madre (Hembra)</label>
                  <select
                    value={madreId}
                    onChange={(e) => setMadreId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                  >
                    {hembras.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>
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
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">URL Foto de Camada</label>
                <input
                  type="text"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
                />
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
    </div>
  );
};
