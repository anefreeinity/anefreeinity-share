import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Buffer } from "buffer";
import Home from "./components/home.tsx";
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
  </StrictMode>
);
