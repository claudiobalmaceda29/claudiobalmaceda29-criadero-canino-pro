import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Insumo, Ejemplar } from '../../types';
import {
  ShoppingBag,
  Scale,
  Dog,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';

interface FoodRationAutoDeductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FoodRationAutoDeductModal: React.FC<FoodRationAutoDeductModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { ejemplares, insumos, updateInsumo, currentCriaderoId } = useApp();

  // Filtrar ejemplares activos del criadero
  const activeDogs = useMemo(() => {
    return ejemplares.filter((e) => e.estado === 'ACTIVO' && e.esDelPlantel !== false);
  }, [ejemplares]);

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

  // Cálculo de ración total diaria en gramos y en kilogramos
  const { totalGramosDia, dogsWithRation, dogsWithoutRation } = useMemo(() => {
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
      totalGramosDia: total,
      dogsWithRation: withRation,
      dogsWithoutRation: withoutRation,
    };
  }, [activeDogs]);

  const totalKgDia = totalGramosDia / 1000;
  const totalKgADescontar = (totalGramosDia * diasADescontar) / 1000;

  const targetInsumo = useMemo(() => {
    return insumos.find((i) => i.id === selectedInsumoId) || foodInsumos[0];
  }, [insumos, selectedInsumoId, foodInsumos]);

  // Proyección de cuántos días durará el stock actual con el consumo diario
  const diasRestantesStock = useMemo(() => {
    if (!targetInsumo || totalKgDia <= 0) return null;
    let stockTotalKg = targetInsumo.cantidadActual;
    // Si la unidad es bolsas y tiene pesoPorUnidadKg
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

      const nuevoMovimiento = {
        id: `mov-${Date.now()}`,
        fecha: new Date().toISOString(),
        tipo: 'CONSUMO' as const,
        cantidad: cantidadDescontada,
        motivo: `Consumo diario de ${diasADescontar} día(s) para ${dogsWithRation.length} ejemplares activos (${totalKgADescontar.toFixed(2)} kg)`,
        usuarioNombre: 'Descuento Automático',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
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
                Cálculo automático de consumo del plantel y sincronización de stock
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
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
            {/* KPI Cards: Resumen de Consumo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">
                  Perros con Ración
                </span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-100">
                  {dogsWithRation.length} <span className="text-xs font-normal text-slate-500">/ {activeDogs.length}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">
                  Consumo Diario Total
                </span>
                <span className="text-lg font-black text-amber-900 dark:text-amber-100">
                  {totalKgDia.toFixed(2)} <span className="text-xs font-bold">kg/día</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">({totalGramosDia} gramos)</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                  Duración de Stock
                </span>
                <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                  {diasRestantesStock !== null ? `${diasRestantesStock} días` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Aviso si hay perros sin ración configurada */}
            {dogsWithoutRation.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Hay <strong>{dogsWithoutRation.length} ejemplar(es)</strong> sin ración configurada (ej. {dogsWithoutRation[0]?.nombreCompleto}).
                  </span>
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d} {d === 1 ? 'Día' : 'Días'}
                  </button>
                ))}
              </div>
            </div>

            {/* Detalle del cálculo a ejecutar */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-blue-950/20 border border-blue-100 dark:border-blue-900 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Ración unitaria acumulada:</span>
                <span className="font-mono font-bold">{totalKgDia.toFixed(2)} kg/día</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Días seleccionados:</span>
                <span className="font-mono font-bold">x {diasADescontar} días</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Total a Descontar:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
