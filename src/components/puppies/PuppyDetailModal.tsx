import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Cachorro, PesajeCachorro } from '../../types';
import {
  X,
  Baby,
  Scale,
  Printer,
  ShieldCheck,
  TrendingUp,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  Sparkles,
  ArrowRight,
  FileCheck2,
  FileText,
  Download,
  Upload,
  Eye,
  Trash2,
  Award,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { formatDateDMY } from '../../lib/dogUtils';
import { uploadPdfOrDocument } from '../../lib/documentStorage';
import { uploadDogPhoto } from '../../lib/firebase';

interface PuppyDetailModalProps {
  puppy: Cachorro;
  onClose: () => void;
  onEdit: () => void;
}

export const PuppyDetailModal: React.FC<PuppyDetailModalProps> = ({ puppy, onClose, onEdit }) => {
  const {
    cachorros,
    addPesajeCachorro,
    incorporarCachorroAPlantel,
    openPrintModal,
    updateCachorro,
    currentUser,
    currentCriaderoId,
  } = useApp();

  // Keep puppy reactive if updated in Firestore / context
  const currentPuppy = cachorros.find((c) => c.id === puppy.id) || puppy;

  const isSuperAdmin =
    currentUser.rol === 'SUPER_ADMIN' ||
    currentUser.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';
  const isOwnerBreeder = !currentPuppy.criaderoId || currentPuppy.criaderoId === currentCriaderoId;
  const isReadOnly = !isSuperAdmin && !isOwnerBreeder;
  const canAccessPedigreeRequest = isSuperAdmin || isOwnerBreeder;

  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'PESO' | 'SANIDAD' | 'COMERCIAL'>('RESUMEN');
  const [nuevaSemana, setNuevaSemana] = useState<number>((currentPuppy.pesajes?.length || 0) + 1);
  const [nuevoPesoGramos, setNuevoPesoGramos] = useState<number>(0);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [incorporatedSuccess, setIncorporatedSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Photo Upload States
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);
  const [photoErrorMsg, setPhotoErrorMsg] = useState<string | null>(null);

  const handleUploadPuppyPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoErrorMsg('Por favor selecciona una imagen válida (JPG, PNG, WebP).');
      setTimeout(() => setPhotoErrorMsg(null), 4000);
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoErrorMsg(null);
    setPhotoSuccessMsg(null);
    try {
      const res = await uploadDogPhoto(file, `cachorro_${currentPuppy.id}`);
      await updateCachorro(currentPuppy.id, { fotoUrl: res.url });
      setPhotoSuccessMsg('¡Foto del cachorro actualizada y guardada exitosamente!');
      setTimeout(() => setPhotoSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error al subir foto del cachorro:', err);
      setPhotoErrorMsg(err.message || 'Error al subir la imagen a Firebase Storage.');
      setTimeout(() => setPhotoErrorMsg(null), 5000);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // PDF Upload & Progress States
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ pct: number; text: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const handleUploadPuppyPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const file = inputEl.files?.[0];
    inputEl.value = ''; // Reset so onChange triggers even if same file is re-selected
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Por favor selecciona un archivo PDF válido (.pdf).');
      setTimeout(() => setUploadError(null), 4000);
      return;
    }

    setIsUploadingPdf(true);
    setUploadError(null);
    setUploadSuccessMsg(null);
    setUploadProgress({ pct: 15, text: 'Iniciando subida de documento...' });

    try {
      const res = await uploadPdfOrDocument(
        file,
        'solicitudes_pedigree',
        puppy.nombre || puppy.identificadorProvisorio || puppy.id,
        (pct, text) => {
          setUploadProgress({ pct, text });
        }
      );

      const updates: Partial<Cachorro> = {
        solicitudPedigreeDocUrl: res.url,
        solicitudPedigreeDocNombre: res.docNombre,
        solicitudPedigreeDocFecha: new Date().toISOString().split('T')[0],
        solicitudPedigreeDocSize: res.sizeStr,
      };

      await updateCachorro(puppy.id, updates);
      setUploadSuccessMsg(`¡Archivo "${file.name}" subido y guardado exitosamente en el criadero!`);
      setTimeout(() => setUploadSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error al subir PDF del cachorro:', err);
      setUploadError(err.message || 'Error al procesar y subir el archivo PDF.');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploadingPdf(false);
      setUploadProgress(null);
    }
  };

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoPesoGramos <= 0) return;
    const pesaje: PesajeCachorro = {
      semana: nuevaSemana,
      fecha: new Date().toISOString().split('T')[0],
      pesoGramos: nuevoPesoGramos,
    };
    addPesajeCachorro(puppy.id, pesaje);
    setShowAddWeight(false);
    setNuevoPesoGramos(0);
    setNuevaSemana(nuevaSemana + 1);
  };

  const handleIncorporarPlantel = async () => {
    try {
      const res = await incorporarCachorroAPlantel(puppy.id);
      if (res) {
        setIncorporatedSuccess(true);
        setTimeout(() => setIncorporatedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error al incorporar cachorro al plantel:', err);
    }
  };

  // Max weight for SVG chart scaling
  const maxWeight = Math.max(...(puppy.pesajes?.map((p) => p.pesoGramos) || [1000]), 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl text-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-10 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: puppy.colorCollar || '#3b82f6' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {puppy.nombre || puppy.identificadorProvisorio}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                    puppy.estadoComercial === 'DISPONIBLE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : puppy.estadoComercial === 'RESERVADO'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : puppy.estadoComercial === 'PLANTEL'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {puppy.estadoComercial}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {puppy.camadaNombre} • {puppy.sexo} • {puppy.color}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canAccessPedigreeRequest && (
              <button
                onClick={() => openPrintModal('PEDIGREE_REQUEST', puppy.id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Solicitud de emisión de pedigree digital"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Solicitud Pedigree</span>
              </button>
            )}
            <button
              onClick={() => openPrintModal('DELIVERY_CERTIFICATE', puppy.id)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Certificado Oficial de Entrega"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Certificado Entrega</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Read-Only Notice for Dogs from other Kennels */}
        {isReadOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Solo Lectura:</strong> Este cachorro pertenece a otro criadero. Los datos no son modificables.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider shrink-0">
              Solo Lectura
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-slate-200 bg-white text-xs overflow-x-auto">
          {[
            { id: 'RESUMEN', label: 'Ficha y Progenitores', icon: Baby },
            { id: 'PESO', label: `Curva de Peso (${puppy.pesajes?.length || 0})`, icon: Scale },
            { id: 'SANIDAD', label: 'Vacunas y Desparasitación', icon: ShieldCheck },
            { id: 'COMERCIAL', label: 'Venta / Adquiriente', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: RESUMEN */}
          {activeTab === 'RESUMEN' && (
            <div className="space-y-4">
              {/* Foto Personalizada del Cachorro con Fallback por defecto */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-xs">
                <img
                  src={currentPuppy.fotoUrl || '/assets/puppy-dog-pet-german-shepherd-wallpaper-preview.jpg'}
                  alt="Cachorro por defecto"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (!target.src.includes('puppy-dog-pet-german-shepherd-wallpaper-preview.jpg')) {
                      target.src = '/assets/puppy-dog-pet-german-shepherd-wallpaper-preview.jpg';
                    }
                  }}
                  className="w-full h-52 sm:h-64 object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/25 to-transparent pointer-events-none" />

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3">
                  <div className="text-white drop-shadow-md">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
                      {currentPuppy.camadaNombre}
                    </span>
                    <strong className="text-base sm:text-lg font-black block">
                      {currentPuppy.nombre || currentPuppy.identificadorProvisorio}
                    </strong>
                  </div>

                  {!isReadOnly && (
                    <label className="px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-md backdrop-blur-md transition-all hover:scale-105 cursor-pointer shrink-0">
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Subiendo...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>{currentPuppy.fotoUrl ? 'Cambiar Foto' : 'Cargar Foto'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingPhoto}
                        onChange={handleUploadPuppyPhoto}
                      />
                    </label>
                  )}
                </div>
              </div>

              {photoSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{photoSuccessMsg}</span>
                </div>
              )}

              {photoErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{photoErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Identificador</span>
                  <strong className="text-slate-900 font-bold">{currentPuppy.identificadorProvisorio}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Nacimiento</span>
                  <strong className="text-slate-900 font-bold">{formatDateDMY(currentPuppy.fechaNacimiento)}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Peso Nacimiento</span>
                  <strong className="text-emerald-700 font-mono font-bold">{currentPuppy.pesoNacimientoGramos} g</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Tatuaje POA</span>
                  <strong className="text-purple-700 font-mono font-bold">{currentPuppy.tatuaje || 'Sin asignar'}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Tipo de Pelo</span>
                  <strong className="text-amber-800 font-bold">{currentPuppy.pelo === 'CORTO' ? 'Pelo Corto' : currentPuppy.pelo === 'LARGO' ? 'Pelo Largo' : currentPuppy.pelo === 'MEDIO' ? 'Pelo Medio' : (currentPuppy.pelo || 'Pelo Corto')}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Microchip</span>
                  <strong className="text-slate-800 font-mono">{currentPuppy.microchip || 'En colocación'}</strong>
                </div>
              </div>

              {/* Parents info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Genealogía Inmediata
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <span className="text-[9px] uppercase font-bold text-blue-700 block">Padre</span>
                    <strong className="text-slate-900 font-semibold">{puppy.padreNombre}</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-pink-50 border border-pink-100">
                    <span className="text-[9px] uppercase font-bold text-pink-700 block">Madre</span>
                    <strong className="text-slate-900 font-semibold">{puppy.madreNombre}</strong>
                  </div>
                </div>
              </div>

              {/* Solicitud de emisión de pedigree digital Card (Protected: Owner Criador or SuperAdmin only) */}
              {canAccessPedigreeRequest ? (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                          Solicitud de emisión de pedigree digital
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Inscripción individual del ejemplar para trámite de pedigree ante el Club POA
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPrintModal('PEDIGREE_REQUEST', puppy.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                      title="Generar formulario e imprimir o guardar PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Generar Documento PDF</span>
                    </button>
                  </div>

                  {/* Status of uploaded PDF / File Uploader */}
                  {puppy.solicitudPedigreeDocUrl ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <strong className="text-slate-900 font-bold block text-xs">
                            {puppy.solicitudPedigreeDocNombre || 'solicitud_pedigree_digital.pdf'}
                          </strong>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>Subido: {puppy.solicitudPedigreeDocFecha || 'Reciente'}</span>
                            {puppy.solicitudPedigreeDocSize && (
                              <>
                                <span>•</span>
                                <span>{puppy.solicitudPedigreeDocSize}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setIsPreviewOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        <a
                          href={puppy.solicitudPedigreeDocUrl}
                          download={puppy.solicitudPedigreeDocNombre || `solicitud-pedigree-${puppy.identificadorProvisorio}.pdf`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar</span>
                        </a>

                        {!isReadOnly && (
                          <>
                            <label className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                              <span>Reemplazar</span>
                              <input
                                type="file"
                                accept="application/pdf"
                                disabled={isUploadingPdf}
                                className="hidden"
                                onChange={handleUploadPuppyPdf}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                updateCachorro(puppy.id, {
                                  solicitudPedigreeDocUrl: undefined,
                                  solicitudPedigreeDocNombre: undefined,
                                  solicitudPedigreeDocFecha: undefined,
                                  solicitudPedigreeDocSize: undefined,
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar archivo adjunto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-600">
                        ¿Tenés el archivo de solicitud firmado o el PDF emitido? Podés adjuntarlo para tenerlo siempre a mano y disponible para descarga.
                      </div>
                      {!isReadOnly && (
                        <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs">
                          {isUploadingPdf ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Subiendo PDF...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-white" />
                              <span>Subir PDF</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={isUploadingPdf}
                            className="hidden"
                            onChange={handleUploadPuppyPdf}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Real-time PDF Upload Progress Banner */}
                  {isUploadingPdf && (
                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                          <span>{uploadProgress?.text || 'Subiendo archivo PDF a la nube...'}</span>
                        </div>
                        <span className="font-mono text-blue-700">{uploadProgress?.pct || 20}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress?.pct || 20}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Success Feedback Banner */}
                  {uploadSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                  )}

                  {/* Error Feedback Banner */}
                  {uploadError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      Solicitud de emisión de pedigree digital (Documento Protegido)
                    </h4>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Por estrictas reglas de privacidad y aislamiento entre criaderos, la <strong>Solicitud de emisión de pedigree digital</strong> solo puede ser generada, visualizada y descargada por el criador titular propietario de la camada o por el Administrador Global.
                  </p>
                </div>
              )}

              {/* Special action: Incorporate into adult kennel stock */}
              {!isReadOnly && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Incorporación al Plantel Activo</span>
                    </div>
                    <p className="text-[11px] text-purple-900/70 mt-1">
                      Convierte a este cachorro en ejemplar adulto conservando todo su historial y relaciones sin duplicados.
                    </p>
                  </div>

                  <button
                    onClick={handleIncorporarPlantel}
                    disabled={puppy.incorporadoAlPlantel}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                      puppy.incorporadoAlPlantel
                        ? 'bg-purple-100 text-purple-600 border border-purple-200 cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {puppy.incorporadoAlPlantel
                        ? 'Ya en Plantel de Adultos'
                        : incorporatedSuccess
                        ? '¡Incorporado con éxito!'
                        : 'Incorporar al Plantel'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CURVA DE PESO */}
          {activeTab === 'PESO' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Curva Semanal de Crecimiento y Ganancia de Peso
                  </h4>
                  <p className="text-xs text-slate-500">
                    Evolución en gramos desde el nacimiento hasta la entrega
                  </p>
                </div>

                {!isReadOnly && (
                  <button
                    onClick={() => setShowAddWeight((prev) => !prev)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Pesaje</span>
                  </button>
                )}
              </div>

              {/* Form add weight */}
              {showAddWeight && (
                <form
                  onSubmit={handleAddWeight}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs"
                >
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">Semana N°</label>
                    <input
                      type="number"
                      min={0}
                      max={52}
                      value={nuevaSemana}
                      onChange={(e) => setNuevaSemana(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block mb-0.5">Peso (gramos)</label>
                    <input
                      type="number"
                      min={100}
                      max={45000}
                      step={10}
                      value={nuevoPesoGramos || ''}
                      onChange={(e) => setNuevoPesoGramos(parseInt(e.target.value) || 0)}
                      placeholder="ej: 3450"
                      className="w-32 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 shadow-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="self-end px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    Guardar
                  </button>
                </form>
              )}

              {/* SVG Weight Progression Chart */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="h-44 flex items-end justify-between gap-2 pt-6">
                  {(puppy.pesajes || []).map((p, idx) => {
                    const heightPct = Math.round((p.pesoGramos / maxWeight) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[9px] font-mono text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                          {p.pesoGramos}g
                        </span>
                        <div className="w-full bg-slate-200 rounded-t h-32 flex items-end overflow-hidden">
                          <div
                            style={{ height: `${Math.max(heightPct, 10)}%` }}
                            className="w-full bg-gradient-to-t from-emerald-600 to-teal-500 rounded-t"
                          />
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono">Sem {p.semana}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table of Weights */}
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2 border-b border-slate-200">Semana</th>
                    <th className="p-2 border-b border-slate-200">Fecha</th>
                    <th className="p-2 border-b border-slate-200">Peso en Gramos</th>
                    <th className="p-2 border-b border-slate-200">Equivalente en Kg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(puppy.pesajes || []).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">Semana {p.semana}</td>
                      <td className="p-2 font-mono text-slate-600">{formatDateDMY(p.fecha)}</td>
                      <td className="p-2 font-mono text-emerald-700 font-bold">{p.pesoGramos} g</td>
                      <td className="p-2 font-mono text-slate-700">{(p.pesoGramos / 1000).toFixed(2)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: SANIDAD */}
          {activeTab === 'SANIDAD' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Plan de Vacunación y Desparasitaciones</h4>
                <p className="text-xs text-slate-500">Inmunizaciones aplicadas al cachorro</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h5 className="font-bold text-blue-700 uppercase text-[11px]">Vacunas Aplicadas</h5>
                  {(puppy.vacunas || []).map((v, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/80">
                      <div>
                        <strong className="text-slate-900">{v.vacuna}</strong>
                        <div className="text-[10px] text-slate-500">{v.veterinario}</div>
                      </div>
                      <span className="font-mono text-blue-700 font-bold">{formatDateDMY(v.fecha)}</span>
                    </div>
                  ))}
                  {(puppy.vacunas || []).length === 0 && (
                    <div className="text-slate-500 py-2">Sin vacunas registradas aún.</div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h5 className="font-bold text-emerald-700 uppercase text-[11px]">Desparasitaciones</h5>
                  {(puppy.desparasitaciones || []).map((d, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-slate-200/80">
                      <div>
                        <strong className="text-slate-900">{d.producto}</strong>
                        <div className="text-[10px] text-slate-500">Dosis: {d.dosis}</div>
                      </div>
                      <span className="font-mono text-emerald-700 font-bold">{formatDateDMY(d.fecha)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COMERCIAL */}
          {activeTab === 'COMERCIAL' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Información Comercial y Adquiriente</h4>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    {puppy.moneda === 'USD' ? 'USD $' : '$'} {puppy.precio?.toLocaleString('es-AR') || '0'}
                  </span>
                </div>

                {puppy.comprador ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Comprador</span>
                      <strong className="text-slate-900">{puppy.comprador.nombre}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">DNI / CUIT</span>
                      <span className="font-mono text-slate-700">{puppy.comprador.dni}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Teléfono</span>
                      <span className="font-mono text-blue-700">{puppy.comprador.telefono}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Localidad</span>
                      <span className="text-slate-700">{puppy.comprador.localidad}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 block">Domicilio</span>
                      <span className="text-slate-700">{puppy.comprador.domicilio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Fecha Entrega Estimada</span>
                      <span className="font-mono text-amber-700">{formatDateDMY(puppy.comprador.fechaEntregaEstimada)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Seña Abonada</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {puppy.moneda === 'USD' ? 'USD $' : '$'} {puppy.senia?.toLocaleString('es-AR') || '0'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-500">
                    Cachorro disponible. Sin reserva registrada.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div>
            {!isReadOnly && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Editar Ficha
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Document Preview Modal */}
      {puppy.solicitudPedigreeDocUrl && (
        <DocumentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Solicitud de emisión de pedigree digital"
          subtitle={`Ejemplar: ${puppy.nombre || puppy.identificadorProvisorio} • Camada: ${puppy.camadaNombre}`}
          docUrl={puppy.solicitudPedigreeDocUrl}
          docNombre={puppy.solicitudPedigreeDocNombre || 'solicitud_pedigree_digital.pdf'}
          docTipo="PDF"
        />
      )}
    </div>
  );
};
