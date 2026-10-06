import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { api, loadToken, saveToken, setSignedOutHandler } from "./api";
import { queryClient } from "./query";
import { logOutPurchases } from "./purchases";

type Status = "loading" | "signedOut" | "signedIn";

type AuthValue = {
  status: Status;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<{ created: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    loadToken().then((t) => setStatus(t ? "signedIn" : "signedOut"));
    setSignedOutHandler(() => {
      queryClient.clear();
      setStatus("signedOut");
    });
  }, []);

  const requestCode = useCallback(async (email: string) => {
    await api("auth/code", { body: { email } });
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const res = await api<{ token: string; created: boolean }>("auth/verify", {
      body: { email, code, platform: Platform.OS, deviceName: Device.deviceName ?? Device.modelName ?? null },
    });
    await saveToken(res.token);
    queryClient.clear();
    setStatus("signedIn");
    return { created: res.created };
  }, []);

  const signOut = useCallback(async () => {
    await api("auth/signout", { body: {} }).catch(() => {});
    await logOutPurchases();
    await saveToken(null);
    queryClient.clear();
    setStatus("signedOut");
  }, []);

  const value = useMemo(() => ({ status, requestCode, verifyCode, signOut }), [status, requestCode, verifyCode, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
