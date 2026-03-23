import { useState, useEffect, useRef, useCallback } from "react";
import * as api from "./api";

// ── Inline styles (no Tailwind needed beyond defaults) ──────────────────────
const COLORS = {
  persian: { bg: "#FF6B6B", light: "#FFE5E5", dark: "#C0392B", text: "#fff" },
  arabic: { bg: "#4ECDC4", light: "#E0F7F5", dark: "#1A8E87", text: "#fff" },
  english: { bg: "#45B7D1", light: "#E0F4FA", dark: "#1A7A9A", text: "#fff" },
  science: { bg: "#96CEB4", light: "#E0F5EA", dark: "#3A7A5A", text: "#fff" },
};

const SUBJECTS = [
  { id: "persian", label: "فارسی", emoji: "📖", color: COLORS.persian, dir: "rtl" },
  { id: "arabic", label: "عربی", emoji: "🌙", color: COLORS.arabic, dir: "rtl" },
  { id: "english", label: "English", emoji: "🌟", color: COLORS.english, dir: "ltr" },
  { id: "science", label: "علوم", emoji: "🔬", color: COLORS.science, dir: "rtl" },
];

const BADGES = [
  { id: "first_star", emoji: "⭐", label: "اولین ستاره", condition: (s) => s.totalStars >= 1 },
  { id: "ten_stars", emoji: "🌟", label: "۱۰ ستاره", condition: (s) => s.totalStars >= 10 },
  { id: "speed_demon", emoji: "⚡", label: "سریع‌الفهم", condition: (s) => s.fastAnswers >= 3 },
  { id: "perfect", emoji: "💎", label: "بی‌نقص", condition: (s) => s.perfectStages >= 1 },
  { id: "lesson_done", emoji: "🎓", label: "درس کامل", condition: (s) => s.completedLessons >= 1 },
  { id: "four_lessons", emoji: "🏆", label: "قهرمان روز", condition: (s) => s.completedLessons >= 4 },
];

