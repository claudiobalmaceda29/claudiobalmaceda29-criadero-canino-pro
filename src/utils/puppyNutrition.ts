/**
 * MOTOR DE NUTRICIÓN Y ETAPAS DE ALIMENTACIÓN CANINA - CLUB POA / VETERINARIA
 * 
 * Reglas de negocio:
 * 1. Etapas de alimentación dinámica basadas en la fecha de nacimiento del cachorro / camada:
 *    - 0 a 27 días: Lactancia exclusiva con la madre. Consumo de stock = 0 kg.
 *    - 28 a 42 días (4 a 6 semanas): Papilla de inicio (humedecida con agua tibia). Complemento de leche materna.
 *    - 42 a 56 días (6 a 8 semanas): Croquetas levemente remojadas. Reducción progresiva de leche materna.
 *    - >= 56 días (8+ semanas / 2 meses): Destete completo. 100% alimento sólido balanceado para cachorros.
 * 2. Inicio de descuento de alimento balanceado recién a partir del día 28.
 * 3. Freno de Racionamiento para Cachorros Entregados:
 *    - Cuando un cachorro pasa a estado 'ENTREGADO', se resta automáticamente y se detiene su deducción de ración diaria.
 */

import { Camada, Cachorro } from '../types';

export interface EtapaNutricionalCachorro {
  diasVida: number;
  semanasVida: number;
  etapaCodigo: 'LACTANCIA_EXCLUSIVA' | 'PAPILLA_INICIAL' | 'CROQUETAS_REMOJADAS' | 'DESTETE_COMPLETO';
  nombreEtapa: string;
  rangoSemanas: string;
  indicacionNutricional: string;
  consumeAlimentoStock: boolean;
  racionEstimadaGramosDia: number; // Ración promedio de cachorro Ovejero Alemán según edad
  badgeColor: string;
  progresoDestetePct: number;
}

/**
 * Determina la etapa nutricional exacta del cachorro o camada a partir de la fecha de nacimiento.
 */
