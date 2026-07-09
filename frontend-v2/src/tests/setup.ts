import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Realizar limpieza del DOM después de cada prueba
afterEach(() => {
  cleanup();
});
