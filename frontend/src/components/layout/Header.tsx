import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/router/paths';
import Button from '@/components/common/Button';
import { useToggleDarkMode } from '@/hooks/useDarkMode';
import { useChangeLanguage, useTranslation } from '@/hooks/useLanguage';
import { LANGUAGE_LABEL, SUPPORTED_LANGUAGES } from '@/i18n/messages';
import type { Language } from '@/types/auth.types';
import './Header.css';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const toggleDark = useToggleDarkMode();
  const changeLanguage = useChangeLanguage();
  const { t, language } = useTranslation();

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const isDark = !!user?.darkMode;
  const handleToggleDark = () => toggleDark.mutate(!isDark);

  const handleLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage.mutate(e.target.value as Language);
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">{t('header.brand')}</div>
      <div className="app-header__user">
        {user && <span className="app-header__name">{user.name}</span>}
        <select
          className="app-header__lang"
          value={language}
          onChange={handleLanguage}
          aria-label={t('header.language.aria')}
          disabled={changeLanguage.isPending}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABEL[lang]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleToggleDark}
          isLoading={toggleDark.isPending}
          aria-pressed={isDark}
          aria-label={isDark ? t('header.theme.toLight') : t('header.theme.toDark')}
        >
          {isDark ? t('header.theme.lightLabel') : t('header.theme.darkLabel')}
        </Button>
        <Button size="sm" variant="secondary" onClick={handleLogout}>
          {t('header.logout')}
        </Button>
      </div>
    </header>
  );
}
