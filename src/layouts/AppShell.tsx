import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, Navigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  CalendarDays,
  Clock,
  Users,
  Building2,
  ChartNoAxesCombined,
  FileText,
  Bell,
  Settings,
  Wallet,
  Layers,
  Menu,
  X,
  Search,
  Plus,
  LogOut,
  ChevronLeft,
  Command,
  MessageSquare,
  CheckCheck,
  Upload,
  ClipboardList,
  Activity,
  Workflow,
} from "lucide-react";
import { useWorkspace } from "../services/workspace";
import { Avatar, Button, Modal } from "../components/ui";
import { Editor } from "../components/Editor";
import { supabase } from "../lib/supabase";
const groups = [
  { label: "OVERVIEW", items: [["Dashboard", "/", LayoutDashboard]] },
  {
    label: "MY WORK",
    items: [
      ["My Tasks", "/my-tasks", CheckSquare],
      ["My Projects", "/my-projects", FolderKanban],
      ["My Calendar", "/calendar", CalendarDays],
      ["My Timesheet", "/time_entries", Clock],
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      ["Projects", "/projects", FolderKanban],
      ["Tasks", "/tasks", CheckSquare],
      ["Clients", "/clients", Building2],
      ["Teams", "/teams", Users],
      ["Employees", "/employees", Users],
      ["Workload", "/workload", ChartNoAxesCombined],
    ],
  },
  {
    label: "AGENCY",
    items: [
      ["Content Calendar", "/content_items", CalendarDays],
      ["Requests", "/requests", ClipboardList],
      ["Approvals", "/approvals", CheckCheck],
      ["Files", "/files", Upload],
      ["Documents / SOP", "/documents", FileText],
      ["Communication", "/comments", MessageSquare],
    ],
  },
  {
    label: "BUSINESS",
    items: [
      ["Monthly Reports", "/reports", ChartNoAxesCombined],
      ["Attendance", "/attendance", Clock],
      ["Finance", "/finance", Wallet],
      ["Payroll", "/payroll", Wallet],
      ["Expenses", "/expenses", Wallet],
    ],
  },
  {
    label: "SYSTEM",
    items: [
      ["Notifications", "/notifications", Bell],
      ["Automations", "/automations", Workflow],
      ["Activity Log", "/activity_logs", Activity],
      ["Settings", "/settings", Settings],
    ],
  },
];
export const adminPaths = [
  "/finance",
  "/payroll",
  "/expenses",
  "/settings",
  "/employees",
  "/clients",
  "/activity_logs",
  "/automations",
];
export default function AppShell() {
  const { user, loading, error, logout, data } = useWorkspace();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [quick, setQuick] = useState(false);
  const [create, setCreate] = useState("");
  const [command, setCommand] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  useEffect(() => {
    setMobile(false);
  }, [location.pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommand((x) => !x);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  if (loading && !user)
    return (
      <div className="loading">
        <Layers />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  const admin = ["admin", "super_admin"].includes(user.role);
  const isAllowed = (path: string) => admin || !adminPaths.includes(path);
  const all = groups.flatMap((g) => g.items);
  const title = String(
    all.find((i) => i[1] === location.pathname)?.[0] || "Workspace",
  );
  return (
    <div className={"app " + (collapsed ? "collapsed" : "")}>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Layers size={24} />
          </span>
          {!collapsed && (
            <div>
              creative-crew<small>Welcome to the Creative Workspace!</small>
            </div>
          )}
        </Link>
        <div className="workspace-switch">
          <span className="avatar">CA</span>
          {!collapsed && (
            <div>
              <strong>Agency workspace</strong>
              <small className="muted">
                {supabase ? "Live workspace" : "Demo workspace"}
              </small>
            </div>
          )}
        </div>
        <nav>
          {groups.map((g) => (
            <section key={g.label}>
              {!collapsed && <h4>{g.label}</h4>}
              {g.items
                .filter((i) => isAllowed(String(i[1])))
                .map(([label, path, Icon]) => {
                  const I = Icon as typeof Layers;
                  return (
                    <NavLink
                      end={path === "/"}
                      to={String(path)}
                      title={String(label)}
                      key={String(path)}
                    >
                      <I size={19} />
                      {!collapsed && <span>{String(label)}</span>}
                      {!collapsed && path === "/notifications" && (
                        <small>
                          {
                            (data.notifications || []).filter(
                              (x) => x.status === "Unread",
                            ).length
                          }
                        </small>
                      )}
                    </NavLink>
                  );
                })}
            </section>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="help-card">
              <strong>A little help goes a long way.</strong>
              <a href="mailto:Contact@creativeadhyayan.com">
                Contact support <span>↗</span>
              </a>
            </div>
          )}
          <button
            className="profile-button"
            onClick={() => logout()}
            title="Sign out"
          >
            <Avatar name={user.name} />
            {!collapsed && (
              <div>
                <strong>{user.name}</strong>
                <small>{user.role.replace("_", " ")}</small>
              </div>
            )}
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header>
          <div className="flex">
            <button
              className="icon-btn mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <button
              className="icon-btn collapse-btn"
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(!collapsed)}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="header-actions">
            <button className="header-search" onClick={() => setCommand(true)}>
              <Search size={17} />
              <span>Search anything</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="quick-create">
              <Button onClick={() => setQuick(!quick)}>
                <Plus size={17} />
                <span>Create</span>
              </Button>
              {quick && (
                <div className="dropdown">
                  {[
                    "tasks",
                    "projects",
                    "requests",
                    ...(admin ? ["clients", "employees"] : []),
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setCreate(t);
                        setQuick(false);
                      }}
                    >
                      New {t.replace(/s$/, "")}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              className="icon-btn notification-bell"
              aria-label="Notifications"
              to="/notifications"
            >
              <Bell size={20} />
              <i />
            </Link>
            <Avatar name={user.name} />
          </div>
        </header>
        <main>
          {!supabase && (
            <div className="demo-notice">
              <span className="dot" /> Demo workspace · Sample data, changes
              saved on this device
            </div>
          )}
          {error && <p className="error">{error}</p>}
          <Outlet />
        </main>
        <footer>
          Creative Adhyayan{" "}
          <span>Built for focused teams. Designed for creative work.</span>
        </footer>
      </div>
      {create && <Editor table={create} onClose={() => setCreate("")} />}{" "}
      {command && (
        <Modal title="Find your next step" onClose={() => setCommand(false)}>
          <div className="search">
            <Search size={18} />
            <input
              autoFocus
              aria-label="Search commands"
              placeholder="Search pages or projects…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="command-results">
            {all
              .filter(
                (i) =>
                  isAllowed(String(i[1])) &&
                  String(i[0]).toLowerCase().includes(query.toLowerCase()),
              )
              .map(([label, path]) => (
                <Link
                  key={String(path)}
                  to={String(path)}
                  onClick={() => setCommand(false)}
                >
                  <Command size={16} />
                  {String(label)}
                </Link>
              ))}
            {(data.projects || [])
              .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
              .map((p) => (
                <Link
                  key={p.id}
                  to="/projects"
                  onClick={() => setCommand(false)}
                >
                  <FolderKanban size={16} />
                  {p.name}
                </Link>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
