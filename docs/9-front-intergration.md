# 프론트엔드 ↔ 백엔드 통합 가이드

> 버전: 1.3.0
> 작성일: 2026-05-14
> 최종 수정: 2026-05-15
> 참조: docs/2-prd.md, docs/4-project-principles.md, swagger/swagger.json

이 문서는 React 프론트엔드(`frontend/`)가 Node.js + Express 백엔드(`backend/`)와 통합되는 방식을 정리한다. 새 화면을 만들거나 API를 호출할 때 이 문서를 출발점으로 사용한다.

---

## 1. 토폴로지 한눈에 보기

```
[브라우저]
  └── http://localhost:5173            ← Vite dev 서버 (frontend/)
         │  fetch via axios
         ▼
       http://localhost:3000/api/v1    ← Express API (backend/)
         │  pg.Pool
         ▼
       PostgreSQL 17 (todolistapp_dev)
```

| 항목 | 값 |
|---|---|
| 프론트엔드 dev 서버 | http://localhost:5173 (Vite 6) |
| 백엔드 API 기본 URL | http://localhost:3000/api/v1 |
| Swagger UI | http://localhost:3000/api-docs |
| OpenAPI JSON | http://localhost:3000/api-docs/swagger.json |

---

## 2. 환경 변수

### 2.1 프론트엔드 (`frontend/`)

| 변수 | 예시 | 설명 |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` | axios 인스턴스의 `baseURL`로 사용. Vite는 `VITE_` 접두사 변수만 클라이언트 번들에 노출 |

파일: `frontend/.env.development`, `frontend/.env.example`

### 2.2 백엔드 (`backend/`)

| 변수 | 개발 기본값 | 설명 |
|---|---|---|
| `NODE_ENV` | `development` | `.env.{development,test,production}` 선택 키 |
| `PORT` | `3000` | API 서버 포트 |
| `DB_*` | localhost / todolistapp_dev | PostgreSQL 접속 정보 |
| `JWT_SECRET` | (개발용 자리표시자) | JWT HS256 서명 키 |
| `JWT_EXPIRES_IN` | `1h` | JWT 만료 (예: `1h`, `30m`) |
| `CORS_ORIGIN` | `http://localhost:5173` | 허용 origin. 쉼표로 다중 지정. `*`로 전체 허용 가능 |

로드 우선순위: `backend/.env` (공통 기본값) → `.env.{NODE_ENV}` (덮어쓰기). 필수 키 누락 시 `process.exit(1)`.

---

## 3. 인증 흐름

### 3.1 토큰 정책 (핵심 제약)

- JWT는 **반드시 메모리(Zustand `authStore`)에만 저장**한다.
- `localStorage`·`sessionStorage`·`Cookie` 사용 금지. 새로고침 시 토큰이 사라져 다시 로그인 페이지로 가는 동작은 의도된 것.
- 토큰 만료(`exp`)는 백엔드에서 1시간으로 발급. 만료된 토큰으로 API 호출 시 401이 반환되고, 프론트엔드의 응답 인터셉터가 자동으로 로그아웃 후 `/login`으로 리다이렉트한다.

### 3.2 로그인·로그아웃 시퀀스

```
1. 사용자 → 로그인 폼 제출
2. FE → POST /api/v1/auth/login { email, password }
3. BE → 200 { accessToken, user }
4. FE → authStore.setAuth(accessToken, user)
5. 이후 모든 요청에 Authorization: Bearer <token> 자동 부착 (요청 인터셉터)
6. 로그아웃: authStore.clearAuth() → 메모리에서 제거 (별도 API 호출 불필요)
```

> Swagger 명세는 응답 필드명을 `token`으로 표기하지만, **실 구현 응답은 `accessToken`** 이다. 프론트엔드는 `accessToken`을 기준으로 사용한다.

### 3.3 401 자동 처리

`frontend/src/services/apiClient.ts`의 응답 인터셉터:

```ts
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);
```

이 처리 덕분에 개별 호출처에서는 401을 신경 쓰지 않아도 된다.

### 3.4 다크 모드 (사용자별 영속)

JWT 메모리 정책상 `localStorage`를 못 쓰지만 다크 모드 선호는 새로고침·재로그인 후에도 보존돼야 한다. 사용자별 설정이므로 서버 `users.dark_mode` 컬럼에 저장하고, 응답 흐름에 포함해서 클라이언트가 자동으로 받게 한다.

흐름:

