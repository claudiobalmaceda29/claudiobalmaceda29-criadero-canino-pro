/**
 * MOTOR DE REGLAMENTACIÓN OFICIAL CLUB POA (Club Argentino de Criadores del Perro Ovejero Alemán)
 * Integrado con normativas SV (Schäferhunde Verein) y WUSV (Weltunion der Schäferhundvereine).
 * 
 * Reglas de negocio:
 * 1. Límites de edad para reproducción (Protección Animal y Reglamento de Cría).
 * 2. Lógica dura de consanguinidad (Semáforos SV / Wright COI).
 * 3. Categorización automática en Exposiciones de Estructura.
 * 4. Control de plazos fatales anti-multas (Libro de Cría POA).
 * 5. Evaluación de salud articular (HD/ED oficial).
 * 6. Cría de Selección (Premium).
 */

import { Ejemplar, Monta, Camada } from '../types';

// ==========================================
// 1. Constantes y Opciones Estrictas HD / ED
// ==========================================

export interface OpcionSaludArticular {
  id: string;
  label: string;
  esAptoCria: boolean;
  esLibreTotal: boolean;
  gradoTexto: string;
}

export const OPCIONES_CADERA_POA: OpcionSaludArticular[] = [
  {
    id: 'a1',
    label: 'a1 - HD "a" Normal (Libre Oficial)',
    esAptoCria: true,
    esLibreTotal: true,
    gradoTexto: 'Libre de Displasia',
  },
  {
    id: 'a2',
    label: 'a2 - HD "a" Casi Normal (Permitido)',
    esAptoCria: true,
    esLibreTotal: false,
    gradoTexto: 'Casi Normal',
  },
  {
    id: 'a3',
    label: 'a3 - HD "a" Todavía Permitido (Grado I)',
    esAptoCria: true,
    esLibreTotal: false,
    gradoTexto: 'Todavía Permitido',
  },
  {
    id: 'Mediana',
    label: 'Mediana - Displasia Coxofemoral Mediana (No Apto)',
    esAptoCria: false,
    esLibreTotal: false,
    gradoTexto: 'No Apto para Cría',
  },
  {
    id: 'Grave',
    label: 'Grave - Displasia Coxofemoral Severa/Grave (No Apto)',
    esAptoCria: false,
    esLibreTotal: false,
    gradoTexto: 'No Apto para Cría',
  },
  {
    id: 'No Evaluado',
    label: 'No Evaluado / Sin Placa Oficial',
    esAptoCria: false,
    esLibreTotal: false,
    gradoTexto: 'Sin Diagnóstico',
  },
];

export const OPCIONES_CODO_POA: OpcionSaludArticular[] = [
  {
    id: 'ED 0',
    label: 'Normal - ED "0" Normal (Libre Oficial)',
    esAptoCria: true,
    esLibreTotal: true,
    gradoTexto: 'Libre de Displasia de Codo',
  },
  {
    id: 'ED 1',
    label: 'Casi Normal - ED "1" (Permitido)',
    esAptoCria: true,
    esLibreTotal: false,
    gradoTexto: 'Casi Normal',
  },
  {
    id: 'ED 2',
    label: 'Todavía Permitido - ED "2" (Permitido)',
    esAptoCria: true,
    esLibreTotal: false,
    gradoTexto: 'Todavía Permitido',
  },
  {
    id: 'Severa',
    label: 'Severa - Displasia de Codo Grado III (No Apto)',
    esAptoCria: false,
    esLibreTotal: false,
    gradoTexto: 'No Apto para Cría',
  },
  {
    id: 'No Evaluado',
    label: 'No Evaluado / Sin Placa Oficial',
    esAptoCria: false,
    esLibreTotal: false,
    gradoTexto: 'Sin Diagnóstico',
  },
];

export const OPCIONES_CALIFICACION_CRIA_POA = [
  'Seleccionado de Primera (Kkl 1)',
  'Seleccionado de Segunda (Kkl 2)',
  'Apto de Cría Oficial POA',
  'Apto Provisorio',
  'Sin Apto de Cría',
  'No Apto (Rechazado en Körung)',
];

// ==========================================
// 2. Límites de Edad (Protección Animal y Cría POA)
// ==========================================

export interface EvaluacionEdadPOAResult {
  valida: boolean;
  edadMeses: number;
  edadTexto: string;
  motivoBloqueo?: string;
  alertaTexto?: string;
  edadMinimaMeses: number;
  edadMaximaMeses?: number;
}

/**
 * Evalúa si el ejemplar cumple los límites reglamentarios oficiales de edad para servicio:
 * - Hembras: Mínimo 20 meses, Máximo 8 años (96 meses).
 * - Machos: Mínimo 24 meses.
 */