// ─── Demo missions per subject ────────────────────────────────────────────
function buildMissions(subjectId) {
  const banks = {
    persian: [
      {
        type: "mcq", stage: 1,
        q: "کدام گزینه جمع «کتاب» است؟",
        options: ["کتابها", "کتابان", "کتابین", "کتابون"],
        answer: 0, exp: "جمع «کتاب» در فارسی با پسوند «ها» ساخته می‌شود: کتاب‌ها",
      },
      {
        type: "fill", stage: 1,
        q: "جمله را کامل کن: «من به ___ می‌روم.»",
        blank: "مدرسه", hint: "محل تحصیل", exp: "«مدرسه» محل یادگیری است.",
      },
      {
        type: "mcq", stage: 1,
        q: "نقطه‌گذاری درست کدام است؟",
        options: ["سلام، حال شما چطور است؟", "سلام حال شما چطور است", "سلام! حال شما چطور است.", "سلام؟ حال شما چطور است!"],
        answer: 0, exp: "بعد از کلمه‌ی ندا (سلام) ویرگول می‌گذاریم.",
      },
      {
        type: "order", stage: 2,
        q: "کلمات را مرتب کن تا جمله درست شود:",
        words: ["می‌خوانم", "من", "را", "کتاب"],
        answer: "من کتاب را می‌خوانم",
        exp: "ترتیب جمله در فارسی: فاعل + مفعول + فعل",
      },
      {
        type: "mcq", stage: 2,
        q: "معنای «مهربان» چیست؟",
        options: ["عصبانی", "دوستانه و خوش‌قلب", "ترسو", "تنبل"],
        answer: 1, exp: "مهربان یعنی کسی که قلب خوبی دارد و به دیگران محبت می‌کند.",
      },
      {
        type: "fill", stage: 2,
        q: "«___ را در آسمان می‌بینیم.»",
        blank: "ستاره", hint: "شب‌ها در آسمان می‌درخشد", exp: "ستاره‌ها اجرام نورانی آسمان هستند.",
      },
      {
        type: "mcq", stage: 3,
        q: "کدام کلمه هم‌معنای «خوشحال» است؟",
        options: ["غمگین", "شاد", "خسته", "عصبانی"],
        answer: 1, exp: "شاد و خوشحال هر دو به یک معنا هستند.",
      },
      {
        type: "fill", stage: 3,
        q: "«پدرم هر روز ___ می‌کند.»",
        blank: "کار", hint: "شغل و فعالیت", exp: "کار کردن یعنی تلاش برای کسب درآمد.",
      },
    ],
    arabic: [
      {
        type: "mcq", stage: 1,
        q: "ما معنى كلمة «كتاب»؟",
        options: ["قلم", "كتاب", "مدرسة", "معلم"],
        answer: 1, exp: "كلمة «كتاب» تعني Book بالإنجليزية وکتاب بالفارسية.",
      },
      {
        type: "fill", stage: 1,
        q: "أكمل: «ذهبتُ إلى ___»",
        blank: "المدرسة", hint: "مكان التعلّم", exp: "المدرسة هي المكان الذي نتعلم فيه.",
      },
      {
        type: "mcq", stage: 1,
        q: "ما مفرد «طلاب»؟",
        options: ["طالبة", "طالبان", "طالب", "مطلوب"],
        answer: 2, exp: "مفرد طلاب هو طالب.",
      },
      {
        type: "mcq", stage: 2,
        q: "ما ضمير المتكلم؟",
        options: ["هو", "أنتَ", "أنا", "هي"],
        answer: 2, exp: "«أنا» هو ضمير المتكلم للمفرد.",
      },
      {
        type: "fill", stage: 2,
        q: "«___ معلمٌ جيد.»",
        blank: "هو", hint: "ضمير غائب مذكر", exp: "هو ضمير الغائب المذكر المفرد.",
      },
      {
        type: "mcq", stage: 2,
        q: "ما معنى «جميل»؟",
        options: ["قبيح", "حزين", "جميل/بالفارسية زیبا", "غاضب"],
        answer: 2, exp: "جميل تعني زیبا بالفارسية وBeautiful بالإنجليزية.",
      },
      {
        type: "mcq", stage: 3,
        q: "كيف نقول «شكراً» بالعربية؟",
        options: ["مرحبا", "شكراً", "وداعاً", "أهلاً"],
        answer: 1, exp: "شكراً هي كلمة الشكر الأساسية في اللغة العربية.",
      },
      {
        type: "fill", stage: 3,
        q: "«___ صديقي.»",
        blank: "أنتَ", hint: "ضمير المخاطب", exp: "أنتَ ضمير المخاطب المذكر المفرد.",
      },
    ],
    english: [
      {
        type: "mcq", stage: 1,
        q: "What is the plural of 'child'?",
        options: ["childs", "childes", "children", "childrens"],
        answer: 2, exp: "'Child' has an irregular plural: children (not childs!).",
      },
      {
        type: "fill", stage: 1,
        q: "Complete: 'I ___ to school every day.'",
        blank: "go", hint: "present simple of 'go'", exp: "We use 'go' with I/you/we/they.",
      },
      {
        type: "mcq", stage: 1,
        q: "Which sentence is correct?",
        options: ["She go to school.", "She goes to school.", "She going to school.", "She goed to school."],
        answer: 1, exp: "With he/she/it, we add -es or -s to the verb.",
      },
      {
        type: "order", stage: 2,
        q: "Arrange the words to make a sentence:",
        words: ["likes", "She", "apples", "red"],
        answer: "She likes red apples",
        exp: "English word order: Subject + Verb + Object + Adjective (before noun).",
      },
      {
        type: "mcq", stage: 2,
        q: "What does 'enormous' mean?",
        options: ["tiny", "very big", "colorful", "quiet"],
        answer: 1, exp: "'Enormous' means extremely large or huge.",
      },
      {
        type: "fill", stage: 2,
        q: "'The cat sat ___ the mat.'",
        blank: "on", hint: "preposition of place", exp: "'On' shows something is on top of a surface.",
      },
      {
        type: "mcq", stage: 3,
        q: "Which is the past tense of 'run'?",
        options: ["runned", "ran", "runs", "running"],
        answer: 1, exp: "'Run' is an irregular verb — past tense is 'ran'.",
      },
      {
        type: "fill", stage: 3,
        q: "'___ you speak English?' 'Yes, I can!'",
        blank: "Can", hint: "modal verb for ability", exp: "'Can' is used to ask about ability.",
      },
    ],
    science: [
      {
        type: "mcq", stage: 1,
        q: "کدام یک از منابع انرژی تجدیدپذیر است؟",
        options: ["نفت", "زغال‌سنگ", "خورشید", "گاز طبیعی"],
        answer: 2, exp: "انرژی خورشیدی تجدیدپذیر است چون خورشید همیشه می‌درخشد.",
      },
      {
        type: "fill", stage: 1,
        q: "آب در دمای ۱۰۰ درجه ___ می‌شود.",
        blank: "بخار", hint: "حالت گازی آب", exp: "در ۱۰۰ درجه سانتیگراد آب به بخار تبدیل می‌شود.",
      },
      {
        type: "mcq", stage: 1,
        q: "کدام اندام خون را پمپاژ می‌کند؟",
        options: ["ریه", "کبد", "قلب", "معده"],
        answer: 2, exp: "قلب خون را در سراسر بدن پمپاژ می‌کند.",
      },
      {
        type: "mcq", stage: 2,
        q: "گیاهان از طریق کدام فرایند غذا می‌سازند؟",
        options: ["تنفس", "فتوسنتز", "هضم", "تبخیر"],
        answer: 1, exp: "فتوسنتز فرایندی است که گیاهان از نور خورشید برای ساخت غذا استفاده می‌کنند.",
      },
      {
        type: "fill", stage: 2,
        q: "زمین به دور ___ می‌گردد.",
        blank: "خورشید", hint: "ستاره مرکز منظومه شمسی", exp: "زمین در مدار خود به دور خورشید می‌چرخد.",
      },
      {
        type: "mcq", stage: 2,
        q: "کدام یک سریع‌تر از صوت است؟",
        options: ["قطار", "هواپیمای جت", "نور", "موشک"],
        answer: 2, exp: "نور با سرعت ۳۰۰,۰۰۰ کیلومتر در ثانیه سریع‌ترین چیز در جهان است.",
      },
      {
        type: "mcq", stage: 3,
        q: "کدام ماده جامد، مایع و گاز دارد؟",
        options: ["نمک", "آهن", "آب", "شن"],
        answer: 2, exp: "آب می‌تواند جامد (یخ)، مایع (آب) یا گاز (بخار) باشد.",
      },
      {
        type: "fill", stage: 3,
        q: "نیروی ___ اجسام را به سمت زمین می‌کشد.",
        blank: "جاذبه", hint: "نیروی زمین", exp: "نیروی جاذبه زمین اجسام را به سمت مرکز زمین می‌کشد.",
      },
    ],
  };
  return banks[subjectId] || [];
}

