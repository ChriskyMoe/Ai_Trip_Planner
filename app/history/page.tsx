"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface HistoryEntry {
  id: string;
  destination: string | null;
  from_city: string | null;
  checkin: string | null;
  checkout: string | null;
  currency: string | null;
  created_at: string;
  itinerary: {
    summary?: string;
  } | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const checkingAuth = useRequireAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (checkingAuth) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setError("You need to be signed in to view your history.");
          setEntries([]);
          return;
        }

        const { data, error } = await supabase
          .from("itineraries")
          .select(
            "id,destination,from_city,checkin,checkout,currency,created_at,itinerary"
          )
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setEntries(data || []);
      } catch (err: any) {
        console.error("Failed to fetch itinerary history:", err);
        setError(
          err.message || "We couldn't load your history. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [checkingAuth]);

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-700 font-medium">Loading your history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-semibold uppercase tracking-wide">
                Saved Itineraries
              </p>
              <h1 className="text-4xl font-extrabold text-gray-900">
                Trip History
              </h1>
            </div>
            <Link
              href="/itinerary"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold"
            >
              ← Back to Planner
            </Link>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {entries.length === 0 && !error ? (
            <div className="rounded-3xl border border-dashed border-purple-200 bg-white/70 p-10 text-center">
              <p className="text-lg text-gray-600">
                You haven&apos;t saved any itineraries yet. Generate a trip plan
                to see it appear here automatically.
              </p>
              <Link
                href="/itinerary"
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl"
              >
                Plan a Trip
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-3xl border border-white/40 bg-white/90 backdrop-blur-sm p-6 shadow-lg"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-semibold">
                        {entry.created_at
                          ? format(new Date(entry.created_at), "PPpp")
                          : "Unknown date"}
                      </p>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {entry.destination || "Unnamed Destination"}
                      </h2>
                      <p className="text-gray-600">
                        {entry.from_city
                          ? `From ${entry.from_city}`
                          : "Departure city not specified"}
                      </p>
                      {entry.checkin && entry.checkout && (
                        <p className="text-sm text-gray-500">
                          {format(new Date(entry.checkin), "PP")} –{" "}
                          {format(new Date(entry.checkout), "PP")}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 md:items-end">
                      {entry.itinerary?.summary && (
                        <p className="text-sm text-gray-600 max-w-md md:text-right">
                          {entry.itinerary.summary}
                        </p>
                      )}
                      <button
                        onClick={() =>
                          router.push(`/itinerary?historyId=${entry.id}`)
                        }
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 font-semibold text-white shadow-lg hover:shadow-xl"
                      >
                        Open in Planner
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