export function evaluarEdadReglamentariaPOA(
  ejemplar: Ejemplar,
  fechaReferenciaStr?: string
): EvaluacionEdadPOAResult {
  const fechaRef = fechaReferenciaStr ? new Date(fechaReferenciaStr) : new Date();

  if (!ejemplar.fechaNacimiento) {
    return {
      valida: true,
      edadMeses: 36,
      edadTexto: 'Edad no registrada (Estimada adulta)',
      edadMinimaMeses: ejemplar.sexo === 'HEMBRA' ? 20 : 24,
    };
  }

  const fNac = new Date(ejemplar.fechaNacimiento);
  if (isNaN(fNac.getTime())) {
    return {
      valida: true,
      edadMeses: 36,
      edadTexto: 'Fecha de nacimiento inválida',
      edadMinimaMeses: ejemplar.sexo === 'HEMBRA' ? 20 : 24,
    };
  }

  // Cálculo exacto de meses
  let diffMeses = (fechaRef.getFullYear() - fNac.getFullYear()) * 12 + (fechaRef.getMonth() - fNac.getMonth());
  if (fechaRef.getDate() < fNac.getDate()) {
    diffMeses -= 1;
  }
  const edadMeses = Math.max(0, diffMeses);
  const anios = Math.floor(edadMeses / 12);
  const mesesRestantes = edadMeses % 12;
  const edadTexto = anios > 0 ? `${anios} años ${mesesRestantes > 0 ? `${mesesRestantes}m` : ''}` : `${edadMeses} meses`;

  if (ejemplar.sexo === 'HEMBRA') {
    // Hembra: 20m a 96m (8 años)
    if (edadMeses < 20) {
      return {
        valida: false,
        edadMeses,
        edadTexto,
        edadMinimaMeses: 20,
        edadMaximaMeses: 96,
        motivoBloqueo: `Hembra menor de 20 meses (${edadMeses} meses cumplidos).`,
        alertaTexto: 'Fuera de edad reglamentaria. Esta camada no será reconocida por POA (Hembras: mín. 20m a máx. 8 años).',
      };
    }
    if (edadMeses > 96) {
      return {
        valida: false,
        edadMeses,
        edadTexto,
        edadMinimaMeses: 20,
        edadMaximaMeses: 96,
        motivoBloqueo: `Hembra mayor de 8 años (${anios} años cumplidos). Supera el límite biológico de retiro.`,
        alertaTexto: 'Fuera de edad reglamentaria. Esta camada no será reconocida por POA (Límite máximo: 8 años cumplidos).',
      };
    }
    return {
      valida: true,
      edadMeses,
      edadTexto,
      edadMinimaMeses: 20,
      edadMaximaMeses: 96,
    };
  } else {
    // Macho: Mínimo 24 meses
    if (edadMeses < 24) {
      return {
        valida: false,
        edadMeses,
        edadTexto,
        edadMinimaMeses: 24,
        motivoBloqueo: `Macho menor de 24 meses (${edadMeses} meses cumplidos).`,
        alertaTexto: 'Fuera de edad reglamentaria. Esta camada no será reconocida por POA (Machos: mín. 24 meses cumplidos).',
      };
    }
    return {
      valida: true,
      edadMeses,
      edadTexto,
      edadMinimaMeses: 24,
    };
  }
}

// ==========================================
// 3. Lógica Dura de Consanguinidad SV (Semáforos)
// ==========================================

export type SemaforoConsanguinidad = 'ROJO' | 'AMARILLO' | 'VERDE';

export interface EvaluacionConsanguinidadSVResult {
  semaforo: SemaforoConsanguinidad;
  bloqueado: boolean;
  notacionSV: string; // ej: "1-2", "2-2", "3-3", "4-4", "Outcross (0%)"
  tituloAlerta: string;
  mensajeAlerta: string;
  antepasadosComunes: Array<{ nombre: string; lineaPaternaGen: number; lineaMaternaGen: number }>;
  coiWrightPct: number;
  esCrucePermitidoPOA: boolean;
  explicacionTooltip: string;
}

/**
 * Evalúa las generaciones de antepasados compartidos según el reglamento SV/WUSV/POA:
 * - 1-2: Padre x Hija -> ROJO (Bloqueo)
 * - 2-1: Hijo x Madre -> ROJO (Bloqueo)
 * - 2-2: Hermanos completos o medio hermanos -> ROJO (Bloqueo)
 * - 3-2 / 2-3: Tío x Sobrina / Abuelo x Nieta -> AMARILLO (Riesgoso/Linebreeding)
 * - 3-3: Primos hermanos o bisabuelo compartido -> AMARILLO (Linebreeding)
 * - 4-4, 5-4, 5-5 o sin coincidencias: VERDE (Ideal / Outcross)
 */
