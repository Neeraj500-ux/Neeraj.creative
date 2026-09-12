import { useState, useEffect, useRef } from "react";
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
  const quickRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (quickRef.current && !quickRef.current.contains(event.target as Node)) setQuick(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = sidebarRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || command || create) return;
      const elements = sidebarRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", trap);
      menuRef.current?.focus();
    };
  }, [mobile, command, create]);
  useEffect(() => {
    setMobile(false);
    setQuick(false);
    setCommand(false);
    setQuery("");
  }, [location.pathname]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobile(false); setQuick(false); setCommand(false); setCreate("");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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
  if (!user) return <Navigate to="/login" replace />;
  const admin = ["admin", "super_admin"].includes(user.role);
  const isAllowed = (path: string) => admin || !adminPaths.includes(path);
  const all = groups.flatMap((g) => g.items);
  const title = String(
    all.find((i) => i[1] === location.pathname)?.[0] || "Workspace",
  );
  return (
    <div className={"app ca-shell " + (collapsed ? "collapsed" : "")}>
      <style>{shellStyles}</style>
      <a className="ca-skip" href="#workspace-content">Skip to content</a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside ref={sidebarRef} id="workspace-navigation" aria-label="Workspace navigation" className={mobile ? "sidebar open" : "sidebar"}>
        <button className="ca-mobile-close icon-btn" aria-label="Close navigation" onClick={() => setMobile(false)}><X size={20} /></button>
        <Link className="brand" to="/">
          <span className="brand-icon">
            <Layers size={24} />
          </span>
          {(!collapsed || mobile) && (
            <div>
              creative-crew<small>CREATIVE WORKSPACE</small>
            </div>
          )}
        </Link>
        <div className="workspace-switch">
          <span className="avatar">CA</span>
          {(!collapsed || mobile) && (
            <div>
              <strong>Agency workspace</strong>
              <small className="muted">
                {supabase ? "Live workspace" : "Demo workspace"}
              </small>
            </div>
          )}
        </div>
        <nav aria-label="Main navigation">
          {groups.map((g) => (
            <section key={g.label}>
              {(!collapsed || mobile) && <h4>{g.label}</h4>}
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
                      {(!collapsed || mobile) && <span>{String(label)}</span>}
                      {(!collapsed || mobile) && path === "/notifications" && (
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
          {(!collapsed || mobile) && (
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
            {(!collapsed || mobile) && (
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
              ref={menuRef}
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <button
              className="icon-btn collapse-btn"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
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
            <div className="quick-create" ref={quickRef}>
              <Button onClick={() => setQuick(!quick)}>
                <Plus size={17} />
                <span>Create</span>
              </Button>
              {quick && (
                <div className="dropdown" id="quick-create-options"><small className="ca-dropdown-label">CREATE SOMETHING GREAT</small>
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
                      <Plus size={16} /> New {t.replace(/s$/, "")}
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
              {(data.notifications || []).some((n) => n.status === "Unread") && <i />}
            </Link>
            <Avatar name={user.name} />
          </div>
        </header>
        <main id="workspace-content" tabIndex={-1}>
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
          creative-crew{" "}
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
              placeholder="Search workspace pages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="command-results">
            {all
              .filter(
                (i) =>
                  isAllowed(String(i[1])) &&
                  String(i[0]).toLowerCase().includes(query.trim().toLowerCase()),
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
            {!all.some((i) => isAllowed(String(i[1])) && String(i[0]).toLowerCase().includes(query.trim().toLowerCase())) && (
              <p className="ca-search-empty">No pages found. Try “tasks”, “files” or “calendar”.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

const shellStyles = `
.ca-shell{--ca-blue:#2563eb;--ca-ink:#183153;--ca-muted:#7c8fab;--ca-line:#e5ecf7;display:block!important;min-height:100dvh;background:#f6f8fd;color:var(--ca-ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.ca-shell,.ca-shell *{box-sizing:border-box}
.ca-shell button,.ca-shell a{-webkit-tap-highlight-color:transparent}
.ca-shell button{cursor:pointer;font-family:inherit}
.ca-shell a{text-decoration:none}
.ca-shell :is(button,a,input):focus-visible{outline:3px solid #60a5fa;outline-offset:4px}
.ca-shell .ca-skip{position:fixed;top:-80px;left:16px;z-index:2000;padding:12px 20px;background:#fff;border-radius:12px;color:var(--ca-blue)}
.ca-shell .ca-skip:focus{top:12px}
.ca-shell .sidebar{position:fixed!important;inset:0 auto 0 0;width:264px!important;height:100dvh;display:flex;flex-direction:column;padding:24px 14px 16px;background:linear-gradient(165deg,#fff 65%,#f5f8ff);border-right:1px solid var(--ca-line);z-index:60;box-shadow:8px 0 40px #18315303;transition:width .25s ease,transform .25s ease}
.ca-shell .brand{display:flex;align-items:center;gap:12px;min-height:48px;margin:0 8px 23px;color:var(--ca-ink);font-size:17px;font-weight:800;letter-spacing:-.5px}
.ca-shell .brand>div{min-width:0}.ca-shell .brand small{display:block;font-size:8px;font-weight:700;letter-spacing:2px;color:#8b9fc3;margin-top:6px}
.ca-shell .brand-icon{width:43px;height:43px;flex-shrink:0;display:grid;place-items:center;color:#fff;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#2456e8);box-shadow:0 8px 18px #2563eb35,inset 0 1px 0 #ffffff50}
.ca-shell .workspace-switch{display:flex;align-items:center;gap:11px;margin:0 4px 20px;padding:13px 12px;border:1px solid #e2eafa;border-radius:15px;background:linear-gradient(115deg,#f2f6ff,#fff);min-height:66px}
.ca-shell .workspace-switch>.avatar{width:36px;height:36px;border-radius:12px;background:#e3eaff;color:#3865cb;display:grid;place-items:center;font-size:11px;font-weight:800;flex-shrink:0}
.ca-shell .workspace-switch strong{font-size:12px}.ca-shell .workspace-switch small{display:block;margin-top:5px;font-size:10px;color:var(--ca-muted)}
.ca-shell .sidebar nav{overflow-y:auto;overflow-x:hidden;flex:1;min-height:0;padding:0 3px;scrollbar-width:thin;scrollbar-color:#dce5f6 transparent;overscroll-behavior:contain}
.ca-shell .sidebar nav section{margin-bottom:21px}.ca-shell .sidebar nav h4{font-size:9px;letter-spacing:1.8px;color:#94a5bf;font-weight:700;margin:8px 13px 10px}
.ca-shell .sidebar nav a{position:relative;display:flex;align-items:center;gap:13px;min-height:44px;margin:4px 0;padding:11px 13px;border:1px solid transparent;border-radius:12px;color:#7185a5;font-size:12px;font-weight:500;transition:background .18s,color .18s,transform .18s}
.ca-shell .sidebar nav a svg{flex-shrink:0;stroke-width:1.8}.ca-shell .sidebar nav a:hover{background:#f0f5ff;color:#2563eb;transform:translateX(2px)}
.ca-shell .sidebar nav a.active{color:#2563eb;background:linear-gradient(100deg,#eaf1ff,#f2f6ff);border-color:#e0eaff;font-weight:700}
.ca-shell .sidebar nav a.active:before{content:"";position:absolute;left:0;top:13px;bottom:13px;width:3px;background:#2563eb;border-radius:5px}
.ca-shell .sidebar nav a small{margin-left:auto;min-width:22px;padding:3px 5px;text-align:center;border-radius:7px;color:#2563eb;background:#e1eaff;font-size:10px}
.ca-shell .sidebar-footer{flex-shrink:0;padding:12px 4px 0;border-top:1px solid var(--ca-line);margin-top:8px}
.ca-shell .help-card{padding:16px 13px;margin-bottom:12px;border:1px solid #e7efff;border-radius:14px;background:radial-gradient(ellipse at 100% 0,#e4efff,transparent 75%),#f6f9ff}
.ca-shell .help-card strong{font-size:11px;display:block;line-height:1.6}.ca-shell .help-card a{display:flex;justify-content:space-between;margin-top:9px;color:#2563eb;font-size:10px}
.ca-shell .profile-button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 6px;border:0;background:transparent;border-radius:12px;text-align:left;color:var(--ca-ink)}
.ca-shell .profile-button:hover{background:#edf3ff}.ca-shell .profile-button>div{min-width:0;flex:1}.ca-shell .profile-button strong{display:block;max-width:135px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
.ca-shell .profile-button small{display:block;color:var(--ca-muted);font-size:10px;margin-top:4px;text-transform:capitalize}.ca-shell .profile-button>svg{flex-shrink:0;color:#8fa3c4}
.ca-shell .main{margin-left:264px!important;width:calc(100% - 264px)!important;min-height:100dvh;display:flex;flex-direction:column;transition:margin-left .25s,width .25s}
.ca-shell .main>header{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:16px;height:84px;min-height:84px;padding:0 32px;background:#ffffffdf;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-bottom:1px solid var(--ca-line)}
.ca-shell .main>header>.flex{display:flex;align-items:center;gap:14px;min-width:0}.ca-shell .breadcrumb{display:flex;align-items:center;gap:14px;font-size:11px;color:#94a3be;white-space:nowrap}.ca-shell .breadcrumb strong{font-weight:600;color:#4f678c;max-width:190px;overflow:hidden;text-overflow:ellipsis}
.ca-shell .icon-btn{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:40px;height:40px;border:1px solid transparent;border-radius:12px;background:transparent;color:#8397b7;transition:background .2s,color .2s}
.ca-shell .icon-btn:hover{background:#eff4ff;color:#2563eb}.ca-shell.collapsed .collapse-btn svg{transform:rotate(180deg)}
.ca-shell .header-actions{display:flex;align-items:center;gap:14px}.ca-shell .header-search{height:40px;display:flex;align-items:center;gap:10px;background:#f7f9fe;border:1px solid #e9effa;border-radius:12px;padding:0 13px;color:#91a2be;font-size:10px;transition:border-color .2s}
.ca-shell .header-search:hover{border-color:#b8cffe}.ca-shell .header-search kbd{margin-left:14px;padding:3px 5px;border:1px solid #e1e8f5;border-radius:5px;font:10px inherit;color:#879bbd}
.ca-shell .quick-create{position:relative}.ca-shell .quick-create>button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 18px;border:1px solid #3c75f1;border-radius:12px;background:linear-gradient(140deg,#3477f6,#255be9);box-shadow:0 5px 13px #2563eb22,inset 0 1px 0 #ffffff30;color:white;font-size:12px;font-weight:600;transition:transform .2s,box-shadow .2s}
.ca-shell .quick-create>button:hover{transform:translateY(-2px);box-shadow:0 8px 20px #2563eb33}
.ca-shell .dropdown{position:absolute;top:calc(100% + 12px);right:0;width:235px;padding:8px;display:flex;flex-direction:column;background:#fff;border:1px solid #e4ecfa;border-radius:16px;box-shadow:0 18px 50px #18315320;z-index:90;animation:ca-pop .18s ease-out}
.ca-shell .ca-dropdown-label{padding:11px 10px;color:#91a3bf;letter-spacing:1px;font-size:8px;font-weight:700}
.ca-shell .dropdown button{display:flex;align-items:center;gap:10px;padding:12px;border:0;border-radius:10px;background:transparent;color:#526b90;font-size:12px;text-align:left;text-transform:capitalize}.ca-shell .dropdown button:hover{background:#edf4ff;color:#2563eb}
.ca-shell .notification-bell{position:relative}.ca-shell .notification-bell i{position:absolute;width:6px;height:6px;top:7px;right:9px;background:#3b82f6;border:2px solid #fff;border-radius:50%;box-sizing:content-box}
.ca-shell .main>main{flex:1;width:100%;min-width:0;padding:26px 32px 38px;outline:none}.ca-shell .demo-notice{display:flex;align-items:center;gap:8px;font-size:10px;line-height:1.7;color:#8198bd;margin-bottom:24px;padding:9px 12px;background:#edf3ff88;border:1px solid #e7eefc;border-radius:10px;width:fit-content;max-width:100%}
.ca-shell .demo-notice .dot{width:6px;height:6px;flex-shrink:0;background:#60a5fa;border-radius:50%}.ca-shell .main>footer{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:19px 32px;border-top:1px solid #e8eef8;color:#6983ac;font-size:11px;background:#ffffff60}.ca-shell .main>footer span{color:#99abc4;font-size:10px}
.ca-shell.collapsed .sidebar{width:84px!important;padding-left:10px;padding-right:10px}.ca-shell.collapsed .main{margin-left:84px!important;width:calc(100% - 84px)!important}.ca-shell.collapsed .brand{margin:0 auto 23px}.ca-shell.collapsed .workspace-switch{padding:10px;justify-content:center;margin-left:0;margin-right:0}.ca-shell.collapsed .sidebar nav a{justify-content:center;padding:12px}.ca-shell.collapsed .profile-button{justify-content:center}.ca-shell.collapsed .profile-button>svg{display:none}
.ca-shell .mobile-menu,.ca-shell .ca-mobile-close{display:none}.ca-shell .sidebar-backdrop{position:fixed;inset:0;width:100%;height:100%;z-index:55;border:0;background:#10244466;backdrop-filter:blur(4px)}
.ca-shell .search{display:flex;align-items:center;gap:10px;border:1px solid #dce7fa;border-radius:12px;padding:12px;color:#7f98bf;background:#f7faff}.ca-shell .search input{width:100%;min-width:0;border:0;background:transparent;outline:none;color:#183153;font-size:14px}.ca-shell .command-results{max-height:55dvh;overflow-y:auto;margin-top:12px;display:grid;gap:5px}.ca-shell .command-results a{display:flex;align-items:center;gap:12px;padding:13px;border-radius:10px;color:#536e95;font-size:13px}.ca-shell .command-results a:hover{color:#2563eb;background:#eff5ff}.ca-shell .ca-search-empty{padding:20px 12px;font-size:13px;color:#8298b9}
@keyframes ca-pop{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
@media(min-width:1440px){.ca-shell .main>main{padding:32px 44px 44px}.ca-shell .main>header{padding:0 44px}}
@media(max-width:1100px){.ca-shell .header-search span,.ca-shell .header-search kbd{display:none}.ca-shell .header-search{width:40px;padding:0;justify-content:center}.ca-shell .main>header{padding:0 22px}.ca-shell .main>main{padding:24px 22px 32px}.ca-shell .header-actions{gap:9px}}
@media(max-width:900px){.ca-shell .sidebar,.ca-shell.collapsed .sidebar{width:272px!important;max-width:calc(100vw - 40px);transform:translateX(-105%);padding:24px 14px 16px}.ca-shell .sidebar.open{transform:translateX(0)}.ca-shell .main,.ca-shell.collapsed .main{margin-left:0!important;width:100%!important}.ca-shell .mobile-menu{display:inline-flex}.ca-shell .collapse-btn{display:none}.ca-shell .ca-mobile-close{display:flex;position:absolute;right:8px;top:5px;width:28px;height:28px;background:#f0f5ff}.ca-shell.collapsed .brand{margin:0 8px 23px}.ca-shell.collapsed .workspace-switch{justify-content:flex-start;padding:13px 12px;margin:0 4px 20px}.ca-shell.collapsed .sidebar nav a{justify-content:flex-start;padding:11px 13px}.ca-shell.collapsed .profile-button{justify-content:flex-start}.ca-shell.collapsed .profile-button>svg{display:block}.ca-shell .main>header{height:72px;min-height:72px}.ca-shell .main>footer{padding:18px 22px}.ca-shell .main>header>.flex{gap:8px}}
@media(max-width:600px){.ca-shell .main>header{padding:0 12px;gap:7px;height:66px;min-height:66px}.ca-shell .breadcrumb{font-size:12px;gap:0}.ca-shell .breadcrumb>span{display:none}.ca-shell .breadcrumb{font-size:0}.ca-shell .breadcrumb strong{font-size:12px;max-width:125px}.ca-shell .header-actions{gap:3px}.ca-shell .header-actions>.avatar{display:none}.ca-shell .header-search,.ca-shell .icon-btn{width:36px;height:36px}.ca-shell .quick-create>button{min-height:36px;padding:0 10px;border-radius:10px;font-size:11px}.ca-shell .quick-create>button svg{width:15px}.ca-shell .main>main{padding:18px 14px 26px}.ca-shell .demo-notice{font-size:9px;margin-bottom:18px;align-items:flex-start}.ca-shell .demo-notice .dot{margin-top:5px}.ca-shell .main>footer{padding:17px 14px;flex-direction:column;align-items:flex-start;gap:6px}.ca-shell .dropdown{position:fixed;top:60px;right:12px;max-width:calc(100vw - 24px)} }
@media(prefers-reduced-motion:reduce){.ca-shell *,.ca-shell *:before,.ca-shell *:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
`;
