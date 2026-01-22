import { defineStore } from "pinia";
import { apiLogin, apiRegister } from "../api/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user") || "null"),
    loading: false,
    error: null,
  }),

  getters: {
    isLoggedIn: (s) => !!s.token,
    roles: (s) => s.user?.roles || [],
    isAdmin: (s) => (s.user?.roles || []).includes("admin"),
    userId: (s) => s.user?.id || s.user?.userId || null,
    email: (s) => s.user?.email || null,
  },

  actions: {
    _setSession(token, user) {
      this.token = token;
      this.user = user;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    clearError() {
      this.error = null;
    },

    logout() {
      this.token = null;
      this.user = null;
      this.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    async login(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await apiLogin(payload);
        this._setSession(res.data.token, res.data.user);
        return res.data;
      } catch (err) {
        this.error = err.normalizedMessage || "Login failed";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(payload) {
      this.loading = true;
      this.error = null;
      try {
        const res = await apiRegister(payload);
        this._setSession(res.data.token, res.data.user);
        return res.data;
      } catch (err) {
        this.error = err.normalizedMessage || "Register failed";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
