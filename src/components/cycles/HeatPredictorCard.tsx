import React from 'react';
import { useApp } from '../../context/AppContext';
import { predecirProximoCelo, PrediccionCeloResult } from '../../utils/cyclePredictor';
import { Ejemplar, CicloCelo, Camada } from '../../types';
import { Calendar, Clock, AlertCircle, Sparkles, Heart, Activity } from 'lucide-react';

interface HeatPredictorCardProps {
  hembra?: Ejemplar;
  ejemplar?: Ejemplar;
  ciclos?: CicloCelo[];
  camadas?: Camada[];
  onProgramarCelo?: (prediccion: PrediccionCeloResult) => void;
  compact?: boolean;
}

export const HeatPredictorCard: React.FC<HeatPredictorCardProps> = ({
  hembra,
  ejemplar,
  ciclos,
  camadas,
  onProgramarCelo,
  compact = false,
}) => {
  const { ciclosCelo: allCiclos, camadas: allCamadas } = useApp();
  const targetHembra = hembra || ejemplar;
  if (!targetHembra) return null;

  const targetCiclos = ciclos || allCiclos.filter((c) => c.hembraId === targetHembra.id);
  const targetCamadas = camadas || allCamadas.filter((c) => c.madreId === targetHembra.id);
  const prediccion = predecirProximoCelo(targetHembra, targetCiclos, targetCamadas);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 shrink-0" />
          <div>
            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>Próximo Celo</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prediccion.badgeColor}`}>
                {prediccion.badgeTexto}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Fecha estimada: <span className="font-semibold text-slate-700 dark:text-slate-300">{prediccion.fechaEstimadaProximoCelo}</span>
            </div>
          </div>
        </div>
        {onProgramarCelo && (
          <button
            type="button"
            onClick={() => onProgramarCelo(prediccion)}
            className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Anotar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden">
      {/* Accent Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Calculadora de Ciclo Reproductivo</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Proyección algorítmica para hembras POA (Ciclo biológico: ~{prediccion.cicloPromedioDias} días)
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${prediccion.badgeColor}`}>
          <Clock className="w-3 h-3" />
          <span>{prediccion.badgeTexto}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
        {/* Ultimo Celo / Parto */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Último Evento ({prediccion.origenUltimoDato.replace('_', ' ')})
          </span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 block">
            {prediccion.fechaUltimoCelo || 'Sin fecha registrada'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            Hace {prediccion.diasDesdeUltimoCelo} días
          </span>
        </div>

        {/* Proximo Celo Estimado */}
        <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 text-xs">
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
            Próximo Celo Proyectado
          </span>
          <span className="text-sm font-black text-rose-700 dark:text-rose-300 block">
            {prediccion.fechaEstimadaProximoCelo}
          </span>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 block font-medium">
            {prediccion.diasRestantes <= 0 ? 'En curso / fecha cumplida' : `Faltan aprox. ${prediccion.diasRestantes} días`}
          </span>
        </div>

        {/* Ventana de Progesterona */}
        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 text-xs">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
            Ventana Dosaje Progesterona
          </span>
          <span className="text-sm font-black text-blue-700 dark:text-blue-300 block">
            {prediccion.ventanaProgesteronaSugerida.inicio}
          </span>
          <span className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">
            Hasta {prediccion.ventanaProgesteronaSugerida.fin} (Días 9 al 14)
          </span>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-700 dark:text-slate-300 text-[11.5px] leading-relaxed">
          <span className="font-bold text-amber-900 dark:text-amber-300">Recomendación de Manejo: </span>
          {prediccion.observacionRecomendada}
        </div>
      </div>
    </div>
  );
};
