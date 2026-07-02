import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Header.module.css';

export function Header() {
  const logout = useAuth(state => state.logout);
  const usuario = useAuth(state => state.usuario);

  return (
    <header className={styles.header}>
      <div className={styles.leftContainer}>
        <h2 className={styles.pageTitle}>Panel de Control</h2>
      </div>
      <div className={styles.rightContainer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <span className={styles.userName}>
            {usuario?.nombre || 'Usuario'}
          </span>
        </div>
        <button className={styles.logoutBtn} onClick={logout} title="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
