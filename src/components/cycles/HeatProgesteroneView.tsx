import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CicloCelo, MedicionProgesterona } from '../../types';
import {
  Activity,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react';

export const HeatProgesteroneView: React.FC = () => {
  const { ciclosCelo, ejemplares, addCicloCelo, addMedicionProgesterona, currentCriaderoId } = useApp();

  const hembras = ejemplares.filter((e) => e.sexo === 'HEMBRA');
  const [selectedCicloId, setSelectedCicloId] = useState<string>(ciclosCelo[0]?.id || '');

  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [showNewProgModal, setShowNewProgModal] = useState(false);

  // New cycle form
  const [hembraId, setHembraId] = useState(hembras[0]?.id || '');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [codigoCiclo, setCodigoCiclo] = useState('CICLO-2026-');

  // New progesterone test form
  const [fechaTest, setFechaTest] = useState(new Date().toISOString().split('T')[0]);
  const [diasDesdeCelo, setDiasDesdeCelo] = useState<number>(8);
  const [valorNgMl, setValorNgMl] = useState<number>(5.5);
  const [laboratorio, setLaboratorio] = useState('Laboratorio Central San Isidro');
  const [observacionesProg, setObservacionesProg] = useState('');

  const currentCiclo = ciclosCelo.find((c) => c.id === selectedCicloId) || ciclosCelo[0];

  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    const h = hembras.find((d) => d.id === hembraId);
    if (!h) return;

    addCicloCelo({
      criaderoId: currentCriaderoId,
      hembraId: h.id,
      hembraNombre: h.nombreCompleto,
      codigoCiclo: codigoCiclo || `CICLO-${h.nombreCompleto.split(' ')[0].toUpperCase()}`,
      fechaInicio,
      estado: 'EN_CURSO',
      mediciones: [],
    });

    setShowNewCycleModal(false);
  };

  const handleAddProg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCiclo || valorNgMl <= 0) return;

    let recomendacion = 'Fase inicial proestro.';
    if (valorNgMl < 2.0) {
      recomendacion = 'Fase folicular basal (< 2.0 ng/ml). Repetir prueba en 3 a 4 días.';
    } else if (valorNgMl >= 2.0 && valorNgMl < 4.0) {
      recomendacion = 'Pico de LH (2.0 a 3.9 ng/ml). Ovulación estimada en 24 a 48 horas.';
    } else if (valorNgMl >= 4.0 && valorNgMl < 10.0) {
      recomendacion = 'Ovulación en curso o consumada (> 5.0 ng/ml). Momento óptimo para servicio en 24 a 48 hs.';
    } else {
      recomendacion = 'Fase lútea (> 10 ng/ml). Óvulos maduros fertilizables. Servicio inmediato.';
    }

    addMedicionProgesterona(currentCiclo.id, {
      fecha: fechaTest,
      diasDesdeCelo,
      valorNgMl,
      laboratorio,
      recomendacion,
      observaciones: observacionesProg,
    });

    setShowNewProgModal(false);
    setObservacionesProg('');
  };

  const maxProgValue = Math.max(
    ...(currentCiclo?.mediciones?.map((m) => m.valorNgMl) || [15]),
    15
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-pink-600" />
            Monitoreo de Celos y Curvas de Progesterona
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Seguimiento hormonal en ng/ml, detección del pico de LH, estimación de ovulación y momento óptimo de monta.
          </p>
        </div>

        <button
          onClick={() => setShowNewCycleModal(true)}
          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Iniciar Nuevo Ciclo de Celo</span>
        </button>
      </div>

      {/* Cycle Selector */}
      {ciclosCelo.length > 0 && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="font-semibold text-slate-700 shrink-0">Ciclo en seguimiento:</label>
            <select
              value={selectedCicloId}
              onChange={(e) => setSelectedCicloId(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-pink-500"
            >
              {ciclosCelo.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.hembraNombre} ({c.codigoCiclo} • {c.fechaInicio})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewProgModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar Análisis de Progesterona</span>
            </button>
          </div>
        </div>
      )}

      {currentCiclo ? (
        <div className="space-y-6">
          {/* Cycle Overview & Fertility Window Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-pink-700 tracking-wider">
                  SEGUIMIENTO DE CICLO ESTRO
                </span>
                <h3 className="text-xl font-black text-slate-900">{currentCiclo.hembraNombre}</h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  Código: <span className="font-mono text-blue-700 font-bold">{currentCiclo.codigoCiclo}</span> • Inicio de sangrado: {currentCiclo.fechaInicio}
                </div>
              </div>

              {currentCiclo.fechasOptimasServicio && (
                <div className="p-3.5 rounded-xl bg-pink-50 border border-pink-200 text-right">
                  <div className="text-[10px] uppercase font-bold text-pink-800">
                    Ventana Óptima de Servicio
                  </div>
                  <div className="text-sm font-black text-pink-900 mt-0.5">
                    {currentCiclo.fechasOptimasServicio}
                  </div>
                  <div className="text-[10px] text-pink-700 mt-0.5 font-medium">
                    Basado en curva de maduración oocitaria
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Progesterone SVG Chart */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-800">Evolución de Niveles de Progesterona (ng/ml)</span>
                <span className="text-[10px] text-slate-500">
                  Rango fértil objetivo: &gt; 5.0 ng/ml
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6">
                  {(currentCiclo.mediciones || []).map((m, idx) => {
                    const heightPct = Math.round((m.valorNgMl / maxProgValue) * 100);
                    const isFertile = m.valorNgMl >= 5.0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            isFertile ? 'text-pink-700' : 'text-blue-700'
                          }`}
                        >
                          {m.valorNgMl} ng/ml
                        </span>
                        <div className="w-full bg-slate-200 rounded-t h-32 flex items-end overflow-hidden">
                          <div
                            style={{ height: `${Math.max(heightPct, 8)}%` }}
                            className={`w-full rounded-t transition-all duration-300 ${
                              isFertile
                                ? 'bg-gradient-to-t from-pink-600 to-rose-400'
                                : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono font-medium">Día {m.diasDesdeCelo}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[70px]">{m.fecha}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Table of Progesterone Test Results */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Historial de Mediciones del Ciclo
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Día de Celo</th>
                    <th className="p-2.5">Valor ng/ml</th>
                    <th className="p-2.5">Laboratorio</th>
                    <th className="p-2.5">Recomendación Técnica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(currentCiclo.mediciones || []).map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 font-mono text-slate-500">{m.fecha}</td>
                      <td className="p-2.5 font-bold text-slate-900">Día {m.diasDesdeCelo}</td>
                      <td className="p-2.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            m.valorNgMl >= 5.0
                              ? 'bg-pink-100 text-pink-800 border border-pink-200'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.valorNgMl} ng/ml
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">{m.laboratorio}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{m.recomendacion}</td>
                    </tr>
                  ))}
                  {(currentCiclo.mediciones || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                        Sin mediciones de progesterona registradas para este ciclo. Cargá el primer análisis arriba.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" />
              <span>
                Nota reglamentaria: Las mediciones hormonales constituyen herramientas orientativas de manejo reproductivo y no sustituyen el dictamen ni la evaluación clínica presencial del médico veterinario actuante.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs shadow-xs">
          No hay ciclos de celo activos en este criadero.
        </div>
      )}

      {/* New Cycle Modal */}
      {showNewCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl text-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Iniciar Seguimiento de Celo</h3>
              <button
                onClick={() => setShowNewCycleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="p-5 space-y-3 text-xs">
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Fecha de Inicio de Celo (Proestro) *
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código del Ciclo</label>
                <input
                  type="text"
                  value={codigoCiclo}
                  onChange={(e) => setCodigoCiclo(e.target.value)}
                  placeholder="ej: CICLO-2026-GRETA"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCycleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Registrar Ciclo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Progesterone Measurement Modal */}
      {showNewProgModal && currentCiclo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl text-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Cargar Medición de Progesterona</h3>
              <button
                onClick={() => setShowNewProgModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProg} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Análisis *</label>
                  <input
                    type="date"
                    value={fechaTest}
                    onChange={(e) => setFechaTest(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Días desde Celo</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={diasDesdeCelo}
                    onChange={(e) => setDiasDesdeCelo(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Valor Progesterona (ng/ml) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={valorNgMl}
                  onChange={(e) => setValorNgMl(parseFloat(e.target.value) || 0)}
                  placeholder="ej: 5.8"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Laboratorio Actuante</label>
                <input
                  type="text"
                  value={laboratorio}
                  onChange={(e) => setLaboratorio(e.target.value)}
                  placeholder="Laboratorio Veterinario..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProgModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
