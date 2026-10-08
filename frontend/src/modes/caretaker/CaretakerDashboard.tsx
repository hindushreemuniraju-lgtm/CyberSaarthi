import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WardPerson, AlertItem } from '../../types';
import {
  Users,
  ShieldAlert,
  Bell,
  UserPlus,
  CheckCircle,
  Clock,
  Phone,
  Settings,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

export const CaretakerDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [people, setPeople] = useState<WardPerson[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'people' | 'alerts'>('people');
  
  // Add person form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [addScope, setAddScope] = useState('BLOCK_ONLY');
  const [addStatusMsg, setAddStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Selected ward scan history modal
  const [selectedWard, setSelectedWard] = useState<WardPerson | null>(null);
  const [wardScans, setWardScans] = useState<any[]>([]);
  const [loadingWardScans, setLoadingWardScans] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [peopleRes, alertsRes] = await Promise.all([
        api.getSupportedPeople(),
        api.getAlerts()
      ]);
      setPeople(peopleRes.people || []);
      setAlerts(alertsRes.alerts || []);
    } catch (err) {
      console.error("Failed to load caretaker data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addIdentifier) return;
    setAddStatusMsg(null);

    try {
      const res = await api.requestRelationship({
        identifier: addIdentifier,
        alert_scope: addScope,
        notes: "Caretaker protection request"
      });
      setAddStatusMsg({ text: res.message });
      setAddIdentifier('');
      loadDashboardData();
    } catch (err: any) {
      setAddStatusMsg({ text: err.message || "Failed to add person", error: true });
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.resolveAlert(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
    } catch (err) {
      alert("Failed to resolve alert");
    }
  };

  const handleViewWardScans = async (ward: WardPerson) => {
    setSelectedWard(ward);
    setLoadingWardScans(true);
    try {
      const res = await api.getWardScans(ward.ward_id);
      setWardScans(res.scans || []);
    } catch (err) {
      alert("Could not load ward activity (verify consent permissions)");
    } finally {
      setLoadingWardScans(false);
    }
  };

  const unreadAlerts = alerts.filter(a => a.status === 'UNREAD');

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Caretaker Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold mb-3 border border-blue-700">
              <Users className="w-3.5 h-3.5" />
              <span>{t('caretaker.title')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Family & Ward Protection Hub
            </h1>
            <p className="text-blue-200 text-sm mt-1 max-w-xl">
              {t('caretaker.subtitle')}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('caretaker.add_person')}</span>
          </button>
        </div>

        {/* Dashboard Tabs & Overview Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('people')}
            className={`p-6 rounded-2xl border text-left transition-all shadow-sm ${
              activeTab === 'people'
                ? 'bg-white border-blue-600 ring-2 ring-blue-100'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('caretaker.people_helped')}
              </span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {people.length} Active Wards
            </div>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`p-6 rounded-2xl border text-left transition-all shadow-sm ${
              activeTab === 'alerts'
                ? 'bg-white border-rose-600 ring-2 ring-rose-100'
                : 'bg-white/70 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t('caretaker.active_alerts')}
              </span>
              <Bell className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-3xl font-black text-rose-600 mt-2">
              {unreadAlerts.length} Unresolved Alerts
            </div>
          </button>
        </div>

        {/* TAB 1: PEOPLE I HELP */}
        {activeTab === 'people' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              <span>{t('caretaker.people_helped')}</span>
            </h2>

            {people.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-8 border text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold">No members linked yet.</p>
                <p className="text-xs text-slate-400 mt-1">Click "Connect New Person" above to send an invitation.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {people.map((p) => (
                <div
                  key={p.relationship_id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-lg">{p.ward_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.ward_mode === 'senior' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.ward_mode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{p.ward_email || p.ward_phone}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                      p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Alert Scope:</span>
                      <span className="font-semibold text-slate-900">{p.alert_scope}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Recent Activity:</span>
                      <span className="font-semibold text-slate-900">
                        {p.last_activity ? new Date(p.last_activity).toLocaleDateString() : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewWardScans(p)}
                      className="flex-1 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all"
                    >
                      View Permitted Scans
                    </button>
                    {p.ward_phone && (
                      <a
                        href={`tel:${p.ward_phone}`}
                        className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE ALERTS FEED */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-600" />
              <span>{t('caretaker.active_alerts')}</span>
            </h2>

            {alerts.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-8 border text-center text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold">{t('caretaker.no_alerts')}</p>
              </div>
            )}

            <div className="space-y-3">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`bg-white rounded-2xl p-5 border-l-4 shadow-sm transition-all ${
                    alt.status === 'RESOLVED'
                      ? 'border-l-slate-300 opacity-60'
                      : alt.severity === 'CRITICAL'
                      ? 'border-l-rose-600 bg-rose-50/20'
                      : 'border-l-amber-500 bg-amber-50/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mr-2 ${
                        alt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alt.severity}
                      </span>
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {alt.title}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(alt.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
                    {alt.summary}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Protected Member: <strong className="text-slate-800">{alt.ward_name}</strong>
                    </span>

                    {alt.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleResolveAlert(alt.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>{t('caretaker.mark_resolved')}</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: CONNECT NEW PERSON */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {t('caretaker.add_person')}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Connect an elder or child CyberSaarthi account to monitor security threats.
              </p>

              {addStatusMsg && (
                <div className={`p-3 rounded-xl text-xs mb-3 font-semibold ${
                  addStatusMsg.error ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {addStatusMsg.text}
                </div>
              )}

              <form onSubmit={handleAddPerson} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ward Email or Phone (e.g. lakshmi@cybersaarthi.org)"
                  value={addIdentifier}
                  onChange={(e) => setAddIdentifier(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('caretaker.alert_scope_label')}
                  </label>
                  <select
                    value={addScope}
                    onChange={(e) => setAddScope(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  >
                    <option value="BLOCK_ONLY">{t('caretaker.alert_block_only')}</option>
                    <option value="BLOCK_AND_WARN">{t('caretaker.alert_block_warn')}</option>
                    <option value="ALL_ACTIVITY">{t('caretaker.alert_all')}</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setAddStatusMsg(null);
                    }}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: VIEW PERMITTED WARD SCANS */}
        {selectedWard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Permitted Activity: {selectedWard.ward_name}
                </h3>
                <button
                  onClick={() => setSelectedWard(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {wardScans.length === 0 && !loadingWardScans && (
                  <p className="text-xs text-slate-400 text-center py-6">No permitted scans in this scope.</p>
                )}

                {wardScans.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        s.risk_level === 'BLOCK' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.risk_level} • Score {s.risk_score}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(s.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{s.input_preview}</p>
                    <p className="text-slate-600">{s.primary_reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
