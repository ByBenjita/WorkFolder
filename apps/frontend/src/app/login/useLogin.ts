import { useState } from 'react';
import { useRouter } from 'next/navigation'; 

// Hook personalizado para manejar la lógica de login
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Simulación de llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Login intentado");
      router.push('/login/2fa'); 
    } catch (error) {
      
      console.error("Error en el login", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin
  };
};