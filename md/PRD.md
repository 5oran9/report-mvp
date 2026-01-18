# PRD — Page 1

## 기본 정보 신뢰 진단 (Platform Consistency)

## 1. 페이지 목적

이 페이지는 “가게가 플랫폼마다 같은 가게로 인식되는지”를 **빠르게 판단**하게 한다.
설명/홍보/해결책/문의 유도는 포함하지 않는다.

---

## 2. Page 1 레이아웃 (고정)

### 2.1 구성 블록

1. Header
2. Status Summary
3. Consistency Table (페이지의 60~70%)
4. Risk Summary (표 아래 2~3줄)
5. Evidence (조건부, 최대 2개, 작은 영역)

### 2.2 시각 규칙

* 페이지의 주인공은 표다. 문장은 짧고 중립적으로.
* 값이 길면 자르지 않고 줄바꿈으로 처리(내용 편집 금지).
* 빈칸 금지: 값이 없으면 아래 결측 규칙에 따라 “미표기 / 검색 결과 없음 / 수집 불가” 중 하나로 채움.

---

## 3. 입력 데이터 스키마 (수집 결과)

플랫폼별로 아래 raw 값을 가진다.

### 3.1 플랫폼 키

* platform: `NAVER | KAKAO | GOOGLE`

### 3.2 Raw 필드

* place_name_raw: string
* address_raw: string
* hours_raw: string 또는 구조화 데이터
* phone_raw: string

### 3.3 리포트 메타

* store_name_display: string (리포트 상단에 표시할 가게명)
* report_date: `YYYY.MM.DD`
* collected_date: `YYYY.MM.DD` (표시 여부는 선택, 내부값으로는 유지 권장)

### 3.4 플랫폼별 매칭/출처 메타 (추가, 고정)

플랫폼에서 “어떤 결과를 선택해 가져왔는지”를 추적/증빙하기 위한 필드.

* source_url: string (선택된 가게 상세 페이지 URL 또는 공식 공유 링크)
* matched_entity_id: string (가능하면 place_id / cid / google place id 등)
* match_confidence: `HIGH | MEDIUM | LOW | FAIL`
* match_note: string (짧게, 예: “동일 상호 다수 결과 중 주소 일치 항목 선택”)
* collect_status: `SUCCESS | NOT_FOUND | BLOCKED | ERROR`

  * SUCCESS: 매칭 및 수집 성공
  * NOT_FOUND: 검색 결과 없음(가게를 못 찾음)
  * BLOCKED: 일시 차단/접근 제한 등으로 수집 실패
  * ERROR: 기타 오류

Page 1에서는 **link 노출을 강제하지 않지만**, source_url은 반드시 저장한다(증거/재확인/플랫폼 이동에 사용).

---

## 4. 공통 전처리 규칙 (Normalization)

모든 비교는 “표시용 값(display)”과 “판정용 값(compare)”을 분리한다.

### 4.1 공통 문자열 정리

* 앞뒤 공백 제거
* 연속 공백 1개로 축약
* 괄호 안 설명 제거(주소에서 특히 중요)
* 비교 시 대소문자 통일(영문)

### 4.2 결측/수집 실패 표기 (보완, 고정)

“없음”을 하나로 뭉개지 않는다. **미표기 vs 검색 결과 없음 vs 수집 불가**를 구분한다.

* 플랫폼 매칭이 성공(SUCCESS)했지만 해당 필드 값이 비어 있음

  * display = “미표기”, compare = null
* 플랫폼에서 가게 자체를 못 찾음(collect_status = NOT_FOUND)

  * display = “검색 결과 없음”, compare = null
* 기술/정책 이슈로 수집 실패(collect_status = BLOCKED 또는 ERROR)

  * display = “수집 불가”, compare = null

---

## 5. 표기(출력) 스펙

## 5.1 Header (고정)

표시 필드:

* 제목: “가게 노출·신뢰 진단 리포트”
* 가게명: store_name_display
* 기준일자: report_date

형식 예:
가게 노출·신뢰 진단 리포트
가게명: ○○○
기준일자: 2026.01.16

---

## 5.2 Status Summary (고정)

표시 필드:

* 현재 상태: 안정 | 주의 | 점검 필요
* 상태 문장: 자동 생성 1~2줄

상태는 “일관성”과 “판정 가능 여부”만 말한다. 감정/가치판단 금지.

### 5.2.1 상태 문장 템플릿 예시 (보완, 고정)

* 안정(예)

  * “주요 플랫폼 기준 기본 정보는 일관되게 유지되고 있습니다.”
* 주의(예)

  * “일부 항목에서 플랫폼 간 표기 차이가 확인됩니다.”
* 점검 필요(예: 불일치 점수 기준 충족)

  * “주요 플랫폼 간 정보가 다르게 노출되고 있습니다.”
  * “방문 과정에서 혼란이 발생할 수 있습니다.”
* 점검 필요(예: 수집/매칭 실패 포함)

  * “일부 플랫폼에서 정보를 가져오지 못해 일관성 판정이 제한됩니다.”

또한 필요 시 1줄 안에서만 아래처럼 매칭 상태를 중립적으로 덧붙일 수 있다(선택):

* “매칭 상태: 네이버(HIGH) / 카카오(HIGH) / 구글(MEDIUM)”
* “매칭 상태: 구글(검색 결과 없음)”

---

## 5.3 Consistency Table (고정)

테이블 컬럼:

* 항목 | 네이버 | 카카오 | 구글 | 판정

행(최종 고정):

* 상호명
* 주소
* 운영시간
* 전화번호

표기 규칙:

* 각 셀 값 없으면 4.2 규칙에 따라 “미표기 / 검색 결과 없음 / 수집 불가”
* **구글 주소 display에서는 “대한민국”을 항상 제거한다(고정).**
* 구글 주소 compare에서도 “대한민국” 제거는 **필수**(아래 주소 전처리 참조).

---

## 6. 판정 로직 상세

### 6.1 판정 결과 타입(고정, 보완)

* 상호명: 일치 / 부분 불일치 / 판정 불가
* 주소: 일치 / 부분 불일치 / 불일치 / 판정 불가
* 운영시간: 일치 / 불일치 / 판정 불가
* 전화번호: 일치 / 불일치 / 판정 불가

“판정 불가”는 아래 중 하나면 발생:

* 해당 플랫폼이 NOT_FOUND/BLOCKED/ERROR로 해당 항목 compare가 null인 경우
* 또는 비교에 필요한 최소 단위 파싱이 실패한 경우(주소/운영시간 구조화 불가 등)

아이콘 없이 텍스트로만 표기 권장.

---

### 6.2 상호명(Name)

#### 6.2.1 전처리(compare)

* 공백 제거
* 특수문자 제거(.,·,-,/,(),[] 등)
* 영문 소문자화

#### 6.2.2 비교 기준

* 전처리 후 완전 동일하면: 일치
* 핵심 토큰이 다르면: 부분 불일치
* 2개 이상 플랫폼이 판정 불가이면: 판정 불가(보수적으로)

#### 6.2.3 핵심 토큰 규칙(간단 고정)

* 공백 기준 토큰화
* 길이 2 이상 토큰만 후보
* “본점/지점/1호점/2호점”은 보조 토큰(있어도 불일치로 과하게 치지 않음)

실무 해석:

* “팬팬”, “팬팬 당산점”은 부분 불일치가 나올 수 있으나, 이건 치명 불일치가 아니라 “표기 차이 가능”로 보는 게 맞아서 ‘부분’으로만 둔다.

---

### 6.3 주소(Address) — 핵심: “동/도로명” + “층수 조건부”

요구 반영 규칙: **1층이면 층수/호수는 필요 없는 것으로 처리**.

#### 6.3.1 주소 전처리(compare) (보완)

