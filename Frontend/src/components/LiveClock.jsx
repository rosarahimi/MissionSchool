import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';

export function LiveClock() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shamsiDate = isRTL
    ? new Intl.DateTimeFormat('fa-IR', {
      calendar: 'persian',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(time)
    : null;

  const miladiDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(time);

  const weekday = new Intl.DateTimeFormat(isRTL ? 'fa-IR' : 'en-US', { weekday: 'long' }).format(time);
  const timeStr = time.toLocaleTimeString(isRTL ? 'fa-IR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div className={`absolute top-6 z-10 pointer-events-none end-6 text-end transition-opacity duration-300`} style={{ color: 'rgba(255,255,255,0.7)' }}>
      <div className="text-3xl font-black text-white mb-1.5 tracking-wider">
        {timeStr}
      </div>
      <div className={`flex flex-col gap-0.5 border-e-2 border-[#4ECDC4]/30 pe-2.5`}>        {isRTL && (
          <div className="text-sm font-semibold text-white/90">{shamsiDate}</div>
        )}
        <div className="text-[11px] opacity-60 font-medium">{miladiDate}</div>
        <div className="text-sm font-bold text-[#4ECDC4] mt-0.5">
          {weekday}
        </div>
      </div>
    </div>
  );
}
