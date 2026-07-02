import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Layers, Calendar, BookOpen, Users as UsersIcon } from 'lucide-react';
import clsx from 'clsx';
import styles from './GruposLayout.module.css';

export function GruposLayout() {
  const location = useLocation();

  const tabs = [
    { name: 'Grupos', path: '/grupos', icon: <UsersIcon size={18} />, exact: true },
    { name: 'Ciclos Escolares', path: '/grupos/ciclos', icon: <Calendar size={18} />, exact: false },
    { name: 'Niveles', path: '/grupos/niveles', icon: <Layers size={18} />, exact: false },
    { name: 'Materias', path: '/grupos/materias', icon: <BookOpen size={18} />, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Catálogos Académicos</h1>
          <p className={styles.subtitle}>Administra la estructura académica y la asignación de grupos.</p>
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
