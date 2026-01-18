# DEV_PRD.md — ReachCheck PDF Engine (@react-pdf/renderer)

## 0. 이 문서의 목적
이 문서는 “코드 만드는 AI/개발자”가 읽고 **바로 구현을 시작할 수 있도록** 아래를 고정한다.

- 시스템 역할 분리(Logic vs Presentation)
- 데이터 계약(result_json 스키마)
- Next.js PDF 생성 엔드포인트 설계(route.ts)
- @react-pdf/renderer 컴포넌트 구조(단일 책임, 수정 용이)
- Supabase(DB/Storage/RLS) 연동 규칙
- 예외/품질/테스트 기준

이 문서대로 구현하면 “HTML 인쇄 CSS 지옥” 없이 **예측 가능한 A4 고정 레이아웃 PDF**가 나온다.

---

## 1. 핵심 원칙
### 1.1 역할 분리
- FastAPI(Python): 수집/정규화/분석/점수화/문장 생성(LLM 포함)까지 담당한다. PDF 레이아웃은 하지 않는다.
- Next.js(Node runtime): result_json을 받아 @react-pdf/renderer로 PDF를 만든다. 분석/LLM 호출/크롤링은 하지 않는다.
- Supabase: DB는 단일 source of truth, Storage는 산출물(PDF/증거) 저장.

### 1.2 출력 금칙어
리포트 출력 텍스트(PDF)에는 다음 단어가 절대 등장하면 안 된다.
- GEO, AEO, SEO, 제로클릭, AI 브리핑, 최적화, 마케팅 강의

내부 result_json의 internal 키(task_type 등)는 허용한다. 단, PDF 텍스트로 렌더링 금지.

### 1.3 빈칸 금지
PDF는 “빈 영역”이 생기면 품질이 떨어진다.
- 값이 없으면 반드시 대체 텍스트를 출력한다.
- 섹션 데이터가 부족하면 NOOP(유지 관리) 카드로 채운다.

### 1.4 결정적 렌더링
같은 report_id/result_json이면 PDF 결과가 항상 동일해야 한다.
- 랜덤, 시간 의존, 외부 호출(렌더 중 API 호출) 금지
- 렌더 중 크롤링/LLM 호출 금지

---

## 2. 기술 스택
### 2.1 확정 스택
- PDF Core: @react-pdf/renderer v3.x 이상
- Framework: Next.js 14+ (App Router)
- Language: TypeScript (Strict Mode)
- Backend: Python FastAPI (Data Provider)
- DB/Storage/Auth: Supabase
- Crawling: Selenium (headless Chrome)

### 2.2 권장 라이브러리(편의/안정)
- zod: result_json 검증(Next.js 서버에서 필수)
- pino(or console + 구조화): PDF 생성 로그 구조화
- sharp(선택): 증거 이미지 최적화가 필요할 때(서버 측)
- uuid(선택): ref_key 생성 규칙을 코드로 고정할 때

---

## 3. 전체 아키텍처 및 데이터 흐름
### 3.1 데이터 흐름(정상)
1) FastAPI
- 네이버/카카오/구글 API 수집 + Selenium 크롤링
- 정규화(P1/P2 입력 생성)
- 분석/판정(P1/P2/P3 result 생성)
- reports.result_json 저장
- reports.status = done

2) Next.js Server Route(/api/pdf)
- report_id로 reports.result_json 조회
- zod로 result_json 검증
- 폰트/이미지 로드
- @react-pdf/renderer로 PDF buffer 생성
- Supabase Storage(reports-pdf)에 업로드
- reports.pdf_url 업데이트
- pdf_url 반환

3) Next.js Client
- report 상세 화면에서 pdf_url 다운로드/프리뷰 제공

### 3.2 데이터 흐름(부분 실패)
- 크롤링 실패: evidence 섹션은 “확인 불가”로 degrade, 리포트 생성은 계속 진행
- 특정 플랫폼 API 실패: 해당 플랫폼 값은 “연결 실패”로 표시, 판정은 “확인 불가 포함” 규칙으로 계산
- PDF 생성 실패: reports.pdf_url은 null, error_log 기록, 클라이언트는 “PDF 생성 실패” 표시

### 3.3 LLM 사용 지점(고정)
LLM 호출은 FastAPI에서만 수행하며, Next.js 렌더 단계에서는 절대 호출하지 않는다.

LLM은 아래 2가지 산출물을 만든다.
1) P2 리뷰 요약/키워드 추출
- 입력: reviews_raw(텍스트 배열), 날짜 메타
- 출력: review_summary, keyword_snapshot, pain_keyword_severity, examples