export function evaluarConsanguinidadSV(
  macho: Ejemplar,
  hembra: Ejemplar
): EvaluacionConsanguinidadSVResult {
  const norm = (s?: string) => (s || '').trim().toLowerCase();

  const antepasadosComunes: Array<{ nombre: string; lineaPaternaGen: number; lineaMaternaGen: number }> = [];

  // Mapear árbol de ancestros del macho (con sus generaciones: 1=Padres, 2=Abuelos, 3=Bisabuelos)
  const ancestrosMacho: Array<{ nombre: string; gen: number }> = [];
  if (macho.nombreCompleto) ancestrosMacho.push({ nombre: macho.nombreCompleto, gen: 0 });
  if (macho.padreNombre) ancestrosMacho.push({ nombre: macho.padreNombre, gen: 1 });
  if (macho.madreNombre) ancestrosMacho.push({ nombre: macho.madreNombre, gen: 1 });
  if (macho.abueloPaterno) ancestrosMacho.push({ nombre: macho.abueloPaterno, gen: 2 });
  if (macho.abuelaPaterna) ancestrosMacho.push({ nombre: macho.abuelaPaterna, gen: 2 });
  if (macho.abueloMaterno) ancestrosMacho.push({ nombre: macho.abueloMaterno, gen: 2 });
  if (macho.abuelaMaterna) ancestrosMacho.push({ nombre: macho.abuelaMaterna, gen: 2 });
  if (macho.bisabuelos) {
    Object.values(macho.bisabuelos).forEach((b) => {
      if (b) ancestrosMacho.push({ nombre: b, gen: 3 });
    });
  }

  // Mapear árbol de ancestros de la hembra
  const ancestrosHembra: Array<{ nombre: string; gen: number }> = [];
  if (hembra.nombreCompleto) ancestrosHembra.push({ nombre: hembra.nombreCompleto, gen: 0 });
  if (hembra.padreNombre) ancestrosHembra.push({ nombre: hembra.padreNombre, gen: 1 });
  if (hembra.madreNombre) ancestrosHembra.push({ nombre: hembra.madreNombre, gen: 1 });
  if (hembra.abueloPaterno) ancestrosHembra.push({ nombre: hembra.abueloPaterno, gen: 2 });
  if (hembra.abuelaPaterna) ancestrosHembra.push({ nombre: hembra.abuelaPaterna, gen: 2 });
  if (hembra.abueloMaterno) ancestrosHembra.push({ nombre: hembra.abueloMaterno, gen: 2 });
  if (hembra.abuelaMaterna) ancestrosHembra.push({ nombre: hembra.abuelaMaterna, gen: 2 });
  if (hembra.bisabuelos) {
    Object.values(hembra.bisabuelos).forEach((b) => {
      if (b) ancestrosHembra.push({ nombre: b, gen: 3 });
    });
  }

  // Verificar coincidencias y calcular relación más estrecha
  let menorGenMacho = 99;
  let menorGenHembra = 99;
  let antepasadoPrincipal = '';

  ancestrosMacho.forEach((ancM) => {
    const matchH = ancestrosHembra.find((ancH) => norm(ancH.nombre) === norm(ancM.nombre));
    if (matchH) {
      antepasadosComunes.push({
        nombre: ancM.nombre,
        lineaPaternaGen: ancM.gen,
        lineaMaternaGen: matchH.gen,
      });

      // Chequear si es una combinación más estrecha
      const suma = ancM.gen + matchH.gen;
      const sumaMinimaActual = menorGenMacho + menorGenHembra;
      if (suma < sumaMinimaActual) {
        menorGenMacho = ancM.gen;
        menorGenHembra = matchH.gen;
        antepasadoPrincipal = ancM.nombre;
      }
    }
  });

  // Chequeo directo de parentescos primarios:
  const esPadreHija = norm(macho.nombreCompleto) === norm(hembra.padreNombre); // Macho es padre de la hembra
  const esHijoMadre = norm(macho.madreNombre) === norm(hembra.nombreCompleto); // Macho es hijo de la hembra
  const mismoPadre = Boolean(macho.padreNombre && hembra.padreNombre && norm(macho.padreNombre) === norm(hembra.padreNombre));
  const mismaMadre = Boolean(macho.madreNombre && hembra.madreNombre && norm(macho.madreNombre) === norm(hembra.madreNombre));
  const sonMedioHermanos = mismoPadre || mismaMadre;
  const sonHermanosEnteros = mismoPadre && mismaMadre;

  // Determinar notación SV y Semáforo
  let semaforo: SemaforoConsanguinidad = 'VERDE';
  let bloqueado = false;
  let notacionSV = 'Outcross (0%)';
  let coiWrightPct = 1.2;
  let tituloAlerta = 'Cruce Permitido & Recomendado';
  let mensajeAlerta = 'Cruce Ideal. Aporta gran vigor híbrido.';

  if (esPadreHija) {
    semaforo = 'ROJO';
    bloqueado = true;
    notacionSV = '1-2 (Padre x Hija)';
    coiWrightPct = 25.0;
    tituloAlerta = 'Cruce Prohibido (Consanguinidad 1-2)';
    mensajeAlerta = 'Cruce no permitido por normativas POA. Consanguinidad demasiado estrecha.';
  } else if (esHijoMadre) {
    semaforo = 'ROJO';
    bloqueado = true;
    notacionSV = '2-1 (Hijo x Madre)';
    coiWrightPct = 25.0;
    tituloAlerta = 'Cruce Prohibido (Consanguinidad 2-1)';
    mensajeAlerta = 'Cruce no permitido por normativas POA. Consanguinidad demasiado estrecha.';
  } else if (sonHermanosEnteros) {
    semaforo = 'ROJO';
    bloqueado = true;
    notacionSV = '2-2 (Hermanos Enteros)';
    coiWrightPct = 25.0;
    tituloAlerta = 'Cruce Prohibido (Consanguinidad 2-2)';
    mensajeAlerta = 'Cruce no permitido por normativas POA. Consanguinidad demasiado estrecha.';
  } else if (sonMedioHermanos) {
    semaforo = 'ROJO';
    bloqueado = true;
    notacionSV = '2-2 (Medio Hermanos)';
    coiWrightPct = 12.5;
    tituloAlerta = 'Cruce Prohibido (Consanguinidad 2-2)';
    mensajeAlerta = 'Cruce no permitido por normativas POA. Consanguinidad demasiado estrecha.';
  } else if (
    (menorGenMacho === 2 && menorGenHembra === 3) ||
    (menorGenMacho === 3 && menorGenHembra === 2)
  ) {
    // 3-2 o 2-3 (Tío x Sobrina, Abuelo x Nieta)
    semaforo = 'AMARILLO';
    bloqueado = false;
    notacionSV = `${menorGenMacho}-${menorGenHembra} (${antepasadoPrincipal || 'Linebreeding'})`;
    coiWrightPct = 6.25;
    tituloAlerta = 'Consanguinidad Estrecha (Linebreeding 3-2 / 2-3)';
    mensajeAlerta =
      'Cruce válido (Linebreeding). Se recomienda cruzar solo si ambos tienen excelentes placas oficiales de cadera y codo (a1/a2) y temperamento equilibrado.';
  } else if (menorGenMacho === 3 && menorGenHembra === 3) {
    // 3-3 (Primos hermanos o bisabuelo duplicado)
    semaforo = 'AMARILLO';
    bloqueado = false;
    notacionSV = `3-3 (${antepasadoPrincipal || 'Linebreeding'})`;
    coiWrightPct = 6.25;
    tituloAlerta = 'Consanguinidad Moderada (Linebreeding 3-3)';
    mensajeAlerta =
      'Cruce válido (Linebreeding). Se recomienda cruzar solo si ambos tienen excelentes placas oficiales de cadera y codo (a1/a2) y temperamento equilibrado.';
  } else if (antepasadosComunes.length > 0) {
    // 4-4, 5-4, 5-5
    semaforo = 'VERDE';
    bloqueado = false;
    notacionSV = `${Math.min(menorGenMacho, 4)}-${Math.min(menorGenHembra, 4)} (${antepasadoPrincipal || 'Outcross'})`;
    coiWrightPct = Math.round(antepasadosComunes.length * 1.56 * 10) / 10;
    tituloAlerta = 'Cruce Abierto Favorable';
    mensajeAlerta = 'Cruce Ideal. Aporta gran vigor híbrido.';
  }

  const explicacionTooltip =
    'El Wright COI (Coeficiente de Consanguinidad Fx) calcula la probabilidad estadística de homozigosis en los genes de la cría. La Fórmula SV (notación X-Y) indica en qué generación del padre (X) y de la madre (Y) coincide un reproductor histórico clave. Según el reglamento POA/SV, los cruces 1-2, 2-1 y 2-2 están taxativamente prohibidos para evitar la depresión por consanguinidad y la manifestación de patologías hereditarias graves.';

  return {
    semaforo,
    bloqueado,
    notacionSV,
    tituloAlerta,
    mensajeAlerta,
    antepasadosComunes,
    coiWrightPct,
    esCrucePermitidoPOA: !bloqueado,
    explicacionTooltip,
  };
}

