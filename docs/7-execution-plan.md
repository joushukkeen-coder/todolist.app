# TodoListApp 실행 계획서

> 버전: 2.0.0
> 작성일: 2026-05-13
> 참조: PRD v1.0.2, docs/4-project-principles.md, docs/6-erd.md, database/schema.sql

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 2.0.0 | 2026-05-13 | joushukkeen | DB·백엔드·프론트엔드 3개 도메인 병렬 분석 기반 재작성 |

---

## 1. 전체 개요

| 도메인 | 태스크 수 | 태스크 ID 범위 |
|--------|-----------|---------------|
| 데이터베이스 | 8 | DB-01 ~ DB-08 |
| 백엔드 | 15 | BE-01 ~ BE-15 |
| 프론트엔드 | 12 | FE-01 ~ FE-12 |
| **합계** | **35** | |

### 핵심 제약 사항

- JWT는 반드시 Zustand `authStore` 메모리에만 저장 (`localStorage`·`sessionStorage`·`Cookie` 금지)
- PostgreSQL 연동은 `pg` 라이브러리 직접 사용 (ORM/Query Builder 금지)
- 모든 SQL은 파라미터 바인딩(`$1, $2, ...`)을 사용하고 동적 쿼리 생성 금지
- 백엔드 레이어 구조: Router → Controller → Service → Repository → DB
- 소유권 검증은 Service 계층에서만 수행

---

## 2. 데이터베이스 태스크

### DB-01: PostgreSQL 17 로컬 개발 환경 설정

**설명**: 로컬 머신에 PostgreSQL 17을 설치하고 애플리케이션 전용 데이터베이스와 사용자 계정을 생성한다.
**의존성**: 없음

**완료 조건**:
- [x] `psql --version` 명령 실행 시 `psql (PostgreSQL) 17.x` 출력 확인
- [x] `todolistapp_dev` 데이터베이스 생성 후 `psql -l` 목록에 표시 확인
- [x] 전용 DB 사용자(`todoapp_user`) 생성 후 CONNECT·CREATE 권한 부여 확인
- [x] `psql -U todoapp_user -d todolistapp_dev` 접속 명령이 오류 없이 진입 확인
- [x] pgcrypto 익스텐션(`gen_random_uuid()`) 사용을 위한 contrib 패키지 설치 확인

---

### DB-02: .env DB 연결 정보 설정

**설명**: `server/.env.development`에 PostgreSQL 접속 환경 변수를 정의하고 `.env.example`에 키 목록을 기재한다.
**의존성**: DB-01

**완료 조건**:
- [x] `server/.env.development`에 `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` 키 모두 존재
- [x] `server/.env.example`에 동일 키가 플레이스홀더로 기재됨
- [x] `.gitignore`에 `.env.development`, `.env.production` 등록되어 `git status`에서 추적 제외
- [x] `DB_PORT` 기본값 `5432` 설정
- [x] `DB_NAME` 값이 DB-01의 `todolistapp_dev`와 일치

---

### DB-03: schema.sql 실행 및 테이블 생성 검증

**설명**: `database/schema.sql`을 대상 DB에 실행하여 3개 테이블·익스텐션·트리거 함수가 생성되는지 검증한다.
**의존성**: DB-01, DB-02

**완료 조건**:
- [x] `psql -U todoapp_user -d todolistapp_dev -f database/schema.sql` 실행이 오류 없이 완료
- [x] `\dt` 명령으로 `users`, `categories`, `todos` 테이블 3개 확인
- [x] `SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';` 결과 1행 확인
- [x] `\df set_updated_at` 명령으로 트리거 함수 존재 확인
- [x] schema.sql 재실행 시 멱등성 확인(`CREATE OR REPLACE`, `IF NOT EXISTS` 동작)

---

### DB-04: 제약조건 및 외래키 검증

**설명**: PK·UNIQUE·FK·CHECK 제약조건이 의도대로 동작하는지 SQL로 직접 검증한다.
**의존성**: DB-03

**완료 조건**:
- [x] `users.email` UNIQUE 위반 INSERT 시 `duplicate key value` 오류 발생
- [x] 존재하지 않는 `user_id`로 categories INSERT 시 FK 위반 오류 발생
- [x] `users` 행 DELETE 시 연결된 todos가 `ON DELETE CASCADE`로 자동 삭제 확인
- [x] 할일이 연결된 categories DELETE 시 `ON DELETE RESTRICT` 오류 발생 (BR-C-03)
- [x] `title = ''` INSERT 시 `chk_todos_title_length` 위반 오류 발생
- [x] `\d+ todos` 출력에서 위 제약조건 이름이 모두 표시

---

### DB-05: 기본 카테고리 Seed 데이터 검증

**설명**: schema.sql의 INSERT로 삽입된 시스템 기본 카테고리 3건이 올바른 값으로 저장되었는지 검증한다.
**의존성**: DB-03

**완료 조건**:
- [x] `SELECT name, color_code, is_default, user_id FROM categories ORDER BY name;` 결과 3행 반환
- [x] `개인 / #4A90D9 / TRUE / NULL`, `업무 / #E8503A / TRUE / NULL`, `쇼핑 / #2ECC71 / TRUE / NULL` 값 일치
- [x] 모든 기본 카테고리의 `user_id`가 NULL
- [x] 모든 기본 카테고리의 `is_default`가 TRUE
- [x] `category_id`가 UUID 형식으로 저장

