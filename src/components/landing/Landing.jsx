import styles from './Landing.module.css'

const MASCOT_SRC = '/saeromi-mascot.png'

// ── PPT 데이터 ──────────────────────────────────────────────────────────────
const PLATFORMS = [
  { mark: '▶', name: 'YouTube' },
  { mark: '♪', name: 'TikTok' },
  { mark: 'N', name: 'Netflix' },
  { mark: '◉', name: 'Instagram' },
]
const CONSEQUENCES = ['취미 다양성 감소', '관심사 편향', '정보 편식']

const FLOW = [
  { icon: '💬', t: '사용자 입력', d: '“새로운 거 추천해줘”' },
  { icon: '📋', t: '최근 관심사 3개 수집', d: '콘텐츠 기반' },
  { icon: '💡', t: '공통 특성 추출', d: '가치 · 감성 · 맥락' },
  { icon: '🧭', t: '새로운 취미 추천', d: '다양성 중심 알고리즘' },
  { icon: '📍', t: '클래스 연결', d: '지역 · 가격 · 후기' },
]

const THEORY = [
  {
    era: '1960~70s', tag: '발견 · Discovery', icon: '🏛️',
    items: [
      { y: '1960', who: 'Berlyne', what: '최적 자극 수준' },
      { y: '1971', who: 'Brickman & Campbell', what: '쾌락 적응' },
      { y: '1971', who: 'Zuckerman', what: '감각 추구' },
    ],
  },
  {
    era: '1980~90s', tag: '규명 · Mechanism', icon: '🌱',
    items: [
      { y: '1986', who: 'Aron & Aron', what: '자아 확장' },
      { y: '1990', who: 'Csikszentmihalyi', what: 'Flow' },
      { y: '1994', who: 'Loewenstein', what: '호기심 / 정보 격차' },
      { y: '1995', who: 'Kahn', what: '다양성 추구 행동' },
    ],
  },
  {
    era: '2000s', tag: '디지털 진입', icon: '💻',
    items: [
      { y: '2003', who: 'Van Boven & Gilovich', what: '경험 소비 우월' },
      { y: '2005', who: 'Lyubomirsky et al.', what: '지속 가능한 행복' },
      { y: '2006', who: 'Anderson', what: 'The Long Tail' },
    ],
  },
  {
    era: '2010s', tag: '알고리즘 위기', icon: '⚠️',
    items: [
      { y: '2011', who: 'Pariser', what: 'Filter Bubble' },
      { y: '2013', who: 'Przybylski et al.', what: 'FOMO' },
      { y: '2015', who: 'Bakshy et al.', what: 'Echo Chamber 입증' },
      { y: '2016', who: 'Kotkov et al.', what: 'Serendipity 추천' },
    ],
  },
  {
    era: '2020s', tag: 'AI 해결', icon: '🤖',
    items: [
      { y: '2019', who: 'Logg et al.', what: 'Algorithm Appreciation' },
      { y: '2024', who: 'Glickman & Sharot', what: 'AI-Human Feedback' },
    ],
    highlight: { y: '2026', who: '새로미', what: '본성 회복' },
  },
]

const TECH = [
  { icon: '🤖', name: '챗봇', sub: 'LLM' },
  { icon: '🧠', name: 'LLM API', sub: 'OpenAI' },
  { icon: '🕸️', name: '추천 로직', sub: '다양성 기반' },
  { icon: '🗄️', name: '콘텐츠 분석', sub: '임베딩 / 클러스터링' },
  { icon: '📍', name: '클래스 DB', sub: '공방 · 클래스 제휴' },
  { icon: '📊', name: '피드백 학습', sub: '사용자 반응' },
]
const STATS = [
  { k: '개발 기간', v: '2~4주' },
  { k: '개발 인원', v: '2~3명' },
  { k: '초기 비용', v: '최소 비용' },
  { k: '핵심 강점', v: '빠른 구현+검증' },
]
const ROADMAP = [
  { step: '1단계', t: 'MVP', d: '공모전' },
  { step: '2단계', t: '대학생 100명', d: '테스트' },
  { step: '3단계', t: '추천 정확도', d: '개선' },
  { step: '4단계', t: '취미 플랫폼', d: '제휴' },
  { step: '5단계', t: '기업 복지', d: '서비스' },
  { step: '6단계', t: 'AI 다양성', d: '추천 플랫폼' },
]

function SectionLabel({ children }) {
  return <span className={styles.eyebrow}>{children}</span>
}

