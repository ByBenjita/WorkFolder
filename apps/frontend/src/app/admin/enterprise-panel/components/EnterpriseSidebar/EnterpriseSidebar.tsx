'use client';

import React from 'react';
import type { AdminSection } from '../../types';
import { NAV_ITEMS, useSidebar } from './useSidebar';
import { sidebarStyles } from './EnterpriseSidebar.styles';

interface Props {
  active: AdminSection;
  onSelect: (section: AdminSection) => void;
  userEmail: string;
}

export default function EnterpriseSidebar({ active, onSelect, userEmail }: Props) {
  const { loggingOut, handleLogout } = useSidebar();

  return (
    <aside className="sidebar">
      <style jsx>{sidebarStyles}</style>

      {/* ── Logo ── */}
      <div className="logo-section">
        <div className="logo-row">
          <div className="logo-icon">▣</div>
          <span className="logo-title">WorkFolder PRO</span>
        </div>
        <span className="logo-badge">Enterprise</span>
      </div>

      {/* ── Nav ── */}
      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`nav-button ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className={`nav-badge ${isActive ? 'active' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="session-info">
          <p className="session-label">Sesión activa</p>
          <p className="session-email">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="logout-button"
        >
          {loggingOut ? 'Cerrando...' : '↩ Cerrar Sesión'}
        </button>
      </div>

    </aside>
  );
}
