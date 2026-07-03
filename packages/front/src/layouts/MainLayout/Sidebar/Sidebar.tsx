import { NavLink } from 'react-router-dom';
import {
  Home, Users, Heart, BookOpen, Award, FileText, FileDown,
  CreditCard, Star, BarChart3, Calendar, Shield, History, LogOut
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';
import { useAuth } from '../../../hooks/useAuth';

const NAVIGATION = [
  {
    category: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: Home, roles: ['ADMIN', 'DIRECTOR', 'GESTOR', 'DOCENTE', 'MAESTRA'] },
    ]
  },
  {
    category: 'ACADÉMICO',
    items: [
      { name: 'Directorio Escolar', to: '/alumnos', icon: Users, roles: ['ADMIN', 'GESTOR', 'DOCENTE'] },
      { name: 'Padres & Tutores', to: '/tutores', icon: Heart, roles: ['ADMIN', 'GESTOR'] },
      { name: 'Grupos & Materias', to: '/grupos', icon: BookOpen, roles: ['ADMIN', 'GESTOR', 'DOCENTE'] },
      { name: 'Calificaciones', to: '/calificaciones', icon: Award, roles: ['ADMIN', 'GESTOR', 'DOCENTE'] },
      { name: 'Historial Académico', to: '/historial-academico', icon: FileText, roles: ['ADMIN', 'GESTOR', 'DOCENTE'] },
      { name: 'Boletas', to: '/boleta', icon: FileDown, roles: ['ADMIN', 'GESTOR', 'DOCENTE'] },
    ]
  },
  {
    category: 'FINANZAS',
    items: [
      { name: 'Registro de Pagos', to: '/pagos', icon: CreditCard, roles: ['ADMIN', 'GESTOR'] },
      { name: 'Gestión de Becas', to: '/becas', icon: Star, roles: ['ADMIN', 'GESTOR'] },
      { name: 'Reportes Financieros', to: '/reportes', icon: BarChart3, roles: ['ADMIN', 'DIRECTOR'] },
    ]
  },
  {
    category: 'SISTEMA',
    items: [
      { name: 'Ciclo Escolar', to: '/ciclo-escolar', icon: Calendar, roles: ['ADMIN'] },
      { name: 'Usuarios', to: '/usuarios', icon: Shield, roles: ['ADMIN'] },
      { name: 'Bitácora', to: '/bitacora', icon: History, roles: ['ADMIN'] },
    ]
  }
];

export function Sidebar() {
  const { usuario, logout } = useAuth();
  const userRole = usuario?.rol || 'ADMIN'; // Default to ADMIN if no user for testing, or could be empty

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoAvatar}>
          <img src="/logo.png" alt="Logo" className={styles.logoImage} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>COLEGIO</span>
          <span className={styles.logoSubtitle}>San Diego</span>
        </div>
      </div>
      <nav className={styles.nav}>
        {NAVIGATION.map((group) => {
          const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(userRole));

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.category} className={styles.navGroup}>
              <div className={styles.navCategory}>{group.category}</div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      clsx(styles.navItem, isActive && styles.navItemActive)
                    }
                  >
                    <Icon size={18} className={styles.icon} />
                    <span className={styles.label}>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {usuario?.nombre?.charAt(0) || 'U'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName} title={usuario?.nombre || 'Usuario'}>{usuario?.nombre || 'Usuario'}</span>
          <span className={styles.userRole}>{usuario?.rol || 'Rol'}</span>
        </div>
        <button onClick={logout} className={styles.logoutBtn} title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
