import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mila — English for Russian Speakers',
    short_name: 'Mila',
    description: 'Практический английский с ИИ-наставницей Милой.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fffcfe',
    theme_color: '#fffcfe',
    lang: 'ru',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