---

### DB-06: 인덱스 생성 검증

**설명**: schema.sql의 5개 인덱스가 정상 생성되었고 쿼리 플래너가 인덱스를 활용하는지 검증한다.
**의존성**: DB-03

**완료 조건**:
- [x] `pg_indexes` 조회 결과에 `idx_todos_user_id`, `idx_todos_category_id`, `idx_todos_is_completed`, `idx_todos_due_date`, `idx_categories_user_id` 5개 모두 포함
- [x] `idx_todos_due_date`가 부분 인덱스(`WHERE due_date IS NOT NULL`)로 생성
- [x] 테스트 데이터 삽입 후 `EXPLAIN SELECT * FROM todos WHERE user_id = $1` 결과에 `Index Scan` 포함

---

### DB-07: 트리거 함수(updated_at 자동 갱신) 동작 검증

**설명**: `users`와 `todos`의 BEFORE UPDATE 트리거가 `updated_at`을 NOW()로 자동 갱신하는지 검증한다.
**의존성**: DB-03, DB-05

**완료 조건**:
- [x] users 테스트 행 INSERT 후 1초 경과한 뒤 UPDATE 실행 시 `updated_at > created_at` 확인
- [x] todos 테이블에서 동일 방식으로 트리거 동작 확인
- [x] `\d+ users`, `\d+ todos` 출력에 `trg_users_updated_at`, `trg_todos_updated_at` 트리거 이름 확인
- [x] `\d categories` 결과에 `updated_at` 컬럼·트리거가 없음 확인 (ERD 명세 준수)

---

### DB-08: pg Pool 연결 구현 검증

**설명**: `server/src/db/pool.js`에 pg.Pool 단일 인스턴스를 구현하고 애플리케이션 시작 시 DB 연결 성공을 검증한다.
**의존성**: DB-02, DB-03

**완료 조건**:
- [x] `server/src/db/pool.js`에 `pg.Pool` 인스턴스가 생성되고 단일 인스턴스로 export
- [x] `max`, `idleTimeoutMillis`, `connectionTimeoutMillis` 옵션 명시
- [x] 연결 정보는 `config/env.js`를 통해 주입되며 하드코딩 없음
- [x] `pool.query('SELECT 1')` 핑 쿼리로 DB 연결 성공 확인
- [x] 잘못된 자격 증명 설정 시 서버 기동이 종료되거나 오류 로그 출력
- [x] 애플리케이션 전체에서 동일 Pool 인스턴스 공유 확인

---

## 3. 백엔드 태스크

### BE-01: 프로젝트 초기화

**설명**: `server/` 디렉토리에 Node.js + Express 프로젝트를 생성하고 디렉토리 구조·환경 변수 체계를 확립한다.
**의존성**: 없음

**완료 조건**:
- [x] `server/package.json` 생성, 모듈 시스템 결정 명시
- [x] 의존성 설치: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cors`, `morgan`
- [x] 개발 의존성 설치: `jest`, `supertest`, `nodemon`
- [x] `server/src/` 하위에 `config/`, `db/`, `routes/`, `controllers/`, `services/`, `repositories/`, `middlewares/`, `utils/` 디렉토리 생성
- [x] `server/tests/unit/services/`, `server/tests/integration/api/` 생성
- [x] `.env.example`에 `NODE_ENV`, `PORT`, DB 키, `JWT_SECRET`, `JWT_EXPIRES_IN` 모두 기재
- [x] `.env.development`에 실제 개발 값 설정 (`.gitignore` 등록 확인)
- [x] `config/env.js`가 필수 환경 변수 누락 시 `process.exit(1)` 실행
- [x] `app.js`가 JSON 파싱·CORS·morgan·라우터·에러 핸들러를 순서대로 등록
- [x] `server.js`가 `app.js`를 import하여 `app.listen()`만 담당
- [x] `npm run dev` 실행 시 서버 정상 기동·포트 출력

---

### BE-02: pg Pool 설정

**설명**: `pg.Pool` 단일 인스턴스를 생성·export하여 애플리케이션 전체가 커넥션을 공유하도록 구성한다.
**의존성**: BE-01

**완료 조건**:
- [x] `server/src/db/pool.js`에 `pg.Pool` 인스턴스 생성 및 export
- [x] 풀 설정값(`max`, `idleTimeoutMillis`, `connectionTimeoutMillis`) 명시
- [x] DB 연결 정보를 `config/env.js`에서 가져옴 (하드코딩 금지)
- [x] 서버 시작 시 `pool.query('SELECT 1')` 핑 쿼리로 연결 확인 및 실패 시 에러 로그
- [x] Repository 외 레이어에서 pool을 직접 import하지 않음
- [x] graceful shutdown에 `pool.end()` 호출 포함

---

### BE-03: 공통 미들웨어 구현 (AppError, errorHandler, JWT 검증)

**설명**: 전체 API에서 공유하는 커스텀 에러 클래스, 중앙 에러 핸들러, JWT 검증 미들웨어를 구현한다.
**의존성**: BE-01

**완료 조건**:
- [x] `utils/AppError.js`: `code`, `statusCode`, `message`를 인자로 받는 커스텀 Error 클래스
- [x] `utils/jwt.js`: `signToken(payload)`, `verifyToken(token)` 함수, `JWT_EXPIRES_IN` 환경 변수 적용
- [x] `utils/hash.js`: `hashPassword` (salt rounds ≥ 10), `comparePassword` 함수
- [x] `middlewares/errorHandler.js`: 4-argument 에러 핸들러
  - AppError 인스턴스는 해당 statusCode·code로 응답
  - 예상치 못한 에러는 500 / `INTERNAL_SERVER_ERROR`
  - 응답 형식 `{ "error": { "code": "...", "message": "..." } }`
  - production 환경에서 스택 트레이스 응답 포함 금지
- [x] `middlewares/auth.js`: `Authorization: Bearer <token>` 파싱·검증
  - 성공 시 `req.user = { userId }` 주입
  - 헤더 누락/만료/위변조 시 `AppError('UNAUTHORIZED', 401)`
  - 전역 미들웨어로 등록하지 않고 라우트 단위 적용
- [x] `app.js`의 마지막에 errorHandler 등록

---

### BE-04: 입력값 유효성 검증 미들웨어

**설명**: 요청 바디·파라미터·쿼리의 유효성을 검증하는 팩토리 미들웨어를 구현한다.
**의존성**: BE-03

**완료 조건**:
- [x] `middlewares/validate.js`가 검증 스키마를 받아 미들웨어를 반환하는 팩토리 함수
- [x] 검증 실패 시 HTTP 400 / `VALIDATION_ERROR`, 실패 사유를 message에 포함
- [x] 다음 규칙 검증 가능: 이메일 형식, 비밀번호 ≥8자, 제목 1~200자, `#RRGGBB` 색상 코드, UUID
- [x] 각 라우트에서 validate 미들웨어가 Controller 핸들러보다 먼저 체인에 등록