* GOOGLE: “대한민국” 문자열 제거(필수)

  * display에서도 동일하게 제거(5.3 고정)
* 괄호 안 내용 제거(필수)
* 건물명(상호처럼 붙는 이름) 제거 가능하면 제거(권장, 실패해도 비교에 치명적이지 않게 설계)
* 공백/쉼표 등 구분기호 통일
* **도로명 vs 지번 혼용 대응(권장, 명시)**

  * 가능한 경우 외부 주소 정규화(예: 도로명주소/지번 변환 API 등)를 통해

    * canonical_road_addr, canonical_jibun_addr 또는 canonical_addr(단일) 생성
  * 비교는 canonical 기준으로 수행(가능하면 도로명 기준 1개로 통일)
  * 외부 정규화 실패 시에는 “기본 주소 일치” 판정이 과도하게 깨지지 않도록 Step A를 보수적으로 운용한다(아래 Step A 참고)

#### 6.3.2 주소 파싱 요소(비교에 쓰는 최소 단위)

1. 시/구
2. 동 또는 도로명
3. 층수(조건부)
4. 호수(조건부)

3)4)는 항상 비교가 아니라 조건부 비교다.

#### 6.3.3 층수/호수 추출 규칙

### 층수(floor) 추출 대상 예시

* “2층”, “3F”, “지하1층”, “B1”, “지하”, “1층”
  정규화 결과 예:
* 1층 = 1
* 2층 = 2
* B1/지하1층 = -1

### 호수(unit/suite) 추출 대상 예시

* “101호”, “201호”, “A동 101호” 중 “101호”만 unit로 잡음
  정규화 결과 예:
* 101호 = “101”
* 값 없으면 null

#### 6.3.4 주소 판정 로직(최종)

### Step A: “기본 주소 일치” 판정

* 시/구가 일치 AND
* 동 OR 도로명 중 하나가 일치
  이면 “기본 주소 일치”로 본다.

단, **도로명/지번 혼용으로 인해 동/도로명이 직접 비교가 어려운 경우**:

* 외부 정규화 결과(canonical)가 있으면 canonical의 동/도로명 요소로 Step A 수행
* canonical이 없으면,

  * 시/구는 필수로 맞고,
  * 숫자 토큰(번지/도로명 번호)이 유의미하게 겹치는 경우(예: “222”, “16-3” 같은 핵심 번호군)에는 Step A를 “기본 주소 일치”로 볼 수 있게 보완(권장)
  * 그 외에는 보수적으로 기본 주소 불일치 처리

기본 주소가 틀리면 바로 불일치다(층/호 볼 필요 없음).

### Step B: 층수/호수 비교를 할지 결정(조건부)

“기본 주소 일치”인 경우에만 아래 조건을 적용한다.

#### 층수/호수 비교를 하지 않는 경우

아래 중 하나면 층/호는 비교에서 제외한다.

* 모든 플랫폼에서 floor가 null 이거나 1 이다
* 또는 어떤 플랫폼이 floor를 안 주지만, 나머지가 모두 1 이다

즉, **1층(또는 1층으로 볼 수 있는 상태)에서는 층/호 불일치로 판정하지 않는다.**

#### 층수 비교를 하는 경우

아래 중 하나면 층수 비교를 “필수”로 한다.

* 어떤 플랫폼이라도 floor가 2 이상이다
* 어떤 플랫폼이라도 floor가 0 이하(지하 포함)이다

#### 호수(unit) 비교를 하는 경우

* floor 비교를 하는 상태에서,
* 최소 한 플랫폼이라도 unit이 존재할 때만,
  unit 불일치를 “부분 불일치 요인”으로 쓴다.

### Step C: 최종 주소 판정

* 기본 주소 불일치 → 불일치
* 기본 주소 일치 AND (층/호 비교 제외 상태) → 일치

  * 이때 누군가 “1층/101호”를 적었고 다른 곳은 비어 있어도, 1층이면 무시한다.
* 기본 주소 일치 AND (층 비교 필수 상태)

  * floor가 모두 일치 → 일치(단, unit 비교 조건이 켜져있고 unit이 다르면 부분 불일치)
  * floor가 다르거나 일부 미표기/수집불가 → 부분 불일치

    * 예: 네이버 2층 / 카카오 미표기 / 구글 2층 → 부분 불일치
    * 예: 네이버 3층 / 구글 2층 → 부분 불일치
* 기본 주소 일치 AND (층은 맞는데 unit만 다름) → 부분 불일치(단, unit 비교 조건이 켜진 경우에만)
* 주소 관련 compare가 2개 이상 플랫폼에서 “수집 불가/검색 결과 없음”이면 → 판정 불가

### 6.3.5 주소 표기(display) 규칙

표 셀에는 아래 순서로 줄바꿈 표기 권장:

* 1줄: 시/구 + (동 또는 도로명)
* 2줄: 나머지 상세(번지/건물)
* 3줄: 층/호(존재할 때만 표시)

단, “층/호가 비교 제외 상태(1층)”여도 display는 보여줄 수 있다.
다만 판정에는 반영하지 않는다.

---

## 6.4 운영시간(Hours)

### 6.4.1 표기(display)

가능하면 요일별로 정리해 보여준다. 정리 불가 시 raw 그대로.

권장 display 형식(가능할 때):

* 월~금 11:00-22:00
* 토 11:00-23:00
* 일 휴무
* 브레이크타임 15:00-17:00 (있을 때만)

### 6.4.2 판정(compare) (보완)

운영시간은 “조금이라도 다르면 불일치”가 원칙이다. 이유는 방문 실패로 직결.

#### 6.4.2.1 24시간 영업 표기 정규화(추가, 고정)

아래 표현은 모두 “24시간”으로 동일 취급한다.

* “24시간”, “24시간 영업”
* “00:00-24:00”
* “00:00-00:00”(익일 종료 의미로 쓰이는 경우 포함)
* 기타 플랫폼 고정 문구(예: “Open 24 hours”)

정규화 결과(권장 구조):

* is_24h = true
* open = 00:00
* close = 24:00(또는 00:00 + next_day_offset=1)

#### 6.4.2.2 익일 종료(오버나이트) 처리(추가, 고정)

예: “18:00 - 02:00”

* close 시간이 open보다 이르면 **익일 종료**로 해석한다.
* 정규화(권장 구조):

  * open = 18:00
  * close = 02:00
  * next_day_offset = 1

비교 시에는 (open, close, next_day_offset)을 함께 비교한다.

#### 6.4.2.3 불일치 조건(기존 + 유지)

불일치 조건(하나라도 해당 시):

* 요일 정보 누락(한 플랫폼에만 요일이 있고 다른 곳은 없음)
* 오픈/마감 시간이 다름(익일 종료 포함해 정규화 후 비교)
* 휴무 표기가 다름
* 브레이크타임이 한쪽만 존재(시간까지는 안 맞춰도, “있음/없음” 불일치는 잡음)

일치 조건:

* 요일별 오픈/마감이 동일(정규화 후)
* 휴무 동일
* 브레이크타임 유무 동일(시간까지 비교는 v1에서는 선택)

수집 불가/검색 결과 없음이 포함되면: 판정 불가

---

## 6.5 전화번호(Phone)

### 6.5.1 전처리(compare)

* 숫자만 남김
* 하이픈/공백 제거
* 국가번호(+82) 포함 시 가능한 경우 국내 표기로 정규화(가능하면)

### 6.5.2 판정

* 숫자 완전 일치: 일치
* 하나라도 다름: 불일치
* 한쪽 미표기: 불일치
* 수집 불가/검색 결과 없음 포함: 판정 불가

표기(display)는 보기 좋게 하이픈 넣어도 됨(판정과 분리).

---

