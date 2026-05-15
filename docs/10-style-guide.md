# TodoListApp 프론트엔드 스타일 가이드

> 버전: 1.2.0
> 작성일: 2026-05-14
> 최종 수정: 2026-05-15
> 참조: 네이버 캘린더 UI(첨부 스크린샷), docs/2-prd.md, docs/8-wireframe.md

이 문서는 네이버 캘린더(Naver Calendar) 화면을 기준 시각 레퍼런스로 삼아 TodoListApp 프론트엔드의 색·타이포·간격·컴포넌트 모양을 통일하기 위한 가이드다. 새 컴포넌트를 만들거나 기존 컴포넌트의 톤을 맞출 때 이 문서를 펼쳐 본다.

---

## 1. 디자인 원칙

1. **흰 캔버스 + 점 같은 강조** — 배경은 흰색·연회색을 기본으로 하고, 보라색(Primary) 한 가지만 강조에 사용한다. 강조색 남발 금지.
2. **정렬과 여백이 그래픽이다** — 라인·박스·아이콘은 두께를 얇게 유지하고, 정보 사이의 여백으로 그룹을 구분한다.
3. **숫자와 날짜 우선** — 할일/일정 화면은 텍스트보다 숫자(날짜·개수·마감일)가 먼저 읽혀야 한다.
4. **상태는 색과 모양 양쪽으로** — 색을 못 보는 환경에서도 의미가 통하도록 텍스트·아이콘·취소선을 함께 사용한다 (`완료`는 색만 바꾸지 않고 취소선까지).
5. **접근성은 합의된 최저선** — 모든 인터랙티브 요소는 키보드로 닿고, 색 대비 4.5:1을 충족하며, 터치 영역은 최소 44×44px.

---

## 2. 색상 토큰

### 2.1 브랜드/Primary

| 토큰 | HEX | 용도 |
|---|---|---|
| `--color-primary` | `#7B5BE0` | 주요 버튼 배경, 활성 탭, 선택된 일정/할일 강조 |
| `--color-primary-hover` | `#6849C7` | Primary 버튼 hover |
| `--color-primary-pressed` | `#5A3FAE` | Primary 버튼 active(눌림) |
| `--color-primary-surface` | `#F1ECFF` | Primary 라이트 배경 (배지·셀 강조 등) |
| `--color-primary-on` | `#FFFFFF` | Primary 위 텍스트·아이콘 |

### 2.2 의미(Semantic) 색

| 토큰 | HEX | 의미 |
|---|---|---|
| `--color-danger` | `#E53935` | 일요일·공휴일·삭제·치명 에러 |
| `--color-danger-surface` | `#FDECEA` | 위험 배경 (확인 모달의 강조 영역) |
| `--color-success` | `#2ECC71` | 완료 상태, 성공 토스트 |
| `--color-warning` | `#F5A623` | 마감 임박, 주의 메시지 |
| `--color-info` | `#4A90D9` | 정보성 안내, 링크 |

### 2.3 그레이 스케일

| 토큰 | HEX | 용도 |
|---|---|---|
| `--color-bg` | `#FFFFFF` | 페이지 기본 배경 |
| `--color-bg-subtle` | `#F8F9FA` | 카드 사이 구분 배경, 사이드바 hover |
| `--color-bg-muted` | `#F1F3F5` | 비활성 영역, 입력 disabled |
| `--color-border` | `#E5E7EB` | 카드·구분선·테이블 라인 (기본) |
| `--color-border-strong` | `#CED4DA` | 입력 포커스 전 테두리 |
| `--color-text` | `#1F2024` | 본문 텍스트 |
| `--color-text-sub` | `#6B7280` | 보조 설명, 메타 정보 |
| `--color-text-muted` | `#9CA3AF` | placeholder, 비활성 텍스트 |
| `--color-text-on-color` | `#FFFFFF` | 색면 위 텍스트 |

### 2.5 다크 모드 토큰

`<html data-theme="dark">`일 때 §2.1~§2.3 토큰을 다음 값으로 오버라이드한다. 컴포넌트 CSS는 항상 `var(--color-*)`만 참조하므로 토큰 교체만으로 전체 화면이 다크 모드로 전환된다.

