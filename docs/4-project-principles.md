# TodoListApp 프로젝트 구조 설계 원칙

> 버전: 1.0.0
> 작성일: 2026-05-13
> 참조: PRD v1.0.1

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-05-13 | joushukkeen | 최초 작성 |

---

## 1. 최상위 공통 원칙

### 1.1 레포지토리 구조 선택

모노레포(monorepo) 방식을 채택한다.

프론트엔드와 백엔드를 단일 Git 레포지토리 내 `client/`와 `server/` 디렉토리로 분리한다. 소규모 단일 서버 배포 프로젝트이므로 멀티레포의 독립 배포 이점이 불필요하며, 모노레포로 관리하면 타입 정의, API 계약 변경, 환경 설정을 단일 PR에서 추적할 수 있다.

**최상위 디렉토리 구성**

```
todolist.app/
├── client/          # React 19 프론트엔드
├── server/          # Node.js + Express 백엔드
├── docs/            # 설계 문서
├── .gitignore
└── README.md
```

### 1.2 환경 변수 관리 원칙

- 환경 변수는 `.env` 파일로 관리하며, `.env.example` 파일에 키 목록과 설명만 기재하고 실제 값은 기재하지 않는다.
- `.env` 파일은 `.gitignore`에 등록하여 버전 관리에서 제외한다. 비밀값(DB 비밀번호, JWT Secret, API Key)을 저장소에 커밋하지 않는다.
- 환경 변수 파일은 실행 환경별로 `.env.development`와 `.env.production`으로 분리한다.
- 서버 시작 시점에 필수 환경 변수 존재 여부를 검증하고, 누락된 경우 프로세스를 즉시 종료한다.
- 클라이언트 측에서는 빌드 도구(Vite)가 허용하는 `VITE_` 접두사 환경 변수만 사용하며, 서버 전용 비밀값을 클라이언트 번들에 포함하지 않는다.

### 1.3 코드 포맷터 및 린터 통일

- ESLint와 Prettier를 필수 도구로 사용하며, 두 도구의 규칙이 충돌하지 않도록 `eslint-config-prettier`를 적용한다.
- 포맷 규칙은 프로젝트 루트의 단일 설정 파일로 관리한다. `client/`와 `server/` 각각의 ESLint 설정은 루트 설정을 상속(extends)하여 도메인별 추가 규칙만 덮어쓴다.
- 커밋 전 자동 포맷 적용을 위해 `lint-staged`와 `husky`를 설정한다.
- TypeScript를 사용하는 클라이언트는 `tsc --noEmit` 타입 검사를 CI 파이프라인에 포함한다.

---

## 2. 의존성 및 레이어 원칙

### 2.1 백엔드 레이어 정의

백엔드는 다음 5계층으로 구성하며, 의존성은 위에서 아래 방향으로만 흐른다.

```
Router → Controller → Service → Repository → DB
```

| 레이어 | 책임 | 금지 사항 |
|--------|------|-----------|
| Router | URL 경로와 HTTP 메서드를 핸들러에 매핑하고 미들웨어를 체인한다 | 비즈니스 로직 작성 금지 |
| Controller | 요청 파라미터를 추출하고 유효성을 검증하며, Service 호출 후 HTTP 응답을 반환한다 | DB 직접 접근 금지, 비즈니스 규칙 판단 금지 |
| Service | 비즈니스 규칙을 처리하고 여러 Repository를 조합하여 도메인 로직을 수행한다 | HTTP 요청/응답 객체(`req`, `res`) 접근 금지, HTTP 상태 코드 직접 설정 금지 |
| Repository | DB 쿼리를 실행하고 결과를 반환한다. pg 파라미터 바인딩을 사용하는 유일한 계층이다 | HTTP 응답 반환 금지, 비즈니스 규칙 처리 금지 |
| DB | PostgreSQL 커넥션 풀 및 쿼리 실행 인터페이스를 제공한다 | 애플리케이션 로직 포함 금지 |

소유권 검증(userId 기준)은 Service 계층에서 수행한다. Controller는 인증 미들웨어가 검증한 `req.user.userId`를 Service로 전달하는 역할만 한다.

### 2.2 프론트엔드 레이어 정의

프론트엔드는 다음 5계층으로 구성하며, 의존성은 위에서 아래 방향으로만 흐른다.

```
Pages → Components → Hooks → Services(API) → Store
```

