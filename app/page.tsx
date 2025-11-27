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

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200">
                ✈️ Your All-in-One Travel Solution
              </span>
            </div>
            <h1 className="text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Smart Trip Planner
            </h1>
            <p className="text-3xl font-semibold text-gray-700 mb-6">
              Plan your perfect trip with AI-powered itineraries
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Book flights, find hotels, and create personalized itineraries all
              in one place. Experience seamless travel planning powered by
              artificial intelligence.
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* AI Itinerary Planner Card */}
            <div
              onClick={() => router.push("/itinerary")}
              className="group relative bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-purple-300 transform hover:-translate-y-3 overflow-hidden"
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                    <svg
                      className="w-14 h-14 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">
                  AI Itinerary Planner
                </h2>
                <p className="text-lg font-medium text-gray-700 mb-4">
                  Get personalized trip plans powered by AI
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Enter your budget and destination, and our AI will create a
                  complete itinerary with hotels, activities, and local
                  insights.
                </p>
                <div className="mt-6 flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>Get Started</span>
                  <svg
                    className="w-5 h-5 ml-2"
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
                </div>
              </div>
            </div>

            {/* Flight Booking Card */}
            <div
              onClick={() => router.push("/flights")}
              className="group relative bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-blue-300 transform hover:-translate-y-3 overflow-hidden"
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                    <svg
                      className="w-14 h-14 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  Flight Booking
                </h2>
                <p className="text-lg font-medium text-gray-700 mb-4">
                  Search and book flights
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Search for flights by origin and destination, compare prices,
                  and book your next trip with ease.
                </p>
                <div className="mt-6 flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>Book Now</span>
                  <svg
                    className="w-5 h-5 ml-2"
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
                </div>
              </div>
            </div>

            {/* Hotel Search Card */}
            <div
              onClick={() => router.push("/hotels/search")}
              className="group relative bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-emerald-300 transform hover:-translate-y-3 overflow-hidden"
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                    <svg
                      className="w-14 h-14 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
                  Hotel Search
                </h2>
                <p className="text-lg font-medium text-gray-700 mb-4">
                  Find and book hotels
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Search by destination or vibe, browse hotels, and book your
                  perfect stay with the best prices.
                </p>
                <div className="mt-6 flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  <span>Explore</span>
                  <svg
                    className="w-5 h-5 ml-2"
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
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-24 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Everything you need for your perfect trip
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  AI-Powered
                </h3>
                <p className="text-gray-600">
                  Smart recommendations tailored to your preferences
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Best Prices
                </h3>
                <p className="text-gray-600">
                  Compare and find the best deals on flights and hotels
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Secure Booking
                </h3>
                <p className="text-gray-600">
                  Safe and secure payment processing for all bookings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