2) P2 AI Snapshot 생성/판정
- 입력: store_name + (가능하면) P1의 진실 데이터(주소/운영정보) + query_type
- 출력: ai_sentence_raw, ai_snapshot_status, ai_diff_category, ai_evidence(quote/keywords/correct_fact)

모델 사용 분리(권장)
- Gemini: 긴 텍스트 기반 추출(리뷰/블로그 덩어리) 우선
- ChatGPT: 규칙 준수 판정/카테고리 분류/증거 포맷(ai_evidence) 우선
(둘 중 하나만 써도 되지만, 역할을 문서로 고정해두면 흔들림이 줄어든다.)

---

## 4. Supabase 설계
### 4.1 Storage 버킷
- reports-pdf: 최종 PDF
- evidence: 캡처/근거 이미지

### 4.2 DB 테이블(최소)
#### reports
- id: uuid (pk)
- status: text (queued | running | done | failed)
- result_json: jsonb (FastAPI가 작성)
- pdf_url: text nullable (Next.js가 작성)
- error_message: text nullable
- created_at, updated_at

#### evidence (선택이지만 권장)
- id: uuid
- report_id: uuid fk
- ref_key: text (예: P1.hours.google_capture_1)
- storage_path: text (evidence 버킷 경로)
- meta: jsonb (platform/url/collected_at/type 등)
- created_at

### 4.3 키/권한 정책
#### 클라이언트(브라우저)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

#### 서버(Next.js / FastAPI)
- SUPABASE_SERVICE_ROLE_KEY (절대 클라이언트 노출 금지)
- OPENAI_API_KEY, GEMINI_API_KEY 등 외부 키(서버 전용)

### 4.4 RLS 권장 정책(선택지)
- 로그인(권장): user_id로 reports 접근 제한
- 비로그인(가능): report_id 기반 “공유 토큰”을 발급해 read만 제한적으로 허용
  - 이 경우 pdf_url은 공개 링크 정책을 반드시 검토(유출 위험)

---

## 5. 환경변수(필수)
### 5.1 Next.js (apps/web/.env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (서버에서만 사용, NEXT_PUBLIC 금지)
- SUPABASE_STORAGE_BUCKET_REPORTS_PDF=reports-pdf
- SUPABASE_STORAGE_BUCKET_EVIDENCE=evidence
- PDF_FONT_DIR=apps/web/assets/fonts (서버에서 접근 가능한 경로)

### 5.2 FastAPI (apps/api/.env)
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- NAVER_SEARCH_CLIENT_ID
- NAVER_SEARCH_CLIENT_SECRET
- NAVER_MAP_CLIENT_ID
- KAKAO_REST_API_KEY
- GOOGLE_MAPS_API_KEY
- LLM_PROVIDER_PRIORITY=GEMINI,OPENAI  (권장: 리뷰 추출은 GEMINI 우선, 판정/정밀은 OPENAI 우선)
- LLM_TIMEOUT_SEC=25
- LLM_MAX_RETRIES=2
- LLM_CACHE_TTL_HOURS=168  (권장: 7일)
- OPENAI_API_KEY
- GEMINI_API_KEY
- SELENIUM_HEADLESS=true
- SELENIUM_CHROME_BINARY=...
- SELENIUM_CHROMEDRIVER=...

---

## 6. 리포트 데이터 계약(result_json)
### 6.1 공통 구조(고정)
- meta: 리포트 메타
- pages: p1, p2, p3 (키 고정)
- evidence: 선택(이미지/근거 참조를 넣어도 되고, 별도 evidence 테이블을 써도 됨)

#### result_json 예시 골격
```json
{
  "meta": {
    "report_id": "uuid",
    "store_name": "string",
    "report_date": "YYYY.MM.DD"
  },
  "pages": {
    "p1": { },
    "p2": { },
    "p3": { }
  },
  "evidence": {
    "by_ref": {
      "P1.hours.google_capture_1": {
        "url": "https://...",
        "type": "screenshot",
        "label": "구글 운영시간 캡처"
      }
    }
  }
}
```

### 6.2 P1 최소 스키마(렌더 기준)

P1은 “기본 정보 비교 테이블 + 상태 요약” 중심이다.

필수 필드:

* status_label: 안정 | 주의 | 점검 필요
* rows: 상호명/주소/운영시간/전화번호 행 배열
* 각 row는 platform 값과 판정(match/partial/mismatch)을 가진다.

