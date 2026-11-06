import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calcularPlazosAntiMultasPOA, TramitePOAPlazo } from '../../utils/poaRegulations';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const POADeadlineTrackerWidget: React.FC = () => {
  const { montas, camadas, setActiveTab } = useApp();
  const [filterUrgentes, setFilterUrgentes] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const tramites = calcularPlazosAntiMultasPOA(montas, camadas);
  const tramitesVencidos = tramites.filter((t) => t.estadoSemaforo === 'ROJO_VENCIDO');
  const tramitesUrgentes = tramites.filter((t) => t.estadoSemaforo === 'AMARILLO');

  const tramitesFiltrados = filterUrgentes
    ? tramites.filter((t) => t.estadoSemaforo === 'ROJO_VENCIDO' || t.estadoSemaforo === 'AMARILLO')
    : tramites;

  const formatMoneda = (val: number) => `$ ${val.toLocaleString('es-AR')}`;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header with Title and Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Dashboard Anti-Multas POA • Gestión de Plazos Fatales
              </h3>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setShowTooltip((p) => !p)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  title="Ver normativa de plazos POA"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 top-6 z-30 w-72 p-3 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 space-y-1.5 animate-in fade-in">
                    <div className="font-bold text-amber-300">Reglamento Oficial Libro de Cría POA:</div>
                    <p>• <strong>Denuncia de Servicio:</strong> 30 días corridos post-monta.</p>
                    <p>• <strong>Denuncia de Nacimiento:</strong> 10 días corridos post-parto.</p>
                    <p>• <strong>Inscripción de Cría (Tatuaje/Chip):</strong> Hasta 70 días de vida.</p>
                    <p className="text-slate-400 text-[10px]">Superar estos plazos genera multas automáticas y recargos arancelarios de hasta el 100%.</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cuentas regresivas automáticas de Libro de Cría para evitar recargos arancelarios en el Club POA.
            </p>
          </div>
        </div>

        {/* Counter Badges and Filter Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {tramitesVencidos.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 animate-pulse">
              {tramitesVencidos.length} Vencidos
            </span>
          )}
          {tramitesUrgentes.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
              {tramitesUrgentes.length} Próximos
            </span>
          )}
          <button
            type="button"
            onClick={() => setFilterUrgentes((p) => !p)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              filterUrgentes
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {filterUrgentes ? 'Ver Todos' : 'Filtrar Urgentes'}
          </button>
        </div>
      </div>

      {/* List of Deadlines */}
      <div className="space-y-3">
        {tramitesFiltrados.slice(0, 6).map((tramite) => {
          const isVencido = tramite.estadoSemaforo === 'ROJO_VENCIDO';
          const isUrgente = tramite.estadoSemaforo === 'AMARILLO';

          const cardBg = isVencido
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
            : isUrgente
            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
            : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60';

          const badgeBg = isVencido
            ? 'bg-rose-600 text-white shadow-xs'
            : isUrgente
            ? 'bg-amber-500 text-white'
            : 'bg-emerald-600 text-white';

          return (
            <div
              key={tramite.id}
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${cardBg}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badgeBg}`}>
                    {tramite.badgeTexto}
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    {tramite.titulo}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    • {tramite.entidadNombre}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {tramite.instruccionPOA}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Fecha de Origen: {tramite.fechaEventoOrigen}</span>
                  <span>•</span>
                  <span>Fecha Límite Fatal: <strong className="text-slate-800 dark:text-slate-200">{tramite.fechaLimiteFatal}</strong></span>
                  {tramite.arancelVencidoConRecargo && (
                    <>
                      <span>•</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        Recargo estimado: {formatMoneda(tramite.arancelVencidoConRecargo)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {tramite.tipoTramite === 'DENUNCIA_SERVICIO' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('montas')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Ver Monta</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('camadas')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Ver Camada</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {tramitesFiltrados.length === 0 && (
          <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <span className="font-bold text-slate-800 dark:text-white">¡Libro de Cría al día!</span>
            <span>No tenés denuncias de servicio, nacimientos ni inscripciones vencidas o en plazo crítico.</span>
          </div>
        )}
      </div>
    </div>
  );
};
