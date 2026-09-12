import { useState } from "react";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { useWorkspace, scoped } from "../services/workspace";
import { Button, Empty } from "../components/ui";
import { supabase } from "../lib/supabase";
export default function Files() {
  const { data, user, save, remove } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const rows = scoped(data.files || [], user);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE DETAILS THAT MAKE THE DIFFERENCE</span>
          <h1>Files</h1>
          <p className="muted">
            Keep your creative assets and working documents close.
          </p>
        </div>
        <label className="btn">
          <Upload size={17} />
          {busy ? "Uploading…" : "Upload file"}
          <input
            style={{ display: "none" }}
            type="file"
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                setError("Maximum file size is 10 MB.");
                return;
              }
              setBusy(true);
              try {
                let path = "";
                if (supabase) {
                  path =
                    user?.id +
                    "/" +
                    crypto.randomUUID() +
                    "-" +
                    file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                  const { error } = await supabase.storage
                    .from("agency-files")
                    .upload(path, file);
                  if (error) throw error;
                } else {
                  if (file.size > 1024 * 1024)
                    throw Error(
                      "Demo uploads support files up to 1 MB. Configure Supabase for larger files.",
                    );
                  path = await new Promise<string>((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = () => resolve(String(r.result));
                    r.onerror = reject;
                    r.readAsDataURL(file);
                  });
                }
                await save("files", {
                  name: file.name,
                  status: "Uploaded",
                  assignee: user?.id,
                  team_id: user?.team_id,
                  storage_path: path,
                  description: Math.round(file.size / 1024) + " KB",
                });
                setError("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>
      <p className="error">{error}</p>
      {rows.length ? (
        <div className="card">
          {rows.map((f) => (
            <div className="detail-row" key={f.id}>
              <div className="flex">
                <FileText size={22} />
                <span>
                  {f.name}
                  <small className="muted">{f.description}</small>
                </span>
              </div>
              <div className="flex">
                <Button
                  className="secondary"
                  aria-label={"Download " + f.name}
                  onClick={async () => {
                    try {
                      if (supabase) {
                        const { data, error } = await supabase.storage
                          .from("agency-files")
                          .download(String(f.storage_path));
                        if (error) throw error;
                        const url = URL.createObjectURL(data);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = f.name;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 5000);
                      } else {
                        const a = document.createElement("a");
                        a.href = String(f.storage_path);
                        a.download = f.name;
                        a.click();
                      }
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <Download size={16} />
                </Button>
                <Button
                  className="secondary"
                  aria-label={"Delete " + f.name}
                  onClick={async () => {
                    if (!confirm("Delete " + f.name + "?")) return;
                    try {
                      if (supabase) {
                        const { error } = await supabase.storage
                          .from("agency-files")
                          .remove([String(f.storage_path)]);
                        if (error) throw error;
                      }
                      await remove("files", f.id);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty />
      )}
    </>
  );
}
