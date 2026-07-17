'use client'

import { useEffect, useRef, useState } from 'react'
import { ACCENTS, startListening, type Assessment, type Session } from '@/lib/speech'
import { startLocalTranscription, type LocalTranscript, type TranscriptionSession } from '@/lib/localTranscription'
import { scoreLocalVoicePlacement, type VoicePromptId, type VoiceTranscriptSample } from '@/lib/localVoicePlacement'
import { ttsSpeak } from '@/lib/tts'
import type { AssessmentResult } from '@/lib/assessment'
import { C } from '@/lib/theme'
import MilaIcon from '@/components/ui/MilaIcon'

type CalibrationPrompt = {
  id: 'calibration'
  kind: 'read'
  en: string
  ru: string
}

type SpeakingPrompt = {
  id: VoicePromptId
  kind: 'speak'
  en: string
  ru: string
}

type Prompt = CalibrationPrompt | SpeakingPrompt
type ActiveSession = Session | TranscriptionSession
type RecordedResult = Assessment | LocalTranscript

const PROMPTS: Prompt[] = [
  {
    id: 'calibration',
    kind: 'read',
    en: 'Hello, my name is Anna, and I live in Moscow.',
    ru: 'Прочитай эту фразу вслух. Она нужна только для базовой оценки произношения.',
  },
  {
    id: 'intro',
    kind: 'speak',
    en: 'Tell me about yourself and why you are learning English.',
    ru: 'Расскажи о себе и почему ты учишь английский.',
  },
  {
    id: 'past',
    kind: 'speak',
    en: 'What did you do yesterday or last weekend?',
    ru: 'Расскажи, что ты делал(а) вчера или в прошлые выходные.',
  },
  {
    id: 'hypothetical',
    kind: 'speak',
    en: 'If you could live anywhere for one year, where would you live and why?',
    ru: 'Если бы ты мог(ла) год жить где угодно, какое место ты бы выбрал(а) и почему?',
  },
  {
    id: 'opinion',
    kind: 'speak',
    en: 'Does technology help people learn languages? Explain your opinion.',
    ru: 'Помогают ли технологии изучать языки? Объясни своё мнение.',
  },
]

const SPEAKING_PROMPTS = PROMPTS.filter((prompt): prompt is SpeakingPrompt => prompt.kind === 'speak')

