-- =============================================================
-- TodoListApp Database Schema
-- 버전  : 1.0.0
-- 작성일: 2026-05-13
-- 참조  : docs/6-erd.md, docs/2-prd.md v1.0.2
-- DBMS  : PostgreSQL 17
-- =============================================================


-- =============================================================
-- Extension
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid() 사용


-- =============================================================
-- Function: updated_at 자동 갱신 트리거 함수
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================
-- Table: users
-- =============================================================

CREATE TABLE IF NOT EXISTS users (
    user_id       UUID        NOT NULL DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    auth_provider VARCHAR(20)  NOT NULL DEFAULT 'local',  -- OAuth v2 확장 대비 예약 컬럼
    dark_mode     BOOLEAN     NOT NULL DEFAULT FALSE,    -- 사용자별 다크 모드 설정
    language      VARCHAR(2)  NOT NULL DEFAULT 'ko',     -- 사용자별 UI 언어 (ko/en/ja)
    created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_users           PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email     UNIQUE (email),
    CONSTRAINT chk_users_language CHECK (language IN ('ko', 'en', 'ja'))
);

-- 기존 스키마 호환을 위한 멱등 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language  VARCHAR(2) NOT NULL DEFAULT 'ko';
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_language') THEN
        ALTER TABLE users ADD CONSTRAINT chk_users_language CHECK (language IN ('ko', 'en', 'ja'));
    END IF;
END $$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  users                 IS '사용자 계정';
COMMENT ON COLUMN users.user_id         IS '사용자 고유 식별자 (UUID v4)';
COMMENT ON COLUMN users.email           IS '로그인용 이메일 주소 (시스템 전체 고유)';
COMMENT ON COLUMN users.password_hash   IS 'bcrypt 해시 처리된 비밀번호 (salt rounds >= 10)';
COMMENT ON COLUMN users.name            IS '사용자 표시 이름';
COMMENT ON COLUMN users.auth_provider   IS '인증 제공자 식별자. 이메일/비밀번호 인증: local, 소셜 로그인: google/facebook 등';
COMMENT ON COLUMN users.dark_mode       IS '다크 모드 사용 여부 (사용자별 UI 테마 설정)';
COMMENT ON COLUMN users.language        IS '사용자별 UI 언어 (ISO 639-1: ko/en/ja). 기본값 ko';
COMMENT ON COLUMN users.created_at      IS '계정 생성 일시';
COMMENT ON COLUMN users.updated_at      IS '계정 마지막 수정 일시 (트리거 자동 갱신)';


-- =============================================================
-- Table: categories
-- =============================================================

CREATE TABLE IF NOT EXISTS categories (
    category_id  UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id      UUID                  DEFAULT NULL,  -- NULL = 시스템 기본 카테고리
    name         VARCHAR(100) NOT NULL,
    color_code   VARCHAR(7)   NOT NULL,               -- 예: #4A90D9
    is_default   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories       PRIMARY KEY (category_id),
    CONSTRAINT fk_categories_user  FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    -- 동일 사용자 내 카테고리 이름 중복 방지 (BR-C-02)
    -- 기본 카테고리(user_id NULL)는 별도로 중복 제한하지 않음
    CONSTRAINT uq_categories_user_name UNIQUE (user_id, name)
);

COMMENT ON TABLE  categories               IS '할일 분류 카테고리. user_id NULL = 시스템 기본 카테고리';
COMMENT ON COLUMN categories.category_id   IS '카테고리 고유 식별자 (UUID v4)';
COMMENT ON COLUMN categories.user_id       IS '소유 사용자 식별자. NULL이면 시스템 기본 카테고리 (개인·업무·쇼핑)';
COMMENT ON COLUMN categories.name          IS '카테고리 이름';
COMMENT ON COLUMN categories.color_code    IS 'UI 표시용 HEX 색상 코드 (예: #4A90D9)';
COMMENT ON COLUMN categories.is_default    IS '시스템 기본 카테고리 여부. TRUE이면 수정·삭제 불가 (BR-C-01)';
COMMENT ON COLUMN categories.created_at    IS '카테고리 생성 일시';


