import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff4fa',color:'#d9006c',fontFamily:'serif',fontSize:300,fontWeight:700,letterSpacing:'-0.08em',border:'18px solid #fffcfe',boxShadow:'inset 0 0 0 4px #e3becb'}}>M</div>,
    size,
  )
}