export function obtenerEtapaNutricionalCachorro(fechaNacimiento?: string): EtapaNutricionalCachorro {
  if (!fechaNacimiento) {
    return {
      diasVida: 0,
      semanasVida: 0,
      etapaCodigo: 'LACTANCIA_EXCLUSIVA',
      nombreEtapa: 'Lactancia Exclusiva (Prenatal / Recién Nacido)',
      rangoSemanas: '0 - 4 semanas',
      indicacionNutricional: 'Lactancia materna exclusiva. No requiere alimento sólido comercial.',
      consumeAlimentoStock: false,
      racionEstimadaGramosDia: 0,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      progresoDestetePct: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fNac = new Date(fechaNacimiento);
  fNac.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - fNac.getTime();
  const diasVida = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const semanasVida = Math.floor(diasVida / 7);

  // Etapa 1: 0 a 27 días (< 4 semanas) -> 100% Leche Materna
  if (diasVida < 28) {
    return {
      diasVida,
      semanasVida,
      etapaCodigo: 'LACTANCIA_EXCLUSIVA',
      nombreEtapa: `Lactancia Neonatal (${diasVida} días)`,
      rangoSemanas: '0 a 4 semanas',
      indicacionNutricional: 'Lactancia materna exclusiva. El consumo de alimento del inventario comenzará recién a partir del día 28.',
      consumeAlimentoStock: false,
      racionEstimadaGramosDia: 0,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      progresoDestetePct: Math.round((diasVida / 28) * 20),
    };
  }

  // Etapa 2: De los 28 a los 42 días (4 a 6 semanas) -> Papilla
  if (diasVida >= 28 && diasVida < 42) {
    return {
      diasVida,
      semanasVida,
      etapaCodigo: 'PAPILLA_INICIAL',
      nombreEtapa: `Papilla Inicial (${diasVida} días • ${semanasVida} sem)`,
      rangoSemanas: '4 a 6 semanas (28 a 42 días)',
      indicacionNutricional: 'Alimento balanceado específico para cachorros humedecido con agua tibia (papilla). Complemento de leche materna.',
      consumeAlimentoStock: true,
      racionEstimadaGramosDia: 160, // ~160g de alimento Puppy humedecido diario
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      progresoDestetePct: 40 + Math.round(((diasVida - 28) / 14) * 25),
    };
  }

  // Etapa 3: De las 6 a las 8 semanas (42 a 56 días) -> Croquetas levemente humedecidas
  if (diasVida >= 42 && diasVida < 56) {
    return {
      diasVida,
      semanasVida,
      etapaCodigo: 'CROQUETAS_REMOJADAS',
      nombreEtapa: `Transición a Sólidos (${diasVida} días • ${semanasVida} sem)`,
      rangoSemanas: '6 a 8 semanas (42 a 56 días)',
      indicacionNutricional: 'Mastica croquetas con mayor facilidad (levemente remojadas). Reducción de leche materna.',
      consumeAlimentoStock: true,
      racionEstimadaGramosDia: 260, // ~260g diario
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      progresoDestetePct: 70 + Math.round(((diasVida - 42) / 14) * 25),
    };
  }

  // Etapa 4: A partir de las 8 semanas (2 meses / >= 56 días) -> Destete Completo
  return {
    diasVida,
    semanasVida,
    etapaCodigo: 'DESTETE_COMPLETO',
    nombreEtapa: `Destete Completo (${diasVida} días • ${semanasVida} sem)`,
    rangoSemanas: 'A partir de 8 semanas (2+ meses)',
    indicacionNutricional: 'Destete completo. 100% alimento sólido de alta calidad para cachorros.',
    consumeAlimentoStock: true,
    racionEstimadaGramosDia: 380, // ~380g diario
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    progresoDestetePct: 100,
  };
}

export interface ConsumoCamadaDetalle {
  camadaId: string;
  camadaIdentificador: string;
  fechaNacimiento?: string;
  diasVida: number;
  semanasVida: number;
  etapa: EtapaNutricionalCachorro;
  totalNacidosVivos: number;
  cachorrosRegistradosFicha: number;
  cachorrosEntregados: number; // Con freno de racionamiento
  cachorrosConsumiendoActivos: number; // En criadero consumiendo stock
  racionGramosPorCachorroDia: number;
  consumoTotalCamadaGramosDia: number;
  consumoTotalCamadaKgDia: number;
  frenoRacionamientoActivo: boolean;
  motivoExclusion?: string;
}

/**
 * Calcula el consumo real de alimento para una camada considerando:
 * 1. Edad >= 28 días (antes del día 28 el consumo de stock es 0).
 * 2. Freno de racionamiento para cachorros con estado 'ENTREGADO' (se restan del cálculo).
 */
export function calcularConsumoCamadaConFreno(
  camada: Camada,
  todosLosCachorros: Cachorro[]
): ConsumoCamadaDetalle {
  const etapa = obtenerEtapaNutricionalCachorro(camada.fechaNacimiento);

  // Filtrar cachorros de esta camada
  const pupsInCamada = todosLosCachorros.filter((p) => {
    if (p.camadaId === camada.id) return true;
    if (p.camadaNombre && p.camadaNombre.trim().toLowerCase() === camada.identificador.trim().toLowerCase()) return true;
    return false;
  });

  const totalNacidosVivos = Math.max(
    0,
    (camada.nacidosVivos !== undefined && camada.nacidosVivos !== null)
      ? camada.nacidosVivos
      : (camada.totalCachorros || 0) - (camada.fallecidos || 0)
  );

  // Cachorros con estado 'ENTREGADO' (freno de racionamiento activado)
  const pupsEntregados = pupsInCamada.filter((p) => {
    const estado = (p.estadoComercial || (p as any).estado || '').toString().toUpperCase();
    return estado === 'ENTREGADO' || Boolean(p.comprador?.fechaEntregaReal);
  });

  const cachorrosEntregados = pupsEntregados.length;

  // Si hay fichas creadas, contamos las que no están entregadas; si no hay fichas, usamos totalNacidosVivos
  let cachorrosConsumiendo = 0;
  if (pupsInCamada.length > 0) {
    cachorrosConsumiendo = Math.max(0, pupsInCamada.length - cachorrosEntregados);
  } else {
    cachorrosConsumiendo = Math.max(0, totalNacidosVivos - cachorrosEntregados);
  }

  // Si la camada tiene menos de 28 días, el consumo de stock balanceado es 0 kg
  if (!etapa.consumeAlimentoStock) {
    return {
      camadaId: camada.id,
      camadaIdentificador: camada.identificador,
      fechaNacimiento: camada.fechaNacimiento,
      diasVida: etapa.diasVida,
      semanasVida: etapa.semanasVida,
      etapa,
      totalNacidosVivos,
      cachorrosRegistradosFicha: pupsInCamada.length,
      cachorrosEntregados,
      cachorrosConsumiendoActivos: 0,
      racionGramosPorCachorroDia: 0,
      consumoTotalCamadaGramosDia: 0,
      consumoTotalCamadaKgDia: 0,
      frenoRacionamientoActivo: false,
      motivoExclusion: `Cachorros de ${etapa.diasVida} días en lactancia materna exclusiva (el consumo de stock inicia en el día 28).`,
    };
  }

  // Si todos los cachorros fueron entregados o no queda ninguno en el criadero
  if (cachorrosConsumiendo <= 0) {
    return {
      camadaId: camada.id,
      camadaIdentificador: camada.identificador,
      fechaNacimiento: camada.fechaNacimiento,
      diasVida: etapa.diasVida,
      semanasVida: etapa.semanasVida,
      etapa,
      totalNacidosVivos,
      cachorrosRegistradosFicha: pupsInCamada.length,
      cachorrosEntregados,
      cachorrosConsumiendoActivos: 0,
      racionGramosPorCachorroDia: etapa.racionEstimadaGramosDia,
      consumoTotalCamadaGramosDia: 0,
      consumoTotalCamadaKgDia: 0,
      frenoRacionamientoActivo: cachorrosEntregados > 0,
      motivoExclusion: `Todos los cachorros (${cachorrosEntregados}) se encuentran en estado ENTREGADO. Racionamiento detenido en inventario.`,
    };
  }

  const racionGramos = etapa.racionEstimadaGramosDia;
  const consumoGramosDia = cachorrosConsumiendo * racionGramos;

  return {
    camadaId: camada.id,
    camadaIdentificador: camada.identificador,
    fechaNacimiento: camada.fechaNacimiento,
    diasVida: etapa.diasVida,
    semanasVida: etapa.semanasVida,
    etapa,
    totalNacidosVivos,
    cachorrosRegistradosFicha: pupsInCamada.length,
    cachorrosEntregados,
    cachorrosConsumiendoActivos: cachorrosConsumiendo,
    racionGramosPorCachorroDia: racionGramos,
    consumoTotalCamadaGramosDia: consumoGramosDia,
    consumoTotalCamadaKgDia: consumoGramosDia / 1000,
    frenoRacionamientoActivo: cachorrosEntregados > 0,
  };
}
