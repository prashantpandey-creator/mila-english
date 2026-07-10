// @ts-nocheck
'use client';

export default function BadgeGrid({ badges }: { badges: { e: string; t: string; d: string; u: boolean }[] }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:16}}>
      {badges.map((b,i)=>(
        <div key={i} style={{background:b.u?'white':'rgba(255,255,255,0.08)',borderRadius:16,padding:'16px 10px',textAlign:'center',
          opacity:b.u?1:0.55,boxShadow:b.u?'0 2px 12px rgba(0,0,0,0.06)':'none'}}>
          <div style={{fontSize:'2rem'}}>{b.u?b.e:'🔒'}</div>
          <div style={{fontWeight:700,fontSize:'0.85rem',color:'#f2ede3',marginTop:4}}>{b.t}</div>
          <div style={{fontSize:'0.7rem',color:'#a89f8d',marginTop:2}}>{b.d}</div>
        </div>
      ))}
    </div>
  );
}
