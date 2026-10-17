/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Habilita src/instrumentation.ts (arranca el consumidor de la cola)
    instrumentationHook: true,
  },
  // CORS: lo define src/lib/response.ts a partir de FRONTEND_URL
};

module.exports = nextConfig;
