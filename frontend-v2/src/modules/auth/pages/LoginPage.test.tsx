import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { BrowserRouter } from 'react-router-dom';

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual as any,
    useNavigate: () => mockNavigate,
  };
});

// Mock de Zustand
const mockLogin = vi.fn();
vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ login: mockLogin })
}));

// Mock de tRPC
const mockMutate = vi.fn();
const mockUseMutation = vi.fn();

let isMutationPending = false;

vi.mock('../../../lib/trpc', () => {
  return {
    trpc: {
      auth: {
        login: {
          useMutation: (options?: any) => {
            mockUseMutation(options);
            return {
              mutate: mockMutate,
              isLoading: isMutationPending,
              isPending: isMutationPending
            };
          }
        }
      }
    }
  };
});

// Mock de lucide-react para evitar conflictos con React 19 en Vitest
vi.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eyeoff-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar el formulario correctamente', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('admin')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('debería ejecutar mutate al enviar credenciales', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usernameInput = screen.getByPlaceholderText('admin');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(usernameInput, { target: { value: 'gestor-test' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(mockMutate).toHaveBeenCalledWith({
      identificador: 'gestor-test',
      contrasena: 'password123'
    });
  });

  it('debería requerir los campos de usuario y contraseña (HTML5 validation) - Escenario 1', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('admin')).toBeRequired();
    expect(screen.getByPlaceholderText('••••••••')).toBeRequired();
  });

  it('debería deshabilitar el botón y mostrar el cargando en estado pendiente - Escenario 2', () => {
    isMutationPending = true;
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /iniciando/i });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    isMutationPending = false; // Reset
  });

  it('debería mostrar mensaje de error si la mutación tRPC falla - Escenario 3', async () => {
    let registeredOnError: any;
    mockUseMutation.mockImplementation((options) => {
      registeredOnError = options?.onError;
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    // Ejecutar el callback de error que tRPC invoca dentro de act
    act(() => {
      if (registeredOnError) {
        registeredOnError({ message: 'Usuario o contraseña incorrectos' });
      }
    });

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
  });
});
