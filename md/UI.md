# UI.md — ReachCheck Web UI Spec (Search → Select → Generate → View PDF)

문서 목적: “검색창 하나로 시작해서 PDF 리포트까지 가는” 최소 UI를 **실수 적고, 불안 적고, 실패 복구 쉬운** 구조로 고정한다.  
범위: 홈(검색/선택/생성) + 리포트 결과 화면(PDF 보기/다운로드) + 생성 진행 상태 UI.

---

## 0. 핵심 원칙

1) 사용자 실수 방지(동명이인/지점/층) > 속도 > 예쁨  
2) 기다리는 시간은 **진행 단계**로 보여준다(스피너 단독 금지)  
3) 실패는 반드시 “다시 시도/원인 힌트/복사 가능한 코드”가 있어야 한다  
4) UI는 로직 판단을 하지 않는다(판정/문장 생성은 FastAPI)  
5) 컴포넌트는 단일 책임(수정하기 쉬운 쪼개기)  
6) 홈은 차분, PDF는 명확(상태색은 과하게 쓰지 않음)

---

## 1. 사용자 플로우(정답 동선)

### 1.1 기본 동선
1) 홈에서 가게 검색
2) 목록에서 1개 선택
3) “리포트 생성” 클릭
4) 진행 단계 확인
5) 생성 완료 → 결과 화면에서 PDF 보기/다운로드

### 1.2 예외 동선(반드시 제공)
- 검색 결과 없음 → “다시 검색” + “링크로 찾기(선택)” 안내
- 동명이인 많음 → 주소 기준으로 재정렬 + “선택한 가게 카드”로 재확인
- 생성 실패 → “다시 시도” + “오류 코드 복사”
- 생성 중 새로고침/이탈 → report_id로 재진입 가능(결과 화면에서 진행 상태 복구)

---

## 2. 페이지 구성(라우팅)

### 2.1 페이지 목록
- `/` : 홈(검색/선택/생성)
- `/report/[id]` : 리포트 상태/결과(PDF 링크)

### 2.2 페이지별 목적
- 홈(`/`): “가게 선택 정확도”와 “생성 시작”이 전부
- 리포트(`/report/[id]`): “진행 상태 확인” + “PDF 확인/다운로드”가 전부

---

## 3. 홈 UI 스펙(`/`)

### 3.1 레이아웃(한 화면 원칙)
- 중앙 정렬 컨테이너(너무 좁지 않게)
- 상단: 서비스 타이틀 + 짧은 설명 1줄
- 중단: 검색 입력 + 결과 리스트
- 하단: 선택된 가게 카드 + 생성 버튼 + 진행 패널(조건부)

### 3.2 검색 입력 영역(SearchBox)
구성:
- 입력창 1개
- 우측 버튼: “검색”
- 보조 문구(선택, 짧게 1줄):
  - “가게명 + 동네까지 쓰면 더 정확해요.”
  - (선택) “지도/플랫폼 링크를 붙여도 찾아드려요.”

동작:
- 엔터 = 검색
- 검색 중에는 버튼 disabled + 로딩 상태 표시
- 입력값이 너무 짧으면(예: 1글자) 검색 버튼 비활성화

### 3.3 결과 리스트(PlaceResultList)
- 최대 8개 노출(스크롤 허용)
- 각 행은 2줄 고정(내용 자르기 금지 원칙이지만, 홈 리스트는 예외로 **줄 수 고정**)
  - 1줄: place_name
  - 2줄: address_short + floor_hint(있으면)
- 오른쪽: “선택” 버튼(행 전체 클릭도 허용)

행에 반드시 포함할 최소 정보(실수 방지용):
- 가게명
- 주소(최소 시/구 + 동/도로명)
- (가능하면) 층/지하 힌트

상태:
- 결과 없음: “검색 결과 없음” 블록(아래 6.1 참고)

