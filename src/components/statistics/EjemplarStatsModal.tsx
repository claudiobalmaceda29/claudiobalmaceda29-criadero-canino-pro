import React from 'react';
import { Ejemplar, Camada, Cachorro, Monta } from '../../types';
import {
  X,
  Dog,
  Baby,
  Calendar,
  Award,
  Layers,
  HeartHandshake,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { calculateExactAge } from '../dogs/DogFormModal';
import { getCollarColorHex, getCollarColorName } from '../../lib/dogUtils';

interface EjemplarStatsModalProps {
  ejemplar: Ejemplar;
  camadas: Camada[];
  cachorros: Cachorro[];
  montas: Monta[];
  onClose: () => void;
  onNavigateToCamadas?: () => void;
}

export const EjemplarStatsModal: React.FC<EjemplarStatsModalProps> = ({
  ejemplar,
  camadas,
  cachorros,
  montas,
  onClose,
  onNavigateToCamadas,
}) => {
  const isMacho = ejemplar.sexo === 'MACHO';

  // 1. Camadas en las que participó este ejemplar
  const ejemplarCamadas = camadas.filter((c) =>
    isMacho
      ? c.padreId === ejemplar.id || c.padreNombre?.trim().toLowerCase() === ejemplar.nombreCompleto.trim().toLowerCase()
      : c.madreId === ejemplar.id || c.madreNombre?.trim().toLowerCase() === ejemplar.nombreCompleto.trim().toLowerCase()
  );

  // 2. Cachorros descendientes de este ejemplar
  const ejemplarCachorros = cachorros.filter((c) =>
    isMacho
      ? c.padreId === ejemplar.id || c.padreNombre?.trim().toLowerCase() === ejemplar.nombreCompleto.trim().toLowerCase()
      : c.madreId === ejemplar.id || c.madreNombre?.trim().toLowerCase() === ejemplar.nombreCompleto.trim().toLowerCase()
  );

  // 3. Montas / Servicios (especialmente relevante para machos y hembras)
  const ejemplarMontas = montas.filter((m) =>
    isMacho
      ? m.machoId === ejemplar.id || m.machoNombre?.trim().toLowerCase() === ejemplar.nombreCompleto.trim().toLowerCase()
      : m.hembraId === ejemplar.id || m.hembraNombre?.trim().toLowerCase() === ejemplar.nombreCompleto.trim().toLowerCase()
  );

  const montasConfirmadas = ejemplarMontas.filter(
    (m) => m.estado === 'CONFIRMADA_PREÑADA'
  ).length;

  const tasaConcepcion =
    ejemplarMontas.length > 0
      ? Math.round((montasConfirmadas / ejemplarMontas.length) * 100)
      : 0;

  // 4. Métricas numéricas de descendencia
  const totalCamadas = ejemplarCamadas.length;
  const totalCachorrosNacidos = ejemplarCamadas.reduce(
    (acc, c) => acc + (c.totalCachorros || 0),
    0
  );
  const totalVivos = ejemplarCamadas.reduce(
    (acc, c) => acc + (c.nacidosVivos !== undefined ? c.nacidosVivos : c.totalCachorros || 0),
    0
  );
  const totalFallecidos = ejemplarCamadas.reduce(
    (acc, c) => acc + (c.fallecidos || 0),
    0
  );

  const totalMachosProducidos = ejemplarCamadas.reduce(
    (acc, c) => acc + (c.machos || 0),
    0
  );
  const totalHembrasProducidas = ejemplarCamadas.reduce(
    (acc, c) => acc + (c.hembras || 0),
    0
  );

  const promedioPorCamada =
    totalCamadas > 0
      ? (totalCachorrosNacidos / totalCamadas).toFixed(1)
      : '0';

  const tasaSupervivencia =
    totalCachorrosNacidos > 0
      ? Math.round((totalVivos / totalCachorrosNacidos) * 100)
      : 100;

  // Conteo de partos por tipo (para hembras)
  const partosNaturales = ejemplarCamadas.filter(
    (c) => c.tipoParto === 'NATURAL' || !c.tipoParto
  ).length;
  const partosCesarea = ejemplarCamadas.filter(
    (c) => c.tipoParto === 'CESAREA'
  ).length;

  // Cachorros que ingresaron al plantel como futuros reproductores
  const cachorrosAlPlantel = ejemplarCachorros.filter(
    (c) => c.estadoComercial === 'PLANTEL' || c.incorporadoAlPlantel
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-300 dark:border-slate-600">
              {ejemplar.fotoUrl ? (
                <img
                  src={ejemplar.fotoUrl}
                  alt={ejemplar.nombreCompleto}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Dog className="w-6 h-6" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isMacho
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      : 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300'
                  }`}
                >
                  {isMacho ? 'Padrillo Reproductor' : 'Madre Reproductora'}
                </span>
                <span className="text-xs text-slate-400">
                  {ejemplar.afijo || 'Criadero'}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {ejemplar.nombreCompleto}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {ejemplar.numeroPOA && <span>POA: {ejemplar.numeroPOA}</span>}
                {ejemplar.tatuaje && <span>• TAT: {ejemplar.tatuaje}</span>}
                {ejemplar.fechaNacimiento && (
                  <span>• Edad: {calculateExactAge(ejemplar.fechaNacimiento)}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          {/* Main Stats Grid */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Resumen Reproductivo Individual</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Camadas */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Camadas
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {totalCamadas}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  En el criadero
                </span>
              </div>

              {/* Total Cachorros */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Cachorros
                </span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {totalCachorrosNacidos}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {totalVivos} nacidos vivos
                </span>
              </div>

              {/* Promedio por Camada */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Promedio / Camada
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {promedioPorCamada}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Crías por parto
                </span>
              </div>

              {/* Supervivencia */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Supervivencia
                </span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {tasaSupervivencia}%
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {totalFallecidos > 0 ? `${totalFallecidos} fallecidos` : '100% vitalidad'}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Details & Sex Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Ratio Machos / Hembras */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Distribución por Sexo
              </span>
              <div className="flex items-center justify-between text-sm font-bold font-mono">
                <span className="text-blue-600 dark:text-blue-400">{totalMachosProducidos} Machos</span>
                <span className="text-slate-300 dark:text-slate-600">/</span>
                <span className="text-pink-600 dark:text-pink-400">{totalHembrasProducidas} Hembras</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{
                    width: `${
                      totalCachorrosNacidos > 0
                        ? (totalMachosProducidos / totalCachorrosNacidos) * 100
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="bg-pink-500 h-full"
                  style={{
                    width: `${
                      totalCachorrosNacidos > 0
                        ? (totalHembrasProducidas / totalCachorrosNacidos) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Montas / Fertilidad */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isMacho ? 'Servicios & Fertilidad' : 'Montas & Concepción'}
              </span>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {ejemplarMontas.length} {ejemplarMontas.length === 1 ? 'servicio' : 'servicios'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {montasConfirmadas} con gestación confirmada ({tasaConcepcion}%)
              </p>
            </div>

            {/* Aporte al Plantel / Partos */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {isMacho ? 'Hijos en el Plantel' : 'Modalidad de Partos'}
              </span>
              {isMacho ? (
                <>
                  <div className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                    {cachorrosAlPlantel} cachorros retenidos
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Hijos seleccionados para reproducción
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                    {partosNaturales} Natural / {partosCesarea} Cesárea
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Historial de partos de la madre
                  </p>
                </>
              )}
            </div>
          </div>

          {/* List of Litters participated in */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Camadas en las que participó ({ejemplarCamadas.length})</span>
              </h4>
              {onNavigateToCamadas && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToCamadas();
                  }}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ir al módulo de camadas</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {ejemplarCamadas.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                Este ejemplar aún no cuenta con camadas registradas en el criadero.
              </div>
            ) : (
              <div className="space-y-2.5">
                {ejemplarCamadas.map((camada) => {
                  const coParent = isMacho ? camada.madreNombre : camada.padreNombre;
                  const pupsInThisCamada = ejemplarCachorros.filter(
                    (p) => p.camadaId === camada.id || p.camadaNombre === camada.identificador
                  );

                  return (
                    <div
                      key={camada.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <strong className="text-sm font-bold text-slate-900 dark:text-white">
                            {camada.identificador}
                          </strong>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cruza con:{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {coParent || 'Sin registrar'}
                            </span>{' '}
                            • Nacimiento: {camada.fechaNacimiento || 'Sin fecha'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {camada.estado}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                            {camada.totalCachorros} crías ({camada.machos}M / {camada.hembras}H)
                          </span>
                        </div>
                      </div>

                      {/* Puppy Collar chips inside this litter */}
                      {pupsInThisCamada.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                          {pupsInThisCamada.map((p) => {
                            const collarHex = getCollarColorHex(p.colorCollar, p.nombreColorCollar);
                            const collarName = getCollarColorName(p.colorCollar, p.nombreColorCollar);
                            return (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-2xs"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10"
                                  style={{ backgroundColor: collarHex }}
                                />
                                <span>{collarName}</span>
                                {p.nombre && (
                                  <span className="text-[9px] text-slate-400 font-normal">
                                    ({p.nombre.split(' ')[0]})
                                  </span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* List of Registered Puppies */}
          {ejemplarCachorros.length > 0 && (
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5 text-pink-600" />
                <span>Cachorros con Ficha Registrada ({ejemplarCachorros.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ejemplarCachorros.map((p) => {
                  const collarHex = getCollarColorHex(p.colorCollar, p.nombreColorCollar);
                  const collarName = getCollarColorName(p.colorCollar, p.nombreColorCollar);

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
                          style={{ backgroundColor: collarHex }}
                          title={`Collar: ${collarName}`}
                        />
                        <div className="truncate">
                          <strong className="text-slate-800 dark:text-slate-200 block truncate font-bold">
                            {p.nombre || p.identificadorProvisorio}
                          </strong>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {p.sexo === 'MACHO' ? 'Macho' : 'Hembra'} • {collarName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          p.estadoComercial === 'ENTREGADO'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.estadoComercial === 'PLANTEL'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : p.estadoComercial === 'RESERVADO'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.estadoComercial}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
