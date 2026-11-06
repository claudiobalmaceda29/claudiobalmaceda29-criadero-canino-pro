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
  propietarioId?: string;
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
  esDelPlantel?: boolean; // true si pertenece al plantel del criadero, false si es macho/ejemplar externo
  esExterno?: boolean; // Padrillo de terceros contratado
  activoEnPlantel?: boolean; // true si está activo en el plantel, false si fue retirado/archivado (Borrado lógico)
  fechaRetiro?: string; // Fecha en que pasó a retirado/histórico
  motivoRetiro?: string; // Motivo o nota del retiro del plantel

  // Nutrición & Racionamiento
  racionDiariaGramos?: number; // Ración diaria recomendada en gramos (ej: 450)

  // Morfología & Estructura (para el Matchmaker Genético y compensaciones)
  morfologiaObservaciones?: string;
  tipoGrupa?: 'CORRECTA' | 'CORTA' | 'CAIDA' | 'PLANA';
  tipoEspalda?: 'FIRME_RECTA' | 'BLANDA' | 'CORVADA';
  angulacionAnterior?: 'CORRECTA_MUY_BUENA' | 'BUENA' | 'INSUFICIENTE';
  angulacionPosterior?: 'CORRECTA_MUY_BUENA' | 'MUY_PRONUNCIADA' | 'INSUFICIENTE';
  pigmentacion?: 'INTENSA_EXCELENTE' | 'BUENA' | 'CLARA_DESEADA_MEJORAR';
  alturaCruzCm?: number; // En cm (Macho: 60-65cm, Hembra: 55-60cm)
  fortalezasMorfologicas?: string[];
  debilidadesMorfologicas?: string[];

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
  adjuntoUrl?: string; // Enlace persistente al PDF o imagen del certificado / estudio
  adjuntoNombre?: string;
  adjuntoTipo?: 'PDF' | 'IMAGEN';
  adjuntoSize?: string;
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
  propietarioId?: string;
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
  propietarioId?: string;
  identificador: string; // ej: "Camada 'A' 2026"
  padreId: string;
  padreNombre: string;
  padreFechaNacimiento?: string;
  padreTatuaje?: string;
  padreNumeroPOA?: string;
  padreMicrochip?: string;
  padrePelo?: 'CORTO' | 'LARGO' | 'MEDIO';
  padreEsExterno?: boolean;

  madreId: string;
  madreNombre: string;
  madreFechaNacimiento?: string;
  madreTatuaje?: string;
  madreNumeroPOA?: string;
  madreMicrochip?: string;
  madrePelo?: 'CORTO' | 'LARGO' | 'MEDIO';
  madreEsExterna?: boolean;

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
  propietarioId?: string;
  camadaId: string;
  camadaNombre: string;
  tipoRegistro?: TipoRegistroCachorro; // 'PRENATAL' para reservas antes de nacer o 'NACIDO'
  padreId: string;
  padreNombre: string;
  madreId: string;
  madreNombre: string;
  nombre?: string;
  nombreDefinitivo?: string;
  identificadorProvisorio: string;
  sexo: Sexo;
  
  // Prenatal vs Posnatal
  fechaEstimadaNacimiento?: string;
  fechaNacimiento?: string; // Solo cuando ya nació
  color: string;
  colorCollar?: string;
  nombreColorCollar?: string;
  numeroPOA?: string;
  tatuaje?: string;
  pelo?: 'CORTO' | 'LARGO' | 'MEDIO' | string;
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
  propietarioId?: string;
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

// ==========================================
// CONTROL DE ALIMENTACIÓN Y STOCK DE INSUMOS
// ==========================================

export type CategoriaInsumo =
  | 'ALIMENTO'
  | 'PIPETAS'
  | 'VACUNAS'
  | 'SUPLEMENTOS'
  | 'MEDICAMENTOS'
  | 'HIGIENE_Y_LIMPIEZA'
  | 'ACCESORIOS';

