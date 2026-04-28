/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ShieldCheck, Route, Truck, UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_GIS_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleIdentityScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve("already-loaded");
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_GIS_SRC}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve("loaded"));
      existing.addEventListener("error", () =>
        reject(
          new Error(
            "Google Identity Services script was blocked or failed to load.",
          ),
        ),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve("loaded");
    script.onerror = () =>
      reject(
        new Error(
          "Google Identity Services script was blocked or failed to load.",
        ),
      );
    document.head.appendChild(script);
  });
}

const emptyManualForm = {
  name: "",
  email: "",
  password: "",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
  } = useAuth();
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState("signin");
  const [form, setForm] = useState(emptyManualForm);
  const [submitting, setSubmitting] = useState(false);

  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!GOOGLE_CLIENT_ID) {
      setBooting(false);
      return;
    }

    const initGoogle = async () => {
      try {
        await loadGoogleIdentityScript();
      } catch (scriptError) {
        if (!cancelled) {
          setError(scriptError.message);
          setBooting(false);
        }
        return;
      }

      if (cancelled) return;

      if (!window.google?.accounts?.id) {
        setError(
          "Google Identity Services loaded, but the sign-in API was not available in the browser.",
        );
        setBooting(false);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            setError("");
            await signInWithGoogle(response.credential);
            const nextPath = location.state?.from || "/dashboard";
            navigate(nextPath, { replace: true });
          } catch (loginError) {
            setError(
              loginError?.response?.data?.message || "Google sign-in failed.",
            );
          }
        },
      });

      setGoogleReady(true);
      setBooting(false);
    };

    initGoogle();

    return () => {
      cancelled = true;
    };
  }, [location.state?.from, navigate, signInWithGoogle]);

  useEffect(() => {
    if (
      !googleReady ||
      !googleButtonRef.current ||
      !window.google?.accounts?.id
    )
      return;

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: tab === "signup" ? "signup_with" : "signin_with",
      width: 360,
    });
  }, [googleReady, tab]);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (tab === "signup") {
        await signUpWithEmail(form);
      } else {
        await signInWithEmail({
          email: form.email,
          password: form.password,
        });
      }

      const nextPath = location.state?.from || "/dashboard";
      navigate(nextPath, { replace: true });
    } catch (authError) {
      setError(authError?.response?.data?.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_35%),linear-gradient(135deg,_#eff6ff_0%,_#dbeafe_40%,_#e0f2fe_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <section className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-sky-700 shadow-sm backdrop-blur">
            <ShieldCheck size={14} />
            DelayShield Admin Access
          </div>

          <h1 className="mt-6 max-w-xl font-black tracking-tight text-slate-950 text-5xl leading-none">
            Secure logistics control for AI-driven shipment ops.
          </h1>

          <p className="mt-5 max-w-lg text-base font-medium leading-7 text-slate-600">
            Sign in with Google, or use the manual admin fallback when GIS is
            blocked.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Truck,
                title: "Owned Shipments",
                copy: "Every shipment is tied to the authenticated admin account.",
              },
              {
                icon: Route,
                title: "Protected Routing",
                copy: "AI route analysis only runs inside a verified backend session.",
              },
              {
                icon: ShieldCheck,
                title: "Backend Verified",
                copy: "JWT sessions are always issued by the backend, never by the browser.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg shadow-sky-100 backdrop-blur"
              >
                <item.icon className="text-sky-600" size={22} />
                <h2 className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-800">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-sky-200 backdrop-blur-xl">
          <div className="flex rounded-2xl bg-sky-50 p-1">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black transition ${tab === "signin" ? "bg-white text-sky-700 shadow" : "text-slate-500"}`}
            >
              <span className="inline-flex items-center gap-2">
                <KeyRound size={16} />
                Sign In
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black transition ${tab === "signup" ? "bg-white text-sky-700 shadow" : "text-slate-500"}`}
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus size={16} />
                Sign Up
              </span>
            </button>
          </div>

          <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-sky-600">
            Admin Access
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {tab === "signup"
              ? "Create fallback credentials"
              : "Open the operations console"}
          </h2>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
            {tab === "signup"
              ? "Create a manual admin login with an allowlisted email."
              : "Use Google or your manual admin credentials."}
          </p>

          {GOOGLE_CLIENT_ID ? (
            <div className="mt-8">
              <div
                ref={googleButtonRef}
                className="flex min-h-[56px] items-center justify-center overflow-hidden rounded-2xl bg-white"
              >
                {booting ? "Loading Google..." : null}
              </div>
            </div>
          ) : null}

          <div className="my-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            Or continue manually
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            {tab === "signup" ? (
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  Name
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Email
              </span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                Password
              </span>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-500"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? "Submitting..."
                : tab === "signup"
                  ? "Create Admin Account"
                  : "Sign In Manually"}
            </button>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-slate-950 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
            Backend issues its own JWT after Google or manual credential
            verification.
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
