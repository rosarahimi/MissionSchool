// ─── Mission School — Design Tokens ────────────────────────────────────────
// Visual language: Professional × Playful (Minimal + Educational)
// No emojis — all UI uses clean SVG vectors from the MsIcons family.

const primitiveColors = {
  // ── Core Neutrals (Navy Dark System) ──────────────────────────────────
  navy950:  '#080D1A',
  navy900:  '#0D1224',   // page background
  navy800:  '#141929',   // elevated surface (cards)
  navy700:  '#1B2236',   // muted/subtle surface
  navy600:  '#252E47',   // border-muted
  navy500:  '#3A4566',   // border-strong
  navy400:  '#5A6A96',   // text-muted
  navy300:  '#8D9FCC',   // text-secondary
  navy200:  '#C8D3EF',   // text-primary (dark bg)
  navy100:  '#EEF1FA',   // near-white
  white:    '#FFFFFF',
  black:    '#000000',

  // ── Light Mode Neutrals ──────────────────────────────────────────────
  slate950: '#0A0F1E',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',

  // ── Primary (Indigo — professional, trusted) ─────────────────────────
  indigo600: '#4F46E5',
  indigo500: '#6366F1',
  indigo400: '#818CF8',
  indigo300: '#A5B4FC',
  indigo200: '#C7D2FE',
  indigoBg:  'rgba(99, 102, 241, 0.10)',

  // ── Accent 1 — Mango (warm, energetic, child CTA) ───────────────────
  mango600: '#E8720C',
  mango500: '#FF8C42',
  mango400: '#FFA568',
  mango300: '#FFBF94',
  mangoBg:  'rgba(255, 140, 66, 0.12)',

  // ── Accent 2 — Aqua (progress, success, fresh) ──────────────────────
  aqua600:  '#00A687',
  aqua500:  '#00C9A7',
  aqua400:  '#33D4B8',
  aqua300:  '#7FE6D4',
  aquaBg:   'rgba(0, 201, 167, 0.12)',

  // ── Semantic ─────────────────────────────────────────────────────────
  success500: '#22C55E',
  success300: '#86EFAC',
  successBg:  'rgba(34, 197, 94, 0.12)',
  warning500: '#EAB308',
  warning300: '#FDE047',
  warningBg:  'rgba(234, 179, 8, 0.12)',
  error500:   '#EF4444',
  error300:   '#FCA5A5',
  errorBg:    'rgba(239, 68, 68, 0.12)',
  info500:    '#3B82F6',
  info300:    '#93C5FD',
  infoBg:     'rgba(59, 130, 246, 0.12)',
};

// ─── Spacing ─────────────────────────────────────────────────────────────────
const spacing = {
  '0':   '0px',
  '1':   '4px',
  '2':   '8px',
  '3':   '12px',
  '4':   '16px',
  '5':   '20px',
  '6':   '24px',
  '8':   '32px',
  '10':  '40px',
  '12':  '48px',
  '16':  '64px',
  '20':  '80px',
};

// ─── Border Radius ───────────────────────────────────────────────────────────
// Rounded system — feels friendly without being childish
const radius = {
  xs:   '6px',
  sm:   '10px',
  md:   '14px',
  lg:   '20px',     // cards
  xl:   '28px',     // modals, large panels
  '2xl':'36px',
  full: '9999px',   // pills, badges
};

// ─── Elevation / Shadows ─────────────────────────────────────────────────────
const shadows = {
  xs:  '0 1px 3px rgba(8, 13, 26, 0.40)',
  sm:  '0 4px 12px rgba(8, 13, 26, 0.40)',
  md:  '0 8px 24px rgba(8, 13, 26, 0.44)',
  lg:  '0 16px 40px rgba(8, 13, 26, 0.50)',
  xl:  '0 28px 64px rgba(8, 13, 26, 0.56)',
  glow:'0 0 24px rgba(99, 102, 241, 0.30)',
  mangoGlow: '0 8px 24px rgba(255, 140, 66, 0.28)',
  aquaGlow:  '0 8px 24px rgba(0, 201, 167, 0.24)',
};

// ─── Typography ──────────────────────────────────────────────────────────────
const typography = {
  familyFa:    "'Vazirmatn', 'Segoe UI', sans-serif",
  familyEn:    "'Nunito', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  familyMono:  "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",

  // Scale — readable for children (min 16px body)
  size2xs: '11px',
  sizeXs:  '13px',
  sizeSm:  '15px',
  sizeMd:  '17px',    // base body
  sizeLg:  '20px',
  sizeXl:  '24px',
  size2xl: '30px',
  size3xl: '38px',

  // Weights
  weightRegular: '400',
  weightMedium:  '500',
  weightSemibold:'600',
  weightBold:    '700',
  weightBlack:   '800',

  lineHeightTight:  '1.25',
  lineHeightBase:   '1.55',
  lineHeightRelaxed:'1.75', // for child reading
};

// ─── Z-index ─────────────────────────────────────────────────────────────────
const zIndex = {
  base:    1,
  floating: 100,
  sticky:  300,
  overlay: 700,
  modal:   900,
  toast:   1000,
  tooltip: 1100,
};

