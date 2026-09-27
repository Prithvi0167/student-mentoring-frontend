import { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [profileId, setProfileId] = useState(localStorage.getItem("profile_id"));

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, role, profile_id } = res.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("role", role);
    localStorage.setItem("profile_id", profile_id);

    setRole(role);
    setProfileId(profile_id);

    return role;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    localStorage.removeItem("profile_id");
    setRole(null);
    setProfileId(null);
  };

  const isAuthenticated = Boolean(localStorage.getItem("access_token"));

  return (
    <AuthContext.Provider value={{ role, profileId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
