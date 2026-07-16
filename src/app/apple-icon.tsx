import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#000000',color:'#78e3f8',fontFamily:'sans-serif',fontSize:105,fontWeight:800,letterSpacing:'-0.08em',border:'7px solid #141416',boxShadow:'inset 0 0 0 2px rgba(255,255,255,0.16)'}}>M</div>,
    size,
  )
}
