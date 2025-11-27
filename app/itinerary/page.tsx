"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { supabase } from "@/lib/supabaseClient";

interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  budget: number;
  activities: Array<{
    time: string;
    activity: string;
    place?: string;
    type?: string;
    duration?: string;
    cost?: number;
    localTip?: string;
  }>;
  meals: Array<{
    time: string;
    type: string;
    name: string;
    cuisine?: string;
    cost?: number;
  }>;
  transportation?: string;
  totalCost: number;
}

interface Itinerary {
  summary: string;
  hotels: Array<{
    id: string;
    name: string;
    reason: string;
    price?: number;
    address?: string;
    rating?: number;
    main_photo?: string;
    offerId?: string;
  }>;
  itinerary: ItineraryDay[];
  totalBudget: number;
  budgetBreakdown: {
    accommodation: number;
    activities: number;
    meals: number;
    transportation: number;
  };
  localInsights: string[];
}

interface FlightOffer {
  id: string;
  price: {
    currency: string;
    total: string;
    grandTotal?: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      duration: string;
      numberOfStops: number;
    }>;
  }>;
  numberOfBookableSeats: number;
}

interface AirportSuggestion {
  iataCode: string;
  name?:
    | {
        text: string;
      }
    | string;
  detailedName?: string;
  address?: {
    cityName?: string;
    countryName?: string;
  };
}

