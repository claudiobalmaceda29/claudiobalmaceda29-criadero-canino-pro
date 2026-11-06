import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Syringe,
  MessageSquare,
  Info,
  Clock,
  CheckCheck,
  ChevronRight,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Formatea timestamps de Firestore (Timestamp o string ISO o número) a formato relativo/legible
 */
function formatearFecha(fecha) {
  if (!fecha) return 'Reciente';

  let dateObj;
  if (typeof fecha.toDate === 'function') {
    dateObj = fecha.toDate();
  } else if (fecha instanceof Date) {
    dateObj = fecha;
  } else if (typeof fecha === 'string' || typeof fecha === 'number') {
    dateObj = new Date(fecha);
  } else if (fecha.seconds) {
    dateObj = new Date(fecha.seconds * 1000);
  } else {
    return 'Reciente';
  }

  if (isNaN(dateObj.getTime())) return 'Reciente';

  const diffMs = Date.now() - dateObj.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return 'Hace un momento';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHoras < 24) return `Hace ${diffHoras} h`;
  if (diffDias === 1) return 'Ayer';
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return dateObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Componente Campana de Notificaciones para la barra de navegación (Navbar).
 */
export const NotificationBell = ({ userId }) => {
  const {
    notificaciones,
    conteoNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    cargando,
  } = useNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Obtener icono y colores según el tipo de notificación
  const getBadgeStyle = (tipo) => {
    switch (tipo) {
      case 'salud':
        return {
          icon: Syringe,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100/80 dark:bg-blue-950/60',
          border: 'border-blue-200 dark:border-blue-900',
          badgeText: 'Salud / Vacuna',
        };
      case 'chat':
        return {
          icon: MessageSquare,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-100/80 dark:bg-emerald-950/60',
          border: 'border-emerald-200 dark:border-emerald-900',
          badgeText: 'Mensajería',
        };
      case 'sistema':
      default:
        return {
          icon: Info,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-100/80 dark:bg-amber-950/60',
          border: 'border-amber-200 dark:border-amber-900',
          badgeText: 'Criadero',
        };
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.leido) {
      await marcarComoLeida(notif.id);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        aria-label="Abrir notificaciones"
        title="Notificaciones y avisos del criadero"
      >
        <Bell className="w-5 h-5" />

        {/* Badge rojo si hay notificaciones no leídas */}
        {conteoNoLeidas > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black leading-none text-white bg-rose-600 rounded-full shadow-xs animate-pulse">
            {conteoNoLeidas > 99 ? '99+' : conteoNoLeidas}
          </span>
        )}
      </button>

      {/* Menú desplegable (Dropdown) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Cabecera del Dropdown */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Notificaciones
              </span>
              {conteoNoLeidas > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400">
                  {conteoNoLeidas} nuevas
                </span>
              )}
            </div>

            {conteoNoLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLeidas}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Leer todas</span>
              </button>
            )}
          </div>

          {/* Lista de Notificaciones */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70 custom-scrollbar">
            {cargando ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Cargando notificaciones...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Bandeja al día
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No tenés notificaciones pendientes en este momento.
                </p>
              </div>
            ) : (
              notificaciones.map((notif) => {
                const style = getBadgeStyle(notif.tipo);
                const IconComponent = style.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      !notif.leido
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Indicador de no leído */}
                    {!notif.leido && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 absolute left-2 top-4 shrink-0" />
                    )}

                    {/* Icono de tipo */}
                    <div
                      className={`p-2 rounded-xl shrink-0 border ${style.bg} ${style.color} ${style.border}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {style.badgeText}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatearFecha(notif.fecha)}</span>
                        </span>
                      </div>

                      <h4
                        className={`text-xs mt-0.5 leading-snug truncate ${
                          !notif.leido
                            ? 'font-black text-slate-900 dark:text-white'
                            : 'font-semibold text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notif.titulo}
                      </h4>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.mensaje}
                      </p>
                    </div>

                    {!notif.leido && (
                      <div className="shrink-0 self-center">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline">
                          Marcar
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del Dropdown */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-center">
            <span className="text-[10px] font-semibold text-slate-400">
              Notificaciones oficiales sincronizadas con Cloud Firestore
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
