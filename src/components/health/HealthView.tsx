import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RegistroSanitario } from '../../types';
import {
  Stethoscope,
  Plus,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Printer,
  Trash2,
  FileCheck2,
  Search,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const HealthView: React.FC = () => {
  const { registrosSanitarios, ejemplares, addRegistroSanitario, deleteRegistroSanitario, currentCriaderoId, openPrintModal, exportToCSV } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [ejemplarId, setEjemplarId] = useState(ejemplares[0]?.id || '');
  const [tipo, setTipo] = useState<'VACUNA' | 'DESPARASITACION' | 'ESTUDIO' | 'TRATAMIENTO' | 'CIRUGIA' | 'CONTROL'>('VACUNA');
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [proximaFecha, setProximaFecha] = useState('');
  const [dosisOLote, setDosisOLote] = useState('');
  const [veterinario, setVeterinario] = useState('Dr. Fernando Soria (MP 4921)');
  const [resultado, setResultado] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const selectedDog = ejemplares.find((e) => e.id === ejemplarId);

  const filteredSanidad = registrosSanitarios.filter((s) => {
    const q = searchTerm.toLowerCase();
    const dog = ejemplares.find((e) => e.id === s.ejemplarId);
    const matchesSearch =
      s.nombre.toLowerCase().includes(q) ||
      dog?.nombreCompleto.toLowerCase().includes(q) ||
      s.veterinario.toLowerCase().includes(q);

    const matchesTipo = filterTipo === 'TODOS' || s.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const handleSaveSanidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !selectedDog) return;

    addRegistroSanitario({
      criaderoId: currentCriaderoId,
      ejemplarId: selectedDog.id,
      tipo,
      nombre,
      fecha,
      proximaFecha: proximaFecha || undefined,
      dosisOLote: dosisOLote || undefined,
      veterinario,
      resultado: resultado || undefined,
      observaciones: observaciones || undefined,
    });

    setIsFormOpen(false);
    setNombre('');
    setDosisOLote('');
    setResultado('');
    setObservaciones('');
  };

  const handleExportCSV = () => {
    const rows = filteredSanidad.map((s) => {
      const dog = ejemplares.find((e) => e.id === s.ejemplarId);
      return {
        Ejemplar: dog?.nombreCompleto || s.ejemplarId,
        Tipo: s.tipo,
        NombreEstudioOVacuna: s.nombre,
        Fecha: s.fecha,
        ProximoVencimiento: s.proximaFecha || '',
        DosisOLote: s.dosisOLote || '',
        Veterinario: s.veterinario,
        Resultado: s.resultado || '',
      };
    });
    exportToCSV(`REGISTRO_SANITARIO_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-emerald-600" />
            Ficha Sanitaria Avanzada y Libreta Digital
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de vacunas, desparasitaciones, ecografías, dictámenes oficiales HD/ED y libreta imprimible.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Registro Sanitario</span>
          </button>
        </div>
      </div>

      {/* Official Health Highlights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dysplasia summary */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Dictámenes Oficiales HD / ED
          </span>
          <div className="text-xl font-bold text-emerald-700">
            100% de Ejemplares Aptos
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Todas las placas avaladas por la Comisión de Cría del Club POA según baremos SV.
          </p>
        </div>

        {/* Brucellosis status */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Control de Brucelosis Canina
          </span>
          <div className="text-xl font-bold text-emerald-700">
            Criadero Libre de Brucelosis
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Serologías semestrales con resultado Negativo oficial previo a cada servicio.
          </p>
        </div>

        {/* DNA status */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Banco de ADN Oficial
          </span>
          <div className="text-xl font-bold text-blue-700">
            DNA Geprüft (Comprobado)
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Filiación y parentesco garantizado con registro de marcadores moleculares.
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por vacuna, ejemplar, veterinario..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="VACUNA">Vacunaciones</option>
          <option value="DESPARASITACION">Desparasitaciones</option>
          <option value="ESTUDIO">Estudios y Ecografías</option>
          <option value="TRATAMIENTO">Tratamientos</option>
          <option value="CONTROL">Controles Periódicos</option>
        </select>
      </div>

      {/* Health records Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Ejemplar</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Detalle / Procedimiento</th>
                <th className="p-3">Próximo Refuerzo</th>
                <th className="p-3">Veterinario Actuante</th>
                <th className="p-3 text-center">Libreta</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSanidad.map((reg) => {
                const dog = ejemplares.find((e) => e.id === reg.ejemplarId);
                return (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono text-slate-500">{reg.fecha}</td>
                    <td className="p-3 font-bold text-slate-900">
                      {dog?.nombreCompleto || 'Ejemplar Registrado'}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {reg.tipo}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{reg.nombre}</div>
                      {reg.dosisOLote && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Lote/Dosis: {reg.dosisOLote}
                        </div>
                      )}
                      {reg.resultado && (
                        <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                          {reg.resultado}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono font-medium text-amber-700">
                      {reg.proximaFecha || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-600">{reg.veterinario}</td>
                    <td className="p-3 text-center">
                      {dog && (
                        <button
                          onClick={() => openPrintModal('HEALTH_BOOK', dog.id)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
                          title="Imprimir Libreta Sanitaria"
                        >
                          <Printer className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                          Libreta
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => deleteRegistroSanitario(reg.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSanidad.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    Sin registros sanitarios con los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl text-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Nuevo Registro Sanitario</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSanidad} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ejemplar Paciente *</label>
                <select
                  value={ejemplarId}
                  onChange={(e) => setEjemplarId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                >
                  {ejemplares.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombreCompleto} ({d.numeroPOA || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Acto Sanitario *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VACUNA">VACUNA</option>
                    <option value="DESPARASITACION">DESPARASITACIÓN</option>
                    <option value="ESTUDIO">ESTUDIO / ECOGRAFÍA / RAYOS X</option>
                    <option value="TRATAMIENTO">TRATAMIENTO MÉDICO</option>
                    <option value="CONTROL">CONTROL DE RUTINA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha de Aplicación *</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre de la Vacuna / Fármaco / Estudio *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="ej: Séxtuple Anual (Vanguard Plus 5/CV-L)"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosis o Lote</label>
                  <input
                    type="text"
                    value={dosisOLote}
                    onChange={(e) => setDosisOLote(e.target.value)}
                    placeholder="Lote #89421"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Próximo Vencimiento</label>
                  <input
                    type="date"
                    value={proximaFecha}
                    onChange={(e) => setProximaFecha(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Veterinario Actuante</label>
                <input
                  type="text"
                  value={veterinario}
                  onChange={(e) => setVeterinario(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
