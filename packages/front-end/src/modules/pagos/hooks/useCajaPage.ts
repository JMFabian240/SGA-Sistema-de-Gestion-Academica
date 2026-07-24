import { useState } from 'react';
import { trpc, RouterOutput } from '../../../lib/trpc';
import toast from 'react-hot-toast';

export type AlumnoSearch = RouterOutput['alumnos']['getAll'][0];
export type AlumnoSeleccionado = NonNullable<RouterOutput['alumnos']['getById']>;
export type Adeudo = RouterOutput['pagos']['getAdeudos'][0];
export type CuentaPendiente = RouterOutput['dashboard']['obtenerCuentasPendientes'][0];

export function useCajaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [adeudosSeleccionados, setAdeudosSeleccionados] = useState<Adeudo[]>([]);
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);

  const { data: topDeudores = [] } = trpc.dashboard.obtenerTopDeudores.useQuery(undefined, { enabled: !selectedAlumnoId });
  const { data: ultimosPagos = [] } = trpc.dashboard.obtenerUltimosPagos.useQuery(undefined, { enabled: !selectedAlumnoId });
  const { data: cuentasPendientes = [] } = trpc.dashboard.obtenerCuentasPendientes.useQuery(undefined, { enabled: !selectedAlumnoId });

  const { data: alumnos = [], isLoading: isBuscando } = trpc.alumnos.getAll.useQuery(undefined, {
    enabled: searchTerm.length > 2,
  });

  const alumnosFiltrados = searchTerm.length > 2
    ? alumnos.filter((a) =>
        a.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const cuentasPorNivel = cuentasPendientes.reduce((acc, cuenta) => {
    const nivel = cuenta.nivelNombre || 'Sin Nivel';
    if (!acc[nivel]) {
      acc[nivel] = [];
    }
    acc[nivel].push(cuenta);
    return acc;
  }, {} as Record<string, CuentaPendiente[]>);

  const nivelesOrdenados = Object.entries(cuentasPorNivel).sort(([nivelA], [nivelB]) => {
    const getPeso = (n: string) => {
      const nom = n.toLowerCase();
      if (nom.includes('preescolar')) return 1;
      if (nom.includes('primaria')) return 2;
      if (nom.includes('secundaria')) return 3;
      if (nom.includes('bachiller')) return 4;
      return 99;
    };
    return getPeso(nivelA) - getPeso(nivelB);
  });

  const { data: adeudos = [], isLoading: isLoadingAdeudos, refetch: refetchAdeudos } = trpc.pagos.getAdeudos.useQuery(
    { alumnoId: selectedAlumnoId! },
    { enabled: !!selectedAlumnoId }
  );

  const { data: alumnoSeleccionado, isLoading: isLoadingAlumno } = trpc.alumnos.getById.useQuery(
    selectedAlumnoId!, 
    { enabled: !!selectedAlumnoId }
  );

  const aplicarRecargo = trpc.pagos.aplicarRecargoManual.useMutation({
    onSuccess: () => {
      toast.success('Recargo aplicado exitosamente');
      refetchAdeudos();
    },
    onError: (err) => toast.error(`Error: ${err.message}`)
  });

  const handleSelectAlumno = (alumnoId: number | null, tutorId?: number | null) => {
    setSelectedAlumnoId(alumnoId);
    setSelectedTutorId(tutorId || null);
    setSearchTerm('');
    setAdeudosSeleccionados([]);
  };

  const toggleAdeudo = (adeudo: Adeudo) => {
    const isSelected = adeudosSeleccionados.some(a => a.calendarioPagoId === adeudo.calendarioPagoId);
    if (isSelected) {
      setAdeudosSeleccionados(prev => prev.filter(a => a.calendarioPagoId !== adeudo.calendarioPagoId));
    } else {
      setAdeudosSeleccionados(prev => [...prev, adeudo]);
    }
  };

  const toggleAll = () => {
    const pendientes = adeudos.filter(a => a.estadoCobro === 'PENDIENTE');
    if (adeudosSeleccionados.length === pendientes.length) {
      setAdeudosSeleccionados([]);
    } else {
      setAdeudosSeleccionados(pendientes);
    }
  };

  const handleCheckoutSuccess = () => {
    setAdeudosSeleccionados([]);
    refetchAdeudos();
  };

  return {
    searchTerm, setSearchTerm,
    selectedAlumnoId, selectedTutorId,
    adeudosSeleccionados, setAdeudosSeleccionados,
    isCargoModalOpen, setIsCargoModalOpen,
    topDeudores, ultimosPagos, cuentasPendientes,
    alumnos, isBuscando, alumnosFiltrados,
    cuentasPorNivel, nivelesOrdenados,
    adeudos, isLoadingAdeudos, refetchAdeudos,
    alumnoSeleccionado, isLoadingAlumno,
    aplicarRecargo,
    handleSelectAlumno, toggleAdeudo, toggleAll, handleCheckoutSuccess
  };
}
