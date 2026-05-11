import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import type { AdminSection } from '../../types';

export interface NavItem {
  id: AdminSection;
  label: string;
  icon: string;
  badge?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home',        label: 'Home',               icon: '⌂' },
  { id: 'usuarios',    label: 'Usuarios Corp',       icon: '⊞', badge: '5/5' },
  { id: 'rrhh',        label: 'Módulo RRHH',         icon: '▤',  badge: '3/3' },
  { id: 'boveda',      label: 'Bóveda Enterprise',   icon: '▣' },
  { id: 'seguridad',   label: 'Seguridad Nivel 3',   icon: '◉' },
  { id: 'auditoria',   label: 'Auditoría Live',       icon: '▶' },
  { id: 'facturacion', label: 'Facturación',          icon: '≡' },
];

export const useSidebar = () => {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return { loggingOut, handleLogout };
};
