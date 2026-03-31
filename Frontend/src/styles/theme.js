import { tokens, getThemeTokens } from './tokens';

const THEME_STORAGE_KEY = 'ms_theme';
const MODE_STORAGE_KEY = 'ms_theme_mode';

function setVar(name, value) {
  document.documentElement.style.setProperty(name, String(value));
}

export function applyTheme({ theme = 'dark', mode = 'kids', lang = 'fa' } = {}) {
  const currentTheme = theme === 'dark' ? 'dark' : 'light';
  const currentMode = mode === 'kids' ? 'kids' : 'default';
  const currentLang = lang === 'en' ? 'en' : 'fa';
  const themeTokens = getThemeTokens(currentTheme, currentMode);

  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.dataset.themeMode = currentMode;

  setVar('--color-bg', themeTokens.background);
  setVar('--color-bg-elevated', themeTokens.backgroundElevated);
  setVar('--color-bg-muted', themeTokens.backgroundMuted);
  setVar('--color-text-primary', themeTokens.textPrimary);
  setVar('--color-text-secondary', themeTokens.textSecondary);
  setVar('--color-text-muted', themeTokens.textMuted);
  setVar('--color-border', themeTokens.border);
  setVar('--color-border-strong', themeTokens.borderStrong);
  setVar('--color-primary', themeTokens.primary);
  setVar('--color-primary-hover', themeTokens.primaryHover);
  setVar('--color-success', themeTokens.success);
  setVar('--color-warning', themeTokens.warning);
  setVar('--color-danger', themeTokens.danger);
  setVar('--color-accent-soft', themeTokens.accentSoft);
  setVar('--color-accent-warm', themeTokens.accentWarm);

  Object.entries(tokens.spacing).forEach(([k, v]) => setVar(`--space-${k}`, v));
  Object.entries(tokens.radius).forEach(([k, v]) => setVar(`--radius-${k}`, v));
  Object.entries(tokens.shadows).forEach(([k, v]) => setVar(`--shadow-${k}`, v));
  Object.entries(tokens.zIndex).forEach(([k, v]) => setVar(`--z-${k}`, v));
  Object.entries(tokens.motion).forEach(([k, v]) => setVar(`--motion-${k}`, v));

  setVar('--font-family-ui', currentLang === 'fa' ? tokens.typography.familyFa : tokens.typography.familyEn);
  setVar('--font-size-xs', tokens.typography.sizeXs);
  setVar('--font-size-sm', tokens.typography.sizeSm);
  setVar('--font-size-md', tokens.typography.sizeMd);
  setVar('--font-size-lg', tokens.typography.sizeLg);
  setVar('--font-size-xl', tokens.typography.sizeXl);
  setVar('--font-weight-regular', tokens.typography.weightRegular);
  setVar('--font-weight-medium', tokens.typography.weightMedium);
  setVar('--font-weight-bold', tokens.typography.weightBold);
  setVar('--font-weight-black', tokens.typography.weightBlack);
  setVar('--line-height-base', tokens.typography.lineHeight);
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  const savedMode = localStorage.getItem(MODE_STORAGE_KEY) || 'kids';
  const lang = document.documentElement.lang || 'fa';
  applyTheme({ theme: savedTheme, mode: savedMode, lang });
  return { theme: savedTheme, mode: savedMode };
}

export function saveThemePreference(theme, mode) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}
