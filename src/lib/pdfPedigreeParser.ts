import * as pdfjsLib from 'pdfjs-dist';
import { Ejemplar } from '../types';
import { matchDogInList } from './dogUtils';

// Set up pdfjs worker using unpkg or dynamic import to avoid bundler worker build issues
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractedPedigreeData {
  sujeto?: {
    nombre?: string;
    numeroPOA?: string;
    sexo?: 'MACHO' | 'HEMBRA';
    fechaNacimiento?: string;
    tatuaje?: string;
    microchip?: string;
    titulos?: string;
    displasiaCadera?: string;
    displasiaCodo?: string;
    criador?: string;
    propietario?: string;
  };
  padre?: {
    nombre?: string;
    poa?: string;
    titulos?: string;
    displasia?: string;
  };
  madre?: {
    nombre?: string;
    poa?: string;
    titulos?: string;
    displasia?: string;
  };
  abueloPaterno?: {
    nombre?: string;
    poa?: string;
    titulos?: string;
  };
  abuelaPaterna?: {
    nombre?: string;
    poa?: string;
    titulos?: string;
  };
  abueloMaterno?: {
    nombre?: string;
    poa?: string;
    titulos?: string;
  };
  abuelaMaterna?: {
    nombre?: string;
    poa?: string;
    titulos?: string;
  };
  bisabuelos?: {
    pp_p?: string;
    pp_m?: string;
    pm_p?: string;
    pm_m?: string;
    mp_p?: string;
    mp_m?: string;
    mm_p?: string;
    mm_m?: string;
  };
  conteoAntepasadosIdentificados: number;
}

export interface PedigreeParseResult {
  success: boolean;
  data?: ExtractedPedigreeData;
  error?: string;
  rawText?: string;
  matchedFather?: Ejemplar;
  matchedMother?: Ejemplar;
  ancestorsCount: number;
}

/**
 * Extracts plain text from a PDF file using pdfjs-dist in the browser
 */
export async function extractTextFromPDF(file: File | ArrayBuffer): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (err: any) {
    console.warn('pdfjs extraction warning:', err);
    return '';
  }
}

/**
 * Rule-based heuristic fallback parser for POA / FCA / SV pedigrees
 */
