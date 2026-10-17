export const metadata = {
  title: 'WorkFolder · Auditoría',
  description: 'Microservicio de auditoría',
}

/** Layout mínimo requerido por Next.js (el servicio solo expone APIs) */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}   