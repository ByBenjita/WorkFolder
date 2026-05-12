import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/authApi';

export const useLogin = () => {
  const [loading, setLoading]   = useState(false);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);

      if (!data.success) {
        alert('Credenciales incorrectas');
        return;
      }

      // La API ya detectó el estado del 2FA
      if (data.mfa.next_step === 'verify') {
        router.push('/login/2fa/verify');
      } else {
        router.push('/login/2fa');
      }

    } catch (error) {
      console.error('Error inesperado', error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, email, setEmail, password, setPassword, handleLogin };
};