---

### BE-05: Auth API - 회원가입 (US-U-01)

**설명**: `POST /api/v1/auth/register` 엔드포인트로 이메일·비밀번호 기반 계정 생성을 처리한다.
**의존성**: BE-02, BE-03, BE-04, DB-08

**완료 조건**:
- [x] 라우트 `POST /api/v1/auth/register` (인증 미들웨어 미적용)
- [x] 정상 응답 HTTP **201 Created**, 응답에 `userId`, `email`, `name`, `createdAt` 포함
- [x] 이메일 중복 시 HTTP 409 / `EMAIL_ALREADY_EXISTS` (BR-U-01)
- [x] 비밀번호 8자 미만 시 HTTP 400 / `VALIDATION_ERROR` (BR-U-02)
- [x] 비밀번호는 bcrypt 해시 저장, 평문 미저장
- [x] `auth_provider` 컬럼에 `'local'` 저장
- [x] `user_id`는 `gen_random_uuid()`로 생성
- [x] `user.repository.js`의 `insertOne`이 파라미터 바인딩 사용
- [x] 응답에 `password_hash` 미포함

---

### BE-06: Auth API - 로그인 (US-U-02)

**설명**: `POST /api/v1/auth/login` 엔드포인트로 자격 증명 검증 후 JWT Access Token을 발급한다.
**의존성**: BE-02, BE-03, BE-04, DB-08

**완료 조건**:
- [x] 라우트 `POST /api/v1/auth/login` (인증 미들웨어 미적용)
- [x] 정상 응답 HTTP **200 OK**, `accessToken`과 `user` 객체 반환
- [x] 이메일 미존재·비밀번호 불일치 모두 HTTP 401 / `INVALID_CREDENTIALS` (사용자 열거 방지)
- [x] JWT payload에 `userId` 포함, 유효기간 `JWT_EXPIRES_IN`(기본 1시간) 적용
- [x] 원문 비밀번호가 로그에 미기록
- [x] 응답에 `password_hash` 미포함

---

### BE-07: Users API - 프로필 수정 (US-U-03)

**설명**: `PATCH /api/v1/users/me` 엔드포인트로 인증된 사용자의 이름 또는 비밀번호를 수정한다.
**의존성**: BE-03, BE-04, BE-05

**완료 조건**:
- [x] 라우트 `PATCH /api/v1/users/me` (JWT 인증 미들웨어 적용)
- [x] 정상 응답 HTTP **200 OK**, 갱신된 user 객체 반환
- [x] 이메일 변경 요청 시 HTTP 400 / `EMAIL_CHANGE_NOT_ALLOWED`
- [x] 비밀번호 변경 시 `currentPassword` 검증 후 `newPassword`를 bcrypt 해시로 업데이트
- [x] 현재 비밀번호 불일치 시 HTTP 401 / `INVALID_CURRENT_PASSWORD`
- [x] `newPassword` 8자 미만 시 HTTP 400 / `VALIDATION_ERROR`
- [x] 이름·비밀번호 동시 변경 허용
- [x] 변경된 필드만 UPDATE, `updated_at` 자동 갱신
- [x] 응답에 `password_hash` 미포함

---

### BE-08: Users API - 회원 탈퇴 (US-U-04)

**설명**: `DELETE /api/v1/users/me` 엔드포인트로 인증된 사용자와 연관 데이터를 즉시 영구 삭제한다.
**의존성**: BE-03, BE-05

