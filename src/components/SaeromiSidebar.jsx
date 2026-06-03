import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import styles from './SaeromiSidebar.module.css'

// three.js/VRM은 무거우므로 음성·화상 모드를 켤 때만 지연 로드 (랜딩 첫 로드 경량 유지)
const VRMAvatar = lazy(() => import('./VRMAvatar'))

const MASCOT_SRC = '/saeromi-mascot.png'

const STATUS_MAP = {
  idle:       { label: '대기 중',   dot: 'gray' },
  connecting: { label: '연결 중…',  dot: 'yellow' },
  connected:  { label: '연결됨',    dot: 'green' },
  speaking:   { label: '말하는 중', dot: 'blue' },
}

const MODES = [
  { id: 'ttt', icon: '💬', label: '텍스트' },
  { id: 'sts', icon: '🎙', label: '음성' },
  { id: 'ftf', icon: '📷', label: '화상' },
]

// **굵게** + 줄바꿈만 지원하는 가벼운 포매터
function renderText(text) {
  if (text === '' || text == null) return null
  return String(text).split('\n').map((line, li) => (
    <span key={li} className={styles.line}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((seg, si) =>
        seg.startsWith('**') && seg.endsWith('**')
          ? <strong key={si}>{seg.slice(2, -2)}</strong>
          : <span key={si}>{seg}</span>
      )}
    </span>
  ))
}

function TypingDots() {
  return <div className={styles.typingDots}><span /><span /><span /></div>
}

