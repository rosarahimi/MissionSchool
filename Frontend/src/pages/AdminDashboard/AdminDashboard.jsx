import { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import * as api from "../../api";
import { useStore } from "../../store/useStore";
import { Search, RotateCw, ChevronRight, User as UserIcon, Shield, CreditCard, Clock, Activity } from "lucide-react";

export function AdminDashboard({ onBack }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const { token, user } = useStore();
  
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState(null);
  const [reports, setReports] = useState([]);
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState('');

  const canView = user?.role === 'admin';

  const fmtDateTime = useCallback((d) => {
    if (!d) return '-';
    try {
      return new Intl.DateTimeFormat(isRTL ? 'fa-IR' : 'en-US', {
        year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
      }).format(new Date(d));
    } catch {
      return String(d);
    }
  }, [isRTL]);

  const loadUsers = useCallback(async () => {
    if (!token || !canView) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.adminListUsers(token, {
        q: q.trim() || undefined,
        role: role || undefined,
        grade: grade === '' ? undefined : grade,
        status: status || undefined,
        limit: 80,
        skip: 0,
      });
      if (!res?.ok) {
        setError(res?.message || t('admin.errorFetchUsers'));
        return;
      }
      setUsers(Array.isArray(res.users) ? res.users : []);
      setTotal(Number(res.total) || 0);
    } finally {
      setBusy(false);
    }
  }, [token, canView, q, role, grade, status]);

  const loadUserDetails = useCallback(async (id) => {
    if (!token || !canView || !id) return;
    setBusy(true);
    setError('');
    setTempPassword('');
    try {
      const res = await api.adminGetUser(token, id);
      if (!res?.ok) {
        setError(res?.message || t('admin.errorFetchDetails'));
        return;
      }
      setDetails(res.user || null);
      setReports(Array.isArray(res.reports) ? res.reports : []);
    } finally {
      setBusy(false);
    }
  }, [token, canView]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedId) {
      setDetails(null);
      setReports([]);
      setTempPassword('');
      return;
    }
    loadUserDetails(selectedId);
  }, [selectedId, loadUserDetails]);

  const resetPassword = useCallback(async () => {
    if (!selectedId || !token) return;
    if (!confirm(t('admin.resetPassPrompt'))) return;
    setBusy(true);
    setError('');
    setTempPassword('');
    try {
      const res = await api.adminResetPassword(token, selectedId);
      if (!res?.ok) {
        setError(res?.message || t('admin.errorResetPass'));
        return;
      }
      setTempPassword(String(res.tempPassword || ''));
    } finally {
      setBusy(false);
    }
  }, [selectedId, token]);

  if (!canView) {
    return (
      <div className={`min-h-screen p-6 bg-slate-950 text-white ${isRTL ? 'rtl' : 'ltr'}`}>
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors mb-4 flex items-center gap-2">
          <ChevronRight className={isRTL ? '' : 'rotate-180'} size={20} />
          {t('nav.back')}
        </button>
        <div className="text-xl font-black opacity-90 mt-4">{t('admin.unauthorized')}</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 bg-slate-950 text-white ${isRTL ? 'rtl' : 'ltr'} font-vazir`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-8">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
          <ChevronRight className={isRTL ? '' : 'rotate-180'} size={20} />
          {t('nav.back')}
        </button>
        <h1 className="text-2xl font-black opacity-95">{t('admin.dashboardTitle')}</h1>
        <button 
          onClick={loadUsers} 
          disabled={busy}
          className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCw size={18} className={busy ? 'animate-spin' : ''} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
        
        {/* Users List Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder={t('admin.searchPlaceholder')} 
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 ps-10 pe-4 outline-none focus:border-brand-primary transition-colors text-sm"
              />
            </div>

            <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-brand-primary transition-colors text-sm">
              <option value="">{t('admin.allRoles')}</option>
              <option value="student">{t('auth.roles.student')}</option>
              <option value="parent">{t('auth.roles.parent')}</option>
              <option value="teacher">{t('auth.roles.teacher')}</option>
              <option value="admin">Admin</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-brand-primary transition-colors text-sm">
              <option value="">{t('admin.allStatuses')}</option>
              <option value="active">{t('admin.statusActive')}</option>
              <option value="inactive">{t('admin.statusInactive')}</option>
            </select>

            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-brand-primary transition-colors text-sm">
              <option value="">{t('admin.allGrades')}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                <option key={g} value={String(g)}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="text-slate-400 font-bold text-sm">{t('admin.totalUsers')} <span className="text-white">{total}</span></div>
            <button 
              onClick={loadUsers} 
              disabled={busy}
              className="bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 text-brand-primary px-6 py-2.5 rounded-xl font-black transition-all disabled:opacity-50"
            >
              {t('admin.applyFilter')}
            </button>
          </div>

          {error && <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-bold">{error}</div>}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-[1.5fr_1fr_0.7fr_0.5fr_1fr_0.8fr_0.5fr] gap-4 p-4 bg-white/5 font-black text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/5">
                <div>{t('admin.colEmail')}</div>
                <div>{t('admin.colName')}</div>
                <div>{t('admin.colRole')}</div>
                <div>{t('admin.colGrade')}</div>
                <div>{t('admin.colLastLogin')}</div>
                <div>{t('admin.colReports')}</div>
                <div>{t('admin.colStatus')}</div>
              </div>

              <div className="divide-y divide-white/5">
                {users.map((u) => {
                  const isSel = String(selectedId) === String(u?._id);
                  return (
                    <button 
                      key={u._id} 
                      onClick={() => setSelectedId(String(u._id))} 
                      className={`w-full grid grid-cols-[1.5fr_1fr_0.7fr_0.5fr_1fr_0.8fr_0.5fr] gap-4 p-4 items-center text-sm transition-colors hover:bg-white/5 ${isSel ? 'bg-brand-primary/10' : ''}`}
                    >
                      <div className="font-bold truncate text-start">{u.email}</div>
                      <div className="text-slate-400 truncate text-start">{u.name || '-'}</div>
                      <div className="font-bold opacity-90">{u.role}</div>
                      <div className="text-slate-400">{u.grade || '-'}</div>
                      <div className="text-slate-500 text-xs">{fmtDateTime(u.lastLoginAt)}</div>
                      <div className="font-black text-brand-primary">{u.reportsCount || 0}</div>
                      <div className={`font-black text-[10px] px-2 py-1 rounded-md text-center ${u.isActive === false ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {u.isActive === false ? 'OFF' : 'ON'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* User Details Sidebar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-md sticky top-6">
          {!details ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-center gap-4">
              <UserIcon size={48} className="opacity-20" />
              <p className="font-bold">{t('admin.selectUserPrompt')}</p>
            </div>
          ) : (
            <div className="duration-300">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div className="font-black text-lg break-all">{details.email}</div>
                <button 
                  onClick={resetPassword} 
                  disabled={busy}
                  className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap"
                >
                  {t('admin.resetPassButton')}
                </button>
              </div>

              {tempPassword && (
                <div className="mb-6 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 animate-pulse">
                  <div className="text-xs font-black text-brand-primary uppercase mb-2">{t('admin.newPassIssued')}</div>
                  <div className="text-2xl font-black font-mono tracking-widest">{tempPassword}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <InfoCard icon={<Shield size={14}/>} label="Role" value={details.role} />
                <InfoCard icon={<ChevronRight size={14}/>} label="Grade" value={details.grade || '-'} />
                <InfoCard icon={<Activity size={14}/>} label="Status" value={details.isActive === false ? 'Inactive' : 'Active'} color={details.isActive === false ? 'text-red-400' : 'text-green-400'} />
                <InfoCard icon={<Clock size={14}/>} label="Joined" value={fmtDateTime(details.createdAt)} />
              </div>

              {(details.linkedStudent || details.linkedParent) && (
                <div className="mb-6 p-4 rounded-2xl bg-black/20 border border-white/5">
                  <h3 className="font-black text-xs uppercase text-slate-500 mb-3 flex items-center gap-2">
                    <UserIcon size={12} /> {t('admin.userRelations')}
                  </h3>
                  {details.linkedParent && (
                    <div className="text-sm font-bold mb-2">{t('admin.parent')} <span className="text-slate-400">{details.linkedParent.email}</span></div>
                  )}
                  {details.linkedStudent && (
                    <div className="text-sm font-bold">{t('admin.child')} <span className="text-slate-400">{details.linkedStudent.email}</span></div>
                  )}
                </div>
              )}

              <div>
                <h3 className="font-black text-xs uppercase text-slate-500 mb-3 flex items-center gap-2">
                  <Activity size={12} /> {t('admin.recentMissions')}
                </h3>
                <div className="max-h-80 overflow-y-auto rounded-xl border border-white/5 divide-y divide-white/5 bg-black/10">
                  {reports.map((r) => (
                    <div key={r._id} className="p-3 flex justify-between items-center text-[13px]">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-brand-primary">{r.subject}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{fmtDateTime(r.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-black text-white">{r.score}</div>
                        <div className="flex items-center gap-1 text-yellow-500 font-black">
                          {r.stars || 0} ⭐
                        </div>
                      </div>
                    </div>
                  ))}
                  {!reports.length && <div className="p-8 text-center text-slate-500 text-xs font-bold">{t('admin.noReports')}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, color = "text-white" }) {
  return (
    <div className="p-3 bg-black/20 border border-white/5 rounded-xl">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-sm font-black truncate ${color}`}>{value}</div>
    </div>
  );
}
