import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  HeartHandshake,
  FolderKanban,
  PawPrint,
  CircleDollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Syringe,
  Pill,
  Heart,
  Baby,
  Camera,
  Upload,
  Link2,
  RotateCcw,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react';

/**
 * Imagen principal del Banner del Dashboard (Pastor Alemán en pose de exposición).
 * Podés cambiar esta URL directamente acá o desde el botón interactivo "Cambiar foto" en la tarjeta.
 * Archivo local subido por el usuario: '/hero-pastor-aleman.png' (también accesible en '/assets/aistudio/Dise_o_sin_t_tulo__29__4ca0f6f1.png').
 */
export const DEFAULT_DASHBOARD_HERO_IMAGE = '/hero-pastor-aleman.png';

export const DashboardView: React.FC = () => {
  const {
    ejemplares,
    cachorros,
    camadas,
    gestaciones,
    transacciones,
    registrosSanitarios,
    ciclosCelo,
    exposiciones,
    auditoria,
    setActiveTab,
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState<'ESTE_ANIO' | 'ESTE_MES' | 'TODO'>('ESTE_ANIO');
  const [selectedBirthYear, setSelectedBirthYear] = useState<string>(() => new Date().getFullYear().toString());

  // Estado para la imagen de portada del Dashboard (con persistencia local)
  const [heroImage, setHeroImage] = useState<string>(() => {
    return localStorage.getItem('miki_dashboard_hero_banner') || DEFAULT_DASHBOARD_HERO_IMAGE;
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Real live counts from state (NO hardcoded fake numbers or falsy fallbacks)
  const totalEjemplares = ejemplares.length;
  const countMachos = ejemplares.filter((e) => e.sexo === 'MACHO').length;
  const countHembras = ejemplares.filter((e) => e.sexo === 'HEMBRA').length;
  const pctMachos = totalEjemplares > 0 ? Math.round((countMachos / totalEjemplares) * 100) : 0;
  const pctHembras = totalEjemplares > 0 ? Math.round((countHembras / totalEjemplares) * 100) : 0;

  const countGestaciones = gestaciones.filter((g) => g.estado === 'EN_CURSO').length;
  const countCamadas = camadas.length;
  const countCachorros = cachorros.filter((c) => c.estadoComercial === 'DISPONIBLE').length;
  const countReservas = cachorros.filter((c) => c.estadoComercial === 'RESERVADO').length;

  // Filtered transactions by selectedPeriod
  const filteredTransacciones = useMemo(() => {
    if (selectedPeriod === 'TODO') return transacciones;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transacciones.filter((t) => {
      if (!t.fecha) return false;
      const d = new Date(t.fecha);
      if (isNaN(d.getTime())) return true;
      if (selectedPeriod === 'ESTE_ANIO') return d.getFullYear() === currentYear;
      if (selectedPeriod === 'ESTE_MES') return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      return true;
    });
  }, [transacciones, selectedPeriod]);

  // Financial calculations from live transactions
  const totalIngresos = filteredTransacciones
    .filter((t) => t.tipo === 'INGRESO')
    .reduce((acc, t) => acc + (t.monto || 0), 0);

  const totalGastos = filteredTransacciones
    .filter((t) => t.tipo === 'GASTO')
    .reduce((acc, t) => acc + (t.monto || 0), 0);

  const balanceNeto = totalIngresos - totalGastos;
  const rentabilidad = totalIngresos > 0 ? Math.round((balanceNeto / totalIngresos) * 100) : 0;

  // Monthly births & deliveries for chart computed dynamically from live camadas and cachorros
  const monthlyData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months.map((m, idx) => {
      const nacidos = camadas
        .filter((c) => {
          if (!c.fechaNacimiento) return false;
          const d = new Date(c.fechaNacimiento);
          return !isNaN(d.getTime()) && d.getFullYear().toString() === selectedBirthYear && d.getMonth() === idx;
        })
        .reduce((sum, c) => sum + (c.nacidosVivos || c.totalCachorros || 0), 0);

      const entregados = cachorros.filter((c) => {
        if (c.estadoComercial !== 'ENTREGADO') return false;
        const dateStr = c.comprador?.fechaEntregaReal || c.comprador?.fechaEntregaEstimada || c.fechaNacimiento;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.getFullYear().toString() === selectedBirthYear && d.getMonth() === idx;
      }).length;

      return { month: m, nacidos, entregados };
    });
  }, [camadas, cachorros, selectedBirthYear]);

  const maxMonthly = useMemo(() => {
    const highest = Math.max(...monthlyData.map((d) => Math.max(d.nacidos, d.entregados)), 0);
    return Math.max(highest, 6);
  }, [monthlyData]);

  // Distribution data for Donut chart from live dogs
  const countRetirados = ejemplares.filter((e) => e.estado === 'RETIRADO' || e.estado === 'FALLECIDO').length;
  const distTotal = countMachos + countHembras + countCachorros + countRetirados;

  const distData = [
    { label: 'Machos', count: countMachos, color: '#3b82f6', hex: 'bg-blue-500' },
    { label: 'Hembras', count: countHembras, color: '#ec4899', hex: 'bg-pink-500' },
    { label: 'Cachorros', count: countCachorros, color: '#10b981', hex: 'bg-emerald-500' },
    { label: 'Retirados', count: countRetirados, color: '#f59e0b', hex: 'bg-amber-500' },
  ];

  const donutCircumference = 238.76;
  const dMachos = distTotal > 0 ? (countMachos / distTotal) * donutCircumference : 0;
  const dHembras = distTotal > 0 ? (countHembras / distTotal) * donutCircumference : 0;
  const dCachorros = distTotal > 0 ? (countCachorros / distTotal) * donutCircumference : 0;
  const dRetirados = distTotal > 0 ? (countRetirados / distTotal) * donutCircumference : 0;

  // Gestaciones en curso derived from active gestaciones
  const activeGestaciones = useMemo(() => {
    return gestaciones
      .filter((g) => g.estado === 'EN_CURSO')
      .map((g) => {
        const hembra = ejemplares.find((e) => e.id === g.hembraId);
        const today = new Date();
        const fechaMonta = new Date(g.fechaMonta);
        const dia = !isNaN(fechaMonta.getTime())
          ? Math.max(1, Math.min(63, Math.ceil((today.getTime() - fechaMonta.getTime()) / (1000 * 60 * 60 * 24))))
          : 1;
        const progreso = Math.min(100, Math.round((dia / 63) * 100));
        return {
          id: g.id,
          hembraNombre: g.hembraNombre,
          raza: hembra?.raza || 'Pastor Alemán',
          fotoUrl:
            hembra?.fotoUrl ||
            'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=160&q=80',
          dia,
          totalDias: 63,
          progreso,
          fechaParto: g.fechaEstimadaParto || 'A confirmar',
        };
      });
  }, [gestaciones, ejemplares]);

  // Cachorros disponibles derived from live cachorros
  const puppiesList = useMemo(() => {
    return cachorros
      .filter((c) => c.estadoComercial === 'DISPONIBLE')
      .slice(0, 6)
      .map((c) => {
        const camada = camadas.find((l) => l.id === c.camadaId);
        let edad = 'Cachorro';
        if (c.fechaNacimiento) {
          const diffMs = Date.now() - new Date(c.fechaNacimiento).getTime();
          const weeks = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 7)));
          edad = weeks < 8 ? `${weeks} sem.` : `${Math.floor(weeks / 4)} meses`;
        }
        return {
          id: c.id,
          camada: c.camadaNombre || camada?.identificador || 'Camada',
          raza: 'Pastor Alemán',
          sexo: c.sexo,
          edad,
          fotoUrl:
            c.fotoUrl ||
            'https://images.unsplash.com/photo-1591160690555-5debfba289f0?auto=format&fit=crop&w=350&q=80',
        };
      });
  }, [cachorros, camadas]);

  // Upcoming real events
  const upcomingEvents = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      date: string;
      category: string;
      tagClass: string;
      iconType: 'CALENDAR' | 'SYRINGE' | 'SPARKLES';
    }> = [];

    // Active pregnancies
    gestaciones
      .filter((g) => g.estado === 'EN_CURSO')
      .forEach((g) => {
        list.push({
          id: `gest-${g.id}`,
          title: 'Fecha estimada de parto',
          subtitle: `${g.hembraNombre} - ${g.fechaEstimadaParto || 'Próximo'}`,
          date: g.fechaEstimadaParto || '',
          category: 'Gestación',
          tagClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
          iconType: 'CALENDAR',
        });
      });

    // Healthcare upcoming appointments
    registrosSanitarios
      .filter((r) => r.proximaFecha)
      .forEach((r) => {
        const dog = ejemplares.find((e) => e.id === r.ejemplarId);
        list.push({
          id: `san-${r.id}`,
          title: r.nombre,
          subtitle: `${dog?.nombreCompleto || 'Ejemplar'} - ${r.proximaFecha}`,
          date: r.proximaFecha!,
          category: r.tipo === 'VACUNA' ? 'Vacunación' : 'Sanidad',
          tagClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
          iconType: r.tipo === 'VACUNA' ? 'SYRINGE' : 'CALENDAR',
        });
      });

    // Shows
    exposiciones.forEach((expo) => {
      list.push({
        id: `expo-${expo.id}`,
        title: expo.nombreEvento,
        subtitle: `${expo.lugar || 'Sede'} - ${expo.fecha}`,
        date: expo.fecha,
        category: 'Exposición',
        tagClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        iconType: 'SPARKLES',
      });
    });

    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return list.slice(0, 4);
  }, [gestaciones, registrosSanitarios, exposiciones, ejemplares]);

  // Recordatorios counts strictly from live state
  const countControlesPendientes = registrosSanitarios.filter(
    (r) => r.tipo === 'CONTROL' || r.tipo === 'ESTUDIO'
  ).length;
  const countVacunacionesProximas = registrosSanitarios.filter((r) => r.tipo === 'VACUNA').length;
  const countDesparasitacionesProximas = registrosSanitarios.filter(
    (r) => r.tipo === 'DESPARASITACION'
  ).length;
  const countRevisionesReproductivas = ciclosCelo.filter(
    (c) => c.estado === 'EN_CURSO' || c.estado === 'MONTA_PROGRAMADA'
  ).length;
  const countReservasPorConfirmar = cachorros.filter((c) => c.estadoComercial === 'RESERVADO').length;

  // Real activities from audit log
  const recentActivities = useMemo(() => {
    return auditoria.slice(0, 4);
  }, [auditoria]);

  // Formatted date string in Argentine Spanish
  const currentDateFormatted = useMemo(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  return (
    <div className="space-y-5 pb-10">
      {/* Top Title Bar with Date and Filter matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vista general de tu criadero en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar Date indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{currentDateFormatted}</span>
          </div>

          {/* Period Dropdown */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ESTE_ANIO">Este año</option>
            <option value="ESTE_MES">Este mes</option>
            <option value="TODO">Todo el historial</option>
          </select>
        </div>
      </div>

      {/* Row 1: KPI Cards Grid + Golden Dog Hero Card matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: 8 Colorful KPI Cards */}
        <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Ejemplares */}
          <div
            onClick={() => setActiveTab('ejemplares')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Ejemplares</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {totalEjemplares}
              </span>
              <span className="text-[10px] text-slate-400 block">Plantel total</span>
            </div>
          </div>

          {/* 2. Machos */}
          <div
            onClick={() => setActiveTab('ejemplares')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <span className="text-lg font-black">♂</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Machos</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {countMachos}
              </span>
              <span className="text-[10px] text-slate-400 block">{pctMachos}%</span>
            </div>
          </div>

          {/* 3. Hembras */}
          <div
            onClick={() => setActiveTab('ejemplares')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <span className="text-lg font-black">♀</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Hembras</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {countHembras}
              </span>
              <span className="text-[10px] text-slate-400 block">{pctHembras}%</span>
            </div>
          </div>

          {/* 4. Gestaciones */}
          <div
            onClick={() => setActiveTab('gestacion')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Gestaciones</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {countGestaciones}
              </span>
              <span className="text-[10px] text-slate-400 block">En curso</span>
            </div>
          </div>

          {/* 5. Camadas */}
          <div
            onClick={() => setActiveTab('camadas')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Camadas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {countCamadas}
              </span>
              <span className="text-[10px] text-slate-400 block">Registradas</span>
            </div>
          </div>

          {/* 6. Cachorros */}
          <div
            onClick={() => setActiveTab('cachorros')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Cachorros</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {countCachorros}
              </span>
              <span className="text-[10px] text-slate-400 block">Disponibles</span>
            </div>
          </div>

          {/* 7. Reservas */}
          <div
            onClick={() => setActiveTab('cachorros')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Reservas</span>
              <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block">
                {countReservas}
              </span>
              <span className="text-[10px] text-slate-400 block">Activas</span>
            </div>
          </div>

          {/* 8. Balance */}
          <div
            onClick={() => setActiveTab('economia')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-3.5 group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Balance</span>
              <span className="text-base font-black text-slate-900 dark:text-white leading-tight block truncate">
                $ {balanceNeto.toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {selectedPeriod === 'ESTE_MES' ? 'Este mes' : selectedPeriod === 'ESTE_ANIO' ? 'Este año' : 'Histórico'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Featured Dog Hero Photo Banner matching reference image */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden relative shadow-xs min-h-[175px] group bg-slate-900 border border-slate-100">
          <img
            src={heroImage}
            alt="Pastor Alemán en pose de estructura"
            className="w-full h-full object-cover object-[center_35%] group-hover:scale-103 transition-transform duration-700"
            onError={() => {
              // Si falla una URL externa personalizada, volver automáticamente a la imagen original
              if (heroImage !== DEFAULT_DASHBOARD_HERO_IMAGE) {
                setHeroImage(DEFAULT_DASHBOARD_HERO_IMAGE);
              }
            }}
          />

          {/* Botón flotante para cambiar la imagen fácilmente */}
          <button
            type="button"
            onClick={() => {
              setTempImageUrl(heroImage);
              setUrlError(null);
              setIsImageModalOpen(true);
            }}
            className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer border border-white/20 hover:scale-102"
            title="Cambiar foto de portada"
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Cambiar foto</span>
          </button>

          {/* Superposición de gradiente y textos: Planificación, Control, Crecimiento, Pasión por los perros */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-4 text-white pointer-events-none">
            <span className="text-[11px] font-bold tracking-wide leading-tight drop-shadow-xs">Planificación</span>
            <span className="text-[11px] font-bold tracking-wide leading-tight drop-shadow-xs">Control</span>
            <span className="text-[11px] font-bold tracking-wide leading-tight drop-shadow-xs">Crecimiento</span>
            <span className="text-[11px] font-black tracking-wide leading-tight text-amber-300 mt-0.5 drop-shadow-xs">
              Pasión por los perros
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Cards (Nacimientos y Entregas, Distribución, Próximos Eventos) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Nacimientos y Entregas (Monthly Double-Bar Chart) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nacimientos y Entregas
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Nacidos
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Entregados
                  </span>
                </div>
                <select
                  value={selectedBirthYear}
                  onChange={(e) => setSelectedBirthYear(e.target.value)}
                  className="px-2 py-0.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </div>

            {/* Bars container */}
            <div className="h-44 flex items-end justify-between gap-1 pt-4 pb-2">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-0.5 h-36">
                    {/* Blue bar: Nacidos */}
                    <div
                      style={{ height: d.nacidos > 0 ? `${(d.nacidos / maxMonthly) * 100}%` : '4px' }}
                      className={`w-2.5 sm:w-3 ${
                        d.nacidos > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                      } rounded-t-sm transition-all`}
                      title={`${d.month}: ${d.nacidos} nacidos`}
                    />
                    {/* Mint bar: Entregados */}
                    <div
                      style={{ height: d.entregados > 0 ? `${(d.entregados / maxMonthly) * 100}%` : '4px' }}
                      className={`w-2.5 sm:w-3 ${
                        d.entregados > 0 ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      } rounded-t-sm transition-all`}
                      title={`${d.month}: ${d.entregados} entregados`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Distribución de Ejemplares (Donut SVG Chart) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Distribución de Ejemplares
          </h3>

          <div className="flex items-center justify-between gap-4 py-2">
            {/* SVG Donut Chart with Centered Number */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="14" fill="transparent" className="dark:stroke-slate-800" />
                {distTotal > 0 && dMachos > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#3b82f6"
                    strokeWidth="14"
                    strokeDasharray={`${dMachos} ${donutCircumference}`}
                    strokeDashoffset="0"
                    fill="transparent"
                  />
                )}
                {distTotal > 0 && dHembras > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#ec4899"
                    strokeWidth="14"
                    strokeDasharray={`${dHembras} ${donutCircumference}`}
                    strokeDashoffset={`${-dMachos}`}
                    fill="transparent"
                  />
                )}
                {distTotal > 0 && dCachorros > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#10b981"
                    strokeWidth="14"
                    strokeDasharray={`${dCachorros} ${donutCircumference}`}
                    strokeDashoffset={`${-(dMachos + dHembras)}`}
                    fill="transparent"
                  />
                )}
                {distTotal > 0 && dRetirados > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray={`${dRetirados} ${donutCircumference}`}
                    strokeDashoffset={`${-(dMachos + dHembras + dCachorros)}`}
                    fill="transparent"
                  />
                )}
              </svg>
              {/* Centered Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                  {totalEjemplares}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Ejemplares</span>
              </div>
            </div>

            {/* Legend on right matching screenshot */}
            <div className="space-y-2 flex-1 text-xs">
              {distData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{item.label}</span>
                  </div>
                  <strong className="text-slate-900 dark:text-white font-bold">{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Próximos Eventos */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Próximos Eventos</h3>
            <button
              onClick={() => setActiveTab('exposiciones')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      {ev.iconType === 'SYRINGE' ? (
                        <Syringe className="w-3.5 h-3.5" />
                      ) : ev.iconType === 'SPARKLES' ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-800 dark:text-white truncate">{ev.title}</div>
                      <div className="text-[10px] text-slate-400">{ev.subtitle}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 ${ev.tagClass}`}>
                    {ev.category}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay eventos próximos programados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: 3 Cards (Gestaciones en Curso, Cachorros Disponibles, Recordatorios) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Gestaciones en Curso */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gestaciones en Curso</h3>
            <button
              onClick={() => setActiveTab('gestacion')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {activeGestaciones.length > 0 ? (
              activeGestaciones.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveTab('gestacion')}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-blue-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.fotoUrl}
                      alt={item.hembraNombre}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-700 shrink-0"
                    />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white text-xs">{item.hembraNombre}</div>
                      <div className="text-[10px] text-slate-400">{item.raza}</div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-[180px] space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Día {item.dia} de {item.totalDias}
                      </span>
                      <span className="text-slate-400 font-mono">{item.progreso}% &gt;</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${item.progreso}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-blue-500" />
                      <span>Parto estimado: {item.fechaParto}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay gestaciones en curso actualmente.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Cachorros Disponibles (Vertical Puppy Cards Row) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cachorros Disponibles</h3>
            <button
              onClick={() => setActiveTab('cachorros')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {puppiesList.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5">
              {puppiesList.map((pup) => (
                <div
                  key={pup.id}
                  onClick={() => setActiveTab('cachorros')}
                  className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="h-20 w-full overflow-hidden">
                    <img
                      src={pup.fotoUrl}
                      alt={pup.camada}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-white truncate">
                        {pup.camada}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600">
                        {pup.sexo === 'MACHO' ? '♂' : '♀'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">{pup.raza}</div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span>{pup.edad}</span>
                    </div>
                    <div className="pt-1">
                      <span className="w-full block py-0.5 text-center text-[9px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Disponible
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No hay cachorros disponibles en este momento.
            </div>
          )}
        </div>

        {/* Card 3: Recordatorios */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recordatorios</h3>
            <button
              onClick={() => setActiveTab('sanidad')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* 1. Controles sanitarios */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">Controles sanitarios pendientes</span>
              </div>
              <span className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                countControlesPendientes > 0 ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                {countControlesPendientes}
              </span>
            </div>

            {/* 2. Vacunaciones */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Syringe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Vacunaciones próximas</span>
              </div>
              <span className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                countVacunacionesProximas > 0 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                {countVacunacionesProximas}
              </span>
            </div>

            {/* 3. Desparasitaciones */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Pill className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Desparasitaciones próximas</span>
              </div>
              <span className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                countDesparasitacionesProximas > 0 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                {countDesparasitacionesProximas}
              </span>
            </div>

            {/* 4. Revisiones reproductivas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Heart className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                <span className="truncate">Revisiones reproductivas</span>
              </div>
              <span className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                countRevisionesReproductivas > 0 ? 'bg-pink-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                {countRevisionesReproductivas}
              </span>
            </div>

            {/* 5. Reservas por confirmar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <FolderKanban className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">Reservas por confirmar</span>
              </div>
              <span className={`w-5 h-5 rounded-full text-white font-bold text-[10px] flex items-center justify-center shrink-0 ${
                countReservasPorConfirmar > 0 ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}>
                {countReservasPorConfirmar}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: 2 Cards (Resumen Financiero & Últimas Actividades) matching reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Resumen Financiero */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resumen Financiero</h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredTransacciones.length} movimientos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Ingresos */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3 h-3" />
                </div>
                <span>Ingresos</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                $ {totalIngresos.toLocaleString('es-AR')}
              </div>
            </div>

            {/* Gastos */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-3 h-3" />
                </div>
                <span>Gastos</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                $ {totalGastos.toLocaleString('es-AR')}
              </div>
            </div>

            {/* Balance */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CircleDollarSign className="w-3 h-3" />
                </div>
                <span>Balance</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                $ {balanceNeto.toLocaleString('es-AR')}
              </div>
            </div>

            {/* Rentabilidad */}
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
                <div className="w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span>Rentabilidad</span>
              </div>
              <div className="text-sm font-black text-purple-600 dark:text-purple-400">
                {rentabilidad}%
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Últimas Actividades */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Últimas Actividades</h3>
            <button
              onClick={() => setActiveTab('ejemplares')}
              className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => {
                const dateStr = act.fecha ? act.fecha.split('T')[0] : '';
                return (
                  <div key={act.id} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">{dateStr}</span>
                    <span className="text-slate-700 dark:text-slate-200 truncate">
                      {act.detalle || act.accion}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No hay actividades recientes registradas en la auditoría.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para personalizar o cambiar la imagen del Banner del Panel */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Encabezado */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cambiar Imagen del Panel
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Tarjeta: &quot;Pasión por los perros&quot;
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-4 text-xs">
              {/* Vista previa con los textos oficiales superpuestos */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Vista Previa en Vivo:</label>
                <div className="h-44 rounded-xl overflow-hidden relative border border-slate-200 shadow-inner bg-slate-900">
                  <img
                    src={tempImageUrl || heroImage}
                    alt="Vista previa Pastor Alemán"
                    className="w-full h-full object-cover object-[center_35%]"
                    onError={() => setUrlError('No se pudo cargar la imagen desde el link o archivo ingresado')}
                    onLoad={() => setUrlError(null)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-4 text-white pointer-events-none">
                    <span className="text-[11px] font-bold tracking-wide leading-tight drop-shadow-xs">Planificación</span>
                    <span className="text-[11px] font-bold tracking-wide leading-tight drop-shadow-xs">Control</span>
                    <span className="text-[11px] font-bold tracking-wide leading-tight drop-shadow-xs">Crecimiento</span>
                    <span className="text-[11px] font-black tracking-wide leading-tight text-amber-300 mt-0.5 drop-shadow-xs">
                      Pasión por los perros
                    </span>
                  </div>
                </div>
                {urlError && (
                  <p className="text-[11px] text-rose-600 font-medium">{urlError}</p>
                )}
              </div>

              {/* Opción 1: Subir archivo */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Opción 1: Subir imagen desde tu computadora</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setTempImageUrl(ev.target.result as string);
                          setUrlError(null);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Podés seleccionar cualquier foto de tu Pastor Alemán en formato JPG, PNG o WebP.
                </p>
              </div>

              {/* Opción 2: Pegar link */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Opción 2: Pegar link o URL directa de la foto</span>
                </label>
                <input
                  type="url"
                  value={tempImageUrl}
                  onChange={(e) => {
                    setTempImageUrl(e.target.value);
                    setUrlError(null);
                  }}
                  placeholder="https://... o /hero-pastor-aleman.png"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                />
              </div>

              {/* Restaurar original */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTempImageUrl(DEFAULT_DASHBOARD_HERO_IMAGE);
                    setUrlError(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 cursor-pointer hover:underline"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Restaurar imagen por defecto</span>
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const finalUrl = tempImageUrl.trim() || DEFAULT_DASHBOARD_HERO_IMAGE;
                  setHeroImage(finalUrl);
                  try {
                    localStorage.setItem('miki_dashboard_hero_banner', finalUrl);
                  } catch (err) {
                    console.warn('Could not save hero banner to localStorage', err);
                  }
                  setIsImageModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar y Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
