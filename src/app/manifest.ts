import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { isGiaHostname } from '@/lib/productHosts'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const isGia = isGiaHostname((await headers()).get('host'))
  if (isGia) {
    return {
      name: 'Gia — AI voice and text companion',
      short_name: 'Gia',
      description: 'A playful multilingual AI companion for voice and text conversation.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#04070a',
      theme_color: '#04070a',
      lang: 'en',
      icons: [
        { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }
  }

  return {
    name: 'Mila — English for Russian Speakers',
    short_name: 'Mila',
    description: 'Практический английский с ИИ-наставницей Милой.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#faf8f5',
    lang: 'ru',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