| 토큰 | 라이트 | 다크 |
|---|---|---|
| `--color-primary` | `#7B5BE0` | `#9A7EFF` |
| `--color-primary-hover` | `#6849C7` | `#B099FF` |
| `--color-primary-pressed` | `#5A3FAE` | `#7D61E0` |
| `--color-primary-surface` | `#F1ECFF` | `#2A224F` |
| `--color-danger` | `#E53935` | `#FF6B6B` |
| `--color-danger-surface` | `#FDECEA` | `#3A1E1E` |
| `--color-warning` | `#F5A623` | `#FFB454` |
| `--color-bg` | `#FFFFFF` | `#1A1B1E` |
| `--color-bg-subtle` | `#F8F9FA` | `#25262B` |
| `--color-bg-muted` | `#F1F3F5` | `#2C2E33` |
| `--color-border` | `#E5E7EB` | `#373A40` |
| `--color-border-strong` | `#CED4DA` | `#4A4D52` |
| `--color-text` | `#1F2024` | `#E9ECEF` |
| `--color-text-sub` | `#6B7280` | `#ADB5BD` |
| `--color-text-muted` | `#9CA3AF` | `#6B7280` |

`--color-success`, `--color-info`는 두 테마에서 동일한 색으로 유지 (브랜드 의미가 같음).

### 2.6 카테고리 색 (사용자 정의 시 기본 팔레트)

기본 카테고리 3종은 PRD에 고정되어 있고, 사용자 정의는 자유롭게 입력 가능하지만 다음 8색을 팔레트 추천값으로 노출한다.

| 이름 | HEX | 비고 |
|---|---|---|
| 블루 | `#4A90D9` | 기본 카테고리 "개인" |
| 레드 | `#E8503A` | 기본 카테고리 "업무" |
| 그린 | `#2ECC71` | 기본 카테고리 "쇼핑" |
| 퍼플 | `#9B59B6` | |
| 옐로우 | `#F1C40F` | |
| 핑크 | `#E91E63` | |
| 틸 | `#1ABC9C` | |
| 그레이 | `#7F8C8D` | |

---

## 3. 타이포그래피

기준 단위는 `rem`(1rem = 16px).

| 토큰 | 크기 | line-height | weight | 사용처 |
|---|---|---|---|---|
| `text-display` | 28px / 1.75rem | 1.3 | 700 | 페이지 최상단 제목(거의 미사용) |
| `text-h1` | 22px / 1.375rem | 1.35 | 700 | 페이지 제목 ("할일 목록", "프로필") |
| `text-h2` | 18px / 1.125rem | 1.4 | 600 | 섹션 제목, 모달 제목 |
| `text-h3` | 15px / 0.9375rem | 1.45 | 600 | 카드 제목, 일정 제목 |
| `text-body` | 14px / 0.875rem | 1.5 | 400 | 본문 기본 |
| `text-meta` | 12px / 0.75rem | 1.45 | 400 | 메타 정보(카테고리, 날짜) |
| `text-mini` | 11px / 0.6875rem | 1.4 | 400 | 음력 표기, 캡션 |

### 폰트 패밀리

```css
font-family:
  'Pretendard Variable', Pretendard,
  -apple-system, BlinkMacSystemFont,
  'Apple SD Gothic Neo', 'Noto Sans KR',
  'Malgun Gothic', sans-serif;
```

숫자 정렬이 필요한 자리(달력 셀의 날짜, 카드 우측의 D-day)는 `font-variant-numeric: tabular-nums;`를 적용한다.

---

## 4. 간격 · 사이즈 · 모서리

### 4.1 Spacing 스케일 (4px 그리드)

| 토큰 | px |
|---|---|
| `space-0` | 0 |
| `space-1` | 4 |
| `space-2` | 8 |
| `space-3` | 12 |
| `space-4` | 16 |
| `space-5` | 20 |
| `space-6` | 24 |
| `space-8` | 32 |
| `space-10` | 40 |
| `space-12` | 48 |

컴포넌트 내부 패딩은 `space-2` ~ `space-4`, 섹션 사이 마진은 `space-6` ~ `space-8`을 기본으로 한다.

### 4.2 모서리(radius)

