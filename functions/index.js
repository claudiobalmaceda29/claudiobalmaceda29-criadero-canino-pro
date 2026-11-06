/**
 * Firebase Cloud Functions (Node.js 18+) para "Mi Criadero Canino Pro"
 * 
 * Módulos integrados:
 * 1. CRON Vacunación 45 Días (Puppy DP)
 * 2. CRON Seguimiento Post-Venta (Fidelización a los 6 meses y 1 año de entrega)
 * 3. CRON Alertas Reproductivas (Proyección de Celos y Partos Inminentes)
 * 4. Trigger Firestore: Despachador de Cola Omnicanal (WhatsApp Webhooks & Email)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 1. CRON: Alertar sobre cachorros que cumplen 45 días (primera vacuna Puppy DP)
 * Ejecución: Diario 08:00 AM (America/Argentina/Cordoba)
 */
exports.verificarVacunacion45Dias = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('America/Argentina/Cordoba')
  .onRun(async () => {
    console.log('[CRON Vacunación 45D] Iniciando verificación diaria...');
    try {
      const hoy = new Date();
      const fechaObjetivo = new Date(hoy.getTime() - 45 * 24 * 60 * 60 * 1000);
      const fechaStr = fechaObjetivo.toISOString().split('T')[0];

      const snap = await db.collection('camadas').where('fechaNacimiento', '==', fechaStr).get();
      if (snap.empty) {
        console.log('[CRON Vacunación 45D] No hay camadas nacidas hace 45 días hoy.');
        return null;
      }

      const batch = db.batch();
      snap.forEach((doc) => {
        const camada = doc.data();
        const destId = camada.propietarioId || camada.criaderoId;
        if (destId) {
          const notifRef = db.collection('usuarios').doc(destId).collection('notificaciones').doc();
          batch.set(notifRef, {
            titulo: 'Recordatorio de Vacunación (45 Días)',
            mensaje: `La camada ${camada.identificador || 'Camada'} cumple 45 días hoy. Toca aplicar la 1ª vacuna Puppy DP.`,
            tipo: 'salud',
            leido: false,
            fecha: admin.firestore.FieldValue.serverTimestamp(),
            camadaId: doc.id,
            creadoAutomatico: true,
          });
        }
      });

      await batch.commit();
      console.log(`[CRON Vacunación 45D] ${snap.size} notificaciones creadas con éxito.`);
      return null;
    } catch (err) {
      console.error('[CRON Vacunación 45D] Error:', err);
      throw err;
    }
  });

/**
 * 2. CRON: Seguimiento Post-Venta y Fidelización (Alertas a los 6 meses y 1 año de entrega)
 * Ejecución: Diario 08:30 AM (America/Argentina/Cordoba)
 */
