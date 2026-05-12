'use client';

import React from 'react';
import { twoFAStyles } from './TwoFAPage.styles';
import { use2FA } from './use2FA';
import PageTransition from '../../components/PageTransition';

export default function TwoFAPage() {
  // Obtenemos qrCodeData directamente del hook
  const { code, qrCodeData, handleInputChange, handleSubmit, loading } = use2FA();

  return (
    <PageTransition direction="left">
      <style jsx>{twoFAStyles}</style>
      
      <main className="tfa-root">
        <div className="tfa-card">
          <h1 className="tfa-title">🔐 Configuración de Seguridad</h1>
          
          <p className="tfa-description">
            Para proteger los archivos de la empresa, debes habilitar la Autenticación de Dos Pasos (2FA) antes de continuar.
          </p>

          <span className="tfa-step">
            Paso 1: Escanea este código con tu App<br/>
            (Google Authenticator, Authy, etc.)
          </span>
          
          <div className="qr-container">
            <div className="qr-wrapper">
              {/* CAMBIO CLAVE: Usamos qrCodeData directamente si existe */}
              {qrCodeData ? (
                <img 
                  src={qrCodeData} 
                  alt="QR MFA" 
                  width={150} 
                  height={150} 
                  style={{ 
                    display: 'block', 
                    margin: '0 auto',
                    backgroundColor: 'white', // Fondo blanco para que el lector lo reconozca bien
                    padding: '8px',
                    borderRadius: '4px'
                  }} 
                />
              ) : (
                <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '10px', textAlign: 'center' }}>
                  {loading ? "Generando QR..." : "Error al cargar el código"}
                </div>
              )}
            </div>
          </div>

          <span className="tfa-step">Paso 2: Ingresa el código de 6 dígitos</span>

          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSubmit(); }}>
            <div className="tfa-input-group">
              {code.map((digit, index) => (
                <React.Fragment key={index}>
                  <input
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="tfa-input"
                    value={digit}
                    onChange={(e) => handleInputChange(e.target.value, index)}
                    required
                  />
                  {index === 2 && <span className="tfa-separator">-</span>}
                </React.Fragment>
              ))}
            </div>

            <button type="submit" className="tfa-button" disabled={loading}>
              {loading ? "Verificando..." : "Verificar y Activar"}
            </button>
          </form>

          <p className="tfa-footer">WorkFolder Secure Vault</p>
        </div>
      </main>
    </PageTransition>
  );
}