# PDF_UI_SPEC.md — ReachCheck PDF Design Spec (@react-pdf/renderer)

문서 목적: PDF 결과물의 “시각/레이아웃”을 고정한다.
PRD(내용/판정)와 DEV_PRD(시스템/데이터 흐름)로 해결되지 않는 영역(여백, 줄바꿈, 컴포넌트 규격, 깨짐 방지)을 여기서 강제한다.

0. UI 정체성(Identity) 고정
- 이 PDF는 “에디토리얼 리포트(보고서)”다.
- 시각 목표: 얇은 라인, 충분한 여백, 타이포 계층으로 정보 밀도를 만든다.

1. 전역 규칙(Absolute Rules)

1.1 텍스트 편집 금지
- 원문/값을 임의로 자르지 않는다.
- 임의 “…” 처리 금지.
- 줄바꿈은 허용한다(내용 보존 목적).

1.2 빈칸 금지
- null/undefined/empty는 PRD의 결측 규칙(미표기/검색 결과 없음/수집 불가/확인되지 않음)으로 치환한다.
- PDF에는 빈 셀/빈 블록이 존재하면 안 된다.

1.3 내부 용어 숨김
- 출력 텍스트 어디에도 GEO/AEO/SEO 등의 내부 용어를 쓰지 않는다.
- 내부 JSON/task_type에는 존재 가능(디버그/로그용).

1.4 레이아웃 우선순위
- 가독성(읽힘) > 페이지 고정(잘림 방지) > 장식(미관)
- “안 잘리는 것”이 “예쁜 것”보다 우선한다.

1.5 페이지 분리 정책(고정)
- P1~P3는 각 1페이지 고정이다.
- 어떤 블록도 다음 페이지로 넘어가면 실패로 간주한다(테스트에서 검출).

2. 페이지 포맷(Page Format)

2.1 사이즈
- A4 Portrait 고정.

2.2 여백(Margins)
- Page padding: 36pt (상/하/좌/우 동일)
- 섹션 간격: 기본 12pt, 좁게 8pt까지 허용
- 섹션 내부 간격: 6pt 기본

2.3 그리드
- 기본 1단 레이아웃(P1, P3)
- 2단 그리드(P2): 좌/우 50:50, 컬럼 간 간격 12pt

2.4 간격 스케일(구현 고정)
- spacing(4, 6, 8, 12, 16, 24)pt만 사용한다.
- 임의 숫자 사용 금지(일관성 유지).

3. 타이포그래피(Typography)

3.1 폰트
- Pretendard 임베딩 필수(Regular, Bold).
- 폰트 미임베딩(Tofu) 발생 시 PDF 생성 실패로 처리(조용히 넘어가지 않음).

3.2 기본 크기
- 본문: 10.5pt
- 보조/라벨: 9pt
- 헤더 타이틀: 14pt Bold
- 섹션 타이틀: 11.5pt Bold
- 표 셀 값: 9.5pt(길면 9pt까지 허용)

3.3 줄간격
- 본문 lineHeight: 1.35
- 표 셀 lineHeight: 1.25

3.4 하이픈/단어 쪼개기 방지(구현 강제)
- react-pdf의 hyphenationCallback을 “항상 원문 그대로 반환”하도록 설정한다.
- 한글에서 단어 중간 분리/하이픈 삽입이 발생하면 실패로 간주한다.

4. 색/상태 토큰(Color Tokens)

목표: “색상코드”를 의미 토큰으로 고정하고, 팔레트는 1개 테마로 통일한다.
또한 대시보드 느낌(선명한 경고색 배경)을 제거한다.

4.1 토큰(필수)
- ink, textPrimary, textSecondary, muted
- border, surface, bg
- accent, accentSoft
- statusMatch, statusPartial, statusMismatch, statusUnknown
- severityCritical, severityHigh, severityMedium, severityLow

4.2 사용 규칙(강제)
- 상태 색은 “왼쪽 3pt 라인”에만 사용한다(배경 채움 금지).
- 본문 텍스트는 textPrimary/textSecondary만 사용한다.
- accent는 섹션 타이틀, 링크 스타일(있다면), 구분선 포인트에만 제한적으로 사용한다.

4.3 팔레트 매핑 고정(Theme: Ink & Plum)
아래 값은 pdfStyles.ts에서 고정한다(임의 변경 금지).

