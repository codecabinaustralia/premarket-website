'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sliders, AlertTriangle, Check, Wallet, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';

const BUYER_TYPE_OPTIONS = [
  { id: 'cashBuyer', label: 'Cash buyer' },
  { id: 'investor', label: 'Investor' },
  { id: 'firstHomeBuyer', label: 'First home buyer' },
  { id: 'upgrader', label: 'Upgrader' },
  { id: 'browsing', label: 'Just browsing' },
];
const PROPERTY_TYPE_OPTIONS = ['House', 'Apartment', 'Townhouse', 'Land'];
const TIMELINE_OPTIONS = [
  { id: 'ready_now', label: 'Ready now' },
  { id: '1_3m', label: '1–3 months' },
  { id: '3_6m', label: '3–6 months' },
  { id: '6_12m', label: '6–12 months' },
  { id: '12m_plus', label: '12+ months' },
];

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const PRE_APPROVAL_OPTIONS = [
  { id: 'none', label: 'Not started', tone: 'bg-slate-100 text-slate-600' },
  { id: 'in_progress', label: 'In progress', tone: 'bg-amber-100 text-amber-700' },
  { id: 'approved', label: 'Pre-approved', tone: 'bg-emerald-100 text-emerald-700' },
];

const chipBase =
  'px-4 py-2.5 rounded-full text-sm font-semibold border transition-all';
const chipSelected =
  'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/25';
const chipUnselected =
  'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';

function formatCurrency(n) {
  if (n == null) return '';
  return `$${Number(n).toLocaleString()}`;
}