### 3.4 선택 확인 카드(SelectedPlaceCard)
선택 직후 리스트 아래에 카드 1개 고정 노출:
- 제목: 선택한 가게
- 내용:
  - 가게명
  - 전체 주소(줄바꿈 허용)
  - 층/지하 정보(있으면 표시, 없으면 “층 정보: 확인되지 않음”)
- 액션:
  - “다른 가게 선택”(리스트 다시 보기)
  - (선택) “다시 검색”(입력창 포커스)

규칙:
- “선택된 가게가 1개가 되기 전”에는 생성 버튼을 비활성화한다.

### 3.5 생성 버튼(GenerateReportButton)
- 라벨: “리포트 생성”
- 클릭 시:
  1) report 생성 요청 → report_id 확보
  2) 즉시 `/report/[id]`로 이동(홈에 진행패널을 길게 붙들지 않음)

홈에 진행 UI를 붙일 수도 있지만, UX 최선은:
- “생성 클릭” 이후는 결과 페이지에서 상태를 보여주는 방식(복구가 쉬움)

---

## 4. 리포트 화면 UI 스펙(`/report/[id]`)

### 4.1 상태 기반 화면 분기
- `queued | running` : 진행 화면
- `done` : 완료 화면(PDF)
- `failed` : 실패 화면(재시도/오류코드)

### 4.2 진행 화면(ProgressView)
필수 구성:
- 단계 스텝바(3단계 고정)
  1) 수집
  2) 분석
  3) PDF 생성
- 상태 문구 1줄(중립)
- 보조 문구 1줄:
  - “오래 걸릴 수 있어요. 창을 닫지 마세요.”
- 취소/중단 버튼은 v1에서는 빼는 걸 권장(복잡도 대비 효용 낮음)
- “홈으로” 링크는 제공

퍼센트 규칙:
- 백엔드가 percent를 주면 표시
- percent가 없으면 “가짜 퍼센트” 금지(스텝만)

### 4.3 완료 화면(DoneView)
필수 구성:
- “PDF 리포트 준비 완료” 타이틀
- 버튼 2개:
  - “PDF 열기”(새 탭)
  - “다운로드”
- 보조 링크:
  - “다른 가게 진단하기”(홈으로)

선택 구성:
- PDF 미리보기(iframe) — 브라우저/모바일 호환 고려해서 옵션 처리

### 4.4 실패 화면(FailedView)
필수 구성:
- 타이틀: “리포트 생성 실패”
- 짧은 설명 1줄(과장 금지)
- 버튼:
  - “다시 시도”
  - “홈으로”
- 디버그/CS용:
  - “오류 코드 복사”(report_id + error_code or error_message hash)

---

## 5. API 연동 계약(UI 관점)

UI는 “찾기/생성/상태조회/재시도”만 한다.

### 5.1 엔드포인트(권장)
1) `POST /api/place/search`
- input: `{ query: string }`
- output:
  ```json
  {
    "items": [
      {
        "id": "string",
        "platform_hints": ["NAVER","KAKAO","GOOGLE"],
        "place_name": "string",
        "address_full": "string",
        "address_short": "string",
        "floor_hint": "string|null",
        "lat": 0.0,
        "lng": 0.0
      }
    ]
  }```

2. `POST /api/report/create`

* input:

  ```json
  { "selected_place": { "id": "string", "place_name": "string", "address_full": "string", "lat": 0.0, "lng": 0.0 } }
  ```
* output:

  ```json
  { "report_id": "uuid" }
  ```

3. `GET /api/report/status?report_id=uuid`

* output:

  ```json
  {
    "status": "queued|running|done|failed",
    "stage": "COLLECT|ANALYZE|PDF",
    "percent": null,
    "pdf_url": "string|null",
    "error_code": "string|null"
  }
  ```

4. (선택) `POST /api/report/retry`

* input: `{ report_id: "uuid" }`
* output: `{ report_id: "uuid" }` (같은 id 재실행 또는 새 id 발급 중 택1)

