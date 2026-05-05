'use client';

import React from 'react';
import { twoFAStyles } from './TwoFAPage.styles';
import { use2FA } from './use2FA';
import PageTransition from '../../components/PageTransition';

export default function TwoFAPage() {
  const { code, handleInputChange, handleSubmit } = use2FA();

  // El valor que quieres que tenga el QR
  const secretValue = "otpauth://totp/MiApp:benj.moralesb@duocuc.cl?secret=JBSWY3DPEHPK3PXP&issuer=MiApp";
  
  // Generamos la URL del QR usando QuickChart
  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(secretValue)}&size=160&margin=0`;

  return (
    <PageTransition direction="left">
      <style jsx>{twoFAStyles}</style>
      
      <main className="tfa-root">
        <div className="grid-bg" />
        
        <div className="tfa-card">
          <h1 className="tfa-title">Doble Factor</h1>
          <p className="tfa-subtitle">Escanea el código QR en tu aplicación de autenticación</p>
          
          <div className="qr-container">
            <div className="qr-wrapper">
              <img 
                src={qrImageUrl} 
                alt="Código QR de Seguridad"
                width={160}
                height={160}
                style={{ display: 'block' }}
              />
            </div>
          </div>

          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}>
            <div className="tfa-input-group">
              {code.map((digit, index) => (
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
            </div>

            <button type="submit" className="tfa-button">
              Verificar Código
            </button>
          </form>
        </div>
      </main>
    </PageTransition>
  );
}