import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { seed, demoUsers } from "../lib/seed";
import type { Entity, User } from "../types";
type Store = {
  user: User | null;
  data: Record<string, Entity[]>;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  demo: (id: string) => void;
  logout: () => Promise<void>;
  save: (table: string, row: Partial<Entity>) => Promise<void>;
  remove: (table: string, id: string) => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<Store>(null!);
const tables = Object.keys(seed());
export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    supabase ? null : JSON.parse(sessionStorage.getItem("ca-user") || "null"),
  );
  const [data, setData] = useState<Record<string, Entity[]>>(() =>
    supabase
      ? {}
      : JSON.parse(localStorage.getItem("ca-data") || "null") || seed(),
  );
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState("");
  async function refresh() {
    if (!supabase) return;
    setLoading(true);
    try {
      const {
        data: { user: auth },
      } = await supabase.auth.getUser();
      if (!auth) {
        setUser(null);
        return;
      }
      const { data: profile, error: e } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.id)
        .single();
      if (e || !profile?.active)
        throw Error(
          "Account inactive or profile missing. Contact your administrator.",
        );
      setUser(profile);
      const result: Record<string, Entity[]> = {};
      for (const table of tables) {
        if (
          [
            "payroll",
            "expenses",
            "invoices",
            "settings",
            "clients",
            "activity_logs",
            "automations",
          ].includes(table) &&
          !["admin", "super_admin"].includes(profile.role)
        )
          continue;
        const { data: rows, error } = await supabase
          .from(table)
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw Error(table + ": " + error.message);
        result[table] = rows || [];
      }
      setData(result);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    const subscription = supabase?.auth.onAuthStateChange(() =>
      setTimeout(refresh, 0),
    );
    const channel = supabase
      ?.channel("workspace")
      .on("postgres_changes", { event: "*", schema: "public" }, () => refresh())
      .subscribe();
    return () => {
      subscription?.data.subscription.unsubscribe();
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    if (!supabase) localStorage.setItem("ca-data", JSON.stringify(data));
  }, [data]);
  async function login(email: string, password: string) {
    if (!supabase)
      throw Error("Use a demo role below, or configure Supabase to sign in.");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    await refresh();
  }
  function demo(id: string) {
    const u = demoUsers.find((x) => x.id === id)!;
    setUser(u);
    sessionStorage.setItem("ca-user", JSON.stringify(u));
  }
  async function logout() {
    await supabase?.auth.signOut();
    sessionStorage.removeItem("ca-user");
    setUser(null);
  }
  async function save(table: string, row: Partial<Entity>) {
    const id = row.id || crypto.randomUUID();
    const existing = (data[table] || []).find((x) => x.id === id);
    const full: Record<string, unknown> = {
      team_id: user?.team_id,
      ...existing,
      ...row,
      id,
      owner_id: existing?.owner_id || user?.id,
      created_at: existing?.created_at || new Date().toISOString(),
    };
    for (const k of ["assignee", "project_id", "client_id"])
      if (full[k] === "") full[k] = null;
    if (supabase) {
      const { error } = await supabase.from(table).upsert(full);
      if (error) throw error;
      await refresh();
    } else {
      setData((old) => ({
        ...old,
        [table]: existing
          ? (old[table] || []).map((x) => (x.id === id ? (full as Entity) : x))
          : [full as Entity, ...(old[table] || [])],
        activity_logs: [
          {
            id: crypto.randomUUID(),
            name:
              user?.name +
              " " +
              (existing ? "updated" : "created") +
              " " +
              table,
            status: "Recorded",
            description: JSON.stringify({ before: existing, after: full }),
            created_at: new Date().toISOString(),
          },
          ...(old.activity_logs || []),
        ],
        notifications:
          table === "tasks"
            ? [
                {
                  id: crypto.randomUUID(),
                  name: full.name + " · " + full.status,
                  status: "Unread",
                  assignee: full.assignee as string,
                  created_at: new Date().toISOString(),
                },
                ...(old.notifications || []),
              ]
            : old.notifications || [],
      }));
    }
  }
  async function remove(table: string, id: string) {
    if (supabase) {
      if (table === "employees") {
        const { error } = await supabase
          .from("employees")
          .update({ status: "Inactive" })
          .eq("id", id);
        if (error) throw error;
      }
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      await refresh();
    } else
      setData((old) => ({
        ...old,
        [table]: (old[table] || []).filter((x) => x.id !== id),
        activity_logs: [
          {
            id: crypto.randomUUID(),
            name: user?.name + " deleted " + table + " " + id,
            status: "Recorded",
          },
          ...(old.activity_logs || []),
        ],
      }));
  }
  return (
    <Context.Provider
      value={{
        user,
        data,
        loading,
        error,
        login,
        demo,
        logout,
        save,
        remove,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useWorkspace = () => useContext(Context);
export function scoped(rows: Entity[], user: User | null) {
  if (!user) return [];
  if (["admin", "super_admin"].includes(user.role)) return rows;
  return rows.filter(
    (r) =>
      r.assignee === user.id ||
      r.owner_id === user.id ||
      (user.role === "leader" && r.team_id === user.team_id),
  );
}