export type UnidadMedidaInsumo =
  | 'BOLSAS'
  | 'KILOS'
  | 'DOSIS'
  | 'PIPETAS'
  | 'UNIDADES'
  | 'COMPRIMIDOS'
  | 'FRASCOS'
  | 'LITROS';

export type UbicacionInsumo =
  | 'HELADERA'
  | 'DEPOSITO'
  | 'FARMACIA'
  | 'CANIL'
  | 'PARIDERA'
  | 'OTRO';

export interface MovimientoInsumo {
  id: string;
  fecha: string; // YYYY-MM-DD o ISO
  tipo: 'CONSUMO' | 'INGRESO' | 'AJUSTE';
  cantidad: number;
  motivo?: string;
  usuarioNombre?: string;
}

export interface Insumo {
  id: string;
  criaderoId: string;
  propietarioId?: string;
  nombre: string;
  categoria: CategoriaInsumo;
  marca?: string;
  cantidadActual: number;
  unidadMedida: UnidadMedidaInsumo;
  stockMinimo: number; // Umbral de alerta por debajo del cual se avisa al criador
  ubicacion: UbicacionInsumo;
  temperaturaHeladera?: string; // ej. "2°C a 8°C" para vacunas y probióticos
  lote?: string;
  fechaVencimiento?: string; // YYYY-MM-DD
  pesoPorUnidadKg?: number; // ej. 15 kg por bolsa de alimento
  consumoDiarioEstimado?: number; // ej. 2.5 kg diarios para estimar duración
  costoUnitario?: number;
  moneda?: 'ARS' | 'USD';
  proveedor?: string;
  observaciones?: string;
  ultimaActualizacion: string;
  historialMovimientos?: MovimientoInsumo[];
}

// ==========================================
// 12. Pizarra de Tareas Diarias (Kanban / Checklist)
// ==========================================
export type TipoTareaDiaria =
  | 'VACUNA'
  | 'DESPARASITACION'
  | 'ECOGRAFIA'
  | 'PARTO'
  | 'CELO'
  | 'POST_VENTA'
  | 'ALIMENTACION'
  | 'POA_TRAMITE'
  | 'HIGIENE'
  | 'OTRO';

export type EstadoTareaDiaria = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'DESCARTADA';

export interface TareaDiaria {
  id: string;
  criaderoId: string;
  propietarioId?: string;
  tipo: TipoTareaDiaria;
  titulo: string;
  descripcion: string;
  fechaProgramada: string; // YYYY-MM-DD
  horaProgramada?: string; // HH:mm
  estado: EstadoTareaDiaria;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  entidadRelacionadaTipo?: 'EJEMPLAR' | 'CAMADA' | 'CACHORRO' | 'GESTACION' | 'INSUMO';
  entidadRelacionadaId?: string;
  entidadRelacionadaNombre?: string;
  completadaEn?: string;
  completadaPor?: string;
  createdAt: string;
}

// ==========================================
// 13. Aranceles Oficiales Club POA (Vigentes al 01/09/2026)
// ==========================================
export interface ArancelesPOAItem {
  socio: number;
  noSocio: number;
}