// ==========================================
// 4. Cría de Selección (Premium) POA
// ==========================================

export interface EvaluacionCriaSeleccionResult {
  esPremium: boolean;
  cumpleMacho: boolean;
  cumpleHembra: boolean;
  detallesMacho: {
    tieneBH: boolean;
    tieneAptoCria: boolean;
    placasAptas: boolean;
  };
  detallesHembra: {
    tieneBH: boolean;
    tieneAptoCria: boolean;
    placasAptas: boolean;
  };
  distintivoTexto: string;
  explicacion: string;
}

export function evaluarCriaDeSeleccionPremium(
  macho: Ejemplar,
  hembra: Ejemplar
): EvaluacionCriaSeleccionResult {
  const norm = (s?: string) => (s || '').toLowerCase();

  const titulosMacho = (macho.titulos || []).map((t) => norm(t)).join(' ');
  const titulosHembra = (hembra.titulos || []).map((t) => norm(t)).join(' ');

  const tieneBH = (t: string, obs?: string) => {
    const full = `${t} ${norm(obs)}`;
    return full.includes('bh') || full.includes('igp') || full.includes('cab') || full.includes('ipo');
  };

  const tieneAptoCria = (calif?: string, obs?: string) => {
    const full = `${norm(calif)} ${norm(obs)}`;
    return (
      full.includes('kkl') ||
      full.includes('seleccionado') ||
      full.includes('apto de cría') ||
      full.includes('apto')
    );
  };

  const placasAptas = (hd?: string, ed?: string) => {
    const h = norm(hd);
    const e = norm(ed);
    const caderaOk = !h.includes('mediana') && !h.includes('grave') && !h.includes('severa');
    const codoOk = !e.includes('severa') && !e.includes('no apto');
    return caderaOk && codoOk;
  };

  const mBH = tieneBH(titulosMacho, macho.observaciones);
  const mSeleccion = tieneAptoCria(macho.calificacionCria, macho.observaciones);
  const mPlacas = placasAptas(macho.displasiaCadera, macho.displasiaCodo);

  const hBH = tieneBH(titulosHembra, hembra.observaciones);
  const hSeleccion = tieneAptoCria(hembra.calificacionCria, hembra.observaciones);
  const hPlacas = placasAptas(hembra.displasiaCadera, hembra.displasiaCodo);

  const cumpleMacho = mBH && mSeleccion && mPlacas;
  const cumpleHembra = hBH && hSeleccion && hPlacas;
  const esPremium = cumpleMacho && cumpleHembra;

  return {
    esPremium,
    cumpleMacho,
    cumpleHembra,
    detallesMacho: { tieneBH: mBH, tieneAptoCria: mSeleccion, placasAptas: mPlacas },
    detallesHembra: { tieneBH: hBH, tieneAptoCria: hSeleccion, placasAptas: hPlacas },
    distintivoTexto: esPremium ? '⭐ Cría de Selección POA (Premium)' : 'Cría Reglamentaria POA',
    explicacion: esPremium
      ? '¡Cruza de máxima categoría! Ambos reproductores poseen examen de BH/Trabajo, Apto de Selección (Körklasse) y diagnósticos radiológicos de cadera y codo permitidos. Los cachorros calificarán para Pedigree de Cría de Selección.'
      : 'Para calificar como Cría de Selección Premium, ambos reproductores deben contar con prueba de disciplina/BH aprobada, Apto de Cría/Selección oficial POA y placas oficiales libres.',
  };
}

