import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Camada } from '../../types';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Baby,
  Activity,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

export const GestationTimelineView: React.FC = () => {
  const {
    gestaciones,
    completarHitoGestacion,
    registrarPartoReal,
  } = useApp();

  const [selectedGestId, setSelectedGestId] = useState<string>(gestaciones[0]?.id || '');
  const [showBirthModal, setShowBirthModal] = useState(false);

  // Form for real birth registration
  const [identificadorCamada, setIdentificadorCamada] = useState('');
  const [totalCachorros, setTotalCachorros] = useState<number>(7);
  const [machos, setMachos] = useState<number>(4);
  const [hembras, setHembras] = useState<number>(3);
  const [nacidosVivos, setNacidosVivos] = useState<number>(7);
  const [fallecidos, setFallecidos] = useState<number>(0);
  const [tipoParto, setTipoParto] = useState<'NATURAL' | 'CESAREA'>('NATURAL');
  const [observacionesParto, setObservacionesParto] = useState('');

  const currentGest = gestaciones.find((g) => g.id === selectedGestId) || gestaciones[0];

  // Dynamic calculations for days elapsed
  const today = new Date();
  const fechaMonta = currentGest ? new Date(currentGest.fechaMonta) : today;
  const diasTranscurridos = Math.max(
    0,
    Math.min(65, Math.ceil((today.getTime() - fechaMonta.getTime()) / (1000 * 60 * 60 * 24)))
  );
  const semanaActual = Math.min(9, Math.ceil(diasTranscurridos / 7));
  const diasRestantes = Math.max(0, 63 - diasTranscurridos);

  const handleOpenBirthModal = () => {
    if (!currentGest) return;
    setIdentificadorCamada(`Camada de ${currentGest.hembraNombre.split(' ')[0]} 2026`);
    setShowBirthModal(true);
  };

  const handleConfirmBirth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGest) return;

    const camadaData: Omit<Camada, 'id' | 'createdAt'> = {
      criaderoId: currentGest.criaderoId,
      identificador: identificadorCamada || `Camada de ${currentGest.hembraNombre}`,
      padreId: currentGest.machoId,
      padreNombre: currentGest.machoNombre,
      madreId: currentGest.hembraId,
      madreNombre: currentGest.hembraNombre,
      fechaNacimiento: new Date().toISOString().split('T')[0],
      totalCachorros,
      machos,
      hembras,
      nacidosVivos,
      fallecidos,
      tipoParto,
      estado: 'LACTANCIA',
      observaciones: observacionesParto || 'Parto registrado desde el cronograma de gestación.',
    };

    registrarPartoReal(currentGest.id, camadaData);
    setShowBirthModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-bold mb-2">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Monitoreo Reproductivo</span>
            <span>•</span>
            <span className="font-mono">Gestación de 63 días</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Cronograma de Gestación
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Seguimiento día a día (1 a 63 días), hitos ecográficos, nutrición gestacional y confirmación de parto real.
          </p>
        </div>

        {currentGest && currentGest.estado === 'EN_CURSO' && (
          <button
            onClick={handleOpenBirthModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Baby className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Parto Real</span>
          </button>
        )}
      </div>

      {/* Gestation Selector */}
      {gestaciones.length > 0 && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 text-xs shadow-xs">
          <label className="font-bold text-slate-700 shrink-0">Gestación activa:</label>
          <select
            value={selectedGestId}
            onChange={(e) => setSelectedGestId(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-pink-500/30 cursor-pointer"
          >
            {gestaciones.map((g) => (
              <option key={g.id} value={g.id}>
                {g.hembraNombre} x {g.machoNombre} ({g.estado === 'EN_CURSO' ? 'En Curso' : 'Parto Concluido'})
              </option>
            ))}
          </select>
        </div>
      )}

      {currentGest ? (
        <div className="space-y-6">
          {/* Progress Timeline Hero Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-pink-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black text-pink-700 tracking-wider">
                  HEMBRA GESTANTE
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{currentGest.hembraNombre}</h3>
                <div className="text-xs text-slate-500 mt-1">
                  Padrillo / Cruza:{' '}
                  <strong className="text-blue-700 font-bold">{currentGest.machoNombre}</strong>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    Parto Estimado
                  </div>
                  <div className="text-lg font-black text-amber-800 font-mono">
                    {currentGest.fechaEstimadaParto}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 text-center shadow-xs">
                  <div className="text-2xl font-black text-pink-700">
                    {currentGest.estado === 'PARTO_REGISTRADO' ? 'Concluido' : `${diasRestantes} días`}
                  </div>
                  <div className="text-[10px] uppercase font-black text-pink-800 mt-0.5">
                    {currentGest.estado === 'PARTO_REGISTRADO' ? 'Camada nacida' : 'para el parto'}
                  </div>
                </div>
              </div>
            </div>

            {/* 63-Day Visual Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Día 1 (Monta: {currentGest.fechaMonta})</span>
                <span className="text-slate-900 font-black">
                  Día {diasTranscurridos} de 63 (Semana {semanaActual})
                </span>
                <span>Día 63 (Parto Esperado)</span>
              </div>

              <div className="w-full h-4 rounded-full bg-slate-100 p-0.5 overflow-hidden border border-slate-200">
                <div
                  style={{ width: `${Math.min(100, Math.round((diasTranscurridos / 63) * 100))}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-pink-500 to-amber-500 transition-all duration-500 shadow-xs"
                />
              </div>

              {/* Milestones markers on bar */}
              <div className="grid grid-cols-4 text-[10px] text-slate-500 font-bold pt-1">
                <div>Día 28: Ecografía</div>
                <div className="text-center">Día 45: Dieta Puppy</div>
                <div className="text-center">Día 55: Rayos X Conteo</div>
                <div className="text-right">Día 63: Parto</div>
              </div>
            </div>
          </div>

          {/* Detailed Milestones List */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Hitos Clínicos y Controles Programados
            </h4>

            <div className="space-y-3">
              {currentGest.hitos.map((hito) => (
                <div
                  key={hito.id}
                  className={`p-4 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hito.completado
                      ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                      : 'bg-white border-blue-200 shadow-xs text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        hito.completado
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {hito.completado ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-900 font-bold">{hito.titulo}</strong>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                          Día {hito.diaObjetivo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{hito.descripcion}</p>
                      {hito.resultado && (
                        <div className="mt-2 text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                          <strong>Resultado registrado:</strong> {hito.resultado}
                        </div>
                      )}
                    </div>
                  </div>

                  {!hito.completado && (
                    <button
                      onClick={() => {
                        const res = window.prompt(
                          `Ingresar resultado u observaciones para: ${hito.titulo}`,
                          'Completado conforme a protocolo veterinario'
                        );
                        if (res !== null) {
                          completarHitoGestacion(currentGest.id, hito.id, res);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Completar Hito</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-white border border-slate-200 text-slate-500 text-xs shadow-xs">
          No hay gestaciones activas registradas en este criadero.
        </div>
      )}

      {/* Real Birth Confirmation Modal */}
      {showBirthModal && currentGest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Registrar Parto Real y Crear Camada</h3>
              </div>
              <button
                onClick={() => setShowBirthModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Registra el parto de <strong className="text-slate-800">{currentGest.hembraNombre}</strong> y crea la camada oficial con fecha de hoy.
            </p>

            <form onSubmit={handleConfirmBirth} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre / Identificador de Camada</label>
                <input
                  type="text"
                  value={identificadorCamada}
                  onChange={(e) => setIdentificadorCamada(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total</label>
                  <input
                    type="number"
                    value={totalCachorros}
                    onChange={(e) => setTotalCachorros(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Machos</label>
                  <input
                    type="number"
                    value={machos}
                    onChange={(e) => setMachos(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Hembras</label>
                  <input
                    type="number"
                    value={hembras}
                    onChange={(e) => setHembras(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vivos</label>
                  <input
                    type="number"
                    value={nacidosVivos}
                    onChange={(e) => setNacidosVivos(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tipo de Parto</label>
                <select
                  value={tipoParto}
                  onChange={(e) => setTipoParto(e.target.value as 'NATURAL' | 'CESAREA')}
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                >
                  <option value="NATURAL">Parto Natural sin complicaciones</option>
                  <option value="CESAREA">Cesárea de urgencia / programada</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={observacionesParto}
                  onChange={(e) => setObservacionesParto(e.target.value)}
                  placeholder="Detalles del parto, hora de inicio, vitalidad de cachorros..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBirthModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xs cursor-pointer transition-colors"
                >
                  Confirmar Parto y Crear Camada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
