
import axios from "axios";

const API = axios.create({
  baseURL: "https://ryvo-jiw6.vercel.app/api",
});

// Attach the logged-in user's token to protected API requests.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ryvo_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
