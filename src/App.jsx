import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import Landing from './components/landing/Landing'
import ChatPanel from './components/ChatPanel'
import AuthModal from './components/AuthModal'
import styles from './App.module.css'
import { newSessionId, saveChat, getUser, clearAuth, verifyToken } from './lib/api'
import { MicRecorder, isMicRecorderSupported } from './lib/stt'
import { demoReply } from './lib/saeromiDemo'

// three.js/VRM은 무거우므로 사이드바 첫 오픈 시 지연 로드 (랜딩 첫 로드 경량 유지)
const AvatarPanel = lazy(() => import('./components/AvatarPanel'))

// 새로미 — 랜딩 + 펼치면 화면 절반을 차지하는 아바타 사이드바.
// 사이드바는 ftf(아바타+카메라+음성) / sts(아바타+음성) / ttt(텍스트) 3모드 + 실제 Gemma4 채팅.
//   /api/chat-stream  : SSE LLM 스트림 (미들턴 Gemma4 + 팀 RAG, Vercel + TEAM_ID 필요)
//   /api/tts /api/stt : 음성
// 백엔드가 없으면(로컬 vite dev 등) 채팅은 데모 시나리오로 자동 폴백.

const ECHO_RESUME_DELAY_MS = 700

const GREETING_TEXT = '안녕하세요, 저는 새로미예요 💡 익숙한 취향 밖의 새로운 가능성을 찾아드려요. 무엇이 궁금하세요?'
const GREETING_TTS  = '안녕하세요, 저는 새로미예요. 익숙한 취향 밖의 새로운 가능성을 찾아드려요. 무엇이 궁금하세요?'

function normalizeTranscript(text) {
  return (text || '').replace(/\s+/g, ' ').trim()
}

