import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Insumo, Ejemplar } from '../../types';
import {
  Scale,
  Dog,
  Baby,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  X,
  RefreshCw,
  Info,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  calcularConsumoCamadaConFreno,
  obtenerEtapaNutricionalCachorro,
} from '../../utils/puppyNutrition';

interface FoodRationAutoDeductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FoodRationAutoDeductModal: React.FC<FoodRationAutoDeductModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { ejemplares, insumos, updateInsumo, camadas, cachorros } = useApp();

  // 1. REQUERIMIENTO 1: Filtrar ejemplares cuyo estado sea estrictamente 'ACTIVO'
  // Perros con estado 'RETIRADO', 'FALLECIDO', 'VENDIDO' o 'EN_ENTRENAMIENTO' quedan expresamente excluidos
  const activeDogs = useMemo(() => {
    return ejemplares.filter((e) => {
      const pres = e.estadoPresencia || (e.estado as string);
      return pres === 'ACTIVO' && e.esDelPlantel !== false;
    });
  }, [ejemplares]);

  const inactiveDogs = useMemo(() => {
    return ejemplares.filter((e) => {
      const pres = e.estadoPresencia || (e.estado as string);
      return pres !== 'ACTIVO' || e.esDelPlantel === false;
    });
  }, [ejemplares]);

  // Cálculo de ración de adultos
  const { totalGramosDiaAdultos, dogsWithRation, dogsWithoutRation } = useMemo(() => {
    let total = 0;
    const withRation: Ejemplar[] = [];
    const withoutRation: Ejemplar[] = [];

    activeDogs.forEach((dog) => {
      if (dog.racionDiariaGramos && dog.racionDiariaGramos > 0) {
        total += dog.racionDiariaGramos;
        withRation.push(dog);
      } else {
        withoutRation.push(dog);
      }
    });

    return {
      totalGramosDiaAdultos: total,
      dogsWithRation: withRation,
      dogsWithoutRation: withoutRation,
    };
  }, [activeDogs]);

  // 2. REQUERIMIENTO 2 & 3: Etapas de alimentación dinámica y freno de racionamiento para cachorros entregados
  const consumoCamadasDetalle = useMemo(() => {
    return camadas
      .filter((c) => c.estado !== 'CANCELADA' && c.fechaNacimiento)
      .map((c) => calcularConsumoCamadaConFreno(c, cachorros));
  }, [camadas, cachorros]);

  // Camadas que ya cumplieron los 28 días y tienen cachorros en criadero
  const camadasConsumiendo = useMemo(() => {
    return consumoCamadasDetalle.filter(
      (cd) => cd.etapa.consumeAlimentoStock && cd.cachorrosConsumiendoActivos > 0
    );
  }, [consumoCamadasDetalle]);

  // Camadas menores a 28 días (en lactancia materna exclusiva - consumo 0)
  const camadasEnLactancia = useMemo(() => {
    return consumoCamadasDetalle.filter((cd) => !cd.etapa.consumeAlimentoStock);
  }, [consumoCamadasDetalle]);

  const totalGramosDiaCachorros = useMemo(() => {
    return camadasConsumiendo.reduce(
      (sum, cd) => sum + cd.consumoTotalCamadaGramosDia,
      0
    );
  }, [camadasConsumiendo]);

  const totalCachorrosConsumiendo = useMemo(() => {
    return camadasConsumiendo.reduce(
      (sum, cd) => sum + cd.cachorrosConsumiendoActivos,
      0
    );
  }, [camadasConsumiendo]);

  const totalCachorrosEntregadosFreno = useMemo(() => {
    return consumoCamadasDetalle.reduce(
      (sum, cd) => sum + cd.cachorrosEntregados,
      0
    );
  }, [consumoCamadasDetalle]);

  // Filtro de categoría a descontar: 'TODOS' | 'ADULTOS' | 'CACHORROS'
  const [tipoConsumoFiltro, setTipoConsumoFiltro] = useState<'TODOS' | 'ADULTOS' | 'CACHORROS'>('TODOS');

  // Ítems de Alimento en Insumos
  const foodInsumos = useMemo(() => {
    return insumos.filter((i) => i.categoria === 'ALIMENTO' && i.cantidadActual > 0);
  }, [insumos]);

  const [selectedInsumoId, setSelectedInsumoId] = useState<string>(
    foodInsumos[0]?.id || ''
  );
  const [diasADescontar, setDiasADescontar] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Total acumulado según filtro
  const totalGramosDia = useMemo(() => {
    if (tipoConsumoFiltro === 'ADULTOS') return totalGramosDiaAdultos;
    if (tipoConsumoFiltro === 'CACHORROS') return totalGramosDiaCachorros;
    return totalGramosDiaAdultos + totalGramosDiaCachorros;
  }, [tipoConsumoFiltro, totalGramosDiaAdultos, totalGramosDiaCachorros]);

  const totalKgDia = totalGramosDia / 1000;
  const totalKgADescontar = (totalGramosDia * diasADescontar) / 1000;

  const targetInsumo = useMemo(() => {
    return insumos.find((i) => i.id === selectedInsumoId) || foodInsumos[0];
  }, [insumos, selectedInsumoId, foodInsumos]);

  // Proyección de cuántos días durará el stock actual con el consumo diario
  const diasRestantesStock = useMemo(() => {
    if (!targetInsumo || totalKgDia <= 0) return null;
    let stockTotalKg = targetInsumo.cantidadActual;
    if (targetInsumo.unidadMedida === 'BOLSAS' && targetInsumo.pesoPorUnidadKg) {
      stockTotalKg = targetInsumo.cantidadActual * targetInsumo.pesoPorUnidadKg;
    }
    return Math.floor(stockTotalKg / totalKgDia);
  }, [targetInsumo, totalKgDia]);

  const handleEjecutarDescuento = async () => {
    if (!targetInsumo || totalKgADescontar <= 0) return;
    setIsProcessing(true);

    try {
      let nuevaCantidad = targetInsumo.cantidadActual;
      let cantidadDescontada = totalKgADescontar;

      if (targetInsumo.unidadMedida === 'KILOS' || (targetInsumo.unidadMedida as string) === 'KG') {
        nuevaCantidad = Math.max(0, targetInsumo.cantidadActual - totalKgADescontar);
      } else if (targetInsumo.unidadMedida === 'BOLSAS' && targetInsumo.pesoPorUnidadKg) {
        const bolsasConsumidas = totalKgADescontar / targetInsumo.pesoPorUnidadKg;
        nuevaCantidad = Math.max(0, Number((targetInsumo.cantidadActual - bolsasConsumidas).toFixed(2)));
        cantidadDescontada = bolsasConsumidas;
      } else {
        nuevaCantidad = Math.max(0, targetInsumo.cantidadActual - diasADescontar);
      }

      const motivoTexto = [
        `Consumo diario de ${diasADescontar} día(s)`,
        tipoConsumoFiltro === 'ADULTOS'
          ? `(${dogsWithRation.length} ejemplares adultos estrictamente ACTIVOS)`
          : tipoConsumoFiltro === 'CACHORROS'
          ? `(${totalCachorrosConsumiendo} cachorros en criadero >=28 días, ${totalCachorrosEntregadosFreno} entregados excluidos)`
          : `(${dogsWithRation.length} adultos activos + ${totalCachorrosConsumiendo} cachorros)`,
        `Total: ${totalKgADescontar.toFixed(2)} kg`,
      ].join(' • ');

      const nuevoMovimiento = {
        id: `mov-${Date.now()}`,
        fecha: new Date().toISOString(),
        tipo: 'CONSUMO' as const,
        cantidad: cantidadDescontada,
        motivo: motivoTexto,
        usuarioNombre: 'Descuento Automático de Raciones',
      };

      const historialPrevio = targetInsumo.historialMovimientos || [];

      await updateInsumo(targetInsumo.id, {
        cantidadActual: nuevaCantidad,
        consumoDiarioEstimado: totalKgDia,
        historialMovimientos: [nuevoMovimiento, ...historialPrevio],
        ultimaActualizacion: new Date().toISOString(),
      });

      setSuccessMessage(
        `¡Descuento registrado con éxito! Se descontaron ${totalKgADescontar.toFixed(2)} kg de ${targetInsumo.nombre}. Nuevo stock: ${nuevaCantidad} ${targetInsumo.unidadMedida}.`
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Error al descontar stock de alimento:', err);
      alert('Error al actualizar el stock en base de datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Racionamiento y Descuento de Alimento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lógica nutricional: Plantel Activo, Etapas de Cachorros (28d+) y Freno por Entrega
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Segment Selector: Qué grupo descontar */}
            <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTipoConsumoFiltro('TODOS')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  tipoConsumoFiltro === 'TODOS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Todo el Criadero
              </button>
              <button
                type="button"
                onClick={() => setTipoConsumoFiltro('ADULTOS')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  tipoConsumoFiltro === 'ADULTOS'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Dog className="w-3.5 h-3.5" />
                <span>Solo Adultos ({activeDogs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTipoConsumoFiltro('CACHORROS')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  tipoConsumoFiltro === 'CACHORROS'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Baby className="w-3.5 h-3.5" />
                <span>Solo Cachorros ({totalCachorrosConsumiendo})</span>
              </button>
            </div>

            {/* KPI Cards: Resumen de Consumo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                  Consumo Adultos Activos
                </span>
                <span className="text-base font-black text-blue-900 dark:text-blue-100">
                  {(totalGramosDiaAdultos / 1000).toFixed(2)} <span className="text-xs">kg/d</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {dogsWithRation.length} de {activeDogs.length} activos
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">
                  Consumo Cachorros (≥28d)
                </span>
                <span className="text-base font-black text-amber-900 dark:text-amber-100">
                  {(totalGramosDiaCachorros / 1000).toFixed(2)} <span className="text-xs">kg/d</span>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {totalCachorrosConsumiendo} comiendo en criadero
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                  Total Seleccionado
                </span>
                <span className="text-base font-black text-emerald-900 dark:text-emerald-100">
                  {totalKgDia.toFixed(2)} <span className="text-xs">kg/día</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                  {diasRestantesStock !== null ? `${diasRestantesStock} días de stock` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Freno de Racionamiento y Exclusiones Auditadas */}
            <div className="space-y-2">
              {/* Alerta de Perros Inactivos Excluidos */}
              {inactiveDogs.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Filtro de Estado:</strong> Se excluyeron {inactiveDogs.length} ejemplar(es) no activos ({inactiveDogs.map((d) => `${d.nombreCompleto} [${d.estadoPresencia || d.estado}]`).slice(0, 3).join(', ')}{inactiveDogs.length > 3 ? '...' : ''}).
                    </span>
                  </div>
                </div>
              )}

              {/* Freno de Racionamiento para Cachorros Entregados */}
              {totalCachorrosEntregadosFreno > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Freno de Racionamiento Activo:</strong> {totalCachorrosEntregadosFreno} cachorro(s) con estado <strong>ENTREGADO</strong> fueron restados automáticamente del cálculo. No consumen ración del criadero.
                  </span>
                </div>
              )}

              {/* Camadas en lactancia materna exclusiva (<28 días) */}
              {camadasEnLactancia.length > 0 && (
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 text-[11px] text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    <strong>Regla de los 28 Días:</strong> Camada(s) {camadasEnLactancia.map((c) => `"${c.camadaIdentificador}" (${c.diasVida} días)`).join(', ')} están en lactancia materna exclusiva (consumo de balanceado = 0 kg).
                  </span>
                </div>
              )}
            </div>

            {/* Detalle por Camadas Activas (≥28 días) */}
            {camadasConsumiendo.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block tracking-wider">
                  Etapas Nutricionales de Camadas en Criadero
                </span>
                <div className="space-y-1.5">
                  {camadasConsumiendo.map((cd) => (
                    <div
                      key={cd.camadaId}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-200/50 dark:border-amber-900/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-900 dark:text-white font-bold">{cd.camadaIdentificador}</strong>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${cd.etapa.badgeColor}`}>
                            {cd.etapa.nombreEtapa}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          {cd.etapa.indicacionNutricional}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 block text-xs">
                          {cd.consumoTotalCamadaKgDia.toFixed(2)} kg/día
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {cd.cachorrosConsumiendoActivos} cachorros x {cd.racionGramosPorCachorroDia}g
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de Insumo de Alimento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bolsa o Alimento a Descontar:
              </label>
              {foodInsumos.length === 0 ? (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                  No hay alimentos con stock disponible en el Inventario. Registrá una bolsa en la sección de Stock.
                </div>
              ) : (
                <select
                  value={selectedInsumoId}
                  onChange={(e) => setSelectedInsumoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                >
                  {foodInsumos.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nombre} • Stock Actual: {ins.cantidadActual} {ins.unidadMedida} {ins.pesoPorUnidadKg ? `(${ins.pesoPorUnidadKg} kg/u)` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selector de Días Transcurridos */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Días de consumo a registrar:
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 7, 15].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiasADescontar(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      diasADescontar === d
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d} {d === 1 ? 'Día' : 'Días'}
                  </button>
                ))}
              </div>
            </div>

            {/* Detalle del cálculo a ejecutar */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-amber-50/40 dark:from-slate-800/60 dark:to-amber-950/20 border border-amber-200/80 dark:border-amber-900 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Ración diaria del grupo seleccionado:</span>
                <span className="font-mono font-bold">{totalKgDia.toFixed(2)} kg/día</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Días seleccionados:</span>
                <span className="font-mono font-bold">x {diasADescontar} días</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total a Descontar de Inventario:</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">
                  {totalKgADescontar.toFixed(2)} kg
                </span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={isProcessing || foodInsumos.length === 0 || totalKgADescontar <= 0}
                onClick={handleEjecutarDescuento}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Confirmar Descuento de Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