## 7. 상태 산정(Scoring) — “대충” 금지, 규칙 고정

### 7.1 항목 가중치(고정)

* 주소: 2
* 운영시간: 2
* 전화번호: 2
* 상호명: 1

### 7.2 불일치 점수 부여(고정)

* 일치: 0
* 부분 불일치: 1 (상호명/주소에서만 발생)
* 불일치: 해당 항목 가중치만큼

### 7.3 총점 → 상태(고정)

* 0~1: 안정
* 2~3: 주의
* 4 이상: 점검 필요

### 7.4 수집/매칭 실패 오버라이드(추가, 고정)

아래 중 하나라도 해당하면 **상태는 무조건 “점검 필요”**로 둔다.
(일관성 자체를 판정할 수 없거나, 판정 신뢰도가 급락하는 상황이기 때문)

* 어떤 플랫폼이라도 collect_status가 `NOT_FOUND | BLOCKED | ERROR`
* 또는 match_confidence가 FAIL

이 경우 Score는 내부적으로 계산하더라도, 사용자 노출 상태는 “점검 필요”를 우선한다.

---

## 8. Risk Summary(자동 문장) — 생성 규칙

### 8.1 목적

표의 결과를 “중립적인 관측”으로 2~3줄 요약.
해결책, 지시, 문의 유도 금지.

### 8.2 문장 생성 규칙(고정)

* 불일치 항목을 **최대 2개만** 괄호로 나열(전부 나열 금지)
* 가장 치명 항목 우선순위: 주소 > 운영시간 > 전화번호 > 상호명

### 8.3 템플릿 (기존 + 수집 실패 케이스 보완)

#### A) 수집/매칭 실패가 있을 때(추가, 고정)

* 1줄: “일부 플랫폼에서 정보를 가져오지 못했습니다.”
* 2줄: “해당 플랫폼은 일관성 판정에서 제외되거나 판정이 제한됩니다.”
* 3줄(선택): “수집 상태: (구글 수집 불가, 카카오 검색 결과 없음)” 처럼 **최대 2개**만

#### B) 불일치/부분불일치가 존재할 때(기존 유지)

* 1줄: “플랫폼별 기본 정보가 일관되지 않습니다.”
* 2줄: “방문 과정에서 혼란이 발생할 수 있습니다.”
* 3줄(선택): “확인 필요 항목: (주소, 운영시간)” 처럼 최대 2개

#### C) 일관될 때(기존 유지)

* “주요 플랫폼 기준 기본 정보는 일관되게 유지되고 있습니다.”

---

## 9. Evidence(조건부 캡처)

### 9.1 포함 조건(고정)

아래 중 하나면 포함:

* 운영시간 불일치
* 전화번호 불일치
* 제3자 전달이 필요한 경우(직원/대행사/플랫폼 고객센터)

주소 불일치에 캡처를 붙일지는 선택이지만, v1에서는 운영/전화 중심이 효율적.

### 9.2 캡처 규칙(고정, 보완)

* 최대 2개
* 문제 영역만 크롭
* 캡처 아래 라벨: “운영시간(구글)”, “전화번호(네이버)”처럼 출처만
* 캡처는 설득용이 아니라 전달용
* **캡처 기준은 모바일 뷰(모바일 검색/지도 화면)로 고정한다.**

  * 이유: 실제 사용자/사장님 확인 흐름이 모바일 중심이기 때문(설명 문구는 넣지 않고, 제작 규칙으로만 고정)

---

## 10. QA 체크리스트

출력 전에 아래를 검사한다.

1. 구글 주소에서 “대한민국”이 display/compare 모두에서 제거되었는가
2. 주소 판정에서 1층인 경우 층/호 차이를 불일치로 올리지 않았는가
3. 운영시간은 요일 누락/휴무 상이/브레이크타임 유무 차이를 잡았는가
4. 운영시간에서 24시간 표기/익일 종료를 정규화한 뒤 비교했는가
5. 전화번호는 숫자 비교로 판정했는가
6. 표의 빈칸이 “미표기/검색 결과 없음/수집 불가”로 채워졌는가
7. Risk Summary가 항목을 2개 넘게 나열하지 않았는가
8. 매칭/수집 실패가 있으면 상태가 “점검 필요”로 오버라이드 되었는가

---

## 11. Page 1 성공 기준(정성)

사장님이 30초 내에 아래 중 하나를 말하면 성공:

* “플랫폼마다 다르네”
* “여기부터 맞춰야겠네”
* “운영시간/전화는 통일해야겠다”

---

## 12. 추가 제언: 서비스 연계성 (선택, 범위 외 메모)

Page 1은 해결책을 포함하지 않는 것이 목적이므로 **Page 1 본문에는 넣지 않는다.**
다만 제품 설계 관점에서 아래 요소는 “후속 액션”으로 검토 가능:

* 각 플랫폼 관리자/수정 페이지 바로가기 버튼 유무(후속 페이지/플로우에서 제공)
* source_url을 “출처 확인” 링크로 사용하는 방식(후속 페이지/설정 화면에서 제공)

(이 섹션은 Page 1 출력 스펙에 포함하지 않고, 제품 레벨 메모로만 유지)


# PRD — Page 2

**문서 규칙:** 이 문서에서 `#` 헤딩은 맨 위 1개만 사용. 나머지는 **번호/굵은글씨**로만 구분한다.

---

**0. 페이지 목적(고정)**

> 가게가 **어떻게 소개되고**, 고객이 **어디서 걸리는지**를 **관측 결과로만** 보여준다.

* 포함: 관측/비교/표준화된 요약
* 금지: 홍보, 훈계, 해결책, 수정 방법, 문의 유도, 과장, “~하세요/필요” 문장
* 편집 금지: 원문 문장 자르기, 임의 요약, “…” 임의 추가(원문에 “…”가 있으면 그건 허용)

---

**1. Page 2 레이아웃(2단 그리드 고정)**

* **왼쪽 상:** AI 인식 블록(AI Snapshot)
* **왼쪽 하:** AI 속성 체크(Attribute Check)
* **오른쪽 상:** 리뷰 신뢰 블록(Review Trust Summary)
* **오른쪽 하:** 리뷰 키워드 스냅샷(Keyword Snapshot)

레이아웃은 데이터가 없어도 유지한다(블록 비우지 않음, 아래 Fallback 규칙 적용).

---

**2. 공통 출력/표기 규칙(고정)**

**2.1 빈칸 금지(고정)**

* 데이터가 없으면, 아래 중 하나를 반드시 출력한다(상황별로 정확히 선택).

  * `미표기` : 해당 데이터 자체가 없음(플랫폼/소스는 찾았는데 필드가 비어 있음)
  * `확보 불가` : 수집 실패/차단/오류로 가져오지 못함
  * `확인되지 않음` : AI 문장 자체가 없거나, 해당 가게를 개별 언급으로 확인 못 함
  * `검색 결과 없음` : 리뷰/데이터 소스에서 대상 자체를 못 찾음(리뷰는 “리뷰 0개”로 별도 표기)

**2.2 문장 톤(고정)**

* “관측/확인/제한/불명확” 같은 중립어만 사용
* 위험/경고/문제/심각 같은 자극어 사용 금지(단, “부정확”은 판정값으로 허용)

---

**3. 입력 데이터(내부 참조용, 고정)**
(출력에는 그대로 노출하지 않아도 되지만, 판단 일관성을 위해 내부 스키마를 고정한다.)

**3.1 Ground Truth(진실 데이터) — Page 1 연동(핵심 고정)**

* Page 2의 모든 “정확/일부 부정확/부정확” 판정은 **반드시 진실 데이터와의 대조로만** 수행한다.
* 진실 데이터는 **Page 1에서 검증된 실무 데이터**를 의미한다.

  * 상호명(정규화된 표기)
  * 위치/주소 핵심(시/구 + 동/도로명, Page 1 규칙에 따라 1층 층/호 조건 처리 포함)
  * 운영정보(운영시간/전화번호 등 Page 1에서 검증된 항목)
