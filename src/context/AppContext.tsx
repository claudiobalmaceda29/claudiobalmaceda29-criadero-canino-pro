import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Criadero,
  User,
  Ejemplar,
  RegistroSanitario,
  Monta,
  CicloCelo,
  MedicionProgesterona,
  Gestacion,
  Camada,
  Cachorro,
  PesajeCachorro,
  SimulacionCruza,
  ExposicionPOA,
  TransaccionEconomica,
  Notificacion,
  AuditoriaLog,
  UserRole,
  ChatConversation,
  ChatMessage,
} from '../types';
import { cleanForFirestore } from '../lib/dogUtils';
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
  INITIAL_CHATS,
  INITIAL_MESSAGES,
} from '../data/initialData';
import {
  auth,
  db,
  provider,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../lib/firebase';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  getDocs,
  getDoc,
  orderBy,
} from 'firebase/firestore';

const STORAGE_KEY = 'MI_CRIADERO_CANINO_DATA_V4';

interface AppContextType {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Firebase Auth & Cloud Sync
  firebaseUser: FirebaseUser | null;
  isFirebaseConnected: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  connectionStatusMessage: string | null;
  retryConnection: () => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  migrateAllDataToFirestore: () => Promise<void>;

  // Multi-criadero & User
  criaderos: Criadero[];
  currentCriaderoId: string;
  currentCriadero: Criadero | undefined;
  setCurrentCriaderoId: (id: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (val: boolean) => void;
  enterDemoMode: () => void;
  enterRealMode: () => Promise<void>;
  registerNewCriadero: (data: {
    nombre: string;
    afijo?: string;
    registroPOA?: string;
    razaPrincipal?: string;
    responsable?: string;
    telefono?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    incluirEjemplaresDemo?: boolean;
  }) => Promise<void>;

  // Active view tab navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Entities (scoped to current criadero where applicable)
  ejemplares: Ejemplar[];
  allEjemplares: Ejemplar[];
  registrosSanitarios: RegistroSanitario[];
  montas: Monta[];
  ciclosCelo: CicloCelo[];
  gestaciones: Gestacion[];
  camadas: Camada[];
  cachorros: Cachorro[];
  simulaciones: SimulacionCruza[];
  exposiciones: ExposicionPOA[];
  transacciones: TransaccionEconomica[];
  auditoria: AuditoriaLog[];
  notificaciones: Notificacion[];

  // Mutators
  addEjemplar: (e: Omit<Ejemplar, 'id' | 'createdAt'> & { id?: string }) => Promise<Ejemplar>;
  updateEjemplar: (id: string, e: Partial<Ejemplar>) => Promise<void>;
  deleteEjemplar: (id: string) => void;

  addRegistroSanitario: (r: Omit<RegistroSanitario, 'id'>) => void;
  deleteRegistroSanitario: (id: string) => void;

  addMonta: (m: Omit<Monta, 'id'>) => Monta;
  updateMonta: (id: string, m: Partial<Monta>) => void;
  deleteMonta: (id: string) => void;

  addCicloCelo: (c: Omit<CicloCelo, 'id'>) => void;
  updateCicloCelo: (id: string, c: Partial<CicloCelo>) => void;
  addMedicionProgesterona: (cicloId: string, m: Omit<MedicionProgesterona, 'id'>) => void;

  addGestacion: (g: Omit<Gestacion, 'id'>) => Gestacion;
  updateGestacion: (id: string, g: Partial<Gestacion>) => void;
  deleteGestacion: (id: string) => void;
  completarHitoGestacion: (gestacionId: string, hitoId: string, resultado?: string) => void;
  registrarPartoReal: (gestacionId: string, camadaData: Omit<Camada, 'id' | 'createdAt'>) => void;

  addCamada: (c: Omit<Camada, 'id' | 'createdAt'>) => Camada;
  updateCamada: (id: string, c: Partial<Camada>) => void;
  deleteCamada: (id: string) => void;

  addCachorro: (c: Omit<Cachorro, 'id'>) => Cachorro;
  updateCachorro: (id: string, c: Partial<Cachorro>) => void;
  deleteCachorro: (id: string) => void;
  addPesajeCachorro: (cachorroId: string, pesaje: PesajeCachorro) => void;
  incorporarCachorroAPlantel: (cachorroId: string) => Ejemplar | null;

  addSimulacionCruza: (s: Omit<SimulacionCruza, 'id'>) => void;
  deleteSimulacionCruza: (id: string) => void;
  calculateCOIServer: (sirePedigree: Record<string, string>, damPedigree: Record<string, string>) => Promise<any>;
  parsePedigreeDatabaseUrl: (url: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  extractPedigreeFromPDF: (
    fileBase64: string,
    fileName: string,
    mimeType?: string
  ) => Promise<{
    success: boolean;
    data?: any;
    error?: string;
    matchedFather?: Ejemplar;
    matchedMother?: Ejemplar;
    ancestorsCount?: number;
  }>;

  addExposicion: (e: Omit<ExposicionPOA, 'id'>) => void;
  updateExposicion: (id: string, e: Partial<ExposicionPOA>) => void;
  deleteExposicion: (id: string) => void;

  addTransaccion: (t: Omit<TransaccionEconomica, 'id'>) => void;
  deleteTransaccion: (id: string) => void;

  addCriadero: (c: Omit<Criadero, 'id' | 'createdAt'>) => void;
  updateCriadero: (id: string, c: Partial<Criadero>) => void;
  deleteCriadero: (id: string) => Promise<void>;
  toggleCriaderoActivo: (id: string) => void;

  addUser: (u: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  updateUserRole: (id: string, rol: UserRole) => void;
  deleteUser: (id: string) => Promise<void>;
  cambiarPasswordUsuario: (nuevoPass: string) => boolean;

  // Notifications
  marcarNotificacionLeida: (id: string) => void;
  marcarTodasNotificacionesLeidas: () => void;

  // Global search modal trigger
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Print modal trigger
  printModalData: {
    isOpen: boolean;
    type: 'PEDIGREE' | 'HEALTH_BOOK' | 'DELIVERY_CERTIFICATE' | 'ECONOMIC_REPORT' | 'LITTER_CARD' | 'DOG_CARD' | 'PEDIGREE_REQUEST';
    targetId: string;
    extraData?: any;
  };
  openPrintModal: (
    type: 'PEDIGREE' | 'HEALTH_BOOK' | 'DELIVERY_CERTIFICATE' | 'ECONOMIC_REPORT' | 'LITTER_CARD' | 'DOG_CARD' | 'PEDIGREE_REQUEST',
    targetId: string,
    extraData?: any
  ) => void;
  closePrintModal: () => void;

  // Backups & Restore
  exportBackupJSON: () => void;
  exportToCSV: (filename: string, rows: Record<string, any>[]) => void;
  validateBackupFile: (content: string) => { valid: boolean; summary?: any; error?: string };
  restoreFromBackup: (content: string) => { success: boolean; error?: string };
  resetDatabaseToFactory: () => void;

  // Chat & Comunicación entre Criadores (1 a 1 en tiempo real)
  chats: ChatConversation[];
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  activeChatMessages: ChatMessage[];
  unreadChatMessagesCount: number;
  startOrOpenChatWithCriadero: (targetCriaderoId: string) => Promise<string>;
  sendChatMessage: (chatId: string, texto: string) => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: defaults to Light Mode, persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme_preference');
      return stored === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
        localStorage.setItem('theme_preference', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
        localStorage.setItem('theme_preference', 'light');
      }
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Network connection state & error messaging
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionStatusMessage, setConnectionStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionStatusMessage('Conexión a internet restablecida. Sincronizando con Cloud Firestore...');
      testConnection().then((connected) => {
        setIsFirebaseConnected(connected);
      });
      setTimeout(() => {
        setConnectionStatusMessage(null);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatusMessage(
        'Sin conexión a internet. Los cambios se guardan localmente y se sincronizarán al reconectar.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const retryConnection = async (): Promise<boolean> => {
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);
    if (!online) {
      setConnectionStatusMessage(
        'El dispositivo continúa sin conexión a internet. Verificá tu red WiFi o datos móviles.'
      );
      return false;
    }
    const connected = await testConnection();
    setIsFirebaseConnected(connected);
    if (connected) {
      setConnectionStatusMessage('¡Conexión verificada exitosamente con Cloud Firestore!');
      setTimeout(() => setConnectionStatusMessage(null), 3000);
      return true;
    } else {
      setConnectionStatusMessage('Hay acceso a internet pero no se pudo contactar con Firestore en este momento.');
      return false;
    }
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Load local state or initial fallback
  const [localData, setLocalData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.criaderos) && Array.isArray(parsed.ejemplares)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing local cache:', e);
    }
    return {
      criaderos: INITIAL_CRIADEROS,
      users: INITIAL_USERS,
      ejemplares: INITIAL_EJEMPLARES,
      registrosSanitarios: INITIAL_REGISTROS_SANITARIOS,
      montas: INITIAL_MONTAS,
      ciclosCelo: INITIAL_CICLOS_CELO,
      gestaciones: INITIAL_GESTACIONES,
      camadas: INITIAL_CAMADAS,
      cachorros: INITIAL_CACHORROS,
      simulaciones: INITIAL_SIMULACIONES,
      exposiciones: INITIAL_EXPOSICIONES,
      transacciones: INITIAL_TRANSACCIONES,
      auditoria: INITIAL_AUDITORIA,
    };
  });

  // State entities
  const [criaderos, setCriaderos] = useState<Criadero[]>(
    Array.isArray(localData.criaderos) ? localData.criaderos : INITIAL_CRIADEROS
  );
  const [users, setUsers] = useState<User[]>(
    Array.isArray(localData.users) ? localData.users : INITIAL_USERS
  );
  const DEMO_USER: User = useMemo(
    () => ({
      id: 'usr-demo',
      nombre: 'Visitante Demostración',
      email: 'demo@micriaderocanino.com.ar',
      rol: 'DEMO',
      criaderoId: 'cria-demo',
      createdAt: '2024-01-01T08:00:00Z',
    }),
    []
  );

  // Access Flow: Default to localStorage or DEMO mode if unauthenticated
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('is_demo_mode');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);

  const [currentCriaderoId, setCurrentCriaderoId] = useState<string>(() => {
    try {
      return localStorage.getItem('current_criadero_id') || 'cria-demo';
    } catch {
      return 'cria-demo';
    }
  });

  // Default active user is DEMO visitor on fresh page load
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USER);

