import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocFromServer,
  CollectionReference,
  Firestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Criadero,
  Ejemplar,
  User,
  Camada,
  Cachorro,
  RegistroSanitario,
  Monta,
  CicloCelo,
  Gestacion,
  SimulacionCruza,
  ExposicionPOA,
  TransaccionEconomica,
  AuditoriaLog,
} from '../types';

// ==========================================
// 1. Firebase Application Initialization
// ==========================================
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ==========================================
// 2. Cloud Firestore with Offline Persistence
// ==========================================
// Configures multi-tab persistent IndexedDB cache for offline resilience
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      ignoreUndefinedProperties: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  // If Firestore is already initialized or persistence fails in test/strict environment
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db: Firestore = firestoreInstance;

// ==========================================
// 3. Firebase Storage (Photos and Documents)
// ==========================================
export const storage: FirebaseStorage = getStorage(
  app,
  firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
);

// ==========================================
// 4. Firebase Authentication & Google Provider
// ==========================================
export const auth: Auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
export const provider = googleProvider;

// ==========================================
// 5. Collection Names Constants
// ==========================================
export const COLLECTIONS = {
  CRIADEROS: 'criaderos',
  EJEMPLARES: 'ejemplares',
  USUARIOS: 'users', // Principal Firestore collection mapped to User documents
  USUARIOS_ALIAS: 'usuarios',
  CAMADAS: 'camadas',
  CACHORROS: 'cachorros',
  REGISTROS_SANITARIOS: 'registrosSanitarios',
  MONTAS: 'montas',
  CICLOS_CELO: 'ciclosCelo',
  GESTACIONES: 'gestaciones',
  SIMULACIONES_CRUZA: 'simulacionesCruza',
  EXPOSICIONES: 'exposiciones',
  TRANSACCIONES: 'transacciones',
  AUDITORIA: 'auditoria',
} as const;

// Generic typed converter helper
const createConverter = <T extends DocumentData>(): FirestoreDataConverter<T> => ({
  toFirestore: (data: T): DocumentData => {
    // Strip undefined values before persisting to Firestore
    const cleaned: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      if ((data as Record<string, unknown>)[key] !== undefined) {
        cleaned[key] = (data as Record<string, unknown>)[key];
      }
    }
    return cleaned;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
    } as unknown as T;
  },
});

// ==========================================
// 5. Initial Structure of Typed Collections
// ==========================================

// Criaderos collection reference
export const criaderosCollection = collection(
  db,
  COLLECTIONS.CRIADEROS
).withConverter(createConverter<Criadero>());

// Ejemplares collection reference
export const ejemplaresCollection = collection(
  db,
  COLLECTIONS.EJEMPLARES
).withConverter(createConverter<Ejemplar>());

// Usuarios collection reference
export const usuariosCollection = collection(
  db,
  COLLECTIONS.USUARIOS
).withConverter(createConverter<User>());

// Secondary Collections
export const camadasCollection = collection(
  db,
  COLLECTIONS.CAMADAS
).withConverter(createConverter<Camada>());

export const cachorrosCollection = collection(
  db,
  COLLECTIONS.CACHORROS
).withConverter(createConverter<Cachorro>());

export const registrosSanitariosCollection = collection(
  db,
  COLLECTIONS.REGISTROS_SANITARIOS
).withConverter(createConverter<RegistroSanitario>());

export const montasCollection = collection(
  db,
  COLLECTIONS.MONTAS
).withConverter(createConverter<Monta>());

export const ciclosCeloCollection = collection(
  db,
  COLLECTIONS.CICLOS_CELO
).withConverter(createConverter<CicloCelo>());

export const gestacionesCollection = collection(
  db,
  COLLECTIONS.GESTACIONES
).withConverter(createConverter<Gestacion>());

export const simulacionesCruzaCollection = collection(
  db,
  COLLECTIONS.SIMULACIONES_CRUZA
).withConverter(createConverter<SimulacionCruza>());

export const exposicionesCollection = collection(
  db,
  COLLECTIONS.EXPOSICIONES
).withConverter(createConverter<ExposicionPOA>());

export const transaccionesCollection = collection(
  db,
  COLLECTIONS.TRANSACCIONES
).withConverter(createConverter<TransaccionEconomica>());

export const auditoriaCollection = collection(
  db,
  COLLECTIONS.AUDITORIA
).withConverter(createConverter<AuditoriaLog>());

// ==========================================
// 6. Security & Audit Error Handling
// ==========================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isNetworkOrOfflineError(error: unknown): boolean {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('could not reach') ||
    msg.includes('client is offline') ||
    msg.includes('deadline-exceeded') ||
    msg.includes('network-request-failed')
  );
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  if (isNetworkOrOfflineError(error)) {
    console.warn(
      `[Modo Offline Firestore] Operación "${operationType}" en "${path}" procesada en caché local por falta de conexión:`,
      errInfo.error
    );
    return;
  }

  console.error('Firestore Security / Operation Error: ', JSON.stringify(errInfo));
  // Keep trace without killing the execution thread
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// 7. Firebase Storage Dog Photo Upload
// ==========================================
/**
 * Compresses an image file in the browser to an efficient DataURL fallback
 */
export async function fileToCompressedDataUrl(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type || 'image/jpeg', quality));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a dog photo to Firebase Storage under the 'ejemplares' folder,
 * returning the public download URL. If offline or storage rules fail,
 * seamlessly falls back to a compressed data URL so the photo is never lost!
 */
export async function uploadDogPhoto(
  file: File,
  prefix: string = 'dog'
): Promise<{ url: string; source: 'storage' | 'local' }> {
  const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  const filePath = `ejemplares/${safePrefix}_${timestamp}.${cleanExt}`;

  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { url: downloadUrl, source: 'storage' };
  } catch (error) {
    console.warn(
      'No se pudo subir directamente a Firebase Storage (o sin conexión). Generando imagen optimizada persistente:',
      error
    );
    const fallbackUrl = await fileToCompressedDataUrl(file);
    return { url: fallbackUrl, source: 'local' };
  }
}

// ==========================================
// 8. Connectivity & Authentication Helpers
// ==========================================
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is operating offline with local cache.');
    }
    return false;
  }
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'auth/google-sign-in');
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

export function observeAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
