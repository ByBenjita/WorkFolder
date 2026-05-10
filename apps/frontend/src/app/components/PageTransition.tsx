'use client';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'none'; // Definimos los tipos de entrada
}

export default function PageTransition({ children, direction = 'up' }: Props) {
  // Configuramos las coordenadas según la dirección
  const variants = {
    up: { initial: { y: '20%', opacity: 0 }, animate: { y: 0, opacity: 1 } },
    left: { initial: { x: '100%', opacity: 0 }, animate: { x: 0, opacity: 1 } },
    none: { initial: { opacity: 0 }, animate: { opacity: 1 } }
  };

  const selectedVariant = variants[direction];

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      transition={{ 
        type: 'spring', 
        stiffness: 100, 
        damping: 20,
        duration: 0.6 
      }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}