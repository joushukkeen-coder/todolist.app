# 기술 아키텍처 다이어그램

**버전**: 1.0.0  
**작성일**: 2026-05-13  
**참조**: PRD v1.0.1

---

## 변경 이력

| 버전 | 작성일 | 내용 |
|------|--------|------|
| 1.0.0 | 2026-05-13 | 초기 작성 - 시스템 구조, 백엔드 레이어, 데이터베이스 ERD |

---

## 1. 시스템 전체 구조

사용자가 브라우저에서 React SPA에 접근하면, React는 Express API와 통신하여 PostgreSQL 데이터베이스의 데이터를 조작한다.

```mermaid
graph TD
    A["사용자<br/>(브라우저)"]
    B["React SPA<br/>(Frontend)"]
    C["Express API<br/>(Backend)"]
    D["PostgreSQL<br/>(Database)"]
    
    A -->|HTTP/REST| B
    B -->|REST API<br/>/api/v1| C
    C -->|Query| D
    D -->|Result| C
    C -->|JSON| B
    B -->|Render| A
```

---

## 2. 백엔드 레이어 구조

클라이언트 요청은 Router에서 시작하여 JWT 미들웨어를 거쳐 Controller, Service, Repository 순으로 통과한 후 데이터베이스에 접근한다.

```mermaid
flowchart TD
    A["클라이언트 요청"]
    B["Router<br/>/api/v1/{resource}"]
    C["Middleware<br/>JWT 검증"]
    D["Controller<br/>요청 핸들링"]
    E["Service<br/>비즈니스 로직"]
    F["Repository<br/>데이터 접근"]
    G["PostgreSQL<br/>데이터 조작"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G -->|Result| F
    F -->|Data| E
    E -->|Response| D
    D -->|JSON| A
```

---

## 3. 데이터베이스 ERD

시스템은 3개의 핵심 엔티티로 구성된다. users는 todos와 categories의 상위 엔티티이며, categories는 사용자별 커스텀 카테고리와 기본 카테고리를 지원한다.

```mermaid
erDiagram
    USERS ||--o{ CATEGORIES : "1:N"
    USERS ||--o{ TODOS : "1:N"
    CATEGORIES ||--o{ TODOS : "1:N"
    
    USERS {
        uuid user_id PK
        string email
        string name
    }
    
    CATEGORIES {
        uuid category_id PK
        uuid user_id FK "NULL = 기본 카테고리"
        string name
        string color_code
        boolean is_default
    }
    
    TODOS {
        uuid todo_id PK
        uuid user_id FK
        uuid category_id FK
        string title
        date due_date
        boolean is_completed
    }
```

---

## 4. 요청 흐름도

### 4.1 인증 흐름 (로그인)

이메일과 비밀번호로 로그인하여 JWT를 발급받는 흐름이다.

```mermaid
sequenceDiagram
    actor 사용자
    participant FE as React SPA
    participant API as Express API
    participant DB as PostgreSQL

    사용자->>FE: 이메일 + 비밀번호 입력
    FE->>API: POST /api/v1/auth/login
    API->>DB: 이메일로 사용자 조회
    DB-->>API: 사용자 정보 반환
    API->>API: bcrypt 비밀번호 검증
    alt 검증 성공
        API-->>FE: 200 OK + JWT
        FE->>FE: JWT 메모리 저장 (Zustand authStore)
        Note right of FE: localStorage/Cookie 저장 금지
        FE-->>사용자: 메인 화면 이동
    else 검증 실패
        API-->>FE: 401 Unauthorized
        FE-->>사용자: 오류 메시지 표시
    end
```

---

### 4.2 인증된 API 요청 흐름 (할일 목록 조회)

JWT를 보유한 사용자가 인증이 필요한 API를 호출하는 흐름이다.

```mermaid
sequenceDiagram
    actor 사용자
    participant FE as React SPA
    participant MW as JWT 미들웨어
    participant SVC as Service
    participant DB as PostgreSQL

    사용자->>FE: 할일 목록 화면 진입
    FE->>MW: GET /api/v1/todos<br/>Authorization: Bearer JWT
    MW->>MW: JWT 서명 및 만료 검증
    alt JWT 유효
        MW->>SVC: userId 전달
        SVC->>DB: userId 기준 할일 조회
        DB-->>SVC: 할일 목록 반환
        SVC-->>FE: 200 OK + 할일 목록
        FE-->>사용자: 목록 렌더링
    else JWT 만료 / 위조
        MW-->>FE: 401 Unauthorized
        FE-->>사용자: 로그인 화면으로 이동
    end
```

---

## 5. 컴포넌트 책임도

### 5.1 프론트엔드 컴포넌트 책임

각 레이어가 담당하는 책임의 흐름이다.

```mermaid
flowchart TD
    subgraph Pages["Pages — 화면 조합"]
        P1["LoginPage\nRegisterPage"]
        P2["TodoListPage\nCategoryPage\nProfilePage"]
    end

    subgraph Components["Components — UI 렌더링"]
        C1["common/\nButton · Input · Modal"]
        C2["todo/\nTodoCard · TodoForm · FilterPanel"]
        C3["category/\nCategoryBadge · CategoryForm"]
        C4["layout/\nHeader · Sidebar · BottomNav"]
    end

    subgraph Hooks["Hooks — 서버 상태 캡슐화"]
        H1["useAuth"]
        H2["useTodos · useTodoMutations"]
        H3["useCategories · useCategoryMutations"]
    end

    subgraph Services["Services — HTTP 통신"]
        S1["apiClient\n토큰 주입 · 401 처리"]
        S2["authApi · userApi\ntodoApi · categoryApi"]
    end

    subgraph Store["Store — 클라이언트 전역 상태"]
        ST1["authStore\nJWT · 사용자 정보"]
        ST2["uiStore\n모달 · UI 상태"]
    end

    Pages --> Components
    Pages --> Hooks
    Hooks --> Services
    Services --> S1
    Hooks --> Store
```

---

### 5.2 백엔드 컴포넌트 책임

각 컴포넌트의 단일 책임과 소유 영역이다.

```mermaid
flowchart TD
    subgraph Routes["Routes — 경로 매핑"]
        R1["auth.routes\nuser.routes"]
        R2["category.routes\ntodo.routes"]
    end

    subgraph Middlewares["Middlewares — 횡단 관심사"]
        M1["auth.js\nJWT 검증 · req.user 주입"]
        M2["validate.js\n입력값 유효성 검증"]
        M3["errorHandler.js\n중앙 에러 처리"]
    end

    subgraph Controllers["Controllers — 요청/응답 처리"]
        CO1["auth · user\ncategory · todo"]
    end

    subgraph Services["Services — 비즈니스 로직"]
        SV1["소유권 검증\n도메인 규칙 처리"]
    end

    subgraph Repositories["Repositories — 데이터 접근"]
        RP1["SQL 쿼리 실행\nsnake_case → camelCase 변환"]
    end

    subgraph DB["DB"]
        D1["pool.js\npg Pool 단일 인스턴스"]
    end

    Routes --> Middlewares
    Middlewares --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> DB
```