- ink: #0B1220
- textPrimary: #0B1220
- textSecondary: #334155
- muted: #64748B
- border: #E2E8F0
- bg: #FFFFFF
- surface: #F8FAFC

- accent: #5B2B82
- accentSoft: #F3E8FF

- statusMatch: #1F7A5B
- statusPartial: #B26A00
- statusMismatch: #B42318
- statusUnknown: #475569

- severityCritical: #B42318
- severityHigh: #C2410C
- severityMedium: #B26A00
- severityLow: #1D4ED8

5. 컴포넌트 규격(Component Specs)

5.1 PdfPageShell
- props: { pageNumber, totalPages, headerTitle, storeName, reportDate }
- 구성:
  - 상단: headerTitle(좌), storeName/Date(우)
  - 본문: children
  - 하단: 페이지 번호 “3 / 3”
- 헤더 높이: 48pt
- 푸터 높이: 24pt
- 헤더/푸터는 fixed 사용을 허용한다(본문 레이아웃 안정 목적).

5.2 StatusLabel (기존 StatusBadge 대체, 대시보드 느낌 제거)
- 목적: pill 뱃지 느낌 제거. 보고서 라벨처럼 보이게 한다.
- props: { label: "안정|주의|점검 필요", tone: statusMatch|statusPartial|statusMismatch|statusUnknown }
- 형태:
  - 배경 없음
  - 왼쪽 3pt 라인(tone 색) + 텍스트
- 높이: 최소 18pt
- padding: 좌 8pt, 우 8pt, 상하 3pt
- 텍스트: 10pt Bold

5.3 ConsistencyTable (P1)
- 컬럼: 항목 | 네이버 | 카카오 | 구글 | 판정
- 컬럼 너비 규칙(고정):
  - 항목: 72pt
  - 판정: 82pt (기존 72pt에서 10pt 확대: 상태 라인+텍스트 안정)
  - 나머지 3컬럼은 균등 분배(남은 너비/3)
- 셀 패딩: 6pt
- 표 스타일:
  - 헤더 행 배경색 금지
  - 행 구분선(border)만 사용
  - zebra/강조 배경 금지
- 셀 값은 줄바꿈 허용. 트렁케이션 금지.

5.3.1 P1 표 셀 표시 형식 강제(행 높이 폭발 방지)
표시 형식을 강제해 예측 가능한 줄 수로 제한한다(내용 편집 아님, 구성만 고정).

- 주소 셀(display)
  - 1줄: 시/구 + (동 또는 도로명)
  - 2줄: 번지/건물명(가능하면)
  - 3줄: 층/호(존재할 때만)
  - 원문 전체를 1줄로 풀지 않는다.

- 운영시간 셀(display)
  - 가능하면 3줄 구성:
    - 1줄: 평일(월~금)
    - 2줄: 토/일 또는 휴무
    - 3줄: 브레이크타임/라스트오더(있을 때만)
  - 구조화 불가 시 raw 그대로 출력하되, 줄바꿈은 허용한다.

5.3.2 판정 컬럼 표현(강제)
- 판정 컬럼은 “왼쪽 3pt 라인 + 판정 텍스트(일치/부분/불일치/판정 불가)”로만 표현한다.
- 배경 채움 금지.
- 아이콘 사용 금지.

5.4 EvidenceThumb (P1 조건부)
- props: { label, imageSrc }
- 썸네일 크기: 160pt x 90pt (고정)
- 이미지 로드 실패 시:
  - 회색 박스 + “이미지 확인 불가”
- 배치:
  - P1에서만 사용
  - Evidence는 “레이아웃 가드 플래그”에 의해 렌더 여부가 결정된다(7.2 참조).
  - react-pdf에서 렌더 후 높이 측정으로 숨김 판단은 금지한다.

5.5 TwoColumnGrid (P2)
- 좌/우 컬럼 50:50 고정
- 각 컬럼은 2개의 BlockCard를 세로로 배치
- 블록 간 간격 12pt
- 블록은 데이터가 없으면 Fallback 문구로 채운다(빈칸 금지)

5.6 BlockCard (P2 공통)
- props: { title, children }
- 스타일(대시보드 느낌 제거):
  - 배경: surface 사용은 허용하되 “아주 연하게”
  - borderRadius: 8pt (10pt에서 축소)
  - border: 1pt
  - padding: 12pt
