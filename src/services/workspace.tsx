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

function isAdmin(user: User): boolean {
  return ["admin", "super_admin"].includes(user.role);
}

function storageKey(uid: string): string {
  return `ca-firebase-data:${uid}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(cause: unknown): string {
  if (cause instanceof FirebaseError) {
    const messages: Record<string, string> = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/user-not-found": "Incorrect email or password.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/too-many-requests":
        "Too many attempts. Please try again later.",
      "auth/network-request-failed":
        "Check your internet connection and try again.",
      "auth/operation-not-allowed":
        "Enable Email/Password login in Firebase Authentication.",
      "auth/unauthorized-domain":
        "Add this domain to Firebase authorized domains.",
    };

    return messages[cause.code] ?? `Authentication failed (${cause.code}).`;
  }

  if (cause instanceof DOMException) {
    if (
      cause.name === "QuotaExceededError" ||
      cause.name === "NS_ERROR_DOM_QUOTA_REACHED"
    ) {
      return "Browser storage is full. Your changes were not saved.";
    }

    if (cause.name === "SecurityError") {
      return "Browser storage is unavailable. Check your browser settings.";
    }
  }

  if (cause instanceof SyntaxError) {
    return "Saved workspace data cannot be read. Existing storage was preserved.";
  }

  return cause instanceof Error
    ? cause.message
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

function createProfile(firebaseUser: FirebaseUser): User {
  const employee = demoUsers.find(
    (candidate) => !isAdmin(candidate) && candidate.role !== "leader",
  );

  if (!employee) {
    throw new Error("An employee profile template is missing in seed.ts.");
  }

  return {
    ...employee,
    id: firebaseUser.uid,
    name:
      firebaseUser.displayName?.trim() ||
      firebaseUser.email?.split("@")[0] ||
      "Workspace member",
    email: firebaseUser.email ?? "",
    active: true,
    team_id: "",
  } as User;
}

function validateTable(table: string): void {
  if (!allowedTables.has(table)) {
    throw new Error(`Unknown workspace table: ${table}`);
  }
}

function createActivity(
  user: User,
  action: string,
  table: string,
  details: unknown,
): Entity {
  return {
    id: crypto.randomUUID(),
    name: `${user.name} ${action} ${table}`,
    status: "Recorded",
    owner_id: user.id,
    created_at: new Date().toISOString(),
    description: JSON.stringify(details),
  } as Entity;
}

export function Provider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    user: null,
    data: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const snapshotRef = useRef(snapshot);
  const mountedRef = useRef(false);
  const authBusyRef = useRef(false);
  const operationVersionRef = useRef(0);

  const publish = useCallback((next: Snapshot) => {
    snapshotRef.current = next;

    if (mountedRef.current) {
      setSnapshot(next);
    }
  }, []);

  const reportError = useCallback((cause: unknown): Error => {
    const message = getErrorMessage(cause);

    if (mountedRef.current) setError(message);

    return new Error(message);
  }, []);

  const clearWorkspace = useCallback(() => {
    publish({ user: null, data: {} });
  }, [publish]);

  const loadWorkspace = useCallback(
    (firebaseUser: FirebaseUser) => {
      const profile = createProfile(firebaseUser);
      const records = readData(firebaseUser.uid);

      if (auth.currentUser?.uid !== firebaseUser.uid) return;

      publish({ user: profile, data: records });

      if (mountedRef.current) setError("");
    },
    [publish],
  );

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (!active) return;

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
          if (active && !authBusyRef.current) setLoading(false);
        }
      },
      (cause) => {
        if (!active) return;

        clearWorkspace();
        reportError(cause);
        setLoading(false);
      },
    );

    const handleStorage = (event: StorageEvent) => {
      if (!active) return;

      try {
        const firebaseUser = auth.currentUser;

        if (
          !firebaseUser ||
          event.storageArea !== window.localStorage ||
          (event.key !== null &&
            event.key !== storageKey(firebaseUser.uid))
        ) {
          return;
        }

        loadWorkspace(firebaseUser);
      } catch (cause) {
        reportError(cause);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      active = false;
      mountedRef.current = false;
      operationVersionRef.current += 1;
      authBusyRef.current = false;
      unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, [clearWorkspace, loadWorkspace, reportError]);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      if (authBusyRef.current) {
        throw reportError(
          new Error("Another authentication request is in progress."),
        );
      }

      const cleanEmail = email.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw reportError(new Error("Please enter a valid email address."));
      }

      if (!password) {
        throw reportError(new Error("Please enter your password."));
      }

      authBusyRef.current = true;
      const version = ++operationVersionRef.current;

      if (mountedRef.current) {
        setError("");
        setLoading(true);
      }

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password,
        );

        if (
          mountedRef.current &&
          operationVersionRef.current === version
        ) {
          loadWorkspace(credential.user);
        }
      } catch (cause) {
        if (operationVersionRef.current !== version) {
          throw new Error(getErrorMessage(cause));
        }

        throw reportError(cause);
      } finally {
        if (operationVersionRef.current === version) {
          authBusyRef.current = false;
          if (mountedRef.current) setLoading(false);
        }
      }
    },
    [loadWorkspace, reportError],
  );

  const logout = useCallback(async (): Promise<void> => {
    if (authBusyRef.current) {
      throw reportError(
        new Error("Another authentication request is in progress."),
      );
    }

    authBusyRef.current = true;
    const version = ++operationVersionRef.current;

    if (mountedRef.current) {
      setError("");
      setLoading(true);
    }

    try {
      await signOut(auth);

      if (operationVersionRef.current === version) {
        clearWorkspace();
      }
    } catch (cause) {
      if (operationVersionRef.current !== version) {
        throw new Error(getErrorMessage(cause));
      }

      throw reportError(cause);
    } finally {
      if (operationVersionRef.current === version) {
        authBusyRef.current = false;
        if (mountedRef.current) setLoading(false);
      }
    }
  }, [clearWorkspace, reportError]);

  const demo = useCallback((_id: string): void => {
    if (mountedRef.current) {
      setError("Demo login is disabled. Use your Firebase account.");
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    if (authBusyRef.current) {
      throw reportError(
        new Error("Wait for the authentication request to finish."),
      );
    }

    if (mountedRef.current) setLoading(true);

    try {
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        loadWorkspace(firebaseUser);
      } else {
        clearWorkspace();
        if (mountedRef.current) setError("");
      }
    } catch (cause) {
      throw reportError(cause);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [clearWorkspace, loadWorkspace, reportError]);

  const requireUser = useCallback((): User => {
    const currentUser = snapshotRef.current.user;

    if (
      authBusyRef.current ||
      !currentUser ||
      auth.currentUser?.uid !== currentUser.id
    ) {
      throw new Error("Please sign in before changing workspace data.");
    }

    return currentUser;
  }, []);

  const persist = useCallback(
    (next: WorkspaceData, currentUser: User): void => {
      if (auth.currentUser?.uid !== currentUser.id) {
        throw new Error("Your session changed. Please sign in again.");
      }

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
    async (table: string, row: Partial<Entity>): Promise<void> => {
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
        const rows = currentData[table] ?? [];
        const existing = rows.find((item) => item.id === id);

        const updates = Object.fromEntries(
          Object.entries(row).filter(([, value]) => value !== undefined),
        );

        const fields: Record<string, unknown> = {
          team_id: currentUser.team_id,
          ...existing,
          ...updates,
          owner_id: existing?.owner_id || currentUser.id,
          created_at: existing?.created_at || new Date().toISOString(),
        };

        for (const field of ["assignee", "project_id", "client_id"]) {
          if (fields[field] === "") fields[field] = null;
        }

        const record = {
          ...fields,
          id,
        } as Entity;

        const next: WorkspaceData = {
          ...currentData,
          [table]: existing
            ? rows.map((item) => (item.id === id ? record : item))
            : [record, ...rows],
        };

        if (
          table !== "activity_logs" &&
          allowedTables.has("activity_logs")
        ) {
          next.activity_logs = [
            createActivity(
              currentUser,
              existing ? "updated" : "created",
              table,
              { before: existing, after: record },
            ),
            ...(next.activity_logs ?? []),
          ];
        }

        if (table === "tasks" && allowedTables.has("notifications")) {
          const notification = {
            id: crypto.randomUUID(),
            name: `${String(fields.name || "Task")} · ${String(
              fields.status || "Updated",
            )}`,
            status: "Unread",
            assignee: fields.assignee ?? null,
            owner_id: currentUser.id,
            created_at: new Date().toISOString(),
          } as Entity;

          next.notifications = [
            notification,
            ...(next.notifications ?? []),
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
    async (table: string, id: string): Promise<void> => {
      try {
        const currentUser = requireUser();
        validateTable(table);

        if (typeof id !== "string" || !id.trim()) {
          throw new Error("The record ID is invalid.");
        }

        const currentData = readData(currentUser.id);
        const rows = currentData[table] ?? [];
        const existing = rows.find((item) => item.id === id);

        if (!existing) {
          if (mountedRef.current) setError("");
          return;
        }

        const next: WorkspaceData = {
          ...currentData,
          [table]: rows.filter((item) => item.id !== id),
        };

        if (
          table !== "activity_logs" &&
          allowedTables.has("activity_logs")
        ) {
          next.activity_logs = [
            createActivity(currentUser, "deleted", table, {
              before: existing,
            }),
            ...(next.activity_logs ?? []),
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

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  );
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
  if (isAdmin(user)) return rows;

  return rows.filter(
    (row) =>
      row.assignee === user.id ||
      row.owner_id === user.id ||
      (user.role === "leader" &&
        user.team_id != null &&
        row.team_id === user.team_id),
  );
}