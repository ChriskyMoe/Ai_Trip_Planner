"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Function to check if email already exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/check-user-exists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check email");
      }

      return data.exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        // First, check if email already exists
        setEmailError(null);
        const emailExists = await checkEmailExists(email.trim().toLowerCase());

        if (emailExists) {
          setEmailError(
            "This email is already registered. Please sign in instead."
          );
          setLoading(false);
          return;
        }

        // If email doesn't exist, proceed with signup
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          // Check for specific duplicate email error messages from Supabase
          const errorMessage = error.message.toLowerCase();

          // Check for duplicate-related errors
          if (
            errorMessage.includes("already registered") ||
            errorMessage.includes("user already registered") ||
            errorMessage.includes("already exists") ||
            errorMessage.includes("duplicate") ||
            errorMessage.includes("email already") ||
            errorMessage.includes("user with this email") ||
            errorMessage.includes("email address is already") ||
            errorMessage.includes("user already")
          ) {
            setEmailError(
              "This email is already registered. Please sign in instead."
            );
            throw new Error(
              "An account with this email already exists. Please sign in instead."
            );
          }

          // For other errors, throw them as-is
          throw error;
        }

        // Additional check: if signup returns user but user already exists
        // This can happen with unconfirmed accounts
        if (data.user) {
          // Check again if email exists (in case it was created between check and signup)
          const stillExists = await checkEmailExists(
            email.trim().toLowerCase()
          );
          if (stillExists && data.user.email_confirmed_at === null) {
            // User exists but is unconfirmed - this is okay, they'll get confirmation email
            // But if they're trying to sign up again, we should warn them
          }
          setSuccess(
            "Account created successfully! Please check your email to confirm your account before signing in."
          );
          // Clear form
          setEmail("");
          setPassword("");
          setFullName("");
          // Switch to sign in mode after 3 seconds
          setTimeout(() => {
            setMode("signin");
            setSuccess(null);
          }, 5000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            throw new Error(
              "Please check your email and confirm your account before signing in."
            );
          }
          throw error;
        }
        if (data.user) {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex items-center justify-center px-4">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-gray-100 relative z-10">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors group mb-4"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200">
              ✈️ Smart Trip Planner
            </span>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-gray-600 text-sm">
            {mode === "signup"
              ? "Join us to plan your perfect trip"
              : "Sign in to continue your journey"}
          </p>
        </div>

        <div className="flex justify-center mb-6 space-x-2 bg-gray-100 p-1 rounded-full">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setSuccess(null);
              setEmailError(null);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === "signin"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setSuccess(null);
              setEmailError(null);
              setEmail("");
              setPassword("");
              setFullName("");
            }}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              mode === "signup"
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                emailError ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="you@example.com"
              required
            />
            {emailError && (
              <p className="text-sm text-red-600 mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <p className="text-sm text-green-600 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {success}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Please wait...
              </span>
            ) : mode === "signup" ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
