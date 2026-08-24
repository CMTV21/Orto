import ReactDOM from "react-dom/client";
import { installStorageShim } from "./storage-shim.js";
import App from "./App.jsx";

// Must run before App.jsx's first render, since its boot effect calls
// window.storage.get() on mount.
installStorageShim();

// Deliberately not wrapped in React.StrictMode: the boot effect does async
// storage writes (creating the first design) with no guard against running
// twice concurrently, which StrictMode's dev-mode double-invoke would risk
// triggering. Doesn't affect the production build Cloudflare Pages serves.
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
