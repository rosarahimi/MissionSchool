import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import * as api from "../../api";
import { useStore } from "../../store/useStore";
import { Rocket, Mail, Lock, AlertCircle, CheckCircle2, KeyRound, ArrowLeft, ShieldCheck, User as UserIcon, GraduationCap } from "lucide-react";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";

export function AuthScreen({ mode = 'login', setMode = () => {}, onLogin, onRegister }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  
  const [internalMode, setInternalMode] = useState(mode);
  const activeMode = mode || internalMode;
  const switchMode = (m) => {
    setInternalMode(m);
    setMode(m);
    setError('');
    setSuccess('');
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [grade, setGrade] = useState(3);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [authView, setAuthView] = useState('main'); 
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const resetEmail = params.get('resetEmail');
      const resetTokenParam = params.get('resetToken');

      if (resetEmail && resetTokenParam) {
        setMode('login');
        setEmail(String(resetEmail));
        setResetToken(String(resetTokenParam));
        setAuthView('reset');

        const nextUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, nextUrl);
      }
    } catch {
      // ignore
    }
  }, [setMode]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.emailLabel') + ' ' + (isRTL ? 'الزامی است.' : 'is required.'));
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email);
      if (res?.message) setSuccess(res.message);
      if (res?.token) {
        setResetToken(res.token);
      }
      setAuthView('reset');
    } catch (err) {
      setError(err?.message || (isRTL ? 'خطایی رخ داد. دوباره تلاش کنید.' : 'An error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !resetToken || !newPassword) {
      setError(isRTL ? 'ایمیل، توکن و رمز جدید الزامی هستند.' : 'Email, token, and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError(isRTL ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.' : 'Password must be at least 6 characters.');
      return;
    }
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const res = await api.resetPassword({ email, token: resetToken, newPassword });
      if (!res?.ok) {
        setError(res?.message || (isRTL ? 'خطایی رخ داد. دوباره تلاش کنید.' : 'An error occurred.'));
        return;
      }
      setSuccess(res?.message || (isRTL ? 'رمز عبور با موفقیت تغییر کرد.' : 'Password changed successfully.'));
      setPassword('');
      setNewPassword('');
      setResetToken('');
      setAuthView('main');
      switchMode('login');
    } catch (err) {
      setError(err?.message || (isRTL ? 'خطایی رخ داد. دوباره تلاش کنید.' : 'An error occurred.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      if (activeMode === 'login') {
        await onLogin(email, password);
      } else {
        const regData = { email, password, role, grade };
        if (role === 'parent') {
          regData.studentEmail = studentEmail;
          regData.studentPassword = studentPassword;
        }
        await onRegister(regData);
        setSuccess(t('auth.registerSuccess'));
        setEmail('');
        setPassword('');
        setStudentEmail('');
        setStudentPassword('');
      }
    } catch (err) {
      setError(err.message || (isRTL ? 'خطایی رخ داد. دوباره تلاش کنید.' : 'An error occurred.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`}>
      
      {/* Decorative Blur Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-secondary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Language Switcher at Top */}
      <div className="absolute top-6 end-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative z-10 duration-500">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-3xl flex items-center justify-center text-brand-primary mb-5 shadow-lg shadow-brand-primary/20">
            {authView === 'main' ? (
              <Rocket size={40} className="animate-pulse" />
            ) : authView === 'forgot' ? (
              <KeyRound size={40} className="text-yellow-400" />
            ) : (
              <ShieldCheck size={40} className="text-emerald-400" />
            )}
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            {authView === 'main'
              ? (activeMode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle'))
              : authView === 'forgot'
              ? t('auth.forgotPasswordLink')
              : t('auth.changePassword')}
          </h1>
          
          <p className="text-slate-400 font-medium text-sm">
            {authView === 'main'
              ? (activeMode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle'))
              : authView === 'forgot'
              ? (isRTL ? 'ایمیل حساب کاربری خود را برای دریافت لینک بازیابی وارد کنید.' : 'Enter your email to receive recovery instructions.')
              : (isRTL ? 'اطلاعات زیر را برای تعیین رمز جدید تکمیل نمایید.' : 'Fill in the fields below to set your new password.')}
          </p>
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-6 transition-all">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-6 transition-all">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {authView === 'main' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 ps-12 pe-4 outline-none focus:border-brand-primary transition-all text-sm font-bold placeholder:opacity-30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.passwordLabel')}</label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 ps-12 pe-4 outline-none focus:border-brand-primary transition-all text-sm font-bold placeholder:opacity-30"
                />
              </div>
              {activeMode === 'login' && (
                <div className="flex justify-end pt-1">
                  <button 
                    type="button" 
                    onClick={() => { setAuthView('forgot'); setError(''); setSuccess(''); }}
                    className="text-xs font-bold text-brand-primary/80 hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    {t('auth.forgotPasswordLink')}؟
                  </button>
                </div>
              )}
            </div>

            {activeMode === 'register' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.roleLabel')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['student', 'parent', 'teacher'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                          role === r 
                          ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-sm shadow-brand-primary/20' 
                          : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {t(`auth.roles.${r}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {role === 'student' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.gradeLabel')}</label>
                    <select 
                      value={grade} 
                      onChange={(e) => setGrade(Number(e.target.value))}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-brand-primary transition-all text-sm font-bold"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                        <option key={g} value={g} className="bg-slate-900 text-white">
                          {t('auth.gradeOption', { grade: g })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {role === 'parent' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-xs text-slate-400 font-bold">{t('auth.parentHint')}</p>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.studentEmailLabel')}</label>
                      <input 
                        type="email" 
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder={t('auth.studentEmailPlaceholder')}
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-brand-primary transition-all text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.studentPasswordLabel')}</label>
                      <input 
                        type="password" 
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-brand-primary transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-slate-950 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_10px_30px_rgba(78,205,196,0.3)] disabled:opacity-50 mt-4 active:scale-95 cursor-pointer"
            >
              {isLoading ? (activeMode === 'login' ? t('auth.loggingIn') : t('auth.registering')) : (activeMode === 'login' ? t('auth.loginCta') : t('auth.registerCta'))}
            </button>

            <div className="flex justify-center pt-4">
              <button 
                type="button"
                onClick={() => switchMode(activeMode === 'login' ? 'register' : 'login')}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {activeMode === 'login' ? (
                  <>
                    <span>{t('auth.noAccount')}</span>
                    <span className="text-brand-primary font-black ps-1">{t('auth.signUp')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.haveAccount')}</span>
                    <span className="text-brand-primary font-black ps-1">{t('auth.signIn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ─── VIEW: FORGOT PASSWORD ─── */}
        {authView === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 ps-12 pe-4 outline-none focus:border-brand-primary transition-all text-sm font-bold placeholder:opacity-30"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-slate-950 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_10px_30px_rgba(78,205,196,0.3)] disabled:opacity-50 mt-2 active:scale-95 cursor-pointer"
            >
              {isLoading ? (isRTL ? 'در حال ارسال...' : 'Sending...') : t('auth.sendResetCode')}
            </button>

            <div className="flex flex-col items-center gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => { setAuthView('reset'); setError(''); setSuccess(''); }}
                className="text-xs font-bold text-brand-primary/80 hover:text-brand-primary transition-colors cursor-pointer"
              >
                {isRTL ? 'کد بازیابی دارید؟ تغییر رمز عبور' : 'Have a recovery token? Reset password'}
              </button>

              <button 
                type="button"
                onClick={() => { setAuthView('main'); setError(''); setSuccess(''); }}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
                {t('auth.back')}
              </button>
            </div>
          </form>
        )}

        {/* ─── VIEW: RESET PASSWORD ─── */}
        {authView === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.emailLabel')}</label>
              <div className="relative">
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 ps-12 pe-4 outline-none focus:border-brand-primary transition-all text-sm font-bold placeholder:opacity-30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.resetTokenLabel')}</label>
              <div className="relative">
                <KeyRound className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder={t('auth.resetTokenPlaceholder')}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 ps-12 pe-4 outline-none focus:border-brand-primary transition-all text-sm font-bold placeholder:opacity-30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">{t('auth.newPasswordLabel')}</label>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 ps-12 pe-4 outline-none focus:border-brand-primary transition-all text-sm font-bold placeholder:opacity-30"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-slate-950 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_10px_30px_rgba(78,205,196,0.3)] disabled:opacity-50 mt-2 active:scale-95 cursor-pointer"
            >
              {isLoading ? (isRTL ? 'در حال تغییر...' : 'Updating...') : t('auth.changePassword')}
            </button>

            <div className="flex justify-center pt-4">
              <button 
                type="button"
                onClick={() => { setAuthView('main'); setError(''); setSuccess(''); }}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
                {t('auth.back')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
export default AuthScreen;