주소 규칙(렌더링 전처리):

* 구글 주소 문자열에서 “대한민국” 제거(정규식)
* 괄호/건물명 제거 규칙은 FastAPI에서 우선 처리(권장)
* 층수/호수:

  * 1층이면 층/호 없어도 정상
  * 1층이 아니면 층수는 중요 요소(없으면 부분 불일치 가능)

빈칸 처리:

* null/undefined/빈 문자열이면 “미표기” 또는 “연결 실패” 출력

### 6.3 P2 최소 스키마(렌더 기준)

P2는 “AI Snapshot + 속성 체크 + 리뷰 신뢰 블록 + 키워드 스냅샷”이다.

필수 필드:

* ai_snapshot: { sentence, status_label, diff_line }
* attribute_check: rows[]
* review_summary: { positive, pain_keyword_display, examples[] }
* keyword_snapshot: rows[]

리뷰 중립어 치환:

* 자극적인 단어 치환은 FastAPI에서 pain_keyword_display로 내려준다(권장)
* Next.js는 원칙적으로 “그대로 렌더만” 한다.

추가 고정(권장: P3 연동/근거 추적용)

* ai_snapshot 확장(근거/출처 메타)
  * ai_snapshot.engine: "CHATGPT" | "GEMINI" | "OTHER" | null
  * ai_snapshot.query_type: "AREA" | "STORE_NAME" | "RECOMMEND" | null
  * ai_snapshot.collected_date: "YYYY.MM.DD" | null
  * ai_snapshot.evidence_ref: string | null
    - 설명: AI 원문/캡처/로그 등 “근거 리소스”를 가리키는 ref_key
    - 매핑: result_json.evidence.by_ref[ai_snapshot.evidence_ref]에서 조회 가능해야 함
    - 없으면: null 허용(단, 이 경우 P3에서 confidence를 낮출 수 있음)

* review_summary 확장(우선순위/톤 조절용)
  * review_summary.pain_keyword_severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"
    - 설명: P3 우선순위 룰/카드 문장 강도 조절에 사용
    - 규칙: pain_keyword_display가 null이면 severity는 반드시 "UNKNOWN"

* 빈칸 금지 보강(렌더 안정성)
  * ai_snapshot.sentence가 null이면 status_label은 반드시 "확인되지 않음"이어야 함
  * examples가 비어 있으면 PRD의 리뷰 0개(Fallback) 문구를 사용해 2개 슬롯을 채움(빈 블록 금지)

### 6.4 P3 최소 스키마(렌더 기준)

P3는 “Top3 카드 3개 + summary + notes”다.

필수 필드:

* cards: length 3을 목표(부족하면 NOOP으로 채움)
* card 필드:

  * public_tag
  * title
  * observation
  * impact_line
  * action_direction
  * edit_time_estimate
  * verification_lag_note
  * done_definition
  * verification
  * confidence_label
* summary_line
* notes (0~2줄 권장)

NOOP 처리:

* cards가 3개 미만이면 Next.js가 강제로 채우지 말고
* FastAPI에서 이미 3개를 만들어 내려주는 것을 기본으로 한다.
* 예외적으로 검증 단계에서 부족하면 Next.js에서 NOOP으로 채운다(안전장치).

---

## 7. Next.js PDF 엔드포인트 설계(route.ts)

### 7.1 구현 요구사항

* runtime: nodejs 강제(Edge 금지)
* report_id 입력 검증(zod)
* result_json 검증(zod)
* PDF 생성 실패 시 예외 로그 + DB 업데이트(선택)
* 업로드 실패 시 재시도 정책(최대 3회)

### 7.2 엔드포인트

POST /app/api/pdf/route.ts

* input: { report_id: string }
* output: { pdf_url: string }

### 7.3 처리 절차(정확히 이 순서)

1. report_id 검증
2. Supabase Admin(Service Role)로 reports 조회
3. result_json 존재 확인
4. result_json zod 검증(불합격이면 fallback 생성 또는 실패 처리)
4.5 evidence.by_ref를 기준으로 카드/페이지에서 사용하는 evidence_ref가 실제 존재하는지 검사(없으면 placeholder 경로로 강제)
5. PDF 컴포넌트에 데이터 주입(PdfDocument)
6. renderToBuffer로 PDF buffer 생성
7. Storage 업로드(reports-pdf/{report_id}.pdf)
8. reports.pdf_url 업데이트
9. pdf_url 반환

---

## 8. @react-pdf/renderer 컴포넌트 설계

