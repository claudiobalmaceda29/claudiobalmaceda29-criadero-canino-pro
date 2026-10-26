import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Building2,
  Smartphone,
  Shield,
  KeyRound,
  CheckCircle,
  Save,
  Download,
  AlertCircle,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentCriadero, updateCriadero, currentUser, cambiarPasswordUsuario } = useApp();

  const [nombre, setNombre] = useState(currentCriadero?.nombre || '');
  const [afijo, setAfijo] = useState(currentCriadero?.afijo || '');
  const [registroPOA, setRegistroPOA] = useState(currentCriadero?.registroPOA || '');
  const [responsable, setResponsable] = useState(currentCriadero?.responsable || '');
  const [email, setEmail] = useState(currentCriadero?.email || '');
  const [telefono, setTelefono] = useState(currentCriadero?.telefono || '');
  const [whatsappContacto, setWhatsappContacto] = useState(currentCriadero?.whatsappContacto || currentCriadero?.telefono || '');
  const [whatsappPublico, setWhatsappPublico] = useState<boolean>(currentCriadero?.whatsappPublico ?? true);
  const [ciudad, setCiudad] = useState(currentCriadero?.ciudad || '');
  const [provincia, setProvincia] = useState(currentCriadero?.provincia || '');
  const [direccion, setDireccion] = useState(currentCriadero?.direccion || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSaveKennel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCriadero) return;

    updateCriadero(currentCriadero.id, {
      nombre,
      afijo,
      registroPOA,
      responsable,
      email,
      telefono,
      whatsappContacto,
      whatsappPublico,
      ciudad,
      provincia,
      direccion,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassMsg({ type: 'err', text: 'La contraseña debe tener mínimo 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'err', text: 'Las contraseñas no coinciden.' });
      return;
    }

    const ok = cambiarPasswordUsuario(newPassword);
    if (ok) {
      setPassMsg({ type: 'ok', text: 'Contraseña actualizada de forma segura.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Configuración y Perfil del Criadero
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Personalización de datos oficiales, membrete de documentos, seguridad de cuenta e instalación PWA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Kennel Profile Edit */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Datos Oficiales del Criadero Activo
            </h3>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                ¡Cambios guardados con éxito!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveKennel} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Criadero *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Afijo Oficial *</label>
                <input
                  type="text"
                  value={afijo}
                  onChange={(e) => setAfijo(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registro POA / FCA *</label>
                <input
                  type="text"
                  value={registroPOA}
                  onChange={(e) => setRegistroPOA(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titular Responsable</label>
                <input
                  type="text"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono Fijo / Alternativo</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Módulo de Contacto WhatsApp entre Criadores */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                    WA
                  </div>
                  <span className="font-bold text-slate-900 text-xs">
                    WhatsApp Directo de Contacto entre Criadores
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                  Red de Criaderos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                    WhatsApp de Contacto (con código de país)
                  </label>
                  <input
                    type="text"
                    value={whatsappContacto}
                    onChange={(e) => setWhatsappContacto(e.target.value)}
                    placeholder="+5491140593388"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-300 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Ejemplo para Argentina: <span className="font-mono font-semibold">+549</span> seguido del código de área y número.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-emerald-200/90 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="chk-whatsapp-publico"
                    checked={whatsappPublico}
                    onChange={(e) => setWhatsappPublico(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="chk-whatsapp-publico" className="text-[11px] text-slate-700 cursor-pointer select-none">
                    <span className="font-bold block text-slate-900">
                      Mostrar botón de WhatsApp a otros criadores
                    </span>
                    Permitir que criadores registrados y autenticados vean tu WhatsApp y te contacten de forma directa con un click.
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección / Predio</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos del Criadero</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Security & PWA Installation */}
        <div className="space-y-6">
          {/* PWA App Information */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Aplicación Móvil Instalable (PWA)
            </h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              La plataforma está optimizada como Progressive Web App. Podés instalarla directamente en la pantalla de inicio de tu celular o computadora sin descargar desde tiendas.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px]">
              <div className="text-slate-800 font-semibold">¿Cómo instalar en tu dispositivo?</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li><strong>En Android / Chrome:</strong> Tocar el menú de 3 puntos y elegir &quot;Instalar aplicación&quot; o &quot;Agregar a la pantalla principal&quot;.</li>
                <li><strong>En iOS / iPhone Safari:</strong> Tocar el botón Compartir y seleccionar &quot;Agregar al inicio&quot;.</li>
                <li><strong>En PC / Mac:</strong> Hacer clic en el ícono de instalación en la barra de direcciones de Chrome o Edge.</li>
              </ul>
            </div>
          </div>

          {/* Account Password Change */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Seguridad y Cambio de Contraseña
            </h4>
            <p className="text-slate-500 text-[11px]">
              Usuario actual: <strong className="text-slate-800">{currentUser.email}</strong>
            </p>

            {passMsg && (
              <div
                className={`p-2.5 rounded-lg text-[11px] font-medium ${
                  passMsg.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-slate-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-700 mb-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetir contraseña"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
