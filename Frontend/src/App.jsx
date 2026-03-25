import { useState, useEffect, useRef, useCallback } from "react";
import * as api from "./api";

// ── Inline styles (no Tailwind needed beyond defaults) ──────────────────────
const COLORS = {
  persian: { bg: "#FF6B6B", light: "#FFE5E5", dark: "#C0392B", text: "#fff" },
  arabic: { bg: "#4ECDC4", light: "#E0F7F5", dark: "#1A8E87", text: "#fff" },
  english: { bg: "#45B7D1", light: "#E0F4FA", dark: "#1A7A9A", text: "#fff" },
  science: { bg: "#96CEB4", light: "#E0F5EA", dark: "#3A7A5A", text: "#fff" },
  math: { bg: "#9B59B6", light: "#F4ECF7", dark: "#6C3483", text: "#fff" },
  computer: { bg: "#34495E", light: "#EAECEE", dark: "#2C3E50", text: "#fff" },
};

const SUBJECTS = [
  { id: "persian", label: "فارسی", emoji: "📖", color: COLORS.persian, dir: "rtl" },
  { id: "arabic", label: "عربی", emoji: "🌙", color: COLORS.arabic, dir: "rtl" },
  { id: "english", label: "English", emoji: "🌟", color: COLORS.english, dir: "ltr" },
  { id: "science", label: "علوم", emoji: "🔬", color: COLORS.science, dir: "rtl" },
  { id: "math", label: "ریاضی", emoji: "📐", color: COLORS.math, dir: "rtl" },
  { id: "computer", label: "کامپیوتر", emoji: "💻", color: COLORS.computer, dir: "rtl" },
];