  const [ejemplares, setEjemplares] = useState<Ejemplar[]>(
    Array.isArray(localData.ejemplares) ? localData.ejemplares : INITIAL_EJEMPLARES
  );
  const [registrosSanitarios, setRegistrosSanitarios] = useState<RegistroSanitario[]>(
    Array.isArray(localData.registrosSanitarios) ? localData.registrosSanitarios : INITIAL_REGISTROS_SANITARIOS
  );
  const [montas, setMontas] = useState<Monta[]>(
    Array.isArray(localData.montas) ? localData.montas : INITIAL_MONTAS
  );
  const [ciclosCelo, setCiclosCelo] = useState<CicloCelo[]>(
    Array.isArray(localData.ciclosCelo) ? localData.ciclosCelo : INITIAL_CICLOS_CELO
  );
  const [gestaciones, setGestaciones] = useState<Gestacion[]>(
    Array.isArray(localData.gestaciones) ? localData.gestaciones : INITIAL_GESTACIONES
  );
  const [camadas, setCamadas] = useState<Camada[]>(
    Array.isArray(localData.camadas) ? localData.camadas : INITIAL_CAMADAS
  );
  const [cachorros, setCachorros] = useState<Cachorro[]>(
    Array.isArray(localData.cachorros) ? localData.cachorros : INITIAL_CACHORROS
  );
  const [simulaciones, setSimulaciones] = useState<SimulacionCruza[]>(
    Array.isArray(localData.simulaciones) ? localData.simulaciones : INITIAL_SIMULACIONES
  );
  const [exposiciones, setExposiciones] = useState<ExposicionPOA[]>(
    Array.isArray(localData.exposiciones) ? localData.exposiciones : INITIAL_EXPOSICIONES
  );
  const [transacciones, setTransacciones] = useState<TransaccionEconomica[]>(
    Array.isArray(localData.transacciones) ? localData.transacciones : INITIAL_TRANSACCIONES
  );
  const [auditoria, setAuditoria] = useState<AuditoriaLog[]>(
    Array.isArray(localData.auditoria) ? localData.auditoria : INITIAL_AUDITORIA
  );
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // Chat 1 a 1 en tiempo real entre criadores
  const [chats, setChats] = useState<ChatConversation[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);

  const unreadChatMessagesCount = useMemo(() => {
    return chats.reduce((acc, c) => acc + (c.unreadCounts?.[currentCriaderoId] || 0), 0);
  }, [chats, currentCriaderoId]);

  // Search modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Print modal state
  const [printModalData, setPrintModalData] = useState<{
    isOpen: boolean;
    type: 'PEDIGREE' | 'HEALTH_BOOK' | 'DELIVERY_CERTIFICATE' | 'ECONOMIC_REPORT' | 'LITTER_CARD' | 'DOG_CARD' | 'PEDIGREE_REQUEST';
    targetId: string;
    extraData?: any;
  }>({
    isOpen: false,
    type: 'PEDIGREE',
    targetId: '',
  });

  const openPrintModal = useCallback(
    (
      type: 'PEDIGREE' | 'HEALTH_BOOK' | 'DELIVERY_CERTIFICATE' | 'ECONOMIC_REPORT' | 'LITTER_CARD' | 'DOG_CARD' | 'PEDIGREE_REQUEST',
      targetId: string,
      extraData?: any
    ) => {
      // Security Check: Only the puppy's owner criador or Super Admin can view/download Solicitud de Pedigree Digital
      if (type === 'PEDIGREE_REQUEST') {
        const pup = cachorros.find((c) => c.id === targetId);
        const isAdmin =
          currentUser.rol === 'SUPER_ADMIN' ||
          currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';
        if (pup && pup.criaderoId !== currentCriaderoId && !isAdmin) {
          console.warn(
            'Seguridad Multi-Criadero: La solicitud de emisión de pedigree digital es privada y solo accesible por el criador dueño del cachorro.'
          );
          return;
        }
      }
      setPrintModalData({ isOpen: true, type, targetId, extraData });
    },
    [cachorros, currentCriaderoId, currentUser]
  );