function normalizeTtsText(text) {
  if (!text) return ''
  return String(text)
    .replace(/😊|😀|😃|😄|😁|🙂|😉|👍|🙏|✨|💡|📌|🎓|📷|🎙|🎤|▶|■|◉|🌱|🔁|🔍|🧭|👇|🌿|🎮|🎧|⌨️/g, '')
    .replace(/\bAI\b/gi, '에이아이')
    .replace(/\bGPT\b/gi, '지피티')
    .replace(/\bAPI\b/gi, '에이피아이')
    .replace(/\bURL\b/gi, '유알엘')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function App() {
  const [open, setOpen]                 = useState(false)     // 사이드바 펼침 여부
  const [everOpened, setEverOpened]     = useState(false)     // 첫 오픈 후 봇 컴포넌트 마운트 유지
  const [user, setUser]                 = useState(getUser()) // 로그인 사용자(없으면 null=익명)
  const [authOpen, setAuthOpen]         = useState(false)     // 로그인 모달(로드 시 자동 오픈 X)
  const [status, setStatus]             = useState('idle')    // idle | connecting | connected | speaking
  const [messages, setMessages]         = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [videoReady, setVideoReady]     = useState(false)     // VRM 로드 완료
  const [isListening, setIsListening]   = useState(false)
  const [autoListen, setAutoListen]     = useState(false)
  const [conversationMode, setConversationMode] = useState('ttt')  // ftf | sts | ttt (기본 텍스트)
  const [cameraStream, setCameraStream] = useState(null)

  const vrmAvatarRef      = useRef(null)
  const sessionRef        = useRef(null)
  const userVideoRef      = useRef(null)
  const cameraStreamRef   = useRef(null)
  const historyRef        = useRef([])

  const ttsQueueRef       = useRef([])
  const ttsRunningRef     = useRef(false)
  const ttsAbortRef       = useRef(false)
  const sessionIdRef      = useRef(null)
  const conversationModeRef = useRef('ttt')

  const handleAvatarReady = useCallback(() => { setVideoReady(true) }, [])

  const openSidebar = useCallback(() => { setOpen(true); setEverOpened(true) }, [])
  const handleLogout = useCallback(() => { clearAuth(); setUser(null) }, [])
  useEffect(() => { verifyToken().then(u => { if (u) setUser(u) }) }, [])

  const micRecorderRef    = useRef(null)
  const isSpeakingRef     = useRef(false)
  const isProcessingRef   = useRef(false)
  const autoListenRef     = useRef(false)
  const isListeningRef    = useRef(false)
  const echoResumeTimerRef = useRef(null)
  const lastSubmittedSpeechRef = useRef({ key: '', at: 0 })

  useEffect(() => { isProcessingRef.current = isProcessing }, [isProcessing])
  useEffect(() => { autoListenRef.current   = autoListen }, [autoListen])
  useEffect(() => { isListeningRef.current  = isListening }, [isListening])
  useEffect(() => { isSpeakingRef.current   = (status === 'speaking') }, [status])
  useEffect(() => { conversationModeRef.current = conversationMode }, [conversationMode])

  useEffect(() => {
    if (userVideoRef.current) userVideoRef.current.srcObject = cameraStream || null
  }, [cameraStream])

  const stopUserCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    setCameraStream(null)
  }, [])

  const captureCameraFrame = useCallback(() => {
    const video = userVideoRef.current
    if (!video || !cameraStreamRef.current) return null
    if (!video.videoWidth || !video.videoHeight) return null
    try {
      const W = 640, H = 480
      const canvas = document.createElement('canvas')
      canvas.width = W; canvas.height = H
      canvas.getContext('2d').drawImage(video, 0, 0, W, H)
      return canvas.toDataURL('image/jpeg', 0.7)
    } catch (e) {
      console.warn('[captureCameraFrame] failed:', e)
      return null
    }
  }, [])

  const startUserCamera = useCallback(async () => {
    if (cameraStreamRef.current) return true
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('이 브라우저는 카메라 연결을 지원하지 않아요.')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      cameraStreamRef.current = stream
      setCameraStream(stream)
      return true
    } catch {
      alert('카메라 권한이 필요해요. 브라우저 주소창 왼쪽의 자물쇠 아이콘에서 카메라를 허용해주세요.')
      return false
    }
  }, [])

  useEffect(() => () => stopUserCamera(), [stopUserCamera])

  const sanitizeForTTS = (s) => {
    if (!s) return ''
    return s
      .replace(/https?:\/\/[^\s)\]]+/gi, '')
      .replace(/\bwww\.[^\s)\]]+/gi, '')
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  // ─── TTS queue (parallel pre-fetch) ───
  const processTTSQueue = useCallback(async () => {
    if (ttsRunningRef.current) return
    ttsRunningRef.current = true
    const avatar = vrmAvatarRef.current
    try {
      while (ttsQueueRef.current.length > 0 && !ttsAbortRef.current) {
        const bufPromise = ttsQueueRef.current.shift()
        if (!bufPromise) continue
        let buf
        try { buf = await bufPromise } catch (e) { console.warn('[tts queue] fetch fail:', e); continue }
        if (ttsAbortRef.current) break
        if (!isSpeakingRef.current) { isSpeakingRef.current = true; setStatus('speaking') }
        if (avatar && avatar.speak) { await avatar.speak(buf) }
      }
    } finally {
      ttsRunningRef.current = false
      ttsAbortRef.current = false
      if (isSpeakingRef.current && ttsQueueRef.current.length === 0) {
        isSpeakingRef.current = false
        setStatus(s => (s === 'speaking' ? 'connected' : s))
      }
    }
  }, [])

  const enqueueTTS = useCallback((sentence) => {
    const s = (sentence || '').trim()
    if (!s) return
    if (conversationModeRef.current === 'ttt') return  // 텍스트 전용 모드는 음성 없음
    const clean = sanitizeForTTS(normalizeTtsText(s))
    if (!clean) return
    const bufPromise = fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    }).then(res => { if (!res.ok) throw new Error('tts http ' + res.status); return res.arrayBuffer() })
    ttsQueueRef.current.push(bufPromise)
    processTTSQueue()
  }, [processTTSQueue])

  const clearTTSQueue = useCallback(() => {
    ttsAbortRef.current = true
    ttsQueueRef.current = []
    try { vrmAvatarRef.current?.stopSpeaking?.() } catch {}
    isSpeakingRef.current = false
    setStatus(s => (s === 'speaking' ? 'connected' : s))
  }, [])

  // ─── 메시지 전송 (Streaming SSE → Gemma4, 실패 시 데모 폴백) ───
  const sendMessage = useCallback(async (userText) => {
    const text = userText.trim()
    if (!text || isProcessingRef.current) return
    if (isSpeakingRef.current) {
      console.warn('[echo guard] sendMessage suppressed during avatar speaking')
      return
    }
    isProcessingRef.current = true
    setIsProcessing(true)

    setMessages(prev => [...prev, { role: 'user', text }])
    historyRef.current = [...historyRef.current, { role: 'user', content: text }]
    if (sessionIdRef.current) saveChat(sessionIdRef.current, 'user', text)
    setMessages(prev => [...prev, { role: 'assistant', text: '' }])

    let accumulated = ''
    let pending = ''
    let isFirstFlush = true

    const setLastAssistant = (t) => setMessages(prev => {
      const next = [...prev]
      const last = next[next.length - 1]
      if (last && last.role === 'assistant') next[next.length - 1] = { ...last, text: t }
      return next
    })

    const flushPendingIfSentence = () => {
      const minLen = isFirstFlush ? 6 : 12
      let m = pending.match(/^([\s\S]*?[.!?…。\n])(.*)$/)
      if (m && m[1].trim().length >= minLen) { enqueueTTS(m[1]); pending = m[2]; isFirstFlush = false; return true }
      if (isFirstFlush) {
        m = pending.match(/^([\s\S]*?[,，、])(.*)$/)
        if (m && m[1].trim().length >= 6) { enqueueTTS(m[1]); pending = m[2]; isFirstFlush = false; return true }
      }
      return false
    }

    try {
      const VISION_INTENT = /보여|보이|보세요|뒤에|뒷.{0,2}배경|배경에|여기.{0,2}어|주변|화면|카메라|캠|영상|모습|어떻게.{0,3}보|뭐가.{0,3}보/
      const wantsVision = conversationModeRef.current === 'ftf' && VISION_INTENT.test(text)
      const frame = wantsVision ? captureCameraFrame() : null
      const images = frame ? [frame] : []

      const res = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyRef.current.slice(-8), images }),
      })
      if (!res.ok || !res.body) throw new Error('chat-stream http ' + res.status)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let nlIdx
        while ((nlIdx = buf.indexOf('\n\n')) !== -1) {
          const event = buf.slice(0, nlIdx).trim()
          buf = buf.slice(nlIdx + 2)
          if (!event.startsWith('data: ')) continue
          const payload = event.slice(6).trim()
          if (payload === '[DONE]') { buf = ''; break }
          let obj
          try { obj = JSON.parse(payload) } catch { continue }
          if (obj.token) {
            accumulated += obj.token
            pending += obj.token
            setLastAssistant(accumulated)
            while (flushPendingIfSentence()) {}
          }
          if (obj.done && pending.trim()) { enqueueTTS(pending); pending = '' }
          if (obj.error) { console.warn('[chat-stream] server error:', obj.error) }
        }
      }
      if (pending.trim()) { enqueueTTS(pending); pending = '' }
      if (!accumulated.trim()) throw new Error('empty upstream response')

      historyRef.current = [...historyRef.current, { role: 'assistant', content: accumulated }]
      if (sessionIdRef.current) saveChat(sessionIdRef.current, 'assistant', accumulated)
    } catch (e) {
      // 백엔드 없음/오류 → 데모 시나리오로 폴백 (로컬 vite dev 등)
      console.warn('[chat-stream] demo fallback:', e?.message)
      const reply = demoReply(text) || '지금은 데모 모드예요. 실제 Gemma4 대화는 배포(서버 연결) 후 동작해요.'
      accumulated = reply
      setLastAssistant(reply)
      enqueueTTS(reply)
      historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }]
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  }, [captureCameraFrame, enqueueTTS])

  // ─── STT ───
  const submitSpeechText = useCallback((rawText) => {
    const text = normalizeTranscript(rawText)
    if (!text || text.length < 2) return
    if (isSpeakingRef.current || isProcessingRef.current) return
    const key = text.replace(/\s+/g, '')
    const now = Date.now()
    const last = lastSubmittedSpeechRef.current
    if (key === last.key && now - last.at < 8000) return
    lastSubmittedSpeechRef.current = { key, at: now }
    sendMessage(text)
  }, [sendMessage])

  const ensureMicRecorder = useCallback(() => {
    if (micRecorderRef.current) return micRecorderRef.current
    if (!isMicRecorderSupported()) {
      alert('이 브라우저는 음성 인식을 지원하지 않아요.\n텍스트 모드를 이용하시거나 최신 Chrome/Safari에서 시도해주세요.')
      return null
    }
    const rec = new MicRecorder({
      sttEndpoint: '/api/stt',
      onTranscript: (text) => submitSpeechText(text),
      onError: (err) => console.warn('[STT] MicRecorder error:', err),
      onStateChange: (st) => {
        const listening = st === 'listening' || st === 'recording'
        isListeningRef.current = listening
        setIsListening(listening)
      },
    })
    micRecorderRef.current = rec
    return rec
  }, [submitSpeechText])

  const startListening = useCallback(async () => {
    const rec = ensureMicRecorder()
    if (!rec) { autoListenRef.current = false; setAutoListen(false); return }
    try {
      if (!rec.isRunning) await rec.start(); else rec.resume()
    } catch (e) {
      console.warn('[STT] start failed:', e)
      const denied = e?.name === 'NotAllowedError' || /denied|permission|allowed/i.test(e?.message || '')
      alert(denied ? '마이크 권한이 필요해요.\n주소창 왼쪽 자물쇠 아이콘에서 마이크를 허용해주세요.'
                   : '마이크를 시작하지 못했어요. 다른 앱이 마이크를 쓰고 있지 않은지 확인해주세요.')
      autoListenRef.current = false; setAutoListen(false)
    }
  }, [ensureMicRecorder])

  const stopListening = useCallback(() => {
    const rec = micRecorderRef.current
    if (rec) { try { rec.stop() } catch {}; micRecorderRef.current = null }
    isListeningRef.current = false
    setIsListening(false)
  }, [])

  const interruptAvatar = useCallback(() => {
    try { clearTTSQueue() } catch (e) { console.error('interrupt error:', e) }
  }, [clearTTSQueue])

  useEffect(() => {
    const rec = micRecorderRef.current
    clearTimeout(echoResumeTimerRef.current)
    if (!rec || !rec.isRunning) return
    if (status === 'speaking') {
      rec.pause()
    } else if (status === 'connected' && autoListenRef.current) {
      echoResumeTimerRef.current = setTimeout(() => {
        const r = micRecorderRef.current
        if (r && r.isRunning && autoListenRef.current && !isSpeakingRef.current && !isProcessingRef.current) r.resume()
      }, ECHO_RESUME_DELAY_MS)
    }
    return () => clearTimeout(echoResumeTimerRef.current)
  }, [status])

  useEffect(() => {
    const rec = micRecorderRef.current
    if (!isProcessing && autoListen && rec && rec.isRunning && !isSpeakingRef.current) rec.resume()
  }, [isProcessing, autoListen])

  const toggleMic = useCallback(() => {
    if (conversationModeRef.current === 'ttt') return
    if (!sessionRef.current) { alert('먼저 [대화 시작] 버튼을 눌러주세요.'); return }
    if (autoListenRef.current || isListeningRef.current) {
      autoListenRef.current = false; setAutoListen(false); stopListening()
    } else {
      autoListenRef.current = true; setAutoListen(true); startListening()
    }
  }, [startListening, stopListening])

  // ESC = 발화 인터럽트
  useEffect(() => {
    const handleGlobalKeydown = (e) => {
      if (e.key !== 'Escape' && e.code !== 'Escape') return
      if (!sessionRef.current) return
      e.preventDefault(); e.stopPropagation()
      const t = e.target
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) t.blur()
      interruptAvatar()
    }
    window.addEventListener('keydown', handleGlobalKeydown, true)
    return () => window.removeEventListener('keydown', handleGlobalKeydown, true)
  }, [interruptAvatar])

  const stopAvatar = useCallback(async () => {
    clearTimeout(echoResumeTimerRef.current)
    lastSubmittedSpeechRef.current = { key: '', at: 0 }
    autoListenRef.current = false; setAutoListen(false)
    stopListening(); setIsListening(false)
    stopUserCamera()
    isSpeakingRef.current = false
    try { clearTTSQueue() } catch {}
    sessionRef.current = null
    sessionIdRef.current = null
    historyRef.current = []
    setStatus('idle')
    setMessages([])
  }, [stopListening, stopUserCamera, clearTTSQueue])

  const startTextMode = useCallback(() => {
    clearTimeout(echoResumeTimerRef.current)
    lastSubmittedSpeechRef.current = { key: '', at: 0 }
    autoListenRef.current = false; setAutoListen(false)
    stopListening(); setIsListening(false)
    stopUserCamera()
    isSpeakingRef.current = false
    sessionRef.current = null
    sessionIdRef.current = newSessionId()
    historyRef.current = []
    setStatus('connected')
    setMessages([{ role: 'assistant', text: GREETING_TEXT }])
    saveChat(sessionIdRef.current, 'assistant', GREETING_TEXT)
  }, [stopListening, stopUserCamera])

  const startAvatar = useCallback(async () => {
    setStatus('connecting')
    sessionIdRef.current = newSessionId()
    lastSubmittedSpeechRef.current = { key: '', at: 0 }
    if (conversationModeRef.current === 'ftf') await startUserCamera(); else stopUserCamera()
    for (let i = 0; i < 50 && !vrmAvatarRef.current?.isReady?.(); i++) {
      await new Promise(r => setTimeout(r, 100))
    }
    sessionRef.current = true
    historyRef.current = []
    setStatus('connected')
    setMessages([{ role: 'assistant', text: GREETING_TEXT }])
    saveChat(sessionIdRef.current, 'assistant', GREETING_TEXT)
    enqueueTTS(normalizeTtsText(GREETING_TTS))
    autoListenRef.current = true; setAutoListen(true)
    startListening()
  }, [startListening, startUserCamera, stopUserCamera, enqueueTTS])

  const startConversation = useCallback(() => {
    if (conversationModeRef.current === 'ttt') startTextMode(); else startAvatar()
  }, [startAvatar, startTextMode])

  const changeConversationMode = useCallback((nextMode) => {
    if (nextMode === conversationModeRef.current) return
    const hasAvatarSession = Boolean(sessionRef.current)
    const isTextOnlySession = status !== 'idle' && !hasAvatarSession
    if (isTextOnlySession && nextMode !== 'ttt') {
      alert('텍스트 대화에서 음성/화상으로 바꾸려면 대화를 종료한 뒤 다시 시작해주세요.')
      return
    }
    conversationModeRef.current = nextMode
    setConversationMode(nextMode)
    if (nextMode === 'ftf') { if (hasAvatarSession) startUserCamera() } else { stopUserCamera() }
    if (nextMode === 'ttt') { autoListenRef.current = false; setAutoListen(false); stopListening(); return }
    if (hasAvatarSession) { autoListenRef.current = true; setAutoListen(true); startListening() }
  }, [startListening, startUserCamera, status, stopListening, stopUserCamera])

  useEffect(() => () => {
    clearTimeout(echoResumeTimerRef.current)
    if (micRecorderRef.current) { try { micRecorderRef.current.stop() } catch {}; micRecorderRef.current = null }
  }, [])

  const isChatConnected = status !== 'idle' && status !== 'connecting'

  return (
    <div className={`${styles.app} ${open ? styles.shifted : ''}`}>
      <div className={styles.main}>
        <Landing onOpenChat={openSidebar} />
      </div>

      <aside className={`${styles.botSidebar} ${open ? styles.open : ''}`} aria-hidden={!open}>
        <div className={styles.botHeader}>
          <div className={styles.botBrand}><span className={styles.botMark}>💡</span><b>새로미</b></div>
          <button className={styles.botClose} onClick={() => setOpen(false)} aria-label="사이드바 닫기">✕</button>
        </div>
        {everOpened && (
          <Suspense fallback={<div className={styles.botLoading}><span className={styles.botSpinner} />봇 불러오는 중…</div>}>
            <AvatarPanel
              status={status}
              mode={conversationMode}
              onModeChange={changeConversationMode}
              vrmAvatarRef={vrmAvatarRef}
              onAvatarReady={handleAvatarReady}
              userVideoRef={userVideoRef}
              videoReady={videoReady}
              cameraActive={Boolean(cameraStream)}
              onStart={startConversation}
              onStop={stopAvatar}
              onInterrupt={interruptAvatar}
              isListening={isListening}
            />
            <ChatPanel
              messages={messages}
              isProcessing={isProcessing}
              onSend={sendMessage}
              connected={isChatConnected}
              isListening={isListening}
              onToggleMic={toggleMic}
              micEnabled={conversationMode !== 'ttt' && isChatConnected}
              micAvailable={conversationMode !== 'ttt'}
              mode={conversationMode}
              user={user}
              onLoginClick={() => setAuthOpen(true)}
              onLogout={handleLogout}
            />
          </Suspense>
        )}
      </aside>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={(u) => setUser(u)} />

      {!open && (
        <button className={styles.handle} onClick={openSidebar} aria-label="새로미와 대화 열기">
          <span className={styles.handleIcon}>💡</span>
          <span className={styles.handleText}>새로미와 대화</span>
        </button>
      )}
    </div>
  )
}
