"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  AdminApiError,
  clearAdminToken,
  fetchAdminMe,
  isAdminUser,
  loginAdmin,
  logoutAdmin,
  readAdminToken,
  writeAdminToken,
  type AdminUser,
} from "@/lib/adminApi";

export type AdminAuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "forbidden";

interface AdminAuthContextValue {
  status: AdminAuthStatus;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  expireSession: (reason?: "forbidden") => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminAuthStatus>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function validateSession() {
      await Promise.resolve();

      if (!active) {
        return;
      }

      const token = readAdminToken();

      if (!token) {
        setUser(null);
        setStatus("unauthenticated");
        return;
      }

      try {
        const response = await fetchAdminMe(token, controller.signal);

        if (!active) {
          return;
        }

        if (!isAdminUser(response.data.user)) {
          clearAdminToken();
          setUser(null);
          setStatus("forbidden");
          return;
        }

        setUser(response.data.user);
        setStatus("authenticated");
      } catch (error: unknown) {
        if (!active) {
          return;
        }

        setUser(null);

        if (error instanceof AdminApiError && error.status === 403) {
          clearAdminToken();
          setStatus("forbidden");
          return;
        }

        if (error instanceof AdminApiError && error.status === 401) {
          clearAdminToken();
          setStatus("unauthenticated");
          return;
        }

        // Gangguan jaringan tidak langsung menghapus token; pengguna bisa
        // mencoba lagi atau login ulang tanpa menyimpan sesi kedaluwarsa.
        setStatus("unauthenticated");
      }
    }

    void validateSession();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginAdmin(email, password);
    const nextUser = response.data.user;

    if (!isAdminUser(nextUser)) {
      void logoutAdmin(response.data.token).catch(() => undefined);
      throw new AdminApiError("Akun ini tidak memiliki akses admin.", 403);
    }

    if (!writeAdminToken(response.data.token)) {
      void logoutAdmin(response.data.token).catch(() => undefined);
      throw new AdminApiError(
        "Browser tidak mengizinkan penyimpanan sesi. Aktifkan penyimpanan sesi lalu coba lagi.",
        0,
      );
    }

    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    const token = readAdminToken();

    try {
      if (token) {
        await logoutAdmin(token);
      }
    } catch {
      // Token tetap dibersihkan dari sisi frontend walau server tidak merespons.
    } finally {
      clearAdminToken();
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const expireSession = useCallback((reason?: "forbidden") => {
    clearAdminToken();
    setUser(null);
    setStatus(reason === "forbidden" ? "forbidden" : "unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, login, logout, expireSession }),
    [status, user, login, logout, expireSession],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth harus dipakai di dalam AdminAuthProvider.");
  }

  return context;
}
