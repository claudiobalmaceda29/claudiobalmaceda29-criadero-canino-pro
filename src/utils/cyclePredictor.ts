import { Ejemplar, CicloCelo, Camada } from '../types';

export interface PrediccionCeloResult {
  hembraId: string;
  hembraNombre: string;
  fechaUltimoCelo?: string;
  origenUltimoDato: 'CELO_REGISTRADO' | 'PARTO_REGISTRADO' | 'FECHA_ESTIMADA' | 'SIN_DATOS';
  diasDesdeUltimoCelo: number;
  cicloPromedioDias: number;
  fechaEstimadaProximoCelo: string;
  diasRestantes: number;
  estado: 'CELO_ACTIVO' | 'INMINENTE' | 'PROXIMO' | 'ANESTRO' | 'SIN_DATOS';
  badgeColor: string;
  badgeTexto: string;
  ventanaProgesteronaSugerida: {
    inicio: string;
    fin: string;
  };
  observacionRecomendada: string;
}

/**
 * Calcula y proyecta el próximo ciclo de celo de una hembra ovejera alemana.
 * Considera el ciclo biológico estándar (~180 días / 6 meses) y personaliza el promedio
 * si la hembra tiene 2 o más celos registrados en el sistema.
 */
export function predecirProximoCelo(
  hembra: Ejemplar,
  ciclosDeHembra: CicloCelo[] = [],
  camadasDeHembra: Camada[] = []
): PrediccionCeloResult {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // 1. Filtrar celos ordenados cronológicamente descendente
  const celosOrdenados = [...ciclosDeHembra]
    .filter((c) => c.hembraId === hembra.id && c.fechaInicio)
    .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());

  // 2. Filtrar partos ordenados cronológicamente descendente
  const partosOrdenados = [...camadasDeHembra]
    .filter((c) => c.madreId === hembra.id && c.fechaNacimiento)
    .sort((a, b) => new Date(b.fechaNacimiento!).getTime() - new Date(a.fechaNacimiento!).getTime());

  // 3. Verificar si hay celo actualmente en curso
  const celoEnCurso = celosOrdenados.find((c) => c.estado === 'EN_CURSO');
  if (celoEnCurso) {
    const inicio = new Date(celoEnCurso.fechaInicio);
    const dias = Math.max(0, Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
    const diasProg = Math.min(21, dias);
    return {
      hembraId: hembra.id,
      hembraNombre: hembra.nombreCompleto,
      fechaUltimoCelo: celoEnCurso.fechaInicio,
      origenUltimoDato: 'CELO_REGISTRADO',
      diasDesdeUltimoCelo: dias,
      cicloPromedioDias: 180,
      fechaEstimadaProximoCelo: new Date(inicio.getTime() + 180 * 86400000).toISOString().split('T')[0],
      diasRestantes: 0,
      estado: 'CELO_ACTIVO',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      badgeTexto: `En celo activo (Día ${diasProg + 1})`,
      ventanaProgesteronaSugerida: {
        inicio: new Date(inicio.getTime() + 8 * 86400000).toISOString().split('T')[0],
        fin: new Date(inicio.getTime() + 14 * 86400000).toISOString().split('T')[0],
      },
      observacionRecomendada: 'Realizar dosaje de progesterona cuantitativa cada 48hs para determinar ovulación precisa.',
    };
  }

  // 4. Determinar la fecha más reciente de celo o parto
  let fechaBase: Date | null = null;
  let origen: PrediccionCeloResult['origenUltimoDato'] = 'SIN_DATOS';

  const ultimoCelo = celosOrdenados[0];
  const ultimoParto = partosOrdenados[0];

  if (ultimoCelo && ultimoParto) {
    const tCelo = new Date(ultimoCelo.fechaInicio).getTime();
    const tParto = new Date(ultimoParto.fechaNacimiento!).getTime();
    if (tCelo >= tParto) {
      fechaBase = new Date(ultimoCelo.fechaInicio);
      origen = 'CELO_REGISTRADO';
    } else {
      fechaBase = new Date(ultimoParto.fechaNacimiento!);
      origen = 'PARTO_REGISTRADO';
    }
  } else if (ultimoCelo) {
    fechaBase = new Date(ultimoCelo.fechaInicio);
    origen = 'CELO_REGISTRADO';
  } else if (ultimoParto) {
    fechaBase = new Date(ultimoParto.fechaNacimiento!);
    origen = 'PARTO_REGISTRADO';
  }

  // Si no hay registros de celo o parto, estimar con fecha de nacimiento si tiene más de 6 meses
  if (!fechaBase) {
    if (hembra.fechaNacimiento) {
      const nac = new Date(hembra.fechaNacimiento);
      const edadMeses = (hoy.getTime() - nac.getTime()) / (1000 * 60 * 60 * 24 * 30.43);
      if (edadMeses >= 6) {
        // Estimar primer celo a los 8-9 meses o fecha estimada
        const fechaEstimadaPrimerCelo = new Date(nac.getTime() + 240 * 86400000);
        fechaBase = fechaEstimadaPrimerCelo;
        origen = 'FECHA_ESTIMADA';
      }
    }
  }

  if (!fechaBase || isNaN(fechaBase.getTime())) {
    return {
      hembraId: hembra.id,
      hembraNombre: hembra.nombreCompleto,
      origenUltimoDato: 'SIN_DATOS',
      diasDesdeUltimoCelo: 0,
      cicloPromedioDias: 180,
      fechaEstimadaProximoCelo: 'Sin datos',
      diasRestantes: 999,
      estado: 'SIN_DATOS',
      badgeColor: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      badgeTexto: 'Sin historial de celos',
      ventanaProgesteronaSugerida: { inicio: '-', fin: '-' },
      observacionRecomendada: 'Cargar el primer registro de celo o parto para activar la predicción matemática del ciclo.',
    };
  }

  // 5. Calcular intervalo promedio si hay 2 o más celos registrados
  let cicloPromedioDias = 180; // 6 meses estándar en pastor alemán
  if (celosOrdenados.length >= 2) {
    let sumaIntervalos = 0;
    let conteo = 0;
    for (let i = 0; i < celosOrdenados.length - 1 && i < 3; i++) {
      const c1 = new Date(celosOrdenados[i].fechaInicio).getTime();
      const c2 = new Date(celosOrdenados[i + 1].fechaInicio).getTime();
      const diffDias = Math.round((c1 - c2) / (1000 * 60 * 60 * 24));
      if (diffDias >= 120 && diffDias <= 270) {
        sumaIntervalos += diffDias;
        conteo++;
      }
    }
    if (conteo > 0) {
      cicloPromedioDias = Math.round(sumaIntervalos / conteo);
    }
  }

  // 6. Proyección del próximo celo
  const diasDesde = Math.max(0, Math.floor((hoy.getTime() - fechaBase.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Si ya pasaron más días que el ciclo promedio, sumar ciclos hasta que esté en el futuro o muy próximo
  let fechaProximo = new Date(fechaBase.getTime() + cicloPromedioDias * 86400000);
  while (fechaProximo.getTime() < hoy.getTime() - 15 * 86400000) {
    fechaProximo = new Date(fechaProximo.getTime() + cicloPromedioDias * 86400000);
  }

  const diasRestantes = Math.round((fechaProximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  const fechaEstimadaStr = fechaProximo.toISOString().split('T')[0];

  // Ventana sugerida de progesterona (días 9 al 14 post inicio estimado de celo)
  const vProgInicio = new Date(fechaProximo.getTime() + 9 * 86400000).toISOString().split('T')[0];
  const vProgFin = new Date(fechaProximo.getTime() + 14 * 86400000).toISOString().split('T')[0];

  // Estado y badges
  let estado: PrediccionCeloResult['estado'] = 'ANESTRO';
  let badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  let badgeTexto = `Próximo celo en ${diasRestantes} días`;
  let observacion = 'Fase de reposo ovárico (Anestro). Buen momento para control de peso y condición física.';

  if (diasRestantes <= 0) {
    estado = 'INMINENTE';
    badgeColor = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse';
    badgeTexto = 'Celo inminente / en fecha estimada';
    observacion = 'Comenzar a verificar vulva e hisopado vaginal diariamente. Alistar macho reproductor.';
  } else if (diasRestantes <= 15) {
    estado = 'INMINENTE';
    badgeColor = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    badgeTexto = `Celo muy próximo (${diasRestantes} días)`;
    observacion = 'Alerta pre-reproductiva: Realizar citología exfoliante o citar padrillo si se planifica cruza.';
  } else if (diasRestantes <= 45) {
    estado = 'PROXIMO';
    badgeColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    badgeTexto = `En ventana de preparación (${diasRestantes} días)`;
    observacion = 'Desparasitar a la hembra y asegurar refuerzo de vacunas antes del inicio del proestro.';
  }

  return {
    hembraId: hembra.id,
    hembraNombre: hembra.nombreCompleto,
    fechaUltimoCelo: fechaBase.toISOString().split('T')[0],
    origenUltimoDato: origen,
    diasDesdeUltimoCelo: diasDesde,
    cicloPromedioDias,
    fechaEstimadaProximoCelo: fechaEstimadaStr,
    diasRestantes,
    estado,
    badgeColor,
    badgeTexto,
    ventanaProgesteronaSugerida: {
      inicio: vProgInicio,
      fin: vProgFin,
    },
    observacionRecomendada: observacion,
  };
}
