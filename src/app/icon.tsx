import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { isGiaHostname } from '@/lib/productHosts'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default async function Icon() {
  const isGia = isGiaHostname((await headers()).get('host'))
  return new ImageResponse(
    <div style={{
      width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
      background:isGia ? 'linear-gradient(145deg,#101820 0%,#04070a 100%)' : 'linear-gradient(145deg,#f1ece5 0%,#dde8e3 100%)',
      color:'#d9006c',fontFamily:'serif',fontSize:300,fontWeight:700,letterSpacing:'-0.08em',
      border:isGia ? '18px solid #04070a' : '18px solid #faf8f5',
      boxShadow:isGia ? 'inset 0 0 0 4px #ff2e91' : 'inset 0 0 0 4px #a9bab6',
    }}>{isGia ? 'G' : 'M'}</div>,
    size,
  )
}
