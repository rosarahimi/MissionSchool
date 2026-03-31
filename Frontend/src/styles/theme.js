// ─── Mission School — Theme Engine ──────────────────────────────────────────
// Applies design tokens as CSS Custom Properties on :root.
// Supports: dark / light × default / kids

import { tokens, getThemeTokens } from './tokens';

const THEME_STORAGE_KEY = 'ms_theme';
const MODE_STORAGE_KEY  = 'ms_theme_mode';

function setVar(name, value) {
  document.documentElement.style.setProperty(name, String(value));
}

export function applyTheme({ theme = 'dark', mode = 'kids', lang = 'fa' } = {}) {
  const currentTheme = theme === 'light' ? 'light' : 'dark';
  const currentMode  = mode === 'kids' ? 'kids' : 'default';
  const currentLang  = lang === 'en' ? 'en' : 'fa';
  const t            = getThemeTokens(currentTheme, currentMode);
  const { typography, spacing, radius, shadows, zIndex, motion } = tokens;

  document.documentElement.dataset.theme     = currentTheme;
  document.documentElement.dataset.themeMode = currentMode;

  // ── Backgrounds ──────────────────────────────────────────────────────
  setVar('--color-bg',         t.background);
  setVar('--color-bg-elevated',t.backgroundElevated);
  setVar('--color-bg-muted',   t.backgroundMuted);
  setVar('--color-bg-subtle',  t.backgroundSubtle || t.backgroundMuted);

  // ── Text ─────────────────────────────────────────────────────────────
  setVar('--color-text-primary',   t.textPrimary);
  setVar('--color-text-secondary', t.textSecondary);
  setVar('--color-text-muted',     t.textMuted);

  // ── Borders ──────────────────────────────────────────────────────────
  setVar('--color-border',       t.border);
  setVar('--color-border-strong',t.borderStrong);

  // ── Primary ──────────────────────────────────────────────────────────
  setVar('--color-primary',       t.primary);
  setVar('--color-primary-hover', t.primaryHover);
  setVar('--color-primary-bg',    t.primaryBg);

  // ── Accents ──────────────────────────────────────────────────────────
  setVar('--color-mango',         t.accentMango);
  setVar('--color-mango-hover',   t.accentMangoHover);
  setVar('--color-mango-bg',      t.accentMangoBg);
  setVar('--color-aqua',          t.accentAqua);
  setVar('--color-aqua-hover',    t.accentAquaHover);
  setVar('--color-aqua-bg',       t.accentAquaBg);

  // ── Semantic ─────────────────────────────────────────────────────────
  setVar('--color-success',    t.success);
  setVar('--color-success-bg', t.successBg);
  setVar('--color-warning',    t.warning);
  setVar('--color-warning-bg', t.warningBg);
  setVar('--color-danger',     t.danger);
  setVar('--color-danger-bg',  t.dangerBg);
  setVar('--color-info',       t.info);
  setVar('--color-info-bg',    t.infoBg);

  // ── Backward compat aliases (old code used these) ────────────────────
  setVar('--color-accent-soft', t.primaryBg);
  setVar('--color-accent-warm', t.accentMangoBg);

  // ── Spacing ──────────────────────────────────────────────────────────
  Object.entries(spacing).forEach(([k, v]) => setVar(`--space-${k}`, v));

  // ── Radius ───────────────────────────────────────────────────────────
  Object.entries(radius).forEach(([k, v]) => setVar(`--radius-${k}`, v));

  // ── Shadows ──────────────────────────────────────────────────────────
  Object.entries(shadows).forEach(([k, v]) => setVar(`--shadow-${k}`, v));

  // ── Z-index ──────────────────────────────────────────────────────────
  Object.entries(zIndex).forEach(([k, v]) => setVar(`--z-${k}`, v));

  // ── Motion ───────────────────────────────────────────────────────────
  Object.entries(motion).forEach(([k, v]) => setVar(`--motion-${k}`, v));
  // Backward compat
  setVar('--motion-fast',   motion.fast);
  setVar('--motion-normal', motion.normal);
  setVar('--motion-ease',   motion.ease);

  // ── Typography ───────────────────────────────────────────────────────
  setVar('--font-family-ui',
    currentLang === 'fa' ? typography.familyFa : typography.familyEn);
  setVar('--font-family-heading', typography.familyEn); // Nunito for headings
  setVar('--font-family-mono',    typography.familyMono);

  setVar('--font-size-2xs', typography.size2xs);
  setVar('--font-size-xs',  typography.sizeXs);
  setVar('--font-size-sm',  typography.sizeSm);
  setVar('--font-size-md',  typography.sizeMd);
  setVar('--font-size-lg',  typography.sizeLg);
  setVar('--font-size-xl',  typography.sizeXl);
  setVar('--font-size-2xl', typography.size2xl);
  setVar('--font-size-3xl', typography.size3xl);

  setVar('--font-weight-regular',  typography.weightRegular);
  setVar('--font-weight-medium',   typography.weightMedium);
  setVar('--font-weight-semibold', typography.weightSemibold);
  setVar('--font-weight-bold',     typography.weightBold);
  setVar('--font-weight-black',    typography.weightBlack);

  setVar('--line-height-tight',   typography.lineHeightTight);
  setVar('--line-height-base',    typography.lineHeightBase);
  setVar('--line-height-relaxed', typography.lineHeightRelaxed);
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  const savedMode  = localStorage.getItem(MODE_STORAGE_KEY)  || 'kids';
  const lang       = document.documentElement.lang || 'fa';
  applyTheme({ theme: savedTheme, mode: savedMode, lang });
  return { theme: savedTheme, mode: savedMode };
}

export function saveThemePreference(theme, mode) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(MODE_STORAGE_KEY, mode);
}
