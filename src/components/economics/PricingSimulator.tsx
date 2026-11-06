import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ARANCELES_POA_DEFAULT,
  ArancelesPOATable,
  GastosOperativosCamada,
} from '../../types';
import {
  Calculator,
  CircleDollarSign,
  Building,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Baby,
  Sparkles,
  Info,
  Check,
  Edit2,
  Save,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  Percent,
} from 'lucide-react';

export const PricingSimulator: React.FC = () => {
  const { currentUser } = useApp();
  const isSuperAdminUser =
    currentUser.rol === 'SUPER_ADMIN' ||
    currentUser.email?.toLowerCase() === 'admin@criaderodemo.com.ar' ||
    currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

  // Aranceles POA (con persistencia local y soporte para actualización de SUPER_ADMIN)
  const [aranceles, setAranceles] = useState<ArancelesPOATable>(() => {
    try {
      const stored = localStorage.getItem('poa_aranceles_vigentes');
      return stored ? JSON.parse(stored) : ARANCELES_POA_DEFAULT;
    } catch {
      return ARANCELES_POA_DEFAULT;
    }
  });

  const [isEditingAranceles, setIsEditingAranceles] = useState(false);
  const [editedAranceles, setEditedAranceles] = useState<ArancelesPOATable>(aranceles);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Parámetros de la Camada a Simular
  const [nombreCamada, setNombreCamada] = useState("Camada 'B' Von Der Balmaceda 2026");
  const [esSocioPOA, setEsSocioPOA] = useState(true);
  const [numCachorros, setNumCachorros] = useState<number>(4);
  const [incluyeInternacional, setIncluyeInternacional] = useState(true);
  const [incluyeTatuajeChip, setIncluyeTatuajeChip] = useState(false);
  const [plazoInscripcion, setPlazoInscripcion] = useState<'HASTA_70' | 'HASTA_90' | 'MAS_90'>('HASTA_70');
  const [margenDeseadoPct, setMargenDeseadoPct] = useState<number>(45);

  // Gastos Operativos de la Camada
  const [gastos, setGastos] = useState<GastosOperativosCamada>({
    servicioSaltoMacho: 180000,
    medicionesProgesterona: 65000,
    ecografiasYRayos: 55000,
    alimentoMadreYCachorros: 145000,
    planSanitarioCachorros: 98000,
    atencionVeterinariaOParto: 40000,
    kitEntregaCachorro: 35000,
    otrosGastos: 25000,
  });

  // Guardar aranceles editados por SuperAdmin
  const handleSaveAranceles = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...editedAranceles,
      actualizadoEn: new Date().toISOString(),
      actualizadoPor: currentUser?.nombre || 'Super Administrador',
    };
    setAranceles(updated);
    try {
      localStorage.setItem('poa_aranceles_vigentes', JSON.stringify(updated));
    } catch {}
    setIsEditingAranceles(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetAranceles = () => {
    setAranceles(ARANCELES_POA_DEFAULT);
    setEditedAranceles(ARANCELES_POA_DEFAULT);
    try {
      localStorage.removeItem('poa_aranceles_vigentes');
    } catch {}
    setIsEditingAranceles(false);
  };

  // Cálculo desglosado de Aranceles POA
  const desglosePOA = useMemo(() => {
    const roleKey = esSocioPOA ? 'socio' : 'noSocio';

    const formulario = aranceles.denunciaServicioNumerado[roleKey];
    const denunciaServicio = aranceles.denunciaServicioHasta30Dias[roleKey];
    const denunciaNacimiento = aranceles.denunciaNacimientoHasta10Dias[roleKey];

    let costoInscripcionUnitario = aranceles.inscripcionCriaHasta70DiasPorCachorro[roleKey];
    if (plazoInscripcion === 'HASTA_90') {
      costoInscripcionUnitario = aranceles.inscripcionCria71a90DiasPorCachorro[roleKey];
    } else if (plazoInscripcion === 'MAS_90') {
      costoInscripcionUnitario = aranceles.inscripcionCriaMas90DiasPorCachorro[roleKey];
    }

    const totalInscripcionPedigree = costoInscripcionUnitario * numCachorros;
    const totalInternacional = incluyeInternacional
      ? aranceles.adicionalInternacionalPorCachorro[roleKey] * numCachorros
      : 0;

    const totalIdentificacion = incluyeTatuajeChip
      ? aranceles.tatuajeMasChipPorCriaAMBA[roleKey]
      : 0;

    const totalPOA =
      formulario +
      denunciaServicio +
      denunciaNacimiento +
      totalInscripcionPedigree +
      totalInternacional +
      totalIdentificacion;

    return {
      formulario,
      denunciaServicio,
      denunciaNacimiento,
      costoInscripcionUnitario,
      totalInscripcionPedigree,
      totalInternacional,
      totalIdentificacion,
      totalPOA,
    };
  }, [aranceles, esSocioPOA, numCachorros, incluyeInternacional, incluyeTatuajeChip, plazoInscripcion]);

  // Cálculo de Gastos Operativos Totales
  const totalGastosOperativos = useMemo(() => {
    return (
      (gastos.servicioSaltoMacho || 0) +
      (gastos.medicionesProgesterona || 0) +
      (gastos.ecografiasYRayos || 0) +
      (gastos.alimentoMadreYCachorros || 0) +
      (gastos.planSanitarioCachorros || 0) +
      (gastos.atencionVeterinariaOParto || 0) +
      (gastos.kitEntregaCachorro || 0) +
      (gastos.otrosGastos || 0)
    );
  }, [gastos]);

  // Totales Generales, Margen y Precio Sugerido
  const costoTotalCamada = desglosePOA.totalPOA + totalGastosOperativos;
  const costoBasePorCachorro = numCachorros > 0 ? Math.round(costoTotalCamada / numCachorros) : 0;
  const precioSugeridoCachorro = Math.round(costoBasePorCachorro * (1 + margenDeseadoPct / 100));
  const ingresoTotalProyectado = precioSugeridoCachorro * numCachorros;
  const gananciaNetaProyectada = ingresoTotalProyectado - costoTotalCamada;

  const formatMoneda = (val: number) => {
    return `$ ${val.toLocaleString('es-AR')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Club POA • Aranceles Oficiales Vigentes al 01/09/2026</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Simulador de Costos y Cotizaciones de Camadas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Cálculo algorítmico exacto de trámites de libro de cría POA, gastos operativos de gestación y proyección de rentabilidad por cachorro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdminUser && (
            <button
              onClick={() => setIsEditingAranceles((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEditingAranceles ? 'Cerrar Edición POA' : 'Editar Aranceles POA (Admin)'}</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Tabla de aranceles oficial Club POA actualizada con éxito en el sistema!</span>
        </div>
      )}

      {/* Editor de Aranceles POA (Solo SUPER_ADMIN) */}
      {isEditingAranceles && isSuperAdminUser && (
        <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-200 dark:border-indigo-900 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900/60">
            <div>
              <h4 className="text-sm font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-indigo-600" />
                <span>Panel de Actualización de Aranceles Oficiales POA</span>
              </h4>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                Modificá las tarifas oficiales para Socios y No Socios que rigen para todos los criaderos de la plataforma.
              </p>
            </div>
            <button
              onClick={handleResetAranceles}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer PDF 01/09/2026</span>
            </button>
          </div>

          <form onSubmit={handleSaveAranceles} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* Formulario de Servicio */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="font-bold block mb-1">Denuncia Servicio (Formulario)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.denunciaServicioNumerado.socio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          denunciaServicioNumerado: {
                            ...editedAranceles.denunciaServicioNumerado,
                            socio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">No Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.denunciaServicioNumerado.noSocio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          denunciaServicioNumerado: {
                            ...editedAranceles.denunciaServicioNumerado,
                            noSocio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Denuncia de Servicio hasta 30 días */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="font-bold block mb-1">Servicio (Hasta 30 días)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.denunciaServicioHasta30Dias.socio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          denunciaServicioHasta30Dias: {
                            ...editedAranceles.denunciaServicioHasta30Dias,
                            socio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">No Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.denunciaServicioHasta30Dias.noSocio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          denunciaServicioHasta30Dias: {
                            ...editedAranceles.denunciaServicioHasta30Dias,
                            noSocio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Denuncia de Nacimiento hasta 10 días */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="font-bold block mb-1">Nacimiento (Hasta 10 días)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.denunciaNacimientoHasta10Dias.socio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          denunciaNacimientoHasta10Dias: {
                            ...editedAranceles.denunciaNacimientoHasta10Dias,
                            socio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">No Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.denunciaNacimientoHasta10Dias.noSocio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          denunciaNacimientoHasta10Dias: {
                            ...editedAranceles.denunciaNacimientoHasta10Dias,
                            noSocio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Inscripción de cría + pedigree hasta 70 días */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="font-bold block mb-1">Inscripción + Pedigree (c/u)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.inscripcionCriaHasta70DiasPorCachorro.socio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          inscripcionCriaHasta70DiasPorCachorro: {
                            ...editedAranceles.inscripcionCriaHasta70DiasPorCachorro,
                            socio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">No Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.inscripcionCriaHasta70DiasPorCachorro.noSocio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          inscripcionCriaHasta70DiasPorCachorro: {
                            ...editedAranceles.inscripcionCriaHasta70DiasPorCachorro,
                            noSocio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Adicional Internacional */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="font-bold block mb-1">Adicional Internacional (c/u)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.adicionalInternacionalPorCachorro.socio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          adicionalInternacionalPorCachorro: {
                            ...editedAranceles.adicionalInternacionalPorCachorro,
                            socio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">No Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.adicionalInternacionalPorCachorro.noSocio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          adicionalInternacionalPorCachorro: {
                            ...editedAranceles.adicionalInternacionalPorCachorro,
                            noSocio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Tatuaje + Chip */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-slate-800">
                <span className="font-bold block mb-1">Tatuaje + Colocación Chip (AMBA)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.tatuajeMasChipPorCriaAMBA.socio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          tatuajeMasChipPorCriaAMBA: {
                            ...editedAranceles.tatuajeMasChipPorCriaAMBA,
                            socio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">No Socio ($)</label>
                    <input
                      type="number"
                      value={editedAranceles.tatuajeMasChipPorCriaAMBA.noSocio}
                      onChange={(e) =>
                        setEditedAranceles({
                          ...editedAranceles,
                          tatuajeMasChipPorCriaAMBA: {
                            ...editedAranceles.tatuajeMasChipPorCriaAMBA,
                            noSocio: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingAranceles(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Aranceles Oficiales</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Simulator 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (Camada & Operativos) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Configuración de la Camada */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Baby className="w-4.5 h-4.5 text-blue-600" />
              <span>1. Parámetros de la Camada & Libro de Cría POA</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre o Identificador de la Camada:
                </label>
                <input
                  type="text"
                  value={nombreCamada}
                  onChange={(e) => setNombreCamada(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Condición Social del Criador:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEsSocioPOA(true)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        esSocioPOA
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      Socio Activo POA
                    </button>
                    <button
                      type="button"
                      onClick={() => setEsSocioPOA(false)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        !esSocioPOA
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      No Socio
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cachorros Viables Nacidos:
                  </label>
                  <div className="flex items-center gap-2">
                    {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNumCachorros(n)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                          numCachorros === n
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Plazo de Inscripción de Cría */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Plazo de Inscripción en POA:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlazoInscripcion('HASTA_70')}
                    className={`p-2 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                      plazoInscripcion === 'HASTA_70'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">Hasta 70 días</span>
                    <span className="text-[10px] text-slate-400">Arancel estándar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlazoInscripcion('HASTA_90')}
                    className={`p-2 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                      plazoInscripcion === 'HASTA_90'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">71 a 90 días</span>
                    <span className="text-[10px] text-slate-400">Recargo leve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlazoInscripcion('MAS_90')}
                    className={`p-2 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                      plazoInscripcion === 'MAS_90'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span className="font-bold block">&gt; 90 días</span>
                    <span className="text-[10px] text-rose-500">Condicional</span>
                  </button>
                </div>
              </div>

              {/* Checkboxes de Opciones Adicionales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluyeInternacional}
                    onChange={(e) => setIncluyeInternacional(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-white">
                      Reconocimiento Internacional
                    </span>
                    <span className="text-[10px] text-slate-400">+$5.600 por cachorro</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluyeTatuajeChip}
                    onChange={(e) => setIncluyeTatuajeChip(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold block text-slate-800 dark:text-white">
                      Tatuaje + Colocación Chip (AMBA)
                    </span>
                    <span className="text-[10px] text-slate-400">+$97.800 por la cría</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Gastos Operativos de la Camada */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CircleDollarSign className="w-4.5 h-4.5 text-emerald-600" />
                <span>2. Gastos Operativos Reales de Gestación y Cría</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Subtotal: {formatMoneda(totalGastosOperativos)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Salto / Servicio Padrillo ($)
                </label>
                <input
                  type="number"
                  value={gastos.servicioSaltoMacho}
                  onChange={(e) => setGastos({ ...gastos, servicioSaltoMacho: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Análisis Serológicos / Progesterona ($)
                </label>
                <input
                  type="number"
                  value={gastos.medicionesProgesterona}
                  onChange={(e) => setGastos({ ...gastos, medicionesProgesterona: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Ecografías y Placa Radiográfica ($)
                </label>
                <input
                  type="number"
                  value={gastos.ecografiasYRayos}
                  onChange={(e) => setGastos({ ...gastos, ecografiasYRayos: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Alimento Premium Madre + Papilla Cachorros ($)
                </label>
                <input
                  type="number"
                  value={gastos.alimentoMadreYCachorros}
                  onChange={(e) => setGastos({ ...gastos, alimentoMadreYCachorros: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Vacunas (Puppy DP + Séxtuple) y Desparasitación ($)
                </label>
                <input
                  type="number"
                  value={gastos.planSanitarioCachorros}
                  onChange={(e) => setGastos({ ...gastos, planSanitarioCachorros: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Kits de Entrega a Familias (Alimento, Correa) ($)
                </label>
                <input
                  type="number"
                  value={gastos.kitEntregaCachorro}
                  onChange={(e) => setGastos({ ...gastos, kitEntregaCachorro: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Quote & Profitability Summary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Pricing Output Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/60 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-900/60">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                Resultado de Cotización
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-400/30">
                {numCachorros} Cachorros Viables
              </span>
            </div>

            {/* Price Per Puppy Main Display */}
            <div>
              <span className="text-xs text-indigo-200 block">
                Precio Sugerido de Venta (por cachorro):
              </span>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
                {formatMoneda(precioSugeridoCachorro)}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-indigo-300">
                <span>Costo base de producción: {formatMoneda(costoBasePorCachorro)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">+{margenDeseadoPct}% Margen</span>
              </div>
            </div>

            {/* Slider de Margen de Ganancia */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Margen de Ganancia Deseado:</span>
                <span className="text-amber-400 font-mono text-sm">{margenDeseadoPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={margenDeseadoPct}
                onChange={(e) => setMargenDeseadoPct(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Mínimo (10%)</span>
                <span>Equilibrado (45%)</span>
                <span>Máximo (100%)</span>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="space-y-2 text-xs divide-y divide-indigo-900/40">
              <div className="flex justify-between pt-2 text-indigo-200">
                <span>Aranceles Oficiales Club POA:</span>
                <span className="font-mono font-bold text-white">{formatMoneda(desglosePOA.totalPOA)}</span>
              </div>
              <div className="flex justify-between pt-2 text-indigo-200">
                <span>Gastos Operativos del Criadero:</span>
                <span className="font-mono font-bold text-white">{formatMoneda(totalGastosOperativos)}</span>
              </div>
              <div className="flex justify-between pt-2 text-indigo-100 font-bold">
                <span>Costo Total Invertido en la Camada:</span>
                <span className="font-mono text-amber-300">{formatMoneda(costoTotalCamada)}</span>
              </div>
              <div className="flex justify-between pt-2 text-indigo-100 font-bold">
                <span>Ingreso Total por Venta (100% camadas):</span>
                <span className="font-mono text-white">{formatMoneda(ingresoTotalProyectado)}</span>
              </div>
              <div className="flex justify-between pt-2.5 text-sm font-black text-emerald-400">
                <span>Ganancia Neta Final Proyectada:</span>
                <span className="font-mono">{formatMoneda(gananciaNetaProyectada)}</span>
              </div>
            </div>
          </div>

          {/* Desglose Oficial POA Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-black text-slate-800 dark:text-white">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Desglose Exacto Aranceles POA ({esSocioPOA ? 'Socio' : 'No Socio'})</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Formulario Denuncia de Servicio:</span>
                <span className="font-mono font-bold">{formatMoneda(desglosePOA.formulario)}</span>
              </div>
              <div className="flex justify-between">
                <span>Denuncia de Servicio (hasta 30 días):</span>
                <span className="font-mono font-bold">{formatMoneda(desglosePOA.denunciaServicio)}</span>
              </div>
              <div className="flex justify-between">
                <span>Denuncia de Nacimiento (hasta 10 días):</span>
                <span className="font-mono font-bold">{formatMoneda(desglosePOA.denunciaNacimiento)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inscripción Cría + Pedigree ({numCachorros} x {formatMoneda(desglosePOA.costoInscripcionUnitario)}):</span>
                <span className="font-mono font-bold">{formatMoneda(desglosePOA.totalInscripcionPedigree)}</span>
              </div>
              {incluyeInternacional && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>Adicional Internacional ({numCachorros} x $5.600):</span>
                  <span className="font-mono font-bold">{formatMoneda(desglosePOA.totalInternacional)}</span>
                </div>
              )}
              {incluyeTatuajeChip && (
                <div className="flex justify-between text-purple-600 dark:text-purple-400">
                  <span>Tatuaje + Colocación CHIP (AMBA):</span>
                  <span className="font-mono font-bold">{formatMoneda(desglosePOA.totalIdentificacion)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-black text-xs text-slate-900 dark:text-white">
                <span>Total Base POA:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{formatMoneda(desglosePOA.totalPOA)}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 text-[10.5px] text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Para 4 cachorros estándar con reconocimiento internacional y trámites en término de socio, el costo base exacto POA es <strong>$381.800</strong>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
