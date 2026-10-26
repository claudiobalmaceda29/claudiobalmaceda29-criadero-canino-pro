/**
 * GESTIÓN DE CRIADERO CANINO PRO - TypeScript Data Models & Types
 * Definición estricta de modelos de datos, validación y trazabilidad.
 */

export type UserRole = 'SUPER_ADMIN' | 'CRIADOR' | 'DEMO';

export interface User {
  id: string;
  uid?: string;
  nombre: string;
  email: string;
  rol: UserRole;
  criaderoId: string;
  avatarUrl?: string;
  passwordHash?: string;
  createdAt: string;
}

export interface Criadero {
  id: string;
  nombre: string;
  afijo: string;
  registroPOA: string;
  responsable: string;
  email: string;
  telefono: string;
  ciudad: string;
  provincia: string;
  pais: string;
  direccion: string;
  logoUrl?: string;
  whatsappContacto?: string; // Número con código de país, ej: +5491158249102
  whatsappPublico?: boolean; // Si true, visible solo para otros criadores autenticados
  activo: boolean;
  monedaDefault: 'ARS' | 'USD';
  createdAt: string;
}

export type Sexo = 'MACHO' | 'HEMBRA';
export type EstadoReproductivo = 'ACTIVO' | 'EN_CELO' | 'GESTANTE' | 'EN_DESCANSO' | 'RETIRADO';
export type EstadoEjemplar = 'ACTIVO' | 'RETIRADO' | 'FALLECIDO' | 'VENDIDO' | 'COPROPIEDAD';
export type CalificacionDisplasiaCadera = 
  | 'HD "a" Normal (Libre)' 
  | 'HD "a" Casi Normal (Permitido)' 
  | 'HD Permitido (Grado I)' 
  | 'No Evaluado' 
  | 'Displasia Severa';
export type CalificacionDisplasiaCodo = 
  | 'ED "0" Normal (Libre)' 
  | 'ED "1" Casi Normal' 
  | 'ED Grado I' 
  | 'No Evaluado';

export interface Ejemplar {
  id: string;
  criaderoId: string;
  nombreCompleto: string;
  afijo: string;
  sexo: Sexo;
  raza: string;
  fechaNacimiento: string;
  edad?: string;
  numeroPOA: string;
  microchip: string;
  tatuaje: string;
  identificacionInterna: string;
  color: string;
  pelo: 'CORTO' | 'LARGO' | 'MEDIO';
  estadoReproductivo: EstadoReproductivo;
  estado: EstadoEjemplar;
  fotoUrl: string;
  pedigreeDatabaseUrl?: string; // Link a la ficha en PedigreeDatabase.com
  
  // Documento de Pedigree Oficial cargado (PDF o Imagen)
  pedigreeDocUrl?: string; // Base64 Data URL o link externo
  pedigreeDocNombre?: string;
  pedigreeDocTipo?: 'PDF' | 'IMAGEN';
  pedigreeDocFecha?: string;
  pedigreeDocSize?: string;
  
  // Genealogía inmediata (relación por ID e identificación textual)
  padreId?: string;
  padreNombre?: string;
  madreId?: string;
  madreNombre?: string;
  
  // Árbol extendido (Abuelos)
  abueloPaterno?: string;
  abuelaPaterna?: string;
  abueloMaterno?: string;
  abuelaMaterna?: string;
  
  // Bisabuelos (claves estandarizadas oficiales)
  bisabuelos?: {
    pp_p?: string; // Padre del Abuelo Paterno
    pp_m?: string; // Madre del Abuelo Paterno
    pm_p?: string; // Padre de la Abuela Paterna
    pm_m?: string; // Madre de la Abuela Paterna
    mp_p?: string; // Padre del Abuelo Materno
    mp_m?: string; // Madre del Abuelo Materno
    mm_p?: string; // Padre de la Abuela Materna
    mm_m?: string; // Madre de la Abuela Materna
  };
  
  // Títulos y certificaciones POA
  titulos: string[];
  calificacionCria: string;
  displasiaCadera: CalificacionDisplasiaCadera;
  displasiaCodo: CalificacionDisplasiaCodo;
  tieneCertificadoDisplasiaDoc?: boolean;
  brucelosis?: {
    fecha: string;
    resultado: 'NEGATIVO' | 'POSITIVO';
    vigenciaHasta: string;
    laboratorio: string;
    certificadoDoc?: boolean;
  };
  adn: string;
  adnDocumentado?: boolean;
  alergias?: string;
  enfermedadesCronicas?: string;
  medicacionActual?: string;
  observaciones: string;
  esExterno?: boolean; // Padrillo de terceros contratado
  createdAt: string;
}

