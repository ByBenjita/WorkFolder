import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services/authApi';

export const use2FA = () => {
  const [code, setCode]           = useState(['', '', '', '', '', '']);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [factorId, setFactorId]   = useState<string>('');
  const [loading, setLoading]     = useState(true);
  const router = useRouter();

  useEffect(() => {
    const setupMFA = async () => {
      setLoading(true);
      try {
        const data = await authApi.mfaEnroll();

        if (!data.success) {
          console.error('Error al generar QR');
          return;
        }

        setFactorId(data.factor_id);
        setQrCodeData(data.qr_code);
      } catch (err) {
        console.error('Error inesperado:', err);
      } finally {
        setLoading(false);
      }
    };

    setupMFA();
  }, []);

  const handleInputChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!factorId) return;

    const data = await authApi.mfaVerify(factorId, code.join(''));

    if (!data.success) {
      alert('Código incorrecto o expirado. Intenta con el nuevo código de tu App.');
      setCode(['', '', '', '', '', '']);
    } else {
      router.push('/admin/enterprise-panel');
    }
  };

  return { code, qrCodeData, handleInputChange, handleSubmit, loading };
};