import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Shield,
  Menu,
  HelpCircle,
  ChevronDown,
  KeyRound,
  LogOut,
  AlertTriangle,
  Cloud,
  RefreshCw,
  WifiOff,
  CheckCircle,
  Sparkles,
  RotateCcw,
  LogIn,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    currentCriadero,
    isDarkMode,
    toggleDarkMode,
    setIsSearchOpen,
    notificaciones,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    setActiveTab,
    cambiarPasswordUsuario,
    firebaseUser,
    isFirebaseConnected,
    isSyncing,
    isOnline,
    connectionStatusMessage,
    retryConnection,
    loginWithGoogle,
    logout,
    migrateAllDataToFirestore,
    isDemoMode,
    setIsRegisterModalOpen,
    enterRealMode,
    enterDemoMode,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadNotifs = notificaciones.filter((n) => !n.leida);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: 'Las contraseñas no coinciden' });
      return;
    }
    const ok = cambiarPasswordUsuario(newPassword);
    if (ok) {
      setPasswordMsg({ type: 'ok', text: 'Contraseña actualizada correctamente' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
    }
  };

  const handleCloudSync = async () => {
    if (!firebaseUser) {
      try {
        await loginWithGoogle();
      } catch (e) {
        console.error(e);
        return;
      }
    }
    setIsMigrating(true);
    setMigrationStatus('Sincronizando...');
    try {
      await migrateAllDataToFirestore();
      setMigrationStatus('¡Sincronizado!');
      setTimeout(() => setMigrationStatus(null), 3000);
    } catch {
      setMigrationStatus('Error');
      setTimeout(() => setMigrationStatus(null), 3000);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(true);
  };

  return (
    <>
      {/* Top Navbar matching the reference image */}
      <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#0d1526] border-b border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between px-4 lg:px-8 transition-colors shadow-xs">
        {/* Left Side: Mobile Menu Button + Clean Search Bar with Integrated Blue Button */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2.5 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl focus:outline-none transition-colors border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs shrink-0"
            aria-label="Abrir menú de navegación"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Integrated Search Bar from reference image */}
          <form
            onSubmit={handleExecuteSearch}
            className="flex items-center w-full max-w-md bg-slate-50/90 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-0.5 min-w-0"
          >
            <Search className="w-4 h-4 text-slate-400 ml-2.5 sm:ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={() => setIsSearchOpen(true)}
              placeholder="Buscar ejemplar, camada..."
              className="w-full text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 px-2 sm:px-3 py-1.5 bg-transparent focus:outline-none cursor-pointer truncate"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 sm:p-2 rounded-lg shrink-0 transition-colors cursor-pointer shadow-xs"
              title="Buscar"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Side: Theme Toggle + Notifications (Red Badge 3) + Help (?) + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Offline badge if internet dropped */}
          {!isOnline && (
            <button
              onClick={() => retryConnection()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-all cursor-pointer"
              title="Sin conexión a internet. Clic para reintentar."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Offline</span>
            </button>
          )}

          {/* Dark / Light Toggle Switch */}
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-2xs"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline text-xs font-semibold">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <span className="hidden sm:inline text-xs font-semibold">Oscuro</span>
              </>
            )}
          </button>

          {/* Notifications with Red Count Badge matching screenshot */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative"
              title="Centro de Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800 dark:text-white">
                      Notificaciones ({unreadNotifs.length})
                    </span>
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={marcarTodasNotificacionesLeidas}
                      className="text-[11px] text-blue-600 font-semibold hover:underline"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {unreadNotifs.length > 0 ? (
                    unreadNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          marcarNotificacionLeida(n.id);
                          if (n.enlaceTab) {
                            setActiveTab(n.enlaceTab);
                            setShowNotifications(false);
                          }
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs space-y-1"
                      >
                        <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
                          <span>{n.titulo}</span>
                          {n.tipo === 'CHAT' && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                              Chat
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">{n.mensaje}</p>
                        <span className="text-[10px] text-slate-400 font-mono">{n.fecha}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No hay notificaciones pendientes. Todo al día.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Button (?) matching reference image */}
          <button
            onClick={() => setActiveTab('ajustes')}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Ayuda y Documentación"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Register Kennel CTA Button or Ver Demo (ONLY shown when NOT logged in) */}
          {!firebaseUser ? (
            isDemoMode ? (
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
                title="Registrar mi Criadero Canino"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Registrar mi Criadero</span>
                <span className="sm:hidden">Registrar</span>
              </button>
            ) : (
              <button
                onClick={() => enterDemoMode()}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                title="Explorar criadero de muestra"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ver Demo</span>
              </button>
            )
          ) : null}

          {/* User Profile Button with Round Photo matching reference image */}
          <div className="relative pl-1 sm:pl-2 border-l border-slate-200/90 dark:border-slate-800">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
            >
              <img
                src={
                  currentUser.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                }
                alt={currentUser.nombre}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500 transition-all"
              />
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
                  {isDemoMode ? 'Visitante Demo' : currentUser.nombre || 'Juan Pérez'}
                </span>
                <span className="text-[10px] font-medium flex items-center gap-1">
                  {isDemoMode ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-[9px] bg-amber-50 dark:bg-amber-950/60 px-1 rounded">
                      Modo Demo
                    </span>
                  ) : currentUser.rol === 'SUPER_ADMIN' ? (
                    <span className="text-blue-600 font-bold">Administrador</span>
                  ) : (
                    <span className="text-slate-400">Criador</span>
                  )}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* User Profile Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{isDemoMode ? 'Visitante de Demostración' : currentUser.nombre}</span>
                    {isDemoMode && (
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded-full">
                        DEMO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {isDemoMode ? (firebaseUser?.email || 'Navegando como invitado') : currentUser.email}
                  </div>
                  <div className="text-[10px] text-blue-600 font-bold mt-1">
                    {currentCriadero?.nombre || 'Criadero Demo (Muestra)'}
                  </div>
                </div>

                <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                  {isDemoMode ? (
                    <>
                      <button
                        onClick={() => {
                          setIsRegisterModalOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Registrar mi Criadero</span>
                      </button>

                      <button
                        onClick={() => {
                          enterRealMode();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer mt-1"
                      >
                        <LogIn className="w-3.5 h-3.5 text-blue-500" />
                        <span>Iniciar Sesión / Acceder</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {!firebaseUser && (
                        <button
                          onClick={() => {
                            enterDemoMode();
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Volver a Modo Demo</span>
                        </button>
                      )}

                      <button
                        onClick={handleCloudSync}
                        disabled={isMigrating}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Cloud className="w-3.5 h-3.5 text-blue-500" />
                          <span>{migrationStatus || 'Sincronizar Cloud'}</span>
                        </span>
                        {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />}
                      </button>

                      {currentUser.rol === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => {
                            setActiveTab('superadmin');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                          <span>Panel Super Admin</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowPasswordModal(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Cambiar Contraseña</span>
                      </button>
                    </>
                  )}
                </div>

                {!isDemoMode && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Offline Alert Banner if disconnected */}
      {(!isOnline || connectionStatusMessage) && (
        <div
          className={`sticky top-16 z-20 px-4 sm:px-8 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border-b ${
            !isOnline
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {!isOnline ? (
              <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-medium">
              {connectionStatusMessage ||
                'Sin conexión a internet. Los cambios se guardan localmente y se sincronizarán con Cloud Firestore al reconectar.'}
            </span>
          </div>

          {!isOnline && (
            <button
              onClick={() => retryConnection()}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
            >
              Reintentar Conexión
            </button>
          )}
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-white space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cambiar Contraseña</h3>
                <p className="text-xs text-slate-500">Usuario: {currentUser.nombre}</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  passwordMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {passwordMsg.type === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
