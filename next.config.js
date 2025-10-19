/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')();

const nextConfig = {
  // Re-enable standalone output since our issues are fixed
  output: 'standalone',
  reactStrictMode: true,
  // No need for experimental flags anymore
  async headers() {
    // Permitir conexiones a n8n y a las URLs de subida de archivos
    const connectSrcUrls = [
      process.env.N8N_BASE_URL || '',
      'https://flows.singularity.cyou',
      'https://hooks.singularity.cyou'
    ].filter(Boolean).join(' ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ${connectSrcUrls}; font-src 'self' https:; object-src 'none'; frame-src 'none'`
          }
        ],
      },
    ];
  },
  // Exponer variables de entorno al cliente
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    APP_VERSION: process.env.APP_VERSION,
  },
};

module.exports = withNextIntl(nextConfig);