| 토큰 | px | 용도 |
|---|---|---|
| `radius-sm` | 4 | 작은 칩·배지·체크박스 |
| `radius-md` | 8 | 카드·입력·기본 버튼 |
| `radius-lg` | 12 | 모달·큰 패널 |
| `radius-full` | 9999 | 동그란 아바타·뱃지 카운트 |

### 4.3 그림자

플랫한 캘린더 룩이므로 그림자는 최소 사용. 모달·드롭다운에만 사용한다.

| 토큰 | 값 |
|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` (드롭다운) |
| `shadow-lg` | `0 16px 32px rgba(0,0,0,0.16)` (모달) |

### 4.4 브레이크포인트

```css
--bp-sm: 640px;   /* 모바일 가로 */
--bp-md: 768px;   /* 태블릿 */
--bp-lg: 1024px;  /* PC 전환점 (Sidebar↔BottomNav) */
--bp-xl: 1280px;
```

`1024px` 경계에서 사이드바/하단 네비가 전환되는 규칙은 `docs/2-prd.md`와 일치.

---

## 5. 레이아웃

### 5.1 PC (≥1024px) 3분할

```
┌─────────────────── Header (56px) ───────────────────┐
├─────────┬───────────────────────────────────────────┤
│ Sidebar │  Main Content                              │
│ 240px   │                                            │
│         │                                            │
└─────────┴───────────────────────────────────────────┘
```

- Header: 흰 배경, 하단 1px 보더, 좌측 로고/우측 사용자.
- Sidebar: `#FFFFFF` 배경, 우측 1px 보더, 내부 `space-4` 패딩.
- Main: `--color-bg-subtle`(`#F8F9FA`) 배경 권장. 카드 컨테이너는 흰 배경 + `radius-md` + 1px 보더.

### 5.2 모바일 (<1024px)

```
┌─────────────── Header (52px) ───────────────┐
│                                              │
│  Main Content                                │
│                                              │
├──────────── BottomNav (56px) ───────────────┤
```

BottomNav는 화면 하단 고정, 3개 탭(할일/카테고리/프로필), 활성 탭은 `--color-primary` 아이콘·텍스트.

---

## 6. 컴포넌트 사양

### 6.1 Button

| Variant | 배경 | 텍스트 | 보더 | hover |
|---|---|---|---|---|
| `primary` | `--color-primary` | 흰색 | none | `--color-primary-hover` |
| `secondary` | 흰색 | `--color-text` | 1px `--color-border-strong` | `--color-bg-subtle` |
| `danger` | 흰색 | `--color-danger` | 1px `#FFC9C9` | `--color-danger-surface` |
| `ghost` | transparent | `--color-text-sub` | none | `--color-bg-subtle` |

사이즈: `sm` 28px h / `md` 36px h / `lg` 44px h. 좌우 패딩은 `space-3`(sm) · `space-4`(md) · `space-5`(lg).
`isLoading` 시 Spinner를 텍스트 좌측에, 버튼은 `aria-busy="true"`로 비활성.

예 (캘린더의 "일정 쓰기"에 해당하는 우리 화면의 "+ 새 할일"):

```
[ + 새 할일 ]   ← primary, md
```

### 6.2 Input · Textarea · Select

- 높이: `36px`(md). 보더 1px `--color-border-strong`.
- 포커스: 보더 `--color-primary`, 외곽선 `0 0 0 3px var(--color-primary-surface)`.
- 에러: 보더 `--color-danger`, 하단 helper 텍스트 `text-meta` 색 `--color-danger`.
- placeholder 색은 `--color-text-muted`.
- disabled는 배경 `--color-bg-muted`, 텍스트 `--color-text-muted`.

### 6.3 Modal

- 오버레이 `rgba(0,0,0,0.5)`.
- 내용 박스: 흰 배경, `radius-lg`, `shadow-lg`, 최대폭 `480px`(폼) / `360px`(확인).
- Header(`text-h2`) — Body(`text-body`) — Footer(우측 정렬 버튼) 3분할.
- ESC·오버레이 클릭 시 닫힘. 단, 삭제 확인 모달은 명시적 "취소" 버튼으로만 닫힘.

### 6.4 카드 (TodoCard)

