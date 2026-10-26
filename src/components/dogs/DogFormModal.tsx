import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ejemplar, Sexo, EstadoReproductivo, EstadoEjemplar, CalificacionDisplasiaCadera, CalificacionDisplasiaCodo } from '../../types';
import { X, Dog, Save, Image, Check, Upload, Camera, CheckCircle2, Loader2, Trash2, Cloud, Globe, ExternalLink, Download, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { uploadDogPhoto, db, auth } from '../../lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { cleanForFirestore } from '../../lib/dogUtils';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Configure pdfjs-dist worker for browser execution
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface DogFormModalProps {
  dog?: Ejemplar | null;
  onClose: () => void;
}

/**
 * Calculates exact age in years, months and days from a birth date string
 */
export function calculateExactAge(birthDateStr?: string): string {
  if (!birthDateStr || !birthDateStr.trim()) return '0a';

  const parts = birthDateStr.split('T')[0].split('-');
  if (parts.length < 3) return '0a';

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1;
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return '0a';

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  let years = currentYear - birthYear;
  let months = currentMonth - birthMonth;
  let days = currentDay - birthDay;

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return 'Recién nacido';

  if (years === 0) {
    if (months === 0) {
      const weeks = Math.max(1, Math.floor(days / 7));
      return days < 7 ? `${days} ${days === 1 ? 'día' : 'días'}` : `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    }
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  const yearsStr = `${years} ${years === 1 ? 'año' : 'años'}`;
  return months > 0 ? `${yearsStr}, ${months}m` : yearsStr;
}

export const DogFormModal: React.FC<DogFormModalProps> = ({ dog, onClose }) => {
  const {
    addEjemplar,
    updateEjemplar,
    currentCriaderoId,
    currentCriadero,
    currentUser,
    parsePedigreeDatabaseUrl,
    ejemplares,
  } = useApp();

  const [activeFormTab, setActiveFormTab] = useState<'DATOS' | 'GENEALOGIA' | 'SANIDAD'>('DATOS');

  // Submit & Loading UX States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pedigree Extraction Feedback States
  const [pdfExtractionSuccess, setPdfExtractionSuccess] = useState<string | null>(null);
  const [pdfExtractionError, setPdfExtractionError] = useState<string | null>(null);

  // Form states
  const [nombreCompleto, setNombreCompleto] = useState(dog?.nombreCompleto || '');
  const [afijo, setAfijo] = useState(dog?.afijo || currentCriadero?.afijo || '');
  const [sexo, setSexo] = useState<Sexo>(dog?.sexo || 'MACHO');
  const [raza, setRaza] = useState(dog?.raza || 'Ovejero Alemán (Pastor Alemán)');
  const [fechaNacimiento, setFechaNacimiento] = useState(dog?.fechaNacimiento || '2023-01-01');
  const [numeroPOA, setNumeroPOA] = useState(dog?.numeroPOA || '');
  const [microchip, setMicrochip] = useState(dog?.microchip || '');
  const [tatuaje, setTatuaje] = useState(dog?.tatuaje || '');
  const [identificacionInterna, setIdentificacionInterna] = useState(dog?.identificacionInterna || '');
  const [color, setColor] = useState(dog?.color || 'Negro y Fuego');
  const [pelo, setPelo] = useState<'CORTO' | 'LARGO' | 'MEDIO'>(dog?.pelo || 'CORTO');
  const [estadoReproductivo, setEstadoReproductivo] = useState<EstadoReproductivo>(dog?.estadoReproductivo || 'ACTIVO');
  const [estado, setEstado] = useState<EstadoEjemplar>(dog?.estado || 'ACTIVO');
  const [fotoUrl, setFotoUrl] = useState(dog?.fotoUrl || '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [photoSource, setPhotoSource] = useState<'storage' | 'local' | 'external'>(
    dog?.fotoUrl ? (dog.fotoUrl.includes('firebasestorage') ? 'storage' : 'external') : 'external'
  );
  const [showManualUrl, setShowManualUrl] = useState(false);

  // Pedigree Document (PDF or Image)
  const [pedigreeDocUrl, setPedigreeDocUrl] = useState(dog?.pedigreeDocUrl || '');
  const [pedigreeDocNombre, setPedigreeDocNombre] = useState(dog?.pedigreeDocNombre || '');
  const [pedigreeDocTipo, setPedigreeDocTipo] = useState<'PDF' | 'IMAGEN' | undefined>(dog?.pedigreeDocTipo);
  const [pedigreeDocSize, setPedigreeDocSize] = useState(dog?.pedigreeDocSize || '');
  const [pedigreeDocFecha, setPedigreeDocFecha] = useState(dog?.pedigreeDocFecha || '');

  // PedigreeDatabase.com integration state
  const [pedigreeDatabaseUrl, setPedigreeDatabaseUrl] = useState(dog?.pedigreeDatabaseUrl || '');
  const [isFetchingPedigreeDb, setIsFetchingPedigreeDb] = useState(false);
  const [pedigreeDbSuccess, setPedigreeDbSuccess] = useState<string | null>(null);
  const [pedigreeDbError, setPedigreeDbError] = useState<string | null>(null);

  // Pedigree fields & Ancestor IDs
  const [padreNombre, setPadreNombre] = useState(dog?.padreNombre || '');
  const [padreId, setPadreId] = useState(dog?.padreId || '');
  const [madreNombre, setMadreNombre] = useState(dog?.madreNombre || '');
  const [madreId, setMadreId] = useState(dog?.madreId || '');
  const [abueloPaterno, setAbueloPaterno] = useState(dog?.abueloPaterno || '');
  const [abuelaPaterna, setAbuelaPaterna] = useState(dog?.abuelaPaterna || '');
  const [abueloMaterno, setAbueloMaterno] = useState(dog?.abueloMaterno || '');
  const [abuelaMaterna, setAbuelaMaterna] = useState(dog?.abuelaMaterna || '');

  // Great-grandparents (bisabuelos)
  const [bisabuelos, setBisabuelos] = useState<Ejemplar['bisabuelos']>(dog?.bisabuelos || {});

  // Distinct Afijos for suggestions
  const availableAfijos = useMemo(() => {
    const list: string[] = [];
    if (currentCriadero?.afijo) list.push(currentCriadero.afijo.toUpperCase());
    ejemplares.forEach((e) => {
      if (e.afijo && e.afijo.trim() && !list.includes(e.afijo.trim().toUpperCase())) {
        list.push(e.afijo.trim().toUpperCase());
      }
    });
    return list;
  }, [currentCriadero, ejemplares]);

  // Hybrid OCR: Extracts text from PDF (using pdfjs-dist) or Image (using Tesseract.js), then parses with Regex
  const handleProcessPedigreeFile = async (file: File) => {
    setOcrLoading(true);
    setPdfExtractionError(null);
    setPdfExtractionSuccess(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const docType: 'PDF' | 'IMAGEN' = isPdf ? 'PDF' : 'IMAGEN';
    const docSize = `${(file.size / 1024).toFixed(0)} KB`;
    const docDate = new Date().toISOString().split('T')[0];

    // Read file as base64 to keep it attached to the dog record
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setPedigreeDocUrl(ev.target.result as string);
        setPedigreeDocNombre(file.name);
        setPedigreeDocTipo(docType);
        setPedigreeDocSize(docSize);
        setPedigreeDocFecha(docDate);
      }
    };
    reader.readAsDataURL(file);

    try {
      let extractedText = '';

      if (isPdf) {
        // Extract plain text from PDF pages using pdfjs-dist
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        let pdfTextAccumulator = '';

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageItems = textContent.items.map((item: any) => item.str || '').join(' ');
          pdfTextAccumulator += pageItems + '\n';
        }
        extractedText = pdfTextAccumulator;
      } else {
        // Extract text from Image file using Tesseract.js
        const tesseractResult = await Tesseract.recognize(file, 'spa+eng');
        extractedText = tesseractResult.data.text || '';
      }

      if (!extractedText.trim()) {
        throw new Error('No se pudo extraer texto legible del documento seleccionado.');
      }

      // Regex matching for POA/FCA/SZ/LOI/LOE pedigrees and kennel affixes
      const regPattern = /(?:POA|FCA|SZ|LOI|LOE)\s*\d+[\s\n]+([A-Z][A-Z\s]+(?:VON|DEL|DE|DEI|VOM|TEAM)[\sA-Z]+)/gi;
      const matchedAncestors: string[] = [];
      let match: RegExpExecArray | null;

      while ((match = regPattern.exec(extractedText)) !== null) {
        if (match[1]) {
          const cleanedName = match[1].replace(/\s+/g, ' ').trim();
          if (cleanedName.length > 3 && !matchedAncestors.includes(cleanedName)) {
            matchedAncestors.push(cleanedName);
          }
        }
      }

      // Additional regex fallbacks for explicit Sire / Dam / Grandparents
      const sireRegex = /(?:padre|vater|sire)[:\s]+([A-Z][A-Za-z\s'´-]+(?:von|del|de|vom|team)?[A-Za-z\s'´-]+)/i;
      const damRegex = /(?:madre|mutter|dam)[:\s]+([A-Z][A-Za-z\s'´-]+(?:von|del|de|vom|team)?[A-Za-z\s'´-]+)/i;
      const sireMatch = extractedText.match(sireRegex);
      const damMatch = extractedText.match(damRegex);

      let foundSire = sireMatch ? sireMatch[1].trim() : (matchedAncestors[0] || '');
      let foundDam = damMatch ? damMatch[1].trim() : (matchedAncestors[1] || '');
      let foundGp1 = matchedAncestors[2] || '';
      let foundGp2 = matchedAncestors[3] || '';
      let foundGm1 = matchedAncestors[4] || '';
      let foundGm2 = matchedAncestors[5] || '';

      let identifiedCount = 0;

      // Map Sire (Padre)
      if (foundSire) {
        setPadreNombre(foundSire);
        identifiedCount++;
        const matched = ejemplares.find(
          (e) =>
            e.sexo === 'MACHO' &&
            (e.nombreCompleto.toLowerCase().trim() === foundSire.toLowerCase().trim() ||
              e.nombreCompleto.toLowerCase().includes(foundSire.toLowerCase()) ||
              foundSire.toLowerCase().includes(e.nombreCompleto.toLowerCase()))
        );
        if (matched) setPadreId(matched.id);
      }

      // Map Dam (Madre)
      if (foundDam) {
        setMadreNombre(foundDam);
        identifiedCount++;
        const matched = ejemplares.find(
          (e) =>
            e.sexo === 'HEMBRA' &&
            (e.nombreCompleto.toLowerCase().trim() === foundDam.toLowerCase().trim() ||
              e.nombreCompleto.toLowerCase().includes(foundDam.toLowerCase()) ||
              foundDam.toLowerCase().includes(e.nombreCompleto.toLowerCase()))
        );
        if (matched) setMadreId(matched.id);
      }

      // Map Grandparents (Abuelos)
      if (foundGp1) {
        setAbueloPaterno(foundGp1);
        identifiedCount++;
      }
      if (foundGp2) {
        setAbuelaPaterna(foundGp2);
        identifiedCount++;
      }
      if (foundGm1) {
        setAbueloMaterno(foundGm1);
        identifiedCount++;
      }
      if (foundGm2) {
        setAbuelaMaterna(foundGm2);
        identifiedCount++;
      }

      // Extract subject POA, Chip or Tattoo if available
      const poaMatch = extractedText.match(/(?:POA|FCA)[-\s]*(\d{4,7})/i);
      if (poaMatch && (!numeroPOA || !numeroPOA.trim())) {
        setNumeroPOA(`POA-${poaMatch[1]}`);
      }

      const chipMatch = extractedText.match(/\b\d{15}\b/);
      if (chipMatch && (!microchip || !microchip.trim())) {
        setMicrochip(chipMatch[0]);
      }

      const tatMatch = extractedText.match(/TAT[-:\s]*([A-Z0-9]{3,6})/i);
      if (tatMatch && (!tatuaje || !tatuaje.trim())) {
        setTatuaje(tatMatch[1]);
      }

      // Extract HD/ED if detected
      if (/HD\s*["']?a["']?\s*normal/i.test(extractedText)) {
        setDisplasiaCadera('HD "a" Normal (Libre)');
      }
      if (/ED\s*["']?0["']?\s*normal/i.test(extractedText)) {
        setDisplasiaCodo('ED "0" Normal (Libre)');
      }

      // Extract Afijo if present
      const afijoMatch = extractedText.match(/(?:VON|VOM|DEL|DE|DEI|TEAM)\s+([A-Z\s]{3,25})/i);
      if (afijoMatch && (!afijo || !afijo.trim())) {
        setAfijo(afijoMatch[0].trim().toUpperCase());
      }

      setPdfExtractionSuccess(
        `¡OCR completado con éxito (${isPdf ? 'pdf.js' : 'Tesseract'})! Se autocompletaron ${identifiedCount} antepasados del pedigree y se adjuntó el archivo.`
      );
      setActiveFormTab('GENEALOGIA');
    } catch (err: any) {
      console.error('Error en OCR de pedigree:', err);
      setPdfExtractionError('Error en lectura OCR: ' + (err.message || 'Intente nuevamente con una imagen o PDF más claro.'));
    } finally {
      setOcrLoading(false);
    }
  };

  const handleImportFromPedigreeDb = async () => {
    if (!pedigreeDatabaseUrl.trim()) return;
    setIsFetchingPedigreeDb(true);
    setPedigreeDbError(null);
    setPedigreeDbSuccess(null);
    try {
      const res = await parsePedigreeDatabaseUrl(pedigreeDatabaseUrl.trim());
      if (!res.success || !res.data) {
        setPedigreeDbError(res.error || 'No se pudo leer la información de PedigreeDatabase.com');
        return;
      }
      const data = res.data;
      if (data.nombre && (!nombreCompleto || nombreCompleto.trim() === '')) {
        setNombreCompleto(data.nombre);
      }
      if (data.sexo && (!dog || !nombreCompleto)) {
        setSexo(data.sexo);
      }
      if (data.fotoUrl && !fotoUrl) {
        setFotoUrl(data.fotoUrl);
      }
      if (data.padreNombre) setPadreNombre(data.padreNombre);
      if (data.madreNombre) setMadreNombre(data.madreNombre);
      if (data.abueloPaterno) setAbueloPaterno(data.abueloPaterno);
      if (data.abuelaPaterna) setAbuelaPaterna(data.abuelaPaterna);
      if (data.abueloMaterno) setAbueloMaterno(data.abueloMaterno);
      if (data.abuelaMaterna) setAbuelaMaterna(data.abuelaMaterna);
      if (data.bisabuelos) setBisabuelos(data.bisabuelos);

      setPedigreeDbSuccess(`¡Genealogía importada con éxito de "${data.nombre}"!`);
    } catch (err: any) {
      setPedigreeDbError('Error de conexión con PedigreeDatabase: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setIsFetchingPedigreeDb(false);
    }
  };

  // Health and POA
  const [calificacionCria, setCalificacionCria] = useState(dog?.calificacionCria || 'Seleccionado de Primera (Kkl 1)');
  const [displasiaCadera, setDisplasiaCadera] = useState<CalificacionDisplasiaCadera>(
    dog?.displasiaCadera || 'HD "a" Normal (Libre)'
  );
  const [displasiaCodo, setDisplasiaCodo] = useState<CalificacionDisplasiaCodo>(
    dog?.displasiaCodo || 'ED "0" Normal (Libre)'
  );
  const [adn, setAdn] = useState(dog?.adn || 'Comprobado (DNA gpr.)');
  const [titulosRaw, setTitulosRaw] = useState((dog?.titulos || []).join(', '));
  const [observaciones, setObservaciones] = useState(dog?.observaciones || '');

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const res = await uploadDogPhoto(file, nombreCompleto || 'ejemplar');
      setFotoUrl(res.url);
      setPhotoSource(res.source);
      setUploadSuccess(
        res.source === 'storage'
          ? '¡Fotografía subida a Firebase Storage exitosamente!'
          : '¡Fotografía procesada y almacenada en persistencia local!'
      );
    } catch (err: any) {
      setUploadError('Error al subir la imagen: ' + (err.message || 'Intente nuevamente'));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || ocrLoading) return;
    setSubmitError(null);

    const cleanName = nombreCompleto.trim();
    if (!cleanName) {
      setSubmitError('El nombre completo del ejemplar es obligatorio.');
      return;
    }

    // Evitar ejemplares duplicados
    const norm = (s?: string) => (s || '').trim().toLowerCase();
    const cleanPOA = norm(numeroPOA);
    const cleanChip = norm(microchip);
    const cleanNameLower = norm(cleanName);

    const isDuplicate = ejemplares.some((existing) => {
      if (dog && existing.id === dog.id) return false;
      if (existing.criaderoId !== currentCriaderoId) return false;
      if (norm(existing.nombreCompleto) === cleanNameLower) return true;
      if (cleanPOA && norm(existing.numeroPOA) === cleanPOA) return true;
      if (cleanChip && norm(existing.microchip) === cleanChip) return true;
      return false;
    });

    if (isDuplicate) {
      setSubmitError(
        'Ya existe un ejemplar registrado con este mismo nombre, número POA o microchip en tu criadero. Evitá crear duplicados.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const titulos = titulosRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const cleanAfijo = afijo.trim() || currentCriadero?.afijo || '';
      const calculatedAge = calculateExactAge(fechaNacimiento);

      // Explicitly prioritize currentUser.uid / currentUser.id for persistence and security rules
      const resolvedCriaderoId =
        (currentUser as any)?.uid ||
        auth.currentUser?.uid ||
        currentUser?.id ||
        currentCriaderoId ||
        'cria-demo';

      const data: Omit<Ejemplar, 'id' | 'createdAt'> = {
        criaderoId: resolvedCriaderoId,
        nombreCompleto: cleanName,
        afijo: cleanAfijo,
        edad: calculatedAge,
        sexo,
        raza: raza.trim(),
        fechaNacimiento,
        numeroPOA: numeroPOA.trim(),
        microchip: microchip.trim(),
        tatuaje: tatuaje.trim(),
        identificacionInterna: identificacionInterna.trim(),
        color: color.trim(),
        pelo,
        estadoReproductivo,
        estado,
        fotoUrl: fotoUrl.trim(),
        pedigreeDatabaseUrl: pedigreeDatabaseUrl.trim() || undefined,
        pedigreeDocUrl: pedigreeDocUrl || undefined,
        pedigreeDocNombre: pedigreeDocNombre || undefined,
        pedigreeDocTipo: pedigreeDocTipo || undefined,
        pedigreeDocSize: pedigreeDocSize || undefined,
        pedigreeDocFecha: pedigreeDocFecha || undefined,
        padreNombre: padreNombre.trim(),
        padreId: padreId || undefined,
        madreNombre: madreNombre.trim(),
        madreId: madreId || undefined,
        abueloPaterno: abueloPaterno.trim(),
        abuelaPaterna: abuelaPaterna.trim(),
        abueloMaterno: abueloMaterno.trim(),
        abuelaMaterna: abuelaMaterna.trim(),
        bisabuelos,
        calificacionCria: calificacionCria.trim(),
        displasiaCadera,
        displasiaCodo,
        adn: adn.trim(),
        titulos,
        observaciones: observaciones.trim(),
      };

      if (dog) {
        // Edit existing dog
        await updateEjemplar(dog.id, data);
        const cleanPayload = cleanForFirestore(data);
        await setDoc(doc(db, 'ejemplares', dog.id), cleanPayload, { merge: true });
      } else {
        // Create new dog with explicit addDoc as requested
        const cleanPayload = cleanForFirestore({
          ...data,
          createdAt: new Date().toISOString(),
        });

        // Write directly to Firestore using addDoc ensuring criaderoId persistence
        const docRef = await addDoc(collection(db, 'ejemplares'), cleanPayload);

        // Update local state / cache in AppContext with exact Firestore doc id
        await addEjemplar({
          ...data,
          id: docRef.id,
          criaderoId: resolvedCriaderoId,
        });
      }

      // Close modal ONLY on successful resolution
      onClose();
    } catch (err: any) {
      console.error('Error saving dog:', err);
      setSubmitError('Ocurrió un error al guardar el ejemplar en Firestore. Verifique su conexión e intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100/70 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Dog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {dog ? 'Editar Ejemplar' : 'Alta de Nuevo Ejemplar'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Criadero: {currentCriadero?.nombre} ({currentCriadero?.afijo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs px-4">
          <button
            type="button"
            onClick={() => setActiveFormTab('DATOS')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeFormTab === 'DATOS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Datos Principales
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('GENEALOGIA')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeFormTab === 'GENEALOGIA'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            2. Genealogía / Padres
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('SANIDAD')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition-colors cursor-pointer ${
              activeFormTab === 'SANIDAD'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            3. Sanidad y POA
          </button>
        </div>

        {/* Form Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Submit Error Banner */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Prominent Smart Pedigree OCR & Autocomplete Banner */}
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-white font-bold text-xs">
                      OCR Híbrido: Autocompletar Genealogía (PDF o Imagen)
                    </strong>
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold text-[9px]">
                      pdf.js + Tesseract
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Subí el certificado de pedigree oficial para extraer automáticamente números POA, Padre, Madre y Abuelos.
                  </p>
                </div>
              </div>

              <label className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50">
                {ocrLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando OCR...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Subir Pedigree (PDF/Imagen)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={ocrLoading || isSubmitting}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessPedigreeFile(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* OCR Processing Feedback Banners */}
          {ocrLoading && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <div>
                <strong className="block font-bold">Extrayendo texto y genealogía con OCR...</strong>
                <span className="text-[11px] text-blue-700">Analizando el certificado de pedigree, identificando prefijos POA/FCA y mapeando antepasados.</span>
              </div>
            </div>
          )}

          {pdfExtractionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-xs">{pdfExtractionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setPdfExtractionSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {pdfExtractionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pdfExtractionError}</span>
            </div>
          )}

          {/* TAB 1: DATOS */}
          {activeFormTab === 'DATOS' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    placeholder="ej: Kaiser von Haus Demo"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Afijo / Criadero
                    </label>
                    {currentCriadero?.afijo && afijo !== currentCriadero.afijo && (
                      <button
                        type="button"
                        onClick={() => setAfijo(currentCriadero.afijo || '')}
                        className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                      >
                        Usar "{currentCriadero.afijo}"
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      list="afijos-list"
                      value={afijo}
                      onChange={(e) => setAfijo(e.target.value)}
                      placeholder="ej: VON HAUS DEMO"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs uppercase"
                    />
                    <datalist id="afijos-list">
                      {availableAfijos.map((af) => (
                        <option key={af} value={af} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sexo *</label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Sexo)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  >
                    <option value="MACHO">MACHO</option>
                    <option value="HEMBRA">HEMBRA</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Raza</label>
                  <input
                    type="text"
                    value={raza}
                    onChange={(e) => setRaza(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Fecha Nacimiento</label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                      Edad: {calculateExactAge(fechaNacimiento)}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número POA</label>
                  <input
                    type="text"
                    value={numeroPOA}
                    onChange={(e) => setNumeroPOA(e.target.value)}
                    placeholder="POA-45892"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Microchip (15 dígitos)</label>
                  <input
                    type="text"
                    value={microchip}
                    onChange={(e) => setMicrochip(e.target.value)}
                    placeholder="981098104829101"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tatuaje POA</label>
                  <input
                    type="text"
                    value={tatuaje}
                    onChange={(e) => setTatuaje(e.target.value)}
                    placeholder="B-142"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Color / Manto</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="ej: Negro y Fuego intenso"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Pelo</label>
                  <select
                    value={pelo}
                    onChange={(e) => setPelo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  >
                    <option value="CORTO">Pelo Corto (Stockhaar)</option>
                    <option value="LARGO">Pelo Largo (Langstockhaar)</option>
                    <option value="MEDIO">Medio</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estado Reproductivo</label>
                  <select
                    value={estadoReproductivo}
                    onChange={(e) => setEstadoReproductivo(e.target.value as EstadoReproductivo)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="EN_CELO">En Celo</option>
                    <option value="GESTANTE">Gestante</option>
                    <option value="EN_DESCANSO">En Descanso</option>
                    <option value="RETIRADO">Retirado</option>
                  </select>
                </div>
              </div>

              {/* PedigreeDatabase.com Integration Box */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Link PedigreeDatabase.com</span>
                  </label>
                  {pedigreeDatabaseUrl && (
                    <a
                      href={pedigreeDatabaseUrl.startsWith('http') ? pedigreeDatabaseUrl : `https://${pedigreeDatabaseUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>Abrir en PedigreeDatabase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={pedigreeDatabaseUrl}
                    onChange={(e) => {
                      setPedigreeDatabaseUrl(e.target.value);
                      setPedigreeDbError(null);
                      setPedigreeDbSuccess(null);
                    }}
                    placeholder="ej: https://www.pedigreedatabase.com/german_shepherd_dog/dog.html?id=2623348"
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs shadow-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleImportFromPedigreeDb}
                      disabled={!pedigreeDatabaseUrl.trim() || isFetchingPedigreeDb}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                        !pedigreeDatabaseUrl.trim() || isFetchingPedigreeDb
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                      }`}
                      title="Importar automáticamente nombre, foto y genealogía desde PedigreeDatabase"
                    >
                      {isFetchingPedigreeDb ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Importando...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Importar Genealogía</span>
                        </>
                      )}
                    </button>
                    {pedigreeDatabaseUrl && (
                      <a
                        href={pedigreeDatabaseUrl.startsWith('http') ? pedigreeDatabaseUrl : `https://${pedigreeDatabaseUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors shadow-xs"
                        title="Abrir link en pestaña nueva"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Guardá el link oficial de este perro en PedigreeDatabase.com. Podés hacer clic en &quot;Importar Genealogía&quot; para autocompletar padres y abuelos.
                </p>

                {pedigreeDbSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{pedigreeDbSuccess}</span>
                  </div>
                )}

                {pedigreeDbError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{pedigreeDbError}</span>
                  </div>
                )}
              </div>

              {/* Photographic Asset / Firebase Storage Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Fotografía del Ejemplar (Firebase Storage)</span>
                  </label>
                  {photoSource === 'storage' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono font-bold text-[10px] flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      <span>Firebase Storage</span>
                    </span>
                  )}
                </div>

                {/* Upload Zone & Preview */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {fotoUrl ? (
                    <div className="relative group shrink-0">
                      <img
                        src={fotoUrl}
                        alt="Previsualización"
                        className="w-24 h-24 rounded-xl object-cover border-2 border-slate-200 shadow-xs group-hover:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoUrl('');
                          setUploadSuccess(null);
                        }}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer"
                        title="Eliminar fotografía"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <Camera className="w-8 h-8 text-slate-400" />
                      <span className="text-[10px] mt-1 font-mono">Sin foto</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 w-full">
                    <div className="flex items-center gap-2">
                      <label
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isUploadingPhoto
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                            <span>Subiendo a Firebase Storage...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>{fotoUrl ? 'Reemplazar Fotografía' : 'Subir Foto a Firebase Storage'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoFileChange}
                          disabled={isUploadingPhoto}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowManualUrl((prev) => !prev)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                      >
                        {showManualUrl ? 'Ocultar URL' : 'O ingresar URL'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Formatos soportados: JPG, PNG, WebP. Las imágenes se optimizan y se almacenan directamente en tu bucket de Firebase Storage.
                    </p>

                    {/* Feedback Messages */}
                    {uploadSuccess && (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{uploadSuccess}</span>
                      </div>
                    )}

                    {uploadError && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                        <X className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional Manual URL Input */}
                {showManualUrl && (
                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Enlace directo a imagen web (URL):
                    </label>
                    <input
                      type="url"
                      value={fotoUrl}
                      onChange={(e) => {
                        setFotoUrl(e.target.value);
                        setPhotoSource('external');
                      }}
                      placeholder="https://ejemplo.com/foto-pastor-aleman.jpg"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GENEALOGIA */}
          {activeFormTab === 'GENEALOGIA' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs">
                  Ingresá los nombres de los progenitores y abuelos para vincular el árbol genealógico de 4 generaciones y cálculo en el Simulador de Cruzas.
                </span>
                {pedigreeDatabaseUrl && (
                  <button
                    type="button"
                    onClick={handleImportFromPedigreeDb}
                    disabled={isFetchingPedigreeDb}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Sincronizar con PDB</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-blue-700 uppercase text-[11px]">Línea Paterna</h4>
                  <div>
                    <label className="block text-slate-600 mb-1">Padre</label>
                    <input
                      type="text"
                      value={padreNombre}
                      onChange={(e) => setPadreNombre(e.target.value)}
                      placeholder="VA1 Gary vom Hühnegrab"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Abuelo Paterno</label>
                    <input
                      type="text"
                      value={abueloPaterno}
                      onChange={(e) => setAbueloPaterno(e.target.value)}
                      placeholder="2X VA1 Vegas du Haut Mansard"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Abuela Paterna</label>
                    <input
                      type="text"
                      value={abuelaPaterna}
                      onChange={(e) => setAbuelaPaterna(e.target.value)}
                      placeholder="V Patricia vom Hühnegrab"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-pink-700 uppercase text-[11px]">Línea Materna</h4>
                  <div>
                    <label className="block text-slate-600 mb-1">Madre</label>
                    <input
                      type="text"
                      value={madreNombre}
                      onChange={(e) => setMadreNombre(e.target.value)}
                      placeholder="V Cira von der Liebeswarte"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Abuelo Materno</label>
                    <input
                      type="text"
                      value={abueloMaterno}
                      onChange={(e) => setAbueloMaterno(e.target.value)}
                      placeholder="VA Omen v. Radhaus"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Abuela Materna</label>
                    <input
                      type="text"
                      value={abuelaMaterna}
                      onChange={(e) => setAbuelaMaterna(e.target.value)}
                      placeholder="V Xara del Plata"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Documento Oficial de Pedigree (PDF o Imagen) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Documento de Pedigree Oficial (PDF o Imagen)</span>
                  </h4>
                  {pedigreeDocUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {pedigreeDocTipo || 'Archivo cargado'}
                    </span>
                  )}
                </div>

                {pedigreeDocUrl ? (
                  <div className="p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <strong className="text-slate-900 text-xs truncate block font-bold">
                          {pedigreeDocNombre || 'pedigree-documento'}
                        </strong>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{pedigreeDocFecha || 'Reciente'}</span>
                          {pedigreeDocSize && (
                            <>
                              <span>•</span>
                              <span>{pedigreeDocSize}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={pedigreeDocUrl}
                        download={pedigreeDocNombre || 'pedigree.pdf'}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-slate-100 cursor-pointer"
                        title="Descargar archivo"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setPedigreeDocUrl('');
                          setPedigreeDocNombre('');
                          setPedigreeDocTipo(undefined);
                          setPedigreeDocSize('');
                          setPedigreeDocFecha('');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={`p-4 rounded-xl bg-white border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer text-center group shadow-2xs ${
                    ocrLoading ? 'border-blue-400 bg-blue-50/40 cursor-wait' : 'border-slate-300 hover:border-blue-400'
                  }`}>
                    {ocrLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1" />
                        <span className="font-bold text-blue-700 text-xs">
                          Extrayendo texto y genealogía con OCR...
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Identificando padres, abuelos y bisabuelos del certificado oficial
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors mb-1" />
                        <span className="font-bold text-slate-700 text-xs">
                          Subir Certificado de Pedigree (PDF o Imagen)
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Autocompleta automáticamente las 4 generaciones y adjunta el documento
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      disabled={ocrLoading || isSubmitting}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleProcessPedigreeFile(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SANIDAD Y POA */}
          {activeFormTab === 'SANIDAD' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Displasia de Cadera (HD)
                  </label>
                  <select
                    value={displasiaCadera}
                    onChange={(e) => setDisplasiaCadera(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  >
                    <option value='HD "a" Normal (Libre)'>HD &quot;a&quot; Normal (Libre Oficial)</option>
                    <option value='HD "a" Casi Normal (Permitido)'>HD &quot;a&quot; Casi Normal (Permitido)</option>
                    <option value="HD Permitido (Grado I)">HD Permitido (Grado I)</option>
                    <option value="No Evaluado">No Evaluado</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Displasia de Codo (ED)
                  </label>
                  <select
                    value={displasiaCodo}
                    onChange={(e) => setDisplasiaCodo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  >
                    <option value='ED "0" Normal (Libre)'>ED &quot;0&quot; Normal (Libre Oficial)</option>
                    <option value='ED "1" Casi Normal'>ED &quot;1&quot; Casi Normal</option>
                    <option value="ED Grado I">ED Grado I</option>
                    <option value="No Evaluado">No Evaluado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Calificación de Cría POA
                  </label>
                  <input
                    type="text"
                    value={calificacionCria}
                    onChange={(e) => setCalificacionCria(e.target.value)}
                    placeholder="Seleccionado de Primera (Kkl 1)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ADN</label>
                  <input
                    type="text"
                    value={adn}
                    onChange={(e) => setAdn(e.target.value)}
                    placeholder="Comprobado (DNA gpr.)"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Títulos y Premios (separados por coma)
                </label>
                <input
                  type="text"
                  value={titulosRaw}
                  onChange={(e) => setTitulosRaw(e.target.value)}
                  placeholder="Sieger Argentino 2024, Campeón POA, VA1"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observaciones Generales
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles de carácter, prueba de coraje, temperamento..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || ocrLoading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || ocrLoading || !nombreCompleto.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{dog ? 'Guardar Cambios' : 'Registrar Ejemplar'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
