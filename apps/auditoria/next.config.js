/** @type {import('next').NextConfig} */
const nextConfig = {
  // Paquete TypeScript del monorepo: Next debe transpilarlo (lo usa también instrumentation.ts)
  transpilePackages: ['@workfolder/utils'],
  experimental: {
    // Habilita src/instrumentation.ts (arranca el consumidor de la cola)
    instrumentationHook: true,
  },
  // CORS: lo define src/lib/response.ts a partir de FRONTEND_URL
};

module.exports = nextConfig;
