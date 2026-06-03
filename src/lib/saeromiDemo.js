// ─────────────────────────────────────────────────────────────────────────
// 새로미 데모 대화 엔진 (서버·API 키 불필요, 100% 클라이언트)
//
// PPT 슬라이드 7의 흐름을 그대로 재현한다:
//   사용자 "새로운 거 추천해줘"
//     → 새로미 "최근 본 콘텐츠 3개 알려줘"
//     → 사용자 답변(감성 브이로그·캠핑·자취 인테리어 …)
//     → 공통 키워드 추출 ("느린 미학")
//     → "왜 맞는지" 설명 (단순 추천 X)  ← 슬라이드 5 차별점
//     → 새로운 취미 추천 + 클래스 연결   ← 슬라이드 8 비즈니스 모델
//     → 새로운 취미 발견
//
// 대화는 "turn" 배열로 표현된다. 사이드바가 순서대로 재생하며,
// turn.thinking(ms) 만큼 타이핑 점을 보여준 뒤 text/card/chips 를 띄운다.
// ─────────────────────────────────────────────────────────────────────────

const CLASS101 = (q) => `https://class101.net/ko/search?query=${encodeURIComponent(q)}`

// ── 취향 시드 3종 — 각각 완결된 "추출 → 추천" 시나리오 ──
export const SEEDS = [
  {
    id: 'slow',
    chip: '🌿 감성 브이로그 · 캠핑 · 자취 인테리어',
    echo: '요즘 감성 브이로그랑 캠핑 영상, 자취 인테리어 콘텐츠를 자주 봐.',
    picks: ['감성 브이로그', '캠핑 영상', '자취 인테리어'],
    keyword: '느린 미학',
    insight: '셋 다 “빠르게 소비하는 자극”이 아니라, 시간을 천천히 흘려보내며 손과 공간을 직접 가꾸는 몰입이에요.',
    fitWhy: '캠핑을 좋아하는 진짜 이유가 “자연 속 느린 휴식”이라면, 도예도 비슷한 만족감을 줄 수 있어요. 흙을 만지며 시간을 잊는 몰입, 내 손으로 하나의 결과물을 완성하는 성취 — 익숙한 취향의 “이유”는 같고, 영역만 새로워지는 거죠.',
    rec: {
      badge: '새로운 취미',
      hobby: '도예 · 물레 원데이 클래스',
      tags: ['#느린미학', '#손으로몰입', '#비움'],
      meta: '서울·경기 12곳 · 3~6만원대 · 후기 ★4.8',
      query: '도예 원데이클래스',
    },
  },
  {
    id: 'world',
    chip: '🎮 전략 시뮬 게임 · SF 영화 · 사이드 프로젝트',
    echo: '전략 시뮬 게임이랑 SF 영화 좋아하고, 주말엔 코딩 사이드 프로젝트를 해.',
    picks: ['전략 시뮬 게임', 'SF 영화', '코딩 사이드 프로젝트'],
    keyword: '세계관 설계',
    insight: '셋 다 “정해진 콘텐츠를 보는 것”을 넘어, 규칙과 세계를 직접 설계하고 작동시키는 데서 재미를 느끼는 취향이에요.',
    fitWhy: '당신이 게임과 SF에 끌리는 이유가 “나만의 규칙으로 굴러가는 세계”라면, 그 욕구를 화면 밖에서 직접 만들어 볼 수 있어요. 알고리즘은 비슷한 게임을 더 추천하지만, 새로미는 그 “창작 욕구” 자체를 새로운 영역으로 옮겨줍니다.',
    rec: {
      badge: '새로운 취미',
      hobby: '보드게임 디자인 워크숍',
      tags: ['#세계관설계', '#룰메이킹', '#창작'],
      meta: '온라인+오프라인 · 5~9만원대 · 후기 ★4.7',
      query: '보드게임 만들기 클래스',
    },
  },
  {
    id: 'analog',
    chip: '🎧 재즈 LP · 필름 카메라 · 동네 카페',
    echo: '재즈 LP 모으고, 필름 카메라로 찍고, 동네 카페 탐방하는 걸 좋아해.',
    picks: ['재즈 LP', '필름 카메라', '동네 카페 탐방'],
    keyword: '아날로그 수집',
    insight: '셋 다 “편리한 디지털” 대신, 손이 가는 불편함과 기다림 속에서 나만의 취향을 모으는 즐거움이에요.',
    fitWhy: '필름 사진과 LP에 끌리는 이유가 “기다림 끝에 손에 쥐는 아날로그의 질감”이라면, 직접 인화하는 경험은 그 만족을 한 단계 더 깊게 만들어 줘요. 같은 감정, 한 걸음 더 새로운 영역으로요.',
    rec: {
      badge: '새로운 취미',
      hobby: '흑백 필름 암실 인화 클래스',
      tags: ['#아날로그수집', '#기다림의미학', '#손맛'],
      meta: '서울 5곳 · 6~8만원대 · 후기 ★4.9',
      query: '흑백 암실 인화 클래스',
    },
  },
]

