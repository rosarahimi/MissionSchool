import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslation } from 'react-i18next';
import * as api from "./api";
import "./i18n";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

// ── Inline styles (no Tailwind needed beyond defaults) ──────────────────────
const COLORS = {
  persian: { bg: "#FF6B6B", light: "#FFE5E5", dark: "#C0392B", text: "#fff" },
  arabic: { bg: "#4ECDC4", light: "#E0F7F5", dark: "#1A8E87", text: "#fff" },
  english: { bg: "#45B7D1", light: "#E0F4FA", dark: "#1A7A9A", text: "#fff" },
  science: { bg: "#96CEB4", light: "#E0F5EA", dark: "#3A7A5A", text: "#fff" },
  math: { bg: "#9B59B6", light: "#F4ECF7", dark: "#6C3483", text: "#fff" },
  computer: { bg: "#34495E", light: "#EAECEE", dark: "#2C3E50", text: "#fff" },
  quran: { bg: "#FFC107", light: "#FFF2CC", dark: "#FF9900", text: "#fff" },
};

const SUBJECTS = [
  { id: "english", labelKey: "subjects.english", emoji: "🇺🇸", dir: "ltr", color: COLORS.english },
  { id: "math", labelKey: "subjects.math", emoji: "➗", dir: "rtl", color: COLORS.math },
  { id: "science", labelKey: "subjects.science", emoji: "🔬", dir: "rtl", color: COLORS.science },
  { id: "computer", labelKey: "subjects.computer", emoji: "💻", dir: "rtl", color: COLORS.computer },
  { id: "persian", labelKey: "subjects.persian", emoji: "📚", dir: "rtl", color: COLORS.persian },
  { id: "arabic", labelKey: "subjects.arabic", emoji: "📝", dir: "rtl", color: COLORS.arabic },
];

