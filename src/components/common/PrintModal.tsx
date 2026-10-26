import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, Download, Award, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

export const PrintModal: React.FC = () => {
  const { printModalData, closePrintModal, currentCriadero, ejemplares, cachorros, camadas, transacciones, simulaciones } = useApp();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!printModalData.isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const { type, targetId, extraData } = printModalData;

  const targetDog = ejemplares.find((e) => e.id === targetId);
  const targetPuppy = cachorros.find((c) => c.id === targetId);
  const targetLitter = camadas.find((c) => c.id === targetId);
  const targetSim = simulaciones.find((s) => s.id === targetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Container */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-800 overflow-hidden">
        {/* Header toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Vista Previa de Documento Oficial</h3>
              <p className="text-[11px] text-slate-500">Apto para impresión directa y guardado en PDF</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={closePrintModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Viewport Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/90 flex justify-center">
          {/* Paper sheet simulation */}
          <div
            ref={printAreaRef}
            id="printable-document"
            className="w-full max-w-3xl bg-white text-slate-900 rounded-lg shadow-xl p-8 sm:p-10 border border-slate-200 print:m-0 print:p-8 print:w-full print:shadow-none print:border-none print:rounded-none"
            style={{ minHeight: '1000px' }}
          >
            {/* 1. Official POA Pedigree Layout */}
            {type === 'PEDIGREE' && targetDog && (
              <div className="font-serif">
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
                  <div className="text-[11px] font-sans font-bold tracking-widest uppercase text-slate-600">
                    CLUB ARGENTINO DE CRIADORES DEL PERRO OVEJERO ALEMÁN (POA) • FCA • WUSV
                  </div>
                  <h1 className="text-2xl font-bold tracking-wide mt-1 text-slate-950 uppercase">
                    Certificado de Genealogía y Pedigree
                  </h1>
                  <div className="text-xs font-sans text-slate-600 mt-1">
                    Criadero: <strong className="text-slate-900">{currentCriadero?.nombre}</strong> • Afijo: <strong className="text-slate-900">{currentCriadero?.afijo}</strong>
                  </div>
                </div>

                {/* Dog Primary Information */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sans mb-6">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Nombre del Ejemplar:</span>
                    <strong className="text-sm text-blue-950 font-bold block">{targetDog.nombreCompleto}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">N° Registro POA:</span>
                    <strong className="text-slate-900">{targetDog.numeroPOA || 'En trámite'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Microchip:</span>
                    <strong className="text-slate-900 font-mono">{targetDog.microchip || 'S/N'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Fecha Nacimiento:</span>
                    <strong className="text-slate-900">{targetDog.fechaNacimiento}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Sexo / Manto:</span>
                    <strong className="text-slate-900">{targetDog.sexo} • {targetDog.color}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Calificación Cría:</span>
                    <strong className="text-slate-900">{targetDog.calificacionCria}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Displasia Cadera (HD):</span>
                    <strong className="text-emerald-700 font-semibold">{targetDog.displasiaCadera}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Displasia Codo (ED):</span>
                    <strong className="text-emerald-700 font-semibold">{targetDog.displasiaCodo}</strong>
                  </div>
                </div>

                {/* 4 Generation Tabular Tree */}
                <h4 className="text-xs font-sans uppercase font-bold tracking-wider text-slate-700 mb-2 border-b border-slate-300 pb-1">
                  Árbol Genealógico Oficial (4 Generaciones)
                </h4>

                <div className="text-[11px] font-sans border border-slate-300 rounded overflow-hidden">
                  {/* Sire Side */}
                  <div className="grid grid-cols-4 border-b border-slate-300">
                    <div className="p-3 bg-blue-50/70 border-r border-slate-300 flex flex-col justify-center font-bold text-blue-950">
                      <span className="text-[9px] text-blue-700 uppercase font-sans font-normal">PADRE (1ra Gen)</span>
                      {targetDog.padreNombre || 'Sin registrar'}
                    </div>
                    <div className="col-span-3 grid grid-rows-2">
                      <div className="grid grid-cols-3 border-b border-slate-200">
                        <div className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                          <span className="text-[8px] text-slate-500 block">ABUELO PATERNO</span>
                          {targetDog.abueloPaterno || 'Línea Directa'}
                        </div>
                        <div className="p-2 border-r border-slate-200 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELO</span>
                          {targetDog.bisabuelos?.pp_p || 'Gary vom Hühnegrab'}
                        </div>
                        <div className="p-2 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELA</span>
                          {targetDog.bisabuelos?.pp_m || 'Bella von der Liebeswarte'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                          <span className="text-[8px] text-slate-500 block">ABUELA PATERNA</span>
                          {targetDog.abuelaPaterna || 'Línea Directa'}
                        </div>
                        <div className="p-2 border-r border-slate-200 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELO</span>
                          {targetDog.bisabuelos?.pm_p || 'Vegas du Haut Mansard'}
                        </div>
                        <div className="p-2 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELA</span>
                          {targetDog.bisabuelos?.pm_m || 'Patricia vom Hühnegrab'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dam Side */}
                  <div className="grid grid-cols-4">
                    <div className="p-3 bg-pink-50/70 border-r border-slate-300 flex flex-col justify-center font-bold text-pink-950">
                      <span className="text-[9px] text-pink-700 uppercase font-sans font-normal">MADRE (1ra Gen)</span>
                      {targetDog.madreNombre || 'Sin registrar'}
                    </div>
                    <div className="col-span-3 grid grid-rows-2">
                      <div className="grid grid-cols-3 border-b border-slate-200">
                        <div className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                          <span className="text-[8px] text-slate-500 block">ABUELO MATERNO</span>
                          {targetDog.abueloMaterno || 'Línea Directa'}
                        </div>
                        <div className="p-2 border-r border-slate-200 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELO</span>
                          {targetDog.bisabuelos?.mp_p || 'Omen v. Radhaus'}
                        </div>
                        <div className="p-2 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELA</span>
                          {targetDog.bisabuelos?.mp_m || 'Xara del Plata'}
                        </div>
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="p-2 border-r border-slate-200 font-semibold text-slate-800">
                          <span className="text-[8px] text-slate-500 block">ABUELA MATERNA</span>
                          {targetDog.abuelaMaterna || 'Línea Directa'}
                        </div>
                        <div className="p-2 border-r border-slate-200 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELO</span>
                          {targetDog.bisabuelos?.mm_p || 'Dux de Cuatro Flores'}
                        </div>
                        <div className="p-2 text-[10px] text-slate-700">
                          <span className="text-[8px] text-slate-400 block">BISABUELA</span>
                          {targetDog.bisabuelos?.mm_m || 'Wanda v. d. Liebeswarte'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center font-sans text-xs">
                  <div>
                    <div className="border-b border-slate-400 h-14 mb-2"></div>
                    <div className="font-bold text-slate-800">{currentCriadero?.responsable}</div>
                    <div className="text-[10px] text-slate-500">Titular del Criadero • Afijo {currentCriadero?.afijo}</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 h-14 mb-2"></div>
                    <div className="font-bold text-slate-800">Comisión de Cría y Registro Genealógico</div>
                    <div className="text-[10px] text-slate-500">Club Argentino de Criadores del Perro Ovejero Alemán</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Official Puppy Handover Certificate (Certificado de Entrega de Cachorro) */}
            {type === 'DELIVERY_CERTIFICATE' && targetPuppy && (
              <div className="font-sans text-xs">
                {/* Header */}
                <div className="text-center border-b-2 border-blue-900 pb-4 mb-6">
                  <div className="text-[10px] font-bold tracking-widest text-blue-900 uppercase">
                    CERTIFICADO OFICIAL DE CESIÓN Y ENTREGA DE EJEMPLAR CANINO
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {currentCriadero?.nombre}
                  </h2>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Afijo Oficial: <strong>{currentCriadero?.afijo}</strong> • Registro: <strong>{currentCriadero?.registroPOA}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentCriadero?.direccion}, {currentCriadero?.ciudad}, {currentCriadero?.provincia}, Argentina
                  </div>
                </div>

                {/* Contract Body */}
                <div className="space-y-4 text-slate-800 leading-relaxed">
                  <p>
                    Por medio del presente documento, el criadero <strong>{currentCriadero?.nombre}</strong> representado por su titular <strong>{currentCriadero?.responsable}</strong>, hace entrega formal y definitiva del ejemplar canino que se detalla a continuación al adquiriente:
                  </p>

                  {/* Puppy specs */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider mb-2">
                      1. Identificación del Ejemplar
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <div><strong>Nombre:</strong> {targetPuppy.nombre || targetPuppy.identificadorProvisorio}</div>
                      <div><strong>Raza:</strong> Ovejero Alemán (Pastor Alemán)</div>
                      <div><strong>Sexo:</strong> {targetPuppy.sexo}</div>
                      <div><strong>Fecha Nacimiento:</strong> {targetPuppy.fechaNacimiento}</div>
                      <div><strong>Color / Manto:</strong> {targetPuppy.color}</div>
                      <div><strong>Microchip Oficial:</strong> {targetPuppy.microchip || 'Colocado según norma ISO'}</div>
                      <div><strong>N° POA:</strong> {targetPuppy.numeroPOA || 'Trámite en curso'}</div>
                      <div><strong>Padre:</strong> {targetPuppy.padreNombre}</div>
                      <div><strong>Madre:</strong> {targetPuppy.madreNombre}</div>
                    </div>
                  </div>

                  {/* Buyer specs */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider mb-2">
                      2. Datos del Nuevo Propietario / Responsable
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><strong>Nombre y Apellido:</strong> {targetPuppy.comprador?.nombre || '________________________'}</div>
                      <div><strong>DNI / CUIT:</strong> {targetPuppy.comprador?.dni || '________________________'}</div>
                      <div><strong>Teléfono de Contacto:</strong> {targetPuppy.comprador?.telefono || '________________________'}</div>
                      <div><strong>Correo Electrónico:</strong> {targetPuppy.comprador?.email || '________________________'}</div>
                      <div className="col-span-2"><strong>Domicilio:</strong> {targetPuppy.comprador?.domicilio || '________________________'}, {targetPuppy.comprador?.localidad || ''}</div>
                    </div>
                  </div>

                  {/* Guarantees & Terms */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[10px] text-slate-700">
                    <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider">
                      3. Garantías Sanitarias y Tenencia Responsable
                    </h4>
                    <p>
                      <strong>a) Sanidad:</strong> El ejemplar se entrega en perfecto estado de salud, debidamente desparasitado y con su plan de vacunación iniciado según consta en la libreta sanitaria adjunta.
                    </p>
                    <p>
                      <strong>b) Genealogía:</strong> Los progenitores cuentan con sus estudios de displasia de cadera y codo aprobados y su selección de cría reglamentaria por el Club POA.
                    </p>
                    <p>
                      <strong>c) Compromiso de Cuidado:</strong> El nuevo propietario se compromete a brindar alojamiento digno, alimentación de calidad super premium y atención veterinaria continua, garantizando el bienestar del animal.
                    </p>
                  </div>

                  {/* Date & signatures */}
                  <div className="pt-4">
                    <div className="text-[11px] mb-8 text-right">
                      En {currentCriadero?.ciudad}, a los {new Date().getDate()} días del mes de {new Date().toLocaleString('es-AR', { month: 'long' })} de {new Date().getFullYear()}.
                    </div>

                    <div className="grid grid-cols-2 gap-10 text-center text-[11px]">
                      <div>
                        <div className="border-b border-slate-400 h-16 mb-2"></div>
                        <div className="font-bold text-slate-900">{currentCriadero?.responsable}</div>
                        <div className="text-[10px] text-slate-500">Por el Criadero (Firma y Aclaración)</div>
                      </div>
                      <div>
                        <div className="border-b border-slate-400 h-16 mb-2"></div>
                        <div className="font-bold text-slate-900">{targetPuppy.comprador?.nombre || 'Firma del Adquiriente'}</div>
                        <div className="text-[10px] text-slate-500">Adquiriente / Titular Responsable</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Solicitud de emisión de pedigree digital */}
            {type === 'PEDIGREE_REQUEST' && targetPuppy && (
              <div className="font-sans text-xs">
                {/* Header Oficial */}
                <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">
                    CLUB ARGENTINO DE CRIADORES DEL PERRO OVEJERO ALEMÁN (POA) • REGISTRO GENEALÓGICO
                  </div>
                  <h1 className="text-2xl font-black text-slate-950 uppercase mt-1">
                    Solicitud de emisión de pedigree digital
                  </h1>
                  <div className="text-xs text-slate-700 mt-1 font-semibold">
                    Formulario Oficial de Inscripción Individual de Ejemplar Canino
                  </div>
                  <div className="text-[11px] text-blue-800 font-bold mt-1">
                    Criadero: {currentCriadero?.nombre} • Afijo: {currentCriadero?.afijo} • Reg. POA: {currentCriadero?.registroPOA}
                  </div>
                </div>

                <div className="space-y-4 text-slate-800 leading-relaxed">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                    <p>
                      Por medio de la presente, el titular del criadero <strong>{currentCriadero?.nombre}</strong> solicita formalmente a la Comisión de Registro Genealógico del Club POA la <strong>emisión del pedigree digital oficial</strong> para el ejemplar canino cuyos datos biológicos y reproductivos se consignan a continuación:
                    </p>
                  </div>

                  {/* 1. Datos del Ejemplar / Cachorro */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>1. Identificación del Ejemplar Solicitado</span>
                      <span className="font-mono text-[10px] text-blue-700">Estado: Trámite Digital</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                      <div><strong>Nombre Propuesto:</strong> {targetPuppy.nombre || targetPuppy.identificadorProvisorio} {currentCriadero?.afijo}</div>
                      <div><strong>Raza Oficial:</strong> Ovejero Alemán (Pastor Alemán)</div>
                      <div><strong>Sexo:</strong> {targetPuppy.sexo}</div>
                      <div><strong>Fecha Nacimiento:</strong> {targetPuppy.fechaNacimiento}</div>
                      <div><strong>Manto / Color:</strong> {targetPuppy.color}</div>
                      <div><strong>Camada Registrada:</strong> {targetPuppy.camadaNombre}</div>
                      <div><strong>Microchip ISO 11784/85:</strong> {targetPuppy.microchip || 'Pendiente de homologación'}</div>
                      <div><strong>Identificador Provisorio:</strong> {targetPuppy.identificadorProvisorio}</div>
                      <div><strong>Color Collar Identificatorio:</strong> {targetPuppy.colorCollar || 'Sin collar'}</div>
                    </div>
                  </div>

                  {/* 2. Progenitores Inmediatos */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                      2. Progenitores Verificados (Árbol Directo)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                      <div className="p-2.5 bg-white border border-blue-100 rounded-lg">
                        <span className="text-[9px] font-bold text-blue-700 uppercase block">PADRE (SIRE)</span>
                        <strong className="text-slate-900 block mt-0.5">{targetPuppy.padreNombre}</strong>
                        <span className="text-[10px] text-slate-500 block mt-1">Control de filiación y ADN verificado en criadero</span>
                      </div>
                      <div className="p-2.5 bg-white border border-pink-100 rounded-lg">
                        <span className="text-[9px] font-bold text-pink-700 uppercase block">MADRE (DAM)</span>
                        <strong className="text-slate-900 block mt-0.5">{targetPuppy.madreNombre}</strong>
                        <span className="text-[10px] text-slate-500 block mt-1">Control de filiación y ADN verificado en criadero</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Titularidad del Pedigree */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <h4 className="text-[11px] font-bold text-blue-950 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                      3. Titularidad Registral Solicitada
                    </h4>
                    {targetPuppy.comprador ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div><strong>Titular Adquirente:</strong> {targetPuppy.comprador.nombre}</div>
                        <div><strong>DNI / Pasaporte:</strong> {targetPuppy.comprador.dni || 'Sin especificar'}</div>
                        <div><strong>Teléfono:</strong> {targetPuppy.comprador.telefono || 'Sin especificar'}</div>
                        <div><strong>Email:</strong> {targetPuppy.comprador.email || 'Sin especificar'}</div>
                        <div className="col-span-2"><strong>Domicilio:</strong> {targetPuppy.comprador.domicilio}, {targetPuppy.comprador.localidad}</div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-700">
                        <strong>Titular Registral:</strong> Criadero {currentCriadero?.nombre} (Ejemplar en reserva de cría o plantel propio).
                      </div>
                    )}
                  </div>

                  {/* 4. Declaración Jurada */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                    <p>
                      <strong>DECLARACIÓN JURADA:</strong> El criador firmante declara bajo juramento que los datos aportados en esta solicitud son fidedignos y corresponden a la camada nacida en las instalaciones del criadero, habiéndose verificado la compatibilidad genética, servicio y microchipado según las normas vigentes de POA, FCA y WUSV.
                    </p>
                  </div>

                  {/* Firmas */}
                  <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
                    <div>
                      <div className="border-b border-slate-400 h-14 mb-2"></div>
                      <div className="font-bold text-slate-800">{currentCriadero?.responsable}</div>
                      <div className="text-[10px] text-slate-500">Criador Solicitante • Afijo {currentCriadero?.afijo}</div>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 h-14 mb-2"></div>
                      <div className="font-bold text-slate-800">Mesa de Entradas y Certificación POA</div>
                      <div className="text-[10px] text-slate-500">Club Argentino de Criadores del Perro Ovejero Alemán</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Digital Health Book (Libreta Sanitaria Digital) */}
            {type === 'HEALTH_BOOK' && (targetDog || targetPuppy) && (
              <div className="font-sans text-xs">
                {(() => {
                  const item = targetDog || targetPuppy!;
                  const isDog = !!targetDog;
                  const name = isDog ? (targetDog as any).nombreCompleto : (targetPuppy as any).nombre || (targetPuppy as any).identificadorProvisorio;
                  return (
                    <div>
                      {/* Cover */}
                      <div className="border-b-4 border-emerald-600 pb-4 mb-6 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                            DOCUMENTO MÉDICO VETERINARIO OFICIAL
                          </span>
                          <h2 className="text-2xl font-black text-slate-900">Libreta Sanitaria Digital Canina</h2>
                          <div className="text-xs text-slate-600">{currentCriadero?.nombre} • {currentCriadero?.afijo}</div>
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                          <ShieldCheck className="w-9 h-9" />
                        </div>
                      </div>

                      {/* Patient specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6 text-xs">
                        <div><strong>Paciente:</strong> <span className="text-slate-900 font-bold block">{name}</span></div>
                        <div><strong>Raza:</strong> Ovejero Alemán</div>
                        <div><strong>Sexo:</strong> {item.sexo}</div>
                        <div><strong>Nacimiento:</strong> {item.fechaNacimiento}</div>
                        <div><strong>Microchip:</strong> <span className="font-mono text-slate-800">{item.microchip || 'Registrado'}</span></div>
                        <div><strong>N° POA:</strong> {item.numeroPOA || 'Trámite'}</div>
                        <div><strong>Color:</strong> {item.color}</div>
                        <div><strong>Estado:</strong> Sanidad al día</div>
                      </div>

                      {/* Vaccines Table */}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        Registro Oficial de Vacunaciones
                      </h4>
                      <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden mb-6">
                        <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-2 border-b border-slate-200">Fecha</th>
                            <th className="p-2 border-b border-slate-200">Inmunización / Vacuna</th>
                            <th className="p-2 border-b border-slate-200">Lote / Marca</th>
                            <th className="p-2 border-b border-slate-200">Veterinario Actuante</th>
                            <th className="p-2 border-b border-slate-200 text-center">Firma y Sello</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {isDog ? (
                            <>
                              <tr>
                                <td className="p-2 font-mono">10/04/2026</td>
                                <td className="p-2 font-semibold">Séxtuple Anual (Vanguard Plus 5/CV-L)</td>
                                <td className="p-2 font-mono text-[10px]">Lote #89421</td>
                                <td className="p-2">Dr. Fernando Soria (MP 4921)</td>
                                <td className="p-2 text-center text-emerald-600 font-bold text-[10px]">VALIDADO</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-mono">15/05/2026</td>
                                <td className="p-2 font-semibold">Antirrábica Oficial (Defensor 3)</td>
                                <td className="p-2 font-mono text-[10px]">Lote #33019</td>
                                <td className="p-2">Dr. Fernando Soria (MP 4921)</td>
                                <td className="p-2 text-center text-emerald-600 font-bold text-[10px]">VALIDADO</td>
                              </tr>
                            </>
                          ) : (
                            ((targetPuppy?.vacunas || []).length > 0 ? (
                              targetPuppy?.vacunas.map((v, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 font-mono">{v.fecha}</td>
                                  <td className="p-2 font-semibold">{v.vacuna}</td>
                                  <td className="p-2 font-mono text-[10px]">{v.lote || 'Oficial'}</td>
                                  <td className="p-2">{v.veterinario}</td>
                                  <td className="p-2 text-center text-emerald-600 font-bold text-[10px]">APLICADO</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400">
                                  Sin vacunas registradas aún.
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      {/* Deworming Table */}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-300 pb-1">
                        Control Antiparasitario Interno y Externo
                      </h4>
                      <table className="w-full text-left text-xs border border-slate-200 rounded overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                          <tr>
                            <th className="p-2 border-b border-slate-200">Fecha</th>
                            <th className="p-2 border-b border-slate-200">Fármaco / Principio Activo</th>
                            <th className="p-2 border-b border-slate-200">Dosis Administrada</th>
                            <th className="p-2 border-b border-slate-200">Próximo Refuerzo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="p-2 font-mono">01/08/2026</td>
                            <td className="p-2 font-semibold">Total F Forte (Praziquantel / Fenbendazol)</td>
                            <td className="p-2">1 comprimido cada 20 kg</td>
                            <td className="p-2 font-mono text-blue-700">01/11/2026</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 4. Detailed Economic Balance Statement */}
            {type === 'ECONOMIC_REPORT' && (
              <div className="font-sans text-xs">
                <div className="border-b-2 border-slate-800 pb-4 mb-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    ESTADO FINANCIERO Y BALANCE DEL CRIADERO
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {currentCriadero?.nombre} ({currentCriadero?.afijo})
                  </h2>
                  <div className="text-xs text-slate-600 mt-1">
                    Monedas: Pesos Argentinos (ARS) y Dólares Estadounidenses (USD)
                  </div>
                </div>

                <div className="space-y-4">
                  <table className="w-full text-left text-xs border border-slate-200 rounded">
                    <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2 border-b">Fecha</th>
                        <th className="p-2 border-b">Tipo</th>
                        <th className="p-2 border-b">Categoría</th>
                        <th className="p-2 border-b">Concepto</th>
                        <th className="p-2 border-b text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transacciones.map((tx) => (
                        <tr key={tx.id}>
                          <td className="p-2 font-mono">{tx.fecha}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              tx.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.tipo}
                            </span>
                          </td>
                          <td className="p-2">{tx.categoria}</td>
                          <td className="p-2">{tx.concepto}</td>
                          <td className={`p-2 text-right font-bold font-mono ${
                            tx.tipo === 'INGRESO' ? 'text-emerald-700' : 'text-slate-900'
                          }`}>
                            {tx.moneda === 'USD' ? 'USD $' : '$'} {tx.monto.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