const SEED_BY_ID = Object.fromEntries(SEEDS.map((s) => [s.id, s]))

// ── 첫 인사 ──
export const INTRO = {
  turns: [
    {
      text: '안녕하세요, 저는 새로미예요 💡\n알고리즘이 당신을 “좋아하던 것”에 가둘 때, 저는 그 밖의 **새로운 가능성**을 찾아드려요.',
    },
    {
      thinking: 500,
      text: '오늘은 당신도 모르던 새로운 취미를 하나 찾아볼까요?',
      chips: [
        { label: '✨ 새로운 거 추천해줘', value: '__start__' },
        { label: '새로미가 뭐야?', value: '__about__' },
      ],
    },
  ],
}

// 3개 콘텐츠를 물어보는 단계
function askForThree() {
  return [
    {
      thinking: 600,
      text: '좋아요! 먼저 당신을 알아야 새로운 걸 찾아줄 수 있어요.\n**최근에 재밌게 본 콘텐츠 3가지**를 알려줄래요? (영상·영화·뭐든 좋아요)',
    },
    {
      thinking: 300,
      text: '아래에서 골라도 되고, 직접 입력해도 돼요 🙂',
      chips: [
        ...SEEDS.map((s) => ({ label: s.chip, value: `seed:${s.id}` })),
        { label: '⌨️ 직접 입력할래', value: '__custom__' },
      ],
    },
  ]
}

// 시드 1개 → 전체 "추출 → 추천" 시퀀스
function revealSeed(seed) {
  return [
    { thinking: 1100, text: `흥미롭네요. ${seed.picks.map((p) => `“${p}”`).join(', ')} … 세 콘텐츠의 **공통점**을 찾아볼게요.` },
    { thinking: 1300, text: `🔍 분석 결과, 공통 키워드는 **‘${seed.keyword}’** 예요.\n${seed.insight}` },
    {
      thinking: 900,
      text: `여기서 보통 알고리즘은 “비슷한 콘텐츠”를 더 보여줘요. 하지만 새로미는 달라요.\n\n${seed.fitWhy}`,
    },
    {
      thinking: 1000,
      text: `그래서 당신에게 이걸 추천해요 👇`,
      card: {
        ...seed.rec,
        keyword: seed.keyword,
        ctaUrl: CLASS101(seed.rec.query),
      },
    },
    {
      thinking: 500,
      text: '추천에서 끝이 아니라, **실제 클래스로 연결**해 드려요. (새로미는 바로 이 “새로운 경험으로의 연결”에서 수익을 만들어요 — 클래스 제휴)',
      chips: [
        { label: '🔄 다른 취향으로 다시', value: '__again__' },
        { label: '🌱 마음에 들어요!', value: '__like__' },
      ],
    },
  ]
}

// 새로미 소개 (슬라이드 4·5)
function aboutSaeromi() {
  return [
    {
      text: '새로미는 **기존 추천 시스템과 반대로** 움직여요.\n\n· 기존 AI: 당신이 *좋아하는 것*을 반복 추천 🔁\n· 새로미: 당신이 *좋아할 가능성*이 있는 **새로운 영역**을 추천 🌱',
    },
    {
      thinking: 700,
      text: '그리고 단순 추천에서 끝나지 않고, **“왜 이게 당신에게 맞는지”** 그 이유까지 설명해 드려요.',
      chips: [{ label: '✨ 좋아, 추천 받아볼래', value: '__start__' }],
    },
  ]
}

// 자유 입력 → 키워드 매칭(라이트) 또는 일반 추천
const KEYWORD_HINTS = [
  { match: ['캠핑', '브이로그', '자취', '인테리어', '힐링', '자연', '감성'], seed: 'slow' },
  { match: ['게임', 'sf', '코딩', '개발', '전략', '시뮬', '세계관', '판타지'], seed: 'world' },
  { match: ['lp', '재즈', '필름', '카메라', '카페', '아날로그', '레트로', '빈티지'], seed: 'analog' },
]

