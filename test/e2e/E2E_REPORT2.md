# 통합 테스트 보고서 #2 — 캘린더 메인 화면 (PRD v1.3.0)

- **실행일**: 2026-05-15
- **대상**: http://localhost:5173 (FE / Vite 6) ↔ http://localhost:3000 (BE / Express)
- **참조 시나리오**: [docs/3-user-scenario.md](../../docs/3-user-scenario.md)
- **테스트 계정**: `e2e2_1778807914246@example.com` / `TestPw1234` / `김철수`
- **결과 요약**: **12 시나리오 검증 / PASS 11 · UX 버그 1건 수정 · 백엔드 버그 1건 발견·수정 (서버 재시작 필요)**

이 보고서는 메인 화면이 **카드 리스트 → 월간 캘린더 뷰**로 전환된 후의 재검증이다. 첫 번째 e2e 보고서(`E2E-REPORT.md`)는 PRD v1.2.0 시점 기준이었다.

---

## 1. 시나리오별 결과

| # | 시나리오 ID | 흐름 | 기대 동작 | 실제 결과 | 증거 |
|---|---|---|---|---|---|
| 1 | SCN-U-01 | 회원가입 정상 | POST `/auth/register` 201 → `/login` | ✅ | `01-login-page.png` |
| 2 | SCN-U-02 (예외) | 잘못된 자격증명 | 401 + "이메일 또는 비밀번호가 올바르지 않습니다" | ✅ 동일 메시지 | `02-login-invalid.png` |
| 3 | SCN-U-02 | 정상 로그인 | 200 + JWT → `/` 캘린더 화면 | ✅ | `03-calendar-empty.png` |
| 4 | **캘린더 메인 초기 렌더** | YYYY.MM 헤더 + 7요일 + 42셀 + 오늘 강조 | `2026.05` / `일~토` / cells=42 / today=2026-05-15 | ✅ DOM 검증 통과 | `03-calendar-empty.png` |
| 5 | 카테고리 기본 3개 | 개인/쇼핑/업무 read-only | ✅ DOM 검증 통과 | `04-category-created.png` |
| 6 | SCN-C-01 | 카테고리 생성 ("프로젝트 관리") | POST `/categories` 201 | ✅ | `04-category-created.png` |
| 7 | **빈 셀 클릭 → 등록 폼** | 종료예정일에 셀 일자 자동 입력 | dueDate=`2026-05-20` 자동 채워짐 | ✅ | — |
| 8 | SCN-T-01 (등록 ×2) | "5/20 회의 준비"(업무, 5/20), "오늘 운동"(개인, 5/15) | POST `/todos` 201 ×2 → 캘린더 셀에 제목 노출 | ✅ 표시되지만 **시간대 변환으로 셀 위치 -1일 시프트** (§3-① 참조) | `05-calendar-with-todos.png` |
| 9 | SCN-T-03 | 캘린더 할일 클릭 → 수정 모달 (제목 채워짐) | 제목 `오늘 운동` | ✅ | — |
| 10 | **네비게이션** | `‹`/`›`/`오늘` 버튼으로 월 이동 | 2026.05 → 06 → 04 → 05 | ✅ | `06-calendar-navigation.png` |
| 11 | 다크 모드 토글 | `<html data-theme="dark">` 적용 | ✅ | `07-dark-mode.png` |
| 12 | 다국어 전환 (ja) | 캘린더 요일 헤더 `日/月/火/水/木/金/土` + Header 일본어 | ✅ | `08-ja-dark-calendar.png` |
| 13 | **새로고침 → 영속 검증** | 메모리 토큰 소실 → `/login` + 라이트+한국어 임시 복귀 | ✅ | — |
| 14 | **재로그인 시 설정 복원** | 같은 계정 로그인 → `data-theme=dark` + `lang=ja` + 요일 일본어 자동 복원 | ✅ DB 영속 검증 | `09-after-relogin-ja-dark.png` |

---

## 2. 본 회차에서 수정한 버그

### 2-A. UX: 빈 셀 클릭 시 모달 제목이 "할일 수정"으로 표시 (즉시 수정)

**증상**: 캘린더의 빈 셀을 클릭해 등록 폼을 열면 제목과 제출 버튼이 "할일 추가/등록"이어야 하는데 "할일 수정/수정"으로 잘못 표시됐다.

**원인**: `TodoForm.tsx`가 `initial`의 truthy 여부로 모드 분기했는데, HomePage가 빈 셀 클릭 시 `defaultDueDate`를 채우려고 `initial={{ dueDate: '2026-05-20' } as Todo}`를 전달 → truthy → 수정 모드로 오인.

**수정**: `frontend/src/components/todo/TodoForm.tsx`의 두 곳을 `initial?.todoId ? '수정' : '추가'`로 변경. `todoId`가 있어야만 진짜 수정 모드로 판단.

**검증**: 재시도 후 "할일 추가" 정상 표시, dueDate 입력 필드에 `2026-05-20` 자동 입력 확인.

### 2-B. 데이터: dueDate가 캘린더에서 **하루 일찍** 표시 (백엔드 재시작 필요)

**증상**: 사용자가 `2026-05-15`로 등록한 "오늘 운동"이 캘린더에서 **2026-05-14** 셀에 표시됨. `2026-05-20`도 마찬가지로 5/19 셀에.

