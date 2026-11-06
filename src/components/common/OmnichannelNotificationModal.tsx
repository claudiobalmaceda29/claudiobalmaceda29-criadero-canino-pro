import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  NotificacionOmnicanal,
  CanalNotificacion,
  TipoEventoOmnicanal,
} from '../../types';
import {
  Bell,
  MessageSquare,
  Mail,
  Send,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';

interface OmnichannelNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDestinatario?: {
    nombre: string;
    telefono?: string;
    email?: string;
    tipo?: TipoEventoOmnicanal;
    titulo?: string;
    mensaje?: string;
  };
}

export const OmnichannelNotificationModal: React.FC<OmnichannelNotificationModalProps> = ({
  isOpen,
  onClose,
  defaultDestinatario,
}) => {
  const { currentCriaderoId, currentUser, firebaseUser } = useApp();

  const [tipo, setTipo] = useState<TipoEventoOmnicanal>(
    defaultDestinatario?.tipo || 'POST_VENTA_6_MESES'
  );
  const [canales, setCanales] = useState<CanalNotificacion[]>(['IN_APP', 'WHATSAPP']);
  const [destinatarioNombre, setDestinatarioNombre] = useState(
    defaultDestinatario?.nombre || ''
  );
  const [destinatarioTelefono, setDestinatarioTelefono] = useState(
    defaultDestinatario?.telefono || ''
  );
  const [destinatarioEmail, setDestinatarioEmail] = useState(
    defaultDestinatario?.email || ''
  );
  const [titulo, setTitulo] = useState(
    defaultDestinatario?.titulo || 'Recordatorio de Refuerzo de Vacunas & Fotos'
  );
  const [mensaje, setMensaje] = useState(
    defaultDestinatario?.mensaje ||
      'Estimada familia, te escribimos de nuestro criadero para consultarte por el estado de tu cachorro, recordar su refuerzo de vacuna y solicitarte una foto actual.'
  );

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const toggleCanal = (c: CanalNotificacion) => {
    if (canales.includes(c)) {
      if (canales.length > 1) {
        setCanales(canales.filter((item) => item !== c));
      }
    } else {
      setCanales([...canales, c]);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const notifItem: NotificacionOmnicanal = {
        id: `notif-${Date.now()}`,
        criaderoId: currentCriaderoId,
        propietarioId: currentUser?.id || firebaseUser?.uid,
        tipo,
        canales,
        destinatarioNombre,
        destinatarioTelefono,
        destinatarioEmail,
        titulo,
        mensaje,
        estadoEnvio: {
          inApp: 'ENVIADO',
          whatsapp: canales.includes('WHATSAPP') ? 'ENVIADO' : undefined,
          email: canales.includes('EMAIL') ? 'ENVIADO' : undefined,
        },
        fechaCreacion: new Date().toISOString(),
        fechaProgramadaEnvio: new Date().toISOString(),
      };

      // Guardar en cola local
      try {
        const stored = localStorage.getItem(`omnichannel_queue_${currentCriaderoId}`);
        const list = stored ? JSON.parse(stored) : [];
        localStorage.setItem(
          `omnichannel_queue_${currentCriaderoId}`,
          JSON.stringify([notifItem, ...list])
        );
      } catch {}

      // Si incluye WhatsApp, abrir ventana de envío inmediato
      if (canales.includes('WHATSAPP') && destinatarioTelefono) {
        const cleanPhone = destinatarioTelefono.replace(/\D/g, '');
        const waLink = `https://wa.me/${
          cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`
        }?text=${encodeURIComponent(`${titulo}\n\n${mensaje}`)}`;
        window.open(waLink, '_blank');
      }

      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        onClose();
      }, 2500);
    } catch {
      alert('Error al encolar la notificación.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Despacho de Notificación Omnicanal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In-App (Campanita) • WhatsApp Webhook • Correo Electrónico
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sendSuccess ? (
          <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
            <div className="text-sm">¡Notificación encolada y despachada con éxito!</div>
            <div className="text-[11px] font-normal text-slate-500">
              Canales activos: {canales.join(', ')}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-3.5 text-xs">
            {/* Selección de Canales */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Canales de Salida Activos:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => toggleCanal('IN_APP')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                    canales.includes('IN_APP')
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>In-App</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCanal('WHATSAPP')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                    canales.includes('WHATSAPP')
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCanal('EMAIL')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                    canales.includes('EMAIL')
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Evento / Causa:
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none"
                >
                  <option value="POST_VENTA_6_MESES">Post-Venta (6 Meses)</option>
                  <option value="POST_VENTA_1_ANIO">Post-Venta (1 Año)</option>
                  <option value="CELO_PREDICCION">Predicción de Celo</option>
                  <option value="PARTO_PROXIMO">Parto Próximo</option>
                  <option value="ECOGRAFIA_PROGRAMADA">Ecografía Programada</option>
                  <option value="VACUNA_VENCIMIENTO">Vencimiento de Vacuna</option>
                  <option value="STOCK_ALIMENTO_BAJO">Stock Crítico de Alimento</option>
                  <option value="SISTEMA">Mensaje del Sistema</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destinatario:
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Familia Martínez"
                  value={destinatarioNombre}
                  onChange={(e) => setDestinatarioNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono (WhatsApp):
                </label>
                <input
                  type="tel"
                  placeholder="ej. +54 9 11 5824-9102"
                  value={destinatarioTelefono}
                  onChange={(e) => setDestinatarioTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico:
                </label>
                <input
                  type="email"
                  placeholder="ej. cliente@gmail.com"
                  value={destinatarioEmail}
                  onChange={(e) => setDestinatarioEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Asunto / Título del Mensaje:
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cuerpo del Mensaje:
              </label>
              <textarea
                rows={3}
                required
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{canales.includes('WHATSAPP') ? 'Despachar & Abrir WhatsApp' : 'Encolar Notificación'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
