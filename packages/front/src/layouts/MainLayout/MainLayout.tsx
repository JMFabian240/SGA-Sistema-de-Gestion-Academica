import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar/Sidebar';
import { Header } from './Header/Header';
import styles from './MainLayout.module.css';

export function MainLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainWrapper}>
        <Header />
        <main className={styles.content}>
          <div className={styles.pageContainer}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
