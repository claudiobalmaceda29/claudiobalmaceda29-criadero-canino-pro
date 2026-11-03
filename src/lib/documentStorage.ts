import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const IDB_DB_NAME = 'MiCriaderoCaninoPedigrees';
const IDB_STORE_NAME = 'documents';
const IDB_VERSION = 1;

export interface DocumentUploadResult {
  url: string;
  source: 'firebase_storage' | 'server' | 'indexeddb' | 'dataurl';
  sizeStr: string;
  docNombre: string;
  docTipo: 'PDF' | 'IMAGEN';
}

/**
 * Opens or initializes the IndexedDB store for binary documents
 */
function openDocDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno'));
      return;
    }
    const request = window.indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a document (Blob/File) to IndexedDB
 */
export async function saveDocumentToIndexedDB(
  key: string,
  file: File | Blob,
  metadata?: { name?: string; type?: string }
): Promise<string> {
  const db = await openDocDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(IDB_STORE_NAME);
    const record = {
      key,
      blob: file,
      name: metadata?.name || (file instanceof File ? file.name : 'documento.pdf'),
      type: metadata?.type || file.type || 'application/pdf',
      createdAt: new Date().toISOString(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(`idb:${key}`);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves a document from IndexedDB as an Object URL
 */
export async function getDocumentFromIndexedDB(key: string): Promise<string | null> {
  try {
    const cleanKey = key.replace(/^idb:/, '');
    const db = await openDocDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(cleanKey);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          const blob = req.result.blob as Blob;
          const objectUrl = URL.createObjectURL(blob);
          resolve(objectUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Resolves any document URL (Firebase Storage URL, Server URL, Data URL, or idb: key)
 * to a browser-displayable URL for <iframe> or <img>
 */
export async function resolveDocumentUrl(docUrl?: string): Promise<string> {
  if (!docUrl) return '';
  if (docUrl.startsWith('idb:')) {
    const resolved = await getDocumentFromIndexedDB(docUrl);
    return resolved || docUrl;
  }
  return docUrl;
}

/**
 * Reads a file as DataURL (base64)
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Global, resilient PDF and document upload pipeline:
 * 1. Attempts direct upload to Firebase Storage with getDownloadURL and progress tracking.
 * 2. If Firebase Storage fails or is unavailable, uploads to the persistent backend server (/api/upload-document).
 * 3. Also keeps a local IndexedDB copy for instantaneous offline access.
 */
export async function uploadPdfOrDocument(
  file: File,
  folder: 'pedigrees' | 'solicitudes_pedigree' | 'documentos' = 'pedigrees',
  subjectNameOrId: string = 'documento',
  onProgress?: (progressPct: number, statusText: string) => void
): Promise<DocumentUploadResult> {
  if (!file) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const docTipo: 'PDF' | 'IMAGEN' = isPdf ? 'PDF' : 'IMAGEN';
  const sizeBytes = file.size;
  const sizeStr =
    sizeBytes < 1024 * 1024
      ? `${(sizeBytes / 1024).toFixed(0)} KB`
      : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

  const cleanExt = (file.name.split('.').pop() || (isPdf ? 'pdf' : 'jpg'))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const safePrefix = subjectNameOrId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30);
  const filePath = `${folder}/${safePrefix}_${timestamp}.${cleanExt}`;

  // Notify initial progress
  onProgress?.(10, 'Iniciando subida del documento...');

  // 1. Try Firebase Storage
  try {
    const storageRef = ref(storage, filePath);
    const contentType = file.type || (isPdf ? 'application/pdf' : 'image/jpeg');

    const uploadPromise = new Promise<string>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, { contentType });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 70) + 10;
          onProgress?.(progress, `Subiendo a Firebase Storage (${progress}%)...`);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            onProgress?.(85, 'Obteniendo enlace de descarga de Firebase...');
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout tras 4s sin respuesta')), 4000)
    );

    const firebaseUrl = await Promise.race([uploadPromise, timeoutPromise]);

    // Cache to IndexedDB in parallel
    saveDocumentToIndexedDB(`doc_${safePrefix}_${timestamp}`, file, {
      name: file.name,
      type: contentType,
    }).catch(() => {});

    onProgress?.(100, '¡Archivo subido exitosamente a la nube!');

    return {
      url: firebaseUrl,
      source: 'firebase_storage',
      sizeStr,
      docNombre: file.name,
      docTipo,
    };
  } catch (storageErr) {
    console.warn(
      'Firebase Storage no disponible o rechazó la solicitud. Recurriendo al servidor de almacenamiento local persistente:',
      storageErr
    );
  }

  // 2. Server-side persistent storage fallback (/api/upload-document)
  try {
    onProgress?.(40, 'Guardando en servidor persistente...');
    const dataUrl = await fileToDataUrl(file);

    onProgress?.(65, 'Transmitiendo al servidor...');
    const res = await fetch('/api/upload-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || (isPdf ? 'application/pdf' : 'application/octet-stream'),
        fileBase64: dataUrl,
        folder,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        // Cache to IndexedDB in parallel
        saveDocumentToIndexedDB(`doc_${safePrefix}_${timestamp}`, file, {
          name: file.name,
          type: file.type,
        }).catch(() => {});

        onProgress?.(100, '¡Archivo guardado exitosamente en el servidor!');

        return {
          url: data.url,
          source: 'server',
          sizeStr,
          docNombre: file.name,
          docTipo,
        };
      }
    }
  } catch (serverErr) {
    console.warn('Fallback al servidor falló, recurriendo a IndexedDB local:', serverErr);
  }

  // 3. Fallback to IndexedDB (persistent in user browser)
  try {
    onProgress?.(80, 'Guardando en base de datos local...');
    const key = `doc_${safePrefix}_${timestamp}`;
    const idbUrl = await saveDocumentToIndexedDB(key, file, { name: file.name, type: file.type });

    onProgress?.(100, '¡Archivo guardado en almacenamiento local!');

    return {
      url: idbUrl,
      source: 'indexeddb',
      sizeStr,
      docNombre: file.name,
      docTipo,
    };
  } catch (idbErr) {
    console.warn('Fallback a IndexedDB falló, usando DataURL directa:', idbErr);
  }

  // 4. Last-resort fallback: Data URL
  const fallbackDataUrl = await fileToDataUrl(file);
  onProgress?.(100, '¡Archivo procesado!');

  return {
    url: fallbackDataUrl,
    source: 'dataurl',
    sizeStr,
    docNombre: file.name,
    docTipo,
  };
}

/**
 * Backwards-compatible wrapper for pedigree documents
 */
export async function persistPedigreeDocument(
  file: File,
  subjectNameOrId: string = 'ejemplar',
  onProgress?: (progressPct: number, statusText: string) => void
): Promise<{
  url: string;
  source: 'storage' | 'indexeddb' | 'dataurl';
  sizeStr: string;
  docNombre: string;
  docTipo: 'PDF' | 'IMAGEN';
}> {
  const result = await uploadPdfOrDocument(file, 'pedigrees', subjectNameOrId, onProgress);
  return {
    url: result.url,
    source: result.source === 'firebase_storage' ? 'storage' : (result.source as any),
    sizeStr: result.sizeStr,
    docNombre: result.docNombre,
    docTipo: result.docTipo,
  };
}
