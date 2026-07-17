// @ts-nocheck
'use client';

import { C } from '@/lib/theme';
import MilaIcon, { type MilaIconName } from '@/components/ui/MilaIcon';

/** Unified lesson artwork with a stable seam for richer custom art later. */
export default function VisualAidViewer({ icon, title }: { icon: MilaIconName; title: string }) {
  return (
    <div className="focus-card" data-visual-aid style={{padding:'22px',textAlign:'center',marginBottom:16,overflow:'hidden',position:'relative'}}>
      <span aria-hidden style={{position:'absolute',inset:'auto -24px -44px auto',width:112,height:112,borderRadius:36,background:C.mercuryL,transform:'rotate(18deg)'}} />
      <div style={{position:'relative',width:64,height:64,margin:'0 auto',display:'grid',placeItems:'center',borderRadius:18,color:C.mercury,background:C.mercuryL,border:`1px solid ${C.line}`}}><MilaIcon name={icon} size={31}/></div>
      <div style={{position:'relative',fontSize:'0.85rem',color:C.dark,fontWeight:700,marginTop:10}}>{title}</div>
    </div>
  );
}
