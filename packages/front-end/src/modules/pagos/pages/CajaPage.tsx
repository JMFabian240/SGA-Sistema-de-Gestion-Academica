import { TicketCheckout } from '../components/TicketCheckout';
import { NuevoCargoModal } from '../components/NuevoCargoModal';
import { useCajaPage } from '../hooks/useCajaPage';
import { BuscadorAlumnos } from '../components/BuscadorAlumnos';
import { ListaEstadoCuenta } from '../components/ListaEstadoCuenta';
import { PanelDeudores } from '../components/PanelDeudores';
import toast from 'react-hot-toast';

export function CajaPage() {
  const caja = useCajaPage();

  return (
    <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full gap-6">
      <BuscadorAlumnos 
        searchTerm={caja.searchTerm}
        setSearchTerm={caja.setSearchTerm}
        isBuscando={caja.isBuscando}
        alumnosFiltrados={caja.alumnosFiltrados}
        selectedAlumnoId={caja.selectedAlumnoId}
        handleSelectAlumno={caja.handleSelectAlumno}
      />

      {caja.selectedAlumnoId ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          <ListaEstadoCuenta 
            alumnoSeleccionado={caja.alumnoSeleccionado}
            isLoadingAlumno={caja.isLoadingAlumno}
            adeudos={caja.adeudos}
            isLoadingAdeudos={caja.isLoadingAdeudos}
            adeudosSeleccionados={caja.adeudosSeleccionados}
            toggleAdeudo={caja.toggleAdeudo}
            toggleAll={caja.toggleAll}
            onOpenCargoModal={() => {
              const cicloExtraId = caja.alumnoSeleccionado?.inscripciones?.[0]?.cicloId || caja.adeudos?.[0]?.cicloId;
              if (!cicloExtraId) {
                toast.error('El alumno seleccionado no tiene un ciclo escolar activo ni adeudos previos. No se puede crear un cargo extra.');
                return;
              }
              caja.setIsCargoModalOpen(true);
            }}
            onApplyRecargo={(adeudoId) => caja.aplicarRecargo.mutate({ calendarioPagoId: adeudoId })}
          />

          <div className="h-full">
            <TicketCheckout
              alumnoId={caja.selectedAlumnoId}
              tutorId={caja.selectedTutorId}
              adeudosSeleccionados={caja.adeudosSeleccionados as any}
              onCheckoutSuccess={caja.handleCheckoutSuccess}
            />
          </div>
        </div>
      ) : (
        <PanelDeudores 
          ultimosPagos={caja.ultimosPagos}
          topDeudores={caja.topDeudores}
          cuentasPendientes={caja.cuentasPendientes}
          nivelesOrdenados={caja.nivelesOrdenados}
          handleSelectAlumno={caja.handleSelectAlumno}
        />
      )}

      {caja.selectedAlumnoId && (
        <NuevoCargoModal
          isOpen={caja.isCargoModalOpen}
          onClose={() => caja.setIsCargoModalOpen(false)}
          alumnoId={caja.selectedAlumnoId}
          cicloId={caja.alumnoSeleccionado?.inscripciones?.[0]?.cicloId || caja.adeudos?.[0]?.cicloId || 0}
        />
      )}
    </div>
  );
}
