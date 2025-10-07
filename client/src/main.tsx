import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Facebook SDK
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

window.fbAsyncInit = function() {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  if (appId) {
    window.FB.init({
      appId: appId,
      cookie: true,
      xfbml: true,
      version: 'v21.0'
    });
  } else {
    console.error('Facebook App ID not configured. Set VITE_FACEBOOK_APP_ID environment variable.');
  }
};

createRoot(document.getElementById("root")!).render(<App />);