export default function ItineraryPlanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = searchParams?.get("historyId");
  const checkingAuth = useRequireAuth();
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [flights, setFlights] = useState<FlightOffer[]>([]);
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState("");
  const autoSaveInFlight = useRef(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    destination: "",
    fromCity: "",
    budget: "",
    currency: "USD",
    checkin: "",
    checkout: "",
    adults: "2",
    preferences: "",
    originAirport: "",
    destinationAirport: "",
  });
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );
  const [fromCitySuggestions, setFromCitySuggestions] = useState<any[]>([]);
  const [originAirportSuggestions, setOriginAirportSuggestions] = useState<
    AirportSuggestion[]
  >([]);
  const [destinationAirportSuggestions, setDestinationAirportSuggestions] =
    useState<AirportSuggestion[]>([]);
  const [airportInputs, setAirportInputs] = useState({
    origin: "",
    destination: "",
  });
  const [selectedAirportLabels, setSelectedAirportLabels] = useState({
    origin: "",
    destination: "",
  });
  const [placeId, setPlaceId] = useState("");
  const [placeName, setPlaceName] = useState("");
  const destinationInputRef = useRef<HTMLDivElement>(null);
  const fromCityInputRef = useRef<HTMLDivElement>(null);
  const originAirportInputRef = useRef<HTMLDivElement>(null);
  const destinationAirportInputRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (checkingAuth) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        destinationInputRef.current &&
        !destinationInputRef.current.contains(event.target as Node)
      ) {
        setDestinationSuggestions([]);
      }
      if (
        fromCityInputRef.current &&
        !fromCityInputRef.current.contains(event.target as Node)
      ) {
        setFromCitySuggestions([]);
      }
      if (
        originAirportInputRef.current &&
        !originAirportInputRef.current.contains(event.target as Node)
      ) {
        setOriginAirportSuggestions([]);
      }
      if (
        destinationAirportInputRef.current &&
        !destinationAirportInputRef.current.contains(event.target as Node)
      ) {
        setDestinationAirportSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [checkingAuth]);

  useEffect(() => {
    if (step !== "result") {
      autoSaveInFlight.current = false;
    }
  }, [step]);

  // Restore itinerary state when returning from checkout
  useEffect(() => {
    if (checkingAuth || step !== "input") return;

    const savedState = sessionStorage.getItem("itineraryState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setItinerary(state.itinerary);
        setHotels(state.hotels || []);
        setFlights(state.flights || []);
        setFormData(state.formData);
        setSavedItineraryId(state.savedItineraryId);
        setSaveStatus(state.saveStatus || "saved");
        setStep("result");
        // Clear the saved state after restoring
        sessionStorage.removeItem("itineraryState");
      } catch (err) {
        console.error("Failed to restore itinerary state:", err);
        sessionStorage.removeItem("itineraryState");
      }
    }
  }, [checkingAuth, step]);

  useEffect(() => {
    const historyId = searchParams?.get("historyId");
    if (!historyId || checkingAuth) return;

    const loadFromHistory = async () => {
      setLoadingHistory(true);
      setError("");
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          throw new Error("You must be signed in to load a saved itinerary.");
        }

        const { data, error } = await supabase
          .from("itineraries")
          .select(
            "id,destination,from_city,checkin,checkout,currency,budget,adults,preferences,form_data,itinerary,hotels,flights"
          )
          .eq("id", historyId)
          .eq("user_id", session.user.id)
          .single();

        if (error) {
          throw error;
        }

        if (!data?.itinerary) {
          throw new Error("Saved itinerary data is incomplete.");
        }

        const savedFormData = (data.form_data as typeof formData) || formData;

        setFormData((prev) => ({
          ...prev,
          destination: savedFormData.destination || data.destination || "",
          fromCity: savedFormData.fromCity || data.from_city || "",
          budget:
            savedFormData.budget ||
            (data.budget ? String(data.budget) : "") ||
            "",
          currency: savedFormData.currency || data.currency || "USD",
          checkin: savedFormData.checkin || data.checkin || "",
          checkout: savedFormData.checkout || data.checkout || "",
          adults:
            savedFormData.adults ||
            (data.adults ? String(data.adults) : "1") ||
            "1",
          preferences: savedFormData.preferences || data.preferences || "",
          originAirport: savedFormData.originAirport || "",
          destinationAirport: savedFormData.destinationAirport || "",
        }));

        setItinerary(data.itinerary as Itinerary);
        setHotels((data.hotels as Itinerary["hotels"]) || []);
        setFlights((data.flights as FlightOffer[]) || []);
        setSavedItineraryId(data.id);
        setSaveStatus("saved");
        setSaveError("");
        setStep("result");
        router.replace("/itinerary", { scroll: false });
      } catch (err: any) {
        console.error("Failed to load saved itinerary:", err);
        setError(err.message || "Unable to load the saved itinerary.");
      } finally {
        setLoadingHistory(false);
      }
    };

    loadFromHistory();
  }, [historyId, checkingAuth, router]);

  useEffect(() => {
    const autoSaveItinerary = async () => {
      if (
        step !== "result" ||
        !itinerary ||
        saveStatus === "saved" ||
        saveStatus === "error" ||
        autoSaveInFlight.current
      ) {
        return;
      }

      autoSaveInFlight.current = true;
      setSaveStatus("saving");
      setSaveError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          throw new Error("You must be signed in to save itineraries.");
        }

        const historyPayload = {
          user_id: session.user.id,
          destination: formData.destination,
          from_city: formData.fromCity || null,
          checkin: formData.checkin || null,
          checkout: formData.checkout || null,
          currency: formData.currency,
          budget: formData.budget ? parseFloat(formData.budget) : null,
          adults: formData.adults ? parseInt(formData.adults, 10) : null,
          preferences: formData.preferences || null,
          itinerary,
          hotels,
          flights,
          form_data: formData,
        };

        const { data, error } = await supabase
          .from("itineraries")
          .insert(historyPayload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        setSavedItineraryId(data?.id ?? null);
        setSaveStatus("saved");
      } catch (error: any) {
        console.error("Failed to save itinerary history:", error);
        setSaveStatus("error");
        setSaveError(
          error.message || "Unable to save this itinerary right now."
        );
      } finally {
        autoSaveInFlight.current = false;
      }
    };

    autoSaveItinerary();
  }, [step, itinerary, hotels, flights, formData, saveStatus]);

  const handleDestinationSearch = async (query: string) => {
    setFormData((prev) => ({
      ...prev,
      destination: query,
      destinationAirport: "",
    }));
    setAirportInputs((prev) => ({ ...prev, destination: "" }));
    setSelectedAirportLabels((prev) => ({ ...prev, destination: "" }));

    if (query.length < 2) {
      setDestinationSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/places?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setDestinationSuggestions(data.data || []);
    } catch (error) {
      console.error("Error searching places:", error);
    }
  };

  const handleDestinationSelect = (place: any) => {
    setPlaceId(place.placeId);
    setPlaceName(place.displayName);
    setFormData((prev) => ({
      ...prev,
      destination: place.displayName,
      destinationAirport: "",
    }));
    setAirportInputs((prev) => ({ ...prev, destination: "" }));
    setSelectedAirportLabels((prev) => ({ ...prev, destination: "" }));
    setDestinationSuggestions([]);
    prefillDestinationAirports(place.displayName);
  };

  const handleFromCitySearch = async (query: string) => {
    setFormData((prev) => ({
      ...prev,
      fromCity: query,
      originAirport: "",
    }));
    setAirportInputs((prev) => ({ ...prev, origin: "" }));
    setSelectedAirportLabels((prev) => ({ ...prev, origin: "" }));

    if (query.length < 2) {
      setFromCitySuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/places?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setFromCitySuggestions(data.data || []);
    } catch (error) {
      console.error("Error searching departure cities:", error);
    }
  };

  const handleFromCitySelect = (place: any) => {
    setFormData((prev) => ({
      ...prev,
      fromCity: place.displayName,
      originAirport: "",
    }));
    setAirportInputs((prev) => ({ ...prev, origin: "" }));
    setSelectedAirportLabels((prev) => ({ ...prev, origin: "" }));
    setFromCitySuggestions([]);
    prefillOriginAirports(place.displayName);
  };

  const handleAirportSearch = async (
    query: string,
    type: "origin" | "destination"
  ) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      if (type === "origin") {
        setOriginAirportSuggestions([]);
      } else {
        setDestinationAirportSuggestions([]);
      }
      return;
    }

    try {
      const response = await fetch(
        `/api/flights/airports?q=${encodeURIComponent(trimmedQuery)}`
      );
      const data = await response.json();

      if (type === "origin") {
        setOriginAirportSuggestions(data.data || []);
      } else {
        setDestinationAirportSuggestions(data.data || []);
      }
    } catch (error) {
      console.error("Error searching airports:", error);
    }
  };

  const getAirportDisplayName = (airport: AirportSuggestion) => {
    const primaryName =
      airport.detailedName ||
      (typeof airport.name === "string" ? airport.name : airport.name?.text) ||
      "Airport";
    const location = [airport.address?.cityName, airport.address?.countryName]
      .filter(Boolean)
      .join(", ");
    return location
      ? `${primaryName} (${airport.iataCode}) • ${location}`
      : `${primaryName} (${airport.iataCode})`;
  };

  const handleAirportInputChange = (
    value: string,
    type: "origin" | "destination"
  ) => {
    const codeKey = type === "origin" ? "originAirport" : "destinationAirport";
    setAirportInputs((prev) => ({ ...prev, [type]: value }));
    setSelectedAirportLabels((prev) => ({ ...prev, [type]: "" }));
    setFormData((prev) => ({
      ...prev,
      [codeKey]: "",
    }));
    handleAirportSearch(value, type);
  };

  const handleAirportInputBlur = (type: "origin" | "destination") => {
    const codeKey = type === "origin" ? "originAirport" : "destinationAirport";
    const value = airportInputs[type].trim();
    if (/^[A-Za-z]{3}$/i.test(value)) {
      const code = value.toUpperCase();
      setAirportInputs((prev) => ({ ...prev, [type]: code }));
      setFormData((prev) => ({
        ...prev,
        [codeKey]: code,
      }));
      setSelectedAirportLabels((prev) => ({ ...prev, [type]: "" }));
    }
  };

  const handleAirportSelect = (
    airport: AirportSuggestion,
    type: "origin" | "destination"
  ) => {
    const code = airport.iataCode?.toUpperCase();
    if (!code) return;

    const codeKey = type === "origin" ? "originAirport" : "destinationAirport";
    const label = getAirportDisplayName(airport);

    setAirportInputs((prev) => ({ ...prev, [type]: code }));
    setFormData((prev) => ({
      ...prev,
      [codeKey]: code,
    }));
    setSelectedAirportLabels((prev) => ({ ...prev, [type]: label }));

    if (type === "origin") {
      setOriginAirportSuggestions([]);
    } else {
      setDestinationAirportSuggestions([]);
    }
  };

  const prefillDestinationAirports = (cityName: string) => {
    const trimmed = cityName.trim();
    if (trimmed.length < 2) return;
    handleAirportSearch(trimmed, "destination");
  };

  const prefillOriginAirports = (cityName: string) => {
    const trimmed = cityName.trim();
    if (trimmed.length < 2) return;
    handleAirportSearch(trimmed, "origin");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("loading");
    setSavedItineraryId(null);
    setSaveStatus("idle");
    setSaveError("");

    if (!formData.fromCity.trim()) {
      setError("Please enter your departure city.");
      setStep("input");
      return;
    }

    const airportCodeRegex = /^[A-Z]{3}$/;
    let normalizedOriginAirport = (formData.originAirport || "")
      .trim()
      .toUpperCase();
    let normalizedDestinationAirport = (formData.destinationAirport || "")
      .trim()
      .toUpperCase();
    const originInputValue = airportInputs.origin.trim();
    const destinationInputValue = airportInputs.destination.trim();

    if (!normalizedOriginAirport && /^[A-Za-z]{3}$/i.test(originInputValue)) {
      normalizedOriginAirport = originInputValue.toUpperCase();
    }

    if (
      !normalizedDestinationAirport &&
      /^[A-Za-z]{3}$/i.test(destinationInputValue)
    ) {
      normalizedDestinationAirport = destinationInputValue.toUpperCase();
    }

    if (
      (normalizedOriginAirport &&
        !airportCodeRegex.test(normalizedOriginAirport)) ||
      (normalizedDestinationAirport &&
        !airportCodeRegex.test(normalizedDestinationAirport))
    ) {
      setError(
        "Airport codes must be valid 3-letter IATA codes (e.g., JFK, LHR)."
      );
      setStep("input");
      return;
    }

    if (
      (normalizedOriginAirport && !normalizedDestinationAirport) ||
      (!normalizedOriginAirport && normalizedDestinationAirport)
    ) {
      setError(
        "Please provide both origin and destination airports to fetch flight suggestions."
      );
      setStep("input");
      return;
    }

    try {
      // Use placeName if available (from autocomplete), otherwise use destination
      const searchDestination = placeName || formData.destination;

      const response = await fetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: searchDestination,
          placeId: placeId || undefined,
          budget: parseFloat(formData.budget),
          currency: formData.currency,
          checkin: formData.checkin,
          checkout: formData.checkout,
          adults: parseInt(formData.adults),
          preferences: formData.preferences || undefined,
          originAirport: normalizedOriginAirport || undefined,
          destinationAirport: normalizedDestinationAirport || undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStep("input");
        return;
      }

      setItinerary(data.itinerary);
      setHotels(data.hotels || []);
      setFlights(data.flights || []);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Failed to generate itinerary");
      setStep("input");
    }
  };

  const handleBookHotel = (hotel: any) => {
    if (!hotel.offerId) {
      alert("Hotel booking not available for this hotel");
      return;
    }

    // Store itinerary state before navigating to checkout
    if (itinerary && step === "result") {
      sessionStorage.setItem("itineraryState", JSON.stringify({
        itinerary,
        hotels,
        flights,
        formData,
        savedItineraryId,
        saveStatus,
      }));
    }

    const params = new URLSearchParams({
      offerId: hotel.offerId,
      checkin: formData.checkin,
      checkout: formData.checkout,
      adults: formData.adults,
      hotelId: hotel.id,
      returnTo: "itinerary",
    });

    router.push(`/checkout?${params.toString()}`);
  };

  const handleSelectFlight = (flight: FlightOffer) => {
    if (typeof window === "undefined") return;

    // Store itinerary state before navigating to flight booking
    if (itinerary && step === "result") {
      sessionStorage.setItem("itineraryState", JSON.stringify({
        itinerary,
        hotels,
        flights,
        formData,
        savedItineraryId,
        saveStatus,
      }));
    }

    const flightData = {
      id: flight.id,
      price: flight.price,
      itineraries: flight.itineraries,
      numberOfBookableSeats: flight.numberOfBookableSeats,
    };

    localStorage.setItem("selectedFlight", JSON.stringify(flightData));
    router.push(`/flights/booking?flightId=${flight.id}&returnTo=itinerary`);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-700">Verifying your session...</div>
      </div>
    );
  }

  if (loadingHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-700">Loading your saved itinerary...</div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-lg opacity-50"></div>
            <div className="relative animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Creating Your Itinerary
          </h2>
          <p className="text-lg text-gray-600">
            Our AI is finding the best hotels and creating a personalized trip
            plan...
          </p>
        </div>
      </div>
    );
  }

  if (step === "result" && itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setStep("input");
                setItinerary(null);
                setFlights([]);
                setSavedItineraryId(null);
                setSaveStatus("idle");
                setSaveError("");
              }}
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Create New Itinerary
            </button>
            <div className="flex items-center gap-4">
              <Link
                href="/bookings"
                className="inline-flex items-center text-sm font-semibold text-purple-500 hover:text-purple-600"
              >
                My Bookings →
              </Link>
              <Link
                href="/history"
                className="inline-flex items-center text-sm font-semibold text-purple-500 hover:text-purple-600"
              >
                View History →
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 border border-white/20">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your {formData.destination} Itinerary
            </h1>
            <p className="text-gray-700 text-lg leading-relaxed">
              {itinerary.summary}
            </p>
            <div className="mt-4">
              {saveStatus === "saving" && (
                <p className="text-sm text-gray-500">
                  Saving this itinerary to your history...
                </p>
              )}
              {saveStatus === "saved" && (
                <p className="text-sm text-emerald-600">
                  Saved to your history.
                </p>
              )}
              {saveStatus === "error" && (
                <p className="text-sm text-red-600">
                  {saveError ||
                    "We couldn't save this itinerary. You can retry by regenerating."}
                </p>
              )}
            </div>
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-300">
              <p className="text-sm opacity-90 mb-2">Total Budget</p>
              <p className="text-3xl font-bold">
                {formData.currency} {itinerary.totalBudget.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-shadow">
              <p className="text-sm text-gray-600 mb-2">Accommodation</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData.currency}{" "}
                {itinerary.budgetBreakdown.accommodation.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-shadow">
              <p className="text-sm text-gray-600 mb-2">Activities</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData.currency}{" "}
                {itinerary.budgetBreakdown.activities.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-shadow">
              <p className="text-sm text-gray-600 mb-2">Meals</p>
              <p className="text-2xl font-bold text-gray-900">
                {formData.currency} {itinerary.budgetBreakdown.meals.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Recommended Hotels */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 border border-white/20">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Recommended Hotels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {itinerary.hotels.map((hotel, idx) => {
                const hotelData = hotels.find(
                  (h) => h.hotelId === hotel.id || h.name === hotel.name
                );
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
                  >
                    {hotelData?.main_photo && (
                      <div className="relative h-32 w-full mb-3 rounded overflow-hidden">
                        <Image
                          src={hotelData.main_photo}
                          alt={hotel.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg mb-2">{hotel.name}</h3>
                    {hotelData?.rating && (
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-sm">{hotelData.rating}</span>
                      </div>
                    )}
                    {hotelData?.price && (
                      <p className="text-primary-600 font-bold mb-2">
                        {formData.currency} {hotelData.price.toFixed(2)}/night
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-3">{hotel.reason}</p>
                    {hotelData?.offerId && (
                      <button
                        onClick={() => handleBookHotel(hotelData)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Flights */}
          {flights.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-6 border border-white/20">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Recommended Flights
              </h2>
              <div className="space-y-4">
                {flights.map((flight) => {
                  const outbound = flight.itineraries[0];
                  const returnFlight = flight.itineraries[1];
                  const totalPrice = parseFloat(
                    flight.price.grandTotal || flight.price.total
                  );
                  const outboundCarrier = outbound.segments[0];
                  const returnCarrier = returnFlight?.segments[0];

                  return (
                    <div
                      key={flight.id}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3">
                            <p className="text-sm text-gray-500">Outbound</p>
                            <p className="text-xl font-semibold text-gray-900">
                              {outbound.segments[0].departure.iataCode} →{" "}
                              {
                                outbound.segments[outbound.segments.length - 1]
                                  .arrival.iataCode
                              }
                            </p>
                            <p className="text-sm text-gray-600">
                              {format(
                                new Date(outbound.segments[0].departure.at),
                                "MMM d, h:mm a"
                              )}{" "}
                              •{" "}
                              {outbound.duration
                                .replace("PT", "")
                                .toLowerCase()}
                            </p>
                            {outboundCarrier && (
                              <p className="text-sm text-gray-500">
                                Flight {outboundCarrier.carrierCode}{" "}
                                {outboundCarrier.number}
                              </p>
                            )}
                          </div>
                          {returnFlight && (
                            <div>
                              <p className="text-sm text-gray-500">Return</p>
                              <p className="text-xl font-semibold text-gray-900">
                                {returnFlight.segments[0].departure.iataCode} →{" "}
                                {
                                  returnFlight.segments[
                                    returnFlight.segments.length - 1
                                  ].arrival.iataCode
                                }
                              </p>
                              <p className="text-sm text-gray-600">
                                {format(
                                  new Date(
                                    returnFlight.segments[0].departure.at
                                  ),
                                  "MMM d, h:mm a"
                                )}{" "}
                                •{" "}
                                {returnFlight.duration
                                  .replace("PT", "")
                                  .toLowerCase()}
                              </p>
                              {returnCarrier && (
                                <p className="text-sm text-gray-500">
                                  Flight {returnCarrier.carrierCode}{" "}
                                  {returnCarrier.number}
                                </p>
                              )}
                            </div>
                          )}
                          {typeof flight.numberOfBookableSeats === "number" &&
                            flight.numberOfBookableSeats > 0 && (
                              <div className="mt-2 text-sm text-gray-500">
                                <span>
                                  {flight.numberOfBookableSeats} seats left
                                </span>
                              </div>
                            )}
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {flight.price.currency} {totalPrice.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            per traveler
                          </p>
                          <button
                            onClick={() => handleSelectFlight(flight)}
                            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            Book Flight
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Itinerary */}
          <div className="space-y-6">
            {itinerary.itinerary.map((day, idx) => (
              <div
                key={idx}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden border border-white/20 mb-6"
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                  <h3 className="text-xl font-bold">{day.title}</h3>
                  <p className="text-sm opacity-90">
                    {format(new Date(day.date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {day.activities.map((activity, actIdx) => (
                      <div
                        key={actIdx}
                        className="border-l-4 border-purple-500 pl-4 bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-r-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-purple-600">
                                {activity.time}
                              </span>
                              <span className="text-gray-600 text-sm">
                                {activity.duration}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              {activity.activity}
                            </h4>
                            {activity.place && (
                              <p className="text-sm text-gray-600">
                                📍 {activity.place}
                              </p>
                            )}
                            {activity.localTip && (
                              <p className="text-sm text-purple-700 mt-2 italic bg-purple-50 p-2 rounded">
                                💡 {activity.localTip}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {day.meals.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Meals
                      </h4>
                      <div className="space-y-2">
                        {day.meals.map((meal, mealIdx) => (
                          <div
                            key={mealIdx}
                            className="flex justify-between items-center"
                          >
                            <div>
                              <span className="font-medium">{meal.time}</span> -{" "}
                              {meal.name}
                              {meal.cuisine && (
                                <span className="text-sm text-gray-600 ml-2">
                                  ({meal.cuisine})
                                </span>
                              )}
                            </div>
                            {meal.cost !== undefined && (
                              <span className="text-gray-700">
                                {formData.currency} {meal.cost.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.transportation && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Transportation:</strong> {day.transportation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Local Insights */}
          {itinerary.localInsights && itinerary.localInsights.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-8 border border-purple-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Local Insights & Tips
              </h2>
              <ul className="space-y-3">
                {itinerary.localInsights.map((insight, idx) => (
                  <li
                    key={idx}
                    className="flex items-start bg-white/60 rounded-lg p-3"
                  >
                    <span className="text-purple-600 mr-3 font-bold">✓</span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </button>
            <Link
              href="/history"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              View History →
            </Link>
          </div>
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                ✨ AI-Powered Planning
              </span>
            </div>
            <h1 className="text-6xl font-extrabold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              AI Trip Planner
            </h1>
            <p className="text-2xl text-gray-700 font-medium">
              Get a personalized itinerary with hotels that fit your budget
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Departure City */}
                <div className="relative" ref={fromCityInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fromCity}
                    onChange={(e) => handleFromCitySearch(e.target.value)}
                    onBlur={() => {
                      if (formData.fromCity.trim().length >= 2) {
                        prefillOriginAirports(formData.fromCity);
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value.length >= 2) {
                        handleFromCitySearch(e.target.value);
                      }
                    }}
                    placeholder="e.g., Bangkok, New York, Singapore"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {fromCitySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {fromCitySuggestions.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFromCitySelect(place)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {place.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {place.formattedAddress}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div className="relative" ref={destinationInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => handleDestinationSearch(e.target.value)}
                    onBlur={() => {
                      if (formData.destination.trim().length >= 2) {
                        prefillDestinationAirports(formData.destination);
                      }
                    }}
                    onFocus={(e) => {
                      if (e.target.value.length >= 2) {
                        handleDestinationSearch(e.target.value);
                      }
                    }}
                    placeholder="e.g., Paris, Tokyo, New York"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((place, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDestinationSelect(place)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {place.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {place.formattedAddress}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative" ref={originAirportInputRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departure Airport (City or IATA)
                    </label>
                    <input
                      type="text"
                      value={airportInputs.origin}
                      onChange={(e) =>
                        handleAirportInputChange(e.target.value, "origin")
                      }
                      onBlur={() => handleAirportInputBlur("origin")}
                      onFocus={(e) => {
                        if (e.target.value.length >= 2) {
                          handleAirportSearch(e.target.value, "origin");
                        }
                      }}
                      placeholder="Enter city or airport name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {originAirportSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {originAirportSuggestions.map((airport, idx) => {
                          const displayName =
                            typeof airport.name === "string"
                              ? airport.name
                              : airport.name?.text;
                          const locationText = [
                            airport.address?.cityName,
                            airport.address?.countryName,
                          ]
                            .filter(Boolean)
                            .join(", ");
                          return (
                            <button
                              key={`${airport.iataCode}-${idx}`}
                              type="button"
                              onClick={() =>
                                handleAirportSelect(airport, "origin")
                              }
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {airport.iataCode} •{" "}
                                {displayName ||
                                  airport.detailedName ||
                                  "Airport"}
                              </div>
                              {locationText && (
                                <div className="text-sm text-gray-500">
                                  {locationText}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selectedAirportLabels.origin && (
                      <p className="mt-2 text-sm text-gray-500">
                        Selected: {selectedAirportLabels.origin}
                      </p>
                    )}
                  </div>
                  <div className="relative" ref={destinationAirportInputRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arrival Airport (City or IATA)
                    </label>
                    <input
                      type="text"
                      value={airportInputs.destination}
                      onChange={(e) =>
                        handleAirportInputChange(e.target.value, "destination")
                      }
                      onBlur={() => handleAirportInputBlur("destination")}
                      onFocus={(e) => {
                        if (e.target.value.length >= 2) {
                          handleAirportSearch(e.target.value, "destination");
                        } else if (formData.destination.trim().length >= 2) {
                          handleAirportSearch(
                            formData.destination,
                            "destination"
                          );
                        }
                      }}
                      placeholder="Enter city or airport name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {destinationAirportSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {destinationAirportSuggestions.map((airport, idx) => {
                          const displayName =
                            typeof airport.name === "string"
                              ? airport.name
                              : airport.name?.text;
                          const locationText = [
                            airport.address?.cityName,
                            airport.address?.countryName,
                          ]
                            .filter(Boolean)
                            .join(", ");
                          return (
                            <button
                              key={`${airport.iataCode}-${idx}`}
                              type="button"
                              onClick={() =>
                                handleAirportSelect(airport, "destination")
                              }
                              className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {airport.iataCode} •{" "}
                                {displayName ||
                                  airport.detailedName ||
                                  "Airport"}
                              </div>
                              {locationText && (
                                <div className="text-sm text-gray-500">
                                  {locationText}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selectedAirportLabels.destination && (
                      <p className="mt-2 text-sm text-gray-500">
                        Selected: {selectedAirportLabels.destination}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Start typing a city or airport and pick from the dropdown to
                  add live Amadeus flight suggestions (optional but
                  recommended).
                </p>

                {/* Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Budget *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
                      }
                      placeholder="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                      <option value="THB">THB (฿)</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={today}
                      value={formData.checkin}
                      onChange={(e) =>
                        setFormData({ ...formData, checkin: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      required
                      min={formData.checkin || tomorrow}
                      value={formData.checkout}
                      onChange={(e) =>
                        setFormData({ ...formData, checkout: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={formData.adults}
                    onChange={(e) =>
                      setFormData({ ...formData, adults: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Travel Preferences (Optional)
                  </label>
                  <textarea
                    value={formData.preferences}
                    onChange={(e) =>
                      setFormData({ ...formData, preferences: e.target.value })
                    }
                    placeholder="e.g., Interested in museums, local food, nightlife, family-friendly activities..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Generate My Itinerary
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
