// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

const SOUNDS = [
  { ipa: '/θ/', ex: 'think' }, { ipa: '/ð/', ex: 'this' }, { ipa: '/w/', ex: 'world' },
  { ipa: '/r/', ex: 'river' }, { ipa: '/æ/', ex: 'cat' }, { ipa: '/ʃ/', ex: 'she' },
  { ipa: '/dʒ/', ex: 'job' }, { ipa: '/ŋ/', ex: 'sing' },
];

export default function PhoneticChart() {
  return (
    <div className="focus-card" style={{padding:'20px',marginTop:16}}>
      <div style={{fontWeight:700,fontSize:'0.9rem',color:C.dark,marginBottom:14}}>Sounds Russian doesn't have</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
        {SOUNDS.map((s,i)=>(
          <div key={i} style={{textAlign:'center',padding:'10px 4px',borderRadius:10,background:C.voiceL,border:'1px solid rgba(106,220,245,.14)'}}>
            <div style={{fontSize:'1.1rem',fontWeight:700,color:C.voiceBright}}>{s.ipa}</div>
            <div style={{fontSize:'0.75rem',color:C.warm,marginTop:2}}>{s.ex}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