export interface RegistroSanitario {
  id: string;
  ejemplarId: string;
  criaderoId: string;
  tipo: 'VACUNA' | 'DESPARASITACION' | 'ESTUDIO' | 'TRATAMIENTO' | 'CIRUGIA' | 'CONTROL';
  nombre: string;
  fecha: string; // Fecha de realización
  proximaFecha?: string; // Fecha programada para próximo control
  estadoProximoControl?: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  dosisOLote?: string;
  veterinario: string;
  matriculaVeterinario?: string; // Matrícula profesional
  resultado?: string;
  esDocumentadoOficial?: boolean;
  observaciones?: string;
}

export interface Monta {
  id: string;
  criaderoId: string;
  codigoCiclo: string;
  hembraId: string;
  hembraNombre: string;
  machoId: string;
  machoNombre: string;
  fechaMonta: string;
  fechasSecundarias?: string[];
  tipoServicio: 'NATURAL' | 'INSEMINACION_FRESCA' | 'INSEMINACION_CONGELADA';
  duracion?: string;
  estado: 'PENDIENTE' | 'CONFIRMADA_PREÑADA' | 'FALLIDA_VACIA';
  fechaEstimadaParto: string;
  observaciones?: string;
  camadaId?: string;
}

export interface MedicionProgesterona {
  id: string;
  fecha: string;
  diasDesdeCelo: number;
  valorNgMl: number;
  laboratorio: string;
  recomendacion: string;
  observaciones?: string;
}

export interface CicloCelo {
  id: string;
  criaderoId: string;
  hembraId: string;
  hembraNombre: string;
  codigoCiclo: string;
  fechaInicio: string;
  estado: 'EN_CURSO' | 'MONTA_PROGRAMADA' | 'SERVIDA' | 'FINALIZADO';
  mediciones: MedicionProgesterona[];
  fechaEstimadaOvulacion?: string;
  fechasOptimasServicio?: string;
  fechaEstimadaParto?: string;
  observaciones?: string;
}

export interface HitoGestacion {
  id: string;
  diaObjetivo: number;
  titulo: string;
  descripcion: string;
  fechaPlanificada: string;
  completado: boolean;
  fechaRealizada?: string;
  resultado?: string;
}

export interface Gestacion {
  id: string;
  criaderoId: string;
  hembraId: string;
  hembraNombre: string;
  machoId: string;
  machoNombre: string;
  fechaMonta: string;
  fechaEstimadaParto: string;
  hitos: HitoGestacion[];
  estado: 'EN_CURSO' | 'PARTO_REGISTRADO' | 'CANCELADA';
  camadaId?: string;
  observaciones?: string;
}

/**
 * Estados diferenciados de Camada según auditoría funcional
 */
export type EstadoCamada = 
  | 'PLANIFICADA'
  | 'GESTACION_CONFIRMADA'
  | 'PARTO_PROXIMO'
  | 'NACIDA'
  | 'LACTANCIA'
  | 'DESTETE'
  | 'FINALIZADA'
  | 'CANCELADA';

export interface Camada {
  id: string;
  criaderoId: string;
  identificador: string; // ej: "Camada 'A' 2026"
  padreId: string;
  padreNombre: string;
  madreId: string;
  madreNombre: string;

  // Datos prenatales (estimaciones y ecografías previas al parto)
  partoConfirmado?: boolean;
  fechaEstimadaParto?: string;
  fetosObservados?: number;

  // Datos posnatales (registrados únicamente tras confirmación real del parto)
  fechaNacimiento?: string; // Fecha real de parto
  totalCachorros: number; // 0 si aún no nació
  machos: number; // 0 si aún no nació
  hembras: number; // 0 si aún no nació
  nacidosVivos: number; // 0 si aún no nació
  nacidosMuertos?: number; // 0 si aún no nació
  fallecidos: number; // fallecidos posnatales
  tipoParto?: 'NATURAL' | 'CESAREA';

  estado: EstadoCamada;
  observaciones?: string;
  fotoUrl?: string;
  createdAt: string;
}

export type EstadoCachorro = 'DISPONIBLE' | 'RESERVADO' | 'ENTREGADO' | 'PLANTEL';
export type TipoRegistroCachorro = 'PRENATAL' | 'NACIDO';

export interface PesajeCachorro {
  semana: number;
  fecha: string;
  pesoGramos: number;
}

export interface Cachorro {
  id: string;
  criaderoId: string;
  camadaId: string;
  camadaNombre: string;
  tipoRegistro?: TipoRegistroCachorro; // 'PRENATAL' para reservas antes de nacer o 'NACIDO'
  padreId: string;
  padreNombre: string;
  madreId: string;
  madreNombre: string;
  nombre?: string;
  identificadorProvisorio: string;
  sexo: Sexo;
  