// ─── Utility ─────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function StarBurst({ count }) {
  return (
    <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ fontSize: 22, animation: `pop 0.3s ${i * 0.08}s both` }}>⭐</span>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(localStorage.getItem('token') ? 'home' : 'login'); // home | upload | game | summary | hall | login
  const [uploadedText, setUploadedText] = useState("");
  const [uploadSubject, setUploadSubject] = useState("persian");
  const [loading, setLoading] = useState(false);
  const [generatedMissions, setGeneratedMissions] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [missions, setMissions] = useState([]);
  const [missionIdx, setMissionIdx] = useState(0);
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | {correct, exp}
  const [gameStats, setGameStats] = useState({ totalStars: 0, fastAnswers: 0, perfectStages: 0, completedLessons: 0 });
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [stageResults, setStageResults] = useState({ correct: 0, total: 0 });
  const [dragWords, setDragWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [fillVal, setFillVal] = useState("");
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [completedSubjects, setCompletedSubjects] = useState([]);
  const [showStageComplete, setShowStageComplete] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const fileRef = useRef();
  const timerRef = useRef();

  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // login | register

  // Fetch user profile on mount or token change
  useEffect(() => {
    if (token) {
      api.getProfile(token).then(data => {
        if (data.email) {
          setUser(data);
          // Sync local state with server state
          const serverStats = {
            totalStars: data.scores.reduce((acc, curr) => acc + (curr.stars || 0), 0),
            completedLessons: new Set(data.scores.map(s => s.subject)).size,
            // (Assuming more logic here for other stats)
            fastAnswers: data.fastAnswers || 0,
            perfectStages: data.perfectStages || 0,
          };
          setGameStats(prev => ({ ...prev, ...serverStats }));
          setEarnedBadges(data.badges || []);
          setCompletedSubjects([...new Set(data.scores.map(s => s.subject))]);
        } else {
          setToken(null);
          localStorage.removeItem('token');
        }
      });
    }
  }, [token]);

  // Badge check
  useEffect(() => {
    const newBadges = BADGES.filter(b => b.condition(gameStats) && !earnedBadges.includes(b.id));
    if (newBadges.length) {
      const addedBadges = newBadges.map(b => b.id);
      setEarnedBadges(prev => [...prev, ...addedBadges]);

      // Save new badges to backend
      if (token) {
        addedBadges.forEach(badge => {
          api.updateProgress(token, { badge });
        });
      }
    }
  }, [gameStats, token, earnedBadges]);

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

  const handleRegister = async (email, password) => {
    const res = await api.register(email, password);
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

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerActive && timeLeft === 0) {
      handleAnswer(null, true);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft]);

  function startMissions(subjectId, customMissions) {
    const ms = customMissions || buildMissions(subjectId);
    setActiveSubject(subjectId);
    setMissions(ms);
    setMissionIdx(0);
    setStage(1);
    setScore(0);
    setStars(0);
    setFeedback(null);
    setStageResults({ correct: 0, total: 0 });
    initMission(ms[0]);
    setScreen("game");
  }

  function initMission(m) {
    setFeedback(null);
    setFillVal("");
    setSelectedWords([]);
    if (m?.type === "order") setDragWords(shuffle(m.words));
    setTimeLeft(30);
    setTimerActive(true);
  }

  function handleAnswer(value, timeout = false) {
    clearTimeout(timerRef.current);
    setTimerActive(false);
    const m = missions[missionIdx];
    let correct = false;
    if (timeout) {
      correct = false;
    } else if (m.type === "mcq") {
      correct = value === m.answer;
    } else if (m.type === "fill") {
      correct = value.trim().toLowerCase() === m.blank.toLowerCase() ||
        value.trim() === m.blank;
    } else if (m.type === "order") {
      correct = selectedWords.join(" ") === m.answer;
    }

    const wasfast = timeLeft > 20;
    const starEarned = correct ? (wasfast ? 3 : 2) : 0;
    setStars(s => s + starEarned);
    setScore(s => s + (correct ? (wasfast ? 150 : 100) : 0));
    setStageResults(r => ({ correct: r.correct + (correct ? 1 : 0), total: r.total + 1 }));
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
          stars: stars + (feedback?.stars || 0)
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
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  if (screen === "home") return <HomeScreen
    onStart={(id) => startMissions(id)}
    onUpload={() => setScreen("upload")}
    completedSubjects={completedSubjects}
    gameStats={gameStats}
    earnedBadges={earnedBadges}
    onHall={() => setScreen("hall")}
    user={user}
    onLogout={logout}
  />;

  if (screen === "upload") return <UploadScreen
    uploadedText={uploadedText} setUploadedText={setUploadedText}
    uploadSubject={uploadSubject} setUploadSubject={setUploadSubject}
    onAnalyze={analyzeTextWithAI} loading={loading}
    onBack={() => setScreen("home")}
    photoFile={photoFile} setPhotoFile={setPhotoFile}
    fileRef={fileRef}
  />;

  if (screen === "hall") return <BadgeHall
    earnedBadges={earnedBadges}
    gameStats={gameStats}
    completedSubjects={completedSubjects}
    onBack={() => setScreen("home")}
  />;

  if (screen === "summary") return <SummaryScreen
    subject={subj} stars={stars} score={score}
    stageResults={stageResults} missions={missions}
    onHome={() => setScreen("home")}
    completedSubjects={completedSubjects}
    gameStats={gameStats}
    earnedBadges={earnedBadges}
  />;

  if (screen === "game" && mission) return (
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
  );

  return null;
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────
function HomeScreen({ onStart, onUpload, completedSubjects, gameStats, earnedBadges, onHall, user, onLogout }) {
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
      fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif", padding: "20px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '14px', marginBottom: '20px' }}>
        <span>{user?.email} خوش آمدید</span>
        <button onClick={onLogout} style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>خروج</button>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pop { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes fadeSlide { 0%{opacity:0;transform:translateY(20px)} 100%{opacity:1;transform:translateY(0)} }
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
        }}>یادگیری ماجراجویانه!</h1>
        <p style={{ color: "#aaa", fontSize: 15, direction: "rtl" }}>هر درس یک ماموریت جدید 🌟</p>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 24, background: "rgba(255,255,255,0.08)",
        borderRadius: 20, padding: "12px 20px", backdropFilter: "blur(10px)",
        animation: "fadeSlide 0.6s 0.1s both",
      }}>
        {[
          { label: "ستاره", val: gameStats.totalStars, icon: "⭐" },
          { label: "درس", val: gameStats.completedLessons, icon: "📚" },
          { label: "مدال", val: earnedBadges.length, icon: "🏅" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ color: "#FFD700", fontWeight: 700, fontSize: 18 }}>{s.val}</div>
            <div style={{ color: "#aaa", fontSize: 11, direction: "rtl" }}>{s.label}</div>
          </div>
        ))}
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
            <button key={s.id} className="subject-card" onClick={() => onStart(s.id)} style={{
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
              <div style={{ fontWeight: 800, fontSize: 16, direction: s.dir }}>{s.label}</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                {done ? "تکمیل شد!" : "شروع کن"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", animation: "fadeSlide 0.6s 0.4s both" }}>
        <button className="btn-glow" onClick={onUpload} style={{
          background: "linear-gradient(135deg,#9B59B6,#6C3483)", color: "#fff",
          border: "none", borderRadius: 16, padding: "12px 22px", fontSize: 14,
          cursor: "pointer", fontWeight: 700, transition: "all 0.2s",
          boxShadow: "0 6px 20px rgba(155,89,182,0.4)",
        }}>
          📸 آپلود کتاب درسی
        </button>
        <button className="btn-glow" onClick={onHall} style={{
          background: "linear-gradient(135deg,#F39C12,#D68910)", color: "#fff",
          border: "none", borderRadius: 16, padding: "12px 22px", fontSize: 14,
          cursor: "pointer", fontWeight: 700, transition: "all 0.2s",
          boxShadow: "0 6px 20px rgba(243,156,18,0.4)",
        }}>
          🏆 تالار افتخار
        </button>
      </div>

      {completedSubjects.length === 4 && (
        <div style={{
          marginTop: 24, background: "linear-gradient(135deg,#FFD700,#FF6B6B)",
          borderRadius: 20, padding: "16px 24px", textAlign: "center",
          animation: "pop 0.5s both",
        }}>
          <div style={{ fontSize: 32 }}>🏆🎉🏆</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", direction: "rtl" }}>
            قهرمان روز! همه ۴ درس رو تموم کردی!
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UPLOAD SCREEN ────────────────────────────────────────────────────────
function UploadScreen({ uploadedText, setUploadedText, uploadSubject, setUploadSubject, onAnalyze, loading, onBack, photoFile, setPhotoFile, fileRef }) {
  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);

    if (file.type.startsWith("image/")) {
      // Convert image to base64 and send to Claude API for OCR
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        const mediaType = file.type;
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1000,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                  { type: "text", text: "Please extract all text from this textbook page. Return only the text, preserving paragraphs. No extra commentary." }
                ]
              }]
            }),
          });
          const data = await res.json();
          const text = data.content?.map(i => i.text || "").join("") || "";
          setUploadedText(text);
        } catch {
          alert("خطا در خواندن تصویر");
        }
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e,#16213e)",
      padding: 20, fontFamily: "'Vazirmatn','Segoe UI',sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');`}</style>

      <button onClick={onBack} style={{
        alignSelf: "flex-start", background: "none", border: "none",
        color: "#aaa", fontSize: 22, cursor: "pointer", marginBottom: 10,
      }}>← برگشت</button>

      <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 8, direction: "rtl" }}>
        📸 آپلود صفحه کتاب
      </div>
      <p style={{ color: "#aaa", direction: "rtl", textAlign: "center", fontSize: 14, marginBottom: 20 }}>
        عکس صفحه کتاب را آپلود کن یا متن را مستقیم وارد کن
      </p>

      {/* Subject selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {SUBJECTS.map(s => (
          <button key={s.id} onClick={() => setUploadSubject(s.id)} style={{
            padding: "8px 16px", borderRadius: 12, border: "2px solid",
            borderColor: uploadSubject === s.id ? s.color.bg : "transparent",
            background: uploadSubject === s.id ? s.color.bg + "33" : "rgba(255,255,255,0.08)",
            color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
            direction: s.dir, transition: "all 0.2s",
          }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* File upload */}
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          width: "100%", maxWidth: 400, border: "2px dashed rgba(255,255,255,0.3)",
          borderRadius: 20, padding: "30px 20px", textAlign: "center",
          cursor: "pointer", marginBottom: 16, background: "rgba(255,255,255,0.05)",
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: 42 }}>{photoFile ? "✅" : "📷"}</div>
        <div style={{ color: "#ccc", direction: "rtl", marginTop: 8 }}>
          {photoFile ? photoFile.name : "برای آپلود عکس کلیک کن"}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </div>

      {/* Text area */}
      <textarea
        value={uploadedText}
        onChange={e => setUploadedText(e.target.value)}
        placeholder="یا متن را اینجا بنویس / پیست کن..."
        style={{
          width: "100%", maxWidth: 400, minHeight: 140,
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 16, padding: 16, color: "#fff", fontSize: 14,
          resize: "vertical", direction: "rtl", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />

      <button
        onClick={onAnalyze}
        disabled={loading || !uploadedText.trim()}
        style={{
          marginTop: 16, padding: "14px 36px",
          background: uploadedText.trim() ? "linear-gradient(135deg,#9B59B6,#3498DB)" : "#444",
          border: "none", borderRadius: 20, color: "#fff", fontSize: 16,
          fontWeight: 800, cursor: uploadedText.trim() ? "pointer" : "not-allowed",
          boxShadow: "0 8px 20px rgba(155,89,182,0.3)", direction: "rtl",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        {loading ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span> در حال پردازش...</> : "🚀 ساخت ماموریت‌ها"}
      </button>
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
  const progress = (missionIdx / totalMissions) * 100;
  const timerPct = (timeLeft / 30) * 100;
  const timerColor = timeLeft > 15 ? "#4ECDC4" : timeLeft > 8 ? "#FFD700" : "#FF6B6B";

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
        animation: "slideUp 0.4s both",
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
        <div style={{
          color: "#fff", fontWeight: 700, fontSize: 17,
          direction: subject?.dir || "rtl", lineHeight: 1.6, marginBottom: 20,
          textAlign: subject?.dir === "ltr" ? "left" : "right",
        }}>
          {mission.q}
        </div>

        {/* MCQ */}
        {mission.type === "mcq" && !feedback && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mission.options.map((opt, i) => (
              <button key={i} className="opt-btn" onClick={() => onAnswer(i)} style={{
                padding: "14px 18px",
                background: "rgba(255,255,255,0.08)",
                border: `2px solid rgba(255,255,255,0.15)`,
                borderRadius: 16, color: "#fff", fontSize: 15,
                cursor: "pointer", textAlign: subject?.dir === "ltr" ? "left" : "right",
                direction: subject?.dir, fontFamily: "inherit", fontWeight: 600,
                transition: "all 0.2s",
              }}>
                <span style={{ opacity: 0.5, marginLeft: 6, marginRight: 6 }}>
                  {["الف", "ب", "ج", "د"][i]}
                </span>
                {opt}
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
            }}>
              {selectedWords.length === 0 && <span style={{ color: "#555", fontSize: 13 }}>کلمات را اینجا بچین...</span>}
              {selectedWords.map((w, i) => (
                <button key={i} className="word-chip" onClick={() => removeSelected(w, i)} style={{
                  padding: "6px 14px", background: c.bg, border: "none",
                  borderRadius: 20, color: "#fff", fontSize: 14, cursor: "pointer",
                  fontFamily: "inherit", transition: "transform 0.15s",
                }}>{w}</button>
              ))}
            </div>
            {/* Available */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {dragWords.map((w, i) => (
                <button key={i} className="word-chip" onClick={() => toggleWord(w, i)} style={{
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
                {mission.options.map((opt, i) => {
                  const isCorrect = i === mission.answer;
                  return (
                    <div key={i} style={{
                      padding: "12px 16px", borderRadius: 14,
                      background: isCorrect ? "#27AE6033" : "rgba(255,255,255,0.04)",
                      border: `2px solid ${isCorrect ? "#27AE60" : "rgba(255,255,255,0.1)"}`,
                      color: isCorrect ? "#2ECC71" : "#888",
                      direction: subject?.dir, fontSize: 14,
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
              <div style={{ color: "#ccc", fontSize: 13, marginTop: 10, direction: "rtl", lineHeight: 1.7 }}>
                {feedback.exp}
              </div>
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
function BadgeHall({ earnedBadges, gameStats, completedSubjects, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e,#0f3460)",
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif", padding: "24px 20px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
        @keyframes pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
        @keyframes shimmer{0%{background-position:-200%}100%{background-position:200%}}
      `}</style>

      <button onClick={onBack} style={{
        alignSelf: "flex-start", background: "none", border: "none",
        color: "#aaa", fontSize: 20, cursor: "pointer", marginBottom: 10,
      }}>← برگشت</button>

      <h2 style={{
        fontWeight: 900, fontSize: 26, direction: "rtl",
        background: "linear-gradient(90deg,#FFD700,#FF6B6B,#4ECDC4)",
        backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        animation: "shimmer 3s linear infinite", margin: "0 0 24px",
      }}>🏅 تالار افتخار</h2>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
        width: "100%", maxWidth: 380, marginBottom: 28,
      }}>
        {[
          { icon: "⭐", val: gameStats.totalStars, label: "ستاره کل" },
          { icon: "📚", val: gameStats.completedLessons, label: "درس کامل" },
          { icon: "⚡", val: gameStats.fastAnswers, label: "پاسخ سریع" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.07)", borderRadius: 16,
            padding: "14px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ color: "#FFD700", fontWeight: 900, fontSize: 22 }}>{s.val}</div>
            <div style={{ color: "#aaa", fontSize: 11, direction: "rtl" }}>{s.label}</div>
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
  );
}

// --- AUTH SCREEN ---
function AuthScreen({ mode, setMode, onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        await onRegister(email, password);
        setSuccess('ثبت‌نام موفق! حالا می‌توانید وارد شوید.');
        setEmail('');
        setPassword('');
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
