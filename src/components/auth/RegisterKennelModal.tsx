import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Building2,
  Sparkles,
  Shield,
  CheckCircle2,
  ArrowRight,
  Dog,
  Phone,
  MapPin,
  FileBadge,
  AlertCircle,
  LogIn,
  RotateCcw,
} from 'lucide-react';

export const RegisterKennelModal: React.FC = () => {
  const {
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    firebaseUser,
    loginWithGoogle,
    registerNewCriadero,
    enterRealMode,
    isDemoMode,
    currentUser,
  } = useApp();

  const [step, setStep] = useState<'auth' | 'form' | 'admin-welcome'>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [afijo, setAfijo] = useState('');
  const [registroPOA, setRegistroPOA] = useState('');
  const [razaPrincipal, setRazaPrincipal] = useState('Ovejero Alemán (Pastor Alemán)');
  const [responsable, setResponsable] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('Buenos Aires');
  const [incluirEjemplaresDemo, setIncluirEjemplaresDemo] = useState(false);

  if (!isRegisterModalOpen) return null;

  const isSuperAdminEmail =
    firebaseUser?.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      // Next step logic is handled after sign in
      setStep('form');
    } catch (err: any) {
      console.error('Google Sign-In error in modal:', err);
      setError(err?.message || 'Error al iniciar sesión con Google. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterAsSuperAdmin = async () => {
    setLoading(true);
    try {
      await enterRealMode();
      setIsRegisterModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Error al ingresar al panel real.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCriadero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('Por favor ingresá el nombre de tu criadero');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerNewCriadero({
        nombre: nombre.trim(),
        afijo: afijo.trim(),
        registroPOA: registroPOA.trim(),
        razaPrincipal,
        responsable: responsable.trim() || firebaseUser?.displayName || 'Criador Responsable',
        telefono: telefono.trim(),
        ciudad: ciudad.trim(),
        provincia: provincia.trim(),
        pais: 'Argentina',
        incluirEjemplaresDemo,
      });
      setIsRegisterModalOpen(false);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || 'Error al registrar tu criadero. Reintentá en un momento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0d1526] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isSuperAdminEmail
                  ? 'Acceso Super Administrador'
                  : firebaseUser
                  ? 'Configurá tu Criadero Canino'
                  : 'Registrar mi Criadero Canino'}
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                {isSuperAdminEmail
                  ? 'Ingresar al panel real con privilegios completos'
                  : 'Salí del modo demo y gestioná tus propios ejemplares con datos reales'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Not signed in with Google */}
          {!firebaseUser && (
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Dog className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Comenzá a gestionar tu propio Criadero
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Accedé con tu cuenta de Google de forma segura para crear o vincular tu criadero privado.
                </p>
              </div>

              {/* Benefits list */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 text-left space-y-2 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tu propio panel privado 100% aislado (solo vos ves tus datos)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sincronización en la nube con Cloud Firestore en tiempo real</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Generador de pedigrees, gestaciones, montas y certificados POA</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continuar con Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP: Super Admin detected */}
          {firebaseUser && isSuperAdminEmail && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-blue-900 dark:text-blue-200">
                    Super Administrador Detectado
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    Has iniciado sesión como <strong>{firebaseUser.email}</strong>.
                    Podés ingresar directamente a tu panel real de <strong>Von Der Balmaceda</strong> con control total de criaderos y base de datos Cloud Firestore.
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleEnterAsSuperAdmin}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Entrar a mi Panel Real (Super Admin)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium text-xs text-center transition-colors cursor-pointer"
                >
                  Permanecer en Modo Demo interactivo
                </button>
              </div>
            </div>
          )}

          {/* STEP: User signed in with Google -> Fill Criadero Info */}
          {firebaseUser && !isSuperAdminEmail && (
            <form onSubmit={handleSubmitCriadero} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                {firebaseUser.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={firebaseUser.displayName || 'Usuario'}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {firebaseUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="truncate">
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {firebaseUser.displayName || 'Criador'}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                    {firebaseUser.email}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Criadero <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Criadero Von Der Wald, Del Valle, etc."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Afijo Oficial (Opcional)
                    </label>
                    <div className="relative">
                      <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={afijo}
                        onChange={(e) => setAfijo(e.target.value)}
                        placeholder="Ej: VON DER WALD"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Registro POA / FCA (Opcional)
                    </label>
                    <input
                      type="text"
                      value={registroPOA}
                      onChange={(e) => setRegistroPOA(e.target.value)}
                      placeholder="Ej: POA-5120 / FCA-9821"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Raza Principal
                    </label>
                    <select
                      value={razaPrincipal}
                      onChange={(e) => setRazaPrincipal(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Ovejero Alemán (Pastor Alemán)">Ovejero Alemán (Pastor Alemán)</option>
                      <option value="Golden Retriever">Golden Retriever</option>
                      <option value="Labrador Retriever">Labrador Retriever</option>
                      <option value="Border Collie">Border Collie</option>
                      <option value="Bulldog Francés">Bulldog Francés</option>
                      <option value="Rottweiler">Rottweiler</option>
                      <option value="Doberman">Doberman</option>
                      <option value="Caniche / Poodle">Caniche / Poodle</option>
                      <option value="Otra Raza Canina">Otra Raza Canina</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+54 9 11 ..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ciudad
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Ej: Rosario, Córdoba, Pilar..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Provincia / Región
                    </label>
                    <input
                      type="text"
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      placeholder="Ej: Buenos Aires, Córdoba, Santa Fe..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Option to start clean or with starter template */}
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Modo de Inicio para tu Criadero:
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="starterMode"
                      checked={!incluirEjemplaresDemo}
                      onChange={() => setIncluirEjemplaresDemo(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Criadero limpio desde cero (Recomendado)</strong>: Comenzás con 0 ejemplares, listo para cargar tu propio plantel real.
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="starterMode"
                      checked={incluirEjemplaresDemo}
                      onChange={() => setIncluirEjemplaresDemo(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                      <strong>Cargar 2 ejemplares base como guía</strong>: Útil si querés tener datos de muestra en tu propio criadero para practicar.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Crear mi Criadero y Acceder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
