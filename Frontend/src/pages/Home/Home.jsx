import { useState, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";

// Detect if text content is RTL (Persian/Arabic)
const isRTLContent = (text = '') => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
import { 
  Rocket, 
  Trophy, 
  BookOpen, 
  Star, 
  LogOut, 
  Shield,
  LayoutDashboard,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Play
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { SUBJECTS } from "../../constants/game";
import { LiveClock } from "../../components/LiveClock";

import * as api from "../../api";

export function Home({ onStart, onHall, onLogout, onDashboard, onAdmin }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const { user, token } = useStore();

  const [view, setView] = useState('subjects'); // 'subjects' | 'lessons' | 'study'
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [lessonDetail, setLessonDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher' || isAdmin;

  const gameStats = {
    totalStars: user?.totalStars || 0,
    completedLessons: user?.completedLessons || 0
  };
  const earnedBadges = user?.badges || [];

  // Step 1: user taps a subject → load lessons
  const handleSubjectClick = useCallback(async (sub) => {
    if (user?.role === 'parent') {
      onHall('results', sub.id);
      return;
    }
    setSelectedSubject(sub);
    setView('lessons');
    setLoading(true);
    try {
      const res = await api.curriculumLessons(token, {
        grade: user?.grade || 3,
        subject: sub.id,
      });
      setLessons(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  // Step 2: user taps a lesson → load detail then show study
  const handleLessonClick = useCallback(async (lesson) => {
    setSelectedLesson(lesson);
    setView('study');
    setLessonDetail(null);
    if (!lesson.content) {
      try {
        const res = await api.curriculumLessonDetails(token, lesson._id);
        setLessonDetail(res?.lesson || res || null);
      } catch (err) {
        console.error(err);
      }
    } else {
      setLessonDetail(lesson);
    }
  }, [token]);

  // Group lessons by chapter title
  const grouped = lessons.reduce((acc, l) => {
    const chTitle = l.chapterId?.title || t('dashboard.chapterDefault');
    if (!acc[chTitle]) acc[chTitle] = [];
    acc[chTitle].push(l);
    return acc;
  }, {});

  const content = lessonDetail?.content || selectedLesson?.content || '';

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-vazir pb-32 relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>

      {/* Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-6 pt-6 pb-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          {view !== 'subjects' && (
            <button
              onClick={() => setView(view === 'study' ? 'lessons' : 'subjects')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all"
            >
              <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
            </button>
          )}
          {isTeacher && view === 'subjects' && (
            <button onClick={onDashboard} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2">
              <LayoutDashboard size={16} />
              {t('dashboard.title')}
            </button>
          )}
          {isAdmin && view === 'subjects' && (
            <button onClick={onAdmin} className="bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2">
              <Shield size={16} />
              Admin
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-4">
        <AnimatePresence mode="wait">

          {/* ─── VIEW: SUBJECTS ─── */}
          {view === 'subjects' && (
            <motion.div key="subjects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 mt-6">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-7xl mb-6 inline-block">
                  🚀
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-brand-primary via-white to-brand-secondary bg-clip-text text-transparent leading-snug">
                  {user?.role === 'parent'
                    ? `${t('home.parentReport')} ${user?.linkedStudent?.name || t('home.student')}`
                    : t('home.welcomeTitle')}
                </h1>
                <p className="text-slate-400 text-lg font-medium max-w-lg mx-auto">
                  {user?.role === 'parent' ? `${t('home.parentSubtitle')} 🌟` : `${t('home.subtitle')} 🌟`}
                </p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {SUBJECTS.map((s, i) => (
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => handleSubjectClick(s)}
                    className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-4 hover:bg-white/10 hover:border-brand-primary/50 transition-all hover:-translate-y-2 shadow-xl"
                    style={{ boxShadow: `0 10px 40px -10px ${s.color}33` }}
                  >
                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">{s.emoji}</div>
                    <div className="space-y-1">
                      <div className="text-xl font-black">{t(s.labelKey)}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-brand-primary transition-colors">
                        {t('home.start')}
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── VIEW: LESSONS ─── */}
          {view === 'lessons' && (
            <motion.div key="lessons" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="w-full max-w-4xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-black">{t('subjects.' + selectedSubject?.id)}</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                  {t('home.grade','Grade')} {user?.grade || 3} · {t('home.lessonsList','Lessons')}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin text-brand-primary" size={48} />
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-20 text-slate-500 font-bold bg-white/5 rounded-3xl border border-white/10 border-dashed">
                  {t('study.noContent')}
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([chTitle, chLessons]) => (
                    <div key={chTitle}>
                      <h3 className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-[0.25em] mb-4 ps-1">
                        <div className="w-2 h-2 rounded-full bg-brand-primary" />
                        {chTitle}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {chLessons.map((l) => (
                          <button
                            key={l._id}
                            onClick={() => handleLessonClick(l)}
                            className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-brand-primary/40 transition-all text-start group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
                                <BookOpen size={22} />
                              </div>
                              <div>
                                <div className="font-black text-base leading-snug">{l.title}</div>
                                <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                                  {l.missions?.length || 0} {t('game.missionOf','missions')}
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={18} className={`text-slate-600 group-hover:text-brand-primary transition-colors flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── VIEW: STUDY ─── */}
          {view === 'study' && (
            <motion.div key="study" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-3xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-3xl shadow-2xl">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-black mb-1">{selectedLesson?.title}</h2>
                  <p className="text-brand-primary font-black uppercase text-[10px] tracking-[0.3em]">{t('study.lessonTitleFallback')}</p>
                </div>

                <div
                  className="min-h-[30vh] mb-10 text-lg leading-[2.2] font-medium text-slate-200 whitespace-pre-wrap"
                  dir={isRTLContent(content) ? 'rtl' : 'ltr'}
                  style={{ textAlign: isRTLContent(content) ? 'right' : 'left' }}
                >
                  {content || (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-brand-primary" size={36} />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onStart(selectedSubject.id, selectedLesson._id)}
                  className="w-full bg-brand-primary text-slate-950 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-[0_15px_40px_rgba(78,205,196,0.3)]"
                >
                  <Rocket size={24} />
                  {t('study.startMission')}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating Bottom Nav */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-[1000]">
        <div className="bg-slate-900/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-4 flex items-center justify-between shadow-2xl">
          <button onClick={() => onHall('profile')} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-2xl transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-0.5 shadow-lg shadow-brand-primary/20">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-xl font-black">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div className="text-start hidden sm:block">
              <div className="text-sm font-black truncate max-w-[120px]">
                {user?.role === 'parent' ? (user?.linkedStudent?.name || t('home.child','Child')) : (user?.name || 'Explorer')}
              </div>
              <div className="text-[10px] font-black text-brand-primary uppercase tracking-tighter">
                {user?.role === 'parent' ? t('home.parentView','Parent') : `${t('home.grade','Grade')} ${user?.grade || 3}`}
              </div>
            </div>
          </button>

          <div onClick={() => onHall('badges')} className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-[1.5rem] border border-white/5 cursor-pointer hover:bg-black/60 transition-all mx-2">
            <StatItem icon={<Star className="text-yellow-500" size={14} fill="currentColor" />} value={gameStats.totalStars} />
            <StatItem icon={<BookOpen className="text-brand-primary" size={14} />} value={gameStats.completedLessons} />
            <StatItem icon={<Trophy className="text-brand-secondary" size={14} />} value={earnedBadges.length} />
          </div>

          <button onClick={onLogout} className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
            <LogOut size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StatItem({ icon, value }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-sm font-black tabular-nums">{value}</span>
    </div>
  );
}
