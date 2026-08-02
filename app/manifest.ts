import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wonder Journal',
    short_name: 'Wonder',
    description: 'A gentle place for little questions and the stories they deserve.',
    start_url: '/',
    display: 'standalone',
    background_color: '#120f29',
    theme_color: '#120f29',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
