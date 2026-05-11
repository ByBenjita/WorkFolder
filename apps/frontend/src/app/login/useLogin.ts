import { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import { supabase } from '../../services/supabase'; // Importamos el cliente de Supabase

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Llamada real a la autenticación de Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Manejo de errores de autenticación
      if (error) {
        alert("Credenciales incorrectas: " + error.message);
        return;
      }
      // Refrescamos la sesión para asegurar que los permisos de MFA se carguen correctamente antes de redirigir  
      await supabase.auth.refreshSession();

      console.log("Login exitoso", data);
      // Si todo sale bien, mandamos al 2FA o al Home
      router.push('/login/2fa'); 
      
    } catch (error) {
      console.error("Error inesperado", error);
    } finally {
      setLoading(false);
    }
  };

  // Retornamos el estado y la función de login para que el componente pueda usarlos
  return {
    loading,
    email,
    setEmail,
    password,
    setPassword,
    handleLogin
  };
};