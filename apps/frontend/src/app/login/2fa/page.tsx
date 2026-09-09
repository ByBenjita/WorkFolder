'use client';

import React, { useEffect } from 'react';
import { twoFAStyles } from './TwoFAPage.styles';
import { use2FA } from './use2FA';
import PageTransition from '../../components/PageTransition';

export default function TwoFAPage() {
  const { code, qrCodeData, handleInputChange, handleSubmit, loading } = use2FA();

  // Foco en el primer dígito al cargar
  useEffect(() => {
    document.getElementById('otp-0')?.focus();
  }, []);

  const codeComplete = code.join('').length === 6;

  return (
    <PageTransition direction="left">
      <style jsx>{twoFAStyles}</style>

      <main className="tfa-root">
        <div className="grid-bg" />

        <div className="tfa-card">
          <div className="tfa-icon">🔐</div>

          <h1 className="tfa-title">Autenticación en Dos Pasos</h1>
          <p className="tfa-subtitle">
            Protege el acceso a la bóveda vinculando una app de autenticación
            (Google Authenticator, Authy, 1Password…).
          </p>

          <div className="tfa-step">
            <span className="tfa-step-num">1</span>
            <span className="tfa-step-text">
              Escanea este código con tu app de autenticación
            </span>
          </div>

          <div className="tfa-qr">
            <div className="tfa-qr-frame">
              {qrCodeData ? (
                <img
                  src={qrCodeData}
                  alt="Código QR para configurar MFA"
                  width={160}
                  height={160}
                />
              ) : (
                <div className="tfa-qr-loading">
                  {loading ? 'Generando código…' : 'No se pudo cargar el código'}
                </div>
              )}
            </div>
          </div>

          <div className="tfa-divider" />

          <div className="tfa-step">
            <span className="tfa-step-num">2</span>
            <span className="tfa-step-text">
              Ingresa el código de 6 dígitos que muestra la app
            </span>
          </div>

          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="tfa-otp">
              {code.map((digit, index) => (
                <React.Fragment key={index}>
                  <input
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    className="tfa-otp-input"
                    value={digit}
                    onChange={(e) => handleInputChange(e.target.value, index)}
                    required
                  />
                  {index === 2 && <span className="tfa-otp-sep">–</span>}
                </React.Fragment>
              ))}
            </div>

            <button
              type="submit"
              className="tfa-button"
              disabled={loading || !codeComplete}
            >
              {loading ? 'Cargando…' : 'Verificar y Activar'}
            </button>
          </form>

          <p className="tfa-footer">WorkFolder Secure Vault · Enterprise</p>
        </div>
      </main>
    </PageTransition>
  );
}