| 레이어 | 책임 | 금지 사항 |
|--------|------|-----------|
| Pages | 라우트에 대응하는 최상위 화면 컴포넌트. 레이아웃을 조합하고 하위 컴포넌트에 데이터를 전달한다 | `fetch`/`axios` 직접 호출 금지 |
| Components | UI 렌더링과 사용자 인터랙션을 담당한다. 공통(common)과 도메인별로 분리한다 | API 직접 호출 금지, 전역 Store 직접 변경 금지 |
| Hooks | 서버 상태(TanStack Query)와 로컬 상태 로직을 캡슐화한다 | JSX 반환 금지 |
| Services(API) | 백엔드 API 호출 함수를 모아둔다. HTTP 클라이언트 설정 및 요청/응답 변환을 담당한다 | 상태 관리 로직 포함 금지 |
| Store | Zustand를 이용한 클라이언트 전역 상태(인증 정보, UI 상태 등)를 관리한다 | API 직접 호출 금지 |

### 2.3 단방향 의존성 규칙

- 하위 레이어는 상위 레이어를 참조하지 않는다. (예: Repository가 Controller를 import하는 것은 금지한다)
- 동일 레이어 간 순환 참조를 만들지 않는다.
- 공통 타입 정의(인터페이스, DTO)는 `types/` 디렉토리에 모아 모든 레이어에서 참조한다.

---

## 3. 코드 및 네이밍 원칙

### 3.1 파일 및 디렉토리 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 디렉토리 | kebab-case | `src/query-keys/`, `src/todo-list/` |
| 백엔드 일반 파일 | `<도메인>.<레이어>.js` (kebab-case) | `todo.controller.js`, `auth.service.js` |
| 프론트엔드 컴포넌트 파일 | PascalCase | `TodoCard.tsx`, `CategoryBadge.tsx` |
| 프론트엔드 훅 파일 | camelCase, `use` 접두사 | `useTodos.ts`, `useAuth.ts` |
| 프론트엔드 스토어 파일 | camelCase, `Store` 접미사 | `authStore.ts`, `uiStore.ts` |
| 프론트엔드 서비스 파일 | camelCase, `Api` 접미사 | `todoApi.ts`, `categoryApi.ts` |
| 타입 정의 파일 | camelCase | `todo.types.ts`, `auth.types.ts` |

### 3.2 함수 및 변수 네이밍

- 함수명은 동사로 시작한다. (예: `createTodo`, `findTodoById`, `validateOwnership`)
- 불리언 변수와 속성은 `is`, `has`, `can` 접두사를 사용한다. (예: `isCompleted`, `hasError`)
- 상수는 UPPER_SNAKE_CASE를 사용한다. (예: `JWT_EXPIRES_IN`, `MAX_TITLE_LENGTH`)
- 컨트롤러 함수는 HTTP 메서드를 반영한다. (예: `getTodos`, `postTodo`, `patchTodoCompletion`)
- Repository 함수는 쿼리 의도를 명시한다. (예: `findAll`, `findById`, `insertOne`, `updateOne`, `deleteById`)

### 3.3 API 엔드포인트 네이밍