**완료 조건**:
- [x] 라우트 `DELETE /api/v1/users/me` (JWT 인증 미들웨어 적용)
- [x] 정상 응답 HTTP **204 No Content** (바디 없음)
- [x] 해당 사용자의 todos, categories(`user_id = userId`), users 레코드 모두 삭제 (DB CASCADE 활용 또는 명시적 순서)
- [x] 영구 삭제, 소프트 삭제 없음 (PRD §4.4)
- [x] `req.user.userId` 기준 본인 데이터만 삭제 (Service 계층 소유권 검증)
- [x] 삭제 후 동일 JWT 재요청 시 401 또는 404 반환

---

### BE-09: Categories API - 목록 조회 + 생성 (US-C-01)

**설명**: `GET /api/v1/categories` 목록 조회와 `POST /api/v1/categories` 생성 엔드포인트를 구현한다.
**의존성**: BE-03, BE-04

**완료 조건**:
- [x] 두 엔드포인트 모두 JWT 인증 미들웨어 적용
- [x] `GET` 정상 응답 HTTP **200 OK**, 기본 카테고리(`is_default = true`) + 본인 소유 카테고리만 반환
- [x] 타 사용자의 카테고리는 응답에 미포함
- [x] `POST` 정상 응답 HTTP **201 Created**, 생성된 카테고리 반환
- [x] 동일 사용자가 같은 `name` 보유 시 HTTP 409 / `CATEGORY_NAME_DUPLICATE` (BR-C-02)
- [x] `colorCode` 형식 오류 시 HTTP 400 / `VALIDATION_ERROR`
- [x] Repository: `findAllByUserId`, `insertOne` 구현, 파라미터 바인딩 사용
- [x] snake_case → camelCase 변환은 Repository 계층에서 수행

---

### BE-10: Categories API - 수정 + 삭제 (US-C-02, US-C-03)

**설명**: `PATCH /api/v1/categories/:categoryId` 수정과 `DELETE /api/v1/categories/:categoryId` 삭제 엔드포인트를 구현한다.
**의존성**: BE-03, BE-04, BE-09

**완료 조건**:
- [x] 두 엔드포인트 모두 JWT 인증 미들웨어 적용
- [x] `PATCH` 정상 응답 HTTP **200 OK**
- [x] `is_default = true` 카테고리 수정 시도 시 HTTP 403 / `DEFAULT_CATEGORY_IMMUTABLE` (BR-C-01)
- [x] 타인 카테고리 수정 시도 시 HTTP 403 / `FORBIDDEN` (BR-C-04)
- [x] 수정 후 이름 중복 시 HTTP 409 / `CATEGORY_NAME_DUPLICATE`
- [x] `DELETE` 정상 응답 HTTP **204 No Content**
- [x] `is_default = true` 카테고리 삭제 시도 시 HTTP 403 / `DEFAULT_CATEGORY_IMMUTABLE`
- [x] 연결된 todos 존재 시 HTTP 409 / `CATEGORY_HAS_TODOS` (BR-C-03)
- [x] 타인 카테고리 삭제 시도 시 HTTP 403 / `FORBIDDEN`
- [x] 소유권 및 기본 카테고리 검증은 Service 계층에서 수행

---

### BE-11: Todos API - 등록 + 목록 조회 (US-T-01, US-T-02)

**설명**: `POST /api/v1/todos` 등록과 `GET /api/v1/todos` 목록 조회 엔드포인트를 구현한다.
**의존성**: BE-03, BE-04, BE-09

**완료 조건**:
- [x] 두 엔드포인트 모두 JWT 인증 미들웨어 적용
- [x] `POST` 정상 응답 HTTP **201 Created**, 생성된 todo 객체 반환
- [x] `title` 누락·빈 문자열·200자 초과 시 HTTP 400 / `VALIDATION_ERROR` (BR-T-01)
- [x] `categoryId` 누락 시 HTTP 400 / `VALIDATION_ERROR` (BR-T-02)
- [x] 존재하지 않거나 접근 불가 `categoryId` 시 HTTP 404 / `CATEGORY_NOT_FOUND`
- [x] 등록 시 `is_completed = false`, `completed_at = NULL` 초기화
- [x] `GET` 정상 응답 HTTP **200 OK**, 본인 소유 todos만 반환 (BR-T-04)
- [x] 기본 정렬 `created_at DESC` (BR-F-03)
- [x] Repository: `insertOne`, `findAllByUserId` 구현, 파라미터 바인딩 사용

---

### BE-12: Todos API - 수정 + 삭제 (US-T-03, US-T-06)

**설명**: `PATCH /api/v1/todos/:todoId` 수정과 `DELETE /api/v1/todos/:todoId` 삭제 엔드포인트를 구현한다.
**의존성**: BE-03, BE-04, BE-11

**완료 조건**:
- [x] 두 엔드포인트 모두 JWT 인증 미들웨어 적용
- [x] `PATCH` 정상 응답 HTTP **200 OK**, 수정된 todo 객체 반환
- [x] 존재하지 않는 todoId 시 HTTP 404 / `TODO_NOT_FOUND`
- [x] 타인 todo 수정 시도 시 HTTP 403 / `FORBIDDEN` (BR-T-04)
- [x] `title` 200자 초과 시 HTTP 400 / `VALIDATION_ERROR` (BR-T-01)
- [x] 변경 필드만 UPDATE, `updated_at` 자동 갱신
- [x] `DELETE` 정상 응답 HTTP **204 No Content**
- [x] 타인 todo 삭제 시도 시 HTTP 403 / `FORBIDDEN`
- [x] 영구 삭제, 소프트 삭제 없음
- [x] 소유권 검증은 `todo.service.js`에서 수행

