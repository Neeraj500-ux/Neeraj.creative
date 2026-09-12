import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { seed, demoUsers } from "../lib/seed";
import type { Entity, User } from "../types";

type WorkspaceData = Record<string, Entity[]>;

type Store = {
  user: User | null;
  data: WorkspaceData;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  demo: (id: string) => void;
  logout: () => Promise<void>;
  save: (table: string, row: Partial<Entity>) => Promise<void>;
  remove: (table: string, id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

type Snapshot = {
  user: User | null;
  data: WorkspaceData;
};

const Context = createContext<Store | undefined>(undefined);

const allowedTables = new Set(Object.keys(seed()));
const adminRoles = new Set(["admin", "super_admin"]);

function storageKey(uid: string) {
  // Preserve data saved by the previous version.
  return `ca-firebase-data:${uid}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/user-not-found": "Incorrect email or password.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests":
        "Too many login attempts. Please try again later.",
      "auth/network-request-failed":
        "Check your internet connection and try again.",
      "auth/operation-not-allowed":
        "Enable Email/Password login in Firebase Authentication.",
      "auth/unauthorized-domain":
        "Add this website domain to Firebase authorized domains.",
    };

    return messages[error.code] || "Firebase authentication failed.";
  }

  if (
    error instanceof DOMException &&
    ["QuotaExceededError", "NS_ERROR_DOM_QUOTA_REACHED"].includes(
      error.name,
    )
  ) {
    return "Browser storage is full. Your change could not be saved.";
  }

  if (error instanceof DOMException && error.name === "SecurityError") {
    return "Browser storage is unavailable. Check your browser settings.";
  }

  if (error instanceof SyntaxError) {
    return "Saved workspace data is unreadable. Your saved data was preserved.";
  }

  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function readData(uid: string): WorkspaceData {
  const saved = window.localStorage.getItem(storageKey(uid));

  if (saved === null) return seed();

  const parsed: unknown = JSON.parse(saved);

  if (!isObject(parsed)) {
    throw new Error("Saved workspace data is invalid.");
  }

  const result: WorkspaceData = {};

  for (const table of allowedTables) {
    const rows = parsed[table];

    if (rows === undefined) {
      result[table] = [];
      continue;
    }

    if (!Array.isArray(rows)) {
      throw new Error(`Saved "${table}" data is invalid.`);
    }

    const ids = new Set<string>();

    for (const row of rows) {
      if (
        !isObject(row) ||
        typeof row.id !== "string" ||
        !row.id.trim() ||
        ids.has(row.id)
      ) {
        throw new Error(`Saved "${table}" contains an invalid record.`);
      }

      ids.add(row.id);
    }

    result[table] = rows as Entity[];
  }

  return result;
}

function workspaceUser(firebaseUser: FirebaseUser): User {
  // Use an employee template to preserve the existing project User shape.
  // Firebase accounts never receive admin access automatically.
  const employee = demoUsers.find(
    (candidate) =>
      !adminRoles.has(candidate.role) &&
      candidate.role !== "leader",
  );

  if (!employee) {
    throw new Error(
      "No employee profile template was found in src/lib/seed.ts.",
    );
  }

  return {
    ...employee,
    id: firebaseUser.uid,
    name:
      firebaseUser.displayName?.trim() ||
      firebaseUser.email?.split("@")[0] ||
      "Workspace member",
    email: firebaseUser.email || "",
    active: true,
    team_id: null,
  } as User;
}

function validateTable(table: string) {
  if (!allowedTables.has(table)) {
    throw new Error(`Unknown workspace table: ${table}`);
  }
}

function makeActivity(
  user: User,
  action: string,
  table: string,
  details?: unknown,
): Entity {
  return {
    id: crypto.randomUUID(),
    name: `${user.name} ${action} ${table}`,
    status: "Recorded",
    owner_id: user.id,
    created_at: new Date().toISOString(),
    ...(details === undefined
      ? {}
      : { description: JSON.stringify(details) }),
  } as Entity;
}

export function Provider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    user: null,
    data: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Refs keep consecutive mutations independent of React render timing.
  const snapshotRef = useRef<Snapshot>(snapshot);
  const mountedRef = useRef(false);
  const loginPendingRef = useRef(false);
  const logoutPendingRef = useRef(false);

  const publish = useCallback((next: Snapshot) => {
    snapshotRef.current = next;

    if (mountedRef.current) {
      setSnapshot(next);
    }
  }, []);

  const reportError = useCallback((cause: unknown) => {
    const message = errorMessage(cause);

    if (mountedRef.current) {
      setError(message);
    }

    return new Error(message);
  }, []);

  const clearWorkspace = useCallback(() => {
    publish({ user: null, data: {} });
  }, [publish]);

  const loadWorkspace = useCallback(
    (firebaseUser: FirebaseUser) => {
      const profile = workspaceUser(firebaseUser);
      const records = readData(firebaseUser.uid);

      // Never publish records for a session that has changed.
      if (auth.currentUser?.uid !== firebaseUser.uid) return;

      publish({ user: profile, data: records });

      if (mountedRef.current) {
        setError("");
      }
    },
    [publish],
  );

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!mountedRef.current) return;

        try {
          if (firebaseUser) {
            loadWorkspace(firebaseUser);
          } else {
            clearWorkspace();
            setError("");
          }
        } catch (cause) {
          clearWorkspace();
          reportError(cause);
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      },
      (cause) => {
        if (!mountedRef.current) return;

        clearWorkspace();
        reportError(cause);
        setLoading(false);
      },
    );

    // Sync workspace changes made in another tab of the same browser.
    function handleStorage(event: StorageEvent) {
      const firebaseUser = auth.currentUser;

      if (
        !firebaseUser ||
        event.storageArea !== window.localStorage ||
        (event.key !== null &&
          event.key !== storageKey(firebaseUser.uid))
      ) {
        return;
      }

      try {
        loadWorkspace(firebaseUser);
      } catch (cause) {
        // Preserve the current snapshot if external data is invalid.
        reportError(cause);
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      mountedRef.current = false;
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearWorkspace, loadWorkspace, reportError]);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
    }

    try {
      if (auth.currentUser) {
        loadWorkspace(auth.currentUser);
      } else {
        clearWorkspace();

        if (mountedRef.current) setError("");
      }
    } catch (cause) {
      throw reportError(cause);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearWorkspace, loadWorkspace, reportError]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (loginPendingRef.current || logoutPendingRef.current) {
        throw new Error("Another authentication request is in progress.");
      }

      const cleanEmail = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw reportError(new Error("Please enter a valid email address."));
      }

      if (!password) {
        throw reportError(new Error("Please enter your password."));
      }

      loginPendingRef.current = true;

      if (mountedRef.current) setError("");

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );

        if (mountedRef.current) {
          loadWorkspace(credential.user);
        }
      } catch (cause) {
        throw reportError(cause);
      } finally {
        loginPendingRef.current = false;
      }
    },
    [loadWorkspace, reportError],
  );

  const demo = useCallback((_id: string) => {
    if (mountedRef.current) {
      setError("Demo login is disabled. Use your Firebase account.");
    }
  }, []);

  const logout = useCallback(async () => {
    if (logoutPendingRef.current || loginPendingRef.current) {
      throw new Error("Another authentication request is in progress.");
    }

    logoutPendingRef.current = true;

    try {
      await signOut(auth);
      clearWorkspace();

      if (mountedRef.current) setError("");
    } catch (cause) {
      throw reportError(cause);
    } finally {
      logoutPendingRef.current = false;
    }
  }, [clearWorkspace, reportError]);

  const requireUser = useCallback((): User => {
    const currentUser = snapshotRef.current.user;

    if (
      logoutPendingRef.current ||
      !currentUser ||
      auth.currentUser?.uid !== currentUser.id
    ) {
      throw new Error("Please sign in before changing workspace data.");
    }

    return currentUser;
  }, []);

  const persist = useCallback(
    (next: WorkspaceData, currentUser: User) => {
      if (auth.currentUser?.uid !== currentUser.id) {
        throw new Error("Your session changed. Please sign in again.");
      }

      // Persist before updating the UI so a failed write stays visible.
      window.localStorage.setItem(
        storageKey(currentUser.id),
        JSON.stringify(next),
      );

      publish({ user: currentUser, data: next });

      if (mountedRef.current) setError("");
    },
    [publish],
  );

  const save = useCallback(
    async (table: string, row: Partial<Entity>) => {
      try {
        const currentUser = requireUser();
        validateTable(table);

        if (!isObject(row)) {
          throw new Error("The record must be an object.");
        }

        const id = row.id ?? crypto.randomUUID();

        if (typeof id !== "string" || !id.trim()) {
          throw new Error("The record ID is invalid.");
        }

        const currentData = readData(currentUser.id);
        const rows = currentData[table] || [];
        const existing = rows.find((item) => item.id === id);

        // Undefined values should not erase existing fields.
        const updates = Object.fromEntries(
          Object.entries(row).filter(([, value]) => value !== undefined),
        );

        const full: Record<string, unknown> = {
          team_id: currentUser.team_id,
          ...existing,
          ...updates,
          id,
          owner_id: existing?.owner_id || currentUser.id,
          created_at:
            existing?.created_at || new Date().toISOString(),
        };

        for (const field of ["assignee", "project_id", "client_id"]) {
          if (full[field] === "") full[field] = null;
        }

        const record = full as Entity;

        const next: WorkspaceData = {
          ...currentData,
          [table]: existing
            ? rows.map((item) => (item.id === id ? record : item))
            : [record, ...rows],
        };

        // Avoid generating audit entries for audit entries themselves.
        if (table !== "activity_logs" && allowedTables.has("activity_logs")) {
          next.activity_logs = [
            makeActivity(
              currentUser,
              existing ? "updated" : "created",
              table,
              { before: existing, after: record },
            ),
            ...(next.activity_logs || []),
          ];
        }

        if (table === "tasks" && allowedTables.has("notifications")) {
          const notification = {
            id: crypto.randomUUID(),
            name: `${full.name || "Task"} · ${
              full.status || "Updated"
            }`,
            status: "Unread",
            assignee: full.assignee ?? null,
            owner_id: currentUser.id,
            created_at: new Date().toISOString(),
          } as Entity;

          next.notifications = [
            notification,
            ...(next.notifications || []),
          ];
        }

        persist(next, currentUser);
      } catch (cause) {
        throw reportError(cause);
      }
    },
    [persist, reportError, requireUser],
  );

  const remove = useCallback(
    async (table: string, id: string) => {
      try {
        const currentUser = requireUser();
        validateTable(table);

        if (typeof id !== "string" || !id.trim()) {
          throw new Error("The record ID is invalid.");
        }

        const currentData = readData(currentUser.id);
        const rows = currentData[table] || [];
        const existing = rows.find((item) => item.id === id);

        // Missing records require no write or duplicate audit entry.
        if (!existing) return;

        const next: WorkspaceData = {
          ...currentData,
          [table]: rows.filter((item) => item.id !== id),
        };

        if (table !== "activity_logs" && allowedTables.has("activity_logs")) {
          next.activity_logs = [
            makeActivity(currentUser, "deleted", table, {
              before: existing,
            }),
            ...(next.activity_logs || []),
          ];
        }

        persist(next, currentUser);
      } catch (cause) {
        throw reportError(cause);
      }
    },
    [persist, reportError, requireUser],
  );

  const value = useMemo<Store>(
    () => ({
      user: snapshot.user,
      data: snapshot.data,
      loading,
      error,
      login,
      demo,
      logout,
      save,
      remove,
      refresh,
    }),
    [
      snapshot,
      loading,
      error,
      login,
      demo,
      logout,
      save,
      remove,
      refresh,
    ],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useWorkspace(): Store {
  const context = useContext(Context);

  if (!context) {
    throw new Error("useWorkspace must be used inside Provider.");
  }

  return context;
}

export function scoped(rows: Entity[], user: User | null): Entity[] {
  if (!user) return [];

  if (adminRoles.has(user.role)) return rows;

  return rows.filter(
    (row) =>
      row.assignee === user.id ||
      row.owner_id === user.id ||
      (user.role === "leader" &&
        user.team_id != null &&
        row.team_id === user.team_id),
  );
}