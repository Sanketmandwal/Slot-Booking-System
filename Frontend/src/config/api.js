import axios from "axios";

const BASE_URL = "https://sbsbackend-6hnt.onrender.com/api"; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true,
});

export default api;