// ==========================================
// 5. Salud Articular y Displasia (HD/ED)
// ==========================================

export interface EvaluacionSaludArticularResult {
  bloqueadoPorDisplasia: boolean;
  alertaAmarillaPrecaucion: boolean;
  mensaje: string;
  detalleCadera: string;
  detalleCodo: string;
}

export function evaluarCompatibilidadSaludArticular(
  macho: Ejemplar,
  hembra: Ejemplar
): EvaluacionSaludArticularResult {
  const norm = (s?: string) => (s || '').toLowerCase();

  const mHD = norm(macho.displasiaCadera);
  const hHD = norm(hembra.displasiaCadera);
  const mED = norm(macho.displasiaCodo);
  const hED = norm(hembra.displasiaCodo);

  // Bloqueo por displasia Mediana, Grave o Severa
  const mHDBloqueado = mHD.includes('mediana') || mHD.includes('grave') || mHD.includes('severa');
  const hHDBloqueado = hHD.includes('mediana') || hHD.includes('grave') || hHD.includes('severa');
  const mEDBloqueado = mED.includes('severa') || mED.includes('no apto');
  const hEDBloqueado = hED.includes('severa') || hED.includes('no apto');

  if (mHDBloqueado || hHDBloqueado || mEDBloqueado || hEDBloqueado) {
    return {
      bloqueadoPorDisplasia: true,
      alertaAmarillaPrecaucion: false,
      mensaje:
        'BLOQUEO SANITARIO: Uno de los reproductores presenta diagnóstico de displasia Mediana o Grave (no apto para la cría según reglamento POA/SV). Cruce descalificado.',
      detalleCadera: `Macho: ${macho.displasiaCadera || 'No evaluado'} | Hembra: ${hembra.displasiaCadera || 'No evaluado'}`,
      detalleCodo: `Macho: ${macho.displasiaCodo || 'No evaluado'} | Hembra: ${hembra.displasiaCodo || 'No evaluado'}`,
    };
  }

  // Warning si ambos son a2 (Casi Normal) o a3 (Permitido)
  const esA2oA3 = (hd: string) => hd.includes('a2') || hd.includes('casi normal') || hd.includes('a3') || hd.includes('permitido');
  const ambosA2 = esA2oA3(mHD) && esA2oA3(hHD);

  if (ambosA2) {
    return {
      bloqueadoPorDisplasia: false,
      alertaAmarillaPrecaucion: true,
      mensaje:
        'Atención Sanitaria: Ambos reproductores poseen grado permitido (a2/a3 - Casi Normal / Permitido). La comisión de cría del Club POA recomienda buscar un ejemplar a1 (Normal Libre) para la descendencia a fin de evitar la fijación fenotípica de displasia.',
      detalleCadera: `Macho: ${macho.displasiaCadera} | Hembra: ${hembra.displasiaCadera}`,
      detalleCodo: `Macho: ${macho.displasiaCodo} | Hembra: ${hembra.displasiaCodo}`,
    };
  }

  return {
    bloqueadoPorDisplasia: false,
    alertaAmarillaPrecaucion: false,
    mensaje: 'Compatibilidad articular óptima: ambos reproductores poseen diagnósticos radiológicos aprobados para la cría.',
    detalleCadera: `Macho: ${macho.displasiaCadera || 'Libre'} | Hembra: ${hembra.displasiaCadera || 'Libre'}`,
    detalleCodo: `Macho: ${macho.displasiaCodo || 'Libre'} | Hembra: ${hembra.displasiaCodo || 'Libre'}`,
  };
}