### 8.1 설계 원칙(단일 책임)

* PdfDocument.tsx: 폰트 등록 + 페이지 조립만
* PdfPageShell.tsx: 공통 여백/헤더/푸터/페이지 번호만
* P1Consistency.tsx: P1 레이아웃 조립만(문장 생성 금지)
* P2AiReview.tsx: P2 레이아웃 조립만
* P3Priority.tsx: P3 카드 3개 배치만
* P3PriorityCard.tsx: 카드 1개 렌더만
* pdfStyles.ts: 스타일 상수만

문장/판정 로직은 FastAPI에서 끝내고, Next.js는 “그림만 그린다”.

### 8.2 페이지 고정 레이아웃 규칙

* A4 세로 1페이지 단위로 구성
* 카드/표가 페이지 경계를 넘지 않게 설계
* break 제어:

  * 카드: 한 덩어리로 유지(쪼개져 다음 페이지로 넘어가면 보기 나쁨)
  * 표 행: 행 단위 break 제어(가능하면 행은 분리 금지)
* 긴 텍스트:

  * 임의 축약 기호 사용 금지
  * 대신 스타일로 줄바꿈을 자연스럽게 허용
  * 레이아웃을 깨는 길이는 FastAPI에서 문장 생성 규칙으로 제한(권장)

### 8.3 폰트(한글) 규칙

* 반드시 Font.register로 폰트 임베딩(Regular/Bold)
* 폰트 파일은 레포 내부(assets/fonts)에 포함하고, 서버에서 파일 접근 가능해야 한다.
* 출력 검증:

  * 한글 tofu(네모) 현상 없어야 함
  * 기호(·, -, /) 누락 없어야 함

### 8.4 이미지(evidence) 렌더링 규칙

* 이미지 URL이 유효하지 않으면 Placeholder 박스 + “이미지 확인 불가”
* 이미지 비율 유지(찐그러짐 금지)
* PDF 용량이 과도해지면 캡처 이미지는 미리 최적화(WebP/압축 PNG)

---

## 9. 폴더 구조(깊이 5단계 제한 준수)

깊이 계산: 루트부터 폴더를 세고 파일은 제외한다.

```text
/apps/web
  /app
    /api
      /pdf
        route.ts
    /report
      /[id]
        page.tsx

  /components
    /pdf
      PdfDocument.tsx
      PdfPageShell.tsx
      P1Consistency.tsx
      P2AiReview.tsx
      P3Priority.tsx
      P3PriorityCard.tsx
      P1BasicInfoTable.tsx
      P2AiSnapshot.tsx
      P2ReviewBlock.tsx
      pdfStyles.ts

  /lib
    supabaseClient.ts
    supabaseServer.ts
    schema.ts
    logger.ts

/apps/api
  /app
    main.py
    /routers
    /services
    /workers
    /core

/packages/shared
  /types
  /schemas

/docs
  DEV_PRD.md
  PRD.md
  API_SPEC.md
  DB_SCHEMA.md
```

주의:

* components/pdf 아래에 blocks 같은 하위 폴더를 만들면 깊이가 늘어나기 쉬우니,
  가능하면 pdf 폴더 내에서 파일로 평평하게 유지한다.

---

## 10. 데이터 검증(zod) 규칙

### 10.1 목표

* result_json이 스펙에서 벗어나도 PDF 생성 로직이 뻗지 않게 한다.
* 검증 실패 시 동작을 명확히 한다.

### 10.2 정책

* 1차: 필수 키(meta/pages/p1/p2/p3) 존재 확인
* 2차: P3 cards 길이 및 필드 누락 확인
* 3차: 문자열 null 처리(빈칸 금지)

검증 실패 시 선택지:

* 실패 처리: error_message 기록, PDF 생성 중단
* fallback 처리(권장): 최소 템플릿 PDF 생성(“데이터 검증 실패” + report_id + 생성 시각)

추가 검증(LLM 산출물 최소 조건)
- p2.ai_snapshot.sentence가 null이면 status_label은 반드시 "확인되지 않음"이어야 한다.
- p2.review_summary.pain_keyword_display가 null이면 pain_keyword_severity는 "UNKNOWN"이어야 한다.
- p3.cards[*].verification_lag_note는 항상 존재해야 한다(빈칸 금지 규칙).

---

## 11. 스타일 규칙(일관성)

### 11.1 색상 정책

* 상태 색상 매핑은 pdfStyles.ts에서만 정의한다.
* 컴포넌트에서는 색상값을 직접 쓰지 않는다.