```
POST /auth/login  →  { accessToken, user: { ..., darkMode: true } }
                       │
                       ▼
              authStore.setAuth(token, user)
                       │
                       ▼
       <AppLayout>에서 useApplyDarkMode() 호출
                       │
                       ▼
        document.documentElement.setAttribute('data-theme', 'dark')
                       │
                       ▼
        styles/tokens.css의 [data-theme='dark'] 색 토큰이 활성
```

토글:

- Header의 "🌙 다크" / "☀️ 라이트" 버튼이 `useToggleDarkMode().mutate(!current)` 호출
- 서비스: `userApi.updateProfile({ darkMode })` → `PATCH /api/v1/users/me`
- 성공 시 `authStore.setAuth(token, { ...user, darkMode })`로 즉시 갱신 → DOM 반영
- 다음 로그인 시 응답에 같은 값이 내려와 자동 복원

스타일 토큰만 갈아끼우는 구조라 컴포넌트 코드는 다크/라이트를 의식하지 않는다. 새 색을 쓸 때는 항상 `var(--color-*)`를 참조한다 (HEX 직접 작성 금지).

### 3.5 다국어 (사용자별 영속)

다크 모드와 같은 패턴. `users.language` 컬럼(VARCHAR(2), CHECK ko/en/ja, DEFAULT 'ko')에 사용자별 선호 언어를 저장하고 로그인·`GET /users/me` 응답에 포함시킨다.

흐름:

```
POST /auth/login  →  { accessToken, user: { ..., language: 'en' } }
                       │
                       ▼
              authStore.setAuth(token, user)
                       │
                       ▼
       <AppLayout>에서 useApplyLanguage() 호출
                       │
                       ▼
        document.documentElement.setAttribute('lang', 'en')
                       │
                       ▼
        컴포넌트가 useTranslation().t(key)로 사전 lookup
```

번역 사전: `frontend/src/i18n/messages.ts`에 `MESSAGES: Record<Language, Record<string, string>>` 형태로 ko/en/ja 3개 언어를 보관. 키 누락 시 영문 코드(키 자체)를 그대로 반환하여 누락이 즉시 눈에 띈다.

변경 흐름:

- Header의 `<select>`(ko/en/ja)가 `useChangeLanguage().mutate(lang)` 호출
- 서비스: `userApi.updateProfile({ language })` → `PATCH /api/v1/users/me`
- 성공 시 `authStore.setAuth(token, { ...user, language })`로 즉시 갱신 → 모든 `useTranslation` 훅이 새 언어 반환 → 화면 전체 즉시 재번역
- 다음 로그인 시 응답에 같은 값이 내려와 자동 복원

외부 라이브러리(react-i18next 등) 미사용 — 키 50개 안팎 수준에서는 단순 사전이 더 가볍고 명시적이다. 향후 ICU 메시지 포맷·복수형이 필요해지면 그때 라이브러리 도입을 검토한다.

### 3.6 메인 캘린더 뷰 (v1.3.0~)

`HomePage`는 카드 리스트 + 필터 패널 구조에서 월간 캘린더(`TodoCalendar`)로 전환되었다.

데이터 흐름:

```
HomePage
  ├── useTodos({})              ← 필터 없이 전체 할일 조회
  ├── 월 단위 state (year, month)
  └── <TodoCalendar year month todos onCellClick onTodoClick />
        │
        ├── buildMonthGrid(year, month)   ← 42셀 (6주 × 7일)
        └── 각 todo의 extractIsoDate(t.dueDate)로 셀에 그룹핑
```

- **타임스탬프 호환**: 백엔드가 `dueDate`를 TIMESTAMP로 응답해도(`2026-05-29T15:00:00.000Z`) `extractIsoDate`의 정규식 `^(\d{4}-\d{2}-\d{2})`로 날짜 부분만 매칭. 향후 백엔드 컬럼을 `DATE`로 정리하면 변환 단계가 사라진다.
- **인터랙션**:
  - 빈 셀 클릭 → `openCreate(isoDate)` → 등록 모달의 종료예정일 자동 입력
  - 할일 제목 클릭 → `openEdit(todo)` → 수정 모달 (이벤트가 셀로 버블되지 않도록 `stopPropagation`)
  - `‹` / `›` / `오늘` 버튼으로 `year`·`month` 상태 갱신 → 같은 `todos` 데이터를 다른 달로 재그룹핑
- **필터 UI 미노출**: 카테고리·완료 여부 복합 필터는 캘린더 뷰에서 잠시 제거 (PRD §3.3 US-T-07 — 후속 작업으로 캘린더 상단 컴팩트 바 검토).
- **할일 0건 처리**: 빈 상태 안내 문구 대신 빈 캘린더 그대로 표시. 사용자는 `+ 새 할일` 또는 빈 셀 클릭으로 즉시 등록 가능.