export function parsePedigreeRawText(rawText: string): ExtractedPedigreeData {
  const result: ExtractedPedigreeData = {
    sujeto: {},
    padre: {},
    madre: {},
    abueloPaterno: {},
    abuelaPaterna: {},
    abueloMaterno: {},
    abuelaMaterna: {},
    bisabuelos: {},
    conteoAntepasadosIdentificados: 0,
  };

  if (!rawText) return result;

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  // Match POA numbers (POA-12345 or similar)
  const poaMatches = rawText.match(/POA[- \t]*\d{4,6}/gi);
  if (poaMatches && poaMatches.length > 0) {
    result.sujeto!.numeroPOA = poaMatches[0].replace(/\s+/g, '-').toUpperCase();
    if (poaMatches.length > 1) {
      result.padre!.poa = poaMatches[1].replace(/\s+/g, '-').toUpperCase();
    }
    if (poaMatches.length > 2) {
      result.madre!.poa = poaMatches[2].replace(/\s+/g, '-').toUpperCase();
    }
  }

  // Match Microchip (15 digits)
  const chipMatch = rawText.match(/\b\d{15}\b/);
  if (chipMatch) {
    result.sujeto!.microchip = chipMatch[0];
  }

  // Match Tatuaje (TAT-123 or POA/XXXX)
  const tatMatch = rawText.match(/TAT[- \t]*[A-Z0-9]{3,6}|TATUAJE[: \t]*([A-Z0-9-]+)/i);
  if (tatMatch) {
    result.sujeto!.tatuaje = (tatMatch[1] || tatMatch[0]).trim().toUpperCase();
  }

  // Look for Father / Vater / Sire indicators
  const fatherRegex = /(?:padre|vater|sire)[: \t]+([^\n\r,;]{3,60})/i;
  const fatherMatch = rawText.match(fatherRegex);
  if (fatherMatch) {
    result.padre!.nombre = fatherMatch[1].trim();
  }

  // Look for Mother / Mutter / Dam indicators
  const motherRegex = /(?:madre|mutter|dam)[: \t]+([^\n\r,;]{3,60})/i;
  const motherMatch = rawText.match(motherRegex);
  if (motherMatch) {
    result.madre!.nombre = motherMatch[1].trim();
  }

  // Displasia HD / ED
  if (/HD\s*["']?a["']?\s*normal/i.test(rawText)) {
    result.sujeto!.displasiaCadera = 'HD "a" Normal (Libre)';
  }
  if (/ED\s*["']?0["']?\s*normal/i.test(rawText) || /ED\s*normal/i.test(rawText)) {
    result.sujeto!.displasiaCodo = 'ED "0" Normal (Libre)';
  }

  // Calculate count
  let count = 0;
  if (result.padre?.nombre) count++;
  if (result.madre?.nombre) count++;
  if (result.abueloPaterno?.nombre) count++;
  if (result.abuelaPaterna?.nombre) count++;
  if (result.abueloMaterno?.nombre) count++;
  if (result.abuelaMaterna?.nombre) count++;
  result.conteoAntepasadosIdentificados = count;

  return result;
}

/**
 * Main function: parses a pedigree file (PDF or Image).
 * Combines client-side PDF text extraction and server-side Multimodal AI OCR
 * to guarantee high-accuracy 4-generation pedigree tree mapping.
 */
export async function parsePedigreeFile(
  file: File,
  existingDogs: Ejemplar[] = []
): Promise<PedigreeParseResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  // Convert file to Base64
  const base64: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  let rawClientText = '';
  if (isPdf) {
    try {
      rawClientText = await extractTextFromPDF(file);
    } catch (e) {
      console.warn('Client-side pdf extraction failed:', e);
    }
  }

  // Attempt server-side Gemini 2.5 Flash OCR extraction
  try {
    const res = await fetch('/api/extract-pedigree-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data as ExtractedPedigreeData;

        // Match father & mother in breeder's existing dogs
        const matchedFather = matchDogInList(data.padre?.nombre, data.padre?.poa, existingDogs);
        const matchedMother = matchDogInList(data.madre?.nombre, data.madre?.poa, existingDogs);

        // Count identified ancestors
        let count = 0;
        if (data.padre?.nombre) count++;
        if (data.madre?.nombre) count++;
        if (data.abueloPaterno?.nombre) count++;
        if (data.abuelaPaterna?.nombre) count++;
        if (data.abueloMaterno?.nombre) count++;
        if (data.abuelaMaterna?.nombre) count++;
        if (data.bisabuelos) {
          Object.values(data.bisabuelos).forEach((val) => {
            if (val && typeof val === 'string' && val.trim().length > 1) {
              count++;
            }
          });
        }

        data.conteoAntepasadosIdentificados = Math.max(
          data.conteoAntepasadosIdentificados || 0,
          count
        );

        return {
          success: true,
          data,
          matchedFather,
          matchedMother,
          ancestorsCount: data.conteoAntepasadosIdentificados,
          rawText: rawClientText,
        };
      }
    }
  } catch (err: any) {
    console.warn('Server pedigree OCR extraction error, attempting client fallback:', err);
  }

  // Fallback to client-side text parsing if server fails or is unreachable
  if (rawClientText) {
    const fallbackData = parsePedigreeRawText(rawClientText);
    const matchedFather = matchDogInList(fallbackData.padre?.nombre, fallbackData.padre?.poa, existingDogs);
    const matchedMother = matchDogInList(fallbackData.madre?.nombre, fallbackData.madre?.poa, existingDogs);

    return {
      success: true,
      data: fallbackData,
      matchedFather,
      matchedMother,
      ancestorsCount: fallbackData.conteoAntepasadosIdentificados,
      rawText: rawClientText,
    };
  }

  return {
    success: false,
    error: 'No se pudo extraer la información del documento de pedigree. Verifique que el archivo sea legible.',
    ancestorsCount: 0,
  };
}
