import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './SaeromiSidebar.module.css'
import { INTRO, respond, SEEDS } from '../lib/saeromiDemo'

// public/ 자산은 import 대신 절대 경로로 참조 (Vite 규칙)
const MASCOT_SRC = '/saeromi-mascot.png'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// 아주 가벼운 인라인 포매터: **굵게** + 줄바꿈만 지원
function renderText(text) {
  if (!text) return null
  return String(text)
    .split('\n')
    .map((line, li) => (
      <span key={li} className={styles.line}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((seg, si) =>
          seg.startsWith('**') && seg.endsWith('**') ? (
            <strong key={si}>{seg.slice(2, -2)}</strong>
          ) : (
            <span key={si}>{seg}</span>
          )
        )}
      </span>
    ))
}

function RecCard({ card }) {
  return (
    <div className={styles.recCard}>
      <div className={styles.recTop}>
        <span className={styles.recBadge}>{card.badge}</span>
        {card.keyword && <span className={styles.recKeyword}>‘{card.keyword}’</span>}
      </div>
      <div className={styles.recHobby}>{card.hobby}</div>
      {card.tags?.length > 0 && (
        <div className={styles.recTags}>
          {card.tags.map((t) => (
            <span key={t} className={styles.recTag}>{t}</span>
          ))}
        </div>
      )}
      {card.meta && <div className={styles.recMeta}>📍 {card.meta}</div>}
      <a className={styles.recCta} href={card.ctaUrl} target="_blank" rel="noopener noreferrer">
        클래스 보러가기 →
      </a>
    </div>
  )
}

function chipEcho(chip) {
  if (chip.value?.startsWith('seed:')) {
    const s = SEEDS.find((x) => x.id === chip.value.slice(5))
    if (s) return s.echo
  }
  return chip.label
}

export default function SaeromiSidebar({ open, onClose }) {
  const [messages, setMessages] = useState([]) // {role, text?, card?}
  const [chips, setChips] = useState([])
  const [typing, setTyping] = useState(false)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')

  const bottomRef = useRef(null)
  const busyRef = useRef(false)
  const startedRef = useRef(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, chips])

  const playTurns = useCallback(async (turns) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setChips([])
    for (const turn of turns) {
      setTyping(true)
      await sleep(turn.thinking ?? 450)
      setTyping(false)
      setMessages((prev) => [...prev, { role: 'assistant', text: turn.text, card: turn.card }])
      if (turn.chips) setChips(turn.chips)
      await sleep(220)
    }
    busyRef.current = false
    setBusy(false)
  }, [])

  // 사이드바가 처음 열릴 때 인사 재생
  useEffect(() => {
    if (open && !startedRef.current) {
      startedRef.current = true
      playTurns(INTRO.turns)
    }
  }, [open, playTurns])

  const sendValue = useCallback(
    (userBubbleText, value) => {
      if (busyRef.current) return
      setChips([])
      setMessages((prev) => [...prev, { role: 'user', text: userBubbleText }])
      const turns = respond(value)
      playTurns(turns)
    },
    [playTurns]
  )

  const handleChip = (chip) => {
    if (chip.value === '__custom__') {
      // 입력창으로 포커스만 유도 (사용자 버블 없이)
      setChips([])
      setMessages((prev) => [...prev, { role: 'assistant', text: respond('__custom__')[0].text }])
      textareaRef.current?.focus()
      return
    }
    sendValue(chipEcho(chip), chip.value)
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || busyRef.current) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    sendValue(text, text)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'
  }

  const restart = () => {
    if (busyRef.current) return
    setMessages([])
    setChips([])
    startedRef.current = true
    playTurns(INTRO.turns)
  }

  return (
    <aside className={`${styles.panel} ${open ? styles.open : ''}`} aria-hidden={!open}>
      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>💡</span>
          <span className={styles.brandName}>새로미</span>
          <span className={styles.demoBadge}>DEMO</span>
        </div>
        <div className={styles.headerBtns}>
          <button className={styles.iconBtn} onClick={restart} title="대화 다시 시작" disabled={busy}>↺</button>
          <button className={styles.iconBtn} onClick={onClose} title="닫기" aria-label="사이드바 닫기">✕</button>
        </div>
      </header>

      {/* 마스코트 무대 */}
      <div className={styles.stage}>
        <div className={`${styles.halo} ${typing ? styles.haloActive : ''}`} aria-hidden="true" />
        <img src={MASCOT_SRC} alt="새로미" className={`${styles.mascot} ${typing ? styles.mascotThinking : ''}`} />
        <div className={styles.caption}>
          {typing ? '새로운 취향을 찾는 중…' : '알고리즘 밖의 가능성을 추천해요'}
        </div>
      </div>

      {/* 대화 */}
      <div className={styles.messages}>
        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className={styles.userRow}>
              <div className={styles.userBubble}>{m.text}</div>
            </div>
          ) : (
            <div key={i} className={styles.botRow}>
              <div className={styles.botAvatar}>💡</div>
              <div className={styles.botCol}>
                {m.text && <div className={styles.botBubble}>{renderText(m.text)}</div>}
                {m.card && <RecCard card={m.card} />}
              </div>
            </div>
          )
        )}

        {typing && (
          <div className={styles.botRow}>
            <div className={styles.botAvatar}>💡</div>
            <div className={styles.typingBubble}>
              <span /><span /><span />
            </div>
          </div>
        )}

        {chips.length > 0 && !typing && (
          <div className={styles.chips}>
            {chips.map((c) => (
              <button key={c.value} className={styles.chip} onClick={() => handleChip(c)} disabled={busy}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder={busy ? '새로미가 생각 중…' : '관심사를 입력해 보세요…'}
          rows={1}
          disabled={busy}
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={busy || !input.trim()} aria-label="보내기">
          ↑
        </button>
      </div>
      <div className={styles.footHint}>데모 · 실제 추천은 LLM·임베딩 기반으로 동작합니다</div>
    </aside>
  )
}
