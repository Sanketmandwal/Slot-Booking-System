import axios from "axios";

// When deploying to Vercel/Render, replace this with your actual backend URL.
// Example: const BASE_URL = "https://your-backend-app.onrender.com/api";
const BASE_URL = "/api"; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials: true, // uncomment if you need to send cookies across domains
});

export default api;
