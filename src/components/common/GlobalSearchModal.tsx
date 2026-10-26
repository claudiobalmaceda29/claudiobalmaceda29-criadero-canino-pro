import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, Dog, Baby, FolderKanban, HeartHandshake, Trophy, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, ejemplares, cachorros, camadas, montas, exposiciones, setActiveTab } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const results = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return { dogs: [], pups: [], litters: [], matings: [], shows: [] };

    const dogs = ejemplares
      .filter(
        (e) =>
          e.nombreCompleto.toLowerCase().includes(q) ||
          e.numeroPOA?.toLowerCase().includes(q) ||
          e.microchip?.toLowerCase().includes(q) ||
          e.tatuaje?.toLowerCase().includes(q) ||
          e.raza?.toLowerCase().includes(q) ||
          e.titulos?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const pups = cachorros
      .filter(
        (c) =>
          c.nombre?.toLowerCase().includes(q) ||
          c.identificadorProvisorio.toLowerCase().includes(q) ||
          c.numeroPOA?.toLowerCase().includes(q) ||
          c.microchip?.toLowerCase().includes(q) ||
          c.comprador?.nombre.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const litters = camadas
      .filter(
        (l) =>
          l.identificador.toLowerCase().includes(q) ||
          l.padreNombre.toLowerCase().includes(q) ||
          l.madreNombre.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matings = montas
      .filter(
        (m) =>
          m.codigoCiclo.toLowerCase().includes(q) ||
          m.hembraNombre.toLowerCase().includes(q) ||
          m.machoNombre.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const shows = exposiciones
      .filter(
        (s) =>
          s.nombreEvento.toLowerCase().includes(q) ||
          s.ejemplarNombre.toLowerCase().includes(q) ||
          s.juez.toLowerCase().includes(q) ||
          s.calificacion.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { dogs, pups, litters, matings, shows };
  }, [searchTerm, ejemplares, cachorros, camadas, montas, exposiciones]);

  if (!isSearchOpen) return null;

  const totalResults =
    results.dogs.length +
    results.pups.length +
    results.litters.length +
    results.matings.length +
    results.shows.length;

  const handleNavigate = (tab: string) => {
    setActiveTab(tab);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-800 overflow-hidden">
        {/* Search Input bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ejemplares, POA, microchip, cachorros, camadas, exposiciones..."
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 bg-white">
          {!searchTerm ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              Escribí para buscar en tiempo real en los registros del criadero activo.
              <div className="mt-2 text-[11px] text-slate-400">
                Podés buscar por: Nombre, Afijo, Número POA, Microchip, Camada o Juez.
              </div>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No se encontraron coincidencias para &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <>
              {/* Dogs */}
              {results.dogs.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5 flex items-center gap-1.5">
                    <Dog className="w-3.5 h-3.5" />
                    Ejemplares ({results.dogs.length})
                  </div>
                  <div className="space-y-1">
                    {results.dogs.map((dog) => (
                      <button
                        key={dog.id}
                        onClick={() => handleNavigate('ejemplares')}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={dog.fotoUrl || 'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=100&q=80'}
                            alt={dog.nombreCompleto}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                              {dog.nombreCompleto}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {dog.sexo} • {dog.numeroPOA} • Chip: {dog.microchip || 'S/N'}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Puppies */}
              {results.pups.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1.5 flex items-center gap-1.5">
                    <Baby className="w-3.5 h-3.5" />
                    Cachorros ({results.pups.length})
                  </div>
                  <div className="space-y-1">
                    {results.pups.map((pup) => (
                      <button
                        key={pup.id}
                        onClick={() => handleNavigate('cachorros')}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600">
                            {pup.nombre || pup.identificadorProvisorio}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {pup.camadaNombre} • Estado: {pup.estadoComercial}
                            {pup.comprador && ` • Comprador: ${pup.comprador.nombre}`}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Litters */}
              {results.litters.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1.5 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5" />
                    Camadas ({results.litters.length})
                  </div>
                  <div className="space-y-1">
                    {results.litters.map((litter) => (
                      <button
                        key={litter.id}
                        onClick={() => handleNavigate('camadas')}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-600">
                            {litter.identificador}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {litter.padreNombre} x {litter.madreNombre} • {litter.totalCachorros} cachorros ({litter.fechaNacimiento})
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shows */}
              {results.shows.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-1.5 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    Exposiciones ({results.shows.length})
                  </div>
                  <div className="space-y-1">
                    {results.shows.map((show) => (
                      <button
                        key={show.id}
                        onClick={() => handleNavigate('exposiciones')}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600">
                            {show.nombreEvento}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {show.ejemplarNombre} • {show.puesto} • {show.calificacion} (Juez: {show.juez})
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