// ==========================================
// 6. Exposiciones y Asignación Automática de Categorías
// ==========================================

export interface CategoriaExpoPOAResult {
  categoriaId: 'SEXTA' | 'QUINTA' | 'CUARTA' | 'TERCERA' | 'SEGUNDA' | 'PRIMERA' | 'FUERA_EDAD';
  nombreCategoria: string;
  edadMeses: number;
  claseSugerida: string;
  descripcionReglamentaria: string;
  esSeleccionada: boolean;
}

/**
 * Cruza la fecha de nacimiento del perro con la fecha del torneo para asignar la categoría automáticamente:
 * - Sexta: 6 a 9 meses
 * - Quinta: 9 a 12 meses
 * - Cuarta: 12 a 18 meses
 * - Tercera: 18 a 24 meses
 * - Segunda: > 24 meses sin selección
 * - Primera: > 24 meses con selección (Kkl / Seleccionado de 1ª o 2ª)
 */
export function determinarCategoriaExpoPOA(
  fechaNacimientoPerro?: string,
  fechaTorneoStr?: string,
  calificacionCriaPerro?: string,
  sexoPerro: 'MACHO' | 'HEMBRA' = 'MACHO'
): CategoriaExpoPOAResult {
  const fechaTorneo = fechaTorneoStr ? new Date(fechaTorneoStr) : new Date();

  if (!fechaNacimientoPerro) {
    return {
      categoriaId: 'SEGUNDA',
      nombreCategoria: '2ª Categoría (Adultos)',
      edadMeses: 25,
      claseSugerida: sexoPerro === 'MACHO' ? 'Machos Adultos' : 'Hembras Adultas',
      descripcionReglamentaria: 'Fecha de nacimiento no registrada. Asignada 2ª categoría por defecto.',
      esSeleccionada: false,
    };
  }

  const fNac = new Date(fechaNacimientoPerro);
  if (isNaN(fNac.getTime())) {
    return {
      categoriaId: 'SEGUNDA',
      nombreCategoria: '2ª Categoría (Adultos)',
      edadMeses: 25,
      claseSugerida: sexoPerro === 'MACHO' ? 'Machos Adultos' : 'Hembras Adultas',
      descripcionReglamentaria: 'Fecha inválida.',
      esSeleccionada: false,
    };
  }

  // Cálculo de meses exactos a la fecha de la exposición
  let edadMeses = (fechaTorneo.getFullYear() - fNac.getFullYear()) * 12 + (fechaTorneo.getMonth() - fNac.getMonth());
  if (fechaTorneo.getDate() < fNac.getDate()) {
    edadMeses -= 1;
  }
  edadMeses = Math.max(0, edadMeses);

  const normCalif = (calificacionCriaPerro || '').toLowerCase();
  const tieneSeleccion =
    normCalif.includes('kkl') ||
    normCalif.includes('seleccionado') ||
    normCalif.includes('primera (kkl') ||
    normCalif.includes('segunda (kkl');

  const generoStr = sexoPerro === 'MACHO' ? 'Machos' : 'Hembras';

  if (edadMeses < 6) {
    return {
      categoriaId: 'FUERA_EDAD',
      nombreCategoria: 'Cachorros Menores (Menor a 6 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Menores`,
      descripcionReglamentaria: 'Los cachorros menores de 6 meses no compiten en categorías oficiales POA por puntaje de campeonato.',
      esSeleccionada: false,
    };
  }

  if (edadMeses >= 6 && edadMeses < 9) {
    return {
      categoriaId: 'SEXTA',
      nombreCategoria: '6ª Categoría (6 a 9 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Cachorros`,
      descripcionReglamentaria: 'Cachorros de 6 meses cumplidos a 9 meses no cumplidos el día de la pista.',
      esSeleccionada: false,
    };
  }

  if (edadMeses >= 9 && edadMeses < 12) {
    return {
      categoriaId: 'QUINTA',
      nombreCategoria: '5ª Categoría (9 a 12 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Muy Jóvenes`,
      descripcionReglamentaria: 'Ejemplares de 9 meses cumplidos a 12 meses no cumplidos.',
      esSeleccionada: false,
    };
  }

  if (edadMeses >= 12 && edadMeses < 18) {
    return {
      categoriaId: 'CUARTA',
      nombreCategoria: '4ª Categoría (12 a 18 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Jóvenes`,
      descripcionReglamentaria: 'Ejemplares de 12 meses cumplidos a 18 meses no cumplidos (Placas de cadera preliminares o en trámite).',
      esSeleccionada: false,
    };
  }

  if (edadMeses >= 18 && edadMeses < 24) {
    return {
      categoriaId: 'TERCERA',
      nombreCategoria: '3ª Categoría (18 a 24 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Intermedia / Promesas`,
      descripcionReglamentaria: 'Ejemplares de 18 meses cumplidos a 24 meses no cumplidos.',
      esSeleccionada: false,
    };
  }

  // Mayores de 24 meses
  if (tieneSeleccion) {
    return {
      categoriaId: 'PRIMERA',
      nombreCategoria: '1ª Categoría Seleccionados (Más de 24 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Seleccionados (Adultos)`,
      descripcionReglamentaria: 'Ejemplares de más de 24 meses con Examen de Cría / Körung aprobado (Kkl 1 o Kkl 2). Habilitados para calificación VA (Excelente Superior).',
      esSeleccionada: true,
    };
  } else {
    return {
      categoriaId: 'SEGUNDA',
      nombreCategoria: '2ª Categoría No Seleccionados (Más de 24 meses)',
      edadMeses,
      claseSugerida: `${generoStr} Adultos Sin Selección`,
      descripcionReglamentaria: 'Ejemplares de más de 24 meses sin Examen de Cría aprobado. Máxima calificación alcanzable: Muy Bueno (SG) o Excelente (V) provisorio.',
      esSeleccionada: false,
    };
  }
}

