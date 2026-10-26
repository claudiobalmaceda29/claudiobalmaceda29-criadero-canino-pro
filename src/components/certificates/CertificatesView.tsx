import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FileCheck2, Printer, Dog, Baby, ShieldCheck, Download, Search } from 'lucide-react';

export const CertificatesView: React.FC = () => {
  const { ejemplares, cachorros, currentCriadero, openPrintModal } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-blue-600" />
          Libreta Sanitaria y Certificados Oficiales
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Generación, descarga e impresión oficial de libretas sanitarias y certificados de entrega de cachorros.
        </p>
      </div>

      {/* Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Libreta Sanitaria Digital */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Libreta Sanitaria Digital</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Documento médico con registro completo de vacunas séxtuple, antirrábica, desparasitaciones periódicas, lote de laboratorio y validación veterinaria.
              </p>
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Seleccionar Ejemplar Adulto o Cachorro:
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {ejemplares.map((dog) => (
                  <div
                    key={dog.id}
                    className="p-2 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-100/70 flex items-center justify-between text-xs shadow-xs"
                  >
                    <div>
                      <strong className="text-slate-900 block">{dog.nombreCompleto}</strong>
                      <span className="text-[10px] text-slate-500">POA: {dog.numeroPOA}</span>
                    </div>
                    <button
                      onClick={() => openPrintModal('HEALTH_BOOK', dog.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Certificado Oficial de Entrega de Cachorro */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Certificado Oficial de Cesión y Entrega</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Documento formal que certifica la cesión y entrega responsable del cachorro, garantías sanitarias, microchip, datos del comprador y espacios para firmas.
              </p>
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Seleccionar Cachorro a Entregar:
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {cachorros.map((pup) => (
                  <div
                    key={pup.id}
                    className="p-2 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-100/70 flex items-center justify-between text-xs shadow-xs"
                  >
                    <div>
                      <strong className="text-slate-900 block">{pup.nombre || pup.identificadorProvisorio}</strong>
                      <span className="text-[10px] text-slate-500">
                        {pup.camadaNombre} • Estado: {pup.estadoComercial}
                        {pup.comprador && ` • ${pup.comprador.nombre}`}
                      </span>
                    </div>
                    <button
                      onClick={() => openPrintModal('DELIVERY_CERTIFICATE', pup.id)}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Imprimir</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