---

## 4. API 클라이언트 사용 패턴

### 4.1 계층 구조

```
React 컴포넌트
   └── 훅 (hooks/useXxx.ts)         ← TanStack Query (useQuery / useMutation)
          └── 서비스 (services/xxxApi.ts)  ← axios 호출 + 응답 타입 변환
                 └── apiClient (axios 인스턴스 + 인터셉터)
                        └── 백엔드 /api/v1/...
```

컴포넌트가 `apiClient`나 `services/*.ts`를 직접 임포트하지 않는다. 항상 `hooks/`를 거친다.

### 4.2 서비스 모듈 작성 규칙

- 한 도메인 = 한 파일 (`authApi.ts`, `userApi.ts`, `categoryApi.ts`, `todoApi.ts`).
- 각 함수는 응답 본문에서 필요한 객체만 꺼내 반환 (`apiClient.get<{ todos: Todo[] }>(...)` → `data.todos`).
- 예외는 throw 하지 않고 axios가 던지는 그대로 전파한다. 401 처리는 인터셉터, 그 외 에러 메시지 추출은 `ErrorMessage` 컴포넌트의 책임.

### 4.3 TanStack Query 훅 작성 규칙

- 쿼리 키는 `frontend/src/query-keys/index.ts`의 팩토리(`todoKeys.list(filters)` 등)만 사용한다. 인라인 문자열 키 금지.
- mutation 성공 시 캐시 무효화는 같은 팩토리로 `qc.invalidateQueries({ queryKey: todoKeys.lists() })`.
- 완료/취소·삭제 등 즉시 반영이 필요한 작업은 `onMutate`에서 `setQueriesData`로 낙관적 업데이트, `onError`에서 스냅샷 롤백, `onSettled`에서 무효화 (예: `useCompleteTodo` 참고).

---

## 5. 엔드포인트 매핑표 (실 구현 기준)

> 모든 엔드포인트는 prefix `/api/v1` 뒤에 붙는다. 인증이 필요한 경로는 `Authorization: Bearer <JWT>` 헤더 필수.

### 5.1 Auth

| 메서드 | 경로 | 인증 | FE 서비스 | 비고 |
|---|---|---|---|---|
| POST | `/auth/register` | ✗ | `authApi.register` | 201 → User. 409 `EMAIL_ALREADY_EXISTS` |
| POST | `/auth/login` | ✗ | `authApi.login` | 200 → `{ accessToken, user }` |

### 5.2 Users

| 메서드 | 경로 | 인증 | FE 서비스 | 비고 |
|---|---|---|---|---|
| GET | `/users/me` | ✓ | `userApi.getMe` | 200 → User |
| PATCH | `/users/me` | ✓ | `userApi.updateProfile` | 이름·다크 모드·언어 변경 (`{ name?, darkMode?, language? }`). `language`는 `ko`/`en`/`ja`. `email` 변경 시 400 `EMAIL_CHANGE_NOT_ALLOWED` |
| PATCH | `/users/me/password` | ✓ | `userApi.changePassword` | 204. 본문: `{ currentPassword, newPassword }` |
| DELETE | `/users/me` | ✓ | `userApi.deleteAccount` | 204 |

### 5.3 Categories

| 메서드 | 경로 | 인증 | FE 서비스 | 비고 |
|---|---|---|---|---|
| GET | `/categories` | ✓ | `categoryApi.listCategories` | 응답: `{ categories: Category[] }` (기본 3개 포함) |
| POST | `/categories` | ✓ | `categoryApi.createCategory` | 201. 409 `CATEGORY_NAME_DUPLICATE` |
| PATCH | `/categories/:categoryId` | ✓ | `categoryApi.updateCategory` | 기본 카테고리 → 403 `DEFAULT_CATEGORY_IMMUTABLE` |
| DELETE | `/categories/:categoryId` | ✓ | `categoryApi.deleteCategory` | 204. 연결 할일 있으면 409 `CATEGORY_HAS_TODOS` |

### 5.4 Todos

