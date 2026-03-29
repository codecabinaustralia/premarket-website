'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/clientApp';
import {
  Tv,
  Monitor,
  Building2,
  Globe,
  Plus,
  Pencil,
  Trash2,
  Check,
  Maximize,
  Loader2,
} from 'lucide-react';
import StatCard from '../StatCard';
import AdminModal from '../AdminModal';
import Toggle from '../Toggle';
import { useToast } from '../ToastProvider';
import useConfirm from '../../hooks/useConfirm';
import { authFetch } from '../../../../utils/authFetch';

export default function DisplaysTab({ user }) {
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [displays, setDisplays] = useState([]);
  const [agents, setAgents] = useState([]);
  const [displaysLoading, setDisplaysLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState('agency');
  const [formAgentIds, setFormAgentIds] = useState([]);
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [displaysSnap, usersRes] = await Promise.all([
          getDocs(collection(db, 'displays')),
          authFetch(`/api/admin/users`),
        ]);
        setDisplays(displaysSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        const usersData = await usersRes.json();
        setAgents(usersData.users || []);
      } catch (err) {
        console.error('Displays fetch error:', err);
      } finally {
        setDisplaysLoading(false);
      }
    }
    fetchData();
  }, [user.uid]);

  const resetForm = () => {
    setFormName('');
    setFormLocation('');
    setFormType('agency');
    setFormAgentIds([]);
    setFormActive(true);
    setEditingDisplay(null);
    setShowForm(false);
  };

  const openEditForm = (display) => {
    setFormName(display.name || '');
    setFormLocation(display.location || '');
    setFormType(display.type || 'agency');
    setFormAgentIds(display.agentIds || []);
    setFormActive(display.active !== false);
    setEditingDisplay(display);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: formName.trim(),
        location: formLocation.trim(),
        type: formType,
        agentIds: formAgentIds,
        active: formActive,
        updatedAt: serverTimestamp(),
      };

      if (editingDisplay) {
        await updateDoc(doc(db, 'displays', editingDisplay.id), data);
        setDisplays((prev) =>
          prev.map((d) => (d.id === editingDisplay.id ? { ...d, ...data } : d))
        );
        toast.success('Display updated');
      } else {
        data.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'displays'), data);
        setDisplays((prev) => [...prev, { id: docRef.id, ...data }]);
        toast.success('Display created');
      }
      resetForm();
    } catch (err) {
      console.error('Error saving display:', err);
      toast.error('Failed to save display');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (display) => {
    const ok = await confirm({
      title: 'Delete Display',
      message: `Are you sure you want to delete "${display.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'displays', display.id));
      setDisplays((prev) => prev.filter((d) => d.id !== display.id));
      toast.success('Display deleted');
    } catch (err) {
      console.error('Error deleting display:', err);
      toast.error('Failed to delete display');
    }
  };

  const toggleAgent = (agentId) => {
    setFormAgentIds((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  if (displaysLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  const activeCount = displays.filter((d) => d.active !== false).length;
  const agencyCount = displays.filter((d) => d.type === 'agency').length;
  const mallCount = displays.filter((d) => d.type === 'mall').length;

  return (
    <div className="space-y-6">
      {ConfirmDialog}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Displays" value={displays.length} icon={Tv} color="blue" />
        <StatCard label="Active" value={activeCount} icon={Monitor} color="emerald" />
        <StatCard label="Agency" value={agencyCount} icon={Building2} color="orange" />
        <StatCard label="Mall" value={mallCount} icon={Globe} color="purple" />
      </div>

      {/* Add button */}
      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Display
      </button>

      {/* Form modal */}
      <AdminModal
        isOpen={showForm}
        onClose={resetForm}
        title={editingDisplay ? 'Edit Display' : 'New Display'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-[#e48900] to-[#c64500] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingDisplay ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Westfield Sydney Level 2"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location</label>
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. Shopping Center, Sydney"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Type toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
            <div className="flex gap-2">
              {['agency', 'mall'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formType === t
                      ? t === 'agency'
                        ? 'bg-orange-500 text-white'
                        : 'bg-purple-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'agency' ? 'Agency' : 'Mall'}
                </button>
              ))}
            </div>
          </div>

          {/* Agent multi-select */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Agents ({formAgentIds.length} selected)
            </label>
            <p className="text-xs text-slate-400 mb-2">Leave empty to show all properties</p>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => toggleAgent(agent.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors text-sm ${
                    formAgentIds.includes(agent.id) ? 'bg-orange-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {(agent.firstName?.[0] || '?').toUpperCase()}
                  </div>
                  <span className="flex-1 truncate text-slate-800">
                    {[agent.firstName, agent.lastName].filter(Boolean).join(' ') || agent.email}
                  </span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    formAgentIds.includes(agent.id) ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
                  }`}>
                    {formAgentIds.includes(agent.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
              {agents.length === 0 && (
                <p className="text-sm text-slate-400 px-4 py-3">No agents found</p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <Toggle
            checked={formActive}
            onChange={setFormActive}
            label="Active"
            description="Display will show properties when active"
          />
        </div>
      </AdminModal>

      {/* Display list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600">Displays ({displays.length})</h2>
        </div>

        {displays.length === 0 ? (
          <div className="text-center py-16">
            <Tv className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No displays yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displays.map((display) => (
              <div key={display.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">{display.name}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      display.type === 'agency'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {display.type === 'agency' ? 'AGENCY' : 'MALL'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      display.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {display.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {display.location || 'No location'} — {display.agentIds?.length ? `${display.agentIds.length} agent${display.agentIds.length > 1 ? 's' : ''}` : 'All Properties'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => window.open(`/tv/${display.id}`, '_blank')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Live view — fullscreen for TV/iPad"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                    Live
                  </button>
                  <button
                    onClick={() => window.open(`/tv/${display.id}?preview=true`, '_blank')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Preview — mock device frame"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => openEditForm(display)}
                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(display)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
