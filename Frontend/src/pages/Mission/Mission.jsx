import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Star, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { COLORS, SUBJECTS } from "../../constants/game";
import { 
  getLangForSubject, 
  isRtlLang, 
  splitSpeakChunks, 
  pickBestVoice, 
  loadTtsSettings, 
  saveTtsSettings 
} from "../../utils/tts";

export function Mission({ 
  onHome, 
  subjectId, 
  initialMissions = [], 
  lessonId = null,
  api 
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const { token, user } = useStore();
  
  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[4];
  const c = COLORS[subjectId] || COLORS.persian;

  // -- Game State --
  const [missions, setMissions] = useState(initialMissions);
  const [missionIdx, setMissionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [stage, setStage] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null); // { correct: bool }
  const [timeLeft, setTimeLeft] = useState(30);
  const [showStageComplete, setShowStageComplete] = useState(false);

  // -- Mission Specific State --
  const [selectedWords, setSelectedWords] = useState([]);
  const [dragWords, setDragWords] = useState([]);
  const [fillVal, setFillVal] = useState("");

  // -- TTS State --
  const [ttsSettings, setTtsSettings] = useState(loadTtsSettings());
  const [ttsVoices, setTtsVoices] = useState([]);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const ttsQueueRef = useRef([]);
  const ttsLang = getLangForSubject(subjectId);

  const currentMission = missions[missionIdx];
  const totalMissions = missions.length;

  // -- Load Content --
  useEffect(() => {
    async function load() {
      if (!lessonId || !token || initialMissions.length > 0) return;
      try {
        const res = await api.curriculumLessonDetails(token, lessonId);
        if (res?.missions?.length) {
          setMissions(res.missions);
        }
      } catch (err) {
        console.error("Failed to load missions", err);
      }
    }
    load();
  }, [lessonId, token, initialMissions]);

  // -- Initialize Game --
  useEffect(() => {
    if (currentMission) {
      if (currentMission.words) {
        setDragWords([...currentMission.words].sort(() => Math.random() - 0.5));
      }
      setTimeLeft(30);
      setFeedback(null);
      setSelectedWords([]);
      setFillVal("");
    }
  }, [currentMission, missionIdx]);

  // -- Timer --
  useEffect(() => {
    if (isFinished || feedback || showStageComplete) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleAnswer(null, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, feedback, showStageComplete]);

  // -- TTS Initialization --
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setTtsVoices(v || []);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const ttsSpeak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const chunks = splitSpeakChunks(text);
    const speakNext = (idx) => {
      if (idx >= chunks.length) {
        setTtsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[idx]);
      utterance.lang = ttsLang;
      utterance.rate = ttsSettings.rate;
      utterance.pitch = ttsSettings.pitch;
      const voice = pickBestVoice(ttsVoices, ttsLang, ttsSettings.voiceURI);
      if (voice) utterance.voice = voice;
      
      utterance.onend = () => speakNext(idx + 1);
      window.speechSynthesis.speak(utterance);
    };
    
    setTtsSpeaking(true);
    speakNext(0);
  }, [ttsLang, ttsSettings, ttsVoices]);

  const handleAnswer = async (value, isTimeout = false) => {
    if (feedback) return;

    let correct = false;
    if (!isTimeout) {
      // DB types: 'mcq', 'fill', 'order'
      const answer = currentMission.answer ?? currentMission.a;
      if (currentMission.type === 'mcq' || currentMission.type === 'multiple_choice') {
        correct = String(value) === String(answer);
      } else if (currentMission.type === 'order' || currentMission.type === 'ordering') {
        const joined = selectedWords.join(' ').trim();
        const target = Array.isArray(answer) ? answer.join(' ').trim() : String(answer).trim();
        correct = joined === target;
      } else if (currentMission.type === 'fill' || currentMission.type === 'fill_in_the_blank') {
        correct = String(value).trim().toLowerCase() === String(answer).trim().toLowerCase();
      }
    }

    setFeedback({ correct });
    
    if (correct) {
      setScore(s => s + 10);
      const earnedStars = timeLeft > 20 ? 3 : timeLeft > 10 ? 2 : 1;
      setStars(s => s + earnedStars);
    }

    // Auto-advance after delay
    setTimeout(() => {
      nextMission();
    }, 1500);
  };

  const nextMission = () => {
    if (missionIdx + 1 >= totalMissions) {
      finishGame();
    } else {
      setMissionIdx(prev => prev + 1);
    }
  };

  const finishGame = async () => {
    setIsFinished(true);
    // Report score to API
    if (token && lessonId) {
      try {
        await api.reportScore(token, {
          lessonId,
          score,
          stars,
          subject: subjectId
        });
      } catch (err) {
        console.error("Failed to report score:", err);
      }
    }
  };

  if (isFinished) {
    return (
      <Summary 
        subject={subject} 
        score={score} 
        stars={stars} 
        onHome={onHome} 
        totalMissions={totalMissions}
      />
    );
  }

  const progress = (missionIdx / totalMissions) * 100;

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-vazir relative overflow-hidden flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60vh] bg-gradient-to-b from-brand-primary/10 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 flex items-center justify-between max-w-4xl mx-auto w-full">
        <button onClick={onHome} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <ChevronLeft size={24} className={isRTL ? 'rotate-180' : ''} />
        </button>
        
        <div className="flex-1 mx-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('game.missionOf', { mission: missionIdx + 1, total: totalMissions })}
            </span>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 text-yellow-500 font-black">
                 <Star size={16} fill="currentColor" /> {stars}
               </div>
               <div className="flex items-center gap-1.5 text-brand-primary font-black">
                 <Trophy size={16} /> {score}
               </div>
            </div>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button onClick={() => ttsSpeak(currentMission?.q)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-brand-primary">
              <Volume2 size={24} />
           </button>
        </div>
      </div>

      {/* Game Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div 
            key={missionIdx}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            className={`w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[3rem] shadow-2xl relative ${feedback?.correct === false ? 'animate-shake' : ''}`}
          >
            {/* Timer Ring */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 p-3 rounded-2xl flex items-center gap-2 shadow-xl">
              <Clock size={16} className={timeLeft < 10 ? 'animate-pulse text-red-500' : 'text-brand-primary'} />
              <span className={`font-black tabular-nums ${timeLeft < 10 ? 'text-red-500' : ''}`}>{timeLeft}s</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-center mb-10 leading-relaxed">
              {currentMission?.q}
            </h2>

            {/* Render Game Type — supports both DB types (mcq/fill/order) and legacy types */}
            {(currentMission?.type === 'mcq' || currentMission?.type === 'multiple_choice') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentMission.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-primary/50 p-6 rounded-3xl transition-all text-lg font-bold relative overflow-hidden"
                  >
                    <div className="relative z-10">{opt}</div>
                    <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {(currentMission?.type === 'order' || currentMission?.type === 'ordering') && (
              <div className="space-y-8">
                {/* Selected Area */}
                <div className="min-h-[80px] bg-black/40 border-2 border-dashed border-white/10 rounded-3xl p-4 flex flex-wrap gap-3 items-center justify-center">
                  {selectedWords.map((w, i) => (
                    <motion.button
                      layoutId={`word-${w}`}
                      key={`sel-${i}`}
                      onClick={() => {
                        setSelectedWords(s => s.filter((_, idx) => idx !== i));
                        setDragWords(d => [...d, w]);
                      }}
                      className="bg-brand-primary text-slate-950 px-4 py-2 rounded-xl font-black shadow-lg shadow-brand-primary/20"
                    >
                      {w}
                    </motion.button>
                  ))}
                </div>

                {/* Available Area */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {dragWords.map((w, i) => (
                    <motion.button
                      layoutId={`word-${w}`}
                      key={`avail-${i}`}
                      onClick={() => {
                        setSelectedWords(s => [...s, w]);
                        setDragWords(d => d.filter((_, idx) => idx !== i));
                      }}
                      className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-bold transition-all border border-white/5"
                    >
                      {w}
                    </motion.button>
                  ))}
                </div>

                <button 
                  onClick={() => handleAnswer()} 
                  disabled={selectedWords.length === 0}
                  className="w-full bg-brand-primary text-slate-950 py-4 rounded-3xl font-black text-xl shadow-xl shadow-brand-primary/20 disabled:opacity-30 transition-all"
                >
                  {t('game.checkBtn')}
                </button>
              </div>
            )}

            {/* fill / fill_in_the_blank */}
            {(currentMission?.type === 'fill' || currentMission?.type === 'fill_in_the_blank') && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={fillVal}
                  onChange={(e) => setFillVal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnswer(fillVal)}
                  placeholder={currentMission.blank || '...'}
                  autoFocus
                  className="w-full bg-black/30 border border-white/20 rounded-2xl px-6 py-4 text-xl font-bold outline-none focus:border-brand-primary transition-colors text-center"
                />
                <button
                  onClick={() => handleAnswer(fillVal)}
                  disabled={!fillVal.trim()}
                  className="w-full bg-brand-primary text-slate-950 py-4 rounded-3xl font-black text-xl disabled:opacity-30 transition-all"
                >
                  {t('game.checkBtn')}
                </button>
              </div>
            )}

            {/* Feedback Overlays */}
            <AnimatePresence>
              {feedback && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-[3rem] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-20"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    {feedback.correct ? (
                      <>
                        <div className="bg-emerald-500 p-6 rounded-full text-white shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                          <CheckCircle2 size={64} strokeWidth={3} />
                        </div>
                        <span className="text-3xl font-black text-emerald-400">عالی بود!</span>
                      </>
                    ) : (
                      <>
                        <div className="bg-red-500 p-6 rounded-full text-white shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                          <XCircle size={64} strokeWidth={3} />
                        </div>
                        <span className="text-3xl font-black text-red-400">دوباره سعی کن!</span>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation */}
      <footer className="p-8 flex justify-center relative z-10">
        <div className="flex gap-2 opacity-50 font-black text-xs uppercase tracking-[0.3em]">
          Mission Room · Grade {user?.grade || '-'}
        </div>
      </footer>
    </div>
  );
}

function Summary({ subject, score, stars, onHome, totalMissions }) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-yellow-400 to-brand-primary" />
        
        <div className="text-8xl mb-6">🏆</div>
        <h1 className="text-4xl font-black mb-2">مأموریت انجام شد!</h1>
        <p className="text-slate-400 font-bold mb-10">تبریک می‌گم! تو واقعاً قهرمانی.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <div className="text-yellow-500 mb-2 flex justify-center"><Star size={32} fill="currentColor" /></div>
            <div className="text-3xl font-black">{stars}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Stars</div>
          </div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <div className="text-brand-primary mb-2 flex justify-center"><Trophy size={32} /></div>
            <div className="text-3xl font-black">{score}</div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Score</div>
          </div>
        </div>

        <button 
          onClick={onHome}
          className="w-full bg-brand-primary text-slate-950 py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-[0_15px_40px_rgba(78,205,196,0.3)]"
        >
          🏠 بازگشت به خانه
        </button>
      </motion.div>
    </div>
  );
}