| 메서드 | 경로 | 인증 | FE 서비스 | 비고 |
|---|---|---|---|---|
| GET | `/todos` | ✓ | `todoApi.listTodos` | 쿼리: `categoryId`, `isCompleted`, `dueDateFrom`, `dueDateTo`. 응답: `{ todos: Todo[] }` (생성일 역순) |
| POST | `/todos` | ✓ | `todoApi.createTodo` | 201. 카테고리 미존재 시 404 `CATEGORY_NOT_FOUND` |
| PATCH | `/todos/:todoId` | ✓ | `todoApi.updateTodo` | 부분 수정 |
| PATCH | `/todos/:todoId/complete` | ✓ | `todoApi.completeTodo` | 200 |
| PATCH | `/todos/:todoId/reopen` | ✓ | `todoApi.reopenTodo` | 200 |
| DELETE | `/todos/:todoId` | ✓ | `todoApi.deleteTodo` | 204 |

> Swagger 명세의 `PaginatedTodoResponse`(items+pagination)와 달리 **현 구현은 `{ todos: [...] }` 단일 배열을 반환**한다. 페이지네이션은 미구현 상태이며, 필터링으로 충분히 좁혀진다고 판단해 제외했다. 후속 작업에서 도입한다면 swagger와 응답 양쪽을 함께 갱신해야 한다.

---

## 6. 공통 응답 형식

### 6.1 성공

각 엔드포인트의 도메인 객체를 그대로 반환한다 (예: `Todo`, `Category`, `User`, `{ todos: [...] }`, `{ categories: [...] }`).

### 6.2 에러

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "body.password: 비밀번호는 8자 이상이어야 합니다"
  }
}
```

- HTTP 상태 코드는 `code`와 함께 의미를 가진다. `code`만 보고 분기하는 것을 권장.
- 프론트엔드의 `ErrorMessage` 컴포넌트는 axios 에러를 받아 `response.data.error.message`를 우선 표시한다.

### 6.3 주요 에러 코드

| HTTP | code | 발생 상황 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 요청 본문/쿼리/파라미터 검증 실패 |
| 400 | `EMAIL_CHANGE_NOT_ALLOWED` | `PATCH /users/me` 본문에 `email` 포함 |
| 401 | `UNAUTHORIZED` | 토큰 누락·만료·위변조 |
| 401 | `INVALID_CREDENTIALS` | 로그인 자격증명 실패 |
| 401 | `INVALID_CURRENT_PASSWORD` | 비밀번호 변경 시 현재 비번 불일치 |
| 403 | `FORBIDDEN` | 타인 리소스 접근 |
| 403 | `DEFAULT_CATEGORY_IMMUTABLE` | 기본 카테고리 수정·삭제 시도 |
| 404 | `TODO_NOT_FOUND` / `CATEGORY_NOT_FOUND` / `USER_NOT_FOUND` | 리소스 없음 |
| 409 | `EMAIL_ALREADY_EXISTS` | 회원가입 이메일 중복 |
| 409 | `CATEGORY_NAME_DUPLICATE` | 같은 사용자 내 카테고리 이름 중복 |
| 409 | `CATEGORY_HAS_TODOS` | 연결 할일이 있는 카테고리 삭제 |
| 409 | `TODO_ALREADY_COMPLETED` / `TODO_NOT_COMPLETED` | 완료/취소 상태 충돌 |
| 500 | `INTERNAL_SERVER_ERROR` | 예상치 못한 서버 오류 |

---

## 7. CORS

- 백엔드는 `CORS_ORIGIN` env로 허용 origin을 결정한다. 다중 origin은 쉼표 구분, 전체 허용은 `*`.
- 개발 기본값은 `http://localhost:5173` 단일 허용.
- 허용 메서드: `GET, POST, PATCH, PUT, DELETE, OPTIONS`. 허용 헤더: `Content-Type, Authorization`.
- credentials(쿠키 전송)는 사용하지 않는다 (토큰은 헤더로 전달).
- 허용되지 않은 origin은 백엔드가 `[WARN] [cors]` 로그를 남긴 뒤 차단한다.

---

## 8. 데이터 직렬화 규약

- API 페이로드와 응답은 **camelCase** (예: `userId`, `categoryId`, `dueDate`, `isCompleted`, `createdAt`).
- DB 컬럼은 snake_case이지만 백엔드 Repository 계층에서 변환하므로 프론트엔드는 신경쓰지 않는다.
- 날짜·시간:
  - `dueDate`: ISO 8601 **날짜** (`YYYY-MM-DD`).
  - `createdAt`, `updatedAt`, `completedAt`: ISO 8601 **타임스탬프** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- nullable 필드: `description`, `dueDate`, `completedAt`. 값을 제거하려면 명시적으로 `null`을 전송한다 (PATCH의 부분 갱신 대상에서 빠진 필드는 기존 값 유지).

