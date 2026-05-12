'use client';

import React, { useState } from 'react';
import { loginStyles } from './LoginPage.styles';
import { useLogin } from './useLogin';
import PageTransition from '../components/PageTransition';

export default function LoginPage() {
  const { loading, email, setEmail, password, setPassword, handleLogin } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <PageTransition direction="up">
      <style jsx>{loginStyles}</style>
      
      <main className="login-root">
        <div className="grid-bg" />
        
        <div className="login-card">
          <div className="card-content">
            <h1 className="login-title">WorkFolder</h1>
            <p className="login-subtitle">Bóveda Digital Corporativa</p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="login-input" 
                  placeholder="ejemplo@correo.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="login-input password-input"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      // Ojo abierto — ocultar contraseña
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      // Ojo cerrado — mostrar contraseña
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}