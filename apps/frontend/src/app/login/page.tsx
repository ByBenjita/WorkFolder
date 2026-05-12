'use client';

import React from 'react';
import { loginStyles } from './LoginPage.styles';
import { useLogin } from './useLogin';
import PageTransition from '../components/PageTransition';

export default function LoginPage() {
  // Extraemos las nuevas funciones del hook
  const { loading, email, setEmail, password, setPassword, handleLogin } = useLogin();

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
                  value={email} // <-- Conectado
                  onChange={(e) => setEmail(e.target.value)} // <-- Conectado
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input 
                  type="password" 
                  className="login-input" 
                  placeholder="••••••••" 
                  value={password} // <-- Conectado
                  onChange={(e) => setPassword(e.target.value)} // <-- Conectado
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