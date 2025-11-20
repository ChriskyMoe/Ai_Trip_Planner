/**
 * OpenRouter AI Integration
 * Get your API key from: https://openrouter.ai/keys
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ItineraryRequest {
  destination: string;
  budget: number;
  currency: string;
  checkin: string;
  checkout: string;
  adults: number;
  preferences?: string;
  hotels: Array<{
    id: string;
    name: string;
    price: number;
    address?: string;
    rating?: number;
  }>;
  places: Array<{
    name: string;
    type: string;
    address?: string;
    rating?: number;
  }>;
}

export async function generateItinerary(
  request: ItineraryRequest
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const days = Math.ceil(
    (new Date(request.checkout).getTime() -
      new Date(request.checkin).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const prompt = `You are an expert travel planner. Create a detailed, localized ${days}-day itinerary for ${
    request.destination
  }.

Budget: ${request.currency} ${request.budget} for ${request.adults} person(s)
Dates: ${request.checkin} to ${request.checkout}

Available Hotels (choose 3-5 that fit the budget):
${request.hotels
  .map(
    (h, i) =>
      `${i + 1}. ${h.name} - ${request.currency} ${h.price}/night${
        h.rating ? ` (Rating: ${h.rating})` : ""
      }${h.address ? ` - ${h.address}` : ""}`
  )
  .join("\n")}

Local Places to Visit:
${request.places
  .map(
    (p, i) =>
      `${i + 1}. ${p.name} (${p.type})${
        p.rating ? ` - Rating: ${p.rating}` : ""
      }${p.address ? ` - ${p.address}` : ""}`
  )
  .join("\n")}

${request.preferences ? `Traveler Preferences: ${request.preferences}` : ""}

Create a detailed day-by-day itinerary that:
1. Is culturally authentic and localized (suggest local experiences, foods, customs)
2. Includes 3-5 hotel recommendations that fit the budget
3. Organizes activities by day with realistic timing
4. Includes local restaurants, markets, and cultural sites
5. Suggests transportation between locations
6. Includes budget breakdown per day
7. Provides local tips and cultural insights

Format the response as a structured JSON with this format:
{
  "summary": "Brief overview of the trip",
  "hotels": [
    {
      "id": "hotel_id_from_list",
      "name": "Hotel Name",
      "reason": "Why this hotel fits the budget and traveler"
    }
  ],
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day 1 Title",
      "budget": 0,
      "activities": [
        {
          "time": "09:00",
          "activity": "Activity name",
          "place": "Place name from list",
          "type": "attraction/restaurant/cultural",
          "duration": "2 hours",
          "cost": 0,
          "localTip": "Local insight or tip"
        }
      ],
      "meals": [
        {
          "time": "12:00",
          "type": "lunch",
          "name": "Restaurant name",
          "cuisine": "Local cuisine type",
          "cost": 0
        }
      ],
      "transportation": "How to get around",
      "totalCost": 0
    }
  ],
  "totalBudget": 0,
  "budgetBreakdown": {
    "accommodation": 0,
    "activities": 0,
    "meals": 0,
    "transportation": 0
  },
  "localInsights": [
    "Cultural tip 1",
    "Local custom 2",
    "Must-try experience 3"
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Smart Trip Planner",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet", // or 'openai/gpt-4', 'google/gemini-pro', etc.
        messages: [
          {
            role: "system",
            content:
              "You are an expert travel planner specializing in creating authentic, localized, and budget-conscious itineraries. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter API error:", error);
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // Try to extract JSON from the response (in case it's wrapped in markdown)
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```json")) {
      jsonContent = jsonContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    } else if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/```\n?/g, "");
    }

    return jsonContent;
  } catch (error: any) {
    console.error("Error generating itinerary:", error);
    throw new Error(`Failed to generate itinerary: ${error.message}`);
  }
}
