import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider, useWorkspace } from "./services/workspace";
import AppShell, { adminPaths } from "./layouts/AppShell";
import Login from "./pages/Login";
import {
  Calendar,
  Workload,
  Attendance,
  Reports,
  Finance,
  Teams,
  Approvals,
} from "./pages/Operations";
import { ResetPassword } from "./pages/Settings";
import Files from "./pages/Files";
import "./style.css";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Records = lazy(() => import("./pages/Records"));
const Settings = lazy(() => import("./pages/Settings"));
function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useWorkspace();
  const path = useLocation().pathname;
  if (
    adminPaths.includes(path) &&
    !["admin", "super_admin"].includes(user?.role || "")
  )
    return (
      <div className="empty">
        <h1>403 — Access denied</h1>
        <p>This section is reserved for administrators.</p>
        <a className="btn" href="/">
          Go to dashboard
        </a>
      </div>
    );
  return children;
}
class Boundary extends React.Component<
  { children: React.ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Unable to open this page</h1>
        <p>{this.state.error}</p>
        <button className="btn" onClick={() => location.reload()}>
          Retry
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Boundary>
      <QueryClientProvider client={new QueryClient()}>
        <Provider>
          <BrowserRouter>
            <Suspense
              fallback={<div className="loading">Loading workspace…</div>}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route
                    path="/my-tasks"
                    element={<Records fixedTable="tasks" />}
                  />
                  <Route
                    path="/my-projects"
                    element={<Records fixedTable="projects" />}
                  />
                  {[
                    ["files", Files],
                    ["calendar", Calendar],
                    ["workload", Workload],
                    ["attendance", Attendance],
                    ["reports", Reports],
                    ["finance", Finance],
                    ["teams", Teams],
                    ["approvals", Approvals],
                    ["settings", Settings],
                  ].map(([path, Component]) => {
                    const C = Component as typeof Calendar;
                    return (
                      <Route
                        key={String(path)}
                        path={"/" + path}
                        element={
                          <Guard>
                            <C />
                          </Guard>
                        }
                      />
                    );
                  })}
                  {[
                    "projects",
                    "tasks",
                    "clients",
                    "employees",
                    "content_items",
                    "requests",
                    "documents",
                    "comments",
                    "payroll",
                    "expenses",
                    "notifications",
                    "automations",
                    "activity_logs",
                    "time_entries",
                  ].map((table) => (
                    <Route
                      key={table}
                      path={"/" + table}
                      element={
                        <Guard>
                          <Records key={table} fixedTable={table} />
                        </Guard>
                      }
                    />
                  ))}
                  <Route
                    path="*"
                    element={
                      <div className="empty">
                        <h1>404 — Page not found</h1>
                        <a className="btn" href="/">
                          Go to dashboard
                        </a>
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </Provider>
      </QueryClientProvider>
    </Boundary>
  </React.StrictMode>,
);