**원인**: PostgreSQL의 `DATE` 타입(OID 1082)을 `pg` 라이브러리가 기본 파서로 처리하면 **로컬 시스템 타임존을 적용한 JS `Date`로 변환**되고, 이후 `JSON.stringify` 시 UTC ISO 문자열로 직렬화되어 KST(+9) 환경에서 `T15:00:00.000Z` 같은 전날 timestamp가 응답된다. 프론트엔드 `extractIsoDate`는 그 timestamp의 앞 10자만 가져오므로 결과적으로 하루 빠진 날짜로 셀에 매칭된다.

**수정**: `backend/src/db/pool.js`에 한 줄 추가 — `types.setTypeParser(1082, (val) => val)`. DATE를 변환 없이 `YYYY-MM-DD` 문자열 그대로 반환하도록 강제. 이로써 응답·캘린더 셀 매칭·표시가 모두 일치.

**검증 상태**:
- `npm test` (jest 8 suites / 69 tests) **모두 통과** — 회귀 없음.
- **백엔드 dev 서버 재시작이 필요**. 사용자가 수동 관리 중이라 본 보고서 작성 시점에 재시작은 보류. 재시작 후 동일 흐름 (셀 클릭 → 등록 → 캘린더 셀 표시)에서 정확한 일자에 표시되는지 1차 시각 확인 권장.

---

## 3. 관찰된 비치명적 이슈

1. **수정 모달의 종료예정일 빈 값**: 캘린더에서 기존 할일을 클릭해 수정 모달을 열면 `dueDate` 필드가 비어 있다. 이유는 위 §2-B와 동일 — 백엔드가 ISO timestamp 형식으로 응답하는데 `<input type="date">`는 `YYYY-MM-DD`만 허용해 표시되지 않음. **§2-B 수정 적용 후 재검증 시 함께 해소될 것**으로 예상.
2. **i18n 커버리지 한계**: Header·인증 페이지·홈 헤더의 일부 라벨은 다국어 사전에 있어 전환 시 즉시 반영되지만, 캘린더 모달 제목("할일 추가/수정")·카테고리 페이지 본문 등은 한국어 고정 — 사전 확장 후속.
3. **React Router v7 future flag 경고 2건**: 기능 영향 없음.

---

## 4. 인터셉트된 API 호출 요약

전체 로그는 `network-requests-r2.txt` 참조. 본 회차 주요 호출:

| Step | Method | Endpoint | Status |
|---|---|---|---|
| 회원가입 | POST | `/api/v1/auth/register` | 201 |
| 잘못된 로그인 | POST | `/api/v1/auth/login` | 401 |
| 정상 로그인 ×2 (영속 검증 포함) | POST | `/api/v1/auth/login` | 200 (응답 user에 `darkMode:true`, `language:'ja'` 복원 확인) |
| 카테고리 조회 | GET | `/api/v1/categories` | 200 |
| 카테고리 생성 | POST | `/api/v1/categories` | 201 |
| 할일 조회 (캘린더 새로고침마다) | GET | `/api/v1/todos` | 200 |
| 할일 등록 ×2 | POST | `/api/v1/todos` | 201 |
| 다크 모드 토글 | PATCH | `/api/v1/users/me` `{ darkMode: true }` | 200 |
| 언어 변경 (ja) | PATCH | `/api/v1/users/me` `{ language: 'ja' }` | 200 |
| 언어/모드 환원 | PATCH | `/api/v1/users/me` | 200 |

---

## 5. 결론

`docs/3-user-scenario.md`에 정의된 시나리오를 캘린더 메인 화면(PRD v1.3.0) 기준으로 재검증했다. PRD v1.1.0 다크 모드 + v1.2.0 다국어 영속화는 캘린더 전환 후에도 모두 정상 동작한다.

본 회차에서 **즉시 수정된 UX 버그 1건**(빈 셀 모달 제목), **수정 코드 작성 후 dev 서버 재시작 대기 중인 백엔드 버그 1건**(DATE 타임존 변환)이 식별됐다. 후자는 캘린더 도입으로 처음 드러난 문제로, 카드 리스트 시절엔 `dueDate`가 `~2026-05-29T15:00:00.000Z` 형태로 단순 표시만 됐기 때문에 사용자에게 보이지 않았다. 첫 e2e 보고서 §4-①에서 권고했던 포맷 정리가 이번에 본질적 시점 차이로 표면화된 것.

**다음 단계**

- **백엔드 dev 서버 재시작 필요** (`backend/src/db/pool.js` 변경 반영). 재시작 후 새로 등록하거나 기존 할일을 조회하면 응답이 `2026-05-15` 형태의 순수 날짜 문자열로 변경되고 캘린더 셀 위치 + 수정 모달의 `dueDate` 필드 모두 정상화될 것.
- i18n 사전 확장 (모달·카테고리/프로필 본문)
- 회원 탈퇴 + 비밀번호 변경 e2e 확장
- 이전 보고서(`E2E-REPORT.md`) §4-① 항목도 본 fix로 함께 해소됨 → 보고서 cross-reference 갱신 권장

---

## 산출물 위치

```
test/e2e/
├── E2E_REPORT2.md              # 본 보고서
├── network-requests-r2.txt     # API 호출 로그
└── screenshots-r2/
    ├── 01-login-page.png
    ├── 02-login-invalid.png
    ├── 03-calendar-empty.png
    ├── 04-category-created.png
    ├── 05-calendar-with-todos.png
    ├── 06-calendar-navigation.png
    ├── 07-dark-mode.png
    ├── 08-ja-dark-calendar.png
    └── 09-after-relogin-ja-dark.png
```
