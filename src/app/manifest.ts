import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mila — English for Russian Speakers',
    short_name: 'Mila',
    description: 'Практический английский с ИИ-наставницей Милой.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff9fb',
    theme_color: '#fff9fb',
    lang: 'ru',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
