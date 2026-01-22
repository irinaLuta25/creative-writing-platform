import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors : null) ||
      err.message ||
      "Request failed";

    err.normalizedMessage = message;
    return Promise.reject(err);
  }
);

export default http;
