/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  clearStoredSession,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  loginWithPassword,
  loginWithGoogleCredential,
  signupWithPassword,
  persistSession,
} from "../services/api";

const AuthContext = createContext(null);

// Session timeout in milliseconds (15 minutes)
const SESSION_TIMEOUT = 15 * 60 * 1000;
const LAST_ACTIVITY_KEY = "delayshield_last_activity";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);
  const activityListenerRef = useRef(null);

  // Initialize session check and inactivity tracking
  useEffect(() => {
    const bootstrap = async () => {
      const existingToken = getStoredToken();

      if (!existingToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        setUser(response.user);
        setToken(existingToken);
        persistSession({ token: existingToken, user: response.user });
        updateLastActivity();
      } catch {
        clearStoredSession();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Update last activity timestamp
  const updateLastActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  // Check session validity
  const checkSessionValidity = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!lastActivity) return false;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      performLogout();
      return false;
    }
    return true;
  };

  // Perform logout
  const performLogout = () => {
    clearStoredSession();
    setUser(null);
    setToken(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    // Prevent back navigation
    window.history.pushState(null, "", "/login");
    window.addEventListener("popstate", () => {
      window.history.pushState(null, "", "/login");
    });
  };

  // Setup inactivity timer
  const setupInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setInterval(() => {
      if (!checkSessionValidity()) {
        clearInterval(inactivityTimerRef.current);
      }
    }, 60000); // Check every minute
  };

  // Setup activity listeners
  const setupActivityListeners = () => {
    const handleUserActivity = () => {
      updateLastActivity();
      if (!inactivityTimerRef.current) {
        setupInactivityTimer();
      }
    };

    const events = ["click", "keypress", "scroll", "mousemove", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    activityListenerRef.current = handleUserActivity;
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  };

  // Handle session cleared event
  useEffect(() => {
    const handleSessionCleared = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    };

    window.addEventListener(
      "delayshield:session-cleared",
      handleSessionCleared,
    );
    return () =>
      window.removeEventListener(
        "delayshield:session-cleared",
        handleSessionCleared,
      );
  }, []);

  // Setup inactivity detection when user is authenticated
  useEffect(() => {
    if (token && user) {
      setupInactivityTimer();
      const cleanup = setupActivityListeners();

      return () => {
        if (inactivityTimerRef.current) {
          clearInterval(inactivityTimerRef.current);
        }
        cleanup();
      };
    }
  }, [token, user]);

  const signInWithGoogle = async (credential) => {
    const response = await loginWithGoogleCredential(credential);
    persistSession(response);
    setUser(response.user);
    setToken(response.token);
    updateLastActivity();
    return response;
  };

  const signInWithEmail = async (payload) => {
    const response = await loginWithPassword(payload);
    persistSession(response);
    setUser(response.user);
    setToken(response.token);
    updateLastActivity();
    return response;
  };

  const signUpWithEmail = async (payload) => {
    const response = await signupWithPassword(payload);
    persistSession(response);
    setUser(response.user);
    setToken(response.token);
    updateLastActivity();
    return response;
  };

  const logout = () => {
    performLogout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
