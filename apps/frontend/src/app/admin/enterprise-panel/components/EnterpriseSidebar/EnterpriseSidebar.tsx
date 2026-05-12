'use client';

import React from 'react';
import type { AdminSection } from '../../types';
import { NAV_ITEMS, useSidebar } from './useSidebar';
import { sidebarStyles } from './EnterpriseSidebar.styles';

// ── Iconos SVG inline ────────────────────────────────────────────
const Icons: Record<string, React.ReactNode> = {
  Home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  UserCheck: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
    </svg>
  ),
  FolderLock: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2.5"/><rect x="14" y="14" width="8" height="6" rx="1"/><path d="M16 14v-2a2 2 0 1 1 4 0v2"/>
    </svg>
  ),
  Shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Activity: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Receipt: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="11" y2="17"/>
    </svg>
  ),
};

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
          <div className="logo-icon">{Icons.FolderLock}</div>
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
              <span className="nav-icon">{Icons[item.iconName]}</span>
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
