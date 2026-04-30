/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
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

// Session timeout in milliseconds (4 hours)
const SESSION_TIMEOUT = 4 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "delayshield_last_activity";
const SESSION_EXPIRES_KEY = "delayshield_session_expires_at";

const getSessionExpiry = () => {
  const value = localStorage.getItem(SESSION_EXPIRES_KEY);
  const expiry = Number(value);

  return Number.isFinite(expiry) ? expiry : null;
};

const setSessionWindow = () => {
  const now = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  localStorage.setItem(SESSION_EXPIRES_KEY, String(now + SESSION_TIMEOUT));
};

const isSessionExpired = () => {
  const expiry = getSessionExpiry();
  return expiry !== null && Date.now() >= expiry;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // Initialize session check and inactivity tracking
  useEffect(() => {
    const bootstrap = async () => {
      const existingToken = getStoredToken();

      if (!existingToken) {
        setLoading(false);
        return;
      }

      if (isSessionExpired()) {
        clearStoredSession();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(SESSION_EXPIRES_KEY);
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        setUser(response.user);
        setToken(existingToken);
        persistSession({ token: existingToken, user: response.user });
        setSessionWindow();
      } catch {
        clearStoredSession();
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        localStorage.removeItem(SESSION_EXPIRES_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Update last activity timestamp
  const updateLastActivity = useCallback(() => {
    setSessionWindow();
  }, []);

  // Perform logout
  const performLogout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setToken(null);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(SESSION_EXPIRES_KEY);

    // Prevent back navigation
    window.history.pushState(null, "", "/login");
    window.addEventListener("popstate", () => {
      window.history.pushState(null, "", "/login");
    });
  }, []);

  // Check session validity
  const checkSessionValidity = useCallback(() => {
    if (isSessionExpired()) {
      performLogout();
      return false;
    }
    return true;
  }, [performLogout]);

  // Setup inactivity timer
  const setupInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setInterval(() => {
      if (!checkSessionValidity()) {
        clearInterval(inactivityTimerRef.current);
      }
    }, 60000); // Check every minute
  }, [checkSessionValidity]);

  // Setup activity listeners
  const setupActivityListeners = useCallback(() => {
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
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [setupInactivityTimer, updateLastActivity]);

  // Handle session cleared event
  useEffect(() => {
    const handleSessionCleared = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(SESSION_EXPIRES_KEY);
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
  }, [token, user, setupActivityListeners, setupInactivityTimer]);

  const signInWithGoogle = async (credential) => {
    const response = await loginWithGoogleCredential(credential);
    persistSession(response);
    setUser(response.user);
    setToken(response.token);
    setSessionWindow();
    return response;
  };

  const signInWithEmail = async (payload) => {
    const response = await loginWithPassword(payload);
    persistSession(response);
    setUser(response.user);
    setToken(response.token);
    setSessionWindow();
    return response;
  };

  const signUpWithEmail = async (payload) => {
    const response = await signupWithPassword(payload);
    persistSession(response);
    setUser(response.user);
    setToken(response.token);
    setSessionWindow();
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
