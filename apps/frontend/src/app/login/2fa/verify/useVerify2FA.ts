import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setAccessToken } from '@/services/authApi';

export const useVerify2FA = () => {
  const [code, setCode]           = useState(['', '', '', '', '', '']);
  const [factorId, setFactorId]   = useState<string>('');
  const [loading, setLoading]     = useState(false);
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

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6 || !factorId) return;

    setLoading(true);
    try {
      const data = await authApi.mfaVerify(factorId, fullCode);

      if (!data.success) {
        alert('Código incorrecto o expirado.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
        return;
      }

      // ── Guardar el nuevo token AAL2 ──────────────────────────
      if (data.access_token) {
        setAccessToken(data.access_token);
      }

      router.push('/admin/enterprise-panel');

    } finally {
      setLoading(false);
    }
  };

  return { code, handleInputChange, handleKeyDown, handleSubmit, loading };
};