- 리소스는 복수 명사로 표현한다. (예: `/todos`, `/categories`)
- 계층 관계는 경로에 반영하지 않는다. 필터링은 쿼리 파라미터로 처리한다. (예: `GET /api/v1/todos?categoryId=xxx&isCompleted=false`)
- 특정 동작을 나타내는 엔드포인트는 리소스 하위 경로에 동사를 사용한다. (예: `PATCH /api/v1/todos/:todoId/complete`)
- 버전은 Base URL에 포함한다. (`/api/v1`)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/auth/register` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| GET | `/api/v1/users/me` | 내 프로필 조회 |
| PATCH | `/api/v1/users/me` | 프로필 수정 |
| DELETE | `/api/v1/users/me` | 회원 탈퇴 |
| GET | `/api/v1/categories` | 카테고리 목록 조회 |
| POST | `/api/v1/categories` | 카테고리 생성 |
| PATCH | `/api/v1/categories/:categoryId` | 카테고리 수정 |
| DELETE | `/api/v1/categories/:categoryId` | 카테고리 삭제 |
| GET | `/api/v1/todos` | 할일 목록 조회 (필터 포함) |
| POST | `/api/v1/todos` | 할일 등록 |
| PATCH | `/api/v1/todos/:todoId` | 할일 수정 |
| PATCH | `/api/v1/todos/:todoId/complete` | 완료 처리 |
| PATCH | `/api/v1/todos/:todoId/reopen` | 완료 취소 |
| DELETE | `/api/v1/todos/:todoId` | 할일 삭제 |

### 3.4 DB 컬럼과 코드 변수 간 네이밍 변환

- DB 컬럼명은 snake_case를 사용한다. (예: `user_id`, `created_at`, `is_completed`)
- JavaScript/TypeScript 코드의 변수명과 객체 속성은 camelCase를 사용한다. (예: `userId`, `createdAt`, `isCompleted`)
- 변환은 Repository 계층에서 담당한다. DB에서 조회한 결과를 camelCase로 변환하여 상위 레이어로 반환하고, 상위 레이어에서 전달받은 camelCase 값을 쿼리에 삽입할 때 snake_case 컬럼명을 명시한다.
- 자동 변환 라이브러리를 사용하지 않는다. 변환 로직을 명시적으로 작성하여 예측 가능성을 유지한다.

---

## 4. 테스트 및 품질 원칙

### 4.1 테스트 전략

**백엔드**

- Service 계층의 비즈니스 로직을 단위 테스트의 주요 대상으로 삼는다. Repository는 목(mock)으로 대체한다.
- API 엔드포인트 전체 흐름(Router → Controller → Service → Repository → DB)은 통합 테스트로 검증한다. 통합 테스트는 별도의 테스트 데이터베이스를 사용한다.
- 인증 미들웨어, 입력 유효성 검증, 소유권 검증은 통합 테스트에서 반드시 포함한다.

**프론트엔드**

- 비즈니스 로직이 포함된 커스텀 훅과 유틸 함수를 단위 테스트의 주요 대상으로 삼는다.
- UI 컴포넌트는 핵심 인터랙션(폼 제출, 완료 토글 등)을 중심으로 통합 테스트를 작성한다.
- E2E 테스트는 v1 MVP 범위에서 별도 도입하지 않는다. API 통합 테스트로 핵심 플로우를 대체한다.

### 4.2 커버리지 목표

- 백엔드 전체 코드 커버리지 80% 이상을 목표로 한다.
- Service 계층은 90% 이상을 목표로 한다.
- Repository 계층은 통합 테스트로 커버한다.

### 4.3 API 테스트 방식

- HTTP 클라이언트 도구(Insomnia, Postman)용 컬렉션 파일을 `server/` 하위에 유지한다.
- 자동화 통합 테스트는 `supertest`를 사용하여 실제 Express 앱 인스턴스를 대상으로 실행한다.
- 테스트 케이스는 정상 흐름(happy path)과 주요 오류 흐름(인증 실패, 소유권 위반, 유효성 오류)을 모두 포함한다.

---

## 5. 설정, 보안, 운영 원칙

### 5.1 환경별 설정 분리

- `NODE_ENV` 값(development, production)에 따라 로그 수준, 에러 응답 상세도, CORS 허용 출처를 다르게 적용한다.
- production 환경에서는 에러 응답에 스택 트레이스를 포함하지 않는다. 스택 트레이스는 서버 로그에만 기록한다.
- development 환경에서는 morgan 등의 HTTP 요청 로거를 활성화하고, production 환경에서는 구조화된 JSON 로그를 사용한다.

### 5.2 JWT 미들웨어 위치 및 소유권 검증 위치

- JWT 검증 미들웨어(`middlewares/auth.js`)는 Router 레이어에서 보호가 필요한 라우트에만 적용한다. 전역 미들웨어로 등록하지 않는다. (회원가입, 로그인 엔드포인트는 인증 불필요)
- 미들웨어는 JWT를 검증하고 `req.user` 객체에 `userId`를 주입하는 역할만 담당한다.
- 소유권 검증(요청자의 userId와 리소스 소유자의 userId 일치 여부)은 Service 계층에서 수행한다. Controller는 소유권 판단 로직을 포함하지 않는다.
- 소유권 불일치 시 Service는 403 Forbidden에 대응하는 오류 객체를 throw하고, Controller는 이를 중앙 에러 핸들러로 전달한다.

### 5.6 클라이언트 토큰 저장 원칙

- JWT는 Zustand `authStore`의 메모리(JavaScript 변수)에만 저장한다.
- `localStorage`, `sessionStorage`, `HTTP Only Cookie`에 토큰을 저장하지 않는다.
- 메모리 저장 방식은 XSS 공격으로 인한 토큰 탈취 위험이 없고 CSRF 공격 대상이 되지 않는다. 다만 페이지 새로고침 또는 브라우저 종료 시 토큰이 초기화되므로 사용자는 재로그인해야 한다.
- `apiClient.ts`의 axios 인터셉터에서 `authStore`의 토큰을 읽어 모든 인증 요청에 `Authorization: Bearer <token>` 헤더를 자동으로 주입한다.
- 401 응답 수신 시 `apiClient.ts` 인터셉터에서 `authStore`를 초기화하고 로그인 화면으로 리다이렉트한다.

### 5.3 pg 쿼리 보안 원칙

- 모든 DB 쿼리는 pg 파라미터 바인딩(`$1, $2, ...`)을 사용한다.
- 사용자 입력값을 문자열 템플릿 리터럴이나 문자열 연결(concatenation)로 쿼리에 삽입하지 않는다.
- 동적 쿼리가 필요한 경우(예: 복합 필터링)에도 WHERE 절의 값은 반드시 파라미터 바인딩을 사용하고, 컬럼명이나 테이블명은 화이트리스트로 검증된 상수 문자열만 허용한다.
- ORM 및 Query Builder 라이브러리를 사용하지 않는다.

### 5.4 로깅 원칙

- 요청 로그에는 메서드, 경로, 응답 상태 코드, 처리 시간을 포함한다.
- 에러 로그에는 에러 코드, 메시지, 스택 트레이스, 요청 식별자(correlation ID)를 포함한다.
- 로그에 비밀번호, JWT 토큰, 개인 식별 정보를 포함하지 않는다.
- 로그 레벨은 `error`, `warn`, `info`, `debug`로 구분하고, production 환경에서는 `info` 이상만 출력한다.

### 5.5 에러 핸들링 원칙

- 에러 핸들링은 Express의 중앙 에러 핸들러 미들웨어(`middlewares/errorHandler.js`) 한 곳에서 처리한다.
- 각 레이어(Service, Repository)는 에러를 직접 HTTP 응답으로 변환하지 않고, 에러 객체를 throw한다. Controller는 try-catch로 잡아 `next(error)`로 전달한다.
- 에러 객체는 `code`(에러 분류 문자열)와 `statusCode`(HTTP 상태 코드)를 포함하는 커스텀 클래스(`AppError`)로 정의한다.
- 모든 에러 응답은 `{ "error": { "code": "...", "message": "..." } }` 형식을 따른다.
- 예상하지 못한 에러(500)는 클라이언트에 내부 구현 정보를 노출하지 않는다.

---

## 6. 백엔드 디렉토리 구조

```
server/
├── src/
│   ├── app.js                  # Express 앱 인스턴스 생성, 미들웨어 및 라우터 등록
│   ├── server.js               # HTTP 서버 시작 진입점, 환경 변수 검증
│   │
│   ├── config/
│   │   └── env.js              # 환경 변수 로드 및 검증, 설정 객체 export
│   │
│   ├── db/
│   │   └── pool.js             # pg Pool 인스턴스 생성 및 export
│   │
│   ├── routes/
│   │   ├── auth.routes.js      # /api/v1/auth 경로 정의, 미들웨어 체인
│   │   ├── user.routes.js      # /api/v1/users 경로 정의
│   │   ├── category.routes.js  # /api/v1/categories 경로 정의
│   │   └── todo.routes.js      # /api/v1/todos 경로 정의
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── category.controller.js
│   │   └── todo.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── category.service.js
│   │   └── todo.service.js
│   │
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── category.repository.js
│   │   └── todo.repository.js
│   │
│   ├── middlewares/
│   │   ├── auth.js             # JWT 검증, req.user 주입
│   │   ├── errorHandler.js     # 중앙 집중식 에러 핸들러
│   │   └── validate.js         # 요청 바디/파라미터 유효성 검증 헬퍼
│   │
│   └── utils/
│       ├── AppError.js         # 커스텀 에러 클래스 (code, statusCode 포함)
│       ├── jwt.js              # JWT 발급 및 검증 헬퍼
│       └── hash.js             # bcrypt 해시 생성 및 비교 헬퍼
│
├── tests/
│   ├── unit/
│   │   └── services/           # Service 단위 테스트
│   └── integration/
│       └── api/                # API 엔드포인트 통합 테스트
│
├── .env.example
├── .env.development
├── package.json
└── jsconfig.json
```

**디렉토리별 역할 요약**

| 디렉토리 | 역할 |
|----------|------|
| `config/` | 환경 변수를 한 곳에서 로드하고 검증한다. 나머지 파일은 이 모듈에서 설정값을 가져온다 |
| `db/` | pg Pool을 단일 인스턴스로 관리한다. 커넥션 설정은 이 파일에만 존재한다 |
| `routes/` | 경로 매핑과 미들웨어 적용(인증 여부, 유효성 검증)을 선언한다 |
| `controllers/` | req/res 처리와 응답 직렬화를 담당한다 |
| `services/` | 비즈니스 규칙과 소유권 검증을 처리한다 |
| `repositories/` | SQL 쿼리 실행과 결과 변환(snake_case to camelCase)을 담당한다 |
| `middlewares/` | Express 미들웨어 함수들을 보관한다 |
| `utils/` | 특정 레이어에 속하지 않는 재사용 가능한 헬퍼 함수를 보관한다 |

---

## 7. 프론트엔드 디렉토리 구조

```
client/
├── src/
│   ├── main.tsx                # Vite 진입점, ReactDOM.createRoot, QueryClientProvider, BrowserRouter
│   ├── App.tsx                 # 라우트 설정, 전역 레이아웃, 인증 가드 구성
│   │
│   ├── router/
│   │   └── index.tsx           # React Router v6 라우트 정의, 보호 라우트(PrivateRoute) 컴포넌트
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── TodoListPage.tsx
│   │   ├── CategoryPage.tsx
│   │   └── ProfilePage.tsx
│   │
│   ├── components/
│   │   ├── common/             # 도메인에 무관한 공통 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── todo/               # 할일 도메인 컴포넌트
│   │   │   ├── TodoCard.tsx
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoForm.tsx
│   │   │   └── TodoFilterPanel.tsx
│   │   ├── category/           # 카테고리 도메인 컴포넌트
│   │   │   ├── CategoryBadge.tsx
│   │   │   ├── CategoryList.tsx
│   │   │   └── CategoryForm.tsx
│   │   └── layout/             # 페이지 레이아웃 컴포넌트
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── BottomNav.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # 인증 상태 및 로그인/로그아웃 액션
│   │   ├── useTodos.ts         # 할일 목록 조회, 필터 파라미터 관리 (TanStack Query)
│   │   ├── useTodoMutations.ts # 할일 생성/수정/삭제/완료 (TanStack Query useMutation)
│   │   ├── useCategories.ts    # 카테고리 목록 조회
│   │   └── useCategoryMutations.ts
│   │
│   ├── services/
│   │   ├── apiClient.ts        # axios 인스턴스, 베이스 URL, 인터셉터(토큰 주입, 401 처리)
│   │   ├── authApi.ts
│   │   ├── todoApi.ts
│   │   ├── categoryApi.ts
│   │   └── userApi.ts
│   │
│   ├── store/
│   │   ├── authStore.ts        # 인증 토큰, 사용자 정보, 로그인/로그아웃 액션
│   │   └── uiStore.ts          # 모달 열림 상태, 필터 UI 상태 등 클라이언트 전용 UI 상태
│   │
│   ├── query-keys/
│   │   └── index.ts            # TanStack Query 쿼리 키 상수 및 팩토리 함수 중앙 관리
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── todo.types.ts
│   │   ├── category.types.ts
│   │   └── api.types.ts        # 공통 API 응답 타입, 에러 응답 타입
│   │
│   └── utils/
│       ├── dateFormatter.ts    # ISO 8601 날짜 포맷 변환 유틸
│       └── validators.ts       # 클라이언트 측 입력 유효성 검증 함수
│
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```

**디렉토리별 역할 요약**

| 디렉토리 | 역할 |
|----------|------|
| `pages/` | 라우트와 1:1 대응하는 최상위 화면 컴포넌트. 레이아웃 조합과 데이터 패칭 훅 호출을 담당한다 |
| `components/common/` | 도메인에 독립적인 재사용 UI 컴포넌트. 외부 상태에 의존하지 않는다 |
| `components/<domain>/` | 특정 도메인의 UI 컴포넌트. 도메인 훅을 사용하거나 props로 데이터를 받는다 |
| `hooks/` | TanStack Query의 `useQuery`/`useMutation` 호출을 캡슐화한다. 컴포넌트에서 서버 상태 관리 코드를 분리하는 핵심 계층이다 |
| `services/` | 백엔드 API와의 HTTP 통신을 담당한다. 훅에서만 호출한다 |
| `store/` | Zustand 스토어. 서버 상태는 TanStack Query로 관리하고, 이 스토어는 토큰/사용자 정보 등 클라이언트 고유 전역 상태만 보관한다 |
| `query-keys/` | TanStack Query의 쿼리 키를 한 파일에서 관리한다. 캐시 무효화(invalidation) 시 키 불일치를 방지하기 위해 상수 및 팩토리 함수로 정의한다 |
| `types/` | 백엔드 응답 구조와 프론트엔드 도메인 모델을 TypeScript 인터페이스로 정의한다 |
| `utils/` | 레이어에 귀속되지 않는 순수 함수 유틸리티를 보관한다 |

**Zustand 스토어 분리 원칙**

- 스토어는 도메인 또는 관심사별로 파일을 분리한다. 단일 전역 스토어에 모든 상태를 몰아넣지 않는다.
- `authStore`는 JWT 토큰과 인증된 사용자 정보를 메모리에 보관한다. 토큰은 `localStorage`·`sessionStorage`·쿠키에 저장하지 않는다. 할일, 카테고리 등 서버 데이터를 Zustand에 저장하지 않는다. (서버 상태는 TanStack Query가 담당한다)
- `uiStore`는 서버 데이터와 무관한 UI 상태(모달 표시 여부, 슬라이드 패널 열림 상태 등)를 보관한다.

**TanStack Query 쿼리 키 관리 원칙**

- 모든 쿼리 키는 `src/query-keys/index.ts`에서 중앙 관리한다.
- 쿼리 키는 팩토리 패턴으로 정의한다. (예: `todoKeys.list(filters)`, `todoKeys.detail(todoId)`)
- mutation 성공 후 캐시 무효화는 쿼리 키 팩토리를 사용하여 일관되게 처리한다.

---

## 8. 주요 파일 역할 정의

### 8.1 백엔드

**`src/app.js`**

Express 앱 인스턴스를 생성하고 내보내는 파일이다. `server.js`에서 포트 바인딩과 분리되어 통합 테스트 시 서버 시작 없이 앱 인스턴스를 임포트할 수 있어야 한다. JSON 파싱 미들웨어, CORS 설정, morgan 로거, 라우터 등록, 중앙 에러 핸들러를 이 파일에서 순서대로 등록한다.

**`src/server.js`**

HTTP 서버를 시작하는 진입점이다. 서버 시작 전 필수 환경 변수(DB 연결 정보, JWT_SECRET 등)를 검증하고, 검증 실패 시 프로세스를 종료한다. `app.js`를 import하여 `app.listen()`을 호출한다. 이 파일은 비즈니스 로직을 포함하지 않는다.

**`src/db/pool.js`**

`pg.Pool` 인스턴스를 생성하고 export하는 파일이다. 커넥션 풀 설정(최대 연결 수, idle timeout 등)은 이 파일에만 존재한다. 애플리케이션 전체에서 이 단일 인스턴스를 공유하여 커넥션을 재사용한다.

**`src/middlewares/auth.js`**

Authorization 헤더에서 Bearer 토큰을 추출하고 JWT를 검증하는 미들웨어다. 검증 성공 시 `req.user = { userId }` 형태로 사용자 정보를 주입하고 `next()`를 호출한다. 검증 실패 시 `next(new AppError('UNAUTHORIZED', 401))`를 호출하여 중앙 에러 핸들러로 전달한다. 이 미들웨어는 토큰 검증만 담당하며, 리소스 소유권 검증은 담당하지 않는다.

### 8.2 프론트엔드

**`src/main.tsx`**

Vite의 빌드 진입점이다. `ReactDOM.createRoot()`로 React 19 앱을 마운트하고, `QueryClientProvider`(TanStack Query), `BrowserRouter`(React Router)를 이 파일에서 래핑한다. 전역 제공자(Provider)를 중첩하는 구성이 이 파일에 집중된다.

**`src/App.tsx`**

라우터 컴포넌트(`src/router/index.tsx`)를 렌더링하고 전역 레이아웃을 적용하는 파일이다. 인증 상태에 따른 리다이렉트 처리(인증 가드)를 이 파일 또는 `router/index.tsx`에서 담당한다. 개별 페이지 로직을 포함하지 않는다.

**`src/router/index.tsx`**

React Router v6의 라우트 구성을 정의한다. 공개 라우트(로그인, 회원가입)와 보호 라우트(할일 목록, 카테고리 관리, 프로필)를 명시적으로 분리한다. `PrivateRoute` 컴포넌트는 `authStore`에서 인증 상태를 확인하여 미인증 사용자를 로그인 페이지로 리다이렉트한다. 라우트 경로 문자열은 상수로 정의하여 하드코딩을 방지한다.