---

### BE-13: Todos API - 완료 처리 + 완료 취소 (US-T-04, US-T-05)

**설명**: `PATCH /api/v1/todos/:todoId/complete` 완료 처리와 `PATCH /api/v1/todos/:todoId/reopen` 완료 취소 엔드포인트를 구현한다.
**의존성**: BE-03, BE-11

**완료 조건**:
- [x] 두 엔드포인트 모두 JWT 인증 미들웨어 적용
- [x] `/complete` 정상 응답 HTTP **200 OK**, `is_completed = true`, `completed_at = NOW()` 업데이트
- [x] `/reopen` 정상 응답 HTTP **200 OK**, `is_completed = false`, `completed_at = NULL` 업데이트 (BR-T-03)
- [x] 이미 완료된 todo에 `/complete` 시 HTTP 409 / `TODO_ALREADY_COMPLETED`
- [x] 이미 미완료인 todo에 `/reopen` 시 HTTP 409 / `TODO_NOT_COMPLETED`
- [x] 타인 todo 시도 시 HTTP 403 / `FORBIDDEN`
- [x] 소유권 및 상태 검증은 Service 계층에서 수행

---

### BE-14: Todos API - 필터링 (US-T-07)

**설명**: `GET /api/v1/todos`에 카테고리·기간·완료 여부 복합 필터 쿼리 파라미터를 추가 구현한다.
**의존성**: BE-11

**완료 조건**:
- [x] 쿼리 파라미터 지원: `categoryId`(UUID), `isCompleted`(boolean), `dueDateFrom`/`dueDateTo`(ISO 8601 date)
- [x] 정상 응답 HTTP **200 OK**, 필터링된 목록 반환
- [x] 복합 조건은 AND로 결합 (BR-F-01)
- [x] 기간 필터 적용 시 `due_date IS NULL`인 할일은 결과에서 제외 (BR-F-02)
- [x] 필터 파라미터 없으면 전체 목록 반환 (BR-F-03)
- [x] 잘못된 형식의 파라미터 시 HTTP 400 / `VALIDATION_ERROR`
- [x] 동적 WHERE 절 생성 시 값은 파라미터 바인딩 사용, 컬럼명은 화이트리스트 상수
- [x] Repository: `findAllByUserId(userId, filters)` 동적 쿼리 구현

---

### BE-15: 통합 테스트 및 서비스 단위 테스트

**설명**: 전체 API 통합 테스트와 Service 계층 단위 테스트를 작성하여 커버리지 목표를 달성한다.
**의존성**: BE-05 ~ BE-14

**완료 조건**:
- [x] `jest` + `supertest` 설정 완료 (`npm test` 동작)
- [x] 통합 테스트용 별도 DB 설정 (`.env.test` 또는 `globalSetup`/`globalTeardown`)
- [x] 각 테스트 전후 테이블 초기화·정리
- [x] 통합 테스트 파일: `auth.test.js`, `users.test.js`, `categories.test.js`, `todos.test.js`
- [x] 각 엔드포인트에 정상 흐름·인증 실패·소유권 위반·유효성 오류·BR 위반 케이스 포함
- [x] 단위 테스트 파일: 각 Service에 대응 (Repository는 `jest.mock()`으로 대체)
- [x] Service 단위 테스트 커버: 이메일 중복, 소유권 검증, 기본 카테고리 변경 불가, 완료 상태 중복 변경 방지, 기간 필터 NULL 제외
- [x] `jest --coverage` 결과: 전체 80% 이상, Service 계층 90% 이상 (PRD §4.2)
- [x] Insomnia 또는 Postman 컬렉션 파일이 `server/` 하위에 존재

---

## 4. 프론트엔드 태스크

### FE-01: 프로젝트 초기화 및 디렉토리 구조 구성

**설명**: Vite + React 19 + TypeScript 기반으로 `client/` 디렉토리를 생성하고 프로젝트 원칙에 따른 폴더 구조·개발 환경 설정을 완료한다.
**의존성**: 없음

**완료 조건**:
- [x] `client/src/` 하위에 `pages/`, `components/common/`, `components/todo/`, `components/category/`, `components/layout/`, `hooks/`, `services/`, `store/`, `query-keys/`, `types/`, `utils/`, `router/` 모두 생성
- [x] `vite.config.ts`에 경로 별칭(`@/` → `src/`) 설정
- [x] `tsconfig.json`에 `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess` 활성화
- [x] ESLint + Prettier + `eslint-config-prettier` 설치 및 `.eslintrc` 작성
- [x] `lint-staged` + `husky`로 커밋 전 자동 포맷 동작
- [x] `VITE_API_BASE_URL` 등 `VITE_` 접두사만 사용하는 `.env.example` 작성
- [x] `npm run dev` 실행 시 Vite 개발 서버 정상 기동
- [x] `tsc --noEmit` 타입 검사 통과

