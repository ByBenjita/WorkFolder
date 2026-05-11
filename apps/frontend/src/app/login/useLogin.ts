import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../services/supabase';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("Credenciales incorrectas: " + error.message);
        return;
      }

      await supabase.auth.refreshSession();

      // Verificamos si el usuario ya tiene 2FA configurado y verificado
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = mfaData?.all?.find(
        (f) => f.factor_type === 'totp' && f.status === 'verified'
      );

      if (verifiedFactor) {
        // Ya tiene 2FA → mandamos a VERIFICAR (solo los 6 dígitos)
        router.push('/login/2fa/verify');
      } else {
        // No tiene 2FA → mandamos a CONFIGURAR
        router.push('/login/2fa');
      }

    } catch (error) {
      console.error("Error inesperado", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    email,
    setEmail,
    password,
    setPassword,
    handleLogin
  };
};