```
┌─────────────────────────────────────────────────┐
│ □  스쿼트 50개                            ⋯    │
│    [업무]  ~2026-06-01                          │
└─────────────────────────────────────────────────┘
```

- 컨테이너: 흰 배경, 1px `--color-border`, `radius-md`, 패딩 `12px`.
- 좌측 체크박스 래퍼: 최소 44×44px(터치 영역), 실제 input은 20×20px.
- 제목(`text-h3`): 완료 시 `text-decoration: line-through;` + 색상 `--color-text-muted`. 카드 배경은 `--color-bg-subtle`로 톤다운.
- 메타 줄: 카테고리 배지 + `~YYYY-MM-DD` 형식의 마감일(`text-meta`).
- 수정/삭제 버튼: 우측 정렬 ghost 스타일 또는 더보기(⋯) 메뉴.

### 6.5 CategoryBadge

- pill 형태(`radius-full`), 패딩 `2px 8px`, 높이 약 20px.
- 배경은 카테고리 색의 12% 알파 또는 라이트 변형, 텍스트는 카테고리 색의 진한 톤 또는 흰색(어두운 배경일 때).
- 예: `#9B59B6` 카테고리 → 배경 `rgba(155, 89, 182, 0.12)`, 텍스트 `#7D3C98`.

### 6.6 FilterPanel

캘린더 사이드바의 필터(체크박스 + 색 마커)와 동일한 시각 언어를 사용한다.

- 카테고리 항목: 좌측 16×16px 색 사각(`radius-sm`) + 카테고리 이름.
- 완료 여부: 세그먼트 컨트롤(전체 / 미완료 / 완료), 선택된 항목 배경 `--color-primary-surface` + 텍스트 `--color-primary`.
- 기간: `from` `to` 두 개의 date input.
- 우상단 "초기화" ghost 버튼.

### 6.7 Spinner

- 크기 `sm` 14px / `md` 20px / `lg` 32px.
- 색상: 부모 컨텍스트가 색면이면 `currentColor`, 흰 배경에서는 `--color-primary`.
- `role="status"`와 `aria-label="처리 중"` 필수.

### 6.8 ErrorMessage / Toast

- 박스: 1px `--color-danger`, 배경 `--color-danger-surface`, `radius-md`, 패딩 `space-3`.
- 텍스트: `text-body` 색상 `#7A1F1A`.
- `role="alert"` 필수.

### 6.9 TodoCalendar (메인 화면 캘린더)

네이버 캘린더의 월간 뷰 시각 언어를 기준으로 한다.

**구조**

- 외곽: 흰 배경, 1px `--color-border`, `radius-md`, `overflow: hidden`로 셀 경계 정리.
- 요일 헤더: `grid-template-columns: repeat(7, 1fr)`, 배경 `--color-bg-subtle`, 폰트 `text-meta` 600. 일요일 헤더만 `--color-danger`.
- 그리드: 6주 × 7일 = 42셀, `grid-auto-rows: minmax(110px, 1fr)` (모바일 80px).
- 셀: 각 셀이 `<button>`. 패딩 `space-2`, 좌측 정렬, hover 시 `--color-bg-subtle`.

**상태별 시각화**

| 상태 | 표현 |
|---|---|
| 현재 달 평일 | 흰 배경, 날짜 `text-meta` 600 `--color-text` |
| 일요일 | 날짜만 `--color-danger` |
| 다른 달 | 배경 `--color-bg-subtle`, 날짜 `--color-text-muted` |
| 오늘 | `outline: 2px solid var(--color-primary)` + 배경 `--color-primary-surface` |
| 셀 hover | 배경 `--color-bg-subtle` |

**할일 이벤트 표기**

- 한 셀에 최대 **3건** 표시, 초과 시 마지막 줄에 `+N`.
- 이벤트: 배경 `--color-primary-surface`, 텍스트 `--color-primary`, 폰트 11px, `text-overflow: ellipsis`로 한 줄 절단.
- 완료된 할일: 취소선 + 배경 `--color-bg-muted` + 텍스트 `--color-text-muted` (§7.3 상태 매트릭스의 "완료" 변형).
- 이벤트 클릭은 `event.stopPropagation()`로 셀 클릭과 분리 (이벤트→수정 모달, 셀→등록 모달).

**네비게이션**

