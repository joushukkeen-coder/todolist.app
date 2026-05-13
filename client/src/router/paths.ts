export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CATEGORIES: '/categories',
  PROFILE: '/profile',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
