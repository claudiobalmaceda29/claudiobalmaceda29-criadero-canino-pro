/**
 * Firebase Cloud Functions (Node.js 18+) para "Mi Criadero Canino Pro"
 * 
 * Función programada (CRON): Notificación automática de vacunación a los 45 días.
 * Ejecución: Todos los días a las 08:00 AM (Zona horaria: 'America/Argentina/Cordoba')
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK si no ha sido inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Función CRON que se ejecuta a diario para alertar sobre cachorros que cumplen 45 días (edad de primovacunación Puppy DP / Parvovirus)
 */
exports.verificarVacunacion45Dias = functions.pubsub
  .schedule('0 8 * * *') // Todos los días a las 08:00 AM
  .timeZone('America/Argentina/Cordoba')
  .onRun(async (context) => {
    console.log('[CRON Vacunación] Iniciando revisión diaria de camadas nacidas hace 45 días...');

    try {
      // 1. Calcular la fecha de hace exactamente 45 días en zona horaria de Argentina
      const hoy = new Date();
      // Restar 45 días exactos
      const fechaObjetivo = new Date(hoy.getTime() - 45 * 24 * 60 * 60 * 1000);

      // Formato YYYY-MM-DD para comparar strings de fecha
      const anio = fechaObjetivo.getFullYear();
      const mes = String(fechaObjetivo.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaObjetivo.getDate()).padStart(2, '0');
      const fechaStringObjetivo = `${anio}-${mes}-${dia}`;

      // También calcular rango de inicio y fin de día para Timestamps
      const inicioDia = new Date(anio, fechaObjetivo.getMonth(), fechaObjetivo.getDate(), 0, 0, 0);
      const finDia = new Date(anio, fechaObjetivo.getMonth(), fechaObjetivo.getDate(), 23, 59, 59, 999);

      console.log(`[CRON Vacunación] Buscando camadas nacidas en fecha: ${fechaStringObjetivo}`);

      // 2. Consultar la colección global de camadas
      // La fecha en las camadas puede estar guardada como string YYYY-MM-DD o como Timestamp
      const camadasRef = db.collection('camadas');

      // Búsqueda por string (formato estándar de la app)
      const queryPorString = await camadasRef
        .where('fechaNacimiento', '==', fechaStringObjetivo)
        .get();

      // Búsqueda por Timestamp (si alguna camada fue registrada con Timestamp de Firestore)
      const queryPorTimestamp = await camadasRef
        .where('fechaNacimiento', '>=', admin.firestore.Timestamp.fromDate(inicioDia))
        .where('fechaNacimiento', '<=', admin.firestore.Timestamp.fromDate(finDia))
        .get();

      // Unificar resultados evitando duplicados
      const camadasMap = new Map();
      queryPorString.forEach((doc) => camadasMap.set(doc.id, doc.data()));
      queryPorTimestamp.forEach((doc) => camadasMap.set(doc.id, doc.data()));

      if (camadasMap.size === 0) {
        console.log('[CRON Vacunación] No se encontraron camadas que cumplan 45 días hoy.');
        return null;
      }

      console.log(`[CRON Vacunación] Se encontraron ${camadasMap.size} camadas para notificar.`);

      // 3. Crear las notificaciones correspondientes en subcolecciones de usuario
      const promesasNotificaciones = [];

      for (const [camadaId, camada] of camadasMap.entries()) {
        // Obtener el ID del destinatario (propietarioId, o fallback criaderoId / usuarioId)
        const destinatarioId = camada.propietarioId || camada.usuarioId || camada.criaderoId;

        if (!destinatarioId) {
          console.warn(`[CRON Vacunación] La camada ${camadaId} no tiene propietarioId asignado.`);
          continue;
        }

        const nombreCamada =
          camada.identificador ||
          camada.nombre ||
          camada.identificadorProvisorio ||
          `Camada ${camadaId.slice(-4)}`;

        const nuevaNotificacion = {
          titulo: 'Recordatorio de Vacunación',
          mensaje: `La camada ${nombreCamada} cumple 45 días hoy. Toca aplicar la primera vacuna.`,
          tipo: 'salud',
          leido: false,
          fecha: admin.firestore.FieldValue.serverTimestamp(),
          camadaId: camadaId,
          creadoAutomatico: true,
        };

        // Ruta de subcolección requerida: /usuarios/{userId}/notificaciones
        const promesa = db
          .collection('usuarios')
          .doc(destinatarioId)
          .collection('notificaciones')
          .add(nuevaNotificacion)
          .then((docRef) => {
            console.log(
              `[CRON Vacunación] Notificación creada para usuario ${destinatarioId} (Notif ID: ${docRef.id}, Camada: ${nombreCamada})`
            );
          })
          .catch((err) => {
            console.error(
              `[CRON Vacunación] Error al guardar notificación para usuario ${destinatarioId}:`,
              err
            );
          });

        promesasNotificaciones.push(promesa);
      }

      await Promise.all(promesasNotificaciones);
      console.log('[CRON Vacunación] Proceso completado exitosamente.');
      return null;
    } catch (error) {
      console.error('[CRON Vacunación] Error crítico durante la ejecución de la función programada:', error);
      throw error;
    }
  });
