import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  HeartHandshake,
  Baby,
  Dog,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

export const ReproductiveStatsView: React.FC = () => {
  const { montas, camadas, cachorros, ejemplares } = useApp();

  const machos = ejemplares.filter((e) => e.sexo === 'MACHO');
  const hembras = ejemplares.filter((e) => e.sexo === 'HEMBRA');

  // Core metrics
  const totalMontas = montas.length;
  const montasConfirmadas = montas.filter((m) => m.estado === 'CONFIRMADA_PREÑADA').length;
  const tasaConcepcion = totalMontas > 0 ? Math.round((montasConfirmadas / totalMontas) * 100) : 0;

  const totalCamadas = camadas.length;
  const totalCachorrosNacidos = camadas.reduce((acc, c) => acc + c.totalCachorros, 0);
  const totalVivos = camadas.reduce((acc, c) => acc + (c.nacidosVivos || c.totalCachorros), 0);
  const totalFallecidos = camadas.reduce((acc, c) => acc + (c.fallecidos || 0), 0);
  const totalMachos = camadas.reduce((acc, c) => acc + (c.machos || 0), 0);
  const totalHembras = camadas.reduce((acc, c) => acc + (c.hembras || 0), 0);

  const promedioPorCamada = totalCamadas > 0 ? (totalCachorrosNacidos / totalCamadas).toFixed(1) : '0';
  const tasaSupervivencia = totalCachorrosNacidos > 0 ? Math.round((totalVivos / totalCachorrosNacidos) * 100) : 100;

  // Productivity by Dam (Hembras)
  const damProductivity = useMemo(() => {
    return hembras.map((h) => {
      const herLitters = camadas.filter((c) => c.madreId === h.id || c.madreNombre === h.nombreCompleto);
      const pupsCount = herLitters.reduce((acc, c) => acc + c.totalCachorros, 0);
      const avg = herLitters.length > 0 ? (pupsCount / herLitters.length).toFixed(1) : '0';
      return {
        id: h.id,
        nombre: h.nombreCompleto,
        afijo: h.afijo,
        littersCount: herLitters.length,
        pupsCount,
        avg,
      };
    }).sort((a, b) => b.pupsCount - a.pupsCount);
  }, [hembras, camadas]);

  // Productivity by Sire (Machos)
  const sireProductivity = useMemo(() => {
    return machos.map((m) => {
      const hisLitters = camadas.filter((c) => c.padreId === m.id || c.padreNombre === m.nombreCompleto);
      const pupsCount = hisLitters.reduce((acc, c) => acc + c.totalCachorros, 0);
      const hisMatings = montas.filter((mo) => mo.machoId === m.id || mo.machoNombre === m.nombreCompleto);
      return {
        id: m.id,
        nombre: m.nombreCompleto,
        afijo: m.afijo,
        littersCount: hisLitters.length,
        matingsCount: hisMatings.length,
        pupsCount,
      };
    }).sort((a, b) => b.pupsCount - a.pupsCount);
  }, [machos, camadas, montas]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Estadísticas Reproductivas Avanzadas
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Análisis de fertilidad, fecundidad, índices de supervivencia neonatal y ranking de padrillos y madres.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Tasa de Concepción */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Tasa Concepción</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {tasaConcepcion}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {montasConfirmadas} de {totalMontas} montas con preñez
          </div>
        </div>

        {/* Promedio Cachorros por Camada */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Promedio Camada</span>
            <Baby className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {promedioPorCamada}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cachorros promedio por parto
          </div>
        </div>

        {/* Tasa Supervivencia Neonatal */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Supervivencia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {tasaSupervivencia}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalVivos} nacidos vivos de {totalCachorrosNacidos}
          </div>
        </div>

        {/* Distribución por Sexo */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Ratio Sexos</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {totalMachos} M / {totalHembras} H
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalMachos + totalHembras > 0
              ? `${Math.round((totalMachos / (totalMachos + totalHembras)) * 100)}% Machos`
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Sires and Dams Performance Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mothers Productivity Ranking */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Dog className="w-4 h-4 text-pink-600" />
              Rendimiento Histórico de Hembras (Madres)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {hembras.length} Hembras Evaluadas
            </span>
          </div>

          <div className="space-y-3">
            {damProductivity.map((dam, idx) => (
              <div
                key={dam.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{dam.nombre}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 ml-7 mt-0.5">
                    {dam.littersCount} camadas producidas • Promedio: {dam.avg} cachorros
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-pink-600 font-mono">
                    {dam.pupsCount}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Cachorros</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sires Performance Ranking */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              Rendimiento de Machos (Padrillos)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {machos.length} Padrillos Evaluados
            </span>
          </div>

          <div className="space-y-3">
            {sireProductivity.map((sire, idx) => (
              <div
                key={sire.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{sire.nombre}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 ml-7 mt-0.5">
                    {sire.matingsCount} servicios registrados • {sire.littersCount} camadas
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-blue-600 font-mono">
                    {sire.pupsCount}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Cachorros</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
