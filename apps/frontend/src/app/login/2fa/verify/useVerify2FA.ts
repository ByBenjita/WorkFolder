import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setAccessToken } from '@/services/authApi';

export type Verify2FAStatus = 'idle' | 'verifying' | 'success' | 'error';

/**
 * Resultado de un intento de verificación:
 *  - 'ok'      → código correcto
 *  - 'invalid' → el servidor rechazó el código (incorrecto o expirado)
 *  - 'blocked' → no se pudo intentar (factor no listo, red caída, excepción)
 */
export type VerifyOutcome = 'ok' | 'invalid' | 'blocked';

export const useVerify2FA = () => {
  const [code, setCode]           = useState(['', '', '', '', '', '']);
  const [factorId, setFactorId]   = useState<string>('');
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState<Verify2FAStatus>('idle');
  const router = useRouter();

  useEffect(() => {
    const getFactorId = async () => {
      try {
        const data = await authApi.getVerifiedFactor();
        if (!data.success || !data.factor_id) {
          router.push('/login');
          return;
        }
        setFactorId(data.factor_id);
      } catch {
        router.push('/login');
      }
    };
    getFactorId();
  }, [router]);

  const handleInputChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    if (status === 'error') setStatus('idle');
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const resetCode = () => {
    setCode(['', '', '', '', '', '']);
    document.getElementById('otp-0')?.focus();
  };

  /**
   * Verifica el código. No navega ni limpia de inmediato: deja que la UI
   * reproduzca el "veredicto" (giro + color) y luego llame a
   * `finishSuccess` (éxito) o `resetCode` (solo si fue 'invalid').
   */
  const handleSubmit = async (): Promise<VerifyOutcome> => {
    const fullCode = code.join('');
    if (fullCode.length !== 6 || !factorId) return 'blocked';

    setLoading(true);
    setStatus('verifying');
    try {
      const data = await authApi.mfaVerify(factorId, fullCode);

      if (data.success) {
        if (data.access_token) {
          setAccessToken(data.access_token);
        }
        setStatus('success');
        return 'ok';
      }

      // El servidor respondió: el código es incorrecto o expiró
      setStatus('error');
      return 'invalid';
    } catch {
      // Fallo de red o excepción: no fue un rechazo del código
      setStatus('idle');
      return 'blocked';
    } finally {
      setLoading(false);
    }
  };

  const finishSuccess = () => {
    router.push('/admin/enterprise-panel');
  };

  return {
    code,
    status,
    loading,
    ready: Boolean(factorId),
    handleInputChange,
    handleKeyDown,
    handleSubmit,
    finishSuccess,
    resetCode,
  };
};
