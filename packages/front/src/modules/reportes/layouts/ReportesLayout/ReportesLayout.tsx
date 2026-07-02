import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart, AlertTriangle, Users } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css';

export function ReportesLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Corte de Ingresos', path: '/reportes', icon: <BarChart size={18} />, exact: true },
    { name: 'Cartera Vencida', path: '/reportes/deudores', icon: <AlertTriangle size={18} />, exact: false },
    { name: 'Listas de Asistencia', path: '/reportes/asistencia', icon: <Users size={18} />, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Módulo de Reportes</h1>
          <p className={styles.subtitle}>Extrae resúmenes gerenciales de cobranza, deudores y asistencias académicas.</p>
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
