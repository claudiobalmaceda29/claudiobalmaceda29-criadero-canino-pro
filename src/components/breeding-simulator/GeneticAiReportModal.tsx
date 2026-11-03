import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Dna,
  ShieldAlert,
  Award,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  TrendingUp,
  Brain,
  Baby,
  Star,
  Copy,
  Check,
} from 'lucide-react';

interface AntepasadoConsanguineo {
  nombre: string;
  posicion: string;
  influencia: string;
}

interface FortalezaItem {
  rasgo: string;
  detalle: string;
  origen: string;
}

interface RiesgoItem {
  defectoOAlerta: string;
  probabilidad: string;
  mitigacion: string;
}

export interface GeneticReportData {
  cruce: string;
  coeficienteConsanguinidad: number;
  seccion1_compatibilidad_linebreeding: {
    titulo: string;
    resumen: string;
    tipoCruza: string;
    antepasadosConsanguineos: AntepasadoConsanguineo[];
    analisisBiologico: string;
  };
  seccion2_fortalezas: {
    titulo: string;
    items: FortalezaItem[];
  };
  seccion3_riesgos: {
    titulo: string;
    items: RiesgoItem[];
  };
  seccion4_cachorro_ideal: {
    titulo: string;
    morfologia: string;
    temperamentoYCaracter: string;
    criteriosDescarte: string;
    guiaSeleccionSemana7: string;
  };
  seccion5_valoracion_general: {
    titulo: string;
    puntuacion: number;
    veredicto: string;
    dictamenFinal: string;
    recomendacionesManejo: string;
  };
}

interface GeneticAiReportModalProps {
  report: GeneticReportData;
  source?: string;
  onClose: () => void;
}

