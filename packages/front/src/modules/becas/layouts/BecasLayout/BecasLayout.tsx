import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Award, FileSignature, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css';

export function BecasLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Catálogo de Becas', path: '/becas', icon: <Award size={18} />, exact: true },
    { name: 'Solicitudes en Revisión', path: '/becas/solicitudes', icon: <FileSignature size={18} />, exact: false },
    { name: 'Becas Asignadas', path: '/becas/asignadas', icon: <CheckCircle size={18} />, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Módulo de Becas y Apoyos</h1>
          <p className={styles.subtitle}>Configura el catálogo de descuentos, revisa solicitudes de apoyo y asigna becas vigentes.</p>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          {tabs.map((tab) => {
            const isActive = tab.exact 
              ? location.pathname === tab.path 
              : location.pathname.startsWith(tab.path);

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={clsx(styles.tabItem, isActive && styles.tabActive)}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