function shuffle(arr) {
  const a = Array.isArray(arr) ? [...arr] : [];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeOrderText(s) {
  return String(s || '')
    .replace(/[\u200c\u200d]/g, '')
    .replace(/[\s\u00A0]+/g, ' ')
    .replace(/[.\u06d4،,:;!؟“”"'«»()\[\]{}]/g, '')
    .trim();
}

const BADGES = [
  { id: "first_star", emoji: "⭐", labelKey: "badges.first_star", condition: (s) => s.totalStars >= 1 },
  { id: "ten_stars", emoji: "🌟", labelKey: "badges.ten_stars", condition: (s) => s.totalStars >= 10 },
  { id: "speed_demon", emoji: "⚡", labelKey: "badges.speed_demon", condition: (s) => s.fastAnswers >= 3 },
  { id: "perfect", emoji: "💎", labelKey: "badges.perfect", condition: (s) => s.perfectStages >= 1 },
  { id: "lesson_done", emoji: "🎓", labelKey: "badges.lesson_done", condition: (s) => s.completedLessons >= 1 },
  { id: "four_lessons", emoji: "🏆", labelKey: "badges.four_lessons", condition: (s) => s.completedLessons >= 6 },
];

// ─── Live Clock Component ────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shamsiDate = new Intl.DateTimeFormat('fa-IR', {
    calendar: 'persian',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(time);

  const miladiDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(time);

  const weekday = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(time);
  const timeStr = time.toLocaleTimeString('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  });

  return (
    <div style={{
      position: 'absolute', top: '24px', left: '24px', textAlign: 'left',
      color: 'rgba(255,255,255,0.7)', fontFamily: "'Vazirmatn', sans-serif",
      zIndex: 10, pointerEvents: 'none', animation: 'fadeSlide 0.8s both'
    }}>
      <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginBottom: '6px', letterSpacing: '1px' }}>
        {timeStr}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '2px solid rgba(78,205,196,0.3)', paddingLeft: '10px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{shamsiDate}</div>
        <div style={{ fontSize: '11px', opacity: 0.6, fontWeight: '500' }}>{miladiDate}</div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4ECDC4', marginTop: '2px' }}>
          {weekday}
        </div>
      </div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      :root {
        --ms-scroll-thumb: rgba(255,255,255,0.18);
        --ms-scroll-thumb-hover: rgba(255,255,255,0.28);
        --ms-scroll-track: rgba(0,0,0,0);
      }
      * {
        scrollbar-width: thin;
        scrollbar-color: var(--ms-scroll-thumb) var(--ms-scroll-track);
      }
      *::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      *::-webkit-scrollbar-track {
        background: var(--ms-scroll-track);
      }
      *::-webkit-scrollbar-thumb {
        background: var(--ms-scroll-thumb);
        border-radius: 999px;
        border: 2px solid rgba(0,0,0,0);
        background-clip: padding-box;
      }
      *::-webkit-scrollbar-thumb:hover {
        background: var(--ms-scroll-thumb-hover);
        border: 2px solid rgba(0,0,0,0);
        background-clip: padding-box;
      }
    `}</style>
  );
}

function DashboardScreen({ token, user, SUBJECTS, api, onBack }) {
  const { t } = useTranslation();
  const [grade, setGrade] = useState(3);
  const [subject, setSubject] = useState('persian');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [missionAiProvider, setMissionAiProvider] = useState(() => {
    try {
      return localStorage.getItem('missionAiProvider') || 'anthropic';
    } catch {
      return 'anthropic';
    }
  });
  const [status, setStatus] = useState(null);
  const [extractJob, setExtractJob] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [dashboardPdfFile, setDashboardPdfFile] = useState(null);
  const dashboardPdfRef = useRef();

  const [showMissionExtract, setShowMissionExtract] = useState(false);
  const [missionTargetLessonId, setMissionTargetLessonId] = useState('');
  const [pageText, setPageText] = useState('');
  const [pageImageFile, setPageImageFile] = useState(null);
  const dashboardPageFileRef = useRef();

  const [showMissionManager, setShowMissionManager] = useState(false);
  const [missionManagerLesson, setMissionManagerLesson] = useState(null);
  const [missionJson, setMissionJson] = useState('');

  const [showCourseManager, setShowCourseManager] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [newCourseGrade, setNewCourseGrade] = useState(3);
  const [newCourseSubject, setNewCourseSubject] = useState('persian');
  const [newCourseTitle, setNewCourseTitle] = useState('');

  const [newLessonChapter, setNewLessonChapter] = useState('');
  const [newLessonChapterTitle, setNewLessonChapterTitle] = useState('');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [addLessonCourseId, setAddLessonCourseId] = useState('');
  const [isNewChapter, setIsNewChapter] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [editChapter, setEditChapter] = useState('');
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const loadStatus = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const s = await api.curriculumStatus(token, { grade, subject });
      setStatus(s);

      const nextCourses = Array.isArray(s?.courses) ? s.courses : [];
      const hasSelected = !!selectedCourseId && nextCourses.some(c => String(c?.courseId) === String(selectedCourseId));
      if (!hasSelected) {
        const first = nextCourses[0];
        setSelectedCourseId(first?.courseId ? String(first.courseId) : '');
      }
    } finally {
      setLoading(false);
    }
  }, [token, api, grade, subject, selectedCourseId]);

  async function createCourse() {
    setBusyKey('course-create');
    try {
      const payload = {
        grade: Number(newCourseGrade),
        subject: newCourseSubject,
        ...(String(newCourseTitle || '').trim() ? { title: String(newCourseTitle || '').trim() } : {}),
      };
      const res = await api.createCourse(token, payload);
      if (res?.error) {
        alert(res.error);
        return;
      }
      setNewCourseTitle('');
      await loadAllCourses();
      if (Number(res.grade) === Number(grade) && String(res.subject) === String(subject)) {
        await loadStatus();
      }
    } finally {
      setBusyKey('');
    }
  }

  async function removeCourse(courseId) {
    if (!confirm(t('confirm.deleteCourse'))) return;
    setBusyKey(`course-del-${courseId}`);
    try {
      const res = await api.deleteCourse(token, courseId);
      if (res?.error) {
        alert(res.error);
        return;
      }
      await loadAllCourses();
      await loadStatus();
      setLessons([]);
      setSelectedLesson(null);
      setSelectedLessonId(null);
    } finally {
      setBusyKey('');
    }
  }

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    try {
      localStorage.setItem('missionAiProvider', missionAiProvider);
    } catch {
      // ignore
    }
  }, [missionAiProvider]);

  const loadAllCourses = useCallback(async () => {
    if (!token) return;
    const list = await api.curriculumCourses(token);
    setAllCourses(Array.isArray(list) ? list : []);
  }, [token, api]);

  async function loadLessonsForCourse(courseId, opts = {}) {
    const list = await api.curriculumLessons(token, { courseId, chapterId: opts.chapterId, includeUnlinked: true });
    setLessons(Array.isArray(list) ? list : []);
  }

  async function loadLessonsForSubject() {
    const list = await api.curriculumLessons(token, { grade, subject });
    setLessons(Array.isArray(list) ? list : []);
  }

  async function toggleLessonsPanel() {
    if (lessonsOpen) {
      setLessonsOpen(false);
      return;
    }
    setLessonsOpen(true);
    await loadLessonsForSubject();
  }

  async function openLesson(lessonId) {
    setSelectedLessonId(lessonId);
    const data = await api.curriculumLessonDetails(token, lessonId);
    setSelectedLesson(data);
    setEditChapter(data?.chapter ?? '');
    setEditChapterTitle(data?.chapterId?.title || '');
    setEditTitle(data?.title || '');
    setEditContent(data?.content || '');

    setMissionTargetLessonId(lessonId);
  }

  async function openMissionManager(lessonId) {
    setBusyKey(`mission-open-${lessonId}`);
    try {
      const data = await api.curriculumLessonDetails(token, lessonId);
      if (data?.error) {
        alert(data.error);
        return;
      }
      setMissionManagerLesson(data);
      setMissionJson(JSON.stringify(Array.isArray(data?.missions) ? data.missions : [], null, 2));
      setShowMissionManager(true);
    } finally {
      setBusyKey('');
    }
  }

  async function saveMissionManager() {
    if (!missionManagerLesson?._id) return;
    let parsed;
    try {
      parsed = JSON.parse(missionJson || '[]');
    } catch {
      alert('JSON نامعتبر است');
      return;
    }
    if (!Array.isArray(parsed)) {
      alert('فرمت باید آرایه باشد');
      return;
    }
    setBusyKey('mission-save');
    try {
      const res = await api.updateLesson(token, missionManagerLesson._id, { missions: parsed });
      if (res?.error) {
        alert(res.error);
        return;
      }
      setMissionManagerLesson(prev => prev ? { ...prev, missions: parsed } : prev);
      setLessons(prev => prev.map(l => (l._id === missionManagerLesson._id ? { ...l, missions: parsed } : l)));
      alert(t('dashboard.missionsSaved'));
    } finally {
      setBusyKey('');
    }
  }

  async function autoGenerateMissionsFromLessonContent() {
    if (!missionManagerLesson?._id) return;
    const lessonText = String(missionManagerLesson?.content || '').trim();
    if (!lessonText) {
      alert(t('errors.emptyLessonContent'));
      return;
    }
    setBusyKey('mission-auto');
    try {
      const genRes = await api.generateLessonMissions(token, missionManagerLesson._id, { provider: missionAiProvider });
      if (genRes?.error) {
        alert(genRes.error);
        return;
      }
      const parsed = Array.isArray(genRes?.missions) ? genRes.missions : [];
      if (!parsed.length) {
        alert('ماموریت معتبر تولید نشد');
        return;
      }

      setMissionJson(JSON.stringify(parsed, null, 2));
      setMissionManagerLesson(prev => prev ? { ...prev, missions: parsed } : prev);
      setLessons(prev => prev.map(l => (l._id === missionManagerLesson._id ? { ...l, missions: parsed } : l)));
      alert('ماموریت‌ها ساخته و ذخیره شدند');
    } catch {
      alert('خطا در ساخت/ذخیره ماموریت');
    } finally {
      setBusyKey('');
    }
  }

  function removeMissionAt(index) {
    let parsed;
    try {
      parsed = JSON.parse(missionJson || '[]');
    } catch {
      alert('JSON نامعتبر است');
      return;
    }
    if (!Array.isArray(parsed)) {
      alert('فرمت باید آرایه باشد');
      return;
    }
    const next = parsed.filter((_, i) => i !== index);
    setMissionJson(JSON.stringify(next, null, 2));
  }

  async function uploadTextbookPdf() {
    if (!dashboardPdfFile) return;
    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('grade', String(grade));
    formData.append('pdf', dashboardPdfFile);

    setBusyKey('pdf-upload');
    try {
      const res = await api.curriculumTextbookUpload(token, formData);
      if (!res?.success) {
        alert(res?.error || 'Upload failed');
        return;
      }
      alert(res.message);
      setDashboardPdfFile(null);
      setShowPdfUpload(false);
      await loadStatus();
    } finally {
      setBusyKey('');
    }
  }

  async function deleteTextbookPdf() {
    if (!confirm(t('confirm.deletePdf'))) return;
    setBusyKey('pdf-delete');
    try {
      const res = await api.curriculumTextbookDelete(token, subject, grade);
      if (res?.error) {
        alert(res.error);
        return;
      }
      setDashboardPdfFile(null);
      await loadStatus();
    } finally {
      setBusyKey('');
    }
  }

  async function extractMissionsFromPage() {
    if (!missionTargetLessonId) {
      alert(t('errors.noLessonSelected'));
      return;
    }
    if (!pageText.trim()) {
      alert('متن صفحه خالی است');
      return;
    }

    setBusyKey('mission-extract');
    try {
      const genRes = await api.generateLessonMissionsFromText(token, missionTargetLessonId, pageText, { provider: missionAiProvider });
      if (genRes?.error) {
        alert(genRes.error);
        return;
      }

      const parsed = Array.isArray(genRes?.missions) ? genRes.missions : [];
      if (!parsed.length) {
        alert('ماموریت معتبر تولید نشد');
        return;
      }

      alert('ماموریت‌ها ساخته و ذخیره شدند');
      setShowMissionExtract(false);
      setPageText('');
      setPageImageFile(null);
      if (selectedCourseId) await loadLessonsForCourse(selectedCourseId);
    } catch (e) {
      alert('خطا در ساخت/ذخیره ماموریت');
    } finally {
      setBusyKey('');
    }
  }

  async function ocrPageImageToText(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('فقط عکس');
      return;
    }
    setPageImageFile(file);
    setBusyKey('mission-ocr');
    try {
      const res = await api.ocrImage(token, file);
      if (res?.error) {
        alert(res.error);
        return;
      }
      setPageText(res.text || '');
    } catch {
      alert('خطا در پردازش تصویر');
    } finally {
      setBusyKey('');
    }
  }

  async function removeLesson(lessonId) {
    if (!confirm(t('confirm.deleteLesson'))) return;
    setBusyKey(`lesson-del-${lessonId}`);
    try {
      const res = await api.deleteLesson(token, lessonId);
      if (res?.error) {
        alert(res.error);
        return;
      }
      setLessons(prev => prev.filter(l => l._id !== lessonId));
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setSelectedLesson(null);
      }
      await loadStatus();
    } finally {
      setBusyKey('');
    }
  }

  async function addLesson(courseId) {
    const ch = Number(String(newLessonChapter).trim());
    const chapterTitle = String(newLessonChapterTitle || '').trim();
    const title = String(newLessonTitle || '').trim();
    const content = String(newLessonContent || '').trim();
    if (!Number.isFinite(ch)) {
      alert(t('errors.invalidChapter'));
      return;
    }
    if (!title || !content) {
      alert(t('errors.titleRequired'));
      return;
    }
    setBusyKey('lesson-create');
    try {
      const payload = {
        grade,
        subject,
        courseId,
        chapter: ch,
        chapterTitle,
        title,
        content,
        missions: [],
      };
      const res = await api.createLesson(token, payload);
      if (res?.error) {
        alert(res.error);
        return;
      }
      setNewLessonChapter('');
      setNewLessonChapterTitle('');
      setNewLessonTitle('');
      setNewLessonContent('');
      setShowAddLesson(false);
      setAddLessonCourseId('');
      await loadLessonsForSubject();
      await loadStatus();
    } finally {
      setBusyKey('');
    }
  }

  async function runExtract(course) {
    setBusyKey('extract');
    setExtractJob(null);
    try {
      const res = await api.extractTextbook(token, { grade: course.grade, subject: course.subject, ocrLang: 'fas' });
      if (!res.success) {
        alert(res.error || 'خطا در استخراج متن');
        return;
      }

      if (!res.jobId) {
        await loadStatus();
        return;
      }

      const jobId = res.jobId;
      let keep = true;
      while (keep) {
        const j = await api.getExtractJob(token, jobId);
        if (j?.error) {
          alert(j.error);
          break;
        }
        setExtractJob(j);
        if (j?.status === 'done') {
          await loadStatus();
          keep = false;
          break;
        }
        if (j?.status === 'error') {
          alert(j?.error || 'خطا در استخراج متن');
          keep = false;
          break;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    } finally {
      setBusyKey('');
    }
  }

  async function runBuild(course) {
    setBusyKey('build');
    try {
      const res = await api.buildTextbook(token, { grade: course.grade, subject: course.subject, replaceExisting: false });
      if (!res.success) alert(res.error || t('errors.buildFailed'));
      await loadStatus();
      if (res.courseId) {
        setSelectedCourseId(String(res.courseId));
        await loadLessonsForCourse(res.courseId);
      }
    } finally {
      setBusyKey('');
    }
  }

  async function saveLesson() {
    if (!selectedLessonId) return;
    setBusyKey('save');
    try {
      const chapterNum = editChapter === '' ? undefined : Number(editChapter);
      if (editChapter !== '' && !Number.isFinite(chapterNum)) {
        alert(t('errors.invalidChapter'));
        return;
      }
      const res = await api.updateLesson(token, selectedLessonId, { title: editTitle, content: editContent, chapter: chapterNum, orderIndex: chapterNum });
      if (res.error) alert(res.error);
      setSelectedLesson(res);

      if (selectedLesson?.chapterId && editChapterTitle !== undefined) {
        const chapterTitle = String(editChapterTitle || '').trim();
        if (chapterTitle) {
          const chRes = await api.updateChapter(token, selectedLesson.chapterId, { title: chapterTitle });
          if (chRes?.error) alert(chRes.error);
        }
      }

      await loadStatus();
      if (selectedLesson?.courseId) await loadLessonsForCourse(selectedLesson.courseId);
    } finally {
      setBusyKey('');
    }
  }

  if (!isTeacher) {
    return (
      <div style={{ minHeight: '100vh', padding: 24, background: '#0f1220', color: '#fff', fontFamily: "'Vazirmatn','Segoe UI',sans-serif" }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>← {t('nav.back')}</button>
        <div style={{ marginTop: 20, direction: 'rtl' }}>{t('dashboard.accessDenied')}</div>
      </div>
    );
  }

  const statusMessage = status?.message || status?.error;
  const courses = status?.courses || [];
  const course = courses.find(c => String(c?.courseId) === String(selectedCourseId)) || courses[0];

  return (
    <div style={{ minHeight: '100vh', padding: 20, background: 'linear-gradient(135deg,#0f1220,#16213e)', color: '#fff', fontFamily: "'Vazirmatn','Segoe UI',sans-serif" }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>← {t('nav.back')}</button>

      <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="number" value={grade} onChange={(e) => setGrade(Number(e.target.value))} style={{ padding: 10, borderRadius: 10, width: 120 }} />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
          {SUBJECTS.map(s => <option key={s.id} value={s.id}>{t(s.labelKey)}</option>)}
        </select>
        <button onClick={async () => { await loadAllCourses(); setShowCourseManager(true); }} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 800 }}>
          {t('nav.courses')}
        </button>
        <button onClick={loadStatus} disabled={loading} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 800 }}>
          {loading ? '...' : t('nav.refresh')}
        </button>
      </div>

      {showCourseManager && (
        <div onClick={() => setShowCourseManager(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3005,
          padding: 16
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(900px, 100%)',
            maxHeight: '85vh',
            overflow: 'auto',
            background: 'rgba(20,24,40,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 14,
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>{t('dashboard.courseManager')}</div>
              <button onClick={() => setShowCourseManager(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>{t('nav.close')}</button>
            </div>

            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>{t('dashboard.addCourse')}</div>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, alignItems: 'center' }}>
                <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>{t('dashboard.grade')}</div>
                <input type="number" value={newCourseGrade} onChange={(e) => setNewCourseGrade(Number(e.target.value))} style={{ padding: 10, borderRadius: 10 }} />

                <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>{t('dashboard.subject')}</div>
                <select value={newCourseSubject} onChange={(e) => setNewCourseSubject(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                  {SUBJECTS.map(s => <option key={s.id} value={s.id}>{t(s.labelKey)}</option>)}
                </select>

                <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>{t('dashboard.courseTitle')}</div>
                <input value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} style={{ padding: 10, borderRadius: 10, direction: 'rtl' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button onClick={createCourse} disabled={busyKey === 'course-create'} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  {busyKey === 'course-create' ? '...' : `➕ ${t('dashboard.addCourse')}`}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>{t('dashboard.courseList')}</div>
              {allCourses.length === 0 ? (
                <div style={{ marginTop: 10, direction: 'rtl', opacity: 0.8 }}>{t('dashboard.noCourses')}</div>
              ) : (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {allCourses.map(c => (
                    <div key={c._id} style={{
                      padding: 12,
                      borderRadius: 14,
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.12)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button onClick={async () => {
                          setGrade(Number(c.grade));
                          setSubject(String(c.subject));
                          setShowCourseManager(false);
                        }} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#fff', fontWeight: 900, direction: 'rtl', textAlign: 'right', padding: 0
                        }}>
                          {t('dashboard.grade')} {c.grade} — {t(SUBJECTS.find(s => s.id === c.subject)?.labelKey || c.subject)}
                          {c.title ? ` | ${c.title}` : ''}
                        </button>
                        <button onClick={() => removeCourse(c._id)} disabled={busyKey === `course-del-${c._id}`} style={{
                          padding: '8px 10px', borderRadius: 10,
                          border: 'none', cursor: 'pointer', fontWeight: 900,
                          background: 'rgba(255,77,77,0.18)', color: '#fff'
                        }}>
                          {busyKey === `course-del-${c._id}` ? '...' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,77,77,0.12)', border: '1px solid rgba(255,77,77,0.25)', direction: 'rtl' }}>
          {statusMessage}
        </div>
      )}

      

      {course?.courseId && showPdfUpload && (
        <div onClick={() => setShowPdfUpload(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3001,
          padding: 16
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(720px, 100%)',
            background: 'rgba(20,24,40,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 14,
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>{t('dashboard.pdfUpload')}</div>
              <button onClick={() => setShowPdfUpload(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>{t('nav.close')}</button>
            </div>

            {course?.pdf?.filename && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', direction: 'rtl' }}>
                <div style={{ fontWeight: 900 }}>{t('dashboard.currentFile')}</div>
                <div style={{ marginTop: 6, opacity: 0.85 }}>{course.pdf.filename}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => {
                    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');
                    window.open(`${base}/api/curriculum/textbooks/pdf/${subject}/${grade}`, '_blank');
                  }} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                    {t('dashboard.viewPdf')}
                  </button>
                  <button onClick={deleteTextbookPdf} disabled={busyKey === 'pdf-delete'} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,77,77,0.18)', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                    {busyKey === 'pdf-delete' ? '...' : t('dashboard.deletePdf')}
                  </button>
                </div>
              </div>
            )}

            <div onClick={() => dashboardPdfRef.current?.click()} style={{
              marginTop: 14,
              width: '100%',
              border: '2px dashed #FFD700',
              borderRadius: 16,
              padding: '20px 14px',
              cursor: 'pointer',
              textAlign: 'center',
              background: 'rgba(255,215,0,0.05)'
            }}>
              <div style={{ fontSize: 34 }}>{dashboardPdfFile ? '📄' : '📁'}</div>
              <div style={{ direction: 'rtl', marginTop: 6, opacity: 0.9 }}>
                {dashboardPdfFile ? dashboardPdfFile.name : t('dashboard.selectPdf')}
              </div>
              <input ref={dashboardPdfRef} type="file" accept="application/pdf" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.type !== 'application/pdf') {
                  alert(t('errors.selectPdf'));
                  return;
                }
                setDashboardPdfFile(f);
              }} style={{ display: 'none' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowPdfUpload(false)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                انصراف
              </button>
              <button onClick={uploadTextbookPdf} disabled={busyKey === 'pdf-upload' || !dashboardPdfFile} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                {busyKey === 'pdf-upload' ? 'در حال آپلود...' : '⬆️ آپلود'}
              </button>
            </div>
          </div>
        </div>
      )}

      {course?.courseId && showMissionExtract && (
        <div onClick={() => setShowMissionExtract(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3002,
          padding: 16
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(820px, 100%)',
            background: 'rgba(20,24,40,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 14,
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>استخراج ماموریت از یک صفحه</div>
              <button onClick={() => setShowMissionExtract(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>درس مقصد</div>
              <select value={missionTargetLessonId} onChange={(e) => setMissionTargetLessonId(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                <option value="">انتخاب کن...</option>
                {lessons.map(l => (
                  <option key={l._id} value={l._id}>
                    {l.chapter}. {(l?.chapterId?.title ? `${l.chapterId.title} — ` : '')}{l.title}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => dashboardPageFileRef.current?.click()} disabled={busyKey === 'mission-ocr'} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                {busyKey === 'mission-ocr' ? 'در حال OCR...' : '📷 OCR از عکس'}
              </button>
              <div style={{ direction: 'rtl', opacity: 0.8 }}>
                {pageImageFile ? pageImageFile.name : 'اختیاری'}
              </div>
              <input ref={dashboardPageFileRef} type="file" accept="image/*" onChange={(e) => ocrPageImageToText(e.target.files?.[0])} style={{ display: 'none' }} />
            </div>

            <textarea value={pageText} onChange={(e) => setPageText(e.target.value)} placeholder="متن صفحه را اینجا وارد کن..." style={{
              width: '100%', marginTop: 12, minHeight: 200,
              padding: 10, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff', direction: 'rtl'
            }} />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowMissionExtract(false)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                انصراف
              </button>
              <button onClick={extractMissionsFromPage} disabled={busyKey === 'mission-extract' || !pageText.trim()} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                {busyKey === 'mission-extract' ? 'در حال ساخت...' : '🚀 ساخت و ذخیره ماموریت'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
        {!course ? (
          <div style={{ direction: 'rtl' }}>برای این درس هنوز Course ثبت نشده. ابتدا PDF را از بخش آپلود، بارگذاری کن.</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ direction: 'rtl' }}>
                <div style={{ fontWeight: 900 }}>{course.title}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>PDF: {course.pdf?.filename || 'ندارد'}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>Extract: {course.extracted?.exists ? `${course.extracted.method} (${course.extracted.textLength} chars)` : 'انجام نشده'}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>Build: {course.built?.chapters || 0} فصل / {course.built?.lessons || 0} درس</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 900 }}>AI:</div>
                  <button
                    onClick={() => setMissionAiProvider('anthropic')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: missionAiProvider === 'anthropic' ? '1px solid rgba(255,255,255,0.38)' : '1px solid rgba(255,255,255,0.18)',
                      background: missionAiProvider === 'anthropic' ? 'rgba(255,255,255,0.16)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 900,
                    }}
                  >
                    ANTHROPIC
                  </button>
                  <button
                    onClick={() => setMissionAiProvider('openai')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: missionAiProvider === 'openai' ? '1px solid rgba(255,255,255,0.38)' : '1px solid rgba(255,255,255,0.18)',
                      background: missionAiProvider === 'openai' ? 'rgba(255,255,255,0.16)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 900,
                    }}
                  >
                    GPT
                  </button>
                </div>
                <button onClick={() => setShowPdfUpload(true)} disabled={!course.courseId} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  📄 PDF کتاب
                </button>
                <button onClick={() => { setShowMissionExtract(true); setMissionTargetLessonId(selectedLessonId || ''); }} disabled={!course.courseId} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  🧩 ماموریت از صفحه
                </button>
                <button onClick={() => runExtract(course)} disabled={busyKey === 'extract' || !course.pdf?.filename} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  {busyKey === 'extract' ? 'در حال استخراج...' : '🧠 Extract متن'}
                </button>
                {busyKey === 'extract' && extractJob && (
                  <div style={{ direction: 'rtl', opacity: 0.9, fontWeight: 800 }}>
                    {(() => {
                      const total = typeof extractJob.total === 'number' ? extractJob.total : null;
                      const current = typeof extractJob.current === 'number' ? extractJob.current : null;
                      const pct = total && current !== null ? Math.min(100, Math.round((current / Math.max(1, total)) * 100)) : null;
                      if (pct !== null) return `پیشرفت: ${pct}% (${current}/${total})`;
                      if (current !== null) return `پیشرفت: ${current}`;
                      return 'در حال پردازش...';
                    })()}
                  </div>
                )}
                <button onClick={() => runBuild(course)} disabled={busyKey === 'build' || !course.extracted?.exists} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  {busyKey === 'build' ? 'در حال ساخت...' : '🏗️ Build فصل‌ها'}
                </button>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => {
                    // Calculate next chapter number for new chapter
                    const maxCh = lessons.length > 0
                      ? Math.max(...lessons.map(l => Number(l.chapter) || 0))
                      : 0;
                    const nextCh = maxCh + 1;
                    setAddLessonCourseId(String(course.courseId || ''));
                    setNewLessonChapter(String(nextCh));
                    setNewLessonChapterTitle('');
                    setNewLessonTitle('');
                    setNewLessonContent('');
                    setIsNewChapter(true); // Creating new chapter - fields should be editable
                    setShowAddLesson(true);
                  }} disabled={!course.courseId} style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                    +
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {course?.courseId && (
        <div style={{ marginTop: 10 }}>
          <button onClick={toggleLessonsPanel} style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: lessonsOpen ? 'rgba(78,205,196,0.14)' : 'rgba(255,255,255,0.06)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 900,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            direction: 'rtl'
          }}>
            <div>فصول و درس‌ها</div>
            <div style={{ opacity: 0.9 }}>{lessonsOpen ? '▲ بستن' : '▼ باز کردن'}</div>
          </button>
        </div>
      )}

      {lessonsOpen && (() => {
        if (lessons.length === 0) {
          return (
            <div style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              direction: 'rtl',
              textAlign: 'right'
            }}>
              هنوز درسی ثبت نشده.
            </div>
          );
        }

        const byChapter = new Map();
        for (const l of lessons) {
          const chId = l?.chapterId?._id || `noch-${l.chapter}`;
          if (!byChapter.has(chId)) {
            byChapter.set(chId, {
              chapterId: l?.chapterId || null,
              chapterNumber: l?.chapter,
              items: [],
            });
          }
          byChapter.get(chId).items.push(l);
        }

        const chapters = Array.from(byChapter.values()).sort((a, b) => {
          const at = a?.chapterId?.createdAt ? new Date(a.chapterId.createdAt).getTime() : 0;
          const bt = b?.chapterId?.createdAt ? new Date(b.chapterId.createdAt).getTime() : 0;
          return at - bt;
        });

        const labelOrigin = (o) => (o === 'build' ? 'Build' : 'Manual');
        const originColor = (o) => (o === 'build' ? 'rgba(155,89,182,0.22)' : 'rgba(46,204,113,0.18)');

        return (
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {chapters.map(ch => {
              const chapterTitle = ch?.chapterId?.title;
              const origin = ch?.chapterId?.origin || 'manual';
              const originText = labelOrigin(origin);
              const courseId = ch?.chapterId?.courseId || ch?.items?.[0]?.courseId || '';
              return (
                <div key={String(ch?.chapterId?._id || ch.chapterNumber)} style={{
                  textAlign: 'right', direction: 'rtl',
                  padding: 12, borderRadius: 14,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 900 }}>
                      فصل {ch.chapterNumber}
                      {chapterTitle ? ` — ${chapterTitle}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setAddLessonCourseId(String(courseId || ''));
                          setNewLessonChapter(String(ch.chapterNumber ?? ''));
                          setNewLessonChapterTitle(String(chapterTitle || ''));
                          setNewLessonTitle('');
                          setNewLessonContent('');
                          setIsNewChapter(false); // Adding to existing chapter - fields should be read-only
                          setShowAddLesson(true);
                        }}
                        disabled={!courseId}
                        style={{
                          padding: '6px 10px', borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.18)',
                          background: 'transparent', color: '#fff',
                          cursor: 'pointer', fontWeight: 900
                        }}
                      >
                        ➕ افزودن درس
                      </button>
                      <div style={{
                        padding: '4px 10px', borderRadius: 999,
                        background: originColor(origin),
                        border: '1px solid rgba(255,255,255,0.14)',
                        fontWeight: 900, fontSize: 12,
                      }}>{originText}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {ch.items.sort((a, b) => {
                      const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return at - bt;
                    }).map(l => {
                      const hasContent = !!(l.title && String(l.title).trim());
                      return (
                        <div key={l._id} style={{
                          padding: 10,
                          borderRadius: 12,
                          background: 'rgba(0,0,0,0.22)',
                          border: '1px solid rgba(255,255,255,0.10)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                            <button onClick={() => openLesson(l._id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: 0, color: '#fff', textAlign: 'right', direction: 'rtl', flex: 1
                            }}>
                              <div style={{ fontWeight: 900 }}>{l.title}</div>
                              <div style={{ opacity: 0.7, marginTop: 4 }}>
                                {hasContent ? 'دارای محتوا' : 'بدون محتوا'}
                              </div>
                            </button>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button onClick={() => openMissionManager(l._id)} disabled={busyKey === `mission-open-${l._id}`} style={{
                                padding: '8px 10px', borderRadius: 10,
                                border: 'none', cursor: 'pointer', fontWeight: 900,
                                background: 'rgba(78,205,196,0.16)', color: '#fff'
                              }}>
                                {busyKey === `mission-open-${l._id}` ? '...' : '🎯'}
                              </button>
                              <button onClick={() => removeLesson(l._id)} disabled={busyKey === `lesson-del-${l._id}`} style={{
                                padding: '8px 10px', borderRadius: 10,
                                border: 'none', cursor: 'pointer', fontWeight: 900,
                                background: 'rgba(255,77,77,0.18)', color: '#fff'
                              }}>
                                {busyKey === `lesson-del-${l._id}` ? '...' : '🗑️'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {showMissionManager && (
        <div onClick={() => { setShowMissionManager(false); }} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3004,
          padding: 16
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(980px, 100%)',
            maxHeight: '85vh',
            overflow: 'auto',
            background: 'rgba(20,24,40,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 14,
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>
                مدیریت ماموریت‌ها
                {missionManagerLesson?.title ? ` — ${missionManagerLesson.title}` : ''}
              </div>
              <button onClick={() => setShowMissionManager(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>
                {Array.isArray(missionManagerLesson?.missions) ? `${missionManagerLesson.missions.length} ماموریت` : '0 ماموریت'}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={autoGenerateMissionsFromLessonContent} disabled={busyKey === 'mission-auto'} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  {busyKey === 'mission-auto' ? 'در حال ساخت...' : '✨ استخراج خودکار از متن درس'}
                </button>
                <button onClick={() => { setMissionJson('[]'); }} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                  پاک کردن
                </button>
                <button onClick={saveMissionManager} disabled={busyKey === 'mission-save'} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                  {busyKey === 'mission-save' ? 'در حال ذخیره...' : '💾 ذخیره'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>لیست ماموریت‌ها</div>
              {(() => {
                let arr = [];
                try {
                  const p = JSON.parse(missionJson || '[]');
                  arr = Array.isArray(p) ? p : [];
                } catch {
                  arr = [];
                }
                if (!arr.length) return <div style={{ marginTop: 10, direction: 'rtl', opacity: 0.75 }}>هنوز ماموریتی ثبت نشده.</div>;
                return (
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                    {arr.map((m, idx) => (
                      <div key={idx} style={{
                        padding: 10, borderRadius: 12,
                        background: 'rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.10)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                          <div style={{ direction: 'rtl', flex: 1, fontWeight: 800, opacity: 0.95 }}>
                            {idx + 1}. {m?.type || 'mission'} / stage {m?.stage ?? '-'}
                          </div>
                          <button onClick={() => removeMissionAt(idx)} style={{
                            padding: '6px 10px', borderRadius: 10,
                            border: 'none', cursor: 'pointer', fontWeight: 900,
                            background: 'rgba(255,77,77,0.18)', color: '#fff'
                          }}>
                            🗑️
                          </button>
                        </div>
                        {m?.q && (
                          <div style={{ marginTop: 6, direction: 'rtl', opacity: 0.8 }}>
                            {String(m.q).slice(0, 160)}{String(m.q).length > 160 ? '…' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ direction: 'rtl', fontWeight: 900, marginBottom: 8 }}>ویرایش JSON ماموریت‌ها</div>
              <textarea value={missionJson} onChange={(e) => setMissionJson(e.target.value)} style={{
                width: '100%', minHeight: 260,
                padding: 10, borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff', direction: 'ltr',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12
              }} />
            </div>
          </div>
        </div>
      )}

      {course?.courseId && showAddLesson && (
        <div onClick={() => setShowAddLesson(false)} style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000,
          padding: 16
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(720px, 100%)',
            background: 'rgba(20,24,40,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            padding: 14,
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', fontWeight: 900 }}>افزودن درس جدید</div>
              <button onClick={() => setShowAddLesson(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '110px 1fr', gap: 10, alignItems: 'center' }}>
              <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>شماره فصل</div>
              <input 
                value={newLessonChapter} 
                readOnly={!isNewChapter}
                onChange={(e) => isNewChapter && setNewLessonChapter(e.target.value)}
                style={{ 
                  padding: 10, borderRadius: 10, 
                  border: isNewChapter ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.10)', 
                  background: isNewChapter ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', 
                  color: isNewChapter ? '#fff' : '#aaa',
                  cursor: isNewChapter ? 'text' : 'default'
                }} 
              />

              <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>عنوان فصل</div>
              <input 
                value={newLessonChapterTitle} 
                readOnly={!isNewChapter}
                onChange={(e) => isNewChapter && setNewLessonChapterTitle(e.target.value)}
                style={{ 
                  padding: 10, borderRadius: 10, 
                  border: isNewChapter ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.10)', 
                  background: isNewChapter ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', 
                  color: isNewChapter ? '#fff' : '#aaa',
                  cursor: isNewChapter ? 'text' : 'default',
                  direction: 'rtl' 
                }} 
              />

              <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>عنوان درس</div>
              <input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', direction: 'rtl' }} />

              <div style={{ direction: 'rtl', opacity: 0.85, fontWeight: 800 }}>محتوا</div>
              <textarea value={newLessonContent} onChange={(e) => setNewLessonContent(e.target.value)} style={{ padding: 10, borderRadius: 10, minHeight: 160, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', direction: 'rtl' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button onClick={() => setShowAddLesson(false)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 900 }}>
                انصراف
              </button>
              <button onClick={() => addLesson(addLessonCourseId || course.courseId)} disabled={busyKey === 'lesson-create'} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
                {busyKey === 'lesson-create' ? 'در حال افزودن...' : '➕ افزودن درس'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLesson && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div style={{ direction: 'rtl', fontWeight: 900 }}>ویرایش درس</div>
            <button onClick={() => { setSelectedLesson(null); setSelectedLessonId(null); }} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>✕</button>
          </div>
          <input value={editChapter} onChange={(e) => setEditChapter(e.target.value)} style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
          <input value={editChapterTitle} onChange={(e) => setEditChapterTitle(e.target.value)} style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', direction: 'rtl' }} />
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ width: '100%', marginTop: 10, minHeight: 220, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#fff', direction: 'rtl' }} />
          <button onClick={saveLesson} disabled={busyKey === 'save'} style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 900 }}>
            {busyKey === 'save' ? 'در حال ذخیره...' : '💾 ذخیره'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Demo missions per subject ────────────────────────────────────────────
function buildMissions(subjectId) {
  return [];
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const { t, i18n } = useTranslation();
  const [langReady, setLangReady] = useState(false);
  
  // All state hooks must be declared BEFORE any early returns
  const [screen, setScreen] = useState(localStorage.getItem('token') ? 'home' : 'login');
  const [hallTab, setHallTab] = useState('badges');
  const [hallSubject, setHallSubject] = useState(null);
  const [uploadedText, setUploadedText] = useState("");
  const [uploadSubject, setUploadSubject] = useState("persian");
  const [loading, setLoading] = useState(false);
  const [generatedMissions, setGeneratedMissions] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [currentLessonItem, setCurrentLessonItem] = useState(null);
  const [missions, setMissions] = useState([]);
  const [missionIdx, setMissionIdx] = useState(0);
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameStats, setGameStats] = useState({ totalStars: 0, fastAnswers: 0, perfectStages: 0, completedLessons: 0 });
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [stageResults, setStageResults] = useState({ correct: 0, total: 0 });
  const [dragWords, setDragWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [fillVal, setFillVal] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [completedSubjects, setCompletedSubjects] = useState([]);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [missionHistory, setMissionHistory] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const fileRef = useRef();
  const timerRef = useRef();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');

  // Initialize language direction - default to English
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nLanguage') || 'en';
    i18n.changeLanguage(savedLang).then(() => {
      document.dir = savedLang === 'fa' ? 'rtl' : 'ltr';
      setLangReady(true);
    });
  }, [i18n]);

  // Profile loading - only runs when langReady is true
  useEffect(() => {
    if (!langReady || !token) return;
    api.getProfile(token).then(data => {
      if (data.email) {
        setUser(data);
        const sourceData = data.role === 'parent' && data.linkedStudent ? data.linkedStudent : data;
        const serverStats = {
          totalStars: sourceData.scores?.reduce((acc, curr) => acc + (curr.stars || 0), 0) || 0,
          completedLessons: new Set(sourceData.scores?.map(s => s.subject) || []).size,
          fastAnswers: sourceData.fastAnswers || 0,
          perfectStages: sourceData.perfectStages || 0,
        };
        setGameStats(prev => ({ ...prev, ...serverStats }));
        setEarnedBadges(sourceData.badges || []);
        setCompletedSubjects([...new Set(sourceData.scores?.map(s => s.subject) || [])]);
      } else {
        setToken(null);
        localStorage.removeItem('token');
      }
    });
  }, [langReady, token]);

  // Badge check - only runs when langReady is true
  useEffect(() => {
    if (!langReady) return;
    const newBadges = BADGES.filter(b => b.condition(gameStats) && !earnedBadges.includes(b.id));
    if (newBadges.length) {
      const addedBadges = newBadges.map(b => b.id);
      setEarnedBadges(prev => [...prev, ...addedBadges]);
      if (token) {
        addedBadges.forEach(badge => {
          api.updateProgress(token, { badge });
        });
      }
    }
  }, [langReady, gameStats, token, earnedBadges]);

  // Timer - only runs when langReady is true
  useEffect(() => {
    if (!langReady) return;
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      handleAnswer(null, true);
    }
    return () => clearTimeout(timerRef.current);
  }, [langReady, timerActive, timeLeft]);

  // Don't render until language is ready
  if (!langReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)'
      }}>
        <div style={{ color: '#fff', fontSize: 24 }}>Loading...</div>
      </div>
    );
  }

  // Helper to get translated subject label
  const getSubjectLabel = (subjectId) => {
    return t(`subjects.${subjectId}`);
  };

  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    if (res.token) {
      setToken(res.token);
      localStorage.setItem('token', res.token);
      setScreen('home');
    } else {
      throw new Error(res.message || 'خطا در ورود');
    }
  };

  const handleRegister = async (registrationData) => {
    const res = await api.register(registrationData);
    if (res.message !== 'User registered successfully') {
      throw new Error(res.error || 'خطا در ثبت‌نام');
    }
    setAuthMode('login');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setScreen('login');
  };

  function startMissions(subjectId, customMissions, lessonId = null) {
    const ms = Array.isArray(customMissions) ? customMissions : buildMissions(subjectId);
    if (!Array.isArray(ms) || ms.length === 0) {
      alert('برای این درس هنوز ماموریتی ثبت نشده است.');
      return;
    }
    setActiveSubject(subjectId);
    setActiveLessonId(lessonId);
    setMissions(ms);
    setMissionIdx(0);
    setStage(1);
    setStars(0);
    setFeedback(null);
    setStageResults({ correct: 0, total: 0 });
    setMissionHistory([]);
    initMission(ms[0]);
    setScreen("game");
  }

  function initMission(m) {
    setFeedback(null);
    setFillVal("");
    setSelectedWords([]);
    if (m?.type === "order") {
      const wordsFromAnswer = () => {
        const ans = String(m?.answer || '').trim();
        if (!ans) return [];
        const cleaned = ans.replace(/[.\u06d4]+$/g, '').trim();
        return cleaned.split(/\s+/g).map(s => s.trim()).filter(Boolean);
      };

      const wordsFromQuestion = () => {
        const rawQ = String(m?.q || '').trim();
        if (!rawQ) return [];
        const parts = rawQ.split(/[:：]/);
        const tail = String(parts.length > 1 ? parts.slice(1).join(':') : '').trim();
        if (!tail || !/[-،,]/.test(tail)) return [];
        return tail
          .split(/\s*(?:-|,|،|؛|\|)\s*/g)
          .map(s => String(s || '').trim())
          .map(s => s.replace(/[.\u06d4]+$/g, '').trim())
          .filter(Boolean);
      };

      let words = Array.isArray(m?.words) ? m.words : wordsFromQuestion();
      words = (Array.isArray(words) ? words : []).map(String).map(s => s.trim()).filter(Boolean);
      if (words.length < 3) words = wordsFromAnswer();
      setDragWords(shuffle(words));
    }
    setTimeLeft(30);
    setTimerActive(true);
  }

  function handleAnswer(value, timeout = false) {
    clearTimeout(timerRef.current);
    setTimerActive(false);
    const m = missions[missionIdx];
    const safeOptions = Array.isArray(m?.options) ? m.options : [];
    let correct = false;
    if (timeout) {
      correct = false;
    } else if (m.type === "mcq") {
      correct = value === m.answer;
    } else if (m.type === "fill") {
      correct = value.trim().toLowerCase() === m.blank.toLowerCase() ||
        value.trim() === m.blank;
    } else if (m.type === "order") {
      correct = normalizeOrderText(selectedWords.join(' ')) === normalizeOrderText(m.answer);
    }

    const wasfast = timeLeft > 20;
    const starEarned = correct ? (wasfast ? 3 : 2) : 0;
    setStars(s => s + starEarned);
    setScore(s => s + (correct ? (wasfast ? 150 : 100) : 0));
    setStageResults(r => ({ correct: r.correct + (correct ? 1 : 0), total: r.total + 1 }));
    setMissionHistory(prev => [...prev, {
      question: m.q,
      correct,
      userAnswer: m.type === 'mcq'
        ? (timeout ? 'بی ‌پاسخ' : (safeOptions?.[value] ?? value))
        : (value || 'بی ‌پاسخ'),
      correctAnswer: m.type === 'mcq'
        ? (safeOptions?.[m.answer] ?? m.answer)
        : (m.blank || m.answer)
    }]);
    if (correct && wasfast) setGameStats(g => ({ ...g, fastAnswers: g.fastAnswers + 1 }));
    setFeedback({ correct, exp: m.exp, stars: starEarned, timeout });
  }

  function nextMission() {
    const nextIdx = missionIdx + 1;
    const nextStage = nextIdx < missions.length ? missions[nextIdx].stage : stage + 1;

    if (nextIdx >= missions.length) {
      // Lesson complete
      const totalCorrect = stageResults.correct + (feedback?.correct ? 1 : 0);
      const perfect = totalCorrect === missions.length;
      setGameStats(g => ({
        ...g,
        totalStars: g.totalStars + stars + (feedback?.stars || 0),
        perfectStages: g.perfectStages + (perfect ? 1 : 0),
        completedLessons: g.completedLessons + 1,
      }));
      setCompletedSubjects(s => [...new Set([...s, activeSubject])]);

      // Save stats to backend
      if (token) {
        api.updateProgress(token, {
          subject: activeSubject,
          score: score,
          stars: stars + (feedback?.stars || 0),
          detailedResults: missionHistory
        });
      }

      setScreen("summary");
      return;
    }

    if (nextStage !== stage) {
      setShowStageComplete(true);
      setTimeout(() => {
        setShowStageComplete(false);
        setStage(nextStage);
        setMissionIdx(nextIdx);
        initMission(missions[nextIdx]);
      }, 2200);
    } else {
      setMissionIdx(nextIdx);
      initMission(missions[nextIdx]);
    }
  }

  // AI-powered text analysis
  async function analyzeTextWithAI() {
    setLoading(true);
    try {
      const prompt = `You are an educational game designer for children aged 8-12.
Given this text from a ${SUBJECTS.find(s => s.id === uploadSubject)?.label} textbook:

"""
${uploadedText}
"""

Create exactly 8 educational missions as a JSON array. Each mission must have:
- type: "mcq" | "fill" | "order"
- stage: 1, 2, or 3 (stages 1-2 have 3 missions each, stage 3 has 2)
- q: question text
- For mcq: options (array of 4 strings), answer (index 0-3)
- For fill: blank (the answer word), hint (one short hint)
- For order: words (array of 4-5 words shuffled), answer (correct sentence)
- exp: short explanation (1-2 sentences) in the same language as the textbook

Return ONLY valid JSON array, no markdown, no extra text.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.map(i => i.text || "").join("") || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setGeneratedMissions(parsed);
      setLoading(false);
      startMissions(uploadSubject, parsed);
    } catch (e) {
      setLoading(false);
      alert("خطا در پردازش متن. لطفاً دوباره امتحان کنید.");
    }
  }

  const subj = SUBJECTS.find(s => s.id === activeSubject);
  const mission = missions[missionIdx];
  const totalStages = 3;
  const stageProgress = missions.filter(m => m.stage === stage).length;
  const stageIdx = missions.filter(m => m.stage === stage && missions.indexOf(m) < missionIdx).length;

  // ── SCREENS ────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <>
        <GlobalStyles />
        <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        />
      </>
    );
  }

  if (screen === "home" || screen === "chapters" || screen === "hall") return (
    <>
      <GlobalStyles />
      <HomeScreen
        onStart={(id) => {
          setActiveSubject(id);
          setScreen("chapters");
        }}
        completedSubjects={completedSubjects}
        gameStats={gameStats}
        earnedBadges={earnedBadges}
        onHall={(targetTab, sId = null) => {
          setHallTab(targetTab || 'badges');
          setHallSubject(sId);
          setScreen("hall");
        }}
        user={user}
        onLogout={logout}
        onDashboard={() => setScreen('dashboard')}
      />
      {screen === "chapters" && (
        <ChaptersScreen
          subject={subj}
          token={token}
          user={user}
          userProgress={user?.lessonProgress || []}
          onBack={() => setScreen("home")}
          onStudy={(lessonId) => {
            api.curriculumLessonDetails(token, lessonId).then(data => {
              setCurrentLessonItem(data);
              setScreen("study");
              api.curriculumLessonProgress(token, lessonId, 'read').then(res => {
                if (res.progress) {
                  setUser(u => {
                    if (!u) return u;
                    const newProg = [...(u.lessonProgress || [])];
                    const i = newProg.findIndex(p => p.lessonId === lessonId);
                    if (i > -1) newProg[i] = res.progress; else newProg.push(res.progress);
                    return { ...u, lessonProgress: newProg };
                  });
                }
              }).catch(e => console.error(e));
            });
          }}
          onPlay={(lessonId) => {
            api.curriculumLessonDetails(token, lessonId).then(data => {
              startMissions(activeSubject, data.missions, lessonId);
            });
          }}
        />
      )}
      {screen === "hall" && (
        <BadgeHall
          initialTab={hallTab}
          initialSubject={hallSubject}
          user={user}
          setUser={setUser}
          token={token}
          earnedBadges={earnedBadges}
          gameStats={gameStats}
          completedSubjects={completedSubjects}
          onBack={() => setScreen("home")}
          onLogout={logout}
          api={api}
          SUBJECTS={SUBJECTS}
        />
      )}
    </>
  );

  if (screen === "dashboard") return (
    <>
      <GlobalStyles />
      <DashboardScreen
        token={token}
        user={user}
        SUBJECTS={SUBJECTS}
        api={api}
        onBack={() => setScreen('home')}
      />
    </>
  );

  if (screen === "upload") return (
    <>
      <GlobalStyles />
      <DashboardScreen
        token={token}
        user={user}
        SUBJECTS={SUBJECTS}
        api={api}
        onBack={() => setScreen('home')}
      />
    </>
  );



  if (screen === "summary") return (
    <>
      <GlobalStyles />
      <SummaryScreen
        subject={subj} stars={stars} score={score}
        stageResults={stageResults} missions={missions}
        onHome={() => setScreen("home")}
        completedSubjects={completedSubjects}
        gameStats={gameStats}
        earnedBadges={earnedBadges}
      />
    </>
  );

  if (screen === "game" && mission) return (
    <>
      <GlobalStyles />
      <GameScreen
        subject={subj} mission={mission} missionIdx={missionIdx}
        totalMissions={missions.length} stage={stage} totalStages={totalStages}
        stageIdx={stageIdx} stageProgress={stageProgress}
        score={score} stars={stars}
        feedback={feedback} timeLeft={timeLeft}
        dragWords={dragWords} setDragWords={setDragWords}
        selectedWords={selectedWords} setSelectedWords={setSelectedWords}
        fillVal={fillVal} setFillVal={setFillVal}
        onAnswer={handleAnswer} onNext={nextMission}
        showStageComplete={showStageComplete}
      />
    </>
  );



  if (screen === "study") return (
    <>
      <GlobalStyles />
      <StudyScreen
        subject={subj}
        lesson={currentLessonItem}
        onBack={() => setScreen("chapters")}
        onPlay={() => startMissions(activeSubject, currentLessonItem?.missions, currentLessonItem?._id)}
      />
    </>
  );

  return null;
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────
function HomeScreen({ onStart, completedSubjects, gameStats, earnedBadges, onHall, user, onLogout, onDashboard }) {
  const { t } = useTranslation();
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
      fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif", padding: "20px", paddingBottom: "180px",
      display: "flex", flexDirection: "column", alignItems: "center", position: "relative"
    }}>
      <LiveClock />
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <button onClick={onDashboard} style={{
          alignSelf: 'flex-start',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: 14,
          cursor: 'pointer',
          fontWeight: 800,
          marginBottom: 10,
        }}>
          {t('nav.dashboard')}
        </button>
      )}
      {/* Dashboard Floating Nav Bar */}
      <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
        width: 'calc(100% - 32px)', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '32px',
        padding: '10px 14px', boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        animation: 'fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        {/* Left: User Profile + Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          
          <div onClick={() => onHall('profile')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            {/* Avatar */}
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #FFD700, #FF6B6B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '900', color: '#fff',
              boxShadow: '0 4px 16px rgba(255,107,107,0.5)'
            }}>
              {user?.email ? user.email.charAt(0).toUpperCase() : '👤'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', direction: 'ltr', textAlign: 'left', paddingRight: '4px', gap: '2px' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', textShadow: '0 1px 2px rgba(0,0,0,0.3)', lineHeight: 1.2 }}>
                {user?.role === 'parent' ? (user?.linkedStudent?.name || user?.linkedStudent?.email?.split('@')[0]) : (user?.name || user?.email?.split('@')[0]) || 'Student'}
              </span>
              <span style={{ fontSize: '10px', color: '#FFD700', fontWeight: 'bold', background: 'rgba(255,215,0,0.15)', padding: '1px 6px', borderRadius: '8px', whiteSpace: 'nowrap', width: 'fit-content' }}>
                {user?.role === 'parent' ? 'PARENT VIEW' : `GRADE ${user?.grade || 3}`}
              </span>
            </div>
          </div>
            
          {/* Compact Stats Row */}
          <div onClick={() => onHall('badges')} style={{ 
            display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(0,0,0,0.25)', 
            padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer', flex: 1, marginLeft: '4px'
          }}>
            {[
              { val: gameStats.totalStars, icon: "⭐" },
              { val: gameStats.completedLessons, icon: "📚" },
              { val: earnedBadges.length, icon: "🏅" },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px' }}>{s.icon}</span>
                <span style={{ color: '#FFD700', fontWeight: '900', fontSize: '12px' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Logout Button */}
        <button className="btn-glow" onClick={onLogout} style={{
          background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)',
          color: '#ff4d4d', padding: '10px', borderRadius: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.2s'
        }} title={t('nav.logout')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes fadeSlide { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes fadeSlideUp { 0%{opacity:0;transform:translate(-50%, 40px)} 100%{opacity:1;transform:translate(-50%, 0)} }
        .subject-card:hover { transform:scale(1.05) translateY(-4px) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important; }
        .btn-glow:hover { filter:brightness(1.15); transform:scale(1.03); }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 30, animation: "fadeSlide 0.6s both" }}>
        <div style={{ fontSize: 64, animation: "float 3s ease-in-out infinite" }}>🚀</div>
        <h1 style={{
          color: "#fff", fontSize: 32, fontWeight: 900, margin: "8px 0 4px",
          background: "linear-gradient(90deg,#FFD700,#FF6B6B,#4ECDC4,#45B7D1)",
          backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shimmer 3s linear infinite",
        }}>
          {user?.role === 'parent' ? `${t('home.parentReport')} ${user?.linkedStudent?.name || t('home.student')}` : t('home.welcomeTitle')}
        </h1>
        <p style={{ color: "#aaa", fontSize: 15, direction: "rtl" }}>
          {user?.role === 'parent' ? `${t('home.parentSubtitle')} 🌟` : `${t('home.subtitle')} 🌟`}
        </p>
      </div>



      {/* Subject cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        width: "100%", maxWidth: 460, marginBottom: 20,
        animation: "fadeSlide 0.6s 0.2s both",
      }}>
        {SUBJECTS.map((s, i) => {
          const done = completedSubjects.includes(s.id);
          return (
            <button key={s.id} className="subject-card" onClick={() => {
              if (user?.role === 'parent') {
                onHall('results', s.id);
              } else {
                onStart(s.id);
              }
            }} style={{
              background: done
                ? `linear-gradient(135deg,${s.color.bg}cc,${s.color.dark})`
                : `linear-gradient(135deg,${s.color.bg},${s.color.dark})`,
              border: done ? "3px solid #FFD700" : "3px solid transparent",
              borderRadius: 20, padding: "20px 12px", cursor: "pointer",
              transition: "all 0.25s ease", color: "#fff",
              boxShadow: `0 8px 24px ${s.color.bg}44`,
              animation: `pop 0.4s ${0.1 * i}s both`,
              position: "relative", overflow: "hidden",
            }}>
              {done && <div style={{ position: "absolute", top: 6, right: 8, fontSize: 16 }}>✅</div>}
              <div style={{ fontSize: 36, marginBottom: 6 }}>{s.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 16, direction: s.dir }}>{t(s.labelKey)}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                {done ? t('home.completed') : t('home.start')}
              </div>
            </button>
          );
        })}
      </div>

      {completedSubjects.length === 6 && (
        <div style={{
          marginTop: 24, background: "linear-gradient(135deg,#FFD700,#FF6B6B)",
          borderRadius: 20, padding: "16px 24px", textAlign: "center",
          animation: "pop 0.5s both",
        }}>
          <div style={{ fontSize: 32 }}>🏆🎉🏆</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", direction: "rtl" }}>
            {t('home.dailyChampion')}
          </div>
        </div>
      )}
    </div>
  );
}

function StarBurst({ count = 1 }) {
  const safe = Math.max(0, Math.min(3, Number(count) || 0));
  if (!safe) return null;
  return (
    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: safe }).map((_, i) => (
        <div key={i} style={{
          width: 18,
          height: 18,
          borderRadius: 6,
          background: 'linear-gradient(135deg,#FFD700,#FF8C00)',
          boxShadow: '0 6px 18px rgba(255,215,0,0.25)',
        }} />
      ))}
    </div>
  );
}

// ─── GAME SCREEN ──────────────────────────────────────────────────────────
function GameScreen({
  subject, mission, missionIdx, totalMissions, stage, totalStages,
  stageIdx, stageProgress, score, stars, feedback, timeLeft,
  dragWords, setDragWords, selectedWords, setSelectedWords,
  fillVal, setFillVal, onAnswer, onNext, showStageComplete,
}) {
  const c = subject?.color || COLORS.persian;
  const dragRef = useRef(null); // { from: 'available'|'selected', index: number }
  const progress = (missionIdx / totalMissions) * 100;
  const timerPct = (timeLeft / 30) * 100;
  const timerColor = timeLeft > 15 ? "#4ECDC4" : timeLeft > 8 ? "#FFD700" : "#FF6B6B";
  const safeMissionOptions = Array.isArray(mission?.options) ? mission.options : [];
  const safeMissionWords = Array.isArray(mission?.words) ? mission.words : [];

  const derivedOrderWordsFromQuestion = () => {
    const rawQ = String(mission?.q || '').trim();
    if (!rawQ) return [];
    const parts = rawQ.split(/[:：]/);
    const tail = String(parts.length > 1 ? parts.slice(1).join(':') : '').trim();
    if (!tail || !/[-،,]/.test(tail)) return [];
    return tail
      .split(/\s*(?:-|,|،|؛|\|)\s*/g)
      .map(s => String(s || '').trim())
      .map(s => s.replace(/[.\u06d4]+$/g, '').trim())
      .filter(Boolean);
  };

  const orderWords = safeMissionWords.length ? safeMissionWords : derivedOrderWordsFromQuestion();

  const orderQuestion = (() => {
    const rawQ = String(mission?.q || '').trim();
    const parts = rawQ.split(/[:：]/);
    if (parts.length <= 1) return rawQ;
    const tail = String(parts.slice(1).join(':')).trim();
    if (!tail || !/[-،,]/.test(tail)) return rawQ;
    return String(parts[0] || '').trim();
  })();

  function toggleWord(w, idx) {
    if (feedback) return;
    setSelectedWords(s => [...s, w]);
    setDragWords(d => d.filter((_, i) => i !== idx));
  }
  function removeSelected(w, idx) {
    if (feedback) return;
    setSelectedWords(s => s.filter((_, i) => i !== idx));
    setDragWords(d => [...d, w]);
  }

  function startDrag(from, index) {
    if (feedback) return;
    dragRef.current = { from, index };
  }
  function allowDrop(e) {
    if (feedback) return;
    e.preventDefault();
  }
  function dropToSelected(e, atIndex = null) {
    if (feedback) return;
    e.preventDefault();
    const info = dragRef.current;
    dragRef.current = null;
    if (!info) return;

    if (info.from === 'available') {
      setDragWords((d) => {
        const arr = Array.isArray(d) ? [...d] : [];
        const w = arr[info.index];
        if (w === undefined) return arr;
        arr.splice(info.index, 1);
        setSelectedWords((s) => {
          const sel = Array.isArray(s) ? [...s] : [];
          const idx = typeof atIndex === 'number' ? Math.max(0, Math.min(sel.length, atIndex)) : sel.length;
          sel.splice(idx, 0, w);
          return sel;
        });
        return arr;
      });
      return;
    }

    if (info.from === 'selected') {
      setSelectedWords((s) => {
        const sel = Array.isArray(s) ? [...s] : [];
        const w = sel[info.index];
        if (w === undefined) return sel;
        sel.splice(info.index, 1);
        const idx = typeof atIndex === 'number' ? Math.max(0, Math.min(sel.length, atIndex)) : sel.length;
        sel.splice(idx, 0, w);
        return sel;
      });
    }
  }

  function dropToAvailable(e) {
    if (feedback) return;
    e.preventDefault();
    const info = dragRef.current;
    dragRef.current = null;
    if (!info) return;

    if (info.from === 'selected') {
      setSelectedWords((s) => {
        const sel = Array.isArray(s) ? [...s] : [];
        const w = sel[info.index];
        if (w === undefined) return sel;
        sel.splice(info.index, 1);
        setDragWords((d) => {
          const arr = Array.isArray(d) ? [...d] : [];
          arr.push(w);
          return arr;
        });
        return sel;
      });
      return;
    }

    // Dropping an available word back into available is a no-op.
  }

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (subject?.id === 'english') {
        utterance.lang = 'en-US';
      } else if (subject?.id === 'arabic') {
        utterance.lang = 'ar-SA';
      } else {
        utterance.lang = 'fa-IR';
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [mission]);

  if (showStageComplete) return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e,#0f3460)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif",
    }}>
      <div style={{ textAlign: "center", animation: "pop 0.5s both" }}>
        <div style={{ fontSize: 80 }}>🎯</div>
        <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 28, direction: "rtl" }}>مرحله کامل شد!</div>
        <div style={{ color: "#fff", fontSize: 18, marginTop: 10 }}>مرحله {stage + 1} شروع می‌شه...</div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg,${c.dark}dd 0%,#1a1a2e 60%)`,
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif",
      padding: "16px 16px 32px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes slideUp { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        .word-chip:hover { transform:scale(1.08) !important; cursor:pointer; }
        .opt-btn:hover { filter:brightness(1.1); }
      `}</style>

      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
            {subject?.emoji} {subject?.label}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ color: "#FFD700", fontWeight: 700 }}>⭐ {stars}</div>
            <div style={{ color: "#4ECDC4", fontWeight: 700 }}>🏆 {score}</div>
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, height: 8, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: `linear-gradient(90deg,${c.bg},#FFD700)`,
            transition: "width 0.5s ease", borderRadius: 10,
          }} />
        </div>
        <div style={{ color: "#aaa", fontSize: 11, marginTop: 4, direction: "rtl" }}>
          ماموریت {missionIdx + 1} از {totalMissions} | مرحله {stage}
        </div>

        {/* Stage dots */}
        <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
          {Array.from({ length: totalStages }).map((_, i) => (
            <div key={i} style={{
              width: i + 1 === stage ? 24 : 10, height: 10,
              borderRadius: 5,
              background: i + 1 < stage ? c.bg : i + 1 === stage ? "#FFD700" : "rgba(255,255,255,0.2)",
              transition: "all 0.3s",
            }} />
          ))}
        </div>
      </div>

      {/* Mission card */}
      <div style={{
        width: "100%", maxWidth: 480,
        background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)",
        borderRadius: 28, padding: "24px 20px",
        border: `2px solid ${c.bg}55`,
        boxShadow: `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)`,
        animation: feedback?.correct === false ? "shake 0.4s both" : "slideUp 0.4s both",
      }}>
        {/* Timer */}
        {!feedback && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: timerColor, fontWeight: 700, fontSize: 13 }}>⏱ {timeLeft}s</span>
              <span style={{ color: "#aaa", fontSize: 12 }}>سریع‌تر = ستاره بیشتر ⭐⭐⭐</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 8, height: 6 }}>
              <div style={{
                height: "100%", width: `${timerPct}%`,
                background: timerColor, borderRadius: 8,
                transition: "width 1s linear, background 0.5s",
              }} />
            </div>
          </div>
        )}

        {/* Question */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: 20, flexDirection: subject?.dir === 'ltr' ? 'row' : 'row-reverse' }}>
          <button onClick={() => playAudio(mission.q)} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: 44, height: 44, color: '#FFD700', cursor: 'pointer', fontSize: 20, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
          }} title="با صدای بلند بخوان">🔊</button>
          <div style={{
            color: "#fff", fontWeight: 700, fontSize: 17,
            direction: subject?.dir || "rtl", lineHeight: 1.6,
            textAlign: subject?.dir === "ltr" ? "left" : "right",
            flex: 1
          }}>
            {mission.type === 'order' ? orderQuestion : mission.q}
          </div>
        </div>

        {/* MCQ */}
        {mission.type === "mcq" && !feedback && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {safeMissionOptions.map((opt, i) => (
              <button key={i} className="opt-btn" onClick={() => onAnswer(i)} style={{
                padding: "14px 18px",
                background: "rgba(255,255,255,0.08)",
                border: `2px solid rgba(255,255,255,0.15)`,
                borderRadius: 16, color: "#fff", fontSize: 15,
                cursor: "pointer", textAlign: subject?.dir === "ltr" ? "left" : "right",
                direction: subject?.dir, fontFamily: "inherit", fontWeight: 600,
                transition: "all 0.2s",
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{
                  opacity: 0.9,
                  fontWeight: 900,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: 10,
                  minWidth: 30,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {["۱", "۲", "۳", "۴"][i]}
                </span>
                <span style={{ flex: 1 }}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Fill in blank */}
        {mission.type === "fill" && !feedback && (
          <div style={{ direction: subject?.dir }}>
            <div style={{ color: "#aaa", fontSize: 13, marginBottom: 8, direction: subject?.dir }}>
              💡 راهنما: {mission.hint}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={fillVal} onChange={e => setFillVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fillVal.trim() && onAnswer(fillVal)}
                placeholder="جواب را بنویس..."
                style={{
                  flex: 1, padding: "14px 16px",
                  background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.2)",
                  borderRadius: 16, color: "#fff", fontSize: 16, fontFamily: "inherit",
                  direction: subject?.dir, outline: "none",
                  textAlign: subject?.dir === "ltr" ? "left" : "right"
                }}
                autoFocus
              />
              <button onClick={() => fillVal.trim() && onAnswer(fillVal)} style={{
                padding: "0 20px", background: c.bg,
                border: "none", borderRadius: 16, color: "#fff",
                fontSize: 18, cursor: "pointer",
              }}>✓</button>
            </div>
          </div>
        )}

        {/* Word order */}
        {mission.type === "order" && !feedback && (
          <div>
            {/* Selected */}
            <div style={{
              minHeight: 52, background: "rgba(255,255,255,0.05)",
              borderRadius: 16, border: "2px dashed rgba(255,255,255,0.2)",
              padding: "10px 12px", marginBottom: 12,
              display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
            }} onDragOver={allowDrop} onDrop={(e) => dropToSelected(e, null)}>
              {selectedWords.length === 0 && <span style={{ color: "#555", fontSize: 13 }}>کلمات را اینجا بچین...</span>}
              {selectedWords.map((w, i) => (
                <button
                  key={i}
                  className="word-chip"
                  onClick={() => removeSelected(w, i)}
                  draggable
                  onDragStart={() => startDrag('selected', i)}
                  onDragOver={allowDrop}
                  onDrop={(e) => dropToSelected(e, i)}
                  style={{
                  padding: "6px 14px", background: c.bg, border: "none",
                  borderRadius: 20, color: "#fff", fontSize: 14, cursor: "pointer",
                  fontFamily: "inherit", transition: "transform 0.15s",
                }}>{w}</button>
              ))}
            </div>
            {/* Available */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} onDragOver={allowDrop} onDrop={dropToAvailable}>
              {(Array.isArray(dragWords) ? dragWords : []).map((w, i) => (
                <button
                  key={i}
                  className="word-chip"
                  onClick={() => toggleWord(w, i)}
                  draggable
                  onDragStart={() => startDrag('available', i)}
                  style={{
                  padding: "6px 14px",
                  background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)",
                  borderRadius: 20, color: "#fff", fontSize: 14, cursor: "pointer",
                  fontFamily: "inherit", transition: "transform 0.15s",
                }}>{w}</button>
              ))}
            </div>
            {selectedWords.length > 0 && (
              <button onClick={() => onAnswer()} style={{
                marginTop: 16, width: "100%", padding: "14px",
                background: `linear-gradient(135deg,${c.bg},${c.dark})`,
                border: "none", borderRadius: 16, color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
              }}>✓ تأیید جواب</button>
            )}
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div style={{ animation: "pop 0.4s both" }}>
            {/* MCQ answer reveal */}
            {mission.type === "mcq" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {safeMissionOptions.map((opt, i) => {
                  const isCorrect = i === mission.answer;
                  return (
                    <div key={i} style={{
                      padding: "12px 16px", borderRadius: 14,
                      background: isCorrect ? "#27AE6033" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${isCorrect ? "#27AE60" : "rgba(255,255,255,0.1)"}`,
                      color: isCorrect ? "#2ECC71" : "#888",
                      direction: subject?.dir, fontSize: 14,
                      textAlign: subject?.dir === "ltr" ? "left" : "right"
                    }}>
                      {isCorrect && "✅ "}{opt}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Result banner */}
            <div style={{
              textAlign: "center", padding: "16px",
              background: feedback.correct
                ? "linear-gradient(135deg,#27AE6033,#2ECC7133)"
                : feedback.timeout
                  ? "linear-gradient(135deg,#E67E2233,#D3541433)"
                  : "linear-gradient(135deg,#E74C3C33,#C0392B33)",
              borderRadius: 20, border: `2px solid ${feedback.correct ? "#2ECC71" : "#E74C3C"}44`,
            }}>
              <div style={{ fontSize: 42 }}>
                {feedback.correct ? "🎉" : feedback.timeout ? "⏰" : "😅"}
              </div>
              <div style={{ fontWeight: 900, fontSize: 20, color: feedback.correct ? "#2ECC71" : "#E74C3C", direction: "rtl" }}>
                {feedback.correct ? "عالی بود!" : feedback.timeout ? "وقت تموم شد!" : "اشتباه!"}
              </div>
              {feedback.correct && <StarBurst count={feedback.stars} />}
              {(String(feedback.exp || '').trim() || !feedback.correct) && (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '8px', marginTop: 10, direction: 'rtl' }}>
                  <button onClick={() => playAudio(String(feedback.exp || '').trim() || 'پاسخ صحیح را ببین')} title="پخش توضیح" style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: 32, height: 32, color: '#4ECDC4', cursor: 'pointer', fontSize: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>🔊</button>
                  <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7, textAlign: 'right' }}>
                    {String(feedback.exp || '').trim() && (
                      <div style={{ marginBottom: (!feedback.correct || feedback.timeout) ? 8 : 0 }}>{feedback.exp}</div>
                    )}
                    {(!feedback.correct || feedback.timeout) && (
                      <div style={{ fontWeight: 900, color: '#fff' }}>
                        پاسخ صحیح: {mission?.type === 'fill' ? mission?.blank : mission?.type === 'order' ? mission?.answer : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={onNext} style={{
              marginTop: 16, width: "100%", padding: "16px",
              background: `linear-gradient(135deg,${c.bg},${c.dark})`,
              border: "none", borderRadius: 20, color: "#fff",
              fontSize: 17, fontWeight: 800, cursor: "pointer",
              boxShadow: `0 8px 24px ${c.bg}44`,
            }}>
              {missionIdx + 1 >= 8 ? "🏁 پایان درس" : "ماموریت بعدی ←"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SUMMARY SCREEN ───────────────────────────────────────────────────────
function SummaryScreen({ subject, stars, score, missions, onHome, completedSubjects, gameStats, earnedBadges }) {
  const pct = Math.round((score / (missions.length * 150)) * 100);
  const c = subject?.color || COLORS.persian;

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg,${c.dark} 0%,#1a1a2e 100%)`,
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif",
      padding: "24px 20px", display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        @keyframes pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      `}</style>

      <div style={{ fontSize: 80, animation: "float 2s ease-in-out infinite" }}>
        {pct >= 80 ? "🏆" : pct >= 60 ? "🌟" : "💪"}
      </div>
      <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 26, direction: "rtl", margin: "12px 0 4px" }}>
        {subject?.label} — {pct >= 80 ? "عالی!" : pct >= 60 ? "خوب!" : "تلاش کن!"}
      </h2>

      {/* Score card */}
      <div style={{
        background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)",
        borderRadius: 24, padding: "24px 32px", marginTop: 20,
        display: "flex", gap: 30, animation: "pop 0.4s both",
        border: `2px solid ${c.bg}44`,
      }}>
        {[
          { icon: "⭐", val: stars, label: "ستاره" },
          { icon: "🏆", val: score, label: "امتیاز" },
          { icon: "📊", val: pct + "%", label: "درصد" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 24 }}>{s.val}</div>
            <div style={{ color: "#aaa", fontSize: 12, direction: "rtl" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New badges */}
      {earnedBadges.length > 0 && (
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <div style={{ color: "#FFD700", fontWeight: 700, direction: "rtl", marginBottom: 10 }}>
            🎖️ مدال‌های جدید:
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {BADGES.filter(b => earnedBadges.includes(b.id)).map(b => (
              <div key={b.id} style={{
                background: "rgba(255,215,0,0.15)", border: "2px solid #FFD70066",
                borderRadius: 16, padding: "10px 16px", textAlign: "center",
                animation: "pop 0.4s both",
              }}>
                <div style={{ fontSize: 28 }}>{b.emoji}</div>
                <div style={{ color: "#FFD700", fontSize: 11, direction: "rtl" }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <div style={{ width: "100%", maxWidth: 360, marginTop: 24 }}>
        <div style={{ color: "#aaa", direction: "rtl", fontSize: 13, marginBottom: 10 }}>
          درس‌های تکمیل‌شده ({completedSubjects.length}/4):
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {SUBJECTS.map(s => (
            <div key={s.id} style={{
              fontSize: 28, opacity: completedSubjects.includes(s.id) ? 1 : 0.25,
              filter: completedSubjects.includes(s.id) ? "none" : "grayscale(100%)",
            }}>{s.emoji}</div>
          ))}
        </div>
      </div>

      <button onClick={onHome} style={{
        marginTop: 28, padding: "16px 40px",
        background: `linear-gradient(135deg,${c.bg},${c.dark})`,
        border: "none", borderRadius: 20, color: "#fff",
        fontSize: 17, fontWeight: 800, cursor: "pointer",
        boxShadow: `0 8px 24px ${c.bg}44`, direction: "rtl",
      }}>
        🏠 بازگشت به خانه
      </button>
    </div>
  );
}

// ─── BADGE HALL ───────────────────────────────────────────────────────────
function BadgeHall({ initialTab, initialSubject, user, setUser, token, earnedBadges, gameStats, completedSubjects, onBack, onLogout, api, SUBJECTS }) {
  const [tab, setTab] = useState(initialTab || 'badges'); // 'badges' | 'profile' | 'results'
  const [editName, setEditName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [detailedResults, setDetailedResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [filterSubject, setFilterSubject] = useState(initialSubject || null);
  
  // Teacher view states
  const [teacherView, setTeacherView] = useState(false);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  useEffect(() => {
    if (initialTab === 'results') {
      fetchDetailedResults(initialSubject || null);
    }
  }, [initialTab, initialSubject]);

  const fetchDetailedResults = async (sId = null) => {
    if (!token) return;
    setIsLoadingResults(true);
    setFilterSubject(sId);
    try {
      if (user?.role === 'teacher' || user?.role === 'admin') {
        // Teacher view - fetch all students' results
        const data = await api.getTeacherResults(token, { subject: sId });
        if (data.students) {
          setTeacherView(true);
          setTeacherStudents(data.students);
          // If a student is already selected, show their results
          if (selectedStudent) {
            const student = data.students.find(s => s.studentId === selectedStudent.studentId);
            if (student) {
              setSelectedStudent(student);
              setDetailedResults(student.scores || []);
            } else {
              setDetailedResults([]);
            }
          } else {
            setDetailedResults([]);
          }
        }
      } else {
        // Student or Parent view
        const data = await api.getDetailedResults(token);
        setTeacherView(false);
        setDetailedResults(data.scores || data || []);
      }
      setTab('results');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setDetailedResults(student.scores || []);
  };

  const handleUpdateName = async () => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await api.updateProfile(token, { name: editName });
      if (res.user) {
        setUser(prev => ({ ...prev, name: res.user.name }));
        alert('نام شما با موفقیت ثبت شد! ✨');
      }
    } catch (err) {
      console.error(err);
      alert('خطا در بروزرسانی نام');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div onClick={onBack} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif", padding: "20px"
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        @keyframes pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
        @keyframes shimmer{0%{background-position:-200%}100%{background-position:200%}}
        @keyframes scaleUp { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
        width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto',
        borderRadius: 24, padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        border: '2px solid #FFD700',
        animation: "scaleUp 0.3s ease-out forwards",
        display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative'
      }}>
        <style>{`
          .results-filter:hover { transform: translateY(-2px); filter: brightness(1.2); }
        `}</style>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", color: "#fff", width: 40, height: 40, fontSize: 18, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 4 }}>
            <button onClick={() => setTab('badges')} style={{
              background: tab === 'badges' ? 'rgba(255,215,0,0.15)' : 'transparent',
              color: tab === 'badges' ? '#FFD700' : '#888',
              border: tab === 'badges' ? '1px solid #FFD70066' : '1px solid transparent',
              borderRadius: 20, padding: '8px 16px', fontWeight: tab === 'badges' ? 800 : 600,
              cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}>🏆 {user?.role === 'parent' ? 'خلاصه' : 'دستاوردها'}</button>
            
            {(user?.role === 'parent' || user?.role === 'student' || user?.role === 'teacher' || user?.role === 'admin') && (
              <button onClick={() => fetchDetailedResults(null)} style={{
                background: tab === 'results' ? 'rgba(155,89,182,0.15)' : 'transparent',
                color: tab === 'results' ? '#9B59B6' : '#888',
                border: tab === 'results' ? '1px solid #9B59B666' : '1px solid transparent',
                borderRadius: 20, padding: '8px 16px', fontWeight: tab === 'results' ? 800 : 600,
                cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
              }}>📝 گزارش عملکرد</button>
            )}

            <button onClick={() => setTab('profile')} style={{
              background: tab === 'profile' ? 'rgba(78,205,196,0.15)' : 'transparent',
              color: tab === 'profile' ? '#4ECDC4' : '#888',
              border: tab === 'profile' ? '1px solid #4ECDC466' : '1px solid transparent',
              borderRadius: 20, padding: '8px 16px', fontWeight: tab === 'profile' ? 800 : 600,
              cursor: 'pointer', transition: 'all 0.2s', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
            }}>{user?.role === 'parent' ? '👤 والدین' : '👤 پروفایل'}</button>
          </div>
        </div>

        {tab === 'badges' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeSlide 0.4s both' }}>

      <h2 style={{
        fontWeight: 900, fontSize: 26, direction: "rtl",
        background: "linear-gradient(90deg,#FFD700,#FF6B6B,#4ECDC4)",
        backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        animation: "shimmer 3s linear infinite", margin: "0 0 24px",
      }}>{user?.role === 'parent' ? '🎯 عملکرد فرزند شما' : '🏅 تالار افتخار'}</h2>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
        width: "100%", maxWidth: 380, marginBottom: 28,
      }}>
        {[
          { icon: "⭐", val: gameStats.totalStars, label: "ستاره کل" },
          { icon: "🏅", val: earnedBadges.length, label: "جمع مدال‌ها" },
          { icon: "📚", val: gameStats.completedLessons, label: "درس کامل" },
          { icon: "⚡", val: gameStats.fastAnswers, label: "پاسخ سریع" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.07)", borderRadius: 16,
            padding: "14px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 22 }}>{s.val}</div>
            <div style={{ color: "#aaa", fontSize: 11, direction: "rtl", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges grid */}
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ color: "#aaa", direction: "rtl", fontSize: 13, marginBottom: 14 }}>
          مدال‌ها ({earnedBadges.length}/{BADGES.length}):
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {BADGES.map((b, i) => {
            const earned = earnedBadges.includes(b.id);
            return (
              <div key={b.id} style={{
                background: earned ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.04)",
                border: `2px solid ${earned ? "#FFD70066" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 18, padding: "16px 8px", textAlign: "center",
                filter: earned ? "none" : "grayscale(80%) brightness(0.5)",
                transition: "all 0.3s",
                animation: earned ? `pop 0.4s ${i * 0.1}s both` : "none",
              }}>
                <div style={{ fontSize: 32 }}>{b.emoji}</div>
                <div style={{ color: earned ? "#FFD700" : "#555", fontSize: 11, direction: "rtl", marginTop: 6 }}>
                  {b.label}
                </div>
              </div>
            );
          })}
        </div>
          </div>
        </div>
        )}

        {tab === 'results' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeSlide 0.4s both', direction: 'rtl' }}>
             <h2 style={{
              fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 20, textAlign: 'center'
            }}>
              {user?.role === 'teacher' || user?.role === 'admin'
                ? (selectedStudent 
                    ? `📝 گزارش ${selectedStudent.studentName || selectedStudent.studentEmail}` 
                    : '📝 گزارش عملکرد دانش‌آموزان')
                : (filterSubject 
                    ? `📝 گزارش ${SUBJECTS.find(s => s.id === filterSubject)?.label}` 
                    : '📝 گزارش کلی عملکرد')
              }
            </h2>
            
            {/* Teacher: Student Selector */}
            {(user?.role === 'teacher' || user?.role === 'admin') && teacherStudents.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>انتخاب دانش‌آموز:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                  {teacherStudents.map((student) => (
                    <button
                      key={student.studentId}
                      onClick={() => handleStudentSelect(student)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: selectedStudent?.studentId === student.studentId 
                          ? '2px solid #9B59B6' 
                          : '1px solid rgba(255,255,255,0.1)',
                        background: selectedStudent?.studentId === student.studentId 
                          ? 'rgba(155,89,182,0.2)' 
                          : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'right',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{student.studentName || student.studentEmail}</span>
                      <span style={{ color: '#aaa', fontSize: 11 }}>کلاس {student.grade} • {student.scores?.length || 0} گزارش</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isLoadingResults ? (
               <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#9B59B6', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></div>
               </div>
            ) : detailedResults.length === 0 ? (
              <p style={{ color: '#aaa', textAlign: 'center' }}>
                {(user?.role === 'teacher' || user?.role === 'admin') && !selectedStudent
                  ? 'لطفاً یک دانش‌آموز را انتخاب کنید'
                  : 'هنوز نتیجه‌ای ثبت نشده است.'
                }
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...detailedResults].reverse()
                  .filter(session => !filterSubject || session.subject === filterSubject)
                  .map((session, sIdx) => {
                    const subj = SUBJECTS.find(s => s.id === session.subject);
                    return (
                      <div key={sIdx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: `1px solid ${subj?.color?.bg || 'rgba(255,255,255,0.1)'}33`, padding: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
                          <span style={{ color: subj?.color?.bg || '#4ECDC4', fontWeight: 'bold' }}>📚 {subj?.label}</span>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ color: '#aaa', fontSize: 11 }}>{new Date(session.createdAt || session.date).toLocaleDateString('fa-IR')}</span>
                            <span style={{ color: 'rgba(255,215,0,0.6)', fontSize: 11, background: 'rgba(255,215,0,0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                              🕒 {new Date(session.createdAt || session.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {session.detailedResults?.map((res, rIdx) => (
                            <div key={rIdx} style={{ fontSize: 13, padding: '8px', background: res.correct ? 'rgba(39, 174, 96, 0.05)' : 'rgba(231, 76, 60, 0.05)', borderRadius: 8 }}>
                              <p style={{ color: '#fff', margin: '0 0 4px 0' }}>❓ {res.question}</p>
                              <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                                {res.correct ? (
                                  <span style={{ color: '#27AE60', fontWeight: 'bold' }}>✅ {res.correctAnswer}</span>
                                ) : (
                                  <>
                                    <span style={{ color: '#E74C3C' }}>❌ پاسخ {user?.role === 'parent' ? 'فرزند' : 'دانش‌آموز'}: {res.userAnswer}</span>
                                    <span style={{ color: '#aaa' }}>- پاسخ صحیح: {res.correctAnswer}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeSlide 0.4s both', direction: 'rtl', padding: '10px 0 20px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ECDC4, #556270)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', fontWeight: '900', color: '#fff',
              boxShadow: '0 8px 24px rgba(78,205,196,0.3)', marginBottom: 16
            }}>
              {user?.email ? user.email.charAt(0).toUpperCase() : '👤'}
            </div>
            
            <h3 style={{ color: '#fff', fontSize: 24, margin: '0 0 8px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>پروفایل فضانورد</h3>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 8, marginRight: 5 }}>نام نمایشی:</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="نام خود را وارد کنید..."
                    style={{
                      flex: 1, padding: '12px 16px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit'
                    }}
                  />
                  <button 
                    onClick={handleUpdateName}
                    disabled={isUpdating}
                    style={{
                      padding: '0 20px', background: '#4ECDC4', border: 'none', borderRadius: 14,
                      color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: isUpdating ? 0.6 : 1
                    }}
                  >
                    {isUpdating ? '...' : 'ثبت'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>ایمیل شما:</span>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', direction: 'ltr' }}>{user?.email || 'نامشخص'}</span>
              </div>
              
              {user?.role === 'parent' && user?.linkedStudent && (
                <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                  <p style={{ color: '#4ECDC4', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>🔗 اکانت لینک شده (فرزند):</p>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#aaa', fontSize: 12 }}>نام دانش‌آموز:</span>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{user.linkedStudent.name || 'بدون نام'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: '#aaa', fontSize: 12 }}>ایمیل:</span>
                      <span style={{ color: '#fff', fontSize: 13, direction: 'ltr' }}>{user.linkedStudent.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#aaa', fontSize: 12 }}>پایه تحصیلی:</span>
                      <span style={{ color: '#FFD700', fontSize: 13 }}>کلاس {user.linkedStudent.grade}</span>
                    </div>
                  </div>
                </div>
              )}

              {user?.role === 'student' && (
                <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                    <span style={{ color: '#aaa', fontSize: 14 }}>پایه تحصیلی:</span>
                    <span style={{ color: '#4ECDC4', fontSize: 14, fontWeight: 'bold', background: 'rgba(78,205,196,0.1)', padding: '4px 10px', borderRadius: 8 }}>کلاس {user.grade} (دبستان)</span>
                  </div>
                  
                  {user?.linkedParent ? (
                    <div style={{ background: 'rgba(39, 174, 96, 0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(39, 174, 96, 0.3)' }}>
                      <p style={{ color: '#27AE60', fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>🔗 اکانت والد لینک شده:</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#aaa', fontSize: 12 }}>نام والد:</span>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>{user.linkedParent.name || 'بدون نام'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa', fontSize: 12 }}>ایمیل والد:</span>
                        <span style={{ color: '#fff', fontSize: 13, direction: 'ltr' }}>{user.linkedParent.email}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(231, 76, 60, 0.1)', borderRadius: 12, padding: 12, border: '1px solid rgba(231, 76, 60, 0.3)' }}>
                      <p style={{ color: '#E74C3C', fontSize: 13, fontWeight: 'bold', margin: 0 }}>⚠️ اکانت والد به شما متصل نیست</p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>{user?.role === 'parent' ? 'وضعیت کل فرزند:' : 'وضعیت ماموریت‌ها:'}</span>
                <span style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold' }}>{completedSubjects.length} درس کامل شده</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 8 }}>
                <LanguageSwitcher style={{ 
                  padding: '8px 16px',
                  fontSize: '14px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)'
                }} />
              </div>
            </div>

            <button className="btn-glow" onClick={onLogout} style={{
              background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.4)',
              color: '#ff4d4d', padding: '12px 32px', borderRadius: '16px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s', display: 'flex', gap: 10, alignItems: 'center'
            }}>
              <span>خروج از حساب کاربری</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHAPTERS SCREEN ──────────────────────────────────────────────────────
function ChaptersScreen({ subject, token, user, onBack, onStudy, onPlay, userProgress }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const grade = user?.role === 'parent'
    ? (user?.linkedStudent?.grade || 3)
    : (user?.grade || 3);
  const c = subject?.color || COLORS.persian;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    if (!subject?.id) {
      setChapters([]);
      setPdfUrl(null);
      setLoading(false);
      return () => { document.body.style.overflow = 'unset'; };
    }
    (async () => {
      try {
        const [lessonsData, pdfData] = await Promise.all([
          api.curriculumLessons(token, { grade, subject: subject.id }),
          api.curriculumTextbookStatus(token, subject.id, grade)
        ]);

        setChapters(Array.isArray(lessonsData) ? lessonsData : []);

        if (pdfData?.exists) {
          setPdfUrl((import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '') + pdfData.url);
        }
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    })();

    return () => { document.body.style.overflow = 'unset'; };
  }, [subject, token, grade]);

  const getProgress = (lessonId) => {
    return userProgress?.find(p => p.lessonId === lessonId) || { read: false, completed: false };
  };

  return (
    <div onClick={onBack} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif", padding: "20px"
    }}>
      <style>{`
        @keyframes modalShow { 
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chapter-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .chapter-card:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          transform: translateX(-5px);
        }
        .action-btn {
          transition: all 0.2s;
        }
        .action-btn:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
        }
        .action-btn:active {
          transform: scale(0.98);
        }
      `}</style>
      
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)',
        width: '100%', maxWidth: 500, maxHeight: '85vh',
        borderRadius: '32px', boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: "modalShow 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
      }}>
        
        {/* Header Section */}
        <div style={{
          padding: '24px 24px 16px',
          background: `linear-gradient(to bottom, ${c.bg}15, transparent)`,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px", color: "#fff", width: 40, height: 40,
            fontSize: 20, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }}>✕</button>
          
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 24, fontWeight: 900 }}>{subject?.label} {subject?.emoji}</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: '4px 0 0', fontSize: 13 }}>لیست فصل‌های آموزشی</p>
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noreferrer" style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              borderRadius: '20px', padding: '18px', color: '#000',
              textDecoration: 'none', textAlign: 'center', fontWeight: '900', fontSize: 16,
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
              marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              direction: 'rtl', transition: 'transform 0.2s'
            }} className="action-btn">
              <span style={{ fontSize: 22 }}>📄</span>
              مشاهده کامل فایل کتاب درسی (PDF)
            </a>
          )}

          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{
                width: 40, height: 40, border: '4px solid rgba(255,255,255,0.1)',
                borderTopColor: c.bg, borderRadius: '50%',
                display: 'inline-block', animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#aaa', marginTop: 16 }}>در حال بارگذاری فصل‌ها...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {chapters.length === 0 && !pdfUrl && (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 24 }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                  <p style={{ color: '#777', margin: 0 }}>هنوز فصلی برای این درس ثبت نشده است.</p>
                </div>
              )}

              {chapters.map((ch, idx) => {
                const prog = getProgress(ch._id);
                return (
                  <div key={ch._id} className="chapter-card" style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: '24px',
                    padding: '16px', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column', gap: 16, direction: 'rtl'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '12px',
                        background: prog.completed ? '#27AE60' : 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 'bold', color: '#fff'
                      }}>
                        {prog.completed ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>فصـل {ch.chapter}</div>
                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{ch.title}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => onStudy(ch._id)} style={{
                        background: prog.read ? 'rgba(78, 205, 196, 0.15)' : 'rgba(255,255,255,0.06)',
                        border: prog.read ? '1px solid #4ECDC444' : '1px solid rgba(255,255,255,0.1)',
                        padding: '12px', borderRadius: '16px', color: prog.read ? '#4ECDC4' : '#fff',
                        fontWeight: '700', cursor: 'pointer', flex: 1, fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }} className="action-btn">
                        {prog.read ? 'بازخوانی' : 'مطالعه درس'}
                        {prog.read && <span style={{fontSize: 12}}>✅</span>}
                      </button>
                      
                      <button onClick={() => onPlay(ch._id)} style={{
                        background: prog.completed ? 'rgba(255, 107, 107, 0.15)' : 'linear-gradient(135deg, #FF6B6B, #EE5253)',
                        border: prog.completed ? '1px solid #FF6B6B44' : 'none',
                        padding: '12px', borderRadius: '16px', color: prog.completed ? '#FF6B6B' : '#fff',
                        fontWeight: '800', cursor: 'pointer', flex: 1, fontSize: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        boxShadow: prog.completed ? 'none' : '0 4px 12px rgba(255, 107, 107, 0.2)'
                      }} className="action-btn">
                        {prog.completed ? 'انجام دوباره' : 'شروع ماموریت'}
                        {prog.completed && <span style={{fontSize: 12}}>🏆</span>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: '12px 24px', background: 'rgba(0,0,0,0.2)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ECDC4' }}></div>
              <span style={{ color: '#555', fontSize: 11 }}>مطالعه شده</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF6B6B' }}></div>
              <span style={{ color: '#555', fontSize: 11 }}>ماموریت کامل</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STUDY SCREEN ─────────────────────────────────────────────────────────
function StudyScreen({ subject, lesson, onBack, onPlay }) {
  const c = subject?.color || COLORS.persian;
  const containerWidth = 'min(920px, 100%)';

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR';
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const content = lesson?.content || "محتوایی یافت نشد.";

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(160deg, ${c.dark} 0%, #1a1a2e 100%)`,
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif", padding: "clamp(14px, 2.5vw, 28px) clamp(12px, 2.8vw, 28px)",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`
        @keyframes slideUp { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      `}</style>

      <div style={{ width: containerWidth, display: 'flex', justifyContent: 'space-between', marginBottom: 20, gap: 10, alignItems: 'center' }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#ccc", fontSize: 18, cursor: "pointer", whiteSpace: 'nowrap' }}>← بازگشت</button>
        <div style={{ color: "#FFD700", fontWeight: "bold", fontSize: 16, textAlign: 'right' }}>{subject?.label} 📖</div>
      </div>

      <div style={{
        width: containerWidth, background: "rgba(255,255,255,0.05)", boxSizing: 'border-box',
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "clamp(14px, 2.4vw, 26px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)", animation: "slideUp 0.5s ease-out",
        position: 'relative'
      }}>
        <button onClick={() => playAudio(content)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 44, height: 44, color: '#4ECDC4', cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
        }} title="پخش صوتی">🔊</button>

        <h3 style={{ color: '#fff', fontSize: 'clamp(18px, 2.6vw, 24px)', marginTop: 0, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 10 }}>{lesson?.title || 'آموزش'}</h3>
        <div style={{
          color: '#e0e0e0', fontSize: 'clamp(15px, 1.6vw, 18px)', lineHeight: 2, textAlign: 'justify',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          direction: subject?.dir || 'rtl'
        }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              h2: (props) => <div {...props} style={{ fontSize: 22, fontWeight: 900, margin: '14px 0 10px', color: '#fff' }} />,
              h3: (props) => <div {...props} style={{ fontSize: 19, fontWeight: 900, margin: '12px 0 8px', color: '#fff' }} />,
              hr: (props) => <hr {...props} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.18)', margin: '14px 0' }} />,
              p: (props) => <div {...props} style={{ margin: '0 0 10px' }} />,
              strong: (props) => <strong {...props} style={{ color: '#fff' }} />,
              ol: (props) => <ol {...props} style={{ margin: '0 0 10px', paddingInlineStart: 22 }} />,
              ul: (props) => <ul {...props} style={{ margin: '0 0 10px', paddingInlineStart: 22 }} />,
              li: (props) => <li {...props} style={{ margin: '0 0 6px' }} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>

      <button onClick={onPlay} style={{
        marginTop: 24, width: containerWidth, padding: "clamp(14px, 2.2vw, 18px)", boxSizing: 'border-box',
        background: `linear-gradient(135deg, ${c.bg}, ${c.dark})`,
        border: "none", borderRadius: 20, color: "#fff",
        fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 900, cursor: "pointer",
        boxShadow: `0 8px 24px ${c.bg}44`, animation: "slideUp 0.6s ease-out"
      }}>
        حالا بریم ماموریت رو انجام بدیم! 🚀
      </button>
    </div>
  );
}

// --- AUTH SCREEN ---
function AuthScreen({ mode, setMode, onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // student | parent | teacher
  const [grade, setGrade] = useState(3);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        const regData = { email, password, role, grade };
        if (role === 'parent') {
          regData.studentEmail = studentEmail;
          regData.studentPassword = studentPassword;
        }
        await onRegister(regData);
        setSuccess('ثبت‌نام موفق! حالا می‌توانید وارد شوید.');
        setEmail('');
        setPassword('');
        setStudentEmail('');
        setStudentPassword('');
      }
    } catch (err) {
      setError(err.message || 'خطایی رخ داد. دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #121212 0%, #1a1a2e 50%, #16213e 100%)",
      fontFamily: "'Vazirmatn', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* Background Decorative Elements */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(255, 107, 107, 0.2) 0%, transparent 70%)',
        top: '-150px', right: '-150px', borderRadius: '50%', filter: 'blur(50px)'
      }}></div>
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(78, 205, 196, 0.15) 0%, transparent 70%)',
        bottom: '-200px', left: '-200px', borderRadius: '50%', filter: 'blur(60px)'
      }}></div>

      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        padding: "50px 40px",
        borderRadius: "32px",
        width: "90%",
        maxWidth: "420px",
        textAlign: "center",
        boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
        animation: "fadeSlideUp 0.8s ease-out",
        zIndex: 1
      }}>
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulseScale {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .input-focus:focus {
            border-color: #4ECDC4 !important;
            box-shadow: 0 0 10px rgba(78, 205, 196, 0.3);
          }
        `}</style>

        <div style={{ fontSize: "60px", marginBottom: "20px", animation: "pulseScale 2s infinite ease-in-out" }}>🚀</div>

        <h2 style={{
          color: "#fff",
          marginBottom: "10px",
          fontSize: "32px",
          fontWeight: "900",
          letterSpacing: "-0.5px"
        }}>
          {mode === 'login' ? 'خوش مامور 007' : 'سفر خود را آغاز کن'}
        </h2>

        <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "35px", fontSize: "16px" }}>
          {mode === 'login' ? 'برای ادامه ماجراجویی وارد شو' : 'به دنیای یادگیری مأموریت‌ها خوش آمدی!'}
        </p>

        {success && (
          <div style={{
            backgroundColor: "rgba(78, 205, 196, 0.15)",
            color: "#4ECDC4",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "14px",
            border: "1px solid rgba(78, 205, 196, 0.3)",
            display: "flex", alignItems: "center", gap: "8px", justifyContent: "center"
          }}>
            ✅ {success}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: "rgba(255, 107, 107, 0.15)",
            color: "#FF6B6B",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "20px",
            fontSize: "14px",
            border: "1px solid rgba(255, 107, 107, 0.3)",
            display: "flex", alignItems: "center", gap: "8px", justifyContent: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px', display: 'block', marginRight: '5px' }}>ایمیل</label>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-focus"
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "1.5px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(0, 0, 0, 0.2)",
                color: "#fff",
                fontSize: "15px",
                transition: "all 0.3s ease",
                boxSizing: "border-box",
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px', display: 'block', marginRight: '5px' }}>رمز عبور</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-focus"
              style={{
                width: "100%", padding: "16px", borderRadius: "16px",
                border: "1.5px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(0, 0, 0, 0.2)", color: "#fff",
                fontSize: "15px", transition: "all 0.3s ease",
                boxSizing: "border-box", outline: 'none'
              }}
              required
            />
          </div>

          {mode === 'register' && (
            <>
              <div style={{ textAlign: 'right' }}>
                <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px', display: 'block', marginRight: '5px' }}>نقش کاربر</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { id: 'student', label: 'دانش‌آموز' },
                    { id: 'parent', label: 'والدین' },
                    { id: 'teacher', label: 'معلم' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: '10px 4px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold',
                        cursor: 'pointer', transition: 'all 0.2s',
                        background: role === r.id ? 'rgba(78, 205, 196, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1.5px solid ${role === r.id ? '#4ECDC4' : 'transparent'}`,
                        color: role === r.id ? '#4ECDC4' : '#888'
                      }}
                    >{r.label}</button>
                  ))}
                </div>
              </div>

              {role === 'student' && (
                <div style={{ textAlign: 'right', animation: 'fadeSlideUp 0.3s both' }}>
                  <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px', display: 'block', marginRight: '5px' }}>پایه تحصیلی</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(Number(e.target.value))}
                    style={{
                      width: "100%", padding: "16px", borderRadius: "16px",
                      border: "1.5px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(0, 0, 0, 0.2)", color: "#fff",
                      fontSize: "15px", outline: 'none', cursor: 'pointer', appearance: 'none'
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <option key={g} value={g} style={{ background: '#1a1a2e' }}>کلاس {g} (دبستان)</option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'parent' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', animation: 'fadeSlideUp 0.3s both' }}>
                  <div style={{ padding: '12px', background: 'rgba(78, 205, 196, 0.05)', borderRadius: '14px', border: '1px dashed rgba(78, 205, 196, 0.3)', marginBottom: '4px' }}>
                    <p style={{ color: '#4ECDC4', fontSize: '12px', margin: 0, textAlign: 'center' }}>اطلاعات دانش‌آموز خود را برای لینک شدن وارد کنید</p>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px', display: 'block', marginRight: '5px' }}>ایمیل دانش‌آموز</label>
                    <input
                      type="email"
                      placeholder="student@mail.com"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="input-focus"
                      style={{
                        width: "100%", padding: "16px", borderRadius: "16px",
                        border: "1.5px solid rgba(255, 255, 255, 0.1)",
                        background: "rgba(0, 0, 0, 0.2)", color: "#fff",
                        fontSize: "15px", transition: "all 0.3s ease",
                        boxSizing: "border-box", outline: 'none'
                      }}
                      required
                    />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginBottom: '8px', display: 'block', marginRight: '5px' }}>رمز عبور دانش‌آموز</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      className="input-focus"
                      style={{
                        width: "100%", padding: "16px", borderRadius: "16px",
                        border: "1.5px solid rgba(255, 255, 255, 0.1)",
                        background: "rgba(0, 0, 0, 0.2)", color: "#fff",
                        fontSize: "15px", transition: "all 0.3s ease",
                        boxSizing: "border-box", outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={isLoading} style={{
            background: "linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%)",
            border: "none",
            padding: "18px",
            borderRadius: "16px",
            color: "#fff",
            fontWeight: "900",
            cursor: "pointer",
            fontSize: "18px",
            marginTop: "10px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          }}>
            {isLoading
              ? (mode === 'login' ? '⏳ در حال ورود...' : '⏳ در حال ثبت‌نام...')
              : (mode === 'login' ? '🚀 بزن بریم!' : '🎉 ثبت نام و شروع')}
          </button>
        </form>

        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "30px", fontSize: "15px" }}>
          {mode === 'login' ? 'هنوز عضو نشدی؟ ' : 'قبلاً ثبت‌نام کردی؟ '}
          <span
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            style={{
              color: "#4ECDC4",
              cursor: "pointer",
              fontWeight: "bold",
              textDecoration: "underline",
              paddingLeft: "5px"
            }}
          >
            {mode === 'login' ? 'عضو شو' : 'وارد شو'}
          </span>
        </p>
      </div>
    </div>
  );
}
