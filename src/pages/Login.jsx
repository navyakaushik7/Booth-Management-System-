import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Phone, KeyRound, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  'Track ward-by-ward voter turnout and booth status in real time.',
  'Digitize your voter register with one-click Excel import & export.',
  'Secure OTP login over SMS — no passwords for staff to lose or share.'
];

export default function Login() {
  const { requestOtp, verifyOtp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef(null);

  useEffect(() => {
    if (step === 'otp') codeInputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await requestOtp(phone);
      setDevOtp(data.dev_otp || null); // only set when Twilio isn't configured
      setStep('otp');
      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setBusy(true);
    try {
      const data = await requestOtp(phone);
      setDevOtp(data.dev_otp || null);
      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resend OTP.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyOtp(phone, code);
      // AuthContext sets `user`; App's Gate component takes it from here
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-ink-light rounded-3xl shadow-panel overflow-hidden grid md:grid-cols-2">

        {/* Left brand panel */}
        <div className="relative hidden md:flex flex-col justify-between bg-ink text-paper p-10 overflow-hidden">
          <div className="absolute inset-0 bg-ledger opacity-40 pointer-events-none" />
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-brass/20 blur-2xl" />
          <div className="absolute -left-10 bottom-10 w-40 h-40 rounded-full bg-seal-green/20 blur-2xl" />

          <div className="relative">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-brass/20 border border-brass/40 mb-6">
              <MapPin className="w-5 h-5 text-brass-light" />
            </div>
            <h1 className="text-2xl font-display font-semibold leading-snug">
              Welcome aboard your<br />Booth Management Hub!
            </h1>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-paper/85">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-brass-light shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Simple decorative illustration: ballot box + ward pins */}
          <div className="relative mt-10">
            <svg viewBox="0 0 320 160" className="w-full h-auto opacity-95">
              <ellipse cx="160" cy="148" rx="130" ry="8" fill="#000" opacity="0.25" />
              <rect x="70" y="70" width="110" height="70" rx="6" fill="#16283F" stroke="#DFA94A" strokeWidth="2" />
              <rect x="70" y="70" width="110" height="16" rx="6" fill="#1E3350" stroke="#DFA94A" strokeWidth="2" />
              <rect x="112" y="62" width="26" height="10" rx="2" fill="#DFA94A" />
              <path d="M100 40 L125 78 L112 78 Z" fill="#F6F3EA" stroke="#C08829" strokeWidth="1.5" />
              <circle cx="205" cy="100" r="34" fill="#1E3350" stroke="#2F7A4D" strokeWidth="2" />
              <path d="M191 100 l9 9 l16 -18" fill="none" stroke="#2F7A4D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <g>
                <path d="M245 60c0-9 7.5-16 16-16s16 7 16 16c0 12-16 28-16 28s-16-16-16-28z" fill="#B23A34" />
                <circle cx="261" cy="59" r="6" fill="#F6F3EA" />
              </g>
              <g>
                <path d="M30 78c0-8 6.5-14.5 14.5-14.5S59 70 59 78c0 11-14.5 25-14.5 25S30 89 30 78z" fill="#C08829" />
                <circle cx="44.5" cy="77.5" r="5.5" fill="#F6F3EA" />
              </g>
            </svg>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center relative">
          <button
            onClick={toggleTheme}
            className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-ink dark:hover:text-paper hover:bg-black/5 dark:hover:bg-white/10"
            title="Toggle theme"
            type="button"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <div className="flex items-center gap-2 mb-1 md:hidden">
            <ShieldCheck className="w-5 h-5 text-brass" />
            <span className="text-sm font-bold text-ink dark:text-paper">Booth Management System</span>
          </div>

          <h2 className="text-2xl font-display font-semibold text-ink dark:text-paper">
            {step === 'phone' ? 'Login to your Account' : 'Verify your number'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
            {step === 'phone'
              ? 'Enter your registered phone number to receive a one-time code.'
              : `Enter the 6-digit code sent to ${phone}`}
          </p>

          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Registered phone number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink dark:text-paper placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brass/50"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-seal-red">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brass hover:bg-brass-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Send OTP
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  One-time password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    ref={codeInputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-paper dark:bg-ink border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-ink dark:text-paper tracking-[0.3em] placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brass/50"
                  />
                </div>
              </div>

              {devOtp && (
                <div className="text-xs bg-brass/10 border border-brass/30 text-brass-dark dark:text-brass-light rounded-lg px-3 py-2">
                  No real SMS was delivered (Twilio isn't configured, or this number isn't
                  a verified recipient yet). Your OTP is{' '}
                  <span className="font-mono font-semibold">{devOtp}</span>.
                </div>
              )}

              {error && <p className="text-xs text-seal-red">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brass hover:bg-brass-dark disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Verify & Login
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-ink dark:hover:text-paper"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || busy}
                  className="text-xs text-brass hover:text-brass-dark disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-8">
            Only registered MLA / staff phone numbers can request an OTP.<br />
            Need access? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
