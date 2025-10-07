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
    
    // Check login status on page load
    window.FB.getLoginStatus(async function(response: any) {
      if (response.status === 'connected') {
        // User is logged into Facebook and has authorized the app
        // Check if they're also logged into our app
        try {
          const userCheck = await fetch('/api/auth/user', {
            credentials: 'include',
          });
          
          if (userCheck.ok) {
            const userData = await userCheck.json();
            if (!userData.isAnonymous && window.location.pathname === '/login') {
              // User is logged in, redirect to dashboard
              window.location.href = '/';
            }
          } else if (window.location.pathname === '/login') {
            // Not logged into our app, but logged into Facebook
            // Auto-login with Facebook credentials
            window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo: any) => {
              try {
                const loginResponse = await fetch('/api/auth/facebook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    accessToken: response.authResponse.accessToken,
                    userID: response.authResponse.userID,
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                  }),
                });
                
                if (loginResponse.ok) {
                  console.log('Auto-logged in with Facebook');
                  window.location.href = '/';
                }
              } catch (error) {
                console.error('Auto-login failed:', error);
              }
            });
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      } else {
        // User is not logged into Facebook or hasn't authorized the app
        // Show them the login page (which is already the default behavior)
      }
    });
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
