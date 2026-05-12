import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WorkFolder PRO – Enterprise Panel',
  description: 'Panel de Control Enterprise',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