// ── 섹션들 ──────────────────────────────────────────────────────────────────
function Hero({ onOpenChat }) {
  return (
    <header className={styles.hero}>
      <div className={styles.floaties} aria-hidden="true">
        <span style={{ top: '12%', left: '8%' }}>✦</span>
        <span style={{ top: '24%', right: '12%' }}>♥</span>
        <span style={{ bottom: '20%', left: '14%' }}>＋</span>
        <span style={{ top: '60%', right: '8%' }}>✕</span>
        <span style={{ bottom: '12%', right: '20%' }}>✦</span>
      </div>
      <div className={styles.heroInner}>
        <div className={styles.heroText}>
          <span className={styles.heroPill}>알고리즘 탈출 연구소</span>
          <h1 className={styles.heroTitle}>새로미</h1>
          <p className={styles.heroTagline}>
            알고리즘이 가두는 시대,<br />
            <b>새로운 취향</b>을 찾아주는 AI 친구
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.btnPrimary} onClick={onOpenChat}>✨ 새로미와 대화하기</button>
            <a className={styles.btnGhost} href="#problem">↓ 더 알아보기</a>
          </div>
          <p className={styles.heroMeta}>데이터경영학과 · 20226129 · 임예영</p>
        </div>
        <div className={styles.heroArt}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <img src={MASCOT_SRC} alt="새로미 마스코트" className={styles.heroMascot} />
        </div>
      </div>
    </header>
  )
}