### 5.2 폴링 정책

* `/report/[id]`에서 `status`를 2초 간격으로 폴링(최대 90초 등 제한)
* `done/failed`가 되면 즉시 폴링 중단
* 브라우저 탭 비활성 시 폴링 간격 늘리기(선택)

---

## 6. 빈 상태/오류 상태 UI 문구(고정 카피)

### 6.1 검색 결과 없음

* 타이틀: “검색 결과 없음”
* 본문: “가게명에 동네를 함께 입력해 보세요.”
* (선택) 보조: “지도 링크를 붙여도 찾아드려요.”
* 액션: “다시 검색”

### 6.2 네트워크 오류(검색/생성 공통)

* 타이틀: “연결이 불안정합니다”
* 본문: “잠시 후 다시 시도해 주세요.”
* 액션: “다시 시도”

### 6.3 생성 실패

* 타이틀: “리포트 생성 실패”
* 본문: “일부 데이터를 가져오지 못했습니다.”
* 액션: “다시 시도”, “홈으로”
* 보조: “오류 코드 복사”

---

## 7. 컴포넌트 설계(단일 책임)

### 7.1 홈 컴포넌트

* `SearchBox`: 입력/검색 트리거만
* `PlaceResultList`: 리스트 렌더만
* `PlaceResultItem`: 행 1개 렌더만
* `SelectedPlaceCard`: 선택 확인 카드 렌더만
* `GenerateReportButton`: 생성 트리거만

### 7.2 리포트 컴포넌트

* `ReportStatusPoller`: 폴링/상태 관리만(화면 렌더 X)
* `ProgressView`: 진행 UI 렌더만
* `DoneView`: 완료 UI 렌더만
* `FailedView`: 실패 UI 렌더만
* `StepBar`: 단계 표시만

---

## 8. 폴더 구조(깊이 5 제한 준수)

```text
/apps/web
  /app
    /page.tsx
    /report
      /[id]
        page.tsx
    /api
      /place
        /search
          route.ts
      /report
        /create
          route.ts
        /status
          route.ts
        /retry
          route.ts

  /components
    /home
      SearchBox.tsx
      PlaceResultList.tsx
      PlaceResultItem.tsx
      SelectedPlaceCard.tsx
      GenerateReportButton.tsx
    /report
      ReportStatusPoller.tsx
      ProgressView.tsx
      DoneView.tsx
      FailedView.tsx
      StepBar.tsx

  /lib
    supabaseClient.ts
    schema.ts
    logger.ts
```

---

## 9. 시각 스타일 가이드(홈 UI 전용, PDF와 분리)

목표: 다른 서비스 UI랑 겹치지 않는 “차분+프로덕트” 톤

* 기본: 밝은 배경 + 얕은 보더 + 둥근 카드
* 강조색: 1개만 사용(버튼/링크/선택 상태)
* 상태색(빨강/주황/초록)은 홈에서는 최소화
  (상태색은 PDF에서 주로 쓰고, 홈은 “선택/진행”만 명확하면 됨)

---

## 10. 접근성/사용성 최소 기준

* 키보드만으로: 검색 → 리스트 이동 → 선택 → 생성 가능해야 함
* 버튼 disabled 상태는 시각적으로 구분
* 로딩 시 버튼 중복 클릭 방지
* 모바일에서도 리스트 선택이 불편하지 않게(행 클릭 영역 충분히)

---

## 11. 완료 기준(Definition of Done)

* 홈에서 가게 1개 선택 후 생성까지 막힘 없이 된다
* `/report/[id]`에서 진행 상태가 안정적으로 갱신된다
* 실패 시 재시도/홈 복귀/오류코드 복사가 된다
* done이면 pdf_url로 열기/다운로드가 된다
* 홈 UI는 단순하지만 “선택 실수”가 줄어드는 구조다