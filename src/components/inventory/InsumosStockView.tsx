import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Insumo,
  CategoriaInsumo,
  UnidadMedidaInsumo,
  UbicacionInsumo,
} from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ThermometerSnowflake,
  Clock,
  Trash2,
  Edit2,
  MinusCircle,
  PlusCircle,
  TrendingDown,
  Layers,
  Calendar,
  DollarSign,
  History,
  Building2,
  X,
  ShieldAlert,
  Sparkles,
  Utensils,
  Syringe,
  Pill,
  Shield,
  Sparkle,
  Sparkles as SparklesIcon,
  Info,
} from 'lucide-react';

const CATEGORIAS_INFO: Record<
  CategoriaInsumo,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  ALIMENTO: {
    label: 'Alimento Balanceado',
    icon: Utensils,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  VACUNAS: {
    label: 'Vacunas (Heladera)',
    icon: Syringe,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
  },
  PIPETAS: {
    label: 'Pipetas y Antiparasitarios',
    icon: Shield,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
  },
  SUPLEMENTOS: {
    label: 'Suplementos y Articulares',
    icon: Pill,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  MEDICAMENTOS: {
    label: 'Medicamentos y Farmacia',
    icon: Pill,
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
  },
  HIGIENE_Y_LIMPIEZA: {
    label: 'Higiene y Desinfección',
    icon: SparklesIcon,
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  ACCESORIOS: {
    label: 'Accesorios y Equipo',
    icon: Package,
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

const UBICACIONES_LABEL: Record<UbicacionInsumo, string> = {
  HELADERA: 'Heladera (Cadena de Frío)',
  DEPOSITO: 'Depósito Central',
  FARMACIA: 'Farmacia / Botiquín',
  CANIL: 'Sector Caniles',
  PARIDERA: 'Maternidad / Paridera',
  OTRO: 'Otro Sector',
};

export const InsumosStockView: React.FC = () => {
  const {
    insumos,
    addInsumo,
    updateInsumo,
    deleteInsumo,
    registrarConsumoInsumo,
    ajustarStockInsumo,
    currentUser,
    currentCriadero,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('TODAS');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);

  const [isConsumoModalOpen, setIsConsumoModalOpen] = useState(false);
  const [consumoTargetInsumo, setConsumoTargetInsumo] = useState<Insumo | null>(null);
  const [consumoCantidad, setConsumoCantidad] = useState<number>(1);
  const [consumoMotivo, setConsumoMotivo] = useState<string>('');

  const [historyTargetInsumo, setHistoryTargetInsumo] = useState<Insumo | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState<Partial<Insumo>>({
    nombre: '',
    categoria: 'ALIMENTO',
    marca: '',
    cantidadActual: 1,
    unidadMedida: 'BOLSAS',
    stockMinimo: 2,
    ubicacion: 'DEPOSITO',
    temperaturaHeladera: '',
    lote: '',
    fechaVencimiento: '',
    pesoPorUnidadKg: 15,
    consumoDiarioEstimado: 2,
    costoUnitario: 0,
    moneda: 'ARS',
    proveedor: '',
    observaciones: '',
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalItems = insumos.length;
    const lowStockItems = insumos.filter((i) => i.cantidadActual <= i.stockMinimo);
    const criticalStockItems = insumos.filter((i) => i.cantidadActual <= i.stockMinimo / 2);
    const vacunasHeladera = insumos.filter(
      (i) => i.categoria === 'VACUNAS' || i.ubicacion === 'HELADERA'
    );
    const totalDosisVacunas = vacunasHeladera.reduce((acc, v) => acc + v.cantidadActual, 0);

    // Food analysis
    const foodItems = insumos.filter((i) => i.categoria === 'ALIMENTO');
    const totalFoodBags = foodItems.reduce((acc, f) => acc + f.cantidadActual, 0);
    const totalFoodKg = foodItems.reduce(
      (acc, f) => acc + f.cantidadActual * (f.pesoPorUnidadKg || 15),
      0
    );
    const totalDailyKg = foodItems.reduce(
      (acc, f) => acc + (f.consumoDiarioEstimado || 0),
      0
    );
    const foodDaysRemaining =
      totalDailyKg > 0 ? Math.floor(totalFoodKg / totalDailyKg) : 0;

    return {
      totalItems,
      lowStockCount: lowStockItems.length,
      criticalCount: criticalStockItems.length,
      vacunasDosis: totalDosisVacunas,
      totalFoodBags,
      totalFoodKg,
      foodDaysRemaining,
    };
  }, [insumos]);

  // Filtered List
  const filteredInsumos = useMemo(() => {
    return insumos.filter((item) => {
      if (selectedCategoria !== 'TODAS' && item.categoria !== selectedCategoria) {
        return false;
      }
      if (selectedUbicacion !== 'TODAS' && item.ubicacion !== selectedUbicacion) {
        return false;
      }
      if (onlyLowStock && item.cantidadActual > item.stockMinimo) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = item.nombre.toLowerCase().includes(query);
        const matchMarca = item.marca?.toLowerCase().includes(query) || false;
        const matchLote = item.lote?.toLowerCase().includes(query) || false;
        const matchProveedor = item.proveedor?.toLowerCase().includes(query) || false;
        return matchName || matchMarca || matchLote || matchProveedor;
      }
      return true;
    });
  }, [insumos, selectedCategoria, selectedUbicacion, onlyLowStock, searchTerm]);

  // Open Form for Create
  const handleOpenCreateModal = () => {
    setEditingInsumo(null);
    setFormData({
      nombre: '',
      categoria: 'ALIMENTO',
      marca: '',
      cantidadActual: 1,
      unidadMedida: 'BOLSAS',
      stockMinimo: 2,
      ubicacion: 'DEPOSITO',
      temperaturaHeladera: '',
      lote: '',
      fechaVencimiento: '',
      pesoPorUnidadKg: 15,
      consumoDiarioEstimado: 2,
      costoUnitario: 0,
      moneda: 'ARS',
      proveedor: '',
      observaciones: '',
    });
    setIsFormModalOpen(true);
  };

  // Open Form for Edit
  const handleOpenEditModal = (item: Insumo) => {
    setEditingInsumo(item);
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria,
      marca: item.marca || '',
      cantidadActual: item.cantidadActual,
      unidadMedida: item.unidadMedida,
      stockMinimo: item.stockMinimo,
      ubicacion: item.ubicacion,
      temperaturaHeladera: item.temperaturaHeladera || '',
      lote: item.lote || '',
      fechaVencimiento: item.fechaVencimiento || '',
      pesoPorUnidadKg: item.pesoPorUnidadKg || 15,
      consumoDiarioEstimado: item.consumoDiarioEstimado || 2,
      costoUnitario: item.costoUnitario || 0,
      moneda: item.moneda || 'ARS',
      proveedor: item.proveedor || '',
      observaciones: item.observaciones || '',
    });
    setIsFormModalOpen(true);
  };

  // Save Create or Edit
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim()) return;

    if (editingInsumo) {
      await updateInsumo(editingInsumo.id, {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria || 'ALIMENTO',
        marca: formData.marca?.trim(),
        cantidadActual: Number(formData.cantidadActual) || 0,
        unidadMedida: formData.unidadMedida || 'UNIDADES',
        stockMinimo: Number(formData.stockMinimo) || 1,
        ubicacion: formData.ubicacion || 'DEPOSITO',
        temperaturaHeladera:
          formData.categoria === 'VACUNAS' || formData.ubicacion === 'HELADERA'
            ? formData.temperaturaHeladera || '2°C a 8°C'
            : undefined,
        lote: formData.lote?.trim(),
        fechaVencimiento: formData.fechaVencimiento || undefined,
        pesoPorUnidadKg:
          formData.categoria === 'ALIMENTO'
            ? Number(formData.pesoPorUnidadKg) || undefined
            : undefined,
        consumoDiarioEstimado:
          formData.categoria === 'ALIMENTO'
            ? Number(formData.consumoDiarioEstimado) || undefined
            : undefined,
        costoUnitario: Number(formData.costoUnitario) || undefined,
        moneda: formData.moneda || 'ARS',
        proveedor: formData.proveedor?.trim(),
        observaciones: formData.observaciones?.trim(),
      });
    } else {
      await addInsumo({
        criaderoId: currentUser?.uid || currentUser?.id || currentCriadero?.id || 'cria-demo',
        nombre: formData.nombre.trim(),
        categoria: formData.categoria || 'ALIMENTO',
        marca: formData.marca?.trim(),
        cantidadActual: Number(formData.cantidadActual) || 0,
        unidadMedida: formData.unidadMedida || 'UNIDADES',
        stockMinimo: Number(formData.stockMinimo) || 1,
        ubicacion: formData.ubicacion || 'DEPOSITO',
        temperaturaHeladera:
          formData.categoria === 'VACUNAS' || formData.ubicacion === 'HELADERA'
            ? formData.temperaturaHeladera || '2°C a 8°C'
            : undefined,
        lote: formData.lote?.trim(),
        fechaVencimiento: formData.fechaVencimiento || undefined,
        pesoPorUnidadKg:
          formData.categoria === 'ALIMENTO'
            ? Number(formData.pesoPorUnidadKg) || undefined
            : undefined,
        consumoDiarioEstimado:
          formData.categoria === 'ALIMENTO'
            ? Number(formData.consumoDiarioEstimado) || undefined
            : undefined,
        costoUnitario: Number(formData.costoUnitario) || undefined,
        moneda: formData.moneda || 'ARS',
        proveedor: formData.proveedor?.trim(),
        observaciones: formData.observaciones?.trim(),
      });
    }

    setIsFormModalOpen(false);
  };

  // Open Consumo Modal
  const handleOpenConsumoModal = (item: Insumo) => {
    setConsumoTargetInsumo(item);
    setConsumoCantidad(1);
    setConsumoMotivo('');
    setIsConsumoModalOpen(true);
  };

  // Submit Consumo
  const handleConfirmConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumoTargetInsumo) return;
    if (consumoCantidad <= 0) return;

    await registrarConsumoInsumo(
      consumoTargetInsumo.id,
      consumoCantidad,
      consumoMotivo.trim() || undefined
    );
    setIsConsumoModalOpen(false);
  };

  // Quick Adjustment (+1 or -1)
  const handleQuickAdjust = async (item: Insumo, delta: number) => {
    const nueva = Math.max(0, item.cantidadActual + delta);
    const motivo = delta > 0 ? 'Reposición rápida (+1)' : 'Consumo rápido (-1)';
    await ajustarStockInsumo(item.id, nueva, motivo);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteInsumo(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Package className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Alimentación y Stock de Insumos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de inventario veterinario, bolsas de alimento, vacunas con cadena de frío y antiparasitarios.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cargar Insumo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Insumos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Insumos
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalItems}
            </span>
            <span className="text-xs text-slate-400 font-medium">ítems cargados</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          className={`p-4 rounded-2xl border shadow-xs transition-colors ${
            metrics.lowStockCount > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                metrics.lowStockCount > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              Stock Bajo / Crítico
            </span>
            <div
              className={`p-2 rounded-xl ${
                metrics.lowStockCount > 0
                  ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                metrics.lowStockCount > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {metrics.lowStockCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              por debajo de alerta
            </span>
          </div>
        </div>

        {/* Vacunas en Heladera */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <ThermometerSnowflake className="w-3.5 h-3.5" />
              <span>Vacunas Frío</span>
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Syringe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-800 dark:text-blue-200">
              {metrics.vacunasDosis}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              dosis en heladera
            </span>
          </div>
        </div>

        {/* Alimento y Autonomía */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5" />
              <span>Alimento Plantel</span>
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
              {metrics.totalFoodBags}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              bolsas ({metrics.totalFoodKg} kg)
            </span>
          </div>
          {metrics.foodDaysRemaining > 0 && (
            <div className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span>⏱ ~{metrics.foodDaysRemaining} días de autonomía</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, marca, lote o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Ubicación Filter */}
            <select
              value={selectedUbicacion}
              onChange={(e) => setSelectedUbicacion(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="TODAS">📍 Todas las Ubicaciones</option>
              <option value="HELADERA">❄️ Heladera (Frío)</option>
              <option value="DEPOSITO">🏢 Depósito</option>
              <option value="FARMACIA">💊 Farmacia</option>
              <option value="PARIDERA">🍼 Paridera</option>
              <option value="CANIL">🐕 Caniles</option>
            </select>

            {/* Low stock toggle */}
            <button
              onClick={() => setOnlyLowStock((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyLowStock
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Solo Alertas ({metrics.lowStockCount})</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tabla
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategoria('TODAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategoria === 'TODAS'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todas ({insumos.length})
          </button>
          {(Object.keys(CATEGORIAS_INFO) as CategoriaInsumo[]).map((cat) => {
            const count = insumos.filter((i) => i.categoria === cat).length;
            const info = CATEGORIAS_INFO[cat];
            const isSel = selectedCategoria === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoria(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{info.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSel ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Cards or Table */}
      {filteredInsumos.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No se encontraron insumos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm || selectedCategoria !== 'TODAS' || onlyLowStock
              ? 'Probá ajustando los filtros de búsqueda o categoría seleccionados.'
              : 'Comenzá registrando las bolsas de alimento, vacunas o pipetas del criadero.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            + Registrar Primer Insumo
          </button>
        </div>
      ) : viewMode === 'CARDS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInsumos.map((item) => {
            const catInfo = CATEGORIAS_INFO[item.categoria] || CATEGORIAS_INFO.ACCESORIOS;
            const CatIcon = catInfo.icon;
            const isLowStock = item.cantidadActual <= item.stockMinimo;
            const isCritical = item.cantidadActual <= item.stockMinimo / 2;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col justify-between ${
                  isCritical
                    ? 'border-rose-400 dark:border-rose-800/80 bg-rose-50/20'
                    : isLowStock
                    ? 'border-amber-300 dark:border-amber-800/80'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border flex items-center gap-1 ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catInfo.label}</span>
                    </span>

                    {/* Stock Alert Badge */}
                    {isCritical ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>STOCK CRÍTICO</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>STOCK BAJO</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ÓPTIMO</span>
                      </span>
                    )}
                  </div>

                  {/* Title and Brand */}
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {item.nombre}
                  </h4>
                  {item.marca && (
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.marca}
                    </div>
                  )}

                  {/* Fridge temperature notice */}
                  {item.temperaturaHeladera && (
                    <div className="mt-2 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                      <ThermometerSnowflake className="w-3.5 h-3.5 shrink-0" />
                      <span>Cadena de frío: {item.temperaturaHeladera}</span>
                    </div>
                  )}

                  {/* Stock Quantity Display & Progress Bar */}
                  <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Cantidad Disponible:
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {item.cantidadActual}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {item.unidadMedida}
                        </span>
                      </div>
                    </div>

                    {/* Stock level bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isCritical
                            ? 'bg-rose-500'
                            : isLowStock
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((item.cantidadActual / (item.stockMinimo * 2.5 || 10)) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-medium">
                      <span>Mínimo alerta: {item.stockMinimo} {item.unidadMedida}</span>
                      <span>Ubicación: {UBICACIONES_LABEL[item.ubicacion] || item.ubicacion}</span>
                    </div>
                  </div>

                  {/* Metadata tags: lot, expiry */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    {item.lote && (
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        Lote: {item.lote}
                      </span>
                    )}
                    {item.fechaVencimiento && (
                      <span className="flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Vence: {item.fechaVencimiento}</span>
                      </span>
                    )}
                    {item.proveedor && (
                      <span className="truncate max-w-[140px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {item.proveedor}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Quick +/- buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(item, -1)}
                      disabled={item.cantidadActual <= 0}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer transition-colors"
                      title="Descontar 1 unidad"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAdjust(item, 1)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      title="Sumar 1 unidad (reposición)"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenConsumoModal(item)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>Consumo</span>
                    </button>
                  </div>

                  {/* History, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    {item.historialMovimientos && item.historialMovimientos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistoryTargetInsumo(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        title="Ver historial de movimientos"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Editar insumo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Eliminar insumo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Insumo / Marca</th>
                <th className="p-3.5">Categoría</th>
                <th className="p-3.5">Stock Actual</th>
                <th className="p-3.5">Ubicación</th>
                <th className="p-3.5">Lote / Vto</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInsumos.map((item) => {
                const catInfo = CATEGORIAS_INFO[item.categoria] || CATEGORIAS_INFO.ACCESORIOS;
                const isLowStock = item.cantidadActual <= item.stockMinimo;
                const isCritical = item.cantidadActual <= item.stockMinimo / 2;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.nombre}
                      </div>
                      {item.marca && (
                        <div className="text-[11px] text-slate-400 font-medium">
                          {item.marca}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo.bg} ${catInfo.color} ${catInfo.border}`}
                      >
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {item.cantidadActual}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {item.unidadMedida}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Mínimo: {item.stockMinimo}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      <span className="font-medium">
                        {UBICACIONES_LABEL[item.ubicacion] || item.ubicacion}
                      </span>
                      {item.temperaturaHeladera && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                          {item.temperaturaHeladera}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      <div>{item.lote || 'S/L'}</div>
                      {item.fechaVencimiento && <div>Vto: {item.fechaVencimiento}</div>}
                    </td>
                    <td className="p-3.5">
                      {isCritical ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                          CRÍTICO
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                          STOCK BAJO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, -1)}
                          disabled={item.cantidadActual <= 0}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Restar 1"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Sumar 1"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenConsumoModal(item)}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded-md hover:bg-blue-100 cursor-pointer"
                        >
                          Consumo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Create / Edit Insumo */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <span>{editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo en Stock'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              {/* Category & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        categoria: e.target.value as CategoriaInsumo,
                        ubicacion:
                          e.target.value === 'VACUNAS'
                            ? 'HELADERA'
                            : prev.ubicacion || 'DEPOSITO',
                        unidadMedida:
                          e.target.value === 'ALIMENTO'
                            ? 'BOLSAS'
                            : e.target.value === 'VACUNAS'
                            ? 'DOSIS'
                            : e.target.value === 'PIPETAS'
                            ? 'PIPETAS'
                            : prev.unidadMedida,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALIMENTO">Alimento</option>
                    <option value="VACUNAS">Vacunas</option>
                    <option value="PIPETAS">Pipetas / Antiparasitarios</option>
                    <option value="SUPLEMENTOS">Suplementos</option>
                    <option value="MEDICAMENTOS">Medicamentos</option>
                    <option value="HIGIENE_Y_LIMPIEZA">Higiene</option>
                    <option value="ACCESORIOS">Accesorios</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej: Royal Canin Maxi Puppy (15kg)"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              {/* Brand & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Marca / Laboratorio
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Royal Canin, Zoetis, MSD..."
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, marca: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Proveedor / Veterinaria
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Distribuidora Zootecnia Central"
                    value={formData.proveedor}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, proveedor: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Stock Amounts & Units */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={formData.cantidadActual}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cantidadActual: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-black text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Unidad Medida *
                  </label>
                  <select
                    value={formData.unidadMedida}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unidadMedida: e.target.value as UnidadMedidaInsumo,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BOLSAS">Bolsas</option>
                    <option value="KILOS">Kilos</option>
                    <option value="DOSIS">Dosis</option>
                    <option value="PIPETAS">Pipetas</option>
                    <option value="COMPRIMIDOS">Comprimidos</option>
                    <option value="FRASCOS">Frascos</option>
                    <option value="LITROS">Litros</option>
                    <option value="UNIDADES">Unidades</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Alerta Mínimo *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formData.stockMinimo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stockMinimo: parseFloat(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Location & Fridge Temp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ubicación en Criadero *
                  </label>
                  <select
                    value={formData.ubicacion}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ubicacion: e.target.value as UbicacionInsumo,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="DEPOSITO">Depósito Central</option>
                    <option value="HELADERA">Heladera (Refrigerado)</option>
                    <option value="FARMACIA">Farmacia / Botiquín</option>
                    <option value="PARIDERA">Paridera / Maternidad</option>
                    <option value="CANIL">Sector Caniles</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                {(formData.categoria === 'VACUNAS' || formData.ubicacion === 'HELADERA') && (
                  <div>
                    <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ThermometerSnowflake className="w-3.5 h-3.5" />
                      <span>Temperatura Heladera</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ej: 2°C a 8°C"
                      value={formData.temperaturaHeladera}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          temperaturaHeladera: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-100 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Lot & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Número de Lote
                  </label>
                  <input
                    type="text"
                    placeholder="ej: LOTE-8921B"
                    value={formData.lote}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lote: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fechaVencimiento: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Specific Food Settings */}
              {formData.categoria === 'ALIMENTO' && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                      Kilos por Bolsa
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      placeholder="15"
                      value={formData.pesoPorUnidadKg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pesoPorUnidadKg: parseFloat(e.target.value) || 15,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                      Consumo Diario Estimado (kg/día)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="2.5"
                      value={formData.consumoDiarioEstimado}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          consumoDiarioEstimado: parseFloat(e.target.value) || 2,
                        }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Observaciones */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre dosificación, raza objetivo o instrucciones..."
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  {editingInsumo ? 'Guardar Cambios' : 'Registrar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Consumo */}
      {isConsumoModalOpen && consumoTargetInsumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <span>Registrar Consumo</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsConsumoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmConsumo} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="font-black text-sm text-slate-900 dark:text-white">
                  {consumoTargetInsumo.nombre}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Stock actual disponible:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {consumoTargetInsumo.cantidadActual}{' '}
                    {consumoTargetInsumo.unidadMedida}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Cantidad a descontar ({consumoTargetInsumo.unidadMedida}) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    max={consumoTargetInsumo.cantidadActual}
                    step="0.5"
                    required
                    value={consumoCantidad}
                    onChange={(e) =>
                      setConsumoCantidad(parseFloat(e.target.value) || 1)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-center text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  {/* Shortcuts */}
                  <button
                    type="button"
                    onClick={() => setConsumoCantidad(1)}
                    className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsumoCantidad(2)}
                    className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    2
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Motivo / Destino del Consumo
                </label>
                <input
                  type="text"
                  placeholder="ej: Vacunación Camada B, alimentación diaria, etc."
                  value={consumoMotivo}
                  onChange={(e) => setConsumoMotivo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConsumoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Confirmar Consumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Historial de Movimientos */}
      {historyTargetInsumo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <span>Historial de Movimientos</span>
              </h3>
              <button
                type="button"
                onClick={() => setHistoryTargetInsumo(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3">
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                {historyTargetInsumo.nombre} ({historyTargetInsumo.cantidadActual}{' '}
                {historyTargetInsumo.unidadMedida} en stock)
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {historyTargetInsumo.historialMovimientos?.map((mov) => (
                  <div
                    key={mov.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            mov.tipo === 'INGRESO'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : mov.tipo === 'CONSUMO'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                          }`}
                        >
                          {mov.tipo}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {mov.tipo === 'CONSUMO' ? `-${mov.cantidad}` : `+${mov.cantidad}`}{' '}
                          {historyTargetInsumo.unidadMedida}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {mov.motivo || 'Sin detalle'}
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 shrink-0">
                      <div>{mov.fecha}</div>
                      {mov.usuarioNombre && <div>{mov.usuarioNombre}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
                <button
                  type="button"
                  onClick={() => setHistoryTargetInsumo(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2 font-black text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>¿Eliminar este insumo?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Esta acción dará de baja este ítem del inventario logístico y su historial en Firestore.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
