import { useState } from 'react'
import Landing from './components/landing/Landing'
import SaeromiSidebar from './components/SaeromiSidebar'
import styles from './App.module.css'

// 새로미 — 랜딩 페이지 + 펼치면 화면 절반을 차지하는 아바타 사이드바(채팅 데모)
export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <div className={`${styles.app} ${open ? styles.shifted : ''}`}>
      <div className={styles.main}>
        <Landing onOpenChat={() => setOpen(true)} />
      </div>

      <SaeromiSidebar open={open} onClose={() => setOpen(false)} />

      {!open && (
        <button className={styles.handle} onClick={() => setOpen(true)} aria-label="새로미와 대화 열기">
          <span className={styles.handleIcon}>💡</span>
          <span className={styles.handleText}>새로미와 대화</span>
        </button>
      )}
    </div>
  )
}
