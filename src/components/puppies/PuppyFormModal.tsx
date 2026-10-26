import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Cachorro, Sexo, EstadoCachorro } from '../../types';
import {
  X,
  Baby,
  Save,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Cloud,
  Loader2,
} from 'lucide-react';
import { uploadDogPhoto } from '../../lib/firebase';

interface PuppyFormModalProps {
  puppy?: Cachorro | null;
  onClose: () => void;
}

export const PuppyFormModal: React.FC<PuppyFormModalProps> = ({ puppy, onClose }) => {
  const { addCachorro, updateCachorro, camadas, currentCriaderoId } = useApp();

  const [camadaId, setCamadaId] = useState(puppy?.camadaId || camadas[0]?.id || '');
  const selectedCamada = camadas.find((c) => c.id === camadaId) || camadas[0];

  const [nombre, setNombre] = useState(puppy?.nombre || '');
  const [identificadorProvisorio, setIdentificadorProvisorio] = useState(
    puppy?.identificadorProvisorio || 'Cachorro Collar Azul - M1'
  );
  const [sexo, setSexo] = useState<Sexo>(puppy?.sexo || 'MACHO');
  const [fechaNacimiento, setFechaNacimiento] = useState(
    puppy?.fechaNacimiento || selectedCamada?.fechaNacimiento || '2026-01-01'
  );
  const [color, setColor] = useState(puppy?.color || 'Negro y Fuego');
  const [colorCollar, setColorCollar] = useState(puppy?.colorCollar || '#2563eb');
  const [numeroPOA, setNumeroPOA] = useState(puppy?.numeroPOA || '');
  const [microchip, setMicrochip] = useState(puppy?.microchip || '');
  const [pesoNacimientoGramos, setPesoNacimientoGramos] = useState<number>(
    puppy?.pesoNacimientoGramos || 500
  );
  const [estadoComercial, setEstadoComercial] = useState<EstadoCachorro>(
    puppy?.estadoComercial || 'DISPONIBLE'
  );
  const [precio, setPrecio] = useState<number>(puppy?.precio || 1200000);
  const [moneda, setMoneda] = useState<'ARS' | 'USD'>(puppy?.moneda || 'ARS');
  const [senia, setSenia] = useState<number>(puppy?.senia || 0);

  // Photo & Firebase Storage
  const [fotoUrl, setFotoUrl] = useState(puppy?.fotoUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'storage' | 'external' | 'local' | null>(
    puppy?.fotoUrl ? 'external' : null
  );
  const [showManualUrl, setShowManualUrl] = useState(false);

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor seleccione un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setUploadError(null);
      setUploadSuccess(null);

      const { url, source } = await uploadDogPhoto(file, `cachorro_${identificadorProvisorio || 'nuevo'}`);
      setFotoUrl(url);
      setPhotoSource(source);
      setUploadSuccess('¡Foto subida a Firebase Storage exitosamente!');
    } catch (err: any) {
      console.error('Error subiendo foto:', err);
      setUploadError(`Error al subir imagen: ${err.message || 'Intente nuevamente'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Buyer info
  const [compradorNombre, setCompradorNombre] = useState(puppy?.comprador?.nombre || '');
  const [compradorDni, setCompradorDni] = useState(puppy?.comprador?.dni || '');
  const [compradorTelefono, setCompradorTelefono] = useState(puppy?.comprador?.telefono || '');
  const [compradorEmail, setCompradorEmail] = useState(puppy?.comprador?.email || '');
  const [compradorDomicilio, setCompradorDomicilio] = useState(puppy?.comprador?.domicilio || '');
  const [compradorLocalidad, setCompradorLocalidad] = useState(puppy?.comprador?.localidad || '');
  const [fechaEntregaEstimada, setFechaEntregaEstimada] = useState(
    puppy?.comprador?.fechaEntregaEstimada || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificadorProvisorio.trim()) return;

    const data: Omit<Cachorro, 'id'> = {
      criaderoId: currentCriaderoId,
      camadaId: selectedCamada?.id || '',
      camadaNombre: selectedCamada?.identificador || 'Camada Activa',
      padreId: selectedCamada?.padreId || '',
      padreNombre: selectedCamada?.padreNombre || '',
      madreId: selectedCamada?.madreId || '',
      madreNombre: selectedCamada?.madreNombre || '',
      nombre,
      identificadorProvisorio,
      sexo,
      fechaNacimiento,
      color,
      colorCollar,
      numeroPOA,
      microchip,
      pesoNacimientoGramos,
      pesajes: puppy?.pesajes || [
        { semana: 0, fecha: fechaNacimiento, pesoGramos: pesoNacimientoGramos },
      ],
      vacunas: puppy?.vacunas || [],
      desparasitaciones: puppy?.desparasitaciones || [],
      estadoComercial,
      precio,
      moneda,
      senia,
      fotoUrl: fotoUrl || undefined,
      comprador: compradorNombre
        ? {
            nombre: compradorNombre,
            dni: compradorDni,
            telefono: compradorTelefono,
            email: compradorEmail,
            domicilio: compradorDomicilio,
            localidad: compradorLocalidad,
            fechaEntregaEstimada,
          }
        : undefined,
    };

    if (puppy) {
      updateCachorro(puppy.id, data);
    } else {
      addCachorro(data);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {puppy ? 'Editar Ficha de Cachorro' : 'Registrar Nuevo Cachorro'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Camada: {selectedCamada?.identificador || 'Camada actual'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs custom-scrollbar">
          {/* Camada selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Camada de Origen *
            </label>
            <select
              value={camadaId}
              onChange={(e) => setCamadaId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {camadas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.identificador} ({c.fechaNacimiento}) • {c.padreNombre} x {c.madreNombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Identificador Provisorio / Collar *
              </label>
              <input
                type="text"
                value={identificadorProvisorio}
                onChange={(e) => setIdentificadorProvisorio(e.target.value)}
                placeholder="ej: Cachorro Collar Rojo - M1"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Definitivo (si ya fue asignado)
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej: Apolo Von Der Balmaceda"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sexo *</label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as Sexo)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
              >
                <option value="MACHO">Macho ♂</option>
                <option value="HEMBRA">Hembra ♀</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Peso Nacimiento (g)</label>
              <input
                type="number"
                value={pesoNacimientoGramos}
                onChange={(e) => setPesoNacimientoGramos(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Color del Collar</label>
              <input
                type="color"
                value={colorCollar}
                onChange={(e) => setColorCollar(e.target.value)}
                className="w-full h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Color / Manto</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Negro y Fuego"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Microchip</label>
              <input
                type="text"
                value={microchip}
                onChange={(e) => setMicrochip(e.target.value)}
                placeholder="9810981..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">N° POA</label>
              <input
                type="text"
                value={numeroPOA}
                onChange={(e) => setNumeroPOA(e.target.value)}
                placeholder="POA-..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Photographic Asset / Firebase Storage Section */}
          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Fotografía del Cachorro (Firebase Storage)</span>
              </label>
              {photoSource === 'storage' && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px] flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  <span>Firebase Storage</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {fotoUrl ? (
                <div className="relative group shrink-0">
                  <img
                    src={fotoUrl}
                    alt="Previsualización"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoUrl('');
                      setUploadSuccess(null);
                    }}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow-xs cursor-pointer hover:bg-rose-700"
                    title="Eliminar fotografía"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <Camera className="w-6 h-6" />
                  <span className="text-[9px] mt-1 font-mono">Sin foto</span>
                </div>
              )}

              <div className="space-y-1.5 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <label
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isUploadingPhoto
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    }`}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{fotoUrl ? 'Reemplazar Foto' : 'Subir Foto'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowManualUrl((prev) => !prev)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {showManualUrl ? 'Ocultar URL' : 'O URL'}
                  </button>
                </div>

                {uploadSuccess && (
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="text-[11px] text-rose-600 font-medium">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>

            {showManualUrl && (
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                <input
                  type="url"
                  value={fotoUrl}
                  onChange={(e) => {
                    setFotoUrl(e.target.value);
                    setPhotoSource('external');
                  }}
                  placeholder="https://ejemplo.com/cachorro.jpg"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono text-xs"
                />
              </div>
            )}
          </div>

          {/* Commercial specs */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[11px]">
              Gestión Comercial y Reserva
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Estado Comercial</label>
                <select
                  value={estadoComercial}
                  onChange={(e) => setEstadoComercial(e.target.value as EstadoCachorro)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="RESERVADO">RESERVADO</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                  <option value="PLANTEL">RETENIDO PARA PLANTEL</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Moneda</label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
                >
                  <option value="ARS">Pesos (ARS)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Precio Acordado</label>
                <input
                  type="number"
                  value={precio || ''}
                  onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Seña Abonada</label>
                <input
                  type="number"
                  value={senia || ''}
                  onChange={(e) => setSenia(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Buyer fields if reserved or delivered */}
            {(estadoComercial === 'RESERVADO' || estadoComercial === 'ENTREGADO') && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Nombre Adquiriente</label>
                  <input
                    type="text"
                    value={compradorNombre}
                    onChange={(e) => setCompradorNombre(e.target.value)}
                    placeholder="ej: Gonzalo Peñaloza"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    value={compradorDni}
                    onChange={(e) => setCompradorDni(e.target.value)}
                    placeholder="32.481.992"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={compradorTelefono}
                    onChange={(e) => setCompradorTelefono(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Fecha Entrega Estimada</label>
                  <input
                    type="date"
                    value={fechaEntregaEstimada}
                    onChange={(e) => setFechaEntregaEstimada(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{puppy ? 'Guardar Ficha' : 'Registrar Cachorro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
