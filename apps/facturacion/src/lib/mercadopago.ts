import { MercadoPagoConfig } from 'mercadopago';

export function getMpClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN ?? '';
  return new MercadoPagoConfig({ accessToken });
}

export function isSandbox(): boolean {
  return (process.env.MP_ACCESS_TOKEN ?? '').startsWith('TEST-');
}