export default function LocalVoiceAssessment({ lang, busy, error, onComplete, onCancel }: {
  lang: 'ru'|'en'; busy: boolean; error: string;
  onComplete: (result: AssessmentResult) => void; onCancel: () => void;
}) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'idle'|'recording'|'scoring'|'scored'|'error'>('idle')
  const [pronunciationScore, setPronunciationScore] = useState<number|null>(null)
  const [transcripts, setTranscripts] = useState<Partial<Record<VoicePromptId, string>>>({})
  const [result, setResult] = useState<RecordedResult|null>(null)
  const [message, setMessage] = useState('')
  const sessionRef = useRef<ActiveSession|null>(null)
  const prompt = PROMPTS[index]

  useEffect(() => () => {
    const active = sessionRef.current
    sessionRef.current = null
    active?.cancel()
  }, [])

  const failed = (problem: unknown) => {
    const code = problem instanceof Error ? problem.message : ''
    setMessage(code === 'no-speech' || code === 'transcribe-empty'
      ? (lang==='ru'?'Микрофон не уловил английскую речь. Это технический результат, а не оценка уровня.':'The mic did not capture English speech. This is a technical result, not a level score.')
      : code === 'score-failed' || code === 'score-empty' || code === 'transcribe-failed'
      ? (lang==='ru'?'Локальный сервис Mila временно не смог обработать запись. Попробуй снова.':'Mila could not process the recording just now. Please try again.')
      : code === 'auth-required'
      ? (lang==='ru'?'Сессия истекла. Войди снова, чтобы продолжить.':'Your session expired. Sign in again to continue.')
      : (lang==='ru'?'Проверь доступ к микрофону и попробуй снова.':'Check microphone permission and try again.'))
    sessionRef.current = null
    setPhase('error')
  }

  const settleCalibration = (assessment: Assessment) => {
    setPronunciationScore(assessment.score)
    setResult(assessment)
    sessionRef.current = null
    setPhase('scored')
  }

  const settleTranscript = (transcript: LocalTranscript) => {
    if (prompt.kind !== 'speak') return
    setTranscripts((current) => ({ ...current, [prompt.id]: transcript.text }))
    setResult(transcript)
    sessionRef.current = null
    setPhase('scored')
  }

  const record = async () => {
    if (phase === 'recording' && sessionRef.current) {
      setPhase('scoring')
      try {
        const recorded = await sessionRef.current.stop()
        if (prompt.kind === 'read') settleCalibration(recorded as Assessment)
        else settleTranscript(recorded as LocalTranscript)
      } catch (problem) {
        failed(problem)
      }
      return
    }

    setMessage('')
    setResult(null)
    setPhase('recording')
    try {
      if (prompt.kind === 'read') {
        sessionRef.current = await startListening(
          prompt.en,
          ACCENTS[0],
          settleCalibration,
          () => setPhase('scoring'),
          failed,
        )
      } else {
        sessionRef.current = await startLocalTranscription({
          onAutoStop: settleTranscript,
          onScoring: () => setPhase('scoring'),
          onError: failed,
        })
      }
    } catch (problem) {
      failed(problem)
    }
  }

  const next = () => {
    if (!result) return
    if (index === PROMPTS.length - 1) {
      const samples: VoiceTranscriptSample[] = SPEAKING_PROMPTS.map(({ id }) => ({
        id,
        text: transcripts[id] || (prompt.kind === 'speak' && prompt.id === id && 'text' in result ? result.text : ''),
      }))
      onComplete(scoreLocalVoicePlacement(pronunciationScore || 0, samples))
      return
    }
    setIndex((value) => value + 1)
    setResult(null)
    setMessage('')
    setPhase('idle')
  }

  const leave = () => {
    const active = sessionRef.current
    sessionRef.current = null
    active?.cancel()
    onCancel()
  }

  const transcript = result && 'text' in result ? result.text : ''
  const pronunciation = result && 'score' in result ? result : null

  return <div style={{width:'100%',maxWidth:560}}>
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,color:C.warm,fontSize:'0.8rem'}}>
      <button onClick={leave} disabled={busy} style={{border:'none',background:'transparent',color:C.warm,cursor:'pointer'}}>← {lang==='ru'?'Другой способ':'Other option'}</button>
      <span>{index+1} / {PROMPTS.length}</span>
    </div>
    <div style={{height:5,borderRadius:5,background:'rgba(255,255,255,.09)',overflow:'hidden',marginBottom:24}}><div style={{height:'100%',width:`${((index+1)/PROMPTS.length)*100}%`,background:`linear-gradient(90deg,${C.mercury},${C.mercuryBright})`}}/></div>
    <div className="focus-card" style={{padding:'24px 20px'}}>
      <div style={{fontSize:'0.72rem',fontWeight:800,color:C.jupiter,letterSpacing:1.2,textTransform:'uppercase'}}>
        {prompt.kind === 'read'
          ? (lang==='ru'?'Калибровка произношения':'Pronunciation calibration')
          : (lang==='ru'?'Ответь по-английски':'Answer in English')}
      </div>
      <h2 style={{fontSize:'1.3rem',lineHeight:1.4,color:C.dark,margin:'12px 0 7px'}}>{prompt.en}</h2>
      <p style={{fontSize:'0.84rem',color:C.warm,margin:'0 0 16px'}}>
        {lang==='ru' ? prompt.ru : prompt.kind === 'read' ? 'Read this sentence aloud. It is used only as a pronunciation baseline.' : 'Speak naturally for about 15–20 seconds. Mila will show what it heard.'}
      </p>
      {prompt.kind === 'read' && <button onClick={()=>ttsSpeak(prompt.en,'en-GB',.8)} disabled={phase==='recording'||phase==='scoring'} style={{width:'100%',padding:11,borderRadius:11,border:`1px solid ${C.voice}`,background:C.voiceL,color:C.voice,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}><MilaIcon name="volume" size={17}/>{lang==='ru'?'Послушать':'Listen'}</button>}
      {pronunciation && <div style={{marginTop:14,padding:14,borderRadius:12,background:C.jupiterL,color:C.dark}}>
        <strong style={{color:C.jupiter}}>{lang==='ru'?'Произношение':'Pronunciation'}: {pronunciation.score}/100</strong>
        <div style={{fontSize:'0.83rem',color:C.warm,marginTop:4,display:'flex',alignItems:'flex-start',gap:6}}><MilaIcon name="sparkle" size={14} style={{flex:'0 0 auto',marginTop:2}}/><span>{pronunciation.tip}</span></div>
      </div>}
      {transcript && <div style={{marginTop:14,padding:14,borderRadius:12,background:C.mercuryL,color:C.dark,textAlign:'left'}}>
        <strong style={{color:C.mercury}}>{lang==='ru'?'Mila услышала':'Mila heard'}:</strong>
        <div style={{fontSize:'0.9rem',color:C.warm,marginTop:6,lineHeight:1.5}}>{transcript}</div>
      </div>}
      {(message||error) && <div role="alert" style={{marginTop:14,padding:12,borderRadius:11,background:C.roseL,color:C.rose,fontSize:'0.84rem'}}>{message||error}</div>}
      {phase==='scored' ? <div style={{display:'flex',gap:9,marginTop:16}}>
        <button onClick={record} style={{flex:1,padding:13,borderRadius:12,border:`1px solid ${C.voice}`,background:C.voiceL,color:C.voice,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><MilaIcon name="voice" size={17}/>{lang==='ru'?'Ещё раз':'Again'}</button>
        <button onClick={next} disabled={busy} style={{flex:2,padding:13,borderRadius:12,border:'none',background:C.mercury,color:'#02140f',fontWeight:800,cursor:'pointer'}}>{index===PROMPTS.length-1?(lang==='ru'?'Узнать уровень':'Get my level'):(lang==='ru'?'Продолжить →':'Continue →')}</button>
      </div> : <button onClick={record} disabled={phase==='scoring'||busy} style={{width:'100%',marginTop:16,padding:14,borderRadius:12,border:`1px solid ${phase==='scoring'?C.mercury:C.voice}`,background:phase==='recording'?C.voice:phase==='scoring'?C.mercuryL:C.voiceL,color:phase==='recording'?'#021418':phase==='scoring'?C.mercury:C.voice,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
        {phase==='recording'
          ? <><span style={{width:13,height:13,borderRadius:3,background:'currentColor'}} aria-hidden/>{lang==='ru'?'Закончить':'Stop'}</>
          : phase==='scoring'
          ? <><MilaIcon name="sparkle" size={17}/>{lang==='ru'?'Обрабатываю':'Processing'}</>
          : <><MilaIcon name="voice" size={17}/>{lang==='ru'?'Начать запись':'Start recording'}</>}
      </button>}
    </div>
    <p style={{fontSize:'0.75rem',lineHeight:1.5,color:'#8b8373',margin:'14px auto 0',maxWidth:450}}>{lang==='ru'?'Аудио отправляется только на сервер Mila, обрабатывается локальными моделями и удаляется сразу после запроса. Внешний AI-провайдер не используется.':'Audio goes only to Mila, is processed by local models, and is deleted immediately after the request. No external AI provider is used.'}</p>
  </div>
}