* Page 1에서 어떤 항목이 `판정 불가` 또는 수집 실패로 비어 있으면:

  * 해당 항목은 Page 2에서 “진실 기준”으로 쓰지 않는다.
  * 그 항목과 관련된 AI 판정은 **불명확/확인 불가 방향으로 보수적으로 처리**한다(아래 AI 판정 규칙에 반영).

**3.2 AI Snapshot 원문 데이터(내부)**

* ai_sentence_raw: string(원문 1개) 또는 null
* engine: `ChatGPT | Gemini | 기타`
* query_type: `상권 | 가게명 | 추천`
* collected_date: `YYYY.MM.DD`

**3.3 리뷰 데이터(내부)**

* reviews: 최근순 텍스트+날짜 목록(최대 30개 기준)
* review_count_recent: 최근 30개 확보 개수
* keyword_counts: 키워드별 “포함된 리뷰 개수” 기반 집계

---

**4. AI 인식 블록(AI Snapshot)**

**4.1 포함 규칙(고정)**

* **AI 문장 확보 가능** → 정상 출력
* **AI 문장 확보 불가(null 또는 유효 문장 없음)** → Fallback 출력(4.2)

**4.2 AI 문장 확보 불가(Fallback, 고정 문구)**
블록을 비우지 말고 아래를 그대로 출력한다(줄/문구 고정).

* `AI 소개 문장: 확인되지 않음`
* `주요 AI 엔진에서 해당 가게에 대한 개별 학습 데이터를 찾을 수 없습니다`

그리고 아래 두 줄도 **빈칸 없이** 고정한다.

* `판정: 확인되지 않음`
* `차이: 기타 - 불명확`

출처 메타는 수집 시도 값이 있으면 표시하고, 없으면 아래처럼 처리:

* `출처: 확보 불가 / 확보 불가 / 확보 불가`

**4.3 출력 필드(고정)**

1. AI 소개 문장(원문 그대로 1개)
2. 출처 메타: Engine / Query Type / Collected Date
3. 판정: `정확 | 일부 부정확 | 부정확` (단, 확보 불가 시 `확인되지 않음`)
4. 차이 요약(1줄): `오인 대상 - 오인 유형`

**4.4 출력 포맷(고정)**

```
AI 소개 문장:
“(원문 그대로 1개)”

출처: (Engine) / (Query Type) / (YYYY.MM.DD)

판정: (정확 | 일부 부정확 | 부정확 | 확인되지 않음)
차이: (오인 대상) - (오인 유형)
```

---

**5. 차이 요약(오인 대상/오인 유형) 규칙(고정)**

**5.1 작성 원칙(고정)**

* “왜/어떻게” 금지
* “무엇이 틀렸는지”만 표준화
* 템플릿 고정: `오인 대상(카테고리) - 오인 유형`

**5.2 오인 대상(카테고리) 선택지(고정)**

* 업종
* 대표 서비스/메뉴
* 위치(역/동네)
* 가격/가격대
* 운영정보(운영시간/전화 등)
* 기타(명확히 1단어로만)

**5.3 오인 유형(고정) + 구체 정의/매핑(고정)**
안티그래비티가 흔들리지 않게 **정의 자체를 고정**한다.

* **오인**: 실제(진실 데이터)와 다른 정보를 **사실처럼 단정**

  * 예: 파스타 집인데 “스테이크 전문점”
* **누락**: 진실 데이터 기준 **핵심인데 언급이 없음**

  * 예: 대표 서비스가 명확한데 메뉴 언급이 전혀 없음
* **과장**: 실제보다 **강도가 높게** 표현(포지션/가격대/품질 과대)

  * 예: 가성비 식당을 “럭셔리 파인 다이닝”
* **불명확**: 문장이 모호해서 진실 데이터와 **1:1 대조가 불가**

  * 예: 위치를 “근처” 수준으로만 언급

**5.4 차이 요약 예시(고정 예시)**

* `대표 서비스/메뉴 - 오인`
* `가격/가격대 - 누락`
* `위치(역/동네) - 불명확`

---

**6. AI 판정 기준(내부, 고정 + 보강)**

**6.1 판정값(고정)**

* `정확 | 일부 부정확 | 부정확`
* 단, AI 문장 자체가 없으면: `확인되지 않음`(4.2 규칙)

**6.2 판정 기준(기본, 유지)**

* **정확:** 업종/대표 서비스/위치 중 **2개 이상**이 진실 데이터와 부합
* **일부 부정확:** 핵심 1개 이상 부합하지만 나머지에서 오인/누락/과장 발생
* **부정확:** 업종 오인 또는 대표 서비스가 다른 업종 수준으로 소개됨

**6.3 내부 판정 가이드(추가, 고정 절차)**
AI가 “자기 말이 맞다”로 판정을 뽑지 못하도록 **절차를 고정**한다.

1. **Page 1 진실 데이터 키워드와 AI 문장의 키워드를 1:1 매칭**한다.
2. **위치(역이름/동네)가 틀리면 즉시 `부정확`**으로 간주한다. (방문 실패 요인)
3. **업종은 맞으나 주력 메뉴/대표 서비스가 다르면 `일부 부정확`**으로 간주한다.
4. 운영정보(운영시간/전화 등)가 진실 데이터와 불일치하면 최소 `일부 부정확`으로 간주한다.
5. Page 1 진실 데이터 자체가 부족(해당 항목 `미표기/확보 불가/판정 불가`)이면:

   * 그 항목으로 “부정확”을 단정하지 않는다.
   * 차이 요약은 `기타 - 불명확` 또는 해당 카테고리의 `- 불명확`로 처리한다.

---

**7. AI 속성 체크 블록(Attribute Check)**

**7.1 목적(고정)**

* AI가 가게를 소개할 때 쓰는 속성들을 **체크리스트로 관측**만 한다.
* 문장 길이 늘리지 않고 페이지 밀도 확보.

**7.2 출력 형태(테이블 고정)**

| 속성          | AI 언급 | 불명확/오인 가능 |
| ----------- | ----- | --------- |
| 대표 서비스/메뉴   | 있음/없음 | 낮음/중간/높음  |
| 가격/가격대      | 있음/없음 | 낮음/중간/높음  |
| 예약/대기/웨이팅   | 있음/없음 | 낮음/중간/높음  |
| 주차          | 있음/없음 | 낮음/중간/높음  |
| 위치 힌트(역/동네) | 있음/없음 | 낮음/중간/높음  |

**7.3 판정 규칙(내부, 고정)**

* `AI 언급 = 없음` → 불명확/오인 가능 기본값 **중간**
* AI가 구체적으로 언급했는데 진실 데이터와 다르면 → **높음**
* AI가 구체적으로 언급했고 진실 데이터와 부합하면 → **낮음**
* 진실 데이터가 없는 속성(예: Page 1에 없는 항목)이면 → **중간**으로 유지(단정 금지)

---

**8. 리뷰 신뢰 블록(Review Trust Summary)**

**8.1 출력 필드(고정)**

* 긍정 포인트 1개(짧게)
* 반복 불만 키워드 1개(짧게)
* 리뷰 예시 2개(문장 + 월 단위 날짜)

**8.2 출력 포맷(고정)**

```
긍정: (1개)
반복 키워드: (1개)

리뷰 예시
- “(리뷰 문장)” (YYYY.MM)
- “(리뷰 문장)” (YYYY.MM)
```

**8.3 리뷰 문장 선택 규칙(고정)**

