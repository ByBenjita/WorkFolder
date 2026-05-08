'use client';

import React from 'react';
import { twoFAStyles } from './TwoFAPage.styles';
import { use2FA } from './use2FA';
import PageTransition from '../../components/PageTransition';

export default function TwoFAPage() {
  const { code, handleInputChange, handleSubmit } = use2FA();
  const secretValue = "otpauth://totp/WorkFolder:benj.moralesb@duocuc.cl?secret=JBSWY3DPEHPK3PXP&issuer=WorkFolder";
  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(secretValue)}&size=100&margin=0`;

  return (
    <PageTransition direction="left">
      <style jsx>{twoFAStyles}</style>
      
      <main className="tfa-root">
        <div className="tfa-card">
          <h1 className="tfa-title">🔐 Configuración de Seguridad</h1>
          
          <p className="tfa-description">
            Para proteger los archivos de la empresa, debes habilitar la Autenticación de Dos Pasos(2FA) antes de continuar.
          </p>

          <span className="tfa-step">
            Paso 1: Escanea este código con tu App<br/>
            (Google Authenticator, Authy, etc.)
          </span>
          
          <div className="qr-container">
            <div className="qr-wrapper">
              <img src={qrImageUrl} alt="QR CODE" width={100} height={100} style={{ display: 'block' }} />
            </div>
          </div>

          <span className="tfa-step">Paso 2: Ingresa el código de 6 dígitos</span>

          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}>
            <div className="tfa-input-group">
              {code.slice(0, 3).map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  className="tfa-input"
                  value={digit}
                  onChange={(e) => handleInputChange(e.target.value, index)}
                  required
                />
              ))}
              <span className="tfa-separator">-</span>
              {code.slice(3, 6).map((digit, index) => (
                <input
                  key={index + 3}
                  id={`otp-${index + 3}`}
                  type="text"
                  maxLength={1}
                  className="tfa-input"
                  value={digit}
                  onChange={(e) => handleInputChange(e.target.value, index + 3)}
                  required
                />
              ))}
            </div>

            <button type="submit" className="tfa-button">Verificar y Activar</button>
          </form>

          <p className="tfa-footer">WorkFolder Secure Vault</p>
        </div>
      </main>
    </PageTransition>
  );
}