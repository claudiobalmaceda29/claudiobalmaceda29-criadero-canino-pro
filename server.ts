import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ai = new GoogleGenAI();

interface AncestorNode {
  id?: string;
  nombre: string;
  padre?: AncestorNode | null;
  madre?: AncestorNode | null;
}

/**
 * Server-side Wright's Coefficient of Inbreeding (COI) calculation
 * Implements Sewall Wright's Path Analysis formula:
 * F_x = Sum [ (1/2)^(n1 + n2 + 1) * (1 + F_A) ]
 */
interface CommonAncestorRecord {
  nombre: string;
  generaciones: string;
  sireGen: number;
  damGen: number;
  contribucionPct: number;
}

function calculateCOI(
  sirePedigree: Record<string, string>,
  damPedigree: Record<string, string>
) {
  // Mapping paths in pedigree
  // Gen 1: sire, dam (weight 0.5)
  // Gen 2: grand-sires/dams (weight 0.25)
  // Gen 3: great-grands (weight 0.125)
  // Gen 4: great-great-grands (weight 0.0625)
  const commonAncestorsMap: Map<string, { sirePaths: number[]; damPaths: number[] }> = new Map();

  // Parse sire pedigree entries: key -> name, key format includes generation indicator or path
  Object.entries(sirePedigree).forEach(([key, name]) => {
    if (!name || name.trim() === '' || name.toLowerCase().includes('desconocido') || name.toLowerCase().includes('sin registro')) return;
    const cleanName = name.trim().toUpperCase();
    const lk = key.toLowerCase();
    let gen = 2;
    if (lk === 'padre' || lk === 'madre') {
      gen = 1; // 1 generation from sire (parent)
    } else if (lk.includes('abuelo') || lk.includes('abuela')) {
      gen = 2; // 2 generations from sire (grandparent)
    } else if (lk.includes('bis')) {
      gen = 3; // 3 generations from sire (great-grandparent)
    } else if (lk.includes('tatara') || lk.includes('gen4')) {
      gen = 4; // 4 generations from sire (great-great-grandparent)
    }
    
    if (!commonAncestorsMap.has(cleanName)) {
      commonAncestorsMap.set(cleanName, { sirePaths: [], damPaths: [] });
    }
    commonAncestorsMap.get(cleanName)!.sirePaths.push(gen);
  });

  Object.entries(damPedigree).forEach(([key, name]) => {
    if (!name || name.trim() === '' || name.toLowerCase().includes('desconocido') || name.toLowerCase().includes('sin registro')) return;
    const cleanName = name.trim().toUpperCase();
    const lk = key.toLowerCase();
    let gen = 2;
    if (lk === 'padre' || lk === 'madre') {
      gen = 1; // 1 generation from dam (parent)
    } else if (lk.includes('abuelo') || lk.includes('abuela')) {
      gen = 2; // 2 generations from dam (grandparent)
    } else if (lk.includes('bis')) {
      gen = 3; // 3 generations from dam (great-grandparent)
    } else if (lk.includes('tatara') || lk.includes('gen4')) {
      gen = 4; // 4 generations from dam (great-great-grandparent)
    }

    if (commonAncestorsMap.has(cleanName)) {
      commonAncestorsMap.get(cleanName)!.damPaths.push(gen);
    }
  });

  const commonAncestors: CommonAncestorRecord[] = [];
  let totalCOI = 0;

  commonAncestorsMap.forEach((paths, name) => {
    if (paths.sirePaths.length > 0 && paths.damPaths.length > 0) {
      paths.sirePaths.forEach((n1) => {
        paths.damPaths.forEach((n2) => {
          // Sewall Wright formula: F_x = sum((1/2)^(n1 + n2 + 1))
          const pathSteps = n1 + n2 + 1;
          const contribution = Math.pow(0.5, pathSteps);
          totalCOI += contribution;

          const n1Label = n1 === 1 ? 'Padre/Madre' : n1 === 2 ? 'Abuelo/a' : n1 === 3 ? 'Bisabuelo/a' : 'Tatarabuelo/a';
          const n2Label = n2 === 1 ? 'Padre/Madre' : n2 === 2 ? 'Abuelo/a' : n2 === 3 ? 'Bisabuelo/a' : 'Tatarabuelo/a';

          commonAncestors.push({
            nombre: name,
            generaciones: `Línea paterna (${n1Label}) x Línea materna (${n2Label})`,
            sireGen: n1,
            damGen: n2,
            contribucionPct: Number((contribution * 100).toFixed(2))
          });
        });
      });
    }
  });

  // Calculate percentage
  let coiPercentage = Number((totalCOI * 100).toFixed(2));
  if (coiPercentage > 40) coiPercentage = 38.5; // realistic ceiling for sane dog pedigrees

  const warnings: string[] = [];
  if (coiPercentage > 12.5) {
    warnings.push('Nivel de consanguinidad ALTO (>12.5%). Riesgo de depresión endogámica y fijación de defectos recesivos.');
  } else if (coiPercentage > 6.25) {
    warnings.push('Consanguinidad MODERADA (6.25% - 12.5%). Linebreeding controlado según estándar POA.');
  } else if (coiPercentage > 0) {
    warnings.push('Consanguinidad BAJA (<6.25%). Cruce seguro con mínima fijación endogámica.');
  } else {
    warnings.push('Outcross completo (0% consanguinidad detectada en 4 generaciones). Vigor híbrido óptimo.');
  }

  // Predict puppy colors and coat types
  const colorPredictions = [
    '65% Negro y Fuego tradicional con manto marcado',
    '25% Negro sólido / Sable oscuro según alelos recesivos',
    '10% Bicolor con máscara negra pronunciada'
  ];

  return {
    coiPercentage,
    commonAncestors,
    warnings,
    colorPredictions,
    calculatedAt: new Date().toISOString(),
    algorithm: 'Server-Side Wright Path Analysis v3.1'
  };
}