- title:
  - 11.5pt Bold
  - title 아래 6pt 간격
  - title 왼쪽에 accent 2pt 라인 허용(섹션 구분용)

5.7 KeywordTable (P2)
- 3행 고정(Top3)
- 컬럼: 키워드 | 빈도(n) | 메모
- 키워드 칼럼 줄바꿈 허용

5.8 PriorityCard (P3) — “카드”처럼 보이되 대시보드 카드 금지
- 카드 3개 고정 스택
- 카드 간 간격 12pt
- 스타일:
  - 배경 채움 금지(bgCard 사용 금지)
  - border 1pt + borderRadius 8pt
  - 왼쪽 4pt 상태 라인(severity 색) 고정
- 구성(순서 고정):
  1) 상단: public_tag(라벨) + title
     - public_tag는 pill 금지. 작은 라벨 텍스트로만(9pt Bold)
  2) observation(1~2줄 권장, 필요 시 3줄까지)
  3) impact_line(1줄)
  4) action_direction(1줄)
  5) 메타 라인: edit_time_estimate + verification_lag_note (각 1줄)
  6) done_definition / verification (각 1줄)
- 내부 줄바꿈 허용. 트렁케이션 금지.
- 과도하게 늘어나면 폰트 티어 규칙 적용(7.1)

6. 페이지별 레이아웃 스펙(Page Layout)

6.1 Page 1 (기본 정보 신뢰 진단)
- 상단: PdfPageShell
- 섹션 순서(고정):
  1) Status Summary (StatusLabel + 1~2줄)
  2) ConsistencyTable (페이지 핵심, 60~70% 우선)
  3) Risk Summary (2~3줄)
  4) Evidence (조건부, 최대 2개)
- Risk Summary는 테이블 아래에 붙는다(테이블과 분리되지 않게).

6.2 Page 2 (AI & 리뷰 진단)
- 상단: PdfPageShell
- 2단 그리드 고정
- 좌상: AI Snapshot
- 좌하: Attribute Check
- 우상: Review Trust Summary
- 우하: Keyword Snapshot
- “비어 보임” 방지 규칙:
  - AI 문장 없음, 리뷰 0개여도 4블록은 모두 출력(Fallback 문구 강제)

6.3 Page 3 (우선순위 Top3)
- 상단: PdfPageShell
- 상단 안내문(선택 1줄): summary_line
- PriorityCard 3개 고정 스택
- 후보 부족 시 NOOP 카드로 채움(레이아웃 깨짐 방지)

7. 오버플로우(넘침) 처리 규칙(중요)

“자르기 금지” 조건에서 PDF 깨짐을 막기 위한 강제 규칙.

7.1 텍스트 핏 규칙(측정 금지, 문자수 기반 고정)
react-pdf의 레이아웃 측정(maxHeight 기반)은 구현 편차가 커서 금지한다.
대신 “문자수 기반 폰트 티어”로 고정한다.

7.1.1 폰트 티어(고정)
- T0: 10.5pt (기본)
- T1: 10.0pt
- T2: 9.5pt
- T3: 9.0pt (하한)

7.1.2 적용 대상(고정)
- P1: 표 셀 값(주소/운영시간/상호/전화) 중 길이가 긴 값
- P2: AI 소개 문장, 리뷰 예시 문장
- P3: observation, verification_lag_note

7.1.3 문자수 기반 티어 규칙(고정)
- P1 표 셀(플랫폼 컬럼)
  - 0~60자: T0
  - 61~90자: T1
  - 91~130자: T2
  - 131자 이상: T3
  - 단, 주소/운영시간은 5.3.1 표시 형식으로 “줄 구성”을 먼저 적용한 뒤 문자수를 계산한다.

- P2 AI 문장(좌상 블록)
  - 0~80자: T0
  - 81~120자: T1
  - 121~160자: T2
  - 161자 이상: T3

- P3 observation(카드 본문)
  - 0~70자: T0
  - 71~110자: T1
  - 111~150자: T2
  - 151자 이상: T3

- verification_lag_note(모든 카드)
  - 항상 T1(10pt) 고정

주의: “…”로 줄이기 금지. 내용 보존이 원칙이다.

