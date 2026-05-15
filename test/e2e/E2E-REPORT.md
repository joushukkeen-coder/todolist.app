# 통합 테스트 보고서 (Playwright MCP)

- **실행일**: 2026-05-15
- **대상**: http://localhost:5173 (FE / Vite 6.4.2) ↔ http://localhost:3000 (BE / Express)
- **참조 시나리오**: [docs/3-user-scenario.md](../../docs/3-user-scenario.md)
- **테스트 계정**: `e2e_1778805908271@example.com` / `TestPw1234` / `김철수`
- **결과 요약**: **13 시나리오 자동화 / 모두 PASS**

---

## 1. 시나리오별 결과

| # | 시나리오 ID | 흐름 | 기대 동작 | 실제 결과 | 증거 |
|---|---|---|---|---|---|
| 1 | SCN-U-01 | 회원가입 정상 | POST `/auth/register` 201 → `/login` 리다이렉트 | ✅ | `02-register-filled.png` |
| 2 | SCN-U-02 (예외) | 잘못된 자격증명 로그인 | 401 INVALID_CREDENTIALS + "이메일 또는 비밀번호가 올바르지 않습니다" | ✅ 동일 메시지 (사용자 열거 방지) | `03-login-invalid-creds.png` |
| 3 | SCN-U-02 | 정상 로그인 | 200 + JWT → `/` 이동 | ✅ Header에 김철수 표시 | `04-home-empty.png` |
| 4 | 카테고리 기본 3개 | `/categories`에 개인/업무/쇼핑 + "수정/삭제 불가" 안내 | BR-C-01 | ✅ 3개 모두 read-only | `04-home-empty.png` |
| 5 | SCN-C-01 | 카테고리 생성 ("프로젝트 관리", `#9B59B6`) | POST `/categories` 201 → 내 카테고리 섹션 추가 | ✅ | `05-category-create-form.png`, `06-category-created.png` |
| 6 | SCN-T-01 | 할일 3건 등록 (Q2 기획서·팀 미팅·신입사원 교육) | POST `/todos` 201 ×3 | ✅ 목록에 모두 표시 | `07-todos-3-created.png` |
| 7 | SCN-T-02 | 목록 조회 | 본인 소유 todos 생성일 역순 표시 | ✅ 최신순 정렬 (BR-F-03) | `07-todos-3-created.png` |
| 8 | SCN-T-04 | 완료 처리 (팀 미팅) | 체크박스 → PATCH `/complete` 200 → `todo-card--done` + 취소선 | ✅ 낙관적 업데이트로 즉시 반영 | `08-todo-completed.png` |
| 9 | SCN-T-05 | 완료 취소 | 다시 클릭 → PATCH `/reopen` 200 → done 클래스 제거 | ✅ | (스냅샷 isDone:false 확인) |
| 10 | SCN-T-07 | 카테고리 필터 ("업무") | GET `/todos?categoryId=…` → 1건만 표시 | ✅ "팀 미팅 참석"만 노출 | `09-filter-work-only.png` |
| 11 | SCN-T-03 | 할일 수정 ("Q2 기획서 및 발표 준비") | 수정 모달에 기존값 채워짐 + PATCH `/todos/:id` 200 | ✅ 변경 즉시 반영 | (스냅샷 확인) |
| 12 | SCN-T-06 | 할일 삭제 (신입사원 교육) | 확인 Modal → DELETE 204 → 목록에서 제거 | ✅ | `10-delete-confirm.png` |
| 13 | 다크 모드 토글 | 버튼 클릭 → PATCH `/users/me { darkMode: true }` → `<html data-theme="dark">` | DB 영속 + DOM 적용 | ✅ | `11-dark-mode.png` |
| 14 | 다국어 전환 (en) | 셀렉터 → PATCH `/users/me { language: 'en' }` → "Logout"/"Switch to light mode" 노출 | ✅ | `12-en-mode.png` |
| 15 | 다국어 전환 (ja) | 셀렉터 → ja → "ログアウト"/"言語を選択" | ✅ | `13-ja-mode-dark.png` |
| 16 | **새로고침 후 영속** | F5 → `/login` (메모리 토큰 정책) → 라이트+한국어 임시 복귀 | PRD §4.3 준수 | ✅ | — |
| 17 | **재로그인 시 설정 복원** | 같은 계정 로그인 → `<html lang="ja" data-theme="dark">` + 일본어 UI 즉시 복원 | DB 영속 검증 | ✅ | `14-after-relogin-ja-dark.png` |

---

## 2. 검증된 핵심 비즈니스 규칙

