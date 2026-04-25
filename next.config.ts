import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Отключаем проверку TypeScript во время production build (опционально)
    ignoreBuildErrors: false,
  },
  experimental: {
    esmExternals: true,
    serverActions: {
      bodySizeLimit: '25mb', // մեդիա բեռնում (վիդեո/նկար) — 413-ը հիմնականում nginx-ից է, տես docs/nginx-upload-size.md
    },
  },
  env: {
    // NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  },
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'src')],
  },
  images: {
    // Runtime upload-ները պահվում են /public/uploads-ում, ու production-ում պետք է բացվեն ուղիղ static URL-ով։
    unoptimized: true,
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload', // Հատուկ պարամետրեր
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
