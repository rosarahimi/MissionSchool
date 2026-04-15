export const COLORS = {
  english: { bg: "#4F46E5", dark: "#3730A3" },
  math: { bg: "#F59E0B", dark: "#D97706" },
  science: { bg: "#06B6D4", dark: "#0891B2" },
  computer: { bg: "#6366F1", dark: "#4F46E5" },
  persian: { bg: "#EC4899", dark: "#DB2777" },
  arabic: { bg: "#10B981", dark: "#059669" },
};

export const SUBJECTS = [
  { id: "english", labelKey: "subjects.english", emoji: "🇺🇸", color: COLORS.english.bg },
  { id: "math", labelKey: "subjects.math", emoji: "➗", color: COLORS.math.bg },
  { id: "science", labelKey: "subjects.science", emoji: "🔬", color: COLORS.science.bg },
  { id: "computer", labelKey: "subjects.computer", emoji: "💻", color: COLORS.computer.bg },
  { id: "persian", labelKey: "subjects.persian", emoji: "📚", color: COLORS.persian.bg },
  { id: "arabic", labelKey: "subjects.arabic", emoji: "📝", color: COLORS.arabic.bg },
];

export const BADGES = [
  { id: "first_star", emoji: "⭐", labelKey: "badges.first_star", condition: (s) => s.totalStars >= 1 },
  { id: "ten_stars", emoji: "🌟", labelKey: "badges.ten_stars", condition: (s) => s.totalStars >= 10 },
  { id: "speed_demon", emoji: "⚡", labelKey: "badges.speed_demon", condition: (s) => s.fastAnswers >= 3 },
  { id: "perfect", emoji: "💎", labelKey: "badges.perfect", condition: (s) => s.perfectStages >= 1 },
  { id: "lesson_done", emoji: "🎓", labelKey: "badges.lesson_done", condition: (s) => s.completedLessons >= 1 },
  { id: "four_lessons", emoji: "🏆", labelKey: "badges.four_lessons", condition: (s) => s.completedLessons >= 6 },
];