  const closePrintModal = useCallback(() => {
    setPrintModalData((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Sync to LocalStorage for offline persistence
  useEffect(() => {
    try {
      const dataToSave = {
        criaderos,
        users,
        ejemplares,
        registrosSanitarios,
        montas,
        ciclosCelo,
        gestaciones,
        camadas,
        cachorros,
        simulaciones,
        exposiciones,
        transacciones,
        auditoria,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [
    criaderos,
    users,
    ejemplares,
    registrosSanitarios,
    montas,
    ciclosCelo,
    gestaciones,
    camadas,
    cachorros,
    simulaciones,
    exposiciones,
    transacciones,
    auditoria,
  ]);

  // Test Firebase connection on boot as required by skill
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });
  }, []);

  // Listen to Firebase Auth state & restore session on reload (F5)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsFirebaseConnected(true);
        const isSuperAdminEmail =
          fbUser.email?.toLowerCase() === 'admin@criaderodemo.com.ar' ||
          fbUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

        if (isSuperAdminEmail) {
          const savedCriaderoId = localStorage.getItem('current_criadero_id') || 'cria-demo';
          const adminUser: User = {
            id: fbUser.uid,
            nombre: fbUser.displayName || 'Administrador Demo (SuperAdmin)',
            email: fbUser.email || 'admin@criaderodemo.com.ar',
            rol: 'SUPER_ADMIN',
            criaderoId: savedCriaderoId,
            avatarUrl: fbUser.photoURL || undefined,
            createdAt: new Date().toISOString(),
          };
          setCurrentUser(adminUser);
          setCurrentCriaderoId(savedCriaderoId);
          setIsDemoMode(false);
          try {
            localStorage.setItem('is_demo_mode', 'false');
            localStorage.setItem('current_criadero_id', savedCriaderoId);
            setDoc(doc(db, 'users', fbUser.uid), cleanForFirestore(adminUser), { merge: true }).catch(() => {});
          } catch {}
          return;
        }

        // Regular user: retrieve profile & registered criadero from Firestore
        try {
          const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            if (userData.criaderoId) {
              setCurrentUser(userData);
              setCurrentCriaderoId(userData.criaderoId);
              setIsDemoMode(false);
              try {
                localStorage.setItem('is_demo_mode', 'false');
                localStorage.setItem('current_criadero_id', userData.criaderoId);
              } catch {}
              return;
            }
          }
        } catch (e) {
          console.warn('Error reading user document on auth change:', e);
        }
      } else {
        // Unauthenticated visitor
        const savedMode = localStorage.getItem('is_demo_mode');
        if (savedMode === 'false') {
          // No user logged in anymore, revert to demo
          setIsDemoMode(true);
          setCurrentUser(DEMO_USER);
          try {
            localStorage.setItem('is_demo_mode', 'true');
            localStorage.setItem('current_criadero_id', 'cria-demo');
          } catch {}
        }
      }
    });

    return () => unsubscribe();
  }, [DEMO_USER]);

  // Enter Real Mode: Check credentials & criadero association
  const enterRealMode = async () => {
    let fbUser = firebaseUser;
    if (!fbUser) {
      try {
        const result = await signInWithPopup(auth, provider);
        fbUser = result.user;
        setFirebaseUser(fbUser);
      } catch (err: any) {
        console.error('Google Sign-In failed:', err);
        throw err;
      }
    }

    if (!fbUser) return;

    const isSuperAdminEmail =
      fbUser.email?.toLowerCase() === 'admin@criaderodemo.com.ar' ||
      fbUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

    if (isSuperAdminEmail) {
      const adminUser: User = {
        id: fbUser.uid,
        nombre: fbUser.displayName || 'Administrador Demo (SuperAdmin)',
        email: fbUser.email || 'admin@criaderodemo.com.ar',
        rol: 'SUPER_ADMIN',
        criaderoId: 'cria-demo',
        avatarUrl: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(adminUser);
      setCurrentCriaderoId('cria-demo');
      setIsDemoMode(false);

      try {
        await setDoc(doc(db, 'users', fbUser.uid), adminUser, { merge: true });
      } catch (e) {
        console.warn('SuperAdmin user doc sync error:', e);
      }
      return;
    }

    // Check if user has an existing criadero in Firestore
    try {
      const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        if (userData.criaderoId) {
          setCurrentUser(userData);
          setCurrentCriaderoId(userData.criaderoId);
          setIsDemoMode(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not query user doc:', e);
    }

    // If user has no criadero yet, open the registration modal
    setIsRegisterModalOpen(true);
  };

  // Register New Criadero & Link with Google account
  const registerNewCriadero = async (data: {
    nombre: string;
    afijo?: string;
    registroPOA?: string;
    razaPrincipal?: string;
    responsable?: string;
    telefono?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    incluirEjemplaresDemo?: boolean;
  }) => {
    let fbUser = firebaseUser;
    if (!fbUser) {
      const result = await signInWithPopup(auth, provider);
      fbUser = result.user;
      setFirebaseUser(fbUser);
    }

    if (!fbUser) {
      throw new Error('Se requiere autenticación para registrar el criadero');
    }

    const isSuperAdminEmail =
      fbUser.email?.toLowerCase() === 'admin@criaderodemo.com.ar' ||
      fbUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

    const newCriaderoId = isSuperAdminEmail
      ? 'cria-demo'
      : `cria-${fbUser.uid.substring(0, 8)}-${Date.now().toString(36)}`;

    const newCriadero: Criadero = {
      id: newCriaderoId,
      nombre: data.nombre,
      afijo: data.afijo || '',
      registroPOA: data.registroPOA || '',
      responsable: data.responsable || fbUser.displayName || 'Criador Responsable',
      email: fbUser.email || '',
      telefono: data.telefono || '',
      ciudad: data.ciudad || '',
      provincia: data.provincia || '',
      pais: data.pais || 'Argentina',
      direccion: '',
      activo: true,
      monedaDefault: 'ARS',
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: fbUser.uid,
      nombre: data.responsable || fbUser.displayName || 'Criador Responsable',
      email: fbUser.email || '',
      rol: isSuperAdminEmail ? 'SUPER_ADMIN' : 'CRIADOR',
      criaderoId: newCriaderoId,
      avatarUrl: fbUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save Criadero and User to Firestore
    try {
      await setDoc(doc(db, 'criaderos', newCriaderoId), newCriadero, { merge: true });
      await setDoc(doc(db, 'users', fbUser.uid), newUser, { merge: true });

      // Add to local criaderos and users
      setCriaderos((prev) => [newCriadero, ...prev.filter((c) => c.id !== newCriaderoId)]);
      setUsers((prev) => [newUser, ...prev.filter((u) => u.id !== newUser.id)]);

      // If user selected to include starter dogs, create 2 base dogs
      if (data.incluirEjemplaresDemo) {
        const starter1: Ejemplar = {
          id: `dog-${Date.now()}-1`,
          criaderoId: newCriaderoId,
          nombreCompleto: `Max ${data.afijo || data.nombre}`,
          afijo: data.afijo || data.nombre,
          sexo: 'MACHO',
          raza: data.razaPrincipal || 'Ovejero Alemán',
          fechaNacimiento: '2022-03-15',
          numeroPOA: 'POA-10001',
          microchip: '981098102345671',
          tatuaje: 'TAT-001',
          identificacionInterna: 'M-01',
          color: 'Negro y Fuego',
          pelo: 'CORTO',
          estadoReproductivo: 'ACTIVO',
          estado: 'ACTIVO',
          fotoUrl:
            'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=400&q=80',
          displasiaCadera: 'HD "a" Normal (Libre)',
          displasiaCodo: 'ED "0" Normal (Libre)',
          titulos: ['BH', 'Excelente'],
          calificacionCria: 'Seleccionado 1ª Clase',
          adn: 'Comprobado (Garantizado)',
          observaciones: 'Ejemplar base para inicio de criadero.',
          createdAt: new Date().toISOString(),
        };

        const starter2: Ejemplar = {
          id: `dog-${Date.now()}-2`,
          criaderoId: newCriaderoId,
          nombreCompleto: `Bella ${data.afijo || data.nombre}`,
          afijo: data.afijo || data.nombre,
          sexo: 'HEMBRA',
          raza: data.razaPrincipal || 'Ovejero Alemán',
          fechaNacimiento: '2022-06-20',
          numeroPOA: 'POA-10002',
          microchip: '981098102345672',
          tatuaje: 'TAT-002',
          identificacionInterna: 'H-01',
          color: 'Negro y Fuego',
          pelo: 'CORTO',
          estadoReproductivo: 'ACTIVO',
          estado: 'ACTIVO',
          fotoUrl:
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80',
          displasiaCadera: 'HD "a" Normal (Libre)',
          displasiaCodo: 'ED "0" Normal (Libre)',
          titulos: ['BH', 'Excelente'],
          calificacionCria: 'Seleccionado 1ª Clase',
          adn: 'Comprobado (Garantizado)',
          observaciones: 'Ejemplar base para inicio de criadero.',
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'ejemplares', starter1.id), starter1);
        await setDoc(doc(db, 'ejemplares', starter2.id), starter2);
      } else {
        // Clear in-memory lists for this criadero so it starts completely empty (0 dogs, 0 litters)
        setEjemplares((prev) => prev.filter((e) => e.criaderoId !== newCriaderoId));
        setCamadas((prev) => prev.filter((c) => c.criaderoId !== newCriaderoId));
        setCachorros((prev) => prev.filter((c) => c.criaderoId !== newCriaderoId));
        setMontas((prev) => prev.filter((m) => m.criaderoId !== newCriaderoId));
        setGestaciones((prev) => prev.filter((g) => g.criaderoId !== newCriaderoId));
        setRegistrosSanitarios((prev) => prev.filter((r) => r.criaderoId !== newCriaderoId));
        setTransacciones((prev) => prev.filter((t) => t.criaderoId !== newCriaderoId));
        setCiclosCelo((prev) => prev.filter((c) => c.criaderoId !== newCriaderoId));
        setExposiciones((prev) => prev.filter((e) => e.criaderoId !== newCriaderoId));
      }

      setCurrentCriaderoId(newCriaderoId);
      setCurrentUser(newUser);
      setIsDemoMode(false);
      try {
        localStorage.setItem('current_criadero_id', newCriaderoId);
        localStorage.setItem('is_demo_mode', 'false');
      } catch {}
    } catch (err: any) {
      console.error('Error creating criadero and user:', err);
      handleFirestoreError(err, OperationType.CREATE, 'criaderos');
      throw err;
    }
  };

  // Return to interactive DEMO mode
  const enterDemoMode = () => {
    setIsDemoMode(true);
    setCurrentUser(DEMO_USER);
    setCurrentCriaderoId('cria-demo');
    try {
      localStorage.setItem('current_criadero_id', 'cria-demo');
      localStorage.setItem('is_demo_mode', 'true');
    } catch {}
    setEjemplares(INITIAL_EJEMPLARES);
    setCamadas(INITIAL_CAMADAS);
    setCachorros(INITIAL_CACHORROS);
    setMontas(INITIAL_MONTAS);
    setGestaciones(INITIAL_GESTACIONES);
    setRegistrosSanitarios(INITIAL_REGISTROS_SANITARIOS);
    setTransacciones(INITIAL_TRANSACCIONES);
    setCiclosCelo(INITIAL_CICLOS_CELO);
    setExposiciones(INITIAL_EXPOSICIONES);
    setChats(INITIAL_CHATS);
    setActiveChatId(null);
    setActiveChatMessages([]);
  };

  // Firestore Realtime Listeners (Active ONLY when in Real Mode and Authenticated)
  useEffect(() => {
    if (isDemoMode || !firebaseUser) return;

    setIsSyncing(true);
    const unsubs: (() => void)[] = [];

    try {
      // 1. Criaderos listener
      const criaderosRef = collection(db, 'criaderos');
      const unsubCriaderos = onSnapshot(
        criaderosRef,
        (snap) => {
          const list: Criadero[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Criadero));
          if (list.length > 0) {
            setCriaderos(list);
          }
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'criaderos')
      );
      unsubs.push(unsubCriaderos);

      // 2. Ejemplares listener (filtered strictly by current criadero or user uid)
      const ejemplaresRef = collection(db, 'ejemplares');
      const validCriaderoIds = [currentCriaderoId];
      if (currentUser?.id && !validCriaderoIds.includes(currentUser.id)) validCriaderoIds.push(currentUser.id);
      if (firebaseUser?.uid && !validCriaderoIds.includes(firebaseUser.uid)) validCriaderoIds.push(firebaseUser.uid);

      const qEjemplares = query(ejemplaresRef, where('criaderoId', 'in', validCriaderoIds));

      const unsubEjemplares = onSnapshot(
        qEjemplares,
        (snap) => {
          const list: Ejemplar[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Ejemplar));
          setEjemplares(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'ejemplares')
      );
      unsubs.push(unsubEjemplares);

      // 3. Camadas listener
      const camadasRef = collection(db, 'camadas');
      const qCamadas = query(camadasRef, where('criaderoId', '==', currentCriaderoId));

      const unsubCamadas = onSnapshot(
        qCamadas,
        (snap) => {
          const list: Camada[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Camada));
          setCamadas(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'camadas')
      );
      unsubs.push(unsubCamadas);

      // 4. Cachorros listener
      const cachorrosRef = collection(db, 'cachorros');
      const qCachorros = query(cachorrosRef, where('criaderoId', '==', currentCriaderoId));

      const unsubCachorros = onSnapshot(
        qCachorros,
        (snap) => {
          const list: Cachorro[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Cachorro));
          setCachorros(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'cachorros')
      );
      unsubs.push(unsubCachorros);

      // 5. Montas listener
      const montasRef = collection(db, 'montas');
      const qMontas = query(montasRef, where('criaderoId', '==', currentCriaderoId));

      const unsubMontas = onSnapshot(
        qMontas,
        (snap) => {
          const list: Monta[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Monta));
          setMontas(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'montas')
      );
      unsubs.push(unsubMontas);

      // 6. Gestaciones listener
      const gestacionesRef = collection(db, 'gestaciones');
      const qGestaciones = query(gestacionesRef, where('criaderoId', '==', currentCriaderoId));

      const unsubGest = onSnapshot(
        qGestaciones,
        (snap) => {
          const list: Gestacion[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Gestacion));
          setGestaciones(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'gestaciones')
      );
      unsubs.push(unsubGest);

      // 7. Registros Sanitarios listener
      const registrosRef = collection(db, 'registrosSanitarios');
      const qRegistros = query(registrosRef, where('criaderoId', '==', currentCriaderoId));

      const unsubRegistros = onSnapshot(
        qRegistros,
        (snap) => {
          const list: RegistroSanitario[] = [];
          snap.forEach((d) => list.push(d.data() as RegistroSanitario));
          setRegistrosSanitarios(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'registrosSanitarios')
      );
      unsubs.push(unsubRegistros);

      // 8. Transacciones Económicas listener
      const transaccionesRef = collection(db, 'transacciones');
      const qTransacciones = query(transaccionesRef, where('criaderoId', '==', currentCriaderoId));

      const unsubTransacciones = onSnapshot(
        qTransacciones,
        (snap) => {
          const list: TransaccionEconomica[] = [];
          snap.forEach((d) => list.push(d.data() as TransaccionEconomica));
          setTransacciones(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'transacciones')
      );
      unsubs.push(unsubTransacciones);

      // 9. Ciclos Celo listener
      const ciclosRef = collection(db, 'ciclosCelo');
      const qCiclos = query(ciclosRef, where('criaderoId', '==', currentCriaderoId));

      const unsubCiclos = onSnapshot(
        qCiclos,
        (snap) => {
          const list: CicloCelo[] = [];
          snap.forEach((d) => list.push(d.data() as CicloCelo));
          setCiclosCelo(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'ciclosCelo')
      );
      unsubs.push(unsubCiclos);

      // 10. Exposiciones listener
      const exposicionesRef = collection(db, 'exposiciones');
      const qExposiciones = query(exposicionesRef, where('criaderoId', '==', currentCriaderoId));

      const unsubExposiciones = onSnapshot(
        qExposiciones,
        (snap) => {
          const list: ExposicionPOA[] = [];
          snap.forEach((d) => list.push(d.data() as ExposicionPOA));
          setExposiciones(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'exposiciones')
      );
      unsubs.push(unsubExposiciones);

      // 11. Chats listener (Real-time 1 a 1 entre criadores)
      const chatsRef = collection(db, 'chats');
      const isSuperAdminEmail =
        firebaseUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com' ||
        currentUser.rol === 'SUPER_ADMIN';

      const qChats = isSuperAdminEmail
        ? query(chatsRef)
        : query(chatsRef, where('participantCriaderoIds', 'array-contains', currentCriaderoId));

      const unsubChats = onSnapshot(
        qChats,
        (snap) => {
          const list: ChatConversation[] = [];
          snap.forEach((d) => list.push(d.data() as ChatConversation));
          list.sort(
            (a, b) =>
              new Date(b.lastMessageTimestamp || b.updatedAt).getTime() -
              new Date(a.lastMessageTimestamp || a.updatedAt).getTime()
          );
          setChats(list);

          // Generar notificación en el Header si hay mensajes sin leer dirigidos a este criadero
          list.forEach((chat) => {
            const unread = chat.unreadCounts?.[currentCriaderoId] || 0;
            if (unread > 0 && chat.lastMessageSenderCriaderoId !== currentCriaderoId) {
              const otherCriaderoId =
                chat.participantCriaderoIds.find((id) => id !== currentCriaderoId) || '';
              const senderName =
                chat.participantNames?.[otherCriaderoId] ||
                chat.participantAfijos?.[otherCriaderoId] ||
                'Criador Colega';
              const notifId = `chat-notif-${chat.id}-${chat.lastMessageTimestamp}`;

              setNotificaciones((prev) => {
                if (prev.some((n) => n.id === notifId)) return prev;
                return [
                  {
                    id: notifId,
                    tipo: 'CHAT',
                    titulo: `Mensaje de ${senderName}`,
                    mensaje: chat.lastMessageText || 'Has recibido un nuevo mensaje',
                    fecha: new Date(chat.lastMessageTimestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    leida: false,
                    enlaceTab: 'chat',
                    prioridad: 'ALTA',
                  },
                  ...prev,
                ];
              });
            }
          });
        },
        (error) => console.warn('Chat listener note:', error)
      );
      unsubs.push(unsubChats);
    } catch (e) {
      console.warn('Realtime sync listener setup error:', e);
    } finally {
      setIsSyncing(false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isDemoMode, firebaseUser, currentCriaderoId, currentUser]);

  // Listener para mensajes de la conversación activa
  useEffect(() => {
    if (!activeChatId) {
      setActiveChatMessages([]);
      return;
    }

    if (isDemoMode || !firebaseUser) {
      // En modo demo, cargar mensajes de muestra
      const demoMsgs = INITIAL_MESSAGES[activeChatId] || [];
      setActiveChatMessages(demoMsgs);
      return;
    }

    const messagesRef = collection(db, 'chats', activeChatId, 'messages');
    const qMessages = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubMessages = onSnapshot(
      qMessages,
      (snap) => {
        const msgs: ChatMessage[] = [];
        let hasUnread = false;
        snap.forEach((d) => {
          const msg = d.data() as ChatMessage;
          msgs.push(msg);
          if (msg.receiverCriaderoId === currentCriaderoId && !msg.leido) {
            hasUnread = true;
          }
        });
        setActiveChatMessages(msgs);

        // Si hay mensajes no leídos, marcarlos como leídos
        if (hasUnread) {
          markChatAsRead(activeChatId);
        }
      },
      (err) => console.warn('Messages listener error:', err)
    );

    return () => unsubMessages();
  }, [activeChatId, isDemoMode, firebaseUser, currentCriaderoId]);

  // Marcar chat como leído
  const markChatAsRead = async (chatId: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              unreadCounts: {
                ...c.unreadCounts,
                [currentCriaderoId]: 0,
              },
            }
          : c
      )
    );

    // Marcar notificaciones de este chat como leídas
    setNotificaciones((prev) =>
      prev.map((n) =>
        n.tipo === 'CHAT' && n.id.includes(chatId) ? { ...n, leida: true } : n
      )
    );

    if (isDemoMode || !firebaseUser) {
      setActiveChatMessages((prev) =>
        prev.map((m) => (m.chatId === chatId ? { ...m, leido: true } : m))
      );
      return;
    }

    try {
      await setDoc(
        doc(db, 'chats', chatId),
        {
          [`unreadCounts.${currentCriaderoId}`]: 0,
        },
        { merge: true }
      );

      const msgsRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        msgsRef,
        where('receiverCriaderoId', '==', currentCriaderoId),
        where('leido', '==', false)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.update(d.ref, { leido: true });
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn('Error marking chat as read:', e);
    }
  };

  // Iniciar o abrir conversación con otro criadero
  const startOrOpenChatWithCriadero = async (targetCriaderoId: string): Promise<string> => {
    const existing = chats.find(
      (c) =>
        c.participantCriaderoIds.includes(currentCriaderoId) &&
        c.participantCriaderoIds.includes(targetCriaderoId)
    );

    if (existing) {
      setActiveChatId(existing.id);
      setActiveTab('chat');
      return existing.id;
    }

    const targetCria = criaderos.find((c) => c.id === targetCriaderoId);
    const chatId = `chat_${[currentCriaderoId, targetCriaderoId].sort().join('_')}`;

    const newChat: ChatConversation = {
      id: chatId,
      participantCriaderoIds: [currentCriaderoId, targetCriaderoId],
      participantUids: firebaseUser ? [firebaseUser.uid] : ['usr-demo'],
      participantNames: {
        [currentCriaderoId]: currentCriadero?.nombre || 'Mi Criadero',
        [targetCriaderoId]: targetCria?.nombre || 'Criadero Colega',
      },
      participantAfijos: {
        [currentCriaderoId]: currentCriadero?.afijo || '',
        [targetCriaderoId]: targetCria?.afijo || '',
      },
      participantWhatsApps: {
        [currentCriaderoId]: {
          numero: currentCriadero?.whatsappContacto || currentCriadero?.telefono || '',
          publico: currentCriadero?.whatsappPublico ?? false,
        },
        [targetCriaderoId]: {
          numero: targetCria?.whatsappContacto || targetCria?.telefono || '',
          publico: targetCria?.whatsappPublico ?? false,
        },
      },
      lastMessageText: 'Conversación iniciada',
      lastMessageTimestamp: new Date().toISOString(),
      lastMessageSenderUid: firebaseUser?.uid || 'usr-demo',
      lastMessageSenderCriaderoId: currentCriaderoId,
      unreadCounts: {
        [currentCriaderoId]: 0,
        [targetCriaderoId]: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(chatId);
    setActiveTab('chat');

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'chats', chatId), newChat);
      } catch (e) {
        console.warn('Error creating chat doc in Firestore:', e);
      }
    }

    return chatId;
  };

  // Enviar mensaje de chat
  const sendChatMessage = async (chatId: string, texto: string): Promise<void> => {
    const cleanText = texto.trim();
    if (!cleanText) return;

    const chat = chats.find((c) => c.id === chatId);
    const otherCriaderoId =
      chat?.participantCriaderoIds.find((id) => id !== currentCriaderoId) || '';

    const newMsgId = `msg-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newMsg: ChatMessage = {
      id: newMsgId,
      chatId,
      senderUid: firebaseUser?.uid || currentUser.id,
      senderCriaderoId: currentCriaderoId,
      senderNombre: currentCriadero?.nombre || currentUser.nombre,
      receiverCriaderoId: otherCriaderoId,
      texto: cleanText,
      timestamp,
      leido: false,
    };

    // Actualización local inmediata
    setActiveChatMessages((prev) => [...prev, newMsg]);

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              lastMessageText: cleanText,
              lastMessageTimestamp: timestamp,
              lastMessageSenderUid: newMsg.senderUid,
              lastMessageSenderCriaderoId: currentCriaderoId,
              updatedAt: timestamp,
              unreadCounts: {
                ...c.unreadCounts,
                [otherCriaderoId]: (c.unreadCounts?.[otherCriaderoId] || 0) + 1,
              },
            }
          : c
      )
    );

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'chats', chatId, 'messages', newMsgId), newMsg);

        const nextUnread = (chat?.unreadCounts?.[otherCriaderoId] || 0) + 1;
        await setDoc(
          doc(db, 'chats', chatId),
          {
            lastMessageText: cleanText,
            lastMessageTimestamp: timestamp,
            lastMessageSenderUid: newMsg.senderUid,
            lastMessageSenderCriaderoId: currentCriaderoId,
            updatedAt: timestamp,
            [`unreadCounts.${otherCriaderoId}`]: nextUnread,
          },
          { merge: true }
        );
      } catch (err: any) {
        console.error('Error sending chat message to Firestore:', err);
        handleFirestoreError(err, OperationType.CREATE, `chats/${chatId}/messages`);
        throw err;
      }
    }
  };

  // Google Sign-In helper
  const loginWithGoogle = async (): Promise<void> => {
    try {
      const res = await signInWithPopup(auth, provider);
      setFirebaseUser(res.user);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  // Sign out helper
  const logout = async () => {
    try {
      await fbSignOut(auth);
      setFirebaseUser(null);
      enterDemoMode();
    } catch (error) {
      console.error('Sign Out error:', error);
    }
  };

  // Migrate all current data to Firestore
  const migrateAllDataToFirestore = async () => {
    if (!firebaseUser) {
      throw new Error('Debes iniciar sesión con Google para sincronizar a Firestore');
    }
    setIsSyncing(true);
    try {
      const batch = writeBatch(db);

      // Criaderos
      criaderos.forEach((c) => {
        batch.set(doc(db, 'criaderos', c.id), c, { merge: true });
      });

      // Ejemplares
      ejemplares.forEach((e) => {
        batch.set(doc(db, 'ejemplares', e.id), e, { merge: true });
      });

      // Camadas
      camadas.forEach((c) => {
        batch.set(doc(db, 'camadas', c.id), c, { merge: true });
      });

      // Cachorros
      cachorros.forEach((c) => {
        batch.set(doc(db, 'cachorros', c.id), c, { merge: true });
      });

      // Montas
      montas.forEach((m) => {
        batch.set(doc(db, 'montas', m.id), m, { merge: true });
      });

      // Gestaciones
      gestaciones.forEach((g) => {
        batch.set(doc(db, 'gestaciones', g.id), g, { merge: true });
      });

      // Registros sanitarios
      registrosSanitarios.forEach((r) => {
        batch.set(doc(db, 'registrosSanitarios', r.id), r, { merge: true });
      });

      // Transacciones
      transacciones.forEach((t) => {
        batch.set(doc(db, 'transacciones', t.id), t, { merge: true });
      });

      await batch.commit();

      // Add audit log
      const auditItem: AuditoriaLog = {
        id: `audit-${Date.now()}`,
        fecha: new Date().toISOString(),
        usuarioNombre: currentUser.nombre,
        accion: 'MIGRACION_FIRESTORE',
        modulo: 'SISTEMA',
        detalle: 'Migración masiva de datos locales a Cloud Firestore completada exitosamente.',
      };
      setAuditoria((prev) => [auditItem, ...prev]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch_migration');
    } finally {
      setIsSyncing(false);
    }
  };

  // Current criadero object
  const currentCriadero = useMemo(() => {
    return criaderos.find((c) => c.id === currentCriaderoId) || criaderos[0];
  }, [criaderos, currentCriaderoId]);

  // Scoped lists - strictly filtered to currentCriaderoId or user uid for multi-tenant isolation
  const currentEjemplares = useMemo(() => {
    return ejemplares.filter(
      (e) =>
        e.criaderoId === currentCriaderoId ||
        (currentUser?.id && e.criaderoId === currentUser.id) ||
        ((currentUser as any)?.uid && e.criaderoId === (currentUser as any).uid) ||
        (firebaseUser?.uid && e.criaderoId === firebaseUser.uid)
    );
  }, [ejemplares, currentCriaderoId, currentUser, firebaseUser]);

  const currentRegistros = useMemo(() => {
    return registrosSanitarios.filter((r) => r.criaderoId === currentCriaderoId);
  }, [registrosSanitarios, currentCriaderoId]);

  const currentMontas = useMemo(() => {
    return montas.filter((m) => m.criaderoId === currentCriaderoId);
  }, [montas, currentCriaderoId]);

  const currentCiclos = useMemo(() => {
    return ciclosCelo.filter((c) => c.criaderoId === currentCriaderoId);
  }, [ciclosCelo, currentCriaderoId]);

  const currentGestaciones = useMemo(() => {
    return gestaciones.filter((g) => g.criaderoId === currentCriaderoId);
  }, [gestaciones, currentCriaderoId]);

  const currentCamadas = useMemo(() => {
    return camadas.filter((c) => c.criaderoId === currentCriaderoId);
  }, [camadas, currentCriaderoId]);

  const currentCachorros = useMemo(() => {
    return cachorros.filter((c) => c.criaderoId === currentCriaderoId);
  }, [cachorros, currentCriaderoId]);

  const currentSimulaciones = useMemo(() => {
    return simulaciones.filter((s) => s.criaderoId === currentCriaderoId);
  }, [simulaciones, currentCriaderoId]);

  const currentExposiciones = useMemo(() => {
    return exposiciones.filter((e) => e.criaderoId === currentCriaderoId);
  }, [exposiciones, currentCriaderoId]);

  const currentTransacciones = useMemo(() => {
    return transacciones.filter((t) => t.criaderoId === currentCriaderoId);
  }, [transacciones, currentCriaderoId]);

  // Server-side COI Calculation implementation
  const calculateCOIServer = async (
    sirePedigree: Record<string, string>,
    damPedigree: Record<string, string>
  ) => {
    try {
      const res = await fetch('/api/coi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sirePedigree, damPedigree }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Server-side COI calculation failed, fallback to client algorithm:', e);
    }
    // Fallback if offline
    return null;
  };

  // Helper to parse PedigreeDatabase.com profiles
  const parsePedigreeDatabaseUrl = async (
    url: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const res = await fetch('/api/pedigree-database/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || `Error ${res.status}: No se pudo procesar el perfil de PedigreeDatabase.com`,
        };
      }
      return { success: true, data: json.data };
    } catch (e: any) {
      console.error('Error fetching PedigreeDatabase profile:', e);
      return {
        success: false,
        error: `Error de red al consultar PedigreeDatabase.com: ${e.message || 'Verifique su conexión'}`,
      };
    }
  };

  // Helper for automatic pedigree extraction from PDF/image certificates using Gemini AI
  const extractPedigreeFromPDF = async (
    fileBase64: string,
    fileName: string,
    mimeType?: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    matchedFather?: Ejemplar;
    matchedMother?: Ejemplar;
    ancestorsCount?: number;
  }> => {
    try {
      const res = await fetch('/api/extract-pedigree-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64, fileName, mimeType }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error || `Error ${res.status}: No se pudo procesar el archivo de pedigree.`,
        };
      }
      const extracted = json.data;
      const normalize = (s?: string) => (s || '').trim().toLowerCase();
      const fatherName = normalize(extracted.padre?.nombre);
      const fatherPOA = normalize(extracted.padre?.poa);
      const motherName = normalize(extracted.madre?.nombre);
      const motherPOA = normalize(extracted.madre?.poa);

      let matchedFather: Ejemplar | undefined;
      let matchedMother: Ejemplar | undefined;

      if (fatherName || fatherPOA) {
        matchedFather = ejemplares.find((e) => {
          if (fatherPOA && normalize(e.numeroPOA) === fatherPOA) return true;
          if (fatherName && (normalize(e.nombreCompleto) === fatherName || (fatherName.length >= 5 && normalize(e.nombreCompleto).includes(fatherName)))) return true;
          return false;
        });
      }

      if (motherName || motherPOA) {
        matchedMother = ejemplares.find((e) => {
          if (motherPOA && normalize(e.numeroPOA) === motherPOA) return true;
          if (motherName && (normalize(e.nombreCompleto) === motherName || (motherName.length >= 5 && normalize(e.nombreCompleto).includes(motherName)))) return true;
          return false;
        });
      }

      return {
        success: true,
        data: extracted,
        matchedFather,
        matchedMother,
        ancestorsCount: extracted.conteoAntepasadosIdentificados || 0,
      };
    } catch (err: any) {
      console.error('Error calling /api/extract-pedigree-pdf:', err);
      return {
        success: false,
        error: `Error de red al procesar el archivo: ${err.message || 'Verifique su conexión'}`,
      };
    }
  };

  // Multi-criadero Security & Authorization Helper
  const isSuperAdminUser = useMemo(() => {
    return (
      currentUser.rol === 'SUPER_ADMIN' ||
      currentUser.email?.toLowerCase() === 'admin@criaderodemo.com.ar' ||
      currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com'
    );
  }, [currentUser]);

  const canManageCriaderoResource = useCallback(
    (resourceCriaderoId?: string): boolean => {
      if (isSuperAdminUser) return true;
      if (!resourceCriaderoId) return true;
      return resourceCriaderoId === currentCriaderoId;
    },
    [isSuperAdminUser, currentCriaderoId]
  );

  // Mutators for Ejemplares
  const addEjemplar = async (data: Omit<Ejemplar, 'id' | 'createdAt'> & { id?: string }): Promise<Ejemplar> => {
    const targetCriaderoId = data.criaderoId || currentCriaderoId || 'cria-demo';
    const cleanData = cleanForFirestore(data);
    const newDog: Ejemplar = {
      ...cleanData,
      id: data.id || `dog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      criaderoId: targetCriaderoId,
      createdAt: new Date().toISOString(),
    };

    // 1. Update in-memory state
    setEjemplares((prev) => [newDog, ...prev]);

    // 2. Immediate localStorage cache update so F5 reload NEVER loses the dog
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.ejemplares)) {
          parsed.ejemplares = [newDog, ...parsed.ejemplares.filter((e: any) => e.id !== newDog.id)];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. Write directly to Firestore and await confirmation
    if (firebaseUser) {
      try {
        const firestorePayload = cleanForFirestore(newDog);
        await setDoc(doc(db, 'ejemplares', newDog.id), firestorePayload, { merge: true });
      } catch (err: any) {
        console.error('Error guardando ejemplar en Firestore:', err);
        handleFirestoreError(err, OperationType.CREATE, 'ejemplares');
        throw err;
      }
    } else {
      // In demo mode or offline, simulate server latency for realistic feedback
      await new Promise((r) => setTimeout(r, 600));
    }

    return newDog;
  };

  const updateEjemplar = async (id: string, updates: Partial<Ejemplar>): Promise<void> => {
    const existing = ejemplares.find((d) => d.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede modificar datos de otro criadero.');
      return;
    }
    const cleanUpdates = cleanForFirestore(updates);
    setEjemplares((prev) =>
      prev.map((dog) => (dog.id === id ? { ...dog, ...cleanUpdates } : dog))
    );

    // Immediate localStorage cache update
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.ejemplares)) {
          parsed.ejemplares = parsed.ejemplares.map((e: any) =>
            e.id === id ? { ...e, ...cleanUpdates } : e
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('LocalStorage update error:', e);
    }

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'ejemplares', id), cleanUpdates, { merge: true });
      } catch (err: any) {
        console.error('Error actualizando ejemplar en Firestore:', err);
        handleFirestoreError(err, OperationType.UPDATE, 'ejemplares');
        throw err;
      }
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  const deleteEjemplar = (id: string) => {
    const existing = ejemplares.find((d) => d.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede eliminar datos de otro criadero.');
      return;
    }
    setEjemplares((prev) => prev.filter((dog) => dog.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'ejemplares', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'ejemplares')
      );
    }
  };

  // Sanidad
  const addRegistroSanitario = (data: Omit<RegistroSanitario, 'id'>) => {
    const reg: RegistroSanitario = {
      ...data,
      id: `san-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setRegistrosSanitarios((prev) => [reg, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'registrosSanitarios', reg.id), reg).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'registrosSanitarios')
      );
    }
  };

  const deleteRegistroSanitario = (id: string) => {
    const existing = registrosSanitarios.find((r) => r.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede eliminar datos de otro criadero.');
      return;
    }
    setRegistrosSanitarios((prev) => prev.filter((r) => r.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'registrosSanitarios', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'registrosSanitarios')
      );
    }
  };

  // Montas
  const addMonta = (data: Omit<Monta, 'id'>): Monta => {
    const m: Monta = {
      ...data,
      id: `monta-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setMontas((prev) => [m, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'montas', m.id), m).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'montas')
      );
    }
    return m;
  };

  const updateMonta = (id: string, updates: Partial<Monta>) => {
    const existing = montas.find((m) => m.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede modificar datos de otro criadero.');
      return;
    }
    setMontas((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    if (firebaseUser) {
      setDoc(doc(db, 'montas', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'montas')
      );
    }
  };

  const deleteMonta = (id: string) => {
    const existing = montas.find((m) => m.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede eliminar datos de otro criadero.');
      return;
    }
    setMontas((prev) => prev.filter((m) => m.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'montas', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'montas')
      );
    }
  };

  // Ciclos Celo
  const addCicloCelo = (data: Omit<CicloCelo, 'id'>) => {
    const c: CicloCelo = {
      ...data,
      id: `ciclo-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setCiclosCelo((prev) => [c, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'ciclosCelo', c.id), c).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'ciclosCelo')
      );
    }
  };

  const updateCicloCelo = (id: string, updates: Partial<CicloCelo>) => {
    setCiclosCelo((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    if (firebaseUser) {
      setDoc(doc(db, 'ciclosCelo', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'ciclosCelo')
      );
    }
  };

  const addMedicionProgesterona = (cicloId: string, m: Omit<MedicionProgesterona, 'id'>) => {
    const nuevaMedicion: MedicionProgesterona = {
      ...m,
      id: `prog-${Date.now()}`,
    };
    setCiclosCelo((prev) =>
      prev.map((c) => {
        if (c.id === cicloId) {
          const mediciones = [...c.mediciones, nuevaMedicion];
          return { ...c, mediciones };
        }
        return c;
      })
    );
  };

  // Gestación
  const addGestacion = (data: Omit<Gestacion, 'id'>): Gestacion => {
    const g: Gestacion = {
      ...data,
      id: `gest-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setGestaciones((prev) => [g, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'gestaciones', g.id), g).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'gestaciones')
      );
    }
    return g;
  };

  const updateGestacion = (id: string, updates: Partial<Gestacion>) => {
    const existing = gestaciones.find((g) => g.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede modificar datos de otro criadero.');
      return;
    }
    setGestaciones((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    if (firebaseUser) {
      setDoc(doc(db, 'gestaciones', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'gestaciones')
      );
    }
  };

  const deleteGestacion = (id: string) => {
    const existing = gestaciones.find((g) => g.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede eliminar datos de otro criadero.');
      return;
    }
    setGestaciones((prev) => prev.filter((g) => g.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'gestaciones', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'gestaciones')
      );
    }
  };

  const completarHitoGestacion = (gestacionId: string, hitoId: string, resultado?: string) => {
    setGestaciones((prev) =>
      prev.map((g) => {
        if (g.id === gestacionId) {
          const hitos = g.hitos.map((h) =>
            h.id === hitoId
              ? {
                  ...h,
                  completado: true,
                  fechaRealizada: new Date().toISOString().split('T')[0],
                  resultado: resultado || h.resultado,
                }
              : h
          );
          return { ...g, hitos };
        }
        return g;
      })
    );
  };

  const registrarPartoReal = (
    gestacionId: string,
    camadaData: Omit<Camada, 'id' | 'createdAt'>
  ) => {
    const nuevaCamada = addCamada(camadaData);
    updateGestacion(gestacionId, {
      estado: 'PARTO_REGISTRADO',
      camadaId: nuevaCamada.id,
    });
  };

  // Camadas
  const addCamada = (data: Omit<Camada, 'id' | 'createdAt'>): Camada => {
    const c: Camada = {
      ...data,
      id: `cam-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
      createdAt: new Date().toISOString(),
    };
    setCamadas((prev) => [c, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'camadas', c.id), c).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'camadas')
      );
    }
    return c;
  };

  const updateCamada = (id: string, updates: Partial<Camada>) => {
    const existing = camadas.find((c) => c.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede modificar datos de otro criadero.');
      return;
    }
    setCamadas((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    if (firebaseUser) {
      setDoc(doc(db, 'camadas', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'camadas')
      );
    }
  };

  const deleteCamada = (id: string) => {
    const existing = camadas.find((c) => c.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede eliminar datos de otro criadero.');
      return;
    }
    setCamadas((prev) => prev.filter((c) => c.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'camadas', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'camadas')
      );
    }
  };

  // Cachorros
  const addCachorro = (data: Omit<Cachorro, 'id'>): Cachorro => {
    const p: Cachorro = {
      ...data,
      id: `pup-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setCachorros((prev) => [p, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'cachorros', p.id), p).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'cachorros')
      );
    }
    return p;
  };

  const updateCachorro = (id: string, updates: Partial<Cachorro>) => {
    const existing = cachorros.find((c) => c.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede modificar datos de otro criadero.');
      return;
    }
    setCachorros((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    if (firebaseUser) {
      setDoc(doc(db, 'cachorros', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'cachorros')
      );
    }
  };

  const deleteCachorro = (id: string) => {
    const existing = cachorros.find((c) => c.id === id);
    if (existing && !canManageCriaderoResource(existing.criaderoId)) {
      console.warn('Seguridad: Un criador no puede eliminar datos de otro criadero.');
      return;
    }
    setCachorros((prev) => prev.filter((p) => p.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'cachorros', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'cachorros')
      );
    }
  };

  const addPesajeCachorro = (cachorroId: string, pesaje: PesajeCachorro) => {
    setCachorros((prev) =>
      prev.map((c) => {
        if (c.id === cachorroId) {
          const pesajes = [...(c.pesajes || []), pesaje];
          return { ...c, pesajes };
        }
        return c;
      })
    );
  };

  const incorporarCachorroAPlantel = (cachorroId: string): Ejemplar | null => {
    const cachorro = cachorros.find((c) => c.id === cachorroId);
    if (!cachorro) return null;

    const nuevoEjemplar: Ejemplar = {
      id: `ejem-${Date.now()}`,
      criaderoId: cachorro.criaderoId,
      nombreCompleto: cachorro.nombre || `${cachorro.identificadorProvisorio} (Incorporado)`,
      afijo: currentCriadero?.afijo || '',
      sexo: cachorro.sexo,
      raza: 'Ovejero Alemán (Pastor Alemán)',
      fechaNacimiento: cachorro.fechaNacimiento || new Date().toISOString().split('T')[0],
      numeroPOA: cachorro.numeroPOA || 'En trámite',
      microchip: cachorro.microchip || '',
      tatuaje: '',
      identificacionInterna: `PROVENIENTE_CACHORRO_${cachorro.id}`,
      color: cachorro.color || 'Negro y Fuego',
      pelo: 'CORTO',
      estadoReproductivo: 'ACTIVO',
      estado: 'ACTIVO',
      fotoUrl:
        cachorro.fotoUrl ||
        'https://images.unsplash.com/photo-1589941013453-ec89f33b5455?auto=format&fit=crop&w=800&q=80',
      padreId: cachorro.padreId,
      padreNombre: cachorro.padreNombre,
      madreId: cachorro.madreId,
      madreNombre: cachorro.madreNombre,
      titulos: [],
      calificacionCria: 'Apto Cría Preliminar',
      displasiaCadera: 'No Evaluado',
      displasiaCodo: 'No Evaluado',
      adn: 'EN_TRAMITE',
      observaciones: `Incorporado desde Camada ${cachorro.camadaNombre}. ID Cachorro: ${cachorro.id}`,
      createdAt: new Date().toISOString(),
    };

    setEjemplares((prev) => [nuevoEjemplar, ...prev]);
    updateCachorro(cachorroId, {
      estadoComercial: 'PLANTEL',
      incorporadoAlPlantel: true,
      ejemplarAdultoId: nuevoEjemplar.id,
    });

    return nuevoEjemplar;
  };

  // Simulaciones
  const addSimulacionCruza = (data: Omit<SimulacionCruza, 'id'>) => {
    const s: SimulacionCruza = {
      ...data,
      id: `sim-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setSimulaciones((prev) => [s, ...prev]);
  };

  const deleteSimulacionCruza = (id: string) => {
    setSimulaciones((prev) => prev.filter((s) => s.id !== id));
  };

  // Exposiciones
  const addExposicion = (data: Omit<ExposicionPOA, 'id'>) => {
    const e: ExposicionPOA = {
      ...data,
      id: `expo-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setExposiciones((prev) => [e, ...prev]);
  };

  const updateExposicion = (id: string, updates: Partial<ExposicionPOA>) => {
    setExposiciones((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteExposicion = (id: string) => {
    setExposiciones((prev) => prev.filter((e) => e.id !== id));
  };

  // Transacciones
  const addTransaccion = (data: Omit<TransaccionEconomica, 'id'>) => {
    const t: TransaccionEconomica = {
      ...data,
      id: `tx-${Date.now()}`,
      criaderoId: data.criaderoId || currentCriaderoId,
    };
    setTransacciones((prev) => [t, ...prev]);
    if (firebaseUser) {
      setDoc(doc(db, 'transacciones', t.id), t).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'transacciones')
      );
    }
  };

  const deleteTransaccion = (id: string) => {
    setTransacciones((prev) => prev.filter((t) => t.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'transacciones', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, 'transacciones')
      );
    }
  };

  // Criaderos
  const addCriadero = (data: Omit<Criadero, 'id' | 'createdAt'>) => {
    const c: Criadero = {
      ...data,
      id: `cria-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCriaderos((prev) => [...prev, c]);
    if (firebaseUser) {
      setDoc(doc(db, 'criaderos', c.id), c).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'criaderos')
      );
    }
  };

  const updateCriadero = (id: string, updates: Partial<Criadero>) => {
    setCriaderos((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    if (firebaseUser) {
      setDoc(doc(db, 'criaderos', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'criaderos')
      );
    }
  };

  const toggleCriaderoActivo = (id: string) => {
    setCriaderos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, activo: !c.activo } : c))
    );
    if (firebaseUser) {
      const cr = criaderos.find((c) => c.id === id);
      if (cr) {
        setDoc(doc(db, 'criaderos', id), { activo: !cr.activo }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, 'criaderos')
        );
      }
    }
  };

  const deleteCriadero = async (id: string): Promise<void> => {
    const criaToDelete = criaderos.find((c) => c.id === id);

    // 1. Remove from local state
    setCriaderos((prev) => prev.filter((c) => c.id !== id));
    setEjemplares((prev) => prev.filter((e) => e.criaderoId !== id));
    setCamadas((prev) => prev.filter((c) => c.criaderoId !== id));
    setCachorros((prev) => prev.filter((c) => c.criaderoId !== id));
    setMontas((prev) => prev.filter((m) => m.criaderoId !== id));
    setGestaciones((prev) => prev.filter((g) => g.criaderoId !== id));
    setRegistrosSanitarios((prev) => prev.filter((r) => r.criaderoId !== id));
    setTransacciones((prev) => prev.filter((t) => t.criaderoId !== id));
    setCiclosCelo((prev) => prev.filter((c) => c.criaderoId !== id));
    setExposiciones((prev) => prev.filter((e) => e.criaderoId !== id));

    // If active criadero was deleted, switch to fallback
    if (currentCriaderoId === id) {
      const remaining = criaderos.filter((c) => c.id !== id);
      setCurrentCriaderoId(remaining[0]?.id || 'cria-demo');
    }

    // 2. Cascade delete from Firestore
    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'criaderos', id));

        const collectionsToClean = [
          'ejemplares',
          'camadas',
          'cachorros',
          'montas',
          'gestaciones',
          'registrosSanitarios',
          'transacciones',
          'ciclosCelo',
          'exposiciones',
        ];

        for (const colName of collectionsToClean) {
          try {
            const q = query(collection(db, colName), where('criaderoId', '==', id));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const batch = writeBatch(db);
              snap.forEach((d) => batch.delete(d.ref));
              await batch.commit();
            }
          } catch (colErr) {
            console.warn(`Error cleaning collection ${colName} for criadero ${id}:`, colErr);
          }
        }

        const auditItem: AuditoriaLog = {
          id: `audit-${Date.now()}`,
          fecha: new Date().toISOString(),
          usuarioNombre: currentUser.nombre,
          accion: 'ELIMINAR_CRIADERO',
          modulo: 'SUPERADMIN',
          detalle: `Criadero "${criaToDelete?.nombre || id}" y todos sus registros asociados fueron eliminados del sistema.`,
        };
        setAuditoria((prev) => [auditItem, ...prev]);
      } catch (err: any) {
        console.error('Error deleting criadero in Firestore:', err);
        handleFirestoreError(err, OperationType.DELETE, 'criaderos');
        throw err;
      }
    }
  };

  // Users & SuperAdmin
  const addUser = (data: Omit<User, 'id' | 'createdAt'>) => {
    const u: User = {
      ...data,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, u]);
    if (firebaseUser) {
      setDoc(doc(db, 'users', u.id), u).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, 'users')
      );
    }
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    }
    if (firebaseUser) {
      setDoc(doc(db, 'users', id), updates, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, 'users')
      );
    }
  };

  const updateUserRole = (id: string, rol: UserRole) => {
    updateUser(id, { rol });
  };

  const deleteUser = async (id: string): Promise<void> => {
    const userToDelete = users.find((u) => u.id === id);
    if (
      userToDelete?.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com' ||
      (userToDelete?.rol === 'SUPER_ADMIN' && currentUser.id === id)
    ) {
      throw new Error('No es posible eliminar la cuenta principal de Super Administrador');
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));

    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'users', id));

        const auditItem: AuditoriaLog = {
          id: `audit-${Date.now()}`,
          fecha: new Date().toISOString(),
          usuarioNombre: currentUser.nombre,
          accion: 'ELIMINAR_USUARIO',
          modulo: 'SUPERADMIN',
          detalle: `Usuario "${userToDelete?.nombre || id}" (${userToDelete?.email || ''}) eliminado del sistema.`,
        };
        setAuditoria((prev) => [auditItem, ...prev]);
      } catch (err: any) {
        console.error('Error deleting user in Firestore:', err);
        handleFirestoreError(err, OperationType.DELETE, 'users');
        throw err;
      }
    }
  };

  const cambiarPasswordUsuario = (_nuevoPass: string): boolean => {
    return true;
  };

  // Notifications
  const marcarNotificacionLeida = (id: string) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const marcarTodasNotificacionesLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  // Backups and CSV
  const exportBackupJSON = () => {
    const data = {
      criaderos,
      users,
      ejemplares,
      registrosSanitarios,
      montas,
      ciclosCelo,
      gestaciones,
      camadas,
      cachorros,
      simulaciones,
      exposiciones,
      transacciones,
      auditoria,
      exportedAt: new Date().toISOString(),
      version: '3.0-fullstack',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mi_criadero_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent =
      '\uFEFF' +
      [
        headers.join(';'),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(';')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateBackupFile = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed.criaderos || !parsed.ejemplares) {
        return { valid: false, error: 'Estructura inválida o archivo corrupto.' };
      }
      return {
        valid: true,
        summary: {
          criaderos: parsed.criaderos?.length || 0,
          ejemplares: parsed.ejemplares?.length || 0,
          camadas: parsed.camadas?.length || 0,
          cachorros: parsed.cachorros?.length || 0,
        },
      };
    } catch {
      return { valid: false, error: 'El archivo no es un JSON válido.' };
    }
  };

  const restoreFromBackup = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (!parsed.criaderos || !parsed.ejemplares) {
        return { success: false, error: 'Estructura incompatible' };
      }
      if (parsed.criaderos) setCriaderos(parsed.criaderos);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.ejemplares) setEjemplares(parsed.ejemplares);
      if (parsed.camadas) setCamadas(parsed.camadas);
      if (parsed.cachorros) setCachorros(parsed.cachorros);
      if (parsed.montas) setMontas(parsed.montas);
      if (parsed.gestaciones) setGestaciones(parsed.gestaciones);
      if (parsed.transacciones) setTransacciones(parsed.transacciones);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const resetDatabaseToFactory = () => {
    setCriaderos(INITIAL_CRIADEROS);
    setUsers(INITIAL_USERS);
    setEjemplares(INITIAL_EJEMPLARES);
    setRegistrosSanitarios(INITIAL_REGISTROS_SANITARIOS);
    setMontas(INITIAL_MONTAS);
    setCiclosCelo(INITIAL_CICLOS_CELO);
    setGestaciones(INITIAL_GESTACIONES);
    setCamadas(INITIAL_CAMADAS);
    setCachorros(INITIAL_CACHORROS);
    setSimulaciones(INITIAL_SIMULACIONES);
    setExposiciones(INITIAL_EXPOSICIONES);
    setTransacciones(INITIAL_TRANSACCIONES);
    setAuditoria(INITIAL_AUDITORIA);
  };

  return (
    <AppContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        firebaseUser,
        isFirebaseConnected,
        isSyncing,
        isOnline,
        connectionStatusMessage,
        retryConnection,
        loginWithGoogle,
        logout,
        migrateAllDataToFirestore,
        criaderos,
        currentCriaderoId,
        currentCriadero,
        setCurrentCriaderoId,
        currentUser,
        setCurrentUser,
        users,
        isDemoMode,
        setIsDemoMode,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        enterDemoMode,
        enterRealMode,
        registerNewCriadero,
        activeTab,
        setActiveTab,
        ejemplares: currentEjemplares,
        allEjemplares: ejemplares,
        registrosSanitarios: currentRegistros,
        montas: currentMontas,
        ciclosCelo: currentCiclos,
        gestaciones: currentGestaciones,
        camadas: currentCamadas,
        cachorros: currentCachorros,
        simulaciones: currentSimulaciones,
        exposiciones: currentExposiciones,
        transacciones: currentTransacciones,
        auditoria,
        notificaciones,
        addEjemplar,
        updateEjemplar,
        deleteEjemplar,
        addRegistroSanitario,
        deleteRegistroSanitario,
        addMonta,
        updateMonta,
        deleteMonta,
        addCicloCelo,
        updateCicloCelo,
        addMedicionProgesterona,
        addGestacion,
        updateGestacion,
        deleteGestacion,
        completarHitoGestacion,
        registrarPartoReal,
        addCamada,
        updateCamada,
        deleteCamada,
        addCachorro,
        updateCachorro,
        deleteCachorro,
        addPesajeCachorro,
        incorporarCachorroAPlantel,
        addSimulacionCruza,
        deleteSimulacionCruza,
        calculateCOIServer,
        parsePedigreeDatabaseUrl,
        extractPedigreeFromPDF,
        addExposicion,
        updateExposicion,
        deleteExposicion,
        addTransaccion,
        deleteTransaccion,
        addCriadero,
        updateCriadero,
        deleteCriadero,
        toggleCriaderoActivo,
        addUser,
        updateUser,
        updateUserRole,
        deleteUser,
        cambiarPasswordUsuario,
        marcarNotificacionLeida,
        marcarTodasNotificacionesLeidas,
        isSearchOpen,
        setIsSearchOpen,
        printModalData,
        openPrintModal,
        closePrintModal,
        exportBackupJSON,
        exportToCSV,
        validateBackupFile,
        restoreFromBackup,
        resetDatabaseToFactory,
        // Chat 1 a 1 entre criadores
        chats,
        activeChatId,
        setActiveChatId,
        activeChatMessages,
        unreadChatMessagesCount,
        startOrOpenChatWithCriadero,
        sendChatMessage,
        markChatAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe utilizarse dentro de un AppProvider');
  }
  return context;
};