---

### FE-02: 공통 타입·apiClient·authStore·QueryClient 설정

**설명**: 공유 TypeScript 타입과 axios `apiClient`, Zustand `authStore`/`uiStore`, TanStack Query 클라이언트를 구성한다.
**의존성**: FE-01

**완료 조건**:
- [x] `types/auth.types.ts`, `todo.types.ts`, `category.types.ts`, `api.types.ts` 작성 (camelCase 반영)
- [x] `services/apiClient.ts`의 axios 인스턴스가 `VITE_API_BASE_URL` 사용
- [x] 요청 인터셉터: `authStore` 토큰을 `Authorization: Bearer <token>`로 자동 주입
- [x] 응답 인터셉터: 401 수신 시 `authStore.clearAuth()` 후 `/login` 리다이렉트
- [x] `store/authStore.ts`: `token`, `user`, `setAuth()`, `clearAuth()` 구현
- [x] **JWT는 `authStore` 메모리에만 저장 — `localStorage`, `sessionStorage`, `Cookie` 호출 코드 없음** (PRD §4.3)
- [x] `store/uiStore.ts`: 모달·UI 상태 관리
- [x] `query-keys/index.ts`: `todoKeys`, `categoryKeys` 팩토리 함수 정의
- [x] `main.tsx`에서 `QueryClientProvider`와 `BrowserRouter` 올바른 순서로 래핑

---

### FE-03: 라우터 설정 및 PrivateRoute 인증 가드

**설명**: React Router v6 기반으로 공개/보호 라우트를 분리하고 미인증 사용자를 로그인으로 리다이렉트하는 `PrivateRoute`를 구현한다.
**의존성**: FE-02

**완료 조건**:
- [x] `router/index.tsx`에 공개 라우트(`/login`, `/register`)·보호 라우트(`/`, `/categories`, `/profile`) 분리 정의
- [x] 라우트 경로 문자열 상수화 (하드코딩 없음)
- [x] `PrivateRoute`가 `authStore` 토큰 유무로 미인증 시 `<Navigate to="/login" />`
- [x] 인증 사용자가 `/login`·`/register` 접근 시 `/`로 리다이렉트
- [x] 페이지 새로고침 시 `authStore` 초기화 → 로그인 페이지 이동 (메모리 저장 특성)
- [x] `App.tsx`가 `router/index.tsx`만 렌더링

---

### FE-04: 공통 UI 컴포넌트 구현

**설명**: 도메인 독립적 공통 컴포넌트(`Button`, `Input`, `Modal`, `Spinner`, `ErrorMessage`)를 TypeScript props와 함께 구현한다.
**의존성**: FE-01

**완료 조건**:
- [x] `Button.tsx`: `variant`(primary/secondary/danger), `size`, `disabled`, `isLoading` props, 로딩 시 Spinner 표시·클릭 비활성화
- [x] `Input.tsx`: `label`, `error`, `type`, `value`, `onChange` props, error 전달 시 에러 스타일·메시지 표시
- [x] `Modal.tsx`: `isOpen`, `onClose`, `title`, `children` props, 오버레이 클릭·ESC 키로 닫힘
- [x] `Spinner.tsx`: 로딩 인디케이터, `size` prop 지원, `role="status"`
- [x] `ErrorMessage.tsx`: 에러 문자열/객체 받아 일관된 형식 표시, `role="alert"`
- [x] 모든 컴포넌트에 `aria-*` 속성 적용
- [x] 전역 Store 직접 참조·API 직접 호출 코드 없음

---

### FE-05: 반응형 레이아웃 컴포넌트 구현

**설명**: 1024px 브레이크포인트 기준 PC 사이드바·모바일 하단 네비게이션 레이아웃 전환을 구현한다.
**의존성**: FE-03, FE-04

**완료 조건**:
- [x] `Header.tsx`: 앱 이름·로그인 사용자 이름·로그아웃 버튼 포함
- [x] `Sidebar.tsx`: ≥1024px에서만 표시, 할일·카테고리·프로필 네비게이션 링크 포함
- [x] `BottomNav.tsx`: <1024px에서만 표시, 동일 기능을 하단 탭 형태로 제공
- [x] CSS 미디어 쿼리에서 정확히 `1024px` 분기 사용
- [x] 활성 라우트 네비게이션 항목에 활성 스타일 적용
- [x] 로그아웃 클릭 시 `authStore.clearAuth()` 호출 후 `/login` 이동
- [ ] PC·모바일 양쪽에서 레이아웃 전환 정상 동작

---

### FE-06: 로그인 / 회원가입 페이지 구현 (US-U-01, US-U-02)

**설명**: 로그인·회원가입 페이지를 구현하고 백엔드 Auth API와 연동한다.
**의존성**: FE-03, FE-04, BE-05, BE-06

