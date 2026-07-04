// @ts-nocheck
'use client';

import { C } from '@/lib/theme';

export default function PhoneticGuide() {
  return (
    <p style={{color:C.warm,fontSize:'0.9rem',lineHeight:1.6,marginTop:12}}>
      IPA symbols show exactly how a sound is pronounced, no matter how it's spelled.
      Tap any sound below to hear it, then try the mirror test — watch your tongue and lips match the diagram.
    </p>
  );
}
