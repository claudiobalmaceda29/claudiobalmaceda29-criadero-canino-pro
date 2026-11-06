import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar, CompensacionMorfologicaItem } from '../../types';
import {
  evaluarEdadReglamentariaPOA,
  evaluarConsanguinidadSV,
  evaluarCriaDeSeleccionPremium,
  evaluarCompatibilidadSaludArticular,
  EvaluacionConsanguinidadSVResult,
  EvaluacionCriaSeleccionResult,
  EvaluacionSaludArticularResult,
  EvaluacionEdadPOAResult,
} from '../../utils/poaRegulations';
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
  HelpCircle,
  Ban,
  ShieldAlert,
  Star,
} from 'lucide-react';

interface MatchmakerItem {
  macho: Ejemplar;
  hembra: Ejemplar;
  puntajeCompatibilidadPct: number;
  evalSV: EvaluacionConsanguinidadSVResult;
  evalPremium: EvaluacionCriaSeleccionResult;
  evalArticular: EvaluacionSaludArticularResult;
  evalEdadMacho: EvaluacionEdadPOAResult;
  compensacionesMorfologicas: CompensacionMorfologicaItem[];
  pros: string[];
  alertas: string[];
  estaBloqueado: boolean;
  motivoBloqueo?: string;
}

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
  const [selectedHembraId, setSelectedHembraId] = useState<string>('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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

  // Hembra seleccionada
  const selectedHembra = useMemo(() => {
    if (!selectedHembraId && hembras.length > 0) return hembras[0];
    return hembras.find((h) => h.id === selectedHembraId) || hembras[0];
  }, [hembras, selectedHembraId]);

  // Evaluación de edad reglamentaria de la hembra
  const evalEdadHembra = useMemo(() => {
    if (!selectedHembra) return null;
    return evaluarEdadReglamentariaPOA(selectedHembra);
  }, [selectedHembra]);

  // Algoritmo de emparejamiento genético y morfológico con lógica dura POA
  const sugerencias = useMemo<MatchmakerItem[]>(() => {
    if (!selectedHembra || machos.length === 0) return [];

    const matches: MatchmakerItem[] = [];

    machos.forEach((macho) => {
      // 1. Evaluación de Consanguinidad SV y Semáforos Oficiales
      const evalSV = evaluarConsanguinidadSV(macho, selectedHembra);

      // 2. Evaluación de Salud Articular (HD/ED)
      const evalArticular = evaluarCompatibilidadSaludArticular(macho, selectedHembra);

      // 3. Evaluación de Edad Reglamentaria del Macho
      const evalEdadMacho = evaluarEdadReglamentariaPOA(macho);

      // 4. Evaluación de Cría de Selección (Premium)
      const evalPremium = evaluarCriaDeSeleccionPremium(macho, selectedHembra);

      // 5. Compensaciones Morfológicas
      const compensaciones: CompensacionMorfologicaItem[] = [];
      const pros: string[] = [];
      const alertas: string[] = [];

      // A) Grupa
      if (selectedHembra.tipoGrupa === 'CORTA' || (selectedHembra.observaciones || '').toLowerCase().includes('grupa corta')) {
        compensaciones.push({
          caracteristica: 'Grupa & Inclinación',
          observacionHembra: 'Grupa con tendencia a corta o caída',
          virtudMacho: 'Macho con grupa de excelente longitud y correcta angulación (23º)',
          efectoEsperado: 'Corrección de la longitud de grupa en la progenie para optimizar el empuje posterior en el trote.',
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
        alertas.push('Precaución de tamaño: Ambos ejemplares en límite superior del estándar.');
      } else if (hAltura >= 59 && mAltura <= 63.5) {
        pros.push('Equilibrio de alzada: Macho mediano compensa la altura de la hembra.');
      }

      // Chequeo de Bloqueo General
      let estaBloqueado = false;
      let motivoBloqueo: string | undefined = undefined;

      if (evalSV.bloqueado) {
        estaBloqueado = true;
        motivoBloqueo = evalSV.mensajeAlerta;
      } else if (evalArticular.bloqueadoPorDisplasia) {
        estaBloqueado = true;
        motivoBloqueo = evalArticular.mensaje;
      } else if (!evalEdadMacho.valida) {
        estaBloqueado = true;
        motivoBloqueo = evalEdadMacho.alertaTexto;
      } else if (evalEdadHembra && !evalEdadHembra.valida) {
        estaBloqueado = true;
        motivoBloqueo = evalEdadHembra.alertaTexto;
      }

      // Puntaje final de afinidad genética
      let score = 90;
      if (evalPremium.esPremium) score += 8; // Bonificación Cría de Selección Premium
      if (evalSV.semaforo === 'VERDE') score += 4;
      if (evalSV.semaforo === 'AMARILLO') score -= 10;
      if (evalSV.semaforo === 'ROJO') score = 20;

      if (evalArticular.alertaAmarillaPrecaucion) score -= 8;
      if (evalArticular.bloqueadoPorDisplasia) score = 15;
      if (!evalEdadMacho.valida) score = 10;

      if (compensaciones.length > 0) score += 3;

      const finalScore = Math.min(99, Math.max(10, score));

      matches.push({
        macho,
        hembra: selectedHembra,
        puntajeCompatibilidadPct: finalScore,
        evalSV,
        evalPremium,
        evalArticular,
        evalEdadMacho,
        compensacionesMorfologicas: compensaciones,
        pros,
        alertas,
        estaBloqueado,
        motivoBloqueo,
      });
    });

    // Ordenar priorizando:
    // 1) NO bloqueados arriba
    // 2) Cría de Selección Premium
    // 3) Mayor puntaje de compatibilidad
    return matches.sort((a, b) => {
      if (a.estaBloqueado !== b.estaBloqueado) {
        return a.estaBloqueado ? 1 : -1;
      }
      if (a.evalPremium.esPremium !== b.evalPremium.esPremium) {
        return a.evalPremium.esPremium ? -1 : 1;
      }
      return b.puntajeCompatibilidadPct - a.puntajeCompatibilidadPct;
    });
  }, [selectedHembra, machos, evalEdadHembra]);

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
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Matchmaker Genético Inteligente</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                  Reglamento POA / SV
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semáforos de consanguinidad, límites de edad, cría de selección y salud articular oficial.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE EDAD DE LA HEMBRA (Si está fuera de rango) */}
        {evalEdadHembra && !evalEdadHembra.valida && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-3 animate-pulse">
            <Ban className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="block text-sm font-black">
                {evalEdadHembra.alertaTexto}
              </strong>
              <span>
                {selectedHembra?.nombreCompleto} tiene {evalEdadHembra.edadTexto}. El reglamento oficial POA prohíbe el servicio de hembras menores a 20 meses o mayores a 8 años (96 meses).
              </span>
            </div>
          </div>
        )}

        {/* Selector de Hembra a Evaluar */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Seleccioná la Hembra Reproductora del Plantel:
            </label>
            {evalEdadHembra && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                evalEdadHembra.valida
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                Edad: {evalEdadHembra.edadTexto} {evalEdadHembra.valida ? '✓ Apta' : '✗ Bloqueada'}
              </span>
            )}
          </div>

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
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Cría de Selección Priorizada</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {sugerencias.map((sug) => {
              const { evalSV, evalPremium, evalArticular, evalEdadMacho } = sug;
              const isBlocked = sug.estaBloqueado;

              // Semáforo de Consanguinidad SV styling
              const semaforoBg =
                evalSV.semaforo === 'ROJO'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                  : evalSV.semaforo === 'AMARILLO'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200';

              const semaforoBadge =
                evalSV.semaforo === 'ROJO'
                  ? 'bg-rose-600 text-white'
                  : evalSV.semaforo === 'AMARILLO'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white';

              return (
                <div
                  key={sug.macho.id}
                  className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-3.5 transition-all ${
                    isBlocked
                      ? 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 opacity-90'
                      : evalPremium.esPremium
                      ? 'bg-gradient-to-br from-amber-50/30 via-white to-purple-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-purple-950/20 border-amber-300 dark:border-amber-800 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  {/* Top Bar of the Match */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative">
                        <img
                          src={sug.macho.fotoUrl || '/hero-pastor-aleman.png'}
                          alt={sug.macho.nombreCompleto}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {sug.macho.nombreCompleto}
                          </h4>
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                            {sug.macho.numeroPOA || 'POA-S/N'}
                          </span>

                          {/* Badge de Cría de Selección (Premium) */}
                          {evalPremium.esPremium && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Cría de Selección (Premium)</span>
                            </span>
                          )}

                          {/* Badge de Fuera de Edad Macho */}
                          {!evalEdadMacho.valida && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                              Macho menor a 24 meses ({evalEdadMacho.edadTexto})
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          HD: <strong className="text-slate-700 dark:text-slate-200">{sug.macho.displasiaCadera}</strong> • ED: <strong className="text-slate-700 dark:text-slate-200">{sug.macho.displasiaCodo}</strong> • Selección: {sug.macho.calificacionCria || 'Sin Körung'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Afinidad Genética
                        </span>
                        <span className={`text-base font-black px-2.5 py-0.5 rounded-full border ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : sug.puntajeCompatibilidadPct >= 90
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}>
                          {sug.puntajeCompatibilidadPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BANNER DE SEMÁFORO DE CONSANGUINIDAD SV */}
                  <div className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${semaforoBg}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${semaforoBadge}`}>
                          {evalSV.semaforo === 'ROJO' ? 'Bloqueo 1-2 / 2-2' : evalSV.semaforo === 'AMARILLO' ? 'Semáforo Amarillo' : 'Semáforo Verde'}
                        </span>
                        <strong className="text-xs font-black">
                          Notación SV: {evalSV.notacionSV}
                        </strong>
                        <span className="font-mono text-[11px]">
                          (Wright COI: {evalSV.coiWrightPct}%)
                        </span>

                        {/* Tooltip Educativo [?] */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setActiveTooltip(activeTooltip === sug.macho.id ? null : sug.macho.id)}
                            className="p-0.5 rounded-full hover:bg-black/10 text-slate-500 hover:text-slate-900 cursor-pointer"
                            title="¿Qué significa Wright COI vs Fórmula SV?"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>

                          {activeTooltip === sug.macho.id && (
                            <div className="absolute left-0 top-6 z-40 w-80 p-3 rounded-xl bg-slate-950 text-white text-[11px] shadow-2xl border border-slate-700 space-y-2 animate-in fade-in">
                              <div className="font-bold text-amber-300 flex items-center justify-between">
                                <span>Normativa Consanguinidad POA / SV</span>
                                <button type="button" onClick={() => setActiveTooltip(null)} className="text-xs">✕</button>
                              </div>
                              <p>{evalSV.explicacionTooltip}</p>
                              <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                                <strong>Rojo:</strong> Cruces 1-2, 2-1, 2-2 (Prohibidos).<br />
                                <strong>Amarillo:</strong> Cruces 3-2, 2-3, 3-3 (Linebreeding estricto).<br />
                                <strong>Verde:</strong> 4-4, 5-4, 5-5 o 0% (Vigor Híbrido Ideal).
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="font-medium text-[11.5px]">
                        {evalSV.mensajeAlerta}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold block opacity-75">Reglamento POA</span>
                      <span className="font-black text-xs">
                        {evalSV.bloqueado ? '❌ No Reconocido' : '✓ Reglamentario'}
                      </span>
                    </div>
                  </div>

                  {/* ALERTA DE SALUD ARTICULAR (DISPLASIA) */}
                  {evalArticular.bloqueadoPorDisplasia && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                      <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{evalArticular.mensaje}</span>
                    </div>
                  )}

                  {evalArticular.alertaAmarillaPrecaucion && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{evalArticular.mensaje}</span>
                    </div>
                  )}

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

                  {/* Bottom Action Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      {isBlocked ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                          <Ban className="w-4 h-4" />
                          <span>{sug.motivoBloqueo || 'Cruce bloqueado por reglamento POA.'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                          {evalPremium.esPremium
                            ? '⭐ Cruce prioritario de Selección: Aporta máxima pureza y pedigree calificado.'
                            : 'Cruce válido para libro de cría POA.'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isBlocked}
                      onClick={() => {
                        if (onSelectPair) {
                          onSelectPair(sug.macho, selectedHembra);
                        } else {
                          setActiveTab('montas');
                        }
                        onClose();
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                        isBlocked
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                          : evalPremium.esPremium
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white shadow-md'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      <span>{isBlocked ? 'Cruce Bloqueado' : 'Seleccionar para Monta'}</span>
                      <ArrowRight className="w-4 h-4" />
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