**완료 조건**:
- [x] `LoginPage.tsx`: 이메일·비밀번호 입력, 로그인 버튼, 회원가입 페이지 링크
- [x] `RegisterPage.tsx`: 이메일·비밀번호·이름 입력, 회원가입 버튼, 로그인 페이지 링크
- [x] 비밀번호 8자 이상·이메일 형식 클라이언트 검증, 미충족 시 Input 하단 에러 표시
- [x] `hooks/useAuth.ts`의 로그인·회원가입 함수가 `services/authApi.ts`를 호출
- [x] 로그인 성공 시 JWT를 `authStore.setAuth()`로 메모리 저장 후 `/` 이동 (localStorage·Cookie 저장 코드 없음)
- [x] 회원가입 성공 시 로그인 페이지 이동 또는 자동 로그인 처리
- [x] API 호출 중 Spinner 표시 (로딩 상태)
- [x] 401·409 등 API 에러 시 `ErrorMessage`로 표시 (에러 상태)
- [x] PC·모바일 양쪽에서 폼 정상 표시

---

### FE-07: 프로필 설정 페이지 구현 (US-U-03, US-U-04)

**설명**: 프로필 수정·회원 탈퇴 페이지를 구현하고 Users API와 연동한다.
**의존성**: FE-05, BE-07, BE-08

**완료 조건**:
- [x] `ProfilePage.tsx`: 이메일(읽기 전용), 이름 변경, 비밀번호 변경(현재/신규), 저장 버튼
- [x] 이메일 필드는 disabled 처리
- [x] 변경된 항목만 API 요청에 포함
- [x] `useQuery`로 `GET /api/v1/users/me` 호출, 초기값 표시
- [x] `useMutation`으로 `PATCH /api/v1/users/me` 호출, 성공 시 `authStore` 사용자 이름 갱신
- [x] 회원 탈퇴 버튼 클릭 시 `Modal` 확인 다이얼로그 표시 후 `DELETE` 호출
- [x] 탈퇴 성공 시 `authStore.clearAuth()` 후 `/login` 이동
- [x] 로딩·에러 상태 처리
- [x] TanStack Query 훅이 `hooks/` 계층에 캡슐화되어 페이지에서 axios 직접 호출 없음
- [x] PC·모바일 양쪽에서 레이아웃 정상

---

### FE-08: 카테고리 관리 페이지 구현 (US-C-01, US-C-02, US-C-03)

**설명**: 기본·사용자 정의 카테고리 CRUD 페이지를 구현하고 Categories API와 연동한다.
**의존성**: FE-05, BE-09, BE-10

**완료 조건**:
- [x] `CategoryPage.tsx`: 기본 카테고리(개인/업무/쇼핑)와 사용자 정의 카테고리 구분 표시
- [x] 기본 카테고리는 수정·삭제 버튼 비활성화 또는 숨김 (BR-C-01)
- [x] `CategoryForm.tsx`: 이름·색상 코드 입력, `Modal`로 표시
- [x] 생성 버튼: 빈 폼 Modal 열림
- [x] 수정 버튼: 기존 데이터 채워진 폼 Modal 열림
- [x] 삭제 버튼: 확인 Modal 표시 후 삭제 API 호출
- [x] `useCategories.ts`가 `useQuery`로 목록 조회
- [x] `useCategoryMutations.ts`가 `useMutation`으로 생성·수정·삭제, 성공 시 `categoryKeys` 무효화
- [x] `CategoryBadge.tsx`가 이름·색상 시각화
- [x] 로딩·에러·빈 상태 각각 처리
- [x] PC·모바일 양쪽에서 정상 표시

---

### FE-09: 할일 목록 페이지 구현 (US-T-02, US-T-07)

**설명**: 할일 목록 조회와 카테고리·기간·완료 여부 복합 필터링 페이지를 구현한다.
**의존성**: FE-05, FE-08, BE-11, BE-14

**완료 조건**:
- [x] `TodoListPage.tsx`가 `TodoFilterPanel`과 `TodoList`를 조합
- [x] `TodoFilterPanel.tsx`: 카테고리 드롭다운, 완료 여부(전체/미완료/완료), 종료예정일 범위 입력
- [x] 필터 변경 시 TanStack Query 자동 재요청, `todoKeys.list(filters)` 쿼리 키 사용
- [x] 기간 필터는 종료예정일 기준 동작, NULL 할일은 결과 제외 (BR-F-02)
- [x] `TodoCard.tsx`: 제목·카테고리 배지·종료예정일·완료 체크박스 표시
- [x] 생성일시 역순 정렬 (BR-F-03)
- [x] 로딩(Spinner)·에러(ErrorMessage)·빈 상태(안내 문구) 각각 처리
- [x] `useTodos.ts` 훅이 필터 파라미터 관리
- [x] PC에서 필터 패널 사이드/상단, 모바일에서 접힘/펼침 표시

---

### FE-10: 할일 등록 / 수정 폼 구현 (US-T-01, US-T-03)

**설명**: 할일 등록·수정 폼 컴포넌트를 Modal/슬라이드 패널로 구현한다.
**의존성**: FE-09, BE-11, BE-12

**완료 조건**:
- [x] `TodoForm.tsx`: 제목(필수, 1~200자), 설명(선택), 종료예정일(선택), 카테고리(필수)
- [x] 제목 비어있거나 200자 초과 시 클라이언트 검증 에러 표시 (BR-T-01)
- [x] 카테고리 드롭다운이 `useCategories` 훅 데이터 기반 렌더링
- [x] 등록 모드·수정 모드를 동일 컴포넌트에서 처리 (수정 모드는 기존 값 초기값 주입)
- [x] `TodoListPage`의 "새 할일 추가" 버튼 클릭 시 빈 폼 Modal
- [x] `TodoCard` 수정 버튼 클릭 시 데이터 채워진 폼 Modal
- [x] `useTodoMutations.ts`의 `createTodo`, `updateTodo` 뮤테이션이 API 호출
- [x] 성공 시 `todoKeys.list()` 무효화로 자동 갱신
- [x] 호출 중 제출 버튼 로딩 상태·비활성화
- [x] 에러 시 폼 내 ErrorMessage 표시
- [x] PC·모바일 양쪽에서 Modal 정상 표시

