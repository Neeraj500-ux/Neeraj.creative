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

      <div className="fb-shell">
        <section className="fb-story">
          <div className="fb-brand">
            <span className="fb-brand-icon"><Layers size={25} /></span>
            <div>
              Creative Adhyayan
              <small>CREATIVE WORKSPACE</small>
            </div>
          </div>

          <div className="fb-story-content">
            <span className="fb-pill">PLAN. CREATE. GROW.</span>
            <h1>
              Your people.<br />
              Your projects.<br />
              <span>Perfectly in sync.</span>
            </h1>
            <p>
              One place for your team to plan, collaborate and bring great
              ideas to life.
            </p>

            <div className="fb-benefits">
              {["Clear priorities", "Better teamwork", "Meaningful progress"].map(
                (item) => (
                  <span key={item}><Check size={16} />{item}</span>
                ),
              )}
            </div>

            <div className="fb-preview">
              <span>YOUR CREATIVE WORKSPACE</span>
              <h2>Great work happens together.</h2>
              <p>Connect your team. Organize your work. Keep moving.</p>
              <div className="fb-preview-line" />
              <div className="fb-avatars">
                <span>CA</span><span>NS</span><span>RM</span>
                <small>Ideas become action.</small>
              </div>
            </div>
          </div>

          <p className="fb-story-footer">
            Built for the way creative teams work.
          </p>
        </section>

        <section className="fb-panel" aria-labelledby="login-title">
          <span className="fb-security">
            <ShieldCheck size={16} /> Firebase Authentication
          </span>

          <div className="fb-form-content">
            <div className="fb-welcome-icon"><Layers size={27} /></div>
            <h2 id="login-title">Welcome back.</h2>
            <p className="fb-description">
              Sign in to your creative workspace.
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
                <span className="fb-google-letter" aria-hidden="true">G</span>
              )}
              Continue with Google
            </button>

            <div className="fb-divider"><span>or use your email</span></div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="login-email">Work email</label>
              <div className="fb-input">
                <Mail size={19} aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
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

            <p className="fb-help">
              Need an account? Contact your workspace administrator.
            </p>
          </div>

          <footer className="fb-footer">
            © {new Date().getFullYear()} Creative Adhyayan
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
`;