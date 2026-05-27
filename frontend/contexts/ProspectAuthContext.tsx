"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import {
  prospectLogin,
  prospectLogout,
  prospectMe,
  prospectRegister,
  getProspectToken,
  type ProspectUser,
} from "@/lib/api/prospect-auth";

type ProspectCtx = {
  prospect: ProspectUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ProspectCtx | undefined>(undefined);

export function ProspectAuthProvider({ children }: { children: ReactNode }) {
  const [prospect, setProspect] = useState<ProspectUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getProspectToken()) {
      setProspect(null);
      return;
    }
    const res = await prospectMe();
    if ("error" in res) {
      setProspect(null);
      return;
    }
    setProspect(res);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await prospectLogin(email, password);
    if ("error" in res) throw new Error(res.error);
    flushSync(() => setProspect(res.user));
  }, []);

  const register = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const res = await prospectRegister(input);
      if ("error" in res) throw new Error(res.error);
      flushSync(() => setProspect(res.user));
    },
    [],
  );

  const logout = useCallback(async () => {
    await prospectLogout();
    setProspect(null);
  }, []);

  return (
    <Ctx.Provider value={{ prospect, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProspectAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProspectAuth must be used inside ProspectAuthProvider");
  return ctx;
}
