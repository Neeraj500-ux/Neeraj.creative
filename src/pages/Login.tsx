import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Layers,
  Check,
  Mail,
  LockKeyhole,
  Sparkles,
  ShieldCheck,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useWorkspace } from "../services/workspace";
import { supabase } from "../lib/supabase";

const demoRoles = [
  { id: "u0", name: "Owner", description: "Workspace overview" },
  { id: "u1", name: "Operations", description: "Manage daily work" },
  { id: "u2", name: "Team Leader", description: "Guide your team" },
  { id: "u6", name: "Employee", description: "Your tasks & projects" },
];

export default function Login() {
  const { user, login, demo, error: storeError } = useWorkspace();

  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const pending = busy || resetBusy;

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    clearMessages();
    setBusy(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    if (pending) return;
    clearMessages();

    const workEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
      setError("Enter your valid work email to reset your password.");
      return;
    }

    if (!supabase) {
      setError("Password reset is unavailable in demo mode.");
      return;
    }

    setResetBusy(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(workEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) throw resetError;

      setSuccess(
        "Check your inbox. If an account exists, you’ll receive a password reset link.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the reset email. Please try again.",
      );
    } finally {
      setResetBusy(false);
    }
  }

  if (user) return <Navigate to="/" replace />;

  const visibleError = error || (!success ? storeError : "");

  return (
    <main className="cc-login">
      <style>{loginStyles}</style>

      <div className="cc-login-shell">
        <section className="cc-story" aria-label="Creative workspace">
          <div className="cc-story-grid" aria-hidden="true" />
          <div className="cc-orb cc-orb-one" aria-hidden="true" />
          <div className="cc-orb cc-orb-two" aria-hidden="true" />

          <a className="cc-brand" href="/" aria-label="creative-crew  home">
            <span className="cc-brand-icon">
              <Layers size={25} strokeWidth={1.8} />
            </span>

            <span className="cc-brand-copy">
              creative-crew
              <small>CREATIVE WORKSPACE</small>
            </span>
          </a>

          <div className="cc-story-content">
            <span className="cc-story-pill">
              <span className="cc-live-dot" />
              A LITTLE LESS CHAOS. A LOT MORE CLARITY.
            </span>

            <h1>
              Your people.
              <br />
              Your projects.
              <br />
              <span>Perfectly in sync.</span>
            </h1>

            <p className="cc-story-description">
              One beautiful place for your team to plan, collaborate and bring
              great ideas to life.
            </p>

            <div className="cc-benefits">
              <span>
                <Check size={14} /> Clear priorities
              </span>
              <span>
                <Check size={14} /> Better teamwork
              </span>
              <span>
                <Check size={14} /> Meaningful progress
              </span>
            </div>

            <div className="cc-preview-wrap">
              <div className="cc-project-card">
                <div className="cc-project-top">
                  <span className="cc-project-label">
                    <FolderKanban size={14} />
                    SEPTEMBER CAMPAIGN
                  </span>

                  <span className="cc-project-menu" aria-hidden="true">
                    •••
                  </span>
                </div>

                <h2>Great work happens together.</h2>
                <p className="cc-project-description">
                  Ideas aligned. Team connected. Work moving.
                </p>

                <div className="cc-progress-label">
                  <span>Campaign progress</span>
                  <strong>72%</strong>
                </div>

                <div
                  className="cc-progress-track"
                  role="progressbar"
                  aria-label="Example campaign progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={72}
                >
                  <span />
                </div>

                <div className="cc-project-bottom">
                  <div className="cc-team">
                    <div className="cc-avatars" aria-label="Three team members">
                      <span>AV</span>
                      <span>NS</span>
                      <span>RM</span>
                    </div>
                    <span className="cc-team-label">
                      Creative team
                      <small>Working together</small>
                    </span>
                  </div>

                  <span className="cc-on-track">
                    <span /> On track
                  </span>
                </div>

                <div className="cc-card-divider" />

                <div className="cc-project-stats">
                  <span>
                    <FolderKanban size={15} />
                    12 tasks
                  </span>
                  <span>
                    <Users size={15} />
                    3 members
                  </span>
                  <span>
                    <TrendingUp size={15} />
                    In progress
                  </span>
                </div>
              </div>

              <div className="cc-floating-note">
                <span className="cc-note-icon">
                  <CheckCircle2 size={19} />
                </span>
                <span>
                  Everything in one place
                  <small>More focus. More creative flow.</small>
                </span>
                <Sparkles size={17} className="cc-note-sparkle" />
              </div>
            </div>
          </div>

          <div className="cc-story-footer">
            <span>
              <Zap size={14} />
              Built for the way creative teams work.
            </span>
            <small>PLAN. CREATE. GROW.</small>
          </div>
        </section>

        <section className="cc-form-panel" aria-labelledby="cc-login-title">
          <div className="cc-form-top">
            <span className="cc-access-tag">
              <ShieldCheck size={14} />
              Invite-only workspace
            </span>
            <span className="cc-form-top-label">YOUR CREATIVE SPACE</span>
          </div>

          <div className="cc-form-content">
            <div className="cc-welcome-icon" aria-hidden="true">
              <Layers size={27} strokeWidth={1.7} />
              <span>
                <Sparkles size={12} />
              </span>
            </div>

            <span className="cc-eyebrow">WELCOME BACK</span>
            <h2 id="cc-login-title">
              Let’s get <span>to work.</span>
            </h2>
            <p className="cc-form-description">
              Your ideas, your team, your next big thing.
              <br />
              Sign in to your creative workspace.
            </p>

            <form
              className="cc-form"
              onSubmit={handleSubmit}
              aria-busy={pending}
            >
              <div className="cc-field">
                <label htmlFor="cc-email">Work email</label>
                <div className="cc-input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    id="cc-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={pending}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearMessages();
                    }}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="cc-field">
                <div className="cc-label-row">
                  <label htmlFor="cc-password">Password</label>
                  <button
                    type="button"
                    className="cc-forgot"
                    onClick={handlePasswordReset}
                    disabled={pending}
                  >
                    {resetBusy ? "Sending link…" : "Forgot password?"}
                  </button>
                </div>

                <div className="cc-input-wrap">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    id="cc-password"
                    name="password"
                    required
                    autoComplete="current-password"
                    type={show ? "text" : "password"}
                    disabled={pending}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearMessages();
                    }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="cc-password-toggle"
                    aria-label={show ? "Hide password" : "Show password"}
                    aria-pressed={show}
                    aria-controls="cc-password"
                    onClick={() => setShow((current) => !current)}
                    disabled={pending}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {visibleError && (
                <div className="cc-message cc-message-error" role="alert">
                  <AlertCircle size={18} />
                  <span>{visibleError}</span>
                </div>
              )}

              {success && (
                <div className="cc-message cc-message-success" role="status">
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                className="cc-submit"
                disabled={pending}
              >
                <span>
                  {busy && <LoaderCircle size={18} className="cc-spin" />}
                  {busy ? "Signing you in…" : "Sign in to workspace"}
                </span>
                {!busy && <ArrowRight size={19} />}
              </button>

              <p className="cc-form-assurance">
                <ShieldCheck size={14} />
                Your workspace starts with you.
              </p>
            </form>

            {!supabase && (
              <div className="cc-demo">
                <div className="cc-demo-heading">
                  <span className="cc-demo-icon">
                    <Sparkles size={18} />
                  </span>

                  <div>
                    <h3>Take a look around.</h3>
                    <p>Explore sample data, saved on this device.</p>
                  </div>

                  <span className="cc-demo-badge">DEMO</span>
                </div>

                <div className="cc-demo-roles">
                  {demoRoles.map((role) => (
                    <button
                      type="button"
                      className="cc-role"
                      key={role.id}
                      disabled={pending}
                      onClick={() => {
                        clearMessages();
                        try {
                          demo(role.id);
                        } catch (err) {
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Unable to open the demo.",
                          );
                        }
                      }}
                    >
                      <span>
                        <strong>{role.name}</strong>
                        <small>{role.description}</small>
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="cc-invite-note">
              <span>
                <LockKeyhole size={15} />
              </span>
              <p>
                New to the workspace?
                <strong>Contact your admin for an invitation.</strong>
              </p>
            </div>
          </div>

          <footer className="cc-form-footer">
            <span>© {new Date().getFullYear()} Creative Adhyayan</span>
            <span>
              <span className="cc-footer-dot" />
              Made for creative minds
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}

const loginStyles = `
.cc-login {
  --cc-blue: #2563eb;
  --cc-blue-dark: #1d4ed8;
  --cc-ink: #14213b;
  --cc-muted: #78849b;
  --cc-line: #e8edf5;
  min-height: 100vh;
  min-height: 100svh;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 5% 0%, #e5edff 0%, transparent 45%),
    radial-gradient(ellipse at 100% 100%, #eaf0ff 0%, transparent 40%),
    #f4f7fc;
  color: var(--cc-ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.cc-login, .cc-login * { box-sizing: border-box; }
.cc-login h1, .cc-login h2, .cc-login h3, .cc-login p {
  margin: 0;
}
.cc-login button, .cc-login input { font: inherit; }
.cc-login button {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.cc-login button:disabled {
  cursor: wait;
  opacity: .65;
}
.cc-login a { color: inherit; text-decoration: none; }
.cc-login button:focus-visible, .cc-login a:focus-visible {
  outline: 3px solid #60a5fa;
  outline-offset: 4px;
}
.cc-login-shell {
  width: 100%;
  max-width: 1280px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 28px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 32px 100px -35px rgba(30,64,175,.23),
    0 8px 28px rgba(15,23,42,.04);
}
.cc-story {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 40px 44px 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(145deg, #1e40af 0%, #2563eb 48%, #3679f5 100%);
  color: #fff;
}
.cc-story-grid {
  position: absolute;
  inset: 0;
  z-index: -2;
  opacity: .13;
  background-image:
    linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(to bottom, #000, transparent 88%);
}
.cc-orb {
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(45px);
  animation: cc-drift 14s ease-in-out infinite alternate;
}
.cc-orb-one {
  width: 340px;
  height: 340px;
  top: -150px;
  right: -130px;
  background: rgba(125,211,252,.28);
}
.cc-orb-two {
  width: 290px;
  height: 290px;
  bottom: -130px;
  left: -120px;
  background: rgba(96,165,250,.38);
  animation-delay: -7s;
}
.cc-brand {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.cc-brand-icon {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,.32);
  border-radius: 14px;
  background: rgba(255,255,255,.14);
  backdrop-filter: blur(18px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.17);
}
.cc-brand-copy {
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -.6px;
}
.cc-brand-copy small {
  display: block;
  margin-top: 5px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 2.4px;
  color: #c8dcff;
}
.cc-story-content { padding: 62px 0 58px; }
.cc-story-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 100px;
  background: rgba(255,255,255,.08);
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 1px;
}
.cc-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #a7f3d0;
  box-shadow: 0 0 0 4px rgba(167,243,208,.1);
}
.cc-story h1 {
  margin-top: 25px;
  font-size: clamp(40px, 4.1vw, 57px);
  line-height: 1.1;
  font-weight: 760;
  letter-spacing: -2.7px;
}
.cc-story h1 > span {
  display: inline-block;
  color: #bddbff;
}
.cc-story-description {
  max-width: 370px;
  margin-top: 23px !important;
  color: #d7e6ff;
  font-size: 14px;
  line-height: 1.85;
}
.cc-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 17px;
  margin-top: 21px;
}
.cc-benefits > span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 500;
  color: #e1ecff;
}
.cc-benefits svg { color: #b9dcff; }
.cc-preview-wrap {
  position: relative;
  margin-top: 39px;
  padding-bottom: 24px;
}
.cc-project-card {
  position: relative;
  padding: 23px;
  border: 1px solid rgba(255,255,255,.35);
  border-radius: 19px;
  background: linear-gradient(135deg,
    rgba(255,255,255,.17), rgba(255,255,255,.075));
  backdrop-filter: blur(24px);
  box-shadow: 0 18px 40px rgba(13,39,111,.16),
    inset 0 1px 0 rgba(255,255,255,.14);
  transition: transform .35s ease, border-color .35s ease;
}
.cc-project-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cc-project-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 1px;
  color: #e2edff;
}
.cc-project-menu {
  color: #c2d9ff;
  letter-spacing: 2px;
}
.cc-project-card h2 {
  margin-top: 18px;
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -.5px;
}
.cc-project-description {
  margin-top: 7px !important;
  font-size: 11px;
  line-height: 1.6;
  color: #cee0ff;
}
.cc-progress-label {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  font-size: 10px;
  color: #dce9ff;
}
.cc-progress-label strong { color: #fff; font-size: 12px; }
.cc-progress-track {
  height: 6px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 20px;
  background: rgba(255,255,255,.16);
}
.cc-progress-track > span {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #93c5fd, #fff);
  animation: cc-progress 1.4s ease both;
}
.cc-project-bottom {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cc-team { display: flex; align-items: center; gap: 10px; }
.cc-avatars { display: flex; padding-left: 0; }
.cc-avatars > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 2px solid #5081e8;
  border-radius: 50%;
  background: #e0eaff;
  color: #1e40af;
  font-size: 9px;
  font-weight: 750;
}
.cc-avatars > span + span { margin-left: -9px; }
.cc-avatars > span:nth-child(2) { background: #fce7d5; color: #9a5b25; }
.cc-avatars > span:nth-child(3) { background: #d5f5ed; color: #167466; }
.cc-team-label { font-size: 10px; font-weight: 600; }
.cc-team-label small {
  display: block;
  margin-top: 3px;
  font-size: 9px;
  font-weight: 400;
  color: #cbdfff;
}
.cc-on-track {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(167,243,208,.12);
  color: #d1fae5;
  font-size: 9px;
}
.cc-on-track > span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #a7f3d0;
}
.cc-card-divider {
  height: 1px;
  margin-top: 19px;
  background: rgba(255,255,255,.13);
}
.cc-project-stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-top: 15px;
}
.cc-project-stats > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  color: #dbe9ff;
}
.cc-floating-note {
  position: absolute;
  right: -14px;
  bottom: -2px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100% - 14px);
  padding: 12px 15px;
  border: 1px solid rgba(255,255,255,.9);
  border-radius: 13px;
  background: rgba(255,255,255,.96);
  color: #20365f;
  box-shadow: 0 12px 30px rgba(13,39,111,.2);
  animation: cc-note-float 6s ease-in-out infinite;
}
.cc-note-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: #ecfdf5;
  color: #16a078;
}
.cc-floating-note > span:nth-child(2) {
  font-size: 11px;
  font-weight: 650;
}
.cc-floating-note small {
  display: block;
  margin-top: 4px;
  color: #8390a6;
  font-size: 9px;
  font-weight: 400;
}
.cc-note-sparkle { margin-left: 8px; color: #3b82f6; flex-shrink: 0; }
.cc-story-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.cc-story-footer > span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #c9dcff;
  font-size: 10px;
}
.cc-story-footer small {
  font-size: 8px;
  letter-spacing: 1.3px;
  color: #c9dcff;
}
.cc-form-panel {
  min-width: 0;
  padding: 35px 48px 25px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background:
    radial-gradient(circle at 100% 0%, #f3f7ff, transparent 33%),
    #fff;
}
.cc-form-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.cc-access-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border: 1px solid #e9eef8;
  border-radius: 100px;
  background: #f8faff;
  color: #5d7193;
  font-size: 10px;
}
.cc-access-tag svg { color: #3b82f6; }
.cc-form-top-label {
  color: #9ba6b9;
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 1.5px;
}
.cc-form-content {
  width: 100%;
  max-width: 390px;
  margin: 48px auto 42px;
}
.cc-welcome-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 59px;
  height: 59px;
  margin-bottom: 27px;
  border: 1px solid #dce8ff;
  border-radius: 18px;
  background: linear-gradient(140deg, #f1f6ff, #e7efff);
  color: #2563eb;
  box-shadow: 0 7px 16px rgba(37,99,235,.07),
    inset 0 1px 0 #fff;
}
.cc-welcome-icon > span {
  position: absolute;
  bottom: -4px;
  right: -4px;
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
}
.cc-eyebrow {
  color: #3b72d7;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
}
.cc-form-content > h2 {
  margin-top: 12px;
  font-size: clamp(30px, 3vw, 39px);
  font-weight: 760;
  line-height: 1.2;
  letter-spacing: -1.7px;
}
.cc-form-content > h2 > span { color: #2563eb; }
.cc-form-description {
  margin-top: 14px !important;
  color: var(--cc-muted);
  font-size: 13px;
  line-height: 1.85;
}
.cc-form { margin-top: 30px; }
.cc-field + .cc-field { margin-top: 21px; }
.cc-field label {
  display: block;
  color: #35435e;
  font-size: 12px;
  font-weight: 650;
}
.cc-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.cc-input-wrap {
  min-height: 54px;
  margin-top: 9px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid #e2e8f2;
  border-radius: 12px;
  background: #fafbfd;
  transition: border-color .2s ease, box-shadow .2s ease,
    background .2s ease;
}
.cc-input-wrap > svg {
  flex-shrink: 0;
  color: #9aa7bd;
  transition: color .2s ease;
}
.cc-input-wrap:focus-within {
  border-color: #7ca8ff;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(37,99,235,.07);
}
.cc-input-wrap:focus-within > svg { color: #2563eb; }
.cc-input-wrap input {
  width: 100%;
  min-width: 0;
  min-height: 52px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #20304e;
  font-size: 13px;
  box-shadow: none;
}
.cc-input-wrap input::placeholder { color: #a0abbd; }
.cc-input-wrap input:disabled { cursor: wait; }
.cc-password-toggle {
  width: 36px;
  height: 40px;
  margin-right: -8px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #8996ad;
  transition: color .2s ease, background .2s ease;
}
.cc-forgot {
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #3970d6;
  font-size: 11px !important;
  font-weight: 600 !important;
}
.cc-message {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 18px;
  padding: 12px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.cc-message svg { flex-shrink: 0; margin-top: 1px; }
.cc-message-error {
  color: #b42336;
  border-color: #ffd9df;
  background: #fff5f6;
}
.cc-message-success {
  color: #157653;
  border-color: #c5eadb;
  background: #f0fbf6;
}
.cc-submit {
  position: relative;
  width: 100%;
  min-height: 54px;
  margin-top: 24px;
  padding: 14px 19px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  overflow: hidden;
  border: 1px solid #2563eb;
  border-radius: 12px;
  background: linear-gradient(110deg, #2563eb, #3479f6);
  color: #fff;
  font-size: 13px !important;
  font-weight: 650 !important;
  box-shadow: 0 8px 18px rgba(37,99,235,.19),
    inset 0 1px 0 rgba(255,255,255,.16);
  transition: transform .25s ease, box-shadow .25s ease;
}
.cc-submit > span {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}
.cc-submit > svg { transition: transform .25s ease; }
.cc-form-assurance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 14px !important;
  color: #96a1b3;
  font-size: 10px;
}
.cc-form-assurance svg { color: #8da5ca; }
.cc-demo {
  margin-top: 28px;
  padding: 17px;
  border: 1px solid #e7edf8;
  border-radius: 15px;
  background: linear-gradient(145deg, #f9fbff, #f4f7fd);
}
.cc-demo-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cc-demo-icon {
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid #dce7fc;
  border-radius: 10px;
  background: #edf3ff;
  color: #3974e4;
}
.cc-demo-heading > div { min-width: 0; flex: 1; }
.cc-demo-heading h3 {
  font-size: 12px;
  font-weight: 700;
  color: #354666;
}
.cc-demo-heading p {
  margin-top: 4px;
  color: #8995aa;
  font-size: 10px;
  line-height: 1.6;
}
.cc-demo-badge {
  padding: 4px 6px;
  border: 1px solid #dae6ff;
  border-radius: 5px;
  background: #eaf1ff;
  color: #3f72cf;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .7px;
}
.cc-demo-roles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 15px;
}
.cc-role {
  min-width: 0;
  min-height: 60px;
  padding: 10px 11px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  text-align: left;
  border: 1px solid #e3eaf6;
  border-radius: 9px;
  background: #fff;
  color: #485b7e;
  transition: border-color .2s ease, transform .2s ease,
    box-shadow .2s ease;
}
.cc-role > span { min-width: 0; }
.cc-role strong { display: block; font-size: 11px; font-weight: 650; }
.cc-role small {
  display: block;
  margin-top: 4px;
  font-size: 9px;
  line-height: 1.4;
  color: #97a1b2;
}
.cc-role svg { flex-shrink: 0; color: #91a9d2; }
.cc-invite-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 26px;
}
.cc-invite-note > span {
  width: 31px;
  height: 31px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid #eef1f6;
  border-radius: 50%;
  background: #f9fafc;
  color: #99a6bd;
}
.cc-invite-note p {
  color: #8995aa;
  font-size: 10px;
  line-height: 1.7;
}
.cc-invite-note strong {
  display: block;
  color: #62718c;
  font-weight: 500;
}
.cc-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid #eef1f6;
  color: #a0aabc;
  font-size: 9px;
}
.cc-form-footer > span:last-child {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cc-footer-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #8bb0f7;
}
.cc-spin { animation: cc-spin 1s linear infinite; }
@keyframes cc-spin { to { transform: rotate(360deg); } }
@keyframes cc-drift {
  from { transform: translate(0, 0); }
  to { transform: translate(25px, 35px); }
}
@keyframes cc-note-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes cc-progress {
  from { width: 0; }
  to { width: 72%; }
}
@media (hover: hover) and (pointer: fine) {
  .cc-project-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255,255,255,.55);
  }
  .cc-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 25px rgba(37,99,235,.27);
  }
  .cc-submit:hover:not(:disabled) > svg { transform: translateX(4px); }
  .cc-role:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: #a8c4ff;
    box-shadow: 0 5px 14px rgba(37,99,235,.07);
  }
  .cc-password-toggle:hover { color: #2563eb; background: #edf3ff; }
  .cc-forgot:hover { text-decoration: underline; }
}
@media (min-width: 1440px) {
  .cc-login { padding: 40px; }
  .cc-story { padding-left: 52px; padding-right: 52px; }
  .cc-form-panel { padding-left: 58px; padding-right: 58px; }
}
@media (max-width: 1100px) {
  .cc-login { padding: 18px; }
  .cc-story { padding: 32px 30px 26px; }
  .cc-form-panel { padding: 30px 30px 24px; }
  .cc-story h1 { font-size: 45px; letter-spacing: -2px; }
  .cc-form-top-label { display: none; }
  .cc-story-content { padding: 50px 0; }
  .cc-story-footer small { display: none; }
}
@media (max-width: 820px) {
  .cc-login { padding: 22px; align-items: flex-start; }
  .cc-login-shell {
    max-width: 600px;
    grid-template-columns: minmax(0, 1fr);
    border-radius: 23px;
  }
  .cc-story { padding: 27px 32px 30px; }
  .cc-brand-icon { width: 42px; height: 42px; border-radius: 12px; }
  .cc-brand-copy { font-size: 17px; }
  .cc-story-content { padding: 32px 0 0; }
  .cc-story h1 { font-size: 42px; line-height: 1.12; }
  .cc-story h1 br:first-of-type { display: none; }
  .cc-story h1 br:first-of-type::after { content: " "; }
  .cc-story h1 { max-width: 450px; }
  .cc-story-description { max-width: 440px; margin-top: 16px !important; }
  .cc-preview-wrap, .cc-story-footer { display: none; }
  .cc-benefits { margin-top: 18px; }
  .cc-form-panel { padding: 27px 38px 23px; }
  .cc-form-content { max-width: 440px; margin: 30px auto; }
  .cc-form-top-label { display: inline; }
  .cc-welcome-icon { width: 51px; height: 51px; margin-bottom: 22px; }
  .cc-form-content > h2 { font-size: 35px; }
}
@media (max-width: 480px) {
  .cc-login { padding: 12px; }
  .cc-login-shell { border-radius: 20px; }
  .cc-story { padding: 24px 23px; }
  .cc-brand-copy { font-size: 16px; }
  .cc-brand-copy small { font-size: 8px; letter-spacing: 1.8px; }
  .cc-story-content { padding-top: 27px; }
  .cc-story-pill {
    font-size: 7px;
    letter-spacing: .7px;
    padding: 7px 9px;
  }
  .cc-story h1 {
    margin-top: 18px;
    font-size: clamp(30px, 8.8vw, 39px);
    letter-spacing: -1.6px;
  }
  .cc-story-description { font-size: 12px; line-height: 1.75; }
  .cc-benefits { gap: 9px 12px; }
  .cc-benefits > span { font-size: 9px; }
  .cc-form-panel { padding: 24px 23px 20px; }
  .cc-form-top-label { display: none; }
  .cc-form-content { margin-top: 28px; }
  .cc-form-content > h2 { font-size: 31px; letter-spacing: -1.2px; }
  .cc-form-description { font-size: 12px; }
  .cc-form { margin-top: 26px; }
  .cc-input-wrap { min-height: 54px; padding-left: 13px; gap: 9px; }
  .cc-input-wrap input { font-size: 16px; }
  .cc-input-wrap input::placeholder { font-size: 12px; }
  .cc-submit { min-height: 54px; font-size: 12px !important; }
  .cc-demo { padding: 14px; }
  .cc-demo-heading { gap: 8px; }
  .cc-demo-heading h3 { font-size: 11px; }
  .cc-demo-heading p { font-size: 9px; }
  .cc-demo-badge { font-size: 7px; }
  .cc-role { padding: 10px 9px; }
  .cc-role strong { font-size: 10px; }
  .cc-role small { font-size: 8px; }
  .cc-form-footer { justify-content: center; text-align: center; gap: 8px; }
}
@media (max-width: 350px) {
  .cc-login { padding: 8px; }
  .cc-story, .cc-form-panel { padding-left: 18px; padding-right: 18px; }
  .cc-story-pill { font-size: 6px; }
  .cc-demo-roles { grid-template-columns: minmax(0, 1fr); }
  .cc-demo-badge { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .cc-login *, .cc-login *::before, .cc-login *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;