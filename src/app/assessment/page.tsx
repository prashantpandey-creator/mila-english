'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';

export default function AssessmentChat() {
  const { lang } = useI18n();
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/assessment/chat',
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === 'finalize_assessment') {
        setFinalizing(true);
        try {
          const res = await fetch('/api/assessment/finalize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toolCall.args)
          });
          if (res.ok) {
            router.push('/dashboard');
          } else {
            console.error('Failed to finalize assessment');
            setFinalizing(false);
          }
        } catch (e) {
          console.error(e);
          setFinalizing(false);
        }
      }
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [m, setM] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

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
        <h1 style={{margin:0,fontWeight:800,fontSize:'1rem',color:'#a855f7'}}>
          {lang==='ru' ? '🤖 Собеседование' : '🤖 Level Assessment'}
        </h1>
        <LangToggle/>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        {messages.length === 0 && (
          <div style={{textAlign:'center',color:C.warm,marginTop:40,padding:'0 20px'}}>
            <div style={{fontSize:'3rem',marginBottom:12}}>📝</div>
            <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark,marginBottom:8}}>
              {lang==='ru' ? 'Давай пообщаемся!' : 'Let\'s have a chat!'}
            </div>
            <div style={{fontSize:'0.9rem',color:C.warm,lineHeight:1.5}}>
              {lang==='ru'
                ? 'Напиши мне что-нибудь. Я задам тебе пару вопросов, чтобы определить твой уровень английского и составить план занятий.'
                : 'Say hi! I will ask you a few conversational questions to determine your English level and generate a custom learning plan.'}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{
              maxWidth:'80%',borderRadius:18,padding:'12px 16px',fontSize:'0.95rem',lineHeight:1.5,
              ...(m.role === 'user'
                ? {background:'#a855f7',color:'white',borderBottomRightRadius:4}
                : {background:'white',color:C.dark,borderBottomLeftRadius:4,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid rgba(0,0,0,0.04)'})
            }}>
              {m.content || (m.toolInvocations ? (lang==='ru'?'Анализирую результаты...':'Analyzing results...') : '')}
            </div>
          </div>
        ))}

        {(isLoading || finalizing) && (
          <div style={{display:'flex',justifyContent:'flex-start'}}>
            <div style={{background:'white',borderRadius:18,borderBottomLeftRadius:4,padding:'12px 16px',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',color:C.warm,fontSize:'0.9rem',fontStyle:'italic'}}>
              {finalizing ? (lang==='ru'?'Составляю твой личный план... 🚀':'Building your custom plan... 🚀') : (lang==='ru' ? 'Мила печатает...' : 'Mila is typing...')}
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
            placeholder={lang==='ru' ? 'Ответь по-английски...' : 'Reply in English...'}
            disabled={isLoading || finalizing}
            style={{flex:1,padding:'12px 16px',borderRadius:14,border:`1.5px solid ${(isLoading||finalizing)?'#e5e0dc':'#a855f760'}`,
              fontSize:'0.95rem',outline:'none',background:'white',color:C.dark,
              fontFamily:"'Nunito','Inter',sans-serif"}}
          />
          <button type="submit" disabled={isLoading || finalizing || !input.trim()}
            style={{padding:'12px 22px',borderRadius:14,border:'none',
              background:(isLoading||finalizing||!input.trim())?'#e5e0dc':`linear-gradient(135deg,#c4b5fd,#a855f7)`,
              color:'white',fontWeight:700,cursor:(isLoading||finalizing||!input.trim())?'default':'pointer',
              fontSize:'0.95rem',transition:'all 0.2s'}}>
            {lang==='ru' ? 'Отправить' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