export interface ArancelesPOATable {
  id: string; // ej. "aranceles-poa-2026"
  fechaVigencia: string; // "01-09-2026"
  denunciaServicioNumerado: ArancelesPOAItem; // $68.200 / $77.900
  denunciaServicioExterior: ArancelesPOAItem; // $136.500 / $152.200
  denunciaServicioHasta30Dias: ArancelesPOAItem; // $27.800 / $55.600
  denunciaServicioMas30DiasCondicional: ArancelesPOAItem; // $82.900 / $118.200
  denunciaNacimientoHasta10Dias: ArancelesPOAItem; // $32.200 / $64.400
  denunciaNacimiento11a20Dias: ArancelesPOAItem; // $54.800 / $109.600
  denunciaNacimientoMas20DiasCondicional: ArancelesPOAItem; // $88.000 / $176.000
  inscripcionCriaHasta70DiasPorCachorro: ArancelesPOAItem; // $57.800 / $85.600
  inscripcionCria71a90DiasPorCachorro: ArancelesPOAItem; // $79.800 / $121.450
  inscripcionCriaMas90DiasPorCachorro: ArancelesPOAItem; // $118.000 / $206.000
  adicionalInternacionalPorCachorro: ArancelesPOAItem; // $5.600 / $5.600
  tatuajePorCria: ArancelesPOAItem; // $64.500 / $64.500
  colocacionChipPorCriaAMBA: ArancelesPOAItem; // $64.500 / $64.500
  tatuajeMasChipPorCriaAMBA: ArancelesPOAItem; // $97.800 / $97.800
  valorChipIndividual: ArancelesPOAItem; // $12.800 / $12.800
  transferencia: ArancelesPOAItem; // $20.000 / $30.000
  aptoParaCria: ArancelesPOAItem; // $55.300 / $90.500
  seleccionPOA: ArancelesPOAItem; // $103.000 / $159.400
  diagnosticoDcfCodoNacional: ArancelesPOAItem; // $24.700 / $28.700
  actualizadoPor?: string;
  actualizadoEn?: string;
}

export const ARANCELES_POA_DEFAULT: ArancelesPOATable = {
  id: 'poa-oficial-2026',
  fechaVigencia: '01/09/2026',
  denunciaServicioNumerado: { socio: 68200, noSocio: 77900 },
  denunciaServicioExterior: { socio: 136500, noSocio: 152200 },
  denunciaServicioHasta30Dias: { socio: 27800, noSocio: 55600 },
  denunciaServicioMas30DiasCondicional: { socio: 82900, noSocio: 118200 },
  denunciaNacimientoHasta10Dias: { socio: 32200, noSocio: 64400 },
  denunciaNacimiento11a20Dias: { socio: 54800, noSocio: 109600 },
  denunciaNacimientoMas20DiasCondicional: { socio: 88000, noSocio: 176000 },
  inscripcionCriaHasta70DiasPorCachorro: { socio: 57800, noSocio: 85600 },
  inscripcionCria71a90DiasPorCachorro: { socio: 79800, noSocio: 121450 },
  inscripcionCriaMas90DiasPorCachorro: { socio: 118000, noSocio: 206000 },
  adicionalInternacionalPorCachorro: { socio: 5600, noSocio: 5600 },
  tatuajePorCria: { socio: 64500, noSocio: 64500 },
  colocacionChipPorCriaAMBA: { socio: 64500, noSocio: 64500 },
  tatuajeMasChipPorCriaAMBA: { socio: 97800, noSocio: 97800 },
  valorChipIndividual: { socio: 12800, noSocio: 12800 },
  transferencia: { socio: 20000, noSocio: 30000 },
  aptoParaCria: { socio: 55300, noSocio: 90500 },
  seleccionPOA: { socio: 103000, noSocio: 159400 },
  diagnosticoDcfCodoNacional: { socio: 24700, noSocio: 28700 },
  actualizadoEn: '2026-09-01T00:00:00.000Z',
  actualizadoPor: 'Club POA Oficial',
};

// ==========================================
// 14. Simulador de Costos y Precios de Camada
// ==========================================
export interface GastosOperativosCamada {
  servicioSaltoMacho: number; // Costo de monta / inseminación
  medicionesProgesterona: number; // Análisis serológicos previos
  ecografiasYRayos: number; // Controles veterinarios gestacionales
  alimentoMadreYCachorros: number; // Balanceado premium y suplementos lactancia
  planSanitarioCachorros: number; // Vacunas (Puppy DP + Sextuple) y desparasitaciones
  atencionVeterinariaOParto: number; // Asistencia / cesárea si aplicara
  kitEntregaCachorro: number; // Alimento de inicio, collar, juguete, certificado
  otrosGastos: number; // Electricidad, calefacción paridera, etc.
}

