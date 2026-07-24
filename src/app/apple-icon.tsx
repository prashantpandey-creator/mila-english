import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { isGiaHostname, isMiaHostname } from '@/lib/productHosts'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const hostname = (await headers()).get('host')
  const isGia = isGiaHostname(hostname)
  const isMia = isMiaHostname(hostname)
  return new ImageResponse(
    <div style={{
      width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
      background:isGia
        ? 'linear-gradient(145deg,#101820 0%,#04070a 100%)'
        : isMia
          ? 'linear-gradient(145deg,#fffaf2 0%,#ddc9aa 100%)'
          : 'linear-gradient(145deg,#f1ece5 0%,#dde8e3 100%)',
      color:isMia ? '#29484b' : '#d9006c',fontFamily:'serif',fontSize:105,fontWeight:700,letterSpacing:'-0.08em',
      border:isGia ? '7px solid #04070a' : isMia ? '7px solid #f5efe4' : '7px solid #faf8f5',
      boxShadow:isGia
        ? 'inset 0 0 0 2px #ff2e91'
        : isMia
          ? 'inset 0 0 0 2px #c43f70'
          : 'inset 0 0 0 2px #a9bab6',
    }}>{isGia ? 'G' : isMia ? 'M' : 'F'}</div>,
    size,
  )
}
