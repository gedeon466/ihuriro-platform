import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GraduationCap, Eye, EyeOff, Loader2, Lock, Mail, Phone, Sparkles, UserRound } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { api } from '@/lib/api';
import type { Language } from '@/types';
import './AuthScreen.css';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function GoogleGlyph() {
  return (
    <svg className="auth-google-logo" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const languages: { code: Language; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'rw', flag: '🇷🇼', label: 'Kinyarwanda' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
];

const features = [
  'CitizenConnect',
  'Education',
  'ParentCare',
  'Biz360 Rwanda',
  'Learn Rwanda',
  'AI Assistant',
];

const roles = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
  { value: 'business', label: 'Business owner' },
  { value: 'health', label: 'Health professional' },
];

export function AuthScreen() {
  const { login, t, language, setLanguage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<{ enabled: boolean; clientId: string | null } | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const isRegister = mode === 'register';

  const handleGoogleCredential = async (credential?: string) => {
    if (!credential) {
      setError('Google did not return a sign-in token. Please try again.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.auth.google(credential);
      login(result.user, result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const googleCallbackRef = useRef(handleGoogleCredential);
  googleCallbackRef.current = handleGoogleCredential;

  useEffect(() => {
    let active = true;
    api.auth
      .googleConfig()
      .then((config) => {
        if (active) setGoogleConfig(config);
      })
      .catch(() => {
        if (active) setGoogleConfig({ enabled: false, clientId: null });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!googleConfig?.enabled) return;
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const scriptId = 'google-identity';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    const onLoad = () => setGoogleReady(true);
    const onError = () =>
      setError('Google sign-in could not be loaded. Check your connection and try again.');

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    return () => {
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };
  }, [googleConfig?.enabled]);

  useEffect(() => {
    if (!googleReady || !googleConfig?.enabled || !googleConfig.clientId) return;
    const googleId = window.google?.accounts?.id;
    const container = googleButtonRef.current;
    if (!googleId || !container) return;

    googleId.initialize({
      client_id: googleConfig.clientId,
      callback: (response) => {
        void googleCallbackRef.current(response.credential);
      },
    });

    container.innerHTML = '';
    googleId.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.min(360, Math.max(240, container.clientWidth || 320)),
    });
  }, [googleReady, googleConfig]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (isRegister && !name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = isRegister
        ? await api.auth.register({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone: phone.trim(),
            role,
            language,
          })
        : await api.auth.login(normalizedEmail, password);
      login(result.user, result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
    setPassword('');
    setShowPassword(false);
  };

  const showGoogleSetup = () => {
    setError(
      'Google sign-in is not available yet. Use your email and password below, or contact the IHURIRO administrator.'
    );
  };

  return (
    <main className="auth-page">
      <div className="site-background" aria-hidden="true">
        <img className="site-background-image" src="/backgrounds/image copy.png" alt="" />
        <img className="site-background-image" src="/backgrounds/image copy 2.png" alt="" />
        <img className="site-background-image" src="/backgrounds/image.png" alt="" />
      </div>

      <section
        className="auth-brand-panel"
        style={{ backgroundImage: "url('/backgrounds/image copy 2.png')" }}
        aria-label="IHURIRO Rwanda"
      >
        <div className="auth-brand-content">
          <div className="auth-brand">
            <span className="auth-brand-mark">IR</span>
            <span>
              <strong>IHURIRO Rwanda</strong>
              <small>{t('app.tagline')}</small>
            </span>
          </div>

          <div className="auth-intro">
            <p className="auth-eyebrow">WELCOME TO IHURIRO</p>
            <h1>One platform.<br />All citizen services.</h1>
            <p className="auth-intro-copy">{t('home.subtitle')}</p>

            <div className="auth-feature-list">
              {features.map((feature) => (
                <span className="auth-feature" key={feature}>
                  <GraduationCap aria-hidden="true" />
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

        <nav className="auth-languages" aria-label="Choose language">
          {languages.map((option) => (
            <button
              aria-label={option.label}
              aria-pressed={language === option.code}
              className={language === option.code ? 'auth-language is-active' : 'auth-language'}
              key={option.code}
              onClick={() => setLanguage(option.code)}
              type="button"
            >
              {option.flag}
            </button>
          ))}
        </nav>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark">IR</span>
            <span>
              <strong>IHURIRO Rwanda</strong>
              <small>{t('app.tagline')}</small>
            </span>
          </div>

          <div className="auth-form-heading">
            <span className="auth-form-icon"><Sparkles aria-hidden="true" /></span>
            <h2>{isRegister ? 'Create your account' : t('auth.welcome')}</h2>
            <p>{isRegister ? 'Join IHURIRO to access all citizen services.' : t('auth.welcomeSub')}</p>
          </div>

          <div className="auth-google">
            {googleConfig?.enabled ? (
              googleReady ? (
                <div className="auth-google-button" ref={googleButtonRef} />
              ) : (
                <button className="auth-google-fallback" disabled type="button">
                  <GoogleGlyph />
                  <span>Continue with Google</span>
                </button>
              )
            ) : (
              <button className="auth-google-fallback" onClick={showGoogleSetup} type="button">
                <GoogleGlyph />
                <span>Continue with Google</span>
              </button>
            )}
          </div>
          <div className="auth-divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error" role="alert">{error}</div>}

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="register-name">Full name</label>
                <div className="auth-input-wrap">
                  <UserRound aria-hidden="true" />
                  <input
                    autoComplete="name"
                    id="register-name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g., Mugisha Eric"
                    required
                    type="text"
                    value={name}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="login-email">{t('auth.email')}</label>
              <div className="auth-input-wrap">
                <Mail aria-hidden="true" />
                <input
                  autoComplete="email"
                  id="login-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.rw"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="register-phone">Phone number <span>(optional)</span></label>
                <div className="auth-input-wrap">
                  <Phone aria-hidden="true" />
                  <input
                    autoComplete="tel"
                    id="register-phone"
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+250 7XX XXX XXX"
                    type="tel"
                    value={phone}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="login-password">{t('auth.password')}</label>
              <div className="auth-input-wrap auth-input-wrap-password">
                <Lock aria-hidden="true" />
                <input
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  id="login-password"
                  minLength={isRegister ? 8 : undefined}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'}
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
                <button
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  type="button"
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="auth-field">
                <label htmlFor="register-role">I am a</label>
                <div className="auth-input-wrap">
                  <UserRound aria-hidden="true" />
                  <select
                    id="register-role"
                    onChange={(event) => setRole(event.target.value)}
                    value={role}
                  >
                    {roles.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <p className="auth-role-note">
                  Teacher, government and administrator accounts are issued by the platform administrator.
                </p>
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Sparkles aria-hidden="true" />
              )}
              <span>{isRegister ? 'Create account' : t('auth.loginBtn')}</span>
            </button>
          </form>

          <p className="auth-mode">
            {isRegister ? 'Already have an account?' : 'New to IHURIRO?'}{' '}
            <button onClick={switchMode} type="button">
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>

          <p className="auth-demo">
            Demo citizen: <strong>citizen@ihuriro.rw</strong> / <strong>Ihuriro@2026</strong>
            <br />
            Demo admin: <strong>admin@ihuriro.rw</strong> / <strong>Ihuriro@2026</strong>
          </p>

          <p className="auth-secure-note">
            Your account helps keep your IHURIRO services connected and secure.
          </p>
        </div>
      </section>
    </main>
  );
}
