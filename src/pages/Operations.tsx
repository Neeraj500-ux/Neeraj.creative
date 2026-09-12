import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Check,
  Users,
  Plus,
} from "lucide-react";
import { useWorkspace, scoped } from "../services/workspace";
import { Button, Avatar, Badge, Empty } from "../components/ui";
import { exportCSV } from "./Records";
import { Editor } from "../components/Editor";
export function Calendar() {
  const { data, user } = useWorkspace();
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const tasks = scoped(data.tasks || [], user);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE SPACE FOR GREAT WORK</span>
          <h1>Calendar</h1>
          <p className="muted">
            Project deadlines and creative deliveries, together.
          </p>
        </div>
        <div className="flex">
          <Button
            className="secondary"
            aria-label="Previous month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={18} />
          </Button>
          <strong>
            {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
          </strong>
          <Button
            className="secondary"
            aria-label="Next month"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      <div className="card calendar">
        <div className="calendar-grid">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => (
            <div className="day-label" key={x}>
              {x}
            </div>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div className="day empty-day" key={"e" + i} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date =
              month.getFullYear() +
              "-" +
              String(month.getMonth() + 1).padStart(2, "0") +
              "-" +
              String(i + 1).padStart(2, "0");
            return (
              <div className="day" key={i}>
                <strong>{i + 1}</strong>
                {tasks
                  .filter((t) => t.due === date)
                  .slice(0, 3)
                  .map((t) => (
                    <a href="/tasks" className="calendar-task" key={t.id}>
                      {t.name}
                    </a>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
export function Workload() {
  const { data, user } = useWorkspace();
  const [skill, setSkill] = useState("");
  const employees = (data.employees || [])
    .filter(
      (x) =>
        ["admin", "super_admin"].includes(user?.role || "") ||
        x.id === user?.id ||
        (user?.role === "leader" && x.department === user.team_id),
    )
    .filter((x) =>
      (x.name + " " + x.description)
        .toLowerCase()
        .includes(skill.toLowerCase()),
    );
  const tasks = scoped(data.tasks || [], user);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PEOPLE BEFORE CAPACITY</span>
          <h1>Team workload</h1>
          <p className="muted">
            Remaining estimated hours ÷ 40-hour weekly capacity.
          </p>
        </div>
        <input
          className="compact-input"
          aria-label="Search skills"
          placeholder="Search a name or skill…"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
        />
      </div>
      <div className="workload-grid">
        {employees.map((e) => {
          const assigned = tasks.filter(
            (t) => t.assignee === e.id && t.status !== "Completed",
          );
          const hours = assigned.reduce((a, t) => a + (t.hours || 0), 0);
          const pct = Math.round((hours / 40) * 100);
          return (
            <div className="card" key={e.id}>
              <div className="flex">
                <Avatar name={e.name} />
                <div>
                  <h3>{e.name}</h3>
                  <small className="muted">{e.department}</small>
                </div>
              </div>
              <div className="capacity">
                <strong>{pct}%</strong>
                <Badge
                  value={
                    pct > 100 ? "At Risk" : pct < 60 ? "Available" : "Balanced"
                  }
                />
              </div>
              <div className="progress">
                <i
                  style={{
                    width: Math.min(pct, 100) + "%",
                    background: pct > 100 ? "#f87171" : undefined,
                  }}
                />
              </div>
              <p className="muted">
                {assigned.length} open tasks · {hours} estimated hours
              </p>
              <small className="muted">{e.description}</small>
            </div>
          );
        })}
      </div>
    </>
  );
}
export function Attendance() {
  const { user, data, save } = useWorkspace();
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const record = (data.attendance || []).find(
    (x) => x.assignee === user?.id && x.due === today,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SHOW UP. DO GREAT WORK.</span>
          <h1>Attendance</h1>
          <p className="muted">Your daily check-in, without the paperwork.</p>
        </div>
      </div>
      <div className="card attendance-card">
        <span className="kpi-icon">
          <Clock size={28} />
        </span>
        <h2>
          {record?.status === "Present"
            ? "You’re checked in"
            : record?.status === "Checked Out"
              ? "Your day is logged"
              : "Ready for a productive day?"}
        </h2>
        <p className="muted">
          {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}
        </p>
        <Button
          disabled={record?.status === "Checked Out"}
          onClick={async () => {
            try {
              await save("attendance", {
                id: record?.id,
                name: user?.name + " · " + today,
                assignee: user?.id,
                team_id: user?.team_id,
                due: today,
                status: record ? "Checked Out" : "Present",
                description: new Date().toLocaleTimeString(),
              });
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <Check size={17} /> {record ? "Check out" : "Check in"}
        </Button>
        <p className="error">{error}</p>
      </div>
      <h3 className="spaced">Recent attendance</h3>
      <div className="card">
        {scoped(data.attendance || [], user).length ? (
          scoped(data.attendance || [], user).map((x) => (
            <div className="detail-row" key={x.id}>
              <span>{x.name}</span>
              <Badge value={x.status} />
            </div>
          ))
        ) : (
          <Empty />
        )}
      </div>
    </>
  );
}
export function Reports() {
  const { data, user } = useWorkspace();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [department, setDepartment] = useState("All");
  const rows = scoped(data.tasks || [], user).filter(
    (x) =>
      x.due?.startsWith(month) &&
      (department === "All" || x.department === department),
  );
  const completed = rows.filter((x) => x.status === "Completed").length;
  const hours = scoped(data.time_entries || [], user)
    .filter((x) => x.due?.startsWith(month))
    .reduce((s, x) => s + (x.hours || 0), 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TURN PROGRESS INTO PERSPECTIVE</span>
          <h1>Monthly progress</h1>
          <p className="muted">
            Delivery and workload based on your workspace records.
          </p>
        </div>
        <Button onClick={() => exportCSV(rows, "monthly-progress-" + month)}>
          <Download size={17} /> Download CSV
        </Button>
      </div>
      <div className="toolbar card">
        <label>
          Reporting month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <label>
          Department
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option>All</option>
            {[
              "Creative",
              "Performance Marketing",
              "Development",
              "Content",
              "Client Servicing",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="kpi-grid">
        {[
          ["Assigned work", rows.length],
          ["Completed", completed],
          ["Remaining", rows.length - completed],
          ["Tracked hours", hours.toFixed(1)],
        ].map(([k, v]) => (
          <div className="card kpi" key={k}>
            <span className="muted">{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Department delivery</h3>
        {[
          "Creative",
          "Performance Marketing",
          "Development",
          "Content",
          "Client Servicing",
        ].map((d) => {
          const t = rows.filter((x) => x.department === d);
          const pct = Math.round(
            (t.filter((x) => x.status === "Completed").length /
              Math.max(t.length, 1)) *
              100,
          );
          return (
            <div className="report-row" key={d}>
              <strong>{d}</strong>
              <div className="progress">
                <i style={{ width: pct + "%" }} />
              </div>
              <span>
                {pct}% · {t.length} tasks
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
export function Finance() {
  const { data, save } = useWorkspace();
  const [error, setError] = useState("");
  const invoice = data.invoices || [];
  const revenue = invoice
    .filter((x) => x.status === "Paid")
    .reduce((s, x) => s + (x.amount || 0), 0);
  const costs =
    (data.expenses || [])
      .filter((x) => x.status === "Paid")
      .reduce((s, x) => s + (x.amount || 0), 0) +
    (data.payroll || [])
      .filter((x) => x.status === "Paid")
      .reduce((s, x) => s + (x.amount || 0), 0);
  const [edit, setEdit] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A HEALTHIER BUSINESS, BY THE NUMBERS</span>
          <h1>Finance overview</h1>
          <p className="muted">
            Recorded payments and costs across your agency.
          </p>
        </div>
        <Button onClick={() => setEdit(true)}>
          <Plus size={17} /> New invoice
        </Button>
      </div>
      <div className="kpi-grid">
        {[
          ["Collected revenue", revenue],
          ["Paid costs", costs],
          ["Cash surplus", revenue - costs],
          [
            "Outstanding",
            invoice
              .filter((x) => x.status !== "Paid")
              .reduce((s, x) => s + (x.amount || 0), 0),
          ],
        ].map(([k, v]) => (
          <div className="card kpi" key={k}>
            <span className="muted">{k}</span>
            <strong>₹{Number(v).toLocaleString("en-IN")}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Client invoices</h3>
        {invoice.map((i) => (
          <div className="detail-row" key={i.id}>
            <div>
              <strong>{i.name}</strong>
              <small className="muted">
                ₹{i.amount?.toLocaleString("en-IN")}
              </small>
            </div>
            <Badge value={i.status} />
            {i.status !== "Paid" && (
              <Button
                className="secondary"
                onClick={async () => {
                  try {
                    await save("invoices", { ...i, status: "Paid" });
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Mark paid
              </Button>
            )}
          </div>
        ))}
        <p className="error">{error}</p>
      </div>
      {edit && <Editor table="invoices" onClose={() => setEdit(false)} />}
    </>
  );
}
export function Teams() {
  const { data } = useWorkspace();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DIFFERENT SKILLS. SHARED AMBITION.</span>
          <h1>Teams</h1>
          <p className="muted">Meet the people behind the progress.</p>
        </div>
      </div>
      <div className="workload-grid">
        {[
          "Creative",
          "Performance Marketing",
          "Development",
          "Content",
          "Client Servicing",
        ].map((d) => (
          <div className="card" key={d}>
            <span className="kpi-icon">
              <Users size={22} />
            </span>
            <h2>{d}</h2>
            <p className="muted">
              {(data.employees || []).filter((e) => e.department === d).length}{" "}
              members ·{" "}
              {(data.projects || []).filter((e) => e.department === d).length}{" "}
              projects
            </p>
            {(data.employees || [])
              .filter((e) => e.department === d)
              .map((e) => (
                <div className="team-member" key={e.id}>
                  <Avatar name={e.name} />
                  <span>
                    {e.name}
                    <small className="muted">{e.role?.replace("_", " ")}</small>
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
export function Approvals() {
  const { data, user, save } = useWorkspace();
  const [error, setError] = useState("");
  const rows = scoped(data.tasks || [], user).filter(
    (x) => x.status === "Internal Review" || x.status === "Revision",
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GOOD WORK DESERVES GOOD FEEDBACK</span>
          <h1>Approvals</h1>
          <p className="muted">
            Review deliverables and keep the next step clear.
          </p>
        </div>
      </div>
      {rows.length ? (
        <div className="card">
          {rows.map((t) => (
            <div className="detail-row" key={t.id}>
              <div>
                <strong>{t.name}</strong>
                <small className="muted">{t.description?.slice(0, 85)}</small>
              </div>
              <Badge value={t.status} />
              <Button
                onClick={async () => {
                  try {
                    await save("tasks", { ...t, status: "Completed" });
                    await save("approvals", {
                      name: t.name,
                      status: "Approved",
                      task_id: t.id,
                      assignee: t.assignee,
                      team_id: t.team_id,
                    });
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Approve
              </Button>
              <Button
                className="secondary"
                onClick={async () => {
                  try {
                    await save("tasks", { ...t, status: "Revision" });
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Revision
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Empty />
      )}
      <p className="error">{error}</p>
    </>
  );
}
