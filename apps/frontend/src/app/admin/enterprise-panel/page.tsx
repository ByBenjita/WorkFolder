'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import EnterpriseSidebar from './components/EnterpriseSidebar/EnterpriseSidebar';
import EnterprisePanel from './components/EnterprisePanel/EnterprisePanel';

export type AdminSection =
  | 'home'
  | 'usuarios'
  | 'rrhh'
  | 'boveda'
  | 'seguridad'
  | 'auditoria'
  | 'facturacion';

export default function EnterprisePanelPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>('home');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Verificar nivel AAL2 (2FA completado)
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel !== 'aal2') {
        router.push('/login');
        return;
      }

      setUserEmail(session.user.email ?? '');
      setLoading(false);
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
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      fontFamily: '"Segoe UI", system-ui, sans-serif',
    }}>
      <EnterpriseSidebar
        active={activeSection}
        onSelect={setActiveSection}
        userEmail={userEmail}
      />
      <EnterprisePanel section={activeSection} />
    </div>
  );
}
