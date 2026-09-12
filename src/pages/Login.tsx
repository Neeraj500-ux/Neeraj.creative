import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from "firebase/auth";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Layers,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
  CalendarDays,
  Video,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { auth, googleProvider } from "../lib/firebase";

function readableError(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Something went wrong. Please try again.";
  }

  const messages: Record<string, string> = {
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Check your internet connection.",
    "auth/popup-blocked": "Allow popups in your browser and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/unauthorized-domain":
      "Add this website domain to Firebase Authentication authorized domains.",
    "auth/operation-not-allowed":
      "Enable this login method in Firebase Authentication.",
    "auth/account-exists-with-different-credential":
      "Sign in using the method already linked to this email.",
  };

  return messages[error.code] ?? "Unable to complete the request. Try again.";
}

export default function Login() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setChecking(false);
      },
      (err) => {
        setError(readableError(err));
        setChecking(false);
      },
    );
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    clearMessages();
    setBusy("email");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogleLogin() {
    if (busy) return;

    clearMessages();
    setBusy("google");

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    if (busy) return;
    clearMessages();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter your email above to reset your password.");
      return;
    }

    setBusy("reset");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(
        "If an account exists, a password reset link will arrive in your inbox.",
      );
    } catch (err) {
      setError(readableError(err));
    } finally {
      setBusy(null);
    }
  }

  if (checking) {
    return (
      <div className="fb-login-loading">
        <style>{styles}</style>
        <LoaderCircle className="fb-spin" aria-label="Checking session" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  return (
    <main className="fb-login">
      <style>{styles}</style>

      <div className="fb-background-orb fb-orb-one" aria-hidden="true" />
      <div className="fb-background-orb fb-orb-two" aria-hidden="true" />
      <div className="fb-shell">
        <section className="fb-story">
          <div className="fb-brand">
            <span className="fb-brand-icon"><Layers size={25} /></span>
            <div>
              creative-crew
              <small>CREATIVE WORKSPACE</small>
            </div>
          </div>

          <div className="fb-story-content">
            <span className="fb-pill"><Sparkles size={13} aria-hidden="true" /> PLAN. CREATE. GROW.</span>
            <h1>
              Big ideas.<br />
              Creative minds.<br />
              <span>One shared space.</span>
            </h1>
            <p>
              Welcome to creative-crew — your space to organize projects,
              collaborate with your team and turn creative ideas into meaningful work.
            </p>

            <div className="fb-benefits">
              {["Clear priorities", "Better teamwork", "Meaningful progress"].map(
                (item) => (
                  <span key={item}><Check size={16} />{item}</span>
                ),
              )}
            </div>

            <div className="fb-preview" aria-label="Illustrative creative workflow">
              <div className="fb-preview-top"><span className="fb-mini-brand"><Layers size={15} /> Creative studio</span><span className="fb-live"><i /> Workspace preview</span></div>
              <h2>A little structure. A lot of possibility.</h2>
              <p>Give your next idea a place to grow.</p>
              <div className="fb-task"><span className="fb-task-icon"><Video size={18} /></span><div><strong>Bring your vision to life</strong><small>Plan your next creative project</small></div><span className="fb-task-tag">CREATE</span></div>
              <div className="fb-task"><span className="fb-task-icon"><BookOpen size={18} /></span><div><strong>Learn. Share. Keep growing.</strong><small>Keep ideas and resources together</small></div><Check size={17} className="fb-task-check" /></div>
              <div className="fb-preview-line" />
              <div className="fb-preview-bottom"><span><CalendarDays size={15} /> Make space for great work.</span><span className="fb-mini-dots"><i /><i /><i /></span></div>
            </div>
          </div>

          <p className="fb-story-footer">
            Built for the way creative teams work.
          </p>
        </section>

        <section className="fb-panel" aria-labelledby="login-title">
          <span className="fb-security">
            <ShieldCheck size={16} /> Secure workspace access
          </span>

          <div className="fb-form-content">
            <div className="fb-welcome-icon"><Layers size={27} /></div>
            <span className="fb-form-badge"><Sparkles size={12} aria-hidden="true" /> A SPACE FOR YOUR NEXT BIG IDEA</span>
            <span className="fb-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2 id="login-title">Welcome back<span className="fb-title-dot">.</span></h2>
            <p className="fb-description">
              Your ideas, your team, your workspace. Let’s get back to creating.
            </p>

            {error && <div className="fb-message fb-error" role="alert">{error}</div>}
            {success && <div className="fb-message fb-success" role="status">{success}</div>}

            <button
              type="button"
              className="fb-google"
              onClick={handleGoogleLogin}
              disabled={busy !== null}
            >
              {busy === "google" ? (
                <LoaderCircle size={19} className="fb-spin" />
              ) : (
                <svg className="fb-google-logo" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z" />
                  <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.28-3.13.78-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
                </svg>
              )}
              <span>{busy === "google" ? "Connecting to Google…" : "Continue with Google"}</span>
            </button>

            <div className="fb-divider"><span>or use your email</span></div>

            <form onSubmit={handleSubmit} aria-busy={busy !== null}>
              <label htmlFor="login-email">Work email</label>
              <div className="fb-input">
                <Mail size={19} aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={busy !== null}
                  required
                />
              </div>

              <div className="fb-password-heading">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="fb-forgot"
                  onClick={handleReset}
                  disabled={busy !== null}
                >
                  {busy === "reset" ? "Sending…" : "Forgot password?"}
                </button>
              </div>

              <div className="fb-input">
                <LockKeyhole size={19} aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy !== null}
                  required
                />
                <button
                  type="button"
                  className="fb-toggle"
                  disabled={busy !== null}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>

              <button
                type="submit"
                className="fb-submit"
                disabled={busy !== null}
              >
                <span>
                  {busy === "email" && <LoaderCircle size={18} className="fb-spin" />}
                  {busy === "email" ? "Signing in…" : "Enter your workspace"}
                </span>
                <ArrowRight size={19} />
              </button>
            </form>

            <div className="fb-trust-note"><ShieldCheck size={14} aria-hidden="true" /><span>Your workspace. A secure sign-in.</span></div>
            <p className="fb-help">
              Need an account? Contact your workspace administrator.
            </p>
          </div>

          <footer className="fb-footer">
            © {new Date().getFullYear()} creative-crew
          </footer>
        </section>
      </div>
    </main>
  );
}

