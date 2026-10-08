import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { api } from '../services/api';
import { Users, X, ShieldCheck, UserPlus, CheckCircle, Ban } from 'lucide-react';

interface CaretakerConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaretakerConsentModal: React.FC<CaretakerConsentModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { mode } = useUserExperience();
  const isSenior = mode === 'senior';

  const [caretakers, setCaretakers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [alertScope, setAlertScope] = useState('BLOCK_ONLY');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCaretakers();
    }
  }, [isOpen]);

  const loadCaretakers = async () => {
    setLoading(true);
    try {
      const res = await api.getMyCaretakers();
      setCaretakers(res.caretakers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setMsg(null);

    try {
      const res = await api.requestRelationship({
        identifier,
        alert_scope: alertScope,
        notes: "Family Caretaker Connection"
      });
      setMsg({ text: res.message, type: 'success' });
      setIdentifier('');
      loadCaretakers();
    } catch (err: any) {
      setMsg({ text: err.message || "Failed to link caretaker", type: 'error' });
    }
  };

  const handleRevoke = async (relationshipId: string) => {
    if (!confirm("Are you sure you want to revoke this caretaker's security access?")) return;
    try {
      await api.revokeRelationship(relationshipId);
      loadCaretakers();
    } catch (err) {
      alert("Failed to revoke");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 ${
        isSenior ? 'border-blue-600 p-8' : 'border-slate-200 p-6'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Users className={isSenior ? 'w-10 h-10 text-blue-600' : 'w-6 h-6 text-blue-600'} />
            <h3 className={`${isSenior ? 'text-2xl font-black' : 'text-lg font-bold'} text-slate-900`}>
              {t('senior.btn_ask_caretaker')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Existing Connected Caretakers */}
        <div className="my-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Active Caretaker Relationships
          </h4>

          {caretakers.length === 0 && !loading && (
            <p className="text-sm text-slate-500 italic py-2">No caretaker connected yet.</p>
          )}

          <div className="space-y-2">
            {caretakers.map((c) => (
              <div
                key={c.relationship_id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.caretaker_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.caretaker_email || c.caretaker_phone}</p>
                </div>

                {c.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleRevoke(c.relationship_id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Revoke</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connect New Caretaker Form */}
        <form onSubmit={handleRequest} className="mt-5 p-4 border rounded-2xl bg-blue-50/50 border-blue-200 space-y-3">
          <h5 className="text-sm font-bold text-blue-950 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Connect a Caretaker (Family Member)</span>
          </h5>

          {msg && (
            <div className={`p-2.5 rounded-xl text-xs font-medium ${
              msg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
            }`}>
              {msg.text}
            </div>
          )}

          <input
            type="text"
            placeholder="Caretaker's Email or Phone (e.g. caretaker@cybersaarthi.org)"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border rounded-xl bg-white"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              When should your caretaker be alerted?
            </label>
            <select
              value={alertScope}
              onChange={(e) => setAlertScope(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl bg-white font-medium"
            >
              <option value="BLOCK_ONLY">Only when high-risk scam is detected (Recommended)</option>
              <option value="BLOCK_AND_WARN">For both high-risk and suspicious links</option>
              <option value="ALL_ACTIVITY">For all scans</option>
            </select>
          </div>

          <button
            type="submit"
            className={`w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all ${
              isSenior ? 'py-3.5 text-base' : 'py-2.5 text-sm'
            }`}
          >
            Authorize Caretaker
          </button>
        </form>
      </div>
    </div>
  );
};
