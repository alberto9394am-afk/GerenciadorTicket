import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  Ticket, 
  PlusCircle, 
  Inbox, 
  BarChart3, 
  Users, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  CheckCheck, 
  Clock,
  ShieldCheck,
  Wrench,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef(null);

  // Fecha dropdown de notificações ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const roleBadges = {
    admin: { label: 'Administrador', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: ShieldCheck },
    tecnico: { label: 'Técnico', bg: 'bg-sky-100 text-sky-800 border-sky-200', icon: Wrench },
    usuario: { label: 'Usuário', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: UserIcon },
  };

  const currentRole = roleBadges[user?.perfil] || { label: user?.perfil, bg: 'bg-slate-100 text-slate-800', icon: UserIcon };
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
              aria-label="Abrir menu"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Ticket className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Helpdesk <span className="text-indigo-600">Pro</span>
              </span>
            </div>
          </div>

          {/* Ações da Direita */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sino de Notificações */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                title="Notificações"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificações */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-2xl ring-1 ring-black/5 border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">Notificações</span>
                      {unreadCount > 0 && (
                        <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Marcar todas
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                        <Bell className="h-8 w-8 text-slate-300" />
                        <span>Nenhuma notificação no momento.</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-slate-50 transition flex items-start gap-3 ${
                            n.lida === 0 ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className={`mt-0.5 rounded-full p-1.5 ${n.lida === 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Clock className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 text-xs">
                            <p className={`text-slate-800 ${n.lida === 0 ? 'font-semibold' : 'font-normal'}`}>
                              {n.mensagem}
                            </p>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              {new Date(n.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {n.lida === 0 && (
                            <button
                              onClick={() => markNotificationAsRead(n.id)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50"
                              title="Marcar como lida"
                            >
                              Lida
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="h-6 w-px bg-slate-200" />

            {/* Perfil do Usuário */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{user?.nome}</span>
                <span className={`inline-flex items-center gap-1 self-end text-[11px] font-medium px-2 py-0.5 rounded-full border mt-0.5 ${currentRole.bg}`}>
                  <RoleIcon className="h-3 w-3" />
                  {currentRole.label}
                </span>
              </div>
              
              <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm shadow-inner">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
              </div>

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition ml-1"
                title="Sair do sistema"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Container Principal: Sidebar + Conteúdo */}
      <div className="flex flex-1">
        {/* Backdrop para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 mt-16 md:mt-0 md:static flex flex-col w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 flex-1 flex flex-col justify-between">
            <nav className="space-y-1.5">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Menu Principal
              </div>

              {/* 1. Cadastro de ticket: todos os perfis */}
              <NavLink
                to="/tickets/new"
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <PlusCircle className="h-4 w-4 text-indigo-500" />
                <span>Novo Ticket</span>
              </NavLink>

              {/* 2. Novos tickets: Admin e Técnico (tickets sem técnico; Técnico tem o botão "Assumir") */}
              {(user?.perfil === 'admin' || user?.perfil === 'tecnico') && (
                <NavLink
                  to="/tickets/unassigned"
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Inbox className="h-4 w-4 text-amber-500" />
                  <span>Novos Tickets</span>
                </NavLink>
              )}

              {/* 3. Meus tickets: Usuário (os seus), Técnico (os associados a ele), Admin (todos) */}
              <NavLink
                to="/tickets"
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Ticket className="h-4 w-4 text-sky-500" />
                <span>Meus Tickets</span>
              </NavLink>

              {/* 4. Relatório de acompanhamento: apenas Admin */}
              {user?.perfil === 'admin' && (
                <>
                  <div className="pt-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Administração
                  </div>
                  <NavLink
                    to="/reports"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <BarChart3 className="h-4 w-4 text-violet-500" />
                    <span>Relatório</span>
                  </NavLink>

                  {/* 5. Usuários: apenas Admin */}
                  <NavLink
                    to="/users"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span>Usuários</span>
                  </NavLink>
                </>
              )}
            </nav>

            {/* Rodapé da Sidebar */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex flex-col gap-1 px-3">
              <span className="font-medium text-slate-600">Helpdesk v1.0</span>
              <span>Conectado como <strong className="text-slate-700">@{user?.login}</strong></span>
            </div>
          </div>
        </aside>

        {/* Área de Conteúdo */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