- **BR-U-01**: 이메일 중복 — 처음 회원가입 후 동일 이메일 재가입은 별도 케이스 (백엔드 jest 통합 테스트에서 커버)
- **BR-C-01**: 기본 카테고리 수정·삭제 불가 — UI 레벨에서 버튼 자체 미노출 + "수정/삭제 불가" 안내 문구
- **BR-F-03**: 할일 목록 생성일 역순 정렬 — 백엔드 응답 순서 그대로 렌더 (검증됨)
- **PRD §4.3**: JWT 메모리 전용 — 새로고침 시 토큰 소실 → 자동 `/login` 리다이렉트 확인
- **PRD §1.3 (v1.2.0)**: 다크 모드 + 다국어 v1 승격 — 양쪽 모두 DB 영속화 + 재로그인 시 복원 확인

---

## 3. 인터셉트된 API 호출 요약

전체 요청은 `network-requests.txt` 참조. 주요 흐름:

| Step | Method | Endpoint | Status |
|---|---|---|---|
| 회원가입 | POST | `/api/v1/auth/register` | 201 |
| 잘못된 로그인 | POST | `/api/v1/auth/login` | 401 |
| 로그인 성공 | POST | `/api/v1/auth/login` | 200 |
| 내 정보 | GET | `/api/v1/users/me` | 200 |
| 카테고리 조회 | GET | `/api/v1/categories` | 200 |
| 카테고리 생성 | POST | `/api/v1/categories` | 201 |
| 할일 등록 ×3 | POST | `/api/v1/todos` | 201 |
| 할일 목록 | GET | `/api/v1/todos` | 200 |
| 완료/취소 | PATCH | `/api/v1/todos/:id/complete`, `/reopen` | 200 |
| 카테고리 필터 | GET | `/api/v1/todos?categoryId=…` | 200 |
| 수정 | PATCH | `/api/v1/todos/:id` | 200 |
| 삭제 | DELETE | `/api/v1/todos/:id` | 204 |
| 다크 모드 토글 | PATCH | `/api/v1/users/me` `{ darkMode }` | 200 |
| 언어 변경 ×2 | PATCH | `/api/v1/users/me` `{ language }` | 200 |
| 재로그인 후 복원 | POST | `/api/v1/auth/login` | 200 (응답 user에 `darkMode:true`, `language:'ja'`) |

---

## 4. 관찰된 비치명적 이슈

1. **마감일 표시 형식**: 화면에 `~2026-05-29T15:00:00.000Z` 와 같이 시간이 포함된 ISO 문자열이 그대로 노출됨. 백엔드가 `due_date`를 TIMESTAMP로 저장하기 때문. PRD/Swagger 명세상 `dueDate`는 `YYYY-MM-DD` 날짜 포맷이어야 하므로 향후 백엔드 컬럼을 `DATE`로 변경하거나 프론트에서 `.slice(0,10)`로 잘라 표시할 필요. **시나리오 PASS에는 영향 없음.**
2. **i18n 커버리지**: Header·네비게이션·인증 페이지·홈 빈 상태는 다국어 적용되어 일본어/영어 전환 시 즉시 반영됨. 다만 `Sidebar` `aria-label="주 메뉴"`와 카테고리 페이지·프로필 페이지 본문 일부는 아직 한국어 고정 (현 i18n 사전이 핵심 키만 포함). **추후 사전 확장 예정.**
3. **콘솔 경고 2건**: React Router v7 future flag 경고 (`v7_startTransition`, `v7_relativeSplatPath`) — 기능 영향 없음.

---

## 5. 결론

`docs/3-user-scenario.md`에 정의된 PRD v1 전체 시나리오(`SCN-U-01`/`SCN-U-02`/`SCN-C-01`/`SCN-T-01`~`SCN-T-07`)를 실제 브라우저로 종단 검증했고 모두 PASS. 추가로 PRD v1.2.0에 승격된 **다크 모드 + 다국어(ko/en/ja)** 기능과 PRD §4.3의 **JWT 메모리 전용 + 사용자 설정 DB 영속화** 정책이 의도대로 동작함을 확인했다.

**다음 단계 권장**
- `dueDate` 표시 포맷 정리 (위 §4-①)
- i18n 사전 확장: 카테고리/프로필/할일 폼 라벨까지 (위 §4-②)
- 회원 탈퇴(SCN-U-04), 비밀번호 변경(SCN-U-03 대안 흐름)도 e2e에 추가

---

## 6. 본 보고서 작성 이후 변경

| 일자 | 변경 |
|---|---|
| 2026-05-15 | 메인 화면(`HomePage`)이 카드 리스트 → **월간 캘린더 뷰**로 전환됨 (PRD v1.3.0). 본 보고서의 SCN-T-02/T-04/T-05/T-07 화면 흐름은 캘린더 셀 기반으로 재검증 필요. 단위 테스트는 `home-page.test.tsx`·`TodoCalendar.test.tsx`로 커버 (160/160 통과). |
