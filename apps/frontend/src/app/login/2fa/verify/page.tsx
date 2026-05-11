'use client';

import React, { useEffect } from 'react';
import { useVerify2FA } from './useVerify2FA';
import PageTransition from '../../../components/PageTransition';

export default function Verify2FAPage() {
  const { code, handleInputChange, handleKeyDown, handleSubmit, loading } = useVerify2FA();

  // Auto-focus primer input al cargar
  useEffect(() => {
    document.getElementById('otp-0')?.focus();
  }, []);

  return (
    <PageTransition direction="left">
      <main style={{
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.88), rgba(0,0,0,0.88)), url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Segoe UI", system-ui, sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          padding: '32px 28px',
          backgroundColor: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          textAlign: 'center',
        }}>
          {/* Icono */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e90ff22, #1e90ff44)',
            border: '1px solid #1e90ff44',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 24,
          }}>🔑</div>

          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            Verificación 2FA
          </h1>
          <p style={{ color: '#4a5568', fontSize: 12, lineHeight: 1.5, marginBottom: 28 }}>
            Ingresa el código de 6 dígitos de tu aplicación de autenticación (Google Authenticator, Authy, etc.)
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* Inputs OTP */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              {code.map((digit, index) => (
                <React.Fragment key={index}>
                  <input
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    required
                    style={{
                      width: 40,
                      height: 50,
                      backgroundColor: digit ? 'rgba(30,144,255,0.12)' : 'rgba(255,255,255,0.04)',
                      border: digit ? '1px solid #1e90ff88' : '1px solid #2a2a2a',
                      borderRadius: 8,
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#fff',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  {index === 2 && (
                    <span style={{ color: '#1e90ff', fontSize: 18, fontWeight: 700 }}>–</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: loading || code.join('').length !== 6 ? '#1a1a1a' : '#1e90ff',
                color: loading || code.join('').length !== 6 ? '#444' : '#fff',
                fontWeight: 800,
                fontSize: 13,
                borderRadius: 10,
                border: 'none',
                cursor: loading || code.join('').length !== 6 ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                boxShadow: code.join('').length === 6 && !loading ? '0 4px 20px rgba(30,144,255,0.3)' : 'none',
              }}
            >
              {loading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <p style={{ color: '#2d3748', fontSize: 11, marginTop: 20, fontWeight: 600 }}>
            WorkFolder Secure Vault · Enterprise
          </p>
        </div>
      </main>
    </PageTransition>
  );
}
