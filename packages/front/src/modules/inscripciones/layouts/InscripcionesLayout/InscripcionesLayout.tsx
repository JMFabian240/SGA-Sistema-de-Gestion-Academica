import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ClipboardList, WalletCards, Clock } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css'; // Reutilizamos los estilos del layout de pestañas

export function InscripcionesLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Inscripciones Activas', path: '/inscripciones', icon: <ClipboardList size={18} />, exact: true },
    { name: 'Planes de Pago', path: '/inscripciones/planes-pago', icon: <WalletCards size={18} />, exact: false },
    { name: 'Ventanas Tempranas', path: '/inscripciones/ventanas', icon: <Clock size={18} />, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inscripciones y Cobranza</h1>
          <p className={styles.subtitle}>Gestiona las inscripciones de alumnos, planes de pago y periodos de beca temprana.</p>
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
