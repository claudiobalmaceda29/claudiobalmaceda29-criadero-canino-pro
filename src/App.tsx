import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { PrintModal } from './components/common/PrintModal';
import { RegisterKennelModal } from './components/auth/RegisterKennelModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { DogsListView } from './components/dogs/DogsListView';
import { PedigreeView } from './components/pedigree/PedigreeView';
import { MatingsView } from './components/matings/MatingsView';
import { HeatProgesteroneView } from './components/cycles/HeatProgesteroneView';
import { LittersView } from './components/litters/LittersView';
import { PuppiesView } from './components/puppies/PuppiesView';
import { BreedingSimulatorView } from './components/breeding-simulator/BreedingSimulatorView';
import { GestationTimelineView } from './components/gestation/GestationTimelineView';
import { ShowsView } from './components/shows/ShowsView';
import { CertificatesView } from './components/certificates/CertificatesView';
import { EconomicsView } from './components/economics/EconomicsView';
import { HealthView } from './components/health/HealthView';
import { ReproductiveStatsView } from './components/statistics/ReproductiveStatsView';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { BackupSystemView } from './components/backup/BackupSystemView';
import { SettingsView } from './components/settings/SettingsView';
import { ChatView } from './components/chat/ChatView';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    isDemoMode,
    setIsRegisterModalOpen,
    enterRealMode,
    firebaseUser,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Register service worker for PWA support
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('Service worker registration failed:', err));
    }
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'chat':
        return <ChatView />;
      case 'ejemplares':
        return <DogsListView />;
      case 'pedigree':
        return <PedigreeView />;
      case 'montas':
        return <MatingsView />;
      case 'celos':
        return <HeatProgesteroneView />;
      case 'camadas':
        return <LittersView />;
      case 'cachorros':
        return <PuppiesView />;
      case 'simulador':
        return <BreedingSimulatorView />;
      case 'gestacion':
        return <GestationTimelineView />;
      case 'exposiciones':
        return <ShowsView />;
      case 'certificados':
        return <CertificatesView />;
      case 'economia':
        return <EconomicsView />;
      case 'sanidad':
        return <HealthView />;
      case 'estadisticas':
        return <ReproductiveStatsView />;
      case 'superadmin':
        return <SuperAdminView />;
      case 'respaldos':
        return <BackupSystemView />;
      case 'ajustes':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Demo Banner across entire app */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2.5 shadow-sm sticky top-0 z-40 lg:pl-68">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-black/25 px-2 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider">
              MODO DEMO INTERACTIVO
            </span>
            <span className="hidden sm:inline">
              Estás explorando datos de muestra. Creá tu cuenta para gestionar tus ejemplares y camadas reales.
            </span>
            <span className="sm:hidden">
              Explorando datos de muestra (Demo).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="bg-white hover:bg-orange-50 text-orange-950 font-bold px-3 py-1 rounded-lg text-xs shadow-xs transition-all cursor-pointer"
            >
              ✨ Registrar mi Criadero
            </button>
            <button
              onClick={() => enterRealMode()}
              className="bg-black/20 hover:bg-black/35 text-white font-medium px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {firebaseUser ? 'Acceder al Panel' : 'Iniciar Sesión'}
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto animate-in fade-in duration-150">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal />
      <PrintModal />
      <RegisterKennelModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
