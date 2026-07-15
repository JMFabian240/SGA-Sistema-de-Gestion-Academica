import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfiguracionPage } from './ConfiguracionPage';
import React from 'react';



// Mock del modal hijo
vi.mock('../components/CicloFormModal', () => ({
  CicloFormModal: ({ isOpen }: any) => isOpen ? React.createElement('div', { 'data-testid': 'ciclo-modal' }, 'CicloModal') : null
}));

// Mock del panel de importación
vi.mock('../components/ImportacionDatosPanel', () => ({
  ImportacionDatosPanel: () => React.createElement('div', { 'data-testid': 'importacion-panel' }, 'ImportacionDatosPanel')
}));

// Mock de alertas y confirmaciones
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
window.confirm = mockConfirm;
window.alert = mockAlert;

// Mocks de tRPC
const mockGetCiclos = vi.fn();
const mockGetNiveles = vi.fn();
const mockGetTarifas = vi.fn();
const mockGetGrupos = vi.fn();
const mockGetAlumnosCierre = vi.fn();
const mockDeleteCiclo = vi.fn();
const mockUpdateTarifa = vi.fn();
const mockCreateTarifa = vi.fn();
const mockCerrarCiclo = vi.fn();
const mockInvalidate = vi.fn();

let loadingCiclos = false;

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      useContext: () => ({
        grupos: {
          getCiclos: { invalidate: mockInvalidate },
          getGrupos: { invalidate: mockInvalidate }
        },
        pagos: { getTarifas: { invalidate: mockInvalidate } }
      }),
      grupos: {
        getCiclos: { useQuery: () => mockGetCiclos() },
        getNiveles: { useQuery: () => mockGetNiveles() },
        deleteCiclo: { useMutation: () => ({ mutate: mockDeleteCiclo }) },
        getGrupos: { useQuery: () => mockGetGrupos() },
        getAlumnosCierreGrupo: { useQuery: (args: any, options: any) => mockGetAlumnosCierre(args, options) },
        cerrarCicloGrupo: { useMutation: () => ({ mutate: mockCerrarCiclo }) }
      },
      pagos: {
        getTarifas: { useQuery: (options: any, config: any) => mockGetTarifas(options, config) },
        createTarifa: { useMutation: () => ({ mutateAsync: mockCreateTarifa }) },
        updateTarifa: { useMutation: () => ({ mutateAsync: mockUpdateTarifa }) }
      }
    }
  };
});

describe('ConfiguracionPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadingCiclos = false;

    mockGetCiclos.mockReturnValue({
      data: [
        { cicloId: 1, nombre: 'Ciclo 2024-2025', periodicidad: 'ANUAL', activo: true, fechaInicio: '2024-08-01', fechaFin: '2025-07-01' },
        { cicloId: 2, nombre: 'Ciclo 2024-1', periodicidad: 'SEMESTRAL', activo: false, fechaInicio: '2024-01-01', fechaFin: '2024-06-30' }
      ],
      isLoading: loadingCiclos
    });

    mockGetNiveles.mockReturnValue({
      data: [
        { nivelId: 1, codigo: 'PRI', nombre: 'Primaria' },
        { nivelId: 2, codigo: 'BAC', nombre: 'Bachillerato' }
      ],
      isLoading: false
    });

    mockGetTarifas.mockReturnValue({
      data: [],
      isLoading: false
    });

    mockGetGrupos.mockReturnValue({
      data: [],
      isLoading: false
    });

    mockGetAlumnosCierre.mockReturnValue({
      data: [],
      isLoading: false
    });
  });

  it('debería renderizar la página y las pestañas principales', () => {
    render(<ConfiguracionPage />);

    expect(screen.getByText('Ciclos Escolares')).toBeInTheDocument();
    expect(screen.getByText('Importación de Datos')).toBeInTheDocument();
    expect(screen.getByText('Ciclo 2024-2025')).toBeInTheDocument();
  });

  it('debería cambiar a la pestaña de Importación de Datos', () => {
    render(<ConfiguracionPage />);

    const importTab = screen.getByText('Importación de Datos');
    fireEvent.click(importTab);

    expect(screen.getByTestId('importacion-panel')).toBeInTheDocument();
  });
});
