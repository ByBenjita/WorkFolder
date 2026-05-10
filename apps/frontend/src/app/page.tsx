import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirección a nivel de componente
  redirect('/login');
  
  // No renderizamos nada
  return null;
}


/**
 * La página raíz está siendo redirigida a /login 
 * a través de next.config.js por motivos de rendimiento.
 */