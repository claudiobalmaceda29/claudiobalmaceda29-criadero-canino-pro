import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TransaccionEconomica, TipoTransaccion, CategoriaEconomica } from '../../types';
import {
  CircleDollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  FolderKanban,
  Filter,
  DollarSign,
  X,
} from 'lucide-react';

export const EconomicsView: React.FC = () => {
  const { transacciones, camadas, addTransaccion, deleteTransaccion, currentCriaderoId, exportToCSV, openPrintModal } = useApp();

  const [filterMoneda, setFilterMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [filterTipo, setFilterTipo] = useState<'TODOS' | 'INGRESO' | 'GASTO'>('TODOS');
  const [filterCamada, setFilterCamada] = useState<string>('TODAS');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [tipo, setTipo] = useState<TipoTransaccion>('GASTO');
  const [categoria, setCategoria] = useState<CategoriaEconomica>('ALIMENTACION');
  const [monto, setMonto] = useState<number>(0);
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('');
  const [camadaId, setCamadaId] = useState('');
  const [comprobanteNumero, setComprobanteNumero] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Calculations scoped by active currency
  const txCurrentCurrency = useMemo(
    () => transacciones.filter((t) => t.moneda === filterMoneda),
    [transacciones, filterMoneda]
  );

  const totalIngresos = useMemo(
    () =>
      txCurrentCurrency
        .filter((t) => t.tipo === 'INGRESO')
        .reduce((sum, t) => sum + t.monto, 0),
    [txCurrentCurrency]
  );

  const totalGastos = useMemo(
    () =>
      txCurrentCurrency
        .filter((t) => t.tipo === 'GASTO')
        .reduce((sum, t) => sum + t.monto, 0),
    [txCurrentCurrency]
  );

  const balanceNeto = totalIngresos - totalGastos;

  // Breakdown by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    txCurrentCurrency.forEach((t) => {
      map[t.categoria] = (map[t.categoria] || 0) + t.monto;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [txCurrentCurrency]);

  const filteredTx = useMemo(() => {
    return transacciones.filter((t) => {
      const matchMoneda = t.moneda === filterMoneda;
      const matchTipo = filterTipo === 'TODOS' || t.tipo === filterTipo;
      const matchCamada = filterCamada === 'TODAS' || t.camadaId === filterCamada;
      return matchMoneda && matchTipo && matchCamada;
    });
  }, [transacciones, filterMoneda, filterTipo, filterCamada]);

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || monto <= 0) return;

    addTransaccion({
      criaderoId: currentCriaderoId,
      tipo,
      categoria,
      monto,
      moneda,
      fecha,
      concepto,
      camadaId: camadaId || undefined,
      comprobanteNumero: comprobanteNumero || undefined,
      observaciones: observaciones || undefined,
    });

    setIsFormOpen(false);
    setConcepto('');
    setMonto(0);
    setComprobanteNumero('');
    setObservaciones('');
  };

  const handleExportCSV = () => {
    const rows = filteredTx.map((t) => ({
      Fecha: t.fecha,
      Tipo: t.tipo,
      Categoria: t.categoria,
      Monto: t.monto,
      Moneda: t.moneda,
      Concepto: t.concepto,
      CamadaId: t.camadaId || '',
      Comprobante: t.comprobanteNumero || '',
      Observaciones: t.observaciones || '',
    }));
    exportToCSV(`BALANCE_ECONOMICO_${filterMoneda}_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Gestión Económica y Balances
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control de ingresos, gastos, costos por camada y balances contables en Pesos (ARS) y Dólares (USD).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl text-xs">
            <button
              onClick={() => setFilterMoneda('ARS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMoneda === 'ARS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pesos (ARS)
            </button>
            <button
              onClick={() => setFilterMoneda('USD')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                filterMoneda === 'USD'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dólares (USD)
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            onClick={() => openPrintModal('ECONOMIC_REPORT', 'all')}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Imprimir Balance</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* KPI Stats in Selected Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ingresos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Total Ingresos ({filterMoneda})</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {filterMoneda === 'USD' ? 'USD $' : '$'} {totalIngresos.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Señas de reserva y ventas de cachorros
          </div>
        </div>

        {/* Total Gastos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Total Gastos ({filterMoneda})</span>
            <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
            {filterMoneda === 'USD' ? 'USD $' : '$'} {totalGastos.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Alimentos, veterinaria, ecografías y aranceles POA
          </div>
        </div>

        {/* Balance Neto */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-2">
            <span className="font-bold uppercase tracking-wider">Resultado Neto ({filterMoneda})</span>
            <CircleDollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div
            className={`text-2xl font-black font-mono ${
              balanceNeto >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {filterMoneda === 'USD' ? 'USD $' : '$'} {balanceNeto.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Margen neto acumulado
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo filter */}
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value as any)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="INGRESO">Solo Ingresos</option>
            <option value="GASTO">Solo Gastos</option>
          </select>

          {/* Camada filter */}
          <select
            value={filterCamada}
            onChange={(e) => setFilterCamada(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="TODAS">Todas las camadas (Rentabilidad)</option>
            {camadas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identificador}
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
          Mostrando {filteredTx.length} transacciones registradas
        </span>
      </div>

      {/* Transactions Table & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Libro Diario de Movimientos</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Moneda: {filterMoneda}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoría</th>
                  <th className="p-3">Concepto</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{tx.fecha}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.tipo === 'INGRESO'
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {tx.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{tx.categoria}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.concepto}</div>
                      {tx.comprobanteNumero && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          Comprobante: {tx.comprobanteNumero}
                        </div>
                      )}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-bold text-xs ${
                        tx.tipo === 'INGRESO' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {tx.moneda === 'USD' ? 'USD $' : '$'} {tx.monto.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteTransaccion(tx.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Eliminar movimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredTx.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                      No hay transacciones registradas con estos filtros en {filterMoneda}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Breakdown list */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Distribución por Categorías</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total de movimientos en {filterMoneda}</p>

          <div className="space-y-3">
            {categoryBreakdown.map(([cat, total], idx) => {
              const pct = Math.round((total / (totalIngresos + totalGastos || 1)) * 100);
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">
                      {filterMoneda === 'USD' ? 'USD $' : '$'} {total.toLocaleString('es-AR')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div style={{ width: `${Math.min(pct, 100)}%` }} className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Transaction Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-800 dark:text-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Registrar Movimiento Económico</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ingreso o Egreso del criadero</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Movimiento *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoTransaccion)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="GASTO">GASTO / EGRESO</option>
                    <option value="INGRESO">INGRESO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Moneda *</label>
                  <select
                    value={moneda}
                    onChange={(e) => setMoneda(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ARS">Pesos Argentinos (ARS)</option>
                    <option value="USD">Dólares Estadounidenses (USD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CategoriaEconomica)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALIMENTACION">ALIMENTACIÓN</option>
                    <option value="VETERINARIA">VETERINARIA</option>
                    <option value="ESTUDIOS_DISPLASIA">ESTUDIOS (HD/ED/ECO)</option>
                    <option value="MEDICAMENTOS">MEDICAMENTOS</option>
                    <option value="SERVICIOS_MONTA">PAGO SERVICIO DE MONTA</option>
                    <option value="INSCRIPCIONES_POA">INSCRIPCIONES Y POA</option>
                    <option value="TRASLADOS">TRASLADOS</option>
                    <option value="EXPOSICIONES">TORNEOS Y EXPOSICIONES</option>
                    <option value="VENTA_CACHORRO">VENTA DE CACHORRO</option>
                    <option value="RESERVA_SENIA">RESERVA / SEÑA</option>
                    <option value="MONTA_COBRADA">MONTA COBRADA (PADRILLO)</option>
                    <option value="OTROS">OTROS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Monto *</label>
                  <input
                    type="number"
                    min={1}
                    value={monto || ''}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    placeholder="ej: 380000"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Concepto / Detalle *</label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="ej: Compra 6 bolsas de alimento puppy y starter"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Asociar a Camada (Opcional)</label>
                  <select
                    value={camadaId}
                    onChange={(e) => setCamadaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Gasto General del Criadero</option>
                    {camadas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.identificador}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
