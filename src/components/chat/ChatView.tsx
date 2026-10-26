import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Send,
  Phone,
  Search,
  Check,
  CheckCheck,
  Building2,
  MapPin,
  Lock,
  ExternalLink,
  Sparkles,
  LogIn,
  AlertCircle,
  Shield,
  UserCheck,
  ChevronRight,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { Criadero } from '../../types';

export const ChatView: React.FC = () => {
  const {
    chats,
    activeChatId,
    setActiveChatId,
    activeChatMessages,
    sendChatMessage,
    markChatAsRead,
    startOrOpenChatWithCriadero,
    criaderos,
    currentCriaderoId,
    currentCriadero,
    currentUser,
    firebaseUser,
    isDemoMode,
    loginWithGoogle,
    setIsRegisterModalOpen,
  } = useApp();

  const [inputTexto, setInputTexto] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabSub, setActiveTabSub] = useState<'CHATS' | 'DIRECTORIO'>('CHATS');
  const [mobilePane, setMobilePane] = useState<'LIST' | 'CHAT'>('LIST');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages]);

  // Mark active chat as read when opened
  useEffect(() => {
    if (activeChatId) {
      markChatAsRead(activeChatId);
    }
  }, [activeChatId]);

  // If no chat is selected but chats exist, select the first one by default
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [activeChatId, chats]);

  // Active chat details
  const activeChat = useMemo(() => {
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  // The other kennel in the active conversation
  const otherCriaderoId = useMemo(() => {
    if (!activeChat) return '';
    return (
      activeChat.participantCriaderoIds.find((id) => id !== currentCriaderoId) ||
      activeChat.participantCriaderoIds[0] ||
      ''
    );
  }, [activeChat, currentCriaderoId]);

  const otherCriadero = useMemo(() => {
    return criaderos.find((c) => c.id === otherCriaderoId);
  }, [criaderos, otherCriaderoId]);

  // Phone and public status
  const otherWhatsAppNumber = useMemo(() => {
    return (
      otherCriadero?.whatsappContacto ||
      otherCriadero?.telefono ||
      activeChat?.participantWhatsApps?.[otherCriaderoId]?.numero ||
      ''
    );
  }, [otherCriadero, activeChat, otherCriaderoId]);

  const isOtherWhatsAppPublic = useMemo(() => {
    if (otherCriadero?.whatsappPublico !== undefined) {
      return otherCriadero.whatsappPublico;
    }
    return activeChat?.participantWhatsApps?.[otherCriaderoId]?.publico ?? false;
  }, [otherCriadero, activeChat, otherCriaderoId]);

  // Clean WhatsApp number format for wa.me link
  const cleanWhatsAppUrl = useMemo(() => {
    if (!otherWhatsAppNumber) return '';
    // Strip non-digit characters
    const digitsOnly = otherWhatsAppNumber.replace(/\D/g, '');
    const prefilledText = encodeURIComponent(
      `Hola ${otherCriadero?.responsable || otherCriadero?.nombre || 'Colega'}, te contacto desde la Red de Criadores Caninos PRO referente a ejemplares y camadas.`
    );
    return `https://wa.me/${digitsOnly}?text=${prefilledText}`;
  }, [otherWhatsAppNumber, otherCriadero]);

  // Filtered chats list
  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      const otherId = c.participantCriaderoIds.find((id) => id !== currentCriaderoId) || '';
      const otherName = c.participantNames?.[otherId] || '';
      const otherAfijo = c.participantAfijos?.[otherId] || '';
      const search = searchTerm.toLowerCase();
      return (
        otherName.toLowerCase().includes(search) ||
        otherAfijo.toLowerCase().includes(search) ||
        c.lastMessageText.toLowerCase().includes(search)
      );
    });
  }, [chats, currentCriaderoId, searchTerm]);

  // Registered Kennels list (excluding current kennel)
  const directoryCriaderos = useMemo(() => {
    return criaderos
      .filter((c) => c.id !== currentCriaderoId)
      .filter((c) => {
        const search = searchTerm.toLowerCase();
        return (
          c.nombre.toLowerCase().includes(search) ||
          c.afijo.toLowerCase().includes(search) ||
          c.responsable.toLowerCase().includes(search) ||
          c.provincia.toLowerCase().includes(search) ||
          c.ciudad.toLowerCase().includes(search)
        );
      });
  }, [criaderos, currentCriaderoId, searchTerm]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTexto.trim() || !activeChatId || isSending) return;

    const texto = inputTexto;
    setInputTexto('');
    setIsSending(true);

    try {
      await sendChatMessage(activeChatId, texto);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartChat = async (targetId: string) => {
    const id = await startOrOpenChatWithCriadero(targetId);
    setActiveChatId(id);
    setActiveTabSub('CHATS');
    setMobilePane('CHAT');
  };

  return (
    <div className="space-y-4">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            Mensajes y Contacto entre Criadores
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Canal de comunicación 1 a 1 directo y seguro en tiempo real para consultas de cría, montas, pedigrees y WhatsApp.
          </p>
        </div>

        {/* Demo Mode Notice pill */}
        {isDemoMode && (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Modo Demo Activo:</strong> Vista de muestra. Para chatear en vivo con otros criadores, iniciá sesión.
            </span>
          </div>
        )}
      </div>

      {/* Main Chat Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] max-h-[82vh]">
        {/* Left Sidebar: Conversations & Kennel Directory */}
        <div className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 ${mobilePane === 'CHAT' ? 'hidden md:flex' : 'flex'}`}>
          {/* Tabs: Mis Chats vs Directorio */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1">
            <button
              onClick={() => setActiveTabSub('CHATS')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTabSub === 'CHATS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mis Chats ({chats.length})</span>
            </button>
            <button
              onClick={() => setActiveTabSub('DIRECTORIO')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTabSub === 'DIRECTORIO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Criaderos ({directoryCriaderos.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTabSub === 'CHATS'
                    ? 'Buscar en mensajes...'
                    : 'Buscar criadero, afijo, provincia...'
                }
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {activeTabSub === 'CHATS' ? (
              filteredChats.length > 0 ? (
                filteredChats.map((c) => {
                  const otherId =
                    c.participantCriaderoIds.find((id) => id !== currentCriaderoId) || '';
                  const otherName = c.participantNames?.[otherId] || 'Criadero Colega';
                  const otherAfijo = c.participantAfijos?.[otherId] || '';
                  const unread = c.unreadCounts?.[currentCriaderoId] || 0;
                  const isSelected = activeChatId === c.id;
                  const timeFormatted = c.lastMessageTimestamp
                    ? new Date(c.lastMessageTimestamp).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                      })
                    : '';

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveChatId(c.id);
                        setMobilePane('CHAT');
                      }}
                      className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {otherAfijo.substring(0, 2) || otherName.substring(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {otherName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {timeFormatted}
                          </span>
                        </div>

                        {otherAfijo && (
                          <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1 truncate">
                            {otherAfijo}
                          </div>
                        )}

                        <p className="text-xs text-slate-500 truncate line-clamp-1">
                          {c.lastMessageSenderCriaderoId === currentCriaderoId && (
                            <span className="text-slate-400 font-medium">Tú: </span>
                          )}
                          {c.lastMessageText}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="shrink-0 bg-red-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <p>No se encontraron conversaciones.</p>
                  <button
                    onClick={() => setActiveTabSub('DIRECTORIO')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Ver Directorio de Criaderos →
                  </button>
                </div>
              )
            ) : directoryCriaderos.length > 0 ? (
              directoryCriaderos.map((k) => (
                <div
                  key={k.id}
                  className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {k.afijo.substring(0, 2) || k.nombre.substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{k.nombre}</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase truncate">
                        {k.afijo}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>
                          {k.ciudad}, {k.provincia}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartChat(k.id)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Chatear con este criador"
                  >
                    <span>Chatear</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No hay otros criaderos coincidentes.
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Conversation Thread & Input */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 min-w-0 ${mobilePane === 'LIST' ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2.5 sm:gap-3 shadow-xs">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobilePane('LIST')}
                    className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Volver a la lista de mensajes"
                    aria-label="Volver a la lista"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-xs">
                    {otherCriadero?.afijo?.substring(0, 2) ||
                      activeChat.participantNames[otherCriaderoId]?.substring(0, 2).toUpperCase() ||
                      'CR'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {otherCriadero?.nombre || activeChat.participantNames[otherCriaderoId]}
                      </h3>
                      <span className="hidden xs:inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="hidden sm:inline">Criador Verificado</span>
                        <span className="sm:hidden">Verificado</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {otherCriadero?.afijo && (
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-[10px] sm:text-[11px] font-mono">
                          {otherCriadero.afijo}
                        </span>
                      )}
                      {otherCriadero?.responsable && (
                        <span className="text-[10px] sm:text-[11px] truncate">
                          {otherCriadero.responsable}
                        </span>
                      )}
                      {otherCriadero?.provincia && (
                        <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
                          • {otherCriadero.ciudad}, {otherCriadero.provincia}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct WhatsApp Quick Button (Security: only for authenticated breeders if public) */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDemoMode && firebaseUser ? (
                    isOtherWhatsAppPublic && otherWhatsAppNumber ? (
                      <a
                        href={cleanWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
                        title={`Abrir WhatsApp directo con ${otherCriadero?.responsable || otherCriadero?.nombre}`}
                      >
                        <Phone className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Abrir WhatsApp</span>
                        <ExternalLink className="w-3 h-3 text-emerald-200" />
                      </a>
                    ) : (
                      <div
                        className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl"
                        title="El criador mantiene su número privado. La comunicación es a través del chat del sistema."
                      >
                        <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="hidden sm:inline">WhatsApp Privado</span>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={() => loginWithGoogle()}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      title="Iniciá sesión para ver el WhatsApp y contactar directamente"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span className="hidden sm:inline">WhatsApp (Solo Logueados)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-950/50">
                {/* Security Shield Banner */}
                <div className="max-w-md mx-auto p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-center text-[11px] text-blue-800 dark:text-blue-300 flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    Conversación privada protegida. Solo visible por ambos criaderos y administradores de la red.
                  </span>
                </div>

                {activeChatMessages.map((msg) => {
                  const isMine = msg.senderCriaderoId === currentCriaderoId;
                  const time = msg.timestamp
                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-lg rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-bl-xs'
                        }`}
                      >
                        {!isMine && (
                          <div className="font-bold text-[10px] text-blue-600 dark:text-blue-400 mb-0.5">
                            {msg.senderNombre}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.texto}</p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                            isMine ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          <span>{time}</span>
                          {isMine && (
                            <span title={msg.leido ? 'Leído' : 'Enviado'}>
                              {msg.leido ? (
                                <CheckCheck className="w-3 h-3 text-cyan-300" />
                              ) : (
                                <Check className="w-3 h-3 text-blue-300" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Demo Mode Action Banner if not logged in */}
              {isDemoMode && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Estás en modo demostración. Iniciá sesión con Google para enviar mensajes en vivo a criadores reales.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => loginWithGoogle()}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="px-3 py-1 bg-white dark:bg-slate-900 hover:bg-amber-100 dark:hover:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Registrar Criadero
                    </button>
                  </div>
                </div>
              )}

              {/* Message Input Box */}
              <form
                onSubmit={handleSend}
                className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={inputTexto}
                  onChange={(e) => setInputTexto(e.target.value)}
                  placeholder={`Escribe un mensaje a ${otherCriadero?.nombre || 'este criadero'}...`}
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  disabled={!inputTexto.trim() || isSending}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base mb-1">
                Comunidad y Mensajes entre Criadores
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                Seleccioná una conversación activa o explorá el Directorio de Criaderos para iniciar un contacto 1 a 1 en tiempo real.
              </p>
              <button
                onClick={() => {
                  setActiveTabSub('DIRECTORIO');
                  setMobilePane('LIST');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Ver Directorio de Criaderos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