* 욕설/비하/노골적 인신공격 포함 문장: 제외
* 사실형/행동형 우선(“~했다/~였다/~받았다” 형태)
* 예시는 **2개 고정**(늘리지 않음)
* 날짜는 **월 단위(YYYY.MM) 고정**(일자 금지)

**8.4 리뷰 0개(Fallback, 고정)**
리뷰가 0개면 블록을 비우지 말고 아래로 고정 출력:

* `긍정: 확인 불가`
* `반복 키워드: 확인 불가`
* 리뷰 예시 영역 1줄 고정:

  * `최근 등록된 리뷰가 없어 신뢰도 진단이 어렵습니다.`

---

**9. 리뷰 키워드 스냅샷(Keyword Snapshot)**

**9.1 목적(고정)**

* 숫자 대신 “키워드 밀도”로 페이지를 채우되 제작 일관성 유지

**9.2 출력 형태(테이블 고정)**

| 키워드  | 빈도(n) | 메모    |
| ---- | ----: | ----- |
| 키워드1 |     n | 반복 노출 |
| 키워드2 |     n | 간헐    |
| 키워드3 |     n | 간헐    |

**9.3 산정 규칙(내부, 고정)**

* 모수: 최근 리뷰 **30개**

  * 30개 미만이면 확보 가능한 전체
* 빈도 n: 해당 키워드가 포함된 **리뷰 개수**

  * 같은 리뷰에서 여러 번 나와도 **1회로만 카운트**

**9.4 중립어 치환(Neutralization) — 사전 고정(핵심 보강)**
자극 단어를 “그때그때” 바꾸지 않게 **사전을 고정**한다.

중립어 치환 사전(고정):

| 원문(자극적) | 치환어(중립/현상 중심) |
| ------- | ------------- |
| 최악      | 불만            |
| 망함      | 서비스 이슈        |
| 사기      | 신뢰 이슈         |
| 더러움     | 위생/청결 이슈      |
| 불결      | 위생/청결 이슈      |
| 싸가지 없음  | 응대 방식 차이      |
| 불친절     | 응대 방식 차이      |
| 비싸기만 함  | 가격 대비 만족도 낮음  |

운영 규칙(고정):

* 사전에 있으면 **무조건 치환**
* 사전에 없는데 공격적/감정적 표현이면, 아래 “고정 치환군” 중 하나로 수렴:

  * `불만 / 서비스 이슈 / 신뢰 이슈 / 응대 방식 차이 / 위생/청결 이슈 / 가격 대비 만족도 낮음`

**9.5 리뷰 0개일 때 Keyword Snapshot 처리(고정)**
리뷰가 0개면 테이블 3행을 아래로 고정:

* `키워드: 확인 불가 / 빈도: 0 / 메모: 리뷰 없음` (3행 동일)

---

**10. P2 한 줄 결론(마무리)**

**10.1 규칙(고정)**

* 홍보/훈계 없이 관측 요약만
* AI 판정 + 리뷰 반복 키워드를 한 문장으로 묶기
* 1문장 고정(두 문장 금지)

**10.2 기본 템플릿(고정)**

> AI 소개에서 **(정확도/오인)** 이 관측되며, 리뷰에서는 **‘(키워드)’** 가 반복됩니다.

예시:

> AI 소개에서 일부 오인이 관측되며, 리뷰에서는 ‘대기시간’이 반복됩니다.

**10.3 Fallback 결론(고정)**

* AI 문장 확인되지 않음 + 리뷰 0개:

  * `AI 소개는 확인되지 않았고, 리뷰 데이터가 없어 반복 키워드 관측이 제한됩니다.`
* AI 문장 있음 + 리뷰 0개:

  * `AI 소개에서 (정확/일부 부정확/부정확)이 관측되며, 리뷰 데이터가 없어 반복 키워드 관측이 제한됩니다.`
* AI 문장 확인되지 않음 + 리뷰 있음:

  * `AI 소개는 확인되지 않았으며, 리뷰에서는 ‘(키워드)’가 반복됩니다.`

---

**11. P2에서 금지(중요, 고정)**

* “요즘 AI 중요” 강의 금지
* “사장님이 노력” 훈계 금지
* 해결책/수정 방법/액션 가이드 금지
* 연락/문의 유도 금지
* 임의 편집(문장 자르기/… 처리) 금지

  * 단, 원문에 포함된 “…”는 그대로 유지 가능

---

**12. P2 성공 기준(관측, 고정)**
사장님이 아래 중 하나를 말하면 성공:

* “AI가 이렇게 말하는지 몰랐네”
* “리뷰는 이 키워드가 계속 나오긴 해”
* “이 속성이 없어서 애매했구나”

---

**13. 최종 체크리스트(제작자/QA용, 고정)**

* 비교 데이터셋: AI가 “진실”로 믿어야 할 데이터가 **Page 1 진실 데이터**임을 명시했고, 그걸로만 판정했는가?
* 치환 규칙: 리뷰 자극 단어를 **고정 사전**으로 치환했는가(임의 치환 금지)?
* 제로 상태: **AI 문장 없음 / 리뷰 0개**일 때도 레이아웃이 유지되고, 모든 블록이 Fallback 문구로 채워졌는가(빈칸 금지)?
* AI 판정 가이드: 위치 오류 시 즉시 `부정확`, 업종 OK + 메뉴 불일치 시 `일부 부정확` 규칙을 적용했는가?
* 결론 1문장: P2 한 줄 결론이 1문장으로 고정되었는가?


좋아. 네가 준 4가지 피드백을 **전부 반영**해서 P3를 **“코드 만드는 AI가 바로 구현 가능한 수준”**으로 더 촘촘하게 고쳐줄게.
(핵심: **사장님 언어의 위기감**, **수정 시간 vs 반영 대기**, **AI 오인 증거 박기**, **리뷰 통증이 치명급이면 우선순위가 올라가게**)

아래가 **PRD — Page 3 (최종 실행본 v4)**.

---

# PRD — Page 3

## 실행 우선순위 Top 3

## 0) 한 줄 목적

Page 1~2 관측 결과를 “사장님이 오늘 바로 손댈 3가지”로 **결정**시키는 페이지.

## 0.1) 비목적

* 장문 설명/강의(검색, AI, 마케팅) 금지
* UI 클릭 경로 안내 금지
* 문의/연락 유도 금지
* 내부 용어(SEO/GEO/AEO) 리포트에 노출 금지

---

## 1) 사장님 언어 출력 원칙 (농도 조절 스펙)

P3의 Observation/Impact는 “현상”이 아니라 “돈/손님 결과”로 쓰되, 과장/공포 조장 없이 **가능성 문장**으로 고정한다.

### 1.1 문장 톤 규칙

* “다릅니다”만 금지 (현상만 말하면 안 읽힘)
* “그래서 손님이 어떻게 되는데?”가 문장 안에 있어야 함
* 모든 결과 문장은 **가능성**으로 표현:

  * 허용: “헤맬 수 있습니다 / 발길을 돌릴 수 있습니다 / 망설일 수 있습니다 / 매달 발생할 수 있습니다”
  * 금지: “무조건 잃습니다 / 반드시 손해 / 확정” 같은 단정

### 1.2 필드별 역할

* `observation`: “무엇이 + 그래서 손님이 어떻게 될 수 있는지” (원인+결과)
* `impact_line`: “매출/전환 손실이 생기는 경로”를 한 번 더 직관적으로

(즉, observation에서 이미 결과를 말하되, impact_line에서 더 쉬운 말로 한 번 더 박는다.)

---

## 2) 입력 데이터 계약 (Backend → P3)

P3는 파싱/크롤링/정규화하지 않는다.
P3는 **P1/P2 판정 결과 + 증거 데이터 최소치**만 받는다.

### 2.1 입력 JSON 스키마 v4

