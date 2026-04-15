import { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import * as api from "../../api";
import { useStore } from "../../store/useStore";

// Detect if text content is RTL (Persian/Arabic/Arabic-script)
const isRTLContent = (text = '') => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

import {
  BookOpen, Plus, Settings, Trash2,
  Loader2, X, Check,
  Zap, Book as BookIcon, Edit2, Save, FileText
} from "lucide-react";

// ───────────────────────────────────────
// MODAL WRAPPER
// ───────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] ${wide ? 'w-full max-w-4xl' : 'w-full max-w-xl'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-black">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-brand-primary transition-colors";
const textareaCls = `${inputCls} resize-y min-h-[100px]`;
const btnPrimary = "bg-brand-primary text-slate-950 px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90 inline-flex items-center gap-2 disabled:opacity-50";
const btnGhost = "bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-black text-sm transition-all hover:bg-white/10 inline-flex items-center gap-2";
const btnDanger = "bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-xl font-black text-xs transition-all hover:bg-red-500 hover:text-white inline-flex items-center gap-1.5";
const iconBtn = (color) => `w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all flex-shrink-0 ${color}`;

// ───────────────────────────────────────
// ADD LESSON MODAL
// ───────────────────────────────────────
function AddLessonModal({ token, grade, subject, courseId, chapters, onClose, onSaved }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [chapterId, setChapterId] = useState(chapters[0]?._id || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    if (!title.trim() || !content.trim()) return setErr(t('errors.titleRequired'));
    setBusy(true); setErr('');
    const selectedChapter = chapters.find(c => c._id === chapterId);
    const res = await api.createLesson(token, {
      grade: Number(grade), subject, courseId,
      chapterId: chapterId || undefined,
      chapter: selectedChapter?.number || 1,
      chapterTitle: selectedChapter?.title || '',
      title: title.trim(),
      content: content.trim(),
    });
    setBusy(false);
    if (res?.error) return setErr(res.error);
    onSaved(res);
  };

  return (
    <Modal title={`➕ ${t('dashboard.addLesson')}`} onClose={onClose} wide>
      {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">{err}</div>}
      <Field label={t('dashboard.chapter')}>
        <select value={chapterId} onChange={e => setChapterId(e.target.value)} className={inputCls}>
          <option value="">— {t('dashboard.chapter')} —</option>
          {chapters.map(c => <option key={c._id} value={c._id}>{c.number}. {c.title}</option>)}
        </select>
      </Field>
      <Field label={t('dashboard.lessonTitle')}>
        <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
      </Field>
      <Field label={t('dashboard.content')}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className={`${textareaCls} min-h-[200px]`}
          dir={isRTLContent(content) ? 'rtl' : 'ltr'}
          style={{ textAlign: isRTLContent(content) ? 'right' : 'left' }}
        />
      </Field>
      <div className="flex gap-3 justify-end mt-2">
        <button onClick={onClose} className={btnGhost}>{t('dashboard.cancel')}</button>
        <button onClick={save} disabled={busy} className={btnPrimary}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} {t('dashboard.newLesson')}
        </button>
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────
// EDIT LESSON MODAL
// ───────────────────────────────────────
function EditLessonModal({ token, lesson, onClose, onSaved }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(lesson.title || '');
  const [content, setContent] = useState('');
  const [missionsStr, setMissionsStr] = useState('[]');
  const [loadingFull, setLoadingFull] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('content');

  useEffect(() => {
    setLoadingFull(true);
    api.curriculumLessonDetails(token, lesson._id)
      .then(res => {
        if (res && !res.error) {
          setTitle(res.title || lesson.title || '');
          setContent(res.content || '');
          setMissionsStr(JSON.stringify(res.missions || [], null, 2));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingFull(false));
  }, [lesson._id, token]);

  const save = async () => {
    setBusy(true); setErr('');
    let missions;
    if (tab === 'missions') {
      try { missions = JSON.parse(missionsStr); }
      catch { setBusy(false); return setErr(t('errors.invalidJson')); }
    }
    const payload = {};
    if (tab === 'content') { payload.title = title; payload.content = content; }
    if (tab === 'missions') { payload.missions = missions; }
    const res = await api.updateLesson(token, lesson._id, payload);
    setBusy(false);
    if (res?.error) return setErr(res.error);
    onSaved(res);
  };

  const generateMissions = async () => {
    setBusy(true); setErr('');
    const res = await api.generateLessonMissions(token, lesson._id);
    setBusy(false);
    if (res?.error) return setErr(res.error);
    if (res?.missions) setMissionsStr(JSON.stringify(res.missions, null, 2));
  };

  const TABS = [
    { id: 'content', label: `📖 ${t('dashboard.content')}` },
    { id: 'missions', label: `🎯 ${t('dashboard.missionManager')}` },
  ];

  return (
    <Modal title={`✏️ ${lesson.title}`} onClose={onClose} wide>
      {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">{err}</div>}
      <div className="flex gap-2 mb-6">
        {TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tab === tb.id ? 'bg-brand-primary text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {loadingFull ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-brand-primary" />
        </div>
      ) : (
        <>
          {tab === 'content' && (
            <>
              <Field label={t('dashboard.lessonTitle')}>
                <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('dashboard.lessonContent')}>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className={`${textareaCls} min-h-[300px]`}
                  dir={isRTLContent(content) ? 'rtl' : 'ltr'}
                  style={{ textAlign: isRTLContent(content) ? 'right' : 'left' }}
                />
              </Field>
            </>
          )}
          {tab === 'missions' && (
            <>
              <div className="flex gap-3 mb-4">
                <button onClick={generateMissions} disabled={busy} className={btnGhost}>
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  {t('dashboard.autoGenerate')}
                </button>
                <span className="text-xs text-slate-500 font-bold self-center">or edit JSON directly</span>
              </div>
              <div className="text-xs text-slate-500 font-bold mb-2 ltr-force" dir="ltr">
                Format: type: mcq|fill|order · q: question · options: [...] · answer: answer · exp: explanation
              </div>
              <textarea
                value={missionsStr}
                onChange={e => setMissionsStr(e.target.value)}
                className={`${textareaCls} min-h-[320px] font-mono text-xs`}
                dir="ltr"
                style={{ textAlign: 'left' }}
                spellCheck={false}
              />
            </>
          )}
        </>
      )}

      <div className="flex gap-3 justify-end mt-4">
        <button onClick={onClose} className={btnGhost}>{t('dashboard.cancel')}</button>
        <button onClick={save} disabled={busy || loadingFull} className={btnPrimary}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {t('profile.save')}
        </button>
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────
// COURSE MANAGER MODAL
// ───────────────────────────────────────
function CourseManagerModal({ token, grade, subject, courses, chapters, onClose, onRefresh }) {
  const { t } = useTranslation();
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterNum, setNewChapterNum] = useState(1);
  const [selectedCourseForChapter, setSelectedCourseForChapter] = useState(courses[0]?._id || '');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const addCourse = async () => {
    setBusy('course'); setErr('');
    const res = await api.createCourse(token, { grade: Number(grade), subject, title: newCourseTitle.trim() || undefined });
    setBusy('');
    if (res?.error) return setErr(res.error);
    setNewCourseTitle('');
    onRefresh();
  };

  const deleteCourse = async (courseId) => {
    if (!confirm(t('confirm.deleteCourse'))) return;
    setBusy('delcourse'); setErr('');
    const res = await api.deleteCourse(token, courseId);
    setBusy('');
    if (res?.error) return setErr(res.error);
    onRefresh();
  };

  const addChapter = async () => {
    if (!selectedCourseForChapter) return setErr('Select a course first');
    if (!newChapterTitle.trim()) return setErr('Chapter title is required');
    setBusy('chapter'); setErr('');
    const res = await api.createChapter(token, selectedCourseForChapter, {
      number: Number(newChapterNum),
      title: newChapterTitle.trim(),
    });
    setBusy('');
    if (res?.error) return setErr(res.error);
    setNewChapterTitle(''); setNewChapterNum(n => n + 1);
    onRefresh();
  };

  const deleteChapter = async (chId) => {
    if (!confirm(t('confirm.deleteLesson'))) return;
    setBusy('delch'); setErr('');
    await api.deleteChapter(token, chId);
    setBusy('');
    onRefresh();
  };

  return (
    <Modal title={`📚 ${t('dashboard.courseManager')}`} onClose={onClose} wide>
      {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">{err}</div>}

      {/* Courses */}
      <div className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
          {t('dashboard.courseList')} — {t('dashboard.grade')} {grade} · {subject}
        </h3>
        <div className="space-y-2 mb-4">
          {courses.length === 0 && <p className="text-slate-500 text-sm">{t('dashboard.noCourses')}</p>}
          {courses.map(c => (
            <div key={c._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <div className="font-black text-sm">{c.title || '—'}</div>
                <div className="text-[10px] text-slate-500 ltr-force" dir="ltr">{c._id}</div>
              </div>
              <button onClick={() => deleteCourse(c._id)} className={btnDanger}>
                <Trash2 size={13} /> {t('dashboard.deleteCourseAction')}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <input value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)}
            placeholder={t('dashboard.courseTitle')} className={`${inputCls} flex-1`} />
          <button onClick={addCourse} disabled={busy === 'course'} className={btnPrimary}>
            {busy === 'course' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {t('dashboard.addCourse')}
          </button>
        </div>
      </div>

      {/* Chapters */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
          {t('dashboard.chapter')}s
        </h3>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {chapters.length === 0 && <p className="text-slate-500 text-sm">No chapters yet</p>}
          {chapters.map(c => (
            <div key={c._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="font-black text-sm">{c.number}. {c.title}</div>
              <button onClick={() => deleteChapter(c._id)} className={btnDanger}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[80px_1fr_auto] gap-3">
          <input type="number" value={newChapterNum} onChange={e => setNewChapterNum(e.target.value)}
            min={1} className={inputCls} placeholder="#" />
          <input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)}
            placeholder={t('dashboard.chapterTitle')} className={inputCls} />
          <button onClick={addChapter} disabled={busy === 'chapter'} className={btnPrimary}>
            {busy === 'chapter' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
        {courses.length > 1 && (
          <div className="mt-3">
            <Field label={`${t('dashboard.subject')} Course`}>
              <select value={selectedCourseForChapter} onChange={e => setSelectedCourseForChapter(e.target.value)} className={inputCls}>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ───────────────────────────────────────
// CONTENT PREVIEW
// ───────────────────────────────────────
function ContentPreview({ lessonId, token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    setLoading(true); setErrMsg('');
    api.curriculumLessonDetails(token, lessonId)
      .then(res => {
        if (res?.error) { setErrMsg(res.error); setData(null); }
        else setData(res);
      })
      .catch(e => { setErrMsg(e.message || 'Error'); setData(null); })
      .finally(() => setLoading(false));
  }, [lessonId, token]);

  if (loading) return <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-brand-primary" /></div>;
  if (errMsg) return <div className="text-red-400 text-xs py-3 text-center font-bold">{errMsg}</div>;

  const content = data?.content ?? '';
  const missionsCount = data?.missions?.length ?? 0;

  return (
    <div className="mt-4 space-y-3">
      {content ? (
        <div
          className="bg-black/20 rounded-xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto font-medium"
          dir={isRTLContent(content) ? 'rtl' : 'ltr'}
          style={{ textAlign: isRTLContent(content) ? 'right' : 'left' }}
        >
          {content}
        </div>
      ) : (
        <div className="text-slate-600 text-sm text-center py-3 bg-black/20 rounded-xl">No content found</div>
      )}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
        <Zap size={12} className="text-brand-primary" />
        {missionsCount} missions saved
      </div>
    </div>
  );
}

// ───────────────────────────────────────
// MAIN DASHBOARD
// ───────────────────────────────────────
export function Dashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const { token, user } = useStore();

  const [grade, setGrade] = useState(user?.grade || 3);
  const [subject, setSubject] = useState('persian');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const missionAiProvider = useStore(s => s.missionAiProvider);
  const setMissionAiProvider = useStore(s => s.setMissionAiProvider);

  const SUBJECTS = [
    { id: 'persian',  label: `📚 ${t('subjects.persian')}` },
    { id: 'math',     label: `➗ ${t('subjects.math')}` },
    { id: 'science',  label: `🔬 ${t('subjects.science')}` },
    { id: 'english',  label: `🇺🇸 ${t('subjects.english')}` },
    { id: 'arabic',   label: `📝 ${t('subjects.arabic')}` },
    { id: 'computer', label: `💻 ${t('subjects.computer')}` },
  ];

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setErr('');
    try {
      const cs = await api.curriculumCourses(token, { grade, subject });
      const courseList = Array.isArray(cs) ? cs : cs?.courses || [];
      setCourses(courseList);

      const courseId = selectedCourseId && courseList.some(c => c._id === selectedCourseId)
        ? selectedCourseId : courseList[0]?._id || '';
      setSelectedCourseId(courseId);

      let chapList = [];
      if (courseId) {
        const ch = await api.getChapters(token, courseId);
        chapList = Array.isArray(ch) ? ch : [];
      }
      setChapters(chapList);

      const ls = await api.curriculumLessons(token, { grade, subject });
      setLessons(Array.isArray(ls) ? ls : []);
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [token, grade, subject, selectedCourseId]);

  useEffect(() => { load(); }, [grade, subject]);

  const deleteLesson = async (id) => {
    if (!confirm(t('confirm.deleteLesson'))) return;
    setBusy(id);
    await api.deleteLesson(token, id);
    setBusy('');
    load();
  };

  const generateMissions = async (lessonId) => {
    setBusy('gen' + lessonId);
    const res = await api.generateLessonMissions(token, lessonId);
    setBusy('');
    if (res?.error) return setErr(res.error);
    load();
  };

  const grouped = lessons.reduce((acc, l) => {
    const key = l.chapterId?.title || (isRTL ? 'بدون فصل' : 'No Chapter');
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  const totalMissions = lessons.reduce((s, l) => s + (l.missions?.length || 0), 0);

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-vazir`} dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Modals */}
      {showAddLesson && (
        <AddLessonModal token={token} grade={grade} subject={subject}
          courseId={selectedCourseId} chapters={chapters}
          onClose={() => setShowAddLesson(false)}
          onSaved={() => { setShowAddLesson(false); load(); }}
        />
      )}
      {showCourseManager && (
        <CourseManagerModal token={token} grade={grade} subject={subject}
          courses={courses} chapters={chapters}
          onClose={() => setShowCourseManager(false)}
          onRefresh={() => { setShowCourseManager(false); load(); }}
        />
      )}
      {editingLesson && (
        <EditLessonModal token={token} lesson={editingLesson}
          onClose={() => setEditingLesson(null)}
          onSaved={() => { setEditingLesson(null); load(); }}
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/20 to-slate-950" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Title + grade */}
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">
                  {t('dashboard.title')}
                </div>
                <h1 className="text-3xl md:text-4xl font-black">
                  {SUBJECTS.find(s => s.id === subject)?.label}
                </h1>
              </div>
              <select
                value={grade}
                onChange={e => { setGrade(Number(e.target.value)); setSelectedCourseId(''); }}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-black outline-none hover:bg-white/15 transition-all cursor-pointer"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                  <option key={g} value={g}>{t('auth.gradeOption', { grade: g })}</option>
                ))}
              </select>
            </div>

            {/* Subject selector */}
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(s => (
                <button key={s.id} onClick={() => { setSubject(s.id); setSelectedCourseId(''); }}
                  className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${subject === s.id ? 'bg-white text-slate-950 border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats + AI Provider combined bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-white/5 border border-white/10 rounded-2xl">
          {/* Stats */}
          <div className="flex items-center gap-1 divide-x divide-white/10 rtl:divide-x-reverse">
            {[
              { label: t('dashboard.coursesCount'), val: courses.length },
              { label: t('dashboard.chapter'), val: chapters.length },
              { label: t('dashboard.lessons'), val: lessons.length },
              { label: t('dashboard.missionManager'), val: totalMissions },
            ].map(({ label, val }) => (
              <div key={label} className="text-center px-4">
                <div className="text-lg font-black text-brand-primary leading-none">{val}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="w-px h-8 bg-white/10 flex-shrink-0" />

          {/* AI Provider toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              {t('dashboard.provider')}:
            </span>
            <div className="flex gap-1">
              {[['anthropic','Claude'],['openai','GPT-4o']].map(([id, label]) => (
                <button key={id} onClick={() => setMissionAiProvider(id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
                    missionAiProvider === id ? 'bg-brand-primary text-slate-950' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black flex items-center gap-2">
            <BookIcon size={22} className="text-brand-primary" />
            {t('dashboard.lessons')}
            <span className="text-slate-500 font-bold text-base">({lessons.length})</span>
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setShowCourseManager(true)} className={btnGhost}>
              <Settings size={16} /> {t('dashboard.chapter')}s
            </button>
            <button onClick={() => setShowAddLesson(true)} className={btnPrimary}>
              <Plus size={16} /> {t('dashboard.addLesson')}
            </button>
          </div>
        </div>

        {err && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm">{err}</div>}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-primary" size={48} />
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
            <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-lg">{t('dashboard.noCourses')}</p>
            <button onClick={() => setShowAddLesson(true)} className={`${btnPrimary} mx-auto mt-6`}>
              <Plus size={16} /> {t('dashboard.addLesson')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([chTitle, chLessons]) => (
              <div key={chTitle}>
                <div className="flex items-center gap-2 mb-3 ps-1">
                  <div className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{chTitle}</h3>
                </div>
                <div className="space-y-2">
                  {chLessons.map(l => (
                    <div key={l._id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.06] transition-all">
                      <div className="flex items-center justify-between gap-4 p-4">
                        <button
                          onClick={() => setExpandedLesson(expandedLesson === l._id ? null : l._id)}
                          className="flex items-start gap-3 flex-1 min-w-0 text-start"
                        >
                          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 inline-flex items-center justify-center text-brand-primary font-black text-xs flex-shrink-0 mt-0.5">
                            {l.missions?.length || 0}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-base leading-tight">{l.title}</div>
                            <div className="text-[11px] text-slate-500 font-bold mt-0.5 uppercase">
                              {l.chapterId?.title || (isRTL ? 'بدون فصل' : 'No chapter')}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => generateMissions(l._id)}
                            disabled={busy === 'gen' + l._id}
                            className={iconBtn('bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-slate-950')}
                            title={t('dashboard.autoGenerate')}
                          >
                            {busy === 'gen' + l._id ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                          </button>
                          <button
                            onClick={() => setEditingLesson(l)}
                            className={iconBtn('bg-white/5 hover:bg-white/15 text-slate-300')}
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => deleteLesson(l._id)}
                            disabled={busy === l._id}
                            className={iconBtn('bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white')}
                            title="Delete"
                          >
                            {busy === l._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </button>
                        </div>
                      </div>
                      {expandedLesson === l._id && (
                        <div className="px-4 pb-4 border-t border-white/5">
                          <ContentPreview lessonId={l._id} token={token} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
