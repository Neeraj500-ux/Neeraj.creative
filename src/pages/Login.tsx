import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Layers, Check } from "lucide-react";
import { useWorkspace } from "../services/workspace";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui";
export default function Login() {
  const { user, login, demo, error: storeError } = useWorkspace();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  if (user) return <Navigate to="/" />;
  return (
    <div className="login">
      <section className="login-story">
        <div className="brand">
          <span className="brand-icon">
            <Layers />
          </span>
          <div>
            creative-crew<small>CREATIVE WORKSPACE</small>
          </div>
        </div>
        <div>
          <span className="eyebrow">LESS CHAOS. MORE CREATIVE WORK.</span>
          <h1>
            Your team.
            <br />
            Your work.
            <br />
            <em>One workspace.</em>
          </h1>
          <p>
            Bring projects, people and progress together. Make room for the work
            that moves your agency forward.
          </p>
          <div className="login-preview">
            <span className="badge blue">SEPTEMBER CAMPAIGN</span>
            <h3>Great work happens together.</h3>
            <div className="progress">
              <i style={{ width: "72%" }} />
            </div>
            <div className="flex between">
              <span>Campaign progress</span>
              <strong>72%</strong>
            </div>
            <div className="flex">
              <span className="avatar">AV</span>
              <span className="avatar">NS</span>
              <span className="avatar">RM</span>
              <span className="muted">Creative + Marketing</span>
            </div>
          </div>
        </div>
        <small>
          creative-crew · Practical skills. Meaningful progress.
        </small>
      </section>
      <section className="login-form">
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Let's get to work.</h2>
        <p className="muted">Sign in to your CREATIVE WORKSPACE.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await login(email, password);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Work email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <label>
            Password
            <div className="password">
              <input
                required
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                aria-label="Show password"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              if (!supabase || !email) {
                setError(
                  "Enter your work email and configure Supabase to reset your password.",
                );
                return;
              }
              const { error } = await supabase.auth.resetPasswordForEmail(
                email,
                { redirectTo: location.origin + "/reset-password" },
              );
              setError(error?.message || "Password reset email sent.");
            }}
          >
            Forgot password?
          </button>
          <p role="alert" className="error">
            {error || storeError}
          </p>
          <Button disabled={busy} className="full">
            {busy ? "Signing in…" : "Sign in"} <ArrowRight size={17} />
          </Button>
        </form>
        {!supabase && (
          <div className="demo-box">
            <strong>Explore the working demo</strong>
            <p>Sample data · Saved on this device</p>
            <div className="demo-roles">
              {[
                ["u0", "Owner"],
                ["u1", "Operations"],
                ["u2", "Team Leader"],
                ["u6", "Employee"],
              ].map(([id, name]) => (
                <Button className="secondary" key={id} onClick={() => demo(id)}>
                  {name}
                </Button>
              ))}
            </div>
          </div>
        )}
        <p className="muted fine">
          <Check size={14} /> Invite-only access. Contact your admin for an
          account.
        </p>
      </section>
    </div>
  );
}
