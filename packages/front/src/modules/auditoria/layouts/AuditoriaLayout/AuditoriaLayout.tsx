import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css';

export function AuditoriaLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Bitácora de Eventos', path: '/auditoria', icon: <ShieldAlert size={18} />, exact: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Auditoría y Seguridad</h1>
          <p className={styles.subtitle}>Supervisa los cambios y modificaciones realizadas por los usuarios en el sistema.</p>
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
