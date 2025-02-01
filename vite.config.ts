import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type"],
    },
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "./localhost-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "./localhost.pem")),
    },
  },
});