```json
{
  "report_id": "string",
  "store_name_display": "string",
  "report_date": "YYYY.MM.DD",

  "p1": {
    "name_status": "MATCH|PARTIAL",
    "address_status": "MATCH|PARTIAL|MISMATCH",
    "hours_status": "MATCH|MISMATCH",
    "phone_status": "MATCH|MISMATCH",

    "diff_notes": {
      "name": "string|null",
      "address": "string|null",
      "hours": "string|null",
      "phone": "string|null"
    },

    "evidence_refs": {
      "address": ["string"],
      "hours": ["string"],
      "phone": ["string"]
    }
  },

  "p2": {
    "ai_summary_presence": "PRESENT|ABSENT|UNKNOWN",
    "ai_snapshot_status": "ACCURATE|PARTIAL|INACCURATE|UNKNOWN",
    "ai_diff_category": "INDUSTRY|CORE_MENU|LOCATION_HINT|PRICE|OPERATING_INFO|OTHER|null",

    "ai_evidence": {
      "quote": "string|null",
      "keywords": ["string"],
      "correct_fact": "string|null",
      "engine": "CHATGPT|GEMINI|OTHER|null",
      "query_type": "AREA|STORE_NAME|RECOMMEND|null",
      "collected_date": "YYYY.MM.DD|null",
      "evidence_ref": "string|null"
    },

    "qa_coverage": {
      "items": [
        { "key": "PARKING", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "RESERVATION", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "WAITING", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "SIGNATURE", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "PRICE_RANGE", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "HOURS_HOLIDAY", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "GROUP_SEATING", "status": "CLEAR|PARTIAL|EMPTY" },
        { "key": "POLICY", "status": "CLEAR|PARTIAL|EMPTY" }
      ]
    },

    "reviews": {
      "review_count_30d": 0,
      "media_ratio": 0.0,
      "positive_point": "string|null",
      "pain_keyword": "string|null",
      "pain_keyword_severity": "CRITICAL|HIGH|MEDIUM|LOW|UNKNOWN",
      "top_keywords": [
        { "keyword": "string", "n": 0 }
      ]
    },

    "naver_seo": {
      "menu_naming_quality": "GOOD|OK|WEAK|UNKNOWN",
      "keyword_coverage": "SUFFICIENT|PARTIAL|INSUFFICIENT|UNKNOWN",
      "category_alignment": "MATCH|UNCLEAR|MISMATCH|UNKNOWN"
    }
  },

  "constraints": {
    "hide_internal_terms": true
  }
}
```

### 2.2 AI 증거(ai_evidence) 최소 요구

AI 오인/누락을 “사장님이 믿게” 만들려면, 아래 중 1개는 필수다.

* `keywords[0]` (핵심 오인 키워드 1개) 또는
* `quote` (짧은 원문 1개)

둘 다 없으면 P3에서 AEO_AI 관련 카드는 생성하되 `confidence`를 낮추고, observation에 “근거 확보 필요” 문구가 들어간다(아래 규칙).

---

## 3) 과제(Task) 타입 정의 (내부키 vs 사장님 라벨)

리포트에는 내부 용어 노출 금지. 내부키만 유지.

### 3.1 허용 task_type(고정)

* `GEO_ADDRESS_CONSISTENCY`
* `GEO_HOURS_CONSISTENCY`
* `GEO_PHONE_CONSISTENCY`
* `GEO_NAME_CONSISTENCY`
* `AEO_AI_SUMMARY_ACCURACY`
* `AEO_QA_COVERAGE`
* `AEO_REVIEW_DATA_QUALITY`
* `SEO_NAVER_FIELD_ALIGNMENT`
* `NOOP_MAINTENANCE` (후보 부족 시만 사용)

### 3.2 사장님용 public_tag 매핑(고정)

* 방문 실패 방지: 주소/운영시간/전화
* 표기 정리: 상호
* AI 추천/요약 대응: AI/Q&A/리뷰
* 검색 노출 단서: 네이버 필드
* 유지 관리: NOOP

---

## 4) 우선순위 선정 규칙 (강제 룰 + 예외 룰 포함)

### 4.1 강제 룰 (Rule Set)

Rule 1: 방문 실패 직결은 우선

* `address_status=MISMATCH` 또는 `hours_status=MISMATCH`가 하나라도 있으면

  * **Priority 1은 무조건 GEO_ADDRESS 또는 GEO_HOURS 중 하나**

Rule 2: 전화만 불일치일 때는 “신뢰 위기”가 Priority 1 가능

* `address_status != MISMATCH` AND `hours_status != MISMATCH` AND `phone_status=MISMATCH` 인 상태에서
* `pain_keyword_severity=CRITICAL` 인 경우

  * **Priority 1을 AEO_REVIEW_DATA_QUALITY로 선택할 수 있음**
    (전화 불일치는 중요하지만, “위생/안전/신뢰”가 같이 터지면 그게 더 급할 수 있음)

Rule 3: AI 이슈는 top2에 최소 1개 포함(조건부)

* GEO가 안정(또는 부분 불일치 수준)이고
* `ai_snapshot_status=PARTIAL|INACCURATE` 또는 `ai_summary_presence=PRESENT`이면

  * Priority 1 또는 2에 `AEO_AI_SUMMARY_ACCURACY` 또는 `AEO_QA_COVERAGE` 최소 1개 포함

Rule 4: 네이버 필드(SEO)는 기본적으로 Priority 3

* 후보가 2개 미만일 때만 Priority 2로 상승 가능

---

## 5) 점수화(Scoring) 로직 v4

### 5.1 Score 공식(고정)

* Impact: 0~5
* Effort: 0~3
* Confidence: 0~2
* `Score = (Impact * 2) + Confidence - Effort`

### 5.2 Impact 산정(고정 맵)

#### GEO

* 주소 MISMATCH: 5
* 주소 PARTIAL: 4
* 운영시간 MISMATCH: 5
* 전화번호 MISMATCH: 4
* 상호명 PARTIAL: 2

#### AI (AEO_AI_SUMMARY_ACCURACY)

* ai_snapshot_status INACCURATE: 4
* ai_snapshot_status PARTIAL: 3
* ai_diff_category가 INDUSTRY 또는 CORE_MENU면 +1 (최대 5)

#### Q&A (AEO_QA_COVERAGE)

* EMPTY 개수 >= 3: 3
* EMPTY 개수 >= 5: 4

#### 리뷰 (AEO_REVIEW_DATA_QUALITY)

* pain_keyword_severity=CRITICAL: 5
* pain_keyword_severity=HIGH: 4
* review_count_30d 0~2: 3
* media_ratio <= 0.2: 2
  (여기서 최종 Impact는 가장 큰 값을 채택)

#### 네이버 필드 (SEO_NAVER_FIELD_ALIGNMENT)

* WEAK/INSUFFICIENT/MISMATCH: 3
* OK/PARTIAL/UNCLEAR: 2

### 5.3 Effort 산정(고정 맵)

* GEO_PHONE: 1
* GEO_NAME: 1
* GEO_HOURS: 2
* GEO_ADDRESS: 2
* AI: 2
* Q&A: 2
* REVIEW:

  * review_count_30d=0이면 3
  * 그 외 2
* SEO_NAVER: 2

### 5.4 Confidence 산정(증거 강화 반영)

* GEO: 기본 2

  * 단, diff_notes=null AND evidence_refs도 비어있으면 1

* AI:

  * ai_snapshot_status=UNKNOWN → 0
  * ai_evidence.keywords 1개 이상 또는 quote 존재 → 2
  * 둘 다 없고 status만 PARTIAL/INACCURATE → 1
  * evidence_ref까지 있으면 2 유지(변경 없음, 단 내부 refs에 추가)

* Q&A: items 8개 모두 존재하면 2, 아니면 1

