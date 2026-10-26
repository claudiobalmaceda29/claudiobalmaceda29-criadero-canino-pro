import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Dog,
  GitFork,
  Activity,
  HeartHandshake,
  Baby,
  FolderKanban,
  Sparkles,
  CircleDot,
  CalendarClock,
  FileCheck2,
  ShieldCheck,
  Trophy,
  CircleDollarSign,
  BarChart3,
  Shield,
  HardDriveDownload,
  Settings,
  X,
  Building2,
  ChevronDown,
  CheckCircle,
  LucideIcon,
  MessageSquare,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  onlySuperAdmin?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    currentCriadero,
    criaderos,
    setCurrentCriaderoId,
    notificaciones,
    unreadChatMessagesCount,
    isDemoMode,
    setIsRegisterModalOpen,
    firebaseUser,
  } = useApp();

  const [showCriaderoMenu, setShowCriaderoMenu] = useState(false);
  const unreadCount = notificaciones.filter((n) => !n.leida).length;

  const navGroups: NavGroup[] = [
    {
      items: [
        {
          id: 'dashboard',
          label: 'Panel',
          icon: LayoutDashboard,
          badge: unreadCount > 0 ? `${unreadCount}` : undefined,
        },
        {
          id: 'chat',
          label: 'Mensajes',
          icon: MessageSquare,
          badge: unreadChatMessagesCount > 0 ? `${unreadChatMessagesCount}` : undefined,
        },
        {
          id: 'ejemplares',
          label: 'Ejemplares',
          icon: Dog,
        },
        {
          id: 'pedigree',
          label: 'Pedigrees',
          icon: GitFork,
        },
      ],
    },
    {
      title: 'REPRODUCCIÓN',
      items: [
        {
          id: 'celos',
          label: 'Celos',
          icon: Activity,
        },
        {
          id: 'montas',
          label: 'Montas',
          icon: HeartHandshake,
        },
        {
          id: 'gestacion',
          label: 'Gestación',
          icon: Baby,
        },
        {
          id: 'camadas',
          label: 'Camadas',
          icon: FolderKanban,
        },
        {
          id: 'simulador',
          label: 'Simulador Genético',
          icon: Sparkles,
        },
      ],
    },
    {
      title: 'CACHORROS',
      items: [
        {
          id: 'cachorros',
          label: 'Fichas',
          icon: CircleDot,
        },
        {
          id: 'reservas',
          label: 'Reservas',
          icon: CalendarClock,
        },
        {
          id: 'certificados',
          label: 'Certificados',
          icon: FileCheck2,
        },
      ],
    },
    {
      title: 'GESTIÓN',
      items: [
        {
          id: 'sanidad',
          label: 'Sanidad',
          icon: ShieldCheck,
        },
        {
          id: 'exposiciones',
          label: 'Exposiciones',
          icon: Trophy,
        },
        {
          id: 'economia',
          label: 'Finanzas',
          icon: CircleDollarSign,
        },
        {
          id: 'estadisticas',
          label: 'Estadísticas',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        {
          id: 'superadmin',
          label: 'SuperAdmin',
          icon: Shield,
          onlySuperAdmin: true,
        },
        {
          id: 'respaldos',
          label: 'Respaldos',
          icon: HardDriveDownload,
        },
        {
          id: 'ajustes',
          label: 'Configuración',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-64 bg-white dark:bg-[#0d1526] border-r border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-sm ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header matching reference image */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0d1526]">
          <div className="flex items-center gap-2.5">
            {/* Dog Logo in blue outline */}
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
                GESTIÓN DE
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                CRIADERO CANINO PRO
              </span>
              <span className="text-[7.5px] font-bold text-slate-400 tracking-tight mt-0.5">
                PROFESIONAL • COMPLETO • CONFIABLE
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => {
              if (item.onlySuperAdmin && currentUser.rol !== 'SUPER_ADMIN') {
                return false;
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-0.5">
                {group.title && (
                  <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'reservas' && activeTab === 'cachorros');
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id === 'reservas' ? 'cachorros' : item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white text-blue-600'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Kennel Switcher Card matching reference image */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070b14]/60 relative">
          {/* Prominent Demo Call-To-Action Card in Sidebar (Only when not logged in) */}
          {!firebaseUser && isDemoMode && (
            <div className="mb-2.5 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs shadow-xs">
              <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>¿Tenés tu propio Criadero?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                Salí del modo demo y gestioná tus ejemplares y camadas con datos reales y privados.
              </p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg text-center transition-all cursor-pointer shadow-xs"
              >
                Registrar mi Criadero
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (isDemoMode || currentUser.rol === 'SUPER_ADMIN') {
                setShowCriaderoMenu((prev) => !prev);
              }
            }}
            className={`w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center justify-between text-left transition-all ${
              isDemoMode || currentUser.rol === 'SUPER_ADMIN'
                ? 'hover:border-blue-400 cursor-pointer group'
                : 'cursor-default'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <div
                className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs ${
                  isDemoMode ? 'bg-amber-600' : 'bg-blue-600'
                }`}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                    {isDemoMode ? 'Criadero Demo' : 'Criadero Activo'}
                  </span>
                  {isDemoMode && (
                    <span className="text-[8px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-extrabold px-1 rounded">
                      MUESTRA
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                  {currentCriadero?.nombre || 'Criadero Demo'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5 truncate">
                  {currentCriadero?.registroPOA || currentCriadero?.afijo || 'POA-1428'}
                </span>
              </div>
            </div>
            {(isDemoMode || currentUser.rol === 'SUPER_ADMIN') && (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1" />
            )}
          </button>

          {/* Kennel switcher popover (only for Super Admin or Demo) */}
          {showCriaderoMenu && (isDemoMode || currentUser.rol === 'SUPER_ADMIN') && (
            <div
              className="absolute bottom-16 left-3 right-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
              onMouseLeave={() => setShowCriaderoMenu(false)}
            >
              <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Cambiar Criadero
              </div>
              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                {criaderos.map((cria) => (
                  <button
                    key={cria.id}
                    onClick={() => {
                      setCurrentCriaderoId(cria.id);
                      setShowCriaderoMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      cria.id === currentCriadero?.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{cria.nombre}</span>
                    {cria.id === currentCriadero?.id && (
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
