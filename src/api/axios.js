// src/api/axios.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://marinecashbackend.onrender.com/api",
  timeout: 10000,
  headers: {
    "Cache-Control": "no-cache",
  },
});

// Auto-attach token on every request.
// For FormData requests axios will automatically set Content-Type to
// multipart/form-data with the correct boundary. For JSON requests it
// defaults to application/json. Never force Content-Type here.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // If the body is FormData, delete any Content-Type override so the
    // browser can set multipart/form-data with the correct boundary itself.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.code === "ECONNABORTED" || !error.response) {
      console.warn("Network error or timeout:", error.message);
    } else if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } else {
      console.error("API Error:", error?.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
