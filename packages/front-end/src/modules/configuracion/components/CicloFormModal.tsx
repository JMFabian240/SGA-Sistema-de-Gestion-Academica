import React, { useState, useEffect } from 'react';
import { trpc } from '../../../lib/trpc';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cicloId?: number;
  initialData?: { nombre: string; fechaInicio: string; fechaFin: string; activo?: boolean; periodicidad?: 'ANUAL' | 'SEMESTRAL' };
};

export function CicloFormModal({ isOpen, onClose, cicloId, initialData }: Props) {
  const utils = trpc.useContext();
  const isEditing = !!cicloId;

  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activo, setActivo] = useState(false);
  const [periodicidad, setPeriodicidad] = useState<'ANUAL' | 'SEMESTRAL'>('ANUAL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setNombre(initialData.nombre);
        setFechaInicio(initialData.fechaInicio);
        setFechaFin(initialData.fechaFin);
        setActivo(!!initialData.activo);
        setPeriodicidad(initialData.periodicidad || 'ANUAL');
      } else {
        setNombre('');
        setFechaInicio('');
        setFechaFin('');
        setActivo(false);
        setPeriodicidad('ANUAL');
      }
    }
  }, [isOpen, initialData]);

  const createMutation = trpc.grupos.createCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Error al guardar el ciclo escolar.');
    }
  });

  const updateMutation = trpc.grupos.updateCiclo.useMutation({
    onSuccess: () => {
      utils.grupos.getCiclos.invalidate();
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Error al actualizar el ciclo escolar.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre || !fechaInicio || !fechaFin) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    // Convert date string from input (YYYY-MM-DD) to ISO datetime string
    // e.g. "2026-08-01" -> "2026-08-01T00:00:00.000Z"
    const startISO = new Date(fechaInicio).toISOString();
    const endISO = new Date(fechaFin).toISOString();

    const payload = {
      nombre,
      fechaInicio: startISO,
      fechaFin: endISO,
      activo,
      periodicidad
    };

    if (isEditing) {
      updateMutation.mutate({ cicloId: cicloId!, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Ciclo Escolar' : 'Nuevo Ciclo Escolar'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 animate-in fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre del Ciclo Escolar"
            placeholder="Ej. 2025-2026"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={isSaving}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Periodicidad
            </label>
            <select
              value={periodicidad}
              onChange={(e) => setPeriodicidad(e.target.value as 'ANUAL' | 'SEMESTRAL')}
              disabled={isSaving}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-navy-500 outline-none text-sm bg-white h-[38px] sm:text-sm"
            >
              <option value="ANUAL">Anual</option>
              <option value="SEMESTRAL">Semestral</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Fecha de Inicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            disabled={isSaving}
            required
          />
          <Input
            type="date"
            label="Fecha de Fin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            disabled={isSaving}
            required
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-gray-100">
          <input
            type="checkbox"
            id="activo-checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
            disabled={isSaving}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="activo-checkbox" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
            Marcar como Ciclo Escolar Activo
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Guardar Ciclo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
