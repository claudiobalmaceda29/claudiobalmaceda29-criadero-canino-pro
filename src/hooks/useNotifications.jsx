import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

// Notificaciones de demostración cuando el criador navega sin cuenta activa (Modo Demo)
const NOTIFICACIONES_DEMO = [
  {
    id: 'demo-notif-1',
    titulo: 'Recordatorio de Vacunación (Demo)',
    mensaje: 'La camada Camada Demo A cumple 45 días hoy. Toca aplicar la primera vacuna (Puppy DP).',
    tipo: 'salud',
    leido: false,
    fecha: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'demo-notif-2',
    titulo: 'Control de Progesterona (Demo)',
    mensaje: 'La reproductora Bella alcanzó 5.4 ng/ml. Programar servicio de monta.',
    tipo: 'sistema',
    leido: false,
    fecha: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'demo-notif-3',
    titulo: 'Consulta por Padrillo (Demo)',
    mensaje: 'Martín Rodríguez consultó por disponibilidad de servicio de monta.',
    tipo: 'chat',
    leido: true,
    fecha: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

/**
 * Hook para gestionar las notificaciones en tiempo real del usuario en Firestore.
 * Subcolección: /usuarios/{userId}/notificaciones/{notificacionId}
 * 
 * @param {string} [customUserId] - ID opcional del usuario
 * @returns {{
 *   notificaciones: Array<{ id: string, titulo: string, mensaje: string, tipo: 'salud' | 'sistema' | 'chat', leido: boolean, fecha: any }>,
 *   conteoNoLeidas: number,
 *   marcarComoLeida: (id: string) => Promise<void>,
 *   marcarTodasComoLeidas: () => Promise<void>,
 *   cargando: boolean
 * }}
 */
export function useNotifications(customUserId) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);

  // Evita disparar toasts masivos al cargar los documentos existentes
  const esCargaInicial = useRef(true);

  // 1. Escuchar activamente el estado de Firebase Auth
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // 2. Determinar si hay un usuario real autenticado en Firebase
  // Importante: No intentar consultar Firestore si no hay auth.currentUser para evitar Permission Denied
  const isRealAuth = Boolean(currentUser && currentUser.uid);
  const activeUid = isRealAuth
    ? (customUserId && customUserId !== 'usr-demo' ? customUserId : currentUser.uid)
    : null;

  useEffect(() => {
    // Si no hay usuario autenticado en Firebase Auth (ej: Modo Demo o visitante),
    // usamos las notificaciones locales de muestra sin consultar Firestore
    if (!isRealAuth || !activeUid) {
      setNotificaciones(NOTIFICACIONES_DEMO);
      setCargando(false);
      return;
    }

    setCargando(true);
    let unsubscribe = () => {};

    try {
      // Subcolección: /usuarios/{userId}/notificaciones
      const notifRef = collection(db, 'usuarios', activeUid, 'notificaciones');
      
      // Orden cronológico descendente
      const q = query(notifRef, orderBy('fecha', 'desc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = [];
          snapshot.forEach((documento) => {
            docs.push({
              id: documento.id,
              ...documento.data(),
            });
          });

          setNotificaciones(docs);
          setCargando(false);

          // Detección exclusiva de documentos NUEVOS que entran en tiempo real y no están leídos
          if (esCargaInicial.current) {
            esCargaInicial.current = false;
          } else {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const nuevaNotif = change.doc.data();
                if (nuevaNotif && !nuevaNotif.leido) {
                  // Alerta efímera personalizada con react-hot-toast
                  toast.custom(
                    (t) => (
                      <div
                        className={`${
                          t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-sm w-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 dark:ring-white/10 p-4 border-l-4 ${
                          nuevaNotif.tipo === 'salud'
                            ? 'border-blue-600'
                            : nuevaNotif.tipo === 'chat'
                            ? 'border-emerald-600'
                            : 'border-amber-500'
                        }`}
                      >
                        <div className="flex-1 w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {nuevaNotif.titulo || 'Nueva Notificación'}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            {nuevaNotif.mensaje}
                          </p>
                        </div>
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="ml-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ),
                    { duration: 5000, id: change.doc.id }
                  );
                }
              }
            });
          }
        },
        (error) => {
          if (error?.code === 'permission-denied') {
            console.warn('[useNotifications] Modo demo o permiso restringido en subcolección:', error.message);
            setNotificaciones(NOTIFICACIONES_DEMO);
          } else {
            console.error('[useNotifications] Error al escuchar notificaciones:', error);
          }
          setCargando(false);
        }
      );
    } catch (error) {
      console.warn('[useNotifications] Error al inicializar listener:', error);
      setNotificaciones(NOTIFICACIONES_DEMO);
      setCargando(false);
    }

    // Regla estricta: Limpieza al desmontar o cambiar de usuario
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isRealAuth, activeUid]);

  // Conteo reactivo de no leídas
  const conteoNoLeidas = notificaciones.filter((n) => !n.leido).length;

  // Marcar una notificación individual como leída
  const marcarComoLeida = useCallback(
    async (id) => {
      // Si estamos en modo demo (sin Firebase Auth), actualizar en memoria local
      if (!isRealAuth || !activeUid) {
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
        );
        return;
      }

      try {
        const notifDocRef = doc(db, 'usuarios', activeUid, 'notificaciones', id);
        await updateDoc(notifDocRef, {
          leido: true,
        });
      } catch (error) {
        console.error(`[useNotifications] Error al marcar como leída (${id}):`, error);
        // Fallback local para fluidez de UI
        setNotificaciones((prev) =>
          prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
        );
      }
    },
    [isRealAuth, activeUid]
  );

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    if (!isRealAuth || !activeUid) {
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      return;
    }

    const noLeidas = notificaciones.filter((n) => !n.leido);
    try {
      await Promise.all(
        noLeidas.map((n) =>
          updateDoc(doc(db, 'usuarios', activeUid, 'notificaciones', n.id), {
            leido: true,
          })
        )
      );
    } catch (error) {
      console.error('[useNotifications] Error al marcar todas como leídas:', error);
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
    }
  }, [isRealAuth, activeUid, notificaciones]);

  return {
    notificaciones,
    conteoNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    cargando,
  };
}

export default useNotifications;
