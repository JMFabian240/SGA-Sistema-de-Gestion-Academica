import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Table, type Column } from '../../../../components/ui/Table/Table';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { MateriaFormModal } from '../../components/MateriaFormModal/MateriaFormModal';
import styles from '../NivelesListPage/NivelesListPage.module.css';

type MateriaRow = {
  materiaId: number;
  nombre: string;
  clave: string;
};

export function MateriasListPage() {
  const { data: materias, isLoading } = trpc.grupos.getMaterias.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.grupos.deleteMateria.useMutation({
    onSuccess: () => utils.grupos.getMaterias.invalidate()
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<MateriaRow | null>(null);

  const handleOpenNew = () => {
    setEditingMateria(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: MateriaRow) => {
    setEditingMateria(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Seguro que deseas eliminar esta materia?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<MateriaRow>[] = [
    { header: 'ID', accessor: 'materiaId' },
    { header: 'Clave', accessor: 'clave' },
    { header: 'Nombre', accessor: 'nombre' },
    {
      header: 'Acciones',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.materiaId)}>
            <Trash2 size={16} color="var(--color-danger-600)" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <Button onClick={handleOpenNew} leftIcon={<Plus size={18} />}>
          Nueva Materia
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <Spinner centered size={32} />
        ) : (
          <Table<MateriaRow>
            columns={columns}
            data={materias || []}
            keyExtractor={(row) => row.materiaId}
          />
        )}
      </div>

      <MateriaFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        materiaId={editingMateria?.materiaId}
        initialData={editingMateria ? { 
          nombre: editingMateria.nombre, 
          clave: editingMateria.clave,
        } : undefined}
      />
    </div>
  );
}