### 11.2 타이포 규칙

* 기본 폰트 크기 범위: 10pt~12pt
* 제목/섹션/본문 크기 체계를 고정한다.
* 줄간격(lineHeight)은 페이지 밀도를 좌우하므로 고정값을 둔다.

### 11.3 레이아웃 규칙

* grid 느낌은 flex row/column으로 구현한다.
* 2단 그리드는 5:5 고정(좌/우 동일 폭) 또는 6:4(정보량에 따라 선택) 중 하나로 고정한다.

---

## 12. 예외 처리(필수)

### 12.1 네트워크/스토리지 오류

* Storage 업로드 실패 시 최대 3회 재시도
* 모두 실패하면 reports.error_message 기록 + pdf_url null 유지

### 12.2 데이터 부족

* 리뷰 0개: “진단 가능한 리뷰 데이터가 부족합니다” 출력
* AI 문장 없음: “AI 요약 노출: 확인되지 않음” 출력
* evidence 이미지 없음: Placeholder + “이미지 확인 불가” 출력

### 12.3 렌더 실패

* 폰트 로드 실패, 이미지 로드 실패, PDF 생성 실패:

  * 로그에 report_id 포함
  * 가능한 경우 fallback PDF 생성

### 12.4 LLM 실패/제한(필수)
- 타임아웃/쿼터/일시 오류로 LLM 호출이 실패할 수 있다.
- 실패 시 FastAPI는 아래 Fallback을 result_json에 강제 반영한다.

Fallback 규칙
- P2 AI: sentence=null, status_label="확인되지 않음", diff_line="기타 - 불명확"
- P2 리뷰: review_count_30d가 0이면 PRD의 0개 Fallback 문구로 채움
- P3: AI/리뷰 후보 생성에 필요한 필드가 부족하면 confidence_label="낮음" 또는 NOOP로 대체


---

## 13. 성능/비용 가이드

### 13.1 PDF 생성 비용 통제

* PDF는 서버에서 생성하므로 동시 요청 제한이 필요할 수 있다.
* 기본 정책:

  * report_id별 PDF 생성은 중복 실행 금지(이미 pdf_url 있으면 재생성 옵션이 아닌 이상 스킵)

### 13.2 이미지 최적화

* evidence 이미지는 원본 그대로 넣으면 PDF가 커지고 느려진다.
* 권장:

  * Selenium 캡처 저장 시 리사이즈/압축(서버 작업)
  * 또는 업로드 전처리(Worker)

---

## 14. QA 체크리스트(자동/수동)

### 14.1 P1

* 구글 주소 표시에서 “대한민국”이 제거되었는가
* null 값이 “미표기/연결 실패”로 출력되는가
* 1층이면 층/호가 없어도 불일치로 오인하지 않는가

### 14.2 P2

* AI 문장이 길어도 영역을 침범하지 않고 줄바꿈 되는가
* 리뷰 키워드가 중립어로 노출되는가
* 2단 레이아웃이 항상 고정 분할되는가

### 14.3 P3

* 카드가 정확히 3개 출력되는가
* 우선순위 1,2,3 순서가 유지되는가
* edit_time_estimate(수정 시간)과 verification_lag_note(반영 대기)가 모두 출력되는가
* NOOP 카드가 필요한 경우 레이아웃이 깨지지 않는가

### 14.4 공통

* 한글 폰트 tofu 현상이 없는가
* 특수기호(·, -, /)가 누락되지 않는가
* 페이지가 A4로 고정되고 잘림이 없는가

---

## 15. 구현 착수 순서(추천)

1. schema.ts(zod)로 result_json 계약 고정
2. PdfDocument/PdfPageShell로 공통 틀 확정
3. P3PriorityCard 먼저 구현(카드 1개가 가장 단위가 작고 빠르게 검증 가능)
4. route.ts에서 renderToBuffer → Storage 업로드 → pdf_url 업데이트까지 end-to-end 연결
5. P1/P2 페이지 구현
6. evidence 이미지/placeholder 처리 완성
7. fallback PDF + 로그/에러 정책 마무리

---

## 16. 완료 기준(Definition of Done)

* report_id만 있으면 서버에서 PDF 생성이 가능하다.
* result_json이 일부 비어도 PDF는 깨지지 않는다(빈칸 금지).
* PDF 레이아웃은 A4 고정으로 일관되게 출력된다.
* 폴더 구조는 깊이 5 제한을 지킨다.
* PDF 출력 텍스트에 금칙어가 등장하지 않는다.
