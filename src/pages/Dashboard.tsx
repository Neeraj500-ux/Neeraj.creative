import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderKanban,
  Users,
  Target,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useWorkspace, scoped } from "../services/workspace";
import { Avatar, Badge } from "../components/ui";
export default function Dashboard() {
  const { user, data } = useWorkspace();
  const tasks = scoped(data.tasks || [], user);
  const projects =
    user?.role === "employee"
      ? (data.projects || []).filter((p) =>
          tasks.some((t) => t.project_id === p.id),
        )
      : scoped(data.projects || [], user);
  const done = tasks.filter((x) => x.status === "Completed");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter(
    (x) => x.status !== "Completed" && !!x.due && x.due < today,
  );
  const chart = [
    "To Do",
    "In Progress",
    "Internal Review",
    "Revision",
    "Completed",
  ].map((name) => ({
    name,
    value: tasks.filter((x) => x.status === name).length,
  }));
  const months = Array.from({ length: 6 }, (_, i) => {
    const m = new Date();
    m.setMonth(m.getMonth() - 5 + i);
    return {
      name: m.toLocaleString("en", { month: "short" }),
      completed: tasks.filter(
        (t) =>
          t.status === "Completed" &&
          String(t.due).slice(0, 7) === m.toISOString().slice(0, 7),
      ).length,
    };
  });
  const admin = ["admin", "super_admin"].includes(user?.role || "");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <h1>
            Good to see you, {user?.name.split(" ")[0]}{" "}
            <span className="wave">✦</span>
          </h1>
          <p className="muted">
            Here's how your{" "}
            {admin ? "agency" : user?.role === "leader" ? "team" : "work"} is
            moving today.
          </p>
        </div>
        <Link className="btn secondary" to="/tasks">
          <Plus size={17} /> Plan your work
        </Link>
      </div>
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">CREATIVE WORK. CLEAR DIRECTION.</span>
          <h2>
            A little clarity.
            <br />A lot of momentum.
          </h2>
          <p>Your next big idea deserves a well-organized team.</p>
          <Link to="/projects">
            Explore your projects <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-art">
          <div className="floating-card">
            <CheckCircle2 size={22} />
            <strong>{done.length} tasks delivered</strong>
            <small>One step closer to the bigger picture</small>
          </div>
          <div className="orbit">
            <Target size={58} />
          </div>
          <div className="floating-pill">
            <span className="dot" /> {projects.length} projects connected
          </div>
        </div>
      </div>
      <div className="kpi-grid">
        {[
          {
            label: "Active projects",
            value: projects.filter((x) => x.status !== "Completed").length,
            icon: FolderKanban,
            note: "Across your workspace",
          },
          {
            label: "Tasks completed",
            value: done.length,
            icon: CheckCircle2,
            note:
              Math.round((done.length / Math.max(tasks.length, 1)) * 100) +
              "% of assigned work",
          },
          {
            label: "Overdue tasks",
            value: overdue.length,
            icon: Clock,
            note: "Needs your attention",
          },
          {
            label: admin ? "Team members" : "Assigned tasks",
            value: admin ? (data.employees || []).length : tasks.length,
            icon: Users,
            note: admin ? "People making it happen" : "Your connected workload",
          },
        ].map((k, i) => (
          <div className="card kpi" key={k.label}>
            <div className="flex between">
              <span className="muted">{k.label}</span>
              <span className={"kpi-icon c" + i}>
                <k.icon size={20} />
              </span>
            </div>
            <strong>{k.value}</strong>
            <small>{k.note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="card chart-card">
          <div className="flex between">
            <div>
              <h3>Delivery momentum</h3>
              <p className="muted">Completed tasks by deadline month</p>
            </div>
            <span className="badge blue">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={245}>
            <AreaChart data={months}>
              <defs>
                <linearGradient id="blueArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#edf1f7" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#blueArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3>Work at a glance</h3>
          <p className="muted">Every stage, in one place</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={chart}
                dataKey="value"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={4}
              >
                {chart.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      ["#bfdbfe", "#3b82f6", "#a78bfa", "#fbbf24", "#34d399"][i]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend">
            {chart.map((x, i) => (
              <div className="flex between" key={x.name}>
                <span>
                  <i
                    style={{
                      background: [
                        "#bfdbfe",
                        "#3b82f6",
                        "#a78bfa",
                        "#fbbf24",
                        "#34d399",
                      ][i],
                    }}
                  />
                  {x.name}
                </span>
                <strong>{x.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card">
          <div className="section-heading">
            <h3>Projects in focus</h3>
            <Link to="/projects">
              View all <ArrowUpRight size={16} />
            </Link>
          </div>
          {projects.slice(0, 4).map((p) => {
            const ts = tasks.filter((t) => t.project_id === p.id);
            const percent = Math.round(
              (ts.filter((x) => x.status === "Completed").length /
                Math.max(1, ts.length)) *
                100,
            );
            return (
              <Link className="project-row" to="/projects" key={p.id}>
                <span className="project-icon">
                  <FolderKanban size={21} />
                </span>
                <div>
                  <strong>{p.name}</strong>
                  <small className="muted">
                    {
                      (data.clients || []).find((c) => c.id === p.client_id)
                        ?.name
                    }{" "}
                    · Due {p.due}
                  </small>
                </div>
                <div className="project-progress">
                  <span>{percent}%</span>
                  <div className="progress">
                    <i style={{ width: percent + "%" }} />
                  </div>
                </div>
                <Badge value={p.status} />
              </Link>
            );
          })}
        </div>
        <div className="card">
          <div className="section-heading">
            <h3>Coming up next</h3>
            <Link to="/my-tasks">
              My work <ArrowUpRight size={16} />
            </Link>
          </div>
          {tasks
            .filter((t) => t.status !== "Completed")
            .sort((a, b) => (a.due || "").localeCompare(b.due || ""))
            .slice(0, 4)
            .map((t) => (
              <Link to="/tasks" className="deadline-row" key={t.id}>
                <span className="date-box">
                  <small>SEP</small>
                  <strong>{t.due?.slice(-2)}</strong>
                </span>
                <div>
                  <strong>{t.name}</strong>
                  <small className="muted">
                    {
                      (data.employees || []).find((e) => e.id === t.assignee)
                        ?.name
                    }
                  </small>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))}
        </div>
      </div>
    </>
  );
}
