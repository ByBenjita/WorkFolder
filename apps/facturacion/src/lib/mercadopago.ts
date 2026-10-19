import { MercadoPagoConfig } from 'mercadopago';

export function getMpClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN ?? '';
  return new MercadoPagoConfig({ accessToken });
}

/**
 * Indica si Mercado Pago opera en modo sandbox (MP_SANDBOX=true).
 * Es explícito porque las credenciales de prueba nuevas también empiezan con APP_USR-.
 */
export function isSandbox(): boolean {
  return process.env.MP_SANDBOX === 'true';
}
