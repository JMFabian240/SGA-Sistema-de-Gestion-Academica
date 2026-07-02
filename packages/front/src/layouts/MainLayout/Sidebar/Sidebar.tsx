import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserSquare2, Users2, Library, 
  GraduationCap, ClipboardList, WalletCards, BadgePercent, 
  LineChart, ShieldAlert, Settings 
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';

const NAVIGATION = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Alumnos', to: '/alumnos', icon: GraduationCap },
  { name: 'Tutores', to: '/tutores', icon: Users2 },
  { name: 'Inscripciones', to: '/inscripciones', icon: ClipboardList },
  { name: 'Grupos y Catálogos', to: '/grupos', icon: Library },
  { name: 'Pagos', to: '/pagos', icon: WalletCards },
  { name: 'Becas', to: '/becas', icon: BadgePercent },
  { name: 'Calificaciones', to: '/calificaciones', icon: LineChart },
  { name: 'Reportes', to: '/reportes', icon: LineChart },
  { name: 'Usuarios', to: '/usuarios', icon: UserSquare2 },
  { name: 'Auditoría', to: '/auditoria', icon: ShieldAlert },
  { name: 'Configuración', to: '/configuracion', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>SGA</div>
      </div>
      <nav className={styles.nav}>
        {NAVIGATION.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                clsx(styles.navItem, isActive && styles.navItemActive)
              }
            >
              <Icon size={20} className={styles.icon} />
              <span className={styles.label}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
