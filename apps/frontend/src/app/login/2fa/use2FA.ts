import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { useRouter } from 'next/navigation';

export const use2FA = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const prepareMFA = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Verificar si ya tiene un factor verificado → no debería estar aquí
        const { data: listData } = await supabase.auth.mfa.listFactors();
        const alreadyVerified = listData?.all?.find(
          (f) => f.factor_type === 'totp' && f.status === 'verified'
        );
        if (alreadyVerified) {
          router.push('/login/2fa/verify');
          return;
        }

        // Limpiar factores sin verificar previos
        const pendingFactor = listData?.all?.find(
          (f) => f.factor_type === 'totp' && f.status === 'unverified'
        );
        if (pendingFactor) {
          await supabase.auth.mfa.unenroll({ factorId: pendingFactor.id });
        }

        // Enrolar nuevo factor
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          issuer: 'WorkFolder',
          friendlyName: 'Mi Dispositivo Seguro',
        });

        if (error) {
          console.error("Error en enroll:", error.message);
          return;
        }

        setFactorId(data.id);
        setQrCodeData(data.totp.qr_code);
      } catch (err) {
        console.error("Error inesperado:", err);
      } finally {
        setLoading(false);
      }
    };

    prepareMFA();
  }, [router]);

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

  const handleSubmit = async () => {
    if (!factorId) return;

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.join(''),
    });

    if (error) {
      alert("Código incorrecto o expirado. Intenta con el nuevo código de tu App.");
      setCode(['', '', '', '', '', '']);
    } else {
      router.push('/admin/enterprise-panel');
    }
  };

  return { code, qrCodeData, handleInputChange, handleSubmit, loading };
};
