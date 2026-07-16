'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { useI18n } from '@/lib/i18n-provider';
import { C } from '@/lib/theme';
import { announceCompanionHistoryCleared, announceCompanionHistoryUpdated, useCompanionHistory } from '@/lib/use-companion-history';

export default function Chat() {
  const { lang } = useI18n();
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    id: 'mila-full-chat',
    api: '/api/chat',
    body: { context: { pathname: '/chat', lang, surface: 'chat' } },
    onFinish: () => announceCompanionHistoryUpdated(),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [m, setM] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState(false);
  const { isHydrating, historyError } = useCompanionHistory({ limit: 40, setMessages });

  useEffect(() => { setM(true); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearConversation = async () => {
    if (isLoading || isClearing || messages.length === 0) return;
    const confirmed = window.confirm(lang === 'ru'
      ? 'Начать новый разговор? Текущая переписка будет удалена.'
      : 'Start a new conversation? Your current chat history will be deleted.');
    if (!confirmed) return;

    setIsClearing(true);
    setClearError(false);
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Clear request failed (${response.status})`);
      setMessages([]);
      announceCompanionHistoryCleared();
    } catch {
      setClearError(true);
    } finally {
      setIsClearing(false);
    }
  };

  if (!m) return null;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:C.pageBg,fontFamily:"'Manrope','Inter',sans-serif"}}>
      {/* Header */}
      <div style={{background:C.navBg,backdropFilter:'blur(18px)',padding:'10px 20px',
        borderBottom:`1px solid ${C.line}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span onClick={()=>router.push('/dashboard')} style={{cursor:'pointer',fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'1.3rem',color:C.dark,letterSpacing:'0.03em'}}>Mila</span>
        <h1 style={{margin:0,fontWeight:800,fontSize:'1rem',color:C.dark}}>
          {lang==='ru' ? 'Мила · наставница' : 'Mila · tutor & companion'}
        </h1>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button
            type="button"
            onClick={clearConversation}
            disabled={isHydrating || isLoading || isClearing || messages.length === 0}
            aria-label={lang==='ru' ? 'Начать новый разговор' : 'Start a new conversation'}
            title={lang==='ru' ? 'Новый разговор' : 'New conversation'}
            style={{border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'7px 10px',background:'rgba(255,255,255,0.05)',color:C.warm,
              fontSize:'0.76rem',fontWeight:700,cursor:isHydrating||isLoading||isClearing||messages.length===0?'default':'pointer',opacity:isHydrating||messages.length===0?0.5:1}}
          >
            {isClearing ? (lang==='ru' ? 'Очищаю…' : 'Clearing…') : (lang==='ru' ? 'Новый чат' : 'New chat')}
          </button>
          <LangToggle/>
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
        {isHydrating && messages.length === 0 && (
          <div style={{textAlign:'center',color:C.warm,marginTop:40,fontSize:'0.9rem'}}>
            {lang==='ru' ? 'Мила вспоминает ваш разговор…' : 'Mila is remembering your conversation…'}
          </div>
        )}

        {!isHydrating && messages.length === 0 && (
          <div style={{textAlign:'center',color:C.warm,marginTop:40,padding:'0 20px'}}>
            <div style={{fontSize:'3rem',marginBottom:12}}>💬</div>
            <div style={{fontWeight:700,fontSize:'1.1rem',color:C.dark,marginBottom:8}}>
              {lang==='ru' ? 'Начни разговор!' : 'Start a conversation!'}
            </div>
            <div style={{fontSize:'0.9rem',color:C.warm}}>
              {lang==='ru'
                ? 'Спроси о чём угодно или начни практику английского. Мила помнит контекст между страницами.'
                : 'Ask about anything or start an English practice. Mila keeps the conversation going when you move around the app.'}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
            <div style={{
              maxWidth:'80%',borderRadius:18,padding:'12px 16px',fontSize:'0.95rem',lineHeight:1.5,whiteSpace:'pre-wrap',
              ...(m.role === 'user'
                ? {background:`linear-gradient(135deg,${C.mercuryBright},${C.mercury})`,color:'#031d14',borderBottomRightRadius:4,boxShadow:'0 8px 24px rgba(36,211,154,.12)'}
                : {background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',color:C.dark,borderBottomLeftRadius:4,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid rgba(255,255,255,0.08)'})
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{display:'flex',justifyContent:'flex-start'}}>
            <div style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',borderRadius:18,borderBottomLeftRadius:4,padding:'12px 16px',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',color:C.warm,fontSize:'0.9rem',fontStyle:'italic'}}>
              {lang==='ru' ? 'Мила печатает...' : 'Mila is typing...'}
            </div>
          </div>
        )}
        {(historyError || clearError) && (
          <div role="status" style={{textAlign:'center',color:'#b36a73',fontSize:'0.78rem'}}>
            {lang==='ru'
              ? 'История сейчас недоступна, но можно продолжить разговор.'
              : 'History is unavailable right now, but you can keep chatting.'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{background:'rgba(0,5,3,.9)',backdropFilter:'blur(18px)',padding:'12px 16px',
        borderTop:`1px solid ${C.line}`,flexShrink:0}}>
        <form onSubmit={handleSubmit} style={{display:'flex',gap:10,maxWidth:600,margin:'0 auto'}}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={lang==='ru' ? 'Спроси Милу или попрактикуйся…' : 'Ask Mila anything or practise English…'}
            disabled={isLoading || isHydrating || isClearing}
            style={{flex:1,padding:'12px 16px',borderRadius:14,border:`1.5px solid ${isLoading?'rgba(255,255,255,0.14)':'rgba(36,211,154,.34)'}`,
              fontSize:'0.95rem',outline:'none',background:'rgba(255,255,255,0.05)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',color:C.dark,
              fontFamily:"'Manrope','Inter',sans-serif"}}
          />
          <button type="submit" disabled={isLoading || isHydrating || isClearing || !input.trim()}
            style={{padding:'12px 22px',borderRadius:14,border:'none',
              background:isLoading||isHydrating||isClearing||!input.trim()?'rgba(255,255,255,0.14)':`linear-gradient(135deg,${C.mercuryBright},${C.mercury})`,
              color:isLoading||isHydrating||isClearing||!input.trim()?C.warm:'#031d14',fontWeight:800,cursor:isLoading||!input.trim()?'default':'pointer',
              fontSize:'0.95rem',transition:'all 0.2s'}}>
            {lang==='ru' ? 'Отправить' : 'Send'}
          </button>
        </form>
        <div style={{textAlign:'center',fontSize:'0.72rem',color:'#8b8373',marginTop:8}}>
          {lang==='ru' ? 'Скажи «Запомни, что…», чтобы сохранить важную деталь' : 'Say “Remember that…” to save an important detail'}
        </div>
      </div>
    </div>
  );
}
