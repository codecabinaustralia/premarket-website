'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase/clientApp';
import { authFetch } from '../utils/authFetch';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Camera, X, Loader2, User } from 'lucide-react';

export default function AgentModal({ show, onClose, onSave, agent = null, userId }) {
  const fileInputRef = useRef(null);
  const [name, setName] = useState(agent?.name || '');
  const [preview, setPreview] = useState(agent?.avatar || '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!show) return null;

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setFile(f);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let avatarUrl = agent?.avatar || null;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await authFetch('/api/upload-image', { method: 'POST', body: formData });
        if (res.ok) {
          const { url } = await res.json();
          avatarUrl = url;
        }
      }

      if (agent?.id) {
        // Edit existing
        await updateDoc(doc(db, 'agents', agent.id), {
          name: name.trim(),
          avatar: avatarUrl,
        });
        onSave({ id: agent.id, name: name.trim(), avatar: avatarUrl, userId });
      } else {
        // Create new
        const docRef = await addDoc(collection(db, 'agents'), {
          name: name.trim(),
          avatar: avatarUrl,
          userId,
          createdAt: serverTimestamp(),
        });
        onSave({ id: docRef.id, name: name.trim(), avatar: avatarUrl, userId });
      }
      onClose();
    } catch (err) {
      console.error('Agent save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              {agent ? 'Edit Agent' : 'Add Agent'}
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4 mb-5">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              {preview ? 'Change photo' : 'Add photo'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
              placeholder="e.g. John Smith"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#e48900] to-[#c64500] rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