const BADGES = [
  { id: "first_star", emoji: "⭐", label: "اولین ستاره", condition: (s) => s.totalStars >= 1 },
  { id: "ten_stars", emoji: "🌟", label: "۱۰ ستاره", condition: (s) => s.totalStars >= 10 },
  { id: "speed_demon", emoji: "⚡", label: "سریع‌الفهم", condition: (s) => s.fastAnswers >= 3 },
  { id: "perfect", emoji: "💎", label: "بی‌نقص", condition: (s) => s.perfectStages >= 1 },
  { id: "lesson_done", emoji: "🎓", label: "درس کامل", condition: (s) => s.completedLessons >= 1 },
  { id: "four_lessons", emoji: "🏆", label: "قهرمان روز", condition: (s) => s.completedLessons >= 6 },
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

// ─── Demo missions per subject ────────────────────────────────────────────
function buildMissions(subjectId) {
  const banks = {
    persian: [
      {
        type: "mcq", stage: 1,
        q: "کلمه‌ی هم‌معنی «سعی» کدام است؟",
        options: ["تلاش", "خواب", "دویدن", "غذا"],
        answer: 0, exp: "سعی در زبان فارسی به معنی تلاش و کوشش است.",
      },
      {
        type: "fill", stage: 1,
        q: "جمله را کامل کن: «بچه‌ها در حیاط مدرسه ___ بازی می‌کنند.»",
        blank: "فوتبال", hint: "یک ورزش با توپ", exp: "فوتبال یکی از ورزش‌های پرطرفدار در زنگ ورزش است.",
      },
      {
        type: "mcq", stage: 1,
        q: "در کلمه‌ی «خوشحال»، بخش «خوش» چه تاثیری دارد؟",
        options: ["کلمه را منفی می‌کند", "معنای زیبایی و خوبی می‌دهد", "کلمه را جمع می‌بندد", "هیچ تاثیری ندارد"],
        answer: 1, exp: "پیشوند «خوش» در ابتدای کلمه، معنای خوبی و مثبت به کلمه می‌دهد.",
      },
      {
        type: "order", stage: 2,
        q: "کلمات را مرتب کن:",
        words: ["می‌خوانیم", "ما", "کتاب", "داستان"],
        answer: "ما کتاب داستان می‌خوانیم",
        exp: "ترتیب اجزای جمله در فارسی: فاعل (ما) + مفعول (کتاب داستان) + فعل (می‌خوانیم).",
      },
      {
        type: "mcq", stage: 2,
        q: "متضاد (مخالف) کلمه‌ی «تاریک» چیست؟",
        options: ["روشن", "سیاه", "شب", "سرد"],
        answer: 0, exp: "روشن نقطه‌ی مقابل و مخالف کلمه‌ی تاریک است.",
      },
      {
        type: "fill", stage: 2,
        q: "پایتخت کشور عزیز ما ایران، شهر ___ است.",
        blank: "تهران", hint: "بزرگترین شهر ایران", exp: "تهران پایتخت و پرجمعیت‌ترین شهر ایران است.",
      },
      {
        type: "mcq", stage: 3,
        q: "کدام کلمه یک کلمه «مرکب» است؟ (از دو بخش معنی‌دار ساخته شده)",
        options: ["سیاه", "گلدان", "کتابخانه", "درخت"],
        answer: 2, exp: "کتابخانه از ترکیب دو کلمه معنی‌دار (کتاب + خانه) ساخته شده است.",
      },
      {
        type: "order", stage: 3,
        q: "کلمات را مرتب کن:",
        words: ["است", "زیبا", "ایران", "بسیار", "کشور"],
        answer: "کشور ایران بسیار زیبا است",
        exp: "در ساختن جمله‌های فارسی به طور معمول فعل در آخرِ جمله قرار می‌گیرد.",
      },
    ],
    arabic: [
      {
        type: "mcq", stage: 1,
        q: "كيف نقول «این یک کتاب است» بالعربية؟",
        options: ["هذا كتاب", "هذه مدرسة", "هذا قلم", "هو معلم"],
        answer: 0, exp: "لإلإشارة إلى المذكر نستخدم اسم الإشارة «هذا».",
      },
      {
        type: "fill", stage: 1,
        q: "أكمل: «أنا أذهب إلى ___» (من به مدرسه می‌روم)",
        blank: "المدرسة", hint: "مكان الدراسة", exp: "المدرسة تعني School وتستخدم لطلب العلم.",
      },
      {
        type: "mcq", stage: 1,
        q: "ما معنى كلمة «أسرة»؟",
        options: ["دوستان", "خانواده", "مدرسه", "بازار"],
        answer: 1, exp: "أسرة به معنی خانواده (Family) است.",
      },
      {
        type: "order", stage: 2,
        q: "رتب الكلمات (ترتیب بده):",
        words: ["الولد", "التفاحة", "يأكل"],
        answer: "يأكل الولد التفاحة",
        exp: "ترتيب الجملة الفعلية: فعل (يأكل) + فاعل (الولد) + مفعول به (التفاحة).",
      },
      {
        type: "mcq", stage: 2,
        q: "ما هو جمع كلمة «ولد»؟",
        options: ["ولدان", "أولاد", "مولود", "ولادة"],
        answer: 1, exp: "جمع التكسير لكلمة ولد هو أولاد (پسرها).",
      },
      {
        type: "fill", stage: 2,
        q: "ما لون السماء؟ لونها ___. (آبی)",
        blank: "أزرق", hint: "رنگ دریا", exp: "أزرق به معنی رنگ آبی است.",
      },
      {
        type: "mcq", stage: 3,
        q: "أي كلمة هي فعل؟ (کدام کلمه فعل است؟)",
        options: ["مدرسة", "ألعب", "جميل", "كبير"],
        answer: 1, exp: "«ألعب» (بازی می‌کنم) یک فعل است که انجام عملی را نشان می‌دهد.",
      },
      {
        type: "order", stage: 3,
        q: "رتب الكلمات:",
        words: ["في", "أعيش", "الإمارات", "دولة"],
        answer: "أعيش في دولة الإمارات",
        exp: "دولة الإمارات العربية المتحدة (کشور امارات متحده عربی).",
      },
    ],
    english: [
      {
        type: "mcq", stage: 1,
        q: "Which sentence is correct for yesterday?",
        options: ["I is happy.", "I was happy.", "I am happy.", "I be happy."],
        answer: 1, exp: "We use 'was' as the past tense of 'am' for he/she/it/I.",
      },
      {
        type: "fill", stage: 1,
        q: "An elephant is ___ than a mouse. (bigger)",
        blank: "bigger", hint: "large size with -er", exp: "When comparing two animals, we add '-er' to the adjective.",
      },
      {
        type: "mcq", stage: 1,
        q: "What does an 'Engineer' do?",
        options: ["Bakes bread", "Builds machines and houses", "Sells clothes", "Paints walls"],
        answer: 1, exp: "An engineer designs and builds things like bridges, buildings, and machines.",
      },
      {
        type: "order", stage: 2,
        q: "Make a question:",
        words: ["you", "Did", "to", "go", "school"],
        answer: "Did you go to school",
        exp: "Questions in the past simple start with the helper verb 'Did'.",
      },
      {
        type: "mcq", stage: 2,
        q: "Complete: 'It is raining outside, take your ___.'",
        options: ["sunglasses", "umbrella", "shorts", "kite"],
        answer: 1, exp: "We use an umbrella to protect ourselves from rain and stay dry.",
      },
      {
        type: "fill", stage: 2,
        q: "We buy fresh food and vegetables at the ___.",
        blank: "supermarket", hint: "a large store", exp: "A supermarket is a big shop where we buy our daily groceries.",
      },
      {
        type: "mcq", stage: 3,
        q: "Which word goes with 'always'? (Present Simple)",
        options: ["He always walking.", "He always walked.", "He always walks.", "He always walk."],
        answer: 2, exp: "For routines with 'he/she/it', we add an '-s' to the main verb.",
      },
      {
        type: "order", stage: 3,
        q: "Order the words:",
        words: ["usually", "I", "at 7 o'clock", "wake up"],
        answer: "I usually wake up at 7 o'clock",
        exp: "Adverbs of frequency (usually) come before the main verb.",
      },
    ],
    science: [
      {
        type: "mcq", stage: 1,
        q: "کدام قسمتِ گیاه آب را از خاک می‌گیرد؟",
        options: ["برگ", "ساقه", "ریشه", "گل"],
        answer: 2, exp: "ریشه در خاک قرار دارد و آب و مواد مغذی را برای رشد گیاه جذب می‌کند.",
      },
      {
        type: "fill", stage: 1,
        q: "یخ یک ماده در حالت ___ است.",
        blank: "جامد", hint: "سخت و محکم", exp: "یخ حالت جامد آب است که شکل مشخصی دارد.",
      },
      {
        type: "mcq", stage: 1,
        q: "یک آهنربا کدام ماده را به خود جذب می‌کند؟",
        options: ["پلاستیک", "چوب", "آهن", "شیشه"],
        answer: 2, exp: "آهنرباها فقط فلزات خاصی مانند آهن و فولاد را به خود جذب می‌کنند.",
      },
      {
        type: "mcq", stage: 2,
        q: "چرخش زمین به دور محور خودش باعث چه چیزی می‌شود؟",
        options: ["پیدایش فصل‌ها", "شب و روز", "ماه‌گرفتگی", "زلزله"],
        answer: 1, exp: "چرخش زمین به دور محور خودش که ۲۴ ساعت طول می‌کشد، باعث ایجاد شب و روز می‌شود.",
      },
      {
        type: "fill", stage: 2,
        q: "نیرویی که باعث پایین افتادن اجسام می‌شود، نیروی ___ نام دارد.",
        blank: "جاذبه", hint: "نیروی گرانش زمین", exp: "جاذبه یا گرانش، نیرویی است که اجسام را به سمت مرکز زمین می‌کشد.",
      },
      {
        type: "mcq", stage: 2,
        q: "کدام یک از حیوانات زیر در زیستگاه «بیابان» زندگی راحت‌تری دارد؟",
        options: ["خرس قطبی", "شتر", "دلفین", "میمون"],
        answer: 1, exp: "شتر با داشتن کوهان و مژه‌های بلند می‌تواند گرما و کم‌آبی بیابان‌های امارات را تحمل کند.",
      },
      {
        type: "order", stage: 3,
        q: "مراحل رشد گیاه را مرتب کن:",
        words: ["دانه", "جوانه", "گیاه کوچک", "گل"],
        answer: "دانه جوانه گیاه کوچک گل",
        exp: "دانه در خاک رشد کرده، جوانه می‌زند، به گیاه کوچکی تبدیل شده و درنهایت گل می‌دهد.",
      },
      {
        type: "fill", stage: 3,
        q: "وقتی آب را خیلی داغ کنیم و بجوشانیم، تبدیل به ___ می‌شود.",
        blank: "بخار", hint: "حالت گازی آب (گاز)", exp: "دما و حرارت زیاد، آب مایع را به حالت گازی (بخار) تبدیل می‌کند.",
      },
    ],
    math: [
      {
        type: "mcq", stage: 1,
        q: "حاصل ضرب ۷ × ۶ چند می‌شود؟",
        options: ["۴۲", "۴۸", "۳۶", "۴۰"],
        answer: 0, exp: "شش بسته هفت‌تایی، با جدول ضرب می‌فهمیم شش هفت‌تا برابر ۴۲ است.",
      },
      {
        type: "fill", stage: 1,
        q: "یک ساعت برابر با ___ دقیقه است.",
        blank: "۶۰", hint: "شصت", exp: "هر عقربه دقیقه شمار برای کامل کردن یک ساعت، ۶۰ دقیقه حرکت می‌کند.",
      },
      {
        type: "mcq", stage: 1,
        q: "برای اندازه‌گیری طول دکمه‌ی لباس، از کدام پیمانه/واحد استفاده می‌کنیم؟",
        options: ["کیلوگرم", "لیتر", "میلی‌متر", "متر"],
        answer: 2, exp: "میلی‌متر واحد بسیار کوچکی است که برای اندازه‌گیری اشیاء بسیار ریز استفاده می‌شود.",
      },
      {
        type: "mcq", stage: 2,
        q: "در کسر ۳/۴ (سه چهارم)، عدد ۳ چه نام دارد؟",
        options: ["مخرج", "صورت", "خط کسری", "واحد"],
        answer: 1, exp: "عدد بالایی در کسر «صورت» و نشان دهنده قسمت‌های رنگ‌شده است.",
      },
      {
        type: "fill", stage: 2,
        q: "شکلی که ۴ ضلع مساوی و ۴ زاویه راست دارد، ___ است.",
        blank: "مربع", hint: "چهارگوش منظم", exp: "مربع یک شکل هندسی دو بعدی است که تمام اضلاعش با هم সমানند.",
      },
      {
        type: "mcq", stage: 2,
        q: "اگر ۳۰ آبنبات را بین ۶ کودک منصفانه تقسیم کنیم، به هر نفر چند آبنبات می‌رسد؟",
        options: ["۴", "۵", "۶", "۳"],
        answer: 1, exp: "برای تقسیم عادلانه ۳۰ بر ۶، متوجه می‌شویم ۵ × ۶ برابر ۳۰ می‌شود.",
      },
      {
        type: "mcq", stage: 3,
        q: "محیط یک مثلث با سه ضلع که اندازه‌هایشان ۳، ۴ و ۵ سانتی‌متر است چقدر است؟",
        options: ["۱۲", "۱۵", "۶۰", "۲۰"],
        answer: 0, exp: "محیط مجموع طول لبه‌های بیرونی شکل است. جمع ۳، ۴ و ۵ برابر با ۱۲ است.",
      },
      {
        type: "fill", stage: 3,
        q: "دو کیلوگرم برابر با ___ گرم است.",
        blank: "۲۰۰۰", hint: "دوهزار", exp: "یک کیلوگرم ۱۰۰۰ گرم است، پس دو کیلوگرم برابر با ۲۰۰۰ گرم خواهد بود.",
      },
    ],
    computer: [
      {
        type: "mcq", stage: 1,
        q: "برای ورود به اینترنت و سایت‌ها از چه برنامه‌ای استفاده می‌کنیم؟",
        options: ["نرم‌افزار Word", "ماشین‌حساب", "مرورگر وب", "نرم‌افزار Paint"],
        answer: 2, exp: "برنامه‌هایی مانند کروم یا سَفاری، مرورگر وب (Web Browser) نام دارند.",
      },
      {
        type: "fill", stage: 1,
        q: "هنگام ساختن رمز عبور، قانون اصلی این است که آن را ___ نگه داریم.",
        blank: "مخفی", hint: "محرمانه/پنهان", exp: "در شهروندی دیجیتال، حفظ امنیت اطلاعات و پسورد شما اهمیت زیادی دارد.",
      },
      {
        type: "mcq", stage: 1,
        q: "در برنامه‌نویسی با بلوک‌ها، برای تکرار یک دستور از چه بلوکی استفاده می‌شود؟",
        options: ["If", "Loop", "Start", "Print"],
        answer: 1, exp: "حلقه یا Loop (Repeat) کمک می‌کند یک تکه کد به تعداد مشخصی تکرار شود.",
      },
      {
        type: "mcq", stage: 2,
        q: "ذخیره کردن فایل یا بازی از اینترنت روی کامپیوتر شخصی چه نام دارد؟",
        options: ["آپلود", "دانلود", "کپی‌رایت", "حذف"],
        answer: 1, exp: "دریافت اطلاعات و فایل از سرورهای اینترنتی به کامپیوتر ما دانلود (Download) است.",
      },
      {
        type: "fill", stage: 2,
        q: "برای نوشتن با حروف بزرگ در کیبورد کامپیوتر، کلید ___ را روشن می‌کنیم.",
        blank: "Caps Lock", hint: "کپس لاک", exp: "کلید Caps Lock به شما کمک می‌کند تمام حروف انگلیسی را به حالت Capital تایپ کنید.",
      },
      {
        type: "mcq", stage: 2,
        q: "اگر فرد ناشناسی در بازی آنلاین از ما عکس خواست، چه‌کار کنیم؟",
        options: ["بفرستیم", "هرگز قبول نکنیم و به والدین اطلاع دهیم", "اول عکس او را بخواهیم", "عکس فیک بفرستیم"],
        answer: 1, exp: "امنیت سایبری به ما یاد می‌دهد که با غریبه‌ها اطلاعات مبادله نکنیم.",
      },
      {
        type: "mcq", stage: 3,
        q: "قطعات فیزیکی و ملموس کامپیوتر (مثل ماوس، کیبورد و مانیتور) چه خوانده می‌شوند؟",
        options: ["نرم‌افزار", "مرورگر", "سخت‌افزار", "اپلیکیشن"],
        answer: 2, exp: "هر چیزی در کامپیوتر که می‌توان آن را لمس کرد، سخت‌افزار (Hardware) نام دارد.",
      },
      {
        type: "order", stage: 3,
        q: "برای جستجو در گوگل مراحل را مرتب کن:",
        words: ["به گوگل برو", "کلمه مورد نظر", "را تایپ کن", "سپس اینتر بزن"],
        answer: "به گوگل برو کلمه مورد نظر را تایپ کن سپس اینتر بزن",
        exp: "نحوه اصولی کار با موتورهای جستجو.",
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
  const [hallTab, setHallTab] = useState('badges');
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

  function startMissions(subjectId, customMissions, lessonId = null) {
    const ms = customMissions || buildMissions(subjectId);
    setActiveSubject(subjectId);
    setActiveLessonId(lessonId);
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
        if (activeLessonId) {
          api.updateLessonProgress(token, activeLessonId, 'completed').then(res => {
            if (res.progress) {
              setUser(u => {
                if (!u) return u;
                const newProg = [...(u.lessonProgress || [])];
                const i = newProg.findIndex(p => p.lessonId === activeLessonId);
                if (i > -1) newProg[i] = res.progress; else newProg.push(res.progress);
                return { ...u, lessonProgress: newProg };
              });
            }
          }).catch(err => console.error(err));
        }
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

  if (screen === "home" || screen === "chapters" || screen === "hall") return (
    <>
      <HomeScreen
        onStart={(id) => {
          if (id === 'persian') {
            setActiveSubject(id);
            setScreen("chapters");
          } else {
            startMissions(id);
          }
        }}
        onUpload={() => setScreen("upload")}
        completedSubjects={completedSubjects}
        gameStats={gameStats}
        earnedBadges={earnedBadges}
        onHall={(targetTab) => {
          setHallTab(targetTab || 'badges');
          setScreen("hall");
        }}
        user={user}
        onLogout={logout}
      />
      {screen === "chapters" && (
        <ChaptersScreen
          subject={subj}
          token={token}
          userProgress={user?.lessonProgress || []}
          onBack={() => setScreen("home")}
          onStudy={(lessonId) => {
            api.getLessonDetails(token, lessonId).then(data => {
              setCurrentLessonItem(data);
              setScreen("study");
              api.updateLessonProgress(token, lessonId, 'read').then(res => {
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
            api.getLessonDetails(token, lessonId).then(data => {
              startMissions(activeSubject, data.missions, lessonId);
            });
          }}
        />
      )}
      {screen === "hall" && (
        <BadgeHall
          initialTab={hallTab}
          user={user}
          setUser={setUser}
          token={token}
          earnedBadges={earnedBadges}
          gameStats={gameStats}
          completedSubjects={completedSubjects}
          onBack={() => setScreen("home")}
          onLogout={logout}
        />
      )}
    </>
  );

  if (screen === "upload") return <UploadScreen
    uploadedText={uploadedText} setUploadedText={setUploadedText}
    uploadSubject={uploadSubject} setUploadSubject={setUploadSubject}
    onAnalyze={analyzeTextWithAI} loading={loading}
    onBack={() => setScreen("home")}
    photoFile={photoFile} setPhotoFile={setPhotoFile}
    fileRef={fileRef}
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



  if (screen === "study") return <StudyScreen
    subject={subj}
    lesson={currentLessonItem}
    onBack={() => setScreen("chapters")}
    onPlay={() => startMissions(activeSubject, currentLessonItem?.missions, currentLessonItem?._id)}
  />;

  return null;
}

// ─── HOME SCREEN ──────────────────────────────────────────────────────────
function HomeScreen({ onStart, onUpload, completedSubjects, gameStats, earnedBadges, onHall, user, onLogout }) {
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
      fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif", padding: "20px", paddingBottom: "180px",
      display: "flex", flexDirection: "column", alignItems: "center", position: "relative"
    }}>
      <LiveClock />
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
                {user?.name || user?.email?.split('@')[0] || 'Student'}
              </span>
              <span style={{ fontSize: '10px', color: '#FFD700', fontWeight: 'bold', background: 'rgba(255,215,0,0.15)', padding: '1px 6px', borderRadius: '8px', whiteSpace: 'nowrap', width: 'fit-content' }}>
                GRADE 3
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
          transition: 'all 0.2s', marginLeft: '8px'
        }} title="خروج">
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
        }}>یادگیری ماجراجویانه!</h1>
        <p style={{ color: "#aaa", fontSize: 15, direction: "rtl" }}>هر درس یک ماموریت جدید 🌟</p>
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
      </div>

      {completedSubjects.length === 6 && (
        <div style={{
          marginTop: 24, background: "linear-gradient(135deg,#FFD700,#FF6B6B)",
          borderRadius: 20, padding: "16px 24px", textAlign: "center",
          animation: "pop 0.5s both",
        }}>
          <div style={{ fontSize: 32 }}>🏆🎉🏆</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", direction: "rtl" }}>
            قهرمان روز! همه ۶ درس رو تموم کردی!
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UPLOAD SCREEN ────────────────────────────────────────────────────────
function UploadScreen({ uploadedText, setUploadedText, uploadSubject, setUploadSubject, onAnalyze, loading, onBack, photoFile, setPhotoFile, fileRef }) {
  const [tab, setTab] = useState('mission'); // 'mission' | 'pdf'
  const [pdfFile, setPdfFile] = useState(null);
  const pdfRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (tab === 'pdf') {
      if (file.type !== "application/pdf") {
        alert("لطفا فایل PDF انتخاب کنید.");
        return;
      }
      setPdfFile(file);
      return;
    }

    // mission tab (image)
    if (!file.type.startsWith("image/")) {
      alert("لطفا فقط عکس انتخاب کنید.");
      return;
    }
    setPhotoFile(file);
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
        alert("خطا در پردازش تصویر");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handlePdfUploadSubmit() {
    if (!pdfFile) return;
    const formData = new FormData();
    formData.append("subject", uploadSubject);
    formData.append("pdf", pdfFile);

    try {
      const token = localStorage.getItem('token');
      // Using global loading state is not easy without modifying App, so let's fire it locally? Let's just await without global loading lock or we can add a local loading.
      // But we can just use the api.
      const res = await api.uploadPdf(token, formData);
      if (res.success) {
        alert(res.message);
        onBack();
      } else alert("خطا: " + res.error);
    } catch (e) {
      alert("خطا در آپلود PDF");
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

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, padding: 4, background: 'rgba(0,0,0,0.3)', borderRadius: 16 }}>
        <button onClick={() => setTab('pdf')} style={{
          padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
          background: tab === 'pdf' ? '#FFD700' : 'transparent', color: tab === 'pdf' ? '#000' : '#aaa', transition: '0.2s'
        }}>آپلود کل کتاب (PDF)</button>
        <button onClick={() => setTab('mission')} style={{
          padding: '12px 24px', borderRadius: 12, border: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
          background: tab === 'mission' ? '#4ECDC4' : 'transparent', color: tab === 'mission' ? '#000' : '#aaa', transition: '0.2s'
        }}>استخراج ماموریت از یک صفحه</button>
      </div>

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

      {tab === 'mission' ? (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: "100%", maxWidth: 400, border: "2px dashed #4ECDC4",
              borderRadius: 20, padding: "30px 20px", textAlign: "center",
              cursor: "pointer", marginBottom: 16, background: "rgba(78,205,196,0.05)",
            }}
          >
            <div style={{ fontSize: 42 }}>{photoFile ? "✅" : "📷"}</div>
            <div style={{ color: "#fff", direction: "rtl", marginTop: 8 }}>
              {photoFile ? photoFile.name : "برای انتخاب عکسِِ کتاب کلیک کن"}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          </div>

          <textarea
            value={uploadedText}
            onChange={e => setUploadedText(e.target.value)}
            placeholder="یا متن صفحه را مستقیماً اینجا وارد کن..."
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
              background: uploadedText.trim() ? "linear-gradient(135deg,#4ECDC4,#1A8E87)" : "#444",
              border: "none", borderRadius: 20, color: "#fff", fontSize: 16,
              fontWeight: 800, cursor: uploadedText.trim() ? "pointer" : "not-allowed",
              direction: "rtl", display: "flex", alignItems: "center", gap: 10,
            }}
          >
            {loading ? "⚙️ در حال پردازش..." : "🚀 ساخت ماموریت"}
          </button>
        </>
      ) : (
        <>
          <div
            onClick={() => pdfRef.current?.click()}
            style={{
              width: "100%", maxWidth: 400, border: "2px dashed #FFD700",
              borderRadius: 20, padding: "30px 20px", textAlign: "center",
              cursor: "pointer", marginBottom: 16, background: "rgba(255,215,0,0.05)",
            }}
          >
            <div style={{ fontSize: 42 }}>{pdfFile ? "📄" : "📁"}</div>
            <div style={{ color: "#fff", direction: "rtl", marginTop: 8 }}>
              {pdfFile ? pdfFile.name : "برای انتخاب فایل PDF کتاب درسی کلیک کن"}
            </div>
            <input ref={pdfRef} type="file" accept="application/pdf" onChange={handleFile} style={{ display: "none" }} />
          </div>

          <button
            onClick={handlePdfUploadSubmit}
            disabled={!pdfFile}
            style={{
              marginTop: 16, padding: "14px 36px",
              background: pdfFile ? "linear-gradient(135deg,#FFD700,#FF8C00)" : "#444",
              border: "none", borderRadius: 20, color: "#000", fontSize: 16,
              fontWeight: 800, cursor: pdfFile ? "pointer" : "not-allowed",
              direction: "rtl", display: "flex", alignItems: "center", gap: 10,
            }}
          >
            بارگذاری کتاب در سیستم
          </button>
        </>
      )}
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
            {mission.q}
          </div>
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '8px', marginTop: 10, direction: 'rtl' }}>
                <button onClick={() => playAudio(feedback.exp)} title="پخش توضیح" style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                  width: 32, height: 32, color: '#4ECDC4', cursor: 'pointer', fontSize: 16, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>🔊</button>
                <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.7, textAlign: 'right' }}>
                  {feedback.exp}
                </div>
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
function BadgeHall({ initialTab, user, setUser, token, earnedBadges, gameStats, completedSubjects, onBack, onLogout }) {
  const [tab, setTab] = useState(initialTab || 'badges'); // 'badges' | 'profile'
  const [editName, setEditName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", color: "#fff", width: 40, height: 40, fontSize: 18, cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 24, padding: 4 }}>
            <button onClick={() => setTab('badges')} style={{
              background: tab === 'badges' ? 'rgba(255,215,0,0.15)' : 'transparent',
              color: tab === 'badges' ? '#FFD700' : '#888',
              border: tab === 'badges' ? '1px solid #FFD70066' : '1px solid transparent',
              borderRadius: 20, padding: '8px 16px', fontWeight: tab === 'badges' ? 800 : 600,
              cursor: 'pointer', transition: 'all 0.2s', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6
            }}>🏆 دستاوردها</button>
            <button onClick={() => setTab('profile')} style={{
              background: tab === 'profile' ? 'rgba(78,205,196,0.15)' : 'transparent',
              color: tab === 'profile' ? '#4ECDC4' : '#888',
              border: tab === 'profile' ? '1px solid #4ECDC466' : '1px solid transparent',
              borderRadius: 20, padding: '8px 16px', fontWeight: tab === 'profile' ? 800 : 600,
              cursor: 'pointer', transition: 'all 0.2s', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6
            }}>👤 پروفایل من</button>
          </div>
        </div>

        {tab === 'badges' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeSlide 0.4s both' }}>

      <h2 style={{
        fontWeight: 900, fontSize: 26, direction: "rtl",
        background: "linear-gradient(90deg,#FFD700,#FF6B6B,#4ECDC4)",
        backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        animation: "shimmer 3s linear infinite", margin: "0 0 24px",
      }}>🏅 تالار افتخار</h2>

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
                <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 8, marginRight: 5 }}>نام و نام خانوادگی:</label>
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
                <span style={{ color: '#aaa', fontSize: 14 }}>ایمیل:</span>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', direction: 'ltr' }}>{user?.email || 'نامشخص'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>پایه تحصیلی:</span>
                <span style={{ color: '#4ECDC4', fontSize: 14, fontWeight: 'bold', background: 'rgba(78,205,196,0.1)', padding: '4px 10px', borderRadius: 8 }}>گرید ۳ (سوم دبستان)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>وضعیت ماموریت‌ها:</span>
                <span style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold' }}>{completedSubjects.length} درس کامل شده</span>
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
function ChaptersScreen({ subject, token, onBack, onStudy, onPlay, userProgress }) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const c = subject?.color || COLORS.persian;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    Promise.all([
      api.getLessons(token, subject.id),
      api.pdfStatus(token, subject.id)
    ]).then(([lessonsData, pdfData]) => {
      setChapters(lessonsData);
      if (pdfData.exists) {
        setPdfUrl((import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '') + pdfData.url);
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    return () => { document.body.style.overflow = 'unset'; };
  }, [subject, token]);

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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
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
        <div className="custom-scrollbar" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          
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
      fontFamily: "'Vazirmatn','Segoe UI',sans-serif", padding: "24px 20px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <style>{`
        @keyframes slideUp { 0%{transform:translateY(30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
      `}</style>

      <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#ccc", fontSize: 18, cursor: "pointer" }}>← بازگشت</button>
        <div style={{ color: "#FFD700", fontWeight: "bold", fontSize: 16 }}>{subject?.label} 📖</div>
      </div>

      <div style={{
        width: "100%", maxWidth: 480, background: "rgba(255,255,255,0.05)", boxSizing: 'border-box',
        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)", animation: "slideUp 0.5s ease-out",
        position: 'relative'
      }}>
        <button onClick={() => playAudio(content)} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 44, height: 44, color: '#4ECDC4', cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16
        }} title="پخش صوتی">🔊</button>

        <h3 style={{ color: '#fff', fontSize: 22, marginTop: 0, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 10 }}>{lesson?.title || 'آموزش'}</h3>
        <div style={{
          color: '#e0e0e0', fontSize: 18, lineHeight: 2, textAlign: 'justify',
          whiteSpace: 'pre-line', textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          {content}
        </div>
      </div>

      <button onClick={onPlay} style={{
        marginTop: 24, width: "100%", maxWidth: 480, padding: "18px", boxSizing: 'border-box',
        background: `linear-gradient(135deg, ${c.bg}, ${c.dark})`,
        border: "none", borderRadius: 20, color: "#fff",
        fontSize: 18, fontWeight: 900, cursor: "pointer",
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
