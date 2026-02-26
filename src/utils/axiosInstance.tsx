// utils/axiosInstance.ts
import axios from "axios";

const baseURL =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000` // usa la IP de tu PC
    : "http://localhost:3000"; // en SSR o node

const api = axios.create({ baseURL });

export default api;
