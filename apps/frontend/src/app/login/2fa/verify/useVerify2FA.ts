import { useState } from 'react';
import { supabase } from '@/services/supabase';
import { useRouter } from 'next/navigation';

export const useVerify2FA = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    try {
      // Obtenemos el factor verificado del usuario
      const { data: mfaData } = await supabase.auth.mfa.listFactors();
      const verifiedFactor = mfaData?.all?.find(
        (f) => f.factor_type === 'totp' && f.status === 'verified'
      );

      if (!verifiedFactor) {
        alert("No se encontró un factor 2FA configurado.");
        router.push('/login/2fa');
        return;
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: verifiedFactor.id,
        code: fullCode,
      });

      if (error) {
        alert("Código incorrecto o expirado. Intenta con el código actual de tu App.");
        setCode(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      } else {
        router.push('/admin/enterprise-panel');
      }
    } catch (err) {
      console.error("Error inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  return { code, handleInputChange, handleKeyDown, handleSubmit, loading };
};