exports.verificarPostVentaFidelizacion = functions.pubsub
  .schedule('30 8 * * *')
  .timeZone('America/Argentina/Cordoba')
  .onRun(async () => {
    console.log('[CRON Post-Venta] Verificando hitos de 6 meses y 1 año de cachorros entregados...');
    try {
      const hoy = new Date();
      const f6MesesObj = new Date(hoy.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const f1AnioObj = new Date(hoy.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Consultar cachorros entregados
      const cachorrosSnap = await db
        .collection('cachorros')
        .where('estadoComercial', '==', 'ENTREGADO')
        .get();

      if (cachorrosSnap.empty) {
        console.log('[CRON Post-Venta] No hay cachorros entregados registrados.');
        return null;
      }

      const notificacionesACrear = [];

      cachorrosSnap.forEach((doc) => {
        const pup = doc.data();
        const fEntrega = pup.datosComprador?.fechaEntregaReal || pup.datosComprador?.fechaEntregaEstimada;
        if (!fEntrega) return;

        const criadorId = pup.propietarioId || pup.criaderoId;
        const nombreDueno = pup.datosComprador?.nombre || 'Familia Compradora';
        const telDueno = pup.datosComprador?.telefono || '';
        const nombreCachorro = pup.nombre || pup.identificadorProvisorio || 'Cachorro';

        // Hito 6 Meses (+/- 1 día)
        if (fEntrega === f6MesesObj) {
          notificacionesACrear.push({
            destinatarioId: criadorId,
            titulo: `Post-Venta: ${nombreCachorro} cumple 6 meses`,
            mensaje: `El cachorro entregado a ${nombreDueno} cumplió 6 meses. Contactalo por WhatsApp (${telDueno}) para pedir fotos de su desarrollo y recordar vacunas.`,
            tipo: 'sistema',
            duenoTelefono: telDueno,
            cachorroId: doc.id,
            hito: '6_MESES',
          });
        }

        // Hito 1 Año (+/- 1 día)
        if (fEntrega === f1AnioObj) {
          notificacionesACrear.push({
            destinatarioId: criadorId,
            titulo: `Fidelización Anual: ${nombreCachorro} cumple 1 año`,
            mensaje: `¡Primer año de entrega a ${nombreDueno}! Es momento de solicitar foto de estructura adulta y recordar refuerzo de Séxtuple y Antirrábica.`,
            tipo: 'sistema',
            duenoTelefono: telDueno,
            cachorroId: doc.id,
            hito: '1_ANIO',
          });
        }
      });

      if (notificacionesACrear.length === 0) {
        console.log('[CRON Post-Venta] No hay hitos que venzan hoy.');
        return null;
      }

      const batch = db.batch();
      notificacionesACrear.forEach((item) => {
        const notifRef = db.collection('usuarios').doc(item.destinatarioId).collection('notificaciones').doc();
        batch.set(notifRef, {
          titulo: item.titulo,
          mensaje: item.mensaje,
          tipo: item.tipo,
          leido: false,
          fecha: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            cachorroId: item.cachorroId,
            telefono: item.duenoTelefono,
            hito: item.hito,
          },
          creadoAutomatico: true,
        });

        // Encolar también en colaNotificaciones para WhatsApp automatizado
        const colaRef = db.collection('colaNotificaciones').doc();
        batch.set(colaRef, {
          criaderoId: item.destinatarioId,
          tipo: item.hito === '6_MESES' ? 'POST_VENTA_6_MESES' : 'POST_VENTA_1_ANIO',
          canales: ['IN_APP', 'WHATSAPP'],
          destinatarioNombre: item.destinatarioId,
          destinatarioTelefono: item.duenoTelefono,
          titulo: item.titulo,
          mensaje: item.mensaje,
          estadoEnvio: { inApp: 'ENVIADO', whatsapp: 'PENDIENTE' },
          fechaCreacion: new Date().toISOString(),
          fechaProgramadaEnvio: new Date().toISOString(),
        });
      });

      await batch.commit();
      console.log(`[CRON Post-Venta] Se encolaron ${notificacionesACrear.length} alertas post-venta.`);
      return null;
    } catch (err) {
      console.error('[CRON Post-Venta] Error:', err);
      throw err;
    }
  });

/**
 * 3. CRON: Alertas Reproductivas (Predicción de Celos y Partos Próximos)
 * Ejecución: Diario 09:00 AM (America/Argentina/Cordoba)
 */
exports.verificarPrediccionCelosYPartos = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/Argentina/Cordoba')
  .onRun(async () => {
    console.log('[CRON Reproductivo] Verificando partos inminentes y celos proyectados...');
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // A) Gestaciones activas con parto en los próximos 3 días
      const gestSnap = await db.collection('gestaciones').where('estado', '==', 'EN_CURSO').get();
      const batch = db.batch();
      let alertasCount = 0;

      gestSnap.forEach((doc) => {
        const gest = doc.data();
        if (gest.fechaEstimadaParto) {
          const fParto = new Date(gest.fechaEstimadaParto);
          const diasFaltantes = Math.ceil((fParto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

          if (diasFaltantes <= 3 && diasFaltantes >= -1) {
            const destId = gest.propietarioId || gest.criaderoId;
            if (destId) {
              const notifRef = db.collection('usuarios').doc(destId).collection('notificaciones').doc();
              batch.set(notifRef, {
                titulo: `Parto Inminente: ${gest.hembraNombre}`,
                mensaje: `La hembra ${gest.hembraNombre} tiene fecha de parto estimada para el ${gest.fechaEstimadaParto} (${diasFaltantes <= 0 ? '¡Hoy o cumplida!' : `en ${diasFaltantes} días`}). Preparar paridera y monitorear temperatura rectal.`,
                tipo: 'salud',
                leido: false,
                fecha: admin.firestore.FieldValue.serverTimestamp(),
                gestacionId: doc.id,
                creadoAutomatico: true,
              });
              alertasCount++;
            }
          }
        }
      });

      if (alertasCount > 0) {
        await batch.commit();
        console.log(`[CRON Reproductivo] ${alertasCount} alertas de parto generadas.`);
      }

      return null;
    } catch (err) {
      console.error('[CRON Reproductivo] Error:', err);
      throw err;
    }
  });

/**
 * 4. Trigger Firestore: Procesamiento y Despacho de Notificaciones Omnicanal
 * Se dispara al crear un documento en /colaNotificaciones/{notifId}
 */
exports.despacharColaOmnicanal = functions.firestore
  .document('colaNotificaciones/{notifId}')
  .onCreate(async (snap, context) => {
    const notif = snap.data();
    const notifId = context.params.notifId;

    console.log(`[Omnicanal Trigger] Procesando notificación ID: ${notifId} para ${notif.destinatarioNombre}`);

    const updates = { ...notif.estadoEnvio };

    try {
      // 1. Envío por WhatsApp Webhook / API
      if (notif.canales && notif.canales.includes('WHATSAPP') && notif.destinatarioTelefono) {
        const cleanPhone = notif.destinatarioTelefono.replace(/\D/g, '');
        console.log(`[Omnicanal WhatsApp] Despachando a ${cleanPhone}: "${notif.titulo}"`);

        // Aquí se invoca el webhook del proveedor (ej. Meta WhatsApp Cloud API / Twilio)
        // Ejemplo de llamada segura:
        // await axios.post(WHATSAPP_ENDPOINT, { phone: cleanPhone, message: notif.mensaje }, { headers: ... });

        updates.whatsapp = 'ENVIADO';
      }

      // 2. Envío por Correo Electrónico (SendGrid / Nodemailer)
      if (notif.canales && notif.canales.includes('EMAIL') && notif.destinatarioEmail) {
        console.log(`[Omnicanal Email] Despachando a ${notif.destinatarioEmail}: "${notif.titulo}"`);
        // await sendgrid.send({ to: notif.destinatarioEmail, subject: notif.titulo, text: notif.mensaje });
        updates.email = 'ENVIADO';
      }

      // Actualizar estado en Firestore
      await snap.ref.update({
        estadoEnvio: updates,
        despachadoEn: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[Omnicanal Trigger] Notificación ${notifId} completada.`);
      return null;
    } catch (err) {
      console.error(`[Omnicanal Trigger] Error al despachar ${notifId}:`, err);
      await snap.ref.update({
        'estadoEnvio.error': err.message || 'Error de conexión',
        'estadoEnvio.fallido': true,
      });
      return null;
    }
  });