- 상단에 `‹ YYYY.MM › [오늘] ... [+ 새 할일]` 형태. 좌우 화살표는 ghost variant `sm`.
- 연월 텍스트는 `font-variant-numeric: tabular-nums` 적용, `min-width: 110px`로 좌우 흔들림 방지.

**다국어 요일 헤더**

`useTranslation`의 `language`를 읽어 `WEEKDAY_KO`/`WEEKDAY_EN`/`WEEKDAY_JA` 중 하나 선택.

---

## 7. 인터랙션

### 7.1 hover · focus · active

- hover: 배경 톤 한 단계 어둡게(`--color-bg-subtle`) 또는 보더 강화.
- focus-visible: 모든 인터랙티브 요소에 `outline: 2px solid var(--color-primary); outline-offset: 2px;`.
- active(누름): primary 버튼은 `--color-primary-pressed`, 카드/리스트 아이템은 배경 한 단계 더 어둡게.

### 7.2 모션

- duration `150ms`(상태 전환) ~ `200ms`(모달 등장). easing은 `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- 낙관적 업데이트(완료 토글 등)는 즉시 시각 반영 → 실패 시 200ms 페이드로 롤백.
- `prefers-reduced-motion: reduce`인 사용자에게는 모든 transition `0.01ms`로 단축.

### 7.3 상태 시각화 매트릭스

| 상태 | 표현 |
|---|---|
| 미완료(기본) | 카드 흰 배경, 제목 진한 텍스트 |
| 완료 | 카드 `--color-bg-subtle`, 제목 취소선 + `--color-text-muted` |
| 마감 임박(D-2 이내, 미완료) | 마감일 텍스트 색 `--color-warning` + 굵게 |
| 마감 지남(미완료) | 마감일 텍스트 색 `--color-danger` + 굵게 |
| 로딩 | Spinner (Spinner 외 다른 변경 금지) |
| 에러 | ErrorMessage 박스 |
| 빈 상태 | 회색 일러스트(또는 아이콘) + 안내 문구 + 행동 버튼 |

---

## 8. 아이콘

- 라이브러리 정해진 것 없음. 직접 SVG로 그리되 stroke 1.5px·라운드 캡·둥근 코너를 유지한다(캘린더 헤더 아이콘과 동일 톤).
- 크기 `16px` · `20px` · `24px`만 사용. 본문에는 16, 메인 액션엔 20, 헤더엔 24.
- 색은 `currentColor` 기준으로 텍스트 색을 상속.

---

## 9. 접근성 체크리스트

- [ ] 모든 색 대비 ≥ 4.5:1 (텍스트), ≥ 3:1 (큰 텍스트/아이콘).
- [ ] 인터랙티브 요소는 Tab 순서로 도달 가능, focus ring 가시.
- [ ] 폼 모든 입력에 `<label>` 또는 `aria-label`.
- [ ] 상태 변경(완료 토글, 모달 열림)을 screen reader가 인지하도록 `aria-live`/`role` 사용.
- [ ] 빨강 = 위험이라는 색 의미를 텍스트로도 보강.
- [ ] 터치 타겟 ≥ 44×44 (체크박스 래퍼·BottomNav 항목 포함).

---

## 10. 구현 매핑 (CSS 변수 예시)

`frontend/src/styles/tokens.css` (FE-01 재구축 시 생성 권장):

```css
:root {
  /* color */
  --color-primary: #7B5BE0;
  --color-primary-hover: #6849C7;
  --color-primary-pressed: #5A3FAE;
  --color-primary-surface: #F1ECFF;

  --color-danger: #E53935;
  --color-danger-surface: #FDECEA;
  --color-success: #2ECC71;
  --color-warning: #F5A623;
  --color-info: #4A90D9;

  --color-bg: #FFFFFF;
  --color-bg-subtle: #F8F9FA;
  --color-bg-muted: #F1F3F5;
  --color-border: #E5E7EB;
  --color-border-strong: #CED4DA;
  --color-text: #1F2024;
  --color-text-sub: #6B7280;
  --color-text-muted: #9CA3AF;

  /* spacing (4px grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 16px 32px rgba(0, 0, 0, 0.16);

  /* typography */
  --font-sans:
    'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont,
    'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
}
```

각 컴포넌트의 CSS 파일은 이 토큰만 참조한다. 컴포넌트 안에 HEX를 직접 박지 않는다.

---

## 11. 다크 모드 적용 메커니즘

### 11.1 영속 위치

PRD §4.3에 따라 JWT는 `authStore` 메모리에만 있고 `localStorage`·`Cookie`·`sessionStorage`를 쓰지 않는다. 다크 모드 선호도 같은 정책으로 클라이언트에 저장하면 새로고침마다 라이트 모드로 돌아가버리므로 **서버 `users.dark_mode`(BOOLEAN, DEFAULT FALSE)에 저장**한다.

### 11.2 흐름

1. 로그인 응답 / `GET /users/me` 응답에 `darkMode` 포함 → `authStore.setAuth(token, user)`로 메모리 보관.
2. `AppLayout`이 `useApplyDarkMode()` 훅 호출 — `authStore.user?.darkMode` 변경 감지 시 `document.documentElement`에 `data-theme="dark"` 속성 토글.
3. Header의 토글 버튼이 `useToggleDarkMode().mutate(next)` 호출 → `PATCH /api/v1/users/me { darkMode }` → 성공 시 `setAuth(token, { ...user, darkMode })`로 즉시 갱신.
4. 새로고침 → 메모리 토큰 소실 → 로그인 페이지 → 재로그인 시 응답에 `darkMode`가 다시 내려와 같은 흐름으로 복원.

### 11.3 컴포넌트 작성 규칙

- CSS에서 HEX를 직접 박지 않는다. 항상 `var(--color-*)` 참조.
- 다크 변종이 필요한 새 토큰이 생기면 §2.5 표에 라이트/다크 두 값을 함께 추가하고 `tokens.css`의 `[data-theme='dark']` 블록도 같이 갱신.
- 카테고리 색(`#9B59B6` 등)은 사용자가 자유롭게 지정한 값이므로 다크 모드에서 그대로 사용. 배경은 12% 알파 유지 — 라이트/다크 모두에서 가독성 확보.
- 그림자(`--shadow-*`)는 라이트 기준 값을 그대로 사용. 다크에서는 시각적 효과가 약하지만 충돌은 없음. 필요 시 §2.5에 다크 변종 추가.

