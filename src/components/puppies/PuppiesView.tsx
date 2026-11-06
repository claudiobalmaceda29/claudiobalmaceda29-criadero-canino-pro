import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Cachorro } from '../../types';
import {
  Baby,
  Plus,
  Search,
  FileCheck2,
  FileText,
  FileSpreadsheet,
  Eye,
  Edit,
  Scale,
  Calendar,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  Layers,
  FolderTree,
  Trash2,
  HeartHandshake,
} from 'lucide-react';
import { PuppyDetailModal } from './PuppyDetailModal';
import { PuppyFormModal } from './PuppyFormModal';
import { PostVentaFollowUpModal } from './PostVentaFollowUpModal';
import { getCollarColorHex, getCollarColorName, formatDateDMY } from '../../lib/dogUtils';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const PuppiesView: React.FC = () => {
  const {
    cachorros,
    camadas,
    deleteCachorro,
    exportToCSV,
    openPrintModal,
    currentUser,
    currentCriaderoId,
  } = useApp();

  const isSuperAdmin =
    currentUser.rol === 'SUPER_ADMIN' ||
    currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterCamada, setFilterCamada] = useState<string>('TODOS');
  const [selectedPuppy, setSelectedPuppy] = useState<Cachorro | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPuppy, setEditingPuppy] = useState<Cachorro | null>(null);
  const [viewMode, setViewMode] = useState<'GENERAL' | 'POR_CAMADA'>('GENERAL');
  const [initialCamadaForNewPuppy, setInitialCamadaForNewPuppy] = useState<string | undefined>(undefined);
  const [puppyToDelete, setPuppyToDelete] = useState<Cachorro | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPostVentaOpen, setIsPostVentaOpen] = useState(false);

  const filteredPuppies = useMemo(() => {
    return cachorros
      .filter((p) => {
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          p.nombre?.toLowerCase().includes(q) ||
          p.identificadorProvisorio.toLowerCase().includes(q) ||
          p.microchip?.toLowerCase().includes(q) ||
          p.numeroPOA?.toLowerCase().includes(q) ||
          p.comprador?.nombre.toLowerCase().includes(q);

        const matchesStatus = filterStatus === 'TODOS' || p.estadoComercial === filterStatus;
        const matchesCamada = filterCamada === 'TODOS' || p.camadaId === filterCamada;

        return matchesSearch && matchesStatus && matchesCamada;
      })
      .sort((a, b) => {
        const nameA = (a.nombre || a.identificadorProvisorio || '').trim();
        const nameB = (b.nombre || b.identificadorProvisorio || '').trim();
        return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [cachorros, searchTerm, filterStatus, filterCamada]);

  const handleExportCSV = () => {
    const rows = filteredPuppies.map((p) => ({
      Identificador: p.identificadorProvisorio,
      Nombre: p.nombre || '',
      Sexo: p.sexo,
      Camada: p.camadaNombre,
      FechaNacimiento: p.fechaNacimiento,
      Color: p.color,
      PesoNacimientoGramos: p.pesoNacimientoGramos,
      Microchip: p.microchip || '',
      NumeroPOA: p.numeroPOA || '',
      EstadoComercial: p.estadoComercial,
      Precio: p.precio || 0,
      Moneda: p.moneda,
      Senia: p.senia || 0,
      Comprador: p.comprador?.nombre || '',
      CompradorDNI: p.comprador?.dni || '',
      CompradorTelefono: p.comprador?.telefono || '',
      FechaEntregaEstimada: p.comprador?.fechaEntregaEstimada || '',
    }));
    exportToCSV(`CACHORROS_REGISTRO_${new Date().toISOString().split('T')[0]}`, rows);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DISPONIBLE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'RESERVADO':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ENTREGADO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'PLANTEL':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const sortedCamadas = useMemo(() => {
    return [...camadas].sort((a, b) => {
      const nameA = (a.identificador || '').trim();
      const nameB = (b.identificador || '').trim();
      return nameA.localeCompare(nameB, 'es', { numeric: true, sensitivity: 'base' });
    });
  }, [camadas]);

  const handleConfirmDelete = async () => {
    if (!puppyToDelete) return;
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'cachorros', puppyToDelete.id));
      deleteCachorro(puppyToDelete.id);
      setPuppyToDelete(null);
    } catch (err) {
      console.error('Error al eliminar cachorro de Firestore:', err);
      alert('Error al intentar eliminar el cachorro de la base de datos.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderPuppyCard = (pup: Cachorro) => {
    const ultimoPeso =
      (pup.pesajes || []).slice(-1)[0]?.pesoGramos || pup.pesoNacimientoGramos;
    return (
      <div
        key={pup.id}
        className="group rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          {/* Photo & Collar */}
          <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
            <img
              src={pup.fotoUrl || '/assets/puppy-dog-pet-german-shepherd-wallpaper-preview.jpg'}
              alt="Cachorro por defecto"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('puppy-dog-pet-german-shepherd-wallpaper-preview.jpg')) {
                  target.src = '/assets/puppy-dog-pet-german-shepherd-wallpaper-preview.jpg';
                }
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

            {/* Collar Color Tag */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-xs">
              <span
                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                style={{ backgroundColor: getCollarColorHex(pup.colorCollar, pup.nombreColorCollar) }}
              />
              <span>Collar {getCollarColorName(pup.colorCollar, pup.nombreColorCollar)}</span>
            </div>

            {/* Status Tag & Quick Edit */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPuppy(pup);
                  setInitialCamadaForNewPuppy(pup.camadaId);
                  setIsFormOpen(true);
                }}
                className="p-1.5 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 shadow-md backdrop-blur-xs transition-all cursor-pointer"
                title="Editar Ficha de Cachorro"
              >
                <Edit className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase border backdrop-blur-md ${getStatusBadgeClass(
                  pup.estadoComercial
                )}`}
              >
                {pup.estadoComercial}
              </span>
            </div>

            {/* Bottom overlay with puppy name */}
            <div className="absolute bottom-3 left-4 right-4">
              <h3 className="text-lg font-black text-white group-hover:text-emerald-200 transition-colors truncate">
                {pup.nombre || pup.identificadorProvisorio}
              </h3>
              <div className="text-xs text-slate-200 font-medium mt-1 flex items-center gap-2">
                <span className="text-slate-300 font-mono text-[11px]">
                  {pup.identificadorProvisorio}
                </span>
                <span className="text-slate-400">•</span>
                <span
                  className={
                    pup.sexo === 'MACHO'
                      ? 'text-blue-300 font-bold'
                      : 'text-pink-300 font-bold'
                  }
                >
                  {pup.sexo}
                </span>
                {pup.microchip && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      Chip: {pup.microchip}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {/* Camada and lineage */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
              <div className="text-slate-800 font-bold truncate">{pup.camadaNombre}</div>
              <div className="text-slate-500 text-[10px] truncate">
                <span className="text-blue-700 font-medium">P:</span> {pup.padreNombre} •{' '}
                <span className="text-pink-700 font-medium">M:</span> {pup.madreNombre}
              </div>
            </div>

            {/* Weight and Birth specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Último Peso
                </span>
                <strong className="text-emerald-700 font-mono font-black text-sm block mt-0.5">
                  {ultimoPeso} g
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Nacimiento
                </span>
                <strong className="text-slate-700 text-xs block mt-0.5 font-medium">
                  {formatDateDMY(pup.fechaNacimiento)}
                </strong>
              </div>
            </div>

            {/* Tatuaje POA and Tipo de Pelo badges */}
            {(pup.tatuaje || pup.pelo || pup.numeroPOA) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {pup.tatuaje && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold">
                    Tat: {pup.tatuaje}
                  </span>
                )}
                {pup.pelo && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    {pup.pelo === 'CORTO' ? 'Pelo Corto' : pup.pelo === 'LARGO' ? 'Pelo Largo' : pup.pelo === 'MEDIO' ? 'Pelo Medio' : pup.pelo}
                  </span>
                )}
                {pup.numeroPOA && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[10px] font-bold">
                    POA: {pup.numeroPOA}
                  </span>
                )}
              </div>
            )}

            {/* Buyer summary if present */}
            {pup.comprador && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] flex items-center justify-between">
                <div className="truncate">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
                    Adquiriente / Reserva
                  </span>
                  <strong className="text-slate-900 truncate block mt-0.5">
                    {pup.comprador.nombre}
                  </strong>
                </div>
                <span className="text-emerald-700 font-mono font-black text-sm">
                  {pup.moneda === 'USD' ? 'USD $' : '$'}{' '}
                  {pup.precio?.toLocaleString('es-AR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          {/* Primary row: View details and Edit */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPuppy(pup)}
              className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Ficha y Pesajes</span>
            </button>
            <button
              onClick={() => {
                setEditingPuppy(pup);
                setInitialCamadaForNewPuppy(pup.camadaId);
                setIsFormOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-blue-200 shadow-xs cursor-pointer shrink-0"
              title="Editar Ficha de Cachorro"
            >
              <Edit className="w-3.5 h-3.5 text-blue-600" />
              <span>Editar</span>
            </button>
          </div>

          {/* Secondary row: Certificates, Pedigree, and Delete */}
          <div className="flex items-center gap-2">
            {(isSuperAdmin || pup.criaderoId === currentCriaderoId) && (
              <button
                onClick={() => openPrintModal('PEDIGREE_REQUEST', pup.id)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-emerald-200 cursor-pointer"
                title="Solicitud de emisión de pedigree digital"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pedigree</span>
              </button>
            )}
            <button
              onClick={() => openPrintModal('DELIVERY_CERTIFICATE', pup.id)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
              title="Imprimir Certificado de Entrega y Garantía"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Certificado</span>
            </button>
            <button
              type="button"
              onClick={() => setPuppyToDelete(pup)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-rose-200 cursor-pointer shadow-2xs shrink-0"
              title="Eliminar este cachorro"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold mb-2">
            <Baby className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fichas Neonatales y Seguimiento</span>
            <span>•</span>
            <span className="font-mono">{cachorros.length} cachorros</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Fichas de Cachorros
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Control de crecimiento ponderal, pesajes semanales, plan de vacunas, reservas y contratos de entrega.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsPostVentaOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-2 transition-all border border-indigo-200 shadow-xs hover:scale-[1.02] cursor-pointer"
            title="Seguimiento Post-Venta a 6 meses y 1 año con WhatsApp"
          >
            <HeartHandshake className="w-4 h-4 text-indigo-600" />
            <span>Fidelización Post-Venta</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all border border-slate-200 shadow-xs hover:scale-[1.02] cursor-pointer"
            title="Exportar a planilla Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingPuppy(null);
              setInitialCamadaForNewPuppy(undefined);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Cachorro</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar with View Mode Selector */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por collar, nombre, comprador, chip..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('GENERAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'GENERAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Lista General</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('POR_CAMADA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'POR_CAMADA'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Camada</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none text-xs cursor-pointer font-medium shadow-xs"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="DISPONIBLE">Disponibles</option>
            <option value="RESERVADO">Reservados</option>
            <option value="ENTREGADO">Entregados</option>
            <option value="PLANTEL">Retenidos Plantel</option>
          </select>

          {viewMode === 'GENERAL' && (
            <select
              value={filterCamada}
              onChange={(e) => setFilterCamada(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none text-xs cursor-pointer font-medium shadow-xs"
            >
              <option value="TODOS">Todas las camadas</option>
              {sortedCamadas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.identificador}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content: General Grid vs Grouped Por Camada */}
      {viewMode === 'GENERAL' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPuppies.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
              <Baby className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                No se encontraron cachorros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            filteredPuppies.map(renderPuppyCard)
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedCamadas.map((camada) => {
            const camadaPups = filteredPuppies.filter(
              (p) =>
                p.camadaId === camada.id ||
                (p.camadaNombre &&
                  p.camadaNombre.trim().toLowerCase() === camada.identificador.trim().toLowerCase())
            );
            const totalInThisCamada = cachorros.filter(
              (p) =>
                p.camadaId === camada.id ||
                (p.camadaNombre &&
                  p.camadaNombre.trim().toLowerCase() === camada.identificador.trim().toLowerCase())
            );
            const isFull =
              camada.totalCachorros > 0 && totalInThisCamada.length >= camada.totalCachorros;

            return (
              <div
                key={camada.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5"
              >
                {/* Camada Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Camada Oficial
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Nacimiento: {formatDateDMY(camada.fechaNacimiento, 'Fecha a confirmar')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {camada.identificador}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Padres: <strong className="text-slate-800">{camada.padreNombre}</strong> ×{' '}
                      <strong className="text-slate-800">{camada.madreNombre}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {totalInThisCamada.length} de {camada.totalCachorros || 0} registrados
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {camada.machos || 0}M / {camada.hembras || 0}H declarados
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isFull) {
                          alert(
                            `Se ha alcanzado el límite de cachorros declarados para esta camada (${camada.totalCachorros} cachorros en total).`
                          );
                          return;
                        }
                        setEditingPuppy(null);
                        setInitialCamadaForNewPuppy(camada.id);
                        setIsFormOpen(true);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                        isFull
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed hover:text-slate-500'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title={
                        isFull
                          ? `Límite alcanzado (${camada.totalCachorros}/${camada.totalCachorros} registrados)`
                          : `Registrar nuevo cachorro en ${camada.identificador}`
                      }
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isFull ? 'Cupo Completo' : 'Registrar Cachorro'}</span>
                    </button>
                  </div>
                </div>

                {/* Puppies Grid or Empty State */}
                {camadaPups.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                    <Baby className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">
                      No hay cachorros registrados aún en {camada.identificador}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPuppy(null);
                        setInitialCamadaForNewPuppy(camada.id);
                        setIsFormOpen(true);
                      }}
                      className="mt-3 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-emerald-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Registrar primer cachorro</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {camadaPups.map(renderPuppyCard)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedPuppy && (
        <PuppyDetailModal
          puppy={selectedPuppy}
          onClose={() => setSelectedPuppy(null)}
          onEdit={() => {
            setEditingPuppy(selectedPuppy);
            setSelectedPuppy(null);
            setIsFormOpen(true);
          }}
        />
      )}

      {isFormOpen && (
        <PuppyFormModal
          puppy={editingPuppy}
          initialCamadaId={
            initialCamadaForNewPuppy ||
            (filterCamada !== 'TODOS' ? filterCamada : undefined)
          }
          onClose={() => {
            setIsFormOpen(false);
            setInitialCamadaForNewPuppy(undefined);
          }}
        />
      )}

      {/* Confirmation Modal for Deleting Puppy */}
      {puppyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar cachorro?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente a{' '}
              <strong className="text-slate-900 font-bold">
                {puppyToDelete.nombre || puppyToDelete.identificadorProvisorio}
              </strong>{' '}
              de la camada <strong className="text-slate-800 font-bold">{puppyToDelete.camadaNombre}</strong>? 
              Se borrará toda su información de Firestore y pesajes registrados.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPuppyToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Eliminación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Venta Follow Up Modal */}
      <PostVentaFollowUpModal
        isOpen={isPostVentaOpen}
        onClose={() => setIsPostVentaOpen(false)}
      />
    </div>
  );
};
