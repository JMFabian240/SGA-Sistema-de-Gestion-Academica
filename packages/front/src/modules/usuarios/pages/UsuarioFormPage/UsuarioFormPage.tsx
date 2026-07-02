import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft } from 'lucide-react';
import { trpc } from '../../../../lib/trpc';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Card, CardContent } from '../../../../components/ui/Card/Card';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import styles from './UsuarioFormPage.module.css';

const usuarioSchema = z.object({
  nombreUsuario: z.string().min(3, 'Mínimo 3 caracteres'),
  nombreCompleto: z.string().min(3, 'Mínimo 3 caracteres'),
  correo: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional(),
  rolId: z.string().min(1, 'Debe seleccionar un rol')
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

export function UsuarioFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'nuevo');

  // TODO: Agregar endpoint obtenerUsuario en el backend
  const usuario = null as any;
  const isLoadingUser = false;

  // Mocks o queries reales para roles (asumiremos que hay un endpoint, si no simulamos)
  // const { data: roles } = trpc.configuracion.listarRoles.useQuery();
  const roles = [
    { id: '1', nombre: 'Administrador' },
    { id: '2', nombre: 'Director' },
    { id: '3', nombre: 'Docente' },
    { id: '4', nombre: 'Cajero' },
  ];

  // tRPC Mutations
  const utils = trpc.useUtils();
  const createMutation = trpc.usuarios.crearUsuario.useMutation({
    onSuccess: () => {
      utils.usuarios.listarUsuarios.invalidate();
      navigate('/usuarios');
    }
  });

  // Si tuviéramos endpoint de actualizarUsuario
  // const updateMutation = trpc.usuarios.actualizarUsuario.useMutation({ ... })

  const { control, handleSubmit, reset, formState: { errors } } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombreUsuario: '',
      nombreCompleto: '',
      correo: '',
      password: '',
      rolId: ''
    }
  });

  useEffect(() => {
    if (usuario && isEditing) {
      reset({
        nombreUsuario: usuario.nombreUsuario,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        rolId: usuario.roles?.[0] ? String(usuario.roles[0]) : '',
        password: '' // No cargar password en edición
      });
    }
  }, [usuario, isEditing, reset]);

  const onSubmit = (data: UsuarioFormData) => {
    if (isEditing) {
      // updateMutation.mutate({ id, ...data });
      console.log('Update', data);
      navigate('/usuarios');
    } else {
      createMutation.mutate({
        nombreUsuario: data.nombreUsuario,
        nombreCompleto: data.nombreCompleto,
        correo: data.correo,
        password: data.password || '12345678', // mínimo 8
        roles: [Number(data.rolId)]
      });
    }
  };

  if (isEditing && isLoadingUser) {
    return <Spinner centered size={40} />;
  }

  const isSaving = createMutation.isPending;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <Button variant="ghost" onClick={() => navigate('/usuarios')} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className={styles.title}>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</h1>
            <p className={styles.subtitle}>Completa los datos del personal.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <div className={styles.gridRow}>
              <Controller
                name="nombreUsuario"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Nombre de Usuario"
                    placeholder="Ej. jperez"
                    error={errors.nombreUsuario?.message}
                    disabled={isSaving}
                  />
                )}
              />
              <Controller
                name="nombreCompleto"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Nombre Completo"
                    placeholder="Ej. Juan Pérez"
                    error={errors.nombreCompleto?.message}
                    disabled={isSaving}
                  />
                )}
              />
              <Controller
                name="correo"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    label="Correo Electrónico"
                    placeholder="juan@colegio.edu"
                    error={errors.correo?.message}
                    disabled={isSaving}
                  />
                )}
              />
            </div>

            <div className={styles.gridRow}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="password"
                    label={isEditing ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                    placeholder="••••••••"
                    error={errors.password?.message}
                    disabled={isSaving}
                  />
                )}
              />

              {/* Select improvisado hasta tener componente nativo */}
              <div className={styles.selectWrapper}>
                <label className={styles.label}>Rol en el Sistema</label>
                <Controller
                  name="rolId"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={styles.select}
                      disabled={isSaving}
                    >
                      <option value="">Selecciona un rol...</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.rolId && <span className={styles.errorMsg}>{errors.rolId.message}</span>}
              </div>
            </div>

            <div className={styles.actions}>
              <Button type="button" variant="ghost" onClick={() => navigate('/usuarios')} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" leftIcon={<Save size={18} />} isLoading={isSaving}>
                Guardar Usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
