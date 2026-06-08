// src/api/axios.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://marinecashbackend.onrender.com/api",
  timeout: 10000,
  headers: {
    "Cache-Control": "no-cache",
  },
});

// Wipe Content-Type from axios's internal default slots so they can never
// override the multipart/form-data boundary the browser needs to set itself.
delete API.defaults.headers.common["Content-Type"];
delete API.defaults.headers.post["Content-Type"];
delete API.defaults.headers.patch["Content-Type"];

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // For FormData, remove any Content-Type so the browser sets
    // multipart/form-data with the correct boundary automatically.
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
