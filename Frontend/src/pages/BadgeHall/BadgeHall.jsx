import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trophy, 
  User, 
  FileText, 
  Star, 
  BadgeCheck, 
  Zap, 
  Book, 
  ChevronRight,
  LogOut,
  Edit2,
  Check,
  Loader2
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { BADGES, SUBJECTS } from "../../constants/game";
import * as api from "../../api";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

export function BadgeHall({ onBack, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const { token, user, setUser } = useStore();
  
  const [tab, setTab] = useState('badges'); // 'badges' | 'profile' | 'results'
  const [editName, setEditName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [detailedResults, setDetailedResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  
  // Real stats (simplified for now, usually come from user object or sync)
  const gameStats = {
    totalStars: user?.totalStars || 0,
    completedLessons: user?.completedLessons || 0,
    fastAnswers: user?.fastAnswers || 0,
  };
  const earnedBadges = user?.badges || [];

  const fetchDetailedResults = async () => {
    if (!token) return;
    setIsLoadingResults(true);
    setTab('results');
    try {
      const data = await api.getDetailedResults(token);
      // API returns {scores:[]} for student/parent, {students:[{scores:[]}]} for teacher
      if (Array.isArray(data)) {
        setDetailedResults(data);
      } else if (Array.isArray(data?.scores)) {
        setDetailedResults(data.scores);
      } else if (Array.isArray(data?.students)) {
        // teacher view: flatten all student scores
        const flat = data.students.flatMap(s =>
          (s.scores || []).map(r => ({ ...r, studentName: s.studentName, studentEmail: s.studentEmail }))
        );
        setDetailedResults(flat);
      } else {
        setDetailedResults([]);
      }
    } catch (err) {
      console.error(err);
      setDetailedResults([]);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const handleUpdateName = async () => {
    if (!token) return;
    setIsUpdating(true);
    try {
      const res = await api.updateProfile(token, { name: editName });
      if (res.user) {
        setUser({ ...user, name: res.user.name });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onBack}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={`relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isRTL ? 'rtl font-vazir text-right' : 'ltr text-left'}`}
      >
        {/* Header Tabs */}
        <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
            <TabButton 
              active={tab === 'badges'} 
              onClick={() => setTab('badges')} 
              icon={<Trophy size={16}/>}
              label={t('hall.achievements')}
            />
            <TabButton 
              active={tab === 'results'} 
              onClick={fetchDetailedResults} 
              icon={<FileText size={16}/>}
              label={t('hall.performanceReport')}
            />
            <TabButton 
              active={tab === 'profile'} 
              onClick={() => setTab('profile')} 
              icon={<User size={16}/>}
              label={t('nav.profile')}
            />
          </div>
          
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {tab === 'badges' && (
              <motion.div 
                key="badges"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="text-center">
                   <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                     {t('hall.hallOfFame')}
                   </h2>
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t('hall.achievementsSubtitle')}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   <StatCard icon={<Star className="text-yellow-500" size={24} fill="currentColor"/>} value={gameStats.totalStars} label={t('hall.totalStars')} />
                   <StatCard icon={<BadgeCheck className="text-brand-primary" size={24} />} value={earnedBadges.length} label="Badges" />
                   <StatCard icon={<Book className="text-brand-secondary" size={24} />} value={gameStats.completedLessons} label="Lessons" />
                   <StatCard icon={<Zap className="text-orange-500" size={24} />} value={gameStats.fastAnswers} label="Fast" />
                </div>

                {/* Badges Grid */}
                <div className="space-y-4">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">{t('hall.badges')}</h3>
                   <div className="grid grid-cols-3 gap-3">
                      {BADGES.map(b => {
                        const earned = earnedBadges.includes(b.id);
                        return (
                          <div key={b.id} className={`p-6 rounded-3xl border transition-all flex flex-col items-center text-center gap-3 ${earned ? 'bg-brand-primary/10 border-brand-primary/20 grayscale-0' : 'bg-white/5 border-transparent grayscale brightness-50'}`}>
                             <div className="text-4xl group-hover:scale-110 transition-transform">{b.emoji}</div>
                             <div className={`text-[10px] font-black uppercase text-center leading-tight ${earned ? 'text-brand-primary' : 'text-slate-600'}`}>{t(b.labelKey)}</div>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </motion.div>
            )}

            {tab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col items-center gap-6">
                   <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary border-2 border-brand-primary/30">
                     <User size={48} />
                   </div>
                   <div className="w-full space-y-4">
                      <div className="space-y-1 text-center">
                        <div className="text-slate-500 text-xs font-black uppercase tracking-widest">{user?.role} · Grade {user?.grade}</div>
                        <div className="text-white font-black opacity-60">{user?.email}</div>
                      </div>
                      
                      <div className="relative">
                        <input 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-center text-xl font-black outline-none focus:border-brand-primary transition-all"
                          placeholder="Your Name"
                        />
                        <button 
                          onClick={handleUpdateName}
                          disabled={isUpdating || editName === user?.name}
                          className="absolute end-4 top-1/2 -translate-y-1/2 p-2 bg-brand-primary text-slate-950 rounded-xl hover:scale-105 transition-all disabled:opacity-0 disabled:pointer-events-none"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">🌍 زبان / Language</div>
                  <LanguageSwitcher />
                </div>

                <button 
                  onClick={onLogout}
                  className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                >
                  <LogOut size={18} /> {t('nav.logout')}
                </button>
              </motion.div>
            )}

            {tab === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-black text-lg">{t('hall.performanceReport')}</h3>
                  {isLoadingResults && <Loader2 size={18} className="animate-spin text-brand-primary" />}
                </div>

                {isLoadingResults ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-brand-primary" />
                  </div>
                ) : detailedResults.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <FileText size={40} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">{t('hall.noResultsYet')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detailedResults.map((r, i) => (
                      <div key={r._id || i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black text-brand-primary capitalize">{r.subject}</div>
                            {r.studentName && (
                              <div className="text-xs text-slate-400 font-bold">{r.studentName}</div>
                            )}
                            <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', { year:'numeric', month:'short', day:'numeric' }) : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-[10px] uppercase font-black text-slate-500">{t('hall.score')}</div>
                              <div className="font-black text-white text-lg">{r.score ?? '—'}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] uppercase font-black text-slate-500">{t('hall.starsTitle')}</div>
                              <div className="font-black text-yellow-400 text-lg">⭐ {r.stars ?? 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${active ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ icon, value, label }) {
  return (
     <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-center text-center gap-1">
        <div className="mb-1">{icon}</div>
        <div className="text-xl font-black">{value}</div>
        <div className="text-[9px] uppercase font-black text-slate-500 tracking-wider leading-none">{label}</div>
     </div>
  );
}
