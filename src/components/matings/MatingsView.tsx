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
} from 'lucide-react';

export const MatingsView: React.FC = () => {
  const { montas, ejemplares, addMonta, deleteMonta, updateMonta, currentCriaderoId, exportToCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  const selectedHembra = hembras.find((h) => h.id === hembraId) || hembras[0];
  const selectedMacho = machos.find((m) => m.id === machoId) || machos[0];

  const handleSaveMonta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHembra || !selectedMacho) return;

    // Estimated whelping date = 63 days after service
    const serviceDate = new Date(fechaMonta);
    const estimatedWhelping = new Date(serviceDate.getTime() + 63 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    addMonta({
      criaderoId: currentCriaderoId,
      codigoCiclo,
      hembraId: selectedHembra.id,
      hembraNombre: selectedHembra.nombreCompleto,
      machoId: selectedMacho.id,
      machoNombre: selectedMacho.nombreCompleto,
      fechaMonta,
      tipoServicio,
      duracion,
      estado,
      fechaEstimadaParto: estimatedWhelping,
      observaciones,
    });

    setIsFormOpen(false);
    setObservaciones('');
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
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Monta</span>
          </button>
        </div>
      </div>

      {/* Grid of Matings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {montas.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">
                    {m.codigoCiclo}
                  </span>
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
                  <strong className="text-slate-800 font-mono">{m.fechaMonta}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Parto Estimado (63d):</span>
                  <strong className="text-amber-800 font-mono font-bold">{m.fechaEstimadaParto}</strong>
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

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              {m.estado === 'PENDIENTE' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateMonta(m.id, { estado: 'CONFIRMADA_PREÑADA' })}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Confirmar Preñez
                  </button>
                  <button
                    onClick={() => updateMonta(m.id, { estado: 'FALLIDA_VACIA' })}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 text-[11px] transition-colors cursor-pointer"
                  >
                    Hembra Vacía
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">
                  {m.camadaId ? 'Camada asociada creada' : 'Gestación vinculada'}
                </span>
              )}

              <button
                onClick={() => deleteMonta(m.id)}
                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Eliminar registro de monta"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Mating Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl text-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-100 text-pink-700">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Nueva Monta</h3>
                  <p className="text-xs text-slate-500">Servicio reproductivo planificado o realizado</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMonta} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hembra *</label>
                  <select
                    value={hembraId}
                    onChange={(e) => setHembraId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500"
                  >
                    {hembras.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Macho (Padrillo) *</label>
                  <select
                    value={machoId}
                    onChange={(e) => setMachoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500"
                  >
                    {machos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Monta *</label>
                  <input
                    type="date"
                    value={fechaMonta}
                    onChange={(e) => setFechaMonta(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código de Ciclo</label>
                  <input
                    type="text"
                    value={codigoCiclo}
                    onChange={(e) => setCodigoCiclo(e.target.value)}
                    placeholder="CICLO-2026-01"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Servicio</label>
                  <select
                    value={tipoServicio}
                    onChange={(e) => setTipoServicio(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500"
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
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500"
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
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500"
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
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Guardar Monta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
