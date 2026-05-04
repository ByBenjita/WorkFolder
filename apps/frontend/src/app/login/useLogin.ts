import { useState } from 'react';

// Hook personalizado para manejar la lógica de login
export const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Simulación de llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Login intentado");
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