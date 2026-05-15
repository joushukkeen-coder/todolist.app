import type { Language } from '@/types/auth.types';

export const SUPPORTED_LANGUAGES: Language[] = ['ko', 'en', 'ja'];

export const LANGUAGE_LABEL: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
};

type Messages = Record<string, string>;

const ko: Messages = {
  // header
  'header.brand': 'TodoListApp',
  'header.logout': '로그아웃',
  'header.theme.toLight': '라이트 모드로 전환',
  'header.theme.toDark': '다크 모드로 전환',
  'header.theme.lightLabel': '☀️ 라이트',
  'header.theme.darkLabel': '🌙 다크',
  'header.language.aria': '언어 선택',

  // nav
  'nav.todos': '할일',
  'nav.categories': '카테고리',
  'nav.profile': '프로필',

  // auth
  'auth.login.title': '로그인',
  'auth.login.submit': '로그인',
  'auth.login.toRegister': '계정이 없으신가요?',
  'auth.register.title': '회원가입',
  'auth.register.submit': '회원가입',
  'auth.register.toLogin': '이미 계정이 있으신가요?',
  'auth.email': '이메일',
  'auth.password': '비밀번호',
  'auth.passwordHint': '비밀번호 (8자 이상)',
  'auth.name': '이름',

  // home
  'home.title': '할일 목록',
  'home.newTodo': '+ 새 할일',
  'home.empty': '표시할 할일이 없습니다.',

  // common
  'common.cancel': '취소',
  'common.save': '저장',
  'common.delete': '삭제',
  'common.edit': '수정',
  'common.confirm': '확인',
};

const en: Messages = {
  'header.brand': 'TodoListApp',
  'header.logout': 'Logout',
  'header.theme.toLight': 'Switch to light mode',
  'header.theme.toDark': 'Switch to dark mode',
  'header.theme.lightLabel': '☀️ Light',
  'header.theme.darkLabel': '🌙 Dark',
  'header.language.aria': 'Select language',

  'nav.todos': 'Todos',
  'nav.categories': 'Categories',
  'nav.profile': 'Profile',

  'auth.login.title': 'Log in',
  'auth.login.submit': 'Log in',
  'auth.login.toRegister': "Don't have an account?",
  'auth.register.title': 'Sign up',
  'auth.register.submit': 'Sign up',
  'auth.register.toLogin': 'Already have an account?',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.passwordHint': 'Password (min. 8 characters)',
  'auth.name': 'Name',

  'home.title': 'Todo list',
  'home.newTodo': '+ New todo',
  'home.empty': 'No todos to display.',

  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.confirm': 'Confirm',
};

const ja: Messages = {
  'header.brand': 'TodoListApp',
  'header.logout': 'ログアウト',
  'header.theme.toLight': 'ライトモードに切り替え',
  'header.theme.toDark': 'ダークモードに切り替え',
  'header.theme.lightLabel': '☀️ ライト',
  'header.theme.darkLabel': '🌙 ダーク',
  'header.language.aria': '言語を選択',

  'nav.todos': 'タスク',
  'nav.categories': 'カテゴリ',
  'nav.profile': 'プロフィール',

  'auth.login.title': 'ログイン',
  'auth.login.submit': 'ログイン',
  'auth.login.toRegister': 'アカウントをお持ちでない方',
  'auth.register.title': '会員登録',
  'auth.register.submit': '登録',
  'auth.register.toLogin': '既にアカウントをお持ちの方',
  'auth.email': 'メール',
  'auth.password': 'パスワード',
  'auth.passwordHint': 'パスワード(8文字以上)',
  'auth.name': '名前',

  'home.title': 'タスク一覧',
  'home.newTodo': '+ 新規タスク',
  'home.empty': '表示するタスクがありません。',

  'common.cancel': 'キャンセル',
  'common.save': '保存',
  'common.delete': '削除',
  'common.edit': '編集',
  'common.confirm': '確認',
};

export const MESSAGES: Record<Language, Messages> = { ko, en, ja };

export function translate(language: Language, key: string): string {
  return MESSAGES[language][key] ?? MESSAGES.ko[key] ?? key;
}
