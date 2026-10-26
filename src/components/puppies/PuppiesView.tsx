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
  Scale,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PuppyDetailModal } from './PuppyDetailModal';
import { PuppyFormModal } from './PuppyFormModal';

export const PuppiesView: React.FC = () => {
  const { cachorros, camadas, exportToCSV, openPrintModal, currentUser, currentCriaderoId } = useApp();

  const isSuperAdmin =
    currentUser.rol === 'SUPER_ADMIN' ||
    currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterCamada, setFilterCamada] = useState<string>('TODOS');
  const [selectedPuppy, setSelectedPuppy] = useState<Cachorro | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPuppy, setEditingPuppy] = useState<Cachorro | null>(null);

  const filteredPuppies = useMemo(() => {
    return cachorros.filter((p) => {
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

        <div className="flex items-center gap-2.5">
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
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Cachorro</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por collar, nombre, comprador, chip..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-xs"
          />
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

          <select
            value={filterCamada}
            onChange={(e) => setFilterCamada(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none text-xs cursor-pointer font-medium shadow-xs"
          >
            <option value="TODOS">Todas las camadas</option>
            {camadas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identificador}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Puppies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPuppies.map((pup) => {
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
                    src={
                      pup.fotoUrl ||
                      'https://upload.wikimedia.org/wikipedia/commons/b/be/Bessie_the_German_Shepherd_puppy_%282006%29.jpg'
                    }
                    alt={pup.nombre || pup.identificadorProvisorio}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

                  {/* Collar Color Tag */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white shadow-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                      style={{ backgroundColor: pup.colorCollar || '#2563eb' }}
                    />
                    <span>Collar {pup.colorCollar || 'Azul'}</span>
                  </div>

                  {/* Status Tag */}
                  <div className="absolute top-3 right-3">
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
                        {pup.fechaNacimiento}
                      </strong>
                    </div>
                  </div>

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
              <div className="p-4 pt-0 border-t border-slate-100 flex items-center gap-2 mt-2">
                {(isSuperAdmin || pup.criaderoId === currentCriaderoId) && (
                  <button
                    onClick={() => openPrintModal('PEDIGREE_REQUEST', pup.id)}
                    className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 transition-all border border-emerald-200 cursor-pointer"
                    title="Solicitud de emisión de pedigree digital"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pedigree</span>
                  </button>
                )}
                <button
                  onClick={() => openPrintModal('DELIVERY_CERTIFICATE', pup.id)}
                  className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
                  title="Imprimir Certificado de Entrega y Garantía"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Certificado</span>
                </button>
                <button
                  onClick={() => setSelectedPuppy(pup)}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Ficha y Pesajes</span>
                </button>
                <button
                  onClick={() => {
                    setEditingPuppy(pup);
                    setIsFormOpen(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-all border border-slate-200 cursor-pointer"
                >
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};
