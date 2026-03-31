const primitiveColors = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate500: '#64748b',
  slate300: '#cbd5e1',
  slate100: '#f1f5f9',
  white: '#ffffff',
  black: '#000000',
  sky500: '#0ea5e9',
  violet500: '#8b5cf6',
  emerald500: '#10b981',
  amber500: '#f59e0b',
  rose500: '#f43f5e',
};

const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
};

const radius = {
  xs: '6px',
  sm: '10px',
  md: '14px',
  lg: '18px',
  xl: '24px',
  full: '999px',
};

const shadows = {
  sm: '0 4px 12px rgba(15, 23, 42, 0.12)',
  md: '0 12px 28px rgba(15, 23, 42, 0.18)',
  lg: '0 22px 56px rgba(15, 23, 42, 0.24)',
};

const typography = {
  familyFa: "'Vazirmatn','Segoe UI',sans-serif",
  familyEn: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
  sizeXs: '12px',
  sizeSm: '14px',
  sizeMd: '16px',
  sizeLg: '20px',
  sizeXl: '28px',
  weightRegular: '400',
  weightMedium: '500',
  weightBold: '700',
  weightBlack: '900',
  lineHeight: '1.5',
};

const zIndex = {
  base: 1,
  floating: 100,
  sticky: 300,
  overlay: 700,
  modal: 900,
  tooltip: 1100,
};

const motion = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

const subjectColors = {
  persian: { bg: '#ff6b6b', light: '#ffe5e5', dark: '#c0392b', text: '#ffffff' },
  arabic: { bg: '#4ecdc4', light: '#e0f7f5', dark: '#1a8e87', text: '#ffffff' },
  english: { bg: '#45b7d1', light: '#e0f4fa', dark: '#1a7a9a', text: '#ffffff' },
  science: { bg: '#96ceb4', light: '#e0f5ea', dark: '#3a7a5a', text: '#ffffff' },
  math: { bg: '#9b59b6', light: '#f4ecf7', dark: '#6c3483', text: '#ffffff' },
  computer: { bg: '#34495e', light: '#eaecee', dark: '#2c3e50', text: '#ffffff' },
  quran: { bg: '#ffc107', light: '#fff2cc', dark: '#ff9900', text: '#ffffff' },
};

const themePalettes = {
  light: {
    background: '#f8fafc',
    backgroundElevated: '#ffffff',
    backgroundMuted: '#eef2ff',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    border: 'rgba(15, 23, 42, 0.10)',
    borderStrong: 'rgba(15, 23, 42, 0.18)',
    primary: primitiveColors.sky500,
    primaryHover: '#0284c7',
    success: primitiveColors.emerald500,
    warning: primitiveColors.amber500,
    danger: primitiveColors.rose500,
  },
  dark: {
    background: '#0b1120',
    backgroundElevated: '#111827',
    backgroundMuted: '#1f2937',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    border: 'rgba(248, 250, 252, 0.16)',
    borderStrong: 'rgba(248, 250, 252, 0.24)',
    primary: '#38bdf8',
    primaryHover: '#0ea5e9',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#fb7185',
  },
};

const playfulOverrides = {
  light: {
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    backgroundMuted: '#f5f3ff',
    accentSoft: 'rgba(139, 92, 246, 0.12)',
    accentWarm: 'rgba(245, 158, 11, 0.14)',
  },
  dark: {
    primary: '#a78bfa',
    primaryHover: '#8b5cf6',
    backgroundMuted: '#2a2142',
    accentSoft: 'rgba(167, 139, 250, 0.16)',
    accentWarm: 'rgba(251, 191, 36, 0.16)',
  },
};

export const tokens = {
  colors: primitiveColors,
  spacing,
  radius,
  shadows,
  typography,
  zIndex,
  motion,
  subjectColors,
  themePalettes,
  playfulOverrides,
};

export function getThemeTokens(theme = 'light', mode = 'default') {
  const palette = themePalettes[theme] || themePalettes.light;
  const overrides = mode === 'kids' ? (playfulOverrides[theme] || playfulOverrides.light) : {};
  return {
    ...palette,
    ...overrides,
    accentSoft: overrides.accentSoft || 'rgba(14, 165, 233, 0.12)',
    accentWarm: overrides.accentWarm || 'rgba(245, 158, 11, 0.12)',
  };
}
