import { useTranslation } from 'react-i18next';

export function LanguageSwitcher({ style = {} }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    const newLang = currentLang === 'fa' ? 'en' : 'fa';
    i18n.changeLanguage(newLang);
    const dir = newLang === 'fa' ? 'rtl' : 'ltr';
    document.dir = dir;
    document.documentElement.dir = dir;
    document.documentElement.lang = newLang;
    document.body.style.direction = dir;
    document.body.style.fontFamily = newLang === 'fa'
      ? "'Vazirmatn','Segoe UI',sans-serif"
      : "'Segoe UI', system-ui, -apple-system, sans-serif";
    localStorage.setItem('i18nLanguage', newLang);
  };

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      ...style
    }}>
      <button
        onClick={toggleLanguage}
        style={{
          padding: '12px 20px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(20px)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif",
          boxShadow: '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
          minWidth: '100px',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Animated background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: currentLang === 'fa' 
            ? 'linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(78,205,196,0.1), transparent)',
          animation: 'shimmer 2s infinite',
          pointerEvents: 'none'
        }} />
        
        {/* Flag with animation */}
        <span style={{
          fontSize: '18px',
          display: 'inline-block',
          animation: currentLang === 'fa' ? 'flagFlip 0.6s ease-out' : 'flagFlip 0.6s ease-out reverse',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, Emoji'
        }}>
          {currentLang === 'fa' ? '🇮🇷' : '🇺🇸'}
        </span>
        
        {/* Language code */}
        <span style={{
          fontWeight: '700',
          letterSpacing: '0.5px',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif"
        }}>
          {currentLang === 'fa' ? 'FA' : 'EN'}
        </span>
        
        {/* Current language indicator */}
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: currentLang === 'fa' ? '#FFD700' : '#4ECDC4',
          boxShadow: `0 0 10px ${currentLang === 'fa' ? '#FFD700' : '#4ECDC4'}`,
          animation: 'pulse 2s infinite'
        }} />
      </button>
      
      {/* Tooltip */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.9)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        opacity: 0,
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
        zIndex: 1000
      }}>
        {currentLang === 'fa' ? 'تغییر به انگلیسی' : 'Switch to فارسی'}
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes flagFlip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(0deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        button:hover + div {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