function Problem() {
  return (
    <section className={styles.section} id="problem">
      <div className={styles.wrap}>
        <SectionLabel>01 · PROBLEM</SectionLabel>
        <h2 className={styles.h2}>“당신의 관심사는<br />정말 당신이 선택한 것일까요?”</h2>
        <div className={styles.platforms}>
          {PLATFORMS.map((p) => (
            <span key={p.name} className={styles.platform}>
              <b>{p.mark}</b> {p.name}
            </span>
          ))}
        </div>
        <p className={styles.lead}>
          추천을 기반으로 하는 알고리즘은 사용자를 만족시키지만,<br />
          <b>동시에 사용자를 가둔다.</b>
        </p>
        <div className={styles.consequences}>
          {CONSEQUENCES.map((c) => (
            <div key={c} className={styles.consequence}>
              <span className={styles.consequenceArrow}>↓</span>
              <span className={styles.consequenceText}>“{c}”</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Differentiation() {
  return (
    <section className={`${styles.section} ${styles.sectionMint}`}>
      <div className={styles.wrap}>
        <SectionLabel>02 · SOLUTION</SectionLabel>
        <h2 className={styles.h2}>기존 AI와 새로미의 차별점</h2>
        <div className={styles.compare}>
          <div className={styles.compareCard}>
            <span className={styles.compareTag}>기존 AI</span>
            <p className={styles.compareLine}>좋아하는 것을 <b>반복</b> 추천 🔁</p>
            <p className={styles.compareSub}>익숙한 취향 안에 머무름</p>
          </div>
          <div className={styles.compareVs}>VS</div>
          <div className={`${styles.compareCard} ${styles.compareCardOn}`}>
            <span className={`${styles.compareTag} ${styles.compareTagOn}`}>새로미</span>
            <p className={styles.compareLine}>좋아할 가능성이 있는 <b>새로운 영역</b> 추천 🌱</p>
            <p className={styles.compareSub}>익숙한 취향 <b>밖으로</b> 안내</p>
          </div>
        </div>
        <div className={styles.exampleCard}>
          <span className={styles.exampleBadge}>단순 추천 X · “왜 맞는지” 설명 O</span>
          <p className={styles.exampleText}>
            “캠핑을 좋아하는 이유가 <b>자연 속 휴식</b>이라면,<br />
            도예도 비슷한 만족감을 줄 수 있습니다.”
          </p>
        </div>
      </div>
    </section>
  )
}

function Theory() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <SectionLabel>03 · THEORY</SectionLabel>
        <h2 className={styles.h2}>새로움 추구 이론의 70년</h2>
        <p className={styles.sub}>From Berlyne (1960) to 새로미 (2026)</p>
        <div className={styles.timeline}>
          {THEORY.map((col) => (
            <div key={col.era} className={styles.tlCol}>
              <div className={styles.tlHead}>
                <span className={styles.tlIcon}>{col.icon}</span>
                <span className={styles.tlEra}>{col.era}</span>
                <span className={styles.tlTag}>{col.tag}</span>
              </div>
              <div className={styles.tlItems}>
                {col.items.map((it) => (
                  <div key={it.y + it.who} className={styles.tlItem}>
                    <span className={styles.tlYear}>{it.y}</span>
                    <span className={styles.tlWho}>{it.who}</span>
                    <span className={styles.tlWhat}>{it.what}</span>
                  </div>
                ))}
                {col.highlight && (
                  <div className={`${styles.tlItem} ${styles.tlItemHi}`}>
                    <span className={styles.tlHiName}>✦ {col.highlight.who}</span>
                    <span className={styles.tlHiYear}>{col.highlight.y}</span>
                    <span className={styles.tlHiWhat}>{col.highlight.what}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks({ onOpenChat }) {
  return (
    <section className={`${styles.section} ${styles.sectionMint}`} id="how">
      <div className={styles.wrap}>
        <SectionLabel>04 · HOW IT WORKS</SectionLabel>
        <h2 className={styles.h2}>새로운 경험으로 연결</h2>
        <p className={styles.sub}>관심사 3개에서 공통 키워드를 뽑아 → 새로운 취미 → 실제 클래스까지</p>
        <div className={styles.flow}>
          {FLOW.map((s, i) => (
            <div key={s.t} className={styles.flowItem}>
              <div className={styles.flowIcon}>{s.icon}</div>
              <div className={styles.flowT}>{s.t}</div>
              <div className={styles.flowD}>{s.d}</div>
              {i < FLOW.length - 1 && <span className={styles.flowArrow} aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
        <div className={styles.demoCta}>
          <p>슬라이드 속 흐름을 직접 체험해 보세요 — <b>“느린 미학 → 도예 공방”</b></p>
          <button className={styles.btnPrimary} onClick={onOpenChat}>🧪 데모 체험하기</button>
        </div>
      </div>
    </section>
  )
}

function Business() {
  return (
    <section className={styles.section}>
      <div className={styles.wrap}>
        <SectionLabel>05 · BUSINESS MODEL</SectionLabel>
        <h2 className={styles.h2}>새로미의 비즈니스 모델</h2>
        <div className={styles.bizGrid}>
          <div className={styles.bizCard}>
            <span className={styles.bizNum}>1</span>
            <h3 className={styles.bizTitle}>취미 클래스 제휴</h3>
            <p className={styles.bizText}>
              클래스101 같은 원데이클래스 플랫폼과 협업해,
              사용자 유입 시 <b>수수료</b>를 받는 수익 구조.
            </p>
          </div>
          <div className={styles.bizCard}>
            <span className={styles.bizNum}>2</span>
            <h3 className={styles.bizTitle}>프리미엄 구독</h3>
            <p className={styles.bizText}>
              <b>월 4,900원</b> 구독료로 매월 새로운 취미 맛보기 샘플 키트 +
              맞춤 취미 로드맵 제공.
            </p>
          </div>
        </div>
        <p className={styles.bizPunch}>
          → 추천 자체가 아니라 <b>“새로운 경험으로 연결”</b>에서 수익이 발생합니다.
        </p>
      </div>
    </section>
  )
}

function Feasibility() {
  return (
    <section className={`${styles.section} ${styles.sectionDark}`}>
      <div className={styles.wrap}>
        <SectionLabel dark>06 · FEASIBILITY</SectionLabel>
        <h2 className={`${styles.h2} ${styles.h2Light}`}>새로미는 지금도 만들 수 있습니다</h2>
        <p className={`${styles.sub} ${styles.subLight}`}>기존 기술을 활용해, <b>새로운 추천 철학</b>을 구현합니다.</p>

        <div className={styles.feaCols}>
          <div className={styles.feaBox}>
            <h4 className={styles.feaBoxTitle}>필요한 기술 — 이미 존재하는 기술</h4>
            <div className={styles.techGrid}>
              {TECH.map((t) => (
                <div key={t.name} className={styles.techCard}>
                  <span className={styles.techIcon}>{t.icon}</span>
                  <span className={styles.techName}>{t.name}</span>
                  <span className={styles.techSub}>{t.sub}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.feaBox}>
            <h4 className={styles.feaBoxTitle}>MVP 한눈에</h4>
            <div className={styles.statGrid}>
              {STATS.map((s) => (
                <div key={s.k} className={styles.statCard}>
                  <span className={styles.statV}>{s.v}</span>
                  <span className={styles.statK}>{s.k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h4 className={`${styles.feaBoxTitle} ${styles.roadmapTitle}`}>단계별 성장 로드맵</h4>
        <div className={styles.roadmap}>
          {ROADMAP.map((r, i) => (
            <div key={r.step} className={styles.roadStep}>
              <span className={styles.roadNum}>{r.step}</span>
              <span className={styles.roadT}>{r.t}</span>
              <span className={styles.roadD}>{r.d}</span>
              {i < ROADMAP.length - 1 && <span className={styles.roadArrow} aria-hidden="true">›</span>}
            </div>
          ))}
        </div>

        <blockquote className={styles.quote}>
          “새로미의 혁신은 새로운 AI 기술이 아니라,<br /><b>AI를 사용하는 새로운 목적</b>에 있습니다.”
        </blockquote>
      </div>
    </section>
  )
}

function Closing({ onOpenChat }) {
  return (
    <section className={styles.closing}>
      <div className={styles.closingInner}>
        <img src={MASCOT_SRC} alt="새로미" className={styles.closingMascot} />
        <h2 className={styles.closingTitle}>
          알고리즘이 놓친<br /><b>새로운 가능성</b>을 추천하는 AI
        </h2>
        <button className={styles.btnPrimary} onClick={onOpenChat}>✨ 새로미와 대화 시작하기</button>
        <p className={styles.closingThanks}>감사합니다</p>
        <p className={styles.footer}>새로미 · 데이터경영학과 20226129 임예영 · 알고리즘 탈출 연구소 · 2026</p>
      </div>
    </section>
  )
}

export default function Landing({ onOpenChat }) {
  return (
    <main className={styles.page}>
      <Hero onOpenChat={onOpenChat} />
      <Problem />
      <Differentiation />
      <Theory />
      <HowItWorks onOpenChat={onOpenChat} />
      <Business />
      <Feasibility />
      <Closing onOpenChat={onOpenChat} />
    </main>
  )
}
