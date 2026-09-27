import axios from "axios";

// Flask backend runs on 5000 by default (see run.py)
export const API_BASE_URL = "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every outgoing request, if we have one stored.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever says the token is invalid/expired, clear it out and
// bounce to login rather than leaving the app in a broken half-logged-in state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("profile_id");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