// ─── Motion — Meaningful, subtle (150–250ms) ─────────────────────────────────
const motion = {
  instant:  '80ms',
  fast:     '150ms',   // micro-interactions (hover, focus)
  normal:   '220ms',   // state transitions
  slow:     '350ms',   // page-level transitions
  slower:   '500ms',   // reward animations
  ease:     'cubic-bezier(0.4, 0, 0.2, 1)',   // Material-style smooth
  easeOut:  'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn:   'cubic-bezier(0.4, 0, 1, 1)',
  spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)', // bouncy for rewards
};

// ─── Subject Colors — Distinct, high-contrast, minimal ───────────────────────
const subjectColors = {
  persian:  { bg: '#E8414C', light: '#FEE7E8', dark: '#9B1B25', text: '#ffffff' },
  arabic:   { bg: '#0C9D9C', light: '#DCFAF9', dark: '#056463', text: '#ffffff' },
  english:  { bg: '#2563EB', light: '#DBEAFE', dark: '#1D4ED8', text: '#ffffff' },
  science:  { bg: '#16A34A', light: '#DCFCE7', dark: '#15803D', text: '#ffffff' },
  math:     { bg: '#7C3AED', light: '#EDE9FE', dark: '#5B21B6', text: '#ffffff' },
  computer: { bg: '#0E7490', light: '#CFFAFE', dark: '#155E75', text: '#ffffff' },
  quran:    { bg: '#B45309', light: '#FEF3C7', dark: '#92400E', text: '#ffffff' },
};

// ─── Theme Palettes ──────────────────────────────────────────────────────────
const themePalettes = {
  // Dark (default — navy system)
  dark: {
    background:         primitiveColors.navy900,
    backgroundElevated: primitiveColors.navy800,
    backgroundMuted:    primitiveColors.navy700,
    backgroundSubtle:   primitiveColors.navy600,
    textPrimary:        primitiveColors.navy200,
    textSecondary:      primitiveColors.navy300,
    textMuted:          primitiveColors.navy400,
    border:             primitiveColors.navy600,
    borderStrong:       primitiveColors.navy500,
    primary:            primitiveColors.indigo500,
    primaryHover:       primitiveColors.indigo600,
    primaryBg:          primitiveColors.indigoBg,
    accentMango:        primitiveColors.mango500,
    accentMangoHover:   primitiveColors.mango600,
    accentMangoBg:      primitiveColors.mangoBg,
    accentAqua:         primitiveColors.aqua500,
    accentAquaHover:    primitiveColors.aqua600,
    accentAquaBg:       primitiveColors.aquaBg,
    success:            primitiveColors.success500,
    successBg:          primitiveColors.successBg,
    warning:            primitiveColors.warning500,
    warningBg:          primitiveColors.warningBg,
    danger:             primitiveColors.error500,
    dangerBg:           primitiveColors.errorBg,
    info:               primitiveColors.info500,
    infoBg:             primitiveColors.infoBg,
  },

  // Light
  light: {
    background:         primitiveColors.slate50,
    backgroundElevated: primitiveColors.white,
    backgroundMuted:    primitiveColors.slate100,
    backgroundSubtle:   primitiveColors.slate200,
    textPrimary:        primitiveColors.slate900,
    textSecondary:      primitiveColors.slate700,
    textMuted:          primitiveColors.slate500,
    border:             primitiveColors.slate200,
    borderStrong:       primitiveColors.slate300,
    primary:            primitiveColors.indigo600,
    primaryHover:       '#3730A3',
    primaryBg:          'rgba(79, 70, 229, 0.08)',
    accentMango:        primitiveColors.mango600,
    accentMangoHover:   '#C95E00',
    accentMangoBg:      'rgba(232, 114, 12, 0.10)',
    accentAqua:         primitiveColors.aqua600,
    accentAquaHover:    '#008066',
    accentAquaBg:       'rgba(0, 166, 135, 0.10)',
    success:            '#16A34A',
    successBg:          'rgba(22, 163, 74, 0.10)',
    warning:            '#CA8A04',
    warningBg:          'rgba(202, 138, 4, 0.10)',
    danger:             '#DC2626',
    dangerBg:           'rgba(220, 38, 38, 0.10)',
    info:               '#2563EB',
    infoBg:             'rgba(37, 99, 235, 0.10)',
  },
};

// ─── Playful (kids mode) overrides ───────────────────────────────────────────
// Applied on top of dark or light when themeMode === 'kids'
const playfulOverrides = {
  dark: {
    // Slightly warmer background tones for kids
    backgroundMuted: '#1A1C35',
    primaryBg: 'rgba(99, 102, 241, 0.14)',
  },
  light: {
    backgroundMuted: '#F0EEFF',
    primaryBg: 'rgba(79, 70, 229, 0.08)',
  },
};

// ─── Export ──────────────────────────────────────────────────────────────────
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

export function getThemeTokens(theme = 'dark', mode = 'kids') {
  const palette = themePalettes[theme] || themePalettes.dark;
  const overrides = mode === 'kids' ? (playfulOverrides[theme] || {}) : {};
  return { ...palette, ...overrides };
}
