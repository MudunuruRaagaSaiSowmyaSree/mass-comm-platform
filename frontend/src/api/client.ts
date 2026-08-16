import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("access_token", token);
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
    localStorage.removeItem("access_token");
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("access_token");
}

// Restore token automatically when the app starts/reloads
const savedToken = localStorage.getItem("access_token");

if (savedToken) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}