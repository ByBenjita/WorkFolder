/** @type {import('next').NextConfig} */
const nextConfig = {
  // Paquete TypeScript del monorepo
  transpilePackages: ['@workfolder/utils'],
  // CORS: lo define src/lib/response.ts a partir de FRONTEND_URL
};

module.exports = nextConfig;
