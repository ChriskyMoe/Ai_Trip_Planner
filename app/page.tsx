"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Navigation Header */}
      <nav className="relative z-20 w-full px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-end items-center space-x-4">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => router.push("/bookings")}
                className="px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm text-gray-700 font-medium hover:bg-white transition-colors shadow-sm border border-gray-200"
              >
                My Bookings
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="px-4 py-2 rounded-lg bg-white/80 backdrop-blur-sm text-gray-700 font-medium hover:bg-white transition-colors shadow-sm border border-gray-200"
              >
                My Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push("/auth")}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6 animate-fade-in">
              <span className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
                ✨ AI-Powered Travel Planning
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight animate-fade-in-up">
              Smart Trip Planner
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
              Your Perfect Journey, Planned by AI
            </p>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create personalized itineraries with hotels, flights, activities, and local insights—all tailored to your budget and preferences.
            </p>
          </div>

          {/* Main CTA Card - Centered and Prominent */}
          <div className="max-w-2xl mx-auto mb-16">
            <div
              onClick={() => router.push("/itinerary")}
              className="group relative bg-white rounded-3xl shadow-2xl p-10 md:p-12 cursor-pointer hover:shadow-3xl transition-all duration-500 border-2 border-purple-100 hover:border-purple-300 transform hover:-translate-y-2 overflow-hidden"
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>

              <div className="relative flex flex-col items-center text-center">
                {/* Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                    <svg
                      className="w-16 h-16 md:w-20 md:h-20 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">
                  Start Planning Your Trip
                </h2>
                <p className="text-lg md:text-xl font-medium text-gray-700 mb-6">
                  Get a complete AI-generated itinerary in seconds
                </p>
                <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-lg">
                  Simply enter your destination, budget, and travel dates. Our AI will create a personalized itinerary with recommended hotels, flights, activities, meals, and local insights—all perfectly tailored to your preferences.
                </p>

                {/* CTA Button */}
                <button className="group/btn relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden">
                  <span className="relative z-10 flex items-center text-lg">
                    Create My Itinerary
                    <svg
                      className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>

          {/* Features Section - Redesigned */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Why Choose Our AI Trip Planner?
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Everything you need for a perfectly planned trip, powered by artificial intelligence
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  AI-Powered Planning
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Advanced AI creates personalized itineraries based on your budget, preferences, and travel style
                </p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Complete Itineraries
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Get detailed day-by-day plans with hotels, flights, activities, meals, and local tips
                </p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Save Time
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  No more hours of research—get a complete travel plan in minutes, not days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
