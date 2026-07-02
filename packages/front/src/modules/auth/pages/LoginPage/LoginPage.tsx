import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Input } from '../../../../components/ui/Input/Input';
import { Button } from '../../../../components/ui/Button/Button';
import { useAuth } from '../../../../hooks/useAuth';
import { trpc } from '../../../../lib/trpc';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setToken = useAuth(state => state.setToken);
  const setUsuario = useAuth(state => state.setUsuario);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      setUsuario(data.usuario);
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.message || 'Credenciales inválidas');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña');
      return;
    }
    
    loginMutation.mutate({ correo: email, contrasena: password });
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Iniciar Sesión</h2>
        <p className={styles.description}>Ingresa tus credenciales para acceder al sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          type="email"
          label="Correo Electrónico"
          placeholder="tu@colegio.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={18} />}
          disabled={loginMutation.isPending}
        />
        
        <Input
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={18} />}
          disabled={loginMutation.isPending}
        />

        {error && <div className={styles.errorAlert}>{error}</div>}

        <Button 
          type="submit" 
          className={styles.submitBtn} 
          isLoading={loginMutation.isPending}
        >
          Acceder al Sistema
        </Button>
      </form>
    </div>
  );
}