* REVIEW:

  * pain_keyword_severity가 UNKNOWN이고 pain_keyword도 null이면 1
  * pain_keyword 존재하면 2

* SEO:

  * 3개 필드 중 UNKNOWN이 하나라도 있으면 1
  * 모두 채워져 있으면 2

---

## 6) 타이브레이커(동점 처리) v4

Score가 같으면 아래 순서로 결정한다.

### 6.1 1차: 손실 유형 우선

1. 신뢰 위기(위생/안전/신뢰 CRITICAL 리뷰)
2. 방문 실패(주소/운영시간)
3. 전환 차단(전화번호)
4. AI 오인(업종/대표메뉴)
5. Q&A 공백
6. 리뷰 기타(MEDIUM/HIGH)
7. 상호 표기
8. 네이버 필드

### 6.2 2차: Effort 낮은 것 우선

### 6.3 3차: Confidence 높은 것 우선

### 6.4 4차: 플랫폼 범위가 큰 것 우선

* ALL > NAVER > KAKAO/GOOGLE

---

## 7) 시간 표현(Estimated Time) 현실화 + 반영 대기(Verification Lag)

사장님이 오해하지 않게, 시간은 두 개로 나눈다.

### 7.1 필드 정의(출력 필드 확장)

* `edit_time_estimate`: 사장님이 “입력/수정”에 쓰는 시간

  * 값 제한: 10분 | 15분 | 30분 | 60분+
* `verification_lag_note`: 반영까지 걸릴 수 있는 대기(사실 문장)

  * 예: “수정은 10분, 반영은 즉시부터 수일이 걸릴 수 있습니다.”

주의: “네이버는 1~3일”처럼 특정 수치 단정 금지.
대신 “즉시~수일”로 고정.

### 7.2 JSON 내부 필드(선택)

* `verification_lag_band`: "INSTANT_TO_DAYS" 고정 문자열로만 저장
  (수치 저장 금지, 오해 방지)

---

## 8) 카드 출력 스펙 (필드 고정, 문장 강도 강화)

### 8.1 카드 공통 필드(빈칸 금지)

1. priority_rank: 1|2|3
2. public_tag: 방문 실패 방지 | AI 추천/요약 대응 | 검색 노출 단서 | 표기 정리 | 유지 관리
3. title: 12~22자
4. source: P1|P2
5. observation: 1~2줄(원인+결과)
6. impact_line: 1줄(돈/손님 관점)
7. action_direction: 1줄(동사 강한 “무엇을”)
8. target_platforms: ALL|NAVER|KAKAO|GOOGLE
9. edit_time_estimate: 10분|15분|30분|60분+
10. verification_lag_note: 1줄
11. owner: 사장님|직원|대행|미정
12. done_definition: 1줄
13. verification: 1줄
14. confidence_label: 높음|중간|낮음
15. internal: {task_type, score, impact, effort, confidence, refs[]}

---

## 9) 문장 템플릿 v4 (위기감/직관성 강화 + AEO 증거 박기)

### 9.1 title 템플릿(고정)

* GEO_ADDRESS: `길찾기 정보 통일`
* GEO_HOURS: `헛걸음 방지(영업정보)`
* GEO_PHONE: `연락 끊김 방지(전화번호)`
* GEO_NAME: `상호 표기 정리`
* AI: `AI가 소개하는 설명 정리`
* Q&A: `자주 묻는 정보 입력`
* REVIEW: `리뷰 신뢰 위기 정리`
* SEO_NAVER: `검색될 단서 문장 정리`
* NOOP: `현재 큰 불일치 없음`

### 9.2 observation 템플릿(원인+결과)

현상만 금지, 결과를 반드시 포함.

* 주소:

  * `네이버와 구글의 주소가 달라 손님이 길을 헤맬 수 있습니다. (차이: {diff})`

* 운영시간:

  * `플랫폼마다 영업시간이 달라 문 닫은 줄 알고 발길을 돌릴 수 있습니다. (차이: {diff})`

* 전화번호:

  * `연락처가 달라 예약·문의가 끊길 수 있습니다. (차이: {diff})`

* 상호:

  * `상호 표기가 달라 같은 가게로 인식이 흔들릴 수 있습니다. (차이: {diff})`

* AI(증거 강제):

  * 키워드가 있을 때:

    * `AI가 매장을 '{kw}'로 소개하고 있습니다. 실제 정보와 다를 수 있습니다.`
  * 키워드 + correct_fact가 있을 때:

    * `AI가 매장을 '{kw}'로 소개합니다. (실제: {correct_fact})`
  * quote가 있을 때(짧은 원문 1개):

    * `AI 문장에 '{kw_or_quote}'가 포함되어 있어 오인이 의심됩니다.`
  * 둘 다 없을 때(근거 약함):

    * `AI 소개에서 오인 가능성이 관측되지만, 문장 근거 확보가 필요합니다.`

* Q&A:

  * `손님이 자주 묻는 정보 중 비어있는 항목이 {empty_count}개입니다. AI 요약에 참고할 정보가 부족해질 수 있습니다.`

* 리뷰:

  * CRITICAL:

    * `리뷰에서 '{pain_keyword}'가 반복됩니다. 신규 손님이 바로 이탈할 수 있습니다.`
  * 기타:

    * `리뷰에서 '{pain_keyword}'가 반복됩니다. 방문 전 망설임 요인이 될 수 있습니다.`
  * pain_keyword가 없으면:

    * `리뷰 신호가 약하거나 최근성이 부족해 신뢰 판단이 어려울 수 있습니다.`

* 네이버 필드:

  * `검색될 만한 단서가 약해 기회가 새는 구간이 있을 수 있습니다.`

### 9.3 impact_line 템플릿(돈/손님 경로)

* 주소: `길찾기 실패는 방문 이탈로 바로 이어질 수 있습니다.`
* 운영시간: `헛걸음은 재방문 의지를 크게 떨어뜨릴 수 있습니다.`
* 전화번호: `연락 실패는 예약·문의 전환을 막을 수 있습니다.`
* 상호: `가게 인식이 흔들리면 추천/노출에서 불리해질 수 있습니다.`
* AI: `AI 요약이 틀리면 다른 가게로 선택이 넘어갈 수 있습니다.`
* Q&A: `정보 공백이 많으면 AI가 매력을 요약하기 어렵습니다.`
* 리뷰 CRITICAL: `신뢰 이슈는 한 번만 보여도 구매 결정을 멈추게 할 수 있습니다.`
* 리뷰 기타: `반복 키워드는 신규 손님에게 강한 망설임을 만들 수 있습니다.`
* 네이버 필드: `검색 단서가 약하면 노출 기회가 줄어들 수 있습니다.`

### 9.4 action_direction 템플릿(동사 강하게, 무엇을)

네가 제안한 TO-BE 반영.

* GEO_ADDRESS: `가장 정확한 주소로 3개 플랫폼을 통일합니다.`

* GEO_HOURS: `실제 영업 기준으로 3개 플랫폼의 시간/휴무를 통일합니다.`

* GEO_PHONE: `대표 전화번호 1개로 3개 플랫폼을 통일합니다.`

* GEO_NAME: `대표 상호 표기 1개로 정리해 일관되게 보이게 합니다.`

* AI: `AI가 참고할 핵심정보(업종/대표메뉴/위치)를 한 문장 기준으로 정리합니다.`

* Q&A: `AI가 답변에 참고할 '매장 정보 8종'을 입력합니다.`

* REVIEW: `'{pain_keyword}'에 대한 대응 기준 문장을 1줄로 정리합니다.`

* SEO_NAVER: `손님이 자주 검색하는 단어를 메뉴/설명에 자연스럽게 넣습니다.`

### 9.5 done_definition 템플릿

