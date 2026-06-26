import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Triple Captain - FPL Companion',
    short_name: 'Triple Captain',
    description: 'Your Ultimate Fantasy Premier League Companion',
    start_url: '/',
    display: 'standalone',
    background_color: '#160520', // aubergine base
    theme_color: '#e90052', // magenta action
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    orientation: 'portrait',
    categories: ['sports', 'utilities'],
  }
}
