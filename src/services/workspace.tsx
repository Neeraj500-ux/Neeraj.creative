import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../lib/firebase";
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

const Context = createContext<Store | undefined>(undefined);
const tableNames = Object.keys(seed());

function storageKey(uid: string) {
  return `ca-firebase-data:${uid}`;
}

function readData(uid: string): Record<string, Entity[]> {
  const saved = localStorage.getItem(storageKey(uid));

  if (!saved) return seed();

  const parsed: unknown = JSON.parse(saved);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved workspace data is invalid.");
  }

  const result = parsed as Record<string, Entity[]>;

  for (const table of tableNames) {
    if (result[table] !== undefined && !Array.isArray(result[table])) {
      throw new Error(`Saved ${table} data is invalid.`);
    }
  }

  return result;
}

function workspaceUser(firebaseUser: FirebaseUser): User {
  // Keep the existing User shape without granting administrator access.
  const employee = demoUsers.find(
    (candidate) =>
      !["admin", "super_admin", "leader"].includes(candidate.role),
  );

  if (!employee) {
    throw new Error("An employee profile template is missing in lib/seed.");
  }

  return {
    ...employee,
    id: firebaseUser.uid,
    name:
      firebaseUser.displayName ||
      firebaseUser.email?.split("@")[0] ||
      "Workspace member",
    email: firebaseUser.email || "",
    active: true,
    team_id: null,
  } as User;
}

export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Record<string, Entity[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const uidRef = useRef<string | null>(null);

  function clearWorkspace() {
    uidRef.current = null;
    setUser(null);
    setData({});
  }

  function loadWorkspace(firebaseUser: FirebaseUser) {
    const profile = workspaceUser(firebaseUser);
    const records = readData(firebaseUser.uid);

    uidRef.current = firebaseUser.uid;
    setUser(profile);
    setData(records);
    setError("");
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setLoading(true);

        try {
          if (firebaseUser) {
            loadWorkspace(firebaseUser);
          } else {
            clearWorkspace();
            setError("");
          }
        } catch (err) {
          clearWorkspace();
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your workspace.",
          );
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        clearWorkspace();
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  async function refresh() {
    setLoading(true);

    try {
      if (auth.currentUser) {
        loadWorkspace(auth.currentUser);
      } else {
        clearWorkspace();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to refresh workspace.",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    setError("");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      loadWorkspace(credential.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      throw err;
    }
  }

  function demo(_id: string) {
    setError("Demo login is disabled. Sign in with your Firebase account.");
  }

  async function logout() {
    try {
      await signOut(auth);
      clearWorkspace();
      sessionStorage.removeItem("ca-user");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
      throw err;
    }
  }

  function requireUser() {
    if (
      !user ||
      !auth.currentUser ||
      auth.currentUser.uid !== user.id ||
      uidRef.current !== user.id
    ) {
      throw new Error("Please sign in before changing workspace data.");
    }

    return user;
  }

  function checkTable(table: string) {
    if (!tableNames.includes(table)) {
      throw new Error(`Unknown workspace table: ${table}`);
    }
  }

  function persist(next: Record<string, Entity[]>, uid: string) {
    // Save first so storage errors do not silently discard changes.
    localStorage.setItem(storageKey(uid), JSON.stringify(next));
    setData(next);
  }

  async function save(table: string, row: Partial<Entity>) {
    try {
      const currentUser = requireUser();
      checkTable(table);

      const currentData = readData(currentUser.id);
      const id = row.id || crypto.randomUUID();
      const existing = (currentData[table] || []).find(
        (item) => item.id === id,
      );

      const full: Record<string, unknown> = {
        team_id: currentUser.team_id,
        ...existing,
        ...row,
        id,
        owner_id: existing?.owner_id || currentUser.id,
        created_at: existing?.created_at || new Date().toISOString(),
      };

      for (const field of ["assignee", "project_id", "client_id"]) {
        if (full[field] === "") full[field] = null;
      }

      const next: Record<string, Entity[]> = {
        ...currentData,
        [table]: existing
          ? (currentData[table] || []).map((item) =>
              item.id === id ? (full as Entity) : item,
            )
          : [full as Entity, ...(currentData[table] || [])],
      };

      const activity = {
        id: crypto.randomUUID(),
        name: `${currentUser.name} ${
          existing ? "updated" : "created"
        } ${table}`,
        status: "Recorded",
        description: JSON.stringify({ before: existing, after: full }),
        created_at: new Date().toISOString(),
      } as Entity;

      next.activity_logs = [
        activity,
        ...(next.activity_logs || []),
      ];

      if (table === "tasks") {
        const notification = {
          id: crypto.randomUUID(),
          name: `${full.name || "Task"} · ${full.status || "Updated"}`,
          status: "Unread",
          assignee: full.assignee,
          created_at: new Date().toISOString(),
        } as Entity;

        next.notifications = [
          notification,
          ...(next.notifications || []),
        ];
      }

      persist(next, currentUser.id);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save.");
      throw err;
    }
  }

  async function remove(table: string, id: string) {
    try {
      const currentUser = requireUser();
      checkTable(table);

      const currentData = readData(currentUser.id);

      const next: Record<string, Entity[]> = {
        ...currentData,
        [table]: (currentData[table] || []).filter(
          (item) => item.id !== id,
        ),
      };

      const activity = {
        id: crypto.randomUUID(),
        name: `${currentUser.name} deleted ${table} ${id}`,
        status: "Recorded",
        created_at: new Date().toISOString(),
      } as Entity;

      next.activity_logs = [
        activity,
        ...(next.activity_logs || []),
      ];

      persist(next, currentUser.id);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete.");
      throw err;
    }
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

export function useWorkspace() {
  const context = useContext(Context);

  if (!context) {
    throw new Error("useWorkspace must be used inside Provider.");
  }

  return context;
}

export function scoped(rows: Entity[], user: User | null) {
  if (!user) return [];

  if (["admin", "super_admin"].includes(user.role)) return rows;

  return rows.filter(
    (row) =>
      row.assignee === user.id ||
      row.owner_id === user.id ||
      (user.role === "leader" &&
        user.team_id != null &&
        row.team_id === user.team_id),
  );
}