### 11.4 접근성 추가 체크

- 다크 모드 대비도 §9 기준(4.5:1)을 만족해야 한다. `--color-text` `#E9ECEF` vs `--color-bg` `#1A1B1E` ≈ 14.5:1.
- 토글 버튼은 `aria-pressed`로 현재 상태를 노출한다 (`true` = 다크).

---

## 12. Do / Don't 요약

**Do**
- Primary 보라색은 "지금 가장 중요한 한 자리"에만 사용.
- 일요일·공휴일·삭제·심각 에러는 빨강으로 통일.
- 카드와 리스트 아이템 사이는 8px gap, 카드 내부는 12px 패딩.
- 비어 있는 화면에는 반드시 안내 문구 + 다음 행동 유도.

**Don't**
- 카드에 그림자와 보더를 동시에 적용하지 않는다. (보더 우선.)
- Primary 보라를 본문 텍스트 색으로 쓰지 않는다. (대비 부족.)
- 같은 화면에 5색 이상의 카테고리 색을 동시에 강조하지 않는다.
- 모달 안에 또 다른 모달을 띄우지 않는다. (이중 모달 금지, 인라인 확인 사용.)
- 컴포넌트 CSS에 HEX를 직접 쓰지 않는다. 토큰(`var(--color-*)`)만 참조해야 다크 모드 전환이 자동 동작한다.

---

## 문서 버전 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| 1.0.0 | 2026-05-14 | 초판 작성. 네이버 캘린더 시각 레퍼런스 기반 색·타이포·간격·컴포넌트 사양 정의 |
| 1.1.0 | 2026-05-15 | 다크 모드 토큰 정의(§2.5) + 적용 메커니즘(§12) 추가. `users.dark_mode`로 사용자별 영속화 |
| 1.2.0 | 2026-05-15 | §6.9 캘린더(TodoCalendar) 사양 추가. 네이버 캘린더 시각 레퍼런스 기반 메인 화면 명세 |
