import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutDashboard, Users, UserSquare2, CreditCard, LogOut, Settings } from 'lucide-react';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Panel Administrativo' },
    { to: '/alumnos', icon: Users, label: 'Alumnos' },
    { to: '/tutores', icon: UserSquare2, label: 'Tutores' },
    { to: '/pagos', icon: CreditCard, label: 'Pagos' },
  ];

  return (
    <aside className="w-64 bg-[#001429] text-slate-300 flex flex-col transition-all duration-300 relative z-20 shadow-xl h-full">
      {/* Logo Section */}
      <div className="p-6 pb-2 border-b border-slate-700/50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-2xl p-2 mb-3 shadow-sm flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="SGA Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-white font-bold text-lg tracking-wide">SGA</h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Colegio San Diego</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Principal</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                ? 'bg-blue-600/10 text-blue-400'
                : 'hover:bg-slate-800/50 hover:text-white'
              }`
            }
          >
            <item.icon size={18} strokeWidth={2.5} />
            {item.label}
          </NavLink>
        ))}

        <div className="mt-8 mb-4 px-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Configuración</div>
        </div>
        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
              ? 'bg-blue-600/10 text-blue-400'
              : 'hover:bg-slate-800/50 hover:text-white'
            }`
          }
        >
          <Settings size={18} strokeWidth={2.5} />
          Ajustes Generales
        </NavLink>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-[#000f20]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate w-32">{user?.name || 'Usuario'}</span>
              <span className="text-xs font-medium text-slate-400 capitalize">{user?.role?.toLowerCase() || 'Personal'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
