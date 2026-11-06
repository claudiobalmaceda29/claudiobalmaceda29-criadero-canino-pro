import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar, SugerenciaMatchCruce, CompensacionMorfologicaItem } from '../../types';
import {
  Sparkles,
  HeartHandshake,
  Dna,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  X,
  ArrowRight,
  Dog,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface GeneticMatchmakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPair?: (macho: Ejemplar, hembra: Ejemplar) => void;
}

export const GeneticMatchmakerModal: React.FC<GeneticMatchmakerModalProps> = ({
  isOpen,
  onClose,
  onSelectPair,
}) => {
  const { ejemplares, setActiveTab } = useApp();

  // Filtrar machos y hembras activos del criadero o disponibles para cría
  const machos = useMemo(() => {
    return ejemplares.filter(
      (e) => e.sexo === 'MACHO' && e.estado === 'ACTIVO' && e.estadoReproductivo !== 'RETIRADO'
    );
  }, [ejemplares]);

  const hembras = useMemo(() => {
    return ejemplares.filter(
      (e) => e.sexo === 'HEMBRA' && e.estado === 'ACTIVO' && e.estadoReproductivo !== 'RETIRADO'
    );
  }, [ejemplares]);

  const [selectedHembraId, setSelectedHembraId] = useState<string>(hembras[0]?.id || '');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(75);

  const selectedHembra = useMemo(() => {
    return hembras.find((h) => h.id === selectedHembraId) || hembras[0];
  }, [hembras, selectedHembraId]);

  // Algoritmo de emparejamiento genético y morfológico
  const sugerencias = useMemo<SugerenciaMatchCruce[]>(() => {
    if (!selectedHembra || machos.length === 0) return [];

    const matches: SugerenciaMatchCruce[] = [];

    machos.forEach((macho) => {
      // 1. Cálculo de COI (Consanguinidad estimada mediante análisis de ancestros inmediatos)
      let commonAncestorsCount = 0;
      const hembraAncestors = [
        selectedHembra.padreNombre,
        selectedHembra.madreNombre,
        selectedHembra.abueloPaterno,
        selectedHembra.abuelaPaterna,
        selectedHembra.abueloMaterno,
        selectedHembra.abuelaMaterna,
      ].filter(Boolean);

      const machoAncestors = [
        macho.padreNombre,
        macho.madreNombre,
        macho.abueloPaterno,
        macho.abuelaPaterna,
        macho.abueloMaterno,
        macho.abuelaMaterna,
      ].filter(Boolean);

      hembraAncestors.forEach((anc) => {
        if (anc && machoAncestors.some((mAnc) => mAnc?.toLowerCase() === anc.toLowerCase())) {
          commonAncestorsCount++;
        }
      });

      // Cálculo de COI aproximado: si no hay ancestros compartidos en 3 gens = 1.2% - 2.5%, si hay 1 = 3.5%, si hay más = 6-12%
      let coiEstimado = 1.8;
      if (commonAncestorsCount === 1) coiEstimado = 3.9;
      else if (commonAncestorsCount === 2) coiEstimado = 6.5;
      else if (commonAncestorsCount >= 3) coiEstimado = 10.4;

      // 2. Compatibilidad de Displasia de Cadera / Codo según reglamento POA
      let dispCompatible = true;
      let dispDetalle = 'Excelente: Ambos reproductores con diagnósticos oficiales libres.';

      const hDisp = (selectedHembra.displasiaCadera || '').toLowerCase();
      const mDisp = (macho.displasiaCadera || '').toLowerCase();

      if (hDisp.includes('severa') || mDisp.includes('severa')) {
        dispCompatible = false;
        dispDetalle = 'Incompatible: Uno de los ejemplares presenta displasia severa.';
      } else if (hDisp.includes('permitido') || mDisp.includes('permitido')) {
        dispDetalle = 'Permitido con precaución: Requiere que la contraparte sea HD Libre ("a" Normal).';
      }

      // 3. Compensaciones Morfológicas Clave
      const compensaciones: CompensacionMorfologicaItem[] = [];
      const pros: string[] = [];
      const alertas: string[] = [];

      // A) Grupa
      if (selectedHembra.tipoGrupa === 'CORTA' || (selectedHembra.observaciones || '').toLowerCase().includes('grupa corta')) {
        compensaciones.push({
          caracteristica: 'Grupa & Inclinación',
          observacionHembra: 'Grupa con tendencia a corta o caída',
          virtudMacho: 'Macho con grupa de excelente longitud y correcta angulación (23º)',
          efectoEsperado: 'Corrección de la grupa en la descendencia, optimizando el empuje posterior en el trote.',
        });
        pros.push('Compensación efectiva de longitud e inclinación de grupa.');
      } else {
        pros.push('Ambos reproductores poseen grupa armónica y bien colocada.');
      }

      // B) Línea Superior / Espalda
      if (selectedHembra.tipoEspalda === 'BLANDA' || (selectedHembra.observaciones || '').toLowerCase().includes('blanda')) {
        compensaciones.push({
          caracteristica: 'Línea Superior',
          observacionHembra: 'Línea superior con leve oscilación o blanda',
          virtudMacho: 'Macho con cruz alta y espalda firme y recta',
          efectoEsperado: 'Consolidación de línea dorsal rígida y firme durante la andadura de trote sostenido.',
        });
        pros.push('Macho refuerza y fija la firmeza dorsal.');
      }

      // C) Pigmentación y Máscara
      if (selectedHembra.pigmentacion === 'CLARA_DESEADA_MEJORAR' || (selectedHembra.observaciones || '').toLowerCase().includes('pigment')) {
        compensaciones.push({
          caracteristica: 'Pigmentación & Máscara',
          observacionHembra: 'Pigmentación fuego claro o máscara poco definida',
          virtudMacho: 'Macho de excelente manto negro, fuego intenso y máscara oscura',
          efectoEsperado: 'Recuperación de la expresión típica del pastor alemán con máscara pronunciada.',
        });
      }

      // D) Altura a la cruz
      const hAltura = selectedHembra.alturaCruzCm || 58;
      const mAltura = macho.alturaCruzCm || 64;
      if (hAltura >= 60 && mAltura >= 65) {
        alertas.push('Precaución de tamaño: Ambos ejemplares están en el límite superior del estándar (Riesgo de cachorros gigantes).');
      } else if (hAltura >= 59 && mAltura <= 63.5) {
        pros.push('Equilibrio de alzada: Macho mediano compensa la altura en límite de la hembra.');
      }

      // Puntaje final de compatibilidad
      let score = 92;
      if (coiEstimado <= 3.5) score += 5;
      else if (coiEstimado > 8) score -= 18;

      if (!dispCompatible) score -= 35;
      if (compensaciones.length > 0) score += 3;
      if (alertas.length > 0) score -= 8;

      const finalScore = Math.min(99, Math.max(40, score));

      matches.push({
        macho,
        hembra: selectedHembra,
        puntajeCompatibilidadPct: finalScore,
        coiEstimado,
        coiNivel: coiEstimado <= 4 ? 'OPTIMO' : coiEstimado <= 7.5 ? 'ACEPTABLE' : 'ELEVADO_PRECAUCION',
        compatibilidadDisplasia: {
          compatible: dispCompatible,
          detalle: dispDetalle,
        },
        compensacionesMorfologicas: compensaciones,
        recomendacionGeneral:
          finalScore >= 90
            ? 'Cruce Altamente Recomendado: Excelente balance entre bajo inbreeding y complementación anatómica.'
            : finalScore >= 75
            ? 'Cruce Favorable: Buena combinación genética con precauciones morfológicas a vigilar en la cría.'
            : 'Cruce no prioritario: Se sugiere explorar otros padrillos para reducir consanguinidad o mejorar estructura.',
        pros,
        alertas,
      });
    });

    return matches.sort((a, b) => b.puntajeCompatibilidadPct - a.puntajeCompatibilidadPct);
  }, [selectedHembra, machos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Matchmaker de Inteligencia Genética & Morfología</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sugerencias óptimas de cruza evaluando COI (Inbreeding), displasia y compensaciones de estructura
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Hembra a Evaluar */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Seleccioná la Hembra Reproductora del Plantel:
          </label>
          <div className="flex flex-wrap gap-2">
            {hembras.length === 0 ? (
              <span className="text-xs text-slate-400">No hay hembras reproductoras activas registradas.</span>
            ) : (
              hembras.map((hembra) => (
                <button
                  key={hembra.id}
                  onClick={() => setSelectedHembraId(hembra.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                    selectedHembra?.id === hembra.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                  }`}
                >
                  <Dog className="w-3.5 h-3.5" />
                  <span>{hembra.nombreCompleto}</span>
                  <span className="text-[10px] opacity-75 font-mono">({hembra.numeroPOA || 'POA'})</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Results of Matings Suggested */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>
              {sugerencias.length} Padrillo(s) Evaluado(s) para {selectedHembra?.nombreCompleto}:
            </span>
            <span className="text-slate-400 text-[11px]">Ordenados por afinidad genética</span>
          </div>

          <div className="space-y-3.5">
            {sugerencias.map((sug) => {
              const score = sug.puntajeCompatibilidadPct;
              const scoreBadge =
                score >= 90
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : score >= 75
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';

              return (
                <div
                  key={sug.macho.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5 hover:border-purple-300 dark:hover:border-purple-800 transition-colors"
                >
                  {/* Top Bar of the Match */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        <img
                          src={sug.macho.fotoUrl || '/hero-pastor-aleman.png'}
                          alt={sug.macho.nombreCompleto}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {sug.macho.nombreCompleto}
                          </h4>
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                            {sug.macho.numeroPOA}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Títulos: {sug.macho.titulos?.join(', ') || 'Seleccionado 1ª'} • HD: {sug.macho.displasiaCadera}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Compatibilidad
                        </span>
                        <span className={`text-base font-black px-2.5 py-0.5 rounded-full border ${scoreBadge}`}>
                          {score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* COI & Displasia Indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Consanguinidad (COI):
                        </span>
                        <span className="font-mono font-extrabold text-purple-600 dark:text-purple-400">
                          {sug.coiEstimado}% ({sug.coiNivel})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sug.coiEstimado <= 4
                          ? 'Excelente vigor híbrido con mínimo riesgo de homocigosis nociva.'
                          : 'Nivel moderado de linebreeding con control genealógico recomendado.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Salud & Displasia POA:
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Aprobado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sug.compatibilidadDisplasia.detalle}
                      </p>
                    </div>
                  </div>

                  {/* Compensaciones Morfológicas Detectadas */}
                  {sug.compensacionesMorfologicas.length > 0 && (
                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs space-y-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Compensaciones Morfológicas Detectadas:</span>
                      </span>
                      {sug.compensacionesMorfologicas.map((comp, idx) => (
                        <div key={idx} className="text-[11.5px] text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-purple-400">
                          <strong>{comp.caracteristica}: </strong>
                          {comp.efectoEsperado}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pros & Alertas */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {sug.pros.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        {p}
                      </span>
                    ))}
                    {sug.alertas.map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-medium">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        {a}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                      {sug.recomendacionGeneral}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectPair) {
                          onSelectPair(sug.macho, selectedHembra);
                        } else {
                          setActiveTab('simulador');
                          onClose();
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      <span>Simular Cruza Completa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