// ==========================================
// 7. Dashboard Anti-Multas POA (Gestión de Plazos)
// ==========================================

export interface TramitePOAPlazo {
  id: string;
  tipoTramite: 'DENUNCIA_SERVICIO' | 'DENUNCIA_NACIMIENTO' | 'INSCRIPCION_CRIA';
  titulo: string;
  entidadNombre: string;
  fechaEventoOrigen: string;
  fechaLimiteFatal: string;
  diasTotalesPlazo: number;
  diasRestantes: number;
  estadoSemaforo: 'VERDE' | 'AMARILLO' | 'ROJO_VENCIDO';
  badgeTexto: string;
  arancelVencidoConRecargo?: number;
  instruccionPOA: string;
}

/**
 * Calcula los plazos y estados de vencimiento para evitar multas oficiales del Club POA:
 * 1. Denuncia de Servicio: 30 días corridos desde la monta.
 * 2. Denuncia de Nacimiento: 10 días corridos desde el parto.
 * 3. Inscripción de Cría (Tatuaje/Chip/Pedigree digital): 70 días corridos desde el nacimiento.
 */
export function calcularPlazosAntiMultasPOA(
  montas: Monta[],
  camadas: Camada[]
): TramitePOAPlazo[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const tramites: TramitePOAPlazo[] = [];

  // 1. Plazos de Denuncia de Servicio (30 días corridos)
  montas.forEach((m) => {
    if (!m.fechaMonta) return;
    const fMonta = new Date(m.fechaMonta);
    if (isNaN(fMonta.getTime())) return;

    // Límite: 30 días
    const fLimite = new Date(fMonta.getTime() + 30 * 86400000);
    const diffMs = fLimite.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(diffMs / 86400000);

    let estadoSemaforo: 'VERDE' | 'AMARILLO' | 'ROJO_VENCIDO' = 'VERDE';
    let badgeTexto = `${diasRestantes} días restantes`;

    if (diasRestantes <= 0) {
      estadoSemaforo = 'ROJO_VENCIDO';
      badgeTexto = `VENCIDO hace ${Math.abs(diasRestantes)} días`;
    } else if (diasRestantes <= 7) {
      estadoSemaforo = 'AMARILLO';
      badgeTexto = `URGENTE (${diasRestantes} días)`;
    }

    tramites.push({
      id: `poa-serv-${m.id}`,
      tipoTramite: 'DENUNCIA_SERVICIO',
      titulo: 'Denuncia de Servicio (Monta)',
      entidadNombre: `${m.hembraNombre} x ${m.machoNombre}`,
      fechaEventoOrigen: m.fechaMonta,
      fechaLimiteFatal: fLimite.toISOString().split('T')[0],
      diasTotalesPlazo: 30,
      diasRestantes,
      estadoSemaforo,
      badgeTexto,
      arancelVencidoConRecargo: diasRestantes <= 0 ? 55600 : undefined,
      instruccionPOA:
        diasRestantes <= 0
          ? 'Plazo fatal vencido: Presentar formulario de servicio con recargo por mora ($55.600 no socio / $27.800 socio).'
          : 'Presentar formulario de servicio numerado antes de cumplirse los 30 días de la monta.',
    });
  });

  // 2. Plazos de Denuncia de Nacimiento (10 días corridos)
  // 3. Plazos de Inscripción de Cría / Pedigree (70 días corridos)
  camadas.forEach((c) => {
    if (!c.fechaNacimiento) return;
    const fNac = new Date(c.fechaNacimiento);
    if (isNaN(fNac.getTime())) return;

    // A) Denuncia de Nacimiento: 10 días
    const fLimiteNac = new Date(fNac.getTime() + 10 * 86400000);
    const diasRestantesNac = Math.ceil((fLimiteNac.getTime() - hoy.getTime()) / 86400000);

    let semNac: 'VERDE' | 'AMARILLO' | 'ROJO_VENCIDO' = 'VERDE';
    let badgeNac = `${diasRestantesNac} días restantes`;

    if (diasRestantesNac <= 0) {
      semNac = 'ROJO_VENCIDO';
      badgeNac = `VENCIDO hace ${Math.abs(diasRestantesNac)} días`;
    } else if (diasRestantesNac <= 3) {
      semNac = 'AMARILLO';
      badgeNac = `CRÍTICO (${diasRestantesNac} días)`;
    }

    tramites.push({
      id: `poa-nac-${c.id}`,
      tipoTramite: 'DENUNCIA_NACIMIENTO',
      titulo: 'Denuncia de Nacimiento (10 días)',
      entidadNombre: c.identificador || 'Camada',
      fechaEventoOrigen: c.fechaNacimiento,
      fechaLimiteFatal: fLimiteNac.toISOString().split('T')[0],
      diasTotalesPlazo: 10,
      diasRestantes: diasRestantesNac,
      estadoSemaforo: semNac,
      badgeTexto: badgeNac,
      arancelVencidoConRecargo: diasRestantesNac <= 0 ? 64400 : undefined,
      instruccionPOA:
        diasRestantesNac <= 0
          ? 'Plazo fatal de 10 días superado: La denuncia tardía abona arancel con recargo ($64.400).'
          : 'El Club POA exige declarar el nacimiento dentro de los primeros 10 días corridos de vida.',
    });

    // B) Inscripción de Cría y Pedigrees (70 días corridos)
    const fLimiteInsc = new Date(fNac.getTime() + 70 * 86400000);
    const diasRestantesInsc = Math.ceil((fLimiteInsc.getTime() - hoy.getTime()) / 86400000);

    let semInsc: 'VERDE' | 'AMARILLO' | 'ROJO_VENCIDO' = 'VERDE';
    let badgeInsc = `${diasRestantesInsc} días restantes`;

    if (diasRestantesInsc <= 0) {
      semInsc = 'ROJO_VENCIDO';
      badgeInsc = `VENCIDO hace ${Math.abs(diasRestantesInsc)} días`;
    } else if (diasRestantesInsc <= 15) {
      semInsc = 'AMARILLO';
      badgeInsc = `PRÓXIMO (${diasRestantesInsc} días)`;
    }

    tramites.push({
      id: `poa-insc-${c.id}`,
      tipoTramite: 'INSCRIPCION_CRIA',
      titulo: 'Inscripción de Cría, Tatuaje & Chip (70 días)',
      entidadNombre: `${c.identificador} (${c.totalCachorros} cachorros)`,
      fechaEventoOrigen: c.fechaNacimiento,
      fechaLimiteFatal: fLimiteInsc.toISOString().split('T')[0],
      diasTotalesPlazo: 70,
      diasRestantes: diasRestantesInsc,
      estadoSemaforo: semInsc,
      badgeTexto: badgeInsc,
      arancelVencidoConRecargo: diasRestantesInsc <= 0 ? 85600 * c.totalCachorros : undefined,
      instruccionPOA:
        diasRestantesInsc <= 0
          ? 'Plazo superó los 70 días: Aplica arancel de $85.600 por cachorro por mora en libro de cría.'
          : 'Coordinar con inspector de tatuaje o veterinario colocación de microchips antes del día 70.',
    });
  });

  // Ordenar por urgencia (vencidos primero, luego menor cantidad de días restantes)
  return tramites.sort((a, b) => a.diasRestantes - b.diasRestantes);
}