7.2 P1 과밀도 가드(핵심 수정: 자동 판단 금지, 플래그 기반)
react-pdf는 “렌더 후 높이 측정”이 안정적이지 않으므로,
P1의 과밀도 판단은 렌더러가 하지 않고 “사전 계산 플래그”로만 한다.

7.2.1 입력 플래그(Backend 또는 Next.js route에서 계산 후 전달)
- ui_flags.p1_hide_evidence: boolean
- ui_flags.p1_risk_summary_variant: "NORMAL"|"SHORT"
- ui_flags.p1_table_font_tier: "T0"|"T1"|"T2"|"T3"

7.2.2 플래그 계산 규칙(고정, 문자수 기반)
- table_density_score를 아래처럼 계산한다.
  - 각 표 셀의 (표시 문자열 길이) 합을 구한다.
  - address/hours는 5.3.1 줄 구성 후 길이로 계산한다.
- 기준:
  - table_density_score <= 900: NORMAL, Evidence 표시 가능, table_font_tier=T0
  - 901~1100: SHORT, Evidence 숨김, table_font_tier=T1
  - 1101~1300: SHORT, Evidence 숨김, table_font_tier=T2
  - 1301 이상: SHORT, Evidence 숨김, table_font_tier=T3
- P1은 페이지 분리 금지이므로, 1301 이상 케이스는 “데이터 정리 부족”으로 기록한다(로그).

7.2.3 렌더 적용(고정)
- ui_flags.p1_hide_evidence=true면 EvidenceThumb는 렌더하지 않는다.
- ui_flags.p1_risk_summary_variant=SHORT면 Risk Summary는 PRD에서 “짧은 템플릿”을 사용한다.
- ui_flags.p1_table_font_tier는 표 셀 값에 강제 적용한다.

7.3 이미지 로드/리사이즈(강제)
- Evidence 이미지는 PDF 렌더 전에 서버에서 크기 최적화된 버전을 사용(WebP 또는 압축 PNG).
- react-pdf에 외부 네트워크 URL을 직접 물리지 않는다.
- Next.js route에서 fetch 후 base64(data URI)로 주입한다(렌더 안정성).
- base64 변환 실패 시 imageSrc는 null 처리하고, EvidenceThumb는 “이미지 확인 불가”로 대체한다.

8. 시각 스타일 가이드(의미 중심)

8.1 카드 스타일
- 둥근 모서리(8pt), 얕은 경계선(1pt), 그림자 금지
- 목적: “보고서” 느낌 유지

8.2 라벨/상태 표현
- 라벨은 텍스트 중심. pill 금지.
- “점검 필요”는 강하게 보이되, 배경 빨강 금지(왼쪽 라인만).
- 상태 컬러는 라인에만. 본문 컬러로 공포감 주지 않는다.

9. QA 체크리스트(디자인/레이아웃)

9.1 공통
- 한글 깨짐(Tofu) 없음
- 모든 페이지에서 빈칸(빈 셀/빈 블록) 없음
- 임의 “…” 삽입 없음
- 줄바꿈이 자연스럽고 카드/표 영역을 침범하지 않음
- 상태 표현이 “라인+텍스트”로만 구현되었는가(배경 채움 없는가)

9.2 P1
- 표 컬럼 너비가 항상 동일하게 유지됨
- 긴 주소/시간이 잘리지 않고 줄바꿈으로 표시됨
- ui_flags에 따라 Evidence가 빠져도 레이아웃이 자연스러움
- ui_flags.p1_table_font_tier가 표 셀에 실제로 반영됨

9.3 P2
- AI 문장이 길어져도 폰트 티어로 대응되고 잘리지 않음
- 리뷰 0개/AI 문장 없음에서도 4블록이 모두 채워져 “빈 페이지” 느낌이 없음

9.4 P3
- 카드 3개가 항상 동일 폭/간격으로 출력됨
- observation/impact/action 순서가 유지됨
- edit_time_estimate / verification_lag_note가 항상 표시됨
- public_tag가 pill 형태가 아닌가(텍스트 라벨인가)

10. 구현 메모(react-pdf 관점)

- hyphenationCallback을 무력화해 단어 쪼개기를 막는다.
- Page는 3장 고정이므로, 레이아웃 안정성이 최우선이다.
- 렌더러가 “넘침”을 판단하려고 하지 않는다. 넘침 방지는 ui_flags로만 제어한다.