-- =============================================================
-- Table: todos
-- =============================================================

CREATE TABLE IF NOT EXISTS todos (
    todo_id      UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    category_id  UUID         NOT NULL,
    title        VARCHAR(200) NOT NULL,  -- BR-T-01: 1~200자
    description  TEXT                  DEFAULT NULL,
    due_date     DATE                  DEFAULT NULL,
    is_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP             DEFAULT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_todos          PRIMARY KEY (todo_id),
    CONSTRAINT fk_todos_user     FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_todos_category FOREIGN KEY (category_id)
        REFERENCES categories (category_id)
        ON DELETE RESTRICT,     -- BR-C-03: 할일이 연결된 카테고리 삭제 방지
    CONSTRAINT chk_todos_title_length CHECK (char_length(title) >= 1)
);

CREATE OR REPLACE TRIGGER trg_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  todos               IS '사용자 할일 항목';
COMMENT ON COLUMN todos.todo_id       IS '할일 고유 식별자 (UUID v4)';
COMMENT ON COLUMN todos.user_id       IS '할일 소유자. 다른 사용자 접근 불가 (BR-T-04)';
COMMENT ON COLUMN todos.category_id   IS '할일이 속한 카테고리. 반드시 지정 필요 (BR-T-02)';
COMMENT ON COLUMN todos.title         IS '할일 제목 (1~200자, BR-T-01)';
COMMENT ON COLUMN todos.description   IS '할일 상세 설명 (선택, BR-T-05)';
COMMENT ON COLUMN todos.due_date      IS '종료 예정일 (선택, BR-T-05). 기간 필터는 이 컬럼 기준 적용 (BR-F-02)';
COMMENT ON COLUMN todos.is_completed  IS '완료 여부. TRUE = 완료, FALSE = 미완료';
COMMENT ON COLUMN todos.completed_at  IS '완료 처리 일시. 완료 취소 시 NULL로 초기화 (BR-T-03)';
COMMENT ON COLUMN todos.created_at    IS '할일 생성 일시. 기본 정렬 기준 (BR-F-03)';
COMMENT ON COLUMN todos.updated_at    IS '할일 마지막 수정 일시 (트리거 자동 갱신)';


-- =============================================================
-- Index
-- =============================================================

-- todos 조회 성능: 사용자별 전체 목록 조회 (US-T-02)
CREATE INDEX IF NOT EXISTS idx_todos_user_id         ON todos (user_id);
-- todos 필터링 성능: 카테고리 필터 (US-T-07)
CREATE INDEX IF NOT EXISTS idx_todos_category_id     ON todos (category_id);
-- todos 필터링 성능: 완료 여부 필터 (US-T-07)
CREATE INDEX IF NOT EXISTS idx_todos_is_completed    ON todos (user_id, is_completed);
-- todos 필터링 성능: 기간 필터 - due_date NULL 제외 (BR-F-02)
CREATE INDEX IF NOT EXISTS idx_todos_due_date        ON todos (user_id, due_date) WHERE due_date IS NOT NULL;
-- categories 조회 성능: 사용자 카테고리 목록 조회
CREATE INDEX IF NOT EXISTS idx_categories_user_id   ON categories (user_id);


-- =============================================================
-- Seed: 시스템 기본 카테고리 (user_id = NULL, is_default = TRUE)
-- =============================================================

-- 멱등성: user_id IS NULL + is_default 기준으로 미존재 시에만 삽입
-- (UNIQUE(user_id, name) 제약은 NULL을 중복으로 보지 않아 ON CONFLICT를 사용할 수 없음)
INSERT INTO categories (category_id, user_id, name, color_code, is_default)
SELECT gen_random_uuid(), NULL, v.name, v.color_code, TRUE
FROM (VALUES
    ('개인', '#4A90D9'),
    ('업무', '#E8503A'),
    ('쇼핑', '#2ECC71')
) AS v(name, color_code)
WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.user_id IS NULL AND c.name = v.name AND c.is_default = TRUE
);
