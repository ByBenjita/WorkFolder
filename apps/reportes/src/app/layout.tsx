export const metadata = {
  title: 'WorkFolder · Reportes',
  description: 'Microservicio de métricas de negocio (Vercel Queues)',
};

/** Layout mínimo requerido por Next.js (el servicio solo expone APIs; el dashboard vive en el panel enterprise) */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
