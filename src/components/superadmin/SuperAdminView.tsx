import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Criadero, User, UserRole } from '../../types';
import {
  ShieldCheck,
  Building2,
  Users,
  HardDriveDownload,
  Activity,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Lock,
  X,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    criaderos,
    users,
    auditoria,
    addCriadero,
    updateCriadero,
    deleteCriadero,
    toggleCriaderoActivo,
    addUser,
    updateUser,
    updateUserRole,
    deleteUser,
    currentUser,
    setCurrentCriaderoId,
    setActiveTab,
    allEjemplares,
    exportBackupJSON,
    resetDatabaseToFactory,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'CRIADEROS' | 'USUARIOS' | 'AUDITORIA' | 'SISTEMA'>('CRIADEROS');
  const [showNewKennelModal, setShowNewKennelModal] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  // Edit states
  const [editingKennel, setEditingKennel] = useState<Criadero | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Delete confirmation modals
  const [deletingKennel, setDeletingKennel] = useState<Criadero | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New kennel form state
  const [nombre, setNombre] = useState('');
  const [afijo, setAfijo] = useState('');
  const [registroPOA, setRegistroPOA] = useState('');
  const [responsable, setResponsable] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('Buenos Aires');
  const [direccion, setDireccion] = useState('');

  // New user form state
  const [userNombre, setUserNombre] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRol, setUserRol] = useState<UserRole>('CRIADOR');
  const [userCriaderoId, setUserCriaderoId] = useState(criaderos[0]?.id || '');

  const showToast = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleCreateKennel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !afijo.trim()) return;

    addCriadero({
      nombre: nombre.trim(),
      afijo: afijo.trim(),
      registroPOA: registroPOA.trim() || 'POA en trámite',
      responsable: responsable.trim() || 'Criador Responsable',
      email: email.trim(),
      telefono: telefono.trim(),
      ciudad: ciudad.trim(),
      provincia: provincia.trim(),
      pais: 'Argentina',
      direccion: direccion.trim(),
      activo: true,
      monedaDefault: 'ARS',
    });

    setShowNewKennelModal(false);
    setNombre('');
    setAfijo('');
    setRegistroPOA('');
    setResponsable('');
    setEmail('');
    setTelefono('');
    setCiudad('');
    showToast('success', 'Criadero creado exitosamente.');
  };

  const handleUpdateKennel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKennel) return;

    updateCriadero(editingKennel.id, {
      nombre: editingKennel.nombre,
      afijo: editingKennel.afijo,
      registroPOA: editingKennel.registroPOA,
      responsable: editingKennel.responsable,
      email: editingKennel.email,
      telefono: editingKennel.telefono,
      ciudad: editingKennel.ciudad,
      provincia: editingKennel.provincia,
      direccion: editingKennel.direccion,
    });

    setEditingKennel(null);
    showToast('success', 'Datos del criadero actualizados.');
  };

  const handleConfirmDeleteKennel = async () => {
    if (!deletingKennel) return;
    setActionLoading(true);
    try {
      await deleteCriadero(deletingKennel.id);
      showToast('success', `El criadero "${deletingKennel.nombre}" y todos sus registros han sido eliminados por completo.`);
      setDeletingKennel(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Error al eliminar el criadero.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNombre.trim() || !userEmail.trim()) return;

    addUser({
      nombre: userNombre.trim(),
      email: userEmail.trim(),
      rol: userRol,
      criaderoId: userCriaderoId,
    });

    setShowNewUserModal(false);
    setUserNombre('');
    setUserEmail('');
    showToast('success', 'Usuario registrado exitosamente.');
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      nombre: editingUser.nombre,
      email: editingUser.email,
      rol: editingUser.rol,
      criaderoId: editingUser.criaderoId,
    });

    setEditingUser(null);
    showToast('success', 'Usuario actualizado correctamente.');
  };

  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      await deleteUser(deletingUser.id);
      showToast('success', `El usuario "${deletingUser.nombre}" ha sido eliminado del sistema.`);
      setDeletingUser(null);
    } catch (err: any) {
      showToast('error', err?.message || 'Error al eliminar el usuario.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs shadow-md transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="font-semibold">{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Panel de Control Super Administrador
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Control total de criaderos multitenant, administración de cuentas, eliminación permanente y registros en tiempo real.
          </p>
        </div>
      </div>

      {/* Super Admin Administrator Badge Card (Adaptive Light/Dark Design) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1526] border border-blue-200/90 dark:border-blue-900/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-300 font-black text-xl shrink-0">
            AD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-slate-900 dark:text-white">Administrador del Sistema</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Titular de <strong className="text-slate-900 dark:text-white">Criadero Canino Demo</strong> (Pilar, Buenos Aires)
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              <span>Email: admin@criaderodemo.com.ar</span>
              <span>·</span>
              <span>Afijo: CRIADERO DEMO</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Base de Datos: Cloud Firestore</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block font-mono">ESTADO DEL SERVICIO</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronización Cloud Activa
            </span>
          </div>
        </div>
      </div>

      {/* Global Metrics bar (Adaptive Light/Dark Design) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0d1526] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Criaderos Registrados</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{criaderos.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#0d1526] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Usuarios de Plataforma</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{users.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#0d1526] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Ejemplares Globales</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{allEjemplares.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#0d1526] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Logs de Auditoría</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{auditoria.length}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1526] text-xs px-2 rounded-t-2xl overflow-x-auto shadow-xs">
        {[
          { id: 'CRIADEROS', label: `Criaderos (${criaderos.length})`, icon: Building2 },
          { id: 'USUARIOS', label: `Usuarios (${users.length})`, icon: Users },
          { id: 'AUDITORIA', label: `Auditoría (${auditoria.length})`, icon: Activity },
          { id: 'SISTEMA', label: 'Respaldos y Sistema', icon: HardDriveDownload },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6 rounded-b-2xl bg-white dark:bg-[#0d1526] border border-t-0 border-slate-200 dark:border-slate-800 shadow-sm">
        {/* 1. CRIADEROS TAB */}
        {activeAdminTab === 'CRIADEROS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Criaderos Multitenant en el Sistema</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Podés acceder a gestionar cualquiera de ellos, editar sus credenciales o eliminarlos por completo.
                </p>
              </div>
              <button
                onClick={() => setShowNewKennelModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Criadero</span>
              </button>
            </div>

            <div className="space-y-3">
              {criaderos.map((c) => {
                const kennelDogsCount = allEjemplares.filter((e) => e.criaderoId === c.id).length;
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs hover:border-blue-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-slate-900 dark:text-white text-sm font-bold">{c.nombre}</strong>
                        <span className="font-mono text-blue-700 dark:text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[10px]">
                          {c.afijo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.activo
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {c.activo ? 'ACTIVO' : 'SUSPENDIDO'}
                        </span>
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                          {kennelDogsCount} {kennelDogsCount === 1 ? 'ejemplar' : 'ejemplares'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Código/POA: <strong>{c.registroPOA || 'Sin número'}</strong></span>
                        <span>•</span>
                        <span>Titular: <strong>{c.responsable || 'Sin titular'}</strong></span>
                        {c.telefono && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {c.telefono}
                            </span>
                          </>
                        )}
                        {(c.ciudad || c.provincia) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {c.ciudad}{c.ciudad && c.provincia ? ', ' : ''}{c.provincia}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Enter to manage kennel */}
                      <button
                        onClick={() => {
                          setCurrentCriaderoId(c.id);
                          setActiveTab('dashboard');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                        title="Ingresar a gestionar este criadero"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Gestionar</span>
                      </button>

                      {/* Edit Kennel */}
                      <button
                        onClick={() => setEditingKennel(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar datos del criadero"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      {/* Suspend / Activate */}
                      <button
                        onClick={() => toggleCriaderoActivo(c.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          c.activo
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {c.activo ? 'Suspender' : 'Activar'}
                      </button>

                      {/* Delete Complete Kennel */}
                      <button
                        onClick={() => setDeletingKennel(c)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 transition-colors cursor-pointer"
                        title="Eliminar criadero completo y sus registros"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. USUARIOS TAB */}
        {activeAdminTab === 'USUARIOS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cuentas de Usuarios de la Plataforma</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control de roles (SUPER_ADMIN, CRIADOR, DEMO), criadero asignado y eliminación de cuentas.
                </p>
              </div>
              <button
                onClick={() => setShowNewUserModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            <div className="space-y-3">
              {users.map((u) => {
                const userKennel = criaderos.find((c) => c.id === u.criaderoId);
                const isClaudioSuperAdmin =
                  u.email?.toLowerCase() === 'claudiobalmaceda.ok@gmail.com' ||
                  u.id === 'usr-admin';

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-blue-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.nombre}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                          {u.nombre.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 dark:text-white text-sm font-bold">{u.nombre}</strong>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                              u.rol === 'SUPER_ADMIN'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : u.rol === 'CRIADOR'
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {u.rol}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {u.email} • Criadero: <strong className="text-slate-700 dark:text-slate-300">{userKennel?.nombre || 'Sin criadero asignado'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role quick selector */}
                      <select
                        value={u.rol}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        disabled={isClaudioSuperAdmin}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="CRIADOR">CRIADOR</option>
                        <option value="DEMO">DEMO</option>
                      </select>

                      {/* Edit User Button */}
                      <button
                        onClick={() => setEditingUser(u)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Editar usuario"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      {/* Delete User Button */}
                      <button
                        onClick={() => setDeletingUser(u)}
                        disabled={isClaudioSuperAdmin}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isClaudioSuperAdmin
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-50'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 border-red-200 dark:border-red-900/60 cursor-pointer'
                        }`}
                        title={isClaudioSuperAdmin ? 'Cuenta principal protegida' : 'Eliminar usuario'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. AUDITORIA TAB */}
        {activeAdminTab === 'AUDITORIA' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Registro de Auditoría de Operaciones</h3>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-850 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Fecha y Hora</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Usuario</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Módulo</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Acción</th>
                    <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                  {auditoria.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/60 transition-colors">
                      <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400">{log.fecha.replace('T', ' ').slice(0, 19)}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">{log.usuarioNombre}</td>
                      <td className="p-2.5 font-mono text-blue-600 dark:text-blue-300 text-[10px]">{log.modulo}</td>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{log.accion}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{log.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SISTEMA & RESPALDOS TAB */}
        {activeAdminTab === 'SISTEMA' && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Exportación de Respaldo Maestro</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descarga un archivo JSON completo que contiene todos los criaderos, ejemplares, genealogías, finanzas y registros sanitarios.
              </p>
              <button
                onClick={exportBackupJSON}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>Descargar Respaldo JSON Maestro</span>
              </button>
            </div>

            <div className="p-5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-3">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Restablecimiento a Datos Oficiales de Fábrica</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reinicia la base de datos a los valores preconfigurados oficiales (Criadero Demo y Del Valle Pampeano).
              </p>
              <button
                onClick={() => {
                  if (window.confirm('¿Está seguro de reiniciar los datos a valores oficiales iniciales?')) {
                    resetDatabaseToFactory();
                    showToast('success', 'Base de datos restaurada a valores oficiales iniciales.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Restablecer a Valores Oficiales
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRM DELETE KENNEL MODAL */}
      {deletingKennel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1526] border border-red-200 dark:border-red-900/60 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">¿Eliminar Criadero Completo?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Estás a punto de eliminar de forma permanente el criadero{' '}
              <strong className="text-slate-900 dark:text-white">{deletingKennel.nombre}</strong> ({deletingKennel.afijo}).
              Todos los ejemplares, camadas, cachorros, montas, gestaciones y registros vinculados serán borrados de Firestore.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingKennel(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKennel}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Criadero</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE USER MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1526] border border-red-200 dark:border-red-900/60 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">¿Eliminar Usuario?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Se revocarán sus accesos</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Estás a punto de eliminar al usuario{' '}
              <strong className="text-slate-900 dark:text-white">{deletingUser.nombre}</strong> ({deletingUser.email}).
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Usuario</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT KENNEL MODAL */}
      {editingKennel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar Criadero: {editingKennel.nombre}</h3>
              <button onClick={() => setEditingKennel(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateKennel} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Criadero *</label>
                  <input
                    type="text"
                    value={editingKennel.nombre}
                    onChange={(e) => setEditingKennel({ ...editingKennel, nombre: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Afijo Oficial *</label>
                  <input
                    type="text"
                    value={editingKennel.afijo}
                    onChange={(e) => setEditingKennel({ ...editingKennel, afijo: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Registro POA / FCA</label>
                  <input
                    type="text"
                    value={editingKennel.registroPOA}
                    onChange={(e) => setEditingKennel({ ...editingKennel, registroPOA: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Titular Responsable</label>
                  <input
                    type="text"
                    value={editingKennel.responsable}
                    onChange={(e) => setEditingKennel({ ...editingKennel, responsable: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editingKennel.telefono}
                    onChange={(e) => setEditingKennel({ ...editingKennel, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingKennel.email}
                    onChange={(e) => setEditingKennel({ ...editingKennel, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={editingKennel.ciudad}
                    onChange={(e) => setEditingKennel({ ...editingKennel, ciudad: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={editingKennel.provincia}
                    onChange={(e) => setEditingKennel({ ...editingKennel, provincia: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingKennel(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Editar Usuario</h3>
              <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={editingUser.nombre}
                  onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol *</label>
                  <select
                    value={editingUser.rol}
                    onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CRIADOR">CRIADOR</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="DEMO">DEMO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Criadero Asignado</label>
                  <select
                    value={editingUser.criaderoId}
                    onChange={(e) => setEditingUser({ ...editingUser, criaderoId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {criaderos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW KENNEL MODAL */}
      {showNewKennelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Alta de Nuevo Criadero</h3>
              <button onClick={() => setShowNewKennelModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKennel} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Criadero *</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej: Criadero Von Der..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Afijo Oficial *</label>
                  <input
                    type="text"
                    value={afijo}
                    onChange={(e) => setAfijo(e.target.value)}
                    placeholder="ej: VON DER..."
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Registro POA / FCA</label>
                  <input
                    type="text"
                    value={registroPOA}
                    onChange={(e) => setRegistroPOA(e.target.value)}
                    placeholder="POA-3891 / FCA"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Titular Responsable</label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    placeholder="Nombre del criador"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    placeholder="Pilar"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewKennelModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Crear Criadero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW USER MODAL */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl text-slate-800 dark:text-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Alta de Nuevo Usuario</h3>
              <button onClick={() => setShowNewUserModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={userNombre}
                  onChange={(e) => setUserNombre(e.target.value)}
                  placeholder="ej: Juan Pérez"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="usuario@criadero.com"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol *</label>
                  <select
                    value={userRol}
                    onChange={(e) => setUserRol(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="CRIADOR">CRIADOR</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="DEMO">DEMO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Criadero Asignado</label>
                  <select
                    value={userCriaderoId}
                    onChange={(e) => setUserCriaderoId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {criaderos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