export interface SimulacionPrecioCamada {
  id: string;
  criaderoId: string;
  nombreCamada: string;
  esSocioPOA: boolean;
  cantidadCachorrosEsperados: number;
  incluyeReconocimientoInternacional: boolean;
  incluyeTatuajeMasChip: boolean;
  gastosOperativos: GastosOperativosCamada;
  costoTotalPOA: number;
  costoTotalOperativo: number;
  costoTotalCamada: number;
  costoBasePorCachorro: number;
  margenGananciaDeseadoPct: number; // ej. 40%
  precioSugeridoVentaCachorro: number;
  gananciaProyectadaTotal: number;
  moneda: 'ARS' | 'USD';
  createdAt: string;
}

// ==========================================
// 15. Matchmaker Genético & Compensación Morfológica
// ==========================================
export interface CompensacionMorfologicaItem {
  caracteristica: string; // ej. "Grupa", "Línea superior", "Pigmentación", "Angulación"
  observacionHembra: string;
  virtudMacho: string;
  efectoEsperado: string;
}

export interface SugerenciaMatchCruce {
  macho: Ejemplar;
  hembra: Ejemplar;
  puntajeCompatibilidadPct: number; // ej. 95%
  coiEstimado: number; // Coeficiente de Inbreeding (ej. 2.8%)
  coiNivel: 'OPTIMO' | 'ACEPTABLE' | 'ELEVADO_PRECAUCION';
  compatibilidadDisplasia: {
    compatible: boolean;
    detalle: string;
  };
  compensacionesMorfologicas: CompensacionMorfologicaItem[];
  recomendacionGeneral: string;
  pros: string[];
  alertas: string[];
}

// ==========================================
// 16. Seguimiento Post-Venta y Fidelización
// ==========================================
export interface EventoFidelizacionPostVenta {
  id: string;
  tipo: '6_MESES' | '1_ANIO' | 'FOTO_RECIBIDA' | 'VACUNA_REFUERZO' | 'FEEDBACK';
  fechaObjetivo: string; // YYYY-MM-DD
  notificado: boolean;
  contactado: boolean;
  comentarios?: string;
}

export interface SeguimientoPostVenta {
  id: string;
  criaderoId: string;
  cachorroId: string;
  cachorroNombre: string;
  camadaIdentificador?: string;
  compradorNombre: string;
  compradorTelefono: string;
  compradorEmail?: string;
  compradorCiudad?: string;
  fechaEntrega: string; // YYYY-MM-DD
  fechaAlerta6Meses: string; // 6 meses posteriores a la entrega
  fechaAlerta1Anio: string; // 1 año posterior a la entrega
  alerta6MesesCompletada: boolean;
  alerta1AnioCompletada: boolean;
  fotosRecibidasUrls?: string[];
  observaciones: string;
  historialEventos?: EventoFidelizacionPostVenta[];
  createdAt: string;
}

// ==========================================
// 17. Notificaciones Omnicanal (Internas & Externas)
// ==========================================
export type CanalNotificacion = 'IN_APP' | 'WHATSAPP' | 'EMAIL' | 'TODOS';
export type TipoEventoOmnicanal =
  | 'CELO_PREDICCION'
  | 'PARTO_PROXIMO'
  | 'ECOGRAFIA_PROGRAMADA'
  | 'VACUNA_VENCIMIENTO'
  | 'POST_VENTA_6_MESES'
  | 'POST_VENTA_1_ANIO'
  | 'STOCK_ALIMENTO_BAJO'
  | 'SISTEMA';

export interface NotificacionOmnicanal {
  id: string;
  criaderoId: string;
  propietarioId?: string;
  tipo: TipoEventoOmnicanal;
  canales: CanalNotificacion[];
  destinatarioNombre: string;
  destinatarioTelefono?: string;
  destinatarioEmail?: string;
  titulo: string;
  mensaje: string;
  estadoEnvio: {
    inApp: 'ENVIADO' | 'PENDIENTE';
    whatsapp?: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO' | 'SIMULADO';
    email?: 'PENDIENTE' | 'ENVIADO' | 'FALLIDO' | 'SIMULADO';
  };
  linkAccion?: string;
  fechaCreacion: string;
  fechaProgramadaEnvio: string;
  errorLog?: string;
}

