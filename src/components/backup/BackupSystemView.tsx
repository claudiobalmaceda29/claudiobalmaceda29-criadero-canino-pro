import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardDriveDownload,
  Upload,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export const BackupSystemView: React.FC = () => {
  const {
    exportBackupJSON,
    validateBackupFile,
    restoreFromBackup,
    criaderos,
    ejemplares,
    camadas,
    cachorros,
    montas,
    gestaciones,
    registrosSanitarios,
    transacciones,
    exportToCSV,
  } = useApp();

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    summary?: any;
    error?: string;
  } | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleExportFullBackup = () => {
    try {
      exportBackupJSON();
      setExportFeedback('¡Respaldo completo exportado exitosamente! El archivo JSON ha comenzado a descargarse.');
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: any) {
      setExportFeedback(`Error al exportar: ${err.message || 'Intente nuevamente'}`);
    }
  };

  const handleCopyJSONToClipboard = () => {
    const data = {
      criaderos,
      ejemplares,
      camadas,
      cachorros,
      montas,
      gestaciones,
      registrosSanitarios,
      transacciones,
      exportedAt: new Date().toISOString(),
      version: '3.5-pro',
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      const res = validateBackupFile(content);
      setValidationResult(res);
      setRestoreStatus(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!fileContent) return;
    const res = restoreFromBackup(fileContent);
    setRestoreStatus(res);
    if (res.success) {
      setFileContent(null);
      setValidationResult(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner in Clean Light SaaS Style */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Database className="w-3.5 h-3.5" />
            <span>Persistencia & Seguridad de Datos</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HardDriveDownload className="w-7 h-7 text-blue-600" />
            Respaldos y Exportaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Descargá una réplica exacta de tu base de datos en formato JSON estandarizado para respaldar en tu computadora, Google Drive o migrar entre criaderos.
          </p>
        </div>

        {/* Primary Highlighted Button: Exportar respaldo completo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={handleExportFullBackup}
            id="btn-exportar-respaldo-completo"
            className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Exportar Respaldo Completo (JSON)</span>
          </button>

          <button
            onClick={handleCopyJSONToClipboard}
            className="px-4 py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            title="Copiar JSON al portapapeles"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Feedback notification */}
      {exportFeedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{exportFeedback}</span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-mono px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: JSON Backup & Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 text-[10px] font-mono font-bold">
                FORMATO JSON UNIVERSAL
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Generar Respaldo Maestro JSON</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Contiene todos los registros en vivo: criaderos, genealogías de 4 generaciones, camadas, historiales clínicos y movimientos económicos.
              </p>
            </div>

            {/* Live Database Stats */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Resumen de Datos a Respaldar
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span>Ejemplares:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{ejemplares.length}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span>Camadas:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{camadas.length}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span>Cachorros:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{cachorros.length}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span>Montas / Gest.:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{montas.length + gestaciones.length}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span>Sanidad / Vacunas:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{registrosSanitarios.length}</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <span>Transacciones:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{transacciones.length}</strong>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportFullBackup}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Archivo JSON de Respaldo Completo</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 text-[10px] font-mono font-bold">
                VALIDACIÓN PREVIA SEGURA
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Restaurar Respaldo con Validación</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Inspecciona y valida un archivo JSON antes de aplicarlo. Se genera automáticamente una copia de seguridad preventiva antes de cualquier reemplazo.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Seleccionar archivo JSON de copia de seguridad:
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-850"
              />
            </div>

            {/* Validation Feedback */}
            {validationResult && (
              <div
                className={`p-4 rounded-xl text-xs space-y-2 ${
                  validationResult.valid
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300'
                    : 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {validationResult.valid ? (
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>
                    {validationResult.valid
                      ? 'Archivo válido y compatible'
                      : 'Error de validación de formato'}
                  </span>
                </div>

                {validationResult.valid && validationResult.summary && (
                  <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <div>
                      Exportado el: <strong>{validationResult.summary.exportedAt || 'Fecha no disponible'}</strong>
                    </div>
                    <div>
                      Ejemplares a restaurar: <strong>{validationResult.summary.ejemplares || validationResult.summary.ejemplaresCount || 0}</strong>
                    </div>
                    <div>
                      Camadas a restaurar: <strong>{validationResult.summary.camadas || validationResult.summary.camadasCount || 0}</strong>
                    </div>
                    <div>
                      Cachorros a restaurar: <strong>{validationResult.summary.cachorros || validationResult.summary.cachorrosCount || 0}</strong>
                    </div>
                  </div>
                )}

                {validationResult.error && (
                  <p className="text-[11px] text-rose-600">{validationResult.error}</p>
                )}
              </div>
            )}

            {restoreStatus && (
              <div
                className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                  restoreStatus.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                <span className="font-bold">
                  {restoreStatus.success
                    ? '¡Datos restaurados con éxito! La base de datos se ha actualizado.'
                    : `Error: ${restoreStatus.error}`}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmRestore}
            disabled={!validationResult?.valid}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              validationResult?.valid
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Confirmar Restauración de Datos</span>
          </button>
        </div>
      </div>

      {/* CSV Spreadsheet Export Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Exportaciones Tabulares a Excel (CSV)</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Descargá planillas separadas por punto y coma (compatible con Microsoft Excel y Google Sheets) para balances contables y auditorías.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <button
            onClick={() =>
              exportToCSV(
                `ejemplares_${new Date().toISOString().split('T')[0]}`,
                ejemplares.map((e) => ({
                  ID: e.id,
                  Nombre: e.nombreCompleto,
                  Afijo: e.afijo,
                  Sexo: e.sexo,
                  POA: e.numeroPOA,
                  Microchip: e.microchip,
                  Color: e.color,
                  HD: e.displasiaCadera,
                  ED: e.displasiaCodo,
                  Estado: e.estado,
                }))
              )
            }
            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-left space-y-1.5 transition-all cursor-pointer group hover:border-emerald-500/40 shadow-xs"
          >
            <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600">
              Plantel de Ejemplares (.csv)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ejemplares.length} registros con datos de sanidad y POA</div>
          </button>

          <button
            onClick={() =>
              exportToCSV(
                `cachorros_${new Date().toISOString().split('T')[0]}`,
                cachorros.map((c) => ({
                  ID: c.id,
                  Nombre: c.nombre || c.identificadorProvisorio,
                  Camada: c.camadaNombre,
                  Sexo: c.sexo,
                  Color: c.color,
                  EstadoComercial: c.estadoComercial,
                  Precio: c.precio,
                  Moneda: c.moneda,
                  Comprador: c.comprador?.nombre || 'Sin comprador',
                }))
              )
            }
            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-left space-y-1.5 transition-all cursor-pointer group hover:border-emerald-500/40 shadow-xs"
          >
            <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600">
              Registro de Cachorros (.csv)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{cachorros.length} cachorros con estado comercial y comprador</div>
          </button>

          <button
            onClick={() =>
              exportToCSV(
                `contabilidad_${new Date().toISOString().split('T')[0]}`,
                transacciones.map((t) => ({
                  ID: t.id,
                  Fecha: t.fecha,
                  Tipo: t.tipo,
                  Categoria: t.categoria,
                  Monto: t.monto,
                  Moneda: t.moneda,
                  Concepto: t.concepto,
                  Observaciones: t.observaciones || '',
                }))
              )
            }
            className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-left space-y-1.5 transition-all cursor-pointer group hover:border-emerald-500/40 shadow-xs"
          >
            <div className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600">
              Libro Contable (.csv)
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{transacciones.length} transacciones de ingresos y egresos</div>
          </button>
        </div>
      </div>
    </div>
  );
};