  // Prenatal vs Posnatal
  fechaEstimadaNacimiento?: string;
  fechaNacimiento?: string; // Solo cuando ya nació
  color: string;
  colorCollar?: string;
  numeroPOA?: string;
  microchip?: string;
  pesoNacimientoGramos?: number; // Solo cuando ya nació
  pesajes: PesajeCachorro[];
  vacunas: Array<{ vacuna: string; fecha: string; veterinario: string; lote?: string }>;
  desparasitaciones: Array<{ producto: string; fecha: string; dosis: string }>;
  estadoComercial: EstadoCachorro;
  precio?: number;
  moneda: 'ARS' | 'USD';
  senia?: number;
  comprador?: {
    nombre: string;
    dni: string;
    telefono: string;
    email: string;
    domicilio: string;
    localidad: string;
    fechaEntregaEstimada: string;
    fechaEntregaReal?: string;
    observaciones?: string;
  };
  fotoUrl?: string;
  observaciones?: string;
  incorporadoAlPlantel?: boolean;
  ejemplarAdultoId?: string;

  // Documento de Solicitud de Pedigree Digital (PDF subido o generado)
  solicitudPedigreeDocUrl?: string;
  solicitudPedigreeDocNombre?: string;
  solicitudPedigreeDocFecha?: string;
  solicitudPedigreeDocSize?: string;
}

export interface SimulacionCruza {
  id: string;
  criaderoId: string;
  fecha: string;
  machoId: string;
  machoNombre: string;
  machoLink?: string;
  machoEsExterno?: boolean;
  hembraId: string;
  hembraNombre: string;
  hembraLink?: string;
  hembraEsExterno?: boolean;
  coeficienteConsanguinidad: number; // Porcentaje ej: 3.125
  versionAlgoritmo?: string; // ej: "v2.1-Wright-PathAnalysis"
  profundidadGeneraciones?: number; // ej: 4
  antepasadosComunes: Array<{ 
    nombre: string; 
    generaciones: string; 
    contribucionPct?: number; 
  }>;
  advertencias: string[];
  prediccionesColores: string[];
  notas: string;
}

export interface ExposicionPOA {
  id: string;
  criaderoId: string;
  ejemplarId: string;
  ejemplarNombre: string;
  nombreEvento: string;
  fecha: string;
  lugar: string;
  organizador: string;
  categoria: string;
  clase: string;
  juez: string;
  calificacion: string;
  puesto: string;
  titulosObtenidos: string[];
  premios?: string;
  observaciones?: string;
  fotoUrl?: string;
}

export type TipoTransaccion = 'INGRESO' | 'GASTO';
export type CategoriaEconomica =
  | 'ALIMENTACION'
  | 'VETERINARIA'
  | 'ESTUDIOS_DISPLASIA'
  | 'MEDICAMENTOS'
  | 'SERVICIOS_MONTA'
  | 'INSCRIPCIONES_POA'
  | 'TRASLADOS'
  | 'EXPOSICIONES'
  | 'MANTENIMIENTO'
  | 'VENTA_CACHORRO'
  | 'RESERVA_SENIA'
  | 'MONTA_COBRADA'
  | 'OTROS';

export interface TransaccionEconomica {
  id: string;
  criaderoId: string;
  tipo: TipoTransaccion;
  categoria: CategoriaEconomica;
  camadaId?: string;
  ejemplarId?: string;
  monto: number;
  moneda: 'ARS' | 'USD';
  fecha: string;
  concepto: string;
  comprobanteNumero?: string;
  observaciones?: string;
}

export interface Notificacion {
  id: string;
  tipo: 'PARTO' | 'VACUNA' | 'CONTROL' | 'ENTREGA' | 'EXPO' | 'INFO' | 'CHAT';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  enlaceTab?: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
}

export interface AuditoriaLog {
  id: string;
  fecha: string;
  usuarioNombre: string;
  accion: string;
  modulo: string;
  detalle: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderUid: string;
  senderCriaderoId: string;
  senderNombre: string;
  receiverUid?: string;
  receiverCriaderoId: string;
  texto: string;
  timestamp: string;
  leido: boolean;
}

export interface ChatConversation {
  id: string;
  participantCriaderoIds: string[];
  participantUids: string[];
  participantNames: { [criaderoId: string]: string };
  participantAfijos?: { [criaderoId: string]: string };
  participantAvatars?: { [criaderoId: string]: string };
  participantWhatsApps?: { [criaderoId: string]: { numero: string; publico: boolean } };
  lastMessageText: string;
  lastMessageTimestamp: string;
  lastMessageSenderUid: string;
  lastMessageSenderCriaderoId: string;
  unreadCounts: { [criaderoId: string]: number };
  createdAt: string;
  updatedAt: string;
}

