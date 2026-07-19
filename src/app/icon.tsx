import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(145deg,#f1ece5 0%,#dde8e3 100%)',color:'#d9006c',fontFamily:'serif',fontSize:300,fontWeight:700,letterSpacing:'-0.08em',border:'18px solid #faf8f5',boxShadow:'inset 0 0 0 4px #a9bab6'}}>M</div>,
    size,
  )
}
