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
    
    window.FB.AppEvents.logPageView();
  } else {
    console.error('Facebook App ID not configured. Set VITE_FACEBOOK_APP_ID environment variable.');
  }
};

// Load Facebook SDK asynchronously
(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

createRoot(document.getElementById("root")!).render(<App />);
