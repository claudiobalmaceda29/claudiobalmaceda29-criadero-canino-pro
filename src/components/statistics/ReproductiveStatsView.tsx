import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar } from '../../types';
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
  ExternalLink,
  Sparkles,
  Lightbulb,
  Scale,
} from 'lucide-react';
import { getCollarColorHex, getCollarColorName } from '../../lib/dogUtils';
import { EjemplarStatsModal } from './EjemplarStatsModal';

export const ReproductiveStatsView: React.FC = () => {
  const { montas, camadas, cachorros, ejemplares, setActiveTab } = useApp();

  const [selectedEjemplarForStats, setSelectedEjemplarForStats] = useState<Ejemplar | null>(null);

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

  // Datos Curiosos y Estadísticas Anecdóticas del Criadero
  const curiousFacts = useMemo(() => {
    // 1. Tatuajes: Porcentaje que termina en número Par vs Impar
    let totalTatuajesConNumero = 0;
    let tatuajesPares = 0;
    let tatuajesImpares = 0;

    ejemplares.forEach((e) => {
      const tat = (e.tatuaje || '').trim();
      const digits = tat.match(/\d/g);
      if (digits && digits.length > 0) {
        totalTatuajesConNumero++;
        const lastDigit = parseInt(digits[digits.length - 1], 10);
        if (lastDigit % 2 === 0) {
          tatuajesPares++;
        } else {
          tatuajesImpares++;
        }
      }
    });

    const pctPares =
      totalTatuajesConNumero > 0
        ? Math.round((tatuajesPares / totalTatuajesConNumero) * 100)
        : 50;
    const pctImpares =
      totalTatuajesConNumero > 0 ? 100 - pctPares : 50;

    // 2. Color de collar más repetido en la historia del criadero
    const collarFrequency: Record<string, { count: number; hex: string; name: string }> = {};
    cachorros.forEach((c) => {
      const name = getCollarColorName(c.colorCollar, c.nombreColorCollar);
      const hex = getCollarColorHex(c.colorCollar, c.nombreColorCollar);
      if (!collarFrequency[name]) {
        collarFrequency[name] = { count: 0, hex, name };
      }
      collarFrequency[name].count++;
    });

    const sortedCollars = Object.values(collarFrequency).sort((a, b) => b.count - a.count);
    const mostPopularCollar = sortedCollars[0] || {
      name: 'Azul',
      hex: '#2563eb',
      count: 0,
    };

    // 3. Mes con más nacimientos históricos
    const monthCounts: Record<string, number> = {};
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    camadas.forEach((c) => {
      if (c.fechaNacimiento) {
        const parts = c.fechaNacimiento.split('T')[0].split('-');
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            const mName = monthNames[mIdx];
            monthCounts[mName] = (monthCounts[mName] || 0) + (c.totalCachorros || 0);
          }
        }
      }
    });

    const sortedMonths = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
    const topBirthMonth = sortedMonths[0]
      ? { month: sortedMonths[0][0], count: sortedMonths[0][1] }
      : { month: 'Diciembre', count: 0 };

    // 4. Camada récord con más cachorros
    const recordLitter = [...camadas].sort((a, b) => (b.totalCachorros || 0) - (a.totalCachorros || 0))[0] || null;

    // 5. Peso promedio neonatal histórico
    const pupsWithWeight = cachorros.filter((c) => (c.pesoNacimientoGramos || 0) > 0);
    const avgBirthWeight =
      pupsWithWeight.length > 0
        ? Math.round(
            pupsWithWeight.reduce((acc, c) => acc + (c.pesoNacimientoGramos || 0), 0) /
              pupsWithWeight.length
          )
        : 495;

    return {
      totalTatuajesConNumero,
      tatuajesPares,
      tatuajesImpares,
      pctPares,
      pctImpares,
      mostPopularCollar,
      topBirthMonth,
      recordLitter,
      avgBirthWeight,
    };
  }, [ejemplares, cachorros, camadas]);

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
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-pink-300 dark:hover:border-pink-800 hover:shadow-2xs transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const fullDog = ejemplares.find((e) => e.id === dam.id) || ({
                          id: dam.id,
                          nombreCompleto: dam.nombre,
                          afijo: dam.afijo,
                          sexo: 'HEMBRA',
                          raza: 'Ovejero Alemán',
                        } as any);
                        setSelectedEjemplarForStats(fullDog);
                      }}
                      className="font-bold text-slate-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 text-left transition-colors flex items-center gap-1.5 group cursor-pointer"
                      title="Ver estadísticas individuales detalladas de esta madre"
                    >
                      <span className="underline decoration-pink-300 dark:decoration-pink-700 underline-offset-2 group-hover:decoration-pink-600">
                        {dam.nombre}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-pink-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 ml-7 mt-0.5">
                    {dam.littersCount} camadas producidas • Promedio: {dam.avg} cachorros
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="text-base font-black text-pink-600 dark:text-pink-400 font-mono">
                    {dam.pupsCount}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Cachorros</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sires Performance Ranking */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
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
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-2xs transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const fullDog = ejemplares.find((e) => e.id === sire.id) || ({
                          id: sire.id,
                          nombreCompleto: sire.nombre,
                          afijo: sire.afijo,
                          sexo: 'MACHO',
                          raza: 'Ovejero Alemán',
                        } as any);
                        setSelectedEjemplarForStats(fullDog);
                      }}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors flex items-center gap-1.5 group cursor-pointer"
                      title="Ver estadísticas individuales detalladas de este padrillo"
                    >
                      <span className="underline decoration-blue-300 dark:decoration-blue-700 underline-offset-2 group-hover:decoration-blue-600">
                        {sire.nombre}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 ml-7 mt-0.5">
                    {sire.matingsCount} servicios registrados • {sire.littersCount} camadas
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <div className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                    {sire.pupsCount}
                  </div>
                  <div className="text-[9px] uppercase font-bold text-slate-400">Cachorros</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección Datos Curiosos & Trivia del Criadero */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 dark:border-indigo-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Datos Curiosos del Criadero</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  Trivia & Analítica
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Patrones interesantes y curiosidades calculadas a partir de tus registros históricos.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tarjeta 1: Tatuajes Pares vs Impares */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Tatuajes: Pares vs Impares</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {curiousFacts.totalTatuajesConNumero} evaluados
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-blue-600 dark:text-blue-400">
                  {curiousFacts.pctPares}% Pares ({curiousFacts.tatuajesPares})
                </span>
                <span className="text-purple-600 dark:text-purple-400">
                  {curiousFacts.pctImpares}% Impares ({curiousFacts.tatuajesImpares})
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${curiousFacts.pctPares}%` }}
                />
                <div
                  className="bg-purple-600 h-full transition-all duration-500"
                  style={{ width: `${curiousFacts.pctImpares}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              El <strong className="text-slate-800 dark:text-slate-200">{curiousFacts.pctPares}%</strong> de los tatuajes oficiales termina en número par y el <strong className="text-slate-800 dark:text-slate-200">{curiousFacts.pctImpares}%</strong> en número impar.
            </p>
          </div>

          {/* Tarjeta 2: Color de Collar Más Repetido */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Collar Más Repetido</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Histórico</span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl shadow-xs border border-black/10 flex items-center justify-center shrink-0 ring-2 ring-indigo-500/20"
                style={{ backgroundColor: curiousFacts.mostPopularCollar.hex }}
              />
              <div>
                <strong className="text-sm font-black text-slate-900 dark:text-white block">
                  {curiousFacts.mostPopularCollar.name}
                </strong>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {curiousFacts.mostPopularCollar.count} cachorros identificados
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              El color <strong className="text-slate-800 dark:text-slate-200">{curiousFacts.mostPopularCollar.name}</strong> es el más utilizado para la identificación de crías en el criadero.
            </p>
          </div>

          {/* Tarjeta 3: Mes Récord de Nacimientos */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Temporada Alta de Partos</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Mes pico</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {curiousFacts.topBirthMonth.month}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {curiousFacts.topBirthMonth.count} cachorros nacidos
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs">
                Temporada Alta
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              El mes con mayor concentración de nacimientos y actividad de paridera ha sido históricamente <strong className="text-slate-800 dark:text-slate-200">{curiousFacts.topBirthMonth.month}</strong>.
            </p>
          </div>

          {/* Tarjeta 4: Camada Récord */}
          {curiousFacts.recordLitter && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-500" />
                  <span>Camada Más Numerosa</span>
                </span>
                <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">Récord</span>
              </div>

              <div>
                <strong className="text-sm font-black text-slate-900 dark:text-white block truncate">
                  {curiousFacts.recordLitter.identificador}
                </strong>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                  {curiousFacts.recordLitter.totalCachorros} cachorros
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Madre: <strong className="text-slate-800 dark:text-slate-200">{curiousFacts.recordLitter.madreNombre}</strong> • {curiousFacts.recordLitter.machos} machos y {curiousFacts.recordLitter.hembras} hembras.
              </p>
            </div>
          )}

          {/* Tarjeta 5: Peso Promedio Neonatal */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-500" />
                <span>Peso Promedio al Nacer</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Semana 0</span>
            </div>

            <div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {curiousFacts.avgBirthWeight}g
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Rango saludable estándar (450g - 550g)
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Promedio ponderado calculado a partir de todos los cachorros pesados al nacer en el criadero.
            </p>
          </div>
        </div>
      </div>

      {/* Individual Dog Stats Modal */}
      {selectedEjemplarForStats && (
        <EjemplarStatsModal
          ejemplar={selectedEjemplarForStats}
          camadas={camadas}
          cachorros={cachorros}
          montas={montas}
          onClose={() => setSelectedEjemplarForStats(null)}
          onNavigateToCamadas={() => setActiveTab('camadas')}
        />
      )}
    </div>
  );
};