---

## 9. 개발·디버깅 워크플로우

### 9.1 양쪽 서버 기동

```powershell
# 터미널 1 - 백엔드
cd backend
npm run dev          # nodemon (포트 3000)

# 터미널 2 - 프론트엔드
cd client
npm run dev          # Vite (포트 5173)
```

### 9.2 빠른 점검 체크리스트

- `GET http://localhost:3000/api-docs/` → 200 (Swagger UI)
- `GET http://localhost:3000/api/v1/categories` → 401 (인증 미들웨어 동작)
- 프론트엔드 콘솔에 CORS 오류가 보이면 `backend/.env`의 `CORS_ORIGIN`이 프론트엔드 origin과 일치하는지 확인.
- 401 루프가 발생하면 토큰 만료 또는 `JWT_SECRET` 불일치 점검 (개발 중 `.env` 수정 후 백엔드 재시작 필요).

### 9.3 로그 활용

백엔드는 `utils/logger.js`로 구조화 로그를 출력한다. 형식:

```
[ISO 타임스탬프] [INFO|WARN|ERROR] [tag] message {"json":"data"}
```

요청별 흐름은 `auth → <도메인>.service → errorHandler` 순으로 태그를 따라가면 추적 가능. 민감 정보(비밀번호, 토큰, 요청 본문 전체)는 절대 기록되지 않으므로 안심하고 켜둘 수 있다.

---

## 10. 자주 만나는 함정

1. **새로고침 후 401**: 토큰을 메모리에만 두므로 의도된 동작. 인증 가드(`PrivateRoute`)가 로그인 페이지로 자동 이동시킨다.
2. **응답 필드명 `accessToken` vs `token`**: Swagger 명세와 실 구현이 다르다. 프론트엔드는 `accessToken`을 신뢰한다. 명세를 맞추려면 swagger.json 갱신이 필요.
3. **카테고리 삭제가 409**: 해당 카테고리에 할일이 남아 있으면 삭제 불가 (`CATEGORY_HAS_TODOS`). 할일을 먼저 옮기거나 삭제한다.
4. **`dueDate` 형식**: `YYYY-MM-DD` 문자열. Date 객체를 직접 보내면 400. `toISOString().slice(0,10)`로 가공.
5. **CORS 차단 후 200 응답 없음**: 백엔드는 정상 동작해도 브라우저가 응답을 차단한다. 네트워크 탭의 status code가 정상이라도 `[WARN] [cors]` 로그가 찍혔다면 origin 불일치다.

---

## 11. 향후 확장 시 체크리스트

- 새 API를 만들 때
  - [ ] `swagger/swagger.json` 갱신 (실 응답 형식과 일치하도록)
  - [ ] `backend/src/routes/*.routes.js`에 경로 등록
  - [ ] `frontend/src/services/<domain>Api.ts`에 호출 함수 추가
  - [ ] `frontend/src/query-keys/index.ts`에 쿼리 키 팩토리 추가 (조회면)
  - [ ] `frontend/src/hooks/use<Domain>*.ts`에 훅 추가
  - [ ] Vitest·Jest 테스트 추가
- 응답 형식을 바꿀 때는 Swagger와 실 구현, 프론트엔드 타입(`frontend/src/types/*.ts`)을 **동시에** 갱신한다.

---

## 문서 버전 이력

| 버전 | 날짜 | 변경 내용 |
|---|---|---|
| 1.0.0 | 2026-05-14 | 초판 작성. 현 구현 기준(로깅·Swagger UI·`PATCH /users/me/password`·`CORS_ORIGIN` 분리 포함) |
| 1.1.0 | 2026-05-15 | 다크 모드: User 응답에 `darkMode` 포함, `PATCH /users/me { darkMode }`, `useApplyDarkMode`/`useToggleDarkMode` 훅, Header 토글 버튼, `<html data-theme="dark">` 적용 |
| 1.2.0 | 2026-05-15 | 다국어: User 응답에 `language` (ko/en/ja), `PATCH /users/me { language }`, `useApplyLanguage`/`useTranslation`/`useChangeLanguage` 훅, Header 셀렉터, `<html lang="...">` + 경량 사전 |
| 1.3.0 | 2026-05-15 | 메인 캘린더 뷰 도입. `HomePage`가 `useTodos({})` 전체 조회 + 클라이언트 측 `extractIsoDate`로 dueDate 그룹핑 → `TodoCalendar` 렌더. 카테고리/완료 여부 필터 UI는 비노출(후속) |
