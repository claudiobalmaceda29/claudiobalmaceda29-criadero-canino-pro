import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Cachorro } from '../../types';
import {
  HeartHandshake,
  MessageSquare,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Phone,
  User,
  Sparkles,
  AlertCircle,
  ExternalLink,
  X,
  Upload,
} from 'lucide-react';

interface PostVentaFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostVentaFollowUpModal: React.FC<PostVentaFollowUpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { cachorros, currentCriadero, updateCachorro, currentCriaderoId } = useApp();

  // Filtrar cachorros entregados a familias
  const deliveredPuppies = useMemo(() => {
    return cachorros.filter(
      (c) => c.estadoComercial === 'ENTREGADO' || Boolean(c.comprador?.nombre || (c as any).datosComprador?.nombre)
    );
  }, [cachorros]);

  const [selectedPuppyId, setSelectedPuppyId] = useState<string | null>(null);
  const [photoInputUrl, setPhotoInputUrl] = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calcular hitos para cada cachorro entregado
  const puppiesWithMilestones = useMemo(() => {
    return deliveredPuppies.map((pup) => {
      const comp = pup.comprador || (pup as any).datosComprador;
      // Fecha base de entrega: fechaEntregaReal o fechaEntregaEstimada o fechaNacimiento + 70 días
      let fEntregaStr = comp?.fechaEntregaReal || comp?.fechaEntregaEstimada;
      if (!fEntregaStr && pup.fechaNacimiento) {
        const dNac = new Date(pup.fechaNacimiento);
        fEntregaStr = new Date(dNac.getTime() + 70 * 86400000).toISOString().split('T')[0];
      }
      if (!fEntregaStr) {
        fEntregaStr = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      }

      const dEntrega = new Date(fEntregaStr);
      const d6Meses = new Date(dEntrega.getTime() + 180 * 86400000);
      const d1Anio = new Date(dEntrega.getTime() + 365 * 86400000);

      const diffDiasDesdeEntrega = Math.max(0, Math.floor((today.getTime() - dEntrega.getTime()) / 86400000));
      const diff6Meses = Math.floor((today.getTime() - d6Meses.getTime()) / 86400000);
      const diff1Anio = Math.floor((today.getTime() - d1Anio.getTime()) / 86400000);

      let estadoFidelizacion: 'ALERTA_6_MESES' | 'ALERTA_1_ANIO' | 'AL_DIA' = 'AL_DIA';
      let mensajeAlerta = 'Cachorro en adaptación normal.';
      let esUrgente = false;

      if (diff1Anio >= 0 && diff1Anio <= 60) {
        estadoFidelizacion = 'ALERTA_1_ANIO';
        mensajeAlerta = '¡Cumplió 1 año de entrega! Pedir foto adulta y recordar refuerzo anual Séxtuple/Rabia.';
        esUrgente = true;
      } else if (diff6Meses >= 0 && diff6Meses <= 60) {
        estadoFidelizacion = 'ALERTA_6_MESES';
        mensajeAlerta = '¡Cumplió 6 meses de entrega! Consultar desarrollo, mordida, pedir foto y refuerzo veterinario.';
        esUrgente = true;
      } else if (diff1Anio > 60) {
        mensajeAlerta = 'Seguimiento anual completado. Mantener contacto de cortesía.';
      } else {
        const diasPara6 = Math.abs(diff6Meses);
        mensajeAlerta = `Próximo hito de 6 meses en aprox. ${diasPara6} días.`;
      }

      return {
        pup,
        fechaEntrega: fEntregaStr,
        fecha6Meses: d6Meses.toISOString().split('T')[0],
        fecha1Anio: d1Anio.toISOString().split('T')[0],
        diasDesdeEntrega: diffDiasDesdeEntrega,
        estadoFidelizacion,
        mensajeAlerta,
        esUrgente,
      };
    }).sort((a, b) => (b.esUrgente ? 1 : 0) - (a.esUrgente ? 1 : 0));
  }, [deliveredPuppies, today]);

  // Generador de enlace WhatsApp con mensaje predeterminado de fidelización
  const getWhatsAppLink = (item: typeof puppiesWithMilestones[0]) => {
    const comp = item.pup.comprador || (item.pup as any).datosComprador;
    const rawPhone = comp?.telefono || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    const nombreDueno = comp?.nombre || 'Familia';
    const nombreCachorro = item.pup.nombre || item.pup.identificadorProvisorio || 'el cachorro';
    const nombreCriadero = currentCriadero?.nombre || 'Mi Criadero Canino';

    const hitoTexto =
      item.estadoFidelizacion === 'ALERTA_1_ANIO'
        ? '¡ya cumplió 1 año con ustedes!'
        : '¡ya cumplió 6 meses de vida!';

    const text = `Hola ${nombreDueno}, ¿cómo estás? Te escribo de ${nombreCriadero}. Te contactaba para saber cómo está ${nombreCachorro}, que ${hitoTexto} 🐶 Quería consultarte si pudiste aplicarle su refuerzo de vacunas y desparasitación correspondiente, y si nos podrías enviar una fotito actual para ver cómo va creciendo su estructura. ¡Te mandamos un gran saludo!`;

    return `https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`}?text=${encodeURIComponent(
      text
    )}`;
  };

  const handleAddOwnerPhoto = async (pupId: string) => {
    if (!photoInputUrl.trim()) return;
    const pup = cachorros.find((c) => c.id === pupId);
    if (!pup) return;

    try {
      await updateCachorro(pupId, {
        fotoUrl: photoInputUrl.trim(),
        observaciones: `${pup.observaciones || ''}\n[Foto de seguimiento post-venta recibida el ${new Date().toLocaleDateString('es-AR')}]`.trim(),
      });
      setPhotoInputUrl('');
      setSelectedPuppyId(null);
      alert('¡Foto de seguimiento guardada exitosamente en la ficha del cachorro!');
    } catch {
      alert('Error al actualizar la foto.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Seguimiento Post-Venta & Fidelización de Clientes</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alertas automáticas a los 6 meses y al año de entrega: pedir fotos, recordar vacunas y fidelizar dueños
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Cachorros Entregados
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              {puppiesWithMilestones.length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block mb-1">
              Hito 6 Meses Vencido / Hoy
            </span>
            <span className="text-xl font-black text-amber-800 dark:text-amber-200">
              {puppiesWithMilestones.filter((m) => m.estadoFidelizacion === 'ALERTA_6_MESES').length}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
              Hito 1 Año Vencido / Hoy
            </span>
            <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">
              {puppiesWithMilestones.filter((m) => m.estadoFidelizacion === 'ALERTA_1_ANIO').length}
            </span>
          </div>
        </div>

        {/* Delivered Puppies List */}
        <div className="space-y-3">
          {puppiesWithMilestones.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <HeartHandshake className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No hay cachorros con estado &quot;ENTREGADO&quot;
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Al marcar un cachorro como entregado y registrar los datos de contacto de la familia compradora en el módulo de Cachorros, se activará el seguimiento automatizado.
              </p>
            </div>
          ) : (
            puppiesWithMilestones.map((item) => {
              const waLink = getWhatsAppLink(item);
              const isAlert = item.esUrgente;

              return (
                <div
                  key={item.pup.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isAlert
                      ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        <img
                          src={item.pup.fotoUrl || '/assets/puppy-dog-pet-german-shepherd-wallpaper-preview.jpg'}
                          alt={item.pup.nombre || item.pup.identificadorProvisorio}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white">
                            {item.pup.nombre || item.pup.identificadorProvisorio}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {item.pup.sexo} • {item.pup.camadaNombre}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {(() => {
                            const comp = item.pup.comprador || (item.pup as any).datosComprador;
                            return (
                              <>
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-blue-500" />
                                  <strong>{comp?.nombre || 'Dueño no registrado'}</strong>
                                </span>
                                {comp?.telefono && (
                                  <span className="flex items-center gap-1 font-mono text-slate-600 dark:text-slate-300">
                                    <Phone className="w-3 h-3" />
                                    {comp.telefono}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          <span>• Entrega: {item.fechaEntrega} ({item.diasDesdeEntrega} días)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Contactar por WhatsApp</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Sin teléfono cargado</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedPuppyId(selectedPuppyId === item.pup.id ? null : item.pup.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="Adjuntar foto actual"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Banner de Alerta de Hito */}
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                      item.estadoFidelizacion === 'ALERTA_1_ANIO'
                        ? 'bg-emerald-100/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                        : item.estadoFidelizacion === 'ALERTA_6_MESES'
                        ? 'bg-amber-100/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium">
                      {isAlert ? (
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span>{item.mensajeAlerta}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                      <span>6M: {item.fecha6Meses}</span>
                      <span>•</span>
                      <span>1A: {item.fecha1Anio}</span>
                    </div>
                  </div>

                  {/* Input Foto Actual (si está abierto) */}
                  {selectedPuppyId === item.pup.id && (
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-2 text-xs">
                      <span className="font-bold text-blue-900 dark:text-blue-200 block">
                        Cargar enlace de foto actual enviada por el dueño:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="https://... o enlace a foto de Google Photos / Imgur"
                          value={photoInputUrl}
                          onChange={(e) => setPhotoInputUrl(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOwnerPhoto(item.pup.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Guardar Foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
