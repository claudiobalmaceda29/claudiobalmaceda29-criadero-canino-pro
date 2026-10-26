import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar } from '../../types';
import {
  Dog,
  Plus,
  Search,
  Award,
  ShieldCheck,
  Printer,
  Eye,
  FileSpreadsheet,
  Heart,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DogDetailModal } from './DogDetailModal';
import { DogFormModal } from './DogFormModal';
import { calculateDogAge } from '../../lib/dogUtils';

export const DogsListView: React.FC = () => {
  const { ejemplares, currentCriadero, exportToCSV, openPrintModal } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSex, setFilterSex] = useState<string>('TODOS');
  const [filterState, setFilterState] = useState<string>('TODOS');
  const [selectedDog, setSelectedDog] = useState<Ejemplar | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<Ejemplar | null>(null);

  const filteredDogs = useMemo(() => {
    return ejemplares.filter((dog) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        dog.nombreCompleto.toLowerCase().includes(q) ||
        dog.afijo.toLowerCase().includes(q) ||
        dog.numeroPOA?.toLowerCase().includes(q) ||
        dog.microchip?.toLowerCase().includes(q) ||
        dog.color?.toLowerCase().includes(q);

      const matchesSex = filterSex === 'TODOS' || dog.sexo === filterSex;
      const matchesState = filterState === 'TODOS' || dog.estado === filterState;

      return matchesSearch && matchesSex && matchesState;
    });
  }, [ejemplares, searchTerm, filterSex, filterState]);

  const handleExportCSV = () => {
    const rows = filteredDogs.map((d) => ({
      Nombre: d.nombreCompleto,
      Afijo: d.afijo,
      Sexo: d.sexo,
      Raza: d.raza,
      Nacimiento: d.fechaNacimiento,
      NumeroPOA: d.numeroPOA || '',
      Microchip: d.microchip || '',
      Tatuaje: d.tatuaje || '',
      Color: d.color,
      Pelo: d.pelo,
      EstadoReproductivo: d.estadoReproductivo,
      EstadoGeneral: d.estado,
      DisplasiaCadera: d.displasiaCadera,
      DisplasiaCodo: d.displasiaCodo,
      CalificacionCria: d.calificacionCria,
      Padre: d.padreNombre || '',
      Madre: d.madreNombre || '',
      Titulos: (d.titulos || []).join(' | '),
    }));
    exportToCSV(`EJEMPLARES_PLANTEL_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Module Header in clean white SaaS style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
            <Dog className="w-3.5 h-3.5" />
            <span>Plantel Canino Oficial</span>
            <span>•</span>
            <span className="font-mono">{ejemplares.length} ejemplares</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Gestión de Ejemplares
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Padrillos reproductores, madres, genealogía oficial POA de 4 generaciones y aptitud sanitaria.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs"
            title="Exportar listado a Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingDog(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Ejemplar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, afijo, POA, microchip..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
            <button
              onClick={() => setFilterSex('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSex === 'TODOS'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({ejemplares.length})
            </button>
            <button
              onClick={() => setFilterSex('MACHO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSex === 'MACHO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              Machos ({ejemplares.filter((d) => d.sexo === 'MACHO').length})
            </button>
            <button
              onClick={() => setFilterSex('HEMBRA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterSex === 'HEMBRA'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-pink-600'
              }`}
            >
              Hembras ({ejemplares.filter((d) => d.sexo === 'HEMBRA').length})
            </button>
          </div>

          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none text-xs cursor-pointer font-medium"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="RETIRADO">Retirados</option>
            <option value="VENDIDO">Vendidos</option>
            <option value="COPROPIEDAD">En Copropiedad</option>
          </select>
        </div>
      </div>

      {/* Dogs Grid in Light SaaS Card Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDogs.map((dog) => (
          <div
            key={dog.id}
            className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Photo & Scrim with 16:10 ratio */}
              <div className="relative h-56 w-full bg-slate-800 dark:bg-slate-950 overflow-hidden">
                {dog.fotoUrl ? (
                  <img
                    src={dog.fotoUrl}
                    alt={dog.nombreCompleto}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-900 flex flex-col items-center justify-center text-slate-400">
                    <Dog className="w-12 h-12 text-slate-500 mb-1" />
                    <span className="text-[11px] font-medium text-slate-400">Sin foto asignada</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                {/* Top Floating Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dog.sexo === 'MACHO' ? 'bg-blue-400' : 'bg-pink-400'
                      }`}
                    />
                    <span className={dog.sexo === 'MACHO' ? 'text-blue-300' : 'text-pink-300'}>
                      {dog.sexo === 'MACHO' ? 'Padrillo' : 'Madre'}
                    </span>
                    {dog.estadoReproductivo === 'GESTANTE' && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                        Gestante
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-bold text-amber-300">
                      {calculateDogAge(dog.fechaNacimiento).shortText}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-mono text-slate-200">
                      {dog.numeroPOA || 'POA S/N'}
                    </span>
                  </div>
                </div>

                {/* Bottom Photo Overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-base font-black text-white leading-tight tracking-tight truncate group-hover:text-blue-200 transition-colors">
                    {dog.nombreCompleto}
                  </h3>
                  <div className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2">
                    <span className="text-blue-300 font-bold">{dog.afijo || currentCriadero?.afijo || 'Sin Afijo'}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300 font-mono text-[10px]">
                      Chip: {dog.microchip || 'S/N'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body with White Background & Clean Metrics */}
              <div className="p-4 space-y-3 text-xs">
                {/* Age & Birth Date */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Nac: <strong className="text-slate-700 dark:text-slate-300">{dog.fechaNacimiento}</strong></span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    Edad: {calculateDogAge(dog.fechaNacimiento).text}
                  </span>
                </div>

                {/* Health & POA Seals */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-medium block text-[10px]">Cadera (HD)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                      {dog.displasiaCadera}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-0.5">
                    <span className="text-slate-400 font-medium block text-[10px]">Codo (ED)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                      {dog.displasiaCodo}
                    </span>
                  </div>
                </div>

                {/* Lineage Preview */}
                <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="truncate">
                    <strong className="text-slate-700 dark:text-slate-300">P:</strong>{' '}
                    <span>{dog.padreNombre || 'Sin registro'}</span>
                  </div>
                  <div className="truncate">
                    <strong className="text-slate-700 dark:text-slate-300">M:</strong>{' '}
                    <span>{dog.madreNombre || 'Sin registro'}</span>
                  </div>
                </div>

                {/* Titles / Selection */}
                {dog.titulos && dog.titulos.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-bold truncate">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{dog.titulos[0]}</span>
                    {dog.titulos.length > 1 && (
                      <span className="text-slate-400 font-mono">+{dog.titulos.length - 1}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Card Actions matching clean SaaS look */}
            <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openPrintModal('PEDIGREE', dog.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Imprimir Pedigree Oficial"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingDog(dog);
                    setIsFormOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Editar
                </button>
              </div>

              <button
                onClick={() => setSelectedDog(dog)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <span>Ficha</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDogs.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500">
          <Dog className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            No se encontraron ejemplares
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Intenta con otro término de búsqueda o limpia los filtros seleccionados.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDog && (
        <DogDetailModal
          dog={selectedDog}
          onClose={() => setSelectedDog(null)}
          onEdit={() => {
            setEditingDog(selectedDog);
            setSelectedDog(null);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* Create / Edit Modal */}
      {isFormOpen && (
        <DogFormModal
          dog={editingDog}
          onClose={() => {
            setIsFormOpen(false);
            setEditingDog(null);
          }}
        />
      )}
    </div>
  );
};