const styles = `
.fb-login, .fb-login-loading {
  min-height:100vh;
  min-height:100dvh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:28px;
  background:radial-gradient(ellipse at 15% 10%,#dbeafe,transparent 55%),#f3f6fc;
  color:#172642;
  font-family:Inter,system-ui,sans-serif;
}
.fb-login *, .fb-login-loading * {box-sizing:border-box;}
.fb-login button,.fb-login input {font:inherit;}
.fb-login button {cursor:pointer;}
.fb-login button:disabled {opacity:.6;cursor:wait;}
.fb-login button:focus-visible {outline:3px solid #93c5fd;outline-offset:4px;}
.fb-shell {
  width:100%;max-width:1120px;
  display:grid;grid-template-columns:1.08fr 1fr;
  border:1px solid #fff;border-radius:28px;
  overflow:hidden;background:#fff;
  box-shadow:0 28px 90px rgba(30,64,175,.12);
}
.fb-story {
  position:relative;padding:40px;
  display:flex;flex-direction:column;justify-content:space-between;
  background:radial-gradient(circle at 100% 0%,#60a5fa88,transparent 50%),
  linear-gradient(145deg,#173c91,#2563eb);
  color:#fff;
}
.fb-brand {display:flex;align-items:center;gap:12px;font-size:19px;font-weight:700;}
.fb-brand-icon {
  display:grid;place-items:center;width:48px;height:48px;
  border-radius:14px;background:#ffffff20;border:1px solid #ffffff40;
}
.fb-brand small {display:block;font-size:9px;letter-spacing:2px;margin-top:5px;opacity:.7;}
.fb-story-content {padding:58px 0 38px;}
.fb-pill {font-size:10px;letter-spacing:1.5px;border:1px solid #ffffff35;border-radius:30px;padding:9px 12px;}
.fb-story h1 {font-size:clamp(34px,4vw,52px);line-height:1.12;letter-spacing:-2px;margin:25px 0 20px;}
.fb-story h1 span {color:#bfdbfe;}
.fb-story p {font-size:14px;line-height:1.8;color:#dbeafe;}
.fb-benefits {display:flex;flex-wrap:wrap;gap:14px;margin-top:24px;}
.fb-benefits span {display:flex;align-items:center;gap:6px;font-size:11px;}
.fb-preview {
  margin-top:35px;padding:25px;border:1px solid #ffffff40;
  border-radius:20px;background:#ffffff12;backdrop-filter:blur(20px);
  box-shadow:0 18px 40px #153d8c33;transition:transform .3s;
}
.fb-preview > span {font-size:9px;letter-spacing:1.4px;color:#bfdbfe;}
.fb-preview h2 {font-size:20px;margin:16px 0 8px;}
.fb-preview p {font-size:12px;}
.fb-preview-line {height:1px;background:#ffffff25;margin:22px 0;}
.fb-avatars {display:flex;align-items:center;padding-left:5px;}
.fb-avatars > span {
  width:34px;height:34px;display:grid;place-items:center;
  border:2px solid #93b7ff;background:#dbeafe;color:#1e40af;
  border-radius:50%;margin-left:-5px;font-size:10px;font-weight:700;
}
.fb-avatars small {margin-left:12px;font-size:11px;color:#dbeafe;}
.fb-story-footer {margin:0;font-size:11px!important;}
.fb-panel {padding:36px 44px;display:flex;flex-direction:column;justify-content:space-between;}
.fb-security {display:flex;align-items:center;gap:7px;color:#7183a1;font-size:11px;}
.fb-form-content {padding:45px 0;max-width:400px;width:100%;margin:auto;}
.fb-welcome-icon {width:56px;height:56px;display:grid;place-items:center;background:#eff6ff;color:#2563eb;border:1px solid #dbeafe;border-radius:17px;margin-bottom:25px;}
.fb-form-content h2 {font-size:36px;letter-spacing:-1.5px;margin:0;}
.fb-description {font-size:14px;color:#7b8aa2;line-height:1.7;margin:12px 0 28px;}
.fb-google {
  width:100%;min-height:52px;background:#fff;border:1px solid #dce4f1;
  border-radius:12px;display:flex;justify-content:center;align-items:center;
  gap:12px;color:#334155;font-size:13px!important;font-weight:600!important;
}
.fb-google-letter {font-size:21px;font-weight:800;color:#4285f4;}
.fb-divider {display:flex;align-items:center;gap:12px;color:#94a3b8;font-size:11px;margin:24px 0;}
.fb-divider::before,.fb-divider::after {content:"";height:1px;flex:1;background:#e8edf5;}
.fb-login label {font-size:12px;font-weight:600;display:block;}
.fb-input {
  display:flex;align-items:center;gap:10px;min-height:54px;padding:0 14px;
  border:1px solid #dce4f1;border-radius:12px;margin-top:9px;color:#8a9bb6;
  background:#f9fbff;transition:border-color .2s,box-shadow .2s;
}
.fb-input:focus-within {border-color:#60a5fa;box-shadow:0 0 0 4px #dbeafe80;}
.fb-input > svg {flex-shrink:0;}
.fb-input input {width:100%;min-width:0;border:0;outline:0;background:transparent;color:#172642;font-size:16px;}
.fb-input input::placeholder {font-size:13px;color:#9aa7ba;}
.fb-password-heading {display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;}
.fb-forgot {border:0;background:none;color:#2563eb;font-size:11px!important;padding:4px 0;}
.fb-toggle {border:0;background:none;display:grid;place-items:center;color:#8a9bb6;padding:6px;}
.fb-submit {
  width:100%;min-height:54px;margin-top:26px;padding:0 18px;
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  border:0;border-radius:12px;background:linear-gradient(110deg,#2563eb,#4384ff);
  color:#fff;font-size:13px!important;font-weight:600!important;
  box-shadow:0 9px 22px #2563eb30;transition:transform .25s,box-shadow .25s;
}
.fb-submit > span {display:flex;align-items:center;gap:8px;}
.fb-help {font-size:11px;text-align:center;line-height:1.8;color:#8695ac;margin:22px 0 0;}
.fb-footer {border-top:1px solid #edf1f7;padding-top:18px;color:#94a3b8;font-size:10px;}
.fb-message {padding:13px;border-radius:10px;font-size:12px;line-height:1.7;margin-bottom:20px;overflow-wrap:anywhere;}
.fb-error {background:#fff1f2;color:#be123c;border:1px solid #fecdd3;}
.fb-success {background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
.fb-spin {animation:fb-spin 1s linear infinite;}
@keyframes fb-spin {to{transform:rotate(360deg);}}
@media(hover:hover) {
  .fb-submit:hover:not(:disabled) {transform:translateY(-2px);box-shadow:0 12px 25px #2563eb45;}
  .fb-google:hover:not(:disabled) {background:#f8faff;border-color:#93c5fd;}
  .fb-preview:hover {transform:translateY(-4px);}
}
@media(max-width:850px) {
  .fb-login {padding:20px;align-items:flex-start;}
  .fb-shell {max-width:580px;grid-template-columns:1fr;}
  .fb-story {padding:30px;}
  .fb-story-content {padding:30px 0 0;}
  .fb-story h1 {font-size:38px;}
  .fb-preview,.fb-story-footer {display:none;}
  .fb-panel {padding:30px;}
  .fb-form-content {padding:32px 0;}
}
@media(max-width:480px) {
  .fb-login {padding:12px;}
  .fb-shell {border-radius:20px;}
  .fb-story,.fb-panel {padding:24px;}
  .fb-brand {font-size:17px;}
  .fb-story h1 {font-size:34px;}
  .fb-story p {font-size:12px;}
  .fb-benefits {gap:10px;}
  .fb-benefits span {font-size:10px;}
  .fb-form-content h2 {font-size:31px;}
  .fb-description {font-size:12px;}
}
@media(prefers-reduced-motion:reduce) {
  .fb-login *,.fb-login-loading * {animation:none!important;transition:none!important;}
}

/* Premium blue-white finish. Scoped to this page. */
.fb-login,.fb-login-loading {box-sizing:border-box;position:relative;isolation:isolate;padding:40px 24px;background:radial-gradient(ellipse at 8% 12%,#dbeafe 0,transparent 45%),radial-gradient(ellipse at 95% 85%,#e0e7ff 0,transparent 42%),#f5f8ff;}
.fb-login {overflow:hidden;}
.fb-background-orb {position:absolute;z-index:-1;width:360px;height:360px;border-radius:50%;filter:blur(65px);opacity:.4;pointer-events:none;animation:fb-drift 14s ease-in-out infinite alternate;}
.fb-orb-one {top:-140px;left:-140px;background:#93c5fd;}
.fb-orb-two {bottom:-160px;right:-120px;background:#a5b4fc;animation-delay:-7s;}
.fb-shell {position:relative;max-width:1180px;border-radius:32px;grid-template-columns:1.12fr 1fr;box-shadow:0 35px 100px #1e40af18,0 6px 22px #1e40af08;animation:fb-enter .7s ease both;}
.fb-story {padding:38px 42px;overflow:hidden;background:radial-gradient(ellipse at 90% 4%,#60a5fa80,transparent 54%),linear-gradient(145deg,#173c91 0%,#2158cf 58%,#2563eb 100%);}
.fb-story::before {content:"";position:absolute;inset:0;background-image:linear-gradient(#ffffff05 1px,transparent 1px),linear-gradient(90deg,#ffffff05 1px,transparent 1px);background-size:42px 42px;pointer-events:none;mask-image:linear-gradient(#000,transparent);}
.fb-story::after {content:"";position:absolute;width:360px;height:360px;right:-230px;bottom:-170px;border-radius:50%;border:50px solid #ffffff08;box-shadow:0 0 0 35px #ffffff04;pointer-events:none;animation:fb-drift 12s ease-in-out infinite alternate;}
.fb-story > * {position:relative;z-index:1;}
.fb-brand-icon {box-shadow:inset 0 1px 0 #ffffff25,0 8px 20px #10285520;backdrop-filter:blur(18px);}
.fb-brand small {letter-spacing:2.5px;}
.fb-story-content {padding:48px 0 30px;}
.fb-pill {display:inline-flex;align-items:center;gap:8px;background:#ffffff0d;color:#e5efff;padding:9px 13px;}
.fb-story h1 {font-size:clamp(39px,4.2vw,55px);letter-spacing:-2.5px;line-height:1.12;margin:24px 0 18px;}
.fb-story h1 span {background:linear-gradient(100deg,#dbeafe,#93c5fd,#e0f2fe);background-size:200% auto;background-clip:text;-webkit-background-clip:text;color:transparent;animation:fb-gradient 8s ease infinite;}
.fb-story-content > p {max-width:410px;font-size:14px;color:#dbeafe;line-height:1.85;}
.fb-benefits {gap:10px 14px;}
.fb-benefits span {color:#eaf2ff;font-size:11px;}
.fb-benefits svg {background:#ffffff1c;border-radius:50%;padding:2px;width:18px;height:18px;}
.fb-preview {position:relative;overflow:hidden;padding:22px;margin-top:30px;border-radius:22px;background:linear-gradient(135deg,#ffffff20,#ffffff0b);border:1px solid #ffffff35;box-shadow:inset 0 1px 0 #ffffff20,0 20px 40px #102c6c25;animation:fb-float 7s ease-in-out infinite;}
.fb-preview::before {content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 30%,#ffffff0c 45%,transparent 60%);background-size:250% 100%;animation:fb-gradient 9s ease infinite;}
.fb-preview-top,.fb-preview-bottom {display:flex;align-items:center;justify-content:space-between;gap:10px;}
.fb-mini-brand {display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;}
.fb-live {display:flex;align-items:center;gap:5px;font-size:9px;color:#dbeafe;}
.fb-live i {width:5px;height:5px;border-radius:50%;background:#bfdbfe;box-shadow:0 0 9px #bfdbfe;}
.fb-preview h2 {font-size:19px;line-height:1.4;letter-spacing:-.5px;margin:20px 0 4px;}
.fb-preview p {margin:0 0 17px;}
.fb-task {display:flex;align-items:center;gap:11px;padding:12px 10px;margin-top:8px;border:1px solid #ffffff18;background:#ffffff0b;border-radius:12px;transition:background .25s,transform .25s;}
.fb-task-icon {width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:#ffffff18;color:#dbeafe;flex-shrink:0;}
.fb-task > div {flex:1;min-width:0;}
.fb-task strong {display:block;font-size:11px;font-weight:600;line-height:1.5;}
.fb-task small {display:block;font-size:10px;color:#bfdbfe;line-height:1.6;margin-top:2px;}
.fb-task-tag {font-size:8px;letter-spacing:.8px;background:#ffffff14;border:1px solid #ffffff18;border-radius:6px;padding:5px 6px;}
.fb-task-check {color:#bfdbfe;flex-shrink:0;}
.fb-preview-line {margin:17px 0;}
.fb-preview-bottom > span:first-child {display:flex;align-items:center;gap:7px;font-size:10px;color:#dbeafe;}
.fb-mini-dots {display:flex;gap:4px;}
.fb-mini-dots i {width:5px;height:5px;border-radius:50%;background:#ffffff30;}
.fb-mini-dots i:first-child {background:#bfdbfe;}
.fb-panel {padding:34px 44px;background:linear-gradient(155deg,#fff,#fbfdff);}
.fb-security {font-size:10px;letter-spacing:.2px;color:#64748b;}
.fb-security svg {color:#2563eb;}
.fb-form-content {padding:36px 0;}
.fb-welcome-icon {position:relative;background:linear-gradient(145deg,#eff6ff,#e5efff);box-shadow:0 8px 18px #2563eb0a,inset 0 1px 0 #fff;margin-bottom:21px;transition:transform .3s;}
.fb-eyebrow {display:block;font-size:9px;font-weight:700;letter-spacing:1.65px;color:#7c90af;margin-bottom:12px;}
.fb-form-content h2 {font-size:39px;line-height:1.2;letter-spacing:-1.8px;}
.fb-title-dot {color:#2563eb;}
.fb-description {max-width:320px;font-size:13px;margin:12px 0 25px;line-height:1.8;}
.fb-google {min-height:53px;border-radius:13px;box-shadow:0 2px 4px #17264203;transition:background .2s,border-color .2s,transform .2s;}
.fb-divider {margin:23px 0;font-size:10px;}
.fb-input {min-height:56px;border-radius:13px;background:#f8faff;transition:box-shadow .25s,border-color .25s,background .25s;}
.fb-input:focus-within {background:#fff;border-color:#60a5fa;box-shadow:0 0 0 4px #2563eb0c,0 4px 12px #2563eb06;color:#2563eb;}
.fb-input input {min-height:52px;}
.fb-toggle {min-width:36px;min-height:40px;border-radius:8px;}
.fb-forgot {min-height:30px;}
.fb-submit {position:relative;isolation:isolate;overflow:hidden;min-height:56px;border-radius:13px;margin-top:25px;background:linear-gradient(110deg,#2158d9,#2563eb,#4384ff);background-size:200% 100%;animation:fb-gradient 7s ease infinite;box-shadow:0 10px 24px #2563eb33,inset 0 1px 0 #ffffff25;}
.fb-submit::before {content:"";position:absolute;inset:0;z-index:-1;transform:translateX(-120%);background:linear-gradient(110deg,transparent,#ffffff22,transparent);transition:transform .65s;}
.fb-submit > svg {transition:transform .25s;flex-shrink:0;}
.fb-help {margin-top:21px;color:#7b8aa1;}
.fb-footer {font-size:10px;line-height:1.6;}
.fb-message {animation:fb-enter .25s ease both;}
@keyframes fb-enter {from {opacity:0;transform:translateY(14px);}to {opacity:1;transform:translateY(0);}}
@keyframes fb-float {0%,100% {transform:translateY(0);}50% {transform:translateY(-5px);}}
@keyframes fb-drift {to {transform:translate(25px,35px);}}
@keyframes fb-gradient {0%,100% {background-position:0% 50%;}50% {background-position:100% 50%;}}
@media(hover:hover) {.fb-task:hover {background:#ffffff16;transform:translateX(3px);}.fb-submit:hover:not(:disabled)::before {transform:translateX(120%);}.fb-submit:hover:not(:disabled) > svg {transform:translateX(3px);}.fb-welcome-icon:hover {transform:rotate(-5deg);}.fb-toggle:hover {background:#eaf1ff;color:#2563eb;}}
@media(min-width:851px) and (max-height:800px) {.fb-login {padding:20px;}.fb-story-content {padding-top:30px;}.fb-story h1 {font-size:44px;}.fb-panel {padding-top:28px;padding-bottom:28px;}.fb-form-content {padding:24px 0;}}
@media(max-width:850px) {.fb-login {padding:22px 16px;}.fb-shell {max-width:590px;border-radius:26px;grid-template-columns:1fr;}.fb-story {padding:28px 32px;}.fb-story-content {padding:25px 0 0;}.fb-story h1 {font-size:38px;letter-spacing:-1.6px;}.fb-story h1 br {display:none;}.fb-story h1 span {display:block;margin-top:4px;}.fb-story-content > p {max-width:460px;font-size:12px;margin-bottom:0;}.fb-benefits {margin-top:18px;}.fb-preview,.fb-story-footer {display:none;}.fb-panel {padding:28px 32px;}.fb-form-content {padding:26px 0 30px;max-width:440px;}.fb-welcome-icon {width:48px;height:48px;border-radius:14px;margin-bottom:18px;}.fb-form-content h2 {font-size:34px;}.fb-security {justify-content:center;}.fb-footer {text-align:center;}}
@media(max-width:480px) {.fb-login {padding:12px;}.fb-shell {border-radius:22px;}.fb-story {padding:23px;}.fb-panel {padding:24px 23px;}.fb-brand {font-size:17px;gap:10px;}.fb-brand-icon {width:42px;height:42px;border-radius:12px;}.fb-brand small {font-size:8px;}.fb-story-content {padding-top:23px;}.fb-story h1 {font-size:30px;line-height:1.2;margin:17px 0 12px;letter-spacing:-1px;}.fb-pill {font-size:8px;letter-spacing:1.1px;padding:7px 10px;}.fb-benefits {gap:8px 11px;margin-top:15px;}.fb-benefits span {font-size:9px;}.fb-form-content h2 {font-size:32px;}.fb-eyebrow {font-size:8px;letter-spacing:1.25px;}.fb-description {font-size:12px;}.fb-password-heading {gap:8px;}.fb-help {font-size:10px;}.fb-background-orb {width:200px;height:200px;}}
@media(max-width:360px) {.fb-login {padding:8px;}.fb-story,.fb-panel {padding:20px 17px;}.fb-brand {font-size:15px;}.fb-story h1 {font-size:27px;}.fb-forgot {font-size:10px!important;}}
@media(prefers-reduced-motion:reduce) {.fb-login *,.fb-login *::before,.fb-login *::after,.fb-login-loading * {animation:none!important;transition:none!important;}.fb-spin {animation:fb-spin 1.5s linear infinite!important;}}

/* Refined finish and true four-color Google mark */
.fb-google-logo {display:block;width:20px;height:20px;min-width:20px;flex:0 0 20px;}
.fb-google {position:relative;background:#fff;border:1px solid #dadce0;min-height:54px;border-radius:14px;gap:12px;color:#3c4043;font-weight:600!important;letter-spacing:.1px;box-shadow:0 2px 5px #17264204;}
.fb-google > span {line-height:1.5;}
.fb-google > .fb-spin {width:20px;height:20px;flex-shrink:0;color:#4285f4;}
.fb-form-badge {display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:7px 10px;margin:0 0 17px;border-radius:20px;border:1px solid #dbeafe;background:linear-gradient(110deg,#f0f7ff,#f8fbff);color:#2563eb;font-size:8px;letter-spacing:1px;font-weight:700;line-height:1.5;}
.fb-eyebrow {display:none;}
.fb-shell {border:1px solid #ffffffcc;box-shadow:0 40px 100px #1e40af14,0 8px 25px #17264206;}
.fb-panel {background:radial-gradient(ellipse at 100% 0,#eff6ff80,transparent 50%),linear-gradient(160deg,#fff,#fcfdff);}
.fb-welcome-icon {width:58px;height:58px;border-radius:18px;background:linear-gradient(145deg,#fff,#e6f0ff);border-color:#dbeafe;box-shadow:inset 0 2px 0 #fff,0 10px 22px #2563eb10;}
.fb-welcome-icon::after {content:"";position:absolute;width:7px;height:7px;border-radius:50%;right:6px;top:6px;background:#60a5fa;box-shadow:0 0 0 3px #fff;}
.fb-form-content {padding-top:32px;padding-bottom:32px;}
.fb-form-content h2 {font-weight:750;letter-spacing:-1.7px;}
.fb-input {border-color:#e0e7f2;background:linear-gradient(180deg,#fbfcff,#f7faff);box-shadow:inset 0 1px 2px #17264203;}
.fb-input input::placeholder {color:#8e9bb0;}
.fb-password-heading {margin-top:24px;}
.fb-submit {margin-top:27px;box-shadow:0 10px 22px #2563eb2b,inset 0 1px 0 #ffffff35;border:1px solid #ffffff15;}
.fb-trust-note {display:flex;align-items:center;justify-content:center;gap:6px;margin-top:19px;color:#7b8ba3;font-size:10px;line-height:1.6;}
.fb-trust-note svg {color:#6087c1;flex-shrink:0;}
.fb-help {padding-top:17px;margin-top:17px;border-top:1px solid #edf1f7;font-size:10px;}
.fb-preview {border-color:#ffffff45;background:linear-gradient(135deg,#ffffff24,#ffffff0d);box-shadow:inset 0 1px 0 #ffffff30,0 20px 42px #102c6c30;}
.fb-task {padding:13px 11px;border-radius:13px;}
.fb-task-icon {background:linear-gradient(135deg,#ffffff25,#ffffff0a);border:1px solid #ffffff1c;}
.fb-story-footer {letter-spacing:.25px;opacity:.8;}
@media(hover:hover) {.fb-google:hover:not(:disabled) {background:#f8faff;border-color:#b5c9eb;box-shadow:0 4px 12px #2563eb0b;transform:translateY(-1px);}.fb-input:hover {border-color:#c5d5ee;}.fb-input:focus-within {border-color:#60a5fa;}}
@media(max-width:850px) {.fb-form-content {padding-top:27px;padding-bottom:25px;}.fb-form-badge {margin-bottom:15px;}.fb-welcome-icon {width:50px;height:50px;border-radius:16px;}.fb-panel {padding:28px 32px;}.fb-security {font-size:10px;}}
@media(max-width:480px) {.fb-panel {padding:25px 23px;}.fb-form-badge {font-size:7px;letter-spacing:.75px;padding:7px 9px;}.fb-google {min-height:54px;font-size:13px!important;}.fb-google-logo {width:20px;height:20px;}.fb-trust-note {font-size:9px;}.fb-form-content h2 {font-size:32px;}.fb-task {min-width:0;}}
@media(max-width:360px) {.fb-panel {padding:23px 17px;}.fb-form-badge {letter-spacing:.3px;}.fb-google {gap:10px;font-size:12px!important;}}
@media(prefers-reduced-motion:reduce) {.fb-login *,.fb-login *::before,.fb-login *::after {animation:none!important;transition:none!important;}}
`;
