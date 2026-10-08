import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserExperience } from '../context/UserExperienceContext';
import { TrustedContact } from '../types';
import { api } from '../services/api';
import { Phone, Plus, Trash2, X, ShieldAlert, HeartHandshake } from 'lucide-react';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const { mode } = useUserExperience();
  const isSenior = mode === 'senior';

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const res = await api.getContacts();
      setContacts(res.contacts || []);
    } catch (err) {
      console.error("Failed to load contacts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !relationship) return;

    try {
      const res = await api.addContact({
        name,
        relationship,
        phone,
        is_emergency: true
      });
      setContacts([...contacts, res.contact]);
      setName('');
      setRelationship('');
      setPhone('');
      setShowAddForm(false);
    } catch (err) {
      alert("Failed to add contact");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete contact");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 ${
        isSenior ? 'border-emerald-600 p-8' : 'border-slate-200 p-6'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <HeartHandshake className={isSenior ? 'w-10 h-10 text-emerald-600' : 'w-6 h-6 text-blue-600'} />
            <h3 className={`${isSenior ? 'text-2xl font-black' : 'text-lg font-bold'} text-slate-900`}>
              {t('common.emergency_contacts')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* National Cyber Crime Helpline Card (1930) */}
        <div className="my-5 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-950 text-base">National Cyber Crime Helpline</span>
            </div>
            <p className="text-xs text-amber-800 mt-1">Official Indian Govt 24x7 Helpline for Financial Frauds</p>
          </div>
          <a
            href="tel:1930"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-md text-base"
          >
            <Phone className="w-5 h-5" />
            <span>1930</span>
          </a>
        </div>

        {/* User's Trusted Contacts List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {contacts.length === 0 && !loading && (
            <p className="text-sm text-slate-500 text-center py-4">No personal contacts added yet.</p>
          )}

          {contacts.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between p-4 rounded-2xl border ${
                isSenior ? 'border-2 border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                <h4 className={`${isSenior ? 'text-xl font-bold' : 'text-base font-semibold'} text-slate-900`}>
                  {c.name}
                </h4>
                <p className={`${isSenior ? 'text-base font-medium' : 'text-xs'} text-slate-600`}>
                  {c.relationship} • {c.phone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${c.phone}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-all ${
                    isSenior ? 'text-lg px-6 py-3' : 'text-sm'
                  }`}
                >
                  <Phone className={isSenior ? 'w-6 h-6' : 'w-4 h-4'} />
                  <span>Call</span>
                </a>

                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Contact Form Toggle */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className={`w-full mt-4 flex items-center justify-center gap-2 rounded-2xl font-bold border-2 border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 ${
              isSenior ? 'py-4 text-lg' : 'py-2.5 text-sm'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Add Trusted Family Member</span>
          </button>
        ) : (
          <form onSubmit={handleAdd} className="mt-4 p-4 border rounded-2xl bg-slate-50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Name (e.g. Suresh Kumar)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
              <input
                type="text"
                placeholder="Relationship (e.g. Son)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border rounded-xl"
              />
            </div>
            <input
              type="tel"
              placeholder="Phone Number (e.g. 9876543210)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border rounded-xl"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