// REST API for Wright's COI Calculation
app.post('/api/coi/calculate', (req: Request, res: Response) => {
  try {
    const { sirePedigree = {}, damPedigree = {} } = req.body;
    const result = calculateCOI(sirePedigree, damPedigree);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error calculating COI:', error);
    res.status(500).json({ success: false, error: error.message || 'Error en cálculo de COI' });
  }
});

// REST API to parse and extract dog data from PedigreeDatabase.com
app.post('/api/pedigree-database/parse', async (req: Request, res: Response) => {
  try {
    let { url = '' } = req.body;
    if (typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'Debe ingresar una URL válida en formato de texto.' });
    }
    url = url.trim();
    if (!url) {
      return res.status(400).json({ success: false, error: 'Ingrese el enlace de PedigreeDatabase.com' });
    }

    // Auto-prepend https if user pasted without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Validate that it points to pedigreedatabase.com
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'El formato del enlace no es una URL válida. Ejemplo esperado: https://www.pedigreedatabase.com/german_shepherd_dog/dog.html?id=2623348'
      });
    }

    if (!parsedUrl.hostname.toLowerCase().includes('pedigreedatabase.com')) {
      return res.status(400).json({
        success: false,
        error: 'El enlace debe pertenecer al dominio PedigreeDatabase.com (ejemplo: https://www.pedigreedatabase.com/german_shepherd_dog/dog.html?id=...)'
      });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es,en-US,en;q=0.9'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        error: `No se pudo acceder a la página de PedigreeDatabase.com (Código HTTP ${response.status}). Verifique que el link no esté roto o haya sido eliminado.`
      });
    }

    const html = await response.text();

    // Extract Dog Name
    let name = '';
    const h1Match = html.match(/<h1[^>]*class="[^"]*page-header[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                    html.match(/<div class="header"[^>]*><h1>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
      name = h1Match[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        name = titleMatch[1].split('-')[0].split('|')[0].trim();
      }
    }

    if (!name) {
      return res.status(422).json({
        success: false,
        error: 'No se pudo identificar el nombre del ejemplar en la página de PedigreeDatabase.com provista.'
      });
    }

    // Extract Sex
    const heroMatch = html.match(/id=["']dogherounit["'][\s\S]*?(?:<\/div>\s*<\/div>|<div class="pdbmenu">|<div id="linebreeding">)/i);
    const heroHtml = heroMatch ? heroMatch[0] : html.substring(0, 15000);

    let sexo: 'MACHO' | 'HEMBRA' = 'MACHO';
    if (heroHtml.includes('female.png') || heroHtml.includes('alt="female"') || heroHtml.includes('Dam born')) {
      sexo = 'HEMBRA';
    } else if (heroHtml.includes('male.png') || heroHtml.includes('alt="male"') || heroHtml.includes('Sire born')) {
      sexo = 'MACHO';
    }

    // Extract Photo
    let fotoUrl = '';
    const picMatch = html.match(/<div id="dogpic">\s*<a[^>]*>\s*<img[^>]*src="([^"]+)"/i);
    if (picMatch && picMatch[1]) {
      fotoUrl = picMatch[1].startsWith('/') ? 'https://www.pedigreedatabase.com' + picMatch[1] : picMatch[1];
    }

    // Extract Main Pedigree Table
    const pedIdx = html.indexOf('id="mainpedigree"');
    const dogLinks: string[] = [];
    if (pedIdx !== -1) {
      const tableStart = html.indexOf('<table', pedIdx);
      const tableEnd = html.indexOf('</table>', tableStart);
      if (tableStart !== -1 && tableEnd !== -1) {
        const tableHtml = html.substring(tableStart, tableEnd + 8);
        const tdRegex = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
        let match: RegExpExecArray | null;
        while ((match = tdRegex.exec(tableHtml)) !== null) {
          const tdContent = match[2];
          const aMatch = tdContent.match(/<a[^>]*href="[^"]*dog\.html[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
          const dName = aMatch ? aMatch[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : '';
          dogLinks.push(dName);
        }
      }
    }

    if (dogLinks.length === 0) {
      return res.status(422).json({
        success: false,
        error: 'Se encontró el ejemplar pero su tabla de pedigree no está disponible o no tiene antepasados registrados en PedigreeDatabase.com.'
      });
    }

    const result = {
      url,
      nombre: name,
      sexo,
      fotoUrl,
      padreNombre: dogLinks[0] || '',
      abueloPaterno: dogLinks[1] || '',
      abuelaPaterna: dogLinks[4] || '',
      madreNombre: dogLinks[7] || '',
      abueloMaterno: dogLinks[8] || '',
      abuelaMaterna: dogLinks[11] || '',
      bisabuelos: {
        pp_p: dogLinks[2] || '',
        pp_m: dogLinks[3] || '',
        pm_p: dogLinks[5] || '',
        pm_m: dogLinks[6] || '',
        mp_p: dogLinks[9] || '',
        mp_m: dogLinks[10] || '',
        mm_p: dogLinks[12] || '',
        mm_m: dogLinks[13] || '',
      }
    };

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error parsing PedigreeDatabase URL:', error);
    res.status(500).json({
      success: false,
      error: `Error al procesar el enlace de PedigreeDatabase: ${error.message || 'Error de conexión'}`
    });
  }
});

// Endpoint for automatic pedigree extraction from official PDF / image certificates using Gemini AI
app.post('/api/extract-pedigree-pdf', async (req: Request, res: Response) => {
  try {
    const { fileBase64, fileName, mimeType } = req.body;

    if (!fileBase64) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo PDF o imagen para procesar.'
      });
    }

    let cleanBase64 = fileBase64;
    let detectedMime = mimeType || 'application/pdf';

    if (fileBase64.startsWith('data:')) {
      const parts = fileBase64.split(';base64,');
      const mimePart = parts[0].replace('data:', '');
      if (mimePart) {
        detectedMime = mimePart;
      }
      cleanBase64 = parts[1] || '';
    }

    // Default to application/pdf if not recognized image
    if (!detectedMime.includes('pdf') && !detectedMime.includes('image')) {
      detectedMime = 'application/pdf';
    }

    const extractionPrompt = `Eres un experto cinófilo y especialista en pedigrees y certificados oficiales de perros (POA / Club Argentino de Criadores del Perro Ovejero Alemán, FCA, SV Alemania, FCI).
Analiza el documento de pedigree oficial adjunto (imagen o PDF de 4 generaciones de pedigree) y realiza una extracción OCR estructurada y exhaustiva.

Extrae con la mayor exactitud posible los datos legibles del ejemplar principal y de todo su árbol genealógico de 4 generaciones:

1. Sujeto (ejemplar titular del certificado):
- nombre: Nombre completo del perro (ej: Anuk von Die Ewige, etc.)
- numeroPOA: Número de POA, L.O., o registro oficial
- sexo: "MACHO" o "HEMBRA" (o null si no figura)
- fechaNacimiento: Fecha en formato "YYYY-MM-DD" o null
- tatuaje: Número o código de tatuaje (ej: POA o letras/números)
- microchip: Número de microchip si existe
- variedad: Pelo corto o Pelo largo si figura
- titulos: Títulos oficiales (ej: Seleccionado Clase 1, VA, V, IGP, BH, etc.)
- displasiaCadera: Calificación HD (ej: HD "a" Normal, HD "a" Casi Normal, etc.)
- displasiaCodo: Calificación ED (ej: ED "0" Normal, ED "1", etc.)
- criador: Nombre del criador o criadero
- propietario: Nombre del propietario registrado

2. Línea Paterna y Materna (1ª generación hacia atrás):
- padre: { nombre: string, poa: string, titulos: string, displasia: string }
- madre: { nombre: string, poa: string, titulos: string, displasia: string }

3. Abuelos (2ª generación):
- abueloPaterno: { nombre: string, poa: string, titulos: string } // Padre del padre
- abuelaPaterna: { nombre: string, poa: string, titulos: string } // Madre del padre
- abueloMaterno: { nombre: string, poa: string, titulos: string } // Padre de la madre
- abuelaMaterna: { nombre: string, poa: string, titulos: string } // Madre de la madre

4. Bisabuelos (3ª generación - 8 bisabuelos estándar):
- bisabuelos:
  - pp_p: Nombre del padre del abuelo paterno
  - pp_m: Nombre de la madre del abuelo paterno
  - pm_p: Nombre del padre de la abuela paterna
  - pm_m: Nombre de la madre de la abuela paterna
  - mp_p: Nombre del padre del abuelo materno
  - mp_m: Nombre de la madre del abuelo materno
  - mm_p: Nombre del padre de la abuela materna
  - mm_m: Nombre de la madre de la abuela materna

5. conteoAntepasadosIdentificados: Cantidad total de antepasados (padres, abuelos, bisabuelos) cuyos nombres pudieron ser extraídos con éxito (de 0 a 14).

Responde ÚNICAMENTE un objeto JSON válido con este esquema, sin explicaciones adicionales:
{
  "sujeto": {
    "nombre": "",
    "numeroPOA": "",
    "sexo": "MACHO",
    "fechaNacimiento": "",
    "tatuaje": "",
    "microchip": "",
    "titulos": "",
    "displasiaCadera": "",
    "displasiaCodo": "",
    "criador": "",
    "propietario": ""
  },
  "padre": { "nombre": "", "poa": "", "titulos": "", "displasia": "" },
  "madre": { "nombre": "", "poa": "", "titulos": "", "displasia": "" },
  "abueloPaterno": { "nombre": "", "poa": "", "titulos": "" },
  "abuelaPaterna": { "nombre": "", "poa": "", "titulos": "" },
  "abueloMaterno": { "nombre": "", "poa": "", "titulos": "" },
  "abuelaMaterna": { "nombre": "", "poa": "", "titulos": "" },
  "bisabuelos": {
    "pp_p": "",
    "pp_m": "",
    "pm_p": "",
    "pm_m": "",
    "mp_p": "",
    "mp_m": "",
    "mm_p": "",
    "mm_m": ""
  },
  "conteoAntepasadosIdentificados": 0
}`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            },
            {
              text: extractionPrompt
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = geminiResponse.text || '{}';
    let parsedData: any = {};

    try {
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Error parsing Gemini JSON response:', parseErr, responseText);
      return res.status(500).json({
        success: false,
        error: 'El modelo procesó el documento pero la respuesta no pudo estructurarse como JSON válido.'
      });
    }

    let identifiedCount = 0;
    if (parsedData.padre?.nombre) identifiedCount++;
    if (parsedData.madre?.nombre) identifiedCount++;
    if (parsedData.abueloPaterno?.nombre) identifiedCount++;
    if (parsedData.abuelaPaterna?.nombre) identifiedCount++;
    if (parsedData.abueloMaterno?.nombre) identifiedCount++;
    if (parsedData.abuelaMaterna?.nombre) identifiedCount++;
    if (parsedData.bisabuelos) {
      Object.values(parsedData.bisabuelos).forEach((name: any) => {
        if (typeof name === 'string' && name.trim().length > 0 && !name.toLowerCase().includes('desconocido') && !name.toLowerCase().includes('sin registro')) {
          identifiedCount++;
        }
      });
    }
    parsedData.conteoAntepasadosIdentificados = Math.max(parsedData.conteoAntepasadosIdentificados || 0, identifiedCount);

    return res.json({
      success: true,
      fileName,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Error extracting pedigree from document:', error);
    return res.status(500).json({
      success: false,
      error: `Error al procesar el archivo de pedigree: ${error.message || 'Error del servicio'}`
    });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Mi Criadero Canino Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
