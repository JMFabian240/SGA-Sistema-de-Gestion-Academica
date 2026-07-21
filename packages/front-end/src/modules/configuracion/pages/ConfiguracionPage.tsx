import { useState } from 'react';
import { ImportacionDatosPanel } from '../components/ImportacionDatosPanel';
import { PlanesPagoPanel } from '../components/PlanesPagoPanel';
import { TransicionCicloWizard } from '../components/TransicionCicloWizard';
import { InscripcionTransicionPage } from '../components/InscripcionTransicionPage';
import { PromocionesPanel } from '../components/PromocionesPanel';
import { useAuthStore } from '../../../store/useAuthStore';
import { CiclosPanel } from '../components/CiclosPanel';
import { TarifasPanel } from '../components/TarifasPanel';
import { CierreCicloPanel } from '../components/CierreCicloPanel';
import { trpc } from '../../../lib/trpc';

type TabType = 'ciclos' | 'tarifas' | 'planespago' | 'cierre' | 'importacion' | 'inscripcion-transicion' | 'promociones';

export function ConfiguracionPage() {
  const { user } = useAuthStore();
  const hasPermisoBecas = user?.role === 'ADMIN' || user?.role === 'Administrador' || user?.permisosModulos?.find((m: any) => m.modulo === 'Becas')?.nivel !== 'DENEGADO';

  const [activeTab, setActiveTab] = useState<TabType>('ciclos');
  
  // State lifted up for transition wizard routing
  const [wizardCiclo, setWizardCiclo] = useState<any>(null);
  const [inscripcionDestinoId, setInscripcionDestinoId] = useState<number | null>(null);

  const { data: ciclos } = trpc.grupos.getCiclos.useQuery();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Title */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-800">Configuración General</h2>
          <p className="text-gray-500">Gestión de reglas de negocio, ciclos escolares y tarifas financieras</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ciclos')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'ciclos'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Ciclos Escolares
        </button>
        <button
          onClick={() => setActiveTab('tarifas')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'tarifas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Finanzas y Tarifas
        </button>
        <button
          onClick={() => setActiveTab('planespago')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'planespago'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Planes de Pago
        </button>
        <button
          onClick={() => setActiveTab('cierre')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'cierre'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Operaciones de Ciclo
        </button>
        <button
          onClick={() => setActiveTab('importacion')}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
            activeTab === 'importacion'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-navy-800'
          }`}
        >
          Importación de Datos
        </button>
        {hasPermisoBecas && (
          <button
            onClick={() => setActiveTab('promociones')}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'promociones'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-navy-800'
            }`}
          >
            Becas y Promociones
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="mt-6">
        {activeTab === 'ciclos' && <CiclosPanel />}
        {activeTab === 'tarifas' && <TarifasPanel />}
        {activeTab === 'planespago' && <PlanesPagoPanel />}
        {activeTab === 'cierre' && (
          <CierreCicloPanel 
            onTransicionarCiclo={(ciclo) => setWizardCiclo(ciclo)} 
          />
        )}
        {activeTab === 'importacion' && <ImportacionDatosPanel ciclos={ciclos || []} />}
        {activeTab === 'promociones' && hasPermisoBecas && <PromocionesPanel />}

        {activeTab === 'inscripcion-transicion' && wizardCiclo && inscripcionDestinoId && (
          <InscripcionTransicionPage 
            cicloOrigenId={wizardCiclo.cicloId} 
            cicloDestinoId={inscripcionDestinoId}
            onBack={() => {
              setActiveTab('cierre');
              setWizardCiclo(null);
              setInscripcionDestinoId(null);
            }}
          />
        )}
      </div>

      {wizardCiclo && activeTab !== 'inscripcion-transicion' && (
        <TransicionCicloWizard
          isOpen={true}
          onClose={() => setWizardCiclo(null)}
          cicloActual={wizardCiclo}
          onOpenNewCiclo={() => {
            // Se invoca un helper vacío. El modal se abre desde CiclosPanel
            // pero podríamos despachar un evento si es necesario.
            setActiveTab('ciclos');
            setWizardCiclo(null);
          }}
          onContinueToInscripcion={(destId) => {
            setInscripcionDestinoId(destId);
            setActiveTab('inscripcion-transicion');
          }}
        />
      )}
    </div>
  );
}
