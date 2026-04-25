import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ohanyan Studio',
    short_name: 'Ohanyan',
    description: 'Հեռախոսների վերանորոգման և ակսեսուարների վաճառքի հաշվառման համակարգ։',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f1df',
    theme_color: '#1e4a2f',
    orientation: 'portrait',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/pwa-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/pwa-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