export default function SaeromiSidebar({
  open, onClose,
  status, mode, onModeChange,
  vrmAvatarRef, onAvatarReady, userVideoRef, videoReady, cameraActive,
  onStart, onStop, onInterrupt,
  messages, isProcessing, onSend, connected, isListening, onToggleMic, micEnabled, micAvailable,
}) {
  const [input, setInput] = useState('')
  const [avatarError, setAvatarError] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const showVRM = mode === 'ftf' || mode === 'sts'
  const st = STATUS_MAP[status] || STATUS_MAP.idle

  const handleSend = () => {
    const text = input.trim()
    if (!text || isProcessing || !connected) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(text)
  }
  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }
  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'
  }

  return (
    <aside className={`${styles.panel} ${open ? styles.open : ''}`} aria-hidden={!open}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>💡</span>
          <span className={styles.brandName}>새로미</span>
        </div>
        <button className={styles.iconBtn} onClick={onClose} title="닫기" aria-label="사이드바 닫기">✕</button>
      </header>

      {/* 아바타 무대 */}
      <div className={styles.stage}>
        <div className={styles.stageInner}>
          {showVRM ? (
            <div className={styles.vrmWrap}>
              <Suspense fallback={<div className={styles.placeholder}><div className={styles.loadingSpinner} /><p className={styles.phText}>아바타 준비 중…</p></div>}>
                <VRMAvatar
                  ref={vrmAvatarRef}
                  vrmUrl="/avatar.vrm"
                  onReady={() => { setAvatarError(false); onAvatarReady?.() }}
                  onError={() => setAvatarError(true)}
                  style={{ opacity: videoReady ? 1 : 0, transition: 'opacity .35s ease' }}
                />
              </Suspense>
              {!videoReady && !avatarError && (
                <div className={styles.placeholder}>
                  <div className={styles.loadingSpinner} />
                  <p className={styles.phText}>아바타 불러오는 중…</p>
                </div>
              )}
              {!videoReady && avatarError && (
                <div className={styles.placeholder}>
                  <img src={MASCOT_SRC} alt="새로미" className={styles.phMascot} />
                  <p className={styles.phText}>아바타(VRM)를 불러오지 못했어요</p>
                  <p className={styles.phSub}><code>public/avatar.vrm</code> 파일을 확인하세요.</p>
                </div>
              )}
              {status === 'speaking' && <div className={styles.speakGlow} />}
              {mode === 'ftf' && (
                <div className={`${styles.camPip} ${cameraActive ? styles.camOn : ''}`}>
                  <video ref={userVideoRef} autoPlay muted playsInline className={styles.camVideo}
                         style={{ opacity: cameraActive ? 1 : 0 }} />
                  {!cameraActive && <div className={styles.camPlaceholder}>CAM</div>}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.mascotWrap}>
              <div className={`${styles.halo} ${isProcessing ? styles.haloActive : ''}`} aria-hidden="true" />
              <img src={MASCOT_SRC} alt="새로미" className={`${styles.mascot} ${isProcessing ? styles.mascotThinking : ''}`} />
            </div>
          )}
        </div>

        {/* 모드 선택 */}
        <div className={styles.modeRow} role="group" aria-label="대화 방식">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`${styles.modeBtn} ${mode === m.id ? styles.modeOn : ''}`}
              onClick={() => onModeChange?.(m.id)}
              disabled={status === 'connecting'}
              aria-pressed={mode === m.id}
            >
              <span aria-hidden="true">{m.icon}</span> {m.label}
            </button>
          ))}
        </div>

        {/* 상태 + 시작/종료 */}
        <div className={styles.controls}>
          {status === 'speaking' ? (
            <button className={styles.interruptBtn} onClick={onInterrupt} type="button">
              <span className={`${styles.dot} ${styles[st.dot]}`} /> ‖ 말 멈추기
            </button>
          ) : (
            <span className={styles.statusRow}>
              <span className={`${styles.dot} ${styles[st.dot]}`} /> {st.label}
            </span>
          )}
          {status === 'idle' && (
            <button className={styles.startBtn} onClick={onStart}>▶ 대화 시작</button>
          )}
          {status === 'connecting' && (
            <button className={styles.startBtn} disabled><span className={styles.miniSpinner} /> 연결 중…</button>
          )}
          {(status === 'connected' || status === 'speaking') && (
            <button className={styles.stopBtn} onClick={() => { if (confirm('대화를 종료할까요? 채팅 기록은 초기화돼요.')) onStop?.() }}>■ 종료</button>
          )}
        </div>
      </div>

      {/* 메시지 */}
      <div className={styles.messages}>
        {messages.length === 0 && status === 'idle' && (
          <div className={styles.emptyHint}>
            모드를 고르고 <b>대화 시작</b>을 누르면 새로미와 대화할 수 있어요.<br />
            <span className={styles.emptyDim}>음성·화상은 배포 환경(Gemma4)에서 동작합니다.</span>
          </div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === 'user'
          const isEmptyAssistant = !isUser && (m.text === '' || m.text == null)
          return isUser ? (
            <div key={i} className={styles.userRow}><div className={styles.userBubble}>{m.text}</div></div>
          ) : (
            <div key={i} className={styles.botRow}>
              <div className={styles.botAvatar}>💡</div>
              <div className={styles.botBubble}>{isEmptyAssistant ? <TypingDots /> : renderText(m.text)}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className={styles.inputArea}>
        {micAvailable && (
          <button
            type="button"
            className={`${styles.micBtn} ${isListening ? styles.micOn : ''}`}
            onClick={onToggleMic}
            disabled={!micEnabled}
            title={isListening ? '듣기 중지' : '음성 듣기 시작'}
          >{isListening ? '■' : '◉'}</button>
        )}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder={
            !connected ? '먼저 [대화 시작]을 눌러주세요'
            : mode === 'ttt' ? '메시지를 입력하세요…'
            : isListening ? '듣고 있어요…'
            : '메시지를 입력하거나 마이크를 누르세요…'
          }
          rows={1}
          disabled={isProcessing || !connected}
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={isProcessing || !input.trim() || !connected} aria-label="보내기">
          {isProcessing ? <span className={styles.miniSpinner} /> : '↑'}
        </button>
      </div>
      <div className={styles.footHint}>Enter 전송 · Shift+Enter 줄바꿈{micAvailable ? ' · ◉ 음성' : ''}</div>
    </aside>
  )
}