---

### FE-11: 완료 처리 / 완료 취소 인터랙션 (US-T-04, US-T-05)

**설명**: 할일 카드 체크박스 토글로 complete·reopen API와 연동하며 낙관적 업데이트를 적용한다.
**의존성**: FE-09, BE-13

**완료 조건**:
- [x] `TodoCard.tsx` 체크박스 클릭 시 현재 상태에 따라 complete/reopen API 호출
- [x] 완료 상태 카드에 취소선·색상 변경 등 시각적 구분 스타일 적용
- [x] API 성공 후 `todoKeys.list()` 무효화로 자동 갱신
- [x] 낙관적 업데이트(`onMutate`)로 즉각 피드백, 오류 시 `onError`에서 롤백
- [x] `useTodoMutations.ts`에 `completeTodo`, `reopenTodo` 뮤테이션 구현
- [x] 완료 필터 적용 상태에서 토글 후 목록 올바르게 갱신
- [x] API 에러 시 ErrorMessage 표시
- [x] 체크박스 영역이 모바일 터치 기준 최소 44×44px

---

### FE-12: 할일 삭제 구현 (US-T-06)

**설명**: 할일 카드 삭제 버튼으로 확인 다이얼로그 후 영구 삭제 기능을 구현한다.
**의존성**: FE-09, BE-12

**완료 조건**:
- [ ] `TodoCard.tsx`에 삭제 버튼 존재
- [ ] 삭제 버튼 클릭 시 `Modal` 확인 다이얼로그 표시 ("정말 삭제하시겠습니까?")
- [ ] 확인 후 `useTodoMutations.ts`의 `deleteTodo` 뮤테이션이 DELETE API 호출
- [ ] 성공 후 `todoKeys.list()` 무효화로 즉시 목록에서 제거
- [ ] 호출 중 확인 버튼 로딩 상태·비활성화
- [ ] 삭제 후 할일 0건이면 빈 상태 UI 표시
- [ ] 에러 시 Modal 내 에러 메시지 표시
- [ ] 취소 버튼 클릭 시 API 미호출, Modal 닫힘

---

## 5. 전체 의존성 맵

### 5.1 도메인 내 의존성

```
[데이터베이스]
DB-01
 ├── DB-02 ─────┐
 └── DB-03 ─────┤
      ├── DB-04 │
      ├── DB-05 ─── DB-07
      ├── DB-06 │
      └────────┴── DB-08

[백엔드]
BE-01
 ├── BE-02 ─┐
 └── BE-03 ─┤
      └── BE-04 ─┤
           ├── BE-05 ─┬── BE-07
           │          └── BE-08
           ├── BE-06
           └── BE-09 ─┬── BE-10
                      └── BE-11 ─┬── BE-12
                                  ├── BE-13
                                  └── BE-14
                                  
BE-05 ~ BE-14 ────────────── BE-15

[프론트엔드]
FE-01
 ├── FE-02 ── FE-03 ── FE-05 ─┬── FE-06
 │                              ├── FE-07
 │                              └── FE-08 ── FE-09 ─┬── FE-10
 │                                                   ├── FE-11
 │                                                   └── FE-12
 └── FE-04 ──── (FE-05~FE-12 전체에서 사용)
```

### 5.2 도메인 간 의존성

| 프론트엔드 태스크 | 의존하는 백엔드 태스크 | 의존하는 DB 태스크 |
|------------------|----------------------|-------------------|
| FE-06 | BE-05, BE-06 | DB-08 |
| FE-07 | BE-07, BE-08 | DB-08 |
| FE-08 | BE-09, BE-10 | DB-08 |
| FE-09 | BE-11, BE-14 | DB-08 |
| FE-10 | BE-11, BE-12 | DB-08 |
| FE-11 | BE-13 | DB-08 |
| FE-12 | BE-12 | DB-08 |

### 5.3 권장 실행 단계 (병렬 그룹)

```
[Phase 1] 초기화 (병렬)
  DB-01, BE-01, FE-01

[Phase 2] 기반 설정 (병렬)
  DB-02, DB-03  |  BE-02, BE-03  |  FE-02, FE-04

[Phase 3] 검증·미들웨어·라우터 (병렬)
  DB-04, DB-05, DB-06  |  BE-04  |  FE-03

[Phase 4] 통합 검증·인증 API·레이아웃 (병렬)
  DB-07, DB-08  |  BE-05, BE-06  |  FE-05

[Phase 5] 도메인 API + 화면 (도메인별 병렬)
  BE-07, BE-08, BE-09  |  FE-06
  BE-10, BE-11         |  FE-07, FE-08
  BE-12, BE-13, BE-14  |  FE-09 → FE-10, FE-11, FE-12

[Phase 6] 통합 테스트
  BE-15
```
