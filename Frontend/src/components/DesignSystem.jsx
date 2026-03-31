/**
 * Mission School — Design System Components
 * ─────────────────────────────────────────
 * All icons are minimal SVG vectors (Rounded style, 2px stroke, filled as needed).
 * No emoji. Professional × Playful visual language.
 *
 * Exports:
 *   Icons         — MsIcon family (SVG, consistent 24×24 viewBox)
 *   Toast         — portal-based toast notifications
 *   useToast      — hook for triggering toasts
 *   EmptyState    — guided empty states
 *   ErrorState    — human-readable error states with retry
 *   ProgressRing  — SVG circular progress (for child achievements)
 *   ProgressBar   — linear progress bar
 *   StepIndicator — onboarding step dots
 *   RewardBadge   — animated achievement badge
 *   SkeletonCard  — shimmer loading placeholder
 *   Spinner       — loading spinner
 *   Badge         — status / label chip
 *   Alert         — inline alert banner
 */

import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// ════════════════════════════════════════════════════════════════
// ICONS — MsIcon Family
// Rounded style, 24×24 viewBox, 2px stroke-width
// ════════════════════════════════════════════════════════════════

const iconDefaults = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Icon({ size = 20, color = 'currentColor', strokeWidth = 2, className = '', style = {}, children, title }) {
  return (
    <svg
      {...iconDefaults}
      width={size}
      height={size}
      stroke={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

export const MsIcon = {
  // ── Navigation ────────────────────────────────────────────
  Home: (p) => (
    <Icon {...p}>
      <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" />
    </Icon>
  ),
  Back: (p) => (
    <Icon {...p}>
      <path d="M19 12H5M5 12L11 18M5 12L11 6" />
    </Icon>
  ),
  Forward: (p) => (
    <Icon {...p}>
      <path d="M5 12H19M19 12L13 6M19 12L13 18" />
    </Icon>
  ),
  ChevronDown: (p) => (
    <Icon {...p}>
      <path d="M6 9L12 15L18 9" />
    </Icon>
  ),
  ChevronUp: (p) => (
    <Icon {...p}>
      <path d="M18 15L12 9L6 15" />
    </Icon>
  ),
  ChevronRight: (p) => (
    <Icon {...p}>
      <path d="M9 18L15 12L9 6" />
    </Icon>
  ),
  ChevronLeft: (p) => (
    <Icon {...p}>
      <path d="M15 18L9 12L15 6" />
    </Icon>
  ),
  Menu: (p) => (
    <Icon {...p}>
      <path d="M3 6H21M3 12H21M3 18H21" />
    </Icon>
  ),
  Close: (p) => (
    <Icon {...p}>
      <path d="M18 6L6 18M6 6L18 18" />
    </Icon>
  ),
  // ── Auth / User ───────────────────────────────────────────
  User: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20" />
    </Icon>
  ),
  Users: (p) => (
    <Icon {...p}>
      <circle cx="9" cy="7" r="3.5" />
      <path d="M3 20C3 17.2 5.7 15 9 15C10.2 15 11.4 15.4 12.3 16" />
      <circle cx="17" cy="9" r="3" />
      <path d="M13 20C13 17.8 14.8 16 17 16C19.2 16 21 17.8 21 20" />
    </Icon>
  ),
  Admin: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20C4 17 7.58 14 12 14C16.42 14 20 17 20 20" />
      <path d="M18 2L20 4L18 6" strokeFill="none" />
      <circle cx="19" cy="4" r="0" fill="currentColor" />
    </Icon>
  ),
  Teacher: (p) => (
    <Icon {...p}>
      <rect x="2" y="3" width="20" height="13" rx="2" />
      <path d="M8 21H16M12 16V21" />
      <path d="M7 8H17M7 11H13" />
    </Icon>
  ),
  Student: (p) => (
    <Icon {...p}>
      <path d="M12 3L22 8L12 13L2 8L12 3Z" />
      <path d="M6 10.5V16C6 16 8 19 12 19C16 19 18 16 18 16V10.5" />
      <path d="M22 8V14" />
    </Icon>
  ),
  Parent: (p) => (
    <Icon {...p}>
      <circle cx="9" cy="6" r="3.5" />
      <path d="M2 20C2 17 5.13 15 9 15" />
      <circle cx="17" cy="10" r="3" />
      <path d="M12 20C12 17.8 14.2 16 17 16C19.8 16 22 17.8 22 20" />
    </Icon>
  ),
  Lock: (p) => (
    <Icon {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" />
    </Icon>
  ),
  Mail: (p) => (
    <Icon {...p}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7L12 13L22 7" />
    </Icon>
  ),
  Eye: (p) => (
    <Icon {...p}>
      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  ),
  EyeOff: (p) => (
    <Icon {...p}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M1 1L23 23" />
    </Icon>
  ),
  // ── Subjects ──────────────────────────────────────────────
  Book: (p) => (
    <Icon {...p}>
      <path d="M4 19.5C4 18.12 5.12 17 6.5 17H20" />
      <path d="M6.5 2H20V22H6.5C5.12 22 4 20.88 4 19.5V4.5C4 3.12 5.12 2 6.5 2Z" />
      <path d="M8 7H16M8 11H13" />
    </Icon>
  ),
  BookOpen: (p) => (
    <Icon {...p}>
      <path d="M2 3H8C9.06 3 10.09 3.42 10.87 4.17C11.65 4.92 12 5.94 12 7V21C12 20.07 11.63 19.18 10.95 18.54C10.28 17.9 9.35 17.5 8.37 17.5H2V3Z" />
      <path d="M22 3H16C14.94 3 13.91 3.42 13.13 4.17C12.35 4.92 12 5.94 12 7V21C12 20.07 12.37 19.18 13.05 18.54C13.72 17.9 14.65 17.5 15.63 17.5H22V3Z" />
    </Icon>
  ),
  Calculator: (p) => (
    <Icon {...p}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="7" y="5" width="10" height="4" rx="1" fill="currentColor" stroke="none" />
      <circle cx="8"  cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="8"  cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Atom: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="10" ry="4" />
      <ellipse cx="12" cy="12" rx="10" ry="4" style={{ transform: 'rotate(60deg)', transformOrigin: '12px 12px' }} />
      <ellipse cx="12" cy="12" rx="10" ry="4" style={{ transform: 'rotate(-60deg)', transformOrigin: '12px 12px' }} />
    </Icon>
  ),
  Globe: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" />
      <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" />
      <path d="M2 12H22" />
      <path d="M4.93 7H19.07M4.93 17H19.07" />
    </Icon>
  ),
  Monitor: (p) => (
    <Icon {...p}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21H16M12 17V21" />
    </Icon>
  ),
  // ── Actions ───────────────────────────────────────────────
  Plus: (p) => (
    <Icon {...p}>
      <path d="M12 5V19M5 12H19" />
    </Icon>
  ),
  Edit: (p) => (
    <Icon {...p}>
      <path d="M11 4H4C3.47 4 2.96 4.21 2.59 4.59C2.21 4.96 2 5.47 2 6V20C2 20.53 2.21 21.04 2.59 21.41C2.96 21.79 3.47 22 4 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V13" />
      <path d="M18.5 2.5C18.9 2.1 19.44 1.87 20 1.87C20.56 1.87 21.1 2.1 21.5 2.5C21.9 2.9 22.12 3.44 22.12 4C22.12 4.56 21.9 5.1 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" />
    </Icon>
  ),
  Trash: (p) => (
    <Icon {...p}>
      <path d="M3 6H21M8 6V4H16V6" />
      <path d="M19 6L18.1 19C18 19.6 17.5 20 16.9 20H7.1C6.5 20 6 19.6 5.9 19L5 6" />
      <path d="M10 11V17M14 11V17" />
    </Icon>
  ),
  Upload: (p) => (
    <Icon {...p}>
      <path d="M21 15V19C21 19.5 20.8 20 20.4 20.4C20 20.8 19.5 21 19 21H5C4.5 21 4 20.8 3.6 20.4C3.2 20 3 19.5 3 19V15" />
      <path d="M17 8L12 3L7 8" />
      <path d="M12 3V15" />
    </Icon>
  ),
  Download: (p) => (
    <Icon {...p}>
      <path d="M21 15V19C21 19.5 20.8 20 20.4 20.4C20 20.8 19.5 21 19 21H5C4.5 21 4 20.8 3.6 20.4C3.2 20 3 19.5 3 19V15" />
      <path d="M7 10L12 15L17 10" />
      <path d="M12 15V3" />
    </Icon>
  ),
  Search: (p) => (
    <Icon {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21L16.65 16.65" />
    </Icon>
  ),
  Filter: (p) => (
    <Icon {...p}>
      <path d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z" />
    </Icon>
  ),
  Refresh: (p) => (
    <Icon {...p}>
      <path d="M23 4V10H17" />
      <path d="M20.49 15A9 9 0 1 1 18.85 8.36L23 10" />
    </Icon>
  ),
  Settings: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15A1.65 1.65 0 0 0 20 17.1L21.5 18.6C21.89 19 21.89 19.61 21.5 20L20 21.5C19.61 21.89 19 21.89 18.6 21.5L17.1 20C16.76 20.13 16.4 20.21 16 20.24V22H14V20.24C13.6 20.21 13.24 20.13 12.9 20L11.4 21.5C11 21.89 10.39 21.89 10 21.5L8.5 20C8.11 19.61 8.11 19 8.5 18.6L10 17.1A1.65 1.65 0 0 0 10.6 15 1.65 1.65 0 0 0 8.5 13.9L7 12.4C6.61 12 6.61 11.39 7 11L8.5 9.5C8.89 9.11 9.5 9.11 9.9 9.5L11.4 11C11.74 10.87 12.1 10.79 12.5 10.76V9H14.5V10.76C14.9 10.79 15.26 10.87 15.6 11L17.1 9.5C17.5 9.11 18.11 9.11 18.5 9.5L20 11C20.39 11.39 20.39 12 20 12.4L18.5 13.9A1.65 1.65 0 0 0 19.4 15Z" />
    </Icon>
  ),
  Copy: (p) => (
    <Icon {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4C3.47 15 2.96 14.79 2.59 14.41C2.21 14.04 2 13.53 2 13V4C2 3.47 2.21 2.96 2.59 2.59C2.96 2.21 3.47 2 4 2H13C13.53 2 14.04 2.21 14.41 2.59C14.79 2.96 15 3.47 15 4V5" />
    </Icon>
  ),
  // ── Status ────────────────────────────────────────────────
  Check: (p) => (
    <Icon {...p}>
      <path d="M20 6L9 17L4 12" />
    </Icon>
  ),
  CheckCircle: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12L11 14L15 10" />
    </Icon>
  ),
  XCircle: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9L9 15M9 9L15 15" />
    </Icon>
  ),
  AlertTriangle: (p) => (
    <Icon {...p}>
      <path d="M10.29 3.86L1.82 18A2 2 0 0 0 3.54 21H20.46A2 2 0 0 0 22.18 18L13.71 3.86A2 2 0 0 0 10.29 3.86Z" />
      <path d="M12 9V13M12 17H12.01" />
    </Icon>
  ),
  Info: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8H12.01M12 12V16" />
    </Icon>
  ),
  // ── Academic ──────────────────────────────────────────────
  Star: (p) => (
    <Icon {...p}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </Icon>
  ),
  StarFilled: (p) => (
    <Icon {...p} style={{ ...p.style }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Trophy: (p) => (
    <Icon {...p}>
      <path d="M8 21H16M12 17V21" />
      <path d="M7 4H17V11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11V4Z" />
      <path d="M7 7H4C4 7 3 10 5 12" />
      <path d="M17 7H20C20 7 21 10 19 12" />
    </Icon>
  ),
  Medal: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="14" r="6" />
      <path d="M8.5 2.5L8 8M15.5 2.5L16 8M8 8H16" />
      <path d="M10 14L12 12L14 14L12 16L10 14Z" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Lightning: (p) => (
    <Icon {...p}>
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
    </Icon>
  ),
  Target: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Chart: (p) => (
    <Icon {...p}>
      <path d="M18 20V10M12 20V4M6 20V14" />
    </Icon>
  ),
  // ── Content ───────────────────────────────────────────────
  Headphones: (p) => (
    <Icon {...p}>
      <path d="M3 18V12A9 9 0 0 1 21 12V18" />
      <path d="M21 19C21 19.6 20.6 20 20 20H19C18.4 20 18 19.6 18 19V16C18 15.4 18.4 15 19 15H21V19Z" />
      <path d="M3 19C3 19.6 3.4 20 4 20H5C5.6 20 6 19.6 6 19V16C6 15.4 5.6 15 5 15H3V19Z" />
    </Icon>
  ),
  Mic: (p) => (
    <Icon {...p}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10C19 14.42 15.87 18 12 18C8.13 18 5 14.42 5 10" />
      <path d="M12 18V22M8 22H16" />
    </Icon>
  ),
  MicOff: (p) => (
    <Icon {...p}>
      <path d="M1 1L23 23" />
      <path d="M9 9V13C9 14.66 10.34 16 12 16C12.93 16 13.76 15.57 14.33 14.9" />
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10C19 14.42 15.87 18 12 18C10.2 18 8.54 17.37 7.26 16.32" />
      <path d="M12 18V22M8 22H16" />
    </Icon>
  ),
  Volume: (p) => (
    <Icon {...p}>
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
      <path d="M15.54 8.46A5 5 0 0 1 15.54 15.54" />
      <path d="M19.07 4.93A10 10 0 0 1 19.07 19.07" />
    </Icon>
  ),
  VolumeOff: (p) => (
    <Icon {...p}>
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
      <path d="M23 9L17 15M17 9L23 15" />
    </Icon>
  ),
  // ── Calendar / Time ───────────────────────────────────────
  Calendar: (p) => (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2V6M8 2V6M3 10H21" />
    </Icon>
  ),
  Clock: (p) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6V12L16 14" />
    </Icon>
  ),
  // ── Layout ───────────────────────────────────────────────
  Grid: (p) => (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </Icon>
  ),
  List: (p) => (
    <Icon {...p}>
      <path d="M8 6H21M8 12H21M8 18H21" />
      <circle cx="3" cy="6"  r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  // ── Misc ─────────────────────────────────────────────────
  PDF: (p) => (
    <Icon {...p}>
      <path d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z" />
      <path d="M14 2V8H20" />
      <path d="M9 13H10.5C11.33 13 12 12.33 12 11.5C12 10.67 11.33 10 10.5 10H9V15M15 10V15M13 12.5H15" />
    </Icon>
  ),
  Sparkle: (p) => (
    <Icon {...p}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      <path d="M19 18L19.75 20.25L22 21L19.75 21.75L19 24L18.25 21.75L16 21L18.25 20.25L19 18Z" strokeWidth="1.5" />
    </Icon>
  ),
  Robot: (p) => (
    <Icon {...p}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M10 8V6C10 4.9 10.9 4 12 4C13.1 4 14 4.9 14 6V8" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 17H15" />
      <path d="M1 11H3M21 11H23" />
    </Icon>
  ),
  Diamond: (p) => (
    <Icon {...p}>
      <path d="M6 3H18L22 9L12 21L2 9L6 3Z" />
      <path d="M2 9H22M6 3L12 21M18 3L12 21" />
    </Icon>
  ),
};

// ════════════════════════════════════════════════════════════════
// TOAST SYSTEM
// ════════════════════════════════════════════════════════════════

const ToastContext = createContext(null);

let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ message, type = 'info', duration = 3200 }) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 250);
    }, duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const iconMap = {
    success: <MsIcon.CheckCircle size={18} color="currentColor" />,
    error:   <MsIcon.XCircle    size={18} color="currentColor" />,
    warning: <MsIcon.AlertTriangle size={18} color="currentColor" />,
    info:    <MsIcon.Info        size={18} color="currentColor" />,
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {createPortal(
        <div className="ms-toast-container" role="region" aria-label="Notifications" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`ms-toast ms-toast--${toast.type}${toast.exiting ? ' ms-toast--exit' : ''}`}
              role="alert"
            >
              <span style={{ flexShrink: 0 }}>{iconMap[toast.type]}</span>
              <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                {toast.message}
              </span>
              <button
                onClick={() => dismiss(toast.id)}
                className="ms-icon-btn ms-btn-sm"
                style={{ minHeight: 28, minWidth: 28, width: 28, height: 28, marginInlineStart: 4 }}
                aria-label="Dismiss notification"
              >
                <MsIcon.Close size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ════════════════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════════════════

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  actionLabel,
  style = {},
}) {
  return (
    <div className="ms-empty-state" style={style}>
      {IconComponent && (
        <div className="ms-empty-state__icon">
          <IconComponent size={36} />
        </div>
      )}
      {title && <div className="ms-empty-state__title">{title}</div>}
      {description && <div className="ms-empty-state__desc">{description}</div>}
      {action && actionLabel && (
        <button className="ms-btn ms-btn-primary" onClick={action} style={{ marginTop: 8 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ERROR STATE
// ════════════════════════════════════════════════════════════════

export function ErrorState({
  title = 'مشکلی پیش آمد',
  description = 'یک خطا رخ داده. دوباره امتحان کنید.',
  onRetry,
  retryLabel = 'تلاش مجدد',
  style = {},
}) {
  return (
    <div className="ms-error-state" style={style}>
      <div className="ms-error-state__icon">
        <MsIcon.AlertTriangle size={28} />
      </div>
      <div className="ms-error-state__title">{title}</div>
      <div className="ms-error-state__desc">{description}</div>
      {onRetry && (
        <button
          className="ms-btn ms-btn-secondary"
          onClick={onRetry}
          style={{ marginTop: 12 }}
        >
          <MsIcon.Refresh size={16} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PROGRESS RING (SVG circular, for child achievements)
// ════════════════════════════════════════════════════════════════

export function ProgressRing({
  value = 0,         // 0–100
  size = 80,
  strokeWidth = 6,
  color = 'var(--color-mango)',
  trackColor = 'var(--color-bg-subtle)',
  label,
  labelStyle = {},
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: `stroke-dashoffset var(--motion-slow) var(--motion-ease)` }}
        />
      </svg>
      {label !== undefined && (
        <div style={{
          position: 'absolute',
          fontSize: size < 60 ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-black)',
          color: 'var(--color-text-primary)',
          ...labelStyle,
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PROGRESS BAR (linear)
// ════════════════════════════════════════════════════════════════

export function ProgressBar({
  value = 0,
  max = 100,
  color = 'primary', // 'primary' | 'mango' | 'aqua'
  size = 'md',       // 'sm' | 'md' | 'lg'
  showLabel = false,
  label,
  style = {},
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeClass = size === 'lg'
    ? 'ms-progress-track--lg'
    : size === 'sm'
    ? ''
    : '';
  const fillClass = color === 'mango' ? 'ms-progress-fill--mango' : '';

  return (
    <div style={style}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{label}</span>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text-secondary)' }}>
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        className={`ms-progress-track ${sizeClass}`}
        style={size === 'sm' ? { height: 5 } : {}}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`ms-progress-fill ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STEP INDICATOR (onboarding)
// ════════════════════════════════════════════════════════════════

export function StepIndicator({ total = 4, current = 1, style = {} }) {
  return (
    <div
      className="ms-steps"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      style={{ gap: 0, ...style }}
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isDone   = step < current;
        const isActive = step === current;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`ms-step-dot${isActive ? ' ms-step-dot--active' : ''}${isDone ? ' ms-step-dot--done' : ''}`}
              aria-label={`Step ${step}${isDone ? ' completed' : isActive ? ' current' : ''}`}
            />
            {step < total && (
              <div className={`ms-step-connector${isDone ? ' ms-step-connector--done' : ''}`} style={{ width: 24 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// REWARD BADGE (animated achievement)
// ════════════════════════════════════════════════════════════════

export function RewardBadge({
  tier = 'gold',    // 'gold' | 'silver' | 'bronze' | 'primary'
  icon: IconComponent = MsIcon.Trophy,
  size = 72,
  label,
  style = {},
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...style }}>
      <div
        className={`ms-reward ms-reward--${tier}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={label || 'Achievement badge'}
      >
        <IconComponent size={Math.round(size * 0.44)} color="#fff" />
      </div>
      {label && (
        <div style={{
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
          maxWidth: size + 20,
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SKELETON CARD (shimmer loading)
// ════════════════════════════════════════════════════════════════

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div className="ms-card" style={{ ...style }}>
      <div className="ms-skeleton" style={{ height: 20, width: '60%', borderRadius: 6, marginBottom: 14 }} />
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="ms-skeleton"
          style={{
            height: 14,
            width: i === lines - 1 ? '45%' : '100%',
            borderRadius: 6,
            marginBottom: i < lines - 1 ? 10 : 0,
          }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SPINNER
// ════════════════════════════════════════════════════════════════

export function Spinner({ size = 'md', color = 'primary', style = {}, label = 'Loading...' }) {
  return (
    <div
      className={`ms-spinner ms-spinner--${size} ms-spinner--${color}`}
      role="status"
      aria-label={label}
      style={style}
    />
  );
}

// ════════════════════════════════════════════════════════════════
// BADGE (status chip)
// ════════════════════════════════════════════════════════════════

export function Badge({ children, variant = 'primary', style = {} }) {
  return (
    <span className={`ms-badge ms-badge-${variant}`} style={style}>
      {children}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════
// ALERT (inline banner)
// ════════════════════════════════════════════════════════════════

const alertIconMap = {
  success: MsIcon.CheckCircle,
  error:   MsIcon.XCircle,
  warning: MsIcon.AlertTriangle,
  info:    MsIcon.Info,
};

export function Alert({ type = 'info', children, style = {} }) {
  const IconComp = alertIconMap[type] || MsIcon.Info;
  return (
    <div className={`ms-alert ms-alert--${type === 'error' ? 'error' : type}`} role="alert" style={style}>
      <IconComp size={18} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// USER FLOW CONSTANTS (UX paths per role)
// ════════════════════════════════════════════════════════════════

export const USER_FLOWS = {
  student: [
    { step: 1, key: 'login',    label: 'ورود' },
    { step: 2, key: 'home',     label: 'انتخاب درس' },
    { step: 3, key: 'mission',  label: 'شروع مأموریت' },
    { step: 4, key: 'question', label: 'پاسخ به سوال' },
    { step: 5, key: 'reward',   label: 'دریافت جایزه' },
  ],
  teacher: [
    { step: 1, key: 'login',    label: 'ورود' },
    { step: 2, key: 'overview', label: 'داشبورد' },
    { step: 3, key: 'course',   label: 'مدیریت درس' },
    { step: 4, key: 'mission',  label: 'ایجاد مأموریت' },
    { step: 5, key: 'publish',  label: 'انتشار' },
  ],
  admin: [
    { step: 1, key: 'login',   label: 'ورود' },
    { step: 2, key: 'users',   label: 'مدیریت کاربران' },
    { step: 3, key: 'detail',  label: 'جزئیات کاربر' },
    { step: 4, key: 'actions', label: 'اقدامات' },
  ],
};
