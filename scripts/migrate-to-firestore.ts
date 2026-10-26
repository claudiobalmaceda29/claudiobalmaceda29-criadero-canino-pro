import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  writeBatch,
  terminate,
  collection,
  getDocs,
} from 'firebase/firestore';
import cfg from '../firebase-applet-config.json' with { type: 'json' };
import {
  INITIAL_CRIADEROS,
  INITIAL_USERS,
  INITIAL_EJEMPLARES,
  INITIAL_REGISTROS_SANITARIOS,
  INITIAL_MONTAS,
  INITIAL_CICLOS_CELO,
  INITIAL_GESTACIONES,
  INITIAL_CAMADAS,
  INITIAL_CACHORROS,
  INITIAL_SIMULACIONES,
  INITIAL_EXPOSICIONES,
  INITIAL_TRANSACCIONES,
  INITIAL_AUDITORIA,
} from '../src/data/initialData';

function cleanUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanUndefined(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

async function migrate() {
  console.log('🚀 Iniciando migración a Cloud Firestore...');
  console.log(`Base de datos destino: ${cfg.firestoreDatabaseId}`);

  const collectionsData: { name: string; items: any[] }[] = [
    { name: 'criaderos', items: INITIAL_CRIADEROS },
    { name: 'users', items: INITIAL_USERS },
    { name: 'usuarios', items: INITIAL_USERS }, // Alias collection for convenience
    { name: 'ejemplares', items: INITIAL_EJEMPLARES },
    { name: 'registrosSanitarios', items: INITIAL_REGISTROS_SANITARIOS },
    { name: 'montas', items: INITIAL_MONTAS },
    { name: 'ciclosCelo', items: INITIAL_CICLOS_CELO },
    { name: 'gestaciones', items: INITIAL_GESTACIONES },
    { name: 'camadas', items: INITIAL_CAMADAS },
    { name: 'cachorros', items: INITIAL_CACHORROS },
    { name: 'simulacionesCruza', items: INITIAL_SIMULACIONES },
    { name: 'exposiciones', items: INITIAL_EXPOSICIONES },
    { name: 'transacciones', items: INITIAL_TRANSACCIONES },
    { name: 'auditoria', items: INITIAL_AUDITORIA },
  ];

  for (const col of collectionsData) {
    console.log(`📦 Migrando colección '${col.name}' (${col.items.length} registros)...`);
    // Commit in batches of up to 400
    const chunkSize = 400;
    for (let i = 0; i < col.items.length; i += chunkSize) {
      const chunk = col.items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const item of chunk) {
        const docId = String(item.id || item.email || `item-${Date.now()}`);
        const ref = doc(db, col.name, docId);
        batch.set(ref, cleanUndefined(item), { merge: true });
      }
      await batch.commit();
    }
    console.log(`✅ Colección '${col.name}' migrada exitosamente.`);
  }

  // Verification step
  console.log('🔍 Verificando datos migrados en Firestore...');
  const criaderosSnap = await getDocs(collection(db, 'criaderos'));
  console.log(`✔ Criaderos encontrados en Firestore: ${criaderosSnap.size}`);

  const ejemplaresSnap = await getDocs(collection(db, 'ejemplares'));
  console.log(`✔ Ejemplares encontrados en Firestore: ${ejemplaresSnap.size}`);

  const camadasSnap = await getDocs(collection(db, 'camadas'));
  console.log(`✔ Camadas encontradas en Firestore: ${camadasSnap.size}`);

  console.log('🎉 Migración completada con éxito.');
  await terminate(db);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Error durante la migración:', err);
  process.exit(1);
});
