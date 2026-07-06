'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function Chat() {
  const { lang } = useI18n();
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [m, setM] = useState(false);

  useEffect(() => { setM(true); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!m) return null;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:C.pageBg,fontFamily:"'Nunito','Inter',sans-serif"}}>
      {/* Header */}
      <div style={{background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',padding:'10px 20px',
        borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontWeight:800,fontSize:'1.1rem',color:C.dark}}>🌸 Мила</span>
        <h1 style={{margin:0,fontWeight:800,fontSize:'1rem',color:C.dark}}>
          {lang==='ru' ? '🤖 ИИ-репетитор' : '🤖 AI Tutor'}
        </h1>
        <LangToggle/>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        {messages.length === 0 && (
          <div style={{textAlign:'center',color:C.warm,marginTop:40,padding:'0 20px'}}>
            <div style={{fontSize:'3rem',marginBottom:12}}>💬</div>
            <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark,marginBottom:8}}>
              {lang==='ru' ? 'Начни разговор!' : 'Start a conversation!'}
            </div>
            <div style={{fontSize:'0.9rem',color:C.warm}}>
              {lang==='ru'
                ? 'Например: «Hello, how are you today?» — Мила ответит на английском и мягко исправит ошибки'
                : 'For example: "Hello, how are you today?" — Mila replies in English and gently corrects mistakes'}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{
              maxWidth:'80%',borderRadius:18,padding:'12px 16px',fontSize:'0.95rem',lineHeight:1.5,
              ...(m.role === 'user'
                ? {background:C.rose,color:'white',borderBottomRightRadius:4}
                : {background:'white',color:C.dark,borderBottomLeftRadius:4,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.04)'})
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{display:'flex',justifyContent:'flex-start'}}>
            <div style={{background:'white',borderRadius:18,borderBottomLeftRadius:4,padding:'12px 16px',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',color:C.warm,fontSize:'0.9rem',fontStyle:'italic'}}>
              {lang==='ru' ? 'Мила печатает...' : 'Mila is typing...'}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',padding:'12px 16px',
        borderTop:'1px solid rgba(0,0,0,0.06)',flexShrink:0}}>
        <form onSubmit={handleSubmit} style={{display:'flex',gap:10,maxWidth:600,margin:'0 auto'}}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={lang==='ru' ? 'Напиши что-нибудь по-английски...' : 'Say something in English...'}
            disabled={isLoading}
            style={{flex:1,padding:'12px 16px',borderRadius:14,border:`1.5px solid ${isLoading?'#e5e0dc':C.rose+'60'}`,
              fontSize:'0.95rem',outline:'none',background:'white',color:C.dark,
              fontFamily:"'Nunito','Inter',sans-serif"}}
          />
          <button type="submit" disabled={isLoading || !input.trim()}
            style={{padding:'12px 22px',borderRadius:14,border:'none',
              background:isLoading||!input.trim()?'#e5e0dc':`linear-gradient(135deg,${C.rose},#c2185b)`,
              color:'white',fontWeight:700,cursor:isLoading||!input.trim()?'default':'pointer',
              fontSize:'0.95rem',transition:'all 0.2s'}}>
            {lang==='ru' ? 'Отправить' : 'Send'}
          </button>
        </form>
        <div style={{textAlign:'center',fontSize:'0.72rem',color:'#c0b8af',marginTop:8}}>
          {lang==='ru' ? '🎯 ИИ мягко исправит твои ошибки и ответит на английском' : '🎯 AI gently corrects your mistakes and replies in English'}
        </div>
      </div>
    </div>
  );
}