export default function SettingsPage() {
  const { userData, setUserData } = useAuth();

  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Preferences fields
  const profile = userData?.buyerProfile || {};
  const [buyerTypes, setBuyerTypes] = useState([]);
  const [budgetMin, setBudgetMin] = useState(500_000);
  const [budgetMax, setBudgetMax] = useState(1_500_000);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [bedroomsMin, setBedroomsMin] = useState(0);
  const [timeline, setTimeline] = useState('3_6m');
  const [objectives, setObjectives] = useState('');

  // Finance fields
  const [preApprovalStatus, setPreApprovalStatus] = useState('none');
  const [preApprovalAmount, setPreApprovalAmount] = useState(0);
  const [depositAvailable, setDepositAvailable] = useState(0);
  const [annualIncome, setAnnualIncome] = useState(0);

  // Hydrate from userData when it arrives.
  useEffect(() => {
    if (!userData) return;
    setFirstName(userData.firstName || '');
    setLastName(userData.lastName || '');
    setPhone(userData.phone || '');
    setBuyerTypes(profile.buyerTypes || []);
    setBudgetMin(profile.budgetMin ?? 500_000);
    setBudgetMax(profile.budgetMax ?? 1_500_000);
    setPropertyTypes(profile.propertyTypes || []);
    setBedroomsMin(profile.bedroomsMin ?? 0);
    setTimeline(profile.timeline || '3_6m');
    setObjectives(profile.objectives || '');
    setPreApprovalStatus(profile.preApprovalStatus || 'none');
    setPreApprovalAmount(Number(profile.preApprovalAmount || 0));
    setDepositAvailable(Number(profile.depositAvailable || 0));
    setAnnualIncome(Number(profile.annualIncome || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const save = async (patch) => {
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      const res = await authFetch('/api/buyer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (userData) {
        setUserData?.({
          ...userData,
          ...(patch.firstName != null ? { firstName: patch.firstName } : {}),
          ...(patch.lastName != null ? { lastName: patch.lastName } : {}),
          ...(patch.phone != null ? { phone: patch.phone } : {}),
          buyerProfile: data.buyerProfile,
        });
      }
      setSavedMsg('Saved');
      setTimeout(() => setSavedMsg(''), 2400);
    } catch (err) {
      console.error(err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = () => save({ firstName, lastName, phone });
  const savePreferences = () =>
    save({
      buyerTypes,
      budgetMin,
      budgetMax,
      propertyTypes,
      bedroomsMin,
      timeline,
      objectives,
    });
  const saveFinance = () =>
    save({
      preApprovalStatus,
      preApprovalAmount: Number(preApprovalAmount) || 0,
      depositAvailable: Number(depositAvailable) || 0,
      annualIncome: Number(annualIncome) || 0,
    });

  const toggle = (list, id) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  // Affordability calculator — simple AU rule of thumb:
  //   max borrow ≈ 5x gross annual income (after typical living costs)
  //   max buy ≈ deposit + max borrow
  const affordability = useMemo(() => {
    const income = Number(annualIncome) || 0;
    const deposit = Number(depositAvailable) || 0;
    const maxBorrow = Math.round(income * 5);
    const maxPurchase = deposit + maxBorrow;
    // Stamp duty rough estimate (NSW-ish, primary residence): 4% of price over $1m
    const stampDuty = maxPurchase > 1_000_000 ? Math.round(maxPurchase * 0.04) : Math.round(maxPurchase * 0.025);
    const realisticPurchase = Math.max(0, maxPurchase - stampDuty);
    return { maxBorrow, maxPurchase, stampDuty, realisticPurchase };
  }, [annualIncome, depositAvailable]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-2">
          Settings
        </h1>
        <p className="text-lg text-slate-600">
          Profile and preferences.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 p-1.5 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                active
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-medium text-red-700"
          >
            {error}
          </motion.div>
        )}
        {savedMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700 inline-flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {savedMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {tab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 max-w-2xl space-y-5 shadow-sm"
          >
            <Field label="First name">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </Field>
            <Field label="Last name">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                placeholder="+61 412 345 678"
              />
            </Field>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </motion.div>
        )}

        {tab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 max-w-3xl space-y-8 shadow-sm"
          >
            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                Buyer type
              </label>
              <div className="flex flex-wrap gap-2">
                {BUYER_TYPE_OPTIONS.map((opt) => {
                  const selected = buyerTypes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBuyerTypes(toggle(buyerTypes, opt.id))}
                      className={`${chipBase} ${selected ? chipSelected : chipUnselected}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget breakout box (intentionally dark) */}
            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                Budget
              </label>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-6">
                <div className="flex items-baseline justify-between mb-5">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-mono">
                    Range
                  </span>
                  <span className="text-xl font-mono text-orange-400 font-semibold">
                    {formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-500 mb-1.5 block uppercase tracking-wider">
                      Min
                    </span>
                    <input
                      type="range"
                      min={100_000}
                      max={5_000_000}
                      step={50_000}
                      value={budgetMin}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setBudgetMin(v);
                        if (v > budgetMax) setBudgetMax(v);
                      }}
                      className="w-full accent-orange-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 mb-1.5 block uppercase tracking-wider">
                      Max
                    </span>
                    <input
                      type="range"
                      min={100_000}
                      max={5_000_000}
                      step={50_000}
                      value={budgetMax}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setBudgetMax(v);
                        if (v < budgetMin) setBudgetMin(v);
                      }}
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                Property type
              </label>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPE_OPTIONS.map((p) => {
                  const selected = propertyTypes.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPropertyTypes(toggle(propertyTypes, p))}
                      className={`${chipBase} ${selected ? chipSelected : chipUnselected}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                Minimum bedrooms
              </label>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setBedroomsMin(n)}
                    className={`${chipBase} ${bedroomsMin === n ? chipSelected : chipUnselected}`}
                  >
                    {n === 0 ? 'Any' : n === 5 ? '5+' : n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                Timeline
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeline(t.id)}
                    className={`${chipBase} ${timeline === t.id ? chipSelected : chipUnselected}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-900 mb-3">
                What&apos;s important to you?
              </label>
              <textarea
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Good schools, close to public transport, big backyard..."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
              />
            </div>

            <button
              type="button"
              onClick={savePreferences}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </motion.div>
        )}

        {tab === 'finance' && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 max-w-3xl"
          >
            {/* Pre-approval status */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 shadow-sm">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Pre-approval status</h3>
                  <p className="text-sm text-slate-600">
                    Pre-approved buyers stand out to agents and unlock the best opportunities.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {PRE_APPROVAL_OPTIONS.map((opt) => {
                  const selected = preApprovalStatus === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreApprovalStatus(opt.id)}
                      className={`${chipBase} ${selected ? chipSelected : chipUnselected}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {preApprovalStatus === 'approved' && (
                <Field label="Pre-approval amount">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      value={preApprovalAmount || ''}
                      onChange={(e) => setPreApprovalAmount(e.target.value)}
                      placeholder="850000"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    />
                  </div>
                </Field>
              )}
            </div>

            {/* Affordability calculator */}
            <div className="bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Wallet className="w-6 h-6" strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Affordability calculator</h3>
                  <p className="text-sm text-slate-600">
                    A rough guide to what you might be able to afford.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <Field label="Annual household income">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      value={annualIncome || ''}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="180000"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    />
                  </div>
                </Field>
                <Field label="Deposit available">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                      $
                    </span>
                    <input
                      type="number"
                      value={depositAvailable || ''}
                      onChange={(e) => setDepositAvailable(e.target.value)}
                      placeholder="200000"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                    />
                  </div>
                </Field>
              </div>

              {(annualIncome > 0 || depositAvailable > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Could borrow
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(affordability.maxBorrow)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">~5x income</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Max purchase
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(affordability.maxPurchase)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">deposit + loan</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Realistic target
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatCurrency(affordability.realisticPurchase)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">after stamp duty</div>
                  </div>
                </motion.div>
              )}

              <p className="text-xs text-slate-400 mt-5 leading-relaxed">
                These figures are rough estimates only. Your actual borrowing power depends on
                your credit score, expenses, existing debts, and lender criteria. Always speak
                to a mortgage broker for accurate numbers.
              </p>
            </div>

            <button
              type="button"
              onClick={saveFinance}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-2xl hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save finance details'}
            </button>
          </motion.div>
        )}

        {tab === 'danger' && (
          <motion.div
            key="danger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-red-200 rounded-3xl p-7 sm:p-9 max-w-2xl shadow-sm"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Delete account
                </h3>
                <p className="text-sm text-slate-600">
                  Need to delete your account? Email us and we&apos;ll process it within 48 hours.
                </p>
              </div>
            </div>
            <a
              href="mailto:support@premarket.homes?subject=Delete%20my%20buyer%20account"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl hover:bg-red-100 transition-colors"
            >
              Contact support
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
