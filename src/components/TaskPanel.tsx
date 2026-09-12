import { useState, useEffect } from "react";
import { Play, Square, Send, CheckCircle, Trash2 } from "lucide-react";
import { useWorkspace } from "../services/workspace";
import { Modal, Button, Badge, Avatar } from "./ui";
import { statuses, type Entity } from "../types";
export function TaskPanel({
  task,
  onClose,
}: {
  task: Entity;
  onClose: () => void;
}) {
  const { data, user, save, remove } = useWorkspace();
  const current = (data.tasks || []).find((x) => x.id === task.id) || task;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [start, setStart] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (start) setSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [start]);
  const owner = (data.employees || []).find((x) => x.id === current.assignee);
  async function change(status: string) {
    try {
      await save("tasks", { ...current, status });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Modal title={current.name} onClose={onClose}>
      <div className="flex">
        <Badge value={current.priority || "Medium"} />
        <span className="muted">Due {current.due}</span>
      </div>
      <p className="task-description">{current.description}</p>
      <div className="card soft">
        <div className="flex">
          <Avatar name={owner?.name || "Unassigned"} />
          <div>
            <strong>{owner?.name || "Unassigned"}</strong>
            <small className="muted">Responsible for delivery</small>
          </div>
        </div>
        <label>
          Status
          <select
            value={current.status}
            onChange={(e) => change(e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex between">
          <span>{current.hours} estimated hours</span>
          <Button
            className="secondary"
            onClick={async () => {
              if (!start) {
                setStart(Date.now());
                return;
              }
              try {
                await save("time_entries", {
                  name: current.name,
                  status: "Logged",
                  assignee: user?.id,
                  project_id: current.project_id,
                  hours: (Date.now() - start) / 3600000,
                  due: new Date().toISOString().slice(0, 10),
                });
                setStart(null);
                setSeconds(0);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            {start ? <Square size={16} /> : <Play size={16} />}{" "}
            {start
              ? Math.floor(seconds / 60) +
                ":" +
                String(seconds % 60).padStart(2, "0") +
                " Stop"
              : "Start timer"}
          </Button>
        </div>
      </div>
      <h3>Conversation</h3>
      <div className="comments">
        {(data.comments || [])
          .filter((x) => x.task_id === task.id)
          .map((c) => (
            <div className="comment" key={c.id}>
              <Avatar name={String(c.author || "Team")} />
              <div>
                <strong>{String(c.author || "Team")}</strong>
                <p>{c.description}</p>
              </div>
            </div>
          ))}
      </div>
      <form
        className="flex"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!text.trim()) return;
          try {
            await save("comments", {
              name: "Task comment",
              status: "Posted",
              task_id: task.id,
              description: text,
              author: user?.name,
              assignee: user?.id,
              team_id: current.team_id,
            });
            setText("");
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <input
          aria-label="Write a comment"
          placeholder="Add context, feedback or a question…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button aria-label="Send comment">
          <Send size={18} />
        </Button>
      </form>
      <p className="error">{error}</p>
      <div className="flex between">
        <Button onClick={() => change("Completed")}>
          <CheckCircle size={17} /> Complete task
        </Button>
        {["admin", "super_admin"].includes(user?.role || "") && (
          <Button
            className="secondary"
            onClick={async () => {
              if (confirm("Delete this task?")) {
                try {
                  await remove("tasks", task.id);
                  onClose();
                } catch (e) {
                  setError((e as Error).message);
                }
              }
            }}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </Modal>
  );
}
