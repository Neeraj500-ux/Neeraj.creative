import { useState } from "react";
import { useWorkspace } from "../services/workspace";
import { Button, Avatar } from "../components/ui";
import { supabase } from "../lib/supabase";
export default function Settings() {
  const { user, data, save } = useWorkspace();
  const existing = (data.settings || [])[0];
  const [name, setName] = useState(existing?.name || "Creative Adhyayan");
  const [description, setDescription] = useState(
    existing?.description || "One Platform. Every Skill You Need.",
  );
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE THIS WORKSPACE YOURS</span>
          <h1>Settings</h1>
          <p className="muted">Your profile, company and account security.</p>
        </div>
      </div>
      <div className="settings-grid">
        <div className="card">
          <h3>Company profile</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await save("settings", {
                  id: existing?.id,
                  name,
                  description,
                  status: "Active",
                });
                setMessage("Company profile saved.");
              } catch (e) {
                setMessage((e as Error).message);
              }
            }}
          >
            <label>
              Company name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Brand statement
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label>
              Office address
              <textarea
                readOnly
                value="Building No. 532/1, First Floor, Bank Colony Deoli Village, New Delhi-110062"
              />
            </label>
            <Button>Save profile</Button>
          </form>
        </div>
        <div className="card">
          <h3>My account</h3>
          <div className="flex">
            <Avatar name={user?.name || "Team"} />
            <div>
              <strong>{user?.name}</strong>
              <small className="muted">{user?.email}</small>
            </div>
          </div>
          <p className="muted">Role: {user?.role?.replace("_", " ")}</p>
          <h3>Change password</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!supabase) {
                setMessage("Demo accounts do not use passwords.");
                return;
              }
              const { error } = await supabase.auth.updateUser({ password });
              setMessage(error?.message || "Password updated.");
            }}
          >
            <label>
              New password
              <input
                type="password"
                minLength={10}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <Button className="secondary">Update password</Button>
          </form>
          <hr />
          <p className="muted">
            Need help?{" "}
            <a href="mailto:Contact@creativeadhyayan.com">
              Contact Creative Adhyayan
            </a>
          </p>
        </div>
      </div>
      <p role="status">{message}</p>
    </>
  );
}
export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="reset card">
      <h1>Choose a new password</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!supabase) return;
          const { error } = await supabase.auth.updateUser({ password });
          setMessage(
            error?.message || "Password updated. You can return to sign in.",
          );
        }}
      >
        <label>
          New password
          <input
            type="password"
            minLength={10}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Button>Save password</Button>
      </form>
      <p>{message}</p>
      <a href="/login">Back to sign in</a>
    </div>
  );
}