const GENERIC_RECS = [
  { keyword: '몸으로 쓰는 글', hobby: '클라이밍 (볼더링)', tags: ['#몰입', '#성취', '#새로운자극'], meta: '전국 실내암장 · 2~3만원대 · 입문 환영', query: '클라이밍 원데이' },
  { keyword: '손끝의 집중', hobby: '캘리그라피 입문 클래스', tags: ['#기록', '#차분함', '#손글씨'], meta: '온라인+오프라인 · 3~5만원대', query: '캘리그라피 클래스' },
  { keyword: '향으로 만드는 무드', hobby: '향수·디퓨저 조향 클래스', tags: ['#감각', '#나만의것', '#취향'], meta: '서울·경기 다수 · 4~7만원대', query: '조향 클래스' },
]

function customPrompt() {
  return [
    {
      thinking: 400,
      text: '좋아요! 최근 자주 본/좋아하는 걸 편하게 적어주세요. (예: “요즘 등산 영상이랑 식물 키우기, 오래된 책방을 좋아해”)',
    },
  ]
}

function freeText(text) {
  const low = text.toLowerCase()
  const hit = KEYWORD_HINTS.find((h) => h.match.some((m) => low.includes(m.toLowerCase())))
  if (hit) {
    const seed = SEED_BY_ID[hit.seed]
    return [
      { thinking: 1100, text: `오, “${text.trim().slice(0, 30)}” … 좋은 취향이에요. 그 안의 **핵심 감정**을 찾아볼게요.` },
      { thinking: 1200, text: `🔍 공통 키워드는 **‘${seed.keyword}’**! ${seed.insight}` },
      {
        thinking: 900,
        text: `같은 감정을 한 걸음 더 새로운 영역으로 옮기면 — ${seed.fitWhy}`,
      },
      {
        thinking: 800,
        text: '그래서 이걸 추천해요 👇',
        card: { ...seed.rec, keyword: seed.keyword, ctaUrl: CLASS101(seed.rec.query) },
      },
      {
        thinking: 400,
        text: '실제 클래스로 바로 연결해 드릴게요.',
        chips: [
          { label: '🔄 다른 취향으로 다시', value: '__again__' },
          { label: '🌱 마음에 들어요!', value: '__like__' },
        ],
      },
    ]
  }
  // 일반 추천 — 입력 글자수로 결정적 선택(랜덤 회피)
  const g = GENERIC_RECS[text.length % GENERIC_RECS.length]
  return [
    { thinking: 1100, text: `“${text.trim().slice(0, 30)}” … 흥미롭네요! 그 취향의 **핵심 결**을 읽어볼게요.` },
    { thinking: 1200, text: `🔍 당신에게서 느껴지는 키워드는 **‘${g.keyword}’**.\n익숙한 영역을 살짝 벗어나면 더 큰 만족을 줄 거예요.` },
    {
      thinking: 800,
      text: '이런 새로운 취미는 어때요? 👇',
      card: { badge: '새로운 취미', hobby: g.hobby, keyword: g.keyword, tags: g.tags, meta: g.meta, ctaUrl: CLASS101(g.query) },
    },
    {
      thinking: 400,
      text: '마음에 드는 게 있으면 바로 클래스로 연결해 드릴게요.',
      chips: [
        { label: '🔄 다른 취향으로 다시', value: '__again__' },
        { label: '🌱 마음에 들어요!', value: '__like__' },
      ],
    },
  ]
}

function likeClosing() {
  return [
    {
      thinking: 500,
      text: '🌱 새로운 취향 하나, 발견 완료!\n알고리즘이 놓친 가능성을 찾는 게 제 일이에요. 언제든 또 불러주세요.',
      chips: [{ label: '✨ 또 추천받기', value: '__start__' }],
    },
  ]
}

// ── 메인 디스패처 ──
// value: 칩 클릭값('__start__', 'seed:slow' …) 또는 사용자가 직접 입력한 자유 텍스트
export function respond(value) {
  const v = (value || '').trim()
  if (v === '__start__' || v === '__again__') return askForThree()
  if (v === '__about__') return aboutSaeromi()
  if (v === '__custom__') return customPrompt()
  if (v === '__like__') return likeClosing()
  if (v.startsWith('seed:')) {
    const seed = SEED_BY_ID[v.slice(5)]
    if (seed) return revealSeed(seed)
  }
  // 그 외 → 자유 입력으로 처리
  return freeText(v)
}

// 백엔드(Gemma4)가 없을 때(로컬 vite dev 등) 자유 입력에 대한 폴백 답변 1개(plain text).
// 실제 배포(Vercel + TEAM_ID)에서는 /api/chat-stream 의 Gemma4 응답이 우선.
export function demoReply(text) {
  const turns = freeText(text || '')
  return turns.filter((t) => t.text).map((t) => t.text.replace(/\*\*/g, '')).join('\n\n')
}
