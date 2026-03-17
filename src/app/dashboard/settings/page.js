'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/clientApp';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/clientApp';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Camera,
  Save,
  KeyRound,
  Check,
  Loader2,
  Building2,
} from 'lucide-react';

const ROLES = [
  { id: 'homeowner', label: 'Home Owner / Investor' },
  { id: 'buyer', label: 'Buyer' },
  { id: 'developer', label: 'Developer' },
  { id: 'agent', label: 'Agent' },
];

export default function SettingsPage() {
  const { user, userData, setUserData, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [firstName, setFirstName] = useState(userData?.firstName || '');
  const [lastName, setLastName] = useState(userData?.lastName || '');
  const [email, setEmail] = useState(userData?.email || user?.email || '');
  const [roles, setRoles] = useState(userData?.roles || []);
  const [avatarPreview, setAvatarPreview] = useState(userData?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(userData?.logoUrl || '');
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  // Sync state if userData loads after initial render
  useState(() => {
    if (userData) {
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setEmail(userData.email || user?.email || '');
      setRoles(userData.roles || []);
      setAvatarPreview(userData.avatar || '');
      setLogoPreview(userData.logoUrl || '');
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    router.push('/join');
    return null;
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoFile(file);
  };

  const toggleRole = (roleId) => {
    setRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      let avatarUrl = userData?.avatar || '';

      // Upload avatar if changed
      if (avatarFile) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', avatarFile);
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          avatarUrl = data.url;
        }
        setUploadingAvatar(false);
      }

      let logoUrl = userData?.logoUrl || '';

      // Upload logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('file', logoFile);
        const logoRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: logoFormData,
        });
        if (logoRes.ok) {
          const logoData = await logoRes.json();
          logoUrl = logoData.url;
        }
      }

      const updates = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        roles,
        avatar: avatarUrl,
        ...(logoUrl && { logoUrl }),
      };

      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserData((prev) => ({ ...prev, ...updates }));
      setAvatarFile(null);
      setLogoFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error('Error sending reset email:', err);
      alert('Failed to send reset email.');
    } finally {
      setResetSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-base font-bold text-slate-900">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Avatar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Change photo
              </button>
              <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Agency Logo (agents only) */}
        {userData?.isAgent && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Agency Logo</h2>
            <div className="flex items-center gap-5">
              <div className="relative group">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Agency logo"
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
              <div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Change logo
                </button>
                <p className="text-xs text-slate-500 mt-1">Displayed on property listings, TV displays, and your agent profile.</p>
              </div>
            </div>
          </div>
        )}

        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 bg-slate-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed from here.</p>
          </div>
        </div>

        {/* Roles */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Roles</h2>
          <p className="text-xs text-slate-500 mb-4">Select all that apply to you.</p>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((role) => {
              const isActive = roles.includes(role.id);
              return (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all ${
                    isActive
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {role.label}
                    {isActive && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Password</h2>
          <p className="text-xs text-slate-500 mb-4">Reset your password via email.</p>
          <button
            onClick={handlePasswordReset}
            disabled={resetSending || resetSent}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              resetSent
                ? 'bg-green-50 text-green-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            } disabled:opacity-70`}
          >
            {resetSent ? (
              <>
                <Check className="w-4 h-4" />
                Reset email sent!
              </>
            ) : resetSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Send Password Reset Email
              </>
            )}
          </button>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              saved
                ? 'bg-green-500 text-white shadow-green-500/30'
                : 'bg-gradient-to-r from-[#e48900] to-[#c64500] text-white shadow-orange-500/30 hover:shadow-orange-500/50'
            } disabled:opacity-70`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploadingAvatar ? 'Uploading photo...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