* GEO: `3개 플랫폼에서 동일한 값으로 확인됩니다.`
* AI: `동일 질문에서 핵심정보 오인이 줄어든 것으로 확인됩니다.`
* Q&A: `8개 항목 중 EMPTY가 0개입니다.`
* REVIEW: `반복 키워드에 대한 운영 기준 문장이 준비되어 있습니다.`
* SEO_NAVER: `메뉴/설명에 핵심 검색 단서가 포함됩니다.`
* NOOP: `다음 점검에서도 동일 상태로 확인됩니다.`

### 9.6 verification 템플릿

UI 가이드 금지, 결과 확인만.

* GEO: `각 플랫폼에서 동일하게 표시되는지 다시 확인합니다.`
* AI: `동일 질문으로 재조회하여 오인 키워드가 줄었는지 확인합니다.`
* Q&A: `8항목 체크리스트가 모두 채워졌는지 확인합니다.`
* REVIEW: `최근 리뷰에서 동일 키워드 빈도 흐름을 확인합니다.`
* SEO_NAVER: `메뉴/설명에 핵심 단어가 포함됐는지 확인합니다.`
* NOOP: `30일 후 동일 항목을 다시 확인합니다.`

### 9.7 verification_lag_note 템플릿(고정)

* 공통: `수정은 {edit_time}, 반영은 즉시부터 수일이 걸릴 수 있습니다.`

---

## 10) 후보 생성 규칙(상태 기반)

입력 상태에 따라 후보 생성.

### 10.1 GEO 후보

* address_status != MATCH → GEO_ADDRESS
* hours_status == MISMATCH → GEO_HOURS
* phone_status == MISMATCH → GEO_PHONE
* name_status == PARTIAL → GEO_NAME

### 10.2 AI 후보

* ai_snapshot_status in (PARTIAL, INACCURATE) → AI
* ai_summary_presence == PRESENT → AI (단, status UNKNOWN이면 confidence 낮게)

### 10.3 Q&A 후보

* qa EMPTY >= 3 → Q&A

### 10.4 REVIEW 후보

* pain_keyword_severity != UNKNOWN 또는 pain_keyword 존재 → REVIEW
* review_count_30d <= 2 → REVIEW
* media_ratio <= 0.2 → REVIEW

### 10.5 SEO 후보

* naver_seo 중 WEAK/INSUFFICIENT/MISMATCH 또는 OK/PARTIAL/UNCLEAR → SEO_NAVER

---

## 11) 최종 선택 알고리즘(의사코드 v4)

```text
candidates = build_candidates(input)

for candidate in candidates:
  candidate.impact = compute_impact_v4(candidate, input)
  candidate.effort = compute_effort(candidate, input)
  candidate.confidence = compute_confidence(candidate, input)
  candidate.score = (impact*2) + confidence - effort

apply hard rules:
  if address MISMATCH or hours MISMATCH:
    priority1 must be maxScore among {GEO_ADDRESS, GEO_HOURS} that exist

  else if phone MISMATCH and pain_severity CRITICAL:
    priority1 may be REVIEW if REVIEW.score >= GEO_PHONE.score

  if GEO stable-ish and (ai status bad or ai present):
    ensure one of {AI, QA} is in top2 if it exists

  SEO:
    do not place above priority3 unless candidates count < 2

sort by:
  score desc,
  tie-breaker v4 (loss type priority),
  effort asc,
  confidence desc,
  target_platforms scope (ALL first)

select first 3 unique task_type
if fewer than 3:
  add NOOP_MAINTENANCE until 3 cards
```

---

## 12) 출력 데이터 계약(P3 → PDF Renderer) v4

```json
{
  "page": 3,
  "header": {
    "title": "실행 우선순위 Top 3",
    "store_name": "string",
    "report_date": "YYYY.MM.DD"
  },
  "cards": [
    {
      "priority_rank": 1,
      "public_tag": "방문 실패 방지",
      "title": "헛걸음 방지(영업정보)",
      "source": "P1",
      "observation": "플랫폼마다 영업시간이 달라 문 닫은 줄 알고 발길을 돌릴 수 있습니다. (차이: 토요일 마감시간 상이)",
      "impact_line": "헛걸음은 재방문 의지를 크게 떨어뜨릴 수 있습니다.",
      "action_direction": "실제 영업 기준으로 3개 플랫폼의 시간/휴무를 통일합니다.",
      "target_platforms": "ALL",
      "edit_time_estimate": "15분",
      "verification_lag_note": "수정은 15분, 반영은 즉시부터 수일이 걸릴 수 있습니다.",
      "owner": "사장님",
      "done_definition": "3개 플랫폼에서 동일한 값으로 확인됩니다.",
      "verification": "각 플랫폼에서 동일하게 표시되는지 다시 확인합니다.",
      "confidence_label": "높음",
      "internal": {
        "task_type": "GEO_HOURS_CONSISTENCY",
        "score": 11,
        "impact": 5,
        "effort": 2,
        "confidence": 2,
        "refs": ["P1.hours.google_capture_1"],
        "verification_lag_band": "INSTANT_TO_DAYS"
      }
    }
  ],
  "summary_line": "지금은 우선순위 1번만 정리해도 체감 변화가 생길 가능성이 큽니다.",
  "notes": ["플랫폼 반영은 즉시부터 수일이 걸릴 수 있습니다."]
}
```

---

## 13) 테스트 케이스(필수) v4

### TC1: 주소 MISMATCH → Priority 1은 주소/시간 중 하나

* 입력: address MISMATCH, hours MATCH
* 기대: Priority1 = GEO_ADDRESS

### TC2: hours MISMATCH + review CRITICAL

* 입력: hours MISMATCH, pain CRITICAL
* 기대: Priority1은 GEO_HOURS 유지 (Rule1)
* Priority2/3에서 REVIEW가 높은 점수면 포함

### TC3: phone MISMATCH + review CRITICAL + (주소/시간 MISMATCH 없음)

* 입력: phone MISMATCH, pain CRITICAL, address MATCH, hours MATCH
* 기대: Priority1 = REVIEW 가능 (Rule2), 단 REVIEW.score >= GEO_PHONE.score

### TC4: AI 오인인데 증거 키워드 없음

* 입력: ai_snapshot INACCURATE, ai_evidence.keywords=[], quote=null
* 기대: AI 카드 생성은 가능하나 confidence=1, observation에 “근거 확보 필요” 문구가 들어감

### TC5: AI 오인 + 키워드/실제값 제공

* 입력: kw="파스타 전문점", correct_fact="스테이크 전문"
* 기대: observation에 `AI가 매장을 '파스타 전문점'으로 소개합니다. (실제: 스테이크 전문)` 포함

### TC6: QA EMPTY 5개

* 기대: Q&A Impact 4, observation에 empty_count 포함

### TC7: 후보 2개 이하

* 기대: NOOP으로 3장 채움, 빈 페이지 금지

### TC8: SEO는 기본 Priority 3

* 입력: GEO 1개 + AI 1개 + SEO 1개
* 기대: SEO는 Priority 3, 단 후보 부족이면 Priority 2 가능

---

## 14) 강제 금칙어(리포트 출력)

* 출력 텍스트 어디에도 다음 단어를 포함하지 않는다:

  * "GEO", "AEO", "SEO", "제로클릭", "브리핑 최적화"
* 내부 JSON의 `task_type`에는 포함 가능(내부용)

---

## 15) 구현 시 주의(LLM/안티그래비티용)

* 시스템 프롬프트에 아래 규칙을 “강제”로 포함한다.

  * “리포트 출력에는 GEO/AEO/SEO 단어를 절대 사용하지 마라.”
  * “문장 임의 축약(… 포함) 금지.”
  * “UI 클릭 경로 안내 금지.”
  * “문의/연락 유도 금지.”

---
