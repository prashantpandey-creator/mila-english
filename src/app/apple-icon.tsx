import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(145deg,#f1ece5 0%,#dde8e3 100%)',color:'#d9006c',fontFamily:'serif',fontSize:105,fontWeight:700,letterSpacing:'-0.08em',border:'7px solid #faf8f5',boxShadow:'inset 0 0 0 2px #a9bab6'}}>M</div>,
    size,
  )
}
