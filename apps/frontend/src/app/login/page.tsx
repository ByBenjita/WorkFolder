'use client';

import React from 'react';
import { loginStyles } from './LoginPage.styles';
import { useLogin } from './useLogin';
import PageTransition from '../components/PageTransition';

export default function LoginPage() {
  const { loading, handleLogin } = useLogin();

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
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input 
                  type="password" 
                  className="login-input" 
                  placeholder="••••••••" 
                  required 
                />
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