export const GeneticAiReportModal: React.FC<GeneticAiReportModalProps> = ({
  report,
  source = 'gemini-ai',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'TODAS' | 'LINEBREEDING' | 'FORTALEZAS' | 'RIESGOS' | 'SELECCION' | 'DICTAMEN'>('TODAS');
  const [copied, setCopied] = useState(false);

  const {
    cruce,
    coeficienteConsanguinidad,
    seccion1_compatibilidad_linebreeding: sec1,
    seccion2_fortalezas: sec2,
    seccion3_riesgos: sec3,
    seccion4_cachorro_ideal: sec4,
    seccion5_valoracion_general: sec5,
  } = report;

  const handleCopySummary = () => {
    const text = `ANÁLISIS GENÉTICO DE CRUZA • ${cruce}
Coeficiente de Wright: ${coeficienteConsanguinidad}%
Veredicto: ${sec5.veredicto} (Puntuación: ${sec5.puntuacion}/10)
Tipo de Cruza: ${sec1.tipoCruza}

1. LINEBREEDING:
${sec1.resumen}

2. PRINCIPALES FORTALEZAS:
${sec2.items.map((it) => `- ${it.rasgo}: ${it.detalle}`).join('\n')}

3. RIESGOS A VIGILAR:
${sec3.items.map((it) => `- ${it.defectoOAlerta} (${it.probabilidad}): ${it.mitigacion}`).join('\n')}

4. CACHORRO IDEAL:
${sec4.morfologia}

5. DICTAMEN:
${sec5.dictamenFinal}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getVerdictBadge = (veredicto: string) => {
    switch (veredicto) {
      case 'ALTAMENTE_RECOMENDADA':
        return {
          label: 'Altamente Recomendada',
          bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'RECOMENDADA_CON_RESERVAS':
        return {
          label: 'Viable con Reservas Zootécnicas',
          bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
          dot: 'bg-amber-500',
        };
      case 'NO_RECOMENDADA':
        return {
          label: 'Apareamiento No Recomendado',
          bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: veredicto,
          bg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-500',
        };
    }
  };

  const verdict = getVerdictBadge(sec5.veredicto);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shrink-0 relative overflow-hidden border-b border-indigo-800/40">
          <div className="absolute right-0 top-0 w-80 h-full bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Análisis Genético Inteligente</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono font-medium">
                  Estándar POA / SV / WUSV
                </span>
                {source === 'gemini-ai' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-semibold border border-emerald-500/30">
                    Gemini 2.5 Flash
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>{cruce}</span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-1">
                Dictamen cinológico predictivo de consanguinidad, fenotipo, riesgos hereditarios y selección de camada
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar resumen al portapapeles"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Imprimir informe zootécnico"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-indigo-800/40 text-xs">
            <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-indigo-200/70 block uppercase font-bold">Consanguinidad (Fx)</span>
              <strong className="text-lg font-black text-white font-mono">{coeficienteConsanguinidad}%</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-indigo-200/70 block uppercase font-bold">Tipo de Cruzamiento</span>
              <strong className="text-xs font-bold text-indigo-200 block truncate">{sec1.tipoCruza}</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-indigo-200/70 block uppercase font-bold">Puntuación de Cruza</span>
              <strong className="text-lg font-black text-emerald-300 font-mono">{sec5.puntuacion} / 10</strong>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
              <span className="text-[10px] text-indigo-200/70 block uppercase font-bold">Veredicto Técnico</span>
              <span className="text-xs font-bold text-white block truncate">{verdict.label}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs overflow-x-auto shrink-0">
          {[
            { id: 'TODAS', label: 'Ver Informe Completo' },
            { id: 'LINEBREEDING', label: '1. Linebreeding' },
            { id: 'FORTALEZAS', label: '2. Fortalezas' },
            { id: 'RIESGOS', label: '3. Riesgos a Vigilar' },
            { id: 'SELECCION', label: '4. Cachorro Ideal' },
            { id: 'DICTAMEN', label: '5. Valoración y Dictamen' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 dark:text-slate-100">
          
          {/* SECTION 1: Linebreeding y compatibilidad */}
          {(activeTab === 'TODAS' || activeTab === 'LINEBREEDING') && (
            <section className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    <Dna className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      1. Compatibilidad Genética y Linebreeding
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evaluación de homozigosis, heterosis y antepasados influyentes
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
                  {sec1.tipoCruza}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 shadow-2xs">
                {sec1.resumen}
              </div>

              {/* Antepasados consanguíneos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Antepasados Consanguíneos en 4 Generaciones:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {sec1.antepasadosConsanguineos.map((ant, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm">
                          {ant.nombre}
                        </strong>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {ant.posicion}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                        {ant.influencia}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {sec1.analisisBiologico && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                  <strong>Análisis Biológico de Complementariedad:</strong> {sec1.analisisBiologico}
                </div>
              )}
            </section>
          )}

          {/* SECTION 2: Fortalezas */}
          {(activeTab === 'TODAS' || activeTab === 'FORTALEZAS') && (
            <section className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700/80">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    2. Principales Fortalezas de la Cruza
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Atributos morfológicos, sanitarios y de temperamento que se potencian
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sec2.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                        {item.rasgo}
                      </strong>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {item.origen}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.detalle}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: Riesgos y Defectos a Vigilar */}
          {(activeTab === 'TODAS' || activeTab === 'RIESGOS') && (
            <section className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700/80">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    3. Principales Riesgos y Defectos a Vigilar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Posibles desvíos fenotípicos y directrices de prevención zootécnica
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sec3.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span>{item.defectoOAlerta}</span>
                      </strong>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                          item.probabilidad.toLowerCase().includes('alta')
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : item.probabilidad.toLowerCase().includes('media')
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        Probabilidad {item.probabilidad}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white block mb-0.5 font-semibold">
                        Pauta de Manejo y Mitigación:
                      </strong>
                      <span>{item.mitigacion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 4: Cachorro Ideal para Selección */}
          {(activeTab === 'TODAS' || activeTab === 'SELECCION') && (
            <section className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700/80">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    4. Cachorro Ideal para Selección (Pick of Litter)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Criterios zootécnicos para elegir el ejemplar de retención para plantel o pista
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                  <strong className="text-purple-700 dark:text-purple-300 block font-bold text-xs uppercase tracking-wide">
                    Morfología y Estructura Óptima
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sec4.morfologia}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                  <strong className="text-purple-700 dark:text-purple-300 block font-bold text-xs uppercase tracking-wide">
                    Temperamento y Temple Esperado
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sec4.temperamentoYCaracter}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                  <strong className="text-rose-700 dark:text-rose-400 block font-bold text-xs uppercase tracking-wide">
                    Criterios de Descarte para Cría
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sec4.criteriosDescarte}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                  <strong className="text-indigo-700 dark:text-indigo-300 block font-bold text-xs uppercase tracking-wide">
                    Test de Selección (Semana 7)
                  </strong>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {sec4.guiaSeleccionSemana7}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 5: Valoración General */}
          {(activeTab === 'TODAS' || activeTab === 'DICTAMEN') && (
            <section className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/70 dark:from-slate-850 dark:via-slate-900 dark:to-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-indigo-200/80 dark:border-indigo-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      5. Valoración General del Experto Cinológico
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dictamen final de viabilidad y proyección zootécnica
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold uppercase">
                      Puntuación
                    </span>
                    <strong className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">
                      {sec5.puntuacion} / 10
                    </strong>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border font-bold text-xs flex items-center gap-2 ${verdict.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${verdict.dot}`} />
                    <span>{verdict.label}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/60 shadow-2xs space-y-2">
                <strong className="text-slate-900 dark:text-white font-bold text-sm block">
                  Dictamen Técnico Final:
                </strong>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {sec5.dictamenFinal}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
                <strong className="text-slate-800 dark:text-slate-200 font-bold block">
                  Recomendaciones de Manejo y Cría:
                </strong>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sec5.recomendacionesManejo}
                </p>
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Criadero Canino POA</span>
            <span>•</span>
            <span>Simulador Predictivo AI</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold transition-colors cursor-pointer shadow-xs"
          >
            Cerrar Informe
          </button>
        </div>

      </div>
    </div>
  );
};
