'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getAccessToken } from '@/services/authApi';
import EnterpriseSidebar from './components/EnterpriseSidebar/EnterpriseSidebar';
import EnterprisePanel   from './components/EnterprisePanel/EnterprisePanel';
import type { AdminSection } from './types';

export default function EnterprisePanelPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('home');
  const [userEmail, setUserEmail]         = useState('');
  const [isAdmin, setIsAdmin]             = useState(false);
  const [loading, setLoading]             = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }

        const data = await authApi.getSession();

        if (!data.success) {
          router.push('/login');
          return;
        }

        const admin = data.user.is_admin ?? false;
        setUserEmail(data.user.email);
        setIsAdmin(admin);
        setActiveSection(admin ? 'home' : 'rrhh');
        setLoading(false);

      } catch (e) {
        router.push('/login');
      }
    };

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#333',
        fontFamily: 'monospace',
        fontSize: 13,
        letterSpacing: '2px',
      }}>
        CARGANDO PANEL...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0f0f0f',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      <EnterpriseSidebar
        active={activeSection}
        onSelect={setActiveSection}
        userEmail={userEmail}
        isAdmin={isAdmin}
      />
      <EnterprisePanel section={activeSection} />
    </div>
  );
}