import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { DollarSign, FileText, Tags } from 'lucide-react';
import clsx from 'clsx';
import styles from '../../../grupos/layouts/GruposLayout/GruposLayout.module.css'; // Reutilizamos estilos

export function PagosLayout() {
  const location = useLocation();
  
  const tabs = [
    { name: 'Caja (Registrar Pago)', path: '/pagos', icon: <DollarSign size={18} />, exact: true },
    { name: 'Estado de Cuenta (Adeudos)', path: '/pagos/adeudos', icon: <FileText size={18} />, exact: false },
    { name: 'Catálogo de Tarifas', path: '/pagos/tarifas', icon: <Tags size={18} />, exact: false },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Módulo de Caja y Finanzas</h1>
          <p className={styles.subtitle}>Cobra colegiaturas, gestiona adeudos y ajusta las tarifas de la institución.</p>
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
